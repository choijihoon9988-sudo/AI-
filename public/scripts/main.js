// 모든 부품(모듈)들을 정확한 최종 경로에서 불러와.
import { onAuthStateChangedListener, signInWithGoogle, signOutUser, handleRedirectResult } from './auth.js';
import { onPromptsUpdate, addPrompt, updatePrompt, deletePrompt } from './services/firestore-service.js';
import { createPromptCard } from './components/PromptCard.js';
import { openModal } from './components/PromptModal.js';
import { toast } from './utils/toast-service.js';

// (이하 모든 코드는 이전과 동일)

const userProfileContainer = document.getElementById('user-profile');
const promptGrid = document.getElementById('prompt-grid');
const newPromptButton = document.getElementById('new-prompt-btn');

let unsubscribeFromPrompts = null;

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

function renderSkeletonLoader() {
    promptGrid.innerHTML = '';
    for (let i = 0; i < 6; i++) {
        const skeletonCard = document.createElement('div');
        skeletonCard.className = 'skeleton-card';
        skeletonCard.innerHTML = `
            <div class="skeleton skeleton-header"></div>
            <div class="skeleton skeleton-content"></div>
        `;
        promptGrid.appendChild(skeletonCard);
    }
}

function renderPrompts(prompts) {
    promptGrid.innerHTML = '';
    if (prompts.length === 0) {
        promptGrid.innerHTML = `<div class="empty-state">아직 프롬프트가 없습니다. 'New Prompt'를 클릭하여 추가해보세요.</div>`;
        return;
    }
    prompts.sort((a, b) => (b.updatedAt?.toDate() || 0) - (a.updatedAt?.toDate() || 0));
    prompts.forEach(prompt => {
        const card = createPromptCard(prompt);
        promptGrid.appendChild(card);
    });
}

async function handleNewPrompt() {
    const result = await openModal();
    if (result) {
        try {
            await addPrompt({ title: result.title, content: result.content });
            toast.success('프롬프트가 성공적으로 추가되었습니다.');
        } catch (error) {
            toast.error('프롬프트 추가에 실패했습니다.');
        }
    }
}

async function handleGridClick(event) {
    const button = event.target.closest('button');
    if (!button) return;

    const card = button.closest('.prompt-card');
    if (!card) return;
    
    const promptId = card.dataset.id;
    if (!promptId) return;

    if (button.classList.contains('edit-btn')) {
        const title = card.querySelector('h3').textContent;
        const content = card.querySelector('pre code').textContent;
        const result = await openModal({ id: promptId, title, content });
        if (result) {
            try {
                await updatePrompt(promptId, { title: result.title, content: result.content });
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
    }
}

async function initializeApp() {
    console.log("앱 초기화 시작!");
    await handleRedirectResult(); 
    newPromptButton.addEventListener('click', handleNewPrompt);
    promptGrid.addEventListener('click', handleGridClick);
    onAuthStateChangedListener(user => {
        renderUserProfile(user);
        if (user) {
            renderSkeletonLoader();
            if (unsubscribeFromPrompts) {
                 unsubscribeFromPrompts();
            }
            unsubscribeFromPrompts = onPromptsUpdate(renderPrompts);
        } else {
            if (unsubscribeFromPrompts) {
                unsubscribeFromPrompts();
                unsubscribeFromPrompts = null;
            }
            promptGrid.innerHTML = `<div class="empty-state">로그인하여 프롬프트를 관리하세요.</div>`;
        }
    });
}

document.addEventListener('DOMContentLoaded', initializeApp);