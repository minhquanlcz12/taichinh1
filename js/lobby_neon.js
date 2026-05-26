/**
 * js/lobby_v100.js - Chibi Lobby Module (Neon Upgrade)
 * Manages: Chibi movement, Chat, Caro PvP
 */

window.LobbyNeon = {
    state: {
        isConnected: false,
        users: {},
        myPos: { x: 300, y: 300 },
        unsubscribePresence: null,
        unsubscribeChat: null,
        inviteShown: null,
        currentGameId: null,
        currentGameData: null,
        heartbeatInterval: null,
        isMakingMove: false,
        npcPos: { x: 800, y: 300 },
        marqueeInterval: null,
        unsubscribeMissions: null
    },

    init: () => {
        console.log("LobbyNeon initialized");
    },

    // ========== ENTRY / EXIT ==========
    enterLobby: async () => {
        console.log("LobbyNeon.enterLobby called");
        if (LobbyNeon.state.isConnected) return;

        const user = Auth.currentUser;
        if (!user) return;

        const mapContainer = document.getElementById('lobby-view');
        const w = mapContainer ? mapContainer.offsetWidth : 800;
        const h = mapContainer ? mapContainer.offsetHeight : 600;
        
        LobbyNeon.state.myPos = {
            x: Math.floor(Math.random() * (w - 200)) + 100,
            y: Math.floor(Math.random() * (h - 300)) + 80
        };

        LobbyNeon.renderLobbyBase();
        LobbyNeon.state.isConnected = true;
        
        LobbyNeon.renderUser(user.username, LobbyNeon.state.myPos.x, LobbyNeon.state.myPos.y, user.profile?.chibiConfig);
        
        // Render NPC with delay
        setTimeout(() => {
            LobbyNeon.renderQuestNPC();
        }, 500);

        LobbyNeon.startPresenceListening();
        
        // Always ensure global listener is running
        LobbyNeon.startGlobalMissionListening();
        LobbyNeon.listenToGames();
        await LobbyNeon.syncMyPresence();

        LobbyNeon.state.heartbeatInterval = setInterval(() => {
            LobbyNeon.syncMyPresence();
        }, 15000);

        const container = document.getElementById('lobby-map-container');
        if (container) {
            container.addEventListener('mousedown', LobbyNeon.handleMapClick);
        }
    },

    leaveLobby: () => {
        if (LobbyNeon.state.unsubscribePresence) LobbyNeon.state.unsubscribePresence();
        if (LobbyNeon.state.unsubscribeChat) LobbyNeon.state.unsubscribeChat();
        if (LobbyNeon.state.unsubscribeMissions) LobbyNeon.state.unsubscribeMissions();
        if (LobbyNeon.state.heartbeatInterval) clearInterval(LobbyNeon.state.heartbeatInterval);
        LobbyNeon.state.isConnected = false;
        LobbyNeon.state.currentGameId = null;
    },

    // ========== SYNC / PRESENCE ==========
    syncMyPresence: async () => {
        const user = Auth.currentUser;
        if (!user) return;
        try {
            await DB.updateLobbyPresence({
                username: user.username,
                x: LobbyNeon.state.myPos.x,
                y: LobbyNeon.state.myPos.y,
                chibiConfig: user.profile?.chibiConfig || {}
            });
        } catch (e) {
            console.error("syncMyPresence error:", e);
        }
    },

    startPresenceListening: () => {
        const me = Auth.currentUser?.username;
        if (!me) return;

        LobbyNeon.state.unsubscribePresence = DB.listenLobbyPresence((allUsers) => {
            const now = Date.now();
            Object.entries(allUsers).forEach(([username, data]) => {
                if (data.lastSeen && data.lastSeen.toDate) {
                    const diff = now - data.lastSeen.toDate().getTime();
                    if (diff > 60000) {
                        const staleEl = document.getElementById(`user-${username}`);
                        if (staleEl) staleEl.remove();
                        return;
                    }
                }
                if (username !== me) {
                    LobbyNeon.renderUser(username, data.x, data.y, data.chibiConfig);
                }
            });
            // Update online player list in hub!
            LobbyNeon.updateHubPlayers(allUsers);
        });

        LobbyNeon.state.unsubscribeChat = DB.listenLobbyChat((messages) => {
            LobbyNeon.renderChatMessages(messages);
        });
    },

    startGlobalMissionListening: () => {
        if (LobbyNeon.state.unsubscribeMissions) return; // Already listening

        LobbyNeon.state.unsubscribeMissions = DB.listenMissions((missions) => {
            LobbyNeon.updateMarquee(missions);
            // If admin board is open, refresh it
            if (document.getElementById('hub-content-quests')) {
                LobbyNeon.renderAdminQuestManager();
            }
        });
    },

    // ========== RENDER ==========
    renderLobbyBase: () => {
        const container = document.getElementById('lobby-view');
        if (!container) return;

        console.log("Rendering Final Stable Lobby Video with Game Hub Panel...");
        container.innerHTML = `
            <style>
                .lobby-hub-toggle {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    z-index: 1001;
                    background: linear-gradient(135deg, #00f3ff, #8b5cf6);
                    border: none;
                    border-radius: 50%;
                    width: 50px;
                    height: 50px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 0 15px rgba(0, 243, 255, 0.4);
                    transition: all 0.3s;
                }
                .lobby-game-hub {
                    position: absolute;
                    top: 80px;
                    right: 20px;
                    bottom: 80px;
                    width: 360px;
                    background: rgba(15, 23, 42, 0.95);
                    border: 2px solid #00f3ff;
                    border-radius: 16px;
                    box-shadow: 0 0 35px rgba(0, 243, 255, 0.25);
                    z-index: 1000;
                    backdrop-filter: blur(12px);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    transform: translateX(0);
                    opacity: 1;
                    pointer-events: auto;
                }
                .lobby-game-hub.collapsed {
                    transform: translateX(450px);
                    opacity: 0;
                    pointer-events: none;
                }
                .hub-tab {
                    flex: 1;
                    padding: 12px;
                    background: none;
                    border: none;
                    border-bottom: 2px solid transparent;
                    color: #64748b;
                    font-weight: 800;
                    font-size: 11px;
                    text-transform: uppercase;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .hub-tab.active {
                    color: #fff;
                    border-bottom: 2px solid #00f3ff;
                    text-shadow: 0 0 8px rgba(0,243,255,0.4);
                }
                .hub-player-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.05);
                    padding: 10px 14px;
                    border-radius: 8px;
                    margin-bottom: 8px;
                }
                .hub-player-row:hover {
                    background: rgba(255,255,255,0.06);
                    border-color: rgba(0,243,255,0.15);
                }
                .hub-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 16px;
                }

                /* QUEST NPC STYLES */
                @keyframes float { 0%, 100% { transform: translate(-50%, 0); } 50% { transform: translate(-50%, -15px); } }
                .lobby-user-wrapper.npc { z-index: 100 !important; }
                .lobby-user-wrapper.npc .lobby-chibi-container svg { overflow: visible !important; }

                /* GLOBAL MARQUEE STYLES */
                .lobby-marquee-bar {
                    width: 100%;
                    height: 100%;
                    background: rgba(251, 191, 36, 0.05);
                    border: 1px solid rgba(251, 191, 36, 0.2);
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    overflow: hidden;
                    position: relative;
                }
                .marquee-text {
                    white-space: nowrap;
                    font-size: 14px;
                    font-weight: 800;
                    color: #fbbf24;
                    animation: marquee_anim 20s linear infinite;
                    padding-left: 100%;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                @keyframes marquee_anim {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-150%); }
                }
            </style>

            <div id="lobby-map-container" style="width: 100%; height: 100%; position: relative; cursor: crosshair; overflow: hidden; background: #000;">
                <div class="lobby-map" id="lobby-map">
                    <video id="lobby-video-bg" autoplay loop muted playsinline 
                        style="width: 100%; height: 100%; object-fit: fill; image-rendering: -webkit-optimize-contrast;"
                        oncanplay="this.style.opacity=1" 
                        onerror="this.style.display='none'">
                        <source src="assets/lobby_bg.mp4" type="video/mp4">
                    </video>
                    <div class="lobby-click-ripple-layer"></div>
                </div>

                <!-- Game Hub Toggle Button -->
                <button onclick="LobbyNeon.toggleGameHub()" class="lobby-hub-toggle" title="Mở Đấu Trường Trực Tuyến" onmouseover="this.style.transform='scale(1.1)';" onmouseout="this.style.transform='scale(1)';">
                    <i class="fa-solid fa-gamepad" style="color: #fff; font-size: 20px;"></i>
                </button>

                <!-- Game Hub sliding side panel -->
                <div id="lobby-game-hub" class="lobby-game-hub">
                    <div class="hub-header" style="background: rgba(0,243,255,0.08); padding: 16px; border-bottom: 1.5px solid rgba(0,243,255,0.2); display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin: 0; font-size: 14px; font-weight: 800; color: #00f3ff; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; gap: 8px;">
                            🎮 ĐẤU TRƯỜNG TRỰC TUYẾN
                        </h3>
                        <span id="hub-online-count" style="font-size: 10px; background: rgba(16,185,129,0.15); color: #10b981; padding: 2px 8px; border-radius: 10px; font-weight: bold;">
                            ⏳ ĐANG TẢI...
                        </span>
                    </div>
                    
                    <!-- Hub Tabs -->
                    <div style="display: flex; background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.06);">
                        <button onclick="LobbyNeon.switchHubTab('players')" id="hub-tab-players" class="hub-tab active">
                            👥 ĐỒNG NGHIỆP
                        </button>
                        <button onclick="LobbyNeon.switchHubTab('monopoly')" id="hub-tab-monopoly" class="hub-tab">
                            🎲 CỜ TỶ PHÚ
                        </button>
                        ${Auth.currentUser?.role === 'admin' ? `
                        <button onclick="LobbyNeon.switchHubTab('quests')" id="hub-tab-quests" class="hub-tab" style="color: #fbbf24;">
                            📜 NHIỆM VỤ
                        </button>` : ''}
                    </div>

                    <!-- Hub Contents -->
                    <div id="hub-content-players" class="hub-content">
                        <div style="text-align: center; color: #64748b; font-size: 12px; padding: 40px 10px;">
                            Đang kết nối danh sách đồng nghiệp...
                        </div>
                    </div>
                    <div id="hub-content-monopoly" class="hub-content" style="display: none;">
                        <div style="text-align: center; color: #64748b; font-size: 12px; padding: 40px 10px;">
                            Đang kết nối sảnh cờ Tỷ Phú...
                        </div>
                    </div>
                    <div id="hub-content-quests" class="hub-content" style="display: none;">
                        <div style="text-align: center; color: #64748b; font-size: 12px; padding: 20px 0;">
                            Đang tải quản lý nhiệm vụ...
                        </div>
                    </div>
                </div>

                <div class="lobby-chat-overlay">
                    <div class="lobby-chat-messages" id="lobby-chat-messages">
                        <div class="lobby-message">
                            <span class="lobby-msg-text" style="color: #a855f7; font-style: italic; opacity: 0.8;">Hệ thống: Chào mừng tới Cung Điện Neon! Click chuột để di chuyển.</span>
                        </div>
                    </div>
                    <form class="lobby-chat-input-wrap" onsubmit="LobbyNeon.sendChat(event)">
                        <input type="text" id="lobby-chat-input" class="lobby-chat-input" placeholder="Nhắn tin với mọi người..." autocomplete="off">
                    </form>
                </div>
            </div>
        `;
    },

    renderUser: (username, x, y, config) => {
        const map = document.getElementById('lobby-map');
        if (!map) return;

        let el = document.getElementById(`user-${username}`);
        const isMe = (username === Auth.currentUser?.username);

        if (!el) {
            el = document.createElement('div');
            el.id = `user-${username}`;
            el.className = `lobby-user-wrapper ${isMe ? 'me' : ''}`;
            if (!isMe) {
                el.style.cursor = 'pointer';
                el.onclick = (e) => {
                    e.stopPropagation();
                    LobbyNeon.showUserMenu(username);
                };
            }
            map.appendChild(el);
        }

        let chibiSvg = '';
        try {
            chibiSvg = ChibiModule.renderChibiSVG(config || {}, false, 0);
        } catch (e) {
            chibiSvg = `<div style="font-size: 40px;">👤</div>`;
        }

        el.style.left = `${x}px`;
        el.style.top = `${y}px`;

        // PARTIAL UPDATE to preserve child elements like chat bubbles
        let nameEl = el.querySelector('.lobby-user-name');
        if (!nameEl) {
            el.innerHTML = `
                <div class="lobby-user-name">${username}</div>
                <div class="lobby-chibi-container" style="transform: scale(1.3);">${chibiSvg}</div>
                ${!isMe ? '<div class="lobby-user-status">⚔️ THÁCH ĐẤU</div>' : ''}
            `;
        } else {
            nameEl.textContent = username;
            const container = el.querySelector('.lobby-chibi-container');
            if (container) container.innerHTML = chibiSvg;
        }
    },

    renderQuestNPC: () => {
        console.log("LobbyNeon.renderQuestNPC starting...");
        const map = document.getElementById('lobby-map');
        if (!map) {
            console.error("NPC Error: lobby-map not found");
            return;
        }

        const npcId = 'npc-admin';
        let el = document.getElementById(npcId);

        if (!el) {
            el = document.createElement('div');
            el.id = npcId;
            el.className = 'lobby-user-wrapper npc';
            el.style.position = 'absolute';
            el.style.cursor = 'help';
            el.onclick = (e) => {
                e.stopPropagation();
                LobbyNeon.openQuestBoard();
            };
            map.appendChild(el);
            console.log("NPC element created and appended to map");
        }

        const npcConfig = {
            gender: 'nam',
            skinColor: '#ffe4e6',
            hairStyle: 5,
            hairColor: '#fbbf24',
            topStyle: 5,
            topColor: '#ffffff',
            bottomStyle: 1,
            bottomColor: '#1e293b',
            shoeStyle: 1,
            shoeColor: '#1e293b',
            accessory: 5, // Vương miện
            wing: 3,      // Thiên Thần VIP
            aura: 5,      // Zen Circle
            gear: 0,
            mount: 0,
            dragon: 3     // Hoàng Long
        };

        let chibiSvg = ChibiModule.renderChibiSVG(npcConfig, true, 88);

        // Position near the throne at the top center
        const tx = 955, ty = 340;
        LobbyNeon.state.npcPos = { x: tx, y: ty };

        el.style.left = `${tx}px`;
        el.style.top = `${ty}px`;

        el.innerHTML = `
            <div class="lobby-user-name" style="color: #fbbf24; background: rgba(0,0,0,0.8); padding: 4px 12px; border: 2px solid #fbbf24; border-radius: 20px; font-weight: 800; font-size: 14px; white-space: nowrap; box-shadow: 0 0 10px rgba(251,191,36,0.5);">👑 QUEST MASTER ADMIN</div>
            <div class="lobby-quest-icon" style="position: absolute; top: -85px; left: 50%; transform: translateX(-50%); font-size: 40px; animation: float 2s infinite ease-in-out; filter: drop-shadow(0 0 15px #fbbf24); z-index: 10;">📜</div>
            <div class="lobby-chibi-container" style="transform: scale(1.8); filter: drop-shadow(0 0 20px rgba(251,191,36,0.6)); pointer-events: none;">${chibiSvg}</div>
            <div class="lobby-user-status" style="background: #fbbf24; border: none; color: #000; padding: 4px 16px; font-weight: 900; border-radius: 4px; font-size: 11px; margin-top: 10px; box-shadow: 0 0 15px #fbbf24;">✨ NHẬN THÁNH CHỈ</div>
        `;
        console.log("NPC render complete at", tx, ty);
    },

    // ========== MOVEMENT ==========
    handleMapClick: (e) => {
        if (e.target.closest('.lobby-chat-overlay') || e.target.closest('.caro-modal')) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const ripple = document.createElement('div');
        ripple.className = 'lobby-click-ripple';
        ripple.style.left = `${x - 15}px`;
        ripple.style.top = `${y - 7}px`;
        document.getElementById('lobby-map-container').appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);

        LobbyNeon.moveTo(x, y);

        // Check proximity to NPC
        const dx = x - LobbyNeon.state.npcPos.x;
        const dy = y - LobbyNeon.state.npcPos.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 80) {
            LobbyNeon.openQuestBoard();
        }
    },

    moveTo: async (x, y) => {
        LobbyNeon.state.myPos = { x, y };
        const user = Auth.currentUser;
        LobbyNeon.renderUser(user.username, x, y, user.profile?.chibiConfig);
        await LobbyNeon.syncMyPresence();
    },

    // ========== CHAT ==========
    sendChat: async (e) => {
        e.preventDefault();
        const input = document.getElementById('lobby-chat-input');
        const text = input.value.trim();
        if (!text) return;
        input.value = '';
        await DB.sendLobbyChat({ sender: Auth.currentUser.username, text });
    },

    renderChatMessages: (messages) => {
        const container = document.getElementById('lobby-chat-messages');
        if (!container) return;
        let html = `<div class="lobby-message"><span class="lobby-msg-text" style="color: #a855f7; font-style: italic; opacity: 0.7;">Hệ thống: Chào mừng tới Cung Điện Neon!</span></div>`;
        
        // Show bubbles for the latest message if it's new
        const lastMsg = messages[messages.length - 1];
        if (lastMsg) {
            LobbyNeon.showChatBubble(lastMsg.sender, lastMsg.text);
        }

        messages.forEach(msg => {
            html += `<div class="lobby-message"><span class="lobby-msg-sender">${msg.sender}:</span><span class="lobby-msg-text">${msg.text}</span></div>`;
        });
        container.innerHTML = html;
        container.scrollTop = container.scrollHeight;
    },

    showChatBubble: (username, text) => {
        const userWrapper = document.getElementById(`user-${username}`);
        if (!userWrapper) return;

        // Remove existing bubble if any
        const oldBubble = userWrapper.querySelector('.lobby-chat-bubble');
        if (oldBubble) oldBubble.remove();

        const bubble = document.createElement('div');
        bubble.className = 'lobby-chat-bubble';
        bubble.textContent = text.length > 50 ? text.substring(0, 47) + '...' : text;
        userWrapper.appendChild(bubble);

        // Auto remove after 6s
        setTimeout(() => {
            bubble.classList.add('fade-out');
            setTimeout(() => bubble.remove(), 500);
        }, 6000);
    },

    renderPillars: () => {
        const map = document.getElementById('lobby-map');
        if (!map) return;
        
        // Clear old pillars
        map.querySelectorAll('.cyber-pillar').forEach(p => p.remove());

        // Place 10 pillars along the palace "path"
        const pillarCoords = [
            {x: 450, y: 200}, {x: 1450, y: 200},
            {x: 450, y: 700}, {x: 1450, y: 700},
            {x: 450, y: 1200}, {x: 1450, y: 1200},
            {x: 450, y: 1700}, {x: 1450, y: 1700},
            {x: 450, y: 2200}, {x: 1450, y: 2200}
        ];

        pillarCoords.forEach(coord => {
            const p = document.createElement('div');
            p.className = 'cyber-pillar';
            p.style.left = `${coord.x}px`;
            p.style.top = `${coord.y}px`;
            map.appendChild(p);
        });
    },

    // ========== CHALLENGE / CARO ==========
    showUserMenu: (targetUser) => {
        Utils.showModal(
            `⚔️ THÁCH ĐẤU: ${targetUser}`,
            `<div style="text-align: center; padding: 10px;">
                <p style="font-size: 16px; color: #fff;">Bạn có muốn thách đấu <b>Cờ Caro</b> với <span style="color:var(--lobby-accent)">${targetUser}</span> không?</p>
                <p style="font-size: 13px; color: #94a3b8; margin-top: 15px;">Kẻ thắng cầm hũ, kẻ bại hồi cung!</p>
            </div>`,
            async () => {
                LobbyNeon.inviteToCaro(targetUser);
                return true;
            },
            'GỬI CHIẾN THƯ'
        );
    },

    inviteToCaro: async (targetUser) => {
        const gameId = await DB.createLobbyGame(Auth.currentUser.username, targetUser);
        if (gameId) Utils.showToast(`Đã gửi chiến thư tới ${targetUser}!`, 'info');
    },

    listenToGames: () => {
        const me = Auth.currentUser?.username;
        if (!me) return;
        db.collection("lobby_games").where("status", "==", "playing").onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                const game = change.doc.data();
                const gameId = change.doc.id;
                if (game.player2 === me && !game.p2Accepted) {
                    LobbyNeon.showIncomingInvite(gameId, game.player1);
                } else if (LobbyNeon.state.currentGameId === gameId) {
                    LobbyNeon.onGameUpdate(game);
                } else if ((game.player1 === me || game.player2 === me) && game.p2Accepted) {
                    LobbyNeon.openCaroBoard(gameId, game);
                }
            });
        });
    },

    showIncomingInvite: (gameId, fromUser) => {
        if (LobbyNeon.state.inviteShown === gameId) return;
        LobbyNeon.state.inviteShown = gameId;
        Utils.showModal(
            '🎮 CHIẾN THƯ ĐẾN!',
            `<div style="text-align: center; padding: 10px;">
                <p style="font-size: 18px; color: #fff;"><b>${fromUser}</b> vừa gửi lời thách đấu Cờ Caro!</p>
                <p style="color: var(--lobby-accent); font-weight: 700; margin-top: 10px;">Sẵn sàng ứng chiến?</p>
            </div>`,
            async () => {
                await DB.updateLobbyGame(gameId, { p2Accepted: true });
                return true;
            },
            'ỨNG CHIẾN',
            'SỢ HÃI RÚT LUI',
            async () => {
                await DB.updateLobbyGame(gameId, { status: 'rejected' });
                return true;
            }
        );
    },

    openCaroBoard: (gameId, game) => {
        if (LobbyNeon.state.currentGameId === gameId) return;
        LobbyNeon.state.currentGameId = gameId;

        const container = document.getElementById('lobby-view');
        const boardOverlay = document.createElement('div');
        boardOverlay.id = 'caro-overlay';
        boardOverlay.className = 'caro-modal';
        boardOverlay.innerHTML = `
            <div class="caro-board-container">
                <div style="display: flex; justify-content: space-between; margin-bottom: 20px; align-items: center;">
                    <div style="color: #fff; font-size: 14px; flex: 1;">
                        <div id="caro-p1-label" style="color: #ff4757; font-weight: 900; text-shadow: 0 0 5px #ff4757; margin-bottom: 4px;">${game.player1} (X)</div>
                        <div id="caro-p1-stats" style="font-size: 10px; color: #94a3b8; font-weight: bold;">Đang tải...</div>
                    </div>
                    <div style="margin: 0 15px; opacity: 0.5; color: #fff; font-weight: 900;">VS</div>
                    <div style="color: #fff; font-size: 14px; flex: 1; text-align: right;">
                        <div id="caro-p2-label" style="color: #2ed573; font-weight: 900; text-shadow: 0 0 5px #2ed573; margin-bottom: 4px;">${game.player2} (O)</div>
                        <div id="caro-p2-stats" style="font-size: 10px; color: #94a3b8; font-weight: bold;">Đang tải...</div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn-neon-danger" id="caro-btn-quit" onclick="LobbyNeon.forfeitGame()" style="font-size: 11px; padding: 6px 12px; height: 32px;">Rút lui</button>
                        <button class="btn-neon" onclick="LobbyNeon.closeCaroBoard()" style="font-size: 11px; padding: 6px 12px; height: 32px; background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.2);">✖</button>
                    </div>
                </div>
                <div id="caro-status-msg" style="color: #fff; font-weight: 800; font-size: 14px; margin-bottom: 15px; text-align: center; background: rgba(168, 85, 247, 0.2); padding: 5px; border-radius: 8px;">Đang chuẩn bị...</div>
                <div class="caro-grid" id="caro-grid">
                    ${Array(225).fill(0).map((_, i) => `<div class="caro-cell" onclick="LobbyNeon.makeMove(${i})"></div>`).join('')}
                </div>
                <div id="caro-winner-ui" class="caro-winner-overlay" style="display: none; flex-direction: column; gap: 20px;">
                    <div class="winner-text">🎉 THẮNG CUỘC!</div>
                    <div style="display: flex; gap: 15px; z-index: 10;">
                        <button class="btn-neon" onclick="LobbyNeon.requestRematch()">Thách Đấu Lại</button>
                        <button class="btn-neon-danger" onclick="LobbyNeon.closeCaroBoard()">Kết Thúc</button>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(boardOverlay);
        LobbyNeon.onGameUpdate(game);
    },

    makeMove: async (index) => {
        if (LobbyNeon.state.isMakingMove) return;
        const gameId = LobbyNeon.state.currentGameId;
        const game = LobbyNeon.state.currentGameData;
        const me = Auth.currentUser.username;

        if (game.status !== 'playing') return;
        if (game.turn !== me) {
            Utils.showToast("Chưa tới lượt của bạn!", "warning");
            return;
        }
        if (game.board[index]) return;

        LobbyNeon.state.isMakingMove = true;
        const newBoard = [...game.board];
        const symbol = (me === game.player1) ? 'X' : 'O';
        newBoard[index] = symbol;

        const winner = LobbyNeon.checkWin(newBoard, index);
        const updateData = {
            board: newBoard,
            turn: (me === game.player1) ? game.player2 : game.player1
        };

        if (winner) {
            updateData.status = 'finished';
            updateData.winner = me;
        }

        try {
            await DB.updateLobbyGame(gameId, updateData);
            
            if (winner) {
                // Update stats
                const loser = (me === game.player1) ? game.player2 : game.player1;
                await DB.incrementUserStats(me, 'caroWins');
                await DB.incrementUserStats(loser, 'caroLosses');
                GamesSynth.playWin();
            } else {
                GamesSynth.playMove();
            }
        } catch (e) {
            console.error("makeMove error:", e);
        } finally {
            LobbyNeon.state.isMakingMove = false;
        }
    },

    onGameUpdate: async (game) => {
        LobbyNeon.state.currentGameData = game;
        const grid = document.getElementById('caro-grid');
        if (!grid) return;

        const cells = grid.querySelectorAll('.caro-cell');
        game.board.forEach((val, i) => {
            if (val && !cells[i].classList.contains(val.toLowerCase())) {
                cells[i].textContent = val;
                cells[i].className = `caro-cell ${val.toLowerCase()} filled`;
            }
        });

        // Update Stats display in header
        LobbyNeon.updateMatchStats(game.player1, game.player2);

        const me = Auth.currentUser.username;
        const statusMsg = document.getElementById('caro-status-msg');
        const winnerUI = document.getElementById('caro-winner-ui');

        if (game.status === 'finished') {
            if (winnerUI) {
                winnerUI.style.display = 'flex';
                const winnerText = winnerUI.querySelector('.winner-text');
                if (game.winner === me) {
                    winnerText.innerHTML = "🏆 CHIẾN THẮNG!";
                    winnerText.style.color = "#2ed573";
                    winnerText.style.textShadow = "0 0 20px #2ed573";
                } else if (game.winner) {
                    winnerText.innerHTML = "💀 BẠI TRẬN!";
                    winnerText.style.color = "#ff4757";
                    winnerText.style.textShadow = "0 0 20px #ff4757";
                } else {
                    winnerText.innerHTML = "🏳️ TRẬN ĐẤU KẾT THÚC";
                    winnerText.style.color = "#94a3b8";
                }
            }
            
            const quitBtn = document.getElementById('caro-btn-quit');
            if (quitBtn) quitBtn.style.display = 'none';
            statusMsg.innerHTML = `<span style="color:#fff">Trận đấu đã kết thúc. Giao diện sẽ đóng sau khi bạn chọn.</span>`;
        } else {
            statusMsg.innerHTML = game.turn === me ? 
                `<span style="color:#2ed573">🟢 ĐẾN LƯỢT TIÊN PHONG</span>` : 
                `<span style="color:#94a3b8">⏳ CHỜ ĐỐI THỦ HÀNH QUÂN...</span>`;
        }
    },

    updateMatchStats: async (p1, p2) => {
        const accounts = await DB.getAccounts();
        const u1 = accounts.find(a => a.username === p1);
        const u2 = accounts.find(a => a.username === p2);

        const s1 = u1?.stats || { caroWins: 0, caroLosses: 0 };
        const s2 = u2?.stats || { caroWins: 0, caroLosses: 0 };

        const el1 = document.getElementById('caro-p1-stats');
        const el2 = document.getElementById('caro-p2-stats');

        if (el1) el1.textContent = `Thắng: ${s1.caroWins || 0} | Thua: ${s1.caroLosses || 0}`;
        if (el2) el2.textContent = `Thắng: ${s2.caroWins || 0} | Thua: ${s2.caroLosses || 0}`;
    },

    closeCaroBoard: () => {
        const overlay = document.getElementById('caro-overlay');
        if (overlay) overlay.remove();
        LobbyNeon.state.currentGameId = null;
    },

    requestRematch: async () => {
        const gameData = LobbyNeon.state.currentGameData;
        if (!gameData) return;
        const opponent = (Auth.currentUser.username === gameData.player1) ? gameData.player2 : gameData.player1;
        
        LobbyNeon.closeCaroBoard();
        Utils.showToast(`Đang gửi yêu cầu tái đấu tới ${opponent}...`, "info");
        await LobbyNeon.inviteToCaro(opponent);
    },

    checkWin: (board, index) => {
        const size = 15;
        const x = index % size;
        const y = Math.floor(index / size);
        const symbol = board[index];
        const directions = [[1,0],[0,1],[1,1],[1,-1]];
        for (const [dx, dy] of directions) {
            let count = 1;
            for (let i = 1; i < 5; i++) {
                const nx = x + dx * i, ny = y + dy * i;
                if (nx >= 0 && nx < size && ny >= 0 && ny < size && board[ny * size + nx] === symbol) count++;
                else break;
            }
            for (let i = 1; i < 5; i++) {
                const nx = x - dx * i, ny = y - dy * i;
                if (nx >= 0 && nx < size && ny >= 0 && ny < size && board[ny * size + nx] === symbol) count++;
                else break;
            }
            if (count >= 5) return true;
        }
        return false;
    },

    forfeitGame: async () => {
        Utils.showModal(
            '⚠️ XÁC NHẬN RÚT LUI',
            `<div style="text-align: center;">
                <p style="font-size: 16px; color: #fff;">Sếp chắc chắn muốn <b>Rút lui</b>? Chiến thắng sẽ thuộc về đối thủ!</p>
            </div>`,
            async () => {
                const gameId = LobbyNeon.state.currentGameId;
                const game = LobbyNeon.state.currentGameData;
                const me = Auth.currentUser.username;
                const opponent = (me === game.player1) ? game.player2 : game.player1;
                
                await DB.updateLobbyGame(gameId, { status: 'finished', winner: opponent });
                
                // Track loss for the forfeiter
                await DB.incrementUserStats(me, 'caroLosses');
                await DB.incrementUserStats(opponent, 'caroWins');
                
                LobbyNeon.closeCaroBoard();
                Utils.showToast("Bạn đã rút lui khỏi trận đấu.", "info");
                return true;
            },
            'CHẤP NHẬN BẠI TRẬN',
            'QUAY LẠI ỨNG CHIẾN'
        );
    },

    toggleGameHub: () => {
        const hub = document.getElementById('lobby-game-hub');
        if (!hub) return;
        hub.classList.toggle('collapsed');
    },

    switchHubTab: (tab) => {
        const tabPlayers = document.getElementById('hub-tab-players');
        const tabMonopoly = document.getElementById('hub-tab-monopoly');
        const tabQuests = document.getElementById('hub-tab-quests');
        const contentPlayers = document.getElementById('hub-content-players');
        const contentMonopoly = document.getElementById('hub-content-monopoly');
        const contentQuests = document.getElementById('hub-content-quests');

        if (!tabPlayers || !tabMonopoly || !contentPlayers || !contentMonopoly) return;

        // Reset all
        [tabPlayers, tabMonopoly, tabQuests].forEach(t => t?.classList.remove('active'));
        [contentPlayers, contentMonopoly, contentQuests].forEach(c => { if(c) c.style.display = 'none'; });

        if (tab === 'players') {
            tabPlayers.classList.add('active');
            contentPlayers.style.display = 'block';
        } else if (tab === 'monopoly') {
            tabMonopoly.classList.add('active');
            contentMonopoly.style.display = 'block';
            GamesModule.activeTab = 'monopoly';
            GamesModule.renderTabContent();
        } else if (tab === 'quests') {
            tabQuests?.classList.add('active');
            if (contentQuests) {
                contentQuests.style.display = 'block';
                LobbyNeon.renderAdminQuestManager();
            }
        }
    },

    // ========== QUEST SYSTEM ==========
    updateMarquee: async (missionsData) => {
        const missions = missionsData || await DB.getMissions();
        const me = Auth.currentUser?.username;
        const unaccepted = missions.filter(m => 
            m.status === 'active' && 
            (m.targetUser === 'all' || m.targetUser === me) &&
            (!m.acceptedBy || !m.acceptedBy.includes(me))
        );

        const container = document.getElementById('global-marquee-container');
        if (!container) return;

        if (unaccepted.length > 0) {
            const list = unaccepted.map(m => `THÁNH CHỈ MỚI: ${m.title}`).join(" | ");
            container.innerHTML = `
                <div class="lobby-marquee-bar">
                    <div class="marquee-text">
                        <span style="font-size: 20px;">📢</span> 
                        <span style="text-transform: uppercase;">Nhân viên ${me} có nhiệm vụ mới:</span> 
                        ${list} - Hãy tới gặp QUEST MASTER ADMIN ngay! 📜
                    </div>
                </div>
            `;
        } else {
            container.innerHTML = '';
        }
    },

    openQuestBoard: async () => {
        const missions = await DB.getMissions();
        const me = Auth.currentUser?.username;
        // Filter for all users or specific me
        const activeMissions = missions.filter(m => m.status === 'active' && (!m.targetUser || m.targetUser === 'all' || m.targetUser === me));

        Utils.showModal(
            '📜 BẢNG NHIỆM VỤ HOÀNG GIA',
            `<div style="max-height: 400px; overflow-y: auto; padding: 10px;">
                ${activeMissions.length === 0 ? `
                    <div style="text-align: center; color: #64748b; padding: 40px 0;">
                        <div style="font-size: 40px; margin-bottom: 10px;">🏮</div>
                        Hiện chưa có nhiệm vụ mới từ Admin NPC.<br>Hãy quay lại sau nhé!
                    </div>
                ` : activeMissions.map(m => {
                    const isAccepted = m.acceptedBy && m.acceptedBy.includes(me);
                    const deadlineStr = m.deadline ? new Date(m.deadline).toLocaleDateString('vi-VN') : 'Không giới hạn';
                    
                    return `
                    <div style="background: rgba(15, 23, 42, 0.95); border: 2px solid ${isAccepted ? '#10b981' : '#fbbf24'}; border-radius: 12px; padding: 20px; margin-bottom: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); position: relative; overflow: hidden; z-index: 10;">
                        <div style="position: absolute; top: -10px; right: -10px; font-size: 40px; opacity: 0.1; transform: rotate(15deg);">${m.type === 'daily' ? '📅' : '🏆'}</div>
                        
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                            <span style="font-size: 10px; font-weight: 900; color: ${isAccepted ? '#10b981' : '#fbbf24'}; text-transform: uppercase; background: rgba(0,0,0,0.2); padding: 2px 8px; border-radius: 6px; border: 1px solid ${isAccepted ? '#10b981' : '#fbbf24'};">
                                ${m.type === 'daily' ? 'Nhiệm vụ Ngày' : 'Thách thức Tháng'}
                            </span>
                            <span style="font-size: 11px; font-weight: 800; color: #10b981;">💰 +${m.reward}đ Công Đức</span>
                        </div>

                        <h4 style="margin: 0 0 6px 0; color: #fff; font-size: 16px;">${m.title}</h4>
                        <div style="font-size: 10px; color: #94a3b8; margin-bottom: 10px; font-style: italic;">
                            ⏰ Hạn hoàn thành: <span style="color: #cbd5e1;">${deadlineStr}</span>
                        </div>
                        <p style="margin: 0; color: #e2e8f0; font-size: 12.5px; line-height: 1.5; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 6px;">${m.description}</p>
                        
                        ${isAccepted ? `
                            <div style="margin-top: 15px; text-align: center; color: #10b981; font-weight: 900; font-size: 14px; letter-spacing: 1px; padding: 10px; background: rgba(16, 185, 129, 0.1); border-radius: 8px;">
                                ✔️ ĐÃ TIẾP NHẬN THÁNH CHỈ
                            </div>
                        ` : `
                            <button onclick="LobbyNeon.acceptMission('${m.id}')" style="margin-top: 15px; width: 100%; padding: 12px; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); border: none; border-radius: 8px; color: #000; font-weight: 900; font-size: 14px; cursor: pointer; transition: all 0.3s; box-shadow: 0 4px 15px rgba(251,191,36,0.4); text-transform: uppercase; letter-spacing: 1px;">
                                TIẾP NHẬN NHIỆM VỤ
                            </button>
                        `}
                    </div>
                `}).join('')}
            </div>`,
            null,
            'ĐÓNG BẢNG'
        );
    },

    acceptMission: async (missionId) => {
        const me = Auth.currentUser?.username;
        if (!me) return;
        
        try {
            const missions = await DB.getMissions();
            const mission = missions.find(m => m.id === missionId);
            if (!mission) return;

            const acceptedBy = mission.acceptedBy || [];
            if (!acceptedBy.includes(me)) {
                acceptedBy.push(me);
                await db.collection("missions").doc(missionId).update({ acceptedBy });
                Utils.showToast("Đã tiếp nhận thánh chỉ! Hãy cố gắng hoàn thành nhé.", "success");
                LobbyNeon.openQuestBoard(); // Rerender board
                LobbyNeon.updateMarquee();  // Update marquee
            }
        } catch (e) {
            console.error("Accept mission error:", e);
            Utils.showToast("Lỗi khi nhận nhiệm vụ!", "error");
        }
    },

    renderAdminQuestManager: async () => {
        const container = document.getElementById('hub-content-quests');
        if (!container) return;

        const missions = await DB.getMissions();
        const accounts = await Auth.getAccounts();

        container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <div style="background: rgba(251,191,36,0.1); border: 1px dashed #fbbf24; padding: 12px; border-radius: 8px;">
                    <h4 style="margin: 0 0 10px 0; font-size: 12px; color: #fbbf24;">🆕 BAN HÀNH THÁNH CHỈ MỚI</h4>
                    <input type="text" id="quest-title" placeholder="Tên nhiệm vụ..." style="width: 100%; padding: 8px; background: rgba(0,0,0,0.3); border: 1px solid #475569; border-radius: 4px; color: #fff; font-size: 12px; margin-bottom: 8px;">
                    <textarea id="quest-desc" placeholder="Mô tả công việc..." style="width: 100%; padding: 8px; background: rgba(0,0,0,0.3); border: 1px solid #475569; border-radius: 4px; color: #fff; font-size: 12px; margin-bottom: 8px; min-height: 60px;"></textarea>
                    
                    <div style="margin-bottom: 8px;">
                        <label style="display: block; font-size: 10px; color: #94a3b8; margin-bottom: 4px;">GIAO CHO:</label>
                        <select id="quest-target" style="width: 100%; padding: 8px; background: rgba(0,0,0,0.3); border: 1px solid #475569; border-radius: 4px; color: #fff; font-size: 11px;">
                            <option value="all">Tất cả mọi người</option>
                            ${accounts.map(acc => `<option value="${acc.username}">${Utils.getUserDisplayName(acc.username)} (@${acc.username})</option>`).join('')}
                        </select>
                    </div>

                    <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                        <div style="flex: 1;">
                            <label style="display: block; font-size: 10px; color: #94a3b8; margin-bottom: 4px;">LOẠI TẠP VỤ:</label>
                            <select id="quest-type" style="width: 100%; padding: 8px; background: rgba(0,0,0,0.3); border: 1px solid #475569; border-radius: 4px; color: #fff; font-size: 11px;">
                                <option value="daily">Ngày</option>
                                <option value="monthly">Tháng</option>
                            </select>
                        </div>
                        <div style="flex: 1;">
                            <label style="display: block; font-size: 10px; color: #94a3b8; margin-bottom: 4px;">THƯỞNG (điểm):</label>
                            <select id="quest-reward" style="width: 100%; padding: 8px; background: rgba(0,0,0,0.3); border: 1px solid #475569; border-radius: 4px; color: #fff; font-size: 11px;">
                                <option value="1">1 điểm</option>
                                <option value="2">2 điểm</option>
                                <option value="3">3 điểm</option>
                                <option value="4">4 điểm</option>
                                <option value="5">5 điểm VIP</option>
                            </select>
                        </div>
                    </div>

                    <div style="margin-bottom: 12px;">
                        <label style="display: block; font-size: 10px; color: #94a3b8; margin-bottom: 4px;">THỜI HẠN (DEADLINE):</label>
                        <input type="date" id="admin-quest-deadline-input" value="${(() => {
                            const now = new Date();
                            const year = now.getFullYear();
                            const month = String(now.getMonth() + 1).padStart(2, '0');
                            const day = String(now.getDate()).padStart(2, '0');
                            return `${year}-${month}-${day}`;
                        })()}" style="width: 100%; padding: 8px; background: rgba(0,0,0,0.3); border: 1px solid #475569; border-radius: 4px; color: #fff; font-size: 11px;">
                    </div>

                    <button onclick="LobbyNeon.adminCreateMission()" class="btn-neon" style="width: 100%; font-size: 11px; padding: 10px; font-weight: 800; background: linear-gradient(135deg, #fbbf24, #d97706); border: none; color: #000; box-shadow: 0 4px 15px rgba(217,119,6,0.3);">PHÁT THÁNH CHỈ</button>
                </div>

                <div style="border-top: 1.5px solid rgba(255,255,255,0.1); padding-top: 10px;">
                    <h4 style="margin: 0 0 10px 0; font-size: 11px; color: #94a3b8; text-transform: uppercase; display: flex; justify-content: space-between;">
                        <span>LỊCH SỬ THÁNH CHỈ</span>
                        <span style="font-size: 9px; opacity: 0.6;">(Mới nhất lên đầu)</span>
                    </h4>
                    ${missions.map(m => `
                        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div style="font-size: 11px; font-weight: bold; color: #fff;">${m.title}</div>
                                <div style="font-size: 9px; color: ${m.type === 'daily' ? '#38bdf8' : '#fbbf24'};">
                                    ${m.type === 'daily' ? 'Ngày' : 'Tháng'} | ${m.reward}đ | ${m.deadline ? new Date(m.deadline).toLocaleDateString('vi-VN') : 'ko'} | ${m.targetUser === 'all' ? 'Tất cả' : '@' + m.targetUser}
                                </div>
                            </div>
                            <button onclick="LobbyNeon.adminDeleteMission('${m.id}')" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 14px; transition: 0.2s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">🗑️</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    adminCreateMission: async () => {
        const title = document.getElementById('quest-title').value;
        const description = document.getElementById('quest-desc').value;
        const type = document.getElementById('quest-type').value;
        const reward = parseInt(document.getElementById('quest-reward').value);
        const targetUser = document.getElementById('quest-target').value;
        const deadline = document.getElementById('admin-quest-deadline-input').value;

        if (!title || !description || isNaN(reward)) {
            Utils.showToast("Vui lòng nhập đầy đủ thông tin!", "warning");
            return;
        }

        const id = await DB.createMission({ 
            title, 
            description, 
            type, 
            reward, 
            targetUser, 
            deadline: deadline || null,
            acceptedBy: [], // Track who accepted
            status: 'active' 
        });

        if (id) {
            Utils.showToast("Đã ban hành thánh chỉ mới!", "success");
            LobbyNeon.renderAdminQuestManager();
            
            // Send a system message to chat
            const targetText = targetUser === 'all' ? "tất cả mọi người" : `@${targetUser}`;
            await DB.sendLobbyChat({ sender: "Hệ Thống", text: `📜 Admin vừa ban hành nhiệm vụ mới dành cho ${targetText}: "${title}"!` });
            
            // Trigger marquee for everyone
            LobbyNeon.updateMarquee();
        }
    },

    adminDeleteMission: async (id) => {
        if (!confirm("Bạn có chắc muốn xóa nhiệm vụ này?")) return;
        const success = await DB.deleteMission(id);
        if (success) {
            Utils.showToast("Đã xóa nhiệm vụ.", "info");
            LobbyNeon.renderAdminQuestManager();
        }
    },

    updateHubPlayers: (allUsers) => {
        const container = document.getElementById('hub-content-players');
        if (!container) return;

        const now = Date.now();
        const me = Auth.currentUser?.username;

        const activeUsers = Object.entries(allUsers)
            .filter(([username, data]) => {
                if (username === me) return false;
                if (data.lastSeen && data.lastSeen.toDate) {
                    const diff = now - data.lastSeen.toDate().getTime();
                    return diff <= 60000;
                }
                return true;
            });

        const countEl = document.getElementById('hub-online-count');
        if (countEl) {
            countEl.textContent = `🟢 ${activeUsers.length + 1} ONLINE`;
        }

        if (activeUsers.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: #64748b; font-size: 12px; padding: 40px 10px;">
                    <i class="fa-solid fa-user-clock" style="font-size: 24px; margin-bottom: 12px; display: block; color: #475569;"></i>
                    Chưa có đồng nghiệp nào khác ở sảnh chờ. Nhắn tin rủ họ vào sảnh nhé!
                </div>
            `;
            return;
        }

        container.innerHTML = activeUsers.map(([username, data]) => {
            const displayName = data.chibiConfig?.fullname || username;
            const color = data.chibiConfig?.skinColor || '#6366f1';
            return `
                <div class="hub-player-row">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 10px; height: 10px; border-radius: 50%; background: ${color}; box-shadow: 0 0 6px ${color};"></div>
                        <div style="text-align: left;">
                            <div style="font-size: 12px; font-weight: bold; color: #fff;">@${username}</div>
                            <div style="font-size: 10px; color: #64748b;">${displayName}</div>
                        </div>
                    </div>
                    <button onclick="LobbyNeon.showUserMenu('${username}')" style="padding: 6px 12px; background: rgba(0, 243, 255, 0.1); border: 1.5px solid #00f3ff; border-radius: 6px; color: #00f3ff; font-size: 10px; cursor: pointer; font-weight: bold; transition: all 0.2s;" onmouseover="this.style.background='#00f3ff'; this.style.color='#000'" onmouseout="this.style.background='rgba(0, 243, 255, 0.1)'; this.style.color='#00f3ff';">
                        ⚔️ THÁCH ĐẤU
                    </button>
                </div>
            `;
        }).join('');
    }
};
