import 'dotenv/config'; // FIX 5: First line
import app from './app.js';
import prisma from './lib/prisma.js';

// 1.2 Validate environment variables
const REQUIRED_ENV = [
  'DATABASE_URL',
  'VALKEY_URL',
  'SMTP_USER',
  'SMTP_PASS',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'PASETO_SECRET_KEY',
  'SESSION_SECRET'
];

const missing = REQUIRED_ENV.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.error('❌ CRITICAL ERROR: Missing environment variables:');
  missing.forEach(key => console.error(`   - ${key}`));
  console.error('\nServer startup aborted. Please check your .env file.\n');
  process.exit(1);
}

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

async function main() {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL connected (via Prisma singleton)');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }

  const server = app.listen(PORT, HOST, () => {
    const publicUrl = process.env.PUBLIC_URL || `http://${HOST}:${PORT}`;
    console.log(`\n🚀 Server  → ${publicUrl}`);
    console.log(`📦 Mode    → ${process.env.NODE_ENV || 'development'}\n`);
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      console.log('✅ Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

main();
