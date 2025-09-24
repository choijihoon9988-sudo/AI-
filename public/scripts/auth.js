import { 
  GoogleAuthProvider, 
  signInWithRedirect, // 팝업 대신 페이지 이동 방식을 쓸 거야. 이게 더 안정적이야.
  getRedirectResult,  // 페이지 이동 후 로그인 결과를 가져오는 기능이야.
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { auth } from './firebase-config.js';

const provider = new GoogleAuthProvider();

/**
 * Google 계정으로 로그인을 시작해. (페이지 이동 방식)
 */
export const signInWithGoogle = async () => {
  try {
    await signInWithRedirect(auth, provider);
  } catch (error) {
    console.error("Google 로그인 중 에러 발생", error);
  }
};

/**
 * 페이지가 다시 로드됐을 때 로그인 결과를 처리해.
 */
export const handleRedirectResult = async () => {
    try {
        const result = await getRedirectResult(auth);
        if (result) {
            // 로그인이 성공적으로 완료되면 콘솔에 기록을 남겨.
            console.log("로그인 성공!", result.user);
        }
    } catch (error) {
        console.error("로그인 결과 처리 중 에러 발생", error);
    }
}

/**
 * 현재 사용자를 로그아웃시켜.
 */
export const signOutUser = async () => {
  try {
    await signOut(auth);
    console.log("로그아웃 성공");
  } catch (error) {
    console.error("로그아웃 중 에러 발생", error);
  }
};

/**
 * 로그인 상태가 바뀌는지 계속 감시하는 리스너를 설정해.
 * @param {function} callback - 상태가 바뀔 때마다 실행될 함수
 */
export const onAuthStateChangedListener = (callback) => {
  onAuthStateChanged(auth, callback);
};

/**
 * 현재 로그인된 사용자가 누구인지 알려줘.
 * @returns {object|null} 사용자 정보 또는 null
 */
export const getCurrentUser = () => {
    return auth.currentUser;
};