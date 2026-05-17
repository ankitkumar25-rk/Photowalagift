import { useEffect, useState } from 'react';

export const useGoogleMaps = () => {
  const [isLoaded, setIsLoaded] = useState(
    typeof window !== 'undefined' && !!window.google
  );

  useEffect(() => {
    if (window.google) {
      setIsLoaded(true);
      return;
    }

    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    // Gracefully handle undefined, empty, or placeholder keys
    const isKeyValid = key && key !== 'undefined' && key !== 'your_google_maps_api_key_here' && key.trim() !== '';

    if (!isKeyValid) {
      setIsLoaded(false);
      return;
    }

    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) return;

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&region=IN&language=en`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => {
      console.error('[Google Maps] Failed to load');
      setIsLoaded(false);
    };
    document.head.appendChild(script);
  }, []);

  return { isLoaded };
};
