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

async function testOrderBypass() {
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

  // Diagnostic Matrix
  const tests = [
    // Header variations (no body/query injection)
    { name: 'Header tenant_id only', headers: { 'tenant_id': process.env.SHIPINGTECH_USERNAME }, body: {}, query: '' },
    { name: 'Header tenant-id only', headers: { 'tenant-id': process.env.SHIPINGTECH_USERNAME }, body: {}, query: '' },
    { name: 'Header x-tenant-id only', headers: { 'x-tenant-id': process.env.SHIPINGTECH_USERNAME }, body: {}, query: '' },
    { name: 'Header tenantId only', headers: { 'tenantId': process.env.SHIPINGTECH_USERNAME }, body: {}, query: '' },
    { name: 'Header tenantid only', headers: { 'tenantid': process.env.SHIPINGTECH_USERNAME }, body: {}, query: '' },
    { name: 'Header x-tenantid only', headers: { 'x-tenantid': process.env.SHIPINGTECH_USERNAME }, body: {}, query: '' },

    // Body variations (no header/query injection)
    { name: 'Body tenant_id only', headers: {}, body: { tenant_id: process.env.SHIPINGTECH_USERNAME }, query: '' },
    { name: 'Body tenant-id only', headers: {}, body: { 'tenant-id': process.env.SHIPINGTECH_USERNAME }, query: '' },
    { name: 'Body tenantId only', headers: {}, body: { tenantId: process.env.SHIPINGTECH_USERNAME }, query: '' },
    { name: 'Body tenantid only', headers: {}, body: { tenantid: process.env.SHIPINGTECH_USERNAME }, query: '' },

    // Combined variations
    { name: 'Combined tenant_id (headers & body)', headers: { 'tenant_id': process.env.SHIPINGTECH_USERNAME }, body: { tenant_id: process.env.SHIPINGTECH_USERNAME }, query: '' },
    { name: 'Combined tenantId (headers & body)', headers: { 'tenantId': process.env.SHIPINGTECH_USERNAME }, body: { tenantId: process.env.SHIPINGTECH_USERNAME }, query: '' },

    // Query parameter variations
    { name: 'Query param ?tenant_id=...', headers: {}, body: {}, query: `?tenant_id=${process.env.SHIPINGTECH_USERNAME}` },
    { name: 'Query param ?tenantId=...', headers: {}, body: {}, query: `?tenantId=${process.env.SHIPINGTECH_USERNAME}` },
    { name: 'Query param ?tenant-id=...', headers: {}, body: {}, query: `?tenant-id=${process.env.SHIPINGTECH_USERNAME}` },
    { name: 'Query param ?tenantid=...', headers: {}, body: {}, query: `?tenantid=${process.env.SHIPINGTECH_USERNAME}` },
    
    // Query param + Headers
    { name: 'Query param + Headers (tenant_id)', headers: { 'tenant_id': process.env.SHIPINGTECH_USERNAME }, body: {}, query: `?tenant_id=${process.env.SHIPINGTECH_USERNAME}` },
  ];

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

testOrderBypass();
