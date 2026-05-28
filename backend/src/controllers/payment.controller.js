import crypto from 'crypto';
import prisma from '../lib/prisma.js';
import razorpay from '../config/razorpay.js';
import { createError } from '../middleware/errorHandler.js';
import { sendMail } from '../lib/mailer.js';
import { emailTemplates } from '../config/email.js';
import { emailService } from '../services/email.service.js';
import asyncHandler from '../utils/asyncHandler.js';
import valkey from '../lib/valkey.js';
import { saveOrderToDB } from '../services/orderService.js';
import { broadcastToAdmins } from '../services/notificationService.js';
import * as ShipingTech from '../services/shiprocket.service.js';

async function autoCreateShipment(orderId) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        address: true,
        items: { include: { product: true } },
      },
    });

    if (!order || order.shipingTechUUID) return;

    const customerName = order.shippingName || order.user?.name || order.guestName || order.address?.fullName || '';
    const customerPhone = order.shippingPhone || order.address?.phone || order.user?.phone || order.guestPhone || '';
    const customerEmail = order.user?.email || order.guestEmail || '';
    const deliveryAddress = order.shippingLine1 || order.address?.line1 || '';
    const deliveryCity = order.shippingCity || order.address?.city || '';
    const deliveryState = order.shippingState || order.address?.state || '';
    const deliveryPincode = order.shippingPincode || order.address?.pincode || '';

    if (!deliveryAddress) return;

    await ShipingTech.getToken();

    const payload = {
      booking_code: Number(process.env.SHIPINGTECH_BOOKING_CODE),
      customerName,
      customerPhone,
      customerEmail,
      deliveryAddress,
      deliveryCity,
      deliveryState,
      deliveryPincode,
      deliveryCountry: 'India',
      invoiceValue: Number(order.total),
      isCOD: order.paymentMethod === 'COD',
      codAmount: order.paymentMethod === 'COD' ? Number(order.total) : 0,
      items: order.items.map((item) => ({
        name: item.product?.name || item.productName,
        qty: item.quantity,
        price: Number(item.price),
      })),
      weightKg: 1,
      referenceId: order.id,
    };

    ShipingTech.createShipmentOrder(payload)
      .then(async (result) => {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            shipingTechUUID: result?.uuid || result?.id || null,
            shippingStatus: 'PENDING',
          },
        });
        console.log('[Shipping] Shipment created:', result?.uuid || result?.id);
      })
      .catch((err) => {
        console.error('[Shipping] Auto-create failed:', err.message);
      });
  } catch (err) {
    console.error('[Shipping] Token warmup failed:', err.message);
  }
}

// Startup validation logs
console.log('[Razorpay] key_id loaded:', !!process.env.RAZORPAY_KEY_ID);
console.log('[Razorpay] key_secret loaded:', !!process.env.RAZORPAY_KEY_SECRET);

/**
 * A) Create Razorpay Order
 */
