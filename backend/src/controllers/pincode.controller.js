import https from 'https';
import valkey from '../lib/valkey.js';

const fetchPincodeFromAPI = (pincode) => {
  return new Promise((resolve, reject) => {
    const req = https.get(`https://api.postalpincode.in/pincode/${pincode}`, { 
      timeout: 5500,
      rejectUnauthorized: false // Bypasses expired SSL certificate validation of the government API
    }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`India Post API returned status ${res.statusCode}`));
        return;
      }

      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(new Error('Failed to parse JSON response'));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
};

export const getPincodeDetails = async (req, res, next) => {
  try {
    const { pincode } = req.params;

    // 1. Validate: exactly 6 digits
    if (!/^[1-9][0-9]{5}$/.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pincode format. Must be exactly 6 digits.'
      });
    }

    const cacheKey = `pincode:${pincode}`;

    // 2. Check Redis cache first
    try {
      const cached = await valkey.get(cacheKey);
      if (cached) {
        console.log(`[Pincode Cache Hit] Key: ${cacheKey}`);
        return res.json(JSON.parse(cached));
      }
    } catch (cacheErr) {
      console.error('[Pincode Cache Error] Failed to read from Redis:', cacheErr.message);
    }

    // 3. Cache miss -> Call India Post API using native https to bypass Undici DNS/IPv6 issues
    try {
      const data = await fetchPincodeFromAPI(pincode);

      // India Post API returns an array: [{ Status, PostOffice: [...] }]
      if (!Array.isArray(data) || data.length === 0) {
        return res.status(404).json({ success: false, message: 'Invalid or unknown pincode' });
      }

      const result = data[0];
      if (result.Status !== 'Success' || !result.PostOffice || result.PostOffice.length === 0) {
        return res.status(404).json({ success: false, message: 'Invalid or unknown pincode' });
      }

      const firstPO = result.PostOffice[0];
      const city = firstPO.District || '';
      const state = firstPO.State || '';
      const postOffices = result.PostOffice.map((po) => po.Name).filter(Boolean);

      const responseBody = {
        city,
        state,
        postOffices
      };

      // 4. Cache in Redis with a TTL of 7 days (604800 seconds)
      try {
        await valkey.set(cacheKey, JSON.stringify(responseBody), 'EX', 604800);
      } catch (cacheErr) {
        console.error('[Pincode Cache Error] Failed to write to Redis:', cacheErr.message);
      }

      return res.json(responseBody);
    } catch (apiErr) {
      console.error('[Pincode API Error] Failed to fetch pincode details:', apiErr.message);

      // If India Post API fails or times out, return 503
      return res.status(503).json({
        success: false,
        message: 'Could not verify. Fill city and state manually.'
      });
    }
  } catch (err) {
    next(err);
  }
};
