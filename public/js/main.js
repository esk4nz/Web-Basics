/* global io */
const socket = io();

let mySocketId = null;

// 1. Отримуємо власний socket.id (встановлюється ДО joinRoom бажано)
socket.on('session', ({ socketId }) => {
  mySocketId = socketId;
});

// ---- Query Params ----
const { username, room } = getQueryParams();

// ---- DOM ----
const roomNameEl = document.getElementById('room-name');
const usernameCurrentEl = document.getElementById('username-current');
const usersListEl = document.getElementById('users');
const usersCountEl = document.getElementById('users-count');
const messagesEl = document.getElementById('messages');
const messageForm = document.getElementById('message-form');
const msgInput = document.getElementById('msg');
const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const leaveBtn = document.getElementById('leave-btn');

roomNameEl.textContent = room;
usernameCurrentEl.textContent = username;

// ---- Theme ----
initTheme();
themeToggleBtn.addEventListener('click', toggleTheme);

// ---- Leave ----
leaveBtn.addEventListener('click', () => {
  window.location.href = 'index.html';
});

// ---- Join room ----
socket.emit('joinRoom', { username, room });

// ---- Room users ----
socket.on('roomUsers', ({ room, users }) => {
  roomNameEl.textContent = room;
  renderUsers(users);
});

// ---- Incoming messages ----
socket.on('message', (message) => {
  outputMessage(message);
  scrollMessagesToBottom();
});

// ---- Send message ----
messageForm.addEventListener('submit', e => {
  e.preventDefault();
  const text = msgInput.value.trim();
  if (!text) return;
  socket.emit('chatMessage', text);
  msgInput.value = '';
  msgInput.focus();
});

// ================== RENDER ==================

function renderUsers(users) {
  usersListEl.innerHTML = users.map(u => {
    const grad = generateAvatarGradient(u.username, u.id); // різні навіть при однакових username
    const initials = escapeHtml(u.username.slice(0,2).toUpperCase());
    return `
      <li>
        <span class="user-avatar" style="background:${grad}">${initials}</span>
        <span class="user-name">${escapeHtml(u.username)}</span>
      </li>
    `;
  }).join('');
  usersCountEl.textContent = users.length;
}

function outputMessage({ senderId, username: sender, text, time }) {
  const isAdmin = senderId === 'admin' || sender === 'Admin';
  const isSelf = senderId && mySocketId && senderId === mySocketId;

  const wrapper = document.createElement('div');
  wrapper.classList.add('msg');
  if (isSelf) wrapper.classList.add('msg--self');
  if (isAdmin) wrapper.classList.add('msg--admin');

  if (!isAdmin) {
    const avatar = document.createElement('div');
    avatar.className = 'msg-avatar';
    avatar.style.background = generateAvatarGradient(sender, senderId);
    avatar.textContent = sender.slice(0,2).toUpperCase();
    wrapper.appendChild(avatar);
  }

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';

  if (!isAdmin) {
    const meta = document.createElement('div');
    meta.className = 'msg-meta';
    meta.innerHTML = `
      <span class="m-user">${escapeHtml(sender)}</span>
      <span class="m-time">${time}</span>
    `;
    bubble.appendChild(meta);
  }

  const body = document.createElement('div');
  body.className = 'msg-text';
  body.textContent = text;
  bubble.appendChild(body);

  wrapper.appendChild(bubble);
  messagesEl.appendChild(wrapper);
}

// ================== HELPERS ==================

function scrollMessagesToBottom() {
  requestAnimationFrame(() => {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  });
}

function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    username: params.get('username') || 'Anon',
    room: params.get('room') || 'default'
  };
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

// Унікальний градієнт: username + (socketId або userId)
function generateAvatarGradient(name, uniqueId) {
  let h = 0;
  const seed = name + (uniqueId || '');
  for (let i=0;i<seed.length;i++) {
    h = seed.charCodeAt(i) + ((h<<5) - h);
  }
  const h1 = ((h % 360) + 360) % 360;
  const h2 = (h1 + 50) % 360;
  return `linear-gradient(135deg,hsl(${h1} 55% 55%),hsl(${h2} 55% 48%))`;
}

/* Theme */
function initTheme() {
  const saved = localStorage.getItem('chat-theme');
  const root = document.documentElement;
  if (saved === 'dark') {
    root.setAttribute('data-theme','dark');
    themeIcon.textContent = '☀️';
  } else {
    root.setAttribute('data-theme','light');
    themeIcon.textContent = '🌙';
  }
}

function toggleTheme() {
  const root = document.documentElement;
  const current = root.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  localStorage.setItem('chat-theme', next);
  themeIcon.textContent = next === 'dark' ? '🌙' : '☀️';
}