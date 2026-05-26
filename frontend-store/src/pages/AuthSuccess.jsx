import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import toast from 'react-hot-toast';
import { brandAssets } from '../data/assets';
import CompleteProfileModal from '../components/CompleteProfileModal';

// Landing page after Google OAuth redirect
// Backend sets httpOnly cookies before redirecting here
export default function AuthSuccess() {
  const navigate = useNavigate();
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const user = useAuthStore((s) => s.user);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [redirect, setRedirect] = useState('/');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlAccessToken = params.get('access_token') || params.get('accessToken');
    const urlRefreshToken = params.get('refresh_token') || params.get('refreshToken');
    const urlRedirect = params.get('redirect') || '/';
    setRedirect(urlRedirect);
    const storedAccessToken = localStorage.getItem('token');
    const storedRefreshToken = localStorage.getItem('refreshToken');
    const accessToken = urlAccessToken || storedAccessToken;
    const refreshToken = urlRefreshToken || storedRefreshToken;
    const fullUrl = window.location.href;

    console.log('[Auth] AuthSuccess - Full URL:', fullUrl);
    console.log('[Auth] AuthSuccess callback - URL params:', { 
      accessToken: !!accessToken, 
      refreshToken: !!refreshToken,
      accessTokenLength: accessToken?.length,
      refreshTokenLength: refreshToken?.length,
      accessTokenPreview: accessToken ? `${accessToken.substring(0, 20)}...${accessToken.substring(accessToken.length - 20)}` : 'N/A',
      refreshTokenPreview: refreshToken ? `${refreshToken.substring(0, 20)}...${refreshToken.substring(refreshToken.length - 20)}` : 'N/A',
    });

    // If tokens are in URL, save them (fallback for cookie-blocking browsers).
    // If URL is already cleaned by App bootstrap, fall back to localStorage.
    if (urlAccessToken) {
      if (typeof urlAccessToken !== 'string' || urlAccessToken.length < 50) {
        console.error('[Auth] ERROR: Invalid access_token format!', { length: urlAccessToken?.length, token: urlAccessToken });
        toast.error('Sign-in failed: Invalid token format. Please try again.');
        navigate('/login', { replace: true });
        return;
      }
      document.cookie = `access_token=${urlAccessToken}; path=/; max-age=900; SameSite=Lax`;
      localStorage.setItem('token', urlAccessToken);
      console.log('[Auth] Access token saved to localStorage, length:', urlAccessToken.length);
    }

    if (urlRefreshToken) {
      if (typeof urlRefreshToken !== 'string' || urlRefreshToken.length < 50) {
        console.error('[Auth] ERROR: Invalid refresh_token format!', { length: urlRefreshToken?.length, token: urlRefreshToken });
        toast.error('Sign-in failed: Invalid refresh token format. Please try again.');
        navigate('/login', { replace: true });
        return;
      }
      document.cookie = `refresh_token=${urlRefreshToken}; path=/; max-age=604800; SameSite=Lax`;
      localStorage.setItem('refreshToken', urlRefreshToken);
      console.log('[Auth] Refresh token saved to localStorage, length:', urlRefreshToken.length);
    }

    if (!accessToken || !refreshToken) {
      console.error('[Auth] Google OAuth incomplete - missing tokens (URL + localStorage).');
      toast.error('Sign-in failed: Missing authentication tokens. Please try again.');
      navigate('/login', { replace: true });
      return;
    }

    // Verify tokens were saved before making request
    const savedToken = localStorage.getItem('token');
    const savedRefreshToken = localStorage.getItem('refreshToken');
    console.log('[Auth] Verification - tokens in localStorage:', {
      token: !!savedToken,
      refreshToken: !!savedRefreshToken,
      tokenLength: savedToken?.length,
      refreshTokenLength: savedRefreshToken?.length,
      match: {
        accessTokenMatches: savedToken === accessToken,
        refreshTokenMatches: savedRefreshToken === refreshToken,
      }
    });

    if (!savedToken || !savedRefreshToken) {
      console.error('[Auth] CRITICAL: Tokens failed to save to localStorage!');
      toast.error('Sign-in failed: Could not save session tokens. Please try again.');
      navigate('/login', { replace: true });
      return;
    }

    // Fetch user info with retry logic for timing issues
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = (attempt) => Math.min(1000 * Math.pow(2, attempt), 5000); // Exponential backoff

    const attemptFetchMe = async () => {
      try {
        await fetchMe();
        console.log('[Auth] fetchMe successful');
        
        // Check if profile is complete (has phone number)
        const currentUser = useAuthStore.getState().user;
        if (!currentUser?.phone) {
          console.log('[Auth] Profile incomplete - showing profile modal');
          setShowProfileModal(true);
        } else {
          console.log('[Auth] Profile complete, redirecting to:', urlRedirect);
          toast.success('Signed in successfully!');
          navigate(urlRedirect, { replace: true });
        }
      } catch (err) {
        retryCount++;
        console.error(`[Auth] fetchMe attempt ${retryCount} failed:`, err.message);
        
        if (retryCount < maxRetries) {
          const delay = retryDelay(retryCount - 1);
          console.log(`[Auth] Retrying fetchMe in ${delay}ms...`);
          setTimeout(attemptFetchMe, delay);
        } else {
          console.error('[Auth] fetchMe failed after all retries');
          toast.error('Sign-in failed. Please try again.');
          navigate('/login', { replace: true });
        }
      }
    };

    // Start the attempt
    attemptFetchMe();
  }, [fetchMe, navigate]);

  const handleProfileComplete = () => {
    setShowProfileModal(false);
    toast.success('Profile updated! Welcome to Photowala! 🎉');
    navigate(redirect, { replace: true });
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-cream-100">
        <div className="flex flex-col items-center gap-4">
          <img src={brandAssets.logo} alt="Loading..." className="h-12 w-auto animate-pulse" />
          <p className="text-brand-primary font-semibold text-lg">Signing you in...</p>
        </div>
      </div>

      {/* Profile Completion Modal for OAuth Users */}
      {user && (
        <CompleteProfileModal 
          user={user}
          isOpen={showProfileModal}
          onComplete={handleProfileComplete}
        />
      )}
    </>
  );
}

