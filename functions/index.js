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

// AI 분석을 수행하는 공통 로직 (✨ 상세 로그 추가 ✨)
const analyzePromptContent = async (promptContent, snapshotRef) => {
  if (!API_KEY) {
    logger.error("API Key not found, skipping analysis.");
    return;
  }
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
    // ✨ [로그 1] AI에게 보낼 최종 프롬프트를 로그로 남김
    logger.info("Sending prompt to Gemini:", {metaPrompt});

    const result = await model.generateContent(metaPrompt);
    const response = await result.response;
    let text = response.text();
    
    // ✨ [로그 2] AI에게 받은 원본 답변 전체를 로그로 남김
    logger.info("Received raw response from Gemini:", {text});

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        logger.error("Failed to find JSON in AI response:", text);
        return;
    }
    const jsonString = jsonMatch[0];
    const aiMetadata = JSON.parse(jsonString);

    if (snapshotRef) { // Firestore 트리거를 통해 호출된 경우에만 DB 업데이트
        await snapshotRef.update({
          aiSummary: aiMetadata.summary || "",
          aiUseCase: aiMetadata.useCase || "",
          aiTags: aiMetadata.tags || [],
        });
        logger.log(`Successfully analyzed and updated prompt: ${snapshotRef.id}`);
    }

    return aiMetadata; // 분석 결과를 반환하도록 수정

  } catch (error) {
    logger.error(`Error during AI analysis:`, error);
    throw new HttpsError("internal", "AI analysis failed.", error.message);
  }
};

// Firestore 문서 생성 시 자동으로 호출되는 함수들
exports.analyzePersonalPromptOnCreate = onDocumentCreated({
    document: "prompts/{promptId}",
    region: "asia-northeast3",
}, (event) => {
    return analyzePromptContent(event.data.data().content, event.data.ref);
});

exports.analyzeGuildPromptOnCreate = onDocumentCreated({
    document: "guilds/{guildId}/prompts/{promptId}",
    region: "asia-northeast3",
}, (event) => {
    return analyzePromptContent(event.data.data().content, event.data.ref);
});


// ✨✨✨ 진단용 테스트 함수 (새로 추가) ✨✨✨
exports.testAnalyzePrompt = onCall({ region: "asia-northeast3" }, async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Authentication is required.");
    }
    const testContent = request.data.content;
    if (!testContent) {
        throw new HttpsError("invalid-argument", "Content is required.");
    }
    
    logger.log("Starting manual analysis test...");
    // DB 업데이트는 하지 않고, 순수 AI 분석 및 반환만 테스트
    return await analyzePromptContent(testContent, null);
});