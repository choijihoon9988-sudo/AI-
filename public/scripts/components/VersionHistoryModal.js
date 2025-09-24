// public/scripts/components/VersionHistoryModal.js

function escapeHTML(str) {
    if (!str) return '';
    const p = document.createElement('p');
    p.textContent = str;
    return p.innerHTML;
}

let modalOverlay = null;

/**
 * 모달의 DOM 구조를 생성하고 body에 한 번만 추가합니다.
 */
function createVersionHistoryModal() {
    if (document.getElementById('version-history-modal-overlay')) return;

    const modalHTML = `
        <div class="modal-overlay version-history-modal" id="version-history-modal-overlay">
            <div class="modal" id="version-history-modal">
                <div class="modal-header">
                    <h3 class="modal-title">버전 기록</h3>
                    <button class="modal-close-btn" id="version-history-close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="version-history-list" class="version-history-list">
                        </div>
                </div>
                <div class="modal-footer">
                    <button class="p-btn" id="version-history-cancel-btn">닫기</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    modalOverlay = document.getElementById('version-history-modal-overlay');

    // 모달을 닫는 이벤트 리스너 설정
    const closeModal = () => modalOverlay.classList.remove('active');
    document.getElementById('version-history-close-btn').addEventListener('click', closeModal);
    document.getElementById('version-history-cancel-btn').addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target.id === 'version-history-modal-overlay') {
            closeModal();
        }
    });
}

/**
 * 버전 배열을 받아 모달 내부에 렌더링합니다.
 * @param {Array} versions - Firestore에서 가져온 버전 객체 배열
 */
function renderVersions(versions) {
    const listContainer = document.getElementById('version-history-list');
    if (!versions || versions.length === 0) {
        listContainer.innerHTML = '<p class="empty-state">이전 버전이 없습니다.</p>';
        return;
    }

    versions.sort((a, b) => {
        const timeA = a.savedAt?.toDate()?.getTime() || 0;
        const timeB = b.savedAt?.toDate()?.getTime() || 0;
        return timeB - timeA;
    });

    listContainer.innerHTML = versions.map(version => {
        const timestamp = (version.savedAt && typeof version.savedAt.toDate === 'function')
            ? version.savedAt.toDate().toLocaleString('ko-KR')
            : '날짜 정보 없음';
        
        return `
            <div class="version-item">
                <div class="version-meta">
                    <h4>${escapeHTML(version.title)}</h4>
                    <span>저장 일시: ${timestamp}</span>
                </div>
                <div class="version-content">
                    <pre><code>${escapeHTML(version.content)}</code></pre>
                </div>
            </div>
        `;
    }).join('');
}


/**
 * 버전 기록 모달을 열고 제공된 버전 목록을 표시합니다.
 * @param {Array} versions - 표시할 버전 객체 배열
 */
export function openVersionHistoryModal(versions = []) {
    if (!modalOverlay) {
        createVersionHistoryModal();
    }

    renderVersions(versions);
    modalOverlay.classList.add('active');
}