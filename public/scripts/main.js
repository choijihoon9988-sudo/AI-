// public/scripts/main.js

import { signInWithGoogle, signOutUser, onAuthStateChangedListener } from './auth.js';
// firestore-service와 상호작용할 UI 로직을 여기에 추가할 예정
// 예: import { onPromptsUpdate } from './firestore-service.js';

// DOM 요소 가져오기
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userProfile = document.getElementById('user-profile');
const userName = document.getElementById('user-name');
const userPhoto = document.getElementById('user-photo');

// 로그인 버튼 이벤트 리스너
loginBtn.addEventListener('click', signInWithGoogle);

// 로그아웃 버튼 이벤트 리스너
logoutBtn.addEventListener('click', signOutUser);

// 인증 상태 변경 감지 및 UI 업데이트
onAuthStateChangedListener((user) => {
    if (user) {
        // 사용자가 로그인한 경우
        loginBtn.classList.add('hidden');
        userProfile.classList.remove('hidden');
        userName.textContent = user.displayName;
        userPhoto.src = user.photoURL;

        // 여기에 로그인 후 프롬프트를 불러오는 로직을 추가할 수 있음
        // 예: onPromptsUpdate(renderPrompts);

    } else {
        // 사용자가 로그아웃한 경우
        loginBtn.classList.remove('hidden');
        userProfile.classList.add('hidden');
        userName.textContent = '';
        userPhoto.src = '';
        
        // 여기에 로그아웃 후 화면을 정리하는 로직을 추가할 수 있음
        // 예: clearPrompts();
    }
});