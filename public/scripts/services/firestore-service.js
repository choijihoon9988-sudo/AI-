import {
    collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot,
    serverTimestamp, runTransaction, getDocs, orderBy, writeBatch, increment
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
        ratings: {}
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

export const incrementUseCount = async (promptId, guildId = null) => {
    let promptDocRef;
    if (guildId) {
        promptDocRef = doc(db, GUILDS_COLLECTION, guildId, PROMPTS_COLLECTION, promptId);
    } else {
        promptDocRef = doc(db, PROMPTS_COLLECTION, promptId);
    }
    await updateDoc(promptDocRef, { use_count: increment(1) });
};

export const ratePrompt = async (promptId, rating, guildId = null) => {
    const user = getCurrentUser();
    if (!user) throw new Error("User not authenticated.");

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
        const newRatings = { ...data.ratings, [user.uid]: rating };
        
        const ratingValues = Object.values(newRatings);
        const newAvgRating = ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length;

        transaction.update(promptDocRef, {
            ratings: newRatings,
            avg_rating: newAvgRating
        });
    });
};

/**
 * AI 모델을 통해 프롬프트 개선 제안을 요청합니다. (시뮬레이션)
 * @param {string} originalPrompt - 사용자가 입력한 원본 프롬프트
 * @returns {Promise<string>} AI가 제안하는 개선된 프롬프트
 */
export const getAISuggestion = async (originalPrompt) => {
    console.log("AI suggestion requested for:", originalPrompt);
    // 중요: 실제 프로덕션 환경에서는 이 로직을 반드시 Firebase Cloud Function으로 이전해야 합니다.
    // 클라이언트에서 API 키를 노출하는 것은 매우 위험합니다.

    const metaPrompt = `
        You are an expert prompt engineer. Your task is to refine the user's prompt to make it more effective for a large language model like GPT-4 or Gemini.
        **COSTAR Framework:**
        * **[C]ontext:** The user wants to generate a specific output but their prompt might be vague, ambiguous, or lack necessary details.
        * **[O]bjective:** Rewrite the following user prompt. The new prompt should be clearer, more specific, and provide more context to the AI. It should follow best practices for prompt engineering, such as assigning a role, providing examples (if applicable), and specifying the desired output format.
        * **[S]tyle:** The rewritten prompt should be concise and direct.
        * **[T]one:** Professional and instructional.
        * **[A]udience:** The audience for the rewritten prompt is an advanced AI model.
        * **[R]esponse:** Provide ONLY the rewritten prompt text, without any explanations or conversational filler.
        
        **User's Original Prompt:**
        "${originalPrompt}"

        **Rewritten Prompt:**
    `;

    console.log("AI에게 전송될 메타 프롬프트:", metaPrompt);
    
    // 여기서는 실제 API 호출 대신 시뮬레이션 응답을 반환합니다.
    await new Promise(resolve => setTimeout(resolve, 1000)); // 네트워크 지연 시뮬레이션

    return `개선된 프롬프트 예시입니다: 원본 프롬프트의 핵심 의도를 파악하여, AI가 더 명확하게 이해할 수 있도록 역할 부여, 구체적인 지시사항, 출력 형식 등을 포함하여 재구성했습니다. 이 부분은 실제로는 Cloud Function에서 Gemini API를 호출한 후 반환되어야 합니다.`;
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