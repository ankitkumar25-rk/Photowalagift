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

async function testOrigins() {
  console.log('BASE_URL:', BASE_URL);
  console.log('API_KEY exists:', !!API_KEY);
  console.log('Username:', process.env.SHIPINGTECH_USERNAME);

  const origins = [
    'https://www.photowalagift.online',
    'https://photowalagift.online',
    'https://admin.photowalagift.online',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://localhost:5000',
    'photowalagift.online',
    'www.photowalagift.online',
  ];

  for (const origin of origins) {
    try {
      console.log(`\n--- Testing Origin: "${origin}" ---`);
      const { data } = await axios.post(
        `${BASE_URL}/customer_api/login`,
        {
          username: process.env.SHIPINGTECH_USERNAME,
          password: process.env.SHIPINGTECH_PASSWORD,
        },
        { 
          headers: { 
            'x-api-key': API_KEY,
            'Origin': origin,
          } 
        }
      );
      console.log(`SUCCESS! Token obtained with Origin: "${origin}"`);
      
      // Let's also try rates request with this working origin
      const token = data?.accessToken || data?.token;
      try {
        const ratesRes = await axios.post(
          `${BASE_URL}/customer_api/rates`,
          {
            booking_code: Number(process.env.SHIPINGTECH_BOOKING_CODE) || 9,
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
          },
          {
            headers: {
              'x-api-key': API_KEY,
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'Origin': origin,
            }
          }
        );
        console.log(`  Rates API Success! Options count:`, ratesRes.data?.rateOptions?.length);
      } catch (err) {
        console.log(`  Rates API Failed with this Origin:`, err.response?.data || err.message);
      }

    } catch (err) {
      console.log(`FAILED:`, err.response?.data?.message || err.response?.data || err.message);
    }
  }

  // Also test without origin but with tenant_id headers
  const tenantHeaders = [
    { 'tenant_id': process.env.SHIPINGTECH_USERNAME },
    { 'tenant-id': process.env.SHIPINGTECH_USERNAME },
    { 'x-tenant-id': process.env.SHIPINGTECH_USERNAME },
    { 'tenant_id': '740656906848' }, // project number from google console log just in case
  ];

  for (const headers of tenantHeaders) {
    try {
      console.log(`\n--- Testing Tenant Headers:`, JSON.stringify(headers), `---`);
      const { data } = await axios.post(
        `${BASE_URL}/customer_api/login`,
        {
          username: process.env.SHIPINGTECH_USERNAME,
          password: process.env.SHIPINGTECH_PASSWORD,
        },
        { 
          headers: { 
            'x-api-key': API_KEY,
            ...headers
          } 
        }
      );
      console.log(`  Login Success!`);
      const token = data?.accessToken || data?.token;
      
      // Try rates
      const ratesRes = await axios.post(
        `${BASE_URL}/customer_api/rates`,
        {
          booking_code: Number(process.env.SHIPINGTECH_BOOKING_CODE) || 9,
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
        },
        {
          headers: {
            'x-api-key': API_KEY,
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...headers
          }
        }
      );
      console.log(`  Rates API Success! Options count:`, ratesRes.data?.rateOptions?.length);
    } catch (err) {
      console.log(`  Failed:`, err.response?.data?.message || err.response?.data || err.message);
    }
  }
}

testOrigins();
