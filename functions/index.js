const functions = require("firebase-functions");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { defineString } = require("firebase-functions/params");

// Firebase의 최신 파라미터 방식을 사용하여 환경 변수를 선언합니다.
const geminiKey = defineString("GEMINI_KEY");

let genAI;
let initializationError = null;

try {
  const apiKey = geminiKey.value();
  // ✨ 디버깅용 로그 추가 ✨
  functions.logger.info("Attempting to initialize GoogleGenerativeAI...");
  if (apiKey && apiKey.length > 5) {
    functions.logger.info("GEMINI_KEY loaded successfully.", { keyExists: true });
    genAI = new GoogleGenerativeAI(apiKey);
    functions.logger.info("GoogleGenerativeAI initialized successfully.");
  } else {
    throw new Error("GEMINI_KEY is missing or invalid.");
  }
} catch (error) {
  // ✨ 초기화 실패 시 에러를 기록합니다. ✨
  functions.logger.error("Failed to initialize GoogleGenerativeAI:", error);
  initializationError = error;
}


exports.getAISuggestion = functions.https.onCall(async (data, context) => {
  // ✨ 함수 호출 시 초기화 오류가 있었는지 먼저 확인합니다. ✨
  if (initializationError) {
    functions.logger.error("Function called but initialization failed previously.", { error: initializationError });
    throw new functions.https.HttpsError(
        "failed-precondition",
        "The function is not initialized correctly due to a configuration error.",
        initializationError.message,
    );
  }

  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "The function must be called while authenticated.",
    );
  }

  const { prompt: originalPrompt } = data;
  if (!originalPrompt) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "The function must be called with one argument 'prompt'.",
    );
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
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(metaPrompt);
    const response = await result.response;
    const suggestion = response.text();
    return { suggestion };
  } catch (error) {
    console.error("AI API Call Error:", error);
    throw new functions.https.HttpsError(
        "internal",
        "Failed to get suggestion from AI.",
        error,
    );
  }
});