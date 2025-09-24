// 모든 부품(모듈)들을 정확한 경로에서 불러와.
import { onAuthStateChangedListener, signInWithGoogle, signOutUser, handleRedirectResult } from './auth.js';
import { onPromptsUpdate, addPrompt, updatePrompt, deletePrompt } from './services/firestore-service.js';
import { createPromptCard } from './components/PromptCard.js';
import { openModal } from './components/PromptModal.js';
import { toast } from './utils/toast-service.js';

// HTML에서 자주 사용할 요소들을 미리 찾아놔.
const userProfileContainer = document.getElementById('user-profile');
const promptGrid = document.getElementById('prompt-grid');
const newPromptButton = document.getElementById('new-prompt-btn');

let unsubscribeFromPrompts = null; // 실시간 데이터 감시를 멈추는 스위치 역할

// --- UI를 화면에 그리는 함수들 ---

/**
 * 사용자 프로필 UI를 업데이트해. (로그인/로그아웃 상태에 따라)
 */
function renderUserProfile(user) {
    if (user) { // 로그인한 경우
        userProfileContainer.innerHTML = `
            <img src="${user.photoURL}" alt="${user.displayName}" referrerpolicy="no-referrer">
            <p>${user.displayName}</p>
            <button id="sign-out-btn" class="p-btn">Sign Out</button>
        `;
        document.getElementById('sign-out-btn').addEventListener('click', signOutUser);
        newPromptButton.style.display = 'flex';
    } else { // 로그아웃한 경우
        userProfileContainer.innerHTML = `
            <p>Please sign in to manage your prompts.</p>
            <button id="sign-in-btn" class="p-btn p-btn-primary">Sign in with Google</button>
        `;
        document.getElementById('sign-in-btn').addEventListener('click', signInWithGoogle);
        newPromptButton.style.display = 'none';
    }
}

/**
 * 데이터 로딩 중에 보여줄 회색 뼈대(스켈레톤) UI를 그려.
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
 * 프롬프트 목록을 화면에 그려.
 */
function renderPrompts(prompts) {
    promptGrid.innerHTML = ''; // 일단 화면을 깨끗하게 비우고 시작
    if (prompts.length === 0) { // 프롬프트가 하나도 없으면
        promptGrid.innerHTML = `<div class="empty-state">아직 프롬프트가 없습니다. 'New Prompt'를 클릭하여 추가해보세요.</div>`;
        return;
    }

    // 최신 수정 순으로 정렬
    prompts.sort((a, b) => (b.updatedAt?.toDate() || 0) - (a.updatedAt?.toDate() || 0));
    prompts.forEach(prompt => {
        const card = createPromptCard(prompt); // PromptCard.js를 사용해서 카드 하나를 만들고
        promptGrid.appendChild(card); // 화면에 추가해.
    });
}

// --- 버튼 클릭 같은 이벤트를 처리하는 함수들 ---

/**
 * 'New Prompt' 버튼을 눌렀을 때 실행돼.
 */
async function handleNewPrompt() {
    const result = await openModal(); // PromptModal.js를 사용해서 팝업창을 열고 입력을 기다려.
    if (result) { // 사용자가 'Save'를 누르면
        try {
            await addPrompt({ title: result.title, content: result.content }); // 데이터베이스에 저장
            toast.success('프롬프트가 성공적으로 추가되었습니다.'); // 알림창 띄우기
        } catch (error) {
            toast.error('프롬프트 추가에 실패했습니다.');
        }
    }
}

/**
 * 프롬프트 카드 안의 수정/삭제 버튼을 눌렀을 때 실행돼.
 */
async function handleGridClick(event) {
    const button = event.target.closest('button');
    if (!button) return;

    const card = button.closest('.prompt-card');
    if (!card) return;
    
    const promptId = card.dataset.id;
    if (!promptId) return;

    if (button.classList.contains('edit-btn')) { // 수정 버튼을 눌렀을 때
        const title = card.querySelector('h3').textContent;
        const content = card.querySelector('pre code').textContent;
        const result = await openModal({ id: promptId, title, content }); // 기존 내용을 채워서 팝업창 열기
        if (result) {
            try {
                await updatePrompt(promptId, { title: result.title, content: result.content }); // 데이터베이스 수정
                toast.success('프롬프트가 성공적으로 수정되었습니다.');
            } catch (error) {
                toast.error('프롬프트 수정에 실패했습니다.');
            }
        }
    } else if (button.classList.contains('delete-btn')) { // 삭제 버튼을 눌렀을 때
        if (confirm('정말로 이 프롬프트를 삭제하시겠습니까?')) { // 사용자에게 한 번 더 물어봐
            try {
                await deletePrompt(promptId); // 데이터베이스에서 삭제
                toast.success('프롬프트가 삭제되었습니다.');
            } catch (error) {
                toast.error('프롬프트 삭제에 실패했습니다.');
            }
        }
    }
}


// --- 앱이 처음 시작될 때 실행되는 초기화 함수 ---

async function initializeApp() {
    console.log("앱 초기화 시작!");

    // 페이지 이동 방식 로그인 결과를 가장 먼저 처리해.
    await handleRedirectResult(); 
    
    // 모든 버튼에 클릭 기능을 연결해.
    newPromptButton.addEventListener('click', handleNewPrompt);
    promptGrid.addEventListener('click', handleGridClick);

    // 로그인 상태가 바뀌는지 감시를 시작해.
    onAuthStateChangedListener(user => {
        renderUserProfile(user); // 로그인 상태에 맞게 프로필 UI를 그려.
        if (user) { // 로그인했다면
            renderSkeletonLoader(); // 일단 뼈대 UI를 보여주고
            if (unsubscribeFromPrompts) {
                 unsubscribeFromPrompts(); // 기존 감시가 있었다면 꺼줘.
            }
            // 내 프롬프트 목록을 실시간으로 감시 시작!
            unsubscribeFromPrompts = onPromptsUpdate(renderPrompts);
        } else { // 로그아웃했다면
            if (unsubscribeFromPrompts) {
                unsubscribeFromPrompts(); // 감시를 꺼.
                unsubscribeFromPrompts = null;
            }
            promptGrid.innerHTML = `<div class="empty-state">로그인하여 프롬프트를 관리하세요.</div>`;
        }
    });
}

// HTML 문서가 준비되면 앱 초기화를 실행!
document.addEventListener('DOMContentLoaded', initializeApp);