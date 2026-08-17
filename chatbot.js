/**
 * VeloMotion - Widget Valentina AI
 */
const chatbotWebhookUrl = 'https://n8n.rmstudio.app/webhook/velomotion-chatbot';
let isChatOpen = false;
let chatSessionId = sessionStorage.getItem('velomotion_chat_session') || ('session_' + Math.random().toString(36).substring(2, 9));
sessionStorage.setItem('velomotion_chat_session', chatSessionId);

function toggleChatWindow() {
  const chatWin = document.getElementById('chat-window');
  isChatOpen = !isChatOpen;
  if (isChatOpen) {
    chatWin.classList.remove('hidden');
    setTimeout(() => chatWin.classList.replace('scale-95', 'scale-100'), 50);
  } else {
    chatWin.classList.replace('scale-100', 'scale-95');
    setTimeout(() => chatWin.classList.add('hidden'), 200);
  }
}

function handleChatKey(e) {
  if (e.key === 'Enter') sendChatMessage();
}

async function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const message = input.value.trim();
  if (!message) return;

  input.value = '';
  appendMessage('user', message);
  appendTypingIndicator();

  try {
    const res = await fetch(chatbotWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: message, sessionId: chatSessionId })
    });
    const data = await res.json();
    removeTypingIndicator();
    if (data && data.success && data.response) {
      appendMessage('ai', data.response);
    } else {
      appendMessage('ai', "Scusami, ho riscontrato una temporanea anomalia. Puoi riprovare.");
    }
  } catch (err) {
    removeTypingIndicator();
    appendMessage('ai', "Errore di rete temporaneo.");
  }
}

function appendMessage(sender, text) {
  const container = document.getElementById('chat-messages');
  const msgDiv = document.createElement('div');
  msgDiv.className = "flex items-start space-x-2.5";
  
  if (sender === 'user') {
    msgDiv.className += " justify-end";
    msgDiv.innerHTML = `<div class="bg-cyan-500/10 border border-cyan-500/20 text-cyan-200 rounded-2xl rounded-tr-none p-3 max-w-[85%] leading-relaxed">${text}</div>`;
  } else {
    msgDiv.innerHTML = `<img src="/icon.png" class="w-6 h-6 rounded-md mt-1"><div class="bg-slate-900 border border-gray-800 text-gray-200 rounded-2xl rounded-tl-none p-3 max-w-[85%] leading-relaxed">${text}</div>`;
  }
  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;
}

function appendTypingIndicator() {
  const container = document.getElementById('chat-messages');
  const indicator = document.createElement('div');
  indicator.id = 'typing-indicator';
  indicator.className = "flex items-start space-x-2.5";
  indicator.innerHTML = `
    <img src="/icon.png" class="w-6 h-6 rounded-md mt-1">
    <div class="bg-slate-900 border border-gray-800 text-gray-400 rounded-2xl rounded-tl-none p-3 flex space-x-1 items-center">
      <span class="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></span>
      <span class="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></span>
      <span class="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.3s"></span>
    </div>
  `;
  container.appendChild(indicator);
  container.scrollTop = container.scrollHeight;
}

function removeTypingIndicator() {
  document.getElementById('typing-indicator')?.remove();
}
