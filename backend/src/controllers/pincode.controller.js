import valkey from '../lib/valkey.js';

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
      // Fallback: do not fail request if Redis is down
    }

    // 3. Cache miss -> Call India Post API with a 6-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const apiResponse = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!apiResponse.ok) {
        throw new Error(`India Post API returned status ${apiResponse.status}`);
      }

      const data = await apiResponse.json();

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
      clearTimeout(timeoutId);
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
