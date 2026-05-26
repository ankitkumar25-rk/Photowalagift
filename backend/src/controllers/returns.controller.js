import prisma from '../lib/prisma.js';
import { createError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import asyncHandler from '../utils/asyncHandler.js';

export const requestReturn = asyncHandler(async (req, res) => {
  const { orderId, reason } = z.object({
    orderId: z.string().uuid(),
    reason: z.string().min(10),
  }).parse(req.body);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { returns: true },
  });

  if (!order) throw createError('Order not found', 404);
  if (order.userId !== req.user.id) throw createError('Forbidden', 403);
  if (order.status !== 'DELIVERED') throw createError('Only delivered orders can be returned', 400);

  const deliveredDaysAgo = (Date.now() - order.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
  if (deliveredDaysAgo > 7) throw createError('Return window has expired (7 days from delivery)', 400);

  if (order.returns?.length > 0) throw createError('A return request already exists for this order', 409);

  const returnReq = await prisma.return.create({
    data: { userId: req.user.id, orderId, reason },
  });

  res.status(201).json({ success: true, data: returnReq });
});

export const getMyReturns = asyncHandler(async (req, res) => {
  const returns = await prisma.return.findMany({
    where: { userId: req.user.id },
    include: { order: { select: { orderNumber: true, total: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: returns });
});

export const getReturnsQueue = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const where = status ? { status } : {};
  const [returns, total] = await Promise.all([
    prisma.return.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        order: { select: { orderNumber: true, total: true } },
      },
    }),
    prisma.return.count({ where }),
  ]);
  res.json({ success: true, data: returns, meta: { total, page: Number(page) } });
});

export const approveReturn = asyncHandler(async (req, res) => {
  const { refundAmount, refundMethod, adminNote } = z.object({
    refundAmount: z.number().positive(),
    refundMethod: z.string().default('original'),
    adminNote: z.string().optional(),
  }).parse(req.body);

  const ret = await prisma.return.update({
    where: { id: req.params.id },
    data: { status: 'APPROVED', refundAmount, refundMethod, adminNote },
    include: { user: true },
  });

  res.json({ success: true, data: ret });
});

export const rejectReturn = asyncHandler(async (req, res) => {
  const { adminNote } = z.object({ adminNote: z.string().min(5) }).parse(req.body);
  const ret = await prisma.return.update({
    where: { id: req.params.id },
    data: { status: 'REJECTED', adminNote },
  });
  res.json({ success: true, data: ret });
});
