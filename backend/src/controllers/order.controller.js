import prisma from '../lib/prisma.js';
import { broadcastToAdmins } from '../services/notificationService.js';

import { createError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import { emailTemplates } from '../config/email.js';
import { sendMail } from '../lib/mailer.js';
import asyncHandler from '../utils/asyncHandler.js';
import valkey from '../lib/valkey.js';
import crypto from 'crypto';
import { saveOrderToDB } from '../services/orderService.js';

function generateOrderNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORG-${ts}-${rand}`;
}

function generatePenOrderId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PWG-${ts}-${rand}`;
}

const laserPenOrderSchema = z.object({
  orderName: z.string().min(3).max(120),
  penType: z.string().min(1).max(20),
  qty: z.coerce.number().int().positive(),
  deliveryOption: z.enum(['courier']),
  fileOption: z.enum(['attach', 'email']),
  emailForFile: z.string().email().optional(),
  specialRemark: z.string().max(300).optional(),
  pricing: z.object({
    applicableCost: z.coerce.number().nonnegative(),
    discountPercent: z.coerce.number().min(0).max(100),
    discountAmt: z.coerce.number().nonnegative(),
    emailCharge: z.coerce.number().nonnegative(),
    gst: z.coerce.number().nonnegative(),
    totalPayable: z.coerce.number().nonnegative(),
  }),
});

export const createOrder = asyncHandler(async (req, res) => {
  const { addressId, guestAddress, notes, paymentMethod, idempotencyKey } = z.object({
    addressId: z.string().uuid().optional(),
    guestAddress: z.object({
      fullName: z.string().min(1),
      phone: z.string().min(10).max(10),
      email: z.string().email(),
      line1: z.string().min(1),
      line2: z.string().optional().nullable(),
      city: z.string().min(1),
      state: z.string().min(1),
      pincode: z.string().min(6).max(6),
    }).optional(),
    notes: z.string().optional(),
    paymentMethod: z.enum(['COD', 'RAZORPAY']).optional().default('RAZORPAY'),
    idempotencyKey: z.string().min(1),
  }).parse(req.body);

  if (!addressId && !guestAddress) {
    throw createError('Delivery address or guest details are required', 400);
  }

  // 1. Idempotency Check
  const idemKey = `idem:order:${idempotencyKey}`;
  const existingOrderId = await valkey.get(idemKey);
  if (existingOrderId) {
    const order = await prisma.order.findUnique({ where: { id: existingOrderId }, include: { items: true } });
    if (order) return res.status(200).json({ success: true, data: order, message: 'Returned existing order' });
  }

  // 2. Fetch Cart for duplicate check and processing
  const cartWhere = req.user
    ? { userId: req.user.id }
    : { sessionId: req.cookies?.cart_session };

  if (!cartWhere.userId && !cartWhere.sessionId) {
    throw createError('Cart is empty', 400);
  }

  const cart = await prisma.cart.findUnique({
    where: cartWhere,
    include: { items: true },
  });
  if (!cart || cart.items.length === 0) throw createError('Cart is empty', 400);

  // 3. Duplicate Check (Hash of userId/session + items)
  const itemsString = cart.items
    .sort((a, b) => a.productId.localeCompare(b.productId))
    .map(i => `${i.productId}:${i.quantity}`)
    .join('|');
  const userIdent = req.user?.id || req.cookies?.cart_session || 'guest';
  const cartHash = crypto.createHash('md5').update(`${userIdent}:${itemsString}`).digest('hex');
  const dupKey = `order:dup:${userIdent}:${cartHash}`;
  
  const isDuplicate = await valkey.get(dupKey);
  if (isDuplicate) {
    throw createError('This order has already been placed recently. Please check your order history.', 409);
  }

  // 4. Save Order (For COD flow)
  // If paymentMethod is RAZORPAY, we don't create the order in DB yet (Split flow fix)
  if (paymentMethod === 'RAZORPAY') {
    return res.status(400).json({ message: 'For Razorpay, use the payment initialization flow' });
  }

  const order = await saveOrderToDB({
    userId: req.user?.id || null,
    addressId,
    guestAddress,
    notes,
    paymentMethod: 'COD',
    paymentStatus: 'COD_PENDING',
    user: req.user || { name: guestAddress?.fullName, email: guestAddress?.email, phone: guestAddress?.phone },
    sessionId: req.cookies?.cart_session || null,
  });

  // 5. Store Idempotency and Duplicate keys
  await valkey.set(idemKey, order.id, 'EX', 600); // 10 min
  await valkey.set(dupKey, '1', 'EX', 60);       // 60 sec

  res.status(201).json({ success: true, data: order });
});

export const getUserOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId: req.user.id },
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: { product: { select: { name: true, images: { where: { isPrimary: true }, take: 1 } } } },
        },
      },
    }),
    prisma.order.count({ where: { userId: req.user.id } }),
  ]);

  res.json({ success: true, data: orders, meta: { total, page: Number(page) } });
});

