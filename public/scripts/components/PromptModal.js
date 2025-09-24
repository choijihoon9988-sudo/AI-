// public/scripts/components/PromptModal.js (최종 완성본)

let modalElement = null;
let resolvePromise = null;

function createModal() {
    if (document.getElementById('prompt-modal-overlay')) return;

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
                    <button class="p-btn" id="modal-cancel-btn" type="button">Cancel</button>
                    <button class="p-btn p-btn-primary" id="modal-save-btn" type="button">Save</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    modalElement = document.getElementById('prompt-modal-overlay');

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
        modalElement.classList.remove('is-open');
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

    if (promptData) {
        titleEl.textContent = 'Edit Prompt';
        idEl.value = promptData.id;
        promptTitleEl.value = promptData.title;
        document.getElementById('prompt-content').value = promptData.content;
    } else {
        titleEl.textContent = 'New Prompt';
        form.reset();
        idEl.value = '';
    }

    modalElement.classList.add('is-open');
    promptTitleEl.focus();

    return new Promise((resolve) => {
        resolvePromise = resolve;
    });
}