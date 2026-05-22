import axios from 'axios';

const BASE_URL = process.env.SHIPINGTECH_BASE_URL;
const API_KEY = process.env.SHIPINGTECH_API_KEY;

let cachedToken = null;
let tokenExpiry = null;

const shipClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json',
  },
});

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
          'x-api-key': API_KEY,
          'Content-Type': 'application/json',
        } 
      }
    );

    cachedToken = data?.accessToken || data?.token || null;
    tokenExpiry = Date.now() + 23 * 60 * 60 * 1000;
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

shipClient.interceptors.request.use(async (config) => {
  const token = await login();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Set clean server-to-server headers only
  config.headers['x-api-key'] = API_KEY;
  config.headers['Content-Type'] = 'application/json';

  return config;
});

export const createWarehouse = async (warehouseData) => {
  console.log('[ShipingTech] Creating warehouse:', JSON.stringify(warehouseData, null, 2));
  try {
    const { data } = await shipClient.post('/customer_api/warehouse', warehouseData);
    console.log('[ShipingTech] Warehouse creation success:', JSON.stringify(data, null, 2));
    return data;
  } catch (err) {
    console.error('[ShipingTech] Warehouse creation failed:', err.message);
    if (err.response) {
      console.error('[ShipingTech] Error Response Data:', JSON.stringify(err.response.data, null, 2));
    }
    throw err;
  }
};

export const getWarehouses = async () => {
  console.log('[ShipingTech] Fetching warehouses');
  try {
    const { data } = await shipClient.post('/customer_api/warehouses');
    console.log('[ShipingTech] Warehouses fetched successfully');
    return data;
  } catch (err) {
    console.error('[ShipingTech] Warehouse fetch failed:', err.message);
    if (err.response) {
      console.error('[ShipingTech] Error Response Data:', JSON.stringify(err.response.data, null, 2));
    }
    throw err;
  }
};

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
    booking_code: Number(process.env.SHIPINGTECH_BOOKING_CODE),
    originPincode: process.env.SHIPINGTECH_ORIGIN_PINCODE,
    destinationPincode: String(destinationPincode),
    serviceCategory: 'b2c',
    riskType: 'ownerRisk',
    isGSTinclusiv: true,
    isCOD,
    selfDrop: false,
    codAmount: isCOD ? codAmount : '',
    invoiceValue,
    weightDetailsArray: [
      {
        weightKg: String(weightKg),
        lengthCm: String(lengthCm),
        breadthCm: String(breadthCm),
        heightCm: String(heightCm),
        quantity: '1',
      },
    ],
  };

  console.log('[ShipingTech] Fetching shipping rates with payload:', JSON.stringify(payload, null, 2));

  try {
    const { data } = await shipClient.post('/customer_api/rates', payload);
    console.log('[ShipingTech] Rates fetched success. Options found:', data?.rateOptions?.length || 0);
    return data;
  } catch (err) {
    console.error('[ShipingTech] Rates fetch failed:', err.message);
    if (err.response) {
      console.error('[ShipingTech] Error Response Data:', JSON.stringify(err.response.data, null, 2));
    }
    throw err;
  }
};

export const getShippingRates = getRates;

export const createOrder = async (orderData) => {
  console.log('[ShipingTech] Creating shipment order with payload:', JSON.stringify(orderData, null, 2));
  try {
    const { data } = await shipClient.post('/customer_api/order', orderData);
    console.log('[ShipingTech] Shipment order creation success:', JSON.stringify(data, null, 2));
    return data;
  } catch (err) {
    console.error('[ShipingTech] Shipment order creation failed:', err.message);
    if (err.response) {
      console.error('[ShipingTech] Error Response Data:', JSON.stringify(err.response.data, null, 2));
    }
    throw err;
  }
};

export const createShipmentOrder = createOrder;

export const getOrderByUUID = async (uuid) => {
  console.log('[ShipingTech] Getting order by UUID:', uuid);
  try {
    const { data } = await shipClient.post('/customer_api/order/get', { uuid });
    console.log('[ShipingTech] Order retrieval success:', JSON.stringify(data, null, 2));
    return data;
  } catch (err) {
    console.error('[ShipingTech] Order retrieval failed:', err.message);
    if (err.response) {
      console.error('[ShipingTech] Error Response Data:', JSON.stringify(err.response.data, null, 2));
    }
    throw err;
  }
};

export const cancelShipmentOrder = async (uuid) => {
  console.log('[ShipingTech] Cancelling shipment order UUID:', uuid);
  try {
    const { data } = await shipClient.post('/customer_api/order/cancel', { uuid });
    console.log('[ShipingTech] Cancel success:', JSON.stringify(data, null, 2));
    return data;
  } catch (err) {
    console.error('[ShipingTech] Cancel failed:', err.message);
    if (err.response) {
      console.error('[ShipingTech] Error Response Data:', JSON.stringify(err.response.data, null, 2));
    }
    throw err;
  }
};

export const assignCourier = async ({ uuid, lspId, service }) => {
  console.log('[ShipingTech] Assigning courier. UUID:', uuid, '| LSP:', lspId, '| Service:', service);
  try {
    const { data } = await shipClient.post('/customer_api/order/assign', { uuid, lspId, service });
    console.log('[ShipingTech] Courier assign success:', JSON.stringify(data, null, 2));
    return data;
  } catch (err) {
    console.error('[ShipingTech] Courier assign failed:', err.message);
    if (err.response) {
      console.error('[ShipingTech] Error Response Data:', JSON.stringify(err.response.data, null, 2));
    }
    throw err;
  }
};

export const createPickup = async ({ uuid, warehouseId }) => {
  console.log('[ShipingTech] Creating pickup. UUID:', uuid, '| Warehouse ID:', warehouseId);
  try {
    const { data } = await shipClient.post('/customer_api/pickup', { uuid, warehouseId });
    console.log('[ShipingTech] Pickup creation success:', JSON.stringify(data, null, 2));
    return data;
  } catch (err) {
    console.error('[ShipingTech] Pickup creation failed:', err.message);
    if (err.response) {
      console.error('[ShipingTech] Error Response Data:', JSON.stringify(err.response.data, null, 2));
    }
    throw err;
  }
};

export const getPackingSlip = async (uuid) => {
  console.log('[ShipingTech] Fetching packing slip. UUID:', uuid);
  try {
    const { data } = await shipClient.post('/customer_api/packingslip', { uuid });
    console.log('[ShipingTech] Packing slip success:', JSON.stringify(data, null, 2));
    return data;
  } catch (err) {
    console.error('[ShipingTech] Packing slip failed:', err.message);
    if (err.response) {
      console.error('[ShipingTech] Error Response Data:', JSON.stringify(err.response.data, null, 2));
    }
    throw err;
  }
};

export const track = async ({ awb, refId }) => {
  const params = new URLSearchParams();
  if (awb) params.append('awbs', awb);
  if (refId) params.append('ref_ids', refId);
  console.log('[ShipingTech] Tracking shipment. Params:', params.toString());
  try {
    const { data } = await shipClient.post(`/customer_api/order/track?${params.toString()}`);
    console.log('[ShipingTech] Tracking success:', JSON.stringify(data, null, 2));
    return data;
  } catch (err) {
    console.error('[ShipingTech] Tracking failed:', err.message);
    if (err.response) {
      console.error('[ShipingTech] Error Response Data:', JSON.stringify(err.response.data, null, 2));
    }
    throw err;
  }
};

export const trackShipment = track;
