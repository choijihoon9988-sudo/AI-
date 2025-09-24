// src/js/main.js (최종 버전)

import { onAuthStateChangedListener, signInWithGoogle, signOutUser, handleRedirectResult } from './auth.js';
import { onPromptsUpdate, addPrompt, updatePrompt, deletePrompt } from './firestore-service.js';
import { createPromptCard } from './components/PromptCard.js';
import { openModal } from './components/PromptModal.js';
import { toast } from './utils/toast-service.js';

// DOM 요소 참조
const userProfileContainer = document.getElementById('user-profile');
const promptGrid = document.getElementById('prompt-grid');
const newPromptButton = document.getElementById('new-prompt-btn');

let unsubscribeFromPrompts = null; // 프롬프트 리스너 해제 함수

// --- UI 렌더링 함수 ---

/**
 * 사용자 프로필 UI를 업데이트합니다.
 * @param {object|null} user - Firebase 사용자 객체
 */
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

/**
 * 스켈레톤 로더를 렌더링합니다.
 */
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

/**
 * 프롬프트 목록을 렌더링합니다.
 * @param {Array} prompts - 프롬프트 객체 배열
 */
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

// --- 이벤트 핸들러 ---

/**
 * 새 프롬프트 추가 버튼 클릭 핸들러
 */
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

/**
 * 프롬프트 그리드 내 클릭 이벤트 위임 핸들러 (수정/삭제)
 * @param {Event} event
 */
async function handleGridClick(event) {
    const button = event.target.closest('button');
    if (!button) return;

    const card = button.closest('.prompt-card');
    if (!card) return; // 카드가 없는 경우(예: 그리드 배경 클릭) 무시
    
    const promptId = card.dataset.id;
    if (!promptId) return;


    if (button.classList.contains('edit-btn')) {
        // 수정 로직
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
        // 삭제 로직
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


// --- 애플리케이션 초기화 ---

async function initializeApp() { // async 키워드 추가
    console.log("App Initialized");

    // 리디렉션 결과 처리 (페이지 로드 시 가장 먼저)
    await handleRedirectResult(); 
    
    // 이벤트 리스너 설정
    newPromptButton.addEventListener('click', handleNewPrompt);
    promptGrid.addEventListener('click', handleGridClick);

    // 인증 상태 리스너 설정
    onAuthStateChangedListener(user => {
        renderUserProfile(user);
        if (user) {
            // 사용자가 로그인한 경우
            renderSkeletonLoader();
            // 기존 리스너가 있다면 해제
            if (unsubscribeFromPrompts) {
                 unsubscribeFromPrompts();
            }
            // 새로운 사용자에 대한 프롬프트 리스너 설정
            unsubscribeFromPrompts = onPromptsUpdate(renderPrompts);
        } else {
            // 사용자가 로그아웃한 경우
            // 리스너 해제
            if (unsubscribeFromPrompts) {
                unsubscribeFromPrompts();
                unsubscribeFromPrompts = null;
            }
            // 그리드 비우기
            promptGrid.innerHTML = `<div class="empty-state">로그인하여 프롬프트를 관리하세요.</div>`;
        }
    });
}

// DOM 콘텐츠가 로드되면 앱 초기화 실행
document.addEventListener('DOMContentLoaded', initializeApp);