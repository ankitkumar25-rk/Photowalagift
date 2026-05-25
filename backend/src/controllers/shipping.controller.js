import * as ShipingTech from '../services/shiprocket.service.js';
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
    console.log('[Shipping] Initiating Shiprocket integration health check...');
    const token = await ShipingTech.getToken();
    const ok = Boolean(token);
    console.log('[Shipping] Health check result:', ok ? 'SUCCESS' : 'FAILED');
    return res.status(200).json({ success: ok, status: ok ? 'ok' : 'error' });
  } catch (err) {
    console.error('[Shipping] Health check encountered error:', err.message);
    if (err.response) {
      console.error('[Shipping] API Response Error Data:', JSON.stringify(err.response.data, null, 2));
    }
    return res.status(200).json({ 
      success: false, 
      status: 'error', 
      message: err.message, 
      details: err.response?.data || null 
    });
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

export const webhookCallback = async (req, res) => {
  try {
    const webhookToken = process.env.SHIPROCKET_WEBHOOK_TOKEN;
    const apiKey = req.headers['x-api-key'] || req.headers['anx-api-key'] || req.headers['x-api-token'];
    
    if (webhookToken && apiKey !== webhookToken) {
      console.warn('[Shipping Webhook] Unauthorized attempt. Given token:', apiKey);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { order_id, awb, current_status } = req.body;
    console.log(`[Shipping Webhook] Received tracking update for Order: ${order_id}, AWB: ${awb}, Status: ${current_status}`);

    if (!order_id && !awb) {
      return res.status(200).json({ success: false, message: 'No identifying keys present' });
    }

    // Search order by order_id (custom channel order id) or AWB number
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id: order_id || undefined },
          { awbNumber: awb || undefined }
        ].filter((o) => o !== undefined)
      }
    });

    if (!order) {
      console.warn('[Shipping Webhook] Order not found for:', { order_id, awb });
      return res.status(200).json({ success: false, message: 'Order not found' });
    }

    // Update order details
    await prisma.order.update({
      where: { id: order.id },
      data: {
        shippingStatus: current_status ? String(current_status).toUpperCase().replace(/\s+/g, '_') : order.shippingStatus,
        awbNumber: awb || order.awbNumber,
      }
    });

    console.log(`[Shipping Webhook] Order ${order.id} status updated to:`, current_status);
    return res.status(200).json({ success: true, message: 'Order status updated' });
  } catch (err) {
    console.error('[Shipping Webhook] Error processing webhook:', err.message);
    return res.status(200).json({ success: false, error: err.message });
  }
};
