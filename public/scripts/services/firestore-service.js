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
import { db } from '../firebase-config.js';
import { getCurrentUser } from '../auth.js';

const PROMPTS_COLLECTION = 'prompts';

export const onPromptsUpdate = (callback) => {
    const user = getCurrentUser();
    if (!user) {
        return () => {}; // 반환 함수를 통일하여 오류 방지
    }

    const q = query(collection(db, PROMPTS_COLLECTION), where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const prompts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(prompts);
    }, (error) => {
        console.error("실시간 프롬프트 로딩 중 에러:", error);
    });

    return unsubscribe;
};

export const addPrompt = async (promptData) => {
    const user = getCurrentUser();
    if (!user) throw new Error("로그인이 필요합니다.");

    await addDoc(collection(db, PROMPTS_COLLECTION), {
       ...promptData,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
};

export const updatePrompt = async (promptId, updatedData) => {
    const promptDocRef = doc(db, PROMPTS_COLLECTION, promptId);
    await updateDoc(promptDocRef, {
       ...updatedData,
        updatedAt: serverTimestamp()
    });
};

export const deletePrompt = async (promptId) => {
    const promptDocRef = doc(db, PROMPTS_COLLECTION, promptId);
    await deleteDoc(promptDocRef);
};