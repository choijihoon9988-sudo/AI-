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
    increment,
    arrayUnion
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { db } from '../firebase-config.js';
import { getCurrentUser } from '../auth.js';

const PROMPTS_COLLECTION = 'prompts';
const GUILDS_COLLECTION = 'guilds';
const VERSIONS_SUBCOLLECTION = 'versions';
const USERS_COLLECTION = 'users';

export const getUserByEmail = async (email) => {
    const q = query(collection(db, USERS_COLLECTION), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return null;
    }
    return querySnapshot.docs[0].data();
};

export const updateGuildMembers = async (guildId, members, memberIds) => {
    const guildRef = doc(db, GUILDS_COLLECTION, guildId);
    await updateDoc(guildRef, { members, memberIds });
};


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
    
    const baseData = {
        ...promptData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        use_count: 0,
        avg_rating: 0,
        ratings: []
    };

    if (guildId) {
        collectionRef = collection(db, 'guilds', guildId, 'prompts');
        data = { ...baseData, authorId: user.uid };
    } else {
        collectionRef = collection(db, PROMPTS_COLLECTION);
        data = { ...baseData, userId: user.uid };
    }
    await addDoc(collectionRef, data);
};

export const updatePrompt = async (promptId, updatedData, guildId = null) => {
    let promptDocRef;
    if (guildId) {
        promptDocRef = doc(db, GUILDS_COLLECTION, guildId, PROMPTS_COLLECTION, promptId);
        await updateDoc(promptDocRef, { ...updatedData, updatedAt: serverTimestamp() });
    } else {
        promptDocRef = doc(db, PROMPTS_COLLECTION, promptId);
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

/**
 * 프롬프트 사용 횟수를 1 증가시킵니다.
 * @param {string} promptId 
 * @param {string|null} guildId 
 */
export const incrementUseCount = async (promptId, guildId = null) => {
    let promptDocRef;
    if (guildId) {
        promptDocRef = doc(db, GUILDS_COLLECTION, guildId, PROMPTS_COLLECTION, promptId);
    } else {
        promptDocRef = doc(db, PROMPTS_COLLECTION, promptId);
    }
    await updateDoc(promptDocRef, { use_count: increment(1) });
};

/**
 * 프롬프트에 별점을 추가하고 평균을 업데이트합니다.
 * @param {string} promptId 
 * @param {number} rating 
 * @param {string|null} guildId 
 */
export const ratePrompt = async (promptId, rating, guildId = null) => {
    let promptDocRef;
    if (guildId) {
        promptDocRef = doc(db, GUILDS_COLLECTION, guildId, PROMPTS_COLLECTION, promptId);
    } else {
        promptDocRef = doc(db, PROMPTS_COLLECTION, promptId);
    }

    await runTransaction(db, async (transaction) => {
        const promptDoc = await transaction.get(promptDocRef);
        if (!promptDoc.exists()) throw "Document does not exist!";
        
        const data = promptDoc.data();
        const newRatings = [...(data.ratings || []), rating];
        const newAvgRating = newRatings.reduce((a, b) => a + b, 0) / newRatings.length;

        transaction.update(promptDocRef, {
            ratings: newRatings,
            avg_rating: newAvgRating
        });
    });
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

export const deleteGuild = async (guildId) => {
    const guildRef = doc(db, GUILDS_COLLECTION, guildId);
    const promptsRef = collection(guildRef, PROMPTS_COLLECTION);

    const batch = writeBatch(db);

    const promptsSnapshot = await getDocs(promptsRef);
    promptsSnapshot.forEach(promptDoc => {
        batch.delete(promptDoc.ref);
    });

    batch.delete(guildRef);

    await batch.commit();
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

export const onGuildPromptsUpdate = (guildId, callback) => {
    const user = getCurrentUser();
    if (!user) return () => {};
    const q = query(collection(db, 'guilds', guildId, 'prompts'), orderBy('updatedAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const prompts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(prompts);
    }, console.error);
};