import { 
    collection, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    query, 
    where, 
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { db } from '../firebase-config.js'; // 경로가 한 단계 올라갔으므로 .. 추가
import { getCurrentUser } from '../auth.js';   // 경로가 한 단계 올라갔으므로 .. 추가

const PROMPTS_COLLECTION = 'prompts';

/**
 * 특정 사용자의 프롬프트 목록을 실시간으로 가져와.
 * @param {function} callback - 데이터가 바뀔 때마다 실행될 함수
 * @returns {function} - 실시간 감시를 멈추는 함수
 */
export const onPromptsUpdate = (callback) => {
    const user = getCurrentUser();
    if (!user) {
        console.error("로그인되지 않은 사용자입니다. 프롬프트를 가져올 수 없습니다.");
        return () => {}; // 빈 함수를 반환해서 오류 방지
    }

    const promptsCollectionRef = collection(db, PROMPTS_COLLECTION);
    const q = query(promptsCollectionRef, where("userId", "==", user.uid));

    // onSnapshot은 데이터가 바뀔 때마다 자동으로 알려주는 실시간 리스너야.
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const prompts = [];
        querySnapshot.forEach((doc) => {
            prompts.push({ id: doc.id, ...doc.data() });
        });
        callback(prompts);
    }, (error) => {
        console.error("실시간으로 프롬프트를 가져오는 중 에러 발생:", error);
    });

    return unsubscribe; // 나중에 리스너를 끌 수 있도록 unsubscribe 함수를 반환해.
};

/**
 * 새로운 프롬프트를 Firestore에 추가해.
 * @param {object} promptData - { title, content } 형태의 데이터
 */
export const addPrompt = async (promptData) => {
    const user = getCurrentUser();
    if (!user) {
        throw new Error("로그인되지 않은 사용자입니다.");
    }

    try {
        await addDoc(collection(db, PROMPTS_COLLECTION), {
           ...promptData,
            userId: user.uid,
            createdAt: serverTimestamp(), // 서버의 현재 시간을 기록
            updatedAt: serverTimestamp()  // 서버의 현재 시간을 기록
        });
    } catch (error) {
        console.error("프롬프트 추가 중 에러 발생: ", error);
        throw error;
    }
};

/**
 * 기존 프롬프트를 업데이트해.
 * @param {string} promptId - 수정할 프롬프트의 ID
 * @param {object} updatedData - 수정할 데이터 { title, content }
 */
export const updatePrompt = async (promptId, updatedData) => {
    const promptDocRef = doc(db, PROMPTS_COLLECTION, promptId);
    try {
        await updateDoc(promptDocRef, {
           ...updatedData,
            updatedAt: serverTimestamp() // 수정한 시간도 서버 시간으로 기록
        });
    } catch (error) {
        console.error("프롬프트 수정 중 에러 발생: ", error);
        throw error;
    }
};

/**
 * 프롬프트를 삭제해.
 * @param {string} promptId - 삭제할 프롬프트의 ID
 */
export const deletePrompt = async (promptId) => {
    const promptDocRef = doc(db, PROMPTS_COLLECTION, promptId);
    try {
        await deleteDoc(promptDocRef);
    } catch (error) {
        console.error("프롬프트 삭제 중 에러 발생: ", error);
        throw error;
    }
};