import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let firebaseApp = null;
let isInitialized = false;

/**
 * Initialize Firebase Admin SDK
 * Attempts to load credentials from environment variables first,
 * then falls back to firebase-service-account.json file.
 */
const initializeFirebase = () => {
  if (isInitialized) return firebaseApp;

  try {
    // Check if environment variables are provided
    const hasEnvCredentials = Boolean(
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    );

    let serviceAccountKey = null;

    if (hasEnvCredentials) {
      // Use environment variables
      serviceAccountKey = {
        type: 'service_account',
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || '',
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID || '',
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      };
      console.log('[Firebase] Loaded credentials from environment variables.');
    } else {
      // Try to load from firebase-service-account.json
      const serviceAccountPath = path.join(__dirname, '../config/firebase-service-account.json');
      if (fs.existsSync(serviceAccountPath)) {
        const rawData = fs.readFileSync(serviceAccountPath, 'utf8');
        serviceAccountKey = JSON.parse(rawData);
        console.log('[Firebase] Loaded credentials from firebase-service-account.json.');
      } else {
        console.warn('[Firebase] No credentials found. Backend running in graceful fallback mode.');
        console.warn('[Firebase] Set environment variables or upload firebase-service-account.json:');
        console.warn('  Environment Variables:');
        console.warn('    - FIREBASE_PROJECT_ID');
        console.warn('    - FIREBASE_CLIENT_EMAIL');
        console.warn('    - FIREBASE_PRIVATE_KEY');
        console.warn('  File: backend/src/config/firebase-service-account.json');
        isInitialized = true;
        return null;
      }
    }

    if (!serviceAccountKey) {
      isInitialized = true;
      return null;
    }

    // Initialize Firebase Admin SDK
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccountKey),
      projectId: serviceAccountKey.project_id,
    });

    console.log('[Firebase] Admin SDK initialized successfully.');
    isInitialized = true;
    return firebaseApp;
  } catch (err) {
    console.error('[Firebase] Initialization failed:', err.message);
    console.warn('[Firebase] Backend running in graceful fallback mode.');
    isInitialized = true;
    return null;
  }
};

/**
 * Verify Firebase ID Token
 * @param {string} idToken - Firebase ID token from client
 * @returns {Promise<object>} - Decoded token payload
 * @throws {Error} - If verification fails
 */
export const verifyFirebaseToken = async (idToken) => {
  if (!firebaseApp) {
    throw new Error('Firebase Admin SDK not initialized. Cannot verify token.');
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (err) {
    console.error('[Firebase] Token verification failed:', err.message);
    throw new Error(`Invalid Firebase ID token: ${err.message}`);
  }
};

/**
 * Extract phone number from Firebase token
 * @param {object} decodedToken - Decoded Firebase ID token
 * @returns {string|null} - Phone number (without +91 prefix) or null
 */
export const getPhoneFromToken = (decodedToken) => {
  if (!decodedToken.phone_number) return null;
  
  // Remove '+91' prefix if present
  const phone = decodedToken.phone_number.replace(/^\\+91/, '').replace(/^91/, '');
  return phone;
};

/**
 * Check if Firebase is initialized
 * @returns {boolean}
 */
export const isFirebaseInitialized = () => {
  return firebaseApp !== null;
};

// Initialize Firebase on module load
initializeFirebase();

export default firebaseApp;
