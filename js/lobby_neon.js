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
        fashionNpcPos: { x: 350, y: 420 },
        battleNpcPos: { x: 565, y: 610 },
        lastFashionNpcTalkTime: 0,
        npcBanterInterval: null,
        rpgTimerInterval: null,
        marqueeInterval: null,
        unsubscribeMissions: null,
        notifiedMissionIds: new Set(),
        activeQuestTab: 'new',
        activeHubTab: 'players',
        selectedRpgZone: 'training_forest',
        vipUsers: new Set(),
        caroHackMode: false,
        caroDelayMs: 1500,
        caroHackTimeout: null
    },

    npcBanterQuotes: {
        'npc-admin': [
            "Thánh chỉ hôm nay: làm việc chăm, đừng mở tab giải trí quá lộ nha!",
            "Nhiệm vụ mới nóng hổi đây. Ai nhận rồi bỏ quên là tôi ghi sổ đó!",
            "Đi qua nhận nhiệm vụ đi, đứng ngắm tôi lâu quá tôi ngại!",
            "Hoàn thành task đi rồi hãy mơ làm trùm sảnh, chiến thần ơi!"
        ],
        'npc-leaderboard': [
            "Bảng vàng còn rộng lắm, tên bạn đâu rồi? Hay đang lạc trong deadline?",
            "Muốn lên top thì bớt ngắm avatar, thêm vài cú hoàn thành nhiệm vụ nhé!",
            "Top tháng này căng đấy. Ai chậm tay là tôi cho đứng hàng ghế nhựa!",
            "Bảng vinh danh không tự sáng đâu, phải có thành tích đổ vào mới lấp lánh!"
        ],
        'npc-fashion': [
            "Bộ đồ ổn rồi, nhưng thần thái thì cần thêm 200% tự tin nữa!",
            "Tóc hơi cháy, outfit hơi ngầu, ví tiền thì tôi không chịu trách nhiệm!",
            "Vào chỉnh avatar đi, đừng để nhân vật mặc đồ như vừa chạy deadline!",
            "Gu thời trang của bạn đang tải... mạng hơi yếu nhưng còn cứu được!"
        ],
        'npc-battle': [
            "Treo máy luyện công đi, deadline ngoài kia để sau cũng được... à mà đừng để sếp nghe thấy.",
            "Quái văn phòng vừa xuất hiện. Đánh nó lấy EXP, lấy đồ, lấy cả khí thế đi làm!",
            "Môn phái nào cũng mạnh, miễn là chịu cày đều tay.",
            "Skin chưởng đẹp không tự rơi xuống đâu. Quái rơi xuống thì có."
        ]
    },

    rpgClasses: {
        kiem_tong: {
            id: 'kiem_tong',
            name: 'Kiếm Tông',
            icon: '🗡️',
            color: '#22d3ee',
            desc: 'Cân bằng, EXP ổn định khi treo quái.',
            expMult: 1.08,
            lootMult: 1
        },
        phap_tong: {
            id: 'phap_tong',
            name: 'Pháp Tông',
            icon: '🔮',
            color: '#a78bfa',
            desc: 'Ưu tiên EXP, hợp người muốn lên cấp nhanh.',
            expMult: 1.2,
            lootMult: 0.92
        },
        anh_sat: {
            id: 'anh_sat',
            name: 'Ảnh Sát',
            icon: '🌙',
            color: '#f472b6',
            desc: 'Tăng tỉ lệ nhặt mảnh skin chưởng hiếm.',
            expMult: 0.96,
            lootMult: 1.24
        },
        thien_y: {
            id: 'thien_y',
            name: 'Thiên Y',
            icon: '🍃',
            color: '#34d399',
            desc: 'Tiết kiệm thể lực khi treo lâu.',
            expMult: 1,
            lootMult: 1.08,
            staminaDiscount: 0.85
        }
    },

    rpgZones: {
        training_forest: {
            id: 'training_forest',
            name: 'Rừng Deadline',
            icon: '🌲',
            monster: 'Quái Deadline',
            color: '#22c55e',
            danger: 'Dễ',
            minLevel: 1,
            staminaCost: 10,
            rewardPoints: 1,
            gold: 18,
            material: 'linhThach',
            materialName: 'Linh thạch',
            materialIcon: '💎'
        },
        ghost_cave: {
            id: 'ghost_cave',
            name: 'Hang Bug Ma',
            icon: '👻',
            monster: 'Bug Ma',
            color: '#f97316',
            danger: 'Vừa',
            minLevel: 3,
            staminaCost: 14,
            rewardPoints: 2,
            gold: 32,
            material: 'daCuongHoa',
            materialName: 'Đá cường hóa',
            materialIcon: '🪨'
        },
        secret_realm: {
            id: 'secret_realm',
            name: 'Ải Boss KPI',
            icon: '🐉',
            monster: 'Boss KPI',
            color: '#ef4444',
            danger: 'Khó',
            minLevel: 6,
            staminaCost: 20,
            rewardPoints: 3,
            gold: 56,
            material: 'longAn',
            materialName: 'Long ấn',
            materialIcon: '🔥'
        }
    },

    rpgDurations: [15, 30, 60],

    rpgSkins: {
        basic: {
            id: 'basic',
            name: 'Chưởng Cơ Bản',
            icon: '✨',
            color: '#38bdf8',
            desc: 'Hiệu ứng mặc định, rõ và nhẹ.',
            bonusText: 'Có sẵn'
        },
        fire_dragon: {
            id: 'fire_dragon',
            name: 'Hỏa Long Chưởng',
            icon: '🔥',
            color: '#f97316',
            desc: 'Tăng cảm giác uy lực khi treo Boss KPI.',
            shard: 'fireShard',
            shardName: 'Mảnh Hỏa Long',
            unlockNeed: 8,
            bonusText: '+5% EXP ở Ải Boss'
        },
        thunder: {
            id: 'thunder',
            name: 'Lôi Ảnh Chưởng',
            icon: '⚡',
            color: '#facc15',
            desc: 'Skin sáng, dễ nhận diện trong sảnh đông.',
            shard: 'thunderShard',
            shardName: 'Mảnh Lôi Ảnh',
            unlockNeed: 8,
            bonusText: '+5% vật phẩm'
        },
        moon_shadow: {
            id: 'moon_shadow',
            name: 'Nguyệt Ảnh Bộ',
            icon: '🌙',
            color: '#c084fc',
            desc: 'Hiệu ứng tím lạnh cho hệ Ảnh Sát.',
            shard: 'moonShard',
            shardName: 'Mảnh Nguyệt Ảnh',
            unlockNeed: 8,
            bonusText: '+1 mảnh khi may mắn'
        }
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

        // Cache VIP users for neon name effects
        try {
            if (typeof RewardsModule !== 'undefined') {
                const allRewards = await RewardsModule.loadData();
                LobbyNeon.state.vipUsers = new Set(allRewards
                    .filter(r => r.cardId === 'card_vip' && r.isUsed && (Date.now() - (r.usedAt || 0) < 30 * 24 * 60 * 60 * 1000))
                    .map(r => r.username ? r.username.toLowerCase() : '')
                );
            }
        } catch (e) { console.warn("Lobby VIP fetch error:", e); }

        LobbyNeon.renderLobbyBase();
        LobbyNeon.state.isConnected = true;
        
        LobbyNeon.renderUser(user.username, LobbyNeon.state.myPos.x, LobbyNeon.state.myPos.y, user.profile?.chibiConfig);
        
        // Render NPC & Monument with delay
        setTimeout(() => {
            LobbyNeon.renderQuestNPC();
            LobbyNeon.renderLeaderboardMonument();
            LobbyNeon.renderFashionNPC();
            LobbyNeon.renderBattlePortal();
            LobbyNeon.startNpcBanterLoop();
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
        if (LobbyNeon.state.npcBanterInterval) {
            clearInterval(LobbyNeon.state.npcBanterInterval);
            LobbyNeon.state.npcBanterInterval = null;
        }
        if (LobbyNeon.state.rpgTimerInterval) {
            clearInterval(LobbyNeon.state.rpgTimerInterval);
            LobbyNeon.state.rpgTimerInterval = null;
        }
        LobbyNeon.state.isConnected = false;
        LobbyNeon.state.currentGameId = null;
    },

    // ========== SYNC / PRESENCE ==========
    syncMyPresence: async () => {
        const user = Auth.currentUser;
        if (!user) return;
        try {
            const isVip = LobbyNeon.state.vipUsers.has(user.username.toLowerCase());
            await DB.updateLobbyPresence({
                username: user.username,
                x: LobbyNeon.state.myPos.x,
                y: LobbyNeon.state.myPos.y,
                chibiConfig: user.profile?.chibiConfig || {},
                level: user.level || 1,
                isVip: isVip,
                titleInfo: Auth.getDisplayTitle(user)
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
                    LobbyNeon.renderUser(username, data.x, data.y, data.chibiConfig, false, data);
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
                    font-size: 10px;
                    line-height: 1.15;
                    text-transform: uppercase;
                    cursor: pointer;
                    transition: all 0.2s;
                    min-width: 0;
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
                .rpg-grid {
                    display: grid;
                    gap: 12px;
                }
                .rpg-card {
                    background: rgba(2, 8, 23, 0.72);
                    border: 1px solid rgba(148, 163, 184, 0.16);
                    border-radius: 12px;
                    padding: 12px;
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
                }
                .rpg-card.featured {
                    border-color: rgba(34, 211, 238, 0.35);
                    background: linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(168, 85, 247, 0.11));
                }
                .rpg-title {
                    color: #f8fafc;
                    font-size: 13px;
                    font-weight: 900;
                    margin: 0;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .rpg-muted {
                    color: #94a3b8;
                    font-size: 10px;
                    line-height: 1.45;
                }
                .rpg-chip {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 8px;
                    border-radius: 999px;
                    background: rgba(15, 23, 42, 0.72);
                    border: 1px solid rgba(148, 163, 184, 0.18);
                    color: #cbd5e1;
                    font-size: 10px;
                    font-weight: 800;
                    white-space: nowrap;
                }
                .rpg-choice {
                    width: 100%;
                    text-align: left;
                    border: 1px solid rgba(148, 163, 184, 0.16);
                    background: rgba(15, 23, 42, 0.76);
                    color: #e2e8f0;
                    border-radius: 10px;
                    padding: 10px;
                    cursor: pointer;
                    transition: border-color .18s, transform .18s, background .18s;
                }
                .rpg-choice:hover {
                    transform: translateY(-1px);
                    border-color: rgba(34, 211, 238, 0.45);
                    background: rgba(15, 23, 42, 0.95);
                }
                .rpg-choice.active {
                    border-color: var(--rpg-color, #22d3ee);
                    box-shadow: 0 0 16px rgba(34, 211, 238, 0.28);
                }
                .rpg-progress {
                    height: 8px;
                    border-radius: 999px;
                    background: rgba(15, 23, 42, 0.95);
                    overflow: hidden;
                    border: 1px solid rgba(148, 163, 184, 0.14);
                }
                .rpg-progress > span {
                    display: block;
                    height: 100%;
                    border-radius: inherit;
                    background: linear-gradient(90deg, #22d3ee, #a78bfa, #f472b6);
                    box-shadow: 0 0 14px rgba(34, 211, 238, .45);
                }
                .rpg-action-btn {
                    border: 0;
                    border-radius: 10px;
                    padding: 9px 10px;
                    background: linear-gradient(135deg, #06b6d4, #a855f7);
                    color: #fff;
                    font-size: 11px;
                    font-weight: 900;
                    cursor: pointer;
                    box-shadow: 0 8px 18px rgba(14, 165, 233, 0.18);
                }
                .rpg-action-btn:disabled {
                    opacity: .45;
                    cursor: not-allowed;
                    filter: grayscale(.4);
                }
                .rpg-zone-row {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 8px;
                }
                .rpg-duration-row {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 6px;
                    margin-top: 8px;
                }
                .rpg-log {
                    max-height: 120px;
                    overflow-y: auto;
                    display: grid;
                    gap: 6px;
                }
                .rpg-battle-stage {
                    position: relative;
                    min-height: 255px;
                    overflow: hidden;
                    border-radius: 14px;
                    border: 1px solid rgba(34, 211, 238, 0.28);
                    background:
                        radial-gradient(circle at 20% 20%, rgba(34, 211, 238, 0.18), transparent 34%),
                        radial-gradient(circle at 80% 10%, rgba(168, 85, 247, 0.2), transparent 32%),
                        linear-gradient(180deg, rgba(8, 13, 33, 0.98), rgba(3, 7, 18, 0.98));
                    box-shadow: inset 0 0 32px rgba(34, 211, 238, 0.08), 0 14px 30px rgba(0, 0, 0, 0.28);
                }
                .rpg-battle-stage::before {
                    content: "";
                    position: absolute;
                    inset: 0;
                    background-image:
                        linear-gradient(rgba(34, 211, 238, 0.09) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(34, 211, 238, 0.07) 1px, transparent 1px);
                    background-size: 26px 26px;
                    transform: perspective(320px) rotateX(58deg) translateY(68px);
                    transform-origin: bottom;
                    opacity: 0.55;
                }
                .rpg-battle-top {
                    position: relative;
                    z-index: 3;
                    display: flex;
                    justify-content: space-between;
                    gap: 10px;
                    padding: 12px;
                }
                .rpg-hp-box {
                    width: 46%;
                    min-width: 0;
                }
                .rpg-hp-label {
                    display: flex;
                    justify-content: space-between;
                    gap: 6px;
                    color: #e2e8f0;
                    font-size: 10px;
                    font-weight: 900;
                    margin-bottom: 5px;
                }
                .rpg-hp-bar {
                    height: 8px;
                    border-radius: 999px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    background: rgba(2, 6, 23, 0.86);
                    overflow: hidden;
                }
                .rpg-hp-bar > span {
                    display: block;
                    height: 100%;
                    border-radius: inherit;
                    transition: width .35s ease;
                }
                .rpg-hp-player > span { background: linear-gradient(90deg, #22c55e, #22d3ee); }
                .rpg-hp-monster > span { background: linear-gradient(90deg, #fb7185, #f97316); }
                .rpg-battle-floor {
                    position: absolute;
                    left: 14px;
                    right: 14px;
                    bottom: 20px;
                    height: 60px;
                    border-radius: 50%;
                    background: radial-gradient(ellipse at center, rgba(34, 211, 238, 0.18), rgba(15, 23, 42, 0.18) 48%, transparent 72%);
                    filter: blur(1px);
                }
                .rpg-combatant {
                    position: absolute;
                    z-index: 4;
                    bottom: 40px;
                    width: 112px;
                    min-height: 118px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: flex-end;
                    pointer-events: none;
                }
                .rpg-combatant.player {
                    left: 16px;
                    animation: rpg-player-strike 1.8s ease-in-out infinite;
                }
                .rpg-combatant.monster {
                    right: 16px;
                    animation: rpg-monster-breathe 1.9s ease-in-out infinite;
                }
                .rpg-combatant.defeated {
                    opacity: .42;
                    filter: grayscale(.65);
                    animation: none;
                }
                .rpg-fighter-name {
                    margin-top: 4px;
                    max-width: 118px;
                    padding: 3px 8px;
                    border-radius: 999px;
                    background: rgba(2, 6, 23, 0.82);
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    color: #e2e8f0;
                    font-size: 9px;
                    font-weight: 900;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .rpg-player-sprite {
                    transform: scale(1.05);
                    filter: drop-shadow(0 0 12px rgba(34, 211, 238, 0.45));
                }
                .rpg-monster-svg {
                    width: 96px;
                    height: 96px;
                    filter: drop-shadow(0 0 16px rgba(248, 113, 113, 0.35));
                }
                .rpg-skill {
                    position: absolute;
                    z-index: 5;
                    left: 37%;
                    top: 46%;
                    width: 38px;
                    height: 14px;
                    border-radius: 999px;
                    transform-origin: center;
                    animation: rpg-skill-flight 1.35s ease-in-out infinite;
                    box-shadow: 0 0 20px currentColor;
                }
                .rpg-skill.basic {
                    color: #38bdf8;
                    background: linear-gradient(90deg, transparent, #38bdf8, #fff);
                }
                .rpg-skill.fire_dragon {
                    color: #fb923c;
                    width: 52px;
                    height: 18px;
                    background: linear-gradient(90deg, transparent, #f97316, #fed7aa);
                }
                .rpg-skill.thunder {
                    color: #facc15;
                    width: 44px;
                    height: 16px;
                    clip-path: polygon(0 45%, 45% 45%, 35% 0, 100% 55%, 55% 55%, 66% 100%);
                    background: #facc15;
                }
                .rpg-skill.moon_shadow {
                    color: #c084fc;
                    width: 46px;
                    height: 46px;
                    border: 4px solid #c084fc;
                    border-left-color: transparent;
                    background: transparent;
                    border-radius: 50%;
                }
                .rpg-hit-burst {
                    position: absolute;
                    z-index: 6;
                    right: 80px;
                    top: 47%;
                    width: 46px;
                    height: 46px;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(255,255,255,.95), rgba(34,211,238,.42) 32%, transparent 70%);
                    animation: rpg-hit-pulse 1.35s ease-in-out infinite;
                    pointer-events: none;
                }
                .rpg-damage-pop {
                    position: absolute;
                    z-index: 7;
                    right: 76px;
                    top: 34%;
                    color: #fde68a;
                    font-size: 13px;
                    font-weight: 1000;
                    text-shadow: 0 0 10px rgba(251, 191, 36, .75);
                    animation: rpg-damage-float 1.35s ease-in-out infinite;
                }
                .rpg-battle-status {
                    position: absolute;
                    z-index: 8;
                    left: 12px;
                    right: 12px;
                    bottom: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                    color: #cbd5e1;
                    font-size: 10px;
                    font-weight: 800;
                }
                .rpg-pvp-stage {
                    display: grid;
                    grid-template-columns: 1fr auto 1fr;
                    gap: 8px;
                    align-items: center;
                    margin-top: 10px;
                    padding: 10px;
                    border-radius: 12px;
                    background: rgba(15, 23, 42, 0.72);
                    border: 1px dashed rgba(248, 113, 113, 0.36);
                }
                .rpg-pvp-slot {
                    min-height: 58px;
                    border-radius: 10px;
                    padding: 8px;
                    background: rgba(2, 6, 23, 0.72);
                    border: 1px solid rgba(148, 163, 184, 0.14);
                    text-align: center;
                }
                @keyframes rpg-player-strike {
                    0%, 100% { transform: translateX(0) translateY(0); }
                    45% { transform: translateX(9px) translateY(-2px); }
                    55% { transform: translateX(18px) translateY(-4px); }
                }
                @keyframes rpg-monster-breathe {
                    0%, 100% { transform: translateX(0) scale(1); }
                    50% { transform: translateX(-4px) scale(1.035); }
                }
                @keyframes rpg-skill-flight {
                    0% { opacity: 0; transform: translateX(-42px) scale(.72) rotate(0deg); }
                    18% { opacity: 1; }
                    72% { opacity: 1; transform: translateX(72px) scale(1.05) rotate(18deg); }
                    100% { opacity: 0; transform: translateX(94px) scale(.55) rotate(34deg); }
                }
                @keyframes rpg-hit-pulse {
                    0%, 70%, 100% { opacity: 0; transform: scale(.55); }
                    76% { opacity: 1; transform: scale(1.08); }
                    88% { opacity: .32; transform: scale(1.55); }
                }
                @keyframes rpg-damage-float {
                    0%, 66%, 100% { opacity: 0; transform: translateY(8px); }
                    76% { opacity: 1; transform: translateY(0); }
                    92% { opacity: 0; transform: translateY(-18px); }
                }
                @media (prefers-reduced-motion: reduce) {
                    .rpg-combatant,
                    .rpg-skill,
                    .rpg-hit-burst,
                    .rpg-damage-pop {
                        animation: none !important;
                    }
                }

                /* QUEST NPC STYLES */
                @keyframes float { 0%, 100% { transform: translate(-50%, 0); } 50% { transform: translate(-50%, -15px); } }
                .lobby-user-wrapper.npc { z-index: 100 !important; }
                .lobby-user-wrapper.npc .lobby-chibi-container svg { overflow: visible !important; }
                .npc-banter-bubble {
                    bottom: 172px !important;
                    background: rgba(15, 23, 42, 0.96) !important;
                    color: #fff !important;
                    border: 2px solid rgba(0, 243, 255, 0.8) !important;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.45), 0 0 18px rgba(0,243,255,0.32) !important;
                    min-width: 190px;
                    max-width: 260px;
                    font-size: 12px !important;
                    line-height: 1.35;
                    pointer-events: none;
                }
                .npc-banter-bubble::after {
                    background: rgba(15, 23, 42, 0.96) !important;
                    box-shadow: 8px 8px 0 -2px rgba(15, 23, 42, 0.96) !important;
                }

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

                /* COIN FLIP ANIMATION */
                .coin-flip-overlay {
                    position: absolute;
                    top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(15, 23, 42, 0.8);
                    z-index: 2000;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    backdrop-filter: blur(8px);
                    border-radius: 20px;
                }
                .coin-container {
                    width: 150px;
                    height: 150px;
                    perspective: 1000px;
                    margin-bottom: 30px;
                }
                .coin {
                    width: 100%;
                    height: 100%;
                    position: relative;
                    transform-style: preserve-3d;
                }
                .coin-side {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    backface-visibility: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 60px;
                    font-weight: 900;
                    border: 8px solid rgba(255,255,255,0.2);
                    box-shadow: 0 0 30px rgba(0,0,0,0.5);
                }
                .coin-front {
                    background: linear-gradient(135deg, #ff4757, #ff6b81);
                    color: white;
                    text-shadow: 0 0 10px rgba(255, 71, 87, 0.8);
                }
                .coin-back {
                    background: linear-gradient(135deg, #2ed573, #7bed9f);
                    color: white;
                    transform: rotateY(180deg);
                    text-shadow: 0 0 10px rgba(46, 213, 115, 0.8);
                }
                
                @keyframes coin-spin-p1 {
                    0% { transform: rotateY(0) rotateX(0); }
                    100% { transform: rotateY(1800deg) rotateX(0); } /* Lands on Front (Red/X) */
                }
                @keyframes coin-spin-p2 {
                    0% { transform: rotateY(0) rotateX(0); }
                    100% { transform: rotateY(1980deg) rotateX(0); } /* Lands on Back (Green/O) - 1800 + 180 */
                }
                
                .coin.flipping-p1 { animation: coin-spin-p1 3s forwards cubic-bezier(0.1, 0.1, 0.1, 1); }
                .coin.flipping-p2 { animation: coin-spin-p2 3s forwards cubic-bezier(0.1, 0.1, 0.1, 1); }
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
                        <button onclick="LobbyNeon.switchHubTab('rpg')" id="hub-tab-rpg" class="hub-tab">
                            ⚔️ LUYỆN CÔNG
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
                    <div id="hub-content-rpg" class="hub-content" style="display: none;">
                        <div style="text-align: center; color: #64748b; font-size: 12px; padding: 40px 10px;">
                            Đang mở khu luyện công...
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

    renderUser: (username, x, y, config, forceRefresh, extraData) => {
        const map = document.getElementById('lobby-map');
        if (!map) return;

        let el = document.getElementById(`user-${username}`);
        const isMe = (username === Auth.currentUser?.username);

        if (!el) {
            el = document.createElement('div');
            el.id = `user-${username}`;
            el.className = `lobby-user-wrapper ${isMe ? 'me' : ''}`;
            el.addEventListener('mousedown', (e) => e.stopPropagation());
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
            chibiSvg = ChibiModule.render(config || {}, false, 0);
        } catch (e) {
            chibiSvg = `<div style="font-size: 40px;">👤</div>`;
        }

        el.style.left = `${x}px`;
        el.style.top = `${y}px`;

        // PARTIAL UPDATE to preserve child elements like chat bubbles
        let nameEl = el.querySelector('.lobby-user-name');
        if (!nameEl || forceRefresh) {
            const userLevel = extraData?.level || (isMe ? Auth.currentUser?.level : 1);
            const titleInfo = extraData?.titleInfo || (isMe ? Auth.getDisplayTitle(Auth.currentUser) : Auth.getLevelTitle(1));
            // Preserve chat bubbles during force refresh
            const existingBubble = el.querySelector('.lobby-chat-bubble');
            const isVip = extraData?.isVip ?? LobbyNeon.state.vipUsers.has(username ? username.toLowerCase() : '');
            
            el.innerHTML = `
                <div class="lobby-user-name" ${isMe ? 'onclick="event.stopPropagation(); Auth.openTitleSelector();" style="cursor: pointer;"' : ''}>
                    ${isVip ? `<span class="vip-neon-name" title="VIP Legend"><i class="fa-solid fa-crown" style="color: #fcd34d; margin-right: 3px; font-size: 10px;"></i>${username}</span>` : username}
                    <span style="font-size: 8px; color: #fbbf24; font-weight: 900; background: rgba(0,0,0,0.4); padding: 1px 5px; border-radius: 8px; margin-left: 3px;">Lv.${userLevel}</span>
                    <br><span style="font-size: 9px; color: ${titleInfo.color}; font-weight: 900; opacity: 0.9;">${titleInfo.title}</span>
                </div>
                ${isMe && typeof Auth !== 'undefined' ? Auth.renderExpBar(Auth.currentUser?.exp || 0, userLevel, true) : ''}
                <div class="lobby-chibi-container" style="transform: scale(1.3);${titleInfo.glow ? ' filter: drop-shadow(0 0 8px ' + titleInfo.color + '60);' : ''}">${chibiSvg}</div>
                ${!isMe ? '<div class="lobby-user-status">⚔️ THÁCH ĐẤU</div>' : '<div class="lobby-user-status" onclick="event.stopPropagation(); Auth.openTitleSelector();" style="cursor: pointer;">🏷️ ĐỔI DANH HIỆU</div>'}
            `;
            if (existingBubble) el.appendChild(existingBubble);
        } else {
            const container = el.querySelector('.lobby-chibi-container');
            if (container) container.innerHTML = chibiSvg;
        }
    },

    renderQuestNPC: () => {
        console.log("LobbyNeon.renderQuestNPC starting...");
        if (typeof ChibiModule === 'undefined') {
            console.warn('ChibiModule not loaded yet, retrying renderQuestNPC in 1s...');
            setTimeout(() => LobbyNeon.renderQuestNPC(), 1000);
            return;
        }
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
            el.addEventListener('mousedown', (e) => e.stopPropagation());
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

        let chibiSvg = ChibiModule.render(npcConfig, true, 88);

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
        if (typeof ChibiModule === 'undefined') {
            console.warn('ChibiModule not loaded yet, retrying renderLeaderboardMonument in 1s...');
            setTimeout(() => LobbyNeon.renderLeaderboardMonument(), 1000);
            return;
        }
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
            el.addEventListener('mousedown', (e) => e.stopPropagation());
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

        let chibiSvg = ChibiModule.render(statueConfig, true, 88);

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

    renderFashionNPC: () => {
        console.log("LobbyNeon.renderFashionNPC starting...");
        if (typeof ChibiModule === 'undefined') {
            console.warn('ChibiModule not loaded yet, retrying renderFashionNPC in 1s...');
            setTimeout(() => LobbyNeon.renderFashionNPC(), 1000);
            return;
        }
        const map = document.getElementById('lobby-map');
        if (!map) {
            console.error("NPC Error: lobby-map not found");
            return;
        }

        const npcId = 'npc-fashion';
        let el = document.getElementById(npcId);

        if (!el) {
            el = document.createElement('div');
            el.id = npcId;
            el.className = 'lobby-user-wrapper npc';
            el.style.position = 'absolute';
            el.style.cursor = 'help';
            el.addEventListener('mousedown', (e) => e.stopPropagation());
            el.onclick = (e) => {
                e.stopPropagation();
                if (typeof ChibiModule !== 'undefined') ChibiModule.openBuilder();
                LobbyNeon.triggerFashionNpcDialogue(true);
            };
            map.appendChild(el);
            console.log("Fashion NPC element created and appended to map");
        }

        // Extremely stylish Chibi outfit configuration for showcase
        const npcConfig = {
            gender: 'nam',
            skinColor: '#ffe4e6',
            hairStyle: 2, // Spiky Cyber
            hairColor: '#ec4899', // Spiky hot pink neon
            accessory: 1, // Shades
            topStyle: 3, // Cyber Armor
            topColor: '#00f3ff', // Neon blue
            bottomStyle: 6, // Cyber pants
            bottomColor: '#1f2937',
            shoeStyle: 4, // Cyber boots
            shoeColor: '#00f3ff',
            wing: 4,      // Fairy wings
            dragon: 3,    // Golden Dragon
            aura: 1,      // Neon Ring
            gear: 2,      // Infinity Rifle
            mount: 0
        };

        let chibiSvg = ChibiModule.render(npcConfig, true, 99);

        const tx = 350, ty = 420;
        LobbyNeon.state.fashionNpcPos = { x: tx, y: ty };

        el.style.left = `${tx}px`;
        el.style.top = `${ty}px`;

        el.innerHTML = `
            <div class="lobby-user-name" style="color: #ff0055; background: rgba(0,0,0,0.8); padding: 4px 12px; border: 2px solid #ff0055; border-radius: 20px; font-weight: 800; font-size: 13px; white-space: nowrap; box-shadow: 0 0 10px rgba(255,0,85,0.5);">🛡️ DESIGNER THỜI TRANG</div>
            <div class="neon-clothes-rack">
                <span class="rack-item rack-item-1">👕</span>
                <span class="rack-item rack-item-2">👑</span>
                <span class="rack-item rack-item-3">🗡️</span>
            </div>
            <div class="lobby-chibi-container" style="transform: scale(1.6); filter: drop-shadow(0 0 15px rgba(255,0,85,0.5)); pointer-events: none;">${chibiSvg}</div>
            <div class="lobby-user-status" style="background: linear-gradient(135deg, #ff0055, #8b5cf6); border: none; color: #fff; padding: 4px 16px; font-weight: 900; border-radius: 4px; font-size: 11px; margin-top: 10px; box-shadow: 0 0 15px rgba(255,0,85,0.6);">✨ THIẾT KẾ ĐỒ HIỆU</div>
        `;
        console.log("Fashion NPC render complete at", tx, ty);
    },

    renderBattlePortal: () => {
        console.log("LobbyNeon.renderBattlePortal starting...");
        if (typeof ChibiModule === 'undefined') {
            console.warn('ChibiModule not loaded yet, retrying renderBattlePortal in 1s...');
            setTimeout(() => LobbyNeon.renderBattlePortal(), 1000);
            return;
        }
        const map = document.getElementById('lobby-map');
        if (!map) {
            console.error("Battle Portal Error: lobby-map not found");
            return;
        }

        const npcId = 'npc-battle';
        let el = document.getElementById(npcId);

        if (!el) {
            el = document.createElement('div');
            el.id = npcId;
            el.className = 'lobby-user-wrapper npc';
            el.style.position = 'absolute';
            el.style.cursor = 'help';
            el.addEventListener('mousedown', (e) => e.stopPropagation());
            el.onclick = (e) => {
                e.stopPropagation();
                LobbyNeon.openRpgHub();
            };
            map.appendChild(el);
        }

        const masterConfig = {
            gender: 'nam',
            skinColor: '#fef3c7',
            hairStyle: 3,
            hairColor: '#111827',
            accessory: 1,
            topStyle: 4,
            topColor: '#16a34a',
            bottomStyle: 4,
            bottomColor: '#0f172a',
            shoeStyle: 4,
            shoeColor: '#22d3ee',
            wing: 0,
            dragon: 1,
            aura: 2,
            gear: 1,
            mount: 0
        };

        const chibiSvg = ChibiModule.render(masterConfig, true, 92);
        const tx = 565, ty = 610;
        LobbyNeon.state.battleNpcPos = { x: tx, y: ty };

        el.style.left = `${tx}px`;
        el.style.top = `${ty}px`;

        el.innerHTML = `
            <div class="lobby-user-name" style="color:#86efac; background:rgba(0,0,0,.82); padding:4px 12px; border:2px solid #22c55e; border-radius:20px; font-weight:900; font-size:13px; white-space:nowrap; box-shadow:0 0 12px rgba(34,197,94,.52);">⚔️ VÕ ĐƯỜNG LUYỆN CÔNG</div>
            <div style="position:absolute; top:-94px; left:50%; transform:translateX(-50%); width:92px; height:92px; border-radius:50%; background:radial-gradient(circle, rgba(34,211,238,.42), rgba(168,85,247,.18) 52%, transparent 70%); filter:drop-shadow(0 0 20px #22d3ee); animation: float 2.8s infinite ease-in-out; display:flex; align-items:center; justify-content:center; font-size:38px; z-index:5;">🌀</div>
            <div class="lobby-chibi-container" style="transform: scale(1.55); filter: drop-shadow(0 0 16px rgba(34,197,94,.56)); pointer-events:none;">${chibiSvg}</div>
            <div class="lobby-user-status" style="background:linear-gradient(135deg,#22c55e,#06b6d4); border:none; color:#001018; padding:4px 16px; font-weight:900; border-radius:4px; font-size:11px; margin-top:10px; box-shadow:0 0 15px rgba(34,197,94,.55);">TREO QUÁI NHẬN EXP</div>
        `;
        console.log("Battle Portal render complete at", tx, ty);
    },

    startNpcBanterLoop: () => {
        if (LobbyNeon.state.npcBanterInterval) clearInterval(LobbyNeon.state.npcBanterInterval);

        const speak = () => {
            const availableNpcIds = Object.keys(LobbyNeon.npcBanterQuotes)
                .filter(id => document.getElementById(id));
            if (!availableNpcIds.length) return;
            const npcId = availableNpcIds[Math.floor(Math.random() * availableNpcIds.length)];
            LobbyNeon.showNpcBanter(npcId);
        };

        setTimeout(speak, 1800);
        LobbyNeon.state.npcBanterInterval = setInterval(speak, 8500);
    },

    showNpcBanter: (npcId, forceQuote) => {
        const npcEl = document.getElementById(npcId);
        if (!npcEl) return;

        const quotes = LobbyNeon.npcBanterQuotes[npcId] || [];
        const quote = forceQuote || quotes[Math.floor(Math.random() * quotes.length)];
        if (!quote) return;

        const oldBubble = npcEl.querySelector('.lobby-chat-bubble');
        if (oldBubble) oldBubble.remove();

        const bubble = document.createElement('div');
        bubble.className = 'lobby-chat-bubble npc-banter-bubble';
        if (npcId === 'npc-admin') {
            bubble.style.borderColor = '#fbbf24';
            bubble.style.boxShadow = '0 10px 25px rgba(0,0,0,0.45), 0 0 18px rgba(251,191,36,0.34)';
        } else if (npcId === 'npc-fashion') {
            bubble.style.borderColor = '#ff0055';
            bubble.style.boxShadow = '0 10px 25px rgba(0,0,0,0.45), 0 0 18px rgba(255,0,85,0.34)';
        } else if (npcId === 'npc-battle') {
            bubble.style.borderColor = '#22c55e';
            bubble.style.boxShadow = '0 10px 25px rgba(0,0,0,0.45), 0 0 18px rgba(34,197,94,0.34)';
        }
        bubble.textContent = quote;
        npcEl.appendChild(bubble);

        setTimeout(() => {
            if (!bubble.parentNode) return;
            bubble.classList.add('fade-out');
            setTimeout(() => bubble.remove(), 500);
        }, 5600);
    },

    triggerFashionNpcDialogue: (isDirectClick) => {
        const now = Date.now();
        // Prevent bubble spamming unless direct click (cooldown of 4s for proximity)
        if (!isDirectClick && now - LobbyNeon.state.lastFashionNpcTalkTime < 4000) return;
        LobbyNeon.state.lastFashionNpcTalkTime = now;

        const npcEl = document.getElementById('npc-fashion');
        if (!npcEl) return;

        const userLevel = Auth.currentUser?.level || 1;

        const lowLevelQuotes = [
            "Cấp sếp còn thấp quá, chưa đủ trình khoác lên bộ cánh VIP của tôi đâu! Mau đi cày việc đi!",
            "Cố gắng làm thêm nhiệm vụ đi sếp ơi, cấp thấp thế này mặc đồ hiệu phí lắm!",
            "Muốn mở khóa cánh rồng cánh phượng thì phải chăm cày EXP lên cấp đã nhé sếp!",
            "Cấp sếp thế này thì chỉ hợp mặc dép tổ ong thôi nha! Cày lên rồi tôi mở kho VVIP cho!"
        ];

        const highLevelQuotes = [
            "Úi dồi ôi sếp lớn! Trông bộ cánh của sếp bảnh chọe thế kia thì ai mà làm lại nữa! Lên đời tiếp nào! 👑",
            "Thần thái ngút ngàn sếp ơi! Để tôi tư vấn thêm vài món VVIP cho xứng tầm nhé! 😎",
            "Quá đẹp trai sếp lớn ơi! Đúng là người đẹp vì lụa, bộ cánh này chất lừ luôn! 🔥",
            "Hôm nay sếp diện đồ bảnh tỏn quá xá! Vào đây tôi may đo thêm cho bộ cánh độc quyền nào!"
        ];

        const quote = userLevel < 5 
            ? lowLevelQuotes[Math.floor(Math.random() * lowLevelQuotes.length)]
            : highLevelQuotes[Math.floor(Math.random() * highLevelQuotes.length)];

        LobbyNeon.showNpcBanter('npc-fashion', quote);
    },

    // ========== MOVEMENT ==========
    isNonFloorClickTarget: (target) => {
        if (!target) return true;
        return !!target.closest([
            '.lobby-user-wrapper',
            '.lobby-game-hub',
            '.lobby-hub-toggle',
            '.lobby-chat-overlay',
            '.caro-modal',
            '.modal-overlay',
            '.modal',
            '.hub-tab',
            '.hub-content',
            'button',
            'a',
            'input',
            'textarea',
            'select',
            'form',
            '[role="button"]',
            '[onclick]'
        ].join(','));
    },

    handleMapClick: (e) => {
        if (e.button !== 0 || LobbyNeon.isNonFloorClickTarget(e.target)) return;

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

        // Check proximity to Battle Portal
        if (LobbyNeon.state.battleNpcPos) {
            const dxBt = x - LobbyNeon.state.battleNpcPos.x;
            const dyBt = y - LobbyNeon.state.battleNpcPos.y;
            const distBt = Math.sqrt(dxBt*dxBt + dyBt*dyBt);
            if (distBt < 90) {
                LobbyNeon.openRpgHub();
                return;
            } else if (distBt < 180) {
                LobbyNeon.showNpcBanter('npc-battle');
            }
        }

        // Check proximity to Fashion NPC
        if (LobbyNeon.state.fashionNpcPos) {
            const dxFs = x - LobbyNeon.state.fashionNpcPos.x;
            const dyFs = y - LobbyNeon.state.fashionNpcPos.y;
            const distFs = Math.sqrt(dxFs*dxFs + dyFs*dyFs);
            if (distFs < 80) {
                if (typeof ChibiModule !== 'undefined') ChibiModule.openBuilder();
                LobbyNeon.triggerFashionNpcDialogue(true);
                return;
            } else if (distFs < 180) {
                LobbyNeon.triggerFashionNpcDialogue(false);
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
                if (change.type === 'removed') return; // Bỏ qua các game bị xoá hoặc đã kết thúc
                const game = change.doc.data();
                const gameId = change.doc.id;
                
                if (game.player2 === me && !game.p2Accepted) {
                    // Lọc bỏ các lời mời cũ hơn 3 phút để tránh thông báo "ma"
                    const now = Date.now();
                    const created = game.createdAt ? (game.createdAt.toDate ? game.createdAt.toDate().getTime() : game.createdAt) : now;
                    if (now - created > 180000) return; 
                    
                    LobbyNeon.showIncomingInvite(gameId, game.player1);
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

    openCaroBoard: async (gameId, game) => {
        if (LobbyNeon.state.currentGameId === gameId) return;
        LobbyNeon.state.currentGameId = gameId;
        LobbyNeon.state.isMakingMove = false; // Reset lock
        LobbyNeon.state.resultShown = false; // Reset kết quả hiển thị

        // Huỷ lắng nghe game cũ nếu có
        if (LobbyNeon.state.unsubscribeCurrentGame) {
            try { LobbyNeon.state.unsubscribeCurrentGame(); } catch(e) {}
            LobbyNeon.state.unsubscribeCurrentGame = null;
        }

        // Lấy chibi config thật từ Database Firestore của cả 2 người chơi
        let accounts = [];
        try {
            accounts = await DB.getAccounts();
        } catch(e) {
            console.error("Error fetching accounts for Caro Chibi:", e);
        }
        LobbyNeon.state.caroAccounts = accounts; // Lưu cache danh sách tài khoản

        const getPlayerChibi = (username) => {
            try {
                const acc = accounts.find(a => a.username === username);
                const config = acc?.profile?.chibiConfig || {};
                return ChibiModule.renderChibiSVG(config, false, 0);
            } catch(e) {
                return '<div style="font-size: 40px;">👤</div>';
            }
        };

        const p1Chibi = getPlayerChibi(game.player1);
        const p2Chibi = getPlayerChibi(game.player2);

        const container = document.getElementById('lobby-view');
        const boardOverlay = document.createElement('div');
        boardOverlay.id = 'caro-overlay';
        boardOverlay.className = 'caro-modal';
        boardOverlay.innerHTML = `
            <div class="caro-board-container" style="position: relative;">
                <style>
                    @keyframes chibiBounce {
                        0%, 100% { transform: scale(1.15) translateY(0); }
                        50% { transform: scale(1.15) translateY(-8px); }
                    }
                    .caro-layout-wrapper {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 30px;
                    }
                    .caro-chibi-container {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        width: 140px;
                        background: rgba(0, 0, 0, 0.25);
                        padding: 20px 10px;
                        border-radius: 20px;
                        border: 1px solid rgba(255, 255, 255, 0.05);
                        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    }
                    @media (max-width: 900px) {
                        .caro-layout-wrapper {
                            flex-direction: column;
                            gap: 15px;
                        }
                        .caro-chibi-container {
                            display: none;
                        }
                    }
                </style>
                <div style="display: flex; justify-content: space-between; margin-bottom: 20px; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                        <div style="width: 40px; height: 40px; flex-shrink: 0; filter: drop-shadow(0 0 6px #ff475780);">${p1Chibi}</div>
                        <div>
                            <div id="caro-p1-label" style="color: #ff4757; font-weight: 900; text-shadow: 0 0 5px #ff4757; margin-bottom: 2px; font-size: 13px;">${game.player1} (X)</div>
                            <div id="caro-p1-stats" style="font-size: 10px; color: #94a3b8; font-weight: bold;">Đang tải...</div>
                        </div>
                    </div>
                    <div style="margin: 0 15px; opacity: 0.5; color: #fff; font-weight: 900; font-size: 18px;">⚔️</div>
                    <div style="display: flex; align-items: center; gap: 10px; flex: 1; justify-content: flex-end;">
                        <div style="text-align: right;">
                            <div id="caro-p2-label" style="color: #2ed573; font-weight: 900; text-shadow: 0 0 5px #2ed573; margin-bottom: 2px; font-size: 13px;">${game.player2} (O)</div>
                            <div id="caro-p2-stats" style="font-size: 10px; color: #94a3b8; font-weight: bold;">Đang tải...</div>
                        </div>
                        <div style="width: 40px; height: 40px; flex-shrink: 0; filter: drop-shadow(0 0 6px #2ed57380);">${p2Chibi}</div>
                    </div>
                    <div style="display: flex; gap: 8px; margin-left: 12px; align-items: center;">
                        ${Auth.currentUser.username === 'admin' ? `
                            <div style="border: 1px solid rgba(239, 68, 68, 0.25); background: rgba(239, 68, 68, 0.05); border-radius: 8px; padding: 6px 10px; display: flex; align-items: center; gap: 8px; user-select: none; margin-right: 4px;">
                                <label style="display: flex; align-items: center; gap: 4px; cursor: pointer; font-size: 11px; color: #ef4444; margin: 0;">
                                    <input type="checkbox" id="caro-pvp-hack-toggle" ${LobbyNeon.state.caroHackMode ? 'checked' : ''} onchange="LobbyNeon.toggleCaroPvpHack(this.checked)" style="accent-color: #ef4444; cursor: pointer; width: 14px; height: 14px;">
                                    <span>Hack 😈</span>
                                </label>
                                <div id="caro-pvp-hack-settings" style="display: ${LobbyNeon.state.caroHackMode ? 'flex' : 'none'}; align-items: center; gap: 6px; border-left: 1px solid rgba(239, 68, 68, 0.2); padding-left: 8px;">
                                    <span style="font-size: 10px; color: #94a3b8; white-space: nowrap;">Trễ: <strong style="color:#ef4444" id="caro-pvp-delay-val">${(LobbyNeon.state.caroDelayMs / 1000).toFixed(1)}s</strong></span>
                                    <input type="range" min="500" max="5000" step="500" value="${LobbyNeon.state.caroDelayMs}" oninput="LobbyNeon.setCaroPvpDelay(this.value)" style="width: 60px; accent-color: #ef4444; height: 4px; cursor: pointer; margin: 0;">
                                </div>
                            </div>
                            <button class="btn-neon" onclick="LobbyNeon.makeCaroPvPAiMove()" style="font-size: 10px; padding: 4px 8px; height: 26px; border-color: #fbbf24; color: #fbbf24; background: rgba(0,0,0,0.2); margin-right: 4px;" title="AI đi hộ nước này">🤖 Gợi ý</button>
                        ` : ''}
                        <button class="btn-neon-danger" id="caro-btn-quit" onclick="LobbyNeon.forfeitGame()" style="font-size: 11px; padding: 6px 12px; height: 32px;">Rút lui</button>
                        <button class="btn-neon" onclick="LobbyNeon.closeCaroBoard()" style="font-size: 11px; padding: 6px 12px; height: 32px; background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.2);">✖</button>
                    </div>
                </div>
                <div id="caro-status-msg" style="color: #fff; font-weight: 800; font-size: 14px; margin-bottom: 15px; text-align: center; background: rgba(168, 85, 247, 0.2); padding: 5px; border-radius: 8px;">Đang chuẩn bị...</div>
                
                <div class="caro-layout-wrapper">
                    <!-- Chibi Player 1 (Left) -->
                    <div class="caro-chibi-container" id="caro-chibi-p1-wrapper">
                        <div id="caro-chibi-p1-side" style="width: 110px; height: 110px; transition: all 0.4s; filter: drop-shadow(0 0 10px rgba(255, 71, 87, 0.5));">
                            ${p1Chibi}
                        </div>
                        <div style="color: #ff4757; font-weight: 900; font-size: 13px; margin-top: 12px; text-shadow: 0 0 5px rgba(255, 71, 87, 0.5); text-align: center; word-break: break-all;">
                            ${game.player1}
                        </div>
                        <div id="caro-p1-side-level" style="font-size: 10px; color: #fbbf24; font-weight: bold; margin-top: 4px; background: rgba(0,0,0,0.4); padding: 2px 8px; border-radius: 10px;">
                            Cấp 1
                        </div>
                    </div>

                    <!-- Caro Board Grid -->
                    <div style="position: relative;">
                        <div class="caro-grid" id="caro-grid">
                            ${Array(225).fill(0).map((_, i) => `<div class="caro-cell" onclick="LobbyNeon.makeMove(${i})"></div>`).join('')}
                        </div>
                        <svg id="caro-win-line" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10;"></svg>
                    </div>

                    <!-- Chibi Player 2 (Right) -->
                    <div class="caro-chibi-container" id="caro-chibi-p2-wrapper">
                        <div id="caro-chibi-p2-side" style="width: 110px; height: 110px; transition: all 0.4s; filter: drop-shadow(0 0 10px rgba(46, 213, 115, 0.5));">
                            ${p2Chibi}
                        </div>
                        <div style="color: #2ed573; font-weight: 900; font-size: 13px; margin-top: 12px; text-shadow: 0 0 5px rgba(46, 213, 115, 0.5); text-align: center; word-break: break-all;">
                            ${game.player2}
                        </div>
                        <div id="caro-p2-side-level" style="font-size: 10px; color: #fbbf24; font-weight: bold; margin-top: 4px; background: rgba(0,0,0,0.4); padding: 2px 8px; border-radius: 10px;">
                            Cấp 1
                        </div>
                    </div>
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
        
        // Lắng nghe real-time game hiện tại (nhận cả status finished để đồng bộ hoàn hảo)
        LobbyNeon.state.unsubscribeCurrentGame = db.collection("lobby_games").doc(gameId).onSnapshot(doc => {
            if (doc.exists) {
                const gameData = doc.data();
                LobbyNeon.onGameUpdate(gameData);
                
                // TỰ ĐỘNG KÍCH HOẠT TUNG ĐỒNG XU NẾU LÀ TRẬN MỚI
                if (gameData.turn === 'flipping' && !document.getElementById('caro-coin-flip')) {
                    LobbyNeon.startCoinFlip(gameId, gameData);
                }
            }
        });
    },

    startCoinFlip: (gameId, game) => {
        const boardContainer = document.querySelector('.caro-board-container');
        if (!boardContainer) return;

        // Xóa flip cũ nếu còn sót
        const oldFlip = document.getElementById('caro-coin-flip');
        if (oldFlip) oldFlip.remove();

        const overlay = document.createElement('div');
        overlay.id = 'caro-coin-flip';
        overlay.className = 'coin-flip-overlay';
        
        const isP1Starter = (game.starter === game.player1);
        const starterName = game.starter;
        
        overlay.innerHTML = `
            <div style="font-size: 18px; color: #fbbf24; font-weight: 900; margin-bottom: 25px; text-transform: uppercase; letter-spacing: 2px; text-shadow: 0 0 10px rgba(251,191,36,0.5);">🎲 ĐANG CHỌN LƯỢT ĐI...</div>
            <div class="coin-container">
                <div class="coin" id="the-coin">
                    <div class="coin-side coin-front">X</div>
                    <div class="coin-side coin-back">O</div>
                </div>
            </div>
            <div id="flip-result-text" style="font-size: 22px; font-weight: 900; color: #fff; height: 40px; text-shadow: 0 0 10px rgba(255,255,255,0.5); text-align: center; transition: all 0.3s;"></div>
        `;
        boardContainer.appendChild(overlay);

        // Kích hoạt xoay sau một chút delay
        setTimeout(() => {
            const coin = document.getElementById('the-coin');
            if (coin) {
                coin.classList.add(isP1Starter ? 'flipping-p1' : 'flipping-p2');
            }
            if (window.GamesSynth && GamesSynth.playRoll) GamesSynth.playRoll();
        }, 100);

        // Kết thúc xoay (3s animation)
        setTimeout(async () => {
            const resText = document.getElementById('flip-result-text');
            if (resText) {
                const color = isP1Starter ? '#ff4757' : '#2ed573';
                resText.style.color = color;
                resText.style.textShadow = `0 0 20px ${color}`;
                resText.innerHTML = `🌟 ${starterName} 🌟<br><span style="font-size: 14px; opacity: 0.8;">ĐƯỢC ĐI TIÊN PHONG!</span>`;
                
                if (window.GamesSynth && GamesSynth.playWin) GamesSynth.playWin();
            }

            // Chờ 2s hiệu ứng chiến thắng rồi mới vào game
            setTimeout(async () => {
                overlay.style.opacity = '0';
                overlay.style.transition = 'opacity 0.5s ease-out';
                
                // Chỉ người chấp nhận (player2) cập nhật DB để tránh xung đột
                if (game.turn === 'flipping' && Auth.currentUser.username === game.player2) {
                    try {
                        await DB.updateLobbyGame(gameId, { turn: game.starter });
                    } catch(e) { console.error("Coin flip final sync error:", e); }
                }
                
                setTimeout(() => {
                    if (overlay.parentNode) overlay.remove();
                }, 500);
            }, 2000);
        }, 3100);
    },

    makeMove: async (index, isAuto = false) => {
        if (LobbyNeon.state.isMakingMove) return;
        const gameId = LobbyNeon.state.currentGameId;
        const game = LobbyNeon.state.currentGameData;
        if (!game || !gameId) return;
        const me = Auth.currentUser.username;

        if (game.status !== 'playing') return;
        if (game.turn === 'flipping') return; // Coin flip animation in progress
        if (game.turn !== me) {
            Utils.showToast("Chưa tới lượt của bạn!", "warning");
            return;
        }

        // Chặn người chơi click tay khi đang bật Hack
        if (LobbyNeon.state.caroHackMode && !isAuto) {
            return;
        }

        if (game.board[index]) return;

        LobbyNeon.state.isMakingMove = true;
        const newBoard = [...game.board];
        const symbol = (me === game.player1) ? 'X' : 'O';
        newBoard[index] = symbol;

        // Cập nhật ô ngay lập tức trên UI (không chờ DB)
        const cells = document.querySelectorAll('#caro-grid .caro-cell');
        if (cells[index]) {
            cells[index].textContent = symbol;
            cells[index].className = `caro-cell ${symbol.toLowerCase()} filled`;
        }

        const winResult = LobbyNeon.checkWin(newBoard, index);
        const updateData = {
            board: newBoard,
            turn: (me === game.player1) ? game.player2 : game.player1
        };

        if (winResult) {
            updateData.status = 'finished';
            updateData.winner = me;
            updateData.winCells = winResult; // Lưu các ô thắng
        }

        try {
            await DB.updateLobbyGame(gameId, updateData);
            
            if (winResult) {
                const loser = (me === game.player1) ? game.player2 : game.player1;
                await DB.incrementUserStats(me, 'caroWins');
                await DB.incrementUserStats(loser, 'caroLosses');
                GamesSynth.playWin();
                // Vẽ đường thắng + hiện popup
                LobbyNeon.drawWinLine(winResult);
                await LobbyNeon.showGameResult(true, me, loser);
            } else {
                GamesSynth.playMove();
            }
        } catch (e) {
            console.error("makeMove error:", e);
        } finally {
            LobbyNeon.state.isMakingMove = false;
        }
    },

    toggleCaroPvpHack: (val) => {
        LobbyNeon.state.caroHackMode = val;
        
        // Xoá timeout cũ để tránh trùng lặp hoặc di chuyển ngoài ý muốn
        if (LobbyNeon.state.caroHackTimeout) {
            clearTimeout(LobbyNeon.state.caroHackTimeout);
            LobbyNeon.state.caroHackTimeout = null;
        }
        
        // Show/hide sub-settings dynamically
        const settingsDiv = document.getElementById('caro-pvp-hack-settings');
        if (settingsDiv) {
            settingsDiv.style.display = val ? 'flex' : 'none';
        }

        const game = LobbyNeon.state.currentGameData;
        const me = Auth.currentUser.username;
        if (game && game.status === 'playing' && game.turn === me && LobbyNeon.state.caroHackMode) {
            LobbyNeon.state.caroHackTimeout = setTimeout(() => {
                LobbyNeon.state.caroHackTimeout = null;
                LobbyNeon.makeCaroPvPAiMove();
            }, LobbyNeon.state.caroDelayMs);
        }
    },

    setCaroPvpDelay: (val) => {
        LobbyNeon.state.caroDelayMs = parseInt(val) || 1500;
        const display = document.getElementById('caro-pvp-delay-val');
        if (display) {
            display.textContent = (LobbyNeon.state.caroDelayMs / 1000).toFixed(1) + 's';
        }
    },

    makeCaroPvPAiMove: async () => {
        if (LobbyNeon.state.isMakingMove) return;
        const gameId = LobbyNeon.state.currentGameId;
        const game = LobbyNeon.state.currentGameData;
        if (!game || !gameId) return;
        const me = Auth.currentUser.username;
        if (game.status !== 'playing') return;
        if (game.turn !== me) return;

        let bestScore = -1;
        let bestMoves = [];

        const aiPlayer = (me === game.player1) ? 'X' : 'O';
        const humanPlayer = aiPlayer === 'X' ? 'O' : 'X';
        const tempBoard = [...game.board];

        for (let r = 0; r < 15; r++) {
            for (let c = 0; c < 15; c++) {
                const idx = r * 15 + c;
                if (tempBoard[idx] !== null && tempBoard[idx] !== undefined && tempBoard[idx] !== '') continue;

                const scoreAI = LobbyNeon.evaluateCaroPvPCell(tempBoard, r, c, aiPlayer);
                const scoreHuman = LobbyNeon.evaluateCaroPvPCell(tempBoard, r, c, humanPlayer);
                let score = scoreAI + scoreHuman * 1.35; // Chặn đứng cực mạnh

                // Ưu tiên tuyệt đối nước đi giúp mình chiến thắng ngay lập tức
                if (scoreAI >= 100000) {
                    score = 1000000 + scoreAI;
                }

                if (score > bestScore) {
                    bestScore = score;
                    bestMoves = [idx];
                } else if (score === bestScore) {
                    bestMoves.push(idx);
                }
            }
        }

        if (bestMoves.length > 0) {
            const bestIndex = bestMoves[Math.floor(Math.random() * bestMoves.length)];
            await LobbyNeon.makeMove(bestIndex, true); // Gọi đi tự động
        }
    },

    evaluateCaroPvPCell: (board, r, c, player) => {
        const size = 15;
        const dirPairs = [
            [0, 1],   // Ngang
            [1, 0],   // Dọc
            [1, 1],   // Chéo xuống-phải
            [1, -1]   // Chéo xuống-trái
        ];
        
        let totalScore = 0;
        const opponent = player === 'X' ? 'O' : 'X';

        // Giả lập đặt quân cờ
        board[r * 15 + c] = player;

        for (const [dr, dc] of dirPairs) {
            let line = [];
            for (let i = -4; i <= 4; i++) {
                let nr = r + i * dr;
                let nc = c + i * dc;
                if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
                    line.push(board[nr * 15 + nc] || '.');
                } else {
                    line.push('#');
                }
            }
            let lineStr = line.join('');
            
            let s = lineStr.replace(new RegExp(player, 'g'), 'P')
                           .replace(new RegExp(opponent, 'g'), 'O');

            if (s.includes('PPPPP')) {
                totalScore += 100000;
            } else if (s.includes('.PPPP.')) {
                totalScore += 30000;
            } else if (s.includes('PPPP.') || s.includes('.PPPP') || 
                     s.includes('P.PPP') || s.includes('PP.PP') || s.includes('PPP.P')) {
                totalScore += 8000;
            } else if (s.includes('.PPP..') || s.includes('..PPP.') || 
                     s.includes('.P.PP.') || s.includes('.PP.P.')) {
                totalScore += 3000;
            } else if (s.includes('OPPP.') || s.includes('.PPPO') || 
                     s.includes('#PPP.') || s.includes('.PPP#') || 
                     s.includes('P.PP') || s.includes('PP.P') || s.includes('P.P.P')) {
                totalScore += 800;
            } else if (s.includes('.PP..') || s.includes('..PP.') || s.includes('.P.P.')) {
                totalScore += 200;
            } else if (s.includes('P')) {
                totalScore += 10;
            }
        }

        // Trả lại ô trống
        board[r * 15 + c] = null;

        const mid = size / 2;
        const dist = Math.sqrt(Math.pow(r - mid, 2) + Math.pow(c - mid, 2));
        totalScore += (mid - dist) * 0.5;

        return totalScore;
    },

    drawWinLine: (winCells) => {
        const svg = document.getElementById('caro-win-line');
        const grid = document.getElementById('caro-grid');
        if (!svg || !grid || !winCells || winCells.length < 5) return;

        const cells = grid.querySelectorAll('.caro-cell');
        // Highlight winning cells
        winCells.forEach(idx => {
            if (cells[idx]) {
                cells[idx].style.background = 'rgba(46, 213, 115, 0.3)';
                cells[idx].style.boxShadow = '0 0 15px rgba(46, 213, 115, 0.5), inset 0 0 10px rgba(46, 213, 115, 0.2)';
                cells[idx].style.transform = 'scale(1.1)';
                cells[idx].style.zIndex = '5';
            }
        });

        // Vẽ đường gạch xuyên qua các ô thắng
        const firstCell = cells[winCells[0]];
        const lastCell = cells[winCells[winCells.length - 1]];
        if (!firstCell || !lastCell) return;

        const gridRect = grid.getBoundingClientRect();
        const r1 = firstCell.getBoundingClientRect();
        const r2 = lastCell.getBoundingClientRect();

        const x1 = r1.left + r1.width / 2 - gridRect.left;
        const y1 = r1.top + r1.height / 2 - gridRect.top;
        const x2 = r2.left + r2.width / 2 - gridRect.left;
        const y2 = r2.top + r2.height / 2 - gridRect.top;

        const lineLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

        // Đảm bảo có keyframes động cho vẽ line chiến đấu
        if (!document.getElementById('caro-strike-style')) {
            const style = document.createElement('style');
            style.id = 'caro-strike-style';
            style.innerHTML = `
                @keyframes drawStrikeLine {
                    to { stroke-dashoffset: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        svg.innerHTML = `
            <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" 
                stroke="#2ed573" stroke-width="8" stroke-linecap="round"
                style="filter: drop-shadow(0 0 10px #2ed573);
                       stroke-dasharray: ${lineLength};
                       stroke-dashoffset: ${lineLength};
                       animation: drawStrikeLine 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;"
                id="caro-strike-line">
            </line>
        `;
    },

    showGameResult: (isWinner, winner, loser) => {
        const me = Auth.currentUser.username;
        const isMeWinner = (winner === me);
        const opponentName = isMeWinner ? loser : winner;

        // Sử dụng cache tài khoản để hiển thị thông tin đối đầu trên popup lập tức
        const accounts = LobbyNeon.state.caroAccounts || [];
        const uWinner = accounts.find(a => a.username === winner);
        const uLoser = accounts.find(a => a.username === loser);

        let winnerWins = uWinner?.stats?.caroWins || 0;
        let winnerLosses = uWinner?.stats?.caroLosses || 0;
        let loserWins = uLoser?.stats?.caroWins || 0;
        let loserLosses = uLoser?.stats?.caroLosses || 0;

        // Cộng ảo 1 trận thắng/thua trực quan cho popup phản ánh đúng tỉ số mới
        winnerWins++;
        loserLosses++;

        const winnerFlattery = [
            `Đỉnh chóp! Bác đúng là chiến thần caro, thiên hạ vô song, IQ vô cực! 👑`,
            `Trí tuệ siêu việt! Chỉ bằng vài đường cơ bản sếp đã khiến đối thủ khóc thét! Quá tuyệt vời! 👏`,
            `Gáy lên nào sếp ơi! Đúng là không ai làm lại sếp luôn, đỉnh của chóp! 🏆`,
            `IQ 300 vũ trụ! Đối thủ chỉ biết khóc lóc van xin sự tha thứ trước đường cờ thần sầu của sếp! 😎`,
            `Thần cờ hạ phàm! Nước đi điêu luyện thế này thì làm sao đối thủ đỡ nổi đây! Quá đỉnh sếp ơi! ✨`
        ];

        const loserSalt = [
            `Nhìn cái gì? Thua rồi còn không chịu gỡ? Cay không? Cay thế cơ chứ! 🌶️`,
            `Úi dồi ôi, thế mà lúc đầu gáy to lắm! Trình độ này chỉ hợp đi quét dọn thôi sếp ơi! 😂`,
            `Cay đỏ mắt! Trận này chỉ là tai nạn, hay là do sếp... 'nhường' đấy? Làm ván nữa gỡ gạc danh dự đi nào! 😤`,
            `Gà quá sếp ơi! Đối thủ đi có vài nước mà sếp đã 'ngửa' rồi. Có gan thì bấm tái đấu luôn và ngay đi! 🐔`,
            `Thua sấp mặt luôn! Thần may mắn đã bỏ rơi sếp rồi, hay là tại... tay sếp chưa rửa? 🧼 Bấm gỡ ngay!`
        ];

        const randomText = isMeWinner 
            ? winnerFlattery[Math.floor(Math.random() * winnerFlattery.length)]
            : loserSalt[Math.floor(Math.random() * loserSalt.length)];

        // Bảng vàng thành tích đối đầu cực xịn
        const statsHtml = `
            <div style="margin-top: 15px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); font-size: 13px; text-align: left;">
                <div style="font-weight: 900; color: #fbbf24; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 5px;">📊 THÀNH TÍCH ĐỐI ĐẦU</div>
                <div style="display: flex; justify-content: space-between; align-items: center; color: #fff; font-weight: bold; margin-bottom: 4px;">
                    <span style="color: #ff4757;">🔴 ${winner} (X)</span>
                    <span style="font-size: 14px; font-weight: 900; color: #ff4757; text-shadow: 0 0 5px rgba(255,71,87,0.5);">${winnerWins} Thắng - ${winnerLosses} Thua</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; color: #fff; font-weight: bold;">
                    <span style="color: #2ed573;">🟢 ${loser} (O)</span>
                    <span style="font-size: 14px; font-weight: 900; color: #2ed573; text-shadow: 0 0 5px rgba(46,213,115,0.5);">${loserWins} Thắng - ${loserLosses} Thua</span>
                </div>
            </div>
        `;

        setTimeout(() => {
            Utils.showModal(
                isMeWinner ? '🏆 CHIẾN THẮNG VINH QUANG!' : '💀 CAY CHƯA SẾP ƠI!',
                `<div style="text-align: center;">
                    <div style="font-size: 80px; margin-bottom: 15px; animation: float 2s infinite ease-in-out;">${isMeWinner ? '👑' : '🌶️'}</div>
                    <h2 style="color: ${isMeWinner ? '#2ed573' : '#ff4757'}; font-size: 24px; margin: 10px 0; text-shadow: 0 0 20px ${isMeWinner ? '#2ed573' : '#ff4757'}60; font-weight: 900; text-transform: uppercase;">
                        ${isMeWinner ? 'BẠN ĐÃ THẮNG!' : 'BẠN ĐÃ THUA!'}
                    </h2>
                    <p style="color: #e2e8f0; font-size: 15px; margin-top: 12px; line-height: 1.5; font-style: italic;">
                        "${randomText}"
                    </p>
                    ${statsHtml}
                </div>`,
                () => {
                    LobbyNeon.closeCaroBoard();
                    return true;
                },
                'VỀ SẢNH CHÍNH'
            );
        }, 1200); // Chờ 1.2s cho hiệu ứng gạch line xong
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

        // Update Stats display in header & Chibi Cấp độ
        await LobbyNeon.updateMatchStats(game.player1, game.player2);

        const me = Auth.currentUser.username;
        const statusMsg = document.getElementById('caro-status-msg');

        // Cập nhật nhún nhảy và độ sáng của chibi bên cạnh bàn cờ theo lượt chơi
        const p1ChibiContainer = document.getElementById('caro-chibi-p1-side');
        const p2ChibiContainer = document.getElementById('caro-chibi-p2-side');
        
        const p1Wrapper = document.getElementById('caro-chibi-p1-wrapper');
        const p2Wrapper = document.getElementById('caro-chibi-p2-wrapper');
        
        if (p1ChibiContainer && p2ChibiContainer) {
            if (game.status === 'playing' && game.turn !== 'flipping') {
                if (game.turn === game.player1) {
                    // Lượt player 1 (X)
                    p1ChibiContainer.style.animation = 'chibiBounce 1.5s infinite ease-in-out';
                    p1ChibiContainer.style.transform = 'scale(1.15)';
                    p1ChibiContainer.style.filter = 'drop-shadow(0 0 20px rgba(255, 71, 87, 0.8)) brightness(1.2)';
                    if (p1Wrapper) {
                        p1Wrapper.style.borderColor = 'rgba(255, 71, 87, 0.4)';
                        p1Wrapper.style.background = 'rgba(255, 71, 87, 0.05)';
                        p1Wrapper.style.boxShadow = '0 0 15px rgba(255, 71, 87, 0.15)';
                    }
                    
                    p2ChibiContainer.style.animation = 'none';
                    p2ChibiContainer.style.transform = 'scale(0.95)';
                    p2ChibiContainer.style.filter = 'drop-shadow(0 0 5px rgba(46, 213, 115, 0.2)) opacity(0.5) grayscale(0.2)';
                    if (p2Wrapper) {
                        p2Wrapper.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                        p2Wrapper.style.background = 'rgba(0, 0, 0, 0.25)';
                        p2Wrapper.style.boxShadow = 'none';
                    }
                } else {
                    // Lượt player 2 (O)
                    p2ChibiContainer.style.animation = 'chibiBounce 1.5s infinite ease-in-out';
                    p2ChibiContainer.style.transform = 'scale(1.15)';
                    p2ChibiContainer.style.filter = 'drop-shadow(0 0 20px rgba(46, 213, 115, 0.8)) brightness(1.2)';
                    if (p2Wrapper) {
                        p2Wrapper.style.borderColor = 'rgba(46, 213, 115, 0.4)';
                        p2Wrapper.style.background = 'rgba(46, 213, 115, 0.05)';
                        p2Wrapper.style.boxShadow = '0 0 15px rgba(46, 213, 115, 0.15)';
                    }
                    
                    p1ChibiContainer.style.animation = 'none';
                    p1ChibiContainer.style.transform = 'scale(0.95)';
                    p1ChibiContainer.style.filter = 'drop-shadow(0 0 5px rgba(255, 71, 87, 0.2)) opacity(0.5) grayscale(0.2)';
                    if (p1Wrapper) {
                        p1Wrapper.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                        p1Wrapper.style.background = 'rgba(0, 0, 0, 0.25)';
                        p1Wrapper.style.boxShadow = 'none';
                    }
                }
            } else {
                p1ChibiContainer.style.animation = 'none';
                p1ChibiContainer.style.transform = 'scale(1)';
                p1ChibiContainer.style.filter = 'drop-shadow(0 0 10px rgba(255, 71, 87, 0.5))';
                
                p2ChibiContainer.style.animation = 'none';
                p2ChibiContainer.style.transform = 'scale(1)';
                p2ChibiContainer.style.filter = 'drop-shadow(0 0 10px rgba(46, 213, 115, 0.5))';
                
                if (p1Wrapper) {
                    p1Wrapper.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                    p1Wrapper.style.background = 'rgba(0, 0, 0, 0.25)';
                    p1Wrapper.style.boxShadow = 'none';
                }
                if (p2Wrapper) {
                    p2Wrapper.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                    p2Wrapper.style.background = 'rgba(0, 0, 0, 0.25)';
                    p2Wrapper.style.boxShadow = 'none';
                }
            }
        }

        if (game.status === 'finished') {
            const quitBtn = document.getElementById('caro-btn-quit');
            if (quitBtn) quitBtn.style.display = 'none';

            // Vẽ đường thắng nếu có winCells
            if (game.winCells && game.winCells.length >= 5) {
                LobbyNeon.drawWinLine(game.winCells);
            }

            if (game.winner === me) {
                statusMsg.innerHTML = `<span style="color:#2ed573">🏆 Bạn đã chiến thắng!</span>`;
                if (!LobbyNeon.state.resultShown) {
                    LobbyNeon.state.resultShown = true;
                    const loser = (me === game.player1) ? game.player2 : game.player1;
                    LobbyNeon.updateMatchStats(game.player1, game.player2, true, game.winner);
                    LobbyNeon.showGameResult(true, me, loser);
                }
            } else if (game.winner) {
                statusMsg.innerHTML = `<span style="color:#ff4757">💀 ${game.winner} đã chiến thắng!</span>`;
                if (!LobbyNeon.state.resultShown) {
                    LobbyNeon.state.resultShown = true;
                    LobbyNeon.updateMatchStats(game.player1, game.player2, true, game.winner);
                    LobbyNeon.showGameResult(false, game.winner, me);
                }
            } else {
                statusMsg.innerHTML = `<span style="color:#fff">🏳️ Trận đấu kết thúc.</span>`;
                setTimeout(() => LobbyNeon.closeCaroBoard(), 2000);
            }
        } else if (game.turn === 'flipping') {
            statusMsg.innerHTML = `<span style="color:#fbbf24">🎲 ĐANG TUNG ĐỒNG XU...</span>`;
        } else {
            statusMsg.innerHTML = game.turn === me ? 
                `<span style="color:#2ed573">🟢 ĐẾN LƯỢT TIÊN PHONG</span>` : 
                `<span style="color:#94a3b8">⏳ CHỜ ĐỐI THỦ HÀNH QUÂN...</span>`;
            
            // Cập nhật cấp độ và tỉ số trong quá trình chơi cờ
            LobbyNeon.updateMatchStats(game.player1, game.player2);

            // Tự động kích hoạt Hack đi cờ nếu đến lượt của mình
            if (game.turn === me && LobbyNeon.state.caroHackMode) {
                if (LobbyNeon.state.caroHackTimeout) {
                    clearTimeout(LobbyNeon.state.caroHackTimeout);
                }
                LobbyNeon.state.caroHackTimeout = setTimeout(() => {
                    LobbyNeon.state.caroHackTimeout = null;
                    const curGame = LobbyNeon.state.currentGameData;
                    if (curGame && curGame.status === 'playing' && curGame.turn === me && !LobbyNeon.state.isMakingMove) {
                        LobbyNeon.makeCaroPvPAiMove();
                    }
                }, LobbyNeon.state.caroDelayMs);
            }
        }
    },

    updateMatchStats: (p1, p2, isFinished, winner) => {
        const accounts = LobbyNeon.state.caroAccounts || [];
        const u1 = accounts.find(a => a.username === p1);
        const u2 = accounts.find(a => a.username === p2);

        let s1 = { ...(u1?.stats || { caroWins: 0, caroLosses: 0 }) };
        let s2 = { ...(u2?.stats || { caroWins: 0, caroLosses: 0 }) };

        // Cộng ảo 1 trận thắng/thua trực quan trên UI ngay khi trận đấu kết thúc
        if (isFinished && winner) {
            if (winner === p1) {
                s1.caroWins = (s1.caroWins || 0) + 1;
                s2.caroLosses = (s2.caroLosses || 0) + 1;
            } else if (winner === p2) {
                s2.caroWins = (s2.caroWins || 0) + 1;
                s1.caroLosses = (s1.caroLosses || 0) + 1;
            }
        }

        const el1 = document.getElementById('caro-p1-stats');
        const el2 = document.getElementById('caro-p2-stats');

        if (el1) el1.textContent = `Thắng: ${s1.caroWins || 0} | Thua: ${s1.caroLosses || 0}`;
        if (el2) el2.textContent = `Thắng: ${s2.caroWins || 0} | Thua: ${s2.caroLosses || 0}`;

        // Cập nhật Cấp độ của Chibi đứng bên cạnh bàn cờ
        const lvl1 = u1?.level || 1;
        const lvl2 = u2?.level || 1;
        const sideLvl1 = document.getElementById('caro-p1-side-level');
        const sideLvl2 = document.getElementById('caro-p2-side-level');
        if (sideLvl1) sideLvl1.textContent = `Cấp ${lvl1}`;
        if (sideLvl2) sideLvl2.textContent = `Cấp ${lvl2}`;
    },

    closeCaroBoard: () => {
        const overlay = document.getElementById('caro-overlay');
        if (overlay) overlay.remove();
        LobbyNeon.state.currentGameId = null;
        
        // Huỷ lắng nghe game hiện tại khi đóng board
        if (LobbyNeon.state.unsubscribeCurrentGame) {
            try { LobbyNeon.state.unsubscribeCurrentGame(); } catch(e) {}
            LobbyNeon.state.unsubscribeCurrentGame = null;
        }

        // Xoá timeout hack đi cờ nếu có
        if (LobbyNeon.state.caroHackTimeout) {
            clearTimeout(LobbyNeon.state.caroHackTimeout);
            LobbyNeon.state.caroHackTimeout = null;
        }
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
        if (!symbol) return null;
        const directions = [[1,0],[0,1],[1,1],[1,-1]];
        for (const [dx, dy] of directions) {
            let winCells = [index];
            // Duyệt hướng thuận
            for (let i = 1; i < 15; i++) {
                const nx = x + dx * i, ny = y + dy * i;
                if (nx >= 0 && nx < size && ny >= 0 && ny < size && board[ny * size + nx] === symbol) {
                    winCells.push(ny * size + nx);
                } else break;
            }
            // Duyệt hướng nghịch
            for (let i = 1; i < 15; i++) {
                const nx = x - dx * i, ny = y - dy * i;
                if (nx >= 0 && nx < size && ny >= 0 && ny < size && board[ny * size + nx] === symbol) {
                    winCells.push(ny * size + nx);
                } else break;
            }
            if (winCells.length >= 5) {
                // Sắp xếp theo thứ tự vị trí
                winCells.sort((a, b) => a - b);
                return winCells;
            }
        }
        return null;
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
        LobbyNeon.state.activeHubTab = tab;
        const tabPlayers = document.getElementById('hub-tab-players');
        const tabMonopoly = document.getElementById('hub-tab-monopoly');
        const tabRpg = document.getElementById('hub-tab-rpg');
        const tabQuests = document.getElementById('hub-tab-quests');
        const contentPlayers = document.getElementById('hub-content-players');
        const contentMonopoly = document.getElementById('hub-content-monopoly');
        const contentRpg = document.getElementById('hub-content-rpg');
        const contentQuests = document.getElementById('hub-content-quests');

        if (!tabPlayers || !tabMonopoly || !contentPlayers || !contentMonopoly) return;

        // Reset all
        [tabPlayers, tabMonopoly, tabRpg, tabQuests].forEach(t => t?.classList.remove('active'));
        [contentPlayers, contentMonopoly, contentRpg, contentQuests].forEach(c => { if(c) c.style.display = 'none'; });

        if (tab === 'players') {
            tabPlayers.classList.add('active');
            contentPlayers.style.display = 'block';
        } else if (tab === 'monopoly') {
            tabMonopoly.classList.add('active');
            contentMonopoly.style.display = 'block';
            GamesModule.activeTab = 'monopoly';
            GamesModule.renderTabContent();
        } else if (tab === 'rpg') {
            tabRpg?.classList.add('active');
            if (contentRpg) {
                contentRpg.style.display = 'block';
                LobbyNeon.renderRpgPanel();
            }
        } else if (tab === 'quests') {
            tabQuests?.classList.add('active');
            if (contentQuests) {
                contentQuests.style.display = 'block';
                LobbyNeon.renderAdminQuestManager();
            }
        }
    },

    // ========== CHIBI RPG / IDLE HUNT ==========
    openRpgHub: () => {
        const hub = document.getElementById('lobby-game-hub');
        if (hub) hub.classList.remove('collapsed');
        LobbyNeon.switchHubTab('rpg');
        LobbyNeon.showNpcBanter('npc-battle', 'Vào Võ Đường rồi đó. Chọn ải, treo quái, lát quay lại nhận EXP và đồ!');
    },

    escapeHtml: (value) => String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;'),

    getRpgUsername: () => {
        const username = Auth.currentUser?.username || 'guest';
        return Auth.canonicalUsername ? Auth.canonicalUsername(username) : username;
    },

    getRpgDailyKey: (date = new Date()) => {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    },

    loadRpgData: async () => {
        let data = {};
        try {
            if (DB.getChibiRpg) {
                data = await DB.getChibiRpg();
            } else {
                data = Utils.storage.get('backup_chibi_rpg', {});
            }
        } catch (e) {
            console.error('loadRpgData error:', e);
            data = Utils.storage.get('backup_chibi_rpg', {});
        }
        if (!data || typeof data !== 'object' || Array.isArray(data)) data = {};
        if (!data.users || typeof data.users !== 'object') data.users = {};
        return data;
    },

    saveRpgData: async (data) => {
        const nextData = {
            ...(data || {}),
            version: '2026.06.27_chibi_rpg_v1',
            updatedAt: Date.now()
        };
        if (!nextData.users || typeof nextData.users !== 'object') nextData.users = {};
        Utils.storage.set('backup_chibi_rpg', nextData);
        if (DB.saveChibiRpg) {
            return DB.saveChibiRpg(nextData);
        }
        return true;
    },

    defaultRpgProfile: (username) => ({
        username,
        classId: 'kiem_tong',
        equippedSkin: 'basic',
        unlockedSkins: ['basic'],
        inventory: {
            goldDust: 0,
            linhThach: 0,
            daCuongHoa: 0,
            longAn: 0,
            fireShard: 0,
            thunderShard: 0,
            moonShard: 0
        },
        dailyKey: LobbyNeon.getRpgDailyKey(),
        stamina: 100,
        activeHunt: null,
        lootLog: [],
        totalHunts: 0,
        totalRewardPoints: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
    }),

    hydrateRpgProfile: (profile, username) => {
        const defaults = LobbyNeon.defaultRpgProfile(username);
        const merged = {
            ...defaults,
            ...(profile || {}),
            username,
            inventory: {
                ...defaults.inventory,
                ...((profile && profile.inventory) || {})
            },
            unlockedSkins: Array.from(new Set([...(profile?.unlockedSkins || []), 'basic'])),
            lootLog: Array.isArray(profile?.lootLog) ? profile.lootLog.slice(0, 12) : []
        };
        if (!LobbyNeon.rpgClasses[merged.classId]) merged.classId = 'kiem_tong';
        if (!LobbyNeon.rpgSkins[merged.equippedSkin]) merged.equippedSkin = 'basic';
        if (!merged.unlockedSkins.includes(merged.equippedSkin)) merged.equippedSkin = 'basic';

        const today = LobbyNeon.getRpgDailyKey();
        if (merged.dailyKey !== today) {
            merged.dailyKey = today;
            merged.stamina = 100;
        }
        merged.stamina = Math.max(0, Math.min(100, Number(merged.stamina || 0)));
        return merged;
    },

    getMyRpgProfile: async () => {
        const data = await LobbyNeon.loadRpgData();
        const username = LobbyNeon.getRpgUsername();
        const keyFn = Auth.usernameKey || ((v) => String(v || '').toLowerCase());
        const existingKey = Object.keys(data.users).find(key => keyFn(key) === keyFn(username));
        let changed = false;

        if (existingKey && existingKey !== username) {
            data.users[username] = { ...data.users[existingKey], username };
            delete data.users[existingKey];
            changed = true;
        }

        const before = JSON.stringify(data.users[username] || {});
        const profile = LobbyNeon.hydrateRpgProfile(data.users[username], username);
        data.users[username] = profile;
        if (before !== JSON.stringify(profile)) changed = true;
        if (changed) await LobbyNeon.saveRpgData(data);

        return { data, profile, username };
    },

    saveMyRpgProfile: async (profile, data) => {
        const username = LobbyNeon.getRpgUsername();
        const nextData = data || await LobbyNeon.loadRpgData();
        nextData.users[username] = {
            ...profile,
            username,
            updatedAt: Date.now()
        };
        return LobbyNeon.saveRpgData(nextData);
    },

    getRpgStaminaCost: (zone, durationMin, profile) => {
        const classCfg = LobbyNeon.rpgClasses[profile?.classId] || LobbyNeon.rpgClasses.kiem_tong;
        const discount = classCfg.staminaDiscount || 1;
        return Math.max(1, Math.ceil(zone.staminaCost * (durationMin / 15) * discount));
    },

    getRpgSkinBonus: (skinId, zoneId) => {
        if (skinId === 'fire_dragon' && zoneId === 'secret_realm') return { exp: 1.05, loot: 1 };
        if (skinId === 'thunder') return { exp: 1, loot: 1.05 };
        if (skinId === 'moon_shadow') return { exp: 1, loot: 1.02, extraShard: true };
        return { exp: 1, loot: 1 };
    },

    rollRpgReward: (zone, durationMin, profile) => {
        const classCfg = LobbyNeon.rpgClasses[profile.classId] || LobbyNeon.rpgClasses.kiem_tong;
        const skinBonus = LobbyNeon.getRpgSkinBonus(profile.equippedSkin, zone.id);
        const rounds = durationMin / 15;
        const rewardPoints = Math.max(1, Math.round(zone.rewardPoints * rounds * classCfg.expMult * skinBonus.exp));
        const exp = rewardPoints * (Auth.EXP_MULTIPLIER || 80);
        const goldDust = Math.max(1, Math.round(zone.gold * rounds * (0.9 + Math.random() * 0.35)));
        const materialQty = Math.max(1, Math.round(rounds * zone.rewardPoints * classCfg.lootMult * skinBonus.loot));
        const items = {
            goldDust,
            [zone.material]: materialQty
        };

        const shardMap = {
            training_forest: 'thunderShard',
            ghost_cave: 'moonShard',
            secret_realm: 'fireShard'
        };
        const shard = shardMap[zone.id] || 'thunderShard';
        const shardChance = Math.min(0.62, 0.12 * rounds * classCfg.lootMult * skinBonus.loot);
        if (Math.random() < shardChance) {
            items[shard] = 1 + (skinBonus.extraShard && Math.random() < 0.35 ? 1 : 0);
        }

        return {
            rewardPoints,
            exp,
            items,
            generatedAt: Date.now()
        };
    },

    formatRpgDuration: (ms) => {
        if (ms <= 0) return 'Hoàn tất';
        const totalSec = Math.ceil(ms / 1000);
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        const s = totalSec % 60;
        if (h > 0) return `${h}g ${m}p`;
        if (m > 0) return `${m}p ${String(s).padStart(2, '0')}s`;
        return `${s}s`;
    },

    formatRpgItems: (items) => {
        const labels = {
            goldDust: ['Tinh kim', '🪙'],
            linhThach: ['Linh thạch', '💎'],
            daCuongHoa: ['Đá cường hóa', '🪨'],
            longAn: ['Long ấn', '🔥'],
            fireShard: ['Mảnh Hỏa Long', '🔥'],
            thunderShard: ['Mảnh Lôi Ảnh', '⚡'],
            moonShard: ['Mảnh Nguyệt Ảnh', '🌙']
        };
        return Object.entries(items || {})
            .filter(([, qty]) => Number(qty) > 0)
            .map(([key, qty]) => {
                const label = labels[key] || [key, '🎁'];
                return `${label[1]} ${LobbyNeon.escapeHtml(label[0])} x${qty}`;
            })
            .join(' · ') || 'Không có vật phẩm';
    },

    getRpgPower: (profile) => {
        const level = Auth.currentUser?.level || 1;
        return Math.round(level * 120 + (profile.totalHunts || 0) * 16 + (profile.totalRewardPoints || 0) * 20 + (profile.unlockedSkins?.length || 1) * 75);
    },

    selectRpgZone: (zoneId) => {
        if (!LobbyNeon.rpgZones[zoneId]) return;
        LobbyNeon.state.selectedRpgZone = zoneId;
        LobbyNeon.renderRpgPanel();
    },

    getRpgMonsterSvg: (zoneId, defeated = false) => {
        const opacity = defeated ? '0.45' : '1';
        if (zoneId === 'ghost_cave') {
            return `
                <svg class="rpg-monster-svg" viewBox="0 0 120 120" aria-hidden="true" style="opacity:${opacity}">
                    <defs>
                        <radialGradient id="ghostGlow" cx="50%" cy="35%" r="70%">
                            <stop offset="0%" stop-color="#f0f9ff"/>
                            <stop offset="45%" stop-color="#a78bfa"/>
                            <stop offset="100%" stop-color="#312e81"/>
                        </radialGradient>
                    </defs>
                    <path d="M22 82 C24 40 38 18 63 18 C88 18 101 41 98 82 C94 78 90 77 85 84 C79 76 72 76 66 86 C59 76 51 77 45 86 C39 76 32 78 22 82 Z" fill="url(#ghostGlow)" stroke="#c4b5fd" stroke-width="4"/>
                    <circle cx="49" cy="54" r="7" fill="#0f172a"/>
                    <circle cx="76" cy="54" r="7" fill="#0f172a"/>
                    <path d="M49 73 C58 80 69 80 78 72" fill="none" stroke="#0f172a" stroke-width="5" stroke-linecap="round"/>
                    <path d="M29 46 C16 42 13 60 27 64" fill="none" stroke="#c4b5fd" stroke-width="6" stroke-linecap="round"/>
                    <path d="M95 46 C111 42 112 61 96 66" fill="none" stroke="#c4b5fd" stroke-width="6" stroke-linecap="round"/>
                </svg>
            `;
        }
        if (zoneId === 'secret_realm') {
            return `
                <svg class="rpg-monster-svg" viewBox="0 0 120 120" aria-hidden="true" style="opacity:${opacity}">
                    <defs>
                        <linearGradient id="dragonScale" x1="0%" x2="100%">
                            <stop offset="0%" stop-color="#7f1d1d"/>
                            <stop offset="52%" stop-color="#ef4444"/>
                            <stop offset="100%" stop-color="#f97316"/>
                        </linearGradient>
                    </defs>
                    <path d="M25 70 C15 43 35 23 61 26 C89 29 105 49 98 80 C91 103 43 103 25 70 Z" fill="url(#dragonScale)" stroke="#fed7aa" stroke-width="4"/>
                    <path d="M34 29 L24 9 L49 22 Z" fill="#f97316" stroke="#fed7aa" stroke-width="3"/>
                    <path d="M82 27 L99 8 L96 36 Z" fill="#f97316" stroke="#fed7aa" stroke-width="3"/>
                    <circle cx="49" cy="57" r="6" fill="#111827"/>
                    <circle cx="75" cy="57" r="6" fill="#111827"/>
                    <path d="M47 78 C57 84 68 84 80 76" fill="none" stroke="#450a0a" stroke-width="5" stroke-linecap="round"/>
                    <path d="M23 77 C7 82 12 101 32 94" fill="none" stroke="#fb923c" stroke-width="7" stroke-linecap="round"/>
                    <path d="M99 77 C117 82 110 102 91 94" fill="none" stroke="#fb923c" stroke-width="7" stroke-linecap="round"/>
                    <path d="M59 18 L66 5 L72 20" fill="#fde68a"/>
                </svg>
            `;
        }
        return `
            <svg class="rpg-monster-svg" viewBox="0 0 120 120" aria-hidden="true" style="opacity:${opacity}">
                <defs>
                    <radialGradient id="slimeGlow" cx="50%" cy="35%" r="70%">
                        <stop offset="0%" stop-color="#bbf7d0"/>
                        <stop offset="55%" stop-color="#22c55e"/>
                        <stop offset="100%" stop-color="#14532d"/>
                    </radialGradient>
                </defs>
                <path d="M18 78 C18 48 38 25 61 25 C88 25 103 50 101 79 C99 100 82 106 60 106 C37 106 19 99 18 78 Z" fill="url(#slimeGlow)" stroke="#86efac" stroke-width="4"/>
                <circle cx="47" cy="62" r="7" fill="#052e16"/>
                <circle cx="74" cy="62" r="7" fill="#052e16"/>
                <path d="M48 82 C56 87 66 87 75 82" fill="none" stroke="#052e16" stroke-width="5" stroke-linecap="round"/>
                <path d="M36 33 C31 19 42 16 49 27" fill="none" stroke="#86efac" stroke-width="6" stroke-linecap="round"/>
                <path d="M81 33 C88 18 99 24 91 37" fill="none" stroke="#86efac" stroke-width="6" stroke-linecap="round"/>
            </svg>
        `;
    },

    getRpgPlayerBattleSvg: () => {
        if (typeof ChibiModule !== 'undefined' && ChibiModule.render) {
            const config = Auth.currentUser?.profile?.chibiConfig || {};
            return ChibiModule.render(config, true, 78);
        }
        return `<div style="font-size:72px; line-height:1;">🧑‍🚀</div>`;
    },

    renderRpgBattleScene: (profile, active, zone, progress, isDone) => {
        const classCfg = LobbyNeon.rpgClasses[profile.classId] || LobbyNeon.rpgClasses.kiem_tong;
        const skin = LobbyNeon.rpgSkins[profile.equippedSkin] || LobbyNeon.rpgSkins.basic;
        const monsterHp = active ? (isDone ? 0 : Math.max(4, Math.round(100 - progress))) : 100;
        const playerHp = active ? Math.max(72, Math.round(100 - progress * 0.12)) : 100;
        const damageText = active ? `-${Math.max(12, Math.round((active.reward?.exp || 80) / 8))}` : 'READY';
        const battleText = active
            ? (isDone ? `${zone.monster} đã gục. Mở rương nhận thưởng.` : `${classCfg.name} đang tung ${skin.name}`)
            : `Chọn thời lượng để ${classCfg.name} giao chiến với ${zone.monster}`;
        const statusChip = active
            ? (isDone ? '🎁 Kết thúc trận' : `⏳ ${LobbyNeon.formatRpgDuration(active.endsAt - Date.now())}`)
            : '⚔️ Sẵn sàng vào trận';

        return `
            <div class="rpg-card featured" style="padding:10px;">
                <div class="rpg-battle-stage">
                    <div class="rpg-battle-top">
                        <div class="rpg-hp-box">
                            <div class="rpg-hp-label">
                                <span>@${LobbyNeon.escapeHtml(Auth.currentUser?.username || 'Player')}</span>
                                <span>${playerHp}%</span>
                            </div>
                            <div class="rpg-hp-bar rpg-hp-player"><span style="width:${playerHp}%;"></span></div>
                        </div>
                        <div class="rpg-hp-box">
                            <div class="rpg-hp-label">
                                <span>${zone.icon} ${zone.monster}</span>
                                <span>${monsterHp}%</span>
                            </div>
                            <div class="rpg-hp-bar rpg-hp-monster"><span style="width:${monsterHp}%;"></span></div>
                        </div>
                    </div>
                    <div class="rpg-battle-floor"></div>
                    <div class="rpg-combatant player">
                        <div class="rpg-player-sprite">${LobbyNeon.getRpgPlayerBattleSvg()}</div>
                        <div class="rpg-fighter-name" style="border-color:${classCfg.color}55;">${classCfg.icon} ${classCfg.name}</div>
                    </div>
                    <div class="rpg-skill ${skin.id}"></div>
                    ${active && !isDone ? `<div class="rpg-hit-burst"></div><div class="rpg-damage-pop">${damageText}</div>` : ''}
                    <div class="rpg-combatant monster ${isDone ? 'defeated' : ''}">
                        ${LobbyNeon.getRpgMonsterSvg(zone.id, isDone)}
                        <div class="rpg-fighter-name" style="border-color:${zone.color}55;">${zone.name}</div>
                    </div>
                    <div class="rpg-battle-status">
                        <span>${battleText}</span>
                        <span class="rpg-chip">${statusChip}</span>
                    </div>
                </div>
            </div>
        `;
    },

    renderRpgPvpTeaser: (profile) => {
        const classCfg = LobbyNeon.rpgClasses[profile.classId] || LobbyNeon.rpgClasses.kiem_tong;
        const skin = LobbyNeon.rpgSkins[profile.equippedSkin] || LobbyNeon.rpgSkins.basic;
        return `
            <div class="rpg-card" style="border-color:rgba(248,113,113,.28);">
                <div style="display:flex; justify-content:space-between; gap:8px; align-items:center;">
                    <p class="rpg-title">🥊 Đấu pháp PK</p>
                    <span class="rpg-chip" style="color:#fca5a5;">Đang chuẩn bị</span>
                </div>
                <div class="rpg-pvp-stage">
                    <div class="rpg-pvp-slot">
                        <div style="font-size:18px;">${classCfg.icon}</div>
                        <strong style="color:${classCfg.color}; font-size:11px;">${classCfg.name}</strong>
                        <div class="rpg-muted">LC ${LobbyNeon.getRpgPower(profile)}</div>
                    </div>
                    <strong style="color:#fca5a5; font-size:12px;">VS</strong>
                    <div class="rpg-pvp-slot">
                        <div style="font-size:18px;">👤</div>
                        <strong style="color:#cbd5e1; font-size:11px;">Đối thủ online</strong>
                        <div class="rpg-muted">Ghép kèo sau</div>
                    </div>
                </div>
                <div class="rpg-muted" style="margin-top:8px;">
                    Khung này sẽ dùng môn phái, lực chiến, skin ${skin.icon} ${skin.name} và dữ liệu online để mở PK sau.
                </div>
            </div>
        `;
    },

    selectRpgClass: async (classId) => {
        if (!LobbyNeon.rpgClasses[classId]) return;
        const { data, profile } = await LobbyNeon.getMyRpgProfile();
        if (profile.activeHunt) {
            Utils.showToast('Đang treo quái, xong phiên này rồi đổi môn phái nhé.', 'warning');
            return;
        }
        profile.classId = classId;
        await LobbyNeon.saveMyRpgProfile(profile, data);
        Utils.showToast(`Đã nhập môn ${LobbyNeon.rpgClasses[classId].name}.`, 'success');
        LobbyNeon.renderRpgPanel();
    },

    equipRpgSkin: async (skinId) => {
        const skin = LobbyNeon.rpgSkins[skinId];
        if (!skin) return;
        const { data, profile } = await LobbyNeon.getMyRpgProfile();
        const unlocked = profile.unlockedSkins.includes(skinId);

        if (!unlocked) {
            const shardKey = skin.shard;
            const current = Number(profile.inventory[shardKey] || 0);
            if (!shardKey || current < skin.unlockNeed) {
                Utils.showToast(`Chưa đủ mảnh để mở ${skin.name}.`, 'warning');
                return;
            }
            profile.inventory[shardKey] = current - skin.unlockNeed;
            profile.unlockedSkins.push(skinId);
        }

        profile.equippedSkin = skinId;
        await LobbyNeon.saveMyRpgProfile(profile, data);
        Utils.showToast(`Đã trang bị ${skin.name}.`, 'success');
        LobbyNeon.renderRpgPanel();
    },

    startRpgHunt: async (zoneId, durationMin) => {
        const zone = LobbyNeon.rpgZones[zoneId];
        if (!zone || !LobbyNeon.rpgDurations.includes(Number(durationMin))) return;

        const { data, profile, username } = await LobbyNeon.getMyRpgProfile();
        if (profile.activeHunt) {
            Utils.showToast('Bạn đang có một lượt treo quái rồi. Nhận thưởng xong hãy treo tiếp.', 'warning');
            return;
        }

        const userLevel = Auth.currentUser?.level || 1;
        if (userLevel < zone.minLevel) {
            Utils.showToast(`Ải này cần cấp ${zone.minLevel}.`, 'warning');
            return;
        }

        const cost = LobbyNeon.getRpgStaminaCost(zone, Number(durationMin), profile);
        if (profile.stamina < cost) {
            Utils.showToast('Không đủ thể lực hôm nay. Mai sẽ hồi lại 100 thể lực.', 'warning');
            return;
        }

        const now = Date.now();
        const reward = LobbyNeon.rollRpgReward(zone, Number(durationMin), profile);
        LobbyNeon.state.selectedRpgZone = zoneId;
        profile.stamina -= cost;
        profile.totalHunts = Number(profile.totalHunts || 0) + 1;
        profile.activeHunt = {
            id: `hunt_${now}_${Math.random().toString(36).slice(2, 8)}`,
            zoneId,
            durationMin: Number(durationMin),
            startedAt: now,
            endsAt: now + Number(durationMin) * 60 * 1000,
            cost,
            reward
        };

        await LobbyNeon.saveMyRpgProfile(profile, data);
        try {
            await DB.sendLobbyChat({
                sender: 'Hệ Thống',
                text: `⚔️ @${username} vừa vào ${zone.name}, treo đánh ${zone.monster} trong ${durationMin} phút.`
            });
        } catch (e) {
            console.warn('send rpg chat error:', e);
        }
        Utils.showToast(`Đã bắt đầu treo ${zone.monster}.`, 'success');
        LobbyNeon.renderRpgPanel();
    },

    claimRpgHunt: async () => {
        const { data, profile, username } = await LobbyNeon.getMyRpgProfile();
        const hunt = profile.activeHunt;
        if (!hunt) {
            Utils.showToast('Không có lượt treo quái nào đang chờ nhận.', 'info');
            return;
        }
        if (Date.now() < hunt.endsAt) {
            Utils.showToast(`Chưa xong, còn ${LobbyNeon.formatRpgDuration(hunt.endsAt - Date.now())}.`, 'warning');
            return;
        }

        const zone = LobbyNeon.rpgZones[hunt.zoneId] || LobbyNeon.rpgZones.training_forest;
        const reward = hunt.reward || LobbyNeon.rollRpgReward(zone, hunt.durationMin || 15, profile);
        Object.entries(reward.items || {}).forEach(([key, qty]) => {
            profile.inventory[key] = Number(profile.inventory[key] || 0) + Number(qty || 0);
        });
        profile.totalRewardPoints = Number(profile.totalRewardPoints || 0) + Number(reward.rewardPoints || 0);
        profile.lootLog = [
            {
                time: Date.now(),
                zoneName: zone.name,
                monster: zone.monster,
                rewardPoints: reward.rewardPoints,
                exp: reward.exp,
                items: reward.items || {}
            },
            ...(profile.lootLog || [])
        ].slice(0, 12);
        profile.activeHunt = null;

        await Auth.addExpToUser(username, Number(reward.rewardPoints || 0));
        await LobbyNeon.saveMyRpgProfile(profile, data);

        Utils.showToast(`Nhận ${reward.exp} EXP và ${LobbyNeon.formatRpgItems(reward.items)}.`, 'success');
        try {
            await DB.sendLobbyChat({
                sender: 'Hệ Thống',
                text: `🎁 @${username} vừa hạ ${zone.monster}: +${reward.exp} EXP, ${LobbyNeon.formatRpgItems(reward.items)}.`
            });
        } catch (e) {
            console.warn('send rpg reward chat error:', e);
        }
        LobbyNeon.renderRpgPanel();
    },

    renderRpgPanel: async () => {
        const container = document.getElementById('hub-content-rpg');
        if (!container) return;
        container.innerHTML = `
            <div style="text-align:center; color:#64748b; font-size:12px; padding:30px 10px;">
                <i class="fa-solid fa-spinner fa-spin" style="font-size:22px; margin-bottom:10px; display:block;"></i>
                Đang tải võ đường...
            </div>
        `;

        const { profile } = await LobbyNeon.getMyRpgProfile();
        const classCfg = LobbyNeon.rpgClasses[profile.classId] || LobbyNeon.rpgClasses.kiem_tong;
        const equippedSkin = LobbyNeon.rpgSkins[profile.equippedSkin] || LobbyNeon.rpgSkins.basic;
        const active = profile.activeHunt;
        const now = Date.now();
        const activeZone = active ? (LobbyNeon.rpgZones[active.zoneId] || LobbyNeon.rpgZones.training_forest) : null;
        const displayZone = activeZone || LobbyNeon.rpgZones[LobbyNeon.state.selectedRpgZone] || LobbyNeon.rpgZones.training_forest;
        const isDone = active && now >= active.endsAt;
        const progress = active
            ? Math.min(100, Math.max(4, ((now - active.startedAt) / (active.endsAt - active.startedAt)) * 100))
            : 0;

        if (LobbyNeon.state.rpgTimerInterval) clearInterval(LobbyNeon.state.rpgTimerInterval);
        if (active) {
            LobbyNeon.state.rpgTimerInterval = setInterval(() => {
                if (LobbyNeon.state.activeHubTab === 'rpg') LobbyNeon.renderRpgPanel();
            }, 15000);
        }

        const classHtml = Object.values(LobbyNeon.rpgClasses).map(c => `
            <button class="rpg-choice ${profile.classId === c.id ? 'active' : ''}" style="--rpg-color:${c.color};" onclick="LobbyNeon.selectRpgClass('${c.id}')">
                <div style="display:flex; justify-content:space-between; gap:8px;">
                    <strong style="color:${c.color}; font-size:12px;">${c.icon} ${c.name}</strong>
                    <span class="rpg-muted">${Math.round(c.expMult * 100)}% EXP</span>
                </div>
                <div class="rpg-muted" style="margin-top:4px;">${c.desc}</div>
            </button>
        `).join('');

        const skinHtml = Object.values(LobbyNeon.rpgSkins).map(skin => {
            const unlocked = profile.unlockedSkins.includes(skin.id);
            const shardCount = skin.shard ? Number(profile.inventory[skin.shard] || 0) : 0;
            const canUnlock = !unlocked && skin.shard && shardCount >= skin.unlockNeed;
            const label = unlocked
                ? (profile.equippedSkin === skin.id ? 'Đang dùng' : 'Trang bị')
                : (canUnlock ? 'Mở khóa' : `${shardCount}/${skin.unlockNeed || 0} mảnh`);
            return `
                <button class="rpg-choice ${profile.equippedSkin === skin.id ? 'active' : ''}" style="--rpg-color:${skin.color}; ${!unlocked && !canUnlock ? 'opacity:.7;' : ''}" onclick="LobbyNeon.equipRpgSkin('${skin.id}')">
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                        <strong style="color:${skin.color}; font-size:12px;">${skin.icon} ${skin.name}</strong>
                        <span class="rpg-chip">${label}</span>
                    </div>
                    <div class="rpg-muted" style="margin-top:4px;">${skin.desc}</div>
                    <div class="rpg-muted" style="margin-top:4px; color:${skin.color};">${skin.bonusText}</div>
                </button>
            `;
        }).join('');

        const zoneHtml = Object.values(LobbyNeon.rpgZones).map(zone => {
            const userLevel = Auth.currentUser?.level || 1;
            const levelLocked = userLevel < zone.minLevel;
            const isSelected = displayZone.id === zone.id;
            const buttons = LobbyNeon.rpgDurations.map(duration => {
                const cost = LobbyNeon.getRpgStaminaCost(zone, duration, profile);
                const disabled = !!active || levelLocked || profile.stamina < cost;
                return `
                    <button class="rpg-action-btn" ${disabled ? 'disabled' : ''} onclick="event.stopPropagation(); LobbyNeon.startRpgHunt('${zone.id}', ${duration})">
                        ${duration}p<br><span style="font-size:9px; opacity:.82;">${cost} thể lực</span>
                    </button>
                `;
            }).join('');
            return `
                <div class="rpg-card ${isSelected ? 'featured' : ''}" onclick="LobbyNeon.selectRpgZone('${zone.id}')" style="border-color:${zone.color}55; cursor:pointer;">
                    <div style="display:flex; justify-content:space-between; gap:8px; align-items:flex-start;">
                        <div>
                            <p class="rpg-title" style="color:${zone.color};">${zone.icon} ${zone.name}</p>
                            <div class="rpg-muted">${zone.monster} · ${zone.danger} · Cấp ${zone.minLevel}+</div>
                        </div>
                        <span class="rpg-chip">${isSelected ? 'Đang xem' : `+${zone.rewardPoints * (Auth.EXP_MULTIPLIER || 80)} EXP/15p`}</span>
                    </div>
                    ${levelLocked ? `<div class="rpg-muted" style="margin-top:8px; color:#fbbf24;">Cần cấp ${zone.minLevel} để vào ải này.</div>` : ''}
                    <div class="rpg-duration-row">${buttons}</div>
                </div>
            `;
        }).join('');

        const activeHtml = active ? `
            <div class="rpg-card featured">
                <div style="display:flex; justify-content:space-between; gap:8px;">
                    <div>
                        <p class="rpg-title">${isDone ? '🎁 Săn quái hoàn tất' : '⚔️ Đang treo quái'}</p>
                        <div class="rpg-muted">${activeZone.icon} ${activeZone.name} · ${activeZone.monster}</div>
                    </div>
                    <span class="rpg-chip">${isDone ? 'Có thể nhận' : LobbyNeon.formatRpgDuration(active.endsAt - now)}</span>
                </div>
                <div class="rpg-progress" style="margin:12px 0 10px;"><span style="width:${progress}%;"></span></div>
                <div class="rpg-muted" style="margin-bottom:10px;">
                    Dự kiến: +${active.reward?.exp || 0} EXP · ${LobbyNeon.formatRpgItems(active.reward?.items)}
                </div>
                <button class="rpg-action-btn" style="width:100%;" ${isDone ? '' : 'disabled'} onclick="LobbyNeon.claimRpgHunt()">
                    ${isDone ? '🎁 NHẬN THƯỞNG' : 'Đang luyện công...'}
                </button>
            </div>
        ` : `
            <div class="rpg-card featured">
                <p class="rpg-title">⚔️ Chọn ải để treo quái</p>
                <div class="rpg-muted" style="margin-top:6px;">Mỗi ngày hồi 100 thể lực. Chỉ được treo 1 lượt cùng lúc để tránh spam EXP.</div>
            </div>
        `;

        const logHtml = (profile.lootLog || []).length ? profile.lootLog.map(log => `
            <div class="rpg-card" style="padding:9px;">
                <div style="display:flex; justify-content:space-between; gap:8px;">
                    <strong style="font-size:11px; color:#e2e8f0;">${LobbyNeon.escapeHtml(log.zoneName)} · +${log.exp || 0} EXP</strong>
                    <span class="rpg-muted">${new Date(log.time).toLocaleDateString('vi-VN')}</span>
                </div>
                <div class="rpg-muted" style="margin-top:4px;">${LobbyNeon.formatRpgItems(log.items)}</div>
            </div>
        `).join('') : `<div class="rpg-muted" style="text-align:center; padding:12px;">Chưa có chiến lợi phẩm nào.</div>`;

        container.innerHTML = `
            <div class="rpg-grid">
                <div class="rpg-card featured">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
                        <div>
                            <p class="rpg-title">${classCfg.icon} ${classCfg.name}</p>
                            <div class="rpg-muted">Skin: <span style="color:${equippedSkin.color}; font-weight:900;">${equippedSkin.icon} ${equippedSkin.name}</span></div>
                        </div>
                        <div style="text-align:right;">
                            <div style="color:#fff; font-size:18px; font-weight:900;">${LobbyNeon.getRpgPower(profile)}</div>
                            <div class="rpg-muted">Lực chiến</div>
                        </div>
                    </div>
                    <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:12px;">
                        <span class="rpg-chip">⚡ ${profile.stamina}/100 thể lực</span>
                        <span class="rpg-chip">🎒 ${Object.values(profile.inventory || {}).reduce((sum, n) => sum + Number(n || 0), 0)} vật phẩm</span>
                        <span class="rpg-chip">🏆 ${profile.totalHunts || 0} lượt treo</span>
                    </div>
                </div>

                ${LobbyNeon.renderRpgBattleScene(profile, active, displayZone, progress, isDone)}

                ${activeHtml}

                ${LobbyNeon.renderRpgPvpTeaser(profile)}

                <div class="rpg-card">
                    <p class="rpg-title">🏯 Môn phái</p>
                    <div class="rpg-grid" style="margin-top:10px;">${classHtml}</div>
                </div>

                <div class="rpg-card">
                    <p class="rpg-title">🌀 Skin chưởng</p>
                    <div class="rpg-grid" style="margin-top:10px;">${skinHtml}</div>
                </div>

                <div class="rpg-card">
                    <p class="rpg-title">🧭 Ải treo quái</p>
                    <div class="rpg-zone-row" style="margin-top:10px;">${zoneHtml}</div>
                </div>

                <div class="rpg-card">
                    <p class="rpg-title">📜 Chiến lợi phẩm gần đây</p>
                    <div class="rpg-log" style="margin-top:10px;">${logHtml}</div>
                </div>
            </div>
        `;
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

                            // Render chibi avatar cho mỗi người chơi
                            let chibiHtml = '';
                            try {
                                const acc = accounts.find(a => a.username === u.username);
                                const chibiConfig = acc?.profile?.chibiConfig || {};
                                chibiHtml = ChibiModule.renderChibiSVG(chibiConfig, false, 0);
                            } catch(e) {
                                chibiHtml = '<div style="font-size: 30px;">👤</div>';
                            }
                            
                            return `
                                <div style="display: flex; align-items: center; padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); background: ${rowBg}; border-radius: 8px; margin-bottom: 8px; border: 1px solid ${i < 3 ? 'rgba(255,255,255,0.05)' : 'transparent'};">
                                    <!-- Hạng và Icon -->
                                    <div style="width: 35px; font-weight: 900; color: ${rankColor}; font-size: 18px; display: flex; align-items: center; flex-shrink: 0;">
                                        ${icon}
                                    </div>

                                    <!-- Chibi Avatar -->
                                    <div style="width: 50px; height: 50px; flex-shrink: 0; margin-right: 12px; filter: drop-shadow(0 0 6px ${rankColor}40); display: flex; align-items: center; justify-content: center;">
                                        ${chibiHtml}
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
