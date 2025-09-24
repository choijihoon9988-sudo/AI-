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
// '..' 을 추가해서 상위 폴더에 있는 파일을 찾도록 경로 수정
import { db } from '../firebase-config.js'; 
import { getCurrentUser } from '../auth.js';   

// (이하 모든 코드는 이전과 동일)

const PROMPTS_COLLECTION = 'prompts';

export const onPromptsUpdate = (callback) => {
    const user = getCurrentUser();
    if (!user) {
        console.error("로그인되지 않은 사용자입니다. 프롬프트를 가져올 수 없습니다.");
        return () => {};
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
        console.error("실시간으로 프롬프트를 가져오는 중 에러 발생:", error);
    });

    return unsubscribe;
};

export const addPrompt = async (promptData) => {
    const user = getCurrentUser();
    if (!user) {
        throw new Error("로그인되지 않은 사용자입니다.");
    }

    try {
        await addDoc(collection(db, PROMPTS_COLLECTION), {
           ...promptData,
            userId: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error("프롬프트 추가 중 에러 발생: ", error);
        throw error;
    }
};

export const updatePrompt = async (promptId, updatedData) => {
    const promptDocRef = doc(db, PROMPTS_COLLECTION, promptId);
    try {
        await updateDoc(promptDocRef, {
           ...updatedData,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error("프롬프트 수정 중 에러 발생: ", error);
        throw error;
    }
};

export const deletePrompt = async (promptId) => {
    const promptDocRef = doc(db, PROMPTS_COLLECTION, promptId);
    try {
        await deleteDoc(promptDocRef);
    } catch (error) {
        console.error("프롬프트 삭제 중 에러 발생: ", error);
        throw error;
    }
};