import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Loader } from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../store';

export default function VerifyOtp() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email');
  const redirect = searchParams.get('redirect') || '/';
  
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);
  
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    if (!email) {
      toast.error('Email is missing');
      navigate('/register');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (timer > 0) {
      const int = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(int);
    }
  }, [timer]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error('OTP must be 6 digits');

    setSubmitting(true);
    try {
      const { data } = await api.post('/auth/verify-otp', {
        email,
        otp
      });
      toast.success('Account verified successfully!');
      
      // Update auth store with the new user data
        setUser(data.data.user);
      
      navigate(redirect);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Verification failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setResending(true);
    try {
      await api.post('/auth/resend-otp', { email });
      toast.success('OTP sent successfully');
      setTimer(60);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  if (!email) return null;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10 bg-linear-to-br from-brand-surface to-cream-200">
      <div className="w-full max-w-md">
        <div className="card p-8 shadow-lg text-center">
          <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-brand-primary" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-11a1 1 0 112 0v3a1 1 0 01-2 0V7zm1 6a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Check Your Email</h1>
          <p className="text-gray-500 mb-6 text-sm">
            We've sent a 6-digit verification code to
            <br/><strong className="text-gray-800">{email}</strong>
          </p>

          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <input
                type="text"
                maxLength="6"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\\D/g, ''))}
                placeholder="000000"
                className="w-full text-center text-3xl tracking-[1em] font-mono p-4 border-2 border-cream-300 rounded-xl focus:border-brand-primary focus:ring-0 transition-colors"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={submitting || otp.length !== 6} 
              className="btn-primary w-full justify-center py-4 flex items-center gap-2 text-lg font-bold"
            >
              {submitting && <Loader className="w-5 h-5 animate-spin" />}
              {submitting ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-cream-200 text-sm text-gray-500">
            Didn't receive the code?{' '}
            <button
              onClick={handleResend}
              disabled={timer > 0 || resending}
              className={`font-semibold ${timer > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-brand-primary hover:underline'}`}
            >
              {resending ? 'Sending...' : timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
