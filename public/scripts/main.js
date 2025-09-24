import { onAuthStateChangedListener, signInWithGoogle, signOutUser, getCurrentUser } from './auth.js';
import { 
    onPromptsUpdate, addPrompt, updatePrompt, deletePrompt, getPromptVersions, 
    createGuild, onGuildsUpdate, onGuildPromptsUpdate, deleteGuild,
    incrementUseCount, ratePrompt
} from './services/firestore-service.js';
import { createPromptCard } from './components/PromptCard.js';
import { openModal } from './components/PromptModal.js';
import { openVersionHistoryModal } from './components/VersionHistoryModal.js';
import { openGuildModal } from './components/GuildModal.js';
import { openGuildManageModal } from './components/GuildManageModal.js';
import { toast } from './utils/toast-service.js';

// --- DOM 요소 참조 ---
const userProfileContainer = document.getElementById('user-profile');
const promptGrid = document.getElementById('prompt-grid');
const newPromptButton = document.getElementById('new-prompt-btn');
const searchInput = document.getElementById('search-input');
const categoryList = document.getElementById('category-list');
const guildList = document.getElementById('guild-list');
const createGuildButton = document.getElementById('create-guild-btn');
const mainHeaderTitle = document.querySelector('.main-header-title');

// --- 애플리케이션 상태 관리 ---
let allPrompts = [];
let userGuilds = [];
let activeView = { type: 'personal', id: null, name: '내 프롬프트' };
let activeCategory = 'All';
let unsubscribeFromPrompts = null;
let unsubscribeFromGuilds = null;
let currentUser = null;

// --- 유틸리티 함수 ---
function debounce(func, delay) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

