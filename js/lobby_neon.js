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
        npcPos: { x: 955, y: 340 },
        leaderboardPos: { x: 755, y: 340 },
        marqueeInterval: null,
        unsubscribeMissions: null,
        notifiedMissionIds: new Set(),
        activeQuestTab: 'new'
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
        
        // Render NPC & Monument with delay
        setTimeout(() => {
            LobbyNeon.renderQuestNPC();
            LobbyNeon.renderLeaderboardMonument();
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

        // Track which missions we've already shown a popup for
        if (!LobbyNeon.state.notifiedMissionIds) {
            LobbyNeon.state.notifiedMissionIds = new Set();
        }

        LobbyNeon.state.unsubscribeMissions = DB.listenMissions((missions) => {
            LobbyNeon.updateMarquee(missions);
            // If admin board is open, refresh it
            if (document.getElementById('hub-content-quests')) {
                LobbyNeon.renderAdminQuestManager();
            }

            // === MISSION ARRIVAL POPUP ===
            const me = Auth.currentUser?.username;
            if (!me) return;

            // Find new missions that target this user and are unaccepted
            const myPending = missions.filter(m =>
                m.status === 'active' &&
                (m.targetUser === 'all' || m.targetUser === me) &&
                (!m.acceptedBy || !m.acceptedBy.includes(me)) &&
                !LobbyNeon.state.notifiedMissionIds.has(m.id)
            );

            if (myPending.length > 0) {
                // Mark as notified so we don't show again
                myPending.forEach(m => LobbyNeon.state.notifiedMissionIds.add(m.id));

                const missionList = myPending.map(m =>
                    `<div style="background: rgba(251,191,36,0.1); border: 1px solid #fbbf24; border-radius: 8px; padding: 12px; margin-bottom: 8px; text-align: left;">
                        <div style="font-weight: 900; color: #fbbf24; font-size: 14px;">📜 ${m.title}</div>
                        <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">${m.description || ''}</div>
                        <div style="font-size: 11px; color: #10b981; margin-top: 6px;">⚡ Thưởng: +${m.reward * 80} EXP</div>
                    </div>`
                ).join('');

                Utils.showModal(
                    '⚔️ THÁNH CHỈ MỚI TỪ ADMIN!',
                    `<div style="text-align: center; max-height: 400px; overflow-y: auto;">
                        <div style="font-size: 60px; margin-bottom: 12px; animation: float 2s ease-in-out infinite;">📜</div>
                        <p style="font-size: 16px; color: #fbbf24; font-weight: 800; margin-bottom: 16px; text-transform: uppercase;">
                            Hỡi chiến binh ${me}! Ngươi có ${myPending.length} nhiệm vụ mới!
                        </p>
                        ${missionList}
                        <p style="font-size: 13px; color: #94a3b8; margin-top: 12px; font-style: italic;">
                            Nhấn nút bên dưới để tới Sảnh Chờ và tiếp nhận nhiệm vụ từ Quest Master Admin!
                        </p>
                    </div>`,
                    () => {
                        // Auto-navigate to Lobby and open Quest Board
                        if (typeof app !== 'undefined') {
                            app.navigateTo('lobby-view');
                        }
                        // Wait for lobby to render, then open quest board
                        setTimeout(() => {
                            if (typeof LobbyNeon !== 'undefined') {
                                LobbyNeon.openQuestBoard();
                            }
                        }, 1500);
                        return true;
                    },
                    'VÀO SẢNH NHẬN NHIỆM VỤ NGAY!',
                    'ĐỂ SAU'
                );
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
                    background: rgba(251, 191, 36, 0.08); /* Increase visibility slightly */
                    border: 1px solid rgba(251, 191, 36, 0.3);
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    overflow: hidden;
                    position: relative;
                }
                .marquee-text-wrapper {
                    display: flex;
                    white-space: nowrap;
                    animation: marquee_seamless 40s linear infinite;
                }
                .marquee-text-content {
                    padding-right: 100px; /* Gap between repetitions */
                    font-size: 14px;
                    font-weight: 800;
                    color: #fbbf24;
                    text-transform: uppercase;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }
                @keyframes marquee_seamless {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
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
                            <span class="lobby-msg-text" style="color: #a855f7; font-style: italic; opacity: 0.8;">🤖 Hệ thống: Sảnh Chibi Neon đã mở cửa ngày mới! Click chuột để lướt đi như một cơn gió, chúc thí chủ ngày mới bớt khẩu nghiệp, cày cuốc hăng say!</span>
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
            const userLevel = Auth.currentUser?.level || 1;
            const titleInfo = Auth.getLevelTitle(userLevel);
            el.innerHTML = `
                <div class="lobby-user-name">${username} <span style="font-size: 9px; color: ${titleInfo.color}; font-weight: 900; opacity: 0.9;">${titleInfo.title}</span></div>
                ${isMe && typeof Auth !== 'undefined' ? Auth.renderExpBar(Auth.currentUser?.exp || 0, userLevel, true) : ''}
                <div class="lobby-chibi-container" style="transform: scale(1.3);${titleInfo.glow ? ' filter: drop-shadow(0 0 8px ' + titleInfo.color + '60);' : ''}">${chibiSvg}</div>
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

    renderLeaderboardMonument: () => {
        console.log("LobbyNeon.renderLeaderboardMonument starting...");
        const map = document.getElementById('lobby-map');
        if (!map) {
            console.error("Monument Error: lobby-map not found");
            return;
        }

        const monumentId = 'npc-leaderboard';
        let el = document.getElementById(monumentId);

        if (!el) {
            el = document.createElement('div');
            el.id = monumentId;
            el.className = 'lobby-user-wrapper npc';
            el.style.position = 'absolute';
            el.style.cursor = 'help';
            el.onclick = (e) => {
                e.stopPropagation();
                LobbyNeon.openGeneralLeaderboard();
            };
            map.appendChild(el);
            console.log("Leaderboard monument element created and appended to map");
        }

        // Tạo tượng chibi hoàng kim làm Bia Đá Vinh Danh
        const statueConfig = {
            gender: 'nu',
            skinColor: '#fbbf24', // Màu vàng hoàng kim
            hairStyle: 2,
            hairColor: '#d97706', // Màu cam đất đậm
            topStyle: 3,
            topColor: '#fbbf24',  // Áo vàng
            bottomStyle: 3,
            bottomColor: '#d97706',
            shoeStyle: 1,
            shoeColor: '#b45309',
            accessory: 4,         // Vương miện hoàng hậu
            wing: 3,              // Cánh thiên thần
            aura: 4,              // Golden Aura
            gear: 0,
            mount: 0,
            dragon: 1             // Hỏa Long bay quanh tượng
        };

        let chibiSvg = ChibiModule.renderChibiSVG(statueConfig, true, 88);

        // Position on the left side of the throne (symmetric with Quest NPC)
        const tx = 755, ty = 340;
        LobbyNeon.state.leaderboardPos = { x: tx, y: ty };

        el.style.left = `${tx}px`;
        el.style.top = `${ty}px`;

        el.innerHTML = `
            <div class="lobby-user-name" style="color: #00f3ff; background: rgba(0,0,0,0.8); padding: 4px 12px; border: 2px solid #00f3ff; border-radius: 20px; font-weight: 800; font-size: 14px; white-space: nowrap; box-shadow: 0 0 10px rgba(0,243,255,0.5);">🏆 BIA ĐÁ VINH DANH</div>
            <div class="lobby-quest-icon" style="position: absolute; top: -85px; left: 50%; transform: translateX(-50%); font-size: 40px; animation: float 2.3s infinite ease-in-out; filter: drop-shadow(0 0 15px #00f3ff); z-index: 10;">🏆</div>
            <div class="lobby-chibi-container" style="transform: scale(1.8); filter: drop-shadow(0 0 20px rgba(0,243,255,0.6)); pointer-events: none;">${chibiSvg}</div>
            <div class="lobby-user-status" style="background: #00f3ff; border: none; color: #000; padding: 4px 16px; font-weight: 900; border-radius: 4px; font-size: 11px; margin-top: 10px; box-shadow: 0 0 15px #00f3ff;">✨ XEM BẢNG VÀNG</div>
        `;
        console.log("Leaderboard Monument render complete at", tx, ty);
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

        // Check proximity to Quest NPC
        const dx = x - LobbyNeon.state.npcPos.x;
        const dy = y - LobbyNeon.state.npcPos.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 80) {
            LobbyNeon.openQuestBoard();
            return;
        }

        // Check proximity to Leaderboard Monument
        if (LobbyNeon.state.leaderboardPos) {
            const dxLd = x - LobbyNeon.state.leaderboardPos.x;
            const dyLd = y - LobbyNeon.state.leaderboardPos.y;
            const distLd = Math.sqrt(dxLd*dxLd + dyLd*dyLd);
            if (distLd < 80) {
                LobbyNeon.openGeneralLeaderboard();
            }
        }
    },

    moveTo: async (x, y) => {
        const oldPos = LobbyNeon.state.myPos || { x, y };
        LobbyNeon.state.myPos = { x, y };
        const user = Auth.currentUser;
        LobbyNeon.renderUser(user.username, x, y, user.profile?.chibiConfig);
        
        // Hiệu ứng dấu chân khi di chuyển (từ cấp 5+)
        const userLevel = user?.level || 1;
        if (userLevel >= 5) {
            const map = document.getElementById('lobby-map');
            if (map) {
                const titleInfo = Auth.getLevelTitle(userLevel);
                const footprintCount = userLevel >= 12 ? 5 : 3;
                const dx = x - oldPos.x;
                const dy = y - oldPos.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist > 30) {
                    for (let i = 0; i < footprintCount; i++) {
                        setTimeout(() => {
                            const fp = document.createElement('div');
                            const progress = (i + 1) / (footprintCount + 1);
                            const fpX = oldPos.x + dx * progress + (Math.random() - 0.5) * 15;
                            const fpY = oldPos.y + dy * progress + (Math.random() - 0.5) * 10;
                            const isFireStep = userLevel >= 12;
                            const isGoldStep = userLevel >= 15;
                            fp.style.cssText = `
                                position: absolute; left: ${fpX}px; top: ${fpY + 60}px; z-index: 5;
                                font-size: ${isFireStep ? '16px' : '12px'};
                                opacity: 0.8; pointer-events: none;
                                animation: footprintFade 1.2s forwards ease-out;
                                ${isFireStep ? 'filter: drop-shadow(0 0 6px ' + (isGoldStep ? '#fbbf24' : '#ef4444') + ');' : ''}
                            `;
                            fp.textContent = isGoldStep ? '✨' : isFireStep ? '🔥' : '✧';
                            map.appendChild(fp);
                            setTimeout(() => fp.remove(), 1200);
                        }, i * 80);
                    }
                }
            }
        }
        
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

        // Reset chat theo ngày mới: Chỉ hiển thị các tin nhắn được gửi trong ngày hôm nay
        const todayStr = new Date().toDateString();
        const todayMessages = messages.filter(msg => {
            if (!msg.timestamp) return true; // Hiển thị tin nhắn đang chờ gửi
            const msgDate = msg.timestamp.toDate ? msg.timestamp.toDate() : new Date(msg.timestamp);
            return msgDate.toDateString() === todayStr;
        });

        let html = `<div class="lobby-message"><span class="lobby-msg-text" style="color: #a855f7; font-style: italic; opacity: 0.8;">🤖 Hệ thống: Sảnh Chibi Neon đã mở cửa ngày mới! Click chuột để lướt đi như một cơn gió, chúc thí chủ ngày mới bớt khẩu nghiệp, cày cuốc hăng say!</span></div>`;
        
        // Show bubbles for the latest message if it's new and of today
        const lastMsg = todayMessages[todayMessages.length - 1];
        if (lastMsg) {
            LobbyNeon.showChatBubble(lastMsg.sender, lastMsg.text);
        }

        todayMessages.forEach(msg => {
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

        // Lấy level của user để tùy chỉnh bong bóng
        let bubbleStyle = '';
        if (typeof Auth !== 'undefined') {
            // Tìm level của user này
            let userLevel = 1;
            if (Auth.currentUser && Auth.currentUser.username === username) {
                userLevel = Auth.currentUser.level || 1;
            }
            const titleInfo = Auth.getLevelTitle(userLevel);
            if (userLevel >= 5 && titleInfo.bubbleColor) {
                const isGradient = titleInfo.bubbleColor.includes('gradient');
                bubbleStyle = `
                    ${isGradient ? 'background: ' + titleInfo.bubbleColor + ';' : 'background: ' + titleInfo.bubbleColor + ';'}
                    color: #fff;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                    ${titleInfo.bubbleGlow !== 'none' ? 'box-shadow: ' + titleInfo.bubbleGlow + ';' : ''}
                    border: 1px solid rgba(255,255,255,0.2);
                `;
            }
        }

        const bubble = document.createElement('div');
        bubble.className = 'lobby-chat-bubble';
        if (bubbleStyle) bubble.style.cssText += bubbleStyle;
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
        if (!me) return;

        // Collect all active missions that are unaccepted by their specific targets
        const pendingMissions = missions.filter(m => {
            if (m.status !== 'active') return false;
            if (m.targetUser === 'all') {
                return !m.acceptedBy || !m.acceptedBy.includes(me);
            } else {
                return !m.acceptedBy || !m.acceptedBy.includes(m.targetUser);
            }
        });

        const container = document.getElementById('global-marquee-container');
        if (!container) return;

        if (pendingMissions.length > 0) {
            const texts = pendingMissions.map(m => {
                const target = m.targetUser === 'all' ? 'TẤT CẢ' : `@${m.targetUser}`;
                return `[${m.title}] CHỜ ${target} TIẾP NHẬN`;
            });
            const fullText = `📢 QUAN TRỌNG: ${texts.join(" | ")} — HÃY TỚI GẶP QUEST MASTER ADMIN NGAY! 📜`;
            
            // Seamless loop by doubling content
            container.innerHTML = `
                <div class="lobby-marquee-bar">
                    <div class="marquee-text-wrapper">
                        <div class="marquee-text-content">${fullText}</div>
                        <div class="marquee-text-content">${fullText}</div>
                    </div>
                </div>
            `;
        } else {
            container.innerHTML = '';
        }
    },

    openQuestBoard: async (activeTabOverride = null) => {
        const missions = await DB.getMissions();
        const me = Auth.currentUser?.username;
        if (!me) return;

        if (activeTabOverride) {
            LobbyNeon.state.activeQuestTab = activeTabOverride;
        }
        
        let activeTab = LobbyNeon.state.activeQuestTab || 'new';
        if (activeTab !== 'new' && activeTab !== 'ongoing') {
            activeTab = 'new';
        }

        // Filter missions
        const myMissions = missions.filter(m => m.status === 'active' && (!m.targetUser || m.targetUser === 'all' || m.targetUser === me));
        
        // Split by status: New (not accepted) vs Ongoing (accepted but not completed)
        const newMissions = myMissions.filter(m => !m.acceptedBy || !m.acceptedBy.includes(me));
        const ongoingMissions = myMissions.filter(m => 
            (m.acceptedBy && m.acceptedBy.includes(me)) && 
            (!m.completedBy || !m.completedBy.includes(me))
        );

        const currentMissions = activeTab === 'new' ? newMissions : ongoingMissions;

        const tabStyles = (tab) => `
            flex: 1; padding: 12px; text-align: center; cursor: pointer; font-size: 11px; font-weight: 900;
            border-bottom: 2px solid ${activeTab === tab ? '#fbbf24' : 'transparent'};
            color: ${activeTab === tab ? '#fbbf24' : '#94a3b8'};
            background: ${activeTab === tab ? 'rgba(251,191,36,0.05)' : 'transparent'};
            transition: 0.3s;
        `;

        const contentHtml = `
            <div style="display: flex; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 15px;">
                <div onclick="LobbyNeon.openQuestBoard('new')" style="${tabStyles('new')}">NHIỆM VỤ MỚI (${newMissions.length})</div>
                <div onclick="LobbyNeon.openQuestBoard('ongoing')" style="${tabStyles('ongoing')}">ĐANG THỰC HIỆN (${ongoingMissions.length})</div>
            </div>
            
            <div style="max-height: 400px; overflow-y: auto; padding: 5px;">
                ${currentMissions.length === 0 ? `
                    <div style="text-align: center; color: #64748b; padding: 40px 0;">
                        <div style="font-size: 40px; margin-bottom: 10px;">${activeTab === 'new' ? '🏮' : '⚔️'}</div>
                        ${activeTab === 'new' ? 'Hiện chưa có nhiệm vụ mới từ Admin.' : 'Bạn đã gánh hết sạch nhiệm vụ rồi, hảo hán!'}
                    </div>
                ` : currentMissions.map(m => {
                    const deadlineStr = m.deadline ? new Date(m.deadline).toLocaleDateString('vi-VN') : 'Không giới hạn';
                    
                    return `
                    <div style="background: rgba(15, 23, 42, 0.95); border: 2px solid ${activeTab === 'ongoing' ? '#10b981' : '#fbbf24'}; border-radius: 12px; padding: 20px; margin-bottom: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); position: relative; overflow: hidden;">
                        <div style="position: absolute; top: -10px; right: -10px; font-size: 40px; opacity: 0.1; transform: rotate(15deg);">${m.type === 'daily' ? '📅' : '🏆'}</div>
                        
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                            <span style="font-size: 10px; font-weight: 900; color: ${activeTab === 'ongoing' ? '#10b981' : '#fbbf24'}; text-transform: uppercase; background: rgba(0,0,0,0.2); padding: 2px 8px; border-radius: 6px; border: 1px solid ${activeTab === 'ongoing' ? '#10b981' : '#fbbf24'};">
                                ${m.type === 'daily' ? 'Nhiệm vụ Ngày' : 'Thách thức Tháng'}
                            </span>
                            <span style="font-size: 11px; font-weight: 800; color: #10b981;">⚡ +${m.reward * 80} EXP</span>
                        </div>

                        <h4 style="margin: 0 0 6px 0; color: #fff; font-size: 16px;">${m.title}</h4>
                        <div style="font-size: 10px; color: #94a3b8; margin-bottom: 10px; font-style: italic;">
                            ⏰ Hạn hoàn thành: <span style="color: #cbd5e1;">${deadlineStr}</span>
                        </div>
                        <p style="margin: 0; color: #e2e8f0; font-size: 12.5px; line-height: 1.5; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 6px;">${m.description}</p>
                        
                        ${activeTab === 'new' ? `
                            <button onclick="LobbyNeon.acceptMission('${m.id}')" style="margin-top: 15px; width: 100%; padding: 12px; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); border: none; border-radius: 8px; color: #000; font-weight: 900; font-size: 14px; cursor: pointer; box-shadow: 0 4px 15px rgba(251,191,36,0.4); text-transform: uppercase;">
                                TIẾP NHẬN NHIỆM VỤ
                            </button>
                        ` : `
                            <button onclick="LobbyNeon.submitMission('${m.id}')" style="margin-top: 15px; width: 100%; padding: 12px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border: none; border-radius: 8px; color: #fff; font-weight: 900; font-size: 14px; cursor: pointer; box-shadow: 0 4px 15px rgba(16,185,129,0.4); text-transform: uppercase;">
                                HOÀN THÀNH NHIỆM VỤ
                            </button>
                        `}
                    </div>
                `}).join('')}
            </div>`;

        Utils.showModal('📜 BẢNG NHIỆM VỤ HOÀNG GIA', contentHtml, null, 'ĐÓNG BẢNG');
    },

    openGeneralLeaderboard: async () => {
        const accounts = await Auth.getAccounts();
        const missions = await DB.getMissions();
        
        // Tính EXP xếp hạng từ hoàn thành các quest
        const stats = {};
        missions.forEach(m => {
            if (m.completedBy && Array.isArray(m.completedBy)) {
                m.completedBy.forEach(u => {
                    stats[u] = (stats[u] || 0) + ((m.reward || 0) * 80);
                });
            }
        });

        // Merge with account level data
        const sorted = Object.entries(stats)
            .map(([username, totalExp]) => {
                const acc = accounts.find(a => a.username === username);
                return { username, totalExp, level: acc?.level || 1, exp: acc?.exp || 0 };
            })
            .sort((a, b) => b.exp - a.exp || b.totalExp - a.totalExp);

        let bodyHtml = '';
        if (sorted.length === 0) {
            bodyHtml = `
                <div style="text-align: center; color: #64748b; padding: 50px 0;">
                    <div style="font-size: 50px; margin-bottom: 15px;">💤</div>
                    <p style="font-size: 14px; font-style: italic; color: #94a3b8; margin: 0;">Chưa có cao thủ nào khắc tên lên Bia Đá Vinh Danh!</p>
                    <p style="font-size: 12px; color: #64748b; margin-top: 5px;">Admin đang ôm đống Công Đức chán chường chờ đợi nhân sĩ giang hồ tới cướp bóc...</p>
                </div>
            `;
        } else {
            bodyHtml = `
                <div style="background: rgba(15, 23, 42, 0.85); border-radius: 16px; overflow: hidden; border: 1px solid rgba(0, 243, 255, 0.2); box-shadow: 0 0 20px rgba(0, 243, 255, 0.15);">
                    <div style="padding: 15px 20px; background: rgba(0, 243, 255, 0.08); border-bottom: 1.5px solid rgba(0, 243, 255, 0.2); text-align: center;">
                        <span style="font-size: 12px; font-weight: 800; color: #00f3ff; text-transform: uppercase; letter-spacing: 1px;">Danh sách cao thủ cày EXP khét tiếng nhất</span>
                    </div>
                    <div style="max-height: 380px; overflow-y: auto; padding: 10px;">
                        ${sorted.map((u, i) => {
                            const levelTitleInfo = Auth.getLevelTitle(u.level);
                            let comment = '';
                            let rankColor = levelTitleInfo.color;
                            let rowBg = 'transparent';
                            let icon = '👤';

                            if (i === 0) {
                                comment = 'Top 1 Marketing! Sếp đang lo lắng vì bạn giỏi quá có khi nghỉ mất! 😰';
                                rowBg = 'rgba(251,191,36,0.08)';
                                icon = '🥇';
                            } else if (i === 1) {
                                comment = 'Suýt soát Top 1! Chỉ cần 1 cái Reels viral nữa là lật kèo! 📱';
                                rowBg = 'rgba(203,213,225,0.05)';
                                icon = '🥈';
                            } else if (i === 2) {
                                comment = 'Content ra đều đặn như đồng hồ Thụy Sĩ, chỉ khác là rẻ hơn! ⌚';
                                rowBg = 'rgba(205,127,50,0.05)';
                                icon = '🥉';
                            } else if (i < 10) {
                                const midComments = [
                                    'Cày content chăm hơn cày rank Liên Quân. Đáng khen! 🎮',
                                    'Poster ra nhanh hơn shipper giao hàng! 🛵',
                                    'Canva Pro sợ bạn dùng hết bandwidth! 🎨',
                                    'Tay đánh máy nhanh hơn tay pha cà phê! ☕',
                                ];
                                comment = midComments[i % midComments.length];
                                icon = '🎖️';
                            } else {
                                comment = 'Đang bận nghĩ content viral hoặc đang scroll TikTok "tham khảo"... 📵';
                                icon = '🚶';
                            }

                            const displayName = Utils.getUserDisplayName(u.username);
                            
                            return `
                                <div style="display: flex; align-items: center; padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); background: ${rowBg}; border-radius: 8px; margin-bottom: 8px; border: 1px solid ${i < 3 ? 'rgba(255,255,255,0.05)' : 'transparent'};">
                                    <!-- Hạng và Icon -->
                                    <div style="width: 40px; font-weight: 900; color: ${rankColor}; font-size: 18px; display: flex; align-items: center; gap: 4px;">
                                        ${icon}
                                    </div>
                                    
                                    <!-- Thông tin nhân sĩ -->
                                    <div style="flex: 1; min-width: 0; padding-right: 10px;">
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <span style="font-weight: 800; color: #fff; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                                ${displayName}
                                            </span>
                                            <span style="font-size: 10px; font-weight: 900; color: ${rankColor}; text-transform: uppercase; background: rgba(0,0,0,0.3); padding: 1px 6px; border-radius: 4px; border: 1px solid ${rankColor}33;">
                                                ${levelTitleInfo.title}
                                            </span>
                                        </div>
                                        <div style="font-size: 11px; color: #64748b; margin-top: 4px; font-style: italic; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${comment}">
                                            👉 ${comment}
                                        </div>
                                    </div>

                                    <!-- Điểm số & Level -->
                                    <div style="text-align: right;">
                                        <div style="font-weight: 900; color: #fbbf24; font-size: 16px; text-shadow: 0 0 10px rgba(251,191,36,0.3);">Lv.${u.level}</div>
                                        <div style="font-size: 9px; color: #64748b; text-transform: uppercase; font-weight: bold;">⚡ ${u.exp.toLocaleString()} EXP</div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        Utils.showModal('🏆 BẢNG VÀNG LẬP CÔNG - SẢNH CHIBI', bodyHtml, null, 'CÚT LUI');
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
                
                // Close board automatically
                const overlay = document.getElementById('modal-overlay');
                if (overlay) overlay.classList.remove('active');
                
                LobbyNeon.updateMarquee();
            }
        } catch (e) {
            console.error("Accept mission error:", e);
            Utils.showToast("Lỗi khi nhận nhiệm vụ!", "error");
        }
    },

    submitMission: async (missionId) => {
        const me = Auth.currentUser?.username;
        if (!me) return;
        
        try {
            const missions = await DB.getMissions();
            const mission = missions.find(m => m.id === missionId);
            if (!mission) return;

            const completedBy = mission.completedBy || [];
            if (!completedBy.includes(me)) {
                completedBy.push(me);
                await db.collection("missions").doc(missionId).update({ completedBy });
                
                // Cộng EXP cho user
                const expResult = await Auth.addExpToUser(me, mission.reward);
                
                Utils.showToast(`Hoàn thành! +${expResult.expGained} EXP${expResult.leveled ? ' 🎉 THĂNG CẤP lên ' + expResult.newLevel + '!' : ''}`, "success");
                
                // Close board automatically
                const overlay = document.getElementById('modal-overlay');
                if (overlay) overlay.classList.remove('active');
                
                // Chat notification with EXP
                await DB.sendLobbyChat({ sender: "Hệ Thống", text: `🎉 ĐẠI HỶ! Kỳ tài @${me} vừa phi thân ném thẳng báo cáo hoàn thành nhiệm vụ "${mission.title}" và ẵm gọn +${expResult.expGained} EXP!${expResult.leveled ? ' 🆙 THĂNG CẤP lên Cấp ' + expResult.newLevel + '! Giang hồ rúng động!' : ' Thật là bất khả chiến bại!'}` });
            }
        } catch (e) {
            console.error("Submit mission error:", e);
            Utils.showToast("Lỗi khi trả nhiệm vụ!", "error");
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
                            <label style="display: block; font-size: 10px; color: #94a3b8; margin-bottom: 4px;">THƯỞNG EXP:</label>
                            <select id="quest-reward" style="width: 100%; padding: 8px; background: rgba(0,0,0,0.3); border: 1px solid #475569; border-radius: 4px; color: #fff; font-size: 11px;">
                                <option value="1">⚡ 80 EXP (Đơn giản)</option>
                                <option value="2">⚡ 160 EXP (Vừa)</option>
                                <option value="3">⚡ 240 EXP (Khó)</option>
                                <option value="4">⚡ 320 EXP (Cao cấp)</option>
                                <option value="5">⚡ 400 EXP VIP (Siêu khó)</option>
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
                                    ${m.type === 'daily' ? 'Ngày' : 'Tháng'} | ⚡${m.reward * 80} EXP | ${m.deadline ? new Date(m.deadline).toLocaleDateString('vi-VN') : 'ko'} | ${m.targetUser === 'all' ? 'Tất cả' : '@' + m.targetUser}
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
            await DB.sendLobbyChat({ sender: "Hệ Thống", text: `⚡ THÁNH CHỈ BAN XUỐNG: Sếp Admin vừa hạ chỉ, ép buộc con dân ${targetText} phải gánh vác sứ mệnh: "${title}". Chậm trễ là bị phạt quét dọn sảnh chờ!` });
            
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
