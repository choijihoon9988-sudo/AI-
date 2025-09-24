// public/scripts/firebase-config.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

// 웹 앱의 Firebase 구성
// 이 부분은 네가 Firebase 콘솔에서 복사한 값으로 이미 채워져 있을 거야.
const firebaseConfig = {
  apiKey: "AIzaSyD5MlDZOieg3F31IW2b7T0l4mA6-9ExEuU",
  authDomain: "ai-memory-web-service-a4979.firebaseapp.com",
  projectId: "ai-memory-web-service-a4979",
  storageBucket: "ai-memory-web-service-a4979.appspot.com", // .firebasestorage.app에서 변경될 수 있음
  messagingSenderId: "509413568796",
  appId: "1:509413568796:web:eaea854393a72822efcad9"
};

// Firebase 앱 초기화 (가장 중요한 부분!)
const app = initializeApp(firebaseConfig);

// 다른 모듈에서 사용할 수 있도록 Firebase 서비스 내보내기
export const db = getFirestore(app);
export const auth = getAuth(app);