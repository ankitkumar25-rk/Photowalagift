import axios from 'axios';

const BASE_URL = process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in';
const EMAIL = process.env.SHIPROCKET_EMAIL;
const PASSWORD = process.env.SHIPROCKET_PASSWORD;
const PICKUP_LOCATION = process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary';
const ORIGIN_PINCODE = process.env.SHIPROCKET_ORIGIN_PINCODE || '333012';

let cachedToken = null;
let tokenExpiry = null;

// ─── Authentication ──────────────────────────────────────────────────────────

export const login = async () => {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    console.log('[Shiprocket] Using cached authentication token');
    return cachedToken;
  }

  console.log('[Shiprocket] Requesting login token at:', `${BASE_URL}/v1/external/auth/login`);
  
  if (!EMAIL || !PASSWORD) {
    throw new Error('[Shiprocket] Missing SHIPROCKET_EMAIL or SHIPROCKET_PASSWORD environment variables');
  }

  try {
    const { data } = await axios.post(
      `${BASE_URL}/v1/external/auth/login`,
      {
        email: EMAIL,
        password: PASSWORD,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    cachedToken = data?.token || null;
    tokenExpiry = Date.now() + 9 * 24 * 60 * 60 * 1000; // 9 days (valid for 10 days)
    console.log('[Shiprocket] Token refreshed successfully. Cached token set.');
    return cachedToken;
  } catch (err) {
    console.error('[Shiprocket] Token request failed:', err.message);
    if (err.response) {
      console.error('[Shiprocket] Error Response:', JSON.stringify(err.response.data, null, 2));
    }
    throw err;
  }
};

export const getToken = login;

// ─── Internal Request Helper ──────────────────────────────────────────────────

const request = async (method, path, payload = {}, params = {}) => {
  const token = await login();

  const headers = {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${token}`,
  };

  try {
    const { data } = await axios({ 
      method, 
      url: `${BASE_URL}${path}`, 
      headers, 
      data: payload,
      params 
    });
    return data;
  } catch (err) {
    const errData = err.response?.data;
    console.error(`[Shiprocket] ${method.toUpperCase()} ${path} failed:`, err.message);
    if (errData) console.error('[Shiprocket] Error Response:', JSON.stringify(errData, null, 2));
    throw err;
  }
};

// ─── Rates ────────────────────────────────────────────────────────────────────

export const getRates = async ({
  destinationPincode,
  weightKg = 1,
  lengthCm = 10,
  breadthCm = 10,
  heightCm = 10,
  isCOD = false,
  codAmount = 0,
  invoiceValue,
}) => {
  const params = {
    pickup_postcode:   Number(ORIGIN_PINCODE),
    delivery_postcode: Number(destinationPincode),
    weight:            String(weightKg),
    cod:               isCOD ? 1 : 0,
    declared_value:    Number(invoiceValue || codAmount || 0),
    length:            Number(lengthCm),
    breadth:           Number(breadthCm),
    height:            Number(heightCm),
  };

  console.log('[Shiprocket] Checking courier serviceability with params:', JSON.stringify(params));
  const data = await request('get', '/v1/external/courier/serviceability/', {}, params);
  
  const couriers = data?.data?.available_courier_companies || [];
  console.log('[Shiprocket] Serviceability result. Options found:', couriers.length);

  const rateOptions = couriers.map((c) => {
    // Calculate dynamic estimated transit days (TAT) from EDD string
    let tat = '3';
    if (c.etd) {
      const etdDate = new Date(c.etd);
      const diffTime = etdDate.getTime() - Date.now();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      tat = diffDays > 0 ? String(diffDays) : '3';
    }
    
    return {
      success: true,
      lspId: c.courier_name,
      service: String(c.courier_company_id), // Passed back as courier ID
      tat,
      rateSummary: {
        total: Number(c.rate || c.shipping_cost || 0),
      },
    };
  });

  return { rateOptions };
};

export const getShippingRates = getRates;

// ─── Order ────────────────────────────────────────────────────────────────────

export const createOrder = async (orderData) => {
  // Parse names cleanly
  const names = String(orderData.customerName || 'Customer').trim().split(/\s+/);
  const firstName = names[0] || 'Customer';
  const lastName = names.slice(1).join(' ') || '.';
  
  // Clean up phone number to exactly 10 digits
  let phone = String(orderData.customerPhone || '9999999999').replace(/\D/g, '');
  if (phone.length !== 10) phone = '9999999999';

  // Format order date (yyyy-mm-dd HH:mm)
  const now = new Date();
  const formatDigit = (num) => String(num).padStart(2, '0');
  const orderDate = `${now.getFullYear()}-${formatDigit(now.getMonth() + 1)}-${formatDigit(now.getDate())} ${formatDigit(now.getHours())}:${formatDigit(now.getMinutes())}`;

  // Map order items safely
  const orderItems = (orderData.items || []).map((item, idx) => ({
    name: item.name || 'Custom Product',
    sku: item.sku || `SKU-${idx}-${Date.now().toString(36).toUpperCase()}`,
    units: Number(item.qty || 1),
    selling_price: Number(item.price || 0),
    discount: 0,
    tax: 0,
  }));

  if (orderItems.length === 0) {
    orderItems.push({
      name: 'Custom Printed Gift',
      sku: 'GIFT-DEFAULT',
      units: 1,
      selling_price: Number(orderData.invoiceValue || 0),
      discount: 0,
      tax: 0,
    });
  }

  const payload = {
    order_id:            orderData.referenceId || `ORD-${Date.now()}`,
    order_date:          orderDate,
    pickup_location:     PICKUP_LOCATION,
    billing_customer_name: firstName,
    billing_last_name:   lastName,
    billing_address:     orderData.deliveryAddress || '.',
    billing_city:        orderData.deliveryCity || '.',
    billing_pincode:     Number(orderData.deliveryPincode || ORIGIN_PINCODE),
    billing_state:       orderData.deliveryState || '.',
    billing_country:     'India',
    billing_email:       orderData.customerEmail || 'customer@photowala.in',
    billing_phone:       phone,
    shipping_is_billing: 1,
    order_items:         orderItems,
    payment_method:      orderData.isCOD ? 'COD' : 'Prepaid',
    sub_total:           Number(orderData.invoiceValue || 0),
    length:              10,
    breadth:             10,
    height:              10,
    weight:              Number(orderData.weightKg || 1),
  };

  console.log('[Shiprocket] Creating shipment order with payload:', JSON.stringify(payload, null, 2));
  const data = await request('post', '/v1/external/orders/create/adhoc', payload);
  console.log('[Shiprocket] Shipment order creation success:', JSON.stringify(data, null, 2));

  // Create composite ID (shipment_id:order_id)
  const shipmentId = data?.shipment_id || '';
  const orderId = data?.order_id || '';
  const compositeUuid = shipmentId && orderId ? `${shipmentId}:${orderId}` : String(shipmentId || orderId);

  return {
    uuid: compositeUuid,
    id: compositeUuid,
    success: true,
    data,
  };
};

export const createShipmentOrder = createOrder;

export const cancelShipmentOrder = async (uuid) => {
  const [, orderId] = String(uuid).split(':');
  if (!orderId) {
    console.warn('[Shiprocket] No Shiprocket order ID present in composite UUID. Skipping cancellation.');
    return { success: true, message: 'No Order ID present, skipped cancellation API.' };
  }

  const payload = {
    ids: [Number(orderId)],
  };

  console.log('[Shiprocket] Cancelling shipment order. Order ID:', orderId);
  const data = await request('post', '/v1/external/orders/cancel', payload);
  console.log('[Shiprocket] Cancel success:', JSON.stringify(data, null, 2));
  return data;
};

// ─── Courier & Pickup ─────────────────────────────────────────────────────────

export const assignCourier = async ({ uuid, lspId, service }) => {
  const [shipmentId] = String(uuid).split(':');
  const payload = {
    shipment_id: Number(shipmentId),
    courier_id:  Number(service),
  };

  console.log('[Shiprocket] Assigning courier. Shipment ID:', shipmentId, '| Courier ID:', service);
  const data = await request('post', '/v1/external/courier/assign/awb', payload);
  console.log('[Shiprocket] Courier assign success:', JSON.stringify(data, null, 2));
  
  return {
    success: true,
    awb: data?.response?.data?.awb_code || data?.awb_code || null,
    courierName: data?.response?.data?.courier_name || data?.courier_name || null,
    data,
  };
};

export const createPickup = async ({ uuid, warehouseId }) => {
  const [shipmentId] = String(uuid).split(':');
  const payload = {
    shipment_id: [Number(shipmentId)],
  };

  console.log('[Shiprocket] Creating pickup. Shipment ID:', shipmentId);
  const data = await request('post', '/v1/external/courier/generate/pickup', payload);
  console.log('[Shiprocket] Pickup creation success:', JSON.stringify(data, null, 2));
  return data;
};

// ─── Label ────────────────────────────────────────────────────────────────────

export const getPackingSlip = async (uuid) => {
  const [shipmentId] = String(uuid).split(':');
  const payload = {
    shipment_id: [Number(shipmentId)],
  };

  console.log('[Shiprocket] Fetching label (packing slip). Shipment ID:', shipmentId);
  const data = await request('post', '/v1/external/courier/generate/label', payload);
  console.log('[Shiprocket] Label response success:', JSON.stringify(data, null, 2));
  
  return {
    success: true,
    url: data?.label_url || data?.url || null,
    data,
  };
};

// ─── Tracking ─────────────────────────────────────────────────────────────────

export const track = async ({ awb, refId } = {}) => {
  if (!awb) {
    throw new Error('[Shiprocket] AWB number is required for tracking');
  }

  console.log('[Shiprocket] Tracking shipment. AWB:', awb);
  const data = await request('get', `/v1/external/courier/track/awb/${awb}`);
  console.log('[Shiprocket] Tracking success:', JSON.stringify(data, null, 2));

  const trackInfo = data?.tracking_data?.shipment_track?.[0];
  const status = trackInfo?.current_status || 'PENDING';

  return {
    success: true,
    status: String(status).toUpperCase(),
    current_status: status,
    etd: trackInfo?.edd || null,
    activities: data?.tracking_data?.shipment_track_activities || [],
    data,
  };
};

export const trackShipment = track;
