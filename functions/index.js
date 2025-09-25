// 최신 v5 SDK 스타일로 변경
const {onCall, HttpsError, logger} = require("firebase-functions/v2/https");
const {initializeApp} = require("firebase-admin/app");
const {GoogleGenerativeAI} = require("@google/generative-ai");

// .env 파일에 정의된 환경 변수를 사용합니다.
const API_KEY = process.env.GEMINI_KEY;

initializeApp();

let genAI;
if (!API_KEY) {
  logger.error("Gemini API Key is not set in .env file.");
} else {
  genAI = new GoogleGenerativeAI(API_KEY);
}

exports.getAISuggestion = onCall({
  region: "asia-northeast3",
  // ✨ 메모리를 1GB로 상향 조정 ✨
  memory: "1GB",
}, async (request) => {
  if (!genAI) {
    throw new HttpsError("failed-precondition", "The function is not initialized correctly due to a missing API key.");
  }

  if (!request.auth) {
    throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
  }

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