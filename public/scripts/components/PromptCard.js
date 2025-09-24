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
 * @param {string} currentUserId - 현재 로그인한 사용자 ID
 * @returns {HTMLElement} - 생성된 카드 div 요소
 */
export function createPromptCard(prompt, userRole = 'owner', currentUserId) {
    const card = document.createElement('div');
    card.className = 'prompt-card';
    card.dataset.id = prompt.id;

    const canEdit = userRole === 'owner' || userRole === 'editor';
    const useCount = prompt.use_count || 0;
    
    const userRating = prompt.ratings ? prompt.ratings[currentUserId] : null;
    const displayRating = userRating || prompt.avg_rating || 0;
    const avgRatingText = (prompt.avg_rating || 0).toFixed(1);

    let starsHTML = '';
    for (let i = 1; i <= 5; i++) {
        const isFilled = i <= Math.round(displayRating);
        starsHTML += `<i class="fa-star rating-star ${isFilled ? 'fas' : 'far'}" data-rating="${i}"></i>`;
    }

    const categoryTag = prompt.category 
        ? `<div class="category-tag">${escapeHTML(prompt.category)}</div>` 
        : '';

    card.innerHTML = `
        <div class="prompt-card-main">
            <div class="prompt-card-header">
                <h3>${escapeHTML(prompt.title)}</h3>
                <div class="prompt-card-actions">
                    <button class="btn-icon ai-helper-btn" title="AI로 개선하기">
                        <i class="fas fa-magic"></i>
                    </button>
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
                <span><i class="fas fa-star"></i> ${avgRatingText}</span>
            </div>
            <div class="rating-stars">${starsHTML}</div>
            ${categoryTag}
        </div>
    `;

    return card;
}