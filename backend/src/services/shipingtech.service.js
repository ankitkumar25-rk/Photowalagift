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

export const getToken = async () => {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const { data } = await axios.post(
    `${BASE_URL}/customer_api/login`,
    {
      username: process.env.SHIPINGTECH_USERNAME,
      password: process.env.SHIPINGTECH_PASSWORD,
    },
    { headers: { 'x-api-key': API_KEY } }
  );

  cachedToken = data?.accessToken || data?.token || null;
  tokenExpiry = Date.now() + 23 * 60 * 60 * 1000;
  console.log('[ShipingTech] Token refreshed');
  return cachedToken;
};

shipClient.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const createWarehouse = async (warehouseData) => {
  const { data } = await shipClient.post('/customer_api/warehouse', warehouseData);
  return data;
};

export const getWarehouses = async () => {
  const { data } = await shipClient.post('/customer_api/warehouses');
  return data;
};

export const getShippingRates = async ({
  destinationPincode,
  weightKg,
  lengthCm = 10,
  breadthCm = 10,
  heightCm = 10,
  isCOD = false,
  codAmount = 0,
  invoiceValue,
}) => {
  const { data } = await shipClient.post('/customer_api/rates', {
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
  });
  return data;
};

export const createShipmentOrder = async (orderData) => {
  const { data } = await shipClient.post('/customer_api/order', orderData);
  return data;
};

export const getOrderByUUID = async (uuid) => {
  const { data } = await shipClient.post('/customer_api/order/get', { uuid });
  return data;
};

export const cancelShipmentOrder = async (uuid) => {
  const { data } = await shipClient.post('/customer_api/order/cancel', { uuid });
  return data;
};

export const assignCourier = async ({ uuid, lspId, service }) => {
  const { data } = await shipClient.post('/customer_api/order/assign', { uuid, lspId, service });
  return data;
};

export const createPickup = async ({ uuid, warehouseId }) => {
  const { data } = await shipClient.post('/customer_api/pickup', { uuid, warehouseId });
  return data;
};

export const getPackingSlip = async (uuid) => {
  const { data } = await shipClient.post('/customer_api/packingslip', { uuid });
  return data;
};

export const trackShipment = async ({ awb, refId }) => {
  const params = new URLSearchParams();
  if (awb) params.append('awbs', awb);
  if (refId) params.append('ref_ids', refId);
  const { data } = await shipClient.post(`/customer_api/order/track?${params.toString()}`);
  return data;
};