export const createRazorpayOrder = asyncHandler(async (req, res, next) => {
  try {
    const { orderType, amount, currency = 'INR', orderId } = req.body;

    if (orderType === 'SERVICE_ORDER' || orderType === 'SERVICE') {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const dbRecord = await prisma.serviceOrder.findFirst({
        where: { id: orderId, userId: req.user.id }
      });

      if (!dbRecord) {
        return res.status(404).json({ message: 'Service order not found' });
      }

      const amountInPaise = Math.round(Number(amount || dbRecord.totalAmount) * 100);
      if (!amountInPaise || amountInPaise < 100) {
        return res.status(400).json({ message: 'Invalid amount. Minimum ₹1.' });
      }

      const options = {
        amount: amountInPaise,
        currency,
        receipt: `service_${orderId.slice(0, 8)}`,
        notes: {
          orderType: 'SERVICE_ORDER',
          internalOrderId: orderId,
          userId: req.user.id,
        }
      };

      let rzpOrder;
      try {
        rzpOrder = await razorpay.orders.create(options);
      } catch (razorpayError) {
        console.error('[Razorpay Order Error for Service]', JSON.stringify(razorpayError));
        return res.status(502).json({
          success: false,
          message: 'Payment gateway error',
          detail: razorpayError?.error?.description || razorpayError?.message || 'Unknown Razorpay error'
        });
      }

      // Save the razorpayOrderId to the ServiceOrder
      await prisma.serviceOrder.update({
        where: { id: orderId },
        data: {
          razorpayOrderId: rzpOrder.id
        }
      });

      return res.json({
        success: true,
        data: {
          razorpayOrderId: rzpOrder.id,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          keyId: process.env.RAZORPAY_KEY_ID,
        },
      });
    }

    const { addressId, guestAddress, notes: orderNotes, idempotencyKey } = req.body;

    if (!addressId && !guestAddress) {
      return res.status(400).json({ message: 'addressId or guestAddress is required' });
    }
    if (!idempotencyKey) {
      return res.status(400).json({ message: 'idempotencyKey is required' });
    }

    // 1. Fetch Cart to get the REAL amount
    const cartWhere = req.user
      ? { userId: req.user.id }
      : { sessionId: req.cookies?.cart_session };

    if (!cartWhere.userId && !cartWhere.sessionId) {
      throw createError('Cart is empty', 400);
    }

    const cart = await prisma.cart.findUnique({
      where: cartWhere,
      include: {
        items: {
          include: { product: { select: { price: true, isActive: true } } },
        },
      },
    });

    if (!cart || cart.items.length === 0) throw createError('Cart is empty', 400);

    let subtotal = 0;
    for (const item of cart.items) {
      if (!item.product.isActive) throw createError('One or more items in cart are no longer available', 400);
      subtotal += Number(item.product.price) * item.quantity;
    }
    const shippingCost = subtotal >= 1000 ? 0 : 49;
    const total = subtotal + shippingCost;
    const amountInPaise = Math.round(total * 100);

    const options = {
      amount: amountInPaise,
      currency,
      receipt: `rcpt_${idempotencyKey.slice(0, 10)}`,
      notes: {
        userId: req.user?.id || null,
        sessionId: req.cookies?.cart_session || null,
        addressId: addressId || null,
        guestAddress: guestAddress ? JSON.stringify(guestAddress) : null,
        notes: orderNotes || '',
        idempotencyKey,
      }
    };

    let rzpOrder;
    try {
      rzpOrder = await razorpay.orders.create(options);
    } catch (razorpayError) {
      console.error('[Razorpay Order Error]', JSON.stringify(razorpayError));
      return res.status(502).json({
        success: false,
        message: 'Payment gateway error',
        detail: razorpayError?.error?.description || razorpayError?.message || 'Unknown Razorpay error'
      });
    }

    res.json({
      success: true,
      data: {
        razorpayOrderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (err) {
    console.error('[General Payment Error]', err);
    next(err);
  }
});

/**
 * B) Verify Razorpay Payment
 */
export const verifyPayment = asyncHandler(async (req, res, next) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      addressId,
      guestAddress,
      notes,
      idempotencyKey,
      orderId: serviceOrderId,
      orderType
    } = req.body;

    if (orderType === 'SERVICE_ORDER' || orderType === 'SERVICE') {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !serviceOrderId) {
        throw createError('Missing required payment verification fields', 400);
      }

      // 1. Signature Verification
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        throw createError('Payment verification failed', 400);
      }

      // 2. Update the ServiceOrder model
      const updatedServiceOrder = await prisma.serviceOrder.update({
        where: { id: serviceOrderId },
        data: {
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
          paymentMethod: 'RAZORPAY',
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
        }
      });

      // 3. Broadcast SSE notification to admin
      try {
        broadcastToAdmins('new_order', {
          id: serviceOrderId,
          orderNumber: updatedServiceOrder.orderNumber,
          customerName: req.user?.name || 'Customer',
          customerEmail: req.user?.email,
          amount: updatedServiceOrder.totalAmount,
          type: 'SERVICE_ORDER',
          createdAt: new Date().toISOString(),
        });
      } catch (broadcastErr) {
        console.error('[verifyPayment] Admin broadcast failed:', broadcastErr);
      }

      // 4. Create Payment Record (if not exists)
      const existingPayment = await prisma.payment.findUnique({
        where: { razorpayPaymentId: razorpay_payment_id }
      });
      
      if (!existingPayment) {
        await prisma.payment.create({
          data: {
            userId: req.user?.id || null,
            internalOrderId: serviceOrderId,
            orderType: 'SERVICE_ORDER',
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            amount: Math.round(Number(updatedServiceOrder.totalAmount) * 100),
            status: 'PAID',
            paymentMethod: 'RAZORPAY',
            paidAt: new Date(),
          }
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        order: updatedServiceOrder,
        orderType: 'SERVICE_ORDER',
      });
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !idempotencyKey) {
      throw createError('Missing required payment verification fields', 400);
    }

    // 1. Signature Verification
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      throw createError('Payment verification failed', 400);
    }

    // 2. Idempotency Check
    const idemKey = `idem:order:${idempotencyKey}`;
    let orderId = await valkey.get(idemKey);
    let order;

    if (orderId) {
      order = await prisma.order.findUnique({ where: { id: orderId } });
    }

    if (!order) {
      // 3. Create Order if it doesn't exist yet
      order = await saveOrderToDB({
        userId: req.user?.id || null,
        addressId,
        guestAddress,
        notes,
        paymentMethod: 'RAZORPAY',
        paymentStatus: 'PAID',
        user: req.user || { name: guestAddress?.fullName, email: guestAddress?.email, phone: guestAddress?.phone },
        sessionId: req.cookies?.cart_session || null,
      });
      await valkey.set(idemKey, order.id, 'EX', 600);
    }

    // 4. Create Payment Record (if not exists)
    const existingPayment = await prisma.payment.findUnique({ where: { razorpayPaymentId: razorpay_payment_id } });
    if (!existingPayment) {
      await prisma.payment.create({
        data: {
          userId: req.user?.id || null,
          internalOrderId: order.id,
          orderType: 'ORDER',
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          amount: Math.round(Number(order.total) * 100),
          status: 'PAID',
          paymentMethod: 'RAZORPAY',
          paidAt: new Date(),
        }
      });
    }

    await autoCreateShipment(order.id);

    res.json({
      success: true,
      message: 'Payment verified successfully',
      order: {
        id: order.id,
        status: order.status,
        totalAmount: order.total,
        razorpayPaymentId: razorpay_payment_id,
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * C) Confirm Cash on Delivery
 */
export const confirmCOD = asyncHandler(async (req, res) => {
  const { internalOrderId, orderType } = req.body;

  if (!internalOrderId || !orderType) {
    throw createError('Missing required fields', 400);
  }

  const validOrderTypes = ['ORDER', 'SERVICE_ORDER'];
  if (!validOrderTypes.includes(orderType)) {
    throw createError(`Invalid orderType. Must be one of: ${validOrderTypes.join(', ')}`, 400);
  }

  const orderData = orderType === 'ORDER'
    ? await prisma.order.findUnique({ where: { id: internalOrderId } })
    : await prisma.serviceOrder.findUnique({ where: { id: internalOrderId } });

  if (!orderData) {
    throw createError(`${orderType === 'ORDER' ? 'Order' : 'Service Order'} not found`, 404);
  }

  if (orderData.userId && (!req.user || orderData.userId !== req.user.id)) {
    throw createError('Unauthorized', 403);
  }

  await prisma.$transaction([
    orderType === 'ORDER'
      ? prisma.order.update({
          where: { id: internalOrderId },
          data: { paymentMethod: 'COD', paymentStatus: 'COD_PENDING' }
        })
      : prisma.serviceOrder.update({
          where: { id: internalOrderId },
          data: { 
            paymentMethod: 'COD', 
            paymentStatus: 'COD_PENDING',
            status: 'PENDING'
          }
        }),
    prisma.payment.create({
      data: {
        userId: req.user?.id || null,
        internalOrderId,
        orderType,
        amount: 0,
        status: 'COD_PENDING',
        paymentMethod: 'COD'
      }
    }),
    // Clear cart after successful COD product order
    ...(orderType === 'ORDER' ? [
      prisma.cart.update({
        where: req.user ? { userId: req.user.id } : { sessionId: req.cookies?.cart_session },
        data: { items: { deleteMany: {} } }
      })
    ] : [])
  ]);

  // Send notifications
  try {
    const adminEmail = process.env.COMPANY_EMAIL || process.env.EMAIL_FROM || 'photowalagiftphotowalagift@gmail.com';
    const user = req.user
      ? { name: req.user.name || 'Customer', email: req.user.email }
      : { name: orderData.shippingName || orderData.guestName || 'Guest Customer', email: orderData.guestEmail || '' };
    
    if (orderType === 'ORDER') {
      const order = await prisma.order.findUnique({ where: { id: internalOrderId } });
      const tpl = emailTemplates.orderConfirmation(order, user);
      const adminTpl = emailTemplates.adminNewOrder(order, user);
      
      if (user.email) {
        sendMail({ to: user.email, subject: tpl.subject, html: tpl.html }).catch(console.error);
      }
      sendMail({ to: adminEmail, subject: adminTpl.subject, html: adminTpl.html }).catch(console.error);
      
      // Send admin transaction notification
      emailService.sendAdminTransactionNotification({
        order,
        user,
        transactionType: 'ORDER_PAID'
      }).catch(err => console.error('[Transaction Email] Failed:', err.message));
    } else {
      const serviceOrder = await prisma.serviceOrder.findUnique({ where: { id: internalOrderId } });
      const adminTpl = emailTemplates.adminNewServiceRequest(serviceOrder, user);
      sendMail({ to: adminEmail, subject: adminTpl.subject, html: adminTpl.html }).catch(console.error);
    }
  } catch (err) {
    console.error('[payment] Failed to send COD notification:', err.message);
  }

  res.json({
    success: true,
    data: { message: 'COD order confirmed' },
  });
});

/**
 * D) Razorpay Webhook
 */
export const razorpayWebhook = asyncHandler(async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers['x-razorpay-signature'];

  if (!signature || !webhookSecret) {
    return res.status(400).json({ success: false, error: 'Configuration error' });
  }

  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(req.body)
    .digest('hex');

  // Constant-time comparison for webhook signature
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(signature);
  
  let isValid = false;
  if (expectedBuffer.length === receivedBuffer.length) {
    isValid = crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
  }

  if (!isValid) {
    console.error('[webhook] Signature mismatch suspected attack');
    return res.status(400).json({ success: false, error: 'Invalid signature' });
  }

  const event = JSON.parse(req.body.toString());
  const { payload, event: eventType } = event;

  if (!payload || !eventType) {
    console.error('[webhook] Invalid payload structure');
    return res.status(400).json({ success: false, error: 'Invalid payload' });
  }

  if (eventType === 'payment.captured') {
    const rzpPayment = payload.payment.entity;
    const razorpayOrderId = rzpPayment.order_id;
    const razorpayPaymentId = rzpPayment.id;
    const { userId, sessionId, addressId, guestAddress: guestAddressStr, notes, idempotencyKey } = rzpPayment.notes;
    const guestAddress = guestAddressStr ? JSON.parse(guestAddressStr) : null;

    if (!razorpayOrderId || !razorpayPaymentId || !idempotencyKey) {
      return res.status(200).json({ received: true });
    }

    // 1. Idempotency Check
    const idemKey = `idem:order:${idempotencyKey}`;
    let orderId = await valkey.get(idemKey);
    let order;

    if (orderId) {
      order = await prisma.order.findUnique({ where: { id: orderId } });
    }

    if (!order) {
      const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
      const customer = user || { name: guestAddress?.fullName, email: guestAddress?.email, phone: guestAddress?.phone };

      order = await saveOrderToDB({
        userId: userId || null,
        addressId: addressId || null,
        guestAddress,
        notes,
        paymentMethod: 'RAZORPAY',
        paymentStatus: 'PAID',
        user: customer,
        sessionId,
      });
      await valkey.set(idemKey, order.id, 'EX', 600);
    }

    // 2. Create Payment Record (if not exists)
    const existingPayment = await prisma.payment.findUnique({ 
      where: { razorpayPaymentId: razorpayPaymentId } 
    });

    if (!existingPayment) {
      await prisma.payment.create({
        data: {
          userId: userId || null,
          internalOrderId: order.id,
          orderType: 'ORDER',
          razorpayOrderId,
          razorpayPaymentId,
          amount: rzpPayment.amount,
          status: 'PAID',
          paymentMethod: 'RAZORPAY',
          paidAt: new Date(),
        }
      });
    }

    await autoCreateShipment(order.id);
  } else if (eventType === 'payment.failed') {
    const razorpayOrderId = payload.payment?.entity?.order_id;
    if (razorpayOrderId) {
      await prisma.payment.update({
        where: { razorpayOrderId },
        data: { status: 'FAILED' }
      }).catch(() => {});
    }
  }

  res.status(200).json({ received: true });
});

/**
 * E) Process Refund
 */
export const processRefund = asyncHandler(async (req, res) => {
  const { paymentId, refundAmount, reason } = req.body;

  if (!paymentId || !refundAmount) {
    throw createError('Missing required fields: paymentId, refundAmount', 400);
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });

  if (!payment) {
    throw createError('Payment not found', 404);
  }

  if (payment.status !== 'PAID') {
    throw createError('Only PAID payments can be refunded', 400);
  }

  if (refundAmount > (payment.amount / 100)) {
    throw createError('Refund amount cannot exceed payment amount', 400);
  }

  if (payment.razorpayPaymentId) {
    await razorpay.payments.refund(payment.razorpayPaymentId, {
      amount: Math.round(refundAmount * 100),
      notes: { reason: reason || 'Admin refund' }
    });
  }

  await prisma.payment.update({
    where: { id: paymentId },
    data: { 
      status: 'REFUNDED',
      refundedAt: new Date(),
      refundAmount: Math.round(refundAmount * 100)
    }
  });

  res.json({
    success: true,
    data: { 
      message: 'Refund processed successfully',
      refundAmount,
      paymentId
    }
  });
});

