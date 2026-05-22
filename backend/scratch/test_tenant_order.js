import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const BASE_URL = process.env.SHIPINGTECH_BASE_URL || 'https://backend.shipingtech.in';
const API_KEY = process.env.SHIPINGTECH_API_KEY;

async function testTenantHeaders() {
  console.log('BASE_URL:', BASE_URL);
  console.log('API_KEY exists:', !!API_KEY);
  console.log('Username:', process.env.SHIPINGTECH_USERNAME);

  // 1. Get Login token without any Origin header
  let token = null;
  try {
    const { data } = await axios.post(
      `${BASE_URL}/customer_api/login`,
      {
        username: process.env.SHIPINGTECH_USERNAME,
        password: process.env.SHIPINGTECH_PASSWORD,
      },
      { headers: { 'x-api-key': API_KEY } }
    );
    token = data?.accessToken || data?.token;
    console.log('Login success! Token obtained.');
  } catch (err) {
    console.error('Login failed:', err.response?.data || err.message);
    return;
  }

  const ratesPayload = {
    booking_code: Number(process.env.SHIPINGTECH_BOOKING_CODE) || 183,
    originPincode: process.env.SHIPINGTECH_ORIGIN_PINCODE || '333012',
    destinationPincode: '342008',
    serviceCategory: 'b2c',
    riskType: 'ownerRisk',
    isGSTinclusiv: true,
    isCOD: false,
    selfDrop: false,
    codAmount: '',
    invoiceValue: 299,
    weightDetailsArray: [
      {
        weightKg: '1',
        lengthCm: '10',
        breadthCm: '10',
        heightCm: '10',
        quantity: '1',
      },
    ],
  };

  // Test different headers to see which one works
  const headerVariations = [
    { 'tenant_id': process.env.SHIPINGTECH_USERNAME },
    { 'tenant-id': process.env.SHIPINGTECH_USERNAME },
    { 'x-tenant-id': process.env.SHIPINGTECH_USERNAME },
  ];

  for (const extraHeaders of headerVariations) {
    try {
      console.log(`\n--- Testing headers:`, JSON.stringify(extraHeaders), `---`);
      const { data } = await axios.post(
        `${BASE_URL}/customer_api/rates`,
        ratesPayload,
        {
          headers: {
            'x-api-key': API_KEY,
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...extraHeaders
          }
        }
      );
      console.log('SUCCESS! Rates count:', data?.rateOptions?.length || 0);
    } catch (err) {
      console.log('FAILED:', err.response?.status, err.response?.data || err.message);
    }
  }
}

testTenantHeaders();
