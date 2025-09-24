const functions = require("firebase-functions");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// 중요: 여기에 실제 Gemini API 키를 입력하세요.
// 이 키는 Firebase 환경 변수에 저장하여 사용하는 것이 가장 안전합니다.
// firebase functions:config:set gemini.key="YOUR_API_KEY"
const API_KEY = functions.config().gemini.key;
const genAI = new GoogleGenerativeAI(API_KEY);

exports.getAISuggestion = functions.https.onCall(async (data, context) => {
  // 사용자가 인증되지 않았으면 에러 반환
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const originalPrompt = data.prompt;
  if (!originalPrompt) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "The function must be called with one argument 'prompt'."
    );
  }

  // MISSION.txt 파일의 메타 프롬프트
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

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(metaPrompt);
    const response = await result.response;
    const suggestion = response.text();
    return { suggestion: suggestion };
  } catch (error) {
    console.error("AI API 호출 에러:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to get suggestion from AI."
    );
  }
});