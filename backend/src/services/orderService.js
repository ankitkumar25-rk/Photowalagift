import prisma from '../lib/prisma.js';
import { createError } from '../middleware/errorHandler.js';
import { broadcastToAdmins } from './notificationService.js';
import { sendMail } from '../lib/mailer.js';
import { emailTemplates } from '../config/email.js';
import { emailService } from './email.service.js';

function generateOrderNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORG-${ts}-${rand}`;
}

export const saveOrderToDB = async ({ userId, addressId, guestAddress, notes, paymentMethod, paymentStatus, user, sessionId }) => {
  let shippingDetails = {};

  if (userId && addressId) {
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!address) throw createError('Invalid delivery address', 400);

    shippingDetails = {
      addressId: address.id,
      shippingName: address.fullName,
      shippingPhone: address.phone,
      shippingLine1: address.line1,
      shippingLine2: address.line2 || null,
      shippingCity: address.city,
      shippingState: address.state,
      shippingPincode: address.pincode,
    };
  } else if (guestAddress) {
    shippingDetails = {
      guestName: guestAddress.fullName,
      guestPhone: guestAddress.phone,
      guestEmail: guestAddress.email,
      shippingName: guestAddress.fullName,
      shippingPhone: guestAddress.phone,
      shippingLine1: guestAddress.line1,
      shippingLine2: guestAddress.line2 || null,
      shippingCity: guestAddress.city,
      shippingState: guestAddress.state,
      shippingPincode: guestAddress.pincode,
    };
  } else {
    throw createError('Delivery address or guest details are required', 400);
  }

  const cartWhere = userId ? { userId } : { sessionId };
  if (!cartWhere.userId && !cartWhere.sessionId) {
    throw createError('Cart is empty', 400);
  }

  const cart = await prisma.cart.findUnique({
    where: cartWhere,
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, price: true, stock: true, unit: true, isActive: true } },
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) throw createError('Cart is empty', 400);

  let subtotal = 0;
  const orderItems = [];

  for (const item of cart.items) {
    const { product } = item;
    if (!product.isActive) throw createError(`${product.name} is no longer available`, 400);

    const itemTotal = Number(product.price) * item.quantity;
    subtotal += itemTotal;
    orderItems.push({
      productId: product.id,
      quantity: item.quantity,
      price: product.price,
      total: itemTotal,
      productName: product.name,
      productUnit: product.unit,
      customizationText: item.customizationText || null,
      customizationImageUrl: item.customizationImageUrl || null,
    });
  }
  const shippingCost = subtotal >= 1000 ? 0 : 49;
  const total = subtotal + shippingCost;

  const order = await prisma.$transaction(async (tx) => {
    // Check stock
    for (const item of cart.items) {
      const currentProduct = await tx.product.findUnique({
        where: { id: item.productId },
        select: { stock: true, name: true },
      });
      if (currentProduct.stock < item.quantity) {
        throw createError(`Insufficient stock for ${currentProduct.name}`, 400);
      }
    }

    // Update stock
    for (const item of cart.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    // Create order
    const newOrder = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: userId || null,
        subtotal,
        shippingCost,
        total,
        notes,
        paymentMethod,
        paymentStatus,
        status: paymentStatus === 'PAID' ? 'CONFIRMED' : 'PENDING',
        ...shippingDetails,
        items: { create: orderItems },
      },
      include: { items: true },
    });

    // Clear cart
    await tx.cart.update({
      where: cartWhere,
      data: { items: { deleteMany: {} } }
    });

    return newOrder;
  });

  const customerName = order.shippingName || order.guestName || user?.name || 'Customer';
  const customerEmail = order.guestEmail || user?.email || '';

  // Broadcast to admins
  broadcastToAdmins('new_order', {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName,
    customerEmail,
    amount: order.total,
    itemCount: order.items?.length || 0,
    createdAt: order.createdAt,
    type: 'ORDER',
  });

  // Send confirmation emails safely
  try {
    if (customerEmail) {
      const userData = { name: customerName, email: customerEmail, phone: order.shippingPhone || order.guestPhone || user?.phone || '' };
      const tpl = emailTemplates.orderConfirmation(order, userData);
      const adminTpl = emailTemplates.adminNewOrder(order, userData);

      sendMail({ to: customerEmail, subject: tpl.subject, html: tpl.html }).catch(console.error);
      const adminEmail = process.env.COMPANY_EMAIL || process.env.EMAIL_FROM || 'photowalagiftphotowalagift@gmail.com';
      sendMail({ to: adminEmail, subject: adminTpl.subject, html: adminTpl.html }).catch(console.error);
      
      // Send admin transaction notification
      emailService.sendAdminTransactionNotification({
        order,
        user: userData,
        transactionType: paymentStatus === 'PAID' ? 'ORDER_PAID' : 'ORDER_CREATED'
      }).catch(err => console.error('[Transaction Email] Failed:', err.message));
    }
  } catch (emailErr) {
    console.error('[Email] Failed to process email templates:', emailErr.message);
  }

  return order;
};
