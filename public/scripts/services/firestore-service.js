import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    onSnapshot,
    serverTimestamp,
    runTransaction,
    getDocs,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
// ✨ 오류 수정: 상위 폴더를 참조하도록 경로를 ../ 로 변경
import { db } from '../firebase-config.js';
import { getCurrentUser } from '../auth.js';

const PROMPTS_COLLECTION = 'prompts';
const VERSIONS_SUBCOLLECTION = 'versions';

/**
 * 특정 사용자의 프롬프트 목록을 실시간으로 가져옵니다.
 * @param {function} callback - 데이터가 변경될 때마다 호출될 콜백 함수 (프롬프트 배열을 인자로 받음)
 * @returns {function} - 리스너를 해제하는 함수
 */
export const onPromptsUpdate = (callback) => {
    const user = getCurrentUser();
    if (!user) {
        return () => {};
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

/**
 * 새로운 프롬프트를 Firestore에 추가합니다.
 * @param {object} promptData - { title, content, category } 형태의 프롬프트 데이터
 */
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

/**
 * Firestore 트랜잭션을 사용하여 기존 프롬프트를 원자적으로 업데이트하고 이전 버전을 백업합니다.
 * @param {string} promptId - 업데이트할 프롬프트의 ID
 * @param {object} updatedData - 업데이트할 데이터 { title, content, category }
 */
export const updatePrompt = async (promptId, updatedData) => {
    const promptDocRef = doc(db, PROMPTS_COLLECTION, promptId);
    try {
        await runTransaction(db, async (transaction) => {
            const promptDoc = await transaction.get(promptDocRef);
            if (!promptDoc.exists()) {
                throw "Document does not exist!";
            }
            const oldData = promptDoc.data();

            const versionData = {
                title: oldData.title,
                content: oldData.content,
                category: oldData.category || '',
                savedAt: oldData.updatedAt || oldData.createdAt
            };

            const versionDocRef = doc(collection(promptDocRef, VERSIONS_SUBCOLLECTION));
            transaction.set(versionDocRef, versionData);

            transaction.update(promptDocRef, {
                ...updatedData,
                updatedAt: serverTimestamp()
            });
        });
    } catch (error) {
        console.error("Transaction failed: ", error);
        throw error;
    }
};

/**
 * 프롬프트를 삭제합니다.
 * @param {string} promptId - 삭제할 프롬프트의 ID
 */
export const deletePrompt = async (promptId) => {
    const promptDocRef = doc(db, PROMPTS_COLLECTION, promptId);
    await deleteDoc(promptDocRef);
};

/**
 * 특정 프롬프트의 모든 버전 기록을 가져옵니다.
 * @param {string} promptId - 버전 기록을 조회할 프롬프트의 ID
 * @returns {Promise<Array<object>>} - 버전 객체의 배열
 */
export const getPromptVersions = async (promptId) => {
    const versionsColRef = collection(db, PROMPTS_COLLECTION, promptId, VERSIONS_SUBCOLLECTION);
    const q = query(versionsColRef, orderBy('savedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};