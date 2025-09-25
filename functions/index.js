const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {initializeApp} = require("firebase-admin/app");
const {GoogleGenerativeAI} = require("@google/generative-ai");
const logger = require("firebase-functions/logger");

// Firebase Admin SDK와 Gemini API 클라이언트를 전역에서 한 번만 초기화합니다.
// 이렇게 하면 함수가 재사용될 때(웜 스타트) 초기화 과정을 건너뛰어 성능이 향상됩니다.
initializeApp();

// 환경 변수에서 API 키를 가져옵니다.
const API_KEY = process.env.GEMINI_KEY;
if (!API_KEY) {
  logger.error("GEMINI_KEY is not set in environment variables.");
}

// AI 클라이언트를 한 번만 생성합니다.
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({model: "gemini-pro"});


exports.getAISuggestion = onCall({
  region: "asia-northeast3", // 서울 리전 명시
  memory: "256MiB", // 필요한 메모리 설정 (기본값보다 낮춰도 충분)
}, async (request) => {
  // 1. API 키가 설정되지 않았으면 즉시 에러 발생
  if (!API_KEY) {
    throw new HttpsError(
        "failed-precondition",
        "The function is not configured correctly (API key is missing).",
    );
  }

  // 2. 인증된 사용자인지 확인
  if (!request.auth) {
    throw new HttpsError(
        "unauthenticated",
        "The function must be called while authenticated.",
    );
  }

  // 3. 클라이언트로부터 'prompt' 데이터가 제대로 전달되었는지 확인
  const originalPrompt = request.data.prompt;
  if (typeof originalPrompt !== "string" || originalPrompt.trim() === "") {
    throw new HttpsError(
        "invalid-argument",
        "The function must be called with a non-empty 'prompt' argument.",
    );
  }

  // 4. Gemini AI에 전달할 메타 프롬프트 구성
  const metaPrompt = `
You are an expert prompt engineer.
Your task is to refine the user's prompt to make it more effective.
**COSTAR Framework:**
* **[C]ontext:** The user's prompt might be vague or lack details.
* **[O]bjective:** Rewrite the prompt to be clearer, more specific, and provide more context to the AI. Assign a role, provide examples, and specify the output format.
* **[S]tyle:** Concise and direct.
* **[T]one:** Professional and instructional.
* **[A]udience:** An advanced AI model.
* **[R]esponse:** Provide ONLY the rewritten prompt text, without any explanations.

**User's Original Prompt:**
"${originalPrompt}"

**Rewritten Prompt:**
  `.trim();

  // 5. AI API 호출 및 예외 처리
  try {
    const result = await model.generateContent(metaPrompt);
    const response = await result.response;
    const suggestion = response.text();

    // 성공적으로 처리된 결과를 클라이언트에 반환
    return {suggestion};
  } catch (error) {
    // API 호출 중 에러가 발생하면 로그를 남기고 클라이언트에 에러를 전송
    logger.error("AI API Call Error:", error);
    throw new HttpsError(
        "internal",
        "Failed to get suggestion from AI.",
        error,
    );
  }
});