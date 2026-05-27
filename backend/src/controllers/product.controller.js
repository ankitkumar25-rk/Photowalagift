import prisma from '../lib/prisma.js';
import { createError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import asyncHandler from '../utils/asyncHandler.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

const imageUrlSchema = z.string().refine((value) => {
  if (typeof value !== 'string' || !value.trim()) return false;
  if (value.startsWith('/uploads/')) return true;
  return z.string().url().safeParse(value).success;
}, 'Invalid URL');

const productSchema = z.object({
  name:          z.string().min(2).max(200),
  slug:          z.string().optional(),
  description:   z.string().optional(),
  shortDesc:     z.string().optional(),
  categoryId:    z.string().uuid(),
  price:         z.coerce.number().positive(),
  mrp:           z.coerce.number().positive(),
  unit:          z.string().default('kg'),
  stock:         z.coerce.number().int().min(0).default(0),
  lowStockAlert: z.coerce.number().int().min(0).default(10),
  sku:           z.string().optional(),
  isFeatured:    z.preprocess((val) => {
    if (val === 'true' || val === true) return true;
    if (val === 'false' || val === false) return false;
    return val;
  }, z.coerce.boolean()).default(false),
  isActive:      z.preprocess((val) => {
    if (val === 'true' || val === true) return true;
    if (val === 'false' || val === false) return false;
    return val;
  }, z.coerce.boolean()).default(true),
  tags:          z.preprocess((val) => (typeof val === 'string' ? val.split(',').map(s => s.trim()).filter(Boolean) : val), z.array(z.string())).default([]),
  certifications: z.preprocess((val) => (typeof val === 'string' ? val.split(',').map(s => s.trim()).filter(Boolean) : val), z.array(z.string())).default([]),
  weight:        z.preprocess((val) => (val === '' || val === undefined || val === null ? null : Number(val)), z.number().nullable().optional()),
  nutritionInfo: z.any().optional(),
  images: z.array(z.object({
    url: imageUrlSchema,
    publicId: z.string().min(1),
    altText: z.string().optional(),
    isPrimary: z.coerce.boolean().optional(),
    sortOrder: z.coerce.number().int().min(0).optional(),
  })).optional(),
});

function generateSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function normalizeUploadUrl(url) {
  if (!url) return url;
  const marker = '/uploads/';
  const idx = url.indexOf(marker);
  if (idx !== -1) return url.slice(idx);
  return url;
}

function normalizeProductMedia(product) {
  if (!product) return product;
  if (!Array.isArray(product.images)) return product;
  return {
    ...product,
    images: product.images.map((img) => ({
      ...img,
      url: normalizeUploadUrl(img.url),
    })),
  };
}

function normalizeOptionalSku(sku) {
  if (typeof sku !== 'string') return sku;
  const trimmed = sku.trim();
  return trimmed.length ? trimmed : undefined;
}

export const listProducts = asyncHandler(async (req, res) => {
  const {
    page = 1, limit = 20,
    category, minPrice, maxPrice,
    isFeatured,
    sort = 'createdAt', order = 'desc',
    tags,
    search,
  } = req.query;

  const where = { isActive: true };
  if (category)   where.category = { slug: category };
  if (isFeatured !== undefined) where.isFeatured = isFeatured === 'true';
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = Number(minPrice);
    if (maxPrice) where.price.lte = Number(maxPrice);
  }
  if (tags) {
    where.tags = { hasSome: tags.split(',') };
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { tags: { hasSome: [search.toLowerCase()] } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { [sort]: order },
      include: {
        category: { select: { name: true, slug: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { reviews: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  res.json({
    success: true,
    data: products.map(normalizeProductMedia),
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});

export const getFeatured = asyncHandler(async (req, res) => {
  const products = await prisma.product.findMany({
    where: { isFeatured: true, isActive: true },
    take: 8,
    include: {
      category: { select: { name: true, slug: true } },
      images: { orderBy: { sortOrder: 'asc' } },
    },
  });
  res.json({ success: true, data: products.map(normalizeProductMedia) });
});

export const searchProducts = asyncHandler(async (req, res) => {
  const { q, limit = 10 } = req.query;
  if (!q || q.length < 2) return res.json({ success: true, data: [] });

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { tags: { hasSome: [q.toLowerCase()] } },
      ],
    },
    take: Number(limit),
    include: { images: { orderBy: { sortOrder: 'asc' } } },
  });
  res.json({ success: true, data: products.map(normalizeProductMedia) });
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { slug: req.params.slug },
    include: {
      category: true,
      images: { orderBy: { sortOrder: 'asc' } },
      reviews: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, avatarUrl: true } } },
      },
      _count: { select: { reviews: true } },
    },
  });
  if (!product || !product.isActive) throw createError('Product not found', 404);
  res.json({ success: true, data: normalizeProductMedia(product) });
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: {
      category: true,
      images: { orderBy: { sortOrder: 'asc' } },
      reviews: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, avatarUrl: true } } },
      },
      _count: { select: { reviews: true } },
    },
  });
  if (!product) throw createError('Product not found', 404);
  res.json({ success: true, data: normalizeProductMedia(product) });
});

