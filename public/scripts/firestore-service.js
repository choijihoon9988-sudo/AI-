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
import { db } from './firebase-config.js';
import { getCurrentUser } from './auth.js';

const PROMPTS_COLLECTION = 'prompts';

/**
 * 특정 사용자의 프롬프트 목록을 실시간으로 가져옵니다.
 * @param {function} callback - 데이터가 변경될 때마다 호출될 콜백 함수 (프롬프트 배열을 인자로 받음)
 * @returns {function} - 리스너를 해제하는 함수
 */
export const onPromptsUpdate = (callback) => {
    const user = getCurrentUser();
    if (!user) {
        console.error("User not authenticated. Cannot fetch prompts.");
        return () => {}; // 빈 해제 함수 반환
    }

    const promptsCollectionRef = collection(db, PROMPTS_COLLECTION);
    const q = query(promptsCollectionRef, where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const prompts = [];
        querySnapshot.forEach((doc) => {
            prompts.push({ id: doc.id, ...doc.data() });
        });
        callback(prompts);
    }, (error) => {
        console.error("Error fetching prompts in real-time:", error);
    });

    return unsubscribe; // 리스너 해제를 위해 unsubscribe 함수 반환
};

/**
 * 새로운 프롬프트를 Firestore에 추가합니다.
 * @param {object} promptData - { title, content } 형태의 프롬프트 데이터
 */
export const addPrompt = async (promptData) => {
    const user = getCurrentUser();
    if (!user) {
        throw new Error("User not authenticated.");
    }

    try {
        await addDoc(collection(db, PROMPTS_COLLECTION), {
           ...promptData,
            userId: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error adding prompt: ", error);
        throw error;
    }
};

/**
 * 기존 프롬프트를 업데이트합니다.
 * @param {string} promptId - 업데이트할 프롬프트의 ID
 * @param {object} updatedData - 업데이트할 데이터 { title, content }
 */
export const updatePrompt = async (promptId, updatedData) => {
    const promptDocRef = doc(db, PROMPTS_COLLECTION, promptId);
    try {
        await updateDoc(promptDocRef, {
           ...updatedData,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error updating prompt: ", error);
        throw error;
    }
};

/**
 * 프롬프트를 삭제합니다.
 * @param {string} promptId - 삭제할 프롬프트의 ID
 */
export const deletePrompt = async (promptId) => {
    const promptDocRef = doc(db, PROMPTS_COLLECTION, promptId);
    try {
        await deleteDoc(promptDocRef);
    } catch (error) {
        console.error("Error deleting prompt: ", error);
        throw error;
    }
};