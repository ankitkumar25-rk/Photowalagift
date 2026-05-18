import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as serviceOrderController from '../controllers/serviceOrder.controller.js';

const router = express.Router();

const isAdmin = authorize('ADMIN', 'SUPER_ADMIN');

// Customer routes
router.post('/',                authenticate, serviceOrderController.createServiceOrder);
router.get('/my',               authenticate, serviceOrderController.getMyServiceOrders);
router.get('/:id',              authenticate, serviceOrderController.getServiceOrderDetail);
router.delete('/:id',           authenticate, serviceOrderController.cancelServiceOrder);

// Admin routes
router.get('/admin/all',        authenticate, isAdmin, serviceOrderController.getAllServiceOrders);
router.patch('/admin/:id/status', authenticate, isAdmin, serviceOrderController.updateServiceOrderStatus);
router.patch('/admin/:id/tracking', authenticate, isAdmin, serviceOrderController.updateTrackingNumber);
router.delete('/admin/:id',      authenticate, isAdmin, serviceOrderController.deleteServiceOrder);

export default router;
