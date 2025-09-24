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
                    <h3 class="modal-title" id="guild-manage-modal-title">Manage Guild</h3>
                    <button class="modal-close-btn" id="guild-manage-close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <h4>Invite Member</h4>
                    <form id="invite-member-form" class="invite-form">
                        <input type="email" id="invite-email-input" placeholder="Enter user's email" required>
                        <select id="invite-role-select">
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                        </select>
                        <button type="submit" class="p-btn p-btn-primary">Invite</button>
                    </form>
                    <hr>
                    <h4>Members</h4>
                    <div id="member-list" class="member-list"></div>
                </div>
                <div class="modal-footer">
                    <button class="p-btn p-btn-danger" id="guild-delete-btn">Delete Guild</button>
                    <button class="p-btn" id="guild-manage-done-btn">Done</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    modalElement = document.getElementById('guild-manage-modal-overlay');

    // Event Listeners
    document.getElementById('guild-manage-close-btn').addEventListener('click', () => closeModal(false));
    document.getElementById('guild-manage-done-btn').addEventListener('click', () => closeModal(true));
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
                    <option value="editor" ${role === 'editor' ? 'selected' : ''}>Editor</option>
                    <option value="viewer" ${role === 'viewer' ? 'selected' : ''}>Viewer</option>
                </select>
                <button class="p-btn p-btn-danger remove-member-btn" data-uid="${uid}">Remove</button>
            </div>
            ` : '<span class="owner-tag">Owner</span>'}
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
            toast.error("User with that email does not exist.");
            return;
        }

        if (currentGuild.memberIds.includes(userToInvite.uid)) {
            toast.error("User is already a member of this guild.");
            return;
        }

        const updatedMembers = { ...currentGuild.members, [userToInvite.uid]: role };
        const updatedMemberIds = [...currentGuild.memberIds, userToInvite.uid];

        await updateGuildMembers(currentGuild.id, updatedMembers, updatedMemberIds);
        
        currentGuild.members = updatedMembers;
        currentGuild.memberIds = updatedMemberIds;
        
        renderMemberList();
        emailInput.value = '';
        toast.success("Member invited successfully!");

    } catch (error) {
        toast.error("Failed to invite member.");
        console.error(error);
    }
}

async function handleMemberListClick(event) {
    const target = event.target;
    const uid = target.dataset.uid;
    if (!uid) return;

    if (target.classList.contains('remove-member-btn')) {
        if (!confirm("Are you sure you want to remove this member?")) return;

        const { [uid]: _, ...updatedMembers } = currentGuild.members;
        const updatedMemberIds = currentGuild.memberIds.filter(id => id !== uid);

        try {
            await updateGuildMembers(currentGuild.id, updatedMembers, updatedMemberIds);
            currentGuild.members = updatedMembers;
            currentGuild.memberIds = updatedMemberIds;
            renderMemberList();
            toast.success("Member removed.");
        } catch (error) {
            toast.error("Failed to remove member.");
        }

    } else if (target.classList.contains('role-select')) {
        const newRole = target.value;
        const updatedMembers = { ...currentGuild.members, [uid]: newRole };
        
        try {
            await updateGuildMembers(currentGuild.id, updatedMembers, currentGuild.memberIds);
            currentGuild.members = updatedMembers;
            toast.success("Member role updated.");
        } catch (error) {
            toast.error("Failed to update role.");
        }
    }
}

async function handleDeleteGuild() {
    const guildName = currentGuild.name;
    if (prompt(`To confirm, please type the name of the guild to delete: "${guildName}"`) !== guildName) {
        toast.error("Guild name did not match. Deletion cancelled.");
        return;
    }

    try {
        await deleteGuild(currentGuild.id);
        toast.success(`Guild "${guildName}" has been deleted.`);
        closeModal(true);
    } catch (error) {
        toast.error("Failed to delete guild.");
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
    
    currentGuild = JSON.parse(JSON.stringify(guild)); // Deep copy to avoid mutation issues
    document.getElementById('guild-manage-modal-title').textContent = `Manage "${guild.name}"`;
    renderMemberList();

    modalElement.classList.add('active');
    return new Promise((resolve) => {
        resolvePromise = resolve;
    });
}