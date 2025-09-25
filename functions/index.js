// functions/index.js (테스트용 코드)
const functions = require("firebase-functions");

exports.getAISuggestion = functions.https.onCall((data, context) => {
  // 로그를 남겨서 함수가 호출되었는지 확인합니다.
  functions.logger.info("Test function called with data:", data);

  // AI 기능 대신 간단한 텍스트를 즉시 반환합니다.
  return {
    suggestion: `테스트 성공! 원본 프롬프트: "${data.prompt}"`,
  };
});