
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAJ7jfeSwzA_OnZJxvoR0iSDOiCaIStSaw",
  authDomain: "hopla-7bfe3.firebaseapp.com",
  projectId: "hopla-7bfe3",
  storageBucket: "hopla-7bfe3.firebasestorage.app",
  messagingSenderId: "977059782327",
  appId: "1:977059782327:web:275d74ed2fdd213e92f732",
  measurementId: "G-C51QM3EJW5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
