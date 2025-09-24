import { onAuthStateChangedListener, signInWithGoogle, signOutUser } from './auth.js';
import { onPromptsUpdate, addPrompt, updatePrompt, deletePrompt, getPromptVersions } from './services/firestore-service.js';
import { createPromptCard } from './components/PromptCard.js';
import { openModal } from './components/PromptModal.js';
import { openVersionHistoryModal } from './components/VersionHistoryModal.js';
import { toast } from './utils/toast-service.js';

// --- DOM 요소 참조 ---
const userProfileContainer = document.getElementById('user-profile');
const promptGrid = document.getElementById('prompt-grid');
const newPromptButton = document.getElementById('new-prompt-btn');
const searchInput = document.getElementById('search-input');
const categoryList = document.getElementById('category-list');

// --- 애플리케이션 상태 관리 ---
let allPrompts = [];
let activeCategory = 'All';
let unsubscribeFromPrompts = null;

// --- 유틸리티 함수 ---
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

// --- UI 렌더링 함수 ---
function renderUserProfile(user) {
    if (user) {
        userProfileContainer.innerHTML = `
            <img src="${user.photoURL}" alt="${user.displayName}" referrerpolicy="no-referrer">
            <p>${user.displayName}</p>
            <button id="sign-out-btn" class="p-btn">Sign Out</button>
        `;
        document.getElementById('sign-out-btn').addEventListener('click', signOutUser);
        newPromptButton.style.display = 'flex';
    } else {
        userProfileContainer.innerHTML = `
            <p>Please sign in to manage your prompts.</p>
            <button id="sign-in-btn" class="p-btn p-btn-primary">Sign in with Google</button>
        `;
        document.getElementById('sign-in-btn').addEventListener('click', signInWithGoogle);
        newPromptButton.style.display = 'none';
    }
}

function renderPrompts(promptsToRender) {
    promptGrid.innerHTML = '';
    if (!promptsToRender || promptsToRender.length === 0) {
        promptGrid.innerHTML = `<div class="empty-state">표시할 프롬프트가 없습니다.</div>`;
        return;
    }
    promptsToRender.sort((a, b) => (b.updatedAt?.toDate() || 0) - (a.updatedAt?.toDate() || 0));
    promptsToRender.forEach(prompt => {
        const card = createPromptCard(prompt);
        promptGrid.appendChild(card);
    });
}

function renderCategories() {
    const categories = ['All', ...new Set(allPrompts.map(p => p.category).filter(Boolean))];
    categoryList.innerHTML = categories.map(category => `
        <button class="category-btn ${category === activeCategory ? 'active' : ''}" data-category="${category}">
            ${category}
        </button>
    `).join('');
}

// --- 핵심 로직 ---
function filterAndRenderPrompts() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    let filteredPrompts = allPrompts;

    if (activeCategory !== 'All') {
        filteredPrompts = filteredPrompts.filter(prompt => prompt.category === activeCategory);
    }

    if (searchTerm) {
        filteredPrompts = filteredPrompts.filter(prompt =>
            (prompt.title && prompt.title.toLowerCase().includes(searchTerm)) ||
            (prompt.content && prompt.content.toLowerCase().includes(searchTerm))
        );
    }

    renderPrompts(filteredPrompts);
}

// --- 이벤트 핸들러 ---
async function handleNewPrompt() {
    const result = await openModal();
    if (result) {
        try {
            await addPrompt({ title: result.title, content: result.content, category: result.category });
            toast.success('프롬프트가 성공적으로 추가되었습니다.');
        } catch (error) {
            toast.error('프롬프트 추가에 실패했습니다.');
        }
    }
}

async function handleGridClick(event) {
    const button = event.target.closest('.btn-icon');
    if (!button) return;

    const card = button.closest('.prompt-card');
    const promptId = card.dataset.id;
    const promptData = allPrompts.find(p => p.id === promptId);

    if (button.classList.contains('edit-btn')) {
        const result = await openModal(promptData);
        if (result) {
            try {
                await updatePrompt(promptId, { title: result.title, content: result.content, category: result.category });
                toast.success('프롬프트가 성공적으로 수정되었습니다.');
            } catch (error) {
                toast.error('프롬프트 수정에 실패했습니다.');
            }
        }
    } else if (button.classList.contains('delete-btn')) {
        if (confirm('정말로 이 프롬프트를 삭제하시겠습니까?')) {
            try {
                await deletePrompt(promptId);
                toast.success('프롬프트가 삭제되었습니다.');
            } catch (error) {
                toast.error('프롬프트 삭제에 실패했습니다.');
            }
        }
    } else if (button.classList.contains('copy-btn')) {
        const contentToCopy = card.querySelector('pre code').textContent;
        navigator.clipboard.writeText(contentToCopy)
            .then(() => toast.success('프롬프트가 클립보드에 복사되었습니다.'))
            .catch(err => toast.error('복사에 실패했습니다.'));
    } else if (button.classList.contains('history-btn')) {
        try {
            const versions = await getPromptVersions(promptId);
            openVersionHistoryModal(versions);
        } catch (error) {
            toast.error('버전 기록을 불러오는 데 실패했습니다.');
        }
    }
}

function handleCategoryClick(event) {
    const button = event.target.closest('.category-btn');
    if (!button) return;

    activeCategory = button.dataset.category;
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    filterAndRenderPrompts();
}

// --- 애플리케이션 초기화 ---
function initializeApp() {
    const debouncedFilter = debounce(filterAndRenderPrompts, 300);

    newPromptButton.addEventListener('click', handleNewPrompt);
    promptGrid.addEventListener('click', handleGridClick);
    searchInput.addEventListener('input', debouncedFilter);
    categoryList.addEventListener('click', handleCategoryClick);

    onAuthStateChangedListener(user => {
        renderUserProfile(user);
        
        if (unsubscribeFromPrompts) {
            unsubscribeFromPrompts();
            unsubscribeFromPrompts = null;
        }

        if (user) {
            unsubscribeFromPrompts = onPromptsUpdate((prompts) => {
                allPrompts = prompts || [];
                renderCategories();
                filterAndRenderPrompts();
            });
        } else {
            allPrompts = [];
            activeCategory = 'All';
            searchInput.value = '';
            renderCategories();
            promptGrid.innerHTML = `<div class="empty-state">로그인하여 프롬프트를 관리하세요.</div>`;
        }
    });
}

document.addEventListener('DOMContentLoaded', initializeApp);