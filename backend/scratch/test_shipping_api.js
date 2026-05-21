import 'dotenv/config';
import axios from 'axios';

const BASE_URL = process.env.SHIPINGTECH_BASE_URL || 'https://backend.shipingtech.in';
const API_KEY = process.env.SHIPINGTECH_API_KEY;

async function testApi() {
  console.log('BASE_URL:', BASE_URL);
  console.log('API_KEY exists:', !!API_KEY);

  // 1. Get token
  let token = null;
  try {
    const loginUrl = `${BASE_URL}/customer_api/login`;
    console.log('Logging in at:', loginUrl);
    const { data } = await axios.post(
      loginUrl,
      {
        username: process.env.SHIPINGTECH_USERNAME,
        password: process.env.SHIPINGTECH_PASSWORD,
      },
      { headers: { 'x-api-key': API_KEY } }
    );
    token = data?.accessToken || data?.token;
    console.log('Token obtained successfully:', !!token);
  } catch (err) {
    console.error('Login failed:', err.message);
    if (err.response) {
      console.error('Login error details:', err.response.data);
    }
    return;
  }

  // Helper for requests
  const makeRequest = async (url, payload, extraHeaders = {}) => {
    try {
      const headers = {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...extraHeaders
      };
      console.log(`\n--- Requesting ${url} with headers:`, Object.keys(headers).filter(k => k !== 'Authorization' && k !== 'x-api-key'));
      const { data } = await axios.post(`${BASE_URL}${url}`, payload, { headers });
      console.log('Success response:', JSON.stringify(data).slice(0, 200));
      return true;
    } catch (err) {
      console.error('Request failed:', err.message);
      if (err.response) {
        console.error('Status:', err.response.status);
        console.error('Error Details:', err.response.data);
      }
      return false;
    }
  };

  const ratesPayload = {
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
  };

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

  console.log('\n=================== TEST 1: Rates (Default Headers) ===================');
  await makeRequest('/customer_api/rates', ratesPayload);

  console.log('\n=================== TEST 2: Rates (Origin: localhost) ===================');
  await makeRequest('/customer_api/rates', ratesPayload, { 'Origin': 'http://localhost:5173' });

  console.log('\n=================== TEST 3: Rates (Origin: photowalagift.online) ===================');
  await makeRequest('/customer_api/rates', ratesPayload, { 'Origin': 'https://photowalagift.online' });

  console.log('\n=================== TEST 4: Order (Default Headers) ===================');
  await makeRequest('/customer_api/order', orderPayload);

  console.log('\n=================== TEST 5: Order (Origin: localhost) ===================');
  await makeRequest('/customer_api/order', orderPayload, { 'Origin': 'http://localhost:5173' });

  console.log('\n=================== TEST 6: Order (Origin: photowalagift.online) ===================');
  await makeRequest('/customer_api/order', orderPayload, { 'Origin': 'https://photowalagift.online' });

  console.log('\n=================== TEST 7: Order (Origin in lowercase: origin) ===================');
  await makeRequest('/customer_api/order', orderPayload, { 'origin': 'https://photowalagift.online' });
}

testApi();
