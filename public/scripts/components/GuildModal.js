// public/scripts/components/GuildManageModal.js

import { getUserByEmail, updateGuildMembers, deleteGuild } from '../services/firestore-service.js';
import { toast } from '../utils/toast-service.js';

let modalElement = null;
let resolvePromise = null;
let currentGuild = null;

function createModal() {
    if (document.getElementById('guild-manage-modal-overlay')) return;

    const modalHTML = `
        <div class="modal-overlay" id="guild-manage-modal-overlay">
            <div class="modal" id="guild-manage-modal">
                <div class="modal-header">
                    <h3 class="modal-title" id="guild-manage-modal-title">길드 관리</h3>
                    <button class="modal-close-btn" id="guild-manage-close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <h4>멤버 초대</h4>
                    <form id="invite-member-form" class="invite-form">
                        <input type="email" id="invite-email-input" placeholder="사용자 이메일 입력" required>
                        <select id="invite-role-select">
                            <option value="editor">에디터</option>
                            <option value="viewer">뷰어</option>
                        </select>
                        <button type="submit" class="p-btn p-btn-primary">초대</button>
                    </form>
                    <hr>
                    <h4>멤버</h4>
                    <div id="member-list" class="member-list"></div>
                </div>
                <div class="modal-footer">
                    <button class="p-btn p-btn-danger" id="guild-delete-btn">길드 삭제</button>
                    <button class="p-btn" id="guild-manage-done-btn">완료</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    modalElement = document.getElementById('guild-manage-modal-overlay');

    // Event Listeners
    document.getElementById('guild-manage-close-btn').addEventListener('click', () => closeModal(false));
    document.getElementById('guild-manage-done-btn').addEventListener('click', () => closeModal(false));
    document.getElementById('guild-delete-btn').addEventListener('click', handleDeleteGuild);
    modalElement.addEventListener('click', e => {
        if (e.target.id === 'guild-manage-modal-overlay') closeModal(false);
    });

    document.getElementById('invite-member-form').addEventListener('submit', handleInviteMember);
    document.getElementById('member-list').addEventListener('click', handleMemberListClick);
}

function renderMemberList() {
    const memberListContainer = document.getElementById('member-list');
    const members = currentGuild.members || {};
    
    memberListContainer.innerHTML = Object.entries(members).map(([uid, role]) => `
        <div class="member-item" data-uid="${uid}">
            <span class="member-info">${uid.substring(0, 10)}... (${role})</span>
            ${role !== 'owner' ? `
            <div class="member-actions">
                <select class="role-select" data-uid="${uid}">
                    <option value="editor" ${role === 'editor' ? 'selected' : ''}>에디터</option>
                    <option value="viewer" ${role === 'viewer' ? 'selected' : ''}>뷰어</option>
                </select>
                <button class="p-btn p-btn-danger remove-member-btn" data-uid="${uid}">추방</button>
            </div>
            ` : '<span class="owner-tag">소유자</span>'}
        </div>
    `).join('');
}


async function handleInviteMember(event) {
    event.preventDefault();
    const emailInput = document.getElementById('invite-email-input');
    const roleSelect = document.getElementById('invite-role-select');
    const email = emailInput.value.trim();
    const role = roleSelect.value;

    if (!email) return;

    try {
        const userToInvite = await getUserByEmail(email);
        if (!userToInvite) {
            toast.error("해당 이메일을 가진 사용자가 없습니다.");
            return;
        }

        if (currentGuild.memberIds.includes(userToInvite.uid)) {
            toast.error("이미 길드에 소속된 사용자입니다.");
            return;
        }

        const updatedMembers = { ...currentGuild.members, [userToInvite.uid]: role };
        const updatedMemberIds = [...currentGuild.memberIds, userToInvite.uid];

        await updateGuildMembers(currentGuild.id, updatedMembers, updatedMemberIds);
        
        currentGuild.members = updatedMembers;
        currentGuild.memberIds = updatedMemberIds;
        
        renderMemberList();
        emailInput.value = '';
        toast.success("멤버를 성공적으로 초대했습니다!");

    } catch (error) {
        toast.error("멤버 초대에 실패했습니다.");
        console.error(error);
    }
}

async function handleMemberListClick(event) {
    const target = event.target;
    const uid = target.dataset.uid;
    if (!uid) return;

    if (target.classList.contains('remove-member-btn')) {
        if (!confirm("정말로 이 멤버를 추방하시겠습니까?")) return;

        const { [uid]: _, ...updatedMembers } = currentGuild.members;
        const updatedMemberIds = currentGuild.memberIds.filter(id => id !== uid);

        try {
            await updateGuildMembers(currentGuild.id, updatedMembers, updatedMemberIds);
            currentGuild.members = updatedMembers;
            currentGuild.memberIds = updatedMemberIds;
            renderMemberList();
            toast.success("멤버를 추방했습니다.");
        } catch (error) {
            toast.error("멤버 추방에 실패했습니다.");
        }

    } else if (target.classList.contains('role-select')) {
        const newRole = target.value;
        const updatedMembers = { ...currentGuild.members, [uid]: newRole };
        
        try {
            await updateGuildMembers(currentGuild.id, updatedMembers, currentGuild.memberIds);
            currentGuild.members = updatedMembers;
            toast.success("멤버 역할을 업데이트했습니다.");
        } catch (error) {
            toast.error("역할 업데이트에 실패했습니다.");
        }
    }
}

async function handleDeleteGuild() {
    const guildName = currentGuild.name;
    if (prompt(`삭제하려면 길드 이름 "${guildName}"을(를) 정확히 입력하세요:`) !== guildName) {
        toast.error("길드 이름이 일치하지 않아 삭제가 취소되었습니다.");
        return;
    }

    try {
        await deleteGuild(currentGuild.id);
        toast.success(`길드 "${guildName}"가 삭제되었습니다.`);
        closeModal(true); // Indicate that a major change happened
    } catch (error) {
        toast.error("길드 삭제에 실패했습니다.");
        console.error("Error deleting guild:", error);
    }
}

function closeModal(shouldUpdate) {
    if (modalElement) {
        modalElement.classList.remove('active');
    }
    if (resolvePromise) {
        resolvePromise(shouldUpdate);
        resolvePromise = null;
    }
}

export function openGuildManageModal(guild) {
    if (!modalElement) {
        createModal();
    }
    
    currentGuild = JSON.parse(JSON.stringify(guild)); // Deep copy
    document.getElementById('guild-manage-modal-title').textContent = `"${guild.name}" 길드 관리`;
    renderMemberList();

    modalElement.classList.add('active');
    return new Promise((resolve) => {
        resolvePromise = resolve;
    });
}