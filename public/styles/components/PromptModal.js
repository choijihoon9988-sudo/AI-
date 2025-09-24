let modalElement = null;
let resolvePromise = null;

/**
 * 모달 HTML을 생성하고 body에 추가합니다.
 */
function createModal() {
    if (document.getElementById('prompt-modal')) return;

    const modalHTML = `
        <div class="p-modal-overlay" id="prompt-modal-overlay">
            <div class="p-modal" id="prompt-modal">
                <div class="p-modal-header">
                    <h3 id="modal-title">New Prompt</h3>
                    <button class="p-modal-close" id="modal-close-btn">&times;</button>
                </div>
                <div class="p-modal-content">
                    <form id="prompt-form">
                        <input type="hidden" id="prompt-id">
                        <div class="p-form-group">
                            <label for="prompt-title">Title</label>
                            <input type="text" id="prompt-title" placeholder="e.g., JavaScript Code Reviewer" required>
                        </div>
                        <div class="p-form-group">
                            <label for="prompt-content">Content</label>
                            <textarea id="prompt-content" rows="10" placeholder="Enter your prompt here..." required></textarea>
                        </div>
                    </form>
                </div>
                <div class="p-modal-footer">
                    <button class="p-btn" id="modal-cancel-btn">Cancel</button>
                    <button class="p-btn p-btn-primary" id="modal-save-btn">Save</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    modalElement = document.getElementById('prompt-modal');

    // 이벤트 리스너 설정
    document.getElementById('modal-close-btn').addEventListener('click', () => closeModal(null));
    document.getElementById('modal-cancel-btn').addEventListener('click', () => closeModal(null));
    document.getElementById('prompt-modal-overlay').addEventListener('click', (e) => {
        if (e.target.id === 'prompt-modal-overlay') {
            closeModal(null);
        }
    });
    document.getElementById('modal-save-btn').addEventListener('click', () => {
        const form = document.getElementById('prompt-form');
        if (form.checkValidity()) {
            const data = {
                id: document.getElementById('prompt-id').value,
                title: document.getElementById('prompt-title').value,
                content: document.getElementById('prompt-content').value
            };
            closeModal(data);
        } else {
            form.reportValidity();
        }
    });

    // Puppertino 모달을 위한 추가 스타일 (JS로 동적 추가)
    const style = document.createElement('style');
    style.textContent = `
    .p-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 1000;
    }
    .p-modal-overlay.is-open {
            display: flex;
    }
    .p-modal {
            max-width: 600px;
            width: 90%;
    }
    .p-form-group {
            margin-bottom: 1rem;
    }
    .p-form-group label {
            display: block;
            margin-bottom: 0.5rem;
    }
    .p-form-group input, .p-form-group textarea {
            width: 100%;
        }
    `;
    document.head.appendChild(style);
}

/**
 * 프롬프트 생성/수정을 위한 모달을 엽니다.
 * @param {object|null} promptData - 수정할 프롬프트 데이터. 새로 생성할 경우 null.
 * @returns {Promise<object|null>} - 사용자가 저장하면 프롬프트 데이터를, 취소하면 null을 resolve하는 Promise.
 */
export function openModal(promptData = null) {
    if (!modalElement) {
        createModal();
    }

    const titleEl = document.getElementById('modal-title');
    const idEl = document.getElementById('prompt-id');
    const promptTitleEl = document.getElementById('prompt-title');
    const promptContentEl = document.getElementById('prompt-content');

    if (promptData) {
        // 수정 모드
        titleEl.textContent = 'Edit Prompt';
        idEl.value = promptData.id;
        promptTitleEl.value = promptData.title;
        promptContentEl.value = promptData.content;
    } else {
        // 생성 모드
        titleEl.textContent = 'New Prompt';
        document.getElementById('prompt-form').reset();
        idEl.value = '';
    }

    modalElement.parentElement.classList.add('is-open');
    promptTitleEl.focus();

    return new Promise((resolve) => {
        resolvePromise = resolve;
    });
}

/**
 * 모달을 닫고 Promise를 resolve합니다.
 * @param {object|null} data - 반환할 데이터
 */
function closeModal(data) {
    if (modalElement) {
        modalElement.parentElement.classList.remove('is-open');
    }
    if (resolvePromise) {
        resolvePromise(data);
        resolvePromise = null;
    }
}