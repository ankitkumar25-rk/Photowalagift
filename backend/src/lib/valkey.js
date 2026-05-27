import Redis from 'ioredis';

const valkeyUrl = process.env.VALKEY_URL || process.env.REDIS_URL || 'redis://localhost:6379';

const isTls = valkeyUrl.startsWith('rediss://');

const valkey = new Redis(valkeyUrl, {
  ...(isTls ? { tls: { rejectUnauthorized: false } } : {}),
  maxRetriesPerRequest: null,
  keepAlive: 10000, // Keep connection alive
  noDelay: true,    // Disable Nagle's algorithm
  family: 0,        // Support both IPv4 and IPv6
  retryStrategy: (times) => {
    const delay = Math.min(times * 500, 10000);
    if (times % 5 === 0) {
      console.log(`[ioredis] Reconnecting... Attempt ${times}. Next retry in ${delay}ms`);
    }
    return delay;
  },
  reconnectOnError: (err) => {
    const targetErrors = ['READONLY', 'ECONNRESET', 'EPIPE', 'ETIMEDOUT'];
    if (targetErrors.some(te => err.message.includes(te))) {
      return true; 
    }
    return false;
  },
  enableOfflineQueue: true,
  connectTimeout: 20000,
  commandTimeout: 15000,
  pingInterval: 5000, // Regularly ping to keep connection active
  lazyConnect: false,
});



valkey.on('connect', () => console.log('✔ Valkey connected'));
valkey.on('ready', () => console.log('✔ Valkey ready to receive commands'));
valkey.on('error', (err) => console.error('✖ Valkey error:', err.message));
valkey.on('reconnecting', () => console.warn('⚠ Valkey reconnecting...'));
valkey.on('end', () => console.warn('✖ Valkey connection ended'));


// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down Valkey...');
  await valkey.quit();
};

process.on('SIGTERM', shutdown);

export default valkey;
