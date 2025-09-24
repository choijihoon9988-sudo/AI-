/**
 * 프롬프트 데이터를 기반으로 HTML 카드 요소를 생성합니다.
 * @param {object} prompt - { id, title, content }를 포함하는 프롬프트 객체
 * @returns {HTMLElement} - 생성된 카드 div 요소
 */
export function createPromptCard(prompt) {
    const card = document.createElement('div');
    card.className = 'prompt-card';
    card.dataset.id = prompt.id;

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

// 간단한 XSS 방지를 위한 HTML 이스케이프 함수
function escapeHTML(str) {
    const p = document.createElement('p');
    p.textContent = str;
    return p.innerHTML;
}