/**
 * 프롬프트 데이터를 받아서 HTML 카드 요소를 만들어주는 함수
 * @param {object} prompt - { id, title, content } 데이터가 들어있는 객체
 * @returns {HTMLElement} - 완성된 HTML 카드 요소
 */
export function createPromptCard(prompt) {
    const card = document.createElement('div');
    card.className = 'prompt-card';
    card.dataset.id = prompt.id; // 나중에 수정/삭제할 때 어떤 카드인지 식별하기 위해 ID를 저장해 둬.

    // 카드의 내부 HTML 구조를 정의해.
    card.innerHTML = `
        <div class="prompt-card-header">
            <h3>${escapeHTML(prompt.title)}</h3>
            <div class="prompt-card-actions">
                <button class="edit-btn" title="Edit Prompt">
                    <i class="fas fa-pencil-alt"></i>
                </button>
                <button class="delete-btn" title="Delete Prompt">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
        <div class="prompt-card-content">
            <pre><code>${escapeHTML(prompt.content)}</code></pre>
        </div>
    `;

    return card;
}

/**
 * 해킹 공격(XSS)을 방지하기 위해 HTML 태그를 안전한 문자로 바꿔주는 함수
 * @param {string} str - 변환할 문자열
 * @returns {string} - 안전하게 변환된 문자열
 */
function escapeHTML(str) {
    const p = document.createElement('p');
    p.textContent = str;
    return p.innerHTML;
}