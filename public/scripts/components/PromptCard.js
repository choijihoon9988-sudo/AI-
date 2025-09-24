function escapeHTML(str) {
    const p = document.createElement('p');
    p.textContent = str;
    return p.innerHTML;
}

export function createPromptCard(prompt) {
    const card = document.createElement('div');
    card.className = 'prompt-card';
    card.dataset.id = prompt.id;

    card.innerHTML = `
        <div class="prompt-card-header">
            <h3>${escapeHTML(prompt.title)}</h3>
            <div class="prompt-card-actions">
                <button class="edit-btn" title="Edit Prompt">
                    <i class="fas fa-pencil-alt"></i>
                </button>
                <button class="delete-btn" title="Delete Prompt">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
        <div class="prompt-card-content">
            <pre><code>${escapeHTML(prompt.content)}</code></pre>
        </div>
    `;

    return card;
}