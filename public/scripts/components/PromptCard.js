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
 * @param {object} prompt - 프롬프트 객체
 * @param {string} userRole - 현재 길드에서의 사용자 역할 ('owner', 'editor', 'viewer')
 * @returns {HTMLElement} - 생성된 카드 div 요소
 */
export function createPromptCard(prompt, userRole = 'owner') {
    const card = document.createElement('div');
    card.className = 'prompt-card';
    card.dataset.id = prompt.id;

    const canEdit = userRole === 'owner' || userRole === 'editor';
    const useCount = prompt.use_count || 0;
    const avgRating = prompt.avg_rating ? prompt.avg_rating.toFixed(1) : '0.0';

    let starsHTML = '';
    for (let i = 1; i <= 5; i++) {
        starsHTML += `<i class="far fa-star rating-star" data-rating="${i}" style="color: ${i <= Math.round(avgRating) ? '#ffc107' : '#e0e0e0'};"></i>`;
    }

    const categoryTag = prompt.category 
        ? `<div class="category-tag">${escapeHTML(prompt.category)}</div>` 
        : '';

    card.innerHTML = `
        <div class="prompt-card-main">
            <div class="prompt-card-header">
                <h3>${escapeHTML(prompt.title)}</h3>
                <div class="prompt-card-actions">
                    <button class="btn-icon history-btn" title="버전 기록">
                        <i class="fas fa-history"></i>
                    </button>
                    <button class="btn-icon copy-btn" title="프롬프트 복사">
                        <i class="fas fa-copy"></i>
                    </button>
                    ${canEdit ? `
                    <button class="btn-icon edit-btn" title="수정">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete-btn" title="삭제">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                    ` : ''}
                </div>
            </div>
            <div class="prompt-card-content">
                <pre><code>${escapeHTML(prompt.content)}</code></pre>
            </div>
        </div>
        <div class="prompt-card-footer">
            <div class="prompt-stats">
                <span><i class="fas fa-copy"></i> ${useCount}</span>
                <span><i class="fas fa-star"></i> ${avgRating}</span>
            </div>
            <div class="rating-stars">${starsHTML}</div>
            ${categoryTag}
        </div>
    `;

    return card;
}