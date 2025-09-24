import { 
  GoogleAuthProvider, 
  signInWithRedirect, // signInWithPopup 대신 Redirect 사용
  getRedirectResult,  // Redirect 결과를 가져오기 위해 추가
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { auth } from './firebase-config.js';

const provider = new GoogleAuthProvider();

/**
 * Google 계정으로 로그인을 시작합니다. (Redirect 방식)
 */
export const signInWithGoogle = async () => {
  try {
    await signInWithRedirect(auth, provider);
  } catch (error) {
    console.error("Error during Google Sign-In Redirect", error);
  }
};

/**
 * 페이지 로드 시 리디렉션 결과를 처리합니다.
 */
export const handleRedirectResult = async () => {
    try {
        const result = await getRedirectResult(auth);
        if (result) {
            console.log("Google Sign-In successful via redirect", result.user);
        }
    } catch (error) {
        console.error("Error handling redirect result", error);
    }
}

/**
 * 현재 사용자를 로그아웃시킵니다.
 */
export const signOutUser = async () => {
  try {
    await signOut(auth);
    console.log("User signed out");
  } catch (error) {
    console.error("Error signing out", error);
  }
};

/**
 * 인증 상태 변경을 감지하는 리스너를 설정합니다.
 * @param {function} callback - 사용자 상태가 변경될 때 호출될 콜백 함수 (user 객체 또는 null을 인자로 받음)
 */
export const onAuthStateChangedListener = (callback) => {
  onAuthStateChanged(auth, callback);
};

/**
 * 현재 로그인된 사용자를 반환합니다.
 * @returns {object|null} 현재 사용자 객체 또는 null
 */
export const getCurrentUser = () => {
    return auth.currentUser;
};