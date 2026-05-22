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

async function testOriginsSweep() {
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

  const origins = [
    // Standard Localhost
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5174',
    'http://localhost:8080',
    'http://localhost:8000',
    'http://localhost:5000',
    'http://localhost:10000',
    'http://localhost',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1',
    'https://localhost:5173',
    'https://localhost:3000',
    'https://localhost:5174',
    'https://localhost',

    // Production HTTPS
    'https://photowalagift.online',
    'https://www.photowalagift.online',
    'https://admin.photowalagift.online',
    'https://api.photowalagift.online',
    
    // Production HTTPS with trailing slash
    'https://photowalagift.online/',
    'https://www.photowalagift.online/',
    'https://admin.photowalagift.online/',
    'https://api.photowalagift.online/',

    // Production HTTP
    'http://photowalagift.online',
    'http://www.photowalagift.online',
    'http://admin.photowalagift.online',
    'http://api.photowalagift.online',

    // Production HTTP with trailing slash
    'http://photowalagift.online/',
    'http://www.photowalagift.online/',
    'http://admin.photowalagift.online/',
    'http://api.photowalagift.online/',

    // Raw domains
    'photowalagift.online',
    'www.photowalagift.online',
    'admin.photowalagift.online',

    // ShipingTech domains
    'https://backend.shipingtech.in',
    'https://testbe.shipingtech.in',
    'https://shipingtech.in'
  ];

  console.log(`\nStarting sweep of ${origins.length} Origins against /customer_api/warehouses...\n`);

  for (const origin of origins) {
    try {
      const headers = {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Origin': origin,
        'Referer': origin.includes('/') ? origin : origin + '/'
      };

      const res = await axios.post(`${BASE_URL}/customer_api/warehouses`, {}, { headers });
      console.log(`[WINNER!] SUCCESS with Origin: "${origin}" -> Status: ${res.status}`);
      console.log(`Data:`, JSON.stringify(res.data).slice(0, 300));
      return; // Stop if we found a winner!
    } catch (err) {
      const status = err.response?.status || 'network';
      const errMsg = JSON.stringify(err.response?.data) || err.message;

      if (errMsg.includes('normalizedOrigin is not defined')) {
        console.log(`[-] Origin: "${origin}" -> WHITELISTED but remote server CRASHED (normalizedOrigin is not defined)`);
      } else if (errMsg.includes('Not allowed by CORS')) {
        // Keep it quiet for CORS failures to avoid clutter
      } else {
        console.log(`[?] Origin: "${origin}" -> Status: ${status} | Error: ${errMsg}`);
      }
    }
  }

  console.log('\nSweep completed. No winner found.');
}

testOriginsSweep();