export const createProduct = asyncHandler(async (req, res) => {
  const data = productSchema.parse(req.body);
  if (!data.slug) data.slug = generateSlug(data.name);
  data.sku = normalizeOptionalSku(data.sku);

  let images = [];
  if (req.body.imagesData) {
    try {
      images = JSON.parse(req.body.imagesData);
    } catch (e) {
      console.error('Failed to parse imagesData:', e);
    }
  }

  // Handle file uploads if present
  if (req.files && req.files.length > 0) {
    const uploaded = await Promise.all(
      req.files.slice(0, 3).map((file) => uploadToCloudinary(file.buffer, { folder: 'manufact/products' }))
    );
    uploaded.forEach((item, idx) => {
      images.push({
        url: item.secure_url,
        publicId: item.public_id,
        altText: data.name,
        isPrimary: images.length === 0 && idx === 0,
        sortOrder: images.length + idx,
      });
    });
  }

  const normalizedImages = images.map((img, idx) => ({
    url: img.url,
    publicId: img.publicId,
    altText: img.altText || data.name,
    isPrimary: idx === 0 ? true : Boolean(img.isPrimary),
    sortOrder: img.sortOrder ?? idx,
  }));

  const product = await prisma.product.create({
    data: {
      ...data,
      images: normalizedImages.length ? { create: normalizedImages.slice(0, 3) } : undefined,
    },
    include: { images: true },
  });
  res.status(201).json({ success: true, data: normalizeProductMedia(product) });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const data = productSchema.partial().parse(req.body);

  const normalizedSku = normalizeOptionalSku(data.sku);
  if (normalizedSku === undefined) {
    delete data.sku;
  } else {
    data.sku = normalizedSku;
  }

  let images = [];
  if (req.body.imagesData) {
    try {
      images = JSON.parse(req.body.imagesData);
    } catch (e) {
      console.error('Failed to parse imagesData:', e);
    }
  }

  // Handle file uploads if present
  if (req.files && req.files.length > 0) {
    const uploaded = await Promise.all(
      req.files.slice(0, 3).map((file) => uploadToCloudinary(file.buffer, { folder: 'manufact/products' }))
    );
    uploaded.forEach((item, idx) => {
      images.push({
        url: item.secure_url,
        publicId: item.public_id,
        altText: data.name || 'Product Image',
        isPrimary: images.length === 0 && idx === 0,
        sortOrder: images.length + idx,
      });
    });
  }

  const normalizedImages = images.map((img, idx) => ({
    url: img.url,
    publicId: img.publicId,
    altText: img.altText || data.name || 'Product Image',
    isPrimary: idx === 0 ? true : Boolean(img.isPrimary),
    sortOrder: img.sortOrder ?? idx,
  }));

  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: {
      ...data,
      images: normalizedImages.length > 0
        ? {
            deleteMany: {},
            create: normalizedImages.slice(0, 3),
          }
        : undefined,
    },
    include: { images: true },
  });
  res.json({ success: true, data: normalizeProductMedia(product) });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  await prisma.product.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });
  res.json({ success: true, message: 'Product deactivated' });
});

export const updateStock = asyncHandler(async (req, res) => {
  const { stock } = z.object({ stock: z.number().int().min(0) }).parse(req.body);
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: { stock },
  });
  res.json({ success: true, data: product });
});
