const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const {initializeApp} = require("firebase-admin/app");
const {GoogleGenerativeAI} = require("@google/generative-ai");
const logger = require("firebase-functions/logger");

initializeApp();

const API_KEY = process.env.GEMINI_KEY;
if (!API_KEY) {
  logger.error("GEMINI_KEY is not set in environment variables.");
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({model: "gemini-pro"});

// --- 기존 getAISuggestion 함수 (변경 없음) ---
exports.getAISuggestion = onCall({
  region: "asia-northeast3",
  memory: "256MiB",
}, async (request) => {
    // ... 코드 생략 ...
});

// AI 분석을 수행하는 공통 로직
const analyzePromptContent = async (snapshot) => {
  if (!API_KEY) {
    logger.error("API Key not found, skipping analysis.");
    return;
  }
  if (!snapshot) {
    logger.log("No data associated with the event");
    return;
  }
  const promptData = snapshot.data();
  const promptContent = promptData.content;

  if (!promptContent) {
    logger.log("Prompt content is empty, skipping.");
    return;
  }

  const metaPrompt = `
    Analyze the following user-submitted prompt and provide the following metadata in a JSON object format.
    Do not include any explanatory text, only the raw JSON object.

    1.  **summary**: A concise, one-sentence summary of what this prompt does (in Korean).
    2.  **useCase**: A brief description of the ideal situation to use this prompt (in Korean).
    3.  **tags**: An array of 3-5 relevant keywords (in Korean).

    **User's Prompt:**
    "${promptContent}"

    **JSON Output:**
  `;

  try {
    const result = await model.generateContent(metaPrompt);
    const response = await result.response;
    let text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        logger.error("Failed to find JSON in AI response:", text);
        return;
    }
    const jsonString = jsonMatch[0];
    const aiMetadata = JSON.parse(jsonString);

    await snapshot.ref.update({
      aiSummary: aiMetadata.summary || "",
      aiUseCase: aiMetadata.useCase || "",
      aiTags: aiMetadata.tags || [],
    });
    logger.log(`Successfully analyzed and updated prompt: ${snapshot.id}`);
  } catch (error) {
    logger.error(`Error analyzing prompt ${snapshot.id}:`, error);
  }
};

/**
 * ✨ 1. 개인 프롬프트가 생성되면 AI를 통해 분석
 */
exports.analyzePersonalPromptOnCreate = onDocumentCreated({
    document: "prompts/{promptId}",
    region: "asia-northeast3",
}, (event) => {
    return analyzePromptContent(event.data);
});

/**
 * ✨ 2. 길드 프롬프트가 생성되면 AI를 통해 분석 (새로 추가!)
 */
exports.analyzeGuildPromptOnCreate = onDocumentCreated({
    document: "guilds/{guildId}/prompts/{promptId}",
    region: "asia-northeast3",
}, (event) => {
    return analyzePromptContent(event.data);
});