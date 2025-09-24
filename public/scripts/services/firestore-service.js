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
const GUILDS_COLLECTION = 'guilds';
const VERSIONS_SUBCOLLECTION = 'versions';

// ... onPromptsUpdate, addPrompt, updatePrompt, deletePrompt, getPromptVersions 함수들은 기존과 동일 ...
export const onPromptsUpdate = (callback) => {
    const user = getCurrentUser();
    if (!user) return () => {};
    const q = query(collection(db, PROMPTS_COLLECTION), where("userId", "==", user.uid));
    return onSnapshot(q, (snapshot) => {
        const prompts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(prompts);
    }, console.error);
};
export const addPrompt = async (promptData, guildId = null) => {
    const user = getCurrentUser();
    if (!user) throw new Error("로그인이 필요합니다.");
    let collectionRef;
    let data;
    if (guildId) {
        collectionRef = collection(db, 'guilds', guildId, 'prompts');
        data = { ...promptData, authorId: user.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
    } else {
        collectionRef = collection(db, PROMPTS_COLLECTION);
        data = { ...promptData, userId: user.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
    }
    await addDoc(collectionRef, data);
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


// --- 길드 관련 함수 ---

/**
 * 새로운 길드를 생성합니다. (memberIds 배열 추가)
 * @param {string} guildName - 생성할 길드의 이름
 */
export const createGuild = async (guildName) => {
    const user = getCurrentUser();
    if (!user) throw new Error("로그인이 필요합니다.");

    await addDoc(collection(db, GUILDS_COLLECTION), {
        name: guildName,
        createdAt: serverTimestamp(),
        members: {
            [user.uid]: 'owner'
        },
        memberIds: [user.uid] // ✨ 쿼리를 위한 memberIds 배열 추가
    });
};

/**
 * 현재 사용자가 멤버로 속한 길드 목록을 실시간으로 가져옵니다. (쿼리 방식 변경)
 * @param {function} callback
 * @returns {function} Firestore 리스너 해제 함수
 */
export const onGuildsUpdate = (callback) => {
    const user = getCurrentUser();
    if (!user) return () => {};

    // ✨ 'array-contains' 쿼리를 사용하여 더 효율적이고 안전하게 길드를 찾음
    const q = query(collection(db, GUILDS_COLLECTION), where('memberIds', 'array-contains', user.uid));
    
    return onSnapshot(q, (snapshot) => {
        const guilds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(guilds);
    }, console.error);
};

export const onGuildPromptsUpdate = (guildId, callback) => {
    const user = getCurrentUser();
    if (!user) return () => {};
    const q = query(collection(db, 'guilds', guildId, 'prompts'), orderBy('updatedAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const prompts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(prompts);
    }, console.error);
};