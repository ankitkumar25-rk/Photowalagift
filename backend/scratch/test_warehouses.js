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

async function testWarehouses() {
  console.log('BASE_URL:', BASE_URL);
  console.log('API_KEY exists:', !!API_KEY);
  console.log('Username:', process.env.SHIPINGTECH_USERNAME);

  // 1. Get token
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

  const tenantId = process.env.SHIPINGTECH_USERNAME;

  // Let's build a matrix of tests to see what combinations work
  const tests = [
    // 1. No Origin, only tenant headers (what we tried before)
    {
      name: 'No Origin, tenant headers in body and headers',
      headers: {
        'tenant_id': tenantId,
        'tenant-id': tenantId,
        'x-tenant-id': tenantId,
      },
      body: { tenant_id: tenantId },
      query: '',
    },
    // 2. HTTP localhost origins
    {
      name: 'Origin: http://localhost:5173',
      headers: { 'Origin': 'http://localhost:5173' },
      body: {},
      query: '',
    },
    {
      name: 'Origin: http://localhost:3000',
      headers: { 'Origin': 'http://localhost:3000' },
      body: {},
      query: '',
    },
    {
      name: 'Origin: http://localhost:5174',
      headers: { 'Origin': 'http://localhost:5174' },
      body: {},
      query: '',
    },
    // 3. Production online origins
    {
      name: 'Origin: https://photowalagift.online',
      headers: { 'Origin': 'https://photowalagift.online' },
      body: {},
      query: '',
    },
    {
      name: 'Origin: https://www.photowalagift.online',
      headers: { 'Origin': 'https://www.photowalagift.online' },
      body: {},
      query: '',
    },
    {
      name: 'Origin: https://admin.photowalagift.online',
      headers: { 'Origin': 'https://admin.photowalagift.online' },
      body: {},
      query: '',
    },
    // 4. Query Parameter tenant_id
    {
      name: 'Query param ?tenant_id=username',
      headers: {},
      body: {},
      query: `?tenant_id=${tenantId}`,
    },
    // 5. Query Parameter tenant-id
    {
      name: 'Query param ?tenant-id=username',
      headers: {},
      body: {},
      query: `?tenant-id=${tenantId}`,
    },
    // 6. Header origin in lowercase
    {
      name: 'Lowercase origin header: http://localhost:5173',
      headers: { 'origin': 'http://localhost:5173' },
      body: {},
      query: '',
    },
    // 7. Combined whitelisted origin + tenant headers
    {
      name: 'Origin: https://photowalagift.online + Tenant headers',
      headers: {
        'Origin': 'https://photowalagift.online',
        'tenant_id': tenantId,
      },
      body: { tenant_id: tenantId },
      query: `?tenant_id=${tenantId}`,
    },
  ];

  for (const t of tests) {
    try {
      console.log(`\n=================== ${t.name} ===================`);
      const headers = {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...t.headers,
      };

      const url = `/customer_api/warehouses${t.query}`;
      const { data } = await axios.post(
        `${BASE_URL}${url}`,
        t.body,
        { headers }
      );
      console.log('SUCCESS! Warehouses found:', Array.isArray(data) ? data.length : typeof data, data);
    } catch (err) {
      console.log('FAILED:', err.response?.status, err.response?.data || err.message);
    }
  }
}

testWarehouses();

