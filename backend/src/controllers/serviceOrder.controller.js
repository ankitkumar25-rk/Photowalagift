import prisma from '../lib/prisma.js';
import { broadcastToAdmins } from '../services/notificationService.js';

import { createError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Generate a unique order number based on category
 */
function generateServiceOrderNumber(category) {
  const prefix = category === 'MACHINE' ? 'MSC' : 'PRT';
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}

/**
 * Create a new Service Order
 */
export const createServiceOrder = asyncHandler(async (req, res) => {
  const { 
    category, 
    serviceName, 
    productName, 
    quantity, 
    totalAmount, 
    details, 
    fileUrl, 
    fileOption, 
    specialRemark, 
    customerName 
  } = req.body;

  if (!category || !serviceName || !quantity) {
    throw createError('Category, service name and quantity are required', 400);
  }

  const order = await prisma.serviceOrder.create({
    data: {
      orderNumber: generateServiceOrderNumber(category),
      userId: req.user.id,
      category,
      serviceName,
      productName,
      quantity: Number(quantity),
      totalAmount: Number(totalAmount || 0),
      details: details || {},
      fileUrl,
      fileOption,
      specialRemark,
      customerName
    }
  });

  // Broadcast to admins
  broadcastToAdmins('new_order', {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: req.user?.name || 'Customer',
    amount: order.totalAmount,
    itemCount: 1,
    createdAt: order.createdAt,
    type: 'SERVICE',
  });


  res.status(201).json({ 
    success: true, 
    orderId: order.id,
    orderNumber: order.orderNumber,
    data: order 
  });
});

/**
 * Get service orders for the logged-in user
 */
export const getMyServiceOrders = asyncHandler(async (req, res) => {
  const pageNum = Math.max(1, parseInt(req.query.page) || 1);
  const limitNum = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (pageNum - 1) * limitNum;

  const [orders, total] = await Promise.all([
    prisma.serviceOrder.findMany({
      where: { 
        userId: req.user.id,
        paymentStatus: 'PAID'
      },
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.serviceOrder.count({ 
      where: { 
        userId: req.user.id,
        paymentStatus: 'PAID'
      } 
    })
  ]);

  res.json({ success: true, data: orders, meta: { total, page: pageNum } });
});

/**
 * Get a single service order detail
 */
export const getServiceOrderDetail = asyncHandler(async (req, res) => {
  const order = await prisma.serviceOrder.findUnique({
    where: { id: req.params.id },
    include: { user: { select: { name: true, email: true, phone: true } } }
  });

  if (!order) throw createError('Service order not found', 404);
  
  if (req.user.role === 'CUSTOMER' && order.userId !== req.user.id) {
    throw createError('Forbidden', 403);
  }

  res.json({ success: true, data: order });
});

/**
 * Admin: Get all service orders
 */
export const getAllServiceOrders = asyncHandler(async (req, res) => {
  const { category, status, page, limit, search } = req.query;

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.max(1, parseInt(limit) || 20);
  const skip = (pageNum - 1) * limitNum;

  const whereClause = {
    ...(category && { category }),
    ...(status && { status }),
    paymentStatus: 'PAID',
    ...(search && {
      OR: [
        { customerName: { contains: search, mode: 'insensitive' } },
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { id: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [orders, total] = await Promise.all([
    prisma.serviceOrder.findMany({
      where: whereClause,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, email: true } } }
    }),
    prisma.serviceOrder.count({ where: whereClause })
  ]);

  res.json({
    success: true,
    data: orders,
    meta: {
      total,
      page: pageNum,
      limit: limitNum
    }
  });
});

/**
 * Admin: Update service order status
 */
export const updateServiceOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const order = await prisma.serviceOrder.update({
    where: { id },
    data: { status }
  });
  res.json({ success: true, data: order });
});

export const updateTrackingNumber = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { trackingNumber } = req.body;
  const order = await prisma.serviceOrder.update({
    where: { id },
    data: { trackingNumber }
  });
  res.json({ success: true, data: order });
});

/**
 * Admin: Delete service order
 */
export const deleteServiceOrder = asyncHandler(async (req, res) => {
  await prisma.serviceOrder.delete({
    where: { id: req.params.id }
  });
  res.json({ success: true, message: 'Service order deleted' });
});

/**
 * Customer: Cancel pending service order (Only if unpaid/pending payment)
 */
export const cancelServiceOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await prisma.serviceOrder.findFirst({
    where: { 
      id, 
      userId: req.user.id,
      paymentStatus: 'PENDING'
    }
  });

  if (!order) {
    throw createError('Service order not found or already processed', 404);
  }

  await prisma.serviceOrder.delete({
    where: { id }
  });

  res.json({ success: true, message: 'Pending service order cancelled' });
});

