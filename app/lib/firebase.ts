
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// DIAGNOSTIC LOGS
if (typeof window !== 'undefined') {
  console.log("--- FIREBASE DIAGNOSTIC ---");
  console.log("Project ID:", firebaseConfig.projectId || "MISSING ❌");
  console.log("API Key:", firebaseConfig.apiKey ? "PRESENT ✅" : "MISSING ❌");
  console.log("App ID:", firebaseConfig.appId ? "PRESENT ✅" : "MISSING ❌");
  if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
    console.error("CRITICAL: Firebase variables are missing in this environment!");
  }
}

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error("Firebase Initialization Error:", error);
}

export const auth = getAuth(app);

// FIX: Using long polling to avoid blocking issues on some networks/browsers
export const db = initializeFirestore(app!, {
  experimentalForceLongPolling: true,
});

export const storage = getStorage(app!);
