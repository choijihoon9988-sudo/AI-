// public/scripts/components/GuildModal.js

let modalElement = null;
let resolvePromise = null;

function createModal() {
    if (document.getElementById('guild-modal-overlay')) return;

    const modalHTML = `
        <div class="modal-overlay" id="guild-modal-overlay">
            <div class="modal" id="guild-modal">
                <div class="modal-header">
                    <h3 class="modal-title">Create New Guild</h3>
                    <button class="modal-close-btn" id="guild-modal-close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="guild-form">
                        <div class="form-group">
                            <label for="guild-name">Guild Name</label>
                            <input class="form-control" type="text" id="guild-name" placeholder="e.g., Marketing Team" required>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="p-btn" id="guild-modal-cancel-btn" type="button">Cancel</button>
                    <button class="p-btn p-btn-primary" id="guild-modal-save-btn" type="button">Create</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    modalElement = document.getElementById('guild-modal-overlay');

    // 이벤트 리스너 설정
    document.getElementById('guild-modal-close-btn').addEventListener('click', () => closeModal(null));
    document.getElementById('guild-modal-cancel-btn').addEventListener('click', () => closeModal(null));
    modalElement.addEventListener('click', (e) => {
        if (e.target.id === 'guild-modal-overlay') {
            closeModal(null);
        }
    });
    document.getElementById('guild-modal-save-btn').addEventListener('click', () => {
        const form = document.getElementById('guild-form');
        if (form.checkValidity()) {
            const guildName = document.getElementById('guild-name').value;
            closeModal(guildName);
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

export function openGuildModal() {
    if (!modalElement) {
        createModal();
    }
    
    document.getElementById('guild-form').reset();
    modalElement.classList.add('active');
    document.getElementById('guild-name').focus();

    return new Promise((resolve) => {
        resolvePromise = resolve;
    });
}