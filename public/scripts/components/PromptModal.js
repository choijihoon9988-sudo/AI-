let modalElement = null;
let resolvePromise = null;

/**
 * 모달 HTML을 처음 한 번만 생성해서 body에 추가해.
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

    // --- 버튼 클릭 이벤트들을 여기에 한 번만 설정해 ---
    document.getElementById('modal-close-btn').addEventListener('click', () => closeModal(null));
    document.getElementById('modal-cancel-btn').addEventListener('click', () => closeModal(null));
    document.getElementById('prompt-modal-overlay').addEventListener('click', (e) => {
        // 어두운 배경을 클릭하면 모달이 닫히도록 해.
        if (e.target.id === 'prompt-modal-overlay') {
            closeModal(null);
        }
    });
    document.getElementById('modal-save-btn').addEventListener('click', () => {
        const form = document.getElementById('prompt-form');
        if (form.checkValidity()) { // 제목과 내용이 비어있지 않은지 확인
            const data = {
                id: document.getElementById('prompt-id').value,
                title: document.getElementById('prompt-title').value,
                content: document.getElementById('prompt-content').value
            };
            closeModal(data); // 입력된 데이터를 가지고 모달을 닫아.
        } else {
            form.reportValidity(); // 비어있으면 브라우저가 경고 메시지를 보여줘.
        }
    });

    // Puppertino CSS 프레임워크와 잘 어울리도록 추가 스타일을 JS로 넣어줘.
    const style = document.createElement('style');
    style.textContent = `
    .p-modal-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background-color: rgba(0,0,0,0.5); display: none; align-items: center;
            justify-content: center; z-index: 1000;
    }
    .p-modal-overlay.is-open { display: flex; }
    .p-modal { max-width: 600px; width: 90%; }
    .p-form-group { margin-bottom: 1rem; }
    .p-form-group label { display: block; margin-bottom: 0.5rem; }
    .p-form-group input, .p-form-group textarea { width: 100%; }
    `;
    document.head.appendChild(style);
}

/**
 * 프롬프트 생성/수정을 위한 모달을 열어주는 함수
 * @param {object|null} promptData - 수정할 데이터가 있으면 받고, 없으면 새로 생성.
 * @returns {Promise<object|null>} - 사용자가 'Save'를 누르면 입력 데이터를, 'Cancel'을 누르면 null을 반환.
 */
export function openModal(promptData = null) {
    if (!modalElement) {
        createModal(); // 모달이 없으면 한 번만 생성
    }

    const titleEl = document.getElementById('modal-title');
    const idEl = document.getElementById('prompt-id');
    const promptTitleEl = document.getElementById('prompt-title');
    const promptContentEl = document.getElementById('prompt-content');

    if (promptData) { // 수정 모드일 때
        titleEl.textContent = 'Edit Prompt';
        idEl.value = promptData.id;
        promptTitleEl.value = promptData.title;
        promptContentEl.value = promptData.content;
    } else { // 새로 만들기 모드일 때
        titleEl.textContent = 'New Prompt';
        document.getElementById('prompt-form').reset(); // 폼을 깨끗하게 비워.
        idEl.value = '';
    }

    modalElement.parentElement.classList.add('is-open'); // 모달을 화면에 보여줘.
    promptTitleEl.focus(); // 제목 입력창에 자동으로 커서를 옮겨줘.

    // Promise를 사용해서 사용자의 입력을 기다렸다가 결과를 반환하는 고급 기술이야.
    return new Promise((resolve) => {
        resolvePromise = resolve;
    });
}

/**
 * 모달을 닫고, 약속(Promise)된 결과를 반환하는 함수
 * @param {object|null} data - 반환할 데이터
 */
function closeModal(data) {
    if (modalElement) {
        modalElement.parentElement.classList.remove('is-open'); // 모달을 화면에서 숨겨.
    }
    if (resolvePromise) {
        resolvePromise(data); // 기다리고 있던 openModal 함수에 결과를 전달해.
        resolvePromise = null;
    }
}