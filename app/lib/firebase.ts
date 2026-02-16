
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDpR7j3Kw_wNPEkNILy79DEW4434ri5Pyw",
  authDomain: "hoplafix.firebaseapp.com",
  projectId: "hoplafix",
  storageBucket: "hoplafix.firebasestorage.app",
  messagingSenderId: "310825078245",
  appId: "1:310825078245:web:5076397f15a0bd1df1f30c",
  measurementId: "G-MGL7Q1S4C3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
