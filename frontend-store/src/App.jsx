import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';

import { useAuthStore, useCartStore } from './store';
import Layout from './components/Layout';
import { brandAssets } from './data/assets';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import { WishlistProvider } from './contexts/WishlistContext';

// Pages (lazy loaded)
import { lazy, Suspense } from 'react';
const Home          = lazy(() => import('./pages/Home'));
const Products      = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart          = lazy(() => import('./pages/Cart'));
const Checkout      = lazy(() => import('./pages/Checkout'));
const Orders        = lazy(() => import('./pages/Orders'));
const OrderDetail   = lazy(() => import('./pages/OrderDetail'));
const OrderSuccess  = lazy(() => import('./pages/OrderSuccess'));
const Account       = lazy(() => import('./pages/Account'));
const Wishlist      = lazy(() => import('./pages/Wishlist'));
const Login         = lazy(() => import('./pages/Login'));
const Register      = lazy(() => import('./pages/Register'));
const Category      = lazy(() => import('./pages/Category'));
const AuthSuccess   = lazy(() => import('./pages/AuthSuccess'));
const TrackOrder    = lazy(() => import('./pages/TrackOrder'));
const Returns       = lazy(() => import('./pages/Returns'));
const FAQ           = lazy(() => import('./pages/FAQ'));
const Privacy       = lazy(() => import('./pages/Privacy'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword  = lazy(() => import('./pages/ResetPassword'));
const Services      = lazy(() => import('./pages/Services'));
const CustomPrintingIndex = lazy(() => import('./pages/services/CustomPrinting/CustomPrintingIndex'));
const LaserPrintedPen = lazy(() => import('./pages/services/CustomPrinting/Pen/LaserPrintedPen'));
const Letterhead      = lazy(() => import('./pages/services/CustomPrinting/Letterhead/Letterhead'));
const Envelope        = lazy(() => import('./pages/services/CustomPrinting/Envelope/Envelope'));
const StickerLabels      = lazy(() => import('./pages/services/CustomPrinting/StickerLabels/StickerLabels'));
const GarmentTag      = lazy(() => import('./pages/services/CustomPrinting/GarmentTag/GarmentTag'));
const BillBook        = lazy(() => import('./pages/services/CustomPrinting/BillBook/BillBook'));
const DigitalPrinting = lazy(() => import('./pages/services/CustomPrinting/DigitalPrinting/DigitalPrinting'));
const CO2LaserService = lazy(() => import('./pages/services/MachineServices/CO2LaserService'));
const LaserMarkingService = lazy(() => import('./pages/services/MachineServices/LaserMarkingService'));
const CNCRouterService = lazy(() => import('./pages/services/MachineServices/CNCRouterService'));
const MyServiceOrders = lazy(() => import('./pages/MyServiceOrders'));
const ServiceCheckout = lazy(() => import('./pages/ServiceCheckout'));
const ServiceConfirmation = lazy(() => import('./pages/ServiceConfirmation'));
const ComingSoon      = lazy(() => import('./pages/ComingSoon'));
const BulkOrders    = lazy(() => import('./pages/BulkOrders'));
const NotFound      = lazy(() => import('./pages/NotFound'));


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-100">
      <div className="flex flex-col items-center gap-4">
        <img src={brandAssets.logo} alt="Loading..." className="h-12 w-auto animate-pulse" />
        <p className="text-brand-primary font-medium">Loading...</p>
      </div>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    // IMPORTANT: If we just returned from OAuth, store URL tokens BEFORE any auth calls.
    // This prevents a race where the app mounts and calls /auth/me without tokens.
    try {
      const params = new URLSearchParams(window.location.search);
      const accessToken = params.get('access_token') || params.get('accessToken');
      const refreshToken = params.get('refresh_token') || params.get('refreshToken');
      const hasOAuthTokens = !!(accessToken && refreshToken);

      if (hasOAuthTokens) {
        localStorage.setItem('token', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        window.history.replaceState({}, '', window.location.pathname);
      }
    } catch (e) {
      console.warn('[Auth] OAuth token bootstrap failed:', e);
    }

    // Initial auth check on app mount - only if we have a token to verify
    const token = localStorage.getItem('token');
    if (token) {
      useAuthStore.getState().fetchMe().catch((err) => {
        console.error('Initial auth check failed:', err);
      });
    } else {
      // If no token, mark as initialized so UI can show
      useAuthStore.getState().finishInitialization();
    }
  }, []); // Empty array: run only once on mount



  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <WishlistProvider>
          <ScrollToTop />
          <Toaster
            position="top-right"
            toastOptions={{
              style: { fontFamily: 'DM Sans, sans-serif', borderRadius: '14px', border: '1px solid #efd3c1', background: '#fffdfb', color: '#2e211c' },
              success: { style: { background: '#f1ffe9', color: '#36521f', border: '1px solid #b7d894' } },
              error:   { style: { background: '#fff1ef', color: '#8f2d1d', border: '1px solid #f0b6aa' } },
            }}
          />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index                element={<Home />} />
                <Route path="products"      element={<Products />} />
                <Route path="products/:slug" element={<ProductDetail />} />
                <Route path="categories/:slug" element={<Category />} />
                <Route path="bulk-orders"   element={<BulkOrders />} />
                <Route path="cart"          element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                <Route path="login"         element={<Login />} />
                <Route path="register"      element={<Register />} />

                {/* Protected Routes */}
                <Route path="checkout"  element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                <Route path="checkout/service" element={<ProtectedRoute><ServiceCheckout /></ProtectedRoute>} />
                <Route path="services/confirmation/:serviceOrderId" element={<ProtectedRoute><ServiceConfirmation /></ProtectedRoute>} />
                <Route path="orders"    element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                <Route path="orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
                <Route path="orders/:orderId/success" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
                <Route path="account"   element={<ProtectedRoute><Account /></ProtectedRoute>} />
                <Route path="account/services" element={<ProtectedRoute><MyServiceOrders /></ProtectedRoute>} />
                <Route path="wishlist"  element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />

                {/* Auth flow routes */}
                <Route path="auth/success"     element={<AuthSuccess />} />
                <Route path="track-order"      element={<TrackOrder />} />
                <Route path="returns"          element={<Returns />} />
                <Route path="faq"              element={<FAQ />} />
                <Route path="services"         element={<ProtectedRoute><Services /></ProtectedRoute>} />
                <Route path="services/custom-printing" element={<ProtectedRoute><CustomPrintingIndex /></ProtectedRoute>} />
                <Route path="services/custom-printing/pen" element={<ProtectedRoute><LaserPrintedPen /></ProtectedRoute>} />
                <Route path="services/custom-printing/letterhead" element={<ProtectedRoute><ComingSoon service="Letterhead" /></ProtectedRoute>} />
                <Route path="services/custom-printing/envelope" element={<ProtectedRoute><ComingSoon service="Envelope" /></ProtectedRoute>} />
                <Route path="services/custom-printing/sticker-labels" element={<ProtectedRoute><ComingSoon service="Sticker Labels" /></ProtectedRoute>} />
                <Route path="services/custom-printing/sticker-labels/:type" element={<ProtectedRoute><ComingSoon service="Sticker Labels" /></ProtectedRoute>} />
                <Route path="services/custom-printing/garment-tag" element={<ProtectedRoute><ComingSoon service="Garment Tag" /></ProtectedRoute>} />
                <Route path="services/custom-printing/garment-thread" element={<ProtectedRoute><ComingSoon service="Garment Thread" /></ProtectedRoute>} />
                <Route path="services/custom-printing/garment-gloss" element={<ProtectedRoute><ComingSoon service="Garment Gloss" /></ProtectedRoute>} />
                <Route path="services/custom-printing/garment-matt" element={<ProtectedRoute><ComingSoon service="Garment Matt" /></ProtectedRoute>} />
                <Route path="services/custom-printing/garment-uv" element={<ProtectedRoute><ComingSoon service="Garment UV" /></ProtectedRoute>} />
                <Route path="services/custom-printing/bill-book" element={<ProtectedRoute><ComingSoon service="Bill Book" /></ProtectedRoute>} />
                <Route path="services/custom-printing/digital-printing" element={<ProtectedRoute><ComingSoon service="Digital Printing" /></ProtectedRoute>} />
                <Route path="services/machine-services/co2-laser" element={<ProtectedRoute><CO2LaserService /></ProtectedRoute>} />
                <Route path="services/machine-services/laser-marking" element={<ProtectedRoute><LaserMarkingService /></ProtectedRoute>} />
                <Route path="services/machine-services/cnc-router" element={<ProtectedRoute><CNCRouterService /></ProtectedRoute>} />

                <Route path="privacy"          element={<Privacy />} />
                <Route path="forgot-password"  element={<ForgotPassword />} />
                <Route path="reset-password"   element={<ResetPassword />} />

                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </Suspense>
        </WishlistProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
