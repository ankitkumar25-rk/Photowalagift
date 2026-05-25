import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import { brandAssets } from '../data/assets';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [showPw, setShowPw] = useState(false);
  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
  const googleAuthUrl = `${apiBaseUrl}/auth/google?redirect=${encodeURIComponent(redirect)}`;

  const getPasswordStrength = (pw) => {
    let score = 0;
    if (!pw) return 0;
    if (pw.length >= 8) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    const trimmedForm = {
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
    };
    try {
      await register(trimmedForm);
      toast.success('Welcome to Photowala! 🏆');
      navigate(redirect, { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10 bg-gradient-to-br from-brand-surface to-cream-200">
      <div className="w-full max-w-md">
        <div className="card p-8 shadow-lg">
          <div className="text-center mb-8">
            <div className="mb-4">
              <img src={brandAssets.logo} alt="Logo" className="h-12 md:h-16 mx-auto object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Create Account</h1>
            <p className="text-gray-500 text-sm mt-1">Join Photowala to start creating gifts</p>
          </div>

          {/* Google OAuth */}
          <a
            href={googleAuthUrl}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-cream-300 rounded-xl text-gray-700 font-semibold text-sm hover:bg-cream-100 transition-colors mb-2"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
            Sign up with Google
          </a>
          <p className="text-[10px] text-gray-400 text-center mb-6 px-4">
            Tip: If sign-in is blocked, click the three dots in your app's corner and select <strong>"Open in Browser"</strong>.
          </p>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-cream-300" /></div>
            <div className="relative flex justify-center text-xs text-gray-400 bg-white px-3 mx-auto w-fit">or register with email</div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
              <input id="reg-name" type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Priya Sharma" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
              <input id="reg-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone (optional)</label>
              <input 
                id="reg-phone" 
                type="tel" 
                value={form.phone} 
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 10) setForm({ ...form, phone: val });
                }} 
                pattern="[0-9]{10}"
                className="input-field" 
                placeholder="10-digit mobile number" 
              />
              <p className="text-[10px] text-gray-400 mt-1">If provided, must be exactly 10 digits.</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPw ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-field pr-12"
                  placeholder="Min. 8 characters"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {/* Password strength meter */}
              {form.password && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex justify-between items-center px-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Security Strength</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      getPasswordStrength(form.password) <= 1 ? 'text-red-500' : 
                      getPasswordStrength(form.password) <= 2 ? 'text-amber-500' : 
                      'text-green-600'
                    }`}>
                      {getPasswordStrength(form.password) <= 1 ? 'Weak' : 
                       getPasswordStrength(form.password) <= 2 ? 'Good' : 
                       'Strong'}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div 
                        key={level}
                        className={`h-full flex-1 transition-all duration-500 ${
                          level <= getPasswordStrength(form.password) 
                            ? (getPasswordStrength(form.password) <= 1 ? 'bg-red-500' : 
                               getPasswordStrength(form.password) <= 2 ? 'bg-amber-500' : 
                               'bg-green-600')
                            : 'bg-gray-100'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400 leading-tight">
                    Use 8+ characters with mixed case, numbers & symbols.
                  </p>
                </div>
              )}
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full justify-center text-base py-3.5 mt-2" id="register-submit-btn">
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to={`/login?redirect=${encodeURIComponent(redirect)}`} className="text-brand-primary font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

