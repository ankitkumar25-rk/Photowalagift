import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store';
import { brandAssets } from '../data/assets';

export default function ProtectedRoute({ children }) {
  const user = useAuthStore((s) => s.user);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const location = useLocation();

  // Wait for auth check to complete if not already done
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100">
        <div className="flex flex-col items-center gap-4">
          <img src={brandAssets.logo} alt="Loading..." className="h-12 w-auto animate-pulse" />
          <p className="text-brand-primary font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }
  return children;
}
