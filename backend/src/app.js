import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import passport from './config/passport.js';

import { errorHandler } from './middleware/errorHandler.js';
import { ensureCsrfCookie, requireCsrf, issueCsrfToken } from './middleware/csrf.js';
import { rateLimit } from './middleware/rateLimit.js';
import valkey from './lib/valkey.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import categoryRoutes from './routes/category.routes.js';
import cartRoutes from './routes/cart.routes.js';
import orderRoutes from './routes/order.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import userRoutes from './routes/user.routes.js';
import adminRoutes from './routes/admin.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import returnsRoutes from './routes/returns.routes.js';
import supportRoutes from './routes/support.routes.js';
import serviceOrderRoutes from './routes/serviceOrder.routes.js';
import notificationRoutes from './api/notifications/routes.js';
import shippingRoutes from './api/shipping/routes.js';
import { getPincodeDetails } from './controllers/pincode.controller.js';


import * as paymentController from './controllers/payment.controller.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const sessionSecret = process.env.SESSION_SECRET || (process.env.NODE_ENV !== 'production' ? 'dev-session-secret' : '');
const redisUrl = process.env.REDIS_URL;

if (!sessionSecret) {
  throw new Error('SESSION_SECRET must be set in production');
}

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// ================================
// SECURITY MIDDLEWARE
// ================================
const allowedOrigins = [
  process.env.CLIENT_URL?.replace(/\/$/, ''),
  process.env.ADMIN_URL?.replace(/\/$/, ''),
  'https://photowalagift.online',
  'https://www.photowalagift.online',
  'https://admin.photowalagift.online',
  'http://localhost:5173',
  'http://localhost:5174',
].filter(Boolean);

console.log('✔ Configuring CORS for origins:', allowedOrigins);

app.use(helmet());

if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    const proto = req.headers['x-forwarded-proto'];
    if (req.secure || proto === 'https') return next();
    return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  });
}

const corsOptions = {
  origin: (origin, callback) => {
    // We allow all origins that match our list
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`✖ CORS blocked request from origin: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'x-csrf-token'],
  exposedHeaders: ['set-cookie'],
};

// Bulletproof Express 5 preflight handler
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, x-csrf-token');
      return res.status(200).end();
    }
  }
  next();
});

app.use(cors(corsOptions));

// ================================
// PAYMENTS WEBHOOK (MUST BE BEFORE express.json)
// ================================
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), paymentController.razorpayWebhook);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ================================
// SESSION
// ================================
import RedisStore from 'connect-redis';
import PgSession from 'connect-pg-simple';
import pkg from 'pg';
const { Pool } = pkg;
const PgStore = PgSession(session);

let sessionStore;
if (process.env.REDIS_URL || process.env.VALKEY_URL) {
  sessionStore = new RedisStore({ client: valkey, prefix: 'sess:' });
} else {
  console.log('✔ No REDIS_URL found, using PostgreSQL for session storage');
  sessionStore = new PgStore({
    pool: new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    }),
    tableName: 'session',
    createTableIfMissing: false
  });
}

const sessionOptions = {
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    httpOnly: true,
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
  ...(sessionStore ? { store: sessionStore } : {}),
};

app.use(session(sessionOptions));
app.use(passport.initialize());
app.use(passport.session());

// ================================
// LOGGING
// ================================
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ================================
// RATE LIMITING
// ================================
app.use('/api', rateLimit({ max: 300, windowSec: 60 }));
app.use('/api/auth/login', rateLimit({ max: 20, windowSec: 60, keyPrefix: 'rl:auth' }));
app.use('/api/auth/register', rateLimit({ max: 15, windowSec: 60, keyPrefix: 'rl:auth' }));

app.use('/api', ensureCsrfCookie);
app.use('/api', requireCsrf);

// ================================
// ROUTES
// ================================
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'photowala-backend',
    message: 'Service is live',
    health: '/api/health'
  });
});

app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'photowala-backend',
    message: 'API is live',
    health: '/api/health',
  });
});

app.get('/api/health', async (req, res) => {
  let valkeyStatus = 'disconnected';
  try {
    if (valkey.status === 'ready') {
      const ping = await valkey.ping();
      valkeyStatus = ping === 'PONG' ? 'connected' : 'error';
    } else {
      valkeyStatus = valkey.status;
    }
  } catch (err) {
    valkeyStatus = 'error';
  }

  res.json({ 
    status: 'ok', 
    valkey: valkeyStatus,
    timestamp: new Date().toISOString() 
  });
});


console.log('✔ Cookie Domain configured as:', process.env.COOKIE_DOMAIN || 'none (host-only)');

app.get('/api/csrf', (req, res) => {
  try {
    // Force no-cache for CSRF to prevent 304 responses
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const existingToken = req.cookies?.csrf_token;
    const token = (existingToken && existingToken.length === 64)
      ? existingToken
      : crypto.randomBytes(32).toString('hex');

    res.cookie('csrf_token', token, {
      httpOnly: false,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, token, csrfToken: token });
  } catch (err) {
    console.error('[CSRF] getCsrfToken error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to generate CSRF token' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/returns', returnsRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/service-orders', serviceOrderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/shipping', shippingRoutes);
app.get('/api/address/pincode/:pincode', getPincodeDetails);


app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use(errorHandler);

export default app;
