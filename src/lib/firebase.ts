
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// ✅ Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyBtG7tO1bYUURSwPuU33cjynkVkM6YqojI",
    authDomain: "dentalclinicapp-14bc6.firebaseapp.com",
    projectId: "dentalclinicapp-14bc6",
    storageBucket: "dentalclinicapp-14bc6.appspot.com",
    messagingSenderId: "625972876588",
    appId: "1:625972876588:web:c7dc9fabf47e7b9fd14889",
    measurementId: "G-ECYE29FN17"
};

// ✅ Initialize Firebase core
const app = initializeApp(firebaseConfig);

// 🔐 Auth, 📦 DB, ☁️ Storage, 📊 Analytics
export const auth = getAuth(app);
export const db = getFirestore(app); // Real-time support ready (via onSnapshot)
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

export default app;
