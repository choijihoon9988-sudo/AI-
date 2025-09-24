// public/scripts/components/PromptModal.js

let modalElement = null;
let resolvePromise = null;

/**
 * 모달 HTML을 생성하고 body에 추가합니다.
 */
function createModal() {
    if (document.getElementById('prompt-modal-overlay')) return;

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
                            <label for="prompt-category">Category (Optional)</label>
                            <input class="form-control" type="text" id="prompt-category" placeholder="e.g., Development, Marketing...">
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
                category: document.getElementById('prompt-category').value.trim(),
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
    const promptCategoryEl = document.getElementById('prompt-category');
    const promptContentEl = document.getElementById('prompt-content');

    if (promptData) {
        // 수정 모드
        titleEl.textContent = 'Edit Prompt';
        idEl.value = promptData.id;
        promptTitleEl.value = promptData.title;
        promptCategoryEl.value = promptData.category || '';
        promptContentEl.value = promptData.content;
    } else {
        // 생성 모드
        titleEl.textContent = 'New Prompt';
        form.reset();
        idEl.value = '';
    }

    modalElement.classList.add('active');
    promptTitleEl.focus();

    return new Promise((resolve) => {
        resolvePromise = resolve;
    });
}