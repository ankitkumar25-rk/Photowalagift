import axios from 'axios';

const BASE_URL = process.env.SHIPINGTECH_BASE_URL;
const API_KEY  = process.env.SHIPINGTECH_API_KEY;

let cachedToken  = null;
let tokenExpiry  = null;

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const login = async () => {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    console.log('[ShipingTech] Using cached authentication token');
    return cachedToken;
  }

  console.log('[ShipingTech] Requesting login token at:', `${BASE_URL}/customer_api/login`);
  console.log('[ShipingTech] Credentials - API_KEY exists:', !!API_KEY, '| Username:', process.env.SHIPINGTECH_USERNAME);

  try {
    const { data } = await axios.post(
      `${BASE_URL}/customer_api/login`,
      {
        username: process.env.SHIPINGTECH_USERNAME,
        password: process.env.SHIPINGTECH_PASSWORD,
      },
      {
        headers: {
          'x-api-key':    API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    cachedToken = data?.accessToken || data?.token || null;
    tokenExpiry = Date.now() + 23 * 60 * 60 * 1000; // 23 hours
    console.log('[ShipingTech] Token refreshed successfully. Cached token set.');
    return cachedToken;
  } catch (err) {
    console.error('[ShipingTech] Token request failed:', err.message);
    if (err.response) {
      console.error('[ShipingTech] Error Response Data:', JSON.stringify(err.response.data, null, 2));
      console.error('[ShipingTech] Error Response Status:', err.response.status);
    }
    throw err;
  }
};

export const getToken = login;

// ─── Internal helper ──────────────────────────────────────────────────────────
// Headers are built fresh on every request so API_KEY is always defined.
// NO Origin, NO Referer, NO tenant_id — server-to-server only.

const request = async (method, path, payload = {}) => {
  const token = await login();

  const headers = {
    'x-api-key':     API_KEY,
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${token}`,
  };

  try {
    const { data } = await axios({ method, url: `${BASE_URL}${path}`, headers, data: payload });
    return data;
  } catch (err) {
    const errData = err.response?.data;
    console.error(`[ShipingTech] ${method.toUpperCase()} ${path} failed:`, err.message);
    if (errData) console.error('[ShipingTech] Error Response Data:', JSON.stringify(errData, null, 2));
    throw err;
  }
};

const post = (path, payload) => request('post', path, payload);

// ─── Warehouse ────────────────────────────────────────────────────────────────

export const createWarehouse = async (warehouseData) => {
  console.log('[ShipingTech] Creating warehouse:', JSON.stringify(warehouseData, null, 2));
  const data = await post('/customer_api/warehouse', warehouseData);
  console.log('[ShipingTech] Warehouse creation success:', JSON.stringify(data, null, 2));
  return data;
};

export const getWarehouses = async () => {
  console.log('[ShipingTech] Fetching warehouses');
  const data = await post('/customer_api/warehouses');
  console.log('[ShipingTech] Warehouses fetched successfully');
  return data;
};

// ─── Rates ────────────────────────────────────────────────────────────────────

export const getRates = async ({
  destinationPincode,
  weightKg,
  lengthCm = 10,
  breadthCm = 10,
  heightCm = 10,
  isCOD = false,
  codAmount = 0,
  invoiceValue,
}) => {
  const payload = {
    booking_code:       Number(process.env.SHIPINGTECH_BOOKING_CODE),
    originPincode:      process.env.SHIPINGTECH_ORIGIN_PINCODE,
    destinationPincode: String(destinationPincode),
    serviceCategory:    'b2c',
    riskType:           'ownerRisk',
    isGSTinclusiv:      true,
    isCOD,
    selfDrop:           false,
    codAmount:          isCOD ? codAmount : '',
    invoiceValue,
    weightDetailsArray: [
      {
        weightKg:  String(weightKg),
        lengthCm:  String(lengthCm),
        breadthCm: String(breadthCm),
        heightCm:  String(heightCm),
        quantity:  '1',
      },
    ],
  };

  console.log('[ShipingTech] Fetching shipping rates with payload:', JSON.stringify(payload, null, 2));
  const data = await post('/customer_api/rates', payload);
  console.log('[ShipingTech] Rates fetched success. Options found:', data?.rateOptions?.length || 0);
  return data;
};

export const getShippingRates = getRates;

// ─── Order ────────────────────────────────────────────────────────────────────

export const createOrder = async (orderData) => {
  console.log('[ShipingTech] Creating shipment order with payload:', JSON.stringify(orderData, null, 2));
  const data = await post('/customer_api/order', orderData);
  console.log('[ShipingTech] Shipment order creation success:', JSON.stringify(data, null, 2));
  return data;
};

export const createShipmentOrder = createOrder;

export const getOrderByUUID = async (uuid) => {
  console.log('[ShipingTech] Getting order by UUID:', uuid);
  const data = await post('/customer_api/order/get', { uuid });
  console.log('[ShipingTech] Order retrieval success:', JSON.stringify(data, null, 2));
  return data;
};

export const cancelShipmentOrder = async (uuid) => {
  console.log('[ShipingTech] Cancelling shipment order UUID:', uuid);
  const data = await post('/customer_api/order/cancel', { uuid });
  console.log('[ShipingTech] Cancel success:', JSON.stringify(data, null, 2));
  return data;
};

// ─── Courier & Pickup ─────────────────────────────────────────────────────────

export const assignCourier = async ({ uuid, lspId, service }) => {
  console.log('[ShipingTech] Assigning courier. UUID:', uuid, '| LSP:', lspId, '| Service:', service);
  const data = await post('/customer_api/order/assign', { uuid, lspId, service });
  console.log('[ShipingTech] Courier assign success:', JSON.stringify(data, null, 2));
  return data;
};

export const createPickup = async ({ uuid, warehouseId }) => {
  console.log('[ShipingTech] Creating pickup. UUID:', uuid, '| Warehouse ID:', warehouseId);
  const data = await post('/customer_api/pickup', { uuid, warehouseId });
  console.log('[ShipingTech] Pickup creation success:', JSON.stringify(data, null, 2));
  return data;
};

// ─── Packing Slip ─────────────────────────────────────────────────────────────

export const getPackingSlip = async (uuid) => {
  console.log('[ShipingTech] Fetching packing slip. UUID:', uuid);
  const data = await post('/customer_api/packingslip', { uuid });
  console.log('[ShipingTech] Packing slip success:', JSON.stringify(data, null, 2));
  return data;
};

// ─── Tracking ─────────────────────────────────────────────────────────────────

export const track = async ({ awb, refId } = {}) => {
  const params = new URLSearchParams();
  if (awb)   params.append('awbs',    awb);
  if (refId) params.append('ref_ids', refId);
  console.log('[ShipingTech] Tracking shipment. Params:', params.toString());
  const data = await post(`/customer_api/order/track?${params.toString()}`);
  console.log('[ShipingTech] Tracking success:', JSON.stringify(data, null, 2));
  return data;
};

export const trackShipment = track;