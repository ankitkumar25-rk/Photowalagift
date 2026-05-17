import prisma from '../lib/prisma.js';
import { createError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import asyncHandler from '../utils/asyncHandler.js';

export const listCategories = asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({
    where: { isActive: true, parentId: null },
    orderBy: { sortOrder: 'asc' },
    include: {
      children: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      _count: { select: { products: { where: { isActive: true } } } },
    },
  });
  res.json({ success: true, data: categories });
});

export const getCategory = asyncHandler(async (req, res) => {
  const category = await prisma.category.findUnique({
    where: { slug: req.params.slug },
    include: {
      children: true,
      products: {
        where: { isActive: true },
        take: 20,
        include: { images: { where: { isPrimary: true }, take: 1 } },
      },
    },
  });
  if (!category) throw createError('Category not found', 404);
  res.json({ success: true, data: category });
});

const categorySchema = z.object({
  name:        z.string().min(2).max(100),
  slug:        z.string().optional(),
  description: z.string().optional(),
  imageUrl:    z.string().url().optional(),
  parentId:    z.string().uuid().optional(),
  sortOrder:   z.number().int().default(0),
});

export const createCategory = asyncHandler(async (req, res) => {
  const data = categorySchema.parse(req.body);
  if (!data.slug) data.slug = data.name.toLowerCase().replace(/\s+/g, '-');
  const category = await prisma.category.create({ data });
  res.status(201).json({ success: true, data: category });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const data = categorySchema.partial().parse(req.body);
  const category = await prisma.category.update({ where: { id: req.params.id }, data });
  res.json({ success: true, data: category });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  await prisma.category.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });
  res.json({ success: true, message: 'Category deactivated' });
});
