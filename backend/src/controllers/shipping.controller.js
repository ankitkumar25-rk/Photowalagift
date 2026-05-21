import * as ShipingTech from '../services/shipingtech.service.js';
import prisma from '../lib/prisma.js';
import { createError } from '../middleware/errorHandler.js';

export const getShippingRates = async (req, res) => {
  try {
    const {
      destinationPincode,
      weightKg = 1,
      isCOD = false,
      codAmount,
      invoiceValue,
    } = req.body;

    if (!destinationPincode) {
      return res.status(400).json({ message: 'destinationPincode is required' });
    }

    const rates = await ShipingTech.getShippingRates({
      destinationPincode,
      weightKg,
      isCOD,
      codAmount,
      invoiceValue,
    });

    const sorted = (rates?.rateOptions || [])
      .filter((rate) => rate.success)
      .sort((a, b) => a.rateSummary.total - b.rateSummary.total);

    return res.status(200).json({ success: true, rates: sorted });
  } catch (err) {
    console.error('[Shipping] getShippingRates error:', err.message);
    return res.status(200).json({ success: false, rates: [] });
  }
};

export const shippingHealth = async (req, res) => {
  try {
    const token = await ShipingTech.getToken();
    const ok = Boolean(token);
    return res.status(200).json({ success: ok, status: ok ? 'ok' : 'error' });
  } catch (err) {
    console.error('[Shipping] health error:', err.message);
    return res.status(200).json({ success: false, status: 'error' });
  }
};

export const createShipment = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        address: true,
        items: { include: { product: true } },
      },
    });

    if (!order) {
      return next(createError('Order not found', 404));
    }

    if (!order.address) {
      return next(createError('Order address missing', 400));
    }

    const shipmentPayload = {
      booking_code: Number(process.env.SHIPINGTECH_BOOKING_CODE),
      customerName: order.user?.name || order.address.fullName,
      customerPhone: order.address.phone || order.user?.phone || '',
      customerEmail: order.user?.email,
      deliveryAddress: order.address.line1,
      deliveryCity: order.address.city,
      deliveryState: order.address.state,
      deliveryPincode: order.address.pincode,
      deliveryCountry: 'India',
      invoiceValue: Number(order.total),
      isCOD: order.paymentMethod === 'COD',
      codAmount: order.paymentMethod === 'COD' ? Number(order.total) : 0,
      items: order.items.map((item) => ({
        name: item.product?.name || item.productName,
        qty: item.quantity,
        price: Number(item.price),
      })),
      weightKg: 1,
      referenceId: order.id,
    };

    const shipmentResult = await ShipingTech.createShipmentOrder(shipmentPayload);

    await prisma.order.update({
      where: { id: orderId },
      data: {
        shipingTechUUID: shipmentResult?.uuid || shipmentResult?.id || null,
        shippingStatus: 'PENDING',
      },
    });

    return res.status(200).json({ success: true, shipment: shipmentResult });
  } catch (err) {
    return next(err);
  }
};

export const assignCourier = async (req, res, next) => {
  try {
    const { orderId, lspId, service, shippingCharge } = req.body;
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order?.shipingTechUUID) {
      return next(createError('Shipment not created yet', 400));
    }

    const result = await ShipingTech.assignCourier({
      uuid: order.shipingTechUUID,
      lspId,
      service,
    });

    await prisma.order.update({
      where: { id: orderId },
      data: {
        courierName: lspId,
        courierService: service,
        shippingCharge: Number(shippingCharge || 0),
        awbNumber: result?.awb || result?.awbNumber || null,
        shippingStatus: 'ASSIGNED',
      },
    });

    return res.status(200).json({ success: true, result });
  } catch (err) {
    return next(err);
  }
};

export const schedulePickup = async (req, res, next) => {
  try {
    const { orderId, warehouseId } = req.body;
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order?.shipingTechUUID) {
      return next(createError('Shipment not created yet', 400));
    }

    const result = await ShipingTech.createPickup({
      uuid: order.shipingTechUUID,
      warehouseId,
    });

    await prisma.order.update({
      where: { id: orderId },
      data: {
        pickupScheduled: true,
        pickupDate: new Date(),
        shippingStatus: 'PICKUP_SCHEDULED',
        warehouseId: warehouseId || order.warehouseId,
      },
    });

    return res.status(200).json({ success: true, result });
  } catch (err) {
    return next(err);
  }
};

export const getPackingSlip = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order?.shipingTechUUID) {
      return next(createError('Shipment not created yet', 400));
    }

    const result = await ShipingTech.getPackingSlip(order.shipingTechUUID);

    if (result?.url) {
      await prisma.order.update({
        where: { id: orderId },
        data: { packingSlipUrl: result.url },
      });
    }

    return res.status(200).json({ success: true, packingSlip: result });
  } catch (err) {
    return next(err);
  }
};

export const trackShipment = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) {
      return next(createError('Order not found', 404));
    }

    const result = await ShipingTech.trackShipment({
      awb: order.awbNumber,
      refId: order.id,
    });

    if (result?.status) {
      await prisma.order.update({
        where: { id: orderId },
        data: { shippingStatus: String(result.status).toUpperCase() },
      });
    }

    return res.status(200).json({
      success: true,
      tracking: result,
      order: {
        id: order.id,
        awbNumber: order.awbNumber,
        courierName: order.courierName,
        courierService: order.courierService,
        shippingStatus: order.shippingStatus,
      },
    });
  } catch (err) {
    return next(err);
  }
};

export const getRatesForOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { address: true },
    });

    if (!order || !order.address) {
      return next(createError('Order not found', 404));
    }

    const rates = await ShipingTech.getShippingRates({
      destinationPincode: order.address.pincode,
      weightKg: 1,
      isCOD: order.paymentMethod === 'COD',
      codAmount: order.paymentMethod === 'COD' ? Number(order.total) : 0,
      invoiceValue: Number(order.total),
    });

    const sorted = (rates?.rateOptions || [])
      .filter((rate) => rate.success)
      .sort((a, b) => a.rateSummary.total - b.rateSummary.total);

    return res.status(200).json({ success: true, rates: sorted });
  } catch (err) {
    return next(err);
  }
};
