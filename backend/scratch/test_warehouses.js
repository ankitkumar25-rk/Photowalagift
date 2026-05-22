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
  let loginData = null;
  try {
    const { data } = await axios.post(
      `${BASE_URL}/customer_api/login`,
      {
        username: process.env.SHIPINGTECH_USERNAME,
        password: process.env.SHIPINGTECH_PASSWORD,
      },
      { headers: { 'x-api-key': API_KEY } }
    );
    loginData = data;
    token = data?.accessToken || data?.token;
    console.log('Login success! Token obtained.');
    console.log('Login response structure:', JSON.stringify(loginData, null, 2));
  } catch (err) {
    console.error('Login failed:', err.response?.data || err.message);
    return;
  }

  // Extract all potential tenant/merchant values from credentials and JWT
  const username = process.env.SHIPINGTECH_USERNAME;
  const bookingCode = process.env.SHIPINGTECH_BOOKING_CODE || '9';
  const walletId = 'wlt_mpchxeu8_1XQANW'; // extracted from your JWT

  const valueOptions = [
    { label: 'Username', val: username },
    { label: 'Booking Code', val: bookingCode },
    { label: 'Wallet ID', val: walletId },
    { label: 'Hardcoded project number', val: '740656906848' }
  ];

  // We will sweep both POST and GET requests since list endpoints are sometimes GET
  const methods = ['POST', 'GET'];

  const testMatrix = [];

  // Generate casing and header/query/body permutations
  for (const { label, val } of valueOptions) {
    if (!val) continue;

    const variations = [
      { key: 'tenant_id', location: 'header' },
      { key: 'tenant-id', location: 'header' },
      { key: 'tenantId', location: 'header' },
      { key: 'tenantid', location: 'header' },
      { key: 'x-tenant-id', location: 'header' },
      { key: 'x-tenantId', location: 'header' },
      
      { key: 'tenant_id', location: 'query' },
      { key: 'tenant-id', location: 'query' },
      { key: 'tenantId', location: 'query' },
      { key: 'tenantid', location: 'query' },

      { key: 'tenant_id', location: 'body' },
      { key: 'tenant-id', location: 'body' },
      { key: 'tenantId', location: 'body' },
      { key: 'tenantid', location: 'body' },
    ];

    for (const v of variations) {
      for (const method of methods) {
        testMatrix.push({
          name: `[${method}] Value: ${label} (${val}) | Key: ${v.key} in ${v.location}`,
          method,
          headers: v.location === 'header' ? { [v.key]: val } : {},
          body: v.location === 'body' && method === 'POST' ? { [v.key]: val } : {},
          query: v.location === 'query' ? `?${v.key}=${encodeURIComponent(val)}` : '',
        });
      }
    }
  }

  // Also let's test absolute raw clean request with NO custom headers or body just to verify
  for (const method of methods) {
    testMatrix.push({
      name: `[${method}] Pure authentication only (No origin or tenant parameter)`,
      method,
      headers: {},
      body: {},
      query: '',
    });
  }

  console.log(`\nGenerated ${testMatrix.length} diagnostic tests. Beginning execution...\n`);

  let successCount = 0;

  for (const [index, t] of testMatrix.entries()) {
    try {
      const headers = {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...t.headers,
      };

      const url = `${BASE_URL}/customer_api/warehouses${t.query}`;
      
      let res;
      if (t.method === 'POST') {
        res = await axios.post(url, t.body, { headers });
      } else {
        res = await axios.get(url, { headers });
      }

      console.log(`\n[SUCCESS #${++successCount}] Test #${index + 1}: ${t.name}`);
      console.log(`Response Status:`, res.status);
      console.log(`Response Data:`, JSON.stringify(res.data).slice(0, 300));
    } catch (err) {
      const status = err.response?.status || 'network';
      const errMsg = JSON.stringify(err.response?.data) || err.message;
      
      // Only print if it's NOT the standard "tenant_id or origin is required" to filter noise,
      // or print everything if we want full diagnostics.
      if (!errMsg.includes('tenant_id or origin is required')) {
        console.log(`[ALT ERROR] Test #${index + 1}: ${t.name} -> FAILED: ${status} ${errMsg}`);
      }
    }
  }

  console.log(`\nDiagnostic execution completed. ${successCount} successful requests found.`);
}

testWarehouses();


