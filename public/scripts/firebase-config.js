import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// 웹 앱의 Firebase 구성
const firebaseConfig = {
  apiKey: "AIzaSyD5MlDZOieg3F3F31IW2b7T0l4mA6-9ExEuU",
  authDomain: "ai-memory-web-service-a4979.firebaseapp.com",
  projectId: "ai-memory-web-service-a4979",
  storageBucket: "ai-memory-web-service-a4979.firebasestorage.app",
  messagingSenderId: "509413568796",
  appId: "1:509413568796:web:eaea854393a72822efcad9"
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// 다른 모듈에서 사용할 수 있도록 Firebase 서비스 내보내기
export const db = getFirestore(app);
export const auth = getAuth(app);