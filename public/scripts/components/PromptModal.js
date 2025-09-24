// public/scripts/components/PromptModal.js (수정 완료)

let modalElement = null;
let resolvePromise = null;

function createModal() {
    if (document.getElementById('prompt-modal-overlay')) return;

    // Puppertino CSS 프레임워크와 호환되는 모달 HTML 구조로 변경
    const modalHTML = `
        <div class="modal-overlay" id="prompt-modal-overlay">
            <div class="modal" id="prompt-modal">
                <div class="modal-header">
                    <h3 class="modal-title" id="modal-title">New Prompt</h3>
                    <button class="modal-close-btn" id="modal-close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="prompt-form">
                        <input type="hidden" id="prompt-id">
                        <div class="form-group">
                            <label for="prompt-title">Title</label>
                            <input class="form-control" type="text" id="prompt-title" placeholder="e.g., JavaScript Code Reviewer" required>
                        </div>
                        <div class="form-group">
                            <label for="prompt-content">Content</label>
                            <textarea class="form-control" id="prompt-content" rows="10" placeholder="Enter your prompt here..." required></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="p-btn" id="modal-cancel-btn" type="button">Cancel</button>
                    <button class="p-btn p-btn-primary" id="modal-save-btn" type="button">Save</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    modalElement = document.getElementById('prompt-modal-overlay');

    // 이벤트 리스너 설정
    document.getElementById('modal-close-btn').addEventListener('click', () => closeModal(null));
    document.getElementById('modal-cancel-btn').addEventListener('click', () => closeModal(null));
    modalElement.addEventListener('click', (e) => {
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
}

function closeModal(data) {
    if (modalElement) {
        // 'is-open' 대신 'active' 클래스를 사용하여 Puppertino와 호환성 유지
        modalElement.classList.remove('active');
    }
    if (resolvePromise) {
        resolvePromise(data);
        resolvePromise = null;
    }
}

export function openModal(promptData = null) {
    if (!modalElement) {
        createModal();
    }

    const form = document.getElementById('prompt-form');
    const titleEl = document.getElementById('modal-title');
    const idEl = document.getElementById('prompt-id');
    const promptTitleEl = document.getElementById('prompt-title');
    const promptContentEl = document.getElementById('prompt-content');

    if (promptData) {
        titleEl.textContent = 'Edit Prompt';
        idEl.value = promptData.id;
        promptTitleEl.value = promptData.title;
        promptContentEl.value = promptData.content;
    } else {
        titleEl.textContent = 'New Prompt';
        form.reset();
        idEl.value = '';
    }

    // 'is-open' 대신 'active' 클래스를 사용하여 모달 표시
    modalElement.classList.add('active');
    promptTitleEl.focus();

    return new Promise((resolve) => {
        resolvePromise = resolve;
    });
}