import express from 'express';
import { authenticate, optionalAuth, authorize } from '../middleware/auth.js';
import * as orderController from '../controllers/order.controller.js';

const router = express.Router();

const isAdmin = authorize('ADMIN', 'SUPER_ADMIN');

// Customer routes
router.post('/',            optionalAuth, orderController.createOrder);
router.get('/',             authenticate, orderController.getUserOrders);
router.post('/pen/laser',   authenticate, orderController.createLaserPenOrder);

// Admin routes
router.get('/admin/all',        authenticate, isAdmin, orderController.getAllOrders);
router.patch('/:id/status',     authenticate, isAdmin, orderController.updateOrderStatus);
router.patch('/:id/tracking',   authenticate, isAdmin, orderController.updateTracking);
router.patch('/admin/:id/cancel', authenticate, isAdmin, orderController.adminCancelOrder);

router.get('/:id',          optionalAuth, orderController.getOrder);
router.post('/:id/cancel',  optionalAuth, orderController.cancelOrder);

export default router;