// --- UI 렌더링 함수 ---
function renderUserProfile(user) {
    currentUser = user;
    if (user) {
        userProfileContainer.innerHTML = `
            <img src="${user.photoURL}" alt="${user.displayName}" referrerpolicy="no-referrer">
            <p>${user.displayName}</p>
            <button id="sign-out-btn" class="p-btn">로그아웃</button>
        `;
        document.getElementById('sign-out-btn').addEventListener('click', signOutUser);
        newPromptButton.style.display = 'flex';
    } else {
        userProfileContainer.innerHTML = `
            <p>프롬프트를 관리하려면 로그인하세요.</p>
            <button id="sign-in-btn" class="p-btn p-btn-primary">Google 계정으로 로그인</button>
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

    let userRole = 'viewer';
    if (activeView.type === 'guild') {
        const activeGuild = userGuilds.find(g => g.id === activeView.id);
        if (activeGuild && currentUser) {
            userRole = activeGuild.members[currentUser.uid] || 'viewer';
        }
    } else {
        userRole = 'owner';
    }

    promptsToRender.sort((a, b) => (b.updatedAt?.toDate() || 0) - (a.updatedAt?.toDate() || 0));
    promptsToRender.forEach(prompt => {
        const card = createPromptCard(prompt, userRole);
        promptGrid.appendChild(card);
    });
}


function renderCategories() {
    const categories = ['All', ...new Set(allPrompts.map(p => p.category).filter(Boolean))];
    if (categoryList) {
        categoryList.innerHTML = categories.map(category => `
            <button class="category-btn ${category === activeCategory ? 'active' : ''}" data-category="${category}">
                ${category}
            </button>
        `).join('');
    }
}

function renderGuilds() {
    if (guildList) {
        if (userGuilds.length === 0) {
            guildList.innerHTML = `<span class="empty-guild-list">아직 길드가 없습니다.</span>`;
            return;
        }
        guildList.innerHTML = userGuilds.map(guild => {
            const userRole = guild.members[currentUser?.uid];
            const isOwner = userRole === 'owner';
            return `
                <div class="guild-item">
                    <button class="guild-btn ${activeView.type === 'guild' && activeView.id === guild.id ? 'active' : ''}" data-guild-id="${guild.id}" data-guild-name="${guild.name}">
                        ${guild.name}
                    </button>
                    ${isOwner ? `<button class="btn-icon manage-guild-btn" data-guild-id="${guild.id}" title="길드 관리"><i class="fas fa-cog"></i></button>` : ''}
                </div>
            `;
        }).join('');
    }
}

// --- 핵심 로직 ---
function updateActiveView(type, id = null, name = '내 프롬프트') {
    activeView = { type, id, name };
    mainHeaderTitle.textContent = name;
    
    document.querySelectorAll('.guild-btn').forEach(btn => btn.classList.remove('active'));
    
    if (type === 'guild' && id) {
        const guildBtn = document.querySelector(`.guild-btn[data-guild-id="${id}"]`);
        if (guildBtn) guildBtn.classList.add('active');
    } else {
        const allCategoryBtn = document.querySelector('.category-btn[data-category="All"]');
        if (allCategoryBtn) allCategoryBtn.classList.add('active');
    }
    
    activeCategory = 'All'; 
    if (unsubscribeFromPrompts) unsubscribeFromPrompts();

    const dataUpdateCallback = (prompts) => {
        allPrompts = prompts || [];
        renderCategories();
        filterAndRenderPrompts();
    };

    if (type === 'personal') {
        unsubscribeFromPrompts = onPromptsUpdate(dataUpdateCallback);
    } else if (type === 'guild' && id) {
        unsubscribeFromPrompts = onGuildPromptsUpdate(id, dataUpdateCallback);
    }
}


function filterAndRenderPrompts() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    let filteredPrompts = allPrompts;

    if (activeCategory !== 'All') {
        filteredPrompts = filteredPrompts.filter(p => p.category === activeCategory);
    }

    if (searchTerm) {
        filteredPrompts = filteredPrompts.filter(p =>
            (p.title && p.title.toLowerCase().includes(searchTerm)) ||
            (p.content && p.content.toLowerCase().includes(searchTerm))
        );
    }
    renderPrompts(filteredPrompts);
}

// --- 이벤트 핸들러 ---
async function handleNewPrompt() {
    const result = await openModal();
    if (result) {
        try {
            const guildId = activeView.type === 'guild' ? activeView.id : null;
            await addPrompt({ title: result.title, content: result.content, category: result.category }, guildId);
            toast.success('프롬프트가 성공적으로 추가되었습니다.');
        } catch (error) {
            toast.error('프롬프트 추가에 실패했습니다.');
            console.error(error);
        }
    }
}

async function handleGridClick(event) {
    const target = event.target;
    const card = target.closest('.prompt-card');
    if (!card) return;

    const promptId = card.dataset.id;
    const guildId = activeView.type === 'guild' ? activeView.id : null;

    // Handle Rating Stars
    if (target.classList.contains('rating-star')) {
        const rating = parseInt(target.dataset.rating, 10);
        try {
            await ratePrompt(promptId, rating, guildId);
            toast.success('평점이 등록되었습니다.');
        } catch (error) {
            toast.error('평점 등록에 실패했습니다.');
            console.error(error);
        }
        return;
    }

    const button = target.closest('.btn-icon');
    if (!button) return;

    const promptData = allPrompts.find(p => p.id === promptId);

    if (button.classList.contains('edit-btn')) {
        const result = await openModal(promptData);
        if (result) {
            try {
                await updatePrompt(promptId, { title: result.title, content: result.content, category: result.category }, guildId);
                toast.success('프롬프트가 성공적으로 수정되었습니다.');
            } catch (error) {
                toast.error('프롬프트 수정에 실패했습니다.');
            }
        }
    } else if (button.classList.contains('delete-btn')) {
        if (confirm('정말로 이 프롬프트를 삭제하시겠습니까?')) {
            try {
                await deletePrompt(promptId, guildId);
                toast.success('프롬프트가 삭제되었습니다.');
            } catch (error) {
                toast.error('프롬프트 삭제에 실패했습니다.');
            }
        }
    } else if (button.classList.contains('copy-btn')) {
        const contentToCopy = card.querySelector('pre code').textContent;
        navigator.clipboard.writeText(contentToCopy)
            .then(async () => {
                await incrementUseCount(promptId, guildId);
                toast.success('프롬프트가 클립보드에 복사되었습니다.');
            })
            .catch(err => toast.error('복사에 실패했습니다.'));
    } else if (button.classList.contains('history-btn')) {
        if (guildId) {
            toast.error('길드 프롬프트의 버전 기록은 아직 지원되지 않습니다.');
            return;
        }
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
    
    if (activeView.type === 'guild' && button.dataset.category === 'All') {
        switchToPersonalView();
    } else {
        activeCategory = button.dataset.category;
        document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        filterAndRenderPrompts();
    }
}

async function handleCreateGuild() {
    const guildName = await openGuildModal();
    if (guildName) {
        try {
            await createGuild(guildName);
            toast.success(`길드 "${guildName}"가 성공적으로 생성되었습니다!`);
        } catch (error) {
            toast.error('길드 생성에 실패했습니다.');
            console.error(error);
        }
    }
}

async function handleGuildListClick(event) {
    const button = event.target.closest('button');
    if (!button) return;

    const guildId = button.dataset.guildId;

    if (button.classList.contains('manage-guild-btn')) {
        const guild = userGuilds.find(g => g.id === guildId);
        if (guild) {
            const guildDeleted = await openGuildManageModal(guild);
            if (guildDeleted) {
                switchToPersonalView();
            }
        }
    } else if (button.classList.contains('guild-btn')) {
        const guildName = button.dataset.guildName;
        updateActiveView('guild', guildId, guildName);
    }
}

function switchToPersonalView() {
    updateActiveView('personal', null, '내 프롬프트');
}

// --- 애플리케이션 초기화 ---
function initializeApp() {
    const debouncedFilter = debounce(filterAndRenderPrompts, 300);

    newPromptButton.addEventListener('click', handleNewPrompt);
    promptGrid.addEventListener('click', handleGridClick);
    searchInput.addEventListener('input', debouncedFilter);
    categoryList.addEventListener('click', handleCategoryClick);
    createGuildButton.addEventListener('click', handleCreateGuild);
    guildList.addEventListener('click', handleGuildListClick);
    mainHeaderTitle.addEventListener('click', switchToPersonalView);

    onAuthStateChangedListener(user => {
        renderUserProfile(user);
        
        if (unsubscribeFromPrompts) unsubscribeFromPrompts();
        if (unsubscribeFromGuilds) unsubscribeFromGuilds();

        if (user) {
            updateActiveView('personal', null, '내 프롬프트');
            unsubscribeFromGuilds = onGuildsUpdate((guilds) => {
                userGuilds = guilds || [];
                renderGuilds();
            });
        } else {
            allPrompts = [];
            userGuilds = [];
            activeCategory = 'All';
            searchInput.value = '';
            renderCategories();
            renderGuilds();
            promptGrid.innerHTML = `<div class="empty-state">로그인하여 프롬프트를 관리하세요.</div>`;
        }
    });
}

document.addEventListener('DOMContentLoaded', initializeApp);