# Gifts, Trophies & Mementos E-commerce Platform

A comprehensive and secure e-commerce platform specifically designed for selling premium gifts, trophies, and mementos. This project features a robust backend API, a customer-facing storefront, and a powerful administrative dashboard.

## 🚀 Architecture & Tech Stack

### Backend
- **Core**: Node.js with Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: Stateless PASETO tokens & Google OAuth 2.0
- **Storage**: Cloudinary (Product images)
- **Email**: Resend SDK (Transactional emails)
- **Payments**: Razorpay (Webhooks & COD support)
- **Security**: Redis-backed rate limiting, Helmet.js, CORS

### Frontend (Store & Admin)
- **Framework**: React (Vite-based SPA)
- **Styling**: Tailwind CSS (Luxury brand theme: Mobile-first responsive layouts, glassmorphism, HSL-tailored colors)
- **State Management**: Zustand (Atomic stores) & Context API
- **Data Fetching**: TanStack React Query (Caching & Synchronization)
- **Charts**: Recharts (Administrative analytics)

---

## 📂 Project Structure

```bash
.
├── backend/            # Express API, Prisma Schema, Auth & Payments Logic
├── frontend-store/     # Customer-facing storefront application
└── frontend-admin/     # Role-based administrative dashboard
```

---

## ✨ Key Features

- **Advanced Accounts**: Email/Password login, Google Social Login, Email Verification via SMTP (Resend), and Password Recovery.
- **Catalog Management**: Hierarchical categories, dynamic product filtering (price, category), and smart sorting.
- **Order Lifecycle**: Secure checkout, Razorpay integration, automated stock tracking, and webhook validation.
- **Returns & Refunds**: End-to-end lifecycle management for order returns and automated refund processing.
- **Analytics & CMS**: Sales reports, revenue breakdowns, and dynamic homepage banner management via Admin Dashboard.
- **Support System**: Integrated support ticket mechanism for both customers and administrators.

---

## 🛠️ Setup & Installation

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL
- Redis (for rate limiting)
- Cloudinary, Razorpay, and Resend accounts

### 2. Backend Setup
```bash
cd backend
npm install

# Configure Environment Variables
cp .env.example .env
# Edit .env with your credentials

# Database Setup
npx prisma generate
npx prisma db push
npm run seed        # Optional: Seed initial data
```

### 3. Frontend Store Setup
```bash
cd frontend-store
npm install
npm run dev
```

### 4. Admin Dashboard Setup
```bash
cd frontend-admin
npm install
npm run dev
```

---

## 🔑 Environment Variables

### Backend
The backend requires the following configuration in `.env`:

| Variable | Description |
| :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `PASETO_SECRET_KEY` | 32-byte hex secret for tokens |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `RAZORPAY_KEY_ID` | Razorpay Key ID |
| `CLOUDINARY_API_KEY`| Cloudinary API Key |
| `RESEND_API_KEY` | Resend API Key |

*(See `backend/.env.example` for the full list)*

### Frontend (Store & Admin)
The frontend requires:

| Variable | Description |
| :--- | :--- |
| `VITE_API_BASE_URL` | Backend API base URL (e.g., `http://localhost:5000/api`) |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API key for address validation |

*(See `frontend-store/.env.example` for the full list)*

---

## 🛡️ Security Features
- **PASETO**: Modern, secure alternative to JWT.
- **Rate Limiting**: Redis-backed protection against brute force and DDoS.
- **Secure Headers**: Using Helmet.js for XSS and Clickjacking protection.
- **Validation**: Schema validation using Zod for all API requests.

---

## 📄 License
This project is licensed under the ISC License.
