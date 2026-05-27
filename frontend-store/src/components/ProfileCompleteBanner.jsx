import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { X, Sparkles } from 'lucide-react';

export default function ProfileCompleteBanner() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  
  // Reactively check if profile is complete (calls getter on the store)
  const isProfileComplete = useAuthStore((s) => s.isProfileComplete?.() || false);
  
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isDismissed = sessionStorage.getItem('profileBannerDismissed') === 'true';
    setDismissed(isDismissed);
  }, []);

  // Show banner only if user is logged in, profile is NOT complete, and not dismissed this session
  if (!user || isProfileComplete || dismissed) {
    return null;
  }

  const handleDismiss = (e) => {
    e.stopPropagation(); // prevent navigation on clicking close button
    sessionStorage.setItem('profileBannerDismissed', 'true');
    setDismissed(true);
  };

  const handleNavigate = () => {
    navigate('/account');
  };

  return (
    <div 
      onClick={handleNavigate}
      role="banner"
      className="sticky top-[112px] md:top-[128px] z-40 w-full h-[44px] bg-[#5a3f2f] hover:bg-[#4a3324] text-[#fdf8f3] font-sans text-sm font-medium flex items-center justify-between px-6 cursor-pointer transition-all duration-300 border-b border-[#b88a2f]/20 shadow-md animate-slide-down"
    >
      <div className="flex items-center gap-2 overflow-hidden truncate">
        <Sparkles className="w-4 h-4 text-[#b88a2f] shrink-0 animate-pulse" />
        <span className="truncate">Complete your profile for faster checkout →</span>
      </div>
      <button 
        onClick={handleDismiss}
        className="p-1.5 hover:bg-white/10 rounded-full transition-colors shrink-0"
        aria-label="Dismiss banner"
      >
        <X className="w-4 h-4 text-white" />
      </button>
    </div>
  );
}
