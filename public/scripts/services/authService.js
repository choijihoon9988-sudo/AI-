// Firebase SDK의 필요한 함수들을 import 합니다.
// 모듈러 SDK는 필요한 기능만 가져와 번들 크기를 줄여줍니다.
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { firebaseConfig } from '../config.js'; // Firebase 설정 객체를 별도 파일에서 관리

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

/**
 * Google 계정으로 로그인을 처리하는 함수
 * @returns {Promise<UserCredential|null>} 성공 시 UserCredential 객체, 실패 시 null 반환
 */
const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        // 성공적으로 로그인되면 result.user에 사용자 정보가 담깁니다.
        console.log("로그인 성공:", result.user);
        return result;
    } catch (error) {
        // 에러 처리 (예: 팝업이 차단되었거나 사용자가 닫은 경우)
        console.error("Google 로그인 에러:", error.code, error.message);
        return null;
    }
};

/**
 * 로그아웃을 처리하는 함수
 */
const logout = async () => {
    try {
        await signOut(auth);
        console.log("로그아웃 성공");
    } catch (error) {
        console.error("로그아웃 에러:", error);
    }
};

/**
 * 인증 상태 변경을 감지하고 콜백 함수를 실행하는 리스너
 * @param {function(User|null)} callback - 사용자 객체(로그인 시) 또는 null(로그아웃 시)을 인자로 받는 콜백
 */
const onAuthChange = (callback) => {
    onAuthStateChanged(auth, callback);
};

// 다른 모듈에서 사용할 수 있도록 함수들을 export 합니다.
export { signInWithGoogle, logout, onAuthChange };