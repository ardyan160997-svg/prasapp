const API = window.PRASCELL_API || 'http://localhost:3010';
const sessionId = localStorage.getItem('prascell_session') || crypto.randomUUID();
localStorage.setItem('prascell_session', sessionId);

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, { headers: { 'content-type': 'application/json', ...(options.headers || {}) }, ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) throw new Error(data.error || 'Request gagal.');
  return data;
}

function addBubble(list, message, sender) {
  const bubble = document.createElement('p');
  bubble.className = `bubble ${sender}`;
  bubble.textContent = message;
  list.append(bubble);
  list.scrollTop = list.scrollHeight;
}

const form = document.getElementById('chat-form');
const input = document.getElementById('chat-input');
const submit = form.querySelector('button[type="submit"]');

function resizeInput() {
  input.style.height = 'auto';
  input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
}

input.addEventListener('input', resizeInput);
input.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const message = input.value.trim();
  if (!message || submit.disabled) return;
  const list = document.getElementById('chat-messages');
  addBubble(list, message, 'me');
  input.value = '';
  resizeInput();
  submit.disabled = true;
  try {
    await api('/api/public/chat', { method: 'POST', body: JSON.stringify({ sessionId, message }) });
  } catch {
    addBubble(list, 'Pesan belum terkirim. Coba lagi nanti.', 'admin');
  } finally {
    submit.disabled = false;
    input.focus();
  }
});
