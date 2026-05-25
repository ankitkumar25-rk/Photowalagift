import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey:             import.meta.env.VITE_FIREBASE_API_KEY || "placeholder_api_key",
  authDomain:         import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "placeholder_auth_domain",
  projectId:          import.meta.env.VITE_FIREBASE_PROJECT_ID || "placeholder_project_id",
  storageBucket:      import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "placeholder_storage_bucket",
  messagingSenderId:  import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "placeholder_messaging_sender_id",
  appId:              import.meta.env.VITE_FIREBASE_APP_ID || "placeholder_app_id"
};

let auth = null;

try {
  const isPlaceholder = Object.values(firebaseConfig).some(v => v.includes("placeholder"));
  if (isPlaceholder) {
    console.warn('[Firebase] Storefront running in graceful fallback mode. Please configure your Firebase environment variables in VITE_FIREBASE_*.');
  } else {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    console.log('[Firebase] Client-side SDK initialized successfully.');
  }
} catch (err) {
  console.error('[Firebase] Initialization failed:', err.message);
}

export { auth };
export default auth;
