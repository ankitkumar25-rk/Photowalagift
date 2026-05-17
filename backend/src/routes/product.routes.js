import express from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../middleware/auth.js';
import * as productController from '../controllers/product.controller.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

// UUID regex for route disambiguation
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Public routes
router.get('/',          productController.listProducts);
router.get('/featured',  productController.getFeatured);
router.get('/search',    productController.searchProducts);
router.get('/id/:id',    authenticate, authorize('ADMIN', 'SUPER_ADMIN'), productController.getProductById);

// Public: resolve by slug OR UUID  (must come AFTER /featured, /search, /id/:id)
router.get('/:slugOrId', (req, res, next) => {
  if (UUID_RE.test(req.params.slugOrId)) {
    // Treat as ID lookup
    req.params.id = req.params.slugOrId;
    return productController.getProductById(req, res, next);
  }
  // Treat as slug lookup
  req.params.slug = req.params.slugOrId;
  return productController.getProduct(req, res, next);
});

// Admin only
router.post('/',            authenticate, authorize('ADMIN', 'SUPER_ADMIN'), upload.array('images', 3), productController.createProduct);
router.put('/:id',          authenticate, authorize('ADMIN', 'SUPER_ADMIN'), upload.array('images', 3), productController.updateProduct);
router.delete('/:id',       authenticate, authorize('ADMIN', 'SUPER_ADMIN'), productController.deleteProduct);
router.patch('/:id/stock',  authenticate, authorize('ADMIN', 'SUPER_ADMIN'), productController.updateStock);

export default router;