export const getOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Try finding by ID (UUID) first
  let order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { include: { images: { take: 1 } } } } },
      address: true,
    },
  });

  // If not found by ID, try finding by orderNumber
  if (!order) {
    order = await prisma.order.findUnique({
      where: { orderNumber: id },
      include: {
        items: { include: { product: { include: { images: { take: 1 } } } } },
        address: true,
      },
    });
  }
  if (!order) throw createError('Order not found', 404);

  // Permission Check
  if (order.userId) {
    if (!req.user || (order.userId !== req.user.id && req.user.role === 'CUSTOMER')) {
      throw createError('Forbidden', 403);
    }
  } else {
    // Guest order: since orderId / orderNumber is an unguessable UUID / custom string,
    // we allow anyone with the secure ID to view it (required for guest checkout success tracking).
  }

  res.json({ success: true, data: order });
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) throw createError('Order not found', 404);
  if (order.userId !== req.user.id) throw createError('Forbidden', 403);
  if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
    throw createError('Order cannot be cancelled at this stage', 400);
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { status: 'CANCELLED' },
  });

  res.json({ success: true, message: 'Order cancelled' });
});

export const getAllOrders = asyncHandler(async (req, res) => {
  const pageNum = Math.max(1, parseInt(req.query.page) || 1);
  const limitNum = Math.max(1, parseInt(req.query.limit) || 20);
  const { status } = req.query;

  const where = status ? { status } : {};
  const skip = (pageNum - 1) * limitNum;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  res.json({
    success: true,
    data: orders || [],
    meta: {
      total: total || 0,
      page: pageNum,
      limit: limitNum
    }
  });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, trackingNumber } = z.object({
    status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
    trackingNumber: z.string().nullable().optional(),
  }).parse(req.body);

  const updateData = { status };
  if (trackingNumber !== undefined) {
    updateData.trackingNumber = trackingNumber;
  }

  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: updateData,
    include: { user: true }
  });

  if (status === 'SHIPPED') {
    try {
      const customerName = order.shippingName || order.guestName || order.user?.name || 'Customer';
      const customerEmail = order.guestEmail || order.user?.email;
      if (customerEmail) {
        const tpl = emailTemplates.shippingConfirmation(order, { name: customerName, email: customerEmail });
        sendMail({ to: customerEmail, subject: tpl.subject, html: tpl.html }).catch(console.error);
      }
    } catch (err) {
      console.error('[Email] Failed to send shipping email:', err.message);
    }
  }

  res.json({ success: true, data: order });
});

export const updateTracking = asyncHandler(async (req, res) => {
  const { trackingNumber } = z.object({ trackingNumber: z.string().min(1) }).parse(req.body);
  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { trackingNumber, status: 'SHIPPED' },
    include: { user: true }
  });

  try {
    const customerName = order.shippingName || order.guestName || order.user?.name || 'Customer';
    const customerEmail = order.guestEmail || order.user?.email;
    if (customerEmail) {
      const tpl = emailTemplates.shippingConfirmation(order, { name: customerName, email: customerEmail });
      sendMail({ to: customerEmail, subject: tpl.subject, html: tpl.html }).catch(console.error);
    }
  } catch (err) {
    console.error('[Email] Failed to send shipping email:', err.message);
  }

  res.json({ success: true, data: order });
});

export const adminCancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw createError('Order not found', 404);

  const updatedOrder = await prisma.order.update({
    where: { id },
    data: { 
      status: 'CANCELLED',
      paymentStatus: (order.paymentMethod === 'COD' || order.paymentStatus === 'PENDING') 
        ? 'REFUND_NOT_REQUIRED' 
        : order.paymentStatus 
    },
  });

  res.json({ success: true, message: 'Order cancelled by admin', data: updatedOrder });
});

export const createLaserPenOrder = asyncHandler(async (req, res) => {
  const payload = laserPenOrderSchema.parse(req.body);
  if (payload.fileOption === 'email' && !payload.emailForFile) {
    throw createError('Email is required when file option is email', 422);
  }
  if (payload.fileOption === 'attach' && payload.emailForFile) {
    throw createError('Do not provide email for attach file option', 422);
  }

  const order = await prisma.serviceOrder.create({
    data: {
      orderNumber: generatePenOrderId(),
      userId: req.user.id,
      category: 'PRINTING',
      serviceName: 'Laser Printed Pen',
      productName: payload.penType,
      quantity: payload.qty,
      totalAmount: payload.pricing.totalPayable,
      status: 'PENDING',
      details: payload,
      fileOption: payload.fileOption,
      specialRemark: payload.specialRemark,
      customerName: payload.orderName,
    }
  });

  res.status(201).json({ success: true, orderId: order.id });
});
