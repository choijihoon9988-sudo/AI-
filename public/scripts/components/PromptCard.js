/**
 * 프롬프트 카드 컴포넌트를 렌더링하고 이벤트 리스너를 설정하는 함수
 * @param {HTMLElement} container - 카드가 추가될 부모 요소
 * @param {object} promptData - 프롬프트 데이터 { content: '...' }
 */
export function renderPromptCard(container, promptData) {
    const card = document.createElement('div');
    card.className = 'prompt-card';

    const content = document.createElement('p');
    content.className = 'prompt-content';
    content.textContent = promptData.content;

    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.textContent = '복사';

    card.appendChild(content);
    card.appendChild(copyBtn);

    // 복사 버튼에 클릭 이벤트 리스너 추가
    copyBtn.addEventListener('click', async () => {
        // navigator.clipboard API는 비동기로 동작하며 Promise를 반환합니다.
        // 이 API는 보안 컨텍스트(HTTPS)에서만 사용 가능합니다.
        if (!navigator.clipboard) {
            console.error("Clipboard API가 지원되지 않는 환경입니다.");
            alert("복사 기능이 지원되지 않는 브라우저입니다.");
            return;
        }

        try {
            await navigator.clipboard.writeText(promptData.content);

            // 사용자에게 시각적 피드백 제공
            const originalText = copyBtn.textContent;
            copyBtn.textContent = '복사 완료!';
            copyBtn.disabled = true;

            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.disabled = false;
            }, 1500); // 1.5초 후 원래 상태로 복귀

        } catch (err) {
            console.error('클립보드 복사 실패:', err);
            alert("클립보드 복사에 실패했습니다.");
        }
    });

    container.appendChild(card);
}

/**
 * AI 모델을 통해 프롬프트 개선 제안을 요청하는 함수 (개념 코드)
 * 실제 구현 시에는 Firebase Cloud Functions와 같은 백엔드 환경에서
 * OpenAI, Google Gemini 등의 LLM API를 호출해야 합니다.
 * @param {string} originalPrompt - 사용자가 입력한 원본 프롬프트
 * @returns {Promise<string>} AI가 제안하는 개선된 프롬프트
 */
export async function getPromptSuggestion(originalPrompt) {
    // 이 URL은 실제 배포된 Cloud Function의 엔드포인트여야 합니다.
    const CLOUD_FUNCTION_URL = "YOUR_CLOUD_FUNCTION_ENDPOINT_URL";

    // --- 메타 프롬프트(Meta-Prompt) 설계 ---
    // AI에게 단순히 '개선해줘'라고 요청하는 대신,
    // COSTAR 프레임워크에 따라 구체적이고 구조화된 지시를 내립니다.
    // 이 메타 프롬프트는 Cloud Function 내에서 LLM에게 전달됩니다.
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
    // ------------------------------------

    try {
        // 실제로는 인증 토큰 등을 함께 보내야 합니다.
        const response = await fetch(CLOUD_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // 백엔드에서는 이 originalPrompt를 받아 위 metaPrompt와 결합합니다.
            body: JSON.stringify({ prompt: originalPrompt }),
        });

        if (!response.ok) {
            throw new Error(`서버 에러: ${response.statusText}`);
        }

        const data = await response.json();
        return data.suggestion; // 서버가 { suggestion: "..." } 형태로 응답한다고 가정

    } catch (error) {
        console.error("AI 제안 요청 실패:", error);
        // 사용자에게 에러를 알리는 UI 로직 추가
        return "개선 제안을 받아오는 데 실패했습니다.";
    }
}