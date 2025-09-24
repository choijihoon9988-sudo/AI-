// public/scripts/components/AIHelperModal.js

function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    const p = document.createElement('p');
    p.textContent = str;
    return p.innerHTML;
}

let modalElement = null;
let resolvePromise = null;

function createModal() {
    if (document.getElementById('ai-helper-modal-overlay')) return;

    const modalHTML = `
        <div class="modal-overlay" id="ai-helper-modal-overlay">
            <div class="modal ai-helper-modal" id="ai-helper-modal">
                <div class="modal-header">
                    <h3 class="modal-title">✨ AI 프롬프트 개선 제안</h3>
                    <button class="modal-close-btn" id="ai-helper-close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="comparison-container">
                        <div class="comparison-panel">
                            <h4>원본 프롬프트</h4>
                            <pre><code id="original-prompt-content"></code></pre>
                        </div>
                        <div class="comparison-panel">
                            <h4>AI 추천 프롬프트</h4>
                            <pre><code id="suggested-prompt-content"></code></pre>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="p-btn" id="ai-helper-cancel-btn">취소</button>
                    <button class="p-btn p-btn-primary" id="ai-helper-apply-btn">이 내용으로 적용</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    modalElement = document.getElementById('ai-helper-modal-overlay');

    // Event Listeners
    document.getElementById('ai-helper-close-btn').addEventListener('click', () => closeModal(null));
    document.getElementById('ai-helper-cancel-btn').addEventListener('click', () => closeModal(null));
    document.getElementById('ai-helper-apply-btn').addEventListener('click', () => {
        const suggestion = document.getElementById('suggested-prompt-content').textContent;
        closeModal(suggestion);
    });
    modalElement.addEventListener('click', e => {
        if (e.target.id === 'ai-helper-modal-overlay') closeModal(null);
    });
}

function closeModal(data) {
    if (modalElement) {
        modalElement.classList.remove('active');
    }
    if (resolvePromise) {
        resolvePromise(data);
        resolvePromise = null;
    }
}

export function openAIHelperModal(originalPrompt, suggestedPrompt) {
    if (!modalElement) {
        createModal();
    }

    document.getElementById('original-prompt-content').textContent = originalPrompt;
    document.getElementById('suggested-prompt-content').textContent = suggestedPrompt;

    modalElement.classList.add('active');
    return new Promise((resolve) => {
        resolvePromise = resolve;
    });
}