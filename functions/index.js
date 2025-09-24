const functions = require("firebase-functions");
const {GoogleGenerativeAI} = require("@google/generative-ai");
require("dotenv").config();

// API 키를 .env 파일에서 안전하게 불러옵니다.
const API_KEY = process.env.GEMINI_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

exports.getAISuggestion = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "The function must be called while authenticated.",
    );
  }

  const {prompt: originalPrompt} = data;
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
    const model = genAI.getGenerativeModel({model: "gemini-pro"});
    const result = await model.generateContent(metaPrompt);
    const response = await result.response;
    const suggestion = response.text();
    return {suggestion};
  } catch (error) {
    console.error("AI API Call Error:", error);
    throw new functions.https.HttpsError(
        "internal",
        "Failed to get suggestion from AI.",
    );
  }
});