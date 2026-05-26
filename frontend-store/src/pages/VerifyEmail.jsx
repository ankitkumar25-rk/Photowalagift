import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import toast from 'react-hot-toast';
import { brandAssets } from '../data/assets';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (!token || !email) {
      setStatus('error');
      setMessage('Invalid verification link. Missing token or email.');
      return;
    }

    const verifyEmail = async () => {
      try {
        const { data } = await api.post('/auth/verify-email', { token, email });
        setStatus('success');
        setMessage(data.message || 'Email verified successfully!');
        toast.success('Email verified! You are now logged in.');
        
        // Redirect to home after 3 seconds
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } catch (error) {
        setStatus('error');
        setMessage(error?.response?.data?.message || 'Failed to verify email. The link may have expired.');
        toast.error('Email verification failed');
      }
    };

    verifyEmail();
  }, [token, email, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-brand-surface to-cream-200">
      <div className="w-full max-w-md">
        <div className="card p-8 shadow-lg">
          {status === 'verifying' && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 mx-auto">
                <div className="animate-spin inline-block">
                  <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full"></div>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Verifying Email</h1>
                <p className="text-gray-600 mt-2">Please wait while we verify your email address...</p>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Email Verified! ✅</h1>
                <p className="text-gray-600 mb-4">{message}</p>
                <p className="text-gray-500 text-sm">Redirecting you to home in a few seconds...</p>
              </div>

              <button
                onClick={() => navigate('/')}
                className="w-full btn-primary justify-center py-3"
              >
                Go to Home Now
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Verification Failed</h1>
                <p className="text-gray-600 mb-4">{message}</p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => navigate('/register')}
                  className="w-full btn-primary justify-center py-3"
                >
                  Try Registering Again
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full btn-secondary justify-center py-3"
                >
                  Go to Login
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
