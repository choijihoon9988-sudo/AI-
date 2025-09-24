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
import { db } from '../firebase-config.js';
import { getCurrentUser } from '../auth.js';

const PROMPTS_COLLECTION = 'prompts';
const VERSIONS_SUBCOLLECTION = 'versions';
const GUILDS_COLLECTION = 'guilds'; // ✨ 길드 컬렉션 이름 추가

/**
 * 특정 사용자의 개인 프롬프트 목록을 실시간으로 가져옵니다.
 * @param {function} callback 
 * @returns {function} Firestore 리스너 해제 함수
 */
export const onPromptsUpdate = (callback) => {
    const user = getCurrentUser();
    if (!user) return () => {};
    
    const q = query(collection(db, PROMPTS_COLLECTION), where("userId", "==", user.uid));
    return onSnapshot(q, (snapshot) => {
        const prompts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(prompts);
    }, console.error);
};

// ... 기존 addPrompt, updatePrompt, deletePrompt, getPromptVersions 함수들 ...
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
    try {
        await runTransaction(db, async (transaction) => {
            const promptDoc = await transaction.get(promptDocRef);
            if (!promptDoc.exists()) throw "Document does not exist!";
            const oldData = promptDoc.data();
            const versionData = {
                title: oldData.title,
                content: oldData.content,
                category: oldData.category || '',
                savedAt: oldData.updatedAt || oldData.createdAt
            };
            const versionDocRef = doc(collection(promptDocRef, VERSIONS_SUBCOLLECTION));
            transaction.set(versionDocRef, versionData);
            transaction.update(promptDocRef, { ...updatedData, updatedAt: serverTimestamp() });
        });
    } catch (error) {
        console.error("Transaction failed: ", error);
        throw error;
    }
};

export const deletePrompt = async (promptId) => {
    const promptDocRef = doc(db, PROMPTS_COLLECTION, promptId);
    await deleteDoc(promptDocRef);
};

export const getPromptVersions = async (promptId) => {
    const versionsColRef = collection(db, PROMPTS_COLLECTION, promptId, VERSIONS_SUBCOLLECTION);
    const q = query(versionsColRef, orderBy('savedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};


// ✨ --- 길드 관련 함수 추가 --- ✨

/**
 * 새로운 길드를 생성합니다.
 * @param {string} guildName - 생성할 길드의 이름
 */
export const createGuild = async (guildName) => {
    const user = getCurrentUser();
    if (!user) throw new Error("로그인이 필요합니다.");

    await addDoc(collection(db, GUILDS_COLLECTION), {
        name: guildName,
        createdAt: serverTimestamp(),
        members: {
            [user.uid]: 'owner' // 길드 생성자를 'owner'로 지정
        }
    });
};

/**
 * 현재 사용자가 멤버로 속한 길드 목록을 실시간으로 가져옵니다.
 * @param {function} callback - 데이터 변경 시 호출될 콜백 함수 (길드 배열을 인자로 받음)
 * @returns {function} Firestore 리스너 해제 함수
 */
export const onGuildsUpdate = (callback) => {
    const user = getCurrentUser();
    if (!user) return () => {};

    // 'members' 맵에 현재 사용자의 uid가 키로 존재하는 길드를 쿼리합니다.
    const q = query(collection(db, GUILDS_COLLECTION), where(`members.${user.uid}`, 'in', ['owner', 'editor', 'viewer']));
    
    return onSnapshot(q, (snapshot) => {
        const guilds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(guilds);
    }, console.error);
};