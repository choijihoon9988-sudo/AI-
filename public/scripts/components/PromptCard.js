/**
 * 간단한 XSS 방지를 위한 HTML 이스케이프 함수
 * @param {string} str - 이스케이프할 문자열
 * @returns {string} - 이스케이프된 HTML 문자열
 */
function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    const p = document.createElement('p');
    p.textContent = str;
    return p.innerHTML;
}

/**
 * 프롬프트 데이터를 기반으로 HTML 카드 요소를 생성합니다.
 * @param {object} prompt - { id, title, content, category }를 포함하는 프롬프트 객체
 * @returns {HTMLElement} - 생성된 카드 div 요소
 */
export function createPromptCard(prompt) {
    const card = document.createElement('div');
    card.className = 'prompt-card';
    card.dataset.id = prompt.id;

    const categoryTag = prompt.category 
        ? `<div class="category-tag">${escapeHTML(prompt.category)}</div>` 
        : '';

    card.innerHTML = `
        <div class="prompt-card-main">
            <div class="prompt-card-header">
                <h3>${escapeHTML(prompt.title)}</h3>
                <div class="prompt-card-actions">
                    <button class="btn-icon history-btn" title="Version History">
                        <i class="fas fa-history"></i>
                    </button>
                    <button class="btn-icon copy-btn" title="Copy Prompt">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="btn-icon edit-btn" title="Edit Prompt">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete-btn" title="Delete Prompt">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
            <div class="prompt-card-content">
                <pre><code>${escapeHTML(prompt.content)}</code></pre>
            </div>
        </div>
        ${prompt.category ? `<div class="prompt-card-footer">${categoryTag}</div>` : ''}
    `;

    return card;
}