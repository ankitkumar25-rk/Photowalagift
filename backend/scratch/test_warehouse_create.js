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

async function testWarehouseCreate() {
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

  // 2. Define payloads to test. We know it requires "contact_name" and "return_address".
  // Let's test a couple of variants (e.g. flat string address vs object address, and adding phone, pincode, etc.)
  const payloads = [
    {
      name: "Variant 1: Standard flat fields with contact_name and return_address as string",
      data: {
        contact_name: "Photowala Gift",
        return_address: "WARD NO. 04, KUMAWAT COLONY, SITHAL ROAD, TEHSIL - GUDHA GORJI, Jhunjhunu, Rajasthan",
        pincode: "333012",
        phone: "8104937078",
        city: "Jhunjhunu",
        state: "Rajasthan",
        name: "Photowala Main Warehouse", // Sometimes warehouse name is "name"
        booking_code: Number(process.env.SHIPINGTECH_BOOKING_CODE || 9),
      }
    },
    {
      name: "Variant 2: Simplest possible fields requested by error",
      data: {
        contact_name: "Photowala Gift",
        return_address: "WARD NO. 04, KUMAWAT COLONY, SITHAL ROAD, TEHSIL - GUDHA GORJI, Jhunjhunu, Rajasthan - 333012",
      }
    },
    {
      name: "Variant 3: Detailed object with distinct keys",
      data: {
        contact_name: "Photowala Gift",
        contact_phone: "8104937078",
        contact_email: "photowalagiftphotowalagift@gmail.com",
        return_address: "WARD NO. 04, KUMAWAT COLONY, SITHAL ROAD, TEHSIL - GUDHA GORJI",
        city: "Jhunjhunu",
        state: "Rajasthan",
        pincode: "333012",
        warehouse_name: "Photowala Primary",
        booking_code: Number(process.env.SHIPINGTECH_BOOKING_CODE || 9),
      }
    }
  ];

  console.log('\nStarting warehouse creation tests (Without Origin Header)...\n');

  for (const [index, p] of payloads.entries()) {
    try {
      console.log(`--- Running Test #${index + 1}: ${p.name} ---`);
      
      const headers = {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      console.log('Sending payload:', JSON.stringify(p.data, null, 2));

      const res = await axios.post(`${BASE_URL}/customer_api/warehouse`, p.data, { headers });
      
      console.log(`[SUCCESS] Test #${index + 1} Succeeded!`);
      console.log(`Response Status:`, res.status);
      console.log(`Response Data:`, JSON.stringify(res.data, null, 2));
      console.log('\n🎉 Working Payload Found! Use this payload details.\n');
      return; // Stop on first success to avoid spamming warehouse creation
    } catch (err) {
      console.log(`[FAILED] Test #${index + 1} Failed.`);
      console.log(`Response Status:`, err.response?.status || 'Network Error');
      console.log(`Response Data:`, JSON.stringify(err.response?.data || err.message, null, 2));
      console.log('-----------------------------------------\n');
    }
  }
}

testWarehouseCreate();
