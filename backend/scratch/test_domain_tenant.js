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

async function testDomainTenants() {
  console.log('BASE_URL:', BASE_URL);
  console.log('API_KEY exists:', !!API_KEY);
  console.log('Username:', process.env.SHIPINGTECH_USERNAME);

  // 1. Get Login token
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

  const orderPayload = {
    booking_code: Number(process.env.SHIPINGTECH_BOOKING_CODE) || 9,
    customerName: 'Test Customer',
    customerPhone: '9999999999',
    customerEmail: 'test@example.com',
    deliveryAddress: 'Test Address',
    deliveryCity: 'Jodhpur',
    deliveryState: 'Rajasthan',
    deliveryPincode: '342008',
    deliveryCountry: 'India',
    invoiceValue: 299,
    isCOD: false,
    codAmount: 0,
    items: [
      {
        name: 'Test Item',
        qty: 1,
        price: 299,
      },
    ],
    weightKg: 1,
    referenceId: 'test-' + Date.now(),
  };

  // Candidates for valid tenant_id
  const candidates = [
    'photowalagift.online',
    'https://photowalagift.online',
    'www.photowalagift.online',
    'https://www.photowalagift.online',
    'photowalagiftphotowalagift',
    'photowala',
    'admin.photowalagift.online'
  ];

  const tests = [];
  for (const val of candidates) {
    tests.push(
      { name: `Header tenant_id: ${val}`, headers: { 'tenant_id': val }, body: {}, query: '' },
      { name: `Body tenant_id: ${val}`, headers: {}, body: { tenant_id: val }, query: '' },
      { name: `Query param ?tenant_id=${val}`, headers: {}, body: {}, query: `?tenant_id=${val}` }
    );
  }

  for (const t of tests) {
    try {
      console.log(`\n=================== ${t.name} ===================`);
      const payload = { ...orderPayload, ...t.body };
      const headers = {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...t.headers
      };

      const url = `/customer_api/order${t.query}`;
      const { data } = await axios.post(
        `${BASE_URL}${url}`,
        payload,
        { headers }
      );
      console.log('SUCCESS! Order created:', JSON.stringify(data).slice(0, 200));
    } catch (err) {
      console.log('FAILED:', err.response?.status, err.response?.data || err.message);
    }
  }
}

testDomainTenants();
