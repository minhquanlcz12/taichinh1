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
        rpgWorldInterval: null,
        rpgWildInterval: null,
        rpgHudInterval: null,
        rpgAutoFarmInterval: null,
        rpgAutoFarm: false,
        rpgAutoFarmBusy: false,
        rpgMaxWildMonsters: 4,
        rpgLastWildSpawnAt: 0,
        rpgLastAutoSkinId: null,
        rpgLastAutoToastAt: 0,
        rpgWildMonsters: {},
        selectedWildMonsterId: null,
        rpgSkillCooldownUntil: 0,
        rpgLastSkillCast: null,
        rpgBagOpen: false,
        rpgBagFilter: 'all',
        rpgBagSortMode: 'rarity',
        rpgSelectedItemKey: null,
        rpgBossBattle: null,
        marqueeInterval: null,
        unsubscribeMissions: null,
        notifiedMissionIds: new Set(),
        activeQuestTab: 'new',
        activeHubTab: 'players',
        selectedRpgZone: 'training_forest',
        rpgZoneManuallySelected: false,
        rpgMapOpen: false,
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
        },
        molten_keep: {
            id: 'molten_keep',
            name: 'Lò Lửa Deadline',
            icon: '🌋',
            monster: 'Hỏa Ma',
            color: '#fb923c',
            danger: 'Rất khó',
            minLevel: 10,
            staminaCost: 25,
            rewardPoints: 5,
            gold: 88,
            material: 'longAn',
            materialName: 'Long ấn',
            materialIcon: '🔥'
        },
        frost_peak: {
            id: 'frost_peak',
            name: 'Đỉnh Băng Bug',
            icon: '🏔️',
            monster: 'Băng Yêu',
            color: '#60a5fa',
            danger: 'Ác mộng',
            minLevel: 15,
            staminaCost: 32,
            rewardPoints: 7,
            gold: 132,
            material: 'daCuongHoa',
            materialName: 'Đá cường hóa',
            materialIcon: '🪨'
        },
        abyss_gate: {
            id: 'abyss_gate',
            name: 'Cổng Vực Sâu',
            icon: '🕳️',
            monster: 'Ma Vương Vực Sâu',
            color: '#c084fc',
            danger: 'Địa ngục',
            minLevel: 22,
            staminaCost: 42,
            rewardPoints: 10,
            gold: 190,
            material: 'longAn',
            materialName: 'Long ấn',
            materialIcon: '🔥'
        }
    },

    rpgDurations: [15, 30, 60],

    rpgEquipmentRarities: {
        white: { id: 'white', name: 'Trang bi trang', color: '#e5e7eb', rank: 1, attrLines: 1, sale: 18, normal: true },
        blue: { id: 'blue', name: 'Xanh lam', color: '#38bdf8', rank: 2, attrLines: 2, sale: 55, normal: true },
        yellow: { id: 'yellow', name: 'Vang', color: '#facc15', rank: 3, attrLines: 3, sale: 110, normal: true },
        green: { id: 'green', name: 'Tinh anh xanh luc', color: '#22c55e', rank: 4, attrLines: 4, sale: 190, normal: true },
        orange: { id: 'orange', name: 'Cam boss', color: '#fb923c', rank: 5, attrLines: 5, sale: 360, boss: true },
        pink: { id: 'pink', name: 'Hong boss', color: '#f472b6', rank: 6, attrLines: 6, sale: 620, boss: true },
        red: { id: 'red', name: 'Do boss', color: '#ef4444', rank: 7, attrLines: 6, sale: 950, boss: true }
    },

    rpgEquipmentSlotMeta: {
        weapon: { id: 'weapon', label: 'Vu khi', icon: 'WPN' },
        helm: { id: 'helm', label: 'Mu', icon: 'HLM' },
        armor: { id: 'armor', label: 'Ao', icon: 'ARM' },
        pants: { id: 'pants', label: 'Quan', icon: 'LEG' },
        glove: { id: 'glove', label: 'Gang', icon: 'GLV' },
        boots: { id: 'boots', label: 'Giay', icon: 'BOT' },
        wing: { id: 'wing', label: 'Canh', icon: 'WNG' },
        pet: { id: 'pet', label: 'Pet', icon: 'PET' },
        necklace: { id: 'necklace', label: 'Day chuyen', icon: 'NEC' },
        ring: { id: 'ring', label: 'Nhan', icon: 'RNG' }
    },

    rpgSkins: {
        basic: {
            id: 'basic',
            name: 'Chưởng Cơ Bản',
            icon: '✨',
            color: '#38bdf8',
            desc: 'Hiệu ứng mặc định, rõ và nhẹ.',
            bonusText: 'Dự phòng hệ thống',
            visualClass: 'basic',
            unlockLevel: 1,
            damage: 28,
            cooldownMs: 1200
        },
        kiem_tong_1: {
            id: 'kiem_tong_1',
            classId: 'kiem_tong',
            name: 'Kiếm Khí Sơ Cấp',
            icon: '🗡️',
            color: '#38bdf8',
            desc: 'Đường kiếm xanh, gọn và dễ nhìn khi farm gần.',
            bonusText: 'Mở theo cấp 1',
            visualClass: 'slash',
            unlockLevel: 1,
            damage: 36,
            cooldownMs: 1200
        },
        kiem_tong_4: {
            id: 'kiem_tong_4',
            classId: 'kiem_tong',
            name: 'Bán Nguyệt Trảm',
            icon: '🌙',
            color: '#67e8f9',
            desc: 'Vệt chém hình cung, nổi bật hơn khi lao vào quái.',
            bonusText: 'Mở theo cấp 4',
            visualClass: 'moon_slash',
            unlockLevel: 4,
            damage: 48,
            cooldownMs: 1650,
            aoeRadius: 135,
            aoeDamageRatio: 0.68
        },
        kiem_tong_8: {
            id: 'kiem_tong_8',
            classId: 'kiem_tong',
            name: 'Vạn Kiếm Ảnh',
            icon: '⚔️',
            color: '#a5f3fc',
            desc: 'Nhiều kiếm khí bay liên tục, hợp farm quái đông.',
            bonusText: 'Mở theo cấp 8',
            visualClass: 'sword_rain',
            unlockLevel: 8,
            damage: 62,
            cooldownMs: 2200,
            aoeRadius: 180,
            aoeDamageRatio: 0.72
        },
        phap_tong_1: {
            id: 'phap_tong_1',
            classId: 'phap_tong',
            name: 'Pháp Cầu',
            icon: '🔮',
            color: '#a78bfa',
            desc: 'Cầu năng lượng tím, cảm giác pháp sư rõ ràng.',
            bonusText: 'Mở theo cấp 1',
            visualClass: 'arcane',
            unlockLevel: 1,
            damage: 34,
            cooldownMs: 1250
        },
        phap_tong_4: {
            id: 'phap_tong_4',
            classId: 'phap_tong',
            name: 'Băng Tinh Phá',
            icon: '❄️',
            color: '#93c5fd',
            desc: 'Mũi băng xanh, đánh xa nhìn sáng và lạnh.',
            bonusText: 'Mở theo cấp 4',
            visualClass: 'ice_lance',
            unlockLevel: 4,
            damage: 46,
            cooldownMs: 1700,
            aoeRadius: 150,
            aoeDamageRatio: 0.66
        },
        phap_tong_8: {
            id: 'phap_tong_8',
            classId: 'phap_tong',
            name: 'Lôi Trận',
            icon: '⚡',
            color: '#fde047',
            desc: 'Tia sét lớn, sát thương cao và dễ nhận diện.',
            bonusText: 'Mở theo cấp 8',
            visualClass: 'thunder',
            unlockLevel: 8,
            damage: 64,
            cooldownMs: 2400,
            aoeRadius: 190,
            aoeDamageRatio: 0.7
        },
        anh_sat_1: {
            id: 'anh_sat_1',
            classId: 'anh_sat',
            name: 'Phi Tiêu Ảnh',
            icon: '🌑',
            color: '#f472b6',
            desc: 'Ám khí hồng tím, nhanh và sắc.',
            bonusText: 'Mở theo cấp 1',
            visualClass: 'shadow',
            unlockLevel: 1,
            damage: 38,
            cooldownMs: 1100
        },
        anh_sat_4: {
            id: 'anh_sat_4',
            classId: 'anh_sat',
            name: 'Nguyệt Luân',
            icon: '🌙',
            color: '#c084fc',
            desc: 'Vòng nguyệt ảnh xoay, phù hợp lối đánh sát thủ.',
            bonusText: 'Mở theo cấp 4',
            visualClass: 'moon_shadow',
            unlockLevel: 4,
            damage: 50,
            cooldownMs: 1650,
            aoeRadius: 145,
            aoeDamageRatio: 0.64
        },
        anh_sat_8: {
            id: 'anh_sat_8',
            classId: 'anh_sat',
            name: 'Ảnh Liên Sát',
            icon: '🗡️',
            color: '#fb7185',
            desc: 'Chuỗi đòn đỏ tím, nhìn giống combo PK.',
            bonusText: 'Mở theo cấp 8',
            visualClass: 'shadow_combo',
            unlockLevel: 8,
            damage: 66,
            cooldownMs: 2100,
            aoeRadius: 170,
            aoeDamageRatio: 0.7
        },
        thien_y_1: {
            id: 'thien_y_1',
            classId: 'thien_y',
            name: 'Linh Diệp',
            icon: '🍃',
            color: '#34d399',
            desc: 'Lá linh lực xanh, nhẹ và sạch hình.',
            bonusText: 'Mở theo cấp 1',
            visualClass: 'leaf',
            unlockLevel: 1,
            damage: 32,
            cooldownMs: 1200
        },
        thien_y_4: {
            id: 'thien_y_4',
            classId: 'thien_y',
            name: 'Thanh Phong',
            icon: '💨',
            color: '#5eead4',
            desc: 'Luồng gió xanh lam, đánh quái nhìn mềm hơn.',
            bonusText: 'Mở theo cấp 4',
            visualClass: 'wind',
            unlockLevel: 4,
            damage: 44,
            cooldownMs: 1600,
            aoeRadius: 150,
            aoeDamageRatio: 0.62
        },
        thien_y_8: {
            id: 'thien_y_8',
            classId: 'thien_y',
            name: 'Mộc Long',
            icon: '🐉',
            color: '#86efac',
            desc: 'Mộc khí hóa rồng, là skill cơ bản cấp cao của Thiên Y.',
            bonusText: 'Mở theo cấp 8',
            visualClass: 'leaf_dragon',
            unlockLevel: 8,
            damage: 58,
            cooldownMs: 2200,
            aoeRadius: 180,
            aoeDamageRatio: 0.68
        },
        fire_dragon: {
            id: 'fire_dragon',
            name: 'Hỏa Long Chưởng',
            icon: '🔥',
            color: '#f97316',
            desc: 'Skin VIP dạng rồng lửa, ghép bằng mảnh hiếm.',
            shard: 'fireShard',
            shardName: 'Mảnh Hỏa Long',
            unlockNeed: 8,
            bonusText: 'VIP ghép mảnh · +5% EXP ở Ải Boss',
            visualClass: 'fire_dragon',
            damage: 74,
            cooldownMs: 2600,
            aoeRadius: 210,
            aoeDamageRatio: 0.76,
            vip: true
        },
        thunder: {
            id: 'thunder',
            name: 'Lôi Ảnh Chưởng',
            icon: '⚡',
            color: '#facc15',
            desc: 'Skin VIP sét vàng, ghép bằng mảnh hiếm.',
            shard: 'thunderShard',
            shardName: 'Mảnh Lôi Ảnh',
            unlockNeed: 8,
            bonusText: 'VIP ghép mảnh · +5% vật phẩm',
            visualClass: 'thunder',
            damage: 72,
            cooldownMs: 2400,
            aoeRadius: 200,
            aoeDamageRatio: 0.74,
            vip: true
        },
        moon_shadow: {
            id: 'moon_shadow',
            name: 'Nguyệt Ảnh Bộ',
            icon: '🌙',
            color: '#c084fc',
            desc: 'Skin VIP tím lạnh, ghép bằng mảnh hiếm.',
            shard: 'moonShard',
            shardName: 'Mảnh Nguyệt Ảnh',
            unlockNeed: 8,
            bonusText: 'VIP ghép mảnh · +1 mảnh khi may mắn',
            visualClass: 'moon_shadow',
            damage: 70,
            cooldownMs: 1900,
            aoeRadius: 165,
            aoeDamageRatio: 0.72,
            vip: true
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
        LobbyNeon.startRpgWorldLoop();
        LobbyNeon.startRpgWildMonsters();
        LobbyNeon.applyRpgZoneTheme(LobbyNeon.rpgZones[LobbyNeon.state.selectedRpgZone] || LobbyNeon.rpgZones.training_forest);

        const container = document.getElementById('lobby-map-container');
        if (container) {
            container.addEventListener('mousedown', LobbyNeon.handleMapClick);
        }
        document.addEventListener('keydown', LobbyNeon.handleLobbyKeydown);
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
        if (LobbyNeon.state.rpgWorldInterval) {
            clearInterval(LobbyNeon.state.rpgWorldInterval);
            LobbyNeon.state.rpgWorldInterval = null;
        }
        if (LobbyNeon.state.rpgWildInterval) {
            clearInterval(LobbyNeon.state.rpgWildInterval);
            LobbyNeon.state.rpgWildInterval = null;
        }
        if (LobbyNeon.state.rpgHudInterval) {
            clearInterval(LobbyNeon.state.rpgHudInterval);
            LobbyNeon.state.rpgHudInterval = null;
        }
        if (LobbyNeon.state.rpgAutoFarmInterval) {
            clearInterval(LobbyNeon.state.rpgAutoFarmInterval);
            LobbyNeon.state.rpgAutoFarmInterval = null;
        }
        LobbyNeon.state.rpgAutoFarm = false;
        LobbyNeon.state.rpgAutoFarmBusy = false;
        LobbyNeon.state.rpgWildMonsters = {};
        document.querySelectorAll('.rpg-world-monster').forEach(el => el.remove());
        document.querySelectorAll('.rpg-wild-monster').forEach(el => el.remove());
        document.querySelectorAll('.rpg-map-overlay').forEach(el => el.remove());
        document.querySelectorAll('.rpg-map-projectile').forEach(el => el.remove());
        document.querySelectorAll('.lobby-user-wrapper.rpg-world-fighting').forEach(el => el.classList.remove('rpg-world-fighting'));
        document.removeEventListener('keydown', LobbyNeon.handleLobbyKeydown);
        LobbyNeon.state.rpgMapOpen = false;
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
            LobbyNeon.state.users = allUsers || {};
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
                    width: min(390px, calc(100vw - 40px));
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
                    min-height: 0;
                    scrollbar-gutter: stable;
                    overflow-anchor: none;
                }
                #hub-content-rpg {
                    min-height: 620px;
                }
                .rpg-map-overlay {
                    position: absolute;
                    inset: 0;
                    z-index: 1200;
                    background: rgba(2, 6, 23, 0.84);
                    backdrop-filter: blur(8px);
                    display: grid;
                    place-items: center;
                    padding: 20px;
                }
                .rpg-map-modal {
                    width: min(880px, 94vw);
                    max-height: min(720px, 88vh);
                    overflow: auto;
                    border: 1px solid rgba(34,211,238,.42);
                    border-radius: 14px;
                    background: rgba(15,23,42,.96);
                    box-shadow: 0 0 40px rgba(34,211,238,.22);
                    padding: 16px;
                }
                .rpg-map-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
                    gap: 10px;
                    margin-top: 12px;
                }
                .rpg-map-card {
                    border: 1px solid var(--zone-color, rgba(148,163,184,.2));
                    background: linear-gradient(135deg, rgba(15,23,42,.92), rgba(2,6,23,.74));
                    border-radius: 10px;
                    padding: 12px;
                    color: #e2e8f0;
                    text-align: left;
                    min-height: 118px;
                    cursor: pointer;
                }
                .rpg-map-card.locked {
                    cursor: not-allowed;
                    opacity: .52;
                }
                .rpg-map-card.active {
                    box-shadow: 0 0 22px var(--zone-glow, rgba(34,211,238,.25));
                    background: linear-gradient(135deg, rgba(34,211,238,.16), rgba(15,23,42,.92));
                }
                #lobby-map[data-rpg-zone]::after {
                    content: attr(data-rpg-zone-name);
                    position: absolute;
                    left: 280px;
                    top: 18px;
                    z-index: 4;
                    pointer-events: none;
                    color: var(--rpg-zone-color, #22d3ee);
                    font-size: 12px;
                    font-weight: 900;
                    letter-spacing: .08em;
                    text-transform: uppercase;
                    padding: 8px 12px;
                    border: 1px solid color-mix(in srgb, var(--rpg-zone-color, #22d3ee) 48%, transparent);
                    border-radius: 10px;
                    background: rgba(2,6,23,.72);
                    box-shadow: 0 0 24px color-mix(in srgb, var(--rpg-zone-color, #22d3ee) 26%, transparent);
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
                .rpg-card[data-rpg-action],
                [data-rpg-action] {
                    cursor: pointer;
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
                .rpg-skill-preview {
                    position: relative;
                    height: 34px;
                    margin-top: 8px;
                    border-radius: 10px;
                    background: rgba(2, 6, 23, 0.55);
                    border: 1px solid rgba(148, 163, 184, 0.12);
                    overflow: hidden;
                    contain: layout paint;
                }
                .rpg-skill-preview::before {
                    content: "";
                    position: absolute;
                    left: 18px;
                    top: 50%;
                    width: 46px;
                    height: 13px;
                    border-radius: 999px;
                    color: var(--rpg-color, #38bdf8);
                    background: linear-gradient(90deg, transparent, currentColor, #fff);
                    filter: drop-shadow(0 0 10px currentColor);
                    transform: translateY(-50%);
                }
                .rpg-skill-preview::after {
                    content: "✦";
                    position: absolute;
                    right: 22px;
                    top: 50%;
                    color: var(--rpg-color, #38bdf8);
                    font-weight: 1000;
                    transform: translateY(-50%);
                    text-shadow: 0 0 10px currentColor;
                }
                .rpg-skill-preview.slash::before,
                .rpg-skill-preview.moon_slash::before {
                    width: 52px;
                    height: 28px;
                    background: transparent;
                    border-top: 4px solid currentColor;
                    border-radius: 50%;
                    transform: translateY(-30%) rotate(-16deg);
                }
                .rpg-skill-preview.arcane::before {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: radial-gradient(circle, #fff, currentColor 50%, transparent 72%);
                }
                .rpg-skill-preview.leaf::before,
                .rpg-skill-preview.leaf_dragon::before {
                    width: 42px;
                    height: 22px;
                    border-radius: 80% 8px 80% 8px;
                    background: currentColor;
                    transform: translateY(-50%) rotate(-18deg);
                }
                .rpg-skill-preview.ice_lance::before {
                    clip-path: polygon(0 50%, 72% 0, 100% 50%, 72% 100%);
                    background: currentColor;
                }
                .rpg-skill-preview.thunder::before {
                    clip-path: polygon(0 45%, 44% 45%, 34% 0, 100% 56%, 55% 56%, 68% 100%);
                    background: currentColor;
                    height: 24px;
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
                .rpg-world-monster {
                    position: absolute;
                    z-index: 92;
                    width: 134px;
                    min-height: 142px;
                    transform: translate(-50%, -50%);
                    pointer-events: none;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: flex-end;
                }
                .rpg-wild-monster {
                    position: absolute;
                    z-index: 91;
                    width: 126px;
                    min-height: 138px;
                    transform: translate(-50%, -50%);
                    pointer-events: auto;
                    cursor: crosshair;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: flex-end;
                    transition: left .42s linear, top .42s linear, filter .18s;
                }
                .rpg-wild-monster:hover,
                .rpg-wild-monster.is-targeted {
                    z-index: 98;
                    filter: drop-shadow(0 0 16px rgba(34,211,238,.65));
                }
                .rpg-world-monster.defeated {
                    opacity: .58;
                    filter: grayscale(.55);
                }
                .rpg-wild-monster.defeated {
                    opacity: .58;
                    filter: grayscale(.55);
                    pointer-events: none;
                }
                .rpg-world-name {
                    max-width: 138px;
                    padding: 4px 10px;
                    border-radius: 999px;
                    background: rgba(2, 6, 23, 0.86);
                    border: 1.5px solid var(--zone-color, #22d3ee);
                    color: #f8fafc;
                    font-size: 10px;
                    font-weight: 1000;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    text-shadow: 0 0 8px rgba(0,0,0,.8);
                    box-shadow: 0 0 14px color-mix(in srgb, var(--zone-color, #22d3ee) 35%, transparent);
                }
                .rpg-world-hp {
                    width: 112px;
                    height: 7px;
                    border-radius: 999px;
                    background: rgba(2, 6, 23, 0.82);
                    border: 1px solid rgba(255,255,255,0.16);
                    overflow: hidden;
                    margin: 5px 0 4px;
                }
                .rpg-world-hp span {
                    display: block;
                    height: 100%;
                    background: linear-gradient(90deg, #fb7185, #f97316, #facc15);
                    border-radius: inherit;
                    transition: width .35s ease;
                }
                .rpg-world-body {
                    position: relative;
                    width: 108px;
                    height: 104px;
                    display: grid;
                    place-items: center;
                    animation: rpg-world-monster-breathe 1.8s ease-in-out infinite;
                    filter: drop-shadow(0 0 16px color-mix(in srgb, var(--zone-color, #22d3ee) 38%, transparent));
                }
                .rpg-world-monster.defeated .rpg-world-body {
                    animation: none;
                    transform: rotate(-8deg) translateY(8px);
                }
                .rpg-wild-monster.defeated .rpg-world-body {
                    animation: none;
                    transform: rotate(-8deg) translateY(8px);
                }
                .rpg-world-body .rpg-monster-svg {
                    width: 104px;
                    height: 104px;
                }
                .rpg-world-skill {
                    position: absolute;
                    z-index: 94;
                    left: -95px;
                    top: 74px;
                    width: 54px;
                    height: 16px;
                    border-radius: 999px;
                    color: var(--skin-color, #38bdf8);
                    background: linear-gradient(90deg, transparent, currentColor, #fff);
                    filter: drop-shadow(0 0 12px currentColor);
                    animation: rpg-world-skill-flight 1.15s ease-in-out infinite;
                }
                .rpg-world-skill.fire_dragon {
                    width: 66px;
                    height: 20px;
                    color: #fb923c;
                    background: linear-gradient(90deg, transparent, #ef4444, #f97316, #fed7aa);
                }
                .rpg-world-skill.slash,
                .rpg-world-skill.moon_slash {
                    width: 62px;
                    height: 34px;
                    background: transparent;
                    border-top: 5px solid currentColor;
                    border-radius: 50%;
                }
                .rpg-world-skill.sword_rain {
                    width: 74px;
                    height: 28px;
                    background:
                        linear-gradient(90deg, transparent 0 8%, currentColor 8% 20%, transparent 20% 34%, currentColor 34% 48%, transparent 48% 62%, currentColor 62% 76%, transparent 76%);
                }
                .rpg-world-skill.arcane {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: radial-gradient(circle, #fff, currentColor 48%, transparent 72%);
                }
                .rpg-world-skill.ice_lance {
                    width: 62px;
                    height: 22px;
                    clip-path: polygon(0 50%, 72% 0, 100% 50%, 72% 100%);
                    background: currentColor;
                }
                .rpg-world-skill.thunder {
                    width: 56px;
                    height: 24px;
                    color: #facc15;
                    background: #facc15;
                    clip-path: polygon(0 45%, 44% 45%, 34% 0, 100% 56%, 55% 56%, 68% 100%);
                }
                .rpg-world-skill.shadow,
                .rpg-world-skill.shadow_combo {
                    width: 58px;
                    height: 16px;
                    background: linear-gradient(90deg, transparent, #111827, currentColor, #fff);
                }
                .rpg-world-skill.leaf,
                .rpg-world-skill.wind,
                .rpg-world-skill.leaf_dragon {
                    width: 46px;
                    height: 26px;
                    border-radius: 80% 8px 80% 8px;
                    background: currentColor;
                    transform: rotate(-18deg);
                }
                .rpg-world-skill.moon_shadow {
                    width: 44px;
                    height: 44px;
                    color: #c084fc;
                    background: transparent;
                    border: 4px solid #c084fc;
                    border-left-color: transparent;
                    border-radius: 50%;
                }
                .rpg-world-hit {
                    position: absolute;
                    z-index: 95;
                    right: 28px;
                    top: 70px;
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(255,255,255,.94), color-mix(in srgb, var(--skin-color, #38bdf8) 55%, transparent) 36%, transparent 70%);
                    animation: rpg-world-hit-pop 1.15s ease-in-out infinite;
                }
                .rpg-world-damage {
                    position: absolute;
                    z-index: 96;
                    right: 36px;
                    top: 50px;
                    color: #fde68a;
                    font-size: 13px;
                    font-weight: 1000;
                    text-shadow: 0 0 10px rgba(251, 191, 36, .8), 0 1px 0 #000;
                    animation: rpg-world-damage-float 1.15s ease-in-out infinite;
                }
                .rpg-world-loot {
                    position: absolute;
                    z-index: 93;
                    bottom: -10px;
                    display: flex;
                    gap: 4px;
                    filter: drop-shadow(0 0 8px rgba(251,191,36,.5));
                    animation: rpg-world-loot-bounce 1.6s ease-in-out infinite;
                }
                .rpg-map-projectile {
                    position: absolute;
                    z-index: 130;
                    left: 0;
                    top: 0;
                    width: 52px;
                    height: 16px;
                    border-radius: 999px;
                    pointer-events: none;
                    color: var(--skin-color, #38bdf8);
                    background: linear-gradient(90deg, transparent, currentColor, #fff);
                    filter: drop-shadow(0 0 14px currentColor);
                    animation: rpg-map-projectile-flight .55s ease-out forwards;
                }
                .rpg-map-projectile.fire_dragon {
                    width: 68px;
                    height: 20px;
                    color: #fb923c;
                    background: linear-gradient(90deg, transparent, #ef4444, #f97316, #fed7aa);
                }
                .rpg-map-projectile.slash,
                .rpg-map-projectile.moon_slash {
                    width: 62px;
                    height: 34px;
                    background: transparent;
                    border-top: 5px solid currentColor;
                    border-radius: 50%;
                }
                .rpg-map-projectile.sword_rain {
                    width: 74px;
                    height: 28px;
                    background:
                        linear-gradient(90deg, transparent 0 8%, currentColor 8% 20%, transparent 20% 34%, currentColor 34% 48%, transparent 48% 62%, currentColor 62% 76%, transparent 76%);
                }
                .rpg-map-projectile.arcane {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: radial-gradient(circle, #fff, currentColor 48%, transparent 72%);
                }
                .rpg-map-projectile.ice_lance {
                    width: 62px;
                    height: 22px;
                    clip-path: polygon(0 50%, 72% 0, 100% 50%, 72% 100%);
                    background: currentColor;
                }
                .rpg-map-projectile.thunder {
                    width: 58px;
                    height: 24px;
                    color: #facc15;
                    background: #facc15;
                    clip-path: polygon(0 45%, 44% 45%, 34% 0, 100% 56%, 55% 56%, 68% 100%);
                }
                .rpg-map-projectile.shadow,
                .rpg-map-projectile.shadow_combo {
                    width: 58px;
                    height: 16px;
                    background: linear-gradient(90deg, transparent, #111827, currentColor, #fff);
                }
                .rpg-map-projectile.leaf,
                .rpg-map-projectile.wind,
                .rpg-map-projectile.leaf_dragon {
                    width: 46px;
                    height: 26px;
                    border-radius: 80% 8px 80% 8px;
                    background: currentColor;
                }
                .rpg-map-projectile.moon_shadow {
                    width: 44px;
                    height: 44px;
                    color: #c084fc;
                    background: transparent;
                    border: 4px solid #c084fc;
                    border-left-color: transparent;
                    border-radius: 50%;
                }
                .rpg-farm-hud {
                    position: absolute;
                    left: 50%;
                    bottom: 22px;
                    transform: translateX(-50%);
                    z-index: 1100;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 10px;
                    border-radius: 999px;
                    background: rgba(2, 6, 23, 0.82);
                    border: 1.5px solid rgba(34, 211, 238, 0.34);
                    box-shadow: 0 0 22px rgba(34, 211, 238, 0.2);
                    backdrop-filter: blur(10px);
                }
                .rpg-skill-button {
                    border: none;
                    border-radius: 999px;
                    min-width: 94px;
                    height: 42px;
                    padding: 0 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 7px;
                    background: linear-gradient(135deg, #06b6d4, #8b5cf6);
                    color: #fff;
                    font-size: 12px;
                    font-weight: 1000;
                    cursor: pointer;
                    box-shadow: 0 8px 18px rgba(14, 165, 233, 0.24);
                }
                .rpg-skill-button.cooldown {
                    opacity: .55;
                    cursor: wait;
                    filter: grayscale(.35);
                }
                .rpg-auto-button {
                    min-width: 88px;
                    background: linear-gradient(135deg, #0f172a, #1e293b);
                    border: 1px solid rgba(34, 211, 238, 0.34);
                }
                .rpg-auto-button.active {
                    background: linear-gradient(135deg, #16a34a, #06b6d4);
                    box-shadow: 0 0 24px rgba(34, 211, 238, 0.38), 0 0 18px rgba(34, 197, 94, 0.25);
                }
                .rpg-target-hint {
                    min-width: 155px;
                    max-width: 250px;
                    color: #cbd5e1;
                    font-size: 10px;
                    line-height: 1.25;
                    font-weight: 800;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .rpg-skill-wheel {
                    position: absolute;
                    right: 388px;
                    bottom: 88px;
                    z-index: 1101;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                    pointer-events: auto;
                }
                .rpg-wheel-btn {
                    width: 58px;
                    height: 58px;
                    border-radius: 50%;
                    border: 1.5px solid rgba(148, 163, 184, 0.24);
                    background:
                        radial-gradient(circle at 38% 28%, rgba(255,255,255,.2), transparent 28%),
                        linear-gradient(145deg, rgba(15, 23, 42, .96), rgba(2, 6, 23, .94));
                    color: #e2e8f0;
                    display: grid;
                    place-items: center;
                    position: relative;
                    cursor: pointer;
                    box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 10px 24px rgba(0,0,0,.38);
                    transition: transform .16s ease, border-color .16s ease, box-shadow .16s ease;
                }
                .rpg-wheel-btn:hover {
                    transform: translateY(-2px) scale(1.04);
                    border-color: var(--wheel-color, #22d3ee);
                    box-shadow: 0 0 18px color-mix(in srgb, var(--wheel-color, #22d3ee) 45%, transparent), 0 10px 24px rgba(0,0,0,.42);
                }
                .rpg-wheel-btn.active {
                    border-color: var(--wheel-color, #22d3ee);
                    box-shadow: 0 0 0 2px color-mix(in srgb, var(--wheel-color, #22d3ee) 22%, transparent), 0 0 22px color-mix(in srgb, var(--wheel-color, #22d3ee) 42%, transparent);
                }
                .rpg-wheel-btn.locked {
                    filter: grayscale(.65);
                    opacity: .58;
                }
                .rpg-wheel-btn.auto-on {
                    border-color: #22c55e;
                    color: #bbf7d0;
                    box-shadow: 0 0 22px rgba(34, 197, 94, .42);
                }
                .rpg-wheel-icon {
                    width: 38px;
                    height: 38px;
                    border-radius: 50%;
                    display: grid;
                    place-items: center;
                    font-size: 20px;
                    background: radial-gradient(circle, color-mix(in srgb, var(--wheel-color, #22d3ee) 32%, transparent), transparent 72%);
                    filter: drop-shadow(0 0 8px var(--wheel-color, #22d3ee));
                }
                .rpg-wheel-label {
                    position: absolute;
                    right: 66px;
                    top: 50%;
                    transform: translateY(-50%);
                    min-width: 78px;
                    padding: 4px 7px;
                    border-radius: 8px;
                    background: rgba(2, 6, 23, .84);
                    border: 1px solid rgba(148, 163, 184, .18);
                    color: #cbd5e1;
                    font-size: 9px;
                    font-weight: 900;
                    text-align: right;
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity .16s ease;
                    white-space: nowrap;
                }
                .rpg-wheel-btn:hover .rpg-wheel-label {
                    opacity: 1;
                }
                .rpg-inventory-layout {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 12px;
                }
                .rpg-equip-panel,
                .rpg-bag-panel {
                    background: linear-gradient(180deg, rgba(15,23,42,.9), rgba(2,6,23,.9));
                    border: 1px solid rgba(148,163,184,.18);
                    border-radius: 12px;
                    padding: 10px;
                    min-width: 0;
                }
                .rpg-panel-head {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                    margin-bottom: 9px;
                    color: #f8fafc;
                    font-size: 11px;
                    font-weight: 1000;
                    text-transform: uppercase;
                    letter-spacing: .04em;
                }
                .rpg-character-frame {
                    position: relative;
                    min-height: 158px;
                    border-radius: 12px;
                    border: 1px solid rgba(34,211,238,.22);
                    background:
                        radial-gradient(circle at 50% 58%, rgba(34,211,238,.2), transparent 42%),
                        linear-gradient(180deg, rgba(30,41,59,.62), rgba(2,6,23,.76));
                    display: grid;
                    place-items: center;
                    overflow: hidden;
                }
                .rpg-character-frame::after {
                    content: "";
                    position: absolute;
                    left: 28%;
                    right: 28%;
                    bottom: 14px;
                    height: 10px;
                    border-radius: 50%;
                    background: radial-gradient(ellipse at center, rgba(34,211,238,.46), transparent 72%);
                    filter: blur(1px);
                }
                .rpg-character-frame .rpg-player-sprite {
                    position: relative;
                    z-index: 2;
                    transform: scale(1.18);
                }
                .rpg-equip-grid {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 7px;
                    margin-top: 9px;
                }
                .rpg-equip-slot {
                    min-height: 54px;
                    border-radius: 10px;
                    border: 1px solid rgba(148,163,184,.16);
                    background: rgba(15,23,42,.72);
                    padding: 7px;
                    display: grid;
                    grid-template-columns: 28px 1fr;
                    gap: 7px;
                    align-items: center;
                }
                .rpg-equip-icon {
                    width: 28px;
                    height: 28px;
                    border-radius: 8px;
                    display: grid;
                    place-items: center;
                    background: rgba(255,255,255,.06);
                    border: 1px solid rgba(255,255,255,.08);
                    color: var(--equip-color, #22d3ee);
                    filter: drop-shadow(0 0 8px color-mix(in srgb, var(--equip-color, #22d3ee) 50%, transparent));
                }
                .rpg-equip-label {
                    color: #94a3b8;
                    font-size: 8px;
                    font-weight: 900;
                    text-transform: uppercase;
                }
                .rpg-equip-name {
                    color: #e2e8f0;
                    font-size: 9px;
                    line-height: 1.25;
                    font-weight: 900;
                    overflow: hidden;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                }
                .rpg-bag-grid {
                    display: grid;
                    grid-template-columns: repeat(5, minmax(0, 1fr));
                    gap: 8px;
                }
                .rpg-bag-cell {
                    aspect-ratio: 1;
                    min-height: 58px;
                    border-radius: 10px;
                    border: 1px solid rgba(148,163,184,.14);
                    background: rgba(15,23,42,.68);
                    display: grid;
                    place-items: center;
                    position: relative;
                    overflow: hidden;
                    color: #e2e8f0;
                    cursor: default;
                }
                button.rpg-bag-cell {
                    cursor: pointer;
                    padding: 0;
                    font: inherit;
                }
                button.rpg-bag-cell:hover {
                    transform: translateY(-1px);
                    border-color: var(--item-color, #22d3ee);
                    box-shadow: 0 0 16px color-mix(in srgb, var(--item-color, #22d3ee) 28%, transparent);
                }
                .rpg-bag-cell.has-item {
                    border-color: color-mix(in srgb, var(--item-color, #22d3ee) 44%, rgba(148,163,184,.14));
                    background:
                        radial-gradient(circle at 50% 34%, color-mix(in srgb, var(--item-color, #22d3ee) 20%, transparent), transparent 68%),
                        rgba(15,23,42,.82);
                }
                .rpg-bag-icon {
                    font-size: 29px;
                    filter: drop-shadow(0 0 8px var(--item-color, #22d3ee));
                }
                .rpg-bag-qty {
                    position: absolute;
                    right: 3px;
                    bottom: 2px;
                    padding: 1px 4px;
                    border-radius: 5px;
                    background: rgba(0,0,0,.68);
                    color: #fff;
                    font-size: 9px;
                    font-weight: 1000;
                }
                .rpg-stat-grid {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 8px;
                    margin-top: 10px;
                }
                .rpg-stat-row {
                    border: 1px solid rgba(148,163,184,.16);
                    border-radius: 10px;
                    background: rgba(15,23,42,.72);
                    padding: 8px;
                    min-width: 0;
                }
                .rpg-stat-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 8px;
                    color: #e2e8f0;
                    font-size: 11px;
                    font-weight: 900;
                }
                .rpg-stat-desc {
                    margin-top: 3px;
                    color: #94a3b8;
                    font-size: 9px;
                    line-height: 1.35;
                }
                .rpg-stat-add {
                    border: 1px solid rgba(34,211,238,.4);
                    background: rgba(34,211,238,.12);
                    color: #67e8f9;
                    width: 24px;
                    height: 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 1000;
                }
                .rpg-mu-shell {
                    display: grid;
                    gap: 12px;
                }
                .rpg-mu-top {
                    position: relative;
                    overflow: hidden;
                    border-radius: 12px;
                    border: 1px solid rgba(251,191,36,.28);
                    background:
                        radial-gradient(circle at 18% 20%, rgba(34,211,238,.18), transparent 34%),
                        linear-gradient(135deg, rgba(15,23,42,.96), rgba(2,6,23,.98));
                    padding: 12px;
                    box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 12px 28px rgba(0,0,0,.28);
                }
                .rpg-mu-top::before,
                .rpg-mu-panel::before {
                    content: "";
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                    background: linear-gradient(135deg, rgba(255,255,255,.08), transparent 28%, rgba(251,191,36,.05));
                    opacity: .72;
                }
                .rpg-mu-identity {
                    position: relative;
                    z-index: 1;
                    display: grid;
                    grid-template-columns: 58px 1fr;
                    gap: 10px;
                    align-items: center;
                }
                .rpg-mu-avatar {
                    width: 58px;
                    height: 58px;
                    border-radius: 50%;
                    display: grid;
                    place-items: center;
                    background:
                        radial-gradient(circle at 50% 38%, rgba(34,211,238,.28), transparent 58%),
                        rgba(2,6,23,.88);
                    border: 1px solid rgba(34,211,238,.42);
                    box-shadow: 0 0 22px rgba(34,211,238,.22);
                    overflow: hidden;
                }
                .rpg-mu-avatar .rpg-player-sprite {
                    transform: scale(.58);
                }
                .rpg-mu-name {
                    color: #f8fafc;
                    font-size: 16px;
                    font-weight: 1000;
                    line-height: 1.1;
                    margin: 0;
                }
                .rpg-mu-level {
                    color: #fbbf24;
                    font-size: 12px;
                    font-weight: 1000;
                    margin-top: 3px;
                }
                .rpg-mu-power {
                    margin-top: 8px;
                    padding: 8px;
                    border-radius: 10px;
                    border: 1px solid rgba(251,191,36,.25);
                    background: rgba(0,0,0,.22);
                    color: #fbbf24;
                    font-size: 20px;
                    font-weight: 1000;
                    text-align: center;
                    text-shadow: 0 0 16px rgba(251,191,36,.46);
                }
                .rpg-mu-bars {
                    position: relative;
                    z-index: 1;
                    display: grid;
                    gap: 6px;
                    margin-top: 10px;
                }
                .rpg-mu-bar {
                    height: 16px;
                    border-radius: 999px;
                    border: 1px solid rgba(255,255,255,.13);
                    background: rgba(2,6,23,.85);
                    overflow: hidden;
                    position: relative;
                }
                .rpg-mu-bar > span {
                    display: block;
                    height: 100%;
                    border-radius: inherit;
                }
                .rpg-mu-bar b {
                    position: absolute;
                    inset: 0;
                    display: grid;
                    place-items: center;
                    color: #f8fafc;
                    font-size: 9px;
                    font-weight: 1000;
                    text-shadow: 0 1px 2px #000;
                }
                .rpg-mu-bar.exp > span { background: linear-gradient(90deg, #0284c7, #22d3ee); }
                .rpg-mu-bar.hp > span { background: linear-gradient(90deg, #b91c1c, #ef4444, #f97316); }
                .rpg-mu-bar.mp > span { background: linear-gradient(90deg, #1d4ed8, #38bdf8); }
                .rpg-mu-currencies {
                    position: relative;
                    z-index: 1;
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 6px;
                    margin-top: 10px;
                }
                .rpg-mu-money {
                    min-width: 0;
                    border-radius: 9px;
                    border: 1px solid rgba(148,163,184,.18);
                    background: rgba(15,23,42,.74);
                    padding: 6px;
                    color: #e2e8f0;
                    font-size: 10px;
                    font-weight: 900;
                    display: flex;
                    justify-content: space-between;
                    gap: 4px;
                }
                .rpg-mu-panel {
                    position: relative;
                    overflow: hidden;
                    border-radius: 12px;
                    border: 1px solid rgba(148,163,184,.18);
                    background:
                        linear-gradient(180deg, rgba(15,23,42,.92), rgba(2,6,23,.96));
                    box-shadow: inset 0 1px 0 rgba(255,255,255,.06), 0 12px 24px rgba(0,0,0,.24);
                    padding: 10px;
                }
                .rpg-mu-heading {
                    position: relative;
                    z-index: 1;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                    margin-bottom: 10px;
                    color: #fbbf24;
                    font-size: 13px;
                    font-weight: 1000;
                    text-transform: uppercase;
                    letter-spacing: .04em;
                }
                .rpg-mu-equipment {
                    position: relative;
                    z-index: 1;
                    display: grid;
                    grid-template-columns: 60px 1fr 60px;
                    gap: 8px;
                    align-items: center;
                }
                .rpg-mu-slot-col {
                    display: grid;
                    gap: 8px;
                }
                .rpg-mu-slot {
                    min-height: 58px;
                    border-radius: 10px;
                    border: 1px solid color-mix(in srgb, var(--equip-color, #22d3ee) 48%, rgba(148,163,184,.16));
                    background:
                        radial-gradient(circle at 50% 34%, color-mix(in srgb, var(--equip-color, #22d3ee) 22%, transparent), transparent 70%),
                        rgba(2,6,23,.78);
                    display: grid;
                    place-items: center;
                    position: relative;
                    color: #f8fafc;
                    box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 0 14px color-mix(in srgb, var(--equip-color, #22d3ee) 16%, transparent);
                }
                .rpg-mu-slot.empty {
                    opacity: .48;
                    filter: grayscale(.35);
                }
                .rpg-mu-slot.empty .rpg-mu-slot-icon {
                    opacity: .62;
                }
                .rpg-mu-slot-icon {
                    font-size: 23px;
                    filter: drop-shadow(0 0 8px var(--equip-color, #22d3ee));
                }
                .rpg-mu-slot-level {
                    position: absolute;
                    right: 4px;
                    top: 3px;
                    color: #fde68a;
                    font-size: 9px;
                    font-weight: 1000;
                    text-shadow: 0 0 8px rgba(251,191,36,.72);
                }
                .rpg-mu-slot-label {
                    position: absolute;
                    left: 4px;
                    right: 4px;
                    bottom: 3px;
                    color: #cbd5e1;
                    font-size: 8px;
                    font-weight: 900;
                    text-align: center;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .rpg-mu-character {
                    min-height: 284px;
                    border-radius: 14px;
                    display: grid;
                    place-items: center;
                    position: relative;
                    overflow: hidden;
                    background:
                        radial-gradient(circle at 50% 54%, rgba(34,211,238,.24), transparent 46%),
                        radial-gradient(circle at 50% 72%, rgba(251,191,36,.16), transparent 36%),
                        linear-gradient(180deg, rgba(15,23,42,.78), rgba(2,6,23,.86));
                    border: 1px solid rgba(34,211,238,.24);
                }
                .rpg-mu-character::before {
                    content: "";
                    position: absolute;
                    width: 190px;
                    height: 190px;
                    border-radius: 50%;
                    border: 2px solid rgba(34,211,238,.16);
                    box-shadow: 0 0 34px rgba(34,211,238,.18), inset 0 0 24px rgba(59,130,246,.12);
                }
                .rpg-mu-character::after {
                    content: "";
                    position: absolute;
                    left: 22%;
                    right: 22%;
                    bottom: 32px;
                    height: 18px;
                    border-radius: 50%;
                    background: radial-gradient(ellipse at center, rgba(34,211,238,.52), transparent 72%);
                    filter: blur(1px);
                }
                .rpg-mu-character .rpg-player-sprite {
                    position: relative;
                    z-index: 2;
                    transform: scale(1.42);
                    filter: drop-shadow(0 0 16px rgba(34,211,238,.46));
                }
                .rpg-mu-bag-tabs {
                    position: relative;
                    z-index: 1;
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 5px;
                    margin-bottom: 9px;
                }
                .rpg-mu-bag-tab {
                    border: 1px solid rgba(148,163,184,.18);
                    background: rgba(15,23,42,.72);
                    color: #cbd5e1;
                    border-radius: 8px;
                    padding: 6px 4px;
                    font-size: 9px;
                    font-weight: 900;
                }
                .rpg-mu-bag-tab.active {
                    color: #f8fafc;
                    border-color: rgba(34,211,238,.58);
                    background: linear-gradient(135deg, rgba(14,165,233,.38), rgba(30,41,59,.82));
                    box-shadow: 0 0 16px rgba(34,211,238,.2);
                }
                .rpg-bag-summary {
                    position: relative;
                    z-index: 1;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                    margin-bottom: 9px;
                }
                .rpg-bag-collapsed {
                    position: relative;
                    z-index: 1;
                    width: 100%;
                    min-height: 120px;
                    border-radius: 12px;
                    border: 1px dashed rgba(34,211,238,.38);
                    background:
                        radial-gradient(circle at 50% 20%, rgba(34,211,238,.18), transparent 55%),
                        rgba(15,23,42,.72);
                    color: #e2e8f0;
                    display: grid;
                    place-items: center;
                    gap: 4px;
                    padding: 12px;
                    cursor: pointer;
                    text-align: center;
                }
                .rpg-bag-collapsed span {
                    font-size: 32px;
                }
                .rpg-bag-collapsed b {
                    color: #f8fafc;
                    font-size: 13px;
                }
                .rpg-bag-collapsed small {
                    color: #94a3b8;
                    font-size: 10px;
                    line-height: 1.35;
                }
                .rpg-mu-bag-actions {
                    position: relative;
                    z-index: 1;
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 6px;
                    margin-top: 9px;
                }
                .rpg-mu-small-btn {
                    border: 1px solid rgba(34,211,238,.26);
                    border-radius: 9px;
                    background: rgba(14,165,233,.1);
                    color: #cbd5e1;
                    font-size: 10px;
                    font-weight: 900;
                    padding: 7px 4px;
                    cursor: pointer;
                    min-height: 34px;
                }
                .rpg-mu-small-btn:hover {
                    border-color: rgba(251,191,36,.46);
                    color: #f8fafc;
                    background: rgba(251,191,36,.12);
                }
                .rpg-mini-select {
                    width: 100%;
                    min-height: 34px;
                    border: 1px solid rgba(34,211,238,.26);
                    border-radius: 9px;
                    background: rgba(2,6,23,.74);
                    color: #e2e8f0;
                    font-size: 11px;
                    font-weight: 800;
                    padding: 6px 8px;
                    outline: none;
                }
                .rpg-bag-cell.selected {
                    border-color: #fbbf24;
                    box-shadow: 0 0 18px rgba(251,191,36,.34), inset 0 0 0 1px rgba(251,191,36,.34);
                }
                .rpg-bag-empty {
                    position: relative;
                    z-index: 1;
                    min-height: 90px;
                    border-radius: 12px;
                    border: 1px dashed rgba(148,163,184,.2);
                    display: grid;
                    place-items: center;
                    color: #94a3b8;
                    font-size: 11px;
                    background: rgba(2,6,23,.46);
                }
                .rpg-selected-item {
                    position: relative;
                    z-index: 1;
                    margin-top: 9px;
                    border: 1px solid rgba(148,163,184,.16);
                    border-radius: 10px;
                    background: rgba(2,6,23,.55);
                    padding: 9px;
                    display: grid;
                    grid-template-columns: auto 1fr;
                    gap: 4px 8px;
                    color: #e2e8f0;
                    font-size: 11px;
                    align-items: center;
                }
                .rpg-selected-item small {
                    grid-column: 1 / -1;
                    color: #94a3b8;
                    line-height: 1.35;
                }
                .rpg-mu-stat-effects {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                    margin-top: 10px;
                }
                .rpg-mu-effect-box {
                    border: 1px solid rgba(148,163,184,.16);
                    border-radius: 10px;
                    background: rgba(2,6,23,.48);
                    padding: 9px;
                    color: #cbd5e1;
                    font-size: 10px;
                    line-height: 1.55;
                }
                .rpg-mu-effect-box b {
                    color: #fde68a;
                }
                .rpg-mu-boss {
                    position: relative;
                    z-index: 1;
                    display: grid;
                    grid-template-columns: 104px 1fr;
                    gap: 10px;
                    align-items: stretch;
                }
                .rpg-mu-boss-art {
                    border-radius: 12px;
                    border: 1px solid rgba(248,113,113,.35);
                    background:
                        radial-gradient(circle at 54% 38%, rgba(248,113,113,.28), transparent 55%),
                        linear-gradient(135deg, rgba(76,29,149,.35), rgba(2,6,23,.9));
                    display: grid;
                    place-items: center;
                    min-height: 116px;
                    overflow: hidden;
                }
                .rpg-mu-boss-art .rpg-monster-svg {
                    width: 96px;
                    height: 96px;
                }
                .rpg-mu-boss-info {
                    min-width: 0;
                    display: grid;
                    gap: 7px;
                }
                .rpg-mu-boss-name {
                    color: #fb7185;
                    font-size: 12px;
                    font-weight: 1000;
                    line-height: 1.25;
                }
                .rpg-mu-boss-rewards {
                    display: grid;
                    grid-template-columns: repeat(6, minmax(0, 1fr));
                    gap: 5px;
                    margin-top: 8px;
                }
                .rpg-mu-reward {
                    aspect-ratio: 1;
                    border-radius: 8px;
                    border: 1px solid color-mix(in srgb, var(--item-color, #fbbf24) 48%, rgba(148,163,184,.16));
                    background:
                        radial-gradient(circle, color-mix(in srgb, var(--item-color, #fbbf24) 20%, transparent), transparent 68%),
                        rgba(2,6,23,.72);
                    display: grid;
                    place-items: center;
                    color: #f8fafc;
                    font-size: 18px;
                }
                .rpg-arena-panel {
                    border-color: rgba(251,146,60,.36);
                    background:
                        radial-gradient(circle at 50% 0%, rgba(251,146,60,.16), transparent 38%),
                        linear-gradient(180deg, rgba(30,41,59,.94), rgba(2,6,23,.98));
                }
                .rpg-arena-panel.arena-win {
                    border-color: rgba(34,197,94,.44);
                    box-shadow: inset 0 1px 0 rgba(255,255,255,.06), 0 0 28px rgba(34,197,94,.16);
                }
                .rpg-arena-panel.arena-lose {
                    border-color: rgba(248,113,113,.42);
                    box-shadow: inset 0 1px 0 rgba(255,255,255,.06), 0 0 28px rgba(248,113,113,.14);
                }
                .rpg-arena-stage {
                    position: relative;
                    z-index: 1;
                    min-height: 158px;
                    border-radius: 14px;
                    border: 1px solid rgba(251,191,36,.18);
                    background:
                        radial-gradient(circle at 50% 72%, rgba(251,191,36,.18), transparent 44%),
                        linear-gradient(180deg, rgba(15,23,42,.7), rgba(2,6,23,.82));
                    display: grid;
                    grid-template-columns: 1fr 58px 1fr;
                    gap: 8px;
                    align-items: center;
                    padding: 10px;
                    overflow: hidden;
                }
                .rpg-arena-stage::after {
                    content: "";
                    position: absolute;
                    left: 12%;
                    right: 12%;
                    bottom: 18px;
                    height: 14px;
                    border-radius: 50%;
                    background: radial-gradient(ellipse, rgba(251,191,36,.34), transparent 72%);
                    filter: blur(1px);
                }
                .rpg-arena-fighter {
                    position: relative;
                    z-index: 2;
                    display: grid;
                    justify-items: center;
                    gap: 5px;
                    min-width: 0;
                    color: #e2e8f0;
                    text-align: center;
                    font-size: 10px;
                    font-weight: 900;
                }
                .rpg-arena-fighter b {
                    max-width: 100%;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    color: #f8fafc;
                    font-size: 11px;
                }
                .rpg-arena-fighter span {
                    color: #94a3b8;
                    font-size: 9px;
                }
                .rpg-arena-avatar {
                    width: 78px;
                    height: 78px;
                    border-radius: 50%;
                    display: grid;
                    place-items: center;
                    background: rgba(2,6,23,.7);
                    border: 1px solid rgba(34,211,238,.28);
                    overflow: hidden;
                    box-shadow: 0 0 20px rgba(34,211,238,.18);
                }
                .rpg-arena-avatar .rpg-player-sprite {
                    transform: scale(.72);
                }
                .rpg-arena-avatar.boss-art {
                    border-color: rgba(248,113,113,.36);
                    box-shadow: 0 0 22px rgba(248,113,113,.18);
                }
                .rpg-arena-avatar.boss-art .rpg-monster-svg {
                    width: 74px;
                    height: 74px;
                }
                .rpg-arena-vs {
                    position: relative;
                    z-index: 3;
                    display: grid;
                    place-items: center;
                    gap: 4px;
                    color: #fbbf24;
                    font-size: 18px;
                    font-weight: 1000;
                    text-shadow: 0 0 14px rgba(251,191,36,.48);
                }
                .rpg-arena-strike {
                    border-radius: 999px;
                    border: 1px solid rgba(251,191,36,.36);
                    background: rgba(0,0,0,.45);
                    padding: 2px 6px;
                    color: #fff7ed;
                    font-size: 8px;
                    font-style: normal;
                    animation: rpg-arena-pop .72s ease-out;
                }
                .rpg-arena-bars {
                    position: relative;
                    z-index: 1;
                    display: grid;
                    gap: 6px;
                    margin-top: 9px;
                }
                .rpg-arena-result {
                    position: relative;
                    z-index: 1;
                    margin-top: 9px;
                    border-radius: 11px;
                    border: 1px solid rgba(148,163,184,.16);
                    background: rgba(2,6,23,.58);
                    padding: 9px;
                    display: grid;
                    gap: 4px;
                    color: #cbd5e1;
                    font-size: 10px;
                    line-height: 1.35;
                }
                .rpg-arena-result b {
                    color: #f8fafc;
                    font-size: 12px;
                }
                .rpg-arena-result span,
                .rpg-arena-result small {
                    color: #94a3b8;
                }
                .rpg-arena-result.win {
                    border-color: rgba(34,197,94,.34);
                    background: rgba(20,83,45,.24);
                }
                .rpg-arena-result.lose {
                    border-color: rgba(248,113,113,.34);
                    background: rgba(127,29,29,.22);
                }
                @keyframes rpg-arena-pop {
                    0% { transform: scale(.55); opacity: 0; }
                    55% { transform: scale(1.1); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .rpg-quick-skins {
                    display: grid;
                    grid-template-columns: repeat(4, minmax(0, 1fr));
                    gap: 7px;
                }
                .rpg-skin-orb {
                    min-height: 76px;
                    border-radius: 12px;
                    border: 1px solid rgba(148,163,184,.16);
                    background: rgba(15,23,42,.72);
                    color: #e2e8f0;
                    cursor: pointer;
                    padding: 7px 4px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 5px;
                    position: relative;
                    overflow: hidden;
                }
                .rpg-skin-orb.active {
                    border-color: var(--skin-color, #22d3ee);
                    box-shadow: 0 0 18px color-mix(in srgb, var(--skin-color, #22d3ee) 38%, transparent);
                }
                .rpg-skin-orb.cooling,
                .rpg-wheel-btn.cooling {
                    pointer-events: none;
                }
                .rpg-skin-orb.locked {
                    opacity: .58;
                    filter: grayscale(.55);
                }
                .rpg-skin-orb-icon {
                    width: 38px;
                    height: 38px;
                    border-radius: 50%;
                    display: grid;
                    place-items: center;
                    background: radial-gradient(circle, color-mix(in srgb, var(--skin-color, #22d3ee) 34%, transparent), transparent 72%);
                    color: var(--skin-color, #22d3ee);
                    font-size: 20px;
                    filter: drop-shadow(0 0 10px var(--skin-color, #22d3ee));
                }
                .rpg-skin-orb-name {
                    width: 100%;
                    color: #e2e8f0;
                    font-size: 8px;
                    font-weight: 900;
                    line-height: 1.15;
                    text-align: center;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .rpg-skin-orb-tag {
                    color: #94a3b8;
                    font-size: 8px;
                    font-weight: 900;
                    line-height: 1.15;
                    text-align: center;
                }
                .rpg-skin-cooldown {
                    position: absolute;
                    inset: 0;
                    display: none;
                    place-items: center;
                    background:
                        conic-gradient(rgba(0,0,0,.62) var(--cooldown-pct, 0%), rgba(0,0,0,.2) 0),
                        rgba(2,6,23,.28);
                    color: #f8fafc;
                    font-size: 18px;
                    font-weight: 1000;
                    text-shadow: 0 1px 3px #000;
                }
                .rpg-skin-orb.cooling .rpg-skin-cooldown,
                .rpg-wheel-btn.cooling .rpg-skin-cooldown {
                    display: grid;
                }
                .rpg-wheel-btn .rpg-skin-cooldown {
                    border-radius: inherit;
                    font-size: 13px;
                }
                .rpg-unlock-grid {
                    position: relative;
                    z-index: 1;
                    display: grid;
                    gap: 7px;
                }
                .rpg-unlock-row {
                    border-radius: 10px;
                    border: 1px solid rgba(148,163,184,.16);
                    background: rgba(2,6,23,.48);
                    padding: 8px;
                    display: grid;
                    grid-template-columns: 30px 1fr;
                    gap: 8px;
                    align-items: center;
                    color: #e2e8f0;
                }
                .rpg-unlock-row > span {
                    width: 30px;
                    height: 30px;
                    border-radius: 9px;
                    display: grid;
                    place-items: center;
                    background: rgba(255,255,255,.06);
                }
                .rpg-unlock-row b {
                    display: block;
                    font-size: 10px;
                    color: #f8fafc;
                    line-height: 1.2;
                }
                .rpg-unlock-row small {
                    display: block;
                    margin-top: 2px;
                    color: #94a3b8;
                    font-size: 9px;
                    line-height: 1.3;
                }
                .rpg-unlock-row.done {
                    border-color: rgba(34,197,94,.28);
                }
                .rpg-unlock-row.locked {
                    opacity: .56;
                }
                .rpg-mini-btn {
                    border: 1px solid rgba(34,211,238,.28);
                    border-radius: 8px;
                    background: rgba(34,211,238,.1);
                    color: #67e8f9;
                    padding: 5px 8px;
                    font-size: 9px;
                    font-weight: 1000;
                    cursor: pointer;
                }
                .lobby-user-wrapper.rpg-world-fighting {
                    z-index: 93 !important;
                }
                .lobby-user-wrapper.rpg-world-fighting .lobby-chibi-container {
                    animation: rpg-world-player-strike 1.15s ease-in-out infinite;
                    transform-origin: 50% 88%;
                }
                .lobby-user-wrapper.rpg-world-fighting .lobby-user-status {
                    background: linear-gradient(135deg, #22c55e, #06b6d4) !important;
                    color: #001018 !important;
                    border-color: rgba(34,211,238,.8) !important;
                    box-shadow: 0 0 14px rgba(34,211,238,.55) !important;
                }
                @keyframes rpg-world-player-strike {
                    0%, 100% { transform: scale(1.3) translateX(0) translateY(0); }
                    40% { transform: scale(1.3) translateX(8px) translateY(-2px) rotate(-2deg); }
                    62% { transform: scale(1.3) translateX(18px) translateY(-5px) rotate(3deg); }
                }
                @keyframes rpg-world-monster-breathe {
                    0%, 100% { transform: translateX(0) scale(1); }
                    50% { transform: translateX(-5px) scale(1.04); }
                }
                @keyframes rpg-world-skill-flight {
                    0% { opacity: 0; transform: translateX(-24px) scale(.65); }
                    18% { opacity: 1; }
                    70% { opacity: 1; transform: translateX(92px) scale(1.08); }
                    100% { opacity: 0; transform: translateX(124px) scale(.5); }
                }
                @keyframes rpg-world-hit-pop {
                    0%, 68%, 100% { opacity: 0; transform: scale(.45); }
                    76% { opacity: 1; transform: scale(1.05); }
                    92% { opacity: 0; transform: scale(1.55); }
                }
                @keyframes rpg-world-damage-float {
                    0%, 64%, 100% { opacity: 0; transform: translateY(8px); }
                    75% { opacity: 1; transform: translateY(0); }
                    94% { opacity: 0; transform: translateY(-20px); }
                }
                @keyframes rpg-world-loot-bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                @keyframes rpg-map-projectile-flight {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(.65) rotate(0deg); }
                    18% { opacity: 1; }
                    100% { opacity: 0; transform: translate(calc(var(--travel-x, 0px) - 50%), calc(var(--travel-y, 0px) - 50%)) scale(.88) rotate(18deg); }
                }
                @media (prefers-reduced-motion: reduce) {
                    .rpg-world-body,
                    .rpg-world-skill,
                    .rpg-world-hit,
                    .rpg-world-damage,
                    .rpg-world-loot,
                    .rpg-map-projectile,
                    .lobby-user-wrapper.rpg-world-fighting .lobby-chibi-container {
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

                <div id="rpg-farm-hud" class="rpg-farm-hud">
                    <button id="rpg-skill-button" class="rpg-skill-button" onclick="LobbyNeon.castRpgSkill()" title="Dùng skill đánh quái gần nhất">
                        <span>⚔️</span>
                        <strong>SKILL</strong>
                    </button>
                    <button id="rpg-auto-button" class="rpg-skill-button rpg-auto-button" onclick="LobbyNeon.toggleRpgAutoFarm()" title="Tự động áp sát và farm quái">
                        <span>⏱</span>
                        <strong>AUTO</strong>
                    </button>
                    <div id="rpg-target-hint" class="rpg-target-hint">Đang dò quái...</div>
                </div>
                <div id="rpg-skill-wheel" class="rpg-skill-wheel"></div>

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

        const hub = container.querySelector('#lobby-game-hub');
        if (hub && !hub.dataset.rpgClickBound) {
            hub.dataset.rpgClickBound = '1';
            hub.addEventListener('mousedown', (e) => e.stopPropagation());
            hub.addEventListener('click', LobbyNeon.handleRpgHubActionClick);
        }
        const wheel = container.querySelector('#rpg-skill-wheel');
        if (wheel && !wheel.dataset.rpgClickBound) {
            wheel.dataset.rpgClickBound = '1';
            wheel.addEventListener('mousedown', (e) => e.stopPropagation());
            wheel.addEventListener('click', LobbyNeon.handleRpgHubActionClick);
        }
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
    handleLobbyKeydown: (e) => {
        if (!LobbyNeon.state.isConnected) return;
        const target = e.target;
        if (target?.closest?.('input, textarea, select, [contenteditable="true"], .modal, .modal-overlay')) return;
        if (String(e.key || '').toLowerCase() === 'm') {
            e.preventDefault();
            LobbyNeon.toggleRpgMapOverlay();
        }
    },

    handleRpgHubActionClick: async (e) => {
        const trigger = e.target?.closest?.('[data-rpg-action]');
        if (!trigger || trigger.disabled) return;

        const action = trigger.dataset.rpgAction;
        const value = trigger.dataset.rpgValue || '';
        if (!action) return;

        e.preventDefault();
        e.stopPropagation();

        try {
            switch (action) {
                case 'select-class':
                    await LobbyNeon.selectRpgClass(value);
                    break;
                case 'equip-skin':
                    await LobbyNeon.equipRpgSkin(value);
                    break;
                case 'quick-skin':
                    await LobbyNeon.quickEquipAndCastRpgSkin(value);
                    break;
                case 'select-zone':
                    LobbyNeon.selectRpgZone(value);
                    break;
                case 'spawn-zone':
                    LobbyNeon.spawnRpgWildMonster(value, true);
                    break;
                case 'travel-zone':
                    await LobbyNeon.travelRpgZone(value);
                    break;
                case 'map-close':
                    LobbyNeon.closeRpgMapOverlay();
                    break;
                case 'bag-toggle':
                    LobbyNeon.toggleRpgBag(trigger.dataset.forceOpen === 'true' ? true : null);
                    break;
                case 'bag-filter':
                    LobbyNeon.setRpgBagFilter(value);
                    break;
                case 'bag-select':
                    await LobbyNeon.selectRpgBagItem(value, true);
                    break;
                case 'bag-equip':
                    await LobbyNeon.equipRpgBagItem();
                    break;
                case 'bag-sell':
                    await LobbyNeon.quickSellRpgBag();
                    break;
                case 'bag-sort':
                    LobbyNeon.sortRpgBag();
                    break;
                case 'bag-split':
                    await LobbyNeon.splitRpgBagItem();
                    break;
                case 'skin-upgrade':
                    await LobbyNeon.upgradeRpgSkin(value);
                    break;
                case 'toggle-auto-skins':
                    await LobbyNeon.toggleRpgAutoSkinRotation();
                    break;
                case 'boss-challenge':
                    await LobbyNeon.challengeRpgBoss(value);
                    break;
                default:
                    break;
            }
        } catch (err) {
            console.warn('rpg hub action error:', err);
            Utils.showToast('Thao tác luyện công bị lỗi, thử lại giúp mình.', 'error');
        }
    },

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

        if (LobbyNeon.state.rpgAutoFarm) {
            LobbyNeon.stopRpgAutoFarm();
            Utils.showToast('Đã tắt auto farm để bạn di chuyển tự do.', 'info');
        }

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
        LobbyNeon.showNpcBanter('npc-battle', 'Vào Võ Đường rồi đó. Chọn môn phái, chạy gần quái rồi bấm SKILL để farm!');
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
            version: '2026.07.03_chibi_rpg_loot_map_v2',
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
        classChosen: false,
        equippedSkin: 'basic',
        unlockedSkins: ['basic'],
        inventory: {
            goldDust: 0,
            linhThach: 0,
            daCuongHoa: 0,
            longAn: 0,
            fireShard: 0,
            thunderShard: 0,
            moonShard: 0,
            bossCore: 0
        },
        dailyKey: LobbyNeon.getRpgDailyKey(),
        stamina: 100,
        skinLevels: {
            basic: 1
        },
        equipmentBag: [],
        autoSettings: {
            lootMinRarity: 'white',
            autoSellMaxRarity: 'none',
            rotateSkins: true
        },
        statPoints: 0,
        stats: {
            str: 1,
            int: 1,
            agi: 1,
            vit: 1,
            luck: 1
        },
        equipment: {},
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
            stats: {
                ...defaults.stats,
                ...((profile && profile.stats) || {})
            },
            equipment: {
                ...defaults.equipment,
                ...((profile && profile.equipment) || {})
            },
            skinLevels: {
                ...defaults.skinLevels,
                ...((profile && profile.skinLevels) || {})
            },
            autoSettings: {
                ...defaults.autoSettings,
                ...((profile && profile.autoSettings) || {})
            },
            statPoints: Number(profile?.statPoints || 0),
            unlockedSkins: Array.from(new Set([...(profile?.unlockedSkins || []), 'basic'])),
            equipmentBag: Array.isArray(profile?.equipmentBag)
                ? profile.equipmentBag.filter(Boolean).slice(0, 120).map((item, index) => ({
                    ...item,
                    uid: item.uid || `eq_old_${Date.now()}_${index}`,
                    type: 'equipment'
                }))
                : [],
            lootLog: Array.isArray(profile?.lootLog) ? profile.lootLog.slice(0, 12) : []
        };
        if (!LobbyNeon.rpgClasses[merged.classId]) merged.classId = 'kiem_tong';
        if (!LobbyNeon.rpgSkins[merged.equippedSkin]) merged.equippedSkin = 'basic';
        merged.classChosen = Boolean(merged.classChosen);
        if (!merged.unlockedSkins.includes(merged.equippedSkin)) merged.equippedSkin = 'basic';
        const equipped = LobbyNeon.rpgSkins[merged.equippedSkin];
        if (merged.classChosen && equipped?.classId && equipped.classId !== merged.classId) {
            merged.equippedSkin = LobbyNeon.getRpgClassDefaultSkinId(merged.classId);
        }

        const today = LobbyNeon.getRpgDailyKey();
        if (merged.dailyKey !== today) {
            merged.dailyKey = today;
            merged.stamina = 100;
        }
        merged.stamina = Math.max(0, Math.min(100, Number(merged.stamina || 0)));
        merged.skinLevels.basic = Math.max(1, Number(merged.skinLevels.basic || 1));
        merged.unlockedSkins.forEach(skinId => {
            merged.skinLevels[skinId] = Math.max(1, Number(merged.skinLevels[skinId] || 1));
        });
        if (!LobbyNeon.rpgEquipmentRarities[merged.autoSettings.lootMinRarity]) merged.autoSettings.lootMinRarity = 'white';
        if (merged.autoSettings.autoSellMaxRarity !== 'none' && !LobbyNeon.rpgEquipmentRarities[merged.autoSettings.autoSellMaxRarity]) {
            merged.autoSettings.autoSellMaxRarity = 'none';
        }
        merged.autoSettings.rotateSkins = merged.autoSettings.rotateSkins !== false;
        Object.keys(merged.stats).forEach(key => {
            merged.stats[key] = Math.max(1, Number(merged.stats[key] || 1));
        });
        merged.statPoints = Math.max(0, Number(merged.statPoints || 0));
        if (window.GameServices?.CharacterService?.hydrateProfile) {
            window.GameServices.CharacterService.hydrateProfile(merged, {
                username,
                auth: window.Auth,
                authUser: window.Auth?.currentUser
            });
        }
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

    getRpgRarityRank: (rarity) => Number(LobbyNeon.rpgEquipmentRarities[rarity]?.rank || 0),

    getRpgEquipmentSaleValue: (item) => {
        const meta = LobbyNeon.rpgEquipmentRarities[item?.rarity] || LobbyNeon.rpgEquipmentRarities.white;
        return Math.max(1, Math.round(Number(meta.sale || 10) + Number(item?.power || 0) * 0.08 + Number(item?.levelReq || 1) * 2));
    },

    rollRpgEquipmentRarity: (zone, profile, source = 'monster', won = true) => {
        const luck = Number(profile?.stats?.luck || 1);
        const zonePower = Number(zone?.rewardPoints || 1);
        const roll = Math.random();
        if (source === 'boss') {
            if (!won) return roll < 0.72 ? 'blue' : 'yellow';
            const redChance = Math.min(0.08, 0.012 + zonePower * 0.006 + luck * 0.0015);
            const pinkChance = Math.min(0.18, 0.035 + zonePower * 0.012 + luck * 0.002);
            const orangeChance = Math.min(0.42, 0.12 + zonePower * 0.024 + luck * 0.003);
            if (roll < redChance) return 'red';
            if (roll < redChance + pinkChance) return 'pink';
            if (roll < redChance + pinkChance + orangeChance) return 'orange';
            return roll < 0.82 ? 'green' : 'yellow';
        }
        const greenChance = Math.min(0.12, 0.025 + zonePower * 0.006 + luck * 0.0018);
        const yellowChance = Math.min(0.23, 0.075 + zonePower * 0.01 + luck * 0.002);
        const blueChance = Math.min(0.48, 0.26 + zonePower * 0.018 + luck * 0.002);
        if (roll < greenChance) return 'green';
        if (roll < greenChance + yellowChance) return 'yellow';
        if (roll < greenChance + yellowChance + blueChance) return 'blue';
        return 'white';
    },

    createRpgEquipmentDrop: (zone, profile, source = 'monster', won = true) => {
        const rarityId = LobbyNeon.rollRpgEquipmentRarity(zone, profile, source, won);
        const rarity = LobbyNeon.rpgEquipmentRarities[rarityId] || LobbyNeon.rpgEquipmentRarities.white;
        const slots = Object.values(LobbyNeon.rpgEquipmentSlotMeta);
        const slot = slots[Math.floor(Math.random() * slots.length)] || LobbyNeon.rpgEquipmentSlotMeta.weapon;
        const classCfg = LobbyNeon.rpgClasses[profile?.classId] || LobbyNeon.rpgClasses.kiem_tong;
        const levelReq = Math.max(1, Number(zone?.minLevel || 1) + Math.floor(Math.random() * 3));
        const rank = Number(rarity.rank || 1);
        const attrPool = [
            { key: 'str', label: 'Luc', min: 2, max: 7 },
            { key: 'int', label: 'Phep', min: 2, max: 7 },
            { key: 'agi', label: 'Nhanh', min: 2, max: 7 },
            { key: 'vit', label: 'The', min: 2, max: 8 },
            { key: 'luck', label: 'May', min: 1, max: 5 },
            { key: 'damage', label: 'Sat thuong', min: 8, max: 24 },
            { key: 'defense', label: 'Phong thu', min: 8, max: 22 },
            { key: 'hp', label: 'HP', min: 45, max: 120 },
            { key: 'crit', label: 'Chi mang', min: 1, max: 4 }
        ].sort(() => Math.random() - 0.5);
        const attrLines = attrPool.slice(0, Number(rarity.attrLines || 1)).map(attr => {
            const raw = attr.min + Math.floor(Math.random() * Math.max(1, attr.max - attr.min + 1));
            const value = Math.max(1, Math.round(raw * (0.65 + rank * 0.28 + Number(zone?.rewardPoints || 1) * 0.08)));
            return { key: attr.key, label: attr.label, value };
        });
        const attrPower = attrLines.reduce((sum, line) => sum + Number(line.value || 0), 0);
        const power = Math.round(levelReq * 42 + Number(zone?.rewardPoints || 1) * 58 + rank * 92 + attrPower * 4);
        return {
            uid: `eq_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            type: 'equipment',
            slot: slot.id,
            slotLabel: slot.label,
            icon: slot.icon,
            name: `${rarity.name} ${slot.label} ${classCfg.name || ''}`.trim(),
            rarity: rarity.id,
            rarityName: rarity.name,
            color: rarity.color,
            levelReq,
            power,
            attrLines,
            source,
            zoneId: zone?.id || 'training_forest',
            zoneName: zone?.name || '',
            createdAt: Date.now()
        };
    },

    rollRpgEquipmentDrops: (zone, profile, source = 'monster', options = {}) => {
        const drops = [];
        const luck = Number(profile?.stats?.luck || 1);
        const zonePower = Number(zone?.rewardPoints || 1);
        const rounds = Math.max(1, Number(options.rounds || 1));
        const won = options.won !== false;
        if (source === 'boss') {
            const chance = won
                ? Math.min(0.78, 0.28 + zonePower * 0.05 + luck * 0.006)
                : Math.min(0.18, 0.04 + zonePower * 0.012 + luck * 0.002);
            if (Math.random() < chance) drops.push(LobbyNeon.createRpgEquipmentDrop(zone, profile, 'boss', won));
            if (won && Math.random() < Math.min(0.22, 0.04 + zonePower * 0.015 + luck * 0.002)) {
                drops.push(LobbyNeon.createRpgEquipmentDrop(zone, profile, 'boss', won));
            }
            return drops;
        }
        const checks = source === 'hunt' ? Math.max(1, Math.round(rounds)) : 1;
        for (let i = 0; i < checks; i++) {
            const chance = source === 'hunt'
                ? Math.min(0.64, 0.28 + zonePower * 0.025 + luck * 0.004)
                : Math.min(0.38, 0.16 + zonePower * 0.018 + luck * 0.003);
            if (Math.random() < chance) drops.push(LobbyNeon.createRpgEquipmentDrop(zone, profile, 'monster', true));
        }
        return drops;
    },

    addRpgEquipmentDrop: (profile, item) => {
        if (!profile || !item) return { kept: false, sold: false, skipped: true, gold: 0, item };
        if (!Array.isArray(profile.equipmentBag)) profile.equipmentBag = [];
        if (!profile.inventory) profile.inventory = {};
        const settings = profile.autoSettings || {};
        const rank = LobbyNeon.getRpgRarityRank(item.rarity);
        const minRank = LobbyNeon.getRpgRarityRank(settings.lootMinRarity || 'white') || 1;
        if (rank < minRank) {
            return { kept: false, sold: false, skipped: true, gold: 0, item };
        }
        const sellRank = settings.autoSellMaxRarity === 'none' ? 0 : LobbyNeon.getRpgRarityRank(settings.autoSellMaxRarity);
        if (sellRank > 0 && rank <= sellRank) {
            const gold = LobbyNeon.getRpgEquipmentSaleValue(item);
            profile.inventory.goldDust = Number(profile.inventory.goldDust || 0) + gold;
            return { kept: false, sold: true, skipped: false, gold, item };
        }
        profile.equipmentBag.unshift(item);
        let soldOverflow = 0;
        if (profile.equipmentBag.length > 120) {
            profile.equipmentBag.sort((a, b) => LobbyNeon.getRpgRarityRank(b.rarity) - LobbyNeon.getRpgRarityRank(a.rarity) || Number(b.power || 0) - Number(a.power || 0));
            const overflow = profile.equipmentBag.splice(120);
            soldOverflow = overflow.reduce((sum, eq) => sum + LobbyNeon.getRpgEquipmentSaleValue(eq), 0);
            profile.inventory.goldDust = Number(profile.inventory.goldDust || 0) + soldOverflow;
        }
        return { kept: true, sold: false, skipped: false, gold: soldOverflow, item };
    },

    applyRpgRewardToProfile: (profile, reward) => {
        if (!profile.inventory) profile.inventory = {};
        Object.entries(reward?.items || {}).forEach(([key, qty]) => {
            profile.inventory[key] = Number(profile.inventory[key] || 0) + Number(qty || 0);
        });
        const result = { equipment: [], soldEquipment: [], skippedEquipment: [], soldGold: 0 };
        (reward?.equipment || reward?.equipmentDrops || []).forEach(item => {
            const applied = LobbyNeon.addRpgEquipmentDrop(profile, item);
            if (applied.kept) result.equipment.push(item);
            if (applied.sold) result.soldEquipment.push(item);
            if (applied.skipped) result.skippedEquipment.push(item);
            result.soldGold += Number(applied.gold || 0);
        });
        return result;
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
            secret_realm: 'fireShard',
            molten_keep: 'fireShard',
            frost_peak: 'thunderShard',
            abyss_gate: 'moonShard'
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
            equipment: LobbyNeon.rollRpgEquipmentDrops(zone, profile, 'hunt', { rounds }),
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
                const label = key === 'bossCore' ? ['Loi Boss', 'Core'] : (labels[key] || [key, '🎁']);
                return `${label[1]} ${LobbyNeon.escapeHtml(label[0])} x${qty}`;
            })
            .join(' · ') || 'Không có vật phẩm';
    },

    formatRpgEquipmentDrops: (equipment = []) => {
        const list = (equipment || []).filter(Boolean);
        if (!list.length) return '';
        return list.map(item => `${LobbyNeon.escapeHtml(item.name)} +${Number(item.power || 0)}`).join(' · ');
    },

    formatRpgReward: (reward) => {
        const parts = [];
        const itemsText = LobbyNeon.formatRpgItems(reward?.items || {});
        if (itemsText && !itemsText.startsWith('Không')) parts.push(itemsText);
        const equipText = LobbyNeon.formatRpgEquipmentDrops(reward?.equipment || reward?.equipmentDrops || []);
        if (equipText) parts.push(equipText);
        return parts.join(' · ') || 'Khong co vat pham';
    },

    getRpgCharacterStats: (profile) => {
        if (window.GameServices?.CharacterService?.calculateCharacterStats) {
            return window.GameServices.CharacterService.calculateCharacterStats(profile, {
                auth: window.Auth,
                authUser: window.Auth?.currentUser
            });
        }
        if (window.GameServices?.StatsService?.calculateCharacterStats) {
            return window.GameServices.StatsService.calculateCharacterStats(profile, {
                auth: window.Auth,
                authUser: window.Auth?.currentUser
            });
        }
        return null;
    },

    getRpgPower: (profile) => {
        const calculated = LobbyNeon.getRpgCharacterStats(profile);
        if (calculated && Number.isFinite(Number(calculated.combatPower))) {
            return Math.round(Number(calculated.combatPower));
        }
        const level = Auth.currentUser?.level || 1;
        const stats = profile?.stats || {};
        const statPower = Number(stats.str || 0) * 34 + Number(stats.int || 0) * 36 + Number(stats.agi || 0) * 30 + Number(stats.vit || 0) * 42 + Number(stats.luck || 0) * 24;
        const equipPower = Object.values(profile?.equipment || {}).reduce((sum, item) => sum + Number(item?.power || 0) + Number(item?.enhance || 0) * 90, 0);
        const skinPower = Object.values(profile?.skinLevels || {}).reduce((sum, n) => sum + Math.max(0, Number(n || 1) - 1) * 45, 0);
        return Math.round(level * 120 + statPower + equipPower + skinPower + (profile.totalHunts || 0) * 16 + (profile.totalRewardPoints || 0) * 20 + (profile.unlockedSkins?.length || 1) * 75);
    },

    awardRpgExp: async (username, rewardPoints, profile) => {
        const expResult = await Auth.addExpToUser(username, Number(rewardPoints || 0), { silentLevelUp: true });
        if (expResult?.leveled && profile) {
            const gainedLevels = Math.max(1, Number(expResult.newLevel || 1) - Number(expResult.oldLevel || 1));
            profile.statPoints = Number(profile.statPoints || 0) + gainedLevels * 3;
            if (window.GameServices?.CharacterService?.hydrateProfile) {
                window.GameServices.CharacterService.hydrateProfile(profile, {
                    username,
                    auth: window.Auth,
                    authUser: window.Auth?.currentUser
                });
            }
            Utils.showToast(`Len cap ${expResult.newLevel}! +${gainedLevels * 3} diem chi so.`, 'success');
        }
        return expResult;
    },

    getRpgStatMeta: () => {
        if (window.GameServices?.CharacterService?.getStatMeta) {
            return window.GameServices.CharacterService.getStatMeta();
        }
        return {
            str: { label: 'Luc', icon: 'STR', desc: 'Tang sat thuong vat ly.' },
            int: { label: 'Phep', icon: 'ENE', desc: 'Tang sat thuong phep.' },
            agi: { label: 'Nhanh', icon: 'AGI', desc: 'Tang ne tranh va chi mang.' },
            vit: { label: 'The', icon: 'VIT', desc: 'Tang HP va phong thu.' },
            luck: { label: 'May', icon: 'LUK', desc: 'Tang ti le roi do hiem.' }
        };
    },

    renderRpgStatsPanel: (profile) => {
        const meta = LobbyNeon.getRpgStatMeta();
        const stats = profile.stats || {};
        const points = Number(profile.statPoints || 0);
        return `
            <div class="rpg-card">
                <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
                    <p class="rpg-title">📊 Chỉ số nhân vật</p>
                    <span class="rpg-chip">+${points} điểm</span>
                </div>
                <div class="rpg-stat-grid">
                    ${Object.entries(meta).map(([key, cfg]) => `
                        <div class="rpg-stat-row">
                            <div class="rpg-stat-top">
                                <span>${cfg.icon} ${cfg.label}: ${Number(stats[key] || 1)}</span>
                                <button class="rpg-stat-add" ${points <= 0 ? 'disabled' : ''} onclick="LobbyNeon.addRpgStat('${key}')">+</button>
                            </div>
                            <div class="rpg-stat-desc">${cfg.desc}</div>
                        </div>
                    `).join('')}
                </div>
                <button class="rpg-action-btn" style="width:100%; margin-top:10px;" ${points <= 0 ? 'disabled' : ''} onclick="LobbyNeon.autoAddRpgStats()">Tự cộng theo môn phái</button>
            </div>
        `;
    },

    addRpgStat: async (statKey) => {
        const meta = LobbyNeon.getRpgStatMeta();
        if (!meta[statKey]) return;
        const { data, profile } = await LobbyNeon.getMyRpgProfile();
        if (Number(profile.statPoints || 0) <= 0) {
            Utils.showToast('Chưa có điểm chỉ số. Lên cấp hoặc thắng boss để nhận thêm.', 'warning');
            return;
        }
        if (window.GameServices?.CharacterService?.addStatPoint) {
            const result = window.GameServices.CharacterService.addStatPoint(profile, statKey, 1);
            if (!result.ok) {
                Utils.showToast('Khong the cong diem chi so luc nay.', 'warning');
                return;
            }
            window.GameServices.CharacterService.hydrateProfile(profile, {
                username: LobbyNeon.getRpgUsername(),
                auth: window.Auth,
                authUser: window.Auth?.currentUser
            });
        } else {
            profile.stats[statKey] = Number(profile.stats[statKey] || 1) + 1;
            profile.statPoints = Number(profile.statPoints || 0) - 1;
        }
        await LobbyNeon.saveMyRpgProfile(profile, data);
        Utils.showToast(`Da cong +1 ${meta[statKey]?.label || statKey}.`, 'success');
        LobbyNeon.renderRpgPanel();
    },

    autoAddRpgStats: async () => {
        const { data, profile } = await LobbyNeon.getMyRpgProfile();
        let points = Number(profile.statPoints || 0);
        if (points <= 0) {
            Utils.showToast('Chưa có điểm chỉ số để tự cộng.', 'warning');
            return;
        }
        if (window.GameServices?.CharacterService?.autoAllocateStats) {
            const result = window.GameServices.CharacterService.autoAllocateStats(profile);
            if (!result.ok) {
                Utils.showToast('Khong the tu cong diem luc nay.', 'warning');
                return;
            }
            window.GameServices.CharacterService.hydrateProfile(profile, {
                username: LobbyNeon.getRpgUsername(),
                auth: window.Auth,
                authUser: window.Auth?.currentUser
            });
        } else {
            const plans = {
                kiem_tong: ['str', 'vit', 'agi', 'luck'],
                phap_tong: ['int', 'luck', 'vit', 'agi'],
                anh_sat: ['agi', 'luck', 'str', 'vit'],
                thien_y: ['vit', 'int', 'luck', 'agi']
            };
            const plan = plans[profile.classId] || plans.kiem_tong;
            let index = 0;
            while (points > 0) {
                const key = plan[index % plan.length];
                profile.stats[key] = Number(profile.stats[key] || 1) + 1;
                points--;
                index++;
            }
            profile.statPoints = 0;
        }
        await LobbyNeon.saveMyRpgProfile(profile, data);
        Utils.showToast('Da tu cong diem theo mon phai.', 'success');
        LobbyNeon.renderRpgPanel();
    },

    getRpgBossCost: (zone) => Math.max(18, Math.round(Number(zone?.staminaCost || 10) * 1.8)),

    getRpgBossPower: (zone) => {
        const level = Auth.currentUser?.level || 1;
        return Math.round((Number(zone?.minLevel || 1) * 210) + (Number(zone?.rewardPoints || 1) * 420) + (level * 65));
    },

    getRpgBossWinChance: (profile, zone) => {
        const characterStats = LobbyNeon.getRpgCharacterStats(profile);
        const totalStats = characterStats?.totalStats || {};
        const stats = profile?.stats || {};
        const playerPower = LobbyNeon.getRpgPower(profile);
        const bossPower = LobbyNeon.getRpgBossPower(zone);
        const vitBonus = Number(totalStats.vitality || stats.vit || 1) * 0.006;
        const luckBonus = Number(totalStats.luck || stats.luck || 1) * 0.004;
        const ratio = playerPower / Math.max(1, bossPower);
        return Math.max(0.12, Math.min(0.92, 0.26 + ratio * 0.36 + vitBonus + luckBonus));
    },

    rollRpgBossReward: (zone, profile, won) => {
        const stats = profile?.stats || {};
        const luck = Number(stats.luck || 1);
        const classCfg = LobbyNeon.rpgClasses[profile.classId] || LobbyNeon.rpgClasses.kiem_tong;
        const shardMap = {
            training_forest: 'thunderShard',
            ghost_cave: 'moonShard',
            secret_realm: 'fireShard',
            molten_keep: 'fireShard',
            frost_peak: 'thunderShard',
            abyss_gate: 'moonShard'
        };
        const mult = won ? 3 : 0.45;
        const rewardPoints = won ? Math.max(2, Number(zone.rewardPoints || 1) * 4) : 1;
        const items = {
            goldDust: Math.max(2, Math.round(Number(zone.gold || 10) * mult * (0.85 + Math.random() * 0.45))),
            [zone.material]: Math.max(1, Math.round(Number(zone.rewardPoints || 1) * mult * classCfg.lootMult))
        };
        if (won) {
            const shardChance = Math.min(0.82, 0.22 + Number(zone.rewardPoints || 1) * 0.11 + luck * 0.008);
            const coreChance = Math.min(0.34, 0.05 + Number(zone.rewardPoints || 1) * 0.045 + luck * 0.006);
            if (Math.random() < shardChance) items[shardMap[zone.id] || 'thunderShard'] = 1 + (Math.random() < 0.18 + luck * 0.004 ? 1 : 0);
            if (Math.random() < coreChance) items.bossCore = 1;
        }
        return {
            rewardPoints,
            exp: rewardPoints * (Auth.EXP_MULTIPLIER || 80),
            items,
            equipment: LobbyNeon.rollRpgEquipmentDrops(zone, profile, 'boss', { won }),
            generatedAt: Date.now()
        };
    },

    renderRpgBossPanel: (profile) => {
        const zone = LobbyNeon.rpgZones[LobbyNeon.state.selectedRpgZone] || LobbyNeon.rpgZones.secret_realm;
        const level = Auth.currentUser?.level || 1;
        const cost = LobbyNeon.getRpgBossCost(zone);
        const locked = level < zone.minLevel;
        const chance = Math.round(LobbyNeon.getRpgBossWinChance(profile, zone) * 100);
        return `
            <div class="rpg-card featured" style="border-color:${zone.color}66;">
                <div style="display:flex; justify-content:space-between; gap:8px; align-items:flex-start;">
                    <div>
                        <p class="rpg-title">${zone.icon} Boss ${LobbyNeon.escapeHtml(zone.name)}</p>
                        <div class="rpg-muted">Dung the luc de danh boss. Yeu qua co the thua, thang se roi nhieu tai nguyen hon.</div>
                    </div>
                    <span class="rpg-chip">${locked ? `Can cap ${zone.minLevel}` : `${chance}% thang`}</span>
                </div>
                <div style="display:flex; flex-wrap:wrap; gap:6px; margin:10px 0;">
                    <span class="rpg-chip">Boss LC ${LobbyNeon.getRpgBossPower(zone)}</span>
                    <span class="rpg-chip">Ton ${cost} the luc</span>
                    <span class="rpg-chip">Do hiem ngau nhien</span>
                </div>
                <button class="rpg-action-btn" style="width:100%;" ${locked || profile.stamina < cost ? 'disabled' : ''} onclick="LobbyNeon.challengeRpgBoss('${zone.id}')">
                    Danh boss
                </button>
            </div>
        `;
    },

    challengeRpgBoss: async (zoneId) => {
        const zone = LobbyNeon.rpgZones[zoneId] || LobbyNeon.rpgZones.secret_realm;
        const { data, profile, username } = await LobbyNeon.getMyRpgProfile();
        const level = Auth.currentUser?.level || 1;
        if (!profile.classChosen) {
            Utils.showToast('Chọn môn phái chính thức trước khi vào Boss Arena.', 'warning');
            return;
        }
        if (level < zone.minLevel) {
            Utils.showToast(`Cần cấp ${zone.minLevel} để khiêu chiến boss này.`, 'warning');
            return;
        }
        const cost = LobbyNeon.getRpgBossCost(zone);
        if (profile.stamina < cost) {
            Utils.showToast('Không đủ thể lực để đánh boss. Mai sẽ hồi lại 100 thể lực.', 'warning');
            return;
        }
        const chance = LobbyNeon.getRpgBossWinChance(profile, zone);
        const won = Math.random() < chance;
        const reward = LobbyNeon.rollRpgBossReward(zone, profile, won);
        const playerPowerBefore = LobbyNeon.getRpgPower(profile);
        const bossPower = LobbyNeon.getRpgBossPower(zone);
        profile.stamina = Math.max(0, Number(profile.stamina || 0) - cost);
        profile.totalHunts = Number(profile.totalHunts || 0) + 1;
        profile.bossWins = Number(profile.bossWins || 0) + (won ? 1 : 0);
        profile.bossLosses = Number(profile.bossLosses || 0) + (won ? 0 : 1);
        const appliedReward = LobbyNeon.applyRpgRewardToProfile(profile, reward);
        profile.totalRewardPoints = Number(profile.totalRewardPoints || 0) + Number(reward.rewardPoints || 0);
        profile.lootLog = [
            {
                time: Date.now(),
                zoneName: `${zone.name} · ${won ? 'Boss win' : 'Boss lose'}`,
                monster: zone.monster,
                rewardPoints: reward.rewardPoints,
                exp: won ? reward.exp : 0,
                items: reward.items || {},
                equipment: appliedReward.equipment,
                soldEquipment: appliedReward.soldEquipment,
                soldGold: appliedReward.soldGold,
                result: won ? 'win' : 'lose'
            },
            ...(profile.lootLog || [])
        ].slice(0, 12);
        if (won) await LobbyNeon.awardRpgExp(username, reward.rewardPoints, profile);
        LobbyNeon.state.rpgBossBattle = {
            zoneId: zone.id,
            won,
            reward,
            cost,
            chance: Math.round(chance * 100),
            playerPower: playerPowerBefore,
            bossPower,
            time: Date.now()
        };
        await LobbyNeon.saveMyRpgProfile(profile, data);
        Utils.showToast(
            won
                ? `Thắng boss: +${reward.exp} EXP · ${LobbyNeon.formatRpgReward(reward)}`
                : `Thua boss, mất thể lực nhưng nhặt được ${LobbyNeon.formatRpgReward(reward)}.`,
            won ? 'success' : 'warning'
        );
        try {
            await DB.sendLobbyChat({
                sender: 'Hệ Thống',
                text: won
                    ? `Boss: @${username} hạ ${zone.monster}, nhận ${LobbyNeon.formatRpgReward(reward)}.`
                    : `Boss: @${username} bị ${zone.monster} đánh lui. Cần tăng chỉ số hơn.`
            });
        } catch (e) {
            console.warn('send rpg boss chat error:', e);
        }
        LobbyNeon.renderRpgPanel();
    },

    getRpgClassDefaultSkinId: (classId) => {
        const defaultByClass = {
            kiem_tong: 'kiem_tong_1',
            phap_tong: 'phap_tong_1',
            anh_sat: 'anh_sat_1',
            thien_y: 'thien_y_1'
        };
        return defaultByClass[classId] || 'basic';
    },

    getRpgVisibleSkins: (profile) => {
        const classId = profile?.classId || 'kiem_tong';
        return Object.values(LobbyNeon.rpgSkins)
            .filter(skin => skin.id === 'basic' || skin.vip || skin.classId === classId);
    },

    isRpgSkinUnlocked: (profile, skin) => {
        if (!skin) return false;
        if (skin.id === 'basic') return true;
        if (skin.classId) {
            return (Auth.currentUser?.level || 1) >= Number(skin.unlockLevel || 1);
        }
        return (profile?.unlockedSkins || []).includes(skin.id);
    },

    getRpgSkillVisualClass: (skin) => {
        return (skin && (skin.visualClass || skin.id)) || 'basic';
    },

    getRpgSkillDamage: (profile, skin) => {
        const classCfg = LobbyNeon.rpgClasses[profile?.classId] || LobbyNeon.rpgClasses.kiem_tong;
        const characterStats = LobbyNeon.getRpgCharacterStats(profile);
        const level = characterStats?.level || Auth.currentUser?.level || 1;
        const base = Number(skin?.damage || 32);
        const totalStats = characterStats?.totalStats || {};
        const stats = profile?.stats || {};
        const mainStat = profile?.classId === 'phap_tong'
            ? Number(totalStats.energy || stats.int || 1)
            : profile?.classId === 'anh_sat'
                ? Number(totalStats.agility || stats.agi || 1)
                : Number(totalStats.strength || stats.str || 1);
        const skinLevel = Math.max(1, Number(profile?.skinLevels?.[skin?.id] || 1));
        const serviceDamage = Number(characterStats?.derived?.damage || 0);
        return Math.max(12, Math.round(base + level * 4 + mainStat * 5 + serviceDamage * 0.18 + (classCfg.expMult || 1) * 7 + (skinLevel - 1) * 8));
    },

    getRpgSkinCooldown: (skin) => Math.max(800, Number(skin?.cooldownMs || 1200)),

    getRpgSkinAreaText: (skin) => {
        const radius = Number(skin?.aoeRadius || 0);
        if (!radius) return 'Đơn mục tiêu';
        if (radius >= 190) return 'Lan rộng lớn';
        return 'Lan rộng';
    },

    getRpgItemMeta: (key) => {
        const meta = {
            goldDust: { name: 'Tinh kim', icon: '🪙', color: '#facc15', rarity: 'Thường', rarityRank: 1, type: 'currency', sale: 0, use: 'Tiền tệ luyện khí. Dùng để trả phí cường hóa, giao dịch và mở tính năng nâng cấp sau này.', tip: 'Boss và bãi cấp cao rơi nhiều hơn quái thường.' },
            linhThach: { name: 'Linh thạch', icon: '💎', color: '#38bdf8', rarity: 'Thường', rarityRank: 1, type: 'material', sale: 8, use: 'Nguyên liệu nền để cường hóa kỹ năng, pháp bảo và chế tạo vật phẩm cấp thấp.', tip: 'Có nhiều ở Rừng Deadline.' },
            daCuongHoa: { name: 'Đá cường hóa', icon: '🪨', color: '#94a3b8', rarity: 'Hiếm', rarityRank: 2, type: 'material', sale: 18, use: 'Nguyên liệu nâng cấp trang bị thật. Khi chưa đập đồ, ô trang bị sẽ không tự hiện +7/+9 nữa.', tip: 'Rơi tốt ở Hang Bug Ma và Đỉnh Băng Bug.' },
            longAn: { name: 'Long ấn', icon: '🔥', color: '#fb923c', rarity: 'Sử thi', rarityRank: 3, type: 'material', sale: 36, use: 'Ấn boss, dùng cho nâng cấp bậc cao và mở công thức cuối game.', tip: 'Ưu tiên đánh Boss Arena khi đủ lực.' },
            fireShard: { name: 'Mảnh Hỏa Long', icon: '🔥', color: '#f97316', rarity: 'Sử thi', rarityRank: 3, type: 'shard', sale: 42, skinId: 'fire_dragon', use: 'Ghép/mở khóa skin chưởng Hỏa Long. Có đánh lan lớn nhưng hồi chiêu lâu.', tip: 'Tỉ lệ cao hơn khi thắng boss hệ lửa hoặc map cấp cao.' },
            thunderShard: { name: 'Mảnh Lôi Ảnh', icon: '⚡', color: '#facc15', rarity: 'Hiếm', rarityRank: 2, type: 'shard', sale: 32, skinId: 'thunder', use: 'Ghép/mở khóa skin chưởng hệ Lôi. Hợp farm quái đông vì có vùng sát thương rộng.', tip: 'Hợp Kiếm Tông/Pháp Tông.' },
            moonShard: { name: 'Mảnh Nguyệt Ảnh', icon: '🌙', color: '#c084fc', rarity: 'Hiếm', rarityRank: 2, type: 'shard', sale: 32, skinId: 'moon_shadow', use: 'Ghép/mở khóa skin chưởng Ám/Nguyệt. Hồi chiêu vừa, nhặt mảnh khá ổn.', tip: 'Ảnh Sát có lợi thế săn mảnh này.' },
            bossCore: { name: 'Lõi Boss', icon: '🧿', color: '#fb7185', rarity: 'Huyền thoại', rarityRank: 4, type: 'rare', sale: 120, use: 'Vật phẩm hiếm rơi từ boss, dành cho nâng cấp cuối game. Có thể tách thành mảnh skin nếu đang thiếu nguyên liệu.', tip: 'Rơi ngẫu nhiên, không đảm bảo mỗi trận.' }
        };
        return meta[key] || { name: key, icon: '🎁', color: '#22d3ee', rarity: 'Lạ', rarityRank: 0, type: 'other', sale: 5, use: 'Vật phẩm chưa định danh.', tip: 'Có thể dùng trong bản cập nhật sau.' };
    },

    showRpgItemInfo: (key, qty = 0) => {
        const item = LobbyNeon.getRpgItemMeta(key);
        const typeName = {
            currency: 'Tiền tệ',
            material: 'Nguyên liệu',
            shard: 'Mảnh skin',
            rare: 'Đồ hiếm',
            equipment: 'Trang bị',
            other: 'Khác'
        }[item.type] || item.type;
        Utils.showModal(
            `${item.icon} ${item.name}`,
            `<div style="display:grid; gap:10px;">
                <div style="display:flex; align-items:center; gap:12px;">
                    <div style="width:58px; height:58px; border-radius:16px; display:grid; place-items:center; font-size:32px; background:rgba(15,23,42,.82); border:1px solid ${item.color}66; box-shadow:0 0 24px ${item.color}33;">${item.icon}</div>
                    <div>
                        <div style="color:${item.color}; font-weight:900; font-size:13px;">${item.rarity}</div>
                        <div style="color:#cbd5e1; font-size:12px; margin-top:4px;">Đang có: <b>x${Number(qty || 0)}</b></div>
                        <div style="color:#94a3b8; font-size:11px; margin-top:4px;">Nhóm: <b>${typeName}</b>${item.sale ? ` · Giá bán: ${item.sale}/cái` : ''}</div>
                    </div>
                </div>
                <div style="color:#e2e8f0; font-size:13px; line-height:1.5;">${LobbyNeon.escapeHtml(item.use)}</div>
                <div style="color:#94a3b8; font-size:12px; line-height:1.45; padding:10px; border-radius:10px; background:rgba(15,23,42,.66); border:1px solid rgba(148,163,184,.16);">${LobbyNeon.escapeHtml(item.tip)}</div>
            </div>`,
            null,
            null,
            'ĐÃ HIỂU'
        );
    },

    getRpgInventoryItems: (profile) => {
        const filter = LobbyNeon.state.rpgBagFilter || 'all';
        const sortMode = LobbyNeon.state.rpgBagSortMode || 'rarity';
        const items = Object.entries(profile?.inventory || {})
            .filter(([, qty]) => Number(qty) > 0)
            .map(([key, qty]) => ({ key, qty: Number(qty), ...LobbyNeon.getRpgItemMeta(key) }));

        const filtered = items.filter(item => {
            if (filter === 'all') return true;
            if (filter === 'equipment') return item.type === 'equipment';
            if (filter === 'material') return ['material', 'shard'].includes(item.type);
            if (filter === 'other') return !['equipment', 'material', 'shard'].includes(item.type);
            return true;
        });

        return filtered.sort((a, b) => {
            if (sortMode === 'qty') return b.qty - a.qty || b.rarityRank - a.rarityRank || a.name.localeCompare(b.name, 'vi');
            if (sortMode === 'name') return a.name.localeCompare(b.name, 'vi');
            return b.rarityRank - a.rarityRank || b.qty - a.qty || a.name.localeCompare(b.name, 'vi');
        });
    },

    getRpgEquipmentBagItems: (profile) => {
        const filter = LobbyNeon.state.rpgBagFilter || 'all';
        if (!['all', 'equipment'].includes(filter)) return [];
        return (profile?.equipmentBag || []).map(item => {
            const rarity = LobbyNeon.rpgEquipmentRarities[item.rarity] || LobbyNeon.rpgEquipmentRarities.white;
            return {
                ...item,
                key: `eq:${item.uid}`,
                qty: 1,
                icon: item.icon || LobbyNeon.rpgEquipmentSlotMeta[item.slot]?.icon || 'EQ',
                color: item.color || rarity.color,
                rarity: rarity.name,
                rarityId: item.rarity,
                rarityRank: rarity.rank,
                type: 'equipment',
                use: `${item.slotLabel || item.slot} · LC +${Number(item.power || 0)} · ${Number(item.attrLines?.length || 0)} dong`
            };
        });
    },

    getRpgBagItems: (profile) => {
        const sortMode = LobbyNeon.state.rpgBagSortMode || 'rarity';
        const items = [
            ...LobbyNeon.getRpgEquipmentBagItems(profile),
            ...LobbyNeon.getRpgInventoryItems(profile)
        ];
        return items.sort((a, b) => {
            if (sortMode === 'qty') return Number(b.qty || 1) - Number(a.qty || 1) || Number(b.rarityRank || 0) - Number(a.rarityRank || 0) || a.name.localeCompare(b.name, 'vi');
            if (sortMode === 'name') return a.name.localeCompare(b.name, 'vi');
            return Number(b.rarityRank || 0) - Number(a.rarityRank || 0) || Number(b.power || 0) - Number(a.power || 0) || Number(b.qty || 1) - Number(a.qty || 1) || a.name.localeCompare(b.name, 'vi');
        });
    },

    getRpgEquipmentSlots: (profile) => {
        const classCfg = LobbyNeon.rpgClasses[profile.classId] || LobbyNeon.rpgClasses.kiem_tong;
        const skin = LobbyNeon.rpgSkins[profile.equippedSkin] || LobbyNeon.rpgSkins.basic;
        const equipment = profile.equipment || {};
        const build = (id, label, icon, color, fallbackName) => {
            const item = equipment[id] || {};
            const enhance = Number(item.enhance || 0);
            const power = Number(item.power || 0);
            return {
                id,
                label,
                icon: item.icon || icon,
                color: item.color || color,
                name: item.name || fallbackName || 'Chưa trang bị',
                level: power > 0 ? `+${power}` : (enhance > 0 ? `+${enhance}` : ''),
                empty: !item.name && !fallbackName
            };
        };
        return [
            build('weapon', 'Vũ khí', skin.icon, skin.color, skin.name),
            build('helm', 'Mũ', classCfg.icon, classCfg.color, ''),
            build('armor', 'Áo', '👕', '#ec4899', ''),
            build('pants', 'Quần', '🥾', '#60a5fa', ''),
            build('glove', 'Găng', '🧤', '#a78bfa', ''),
            build('boots', 'Giày', '👢', '#38bdf8', ''),
            build('wing', 'Cánh', '🪽', '#22d3ee', ''),
            build('pet', 'Pet', '🐉', '#86efac', ''),
            build('necklace', 'Dây chuyền', '📿', '#fbbf24', ''),
            build('ring', 'Nhẫn', '💍', '#f472b6', '')
        ];
    },

    toggleRpgBag: (forceOpen = null) => {
        LobbyNeon.state.rpgBagOpen = forceOpen === null ? !LobbyNeon.state.rpgBagOpen : Boolean(forceOpen);
        LobbyNeon.renderRpgPanel();
    },

    setRpgBagFilter: (filter) => {
        if (!['all', 'equipment', 'material', 'other'].includes(filter)) return;
        LobbyNeon.state.rpgBagFilter = filter;
        LobbyNeon.state.rpgBagOpen = true;
        LobbyNeon.renderRpgPanel();
    },

    setRpgLootMinRarity: async (rarity) => {
        if (!LobbyNeon.rpgEquipmentRarities[rarity]) return;
        const { data, profile } = await LobbyNeon.getMyRpgProfile();
        profile.autoSettings.lootMinRarity = rarity;
        await LobbyNeon.saveMyRpgProfile(profile, data);
        Utils.showToast(`Loc nhat tu bac ${LobbyNeon.rpgEquipmentRarities[rarity].name}.`, 'success');
        LobbyNeon.renderRpgPanel();
    },

    setRpgAutoSellMaxRarity: async (rarity) => {
        if (rarity !== 'none' && !LobbyNeon.rpgEquipmentRarities[rarity]) return;
        const { data, profile } = await LobbyNeon.getMyRpgProfile();
        profile.autoSettings.autoSellMaxRarity = rarity;
        await LobbyNeon.saveMyRpgProfile(profile, data);
        Utils.showToast(rarity === 'none' ? 'Da tat tu dong ban do.' : `Tu dong ban do <= ${LobbyNeon.rpgEquipmentRarities[rarity].name}.`, 'success');
        LobbyNeon.renderRpgPanel();
    },

    toggleRpgAutoSkinRotation: async () => {
        const { data, profile } = await LobbyNeon.getMyRpgProfile();
        profile.autoSettings.rotateSkins = profile.autoSettings.rotateSkins === false;
        await LobbyNeon.saveMyRpgProfile(profile, data);
        Utils.showToast(profile.autoSettings.rotateSkins ? 'Auto se xoay vong skin da mo.' : 'Auto chi dung skin dang chon.', 'info');
        LobbyNeon.renderRpgPanel();
    },

    selectRpgBagItem: async (key, showInfo = true) => {
        const { profile } = await LobbyNeon.getMyRpgProfile();
        if (String(key || '').startsWith('eq:')) {
            const uid = String(key).slice(3);
            const item = (profile.equipmentBag || []).find(eq => eq.uid === uid);
            if (!item) return;
            LobbyNeon.state.rpgSelectedItemKey = key;
            LobbyNeon.state.rpgBagOpen = true;
            LobbyNeon.renderRpgPanel();
            Utils.showToast(`Da chon ${item.name}.`, 'info');
            if (showInfo) LobbyNeon.showRpgEquipmentInfo(uid);
            return;
        }
        const qty = Number(profile.inventory?.[key] || 0);
        if (qty <= 0) return;
        const item = LobbyNeon.getRpgItemMeta(key);
        LobbyNeon.state.rpgSelectedItemKey = key;
        LobbyNeon.state.rpgBagOpen = true;
        LobbyNeon.renderRpgPanel();
        Utils.showToast(`Đã chọn ${item ? item.name : key} x${qty}.`, 'info');
        if (showInfo) LobbyNeon.showRpgItemInfo(key, qty);
    },

    showRpgEquipmentInfo: async (uid) => {
        const { profile } = await LobbyNeon.getMyRpgProfile();
        const item = (profile.equipmentBag || []).find(eq => eq.uid === uid) || Object.values(profile.equipment || {}).find(eq => eq?.uid === uid);
        if (!item) return;
        const rarity = LobbyNeon.rpgEquipmentRarities[item.rarity] || LobbyNeon.rpgEquipmentRarities.white;
        const attrs = (item.attrLines || []).map(line => `
            <div style="display:flex; justify-content:space-between; gap:10px; padding:6px 0; border-bottom:1px solid rgba(148,163,184,.12);">
                <span>${LobbyNeon.escapeHtml(line.label)}</span>
                <b>+${Number(line.value || 0).toLocaleString('vi-VN')}</b>
            </div>
        `).join('');
        Utils.showModal(
            `${item.icon || 'EQ'} ${LobbyNeon.escapeHtml(item.name)}`,
            `<div style="display:grid; gap:10px;">
                <div style="display:flex; align-items:center; gap:12px;">
                    <div style="width:58px; height:58px; border-radius:14px; display:grid; place-items:center; font-size:16px; font-weight:900; background:rgba(15,23,42,.85); border:1px solid ${rarity.color}88; color:${rarity.color};">${item.icon || 'EQ'}</div>
                    <div>
                        <div style="color:${rarity.color}; font-weight:900;">${LobbyNeon.escapeHtml(rarity.name)}</div>
                        <div style="color:#cbd5e1; font-size:12px;">Slot: ${LobbyNeon.escapeHtml(item.slotLabel || item.slot)} · Lv.${Number(item.levelReq || 1)} · LC +${Number(item.power || 0).toLocaleString('vi-VN')}</div>
                        <div style="color:#94a3b8; font-size:11px;">Gia ban: ${LobbyNeon.getRpgEquipmentSaleValue(item).toLocaleString('vi-VN')} tinh kim</div>
                    </div>
                </div>
                <div style="padding:8px 10px; border-radius:10px; background:rgba(15,23,42,.66); border:1px solid rgba(148,163,184,.16); color:#e2e8f0; font-size:12px;">
                    ${attrs || 'Khong co dong thuoc tinh'}
                </div>
                <div style="display:flex; gap:8px;">
                    <button class="btn-primary" style="flex:1;" onclick="LobbyNeon.equipRpgEquipment('${uid}'); Utils.closeModal();">Mac trang bi</button>
                    <button class="btn-secondary" style="flex:1;" onclick="LobbyNeon.sellRpgEquipment('${uid}'); Utils.closeModal();">Ban lay vang</button>
                </div>
            </div>`,
            null,
            null,
            'DONG'
        );
    },

    equipRpgEquipment: async (uid) => {
        const { data, profile } = await LobbyNeon.getMyRpgProfile();
        const bag = Array.isArray(profile.equipmentBag) ? profile.equipmentBag : [];
        const index = bag.findIndex(item => item.uid === uid);
        if (index < 0) {
            Utils.showToast('Khong tim thay trang bi trong tui.', 'warning');
            return;
        }
        const item = bag[index];
        const level = Auth.currentUser?.level || 1;
        if (level < Number(item.levelReq || 1)) {
            Utils.showToast(`Can cap ${item.levelReq} de mac mon nay.`, 'warning');
            return;
        }
        const current = profile.equipment?.[item.slot];
        if (!profile.equipment) profile.equipment = {};
        bag.splice(index, 1);
        if (current && current.uid) bag.unshift(current);
        profile.equipment[item.slot] = item;
        profile.equipmentBag = bag.slice(0, 120);
        LobbyNeon.state.rpgSelectedItemKey = `eq:${item.uid}`;
        await LobbyNeon.saveMyRpgProfile(profile, data);
        Utils.showToast(`Da mac ${item.name}.`, 'success');
        LobbyNeon.renderRpgPanel();
    },

    sellRpgEquipment: async (uid) => {
        const { data, profile } = await LobbyNeon.getMyRpgProfile();
        const bag = Array.isArray(profile.equipmentBag) ? profile.equipmentBag : [];
        const index = bag.findIndex(item => item.uid === uid);
        if (index < 0) {
            Utils.showToast('Khong tim thay trang bi trong tui.', 'warning');
            return;
        }
        const item = bag[index];
        const gold = LobbyNeon.getRpgEquipmentSaleValue(item);
        bag.splice(index, 1);
        profile.equipmentBag = bag;
        profile.inventory.goldDust = Number(profile.inventory.goldDust || 0) + gold;
        if (LobbyNeon.state.rpgSelectedItemKey === `eq:${uid}`) LobbyNeon.state.rpgSelectedItemKey = null;
        await LobbyNeon.saveMyRpgProfile(profile, data);
        Utils.showToast(`Da ban ${item.name}, nhan +${gold.toLocaleString('vi-VN')} tinh kim.`, 'success');
        LobbyNeon.renderRpgPanel();
    },

    sortRpgBag: () => {
        const modes = ['rarity', 'qty', 'name'];
        const current = LobbyNeon.state.rpgBagSortMode || 'rarity';
        const next = modes[(modes.indexOf(current) + 1) % modes.length];
        LobbyNeon.state.rpgBagSortMode = next;
        LobbyNeon.state.rpgBagOpen = true;
        Utils.showToast(next === 'rarity' ? 'Đã sắp xếp theo độ hiếm.' : next === 'qty' ? 'Đã sắp xếp theo số lượng.' : 'Đã sắp xếp theo tên.', 'info');
        LobbyNeon.renderRpgPanel();
    },

    quickSellRpgBag: async () => {
        const selectedKey = LobbyNeon.state.rpgSelectedItemKey;
        if (String(selectedKey || '').startsWith('eq:')) {
            await LobbyNeon.sellRpgEquipment(String(selectedKey).slice(3));
            return;
        }
        const { data, profile } = await LobbyNeon.getMyRpgProfile();
        const sellableKeys = Object.keys(profile.inventory || {}).filter(key => {
            const item = LobbyNeon.getRpgItemMeta(key);
            return Number(item.sale || 0) > 0 && ['material', 'other'].includes(item.type) && Number(profile.inventory[key] || 0) > 0;
        });
        if (!sellableKeys.length) {
            Utils.showToast('Không có nguyên liệu thường nào để bán nhanh. Mảnh skin và Lõi Boss được giữ lại.', 'info');
            return;
        }
        const ok = confirm('Bán nhanh sẽ bán 25% nguyên liệu thường, không bán mảnh skin/Lõi Boss. Tiếp tục?');
        if (!ok) return;
        let goldGain = 0;
        sellableKeys.forEach(key => {
            const item = LobbyNeon.getRpgItemMeta(key);
            const qty = Number(profile.inventory[key] || 0);
            const sold = Math.max(1, Math.floor(qty * 0.25));
            profile.inventory[key] = Math.max(0, qty - sold);
            goldGain += sold * Number(item.sale || 0);
        });
        profile.inventory.goldDust = Number(profile.inventory.goldDust || 0) + goldGain;
        await LobbyNeon.saveMyRpgProfile(profile, data);
        Utils.showToast(`Đã bán nhanh nguyên liệu, nhận +${goldGain.toLocaleString('vi-VN')} tinh kim.`, 'success');
        LobbyNeon.renderRpgPanel();
    },

    splitRpgBagItem: async () => {
        const key = LobbyNeon.state.rpgSelectedItemKey;
        const { data, profile } = await LobbyNeon.getMyRpgProfile();
        const qty = Number(profile.inventory?.[key] || 0);
        if (!key || qty <= 0) {
            Utils.showToast('Chọn một vật phẩm trong túi trước khi tách.', 'warning');
            return;
        }
        if (key === 'bossCore') {
            profile.inventory.bossCore = qty - 1;
            profile.inventory.fireShard = Number(profile.inventory.fireShard || 0) + 1;
            profile.inventory.thunderShard = Number(profile.inventory.thunderShard || 0) + 1;
            profile.inventory.moonShard = Number(profile.inventory.moonShard || 0) + 1;
            await LobbyNeon.saveMyRpgProfile(profile, data);
            Utils.showToast('Đã tách 1 Lõi Boss thành 3 mảnh skin hiếm.', 'success');
            LobbyNeon.renderRpgPanel();
            return;
        }
        if (key === 'longAn') {
            profile.inventory.longAn = qty - 1;
            profile.inventory.daCuongHoa = Number(profile.inventory.daCuongHoa || 0) + 3;
            await LobbyNeon.saveMyRpgProfile(profile, data);
            Utils.showToast('Đã tách 1 Long ấn thành 3 Đá cường hóa.', 'success');
            LobbyNeon.renderRpgPanel();
            return;
        }
        Utils.showToast('Vật phẩm này hiện không tách được. Hãy chọn Lõi Boss hoặc Long ấn.', 'info');
    },

    equipRpgBagItem: async () => {
        const key = LobbyNeon.state.rpgSelectedItemKey;
        if (String(key || '').startsWith('eq:')) {
            await LobbyNeon.equipRpgEquipment(String(key).slice(3));
            return;
        }
        const { profile } = await LobbyNeon.getMyRpgProfile();
        const qty = Number(profile.inventory?.[key] || 0);
        if (!key || qty <= 0) {
            Utils.showToast('Chọn một vật phẩm trong túi trước.', 'warning');
            return;
        }
        const item = LobbyNeon.getRpgItemMeta(key);
        if (item.skinId) {
            await LobbyNeon.equipRpgSkin(item.skinId);
            return;
        }
        Utils.showToast(`${item.name} là ${item.rarity.toLowerCase()} dùng để nâng cấp/chế tạo, chưa phải trang bị mặc trực tiếp.`, 'info');
    },

    renderRpgEquipmentPanel: (profile) => {
        const classCfg = LobbyNeon.rpgClasses[profile.classId] || LobbyNeon.rpgClasses.kiem_tong;
        const skin = LobbyNeon.rpgSkins[profile.equippedSkin] || LobbyNeon.rpgSkins.basic;
        const items = LobbyNeon.getRpgInventoryItems(profile);
        const totalCells = Math.max(25, Math.ceil(Math.max(items.length, 1) / 5) * 5);
        const cells = Array.from({ length: totalCells }, (_, index) => items[index] || null);
        const slots = [
            { label: 'Môn phái', icon: classCfg.icon, name: profile.classChosen ? classCfg.name : 'Chưa nhập môn', color: classCfg.color },
            { label: 'Chưởng', icon: skin.icon, name: skin.name, color: skin.color },
            { label: 'Trang phục', icon: '👕', name: 'Theo tủ đồ Chibi', color: '#ec4899' },
            { label: 'Cánh', icon: '🦋', name: 'Theo tủ đồ Chibi', color: '#38bdf8' },
            { label: 'Linh thú', icon: '🐉', name: 'Theo tủ đồ Chibi', color: '#86efac' },
            { label: 'Vòng sáng', icon: '⭕', name: 'Theo tủ đồ Chibi', color: '#facc15' }
        ];
        return `
            <div class="rpg-inventory-layout">
                <div class="rpg-equip-panel">
                    <div class="rpg-panel-head">
                        <span>🛡 Trang bị</span>
                        <button class="rpg-mini-btn" onclick="if(typeof ChibiModule !== 'undefined') ChibiModule.openBuilder()">Tủ đồ</button>
                    </div>
                    <div class="rpg-character-frame">
                        <div class="rpg-player-sprite">${LobbyNeon.getRpgPlayerBattleSvg()}</div>
                    </div>
                    <div class="rpg-equip-grid">
                        ${slots.map(slot => `
                            <div class="rpg-equip-slot" style="--equip-color:${slot.color};">
                                <div class="rpg-equip-icon">${slot.icon}</div>
                                <div>
                                    <div class="rpg-equip-label">${slot.label}</div>
                                    <div class="rpg-equip-name">${LobbyNeon.escapeHtml(slot.name)}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="rpg-bag-panel">
                    <div class="rpg-panel-head">
                        <span>🎒 Ba lô</span>
                        <span class="rpg-chip">${items.length} loại</span>
                    </div>
                    <div class="rpg-bag-grid">
                        ${cells.map(item => item ? `
                            <button type="button" class="rpg-bag-cell has-item" title="${LobbyNeon.escapeHtml(item.name)} x${item.qty}" style="--item-color:${item.color};" onclick="LobbyNeon.showRpgItemInfo('${item.key}', ${item.qty})">
                                <span class="rpg-bag-icon">${item.icon}</span>
                                <span class="rpg-bag-qty">x${item.qty}</span>
                            </button>
                        ` : `<div class="rpg-bag-cell"></div>`).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    renderRpgTopPanel: (profile) => {
        const classCfg = LobbyNeon.rpgClasses[profile.classId] || LobbyNeon.rpgClasses.kiem_tong;
        const equippedSkin = LobbyNeon.rpgSkins[profile.equippedSkin] || LobbyNeon.rpgSkins.basic;
        const characterStats = LobbyNeon.getRpgCharacterStats(profile);
        const level = characterStats?.level || Auth.currentUser?.level || 1;
        const exp = characterStats?.exp ?? Auth.currentUser?.exp ?? 0;
        const currentExp = characterStats?.currentLevelExp ?? (Auth.getExpForLevel ? Auth.getExpForLevel(level) : 0);
        const nextExp = characterStats?.nextExp ?? (Auth.getExpForLevel ? Auth.getExpForLevel(level + 1) : Math.max(1, exp + 1));
        const expInLevel = Math.max(0, exp - currentExp);
        const expNeeded = Math.max(1, nextExp - currentExp);
        const expPct = Math.max(0, Math.min(100, (expInLevel / expNeeded) * 100));
        const hp = characterStats?.derived?.maxHp || Math.round(1200 + Number(profile.stats?.vit || 1) * 280 + level * 120);
        const mp = characterStats?.derived?.maxMp || Math.round(700 + Number(profile.stats?.int || 1) * 210 + level * 82);
        const power = characterStats?.combatPower || LobbyNeon.getRpgPower(profile);
        return `
            <div class="rpg-mu-top">
                <div class="rpg-mu-identity">
                    <div class="rpg-mu-avatar"><div class="rpg-player-sprite">${LobbyNeon.getRpgPlayerBattleSvg()}</div></div>
                    <div>
                        <p class="rpg-mu-name">${classCfg.icon} ${profile.classChosen ? classCfg.name : 'Nhan Vat'}</p>
                        <div class="rpg-mu-level">Lv. ${level} · ${equippedSkin.icon} ${LobbyNeon.escapeHtml(equippedSkin.name)}</div>
                    </div>
                </div>
                <div class="rpg-mu-power">LUC CHIEN ${power.toLocaleString('vi-VN')}</div>
                <div class="rpg-mu-bars">
                    <div class="rpg-mu-bar exp"><span style="width:${expPct}%;"></span><b>EXP ${expInLevel.toLocaleString('vi-VN')} / ${expNeeded.toLocaleString('vi-VN')} (${expPct.toFixed(1)}%)</b></div>
                    <div class="rpg-mu-bar hp"><span style="width:100%;"></span><b>HP ${hp.toLocaleString('vi-VN')} / ${hp.toLocaleString('vi-VN')}</b></div>
                    <div class="rpg-mu-bar mp"><span style="width:100%;"></span><b>MP ${mp.toLocaleString('vi-VN')} / ${mp.toLocaleString('vi-VN')}</b></div>
                </div>
                <div class="rpg-mu-currencies">
                    <div class="rpg-mu-money"><span>🪙</span><b>${Number(profile.inventory?.goldDust || 0).toLocaleString('vi-VN')}</b></div>
                    <div class="rpg-mu-money"><span>💎</span><b>${Number(profile.inventory?.linhThach || 0).toLocaleString('vi-VN')}</b></div>
                    <div class="rpg-mu-money"><span>🧿</span><b>${Number(profile.inventory?.bossCore || 0).toLocaleString('vi-VN')}</b></div>
                </div>
            </div>
        `;
    },

    renderRpgEquipmentPanel: (profile) => {
        const items = LobbyNeon.getRpgBagItems(profile);
        const allItemCount = Object.values(profile.inventory || {}).filter(qty => Number(qty) > 0).length + Number(profile.equipmentBag?.length || 0);
        const bagOpen = Boolean(LobbyNeon.state.rpgBagOpen);
        const totalCells = bagOpen ? Math.max(30, Math.ceil(Math.max(items.length, 1) / 5) * 5) : Math.max(10, Math.ceil(Math.max(items.length, 1) / 5) * 5);
        const cells = Array.from({ length: totalCells }, (_, index) => items[index] || null);
        const slots = LobbyNeon.getRpgEquipmentSlots(profile);
        const leftSlots = slots.slice(0, 5);
        const rightSlots = slots.slice(5);
        const filters = [
            { id: 'all', label: 'Tất cả' },
            { id: 'equipment', label: 'Trang bị' },
            { id: 'material', label: 'Nguyên liệu' },
            { id: 'other', label: 'Khác' }
        ];
        const selectedKey = LobbyNeon.state.rpgSelectedItemKey;
        const selectedEquipment = String(selectedKey || '').startsWith('eq:')
            ? (profile.equipmentBag || []).find(item => item.uid === String(selectedKey).slice(3))
            : null;
        const selectedQty = selectedEquipment ? 1 : Number(profile.inventory?.[selectedKey] || 0);
        const selectedItem = selectedEquipment
            ? {
                ...selectedEquipment,
                color: selectedEquipment.color || LobbyNeon.rpgEquipmentRarities[selectedEquipment.rarity]?.color || '#e5e7eb',
                icon: selectedEquipment.icon || 'EQ',
                rarity: LobbyNeon.rpgEquipmentRarities[selectedEquipment.rarity]?.name || selectedEquipment.rarity,
                use: `Slot ${selectedEquipment.slotLabel || selectedEquipment.slot} · LC +${Number(selectedEquipment.power || 0)}`
            }
            : (selectedQty > 0 ? LobbyNeon.getRpgItemMeta(selectedKey) : null);
        return `
            <div class="rpg-mu-shell">
                <div class="rpg-mu-panel">
                    <div class="rpg-mu-heading">
                        <span>⚔️ Trang bị</span>
                        <button class="rpg-mini-btn" onclick="if(typeof ChibiModule !== 'undefined') ChibiModule.openBuilder()">Ngoại hình</button>
                    </div>
                    <div class="rpg-mu-equipment">
                        <div class="rpg-mu-slot-col">
                            ${leftSlots.map(slot => `
                                <div class="rpg-mu-slot ${slot.empty ? 'empty' : ''}" style="--equip-color:${slot.color};" title="${LobbyNeon.escapeHtml(slot.name)}">
                                    ${slot.level ? `<span class="rpg-mu-slot-level">${slot.level}</span>` : ''}
                                    <span class="rpg-mu-slot-icon">${slot.icon}</span>
                                    <span class="rpg-mu-slot-label">${LobbyNeon.escapeHtml(slot.label)}</span>
                                </div>
                            `).join('')}
                        </div>
                        <div class="rpg-mu-character">
                            <div class="rpg-player-sprite">${LobbyNeon.getRpgPlayerBattleSvg()}</div>
                        </div>
                        <div class="rpg-mu-slot-col">
                            ${rightSlots.map(slot => `
                                <div class="rpg-mu-slot ${slot.empty ? 'empty' : ''}" style="--equip-color:${slot.color};" title="${LobbyNeon.escapeHtml(slot.name)}">
                                    ${slot.level ? `<span class="rpg-mu-slot-level">${slot.level}</span>` : ''}
                                    <span class="rpg-mu-slot-icon">${slot.icon}</span>
                                    <span class="rpg-mu-slot-label">${LobbyNeon.escapeHtml(slot.label)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <div class="rpg-mu-panel">
                    <div class="rpg-mu-heading">
                        <span>🎒 Ba lô</span>
                        <button class="rpg-mini-btn" data-rpg-action="bag-toggle">${bagOpen ? 'Đóng' : 'Mở túi'}</button>
                    </div>
                    <div class="rpg-bag-summary">
                        <span class="rpg-chip">${allItemCount}/120 loại</span>
                        <span class="rpg-chip">Lọc: ${filters.find(f => f.id === LobbyNeon.state.rpgBagFilter)?.label || 'Tất cả'}</span>
                        <span class="rpg-chip">Sắp xếp: ${LobbyNeon.state.rpgBagSortMode === 'qty' ? 'Số lượng' : LobbyNeon.state.rpgBagSortMode === 'name' ? 'Tên' : 'Độ hiếm'}</span>
                    </div>
                    ${bagOpen ? `
                        <div class="rpg-mu-bag-tabs">
                            ${filters.map(tab => `
                                <button class="rpg-mu-bag-tab ${LobbyNeon.state.rpgBagFilter === tab.id ? 'active' : ''}" data-rpg-action="bag-filter" data-rpg-value="${tab.id}">${tab.label}</button>
                            `).join('')}
                        </div>
                        ${items.length ? `
                            <div class="rpg-bag-grid">
                                ${cells.map(item => item ? `
                                    <button type="button" class="rpg-bag-cell has-item ${selectedKey === item.key ? 'selected' : ''}" title="${LobbyNeon.escapeHtml(item.name)} x${item.qty}" style="--item-color:${item.color};" data-rpg-action="bag-select" data-rpg-value="${item.key}">
                                        <span class="rpg-bag-icon">${item.icon}</span>
                                        <span class="rpg-bag-qty">${item.type === 'equipment' ? `+${Number(item.power || 0)}` : `x${item.qty}`}</span>
                                    </button>
                                ` : `<div class="rpg-bag-cell"></div>`).join('')}
                            </div>
                        ` : `<div class="rpg-bag-empty">Không có vật phẩm trong nhóm này.</div>`}
                        <div class="rpg-selected-item">
                            ${selectedItem ? `
                                <span style="color:${selectedItem.color};">${selectedItem.icon}</span>
                                <b>${LobbyNeon.escapeHtml(selectedItem.name)}</b>
                                <small>x${selectedQty} · ${selectedItem.rarity} · ${LobbyNeon.escapeHtml(selectedItem.use)}</small>
                            ` : `
                                <b>Chưa chọn vật phẩm</b>
                                <small>Bấm vào một ô để xem tác dụng, rồi dùng các nút bên dưới.</small>
                            `}
                        </div>
                        <div class="rpg-mu-bag-actions">
                            <button class="rpg-mu-small-btn" data-rpg-action="bag-equip">Trang bị / Dùng</button>
                            <button class="rpg-mu-small-btn" data-rpg-action="bag-sell">Bán nhanh</button>
                            <button class="rpg-mu-small-btn" data-rpg-action="bag-sort">Sắp xếp</button>
                            <button class="rpg-mu-small-btn" data-rpg-action="bag-split">Tách</button>
                        </div>
                    ` : `
                        <button class="rpg-bag-collapsed" data-rpg-action="bag-toggle" data-force-open="true">
                            <span>🎒</span>
                            <b>Bấm để mở túi đồ</b>
                            <small>Xem vật phẩm lớn hơn, lọc nguyên liệu/trang bị và thao tác bán/tách.</small>
                        </button>
                    `}
                </div>
            </div>
        `;
    },

    renderRpgStatsPanel: (profile) => {
        const meta = LobbyNeon.getRpgStatMeta();
        const characterStats = LobbyNeon.getRpgCharacterStats(profile);
        const stats = profile.stats || characterStats?.legacyStats || {};
        const points = Number(profile.statPoints || 0);
        const power = characterStats?.combatPower || LobbyNeon.getRpgPower(profile);
        const effects = characterStats?.derived ? {
            damage: characterStats.derived.damage,
            defense: characterStats.derived.defense,
            crit: characterStats.derived.crit,
            dodge: characterStats.derived.dodge
        } : {
            damage: Math.round(Number(stats.str || 1) * 18 + Number(stats.int || 1) * 20),
            defense: Math.round(Number(stats.vit || 1) * 22 + Number(stats.agi || 1) * 8),
            crit: Math.min(65, Math.round(5 + Number(stats.agi || 1) * 1.2 + Number(stats.luck || 1) * .9)),
            dodge: Math.min(48, Math.round(3 + Number(stats.agi || 1) * .9))
        };
        return `
            <div class="rpg-mu-panel">
                <div class="rpg-mu-heading">
                    <span>📊 Chi So</span>
                    <span class="rpg-chip">Diem con: ${points}</span>
                </div>
                <div class="rpg-stat-grid">
                    ${Object.entries(meta).map(([key, cfg]) => `
                        <div class="rpg-stat-row">
                            <div class="rpg-stat-top">
                                <span>${cfg.icon} ${cfg.label}: ${Number(stats[key] || 1)}</span>
                                <button class="rpg-stat-add" ${points <= 0 ? 'disabled' : ''} onclick="LobbyNeon.addRpgStat('${key}')">+</button>
                            </div>
                            <div class="rpg-stat-desc">${cfg.desc}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="rpg-mu-stat-effects">
                    <div class="rpg-mu-effect-box">
                        <b>Hieu ung</b><br>
                        Sat thuong: ${effects.damage.toLocaleString('vi-VN')}<br>
                        Phong thu: ${effects.defense.toLocaleString('vi-VN')}<br>
                        Chi mang: ${effects.crit}%<br>
                        Ne tranh: ${effects.dodge}%
                    </div>
                    <div class="rpg-mu-effect-box">
                        <b>Thong tin</b><br>
                        Luc chien: ${power.toLocaleString('vi-VN')}<br>
                        Boss win: ${Number(profile.bossWins || 0)}<br>
                        Boss lose: ${Number(profile.bossLosses || 0)}<br>
                        The luc: ${profile.stamina}/100
                    </div>
                </div>
                <button class="rpg-action-btn" style="width:100%; margin-top:10px; background:linear-gradient(135deg,#b45309,#fbbf24); color:#111827;" ${points <= 0 ? 'disabled' : ''} onclick="LobbyNeon.autoAddRpgStats()">Tu Cong Diem Theo Mon Phai</button>
            </div>
        `;
    },

    renderRpgAutoSettingsPanel: (profile) => {
        const settings = profile.autoSettings || {};
        const rarityOptions = Object.values(LobbyNeon.rpgEquipmentRarities)
            .filter(meta => meta.normal)
            .map(meta => `<option value="${meta.id}" ${settings.lootMinRarity === meta.id ? 'selected' : ''}>${LobbyNeon.escapeHtml(meta.name)}</option>`)
            .join('');
        const sellOptions = [
            `<option value="none" ${settings.autoSellMaxRarity === 'none' ? 'selected' : ''}>Khong tu ban</option>`,
            ...Object.values(LobbyNeon.rpgEquipmentRarities)
                .filter(meta => meta.normal)
                .map(meta => `<option value="${meta.id}" ${settings.autoSellMaxRarity === meta.id ? 'selected' : ''}>Ban <= ${LobbyNeon.escapeHtml(meta.name)}</option>`)
        ].join('');
        return `
            <div class="rpg-mu-panel">
                <div class="rpg-mu-heading">
                    <span>Auto farm settings</span>
                    <span class="rpg-chip">${settings.rotateSkins === false ? '1 skin' : 'xoay skin'}</span>
                </div>
                <div class="rpg-stat-grid">
                    <div class="rpg-stat-row">
                        <div class="rpg-stat-top"><span>Loc nhat do</span></div>
                        <select class="rpg-mini-select" onchange="LobbyNeon.setRpgLootMinRarity(this.value)">${rarityOptions}</select>
                    </div>
                    <div class="rpg-stat-row">
                        <div class="rpg-stat-top"><span>Tu dong ban</span></div>
                        <select class="rpg-mini-select" onchange="LobbyNeon.setRpgAutoSellMaxRarity(this.value)">${sellOptions}</select>
                    </div>
                </div>
                <button class="rpg-action-btn" style="width:100%; margin-top:10px;" data-rpg-action="toggle-auto-skins">
                    ${settings.rotateSkins === false ? 'Bat auto xoay skin' : 'Tat auto xoay skin'}
                </button>
                <div class="rpg-muted" style="margin-top:8px;">Quai thuong chi roi trang/xanh lam/vang/xanh luc. Cam, hong, do chi roi tu Boss Arena.</div>
            </div>
        `;
    },

    renderRpgBossPanel: (profile) => {
        const zone = LobbyNeon.rpgZones[LobbyNeon.state.selectedRpgZone] || LobbyNeon.rpgZones.secret_realm;
        const level = Auth.currentUser?.level || 1;
        const cost = LobbyNeon.getRpgBossCost(zone);
        const locked = level < zone.minLevel;
        const chance = Math.round(LobbyNeon.getRpgBossWinChance(profile, zone) * 100);
        const bossPower = LobbyNeon.getRpgBossPower(zone);
        const playerPower = LobbyNeon.getRpgPower(profile);
        const bossHpPct = Math.max(56, Math.min(100, 58 + Number(zone.rewardPoints || 1) * 8));
        const shardByZone = {
            training_forest: 'thunderShard',
            ghost_cave: 'moonShard',
            secret_realm: 'fireShard',
            molten_keep: 'fireShard',
            frost_peak: 'thunderShard',
            abyss_gate: 'moonShard'
        };
        const rewards = [
            LobbyNeon.getRpgItemMeta(zone.material),
            LobbyNeon.getRpgItemMeta('goldDust'),
            LobbyNeon.getRpgItemMeta('bossCore'),
            LobbyNeon.getRpgItemMeta(shardByZone[zone.id] || 'thunderShard'),
            LobbyNeon.getRpgItemMeta('daCuongHoa'),
            LobbyNeon.getRpgItemMeta('linhThach')
        ];
        const battle = LobbyNeon.state.rpgBossBattle?.zoneId === zone.id ? LobbyNeon.state.rpgBossBattle : null;
        const resultHtml = battle ? `
            <div class="rpg-arena-result ${battle.won ? 'win' : 'lose'}">
                <div>
                    <b>${battle.won ? 'THẮNG BOSS' : 'BỊ ĐÁNH LUI'}</b>
                    <span>${new Date(battle.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} · Tỉ lệ lúc đánh ${battle.chance}% · tốn ${battle.cost} thể lực</span>
                </div>
                <small>${battle.won ? `+${battle.reward.exp} EXP · ` : ''}${LobbyNeon.formatRpgReward(battle.reward)}</small>
            </div>
        ` : `
            <div class="rpg-arena-result idle">
                <div>
                    <b>Sẵn sàng khiêu chiến</b>
                    <span>Boss có thể thắng bạn nếu lực chiến/chỉ số còn yếu. Thắng sẽ rơi tài nguyên nhiều hơn và có tỉ lệ đồ hiếm.</span>
                </div>
            </div>
        `;
        const reason = !profile.classChosen
            ? 'Chọn môn phái trước'
            : locked
                ? `Cần Lv.${zone.minLevel}`
                : profile.stamina < cost
                    ? `Thiếu ${cost - profile.stamina} thể lực`
                    : `${chance}% thắng`;
        return `
            <div class="rpg-mu-panel rpg-arena-panel ${battle ? (battle.won ? 'arena-win' : 'arena-lose') : ''}">
                <div class="rpg-mu-heading">
                    <span>⚔️ Boss Arena</span>
                    <span class="rpg-chip">${reason}</span>
                </div>
                <div class="rpg-arena-stage">
                    <div class="rpg-arena-fighter player">
                        <div class="rpg-arena-avatar"><div class="rpg-player-sprite">${LobbyNeon.getRpgPlayerBattleSvg()}</div></div>
                        <b>Nhân vật</b>
                        <span>LC ${playerPower.toLocaleString('vi-VN')}</span>
                    </div>
                    <div class="rpg-arena-vs">
                        <span>VS</span>
                        ${battle ? `<i class="rpg-arena-strike">${battle.won ? 'CRIT' : 'HIT'}</i>` : ''}
                    </div>
                    <div class="rpg-arena-fighter boss">
                        <div class="rpg-arena-avatar boss-art">${LobbyNeon.getRpgMonsterSvg(zone.id)}</div>
                        <b>${LobbyNeon.escapeHtml(zone.monster)}</b>
                        <span>LC ${bossPower.toLocaleString('vi-VN')}</span>
                    </div>
                </div>
                <div class="rpg-arena-bars">
                    <div class="rpg-mu-bar hp"><span style="width:${locked ? 100 : bossHpPct}%;"></span><b>HP BOSS ${locked ? 'LOCK' : bossHpPct + '%'}</b></div>
                    <div class="rpg-mu-bar mp"><span style="width:${Math.min(100, profile.stamina)}%;"></span><b>THỂ LỰC ${profile.stamina}/100 · Tốn ${cost}</b></div>
                </div>
                <div class="rpg-mu-boss-rewards">
                    ${rewards.map(item => `<div class="rpg-mu-reward" style="--item-color:${item.color};" title="${LobbyNeon.escapeHtml(item.name)}">${item.icon}</div>`).join('')}
                </div>
                ${resultHtml}
                <button class="rpg-action-btn" style="width:100%; margin-top:10px; background:linear-gradient(135deg,#b45309,#f59e0b,#fbbf24); color:#111827;" data-rpg-action="boss-challenge" data-rpg-value="${zone.id}">
                    Khiêu chiến Boss Arena
                </button>
            </div>
        `;
    },

    renderRpgUnlockPanel: () => {
        const level = Auth.currentUser?.level || 1;
        const unlocks = [
            { level: 1, icon: '⚔️', title: 'Auto farm + skill cơ bản', desc: 'Bắt đầu treo quái và chọn môn phái.' },
            { level: 3, icon: '👻', title: 'Hang Bug Ma', desc: 'Quái mạnh hơn, rơi Đá cường hóa.' },
            { level: 4, icon: '🌊', title: 'Skill lan rộng', desc: 'Mỗi phái mở chiêu đánh nhiều mục tiêu.' },
            { level: 6, icon: '🐉', title: 'Boss KPI', desc: 'Boss khó hơn, dùng thể lực, rơi tài nguyên nhiều.' },
            { level: 10, icon: '🌋', title: 'Lò Lửa Deadline', desc: 'Map cấp cao, loot Hỏa Long tốt hơn.' },
            { level: 15, icon: '🏔️', title: 'Đỉnh Băng Bug', desc: 'Quái rất trâu, thưởng EXP lớn hơn.' },
            { level: 22, icon: '🕳️', title: 'Cổng Vực Sâu', desc: 'Bãi cuối hiện tại, boss cực mạnh.' }
        ];
        return `
            <div class="rpg-mu-panel">
                <div class="rpg-mu-heading">
                    <span>🧭 Mở khóa theo cấp</span>
                    <span class="rpg-chip">Lv.${level}</span>
                </div>
                <div class="rpg-unlock-grid">
                    ${unlocks.map(item => {
                        const done = level >= item.level;
                        return `
                            <div class="rpg-unlock-row ${done ? 'done' : 'locked'}">
                                <span>${item.icon}</span>
                                <div>
                                    <b>Lv.${item.level} · ${LobbyNeon.escapeHtml(item.title)}</b>
                                    <small>${LobbyNeon.escapeHtml(item.desc)}</small>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    },

    renderRpgQuickSkinButtons: (profile) => {
        return `
            <div class="rpg-quick-skins">
                ${LobbyNeon.getRpgVisibleSkins(profile).map(skin => {
                    const unlocked = LobbyNeon.isRpgSkinUnlocked(profile, skin);
                    const shardCount = skin.shard ? Number(profile.inventory[skin.shard] || 0) : 0;
                    const canUnlock = !unlocked && skin.shard && shardCount >= skin.unlockNeed;
                    const label = unlocked
                        ? (profile.equippedSkin === skin.id ? 'Đang dùng' : 'Bấm dùng')
                        : (skin.classId ? `Lv.${skin.unlockLevel}` : `${shardCount}/${skin.unlockNeed || 0}`);
                    const cooldown = (LobbyNeon.getRpgSkinCooldown(skin) / 1000).toFixed(1).replace('.0', '');
                    const areaText = LobbyNeon.getRpgSkinAreaText(skin);
                    return `
                        <button class="rpg-skin-orb ${profile.equippedSkin === skin.id ? 'active' : ''} ${!unlocked && !canUnlock ? 'locked' : ''}"
                            style="--skin-color:${skin.color};"
                            data-rpg-skin-id="${skin.id}"
                            data-rpg-action="quick-skin"
                            data-rpg-value="${skin.id}"
                            title="${LobbyNeon.escapeHtml(skin.name)}"
                            type="button">
                            <span class="rpg-skin-orb-icon">${skin.icon}</span>
                            <span class="rpg-skin-orb-name">${LobbyNeon.escapeHtml(skin.name)}</span>
                            <span class="rpg-skin-orb-tag">${label} · ${areaText} · ${cooldown}s</span>
                            <span class="rpg-skin-cooldown"></span>
                        </button>
                    `;
                }).join('')}
            </div>
        `;
    },

    renderRpgSkinUpgradePanel: (profile) => {
        const unlockedSkins = LobbyNeon.getRpgVisibleSkins(profile).filter(skin => LobbyNeon.isRpgSkinUnlocked(profile, skin));
        return `
            <div class="rpg-mu-panel">
                <div class="rpg-mu-heading">
                    <span>Nang cap skin</span>
                    <span class="rpg-chip">${Number(profile.inventory?.daCuongHoa || 0)} da</span>
                </div>
                <div class="rpg-unlock-grid">
                    ${unlockedSkins.map(skin => {
                        const level = Math.max(1, Number(profile.skinLevels?.[skin.id] || 1));
                        const maxed = level >= 10;
                        const stoneCost = level * 2 + (skin.vip ? 2 : 0);
                        const shardCost = skin.shard ? Math.max(1, Math.ceil(level / 2)) : 0;
                        const shardHave = skin.shard ? Number(profile.inventory?.[skin.shard] || 0) : 0;
                        const enough = !maxed && Number(profile.inventory?.daCuongHoa || 0) >= stoneCost && (!skin.shard || shardHave >= shardCost);
                        return `
                            <div class="rpg-unlock-row done">
                                <span style="color:${skin.color};">${skin.icon}</span>
                                <div>
                                    <b>${LobbyNeon.escapeHtml(skin.name)} · Lv.${level}</b>
                                    <small>${maxed ? 'Da toi da' : `Cost: ${stoneCost} da${skin.shard ? ` · ${shardCost}/${shardHave} manh` : ''} · Sat thuong +${(level - 1) * 8}`}</small>
                                </div>
                                <button class="rpg-stat-add" ${enough ? '' : 'disabled'} data-rpg-action="skin-upgrade" data-rpg-value="${skin.id}">+</button>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    },

    renderRpgSkillWheel: async () => {
        const wheel = document.getElementById('rpg-skill-wheel');
        if (!wheel) return;
        let profile;
        try {
            ({ profile } = await LobbyNeon.getMyRpgProfile());
        } catch (e) {
            console.warn('render rpg skill wheel error:', e);
            wheel.innerHTML = '';
            return;
        }
        const skins = LobbyNeon.getRpgVisibleSkins(profile).slice(0, 4);
        wheel.innerHTML = `
            <button class="rpg-wheel-btn ${LobbyNeon.state.rpgAutoFarm ? 'auto-on' : ''}" style="--wheel-color:#22c55e;" onclick="LobbyNeon.toggleRpgAutoFarm()" title="Auto treo quái">
                <span class="rpg-wheel-icon">⏱</span>
                <span class="rpg-wheel-label">${LobbyNeon.state.rpgAutoFarm ? 'AUTO ON' : 'AUTO OFF'}</span>
            </button>
            ${skins.map(skin => {
                const unlocked = LobbyNeon.isRpgSkinUnlocked(profile, skin);
                return `
                    <button class="rpg-wheel-btn ${profile.equippedSkin === skin.id ? 'active' : ''} ${unlocked ? '' : 'locked'}"
                        style="--wheel-color:${skin.color};"
                        data-rpg-skin-id="${skin.id}"
                        data-rpg-action="quick-skin"
                        data-rpg-value="${skin.id}"
                        title="${LobbyNeon.escapeHtml(skin.name)}">
                        <span class="rpg-wheel-icon">${skin.icon}</span>
                        <span class="rpg-wheel-label">${unlocked ? LobbyNeon.escapeHtml(skin.name) : `Khóa ${skin.unlockLevel ? 'Lv.' + skin.unlockLevel : 'VIP'}`}</span>
                        <span class="rpg-skin-cooldown"></span>
                    </button>
                `;
            }).join('')}
            <button class="rpg-wheel-btn" style="--wheel-color:#38bdf8;" onclick="LobbyNeon.openRpgHub()" title="Mở túi đồ / trang bị">
                <span class="rpg-wheel-icon">🎒</span>
                <span class="rpg-wheel-label">Túi đồ</span>
            </button>
        `;
        LobbyNeon.updateRpgSkillCooldownBadges();
    },

    quickEquipAndCastRpgSkin: async (skinId) => {
        const skin = LobbyNeon.rpgSkins[skinId];
        if (!skin) return;
        const { data, profile } = await LobbyNeon.getMyRpgProfile();
        if (skin.classId && skin.classId !== profile.classId) {
            Utils.showToast('Skill này thuộc môn phái khác.', 'warning');
            return;
        }
        const unlocked = LobbyNeon.isRpgSkinUnlocked(profile, skin);
        let changed = false;
        if (!unlocked) {
            const shardCount = skin.shard ? Number(profile.inventory[skin.shard] || 0) : 0;
            if (skin.shard && shardCount >= skin.unlockNeed) {
                profile.inventory[skin.shard] = shardCount - skin.unlockNeed;
                profile.unlockedSkins = Array.from(new Set([...(profile.unlockedSkins || []), skinId]));
                profile.skinLevels[skinId] = Math.max(1, Number(profile.skinLevels?.[skinId] || 1));
                changed = true;
                Utils.showToast(`Đã mở khóa skin VIP ${skin.name}.`, 'success');
            } else {
                if (skin.classId) {
                    Utils.showToast(`${skin.name} mở ở cấp ${skin.unlockLevel}.`, 'warning');
                } else {
                    Utils.showToast(`Chưa đủ mảnh để dùng ${skin.name}.`, 'warning');
                }
                LobbyNeon.openRpgHub();
                return;
            }
        }
        if (profile.equippedSkin !== skinId || changed) {
            profile.equippedSkin = skinId;
            profile.skinLevels[skinId] = Math.max(1, Number(profile.skinLevels?.[skinId] || 1));
            await LobbyNeon.saveMyRpgProfile(profile, data);
            if (LobbyNeon.state.activeHubTab === 'rpg') LobbyNeon.renderRpgPanel();
            await LobbyNeon.renderRpgSkillWheel();
        }
        await LobbyNeon.castRpgSkill();
    },

    getRpgSafeId: (username) => {
        const keyFn = Auth.usernameKey || ((value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, ''));
        return keyFn(username) || 'player';
    },

    hashRpgText: (text) => {
        return String(text || '').split('').reduce((sum, ch) => ((sum << 5) - sum + ch.charCodeAt(0)) >>> 0, 0);
    },

    getRpgCombatSpot: (username, fallbackIndex = 0) => {
        const map = document.getElementById('lobby-map');
        const w = map?.offsetWidth || 1400;
        const h = map?.offsetHeight || 760;
        const baseX = Math.min(w - 230, Math.max(430, w * 0.46));
        const baseY = Math.min(h - 145, Math.max(330, h * 0.58));
        const slots = [
            { dx: 0, dy: 0 },
            { dx: 170, dy: 28 },
            { dx: -165, dy: 42 },
            { dx: 85, dy: -118 },
            { dx: -220, dy: -86 },
            { dx: 250, dy: -80 },
            { dx: -40, dy: 118 },
            { dx: 310, dy: 82 }
        ];
        const index = (LobbyNeon.hashRpgText(username) + fallbackIndex) % slots.length;
        const slot = slots[index];
        const monsterX = Math.round(Math.min(w - 120, Math.max(180, baseX + slot.dx)));
        const monsterY = Math.round(Math.min(h - 105, Math.max(210, baseY + slot.dy)));
        return {
            monsterX,
            monsterY,
            playerX: Math.round(Math.max(110, monsterX - 112)),
            playerY: Math.round(monsterY + 8)
        };
    },

    isRpgUserOnline: (username) => {
        if (!username) return false;
        const me = LobbyNeon.getRpgUsername();
        const keyFn = Auth.usernameKey || ((value) => String(value || '').toLowerCase());
        if (keyFn(username) === keyFn(me)) return true;
        const users = LobbyNeon.state.users || {};
        const entry = Object.entries(users).find(([name]) => keyFn(name) === keyFn(username));
        if (!entry) return false;
        const data = entry[1] || {};
        if (data.lastSeen && data.lastSeen.toDate) {
            return Date.now() - data.lastSeen.toDate().getTime() <= 90000;
        }
        return true;
    },

    startRpgWorldLoop: () => {
        if (LobbyNeon.state.rpgWorldInterval) clearInterval(LobbyNeon.state.rpgWorldInterval);
        LobbyNeon.renderRpgWorldCombatants();
        LobbyNeon.state.rpgWorldInterval = setInterval(() => {
            LobbyNeon.renderRpgWorldCombatants();
        }, 5000);
    },

    renderRpgWorldCombatants: async () => {
        const map = document.getElementById('lobby-map');
        if (!map) return;

        let data;
        try {
            data = await LobbyNeon.loadRpgData();
        } catch (e) {
            console.warn('renderRpgWorldCombatants load error:', e);
            return;
        }

        const profiles = Object.values(data.users || {})
            .filter(profile => profile && profile.activeHunt && LobbyNeon.isRpgUserOnline(profile.username));

        const activeIds = new Set();
        const activeUsers = new Set();
        profiles.forEach((profile, index) => {
            const username = profile.username;
            const safeId = LobbyNeon.getRpgSafeId(username);
            const elId = `rpg-world-monster-${safeId}`;
            activeIds.add(elId);
            activeUsers.add(LobbyNeon.getRpgSafeId(username));

            const zone = LobbyNeon.rpgZones[profile.activeHunt.zoneId] || LobbyNeon.rpgZones.training_forest;
            const spot = profile.activeHunt.combatSpot || LobbyNeon.getRpgCombatSpot(username, index);
            LobbyNeon.renderRpgWorldMonster(elId, profile, zone, spot);

            const keyFn = Auth.usernameKey || ((value) => String(value || '').toLowerCase());
            const isMe = keyFn(username) === keyFn(Auth.currentUser?.username);
            const huntDone = Date.now() >= profile.activeHunt.endsAt;
            if (isMe && !huntDone) {
                const dx = (LobbyNeon.state.myPos?.x || 0) - spot.playerX;
                const dy = (LobbyNeon.state.myPos?.y || 0) - spot.playerY;
                if (Math.sqrt(dx * dx + dy * dy) > 45) {
                    LobbyNeon.moveTo(spot.playerX, spot.playerY).catch(e => console.warn('rpg combat auto move error:', e));
                }
            }

            const userEl = document.getElementById(`user-${username}`);
            if (userEl) {
                userEl.classList.add('rpg-world-fighting');
                const statusEl = userEl.querySelector('.lobby-user-status');
                if (statusEl) statusEl.textContent = `⚔️ ĐÁNH ${zone.monster.toUpperCase()}`;
            }
        });

        document.querySelectorAll('.rpg-world-monster').forEach(el => {
            if (!activeIds.has(el.id)) el.remove();
        });
        document.querySelectorAll('.lobby-user-wrapper.rpg-world-fighting').forEach(el => {
            const username = el.id.replace(/^user-/, '');
            if (!activeUsers.has(LobbyNeon.getRpgSafeId(username))) {
                el.classList.remove('rpg-world-fighting');
                const statusEl = el.querySelector('.lobby-user-status');
                if (statusEl && statusEl.textContent.includes('ĐÁNH')) {
                    statusEl.textContent = username === Auth.currentUser?.username ? '🏷️ ĐỔI DANH HIỆU' : '⚔️ THÁCH ĐẤU';
                }
            }
        });
    },

    renderRpgWorldMonster: (elId, profile, zone, spot) => {
        const map = document.getElementById('lobby-map');
        if (!map || !profile?.activeHunt) return;

        let el = document.getElementById(elId);
        if (!el) {
            el = document.createElement('div');
            el.id = elId;
            el.className = 'rpg-world-monster';
            map.appendChild(el);
        }

        const hunt = profile.activeHunt;
        const now = Date.now();
        const progress = Math.min(100, Math.max(0, ((now - hunt.startedAt) / (hunt.endsAt - hunt.startedAt)) * 100));
        const isDone = now >= hunt.endsAt;
        const hp = isDone ? 0 : Math.max(3, Math.round(100 - progress));
        const skin = LobbyNeon.rpgSkins[profile.equippedSkin] || LobbyNeon.rpgSkins.basic;
        const visualClass = LobbyNeon.getRpgSkillVisualClass(skin);
        const damage = Math.max(18, Math.round((hunt.reward?.exp || 80) / 7));
        const lootText = isDone ? '🎁 💎 ✨' : '';

        el.className = `rpg-world-monster ${isDone ? 'defeated' : ''}`;
        el.style.left = `${spot.monsterX}px`;
        el.style.top = `${spot.monsterY}px`;
        el.style.setProperty('--zone-color', zone.color || '#22d3ee');
        el.style.setProperty('--skin-color', skin.color || '#38bdf8');
        el.innerHTML = `
            <div class="rpg-world-name">${zone.icon} ${LobbyNeon.escapeHtml(zone.monster)}</div>
            <div class="rpg-world-hp"><span style="width:${hp}%;"></span></div>
            <div class="rpg-world-body">${LobbyNeon.getRpgMonsterSvg(zone.id, isDone)}</div>
            ${isDone ? `<div class="rpg-world-loot">${lootText}</div>` : `
                <div class="rpg-world-skill ${visualClass}"></div>
                <div class="rpg-world-hit"></div>
                <div class="rpg-world-damage">-${damage}</div>
            `}
        `;
    },

    getRpgUnlockedZones: () => {
        const level = Auth.currentUser?.level || 1;
        return Object.values(LobbyNeon.rpgZones).filter(zone => level >= zone.minLevel);
    },

    getRpgAutoSpawnZone: () => {
        const unlocked = LobbyNeon.getRpgUnlockedZones().sort((a, b) => a.minLevel - b.minLevel);
        const selected = LobbyNeon.rpgZones[LobbyNeon.state.selectedRpgZone];
        if (LobbyNeon.state.rpgZoneManuallySelected && selected && unlocked.some(zone => zone.id === selected.id)) return selected;
        const pool = unlocked.slice(-3);
        if (!pool.length) return LobbyNeon.rpgZones.training_forest;
        const totalWeight = pool.reduce((sum, zone) => sum + Number(zone.rewardPoints || 1), 0);
        let roll = Math.random() * totalWeight;
        for (const zone of pool) {
            roll -= Number(zone.rewardPoints || 1);
            if (roll <= 0) return zone;
        }
        return pool[pool.length - 1];
    },

    getRpgRandomFarmPoint: (nearPlayer = false) => {
        const map = document.getElementById('lobby-map');
        const w = map?.offsetWidth || 1400;
        const h = map?.offsetHeight || 760;
        const base = nearPlayer && LobbyNeon.state.myPos
            ? LobbyNeon.state.myPos
            : { x: Math.max(360, w * 0.45), y: Math.max(300, h * 0.57) };
        const spreadX = nearPlayer ? 260 : Math.max(360, w * 0.36);
        const spreadY = nearPlayer ? 190 : Math.max(220, h * 0.26);
        const x = base.x + (Math.random() - 0.5) * spreadX;
        const y = base.y + (Math.random() - 0.5) * spreadY;
        return {
            x: Math.round(Math.min(w - 150, Math.max(190, x))),
            y: Math.round(Math.min(h - 115, Math.max(230, y)))
        };
    },

    spawnRpgWildMonster: (zoneId = null, nearPlayer = false) => {
        const zones = LobbyNeon.getRpgUnlockedZones();
        if (!zones.length) return null;
        const zone = LobbyNeon.rpgZones[zoneId] || LobbyNeon.getRpgAutoSpawnZone() || LobbyNeon.rpgZones.training_forest;
        if (zoneId && !zones.some(unlocked => unlocked.id === zone.id)) {
            Utils.showToast(`Bãi ${zone.name} cần cấp ${zone.minLevel}.`, 'warning');
            return null;
        }
        const point = LobbyNeon.getRpgRandomFarmPoint(nearPlayer);
        const id = `wild_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const hp = 85 + zone.rewardPoints * 35 + Math.floor(Math.random() * 35);
        const monster = {
            id,
            zoneId: zone.id,
            x: point.x,
            y: point.y,
            targetX: point.x,
            targetY: point.y,
            hp,
            maxHp: hp,
            nextMoveAt: Date.now() + 600 + Math.random() * 1200,
            lastDamage: 0,
            lastHitAt: 0,
            defeated: false,
            claimed: false
        };
        LobbyNeon.state.rpgWildMonsters[id] = monster;
        LobbyNeon.state.rpgLastWildSpawnAt = Date.now();
        LobbyNeon.renderRpgWildMonster(monster);
        LobbyNeon.updateRpgFarmHud();
        return monster;
    },

    startRpgWildMonsters: () => {
        if (LobbyNeon.state.rpgWildInterval) clearInterval(LobbyNeon.state.rpgWildInterval);
        if (LobbyNeon.state.rpgHudInterval) clearInterval(LobbyNeon.state.rpgHudInterval);
        const targetCount = Number(LobbyNeon.state.rpgMaxWildMonsters || 4);
        for (let i = Object.keys(LobbyNeon.state.rpgWildMonsters).length; i < targetCount; i++) {
            LobbyNeon.spawnRpgWildMonster(null, false);
        }
        LobbyNeon.state.rpgWildInterval = setInterval(() => LobbyNeon.tickRpgWildMonsters(), 950);
        LobbyNeon.state.rpgHudInterval = setInterval(() => LobbyNeon.updateRpgFarmHud(), 700);
        LobbyNeon.renderRpgSkillWheel();
    },

    tickRpgWildMonsters: () => {
        const monsters = LobbyNeon.state.rpgWildMonsters || {};
        const livingCount = Object.values(monsters).filter(monster => monster && !monster.defeated).length;
        const now = Date.now();
        const targetCount = Number(LobbyNeon.state.rpgMaxWildMonsters || 4);
        if (livingCount < targetCount && now - Number(LobbyNeon.state.rpgLastWildSpawnAt || 0) > 1800) {
            LobbyNeon.spawnRpgWildMonster(null, false);
        }

        Object.values(monsters).forEach(monster => {
            if (!monster || monster.defeated) return;
            const zone = LobbyNeon.rpgZones[monster.zoneId] || LobbyNeon.rpgZones.training_forest;
            if (now >= monster.nextMoveAt) {
                const next = LobbyNeon.getRpgRandomFarmPoint(false);
                monster.targetX = next.x;
                monster.targetY = next.y;
                monster.nextMoveAt = now + 1400 + Math.random() * 2400;
            }
            const dx = monster.targetX - monster.x;
            const dy = monster.targetY - monster.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const speed = 14 + zone.rewardPoints * 4;
            if (dist > 4) {
                monster.x += dx / dist * Math.min(speed, dist);
                monster.y += dy / dist * Math.min(speed, dist);
            }
            LobbyNeon.renderRpgWildMonster(monster);
        });
        LobbyNeon.updateRpgFarmHud();
    },

    renderRpgWildMonster: (monster) => {
        const map = document.getElementById('lobby-map');
        if (!map || !monster) return;
        const zone = LobbyNeon.rpgZones[monster.zoneId] || LobbyNeon.rpgZones.training_forest;
        let el = document.getElementById(`rpg-wild-${monster.id}`);
        if (!el) {
            el = document.createElement('div');
            el.id = `rpg-wild-${monster.id}`;
            el.addEventListener('mousedown', (e) => e.stopPropagation());
            el.onclick = (e) => {
                e.stopPropagation();
                LobbyNeon.targetRpgMonster(monster.id);
            };
            map.appendChild(el);
        }
        const isTargeted = LobbyNeon.state.selectedWildMonsterId === monster.id;
        const hpPct = Math.max(0, Math.round((monster.hp / monster.maxHp) * 100));
        const hitRecent = Date.now() - (monster.lastHitAt || 0) < 700;
        el.className = `rpg-wild-monster ${monster.defeated ? 'defeated' : ''} ${isTargeted ? 'is-targeted' : ''}`;
        el.style.left = `${Math.round(monster.x)}px`;
        el.style.top = `${Math.round(monster.y)}px`;
        el.style.setProperty('--zone-color', zone.color || '#22d3ee');
        const renderKey = `${monster.defeated ? 1 : 0}|${isTargeted ? 1 : 0}|${hpPct}|${hitRecent ? Number(monster.lastHitAt || 0) : 0}`;
        if (el.dataset.renderKey !== renderKey) {
            el.dataset.renderKey = renderKey;
            el.innerHTML = `
                <div class="rpg-world-name">${isTargeted ? '🎯 ' : ''}${zone.icon} ${LobbyNeon.escapeHtml(zone.monster)}</div>
                <div class="rpg-world-hp"><span style="width:${hpPct}%;"></span></div>
                <div class="rpg-world-body">${LobbyNeon.getRpgMonsterSvg(zone.id, monster.defeated)}</div>
                ${hitRecent ? `<div class="rpg-world-hit"></div><div class="rpg-world-damage">-${monster.lastDamage || 0}</div>` : ''}
                ${monster.defeated ? '<div class="rpg-world-loot">🎁 💎 ✨</div>' : ''}
            `;
        } else {
            const hpBar = el.querySelector('.rpg-world-hp span');
            if (hpBar) hpBar.style.width = `${hpPct}%`;
        }
    },

    targetRpgMonster: (monsterId) => {
        const monster = LobbyNeon.state.rpgWildMonsters?.[monsterId];
        if (!monster || monster.defeated) return;
        LobbyNeon.state.selectedWildMonsterId = monsterId;
        LobbyNeon.renderRpgWildMonster(monster);
        LobbyNeon.updateRpgFarmHud();
    },

    findNearestRpgWildMonster: (maxRange = Infinity) => {
        const pos = LobbyNeon.state.myPos || { x: 0, y: 0 };
        let best = null;
        Object.values(LobbyNeon.state.rpgWildMonsters || {}).forEach(monster => {
            if (!monster || monster.defeated) return;
            const dx = monster.x - pos.x;
            const dy = monster.y - pos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= maxRange && (!best || dist < best.dist)) {
                best = { monster, dist };
            }
        });
        return best;
    },

    updateRpgFarmHud: () => {
        const hint = document.getElementById('rpg-target-hint');
        const btn = document.getElementById('rpg-skill-button');
        const autoBtn = document.getElementById('rpg-auto-button');
        if (!hint || !btn) return;
        const now = Date.now();
        const cooldownMs = Math.max(0, LobbyNeon.state.rpgSkillCooldownUntil - now);
        const selected = LobbyNeon.state.rpgWildMonsters?.[LobbyNeon.state.selectedWildMonsterId];
        const nearest = selected && !selected.defeated
            ? { monster: selected, dist: Math.sqrt(Math.pow(selected.x - LobbyNeon.state.myPos.x, 2) + Math.pow(selected.y - LobbyNeon.state.myPos.y, 2)) }
            : LobbyNeon.findNearestRpgWildMonster(9999);
        btn.classList.toggle('cooldown', cooldownMs > 0);
        btn.querySelector('strong').textContent = cooldownMs > 0 ? `${Math.ceil(cooldownMs / 1000)}s` : 'SKILL';
        if (autoBtn) {
            autoBtn.classList.toggle('active', Boolean(LobbyNeon.state.rpgAutoFarm));
            const strong = autoBtn.querySelector('strong');
            if (strong) strong.textContent = LobbyNeon.state.rpgAutoFarm ? 'ON' : 'AUTO';
        }
        const wheelAuto = document.querySelector('#rpg-skill-wheel .rpg-wheel-btn');
        if (wheelAuto) wheelAuto.classList.toggle('auto-on', Boolean(LobbyNeon.state.rpgAutoFarm));
        LobbyNeon.updateRpgSkillCooldownBadges();
        if (!nearest) {
            hint.textContent = 'Chưa thấy quái. Hệ thống đang sinh quái tự động...';
            return;
        }
        const zone = LobbyNeon.rpgZones[nearest.monster.zoneId] || LobbyNeon.rpgZones.training_forest;
        if (LobbyNeon.state.rpgAutoFarm) {
            hint.textContent = nearest.dist <= 175
                ? `AUTO đang đánh: ${zone.monster}`
                : `AUTO đang áp sát ${zone.monster} (${Math.round(nearest.dist)}px)`;
            return;
        }
        hint.textContent = nearest.dist <= 175
            ? `Trong tầm: ${zone.monster} · bấm SKILL để đánh`
            : `Cách ${Math.round(nearest.dist)}px: bấm SKILL để chạy tới gần`;
        LobbyNeon.updateRpgSkillCooldownBadges();
    },

    updateRpgSkillCooldownBadges: () => {
        const now = Date.now();
        const lastCast = LobbyNeon.state.rpgLastSkillCast;
        const remaining = Math.max(0, (LobbyNeon.state.rpgSkillCooldownUntil || 0) - now);
        document.querySelectorAll('[data-rpg-skin-id]').forEach(el => {
            const label = el.querySelector('.rpg-skin-cooldown');
            const isActive = lastCast?.skinId && el.dataset.rpgSkinId === lastCast.skinId && remaining > 0;
            el.classList.toggle('cooling', Boolean(isActive));
            if (label) {
                label.textContent = isActive ? `${Math.ceil(remaining / 1000)}s` : '';
                const pct = isActive ? Math.max(0, Math.min(100, (remaining / Math.max(1, lastCast.cooldownMs || 1200)) * 100)) : 0;
                label.style.setProperty('--cooldown-pct', `${pct}%`);
            }
        });
    },

    startRpgAutoFarm: () => {
        if (LobbyNeon.state.rpgAutoFarmInterval) clearInterval(LobbyNeon.state.rpgAutoFarmInterval);
        LobbyNeon.state.rpgAutoFarmInterval = setInterval(async () => {
            if (!LobbyNeon.state.rpgAutoFarm || LobbyNeon.state.rpgAutoFarmBusy) return;
            LobbyNeon.state.rpgAutoFarmBusy = true;
            try {
                await LobbyNeon.castRpgSkill({ auto: true, silent: true });
            } catch (e) {
                console.warn('rpg auto farm error:', e);
            } finally {
                LobbyNeon.state.rpgAutoFarmBusy = false;
            }
        }, 1450);
    },

    stopRpgAutoFarm: () => {
        if (LobbyNeon.state.rpgAutoFarmInterval) {
            clearInterval(LobbyNeon.state.rpgAutoFarmInterval);
            LobbyNeon.state.rpgAutoFarmInterval = null;
        }
        LobbyNeon.state.rpgAutoFarm = false;
        LobbyNeon.state.rpgAutoFarmBusy = false;
        LobbyNeon.updateRpgFarmHud();
        LobbyNeon.renderRpgSkillWheel();
    },

    toggleRpgAutoFarm: async () => {
        if (LobbyNeon.state.rpgAutoFarm) {
            LobbyNeon.stopRpgAutoFarm();
            Utils.showToast('Đã tắt auto treo quái.', 'info');
            return;
        }
        const { profile } = await LobbyNeon.getMyRpgProfile();
        if (!profile.classChosen) {
            Utils.showToast('Chọn môn phái chính thức trước khi bật auto treo quái.', 'warning');
            LobbyNeon.openRpgHub();
            return;
        }
        LobbyNeon.state.rpgAutoFarm = true;
        LobbyNeon.startRpgAutoFarm();
        LobbyNeon.updateRpgFarmHud();
        await LobbyNeon.renderRpgSkillWheel();
        Utils.showToast('Đã bật auto treo quái. Chibi sẽ tự áp sát và dùng chưởng.', 'success');
        if (!LobbyNeon.state.rpgAutoFarmBusy) {
            LobbyNeon.state.rpgAutoFarmBusy = true;
            try {
                await LobbyNeon.castRpgSkill({ auto: true, silent: true });
            } finally {
                LobbyNeon.state.rpgAutoFarmBusy = false;
            }
        }
    },

    getRpgAutoSkin: (profile, target) => {
        const current = LobbyNeon.rpgSkins[profile.equippedSkin] || LobbyNeon.rpgSkins.basic;
        if (!profile?.autoSettings || profile.autoSettings.rotateSkins === false) return current;
        const skins = LobbyNeon.getRpgVisibleSkins(profile)
            .filter(skin => LobbyNeon.isRpgSkinUnlocked(profile, skin))
            .filter(skin => !skin.classId || skin.classId === profile.classId);
        if (!skins.length) return current;
        let nearby = 0;
        if (target) {
            Object.values(LobbyNeon.state.rpgWildMonsters || {}).forEach(monster => {
                if (!monster || monster.defeated) return;
                const dx = monster.x - target.x;
                const dy = monster.y - target.y;
                if (Math.sqrt(dx * dx + dy * dy) <= 170) nearby++;
            });
        }
        const pool = nearby >= 2 ? skins.filter(skin => Number(skin.aoeRadius || 0) > 0) : skins;
        const usable = pool.length ? pool : skins;
        const lastId = LobbyNeon.state.rpgLastAutoSkinId;
        const lastIndex = usable.findIndex(skin => skin.id === lastId);
        const next = usable[(lastIndex + 1 + usable.length) % usable.length] || current;
        LobbyNeon.state.rpgLastAutoSkinId = next.id;
        return next;
    },

    castRpgSkill: async (options = {}) => {
        const now = Date.now();
        if (now < LobbyNeon.state.rpgSkillCooldownUntil) {
            if (!options.silent) {
                Utils.showToast(`Skill đang hồi ${Math.ceil((LobbyNeon.state.rpgSkillCooldownUntil - now) / 1000)}s.`, 'info');
            }
            LobbyNeon.updateRpgFarmHud();
            return;
        }

        const { data, profile, username } = await LobbyNeon.getMyRpgProfile();
        if (!profile.classChosen) {
            if (options.auto) LobbyNeon.stopRpgAutoFarm();
            if (options.silent) return;
            Utils.showToast('Bạn cần chọn môn phái chính thức trước khi farm quái.', 'warning');
            LobbyNeon.openRpgHub();
            return;
        }

        let target = LobbyNeon.state.rpgWildMonsters?.[LobbyNeon.state.selectedWildMonsterId];
        if (!target || target.defeated) {
            target = LobbyNeon.findNearestRpgWildMonster(9999)?.monster;
        }
        if (!target) {
            target = LobbyNeon.spawnRpgWildMonster(null, true);
        }
        if (!target) return;
        LobbyNeon.state.selectedWildMonsterId = target.id;

        const dist = Math.sqrt(Math.pow(target.x - LobbyNeon.state.myPos.x, 2) + Math.pow(target.y - LobbyNeon.state.myPos.y, 2));
        if (dist > 175) {
            const approachX = Math.max(90, target.x - 118);
            const approachY = target.y + 10;
            await LobbyNeon.moveTo(approachX, approachY);
            if (options.silent) {
                LobbyNeon.updateRpgFarmHud();
                return;
            }
            Utils.showToast('Đã áp sát quái. Bấm SKILL lần nữa để tung chưởng.', 'info');
            LobbyNeon.updateRpgFarmHud();
            return;
        }

        const skin = LobbyNeon.rpgSkins[profile.equippedSkin] || LobbyNeon.rpgSkins[LobbyNeon.getRpgClassDefaultSkinId(profile.classId)] || LobbyNeon.rpgSkins.basic;
        if (!LobbyNeon.isRpgSkinUnlocked(profile, skin)) {
            profile.equippedSkin = LobbyNeon.getRpgClassDefaultSkinId(profile.classId);
        }
        const activeSkin = options.auto
            ? LobbyNeon.getRpgAutoSkin(profile, target)
            : (LobbyNeon.rpgSkins[profile.equippedSkin] || LobbyNeon.rpgSkins.basic);
        const damage = Math.max(10, LobbyNeon.getRpgSkillDamage(profile, activeSkin) + Math.floor(Math.random() * 12));
        const cooldownMs = LobbyNeon.getRpgSkinCooldown(activeSkin);
        LobbyNeon.state.rpgSkillCooldownUntil = now + cooldownMs;
        LobbyNeon.state.rpgLastSkillCast = {
            skinId: activeSkin.id,
            cooldownMs,
            startedAt: now,
            until: LobbyNeon.state.rpgSkillCooldownUntil
        };

        LobbyNeon.showRpgMapProjectile(activeSkin, LobbyNeon.state.myPos, target);
        const userEl = document.getElementById(`user-${Auth.currentUser?.username}`);
        if (userEl) {
            userEl.classList.add('rpg-world-fighting');
            setTimeout(() => userEl.classList.remove('rpg-world-fighting'), 820);
        }

        const aoeRadius = Number(activeSkin.aoeRadius || 0);
        const hitTargets = [target];
        if (aoeRadius > 0) {
            Object.values(LobbyNeon.state.rpgWildMonsters || {}).forEach(monster => {
                if (!monster || monster.id === target.id || monster.defeated) return;
                const dx = monster.x - target.x;
                const dy = monster.y - target.y;
                if (Math.sqrt(dx * dx + dy * dy) <= aoeRadius) hitTargets.push(monster);
            });
        }

        const defeatedTargets = [];
        hitTargets.forEach((monster, index) => {
            const hitDamage = index === 0 ? damage : Math.max(6, Math.round(damage * Number(activeSkin.aoeDamageRatio || 0.65)));
            monster.hp = Math.max(0, monster.hp - hitDamage);
            monster.lastDamage = hitDamage;
            monster.lastHitAt = Date.now();
            if (monster.hp <= 0 && !monster.claimed) {
                monster.defeated = true;
                defeatedTargets.push(monster);
            }
        });

        for (const defeated of defeatedTargets) {
            await LobbyNeon.rewardRpgWildKill(defeated, profile, data, username, options);
            setTimeout(() => {
                const el = document.getElementById(`rpg-wild-${defeated.id}`);
                if (el) el.remove();
                delete LobbyNeon.state.rpgWildMonsters[defeated.id];
                if (LobbyNeon.state.selectedWildMonsterId === defeated.id) LobbyNeon.state.selectedWildMonsterId = null;
                LobbyNeon.updateRpgFarmHud();
            }, 1400);
        }
        hitTargets.forEach(monster => LobbyNeon.renderRpgWildMonster(monster));
        LobbyNeon.updateRpgFarmHud();
    },

    showRpgMapProjectile: (skin, fromPos, target) => {
        const map = document.getElementById('lobby-map');
        if (!map || !fromPos || !target) return;
        const visualClass = LobbyNeon.getRpgSkillVisualClass(skin);
        const projectile = document.createElement('div');
        projectile.className = `rpg-map-projectile ${visualClass}`;
        projectile.style.left = `${fromPos.x + 28}px`;
        projectile.style.top = `${fromPos.y - 22}px`;
        projectile.style.setProperty('--skin-color', skin.color || '#38bdf8');
        projectile.style.color = skin.color || '#38bdf8';
        projectile.style.setProperty('--travel-x', `${target.x - fromPos.x}px`);
        projectile.style.setProperty('--travel-y', `${target.y - fromPos.y}px`);
        map.appendChild(projectile);
        setTimeout(() => projectile.remove(), 650);
    },

    rewardRpgWildKill: async (monster, profile, data, username, options = {}) => {
        monster.claimed = true;
        const zone = LobbyNeon.rpgZones[monster.zoneId] || LobbyNeon.rpgZones.training_forest;
        const rewardPoints = Math.max(1, zone.rewardPoints);
        const exp = rewardPoints * (Auth.EXP_MULTIPLIER || 80);
        const items = {
            goldDust: 8 + zone.rewardPoints * 6,
            [zone.material]: 1
        };
        const shardMap = {
            training_forest: 'thunderShard',
            ghost_cave: 'moonShard',
            secret_realm: 'fireShard',
            molten_keep: 'fireShard',
            frost_peak: 'thunderShard',
            abyss_gate: 'moonShard'
        };
        if (Math.random() < 0.12 + zone.rewardPoints * 0.04) {
            items[shardMap[zone.id] || 'thunderShard'] = 1;
        }
        const reward = {
            rewardPoints,
            exp,
            items,
            equipment: LobbyNeon.rollRpgEquipmentDrops(zone, profile, 'monster')
        };
        const appliedReward = LobbyNeon.applyRpgRewardToProfile(profile, reward);
        profile.wildKills = Number(profile.wildKills || 0) + 1;
        profile.totalRewardPoints = Number(profile.totalRewardPoints || 0) + rewardPoints;
        profile.lootLog = [
            {
                time: Date.now(),
                zoneName: `${zone.name} · Farm tay`,
                monster: zone.monster,
                rewardPoints,
                exp,
                items,
                equipment: appliedReward.equipment,
                soldEquipment: appliedReward.soldEquipment,
                soldGold: appliedReward.soldGold
            },
            ...(profile.lootLog || [])
        ].slice(0, 12);
        await LobbyNeon.awardRpgExp(username, rewardPoints, profile);
        await LobbyNeon.saveMyRpgProfile(profile, data);
        const shouldToast = !options.auto || Date.now() - (LobbyNeon.state.rpgLastAutoToastAt || 0) > 7000;
        if (shouldToast) {
            LobbyNeon.state.rpgLastAutoToastAt = Date.now();
            Utils.showToast(`Hạ ${zone.monster}: +${exp} EXP · ${LobbyNeon.formatRpgReward(reward)}`, 'success');
        }
        if (LobbyNeon.state.activeHubTab === 'rpg') LobbyNeon.renderRpgPanel();
    },

    toggleRpgMapOverlay: () => {
        if (LobbyNeon.state.rpgMapOpen) {
            LobbyNeon.closeRpgMapOverlay();
            return;
        }
        LobbyNeon.openRpgMapOverlay();
    },

    openRpgMapOverlay: () => {
        const container = document.getElementById('lobby-map-container');
        if (!container) return;
        LobbyNeon.state.rpgMapOpen = true;
        let overlay = document.getElementById('rpg-map-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'rpg-map-overlay';
            overlay.className = 'rpg-map-overlay';
            overlay.addEventListener('mousedown', (e) => {
                if (e.target === overlay) LobbyNeon.closeRpgMapOverlay();
            });
            overlay.addEventListener('click', LobbyNeon.handleRpgHubActionClick);
            container.appendChild(overlay);
        }
        const level = Auth.currentUser?.level || 1;
        overlay.innerHTML = `
            <div class="rpg-map-modal">
                <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start;">
                    <div>
                        <p class="rpg-title">Ban do MU mini</p>
                        <div class="rpg-muted">Bam M de dong/mo. Chon map theo cap de doi quai dang farm.</div>
                    </div>
                    <button class="rpg-mu-small-btn" data-rpg-action="map-close" style="width:74px;">Dong</button>
                </div>
                <div class="rpg-map-grid">
                    ${Object.values(LobbyNeon.rpgZones).map(zone => {
                        const locked = level < zone.minLevel;
                        const active = LobbyNeon.state.selectedRpgZone === zone.id;
                        return `
                            <button class="rpg-map-card ${locked ? 'locked' : ''} ${active ? 'active' : ''}"
                                style="--zone-color:${zone.color}; --zone-glow:${zone.color}55;"
                                ${locked ? 'disabled' : ''}
                                data-rpg-action="travel-zone"
                                data-rpg-value="${zone.id}">
                                <div style="display:flex; justify-content:space-between; gap:8px;">
                                    <b style="color:${zone.color};">${zone.icon} ${LobbyNeon.escapeHtml(zone.name)}</b>
                                    <span class="rpg-chip">Lv.${zone.minLevel}+</span>
                                </div>
                                <div class="rpg-muted" style="margin-top:8px;">Quai: ${LobbyNeon.escapeHtml(zone.monster)}</div>
                                <div class="rpg-muted">Do roi: trang/xanh/vang/xanh luc</div>
                                <div class="rpg-muted">${locked ? `Can Lv.${zone.minLevel}` : (active ? 'Dang o map nay' : 'Di chuyen')}</div>
                            </button>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    },

    closeRpgMapOverlay: () => {
        LobbyNeon.state.rpgMapOpen = false;
        document.getElementById('rpg-map-overlay')?.remove();
    },

    applyRpgZoneTheme: (zone) => {
        const map = document.getElementById('lobby-map');
        if (!map || !zone) return;
        map.dataset.rpgZone = zone.id;
        map.dataset.rpgZoneName = zone.name;
        map.style.setProperty('--rpg-zone-color', zone.color || '#22d3ee');
    },

    travelRpgZone: async (zoneId) => {
        const zone = LobbyNeon.rpgZones[zoneId];
        if (!zone) return;
        const level = Auth.currentUser?.level || 1;
        if (level < zone.minLevel) {
            Utils.showToast(`Can cap ${zone.minLevel} de vao map nay.`, 'warning');
            return;
        }
        LobbyNeon.state.selectedRpgZone = zoneId;
        LobbyNeon.state.rpgZoneManuallySelected = true;
        LobbyNeon.state.selectedWildMonsterId = null;
        LobbyNeon.closeRpgMapOverlay();
        Object.keys(LobbyNeon.state.rpgWildMonsters || {}).forEach(id => {
            document.getElementById(`rpg-wild-${id}`)?.remove();
        });
        LobbyNeon.state.rpgWildMonsters = {};
        LobbyNeon.applyRpgZoneTheme(zone);
        const point = LobbyNeon.getRpgRandomFarmPoint(true);
        await LobbyNeon.moveTo(Math.max(90, point.x - 120), Math.max(160, point.y + 12));
        for (let i = 0; i < LobbyNeon.state.rpgMaxWildMonsters; i++) {
            LobbyNeon.spawnRpgWildMonster(zone.id, i === 0);
        }
        Utils.showToast(`Da vao ${zone.name}. Quai se doi sang ${zone.monster}.`, 'success');
        if (LobbyNeon.state.activeHubTab === 'rpg') LobbyNeon.renderRpgPanel();
        LobbyNeon.updateRpgFarmHud();
    },

    selectRpgZone: (zoneId) => {
        const zone = LobbyNeon.rpgZones[zoneId];
        if (!zone) return;
        const level = Auth.currentUser?.level || 1;
        if (level < zone.minLevel) {
            Utils.showToast(`Bãi ${zone.name} cần cấp ${zone.minLevel}.`, 'warning');
            return;
        }
        LobbyNeon.state.selectedRpgZone = zoneId;
        LobbyNeon.state.rpgZoneManuallySelected = true;
        LobbyNeon.applyRpgZoneTheme(zone);
        Utils.showToast(`Đã chọn bãi farm: ${zone.name}. Quái mới sẽ ưu tiên map này.`, 'info');
        LobbyNeon.renderRpgPanel();
    },

    getRpgMonsterSvg: (zoneId, defeated = false) => {
        const opacity = defeated ? '0.45' : '1';
        if (zoneId === 'molten_keep') {
            return `
                <svg class="rpg-monster-svg" viewBox="0 0 120 120" aria-hidden="true" style="opacity:${opacity}">
                    <defs>
                        <linearGradient id="moltenFiend" x1="0%" x2="100%">
                            <stop offset="0%" stop-color="#7c2d12"/>
                            <stop offset="52%" stop-color="#f97316"/>
                            <stop offset="100%" stop-color="#fde047"/>
                        </linearGradient>
                    </defs>
                    <path d="M20 82 C25 48 39 24 61 22 C84 25 99 50 101 83 C91 101 31 102 20 82 Z" fill="url(#moltenFiend)" stroke="#fed7aa" stroke-width="4"/>
                    <path d="M38 29 L33 8 L51 23 Z M78 28 L94 9 L89 36 Z" fill="#ef4444" stroke="#fed7aa" stroke-width="3"/>
                    <circle cx="48" cy="58" r="6" fill="#111827"/>
                    <circle cx="75" cy="58" r="6" fill="#111827"/>
                    <path d="M47 79 C57 88 70 88 80 78" fill="none" stroke="#431407" stroke-width="5" stroke-linecap="round"/>
                    <path d="M26 86 C11 92 19 110 36 97" fill="none" stroke="#fb923c" stroke-width="7" stroke-linecap="round"/>
                    <path d="M96 86 C112 92 103 110 86 97" fill="none" stroke="#fb923c" stroke-width="7" stroke-linecap="round"/>
                </svg>
            `;
        }
        if (zoneId === 'frost_peak') {
            return `
                <svg class="rpg-monster-svg" viewBox="0 0 120 120" aria-hidden="true" style="opacity:${opacity}">
                    <defs>
                        <radialGradient id="frostWraith" cx="50%" cy="35%" r="72%">
                            <stop offset="0%" stop-color="#eff6ff"/>
                            <stop offset="48%" stop-color="#60a5fa"/>
                            <stop offset="100%" stop-color="#1e3a8a"/>
                        </radialGradient>
                    </defs>
                    <path d="M25 86 C20 55 36 23 61 18 C86 23 101 54 96 86 C88 78 82 81 78 94 C69 82 55 82 45 94 C40 81 32 78 25 86 Z" fill="url(#frostWraith)" stroke="#bfdbfe" stroke-width="4"/>
                    <path d="M34 31 L24 12 L47 25 Z M85 31 L99 13 L94 39 Z" fill="#dbeafe" stroke="#93c5fd" stroke-width="3"/>
                    <circle cx="49" cy="57" r="6" fill="#0f172a"/>
                    <circle cx="74" cy="57" r="6" fill="#0f172a"/>
                    <path d="M48 77 C58 71 68 71 79 77" fill="none" stroke="#0f172a" stroke-width="5" stroke-linecap="round"/>
                    <path d="M17 74 L35 70 M85 70 L105 74" stroke="#bfdbfe" stroke-width="6" stroke-linecap="round"/>
                </svg>
            `;
        }
        if (zoneId === 'abyss_gate') {
            return `
                <svg class="rpg-monster-svg" viewBox="0 0 120 120" aria-hidden="true" style="opacity:${opacity}">
                    <defs>
                        <radialGradient id="abyssLord" cx="50%" cy="42%" r="70%">
                            <stop offset="0%" stop-color="#f5d0fe"/>
                            <stop offset="45%" stop-color="#a855f7"/>
                            <stop offset="100%" stop-color="#1e1b4b"/>
                        </radialGradient>
                    </defs>
                    <path d="M22 76 C24 38 41 16 62 16 C86 17 102 40 99 77 C96 102 80 111 60 110 C38 109 23 99 22 76 Z" fill="url(#abyssLord)" stroke="#e9d5ff" stroke-width="4"/>
                    <path d="M38 23 L27 3 L54 17 Z M82 22 L101 4 L93 34 Z" fill="#7e22ce" stroke="#e9d5ff" stroke-width="3"/>
                    <circle cx="49" cy="55" r="7" fill="#020617"/>
                    <circle cx="76" cy="55" r="7" fill="#020617"/>
                    <path d="M47 78 C58 88 71 88 82 77" fill="none" stroke="#020617" stroke-width="5" stroke-linecap="round"/>
                    <path d="M20 83 C2 82 6 105 28 97" fill="none" stroke="#a855f7" stroke-width="7" stroke-linecap="round"/>
                    <path d="M100 83 C118 82 114 105 92 97" fill="none" stroke="#a855f7" stroke-width="7" stroke-linecap="round"/>
                </svg>
            `;
        }
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
        if (profile.classChosen && profile.classId !== classId) {
            const ok = confirm('Bạn đã có môn phái chính thức. Đổi môn sẽ đổi bộ skill cơ bản đang dùng. Tiếp tục?');
            if (!ok) return;
        }
        profile.classId = classId;
        profile.classChosen = true;
        const defaultSkinId = LobbyNeon.getRpgClassDefaultSkinId(classId);
        const currentSkin = LobbyNeon.rpgSkins[profile.equippedSkin];
        if (!currentSkin?.vip && currentSkin?.classId !== classId) {
            profile.equippedSkin = defaultSkinId;
        }
        await LobbyNeon.saveMyRpgProfile(profile, data);
        Utils.showToast(`Đã chọn môn phái chính thức: ${LobbyNeon.rpgClasses[classId].name}.`, 'success');
        LobbyNeon.renderRpgPanel();
        LobbyNeon.renderRpgSkillWheel();
    },

    equipRpgSkin: async (skinId) => {
        const skin = LobbyNeon.rpgSkins[skinId];
        if (!skin) return;
        const { data, profile } = await LobbyNeon.getMyRpgProfile();
        if (skin.classId && skin.classId !== profile.classId) {
            Utils.showToast('Skill này thuộc môn phái khác.', 'warning');
            return;
        }
        const unlocked = LobbyNeon.isRpgSkinUnlocked(profile, skin);

        if (!unlocked) {
            const shardKey = skin.shard;
            const current = Number(profile.inventory[shardKey] || 0);
            if (skin.classId) {
                Utils.showToast(`${skin.name} mở ở cấp ${skin.unlockLevel}.`, 'warning');
                return;
            }
            if (!shardKey || current < skin.unlockNeed) {
                Utils.showToast(`Chưa đủ mảnh để mở skin VIP ${skin.name}.`, 'warning');
                return;
            }
            profile.inventory[shardKey] = current - skin.unlockNeed;
            profile.unlockedSkins.push(skinId);
            profile.skinLevels[skinId] = Math.max(1, Number(profile.skinLevels?.[skinId] || 1));
        }

        profile.equippedSkin = skinId;
        profile.skinLevels[skinId] = Math.max(1, Number(profile.skinLevels?.[skinId] || 1));
        await LobbyNeon.saveMyRpgProfile(profile, data);
        Utils.showToast(`Đã trang bị ${skin.name}.`, 'success');
        LobbyNeon.renderRpgPanel();
        LobbyNeon.renderRpgSkillWheel();
    },

    upgradeRpgSkin: async (skinId) => {
        const skin = LobbyNeon.rpgSkins[skinId];
        if (!skin) return;
        const { data, profile } = await LobbyNeon.getMyRpgProfile();
        if (!LobbyNeon.isRpgSkinUnlocked(profile, skin)) {
            Utils.showToast('Mo khoa skin truoc khi nang cap.', 'warning');
            return;
        }
        const currentLevel = Math.max(1, Number(profile.skinLevels?.[skinId] || 1));
        if (currentLevel >= 10) {
            Utils.showToast('Skin nay da dat cap toi da.', 'info');
            return;
        }
        const stoneCost = currentLevel * 2 + (skin.vip ? 2 : 0);
        const shardCost = skin.shard ? Math.max(1, Math.ceil(currentLevel / 2)) : 0;
        if (Number(profile.inventory.daCuongHoa || 0) < stoneCost) {
            Utils.showToast(`Thieu ${stoneCost} da cuong hoa de nang skin.`, 'warning');
            return;
        }
        if (shardCost > 0 && Number(profile.inventory[skin.shard] || 0) < shardCost) {
            Utils.showToast(`Thieu ${shardCost} manh skin ${skin.name}.`, 'warning');
            return;
        }
        profile.inventory.daCuongHoa = Number(profile.inventory.daCuongHoa || 0) - stoneCost;
        if (shardCost > 0) profile.inventory[skin.shard] = Number(profile.inventory[skin.shard] || 0) - shardCost;
        profile.skinLevels[skinId] = currentLevel + 1;
        await LobbyNeon.saveMyRpgProfile(profile, data);
        Utils.showToast(`Da nang ${skin.name} len cap ${currentLevel + 1}.`, 'success');
        LobbyNeon.renderRpgPanel();
        LobbyNeon.renderRpgSkillWheel();
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
        const combatSpot = LobbyNeon.getRpgCombatSpot(username);
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
            combatSpot,
            reward
        };

        await LobbyNeon.saveMyRpgProfile(profile, data);
        await LobbyNeon.moveTo(combatSpot.playerX, combatSpot.playerY);
        LobbyNeon.renderRpgWorldCombatants();
        try {
            await DB.sendLobbyChat({
                sender: 'Hệ Thống',
                text: `⚔️ @${username} vừa kéo quái ${zone.monster} ra sàn ${zone.name}, chiến đấu trong ${durationMin} phút.`
            });
        } catch (e) {
            console.warn('send rpg chat error:', e);
        }
        Utils.showToast(`${zone.monster} đã xuất hiện trên sàn. Chibi đang lao vào đánh!`, 'success');
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
        const appliedReward = LobbyNeon.applyRpgRewardToProfile(profile, reward);
        profile.totalRewardPoints = Number(profile.totalRewardPoints || 0) + Number(reward.rewardPoints || 0);
        profile.lootLog = [
            {
                time: Date.now(),
                zoneName: zone.name,
                monster: zone.monster,
                rewardPoints: reward.rewardPoints,
                exp: reward.exp,
                items: reward.items || {},
                equipment: appliedReward.equipment,
                soldEquipment: appliedReward.soldEquipment,
                soldGold: appliedReward.soldGold
            },
            ...(profile.lootLog || [])
        ].slice(0, 12);
        profile.activeHunt = null;

        await LobbyNeon.awardRpgExp(username, Number(reward.rewardPoints || 0), profile);
        await LobbyNeon.saveMyRpgProfile(profile, data);
        LobbyNeon.renderRpgWorldCombatants();

        Utils.showToast(`Nhận ${reward.exp} EXP và ${LobbyNeon.formatRpgReward(reward)}.`, 'success');
        try {
            await DB.sendLobbyChat({
                sender: 'Hệ Thống',
                text: `🎁 @${username} vừa hạ ${zone.monster}: +${reward.exp} EXP, ${LobbyNeon.formatRpgReward(reward)}.`
            });
        } catch (e) {
            console.warn('send rpg reward chat error:', e);
        }
        LobbyNeon.renderRpgPanel();
    },

    renderRpgPanel: async () => {
        const container = document.getElementById('hub-content-rpg');
        if (!container) return;
        const previousScrollTop = container.scrollTop || 0;
        if (!container.innerHTML.trim()) container.innerHTML = `
            <div style="text-align:center; color:#64748b; font-size:12px; padding:30px 10px;">
                <i class="fa-solid fa-spinner fa-spin" style="font-size:22px; margin-bottom:10px; display:block;"></i>
                Đang tải võ đường...
            </div>
        `;

        const { profile } = await LobbyNeon.getMyRpgProfile();
        const classCfg = LobbyNeon.rpgClasses[profile.classId] || LobbyNeon.rpgClasses.kiem_tong;
        const equippedSkin = LobbyNeon.rpgSkins[profile.equippedSkin] || LobbyNeon.rpgSkins[LobbyNeon.getRpgClassDefaultSkinId(profile.classId)] || LobbyNeon.rpgSkins.basic;
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
            <button class="rpg-choice ${profile.classId === c.id ? 'active' : ''}" style="--rpg-color:${c.color};" data-rpg-action="select-class" data-rpg-value="${c.id}">
                <div style="display:flex; justify-content:space-between; gap:8px;">
                    <strong style="color:${c.color}; font-size:12px;">${c.icon} ${c.name}</strong>
                    <span class="rpg-chip">${profile.classChosen && profile.classId === c.id ? 'Môn chính' : (profile.classId === c.id ? 'Đang xem' : 'Chọn')}</span>
                </div>
                <div class="rpg-muted" style="margin-top:4px;">${c.desc}</div>
            </button>
        `).join('');

        const skinHtml = LobbyNeon.getRpgVisibleSkins(profile).map(skin => {
            const unlocked = LobbyNeon.isRpgSkinUnlocked(profile, skin);
            const shardCount = skin.shard ? Number(profile.inventory[skin.shard] || 0) : 0;
            const canUnlock = !unlocked && skin.shard && shardCount >= skin.unlockNeed;
            const label = unlocked
                ? (profile.equippedSkin === skin.id ? 'Đang dùng' : 'Trang bị')
                : (skin.classId ? `Cấp ${skin.unlockLevel}` : (canUnlock ? 'Mở khóa VIP' : `${shardCount}/${skin.unlockNeed || 0} mảnh`));
            const visualClass = LobbyNeon.getRpgSkillVisualClass(skin);
            return `
                <button class="rpg-choice ${profile.equippedSkin === skin.id ? 'active' : ''}" style="--rpg-color:${skin.color}; ${!unlocked && !canUnlock ? 'opacity:.7;' : ''}" data-rpg-action="equip-skin" data-rpg-value="${skin.id}">
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                        <strong style="color:${skin.color}; font-size:12px;">${skin.icon} ${skin.name}</strong>
                        <span class="rpg-chip">${label}</span>
                    </div>
                    <div class="rpg-muted" style="margin-top:4px;">${skin.desc}</div>
                    <div class="rpg-muted" style="margin-top:4px; color:${skin.color};">${skin.bonusText}</div>
                    <div class="rpg-skill-preview ${visualClass}" style="--rpg-color:${skin.color};"></div>
                </button>
            `;
        }).join('');

        const zoneHtml = Object.values(LobbyNeon.rpgZones).map(zone => {
            const userLevel = Auth.currentUser?.level || 1;
            const levelLocked = userLevel < zone.minLevel;
            const isSelected = displayZone.id === zone.id;
            const disabled = levelLocked;
            return `
                <div class="rpg-card ${isSelected ? 'featured' : ''}" data-rpg-action="select-zone" data-rpg-value="${zone.id}" style="border-color:${zone.color}55;">
                    <div style="display:flex; justify-content:space-between; gap:8px; align-items:flex-start;">
                        <div>
                            <p class="rpg-title" style="color:${zone.color};">${zone.icon} ${zone.name}</p>
                            <div class="rpg-muted">${zone.monster} tự đi lại · ${zone.danger} · Cấp ${zone.minLevel}+</div>
                        </div>
                        <span class="rpg-chip">${isSelected ? 'Đang xem' : `+${zone.rewardPoints * (Auth.EXP_MULTIPLIER || 80)} EXP/kill`}</span>
                    </div>
                    ${levelLocked ? `<div class="rpg-muted" style="margin-top:8px; color:#fbbf24;">Cần cấp ${zone.minLevel} để vào ải này.</div>` : ''}
                    <button class="rpg-action-btn" style="width:100%; margin-top:8px;" ${disabled ? 'disabled' : ''} data-rpg-action="spawn-zone" data-rpg-value="${zone.id}">
                        🧲 Gọi thêm quái gần tôi
                    </button>
                </div>
            `;
        }).join('');

        const activeHtml = active ? `
            <div class="rpg-card featured">
                <div style="display:flex; justify-content:space-between; gap:8px;">
                    <div>
                        <p class="rpg-title">${isDone ? '🎁 Phiên luyện cũ đã xong' : '⚔️ Phiên luyện tự động cũ'}</p>
                        <div class="rpg-muted">${activeZone.icon} ${activeZone.name} · luồng mới là quái tự spawn + bấm SKILL farm tay.</div>
                    </div>
                    <span class="rpg-chip">${isDone ? 'Có thể nhận' : LobbyNeon.formatRpgDuration(active.endsAt - now)}</span>
                </div>
                <div class="rpg-progress" style="margin:12px 0 10px;"><span style="width:${progress}%;"></span></div>
                <div class="rpg-muted" style="margin-bottom:10px;">
                    Dự kiến: +${active.reward?.exp || 0} EXP · ${LobbyNeon.formatRpgReward(active.reward)}
                </div>
                <button class="rpg-action-btn" style="width:100%;" ${isDone ? '' : 'disabled'} onclick="LobbyNeon.claimRpgHunt()">
                    ${isDone ? '🎁 NHẬN THƯỞNG' : 'Đang luyện công...'}
                </button>
            </div>
        ` : `
            <div class="rpg-card featured">
                <p class="rpg-title">⚔️ Farm quái kiểu MU mini</p>
                <div class="rpg-muted" style="margin-top:6px;">Quái tự xuất hiện và đi lại trên sàn. Di chuyển tới gần quái rồi bấm SKILL để đánh, không còn tự tụt máu.</div>
            </div>
        `;

        const logHtml = (profile.lootLog || []).length ? profile.lootLog.map(log => `
            <div class="rpg-card" style="padding:9px;">
                <div style="display:flex; justify-content:space-between; gap:8px;">
                    <strong style="font-size:11px; color:#e2e8f0;">${LobbyNeon.escapeHtml(log.zoneName)} · +${log.exp || 0} EXP</strong>
                    <span class="rpg-muted">${new Date(log.time).toLocaleDateString('vi-VN')}</span>
                </div>
                <div class="rpg-muted" style="margin-top:4px;">${LobbyNeon.formatRpgReward(log)}</div>
            </div>
        `).join('') : `<div class="rpg-muted" style="text-align:center; padding:12px;">Chưa có chiến lợi phẩm nào.</div>`;

        container.innerHTML = `
            <div class="rpg-grid">
                ${LobbyNeon.renderRpgTopPanel(profile)}

                <div class="rpg-card featured">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
                        <div>
                            <p class="rpg-title">${classCfg.icon} ${profile.classChosen ? classCfg.name : 'Chưa chọn môn chính'}</p>
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
                        <span class="rpg-chip">🏆 ${profile.wildKills || 0} quái farm tay</span>
                    </div>
                    ${!profile.classChosen ? `<div class="rpg-muted" style="margin-top:10px; color:#fbbf24;">Chọn một môn phái chính thức để mở bộ skill cơ bản và farm quái bằng nút SKILL.</div>` : ''}
                </div>

                ${LobbyNeon.renderRpgEquipmentPanel(profile)}

                ${LobbyNeon.renderRpgStatsPanel(profile)}

                ${LobbyNeon.renderRpgAutoSettingsPanel(profile)}

                <div class="rpg-card">
                    <p class="rpg-title">🎮 Nút skin chưởng nhanh</p>
                    <div class="rpg-muted" style="margin:6px 0 10px;">Bấm một nút để trang bị skin chưởng rồi tung skill. Skin cơ bản mở theo cấp, skin VIP vẫn dùng mảnh để mở.</div>
                    ${LobbyNeon.renderRpgQuickSkinButtons(profile)}
                </div>

                ${LobbyNeon.renderRpgSkinUpgradePanel(profile)}

                ${activeHtml}

                ${LobbyNeon.renderRpgBossPanel(profile)}

                ${LobbyNeon.renderRpgUnlockPanel(profile)}

                ${LobbyNeon.renderRpgPvpTeaser(profile)}

                <div class="rpg-card">
                    <p class="rpg-title">🏯 Môn phái chính thức</p>
                    <div class="rpg-grid" style="margin-top:10px;">${classHtml}</div>
                </div>

                <div class="rpg-card">
                    <p class="rpg-title">🌀 Chưởng theo cấp & skin VIP</p>
                    <div class="rpg-grid" style="margin-top:10px;">${skinHtml}</div>
                </div>

                <div class="rpg-card">
                    <p class="rpg-title">🧭 Bãi quái farm tay</p>
                    <div class="rpg-zone-row" style="margin-top:10px;">${zoneHtml}</div>
                </div>

                <div class="rpg-card">
                    <p class="rpg-title">📜 Chiến lợi phẩm gần đây</p>
                    <div class="rpg-log" style="margin-top:10px;">${logHtml}</div>
                </div>
            </div>
        `;
        container.scrollTop = previousScrollTop;
        LobbyNeon.renderRpgSkillWheel();
        LobbyNeon.updateRpgSkillCooldownBadges();
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
