import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import { brandAssets } from '../data/assets';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
  const googleAuthUrl = `${apiBaseUrl}/auth/google?redirect=${encodeURIComponent(redirect)}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedForm = {
      ...form,
      email: form.email.trim(),
    };
    try {
      await login(trimmedForm);
      toast.success('Welcome back! 🎉');
      navigate(redirect, { replace: true });
    } catch (err) {
      if (err?.response?.status === 403 && err?.response?.data?.message?.includes('verify')) {
        toast.error('Please verify your email first.');
        navigate(`/verify-otp?email=${encodeURIComponent(trimmedForm.email)}&redirect=${encodeURIComponent(redirect)}`);
      } else {
        toast.error(err?.response?.data?.message || 'Login failed. Please check your credentials.');
      }
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 bg-linear-to-br from-brand-surface to-cream-200">
      <div className="w-full max-w-md">
        <div className="card p-8 shadow-lg">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="mb-4">
              <img src={brandAssets.logo} alt="Logo" className="h-12 md:h-16 mx-auto object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Welcome Back</h1>
            <p className="text-gray-500 text-sm mt-1">Sign in to your Photowala account</p>
          </div>

          {/* Google OAuth */}
          <a
            href={googleAuthUrl}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-cream-300 rounded-xl text-gray-700 font-semibold text-sm hover:bg-cream-100 transition-colors mb-2"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
            Continue with Google
          </a>
          <p className="text-[10px] text-gray-400 text-center mb-6 px-4">
            Tip: If sign-in is blocked, click the three dots in your app's corner and select <strong>"Open in Browser"</strong>.
          </p>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-cream-300" /></div>
            <div className="relative flex justify-center text-xs text-gray-400 bg-white px-3 mx-auto w-fit">or sign in with email</div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
              <input
                id="login-email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-field"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-field pr-12"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="text-right mt-1">
                <Link to="/forgot-password" className="text-xs text-brand-primary hover:underline font-medium">Forgot password?</Link>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full justify-center text-base py-3.5" id="login-submit-btn">
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to={`/register?redirect=${encodeURIComponent(redirect)}`} className="text-brand-primary font-semibold hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

