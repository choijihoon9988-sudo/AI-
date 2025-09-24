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
    orderBy,
    writeBatch,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { db } from '../firebase-config.js';
import { getCurrentUser } from '../auth.js';

const PROMPTS_COLLECTION = 'prompts';
const GUILDS_COLLECTION = 'guilds';
const VERSIONS_SUBCOLLECTION = 'versions';
const USERS_COLLECTION = 'users';

/**
 * 이메일로 사용자를 검색합니다.
 * @param {string} email 
 * @returns {object|null} 사용자 데이터 또는 null
 */
export const getUserByEmail = async (email) => {
    const q = query(collection(db, USERS_COLLECTION), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return null;
    }
    return querySnapshot.docs[0].data();
};

/**
 * 길드 멤버 정보를 업데이트합니다.
 * @param {string} guildId 
 * @param {object} members 
 * @param {Array<string>} memberIds 
 */
export const updateGuildMembers = async (guildId, members, memberIds) => {
    const guildRef = doc(db, GUILDS_COLLECTION, guildId);
    await updateDoc(guildRef, { members, memberIds });
};


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

/**
 * 새로운 프롬프트를 Firestore에 추가합니다. (개인 또는 길드)
 * @param {object} promptData - { title, content, category }
 * @param {string|null} guildId - 길드 ID (길드 프롬프트일 경우)
 */
export const addPrompt = async (promptData, guildId = null) => {
    const user = getCurrentUser();
    if (!user) throw new Error("로그인이 필요합니다.");

    let collectionRef;
    let data;

    if (guildId) {
        // 길드 프롬프트
        collectionRef = collection(db, 'guilds', guildId, 'prompts');
        data = { ...promptData, authorId: user.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
    } else {
        // 개인 프롬프트
        collectionRef = collection(db, PROMPTS_COLLECTION);
        data = { ...promptData, userId: user.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
    }
    await addDoc(collectionRef, data);
};


export const updatePrompt = async (promptId, updatedData, guildId = null) => {
    let promptDocRef;
    if (guildId) {
        promptDocRef = doc(db, GUILDS_COLLECTION, guildId, PROMPTS_COLLECTION, promptId);
         // 길드 프롬프트는 버전 관리를 아직 구현하지 않으므로 직접 업데이트
        await updateDoc(promptDocRef, { ...updatedData, updatedAt: serverTimestamp() });
    } else {
        promptDocRef = doc(db, PROMPTS_COLLECTION, promptId);
        // 개인 프롬프트는 버전 관리를 위해 트랜잭션 사용
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
    }
};

export const deletePrompt = async (promptId, guildId = null) => {
    let promptDocRef;
    if (guildId) {
        promptDocRef = doc(db, GUILDS_COLLECTION, guildId, PROMPTS_COLLECTION, promptId);
    } else {
        promptDocRef = doc(db, PROMPTS_COLLECTION, promptId);
    }
    await deleteDoc(promptDocRef);
};


export const getPromptVersions = async (promptId) => {
    const versionsColRef = collection(db, PROMPTS_COLLECTION, promptId, VERSIONS_SUBCOLLECTION);
    const q = query(versionsColRef, orderBy('savedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// --- 길드 관련 함수 ---

export const createGuild = async (guildName) => {
    const user = getCurrentUser();
    if (!user) throw new Error("로그인이 필요합니다.");
    await addDoc(collection(db, GUILDS_COLLECTION), {
        name: guildName,
        createdAt: serverTimestamp(),
        members: {
            [user.uid]: 'owner'
        },
        memberIds: [user.uid]
    });
};

export const onGuildsUpdate = (callback) => {
    const user = getCurrentUser();
    if (!user) return () => {};
    const q = query(collection(db, GUILDS_COLLECTION), where('memberIds', 'array-contains', user.uid));
    
    return onSnapshot(q, (snapshot) => {
        const guilds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(guilds);
    }, console.error);
};

/**
 * 특정 길드의 프롬프트 목록을 실시간으로 가져옵니다.
 * @param {string} guildId - 프롬프트를 가져올 길드의 ID
 * @param {function} callback - 데이터 변경 시 호출될 콜백 함수
 * @returns {function} Firestore 리스너 해제 함수
 */
export const onGuildPromptsUpdate = (guildId, callback) => {
    const user = getCurrentUser();
    if (!user) return () => {};
    const q = query(collection(db, 'guilds', guildId, 'prompts'), orderBy('updatedAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const prompts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(prompts);
    }, console.error);
};