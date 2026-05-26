import prisma from '../lib/prisma.js';
import { createError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import asyncHandler from '../utils/asyncHandler.js';

export const getProfile = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, name: true, email: true, phone: true, avatarUrl: true, role: true, createdAt: true },
  });
  res.json({ success: true, data: user });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = z.object({ name: z.string().min(2).optional(), phone: z.string().optional() }).parse(req.body);
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { name, phone },
    select: { id: true, name: true, email: true, phone: true },
  });
  res.json({ success: true, data: user });
});

export const completeProfile = asyncHandler(async (req, res) => {
  const { phone, street, city, state, pincode, country } = z.object({
    phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be exactly 10 digits'),
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().length(6, 'Pincode must be 6 digits').optional(),
    country: z.string().default('India'),
  }).parse(req.body);

  // Update phone
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { phone },
  });

  // Create primary address if provided
  if (street || city || state || pincode) {
    await prisma.address.create({
      data: {
        userId: req.user.id,
        label: 'Home',
        fullName: user.name,
        phone,
        line1: street || '',
        city: city || '',
        state: state || '',
        pincode: pincode || '',
        isDefault: true,
      },
    });
  }

  res.json({ 
    success: true, 
    message: 'Profile completed successfully',
    data: { 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      phone: user.phone 
    }
  });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
  }).parse(req.body);

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user.passwordHash) throw createError('Password change not available for OAuth accounts', 400);

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw createError('Current password is incorrect', 401);

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash } });

  res.json({ success: true, message: 'Password changed successfully' });
});

const addressSchema = z.object({
  label: z.string().default('Home'),
  fullName: z.string().min(2),
  phone: z.string().min(10),
  line1: z.string().min(5),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().length(6),
  isDefault: z.boolean().default(false),
});

export const getAddresses = asyncHandler(async (req, res) => {
  const addresses = await prisma.address.findMany({
    where: { userId: req.user.id },
    orderBy: { isDefault: 'desc' },
  });
  res.json({ success: true, data: addresses });
});

export const addAddress = asyncHandler(async (req, res) => {
  const data = addressSchema.parse(req.body);

  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId: req.user.id },
      data: { isDefault: false },
    });
  }

  const address = await prisma.address.create({
    data: { ...data, userId: req.user.id },
  });
  res.status(201).json({ success: true, data: address });
});

export const updateAddress = asyncHandler(async (req, res) => {
  const data = addressSchema.partial().parse(req.body);
  const existing = await prisma.address.findFirst({
    where: { id: req.params.id, userId: req.user.id },
    select: { id: true },
  });
  if (!existing) throw createError('Address not found', 404);

  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId: req.user.id, id: { not: req.params.id } },
      data: { isDefault: false },
    });
  }

  const address = await prisma.address.update({
    where: { id: req.params.id },
    data,
  });
  res.json({ success: true, data: address });
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const deleted = await prisma.address.deleteMany({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (deleted.count === 0) throw createError('Address not found', 404);
  res.json({ success: true, message: 'Address deleted' });
});

export const setDefaultAddress = asyncHandler(async (req, res) => {
  const existing = await prisma.address.findFirst({
    where: { id: req.params.id, userId: req.user.id },
    select: { id: true },
  });
  if (!existing) throw createError('Address not found', 404);

  await prisma.$transaction([
    prisma.address.updateMany({ where: { userId: req.user.id }, data: { isDefault: false } }),
    prisma.address.update({ where: { id: req.params.id }, data: { isDefault: true } }),
  ]);
  res.json({ success: true, message: 'Default address updated' });
});

export const getWishlist = asyncHandler(async (req, res) => {
  const items = await prisma.wishlistItem.findMany({
    where: { userId: req.user.id },
    include: {
      product: {
        include: { images: { where: { isPrimary: true }, take: 1 } },
      },
    },
  });
  res.json({ success: true, data: items });
});

export const addToWishlist = asyncHandler(async (req, res) => {
  await prisma.wishlistItem.upsert({
    where: { userId_productId: { userId: req.user.id, productId: req.params.productId } },
    create: { userId: req.user.id, productId: req.params.productId },
    update: {},
  });
  res.json({ success: true, message: 'Added to wishlist' });
});

export const removeFromWishlist = asyncHandler(async (req, res) => {
  await prisma.wishlistItem.deleteMany({
    where: { userId: req.user.id, productId: req.params.productId },
  });
  res.json({ success: true, message: 'Removed from wishlist' });
});

export const addReview = asyncHandler(async (req, res) => {
  const { productId, rating, title, body } = z.object({
    productId: z.string().uuid(),
    rating: z.number().int().min(1).max(5),
    title: z.string().optional(),
    body: z.string().optional(),
  }).parse(req.body);

  const hasOrdered = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: { userId: req.user.id, status: 'DELIVERED' },
    },
  });

  const review = await prisma.review.upsert({
    where: { userId_productId: { userId: req.user.id, productId } },
    create: { userId: req.user.id, productId, rating, title, body, isVerified: !!hasOrdered },
    update: { rating, title, body },
  });

  res.status(201).json({ success: true, data: review });
});
