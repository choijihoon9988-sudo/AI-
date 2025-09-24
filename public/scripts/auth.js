// public/scripts/auth.js (Popup 방식으로 완전히 교체)
import {
  GoogleAuthProvider,
  signInWithPopup, // Redirect 대신 Popup을 사용합니다.
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { auth } from './firebase-config.js';
import { toast } from './utils/toast-service.js';

const provider = new GoogleAuthProvider();

/**
 * Google 계정으로 로그인을 시작합니다. (팝업 방식)
 */
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    console.log("로그인 성공!", result.user);
    toast.success("로그인되었습니다.");
  } catch (error) {
    console.error("Google 로그인 중 에러 발생", error);
    // 사용자가 팝업을 닫는 등 일반적인 오류는 무시합니다.
    if (error.code !== 'auth/popup-closed-by-user') {
        toast.error(`로그인 실패: ${error.message}`);
    }
  }
};

// handleRedirectResult 함수는 더 이상 필요 없으므로 완전히 삭제합니다.

/**
 * 현재 사용자를 로그아웃시킵니다.
 */
export const signOutUser = async () => {
  try {
    await signOut(auth);
    toast.success("로그아웃되었습니다.");
  } catch (error) {
    console.error("로그아웃 중 에러 발생", error);
    toast.error("로그아웃에 실패했습니다.");
  }
};

/**
 * 로그인 상태가 바뀌는지 계속 감시하는 리스너를 설정합니다.
 */
export const onAuthStateChangedListener = (callback) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * 현재 로그인된 사용자가 누구인지 알려줍니다.
 */
export const getCurrentUser = () => {
    return auth.currentUser;
};