// BordroApp messages are public and shared between all app installations.
// The Pages Functions API stores and serves them using the existing BORDRO_CONTENT KV binding.
async function loadPublicMessages() {
    const list = document.getElementById('message-list');
    if (!list) return;
    try {
        const response = await fetch('https://bordro.pages.dev/api/messages', { cache: 'no-store' });
        if (!response.ok) throw new Error('Mesajlar alınamadı.');
        const data = await response.json();
        renderPublicMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch (error) {
        console.warn('Ortak mesajlar yüklenemedi:', error);
        list.innerHTML = '<p class="no-messages">Mesajlar şu anda alınamıyor. Bağlantınızı kontrol edip yeniden deneyin.</p>';
    }
}

function renderPublicMessages(messages) {
    const list = document.getElementById('message-list');
    if (!list) return;
    list.replaceChildren();
    if (!messages.length) {
        const empty = document.createElement('p');
        empty.className = 'no-messages';
        empty.textContent = 'Henüz mesaj yok.';
        list.appendChild(empty);
        return;
    }
    messages.forEach(message => {
        const item = document.createElement('div');
        item.className = 'single-message-node';
        const label = document.createElement('strong');
        label.textContent = `${message.name || 'Ziyaretçi'} · `;
        const text = document.createElement('span');
        text.textContent = message.text || '';
        const date = document.createElement('small');
        date.textContent = message.createdAt ? ` · ${new Date(message.createdAt).toLocaleString('tr-TR')}` : '';
        item.append(label, text, date);
        list.appendChild(item);
    });
    list.scrollTop = list.scrollHeight;
}

async function sendMessageLocally() {
    const input = document.getElementById('chat-textarea');
    const button = document.querySelector('#tab-messages button[onclick="sendMessageLocally()"]');
    const text = input?.value.trim();
    if (!text) return;
    if (text.length > 500) {
        alert('Mesaj en fazla 500 karakter olabilir.');
        return;
    }
    if (button) button.disabled = true;
    try {
        const response = await fetch('https://bordro.pages.dev/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Mesaj gönderilemedi.');
        input.value = '';
        await loadPublicMessages();
    } catch (error) {
        alert(error.message || 'Mesaj gönderilemedi. İnternet bağlantınızı kontrol edin.');
    } finally {
        if (button) button.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadPublicMessages();
    const tabButtons = document.querySelectorAll('.nav-item');
    tabButtons.forEach(button => button.addEventListener('click', () => {
        if (button.getAttribute('onclick')?.includes("'messages'")) loadPublicMessages();
    }));
});
