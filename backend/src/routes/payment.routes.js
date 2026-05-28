import express from 'express';
import * as paymentController from '../controllers/payment.controller.js';
import { authenticate, optionalAuth, authorize } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';

const router = express.Router();

// Customer routes
router.post('/create-order', optionalAuth, requireCsrf, paymentController.createRazorpayOrder);
router.post('/verify',       optionalAuth, requireCsrf, paymentController.verifyPayment);
router.post('/cod',          optionalAuth, requireCsrf, paymentController.confirmCOD);

// Admin route for processing refunds
router.post('/refund', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), requireCsrf, paymentController.processRefund);

export default router;
