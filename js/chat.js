// js/chat.js - Module Chat Chung & Riêng

const ChatModule = {
    // Shared State
    isOpen: false,
    currentTab: 'global', // 'global' or 'private'
    privateChatWithUser: null, // target username

    // Global State
    globalMessages: [],
    globalUnsubscribe: null,
    globalUnreadCount: 0,

    // Private State
    privateMessages: [], // all private msgs related to me
    privateUnsubscribe: null,
    privateUnreadCounts: {}, // { username: count }

    init: () => {
        ChatModule.renderUI();
    },

    startListening: () => {
        if (typeof Auth === 'undefined' || !Auth.currentUser) return;

        // 1. Listen to Global Chat (Last 24 hours only)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayTimestamp = firebase.firestore.Timestamp.fromDate(yesterday);

        const globalRef = db.collection('chat')
            .where('timestamp', '>=', yesterdayTimestamp)
            .orderBy('timestamp', 'asc');

        ChatModule.globalUnsubscribe = globalRef.onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    const msg = change.doc.data();
                    ChatModule.globalMessages.push(msg);

                    if (ChatModule.currentTab === 'global' && !ChatModule.privateChatWithUser) {
                        ChatModule.appendMessage(msg, 'chat-body-global');
                    }

                    if (!ChatModule.isOpen || ChatModule.currentTab !== 'global') {
                        if (msg.sender !== Auth.currentUser.username) {
                            ChatModule.globalUnreadCount++;
                            ChatModule.updateBadge();
                        }
                    }
                }
            });
            if (ChatModule.currentTab === 'global' && !ChatModule.privateChatWithUser) {
                setTimeout(() => ChatModule.scrollToBottom('chat-body-global'), 50);
            }
        });

        // 2. Listen to Private Chats
        const privateRef = db.collection('private_chats')
            .where('participants', 'array-contains', Auth.currentUser.username)
            .orderBy('timestamp', 'asc');

        ChatModule.privateUnsubscribe = privateRef.onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    const msg = change.doc.data();
                    ChatModule.privateMessages.push(msg);

                    const otherUser = msg.sender === Auth.currentUser.username ? msg.receiver : msg.sender;

                    if (ChatModule.currentTab === 'private' && ChatModule.privateChatWithUser === otherUser) {
                        ChatModule.appendMessage(msg, 'chat-body-private');
                        setTimeout(() => ChatModule.scrollToBottom('chat-body-private'), 50);
                    } else if (msg.sender !== Auth.currentUser.username) {
                        ChatModule.privateUnreadCounts[otherUser] = (ChatModule.privateUnreadCounts[otherUser] || 0) + 1;
                        ChatModule.updateBadge();
                        // Rerender private list if it's currently open
                        if (ChatModule.currentTab === 'private' && !ChatModule.privateChatWithUser) {
                            ChatModule.renderPrivateUserList();
                        }
                    }
                }
            });
        });
    },

    stopListening: () => {
        if (ChatModule.globalUnsubscribe) ChatModule.globalUnsubscribe();
        if (ChatModule.privateUnsubscribe) ChatModule.privateUnsubscribe();
        ChatModule.globalUnsubscribe = null;
        ChatModule.privateUnsubscribe = null;

        ChatModule.globalMessages = [];
        ChatModule.privateMessages = [];
        ChatModule.globalUnreadCount = 0;
        ChatModule.privateUnreadCounts = {};
        ChatModule.isOpen = false;
        ChatModule.currentTab = 'global';
        ChatModule.privateChatWithUser = null;

        const chatWindow = document.getElementById('chat-window');
        if (chatWindow) chatWindow.classList.remove('active');

        const globBody = document.getElementById('chat-body-global');
        if (globBody) globBody.innerHTML = '';
        const privBody = document.getElementById('chat-body-private');
        if (privBody) privBody.innerHTML = '';

        ChatModule.updateBadge();
    },

    renderUI: () => {
        const html = `
            <!-- Chat Bubble -->
            <div id="chat-fab" class="chat-fab" onclick="ChatModule.toggleChat()">
                <i class="fa-solid fa-comments"></i>
                <span id="chat-badge" class="chat-badge" style="display:none;">0</span>
            </div>

            <!-- Chat Window -->
            <div id="chat-window" class="chat-window glass-card flex-col">
                <div class="chat-header" style="flex-direction:column; padding:0; align-items: stretch;">
                    <div style="display:flex; justify-content:space-between; align-items:center; width:100%; padding:12px 16px; border-bottom:1px solid var(--border-color);">
                        <h4 style="margin:0; font-size:15px; display:flex; align-items:center; gap:8px;" id="chat-main-title">
                            <i class="fa-solid fa-users"></i> Chat Chung
                        </h4>
                        <button class="btn-text" onclick="ChatModule.toggleChat()" style="color:var(--text-secondary);"><i class="fa-solid fa-times"></i></button>
                    </div>
                    <!-- Tabs -->
                    <div id="chat-tabs" style="display:flex; width:100%; border-bottom:1px solid var(--glass-border);">
                        <div class="chat-tab active" id="tab-global" onclick="ChatModule.switchTab('global')">Chung <span class="tab-badge" id="tab-badge-global" style="display:none">0</span></div>
                        <div class="chat-tab" id="tab-private" onclick="ChatModule.switchTab('private')">Tin Nhắn Riêng <span class="tab-badge" id="tab-badge-private" style="display:none">0</span></div>
                    </div>
                </div>
                
                <!-- GLOBAL CHAT VIEW -->
                <div id="view-global" style="display:flex; flex-direction:column; flex:1; overflow:hidden;">
                    <div id="chat-body-global" class="chat-body"></div>
                    <div class="chat-footer">
                        <form onsubmit="ChatModule.sendMessage(event, 'global')" style="display:flex; gap:8px;">
                            <input type="text" id="chat-input-global" class="form-control" placeholder="Viết lên bảng tin chung..." autocomplete="off" required style="flex:1; border-radius:20px;">
                            <button type="submit" class="btn btn-primary" style="border-radius:50%; width:40px; height:40px; outline:none; padding:0; display:flex; align-items:center; justify-content:center;">
                                <i class="fa-solid fa-paper-plane" style="margin-right:-2px;"></i>
                            </button>
                        </form>
                    </div>
                </div>

                <!-- PRIVATE CHAT VIEW -->
                <div id="view-private" style="display:none; flex-direction:column; flex:1; overflow:hidden;">
                    <!-- User List -->
                    <div id="private-user-list" style="flex:1; overflow-y:auto; padding:8px;"></div>
                    
                    <!-- Direct Message Area -->
                    <div id="private-dm-area" style="display:none; flex-direction:column; flex:1; overflow:hidden;">
                        <div style="padding:8px 16px; border-bottom:1px solid var(--border-color); background:rgba(0,0,0,0.15); display:flex; align-items:center; gap:12px;">
                            <button class="btn-text" onclick="ChatModule.backToUserList()" style="color:var(--text-secondary);"><i class="fa-solid fa-arrow-left"></i></button>
                            <span id="private-dm-name" style="font-weight:600; font-size:14px;"></span>
                        </div>
                        <div id="chat-body-private" class="chat-body" style="flex:1;"></div>
                        <div class="chat-footer">
                            <form onsubmit="ChatModule.sendMessage(event, 'private')" style="display:flex; gap:8px;">
                                <input type="text" id="chat-input-private" class="form-control" placeholder="Nhắn tin riêng..." autocomplete="off" required style="flex:1; border-radius:20px;">
                                <button type="submit" class="btn btn-primary" style="border-radius:50%; width:40px; height:40px; outline:none; padding:0; display:flex; align-items:center; justify-content:center;">
                                    <i class="fa-solid fa-paper-plane" style="margin-right:-2px;"></i>
                                </button>
                            </form>
                        </div>
                    </div>
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
            if (ChatModule.currentTab === 'global') {
                ChatModule.globalUnreadCount = 0;
                ChatModule.scrollToBottom('chat-body-global');
                setTimeout(() => {
                    const el = document.getElementById('chat-input-global');
                    if (el) el.focus();
                }, 100);
            } else if (ChatModule.privateChatWithUser) {
                ChatModule.privateUnreadCounts[ChatModule.privateChatWithUser] = 0;
                ChatModule.scrollToBottom('chat-body-private');
                setTimeout(() => {
                    const el = document.getElementById('chat-input-private');
                    if (el) el.focus();
                }, 100);
            } else {
                ChatModule.renderPrivateUserList();
            }
            ChatModule.updateBadge();
        } else {
            chatWindow.classList.remove('active');
        }
    },

    switchTab: (tab) => {
        ChatModule.currentTab = tab;
        document.getElementById('tab-global').classList.toggle('active', tab === 'global');
        document.getElementById('tab-private').classList.toggle('active', tab === 'private');

        document.getElementById('view-global').style.display = tab === 'global' ? 'flex' : 'none';
        document.getElementById('view-private').style.display = tab === 'private' ? 'flex' : 'none';

        const title = document.getElementById('chat-main-title');

        if (tab === 'global') {
            title.innerHTML = '<i class="fa-solid fa-users"></i> Chat Chung';
            ChatModule.globalUnreadCount = 0;
            // Clear current list and render all
            const globBody = document.getElementById('chat-body-global');
            globBody.innerHTML = '';
            ChatModule.globalMessages.forEach(m => ChatModule.appendMessage(m, 'chat-body-global'));
            ChatModule.scrollToBottom('chat-body-global');
            setTimeout(() => {
                const el = document.getElementById('chat-input-global');
                if (el) el.focus();
            }, 50);
        } else {
            title.innerHTML = '<i class="fa-solid fa-user-lock"></i> Tin Nhắn Riêng';
            if (!ChatModule.privateChatWithUser) {
                ChatModule.renderPrivateUserList();
            } else {
                ChatModule.privateUnreadCounts[ChatModule.privateChatWithUser] = 0;
                ChatModule.scrollToBottom('chat-body-private');
                setTimeout(() => {
                    const el = document.getElementById('chat-input-private');
                    if (el) el.focus();
                }, 50);
            }
        }
        ChatModule.updateBadge();
    },

    renderPrivateUserList: async () => {
        const ulistContainer = document.getElementById('private-user-list');
        const dmArea = document.getElementById('private-dm-area');

        ulistContainer.style.display = 'block';
        dmArea.style.display = 'none';

        if (!Auth.currentUser) return;

        try {
            const accounts = await Auth.getAccounts();
            let html = '';

            // Render other users
            accounts.forEach(acc => {
                if (acc.username === Auth.currentUser.username) return; // Skip self

                const unread = ChatModule.privateUnreadCounts[acc.username] || 0;
                const badgeHtml = unread > 0 ? `<div class="p-unread-badge">${unread}</div>` : '';

                html += `
                    <div class="p-user-item ${unread > 0 ? 'has-unread' : ''}" onclick="ChatModule.openPrivateChat('${acc.username}')">
                        <div class="p-user-avatar">${acc.username.charAt(0).toUpperCase()}</div>
                        <div class="p-user-info">
                            <span class="p-user-name">${acc.username}</span>
                            <span class="p-user-role" style="font-size:11px; opacity:0.7;">${acc.role}</span>
                        </div>
                        ${badgeHtml}
                    </div>
                `;
            });

            if (html === '') {
                html = '<p style="text-align:center; padding:20px; color:var(--text-secondary); font-size:13px;">Chưa có tài khoản nào khác.</p>';
            }

            ulistContainer.innerHTML = html;
        } catch (err) {
            console.error(err);
        }
    },

    openPrivateChat: (targetUsername) => {
        ChatModule.privateChatWithUser = targetUsername;
        ChatModule.privateUnreadCounts[targetUsername] = 0;
        ChatModule.updateBadge();

        document.getElementById('private-user-list').style.display = 'none';
        const dmArea = document.getElementById('private-dm-area');
        dmArea.style.display = 'flex';

        document.getElementById('private-dm-name').textContent = targetUsername;

        // Render messages for this user
        const privBody = document.getElementById('chat-body-private');
        privBody.innerHTML = '';

        const relevantMsgs = ChatModule.privateMessages.filter(m =>
            (m.sender === Auth.currentUser.username && m.receiver === targetUsername) ||
            (m.sender === targetUsername && m.receiver === Auth.currentUser.username)
        );

        if (relevantMsgs.length === 0) {
            privBody.innerHTML = '<p class="chat-placeholder" style="text-align:center; color: var(--text-secondary); font-size:13px; margin-top:20px;">Hãy gửi lời chào đầu tiên!</p>';
        } else {
            relevantMsgs.forEach(m => ChatModule.appendMessage(m, 'chat-body-private'));
        }

        setTimeout(() => {
            ChatModule.scrollToBottom('chat-body-private');
            const el = document.getElementById('chat-input-private');
            if (el) el.focus();
        }, 50);
    },

    backToUserList: () => {
        ChatModule.privateChatWithUser = null;
        ChatModule.renderPrivateUserList();
    },

    updateBadge: () => {
        const badge = document.getElementById('chat-badge');
        const tabGlobBadge = document.getElementById('tab-badge-global');
        const tabPrivBadge = document.getElementById('tab-badge-private');

        if (!badge) return;

        const globCount = ChatModule.globalUnreadCount;
        const privCount = Object.values(ChatModule.privateUnreadCounts).reduce((a, b) => a + b, 0);
        const total = globCount + privCount;

        if (total > 0) {
            badge.textContent = total > 9 ? '9+' : total;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }

        // Update tab badges
        if (tabGlobBadge) {
            tabGlobBadge.textContent = globCount;
            tabGlobBadge.style.display = globCount > 0 ? 'inline-flex' : 'none';
        }
        if (tabPrivBadge) {
            tabPrivBadge.textContent = privCount;
            tabPrivBadge.style.display = privCount > 0 ? 'inline-flex' : 'none';
        }
    },

    appendMessage: (msg, containerId) => {
        const body = document.getElementById(containerId);
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
                    ${!isMe && containerId === 'chat-body-global' ? `<div class="chat-sender">${msg.sender}</div>` : ''}
                    <div class="chat-bubble ${isMe ? 'bubble-me' : 'bubble-other'}">${msg.text}</div>
                    <div class="chat-time">${timeStr}</div>
                </div>
            </div>
        `;
        body.insertAdjacentHTML('beforeend', msgHtml);
    },

    scrollToBottom: (containerId) => {
        const body = document.getElementById(containerId);
        if (body) body.scrollTop = body.scrollHeight;
    },

    sendMessage: async (e, type) => {
        e.preventDefault();
        const inputId = type === 'global' ? 'chat-input-global' : 'chat-input-private';
        const input = document.getElementById(inputId);
        const text = input.value.trim();
        if (!text || !Auth.currentUser) return;

        input.value = '';

        if (type === 'global') {
            const msgData = {
                sender: Auth.currentUser.username,
                text: text,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };
            try {
                await db.collection('chat').add(msgData);
            } catch (err) {
                console.error("Lỗi gửi chat chung:", err);
            }
        } else if (type === 'private' && ChatModule.privateChatWithUser) {
            const msgData = {
                sender: Auth.currentUser.username,
                receiver: ChatModule.privateChatWithUser,
                participants: [Auth.currentUser.username, ChatModule.privateChatWithUser],
                text: text,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };
            try {
                await db.collection('private_chats').add(msgData);
            } catch (err) {
                console.error("Lỗi gửi chat riêng:", err);
            }
        }
    }
};

window.addEventListener('DOMContentLoaded', () => {
    ChatModule.init();
});
