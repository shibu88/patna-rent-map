// Firebase init + anonymous auth. Spark plan only (no Cloud Functions).
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// True only when the required keys are present in .env.
export function isFirebaseConfigured() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
}

export const app = isFirebaseConfigured() ? initializeApp(firebaseConfig) : null;
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;
export const auth = app ? getAuth(app) : null;

// Resolve with the (anonymous) user once signed in. Signs in if needed.
export function ensureSignedIn() {
  if (!auth) return Promise.reject(new Error('Firebase not configured'));
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          unsub();
          resolve(user);
        }
      },
      reject
    );
    signInAnonymously(auth).catch(reject);
  });
}
