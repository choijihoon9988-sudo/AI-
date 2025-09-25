const {onCall, HttpsError, logger} = require("firebase-functions/v2/https");
const {initializeApp} = require("firebase-admin/app");
const {GoogleGenerativeAI} = require("@google/generative-ai");

// Admin SDK는 한 번만 초기화합니다.
initializeApp();

exports.getAISuggestion = onCall({region: "asia-northeast3"}, async (request) => {
  // --- 함수가 호출될 때 모든 로직을 실행 ---

  // 1. API 키 확인
  const API_KEY = process.env.GEMINI_KEY;
  if (!API_KEY) {
    logger.error("GEMINI_KEY is not set in environment variables.");
    throw new HttpsError("failed-precondition", "The function is not configured correctly (API key is missing).");
  }

  // 2. AI 클라이언트 초기화
  const genAI = new GoogleGenerativeAI(API_KEY);

  // 3. 인증 확인
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
  }

  // 4. 입력값 확인
  const originalPrompt = request.data.prompt;
  if (!originalPrompt) {
    throw new HttpsError("invalid-argument", "The function must be called with one argument 'prompt'.");
  }

  const metaPrompt = `
You are an expert prompt engineer.
Your task is to refine the user's prompt to make it more effective.
**COSTAR Framework:**
* **[C]ontext:** The user's prompt might be vague or lack details.
* **[O]bjective:** Rewrite the prompt to be clearer, more specific, and
provide more context to the AI. Assign a role, provide examples,
and specify the output format.
* **[S]tyle:** Concise and direct.
* **[T]one:** Professional and instructional.
* **[A]udience:** An advanced AI model.
* **[R]esponse:** Provide ONLY the rewritten prompt text, without any
explanations.

**User's Original Prompt:**
"${originalPrompt}"

**Rewritten Prompt:**
  `.trim();

  try {
    const model = genAI.getGenerativeModel({model: "gemini-pro"});
    const result = await model.generateContent(metaPrompt);
    const response = await result.response;
    const suggestion = response.text();
    return {suggestion};
  } catch (error) {
    logger.error("AI API Call Error:", error);
    throw new HttpsError("internal", "Failed to get suggestion from AI.", error);
  }
});