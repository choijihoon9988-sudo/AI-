// public/scripts/firebase-config.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

// Your web app's Firebase configuration
// IMPORTANT: Make sure these values are copied EXACTLY from your Firebase project settings.
const firebaseConfig = {
  apiKey: "AIzaSyD5MlDZOieg3F31IW2b7T0l4mA6-9ExEuU",
  authDomain: "ai-memory-web-service-a4979.firebaseapp.com",
  projectId: "ai-memory-web-service-a4979",
  storageBucket: "ai-memory-web-service-a4979.appspot.com",
  messagingSenderId: "509413568796",
  appId: "1:509413568796:web:eaea854393a72822efcad9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services for use in other modules
export const db = getFirestore(app);
export const auth = getAuth(app);