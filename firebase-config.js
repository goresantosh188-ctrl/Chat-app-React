// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, RecaptchaVerifier } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { cookies } from "./src/global/config";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDSmSRpPDyZ_pBi5LeSYALYdMhTR6495wk",
  authDomain: "my-chat-app-45398.firebaseapp.com",
  databaseURL: "https://my-chat-app-45398-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "my-chat-app-45398",
  storageBucket: "my-chat-app-45398.firebasestorage.app",
  messagingSenderId: "1090769502138",
  appId: "1:1090769502138:web:3cb448da78a4f64420e783",
  measurementId: "G-S5Z494B3YV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const database = getFirestore();
export const recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {});