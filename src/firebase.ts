import { initializeApp, getApps, getApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBWWONfDcUUtbqKVIf28ajRMkhPXBR-krc",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "campus-7b6fc.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "campus-7b6fc",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "campus-7b6fc.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "766084515490",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:766084515490:web:99c11988acfa6d0175b9fb",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-S3MFDJ7TY2",
}

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)

export default app
