import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { brandAssets } from '../data/assets';
import api from '../api/client';
import { useAuthStore } from '../store';

export default function ResetPassword() {
  const [params]              = useSearchParams();
  const token                 = params.get('token');
  const navigate              = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);

  if (!token) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 font-medium mb-4">Invalid or missing reset token.</p>
          <Link to="/forgot-password" className="btn-primary">Request new link</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      
      // Clear frontend auth state completely
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('auth-storage');
        useAuthStore.getState().setUser(null);
      } catch (e) {
        console.warn('Failed to clear auth state:', e);
      }

      setDone(true);
      setTimeout(() => navigate('/login', { replace: true }), 3000);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Reset link may have expired. Request a new one.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 bg-linear-to-br from-brand-surface to-cream-200">
      <div className="w-full max-w-md">
        <div className="card p-8 shadow-lg">
          <div className="text-center mb-8">
            <div className="mb-4">
              <img src={brandAssets.logo} alt="Logo" className="h-12 md:h-16 mx-auto object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Set New Password</h1>
            <p className="text-gray-500 text-sm mt-1">Choose a strong password to secure your Photowala account</p>
          </div>

          {done ? (
            <div className="text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-brand-primary mx-auto" />
              <h2 className="font-semibold text-gray-800">Password Reset!</h2>
              <p className="text-sm text-gray-500">Redirecting you to login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    id="reset-password"
                    type={showPw ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pr-12"
                    placeholder="Min. 8 characters"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password</label>
                <input
                  id="reset-confirm"
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="input-field"
                  placeholder="Repeat new password"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-3.5"
                id="reset-submit-btn"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

