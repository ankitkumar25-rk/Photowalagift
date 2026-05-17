import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { lazy, Suspense, useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';
import api, { doTokenRefresh } from './api/client';

const SESSION_DURATION = 60 * 60 * 1000;   // 1 hour
const REFRESH_INTERVAL = 13 * 60 * 1000;   // 13 minutes
const WARN_AT = 55 * 60 * 1000;             // warn at 55 minutes

// ── Auth Store ───────────────────────────────────────────────
// eslint-disable-next-line react-refresh/only-export-components
let adminFetchMePromise = null;
export const useAdminStore = create(
  persist(
    (set, get) => ({
      user: null,
      isFetching: false,
      isInitialized: false, // Added to track if initial auth check is done
      sessionExpired: false,
      
      setSessionExpired: (val) => set({ sessionExpired: val }),
      setUser: (user) => set({ user }),
      logout: () => { 
        set({ user: null, isInitialized: true }); 
        adminFetchMePromise = null; 
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('admin-auth');
      },
      
      fetchMe: async () => {
        // Prevent concurrent fetchMe calls
        if (adminFetchMePromise) return adminFetchMePromise;
        
        set({ isFetching: true });
        adminFetchMePromise = (async () => {
          try {
            const response = await api.get('/auth/me');
            const { data } = response;
            
            // Extract user from correct response structure
            const userData = data?.data?.user || data?.data;
            
            if (!['ADMIN', 'SUPER_ADMIN'].includes(userData?.role)) {
              throw new Error('Admin role required');
            }
            set({ user: userData, isFetching: false, isInitialized: true });
            return userData;
          } catch (err) {
            console.error('Initial auth check failed:', err.message || err);
            set({ user: null, isFetching: false, isInitialized: true });
            // Only redirect to login if not already there
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
          } finally {
            adminFetchMePromise = null;
          }
        })();
        return adminFetchMePromise;
      },
    }),
    { 
      name: 'admin-auth', 
      storage: {
        getItem: (name) => localStorage.getItem(name),
        setItem: (name, value) => localStorage.setItem(name, value),
        removeItem: (name) => localStorage.removeItem(name),
      },
      partialize: (s) => ({ user: s.user }) 
    }
  )
);

// ── Pages ────────────────────────────────────────────────────
const AdminLogin      = lazy(() => import('./pages/AdminLogin'));
const Dashboard       = lazy(() => import('./pages/Dashboard'));
const AdminProducts   = lazy(() => import('./pages/AdminProducts'));
const AdminProductForm = lazy(() => import('./pages/AdminProductForm'));
const AdminOrders     = lazy(() => import('./pages/AdminOrders'));
const AdminOrderDetail = lazy(() => import('./pages/AdminOrderDetail'));
const AdminCustomers  = lazy(() => import('./pages/AdminCustomers'));
const AdminCustomerDetail = lazy(() => import('./pages/AdminCustomerDetail'));
const AdminReturns    = lazy(() => import('./pages/AdminReturns'));
const AdminInventory  = lazy(() => import('./pages/AdminInventory'));
const AdminSupport    = lazy(() => import('./pages/AdminSupport'));

// Service Orders
const MachineOrders   = lazy(() => import('./pages/services/MachineOrders'));
const PrintOrders     = lazy(() => import('./pages/services/PrintOrders'));
const ServiceOrderDetail = lazy(() => import('./pages/services/ServiceOrderDetail'));

const AdminLayout = lazy(() => import('./components/AdminLayout'));

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 2 * 60 * 1000, retry: 1 } } });

function Loader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="text-4xl mb-3">🏆</div>
        <p className="text-gray-500 font-medium">Loading admin...</p>
      </div>
    </div>
  );
}

function RequireAdmin({ children }) {
  const user = useAdminStore((s) => s.user);
  const isInitialized = useAdminStore((s) => s.isInitialized);

  // MUST wait for initialization (initial fetchMe) to complete
  if (!isInitialized) return <Loader />;
  
  // If check is done and no user, or user is not admin, redirect
  if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  // Authorized
  return children;
}

export default function App() {
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      useAdminStore.getState().fetchMe().catch((err) => {
        console.error('Initial auth check failed:', err);
      });
    } else {
      useAdminStore.setState({ isInitialized: true });
    }
  }, []);

  useEffect(() => {
    let lastActivity = Date.now();
    let toastId = null;

    const refreshSilently = async () => {
      try {
        await doTokenRefresh();
      } catch (err) {
        console.error('Silent refresh failed:', err);
      }
    };

    // Initial silent refresh timer
    const refreshInterval = setInterval(refreshSilently, REFRESH_INTERVAL);

    const updateActivity = () => {
      lastActivity = Date.now();
    };

    // Track user activity
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('scroll', updateActivity);

    const checkInactivity = setInterval(() => {
      const inactiveTime = Date.now() - lastActivity;

      if (inactiveTime >= SESSION_DURATION) {
        // Session expired
        useAdminStore.getState().logout();
        useAdminStore.getState().setSessionExpired(true);
      } else if (inactiveTime >= WARN_AT) {
        // Warn
        if (!toastId) {
          toastId = toast.error("Your session expires in 5 minutes. Click anywhere to stay logged in", { duration: 300000 });
        }
      } else {
        // Active
        if (toastId) {
          toast.dismiss(toastId);
          toastId = null;
        }
      }
    }, 60 * 1000); // Check every minute

    const handleVisibility = () => {
      if (!document.hidden) {
        const token = localStorage.getItem('token');
        if (!token) {
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(refreshInterval);
      clearInterval(checkInactivity);
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ style: { fontFamily: 'DM Sans, sans-serif', borderRadius: '12px', fontSize: '14px' } }} />
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="/login" element={<AdminLogin />} />
            <Route path="/" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
              <Route index              element={<Dashboard />} />
              <Route path="products"    element={<AdminProducts />} />
              <Route path="products/new" element={<AdminProductForm />} />
              <Route path="products/id/:id/edit" element={<AdminProductForm />} />
              <Route path="products/:slug/edit" element={<AdminProductForm />} />
              <Route path="orders"      element={<AdminOrders />} />
              <Route path="orders/:id" element={<AdminOrderDetail />} />
              <Route path="customers"   element={<AdminCustomers />} />
              <Route path="customers/:id" element={<AdminCustomerDetail />} />
              <Route path="returns"     element={<AdminReturns />} />
              <Route path="inventory"   element={<AdminInventory />} />
              <Route path="support"     element={<AdminSupport />} />
              
              {/* Service Orders */}
              <Route path="machine-orders" element={<MachineOrders />} />
              <Route path="print-orders"   element={<PrintOrders />} />
              <Route path="services/orders/:id" element={<ServiceOrderDetail />} />

            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
