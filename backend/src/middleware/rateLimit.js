import valkey from '../lib/valkey.js';

export const rateLimit = ({ max, windowSec, keyPrefix = 'rl', customKey = null }) => {
  return async (req, res, next) => {
    // Skip if no valkey connection (fallback to allow request)
    if (!valkey) return next();

    const ip = req.headers['x-forwarded-for'] || req.ip;
    
    // Default key is IP. If customKey generator is provided, use it.
    let keySegment = ip;
    if (typeof customKey === 'function') {
      const extra = customKey(req);
      if (extra) keySegment = `${ip}:${extra}`;
    }
    
    const key = `${keyPrefix}:${keySegment}`;

    try {
      const pipeline = valkey.multi();
      pipeline.incr(key);
      pipeline.ttl(key);
      
      const results = await pipeline.exec();
      const current = results[0][1];
      const ttl = results[1][1];
      
      if (ttl < 0) {
        await valkey.expire(key, windowSec);
      }

      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - current));

      if (current > max) {
        console.warn(`[RateLimit] Blocked: ${key}`);
        return res.status(429).json({
          success: false,
          message: 'Too many requests, please try again later.'
        });
      }
      next();
    } catch (err) {
      console.error('Rate Limit Error:', err.message);
      next();
    }
  };
};

export const authRateLimiter = rateLimit({ 
  max: 10, 
  windowSec: 15 * 60, 
  keyPrefix: 'rl:auth',
  customKey: (req) => req.body?.email ? String(req.body.email).toLowerCase().trim() : null
});

export const registrationRateLimiter = rateLimit({
  max: 5,
  windowSec: 60 * 60, // 1 hour
  keyPrefix: 'rl:register',
  customKey: (req) => req.body?.email ? String(req.body.email).toLowerCase().trim() : null
});
