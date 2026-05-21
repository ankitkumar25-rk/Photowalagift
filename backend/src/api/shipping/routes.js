import express from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import * as ShippingController from '../../controllers/shipping.controller.js';

const router = express.Router();

router.post('/rates', authenticate, ShippingController.getShippingRates);
router.get('/track/:orderId', authenticate, ShippingController.trackShipment);

const adminOnly = [authenticate, requireRole(['ADMIN', 'SUPER_ADMIN'])];

router.get('/health', ...adminOnly, ShippingController.shippingHealth);
router.post('/create', ...adminOnly, ShippingController.createShipment);
router.post('/assign-courier', ...adminOnly, ShippingController.assignCourier);
router.post('/schedule-pickup', ...adminOnly, ShippingController.schedulePickup);
router.get('/packing-slip/:orderId', ...adminOnly, ShippingController.getPackingSlip);
router.get('/rates/:orderId', ...adminOnly, ShippingController.getRatesForOrder);

export default router;
