// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDR3SLf_ig3ibgemRf_zzQjqNdtP9Hnm6s",
  authDomain: "discuss-9e352.firebaseapp.com",
  projectId: "discuss-9e352",
  storageBucket: "discuss-9e352.appspot.com",
  messagingSenderId: "231739689271",
  appId: "1:231739689271:web:f33c2e0886493ff77c32b2",
  measurementId: "G-DYK7T6JB16"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Conditionally initialize Analytics only if `window` is available
let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

// Initialize Firestore
const db = getFirestore(app);

// Export the db and analytics objects to use in other parts of your app
export { db, analytics };
