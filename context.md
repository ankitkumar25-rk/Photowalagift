# Photowala Project Context for Guest Checkout & Flow Fix

## 1. Backend

### Order & Cart Models (Prisma Schema)
```prisma
model Cart {
  id        String     @id @default(uuid())
  userId    String?    @unique
  user      User?      @relation(fields: [userId], references: [id], onDelete: Cascade)
  sessionId String?    @unique  // for guest carts
  items     CartItem[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  @@map("carts")
}

model Order {
  id              String        @id @default(uuid())
  orderNumber     String        @unique
  userId          String
  user            User          @relation(fields: [userId], references: [id])
  addressId       String?
  address         Address?      @relation(fields: [addressId], references: [id])
  items           OrderItem[]
  status          OrderStatus   @default(PENDING)
  subtotal        Decimal       @db.Decimal(10, 2)
  discount        Decimal       @default(0) @db.Decimal(10, 2)
  shippingCost    Decimal       @default(0) @db.Decimal(10, 2)
  tax             Decimal       @default(0) @db.Decimal(10, 2)
  total           Decimal       @db.Decimal(10, 2)
  notes           String?
  // ... other fields (payment, tracking, etc.)
  @@map("orders")
}
```
*Note: Currently, `userId` is mandatory on `Order` (no `?`), preventing true guest orders unless a dummy user is used or the schema is modified.*

### Order Routes (`backend/src/routes/order.routes.js`)
```javascript
import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as orderController from '../controllers/order.controller.js';

const router = express.Router();
const isAdmin = authorize('ADMIN', 'SUPER_ADMIN');

// Customer routes
router.post('/',            authenticate, orderController.createOrder);
router.get('/',             authenticate, orderController.getUserOrders);
router.post('/pen/laser',   authenticate, orderController.createLaserPenOrder);

// ... Admin routes omitted for brevity ...
```
*Note: `createOrder` is currently protected by the strict `authenticate` middleware.*

### Auth Middleware (`backend/src/middleware/auth.js`)
```javascript
// Strict authentication middleware
export async function authenticate(req, res, next) {
  try {
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies?.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) return next(createError('Authentication required', 401));
    const payload = await verifyToken(token);
    // Attach user
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch (err) {
    next(createError('Invalid or expired token', 401));
  }
}

// Optional authentication middleware (Available but not used for Orders yet)
export async function optionalAuth(req, res, next) {
  try {
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) token = authHeader.split(' ')[1];
    else if (req.cookies?.access_token) token = req.cookies.access_token;

    if (token) {
      const payload = await verifyToken(token);
      if (payload.purpose === 'access') {
        req.user = { id: payload.sub, email: payload.email, role: payload.role };
      }
    }
  } catch (_) {}
  next();
}
```

---

## 2. Frontend

### Router (`frontend-store/src/App.jsx`)
```jsx
// Checkout is currently wrapped in ProtectedRoute
<Route path="cart"          element={<ProtectedRoute><Cart /></ProtectedRoute>} />
<Route path="checkout"      element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
<Route path="checkout/service" element={<ProtectedRoute><ServiceCheckout /></ProtectedRoute>} />
```

### Checkout Component (`frontend-store/src/pages/Checkout.jsx`)
- Uses `useAuthStore` to get the logged-in user (`const user = useAuthStore((s) => s.user);`).
- Uses `usersApi.getAddresses()` and `usersApi.addAddress()` to handle user addresses.
- Places the order via `ordersApi.create({ ... })`.
- Implements Razorpay integration on the frontend via `window.Razorpay()`.
- An inline address form auto-fills User Profile parameters:
  ```jsx
  const [form, setForm] = useState({
    label: 'Home',
    fullName: user?.name || '',
    phone: user?.phone || '',
    line1: user?.address || '', // ...
  })
  ```

### Login Component (`frontend-store/src/pages/Login.jsx`)
- Accepts a `?redirect=` URL search parameter.
- On success, it redirects to the requested path (`navigate(redirect, { replace: true });`).
- Uses `useAuthStore((s) => s.login)` for fetching API and storing tokens.
- Supports Google OAuth login with the redirect param injected dynamically.

---

## 3. Environment Variables (Keys Only)

### Backend (`backend/.env`)
```text
NODE_ENV, PORT, HOST, CLIENT_URL, ADMIN_URL, DATABASE_URL, VALKEY_URL, REDIS_URL,
PASETO_SECRET_KEY, ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY, SESSION_SECRET,
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL, 
RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET,
SHIPROCKET_EMAIL, SHIPROCKET_PASSWORD, SHIPROCKET_BASE_URL, SHIPROCKET_PICKUP_LOCATION, SHIPROCKET_ORIGIN_PINCODE, SHIPROCKET_WEBHOOK_TOKEN,
CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET,
SMTP_SERVICE, SMTP_USER, SMTP_PASS, FROM_EMAIL, ADMIN_EMAIL, 
GOOGLE_MAPS_API_KEY, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX, COOKIE_DOMAIN
```

### Frontend Store (`frontend-store/.env`)
```text
VITE_API_BASE_URL
VITE_GOOGLE_MAPS_API_KEY
```

---

## 4. Folder Structure (Partial Tree)
```text
photowala/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma         <-- DB schema Models
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   │   ├── auth.js           <-- JWT/Paseto Auth middleware
│   │   ├── routes/
│   │   │   ├── order.routes.js   <-- Order endpoint bindings
│   │   │   └── cart.routes.js
│   └── package.json
│
├── frontend-store/               <-- Customer Facing Application
│   ├── src/
│   │   ├── api/                  <-- Axios requests (usersApi, ordersApi)
│   │   ├── components/
│   │   │   └── ProtectedRoute.jsx<-- Redirects non-logged-in users
│   │   ├── pages/
│   │   │   ├── Checkout.jsx      <-- 3-Step Checkout Flow
│   │   │   ├── Login.jsx         <-- Email & Google Auth
│   │   │   ├── Cart.jsx
│   │   ├── App.jsx               <-- Main React Router Routes
│   │   ├── store/                <-- Zustand for 'auth' & 'cart'
│   └── package.json
│
└── frontend-admin/               <-- Admin Dashboard Application
```