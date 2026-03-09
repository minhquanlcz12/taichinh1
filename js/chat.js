// js/chat.js - Module Chat Chung Toàn cục

const ChatModule = {
    messages: [],
    unsubscribe: null,
    isOpen: false,
    unreadCount: 0,

    init: () => {
        ChatModule.renderUI();
    },

    startListening: () => {
        if (typeof Auth === 'undefined' || !Auth.currentUser) return;

        // Listen to "chat" collection ordered by timestamp
        const chatRef = db.collection('chat').orderBy('timestamp', 'asc').limit(50);

        ChatModule.unsubscribe = chatRef.onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    const msg = change.doc.data();
                    // Prevent duplicate if we already have it locally
                    ChatModule.messages.push(msg);
                    ChatModule.appendMessage(msg);

                    if (!ChatModule.isOpen && msg.sender !== Auth.currentUser.username) {
                        ChatModule.unreadCount++;
                        ChatModule.updateBadge();
                        Utils.showToast(`Tin nhắn mới từ ${msg.sender}`, 'info');
                    }
                }
            });
            setTimeout(ChatModule.scrollToBottom, 100);
        });
    },

    stopListening: () => {
        if (ChatModule.unsubscribe) {
            ChatModule.unsubscribe();
            ChatModule.unsubscribe = null;
        }
        ChatModule.messages = [];
        const body = document.getElementById('chat-body');
        if (body) body.innerHTML = '';
        ChatModule.unreadCount = 0;
        ChatModule.updateBadge();
        ChatModule.isOpen = false;
        const chatWindow = document.getElementById('chat-window');
        if (chatWindow) chatWindow.classList.remove('active');
    },

    renderUI: () => {
        const html = `
            <!-- Chat Bubble -->
            <div id="chat-fab" class="chat-fab" onclick="ChatModule.toggleChat()">
                <i class="fa-solid fa-comments"></i>
                <span id="chat-badge" class="chat-badge" style="display:none;">0</span>
            </div>

            <!-- Chat Window -->
            <div id="chat-window" class="chat-window glass-card">
                <div class="chat-header">
                    <h4 style="margin:0; font-size:16px;"><i class="fa-solid fa-users"></i> Khung Chat Nhóm</h4>
                    <button class="btn-text" onclick="ChatModule.toggleChat()" style="color:var(--text-secondary);"><i class="fa-solid fa-times"></i></button>
                </div>
                <div id="chat-body" class="chat-body">
                    <p class="chat-placeholder" style="text-align:center; color: var(--text-secondary); font-size:13px; margin-top:20px;">
                        Không gian trò chuyện trực tiếp
                    </p>
                </div>
                <div class="chat-footer">
                    <form id="chat-form" onsubmit="ChatModule.sendMessage(event)" style="display:flex; gap:8px;">
                        <input type="text" id="chat-input" class="form-control" placeholder="Viết tin nhắn..." autocomplete="off" required style="flex:1; border-radius:20px;">
                        <button type="submit" class="btn btn-primary" style="border-radius:50%; width:40px; height:40px; outline:none; padding:0; display:flex; align-items:center; justify-content:center;">
                            <i class="fa-solid fa-paper-plane" style="margin-right:-2px;"></i>
                        </button>
                    </form>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
    },

    toggleChat: () => {
        const chatWindow = document.getElementById('chat-window');
        ChatModule.isOpen = !ChatModule.isOpen;
        if (ChatModule.isOpen) {
            chatWindow.classList.add('active');
            ChatModule.unreadCount = 0;
            ChatModule.updateBadge();
            ChatModule.scrollToBottom();
            document.getElementById('chat-input').focus();
        } else {
            chatWindow.classList.remove('active');
        }
    },

    updateBadge: () => {
        const badge = document.getElementById('chat-badge');
        if (!badge) return;
        if (ChatModule.unreadCount > 0) {
            badge.textContent = ChatModule.unreadCount > 9 ? '9+' : ChatModule.unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    },

    appendMessage: (msg) => {
        const body = document.getElementById('chat-body');
        if (!body) return;

        const placeholder = body.querySelector('.chat-placeholder');
        if (placeholder) placeholder.remove();

        const isMe = Auth.currentUser && msg.sender === Auth.currentUser.username;
        const timeStr = msg.timestamp ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Vừa xong';

        const avatarLetter = msg.sender ? msg.sender.charAt(0).toUpperCase() : '?';

        const msgHtml = `
            <div class="chat-msg ${isMe ? 'msg-me' : 'msg-other'}">
                ${!isMe ? `<div class="chat-avatar">${avatarLetter}</div>` : ''}
                <div class="chat-content">
                    ${!isMe ? `<div class="chat-sender">${msg.sender}</div>` : ''}
                    <div class="chat-bubble ${isMe ? 'bubble-me' : 'bubble-other'}">${msg.text}</div>
                    <div class="chat-time">${timeStr}</div>
                </div>
            </div>
        `;
        body.insertAdjacentHTML('beforeend', msgHtml);
    },

    scrollToBottom: () => {
        const body = document.getElementById('chat-body');
        if (body) body.scrollTop = body.scrollHeight;
    },

    sendMessage: async (e) => {
        e.preventDefault();
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        if (!text || !Auth.currentUser) return;

        input.value = '';

        const msgData = {
            sender: Auth.currentUser.username,
            text: text,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            await db.collection('chat').add(msgData);
        } catch (err) {
            console.error("Gửi lỗi tin nhắn:", err);
            Utils.showToast("Lỗi gửi tin nhắn, vui lòng thử lại sau.", "error");
        }
    }
};

window.addEventListener('DOMContentLoaded', () => {
    ChatModule.init();
});
