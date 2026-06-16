/**
 * Games Arena Module (Đấu Trường Game)
 * Gomoku (Cờ Caro) & Office Monopoly (Cờ Tỷ Phú Văn Phòng) - TRỰC TUYẾN REAL-TIME
 */

const GamesSynth = {
    ctx: null,
    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    },
    playMove() {
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(550, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(750, this.ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
    },
    playRoll() {
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(280, this.ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.12);
    },
    playWin() {
        this.init();
        if (!this.ctx) return;
        const playTone = (freq, start, duration) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime + start);
            gain.gain.setValueAtTime(0.06, this.ctx.currentTime + start);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + start + duration);
            osc.start(this.ctx.currentTime + start);
            osc.stop(this.ctx.currentTime + start + duration);
        };
        playTone(523.25, 0, 0.12); // C5
        playTone(659.25, 0.12, 0.12); // E5
        playTone(783.99, 0.24, 0.12); // G5
        playTone(1046.50, 0.36, 0.25); // C6
    },
    playLose() {
        this.init();
        if (!this.ctx) return;
        const playTone = (freq, start, duration) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime + start);
            gain.gain.setValueAtTime(0.06, this.ctx.currentTime + start);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + start + duration);
            osc.start(this.ctx.currentTime + start);
            osc.stop(this.ctx.currentTime + start + duration);
        };
        playTone(392.00, 0, 0.15); // G4
        playTone(349.23, 0.15, 0.15); // F4
        playTone(311.13, 0.3, 0.3); // Eb4
    }
};

const GamesModule = {
    activeTab: 'caro', // 'caro' or 'monopoly'

    // === Caro State ===
    caro: {
        boardSize: 15,
        board: [], 
        currentPlayer: 'X', 
        gameMode: 'ai', 
        gameActive: true,
        winner: null,
        winLine: [],
        hackMode: false,
        hackPlayer: 'O',
        hackDelayMs: 1500,
        hackTimeout: null
    },

    // === Monopoly State ===
    monopoly: {
        tiles: [
            { id: 0, name: 'BẮT ĐẦU 🚩', type: 'start', desc: 'Đâm qua nhận +2đ Công Đức' },
            { id: 1, name: 'Phòng Editor 🎬', type: 'property', cost: 3, rent: 1, owner: null, color: '#ec4899' },
            { id: 2, name: 'Cơ Hội ❓', type: 'chance', color: '#a855f7' },
            { id: 3, name: 'Phòng MC / Host 🎙️', type: 'property', cost: 4, rent: 1.5, owner: null, color: '#3b82f6' },
            { id: 4, name: 'Thuế Thu Nhập 💸', type: 'tax', cost: 2, desc: 'Làm mất tài liệu phạt -2đ Công Đức' },
            { id: 5, name: 'Căn Tin ☕', type: 'property', cost: 5, rent: 2, owner: null, color: '#10b981' },
            { id: 6, name: 'Kênh TikTok 📈', type: 'property', cost: 6, rent: 2.5, owner: null, color: '#eab308' },
            { id: 7, name: 'Vận May 🍀', type: 'lucky', color: '#00f3ff' },
            { id: 8, name: 'Phòng Content 📝', type: 'property', cost: 7, rent: 3, owner: null, color: '#fda4af' },
            { id: 9, name: 'Phòng Marketing 📊', type: 'property', cost: 9, rent: 4, owner: null, color: '#f97316' },
            { id: 10, name: 'Đi Trễ Phạt Đứng 🔒', type: 'jail', desc: 'Mất lượt trừ khi nộp 2đ Công Đức cho HR' },
            { id: 11, name: 'Phòng Họp VIP 👑', type: 'property', cost: 13, rent: 6, owner: null, color: '#a855f7' },
            { id: 12, name: 'Cơ Hội ❓', type: 'chance', color: '#a855f7' },
            { id: 13, name: 'Xe Máy Của Sếp 🏎️', type: 'property', cost: 11, rent: 5, owner: null, color: '#a855f7' },
            { id: 14, name: 'Sếp Bao Trưa 🍔', type: 'buff', desc: 'Thử việc xuất sắc được Sếp mời ăn +2đ' },
            { id: 15, name: 'Phòng Manager 💼', type: 'property', cost: 9, rent: 4, owner: null, color: '#f97316' },
            { id: 16, name: 'Studio Live 🎥', type: 'property', cost: 8, rent: 3.5, owner: null, color: '#fda4af' },
            { id: 17, name: 'Vận May 🍀', type: 'lucky', color: '#00f3ff' },
            { id: 18, name: 'Phòng Server 🖥️', type: 'property', cost: 6, rent: 2.5, owner: null, color: '#eab308' },
            { id: 19, name: 'Phòng Design 🎨', type: 'property', cost: 5, rent: 2, owner: null, color: '#10b981' }
        ],
        players: [], 
        currentPlayerIdx: 0,
        gameActive: false,
        logs: [],
        diceValues: [1],
        isRolling: false,
        
        // Online Lobby Support
        activeRoomId: null,
        roomListener: null,
        invitesListener: null,
        lobbyRooms: [],
        lobbyListener: null,
        availableEmployees: [],
        startBonus: 5,
        startingCash: 30,
        visualPositions: {},
        visualAnimationRunning: null,
        awaitingAction: false
    },

    init: async () => {
        console.log("GamesModule Initialized Online Listeners");
        GamesModule.injectStyles();
        GamesModule.listenForInvitations();
    },

    // Lắng nghe lời mời đấu cờ tỷ phú trực tuyến toàn cục
    listenForInvitations: () => {
        if (typeof db === 'undefined') return;
        const user = Auth.currentUser;
        if (!user) return;

        if (GamesModule.monopoly.invitesListener) GamesModule.monopoly.invitesListener();

        GamesModule.monopoly.invitesListener = db.collection("monopoly_invitations")
            .where("target", "==", user.username)
            .where("status", "==", "pending")
            .onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === "added") {
                        const invite = change.doc.data();
                        GamesModule.showInvitationPopup(invite);
                    }
                });
            });
    },

    showInvitationPopup: (invite) => {
        // Play notification win tune
        GamesSynth.playWin();

        const popup = document.createElement('div');
        popup.id = `mono-invite-popup-${invite.id}`;
        popup.className = 'chance-overlay';
        popup.style.zIndex = '99999';

        popup.innerHTML = `
            <div style="background: linear-gradient(135deg, rgba(15,23,42,0.98), rgba(8,15,30,0.99)); border: 2.5px solid #00f3ff; border-radius: 20px; padding: 28px; max-width: 420px; width: 90%; text-align: center; box-shadow: 0 0 40px rgba(0,242,255,0.45); color: #fff; animation: chibiScaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);">
                <div style="font-size: 48px; margin-bottom: 12px; animation: bounce 1s infinite alternate;">🎮</div>
                <h3 style="margin: 0 0 8px 0; color: #00f3ff; font-size: 20px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; text-shadow: 0 0 10px rgba(0,242,255,0.4);">
                    Thử Thách Trực Tuyến!
                </h3>
                <p style="font-size: 13px; color: #cbd5e1; margin-bottom: 20px;">
                    Đồng nghiệp <strong style="color: #a855f7;">@${invite.host} (${invite.hostDisplayName})</strong> đang khiêu chiến và mời bạn gia nhập bàn cờ Tỷ Phú tại phòng <strong>"${invite.roomName}"</strong>!
                </p>

                <div style="display: flex; gap: 12px;">
                    <button onclick="GamesModule.acceptInvitation('${invite.id}', '${invite.roomId}')" style="flex: 1; padding: 12px; background: linear-gradient(135deg, #10b981, #059669); border: none; border-radius: 8px; color: #fff; font-weight: 800; font-size: 13px; cursor: pointer; text-transform: uppercase; box-shadow: 0 4px 12px rgba(16,185,129,0.3);">
                        🚪 GIA NHẬP
                    </button>
                    <button onclick="GamesModule.declineInvitation('${invite.id}')" style="flex: 1; padding: 12px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #cbd5e1; font-weight: 800; font-size: 13px; cursor: pointer; text-transform: uppercase;">
                        ❌ TỪ CHỐI
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(popup);
    },

    acceptInvitation: async (inviteId, roomId) => {
        document.getElementById(`mono-invite-popup-${inviteId}`)?.remove();
        if (typeof db === 'undefined') return;

        // Set status to accepted
        await db.collection("monopoly_invitations").doc(inviteId).update({ status: 'accepted' });

        // Force switch view to Monopoly game tab in Lobby
        app.navigateTo('lobby-view');
        if (typeof LobbyNeon !== 'undefined') {
            const hub = document.getElementById('lobby-game-hub');
            if (hub) hub.classList.remove('collapsed');
            LobbyNeon.switchHubTab('monopoly');
        } else {
            GamesModule.activeTab = 'monopoly';
            GamesModule.renderTabContent();
        }

        // Join Room
        await GamesModule.joinOnlineRoom(roomId);
    },

    declineInvitation: async (inviteId) => {
        document.getElementById(`mono-invite-popup-${inviteId}`)?.remove();
        if (typeof db === 'undefined') return;
        await db.collection("monopoly_invitations").doc(inviteId).update({ status: 'declined' });
        Utils.showToast("Đã từ chối lời mời chơi cờ Tỷ Phú.", "info");
    },

    injectStyles: () => {
        if (document.getElementById('mono-games-module-styles')) return;
        const style = document.createElement('style');
        style.id = 'mono-games-module-styles';
        style.innerHTML = `
            .games-container {
                padding: 20px;
                max-width: 1200px;
                margin: 0 auto;
                font-family: system-ui, -apple-system, sans-serif;
            }
            .games-nav-tabs {
                display: flex;
                gap: 12px;
                margin-bottom: 24px;
                border-bottom: 1px solid rgba(255,255,255,0.08);
                padding-bottom: 12px;
            }
            .games-nav-tab {
                background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.08);
                padding: 10px 24px;
                border-radius: 12px;
                color: #94a3b8;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .games-nav-tab:hover {
                background: rgba(255,255,255,0.08);
                color: #fff;
                transform: translateY(-2px);
            }
            .games-nav-tab.active {
                color: #fff;
                background: linear-gradient(135deg, rgba(6,182,212,0.2), rgba(139,92,246,0.2));
                border-color: #06b6d4;
                box-shadow: 0 0 15px rgba(6,182,212,0.25);
            }
            
            /* CARO STYLES */
            .caro-arena {
                display: flex;
                gap: 24px;
                flex-wrap: wrap;
            }
            .caro-board-panel {
                flex: 1.2;
                min-width: 320px;
                background: rgba(15,23,42,0.7);
                border: 1px solid rgba(255,255,255,0.06);
                border-radius: 20px;
                padding: 20px;
                backdrop-filter: blur(12px);
                box-shadow: 0 8px 32px rgba(0,0,0,0.5);
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            .caro-grid {
                display: grid;
                grid-template-columns: repeat(15, 1fr);
                gap: 1.5px;
                background: rgba(255,255,255,0.04);
                border: 2px solid rgba(6,182,212,0.3);
                padding: 3px;
                border-radius: 8px;
                width: 100%;
                max-width: 480px;
                aspect-ratio: 1;
                box-shadow: 0 0 20px rgba(6,182,212,0.15);
            }
            .caro-cell {
                background: rgba(15,23,42,0.9);
                aspect-ratio: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                font-weight: 900;
                cursor: pointer;
                transition: all 0.2s;
                user-select: none;
                border-radius: 2px;
            }
            .caro-cell:hover:not(.filled) {
                background: rgba(6,182,212,0.15);
                box-shadow: inset 0 0 8px rgba(6,182,212,0.3);
            }
            .caro-cell.filled.X {
                color: #06b6d4;
                text-shadow: 0 0 10px #06b6d4;
            }
            .caro-cell.filled.O {
                color: #ec4899;
                text-shadow: 0 0 10px #ec4899;
            }
            .caro-cell.win-highlight {
                background: rgba(34,197,94,0.35);
                color: #22c55e !important;
                text-shadow: 0 0 12px #22c55e;
                animation: winPulse 1s infinite alternate;
            }
            @keyframes winPulse {
                0% { transform: scale(1); }
                100% { transform: scale(1.05); }
            }

            .caro-sidebar-panel {
                flex: 0.8;
                min-width: 280px;
                background: rgba(15,23,42,0.65);
                border: 1px solid rgba(255,255,255,0.06);
                border-radius: 20px;
                padding: 24px;
                backdrop-filter: blur(12px);
                box-shadow: 0 8px 32px rgba(0,0,0,0.5);
                display: flex;
                flex-direction: column;
                gap: 20px;
            }

            /* MONOPOLY PREMIUM STYLES */
            .mono-arena {
                display: flex;
                flex-direction: column;
                gap: 18px;
                min-height: calc(100vh - 150px);
                padding: 18px;
                border-radius: 26px;
                background:
                    radial-gradient(circle at 22% 16%, rgba(16,185,129,0.12), transparent 28%),
                    radial-gradient(circle at 78% 74%, rgba(236,72,153,0.12), transparent 34%),
                    linear-gradient(135deg, rgba(2,6,23,0.46), rgba(15,23,42,0.16));
                position: relative;
                overflow: hidden;
            }
            .mono-arena::before {
                content: '';
                position: absolute;
                inset: 0;
                pointer-events: none;
                background:
                    linear-gradient(90deg, rgba(16,185,129,0.035) 1px, transparent 1px),
                    linear-gradient(0deg, rgba(16,185,129,0.028) 1px, transparent 1px);
                background-size: 42px 42px;
                mask-image: radial-gradient(circle at 50% 45%, #000 0%, transparent 72%);
                opacity: 0.75;
            }
            .mono-arena > * {
                position: relative;
                z-index: 1;
            }
            .mono-match-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 16px;
                padding: 12px 14px 12px 16px;
                border-radius: 18px;
                background: linear-gradient(135deg, rgba(15,23,42,0.72), rgba(17,24,39,0.38));
                border: 1px solid rgba(148,163,184,0.12);
                box-shadow: 0 14px 40px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.06);
                backdrop-filter: blur(14px);
            }
            .mono-match-title {
                color: #fff;
                margin: 0;
                font-size: 17px;
                font-weight: 950;
                display: flex;
                align-items: center;
                gap: 10px;
                letter-spacing: 0.8px;
                text-transform: uppercase;
                text-shadow: 0 0 18px rgba(16,185,129,0.22);
            }
            .mono-title-orb {
                width: 34px;
                height: 34px;
                border-radius: 12px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, rgba(16,185,129,0.22), rgba(139,92,246,0.22));
                border: 1px solid rgba(16,185,129,0.32);
                box-shadow: 0 0 18px rgba(16,185,129,0.18);
                font-size: 18px;
            }
            .mono-live-chip {
                font-size: 8px;
                background: linear-gradient(135deg, rgba(16,185,129,0.24), rgba(6,182,212,0.18));
                color: #34d399;
                padding: 4px 9px;
                border-radius: 999px;
                font-weight: 900;
                border: 1px solid rgba(16,185,129,0.32);
                animation: pulse 2s infinite;
                box-shadow: 0 0 14px rgba(16,185,129,0.12);
            }
            .mono-leave-btn {
                background: rgba(239,68,68,0.08);
                border: 1.5px solid rgba(239,68,68,0.36);
                color: #f87171;
                padding: 9px 15px;
                border-radius: 12px;
                font-size: 11px;
                cursor: pointer;
                font-weight: 900;
                transition: all 0.25s;
                text-transform: uppercase;
                box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
            }
            .mono-leave-btn:hover {
                background: #ef4444;
                color: #fff;
                transform: translateY(-1px);
                box-shadow: 0 10px 24px rgba(239,68,68,0.22);
            }
            .mono-setup-panel {
                background: linear-gradient(145deg, rgba(15,23,42,0.85), rgba(22,12,52,0.9));
                border: 1.5px solid rgba(139,92,246,0.3);
                border-radius: 20px;
                padding: 28px;
                backdrop-filter: blur(16px);
                box-shadow: 0 12px 40px rgba(0,0,0,0.5), 0 0 25px rgba(139,92,246,0.08);
            }

            /* Premium Monopoly Board */
            .mono-board {
                display: grid;
                grid-template-columns: 1.5fr repeat(4, 1fr) 1.5fr;
                grid-template-rows: 1.5fr repeat(4, 1fr) 1.5fr;
                gap: 5px;
                background:
                    radial-gradient(circle at 18% 18%, rgba(34,211,238,0.2), transparent 26%),
                    radial-gradient(circle at 82% 78%, rgba(236,72,153,0.18), transparent 30%),
                    linear-gradient(145deg, #15203a 0%, #150f31 48%, #07131f 100%);
                border: 1px solid rgba(125,211,252,0.34);
                border-radius: 24px;
                padding: 12px;
                width: 100%;
                max-width: min(980px, 84vh);
                margin: 0 auto;
                aspect-ratio: 1;
                box-shadow:
                    0 30px 90px rgba(0,0,0,0.74),
                    0 0 0 3px rgba(139,92,246,0.24),
                    0 0 50px rgba(6,182,212,0.22),
                    0 0 92px rgba(236,72,153,0.16),
                    inset 0 0 0 2px rgba(255,255,255,0.08),
                    inset 0 0 45px rgba(0,0,0,0.55);
                position: relative;
                isolation: isolate;
            }
            .mono-board::before {
                content: '';
                position: absolute;
                inset: -18px;
                border-radius: 32px;
                background:
                    linear-gradient(135deg, rgba(34,211,238,0.35), rgba(139,92,246,0.2), rgba(236,72,153,0.35)),
                    radial-gradient(circle at 50% 50%, rgba(139,92,246,0.14), transparent 60%);
                filter: blur(14px);
                pointer-events: none;
                z-index: -1;
                opacity: 0.78;
            }
            .mono-board::after {
                content: '';
                position: absolute;
                inset: 12px;
                border-radius: 17px;
                border: 1px solid rgba(255,255,255,0.1);
                box-shadow: inset 0 0 28px rgba(34,211,238,0.1);
                pointer-events: none;
                z-index: 0;
            }

            /* Individual Tile */
            .mono-tile {
                background:
                    linear-gradient(160deg, rgba(39,50,86,0.98), rgba(14,24,50,0.98) 54%, rgba(9,14,30,0.98)),
                    radial-gradient(circle at 50% 0%, rgba(255,255,255,0.1), transparent 52%);
                border: 1px solid rgba(148,163,184,0.22);
                border-radius: 12px;
                padding: 7px 5px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 3px;
                position: relative;
                overflow: hidden;
                transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
                z-index: 2;
                cursor: default;
                box-shadow:
                    inset 0 1px 0 rgba(255,255,255,0.18),
                    inset 0 -12px 18px rgba(0,0,0,0.3),
                    0 6px 0 rgba(3,7,18,0.75),
                    0 12px 18px rgba(0,0,0,0.25);
            }
            .mono-tile > * {
                position: relative;
                z-index: 2;
            }
            .mono-tile::before {
                content: '';
                position: absolute;
                inset: 1px;
                border-radius: 11px;
                background:
                    linear-gradient(135deg, rgba(255,255,255,0.12), transparent 38%),
                    repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 10px);
                pointer-events: none;
                z-index: 0;
            }
            .mono-tile.property::after {
                content: '';
                position: absolute;
                inset: auto 12px 10px 12px;
                height: 4px;
                border-radius: 999px;
                background: var(--bar-color);
                box-shadow: 0 0 12px var(--bar-color);
                opacity: 0.55;
                z-index: 1;
            }
            .mono-tile.property {
                cursor: pointer;
            }
            .mono-tile:hover {
                z-index: 10;
                box-shadow:
                    0 0 28px rgba(34,211,238,0.28),
                    0 0 38px rgba(139,92,246,0.3),
                    inset 0 0 20px rgba(139,92,246,0.12),
                    0 8px 0 rgba(3,7,18,0.75);
                border-color: rgba(125,211,252,0.45);
                transform: translateY(-4px) scale(1.04);
            }
            .mono-tile.has-player {
                border-color: rgba(34,211,238,0.5);
                box-shadow:
                    0 0 18px rgba(34,211,238,0.28),
                    inset 0 0 18px rgba(34,211,238,0.08),
                    0 6px 0 rgba(3,7,18,0.75);
            }
            .mono-tile.start {
                background:
                    radial-gradient(circle at 50% 44%, rgba(34,211,238,0.2), transparent 43%),
                    linear-gradient(135deg, rgba(15,118,110,0.72), rgba(30,41,59,0.98));
                border-color: rgba(34,211,238,0.48);
            }
            .mono-tile.jail {
                background:
                    repeating-linear-gradient(45deg, rgba(251,191,36,0.12) 0 8px, rgba(15,23,42,0.08) 8px 16px),
                    linear-gradient(135deg, rgba(88,28,135,0.85), rgba(30,10,32,0.98));
                border-color: rgba(251,191,36,0.42);
            }
            .mono-tile.chance {
                background:
                    radial-gradient(circle at 50% 38%, rgba(168,85,247,0.28), transparent 46%),
                    linear-gradient(135deg, rgba(59,7,100,0.84), rgba(15,23,42,0.98));
                border-color: rgba(168,85,247,0.46);
            }
            .mono-tile.lucky {
                background:
                    radial-gradient(circle at 50% 38%, rgba(45,212,191,0.22), transparent 48%),
                    linear-gradient(135deg, rgba(8,47,73,0.86), rgba(6,78,59,0.78));
                border-color: rgba(45,212,191,0.44);
            }
            .mono-tile.tax {
                background:
                    radial-gradient(circle at 50% 34%, rgba(248,113,113,0.18), transparent 44%),
                    linear-gradient(135deg, rgba(69,10,10,0.76), rgba(15,23,42,0.98));
                border-color: rgba(248,113,113,0.38);
            }
            .mono-tile.buff {
                background:
                    radial-gradient(circle at 50% 36%, rgba(251,191,36,0.2), transparent 46%),
                    linear-gradient(135deg, rgba(113,63,18,0.78), rgba(15,23,42,0.98));
                border-color: rgba(251,191,36,0.4);
            }

            /* Corner Tiles */
            .mono-tile.corner-tile {
                background:
                    radial-gradient(circle at 50% 35%, rgba(251,191,36,0.13), transparent 45%),
                    linear-gradient(135deg, rgba(39,31,89,0.98), rgba(13,26,49,0.98));
                border-color: rgba(251,191,36,0.32);
                box-shadow:
                    inset 0 0 18px rgba(251,191,36,0.08),
                    0 6px 0 rgba(3,7,18,0.75),
                    0 0 20px rgba(139,92,246,0.14);
            }

            /* Color bars on property tiles facing center */
            .mono-color-bar {
                position: absolute;
                background: linear-gradient(90deg, rgba(255,255,255,0.35), var(--bar-color), rgba(255,255,255,0.18));
                box-shadow: 0 0 18px var(--bar-color), inset 0 0 6px rgba(255,255,255,0.38);
                z-index: 3;
            }
            .side-top .mono-color-bar { bottom: 0; left: 9px; right: 9px; height: 8px; border-radius: 999px 999px 0 0; }
            .side-right .mono-color-bar { top: 9px; left: 0; bottom: 9px; width: 8px; border-radius: 0 999px 999px 0; }
            .side-bottom .mono-color-bar { top: 0; left: 9px; right: 9px; height: 8px; border-radius: 0 0 999px 999px; }
            .side-left .mono-color-bar { top: 9px; right: 0; bottom: 9px; width: 8px; border-radius: 999px 0 0 999px; }

            .mono-step-badge {
                position: absolute;
                top: 5px;
                left: 6px;
                min-width: 19px;
                height: 19px;
                padding: 0 5px;
                border-radius: 999px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 9.5px;
                font-weight: 950;
                color: #67e8f9;
                background: rgba(2,6,23,0.82);
                border: 1px solid rgba(34,211,238,0.42);
                box-shadow: 0 0 12px rgba(34,211,238,0.22), inset 0 1px 0 rgba(255,255,255,0.12);
                z-index: 4;
            }

            .mono-tile-name {
                font-weight: 900;
                color: #f1f5f9;
                font-size: 9.2px;
                text-align: center;
                line-height: 1.14;
                max-width: 100%;
                padding: 0 2px;
                text-shadow: 0 1px 2px rgba(0,0,0,0.92), 0 0 10px rgba(148,163,184,0.14);
            }
            .corner-tile .mono-tile-name {
                font-size: 10.6px;
                color: #fde68a;
                text-shadow: 0 0 12px rgba(251,191,36,0.24);
            }
            .mono-tile-cost {
                font-size: 10px;
                font-weight: 900;
                color: #fbbf24;
                text-shadow: 0 0 8px rgba(251,191,36,0.35);
                background: rgba(2,6,23,0.62);
                border: 1px solid rgba(251,191,36,0.2);
                border-radius: 999px;
                padding: 2px 7px;
                box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
            }
            .mono-tile-owner {
                position: absolute;
                bottom: 1px; right: 1px;
                font-size: 6px;
                background: rgba(0,0,0,0.9);
                color: #94a3b8;
                padding: 1px 3px;
                border-radius: 3px;
                font-weight: bold;
                max-width: 85%;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
            }

            /* Level 2 Pro Office Styles */
            .mono-tile.level-2 {
                border: 1.5px solid rgba(0, 243, 255, 0.45) !important;
                box-shadow: inset 0 0 10px rgba(0, 243, 255, 0.1), 0 0 15px rgba(0, 243, 255, 0.1) !important;
            }
            .mono-tile.level-2 .mono-color-bar, .mono-tile.level-3 .mono-color-bar {
                animation: colorBarPulse 1.5s infinite alternate;
            }
            .level-2.side-top .mono-color-bar, .level-3.side-top .mono-color-bar { height: 8px !important; }
            .level-2.side-bottom .mono-color-bar, .level-3.side-bottom .mono-color-bar { height: 8px !important; }
            .level-2.side-left .mono-color-bar, .level-3.side-left .mono-color-bar { width: 8px !important; }
            .level-2.side-right .mono-color-bar, .level-3.side-right .mono-color-bar { width: 8px !important; }

            @keyframes colorBarPulse {
                0% { opacity: 0.7; filter: brightness(0.9); }
                100% { opacity: 1; filter: brightness(1.3); }
            }
            
            /* Level 3 VVIP Headquarters Styles */
            .mono-tile.level-3 {
                border: 1.5px solid #fbbf24 !important;
                box-shadow: inset 0 0 15px rgba(251,191,36,0.25), 0 0 20px rgba(251,191,36,0.2) !important;
                background: linear-gradient(135deg, rgba(31,10,50,0.95), rgba(15,23,42,0.95)) !important;
            }
            .mono-tile.level-3 .mono-tile-name {
                color: #fbbf24 !important;
                text-shadow: 0 0 8px rgba(251,191,36,0.3);
            }
            .mono-tile.level-3 .mono-color-bar {
                background: linear-gradient(90deg, #fbbf24, #ec4899) !important;
                box-shadow: 0 0 12px #fbbf24 !important;
            }

            /* Pawns */
            .mono-tile-pawns {
                display: flex;
                flex-wrap: wrap;
                gap: 2px;
                justify-content: center;
                margin-top: 1px;
            }
            .mono-pawn {
                width: 16px;
                height: 16px;
                border-radius: 50%;
                border: 2px solid rgba(255,255,255,0.85);
                box-shadow: 0 0 6px currentColor, 0 1px 3px rgba(0,0,0,0.6);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 7px;
                font-weight: 900;
                color: #fff;
                animation: pawnBob 1.5s ease-in-out infinite alternate;
                z-index: 5;
                position: relative;
            }
            .mono-pawn.has-chibi {
                width: 54px;
                height: 72px;
                border-radius: 0;
                border: none;
                box-shadow: none;
                background: transparent !important;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: flex-end;
                position: relative;
                animation: pawnBob 1.6s ease-in-out infinite alternate;
                z-index: 8;
            }
            .mono-pawn-chibi-wrapper {
                width: 100%;
                height: 62px;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                z-index: 2;
                filter: drop-shadow(0 4px 6px rgba(0,0,0,0.65));
            }
            .mono-pawn-chibi-wrapper svg {
                width: auto;
                height: 100%;
                max-width: 100%;
            }
            .mono-pawn-base {
                width: 32px;
                height: 8px;
                border-radius: 50%;
                margin-top: -3px;
                border: 1.5px solid rgba(255,255,255,0.85);
                z-index: 1;
                flex-shrink: 0;
            }
            @keyframes pawnBob {
                0% { transform: translateY(0) scale(1); }
                100% { transform: translateY(-4px) scale(1.03); }
            }

            /* Owner Badge inside property tile */
            .mono-owner-badge {
                font-size: 7.5px;
                font-weight: 900;
                color: #fff;
                padding: 1.5px 5px;
                border-radius: 4px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                z-index: 3;
                margin-top: 1px;
                text-shadow: 0 1px 2px rgba(0,0,0,0.8);
                border: 1px solid rgba(255,255,255,0.35);
                max-width: 90%;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            /* Floating Point Bubbles */
            .point-bubble {
                position: absolute;
                top: -24px;
                left: 50%;
                transform: translateX(-50%);
                font-weight: 900;
                font-size: 13px;
                padding: 3px 8px;
                border-radius: 12px;
                z-index: 99;
                pointer-events: none;
                white-space: nowrap;
                box-shadow: 0 4px 10px rgba(0,0,0,0.5);
                animation: pointBubbleRise 1.6s cubic-bezier(0.25, 1, 0.5, 1) forwards;
                text-shadow: 0 1px 2px rgba(0,0,0,0.8);
            }
            .point-bubble.plus {
                background: linear-gradient(135deg, #10b981, #059669);
                border: 1.5px solid #34d399;
                color: #fff;
                box-shadow: 0 0 12px rgba(16,185,129,0.5);
            }
            .point-bubble.minus {
                background: linear-gradient(135deg, #f43f5e, #e11d48);
                border: 1.5px solid #fb7185;
                color: #fff;
                box-shadow: 0 0 12px rgba(244,63,94,0.5);
            }
            @keyframes pointBubbleRise {
                0% {
                    transform: translateX(-50%) translateY(0) scale(0.6);
                    opacity: 0;
                }
                15% {
                    transform: translateX(-50%) translateY(-10px) scale(1.15);
                    opacity: 1;
                }
                80% {
                    transform: translateX(-50%) translateY(-38px) scale(1);
                    opacity: 1;
                }
                100% {
                    transform: translateX(-50%) translateY(-48px) scale(0.85);
                    opacity: 0;
                }
            }

            /* Title Deed Card Overlay in center panel */
            .title-deed-card {
                width: 92%;
                max-width: 220px;
                background: rgba(10, 15, 30, 0.96);
                border: 2px solid #fbbf24;
                box-shadow: 0 0 25px rgba(251, 191, 36, 0.35), inset 0 0 15px rgba(251,191,36,0.15);
                border-radius: 14px;
                padding: 10px;
                margin-top: 4px;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                gap: 6px;
                position: relative;
                z-index: 10;
                animation: deedPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.2) forwards;
            }
            @keyframes deedPop {
                from { transform: scale(0.8) translateY(10px); opacity: 0; }
                to { transform: scale(1) translateY(0); opacity: 1; }
            }
            .deed-header {
                padding: 6px;
                border-radius: 8px;
                text-align: center;
                position: relative;
                box-shadow: 0 2px 6px rgba(0,0,0,0.5);
                border: 1px solid rgba(255,255,255,0.15);
            }
            .deed-header-icon {
                font-size: 15px;
                margin-bottom: 2px;
            }
            .deed-header-name {
                font-size: 12px;
                font-weight: 900;
                color: #fff;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            .deed-stars {
                color: #fbbf24;
                font-size: 10px;
                font-weight: bold;
                text-shadow: 0 0 5px rgba(251,191,36,0.8);
            }
            .deed-info-box {
                background: rgba(0,0,0,0.4);
                border: 1px solid rgba(255,255,255,0.06);
                border-radius: 8px;
                padding: 6px 8px;
                font-size: 9px;
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            .deed-rent-row {
                display: flex;
                justify-content: space-between;
                color: #cbd5e1;
            }
            .deed-rent-row.active {
                color: #34d399;
                font-weight: 800;
                text-shadow: 0 0 6px rgba(52,211,153,0.3);
            }
            .deed-rent-row.inactive {
                opacity: 0.45;
            }
            .deed-footer {
                font-size: 8px;
                color: #94a3b8;
                text-align: center;
                border-top: 1px solid rgba(255,255,255,0.08);
                padding-top: 4px;
            }

            /* Center Panel - Premium Dashboard */
            .mono-center-panel {
                grid-column: 2 / 6;
                grid-row: 2 / 6;
                background:
                    radial-gradient(circle at 50% 38%, rgba(34,211,238,0.18), transparent 19%),
                    radial-gradient(ellipse at 50% 50%, rgba(139,92,246,0.24) 0%, transparent 66%),
                    linear-gradient(145deg, rgba(4,8,20,0.98), rgba(18,10,45,0.98));
                border: 1.5px solid rgba(139,92,246,0.34);
                border-radius: 22px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 12px;
                gap: 9px;
                text-align: center;
                box-shadow:
                    inset 0 0 60px rgba(0,0,0,0.7),
                    inset 0 0 0 1px rgba(255,255,255,0.05),
                    0 0 46px rgba(139,92,246,0.2),
                    0 18px 38px rgba(0,0,0,0.28);
                position: relative;
                z-index: 1;
                overflow: hidden;
            }
            .mono-center-panel::before {
                content: '';
                position: absolute;
                inset: -80%;
                background: conic-gradient(from 0deg, transparent 0%, rgba(139,92,246,0.03) 12%, transparent 25%, rgba(236,72,153,0.03) 37%, transparent 50%, rgba(6,182,212,0.03) 62%, transparent 75%, rgba(139,92,246,0.03) 87%, transparent 100%);
                animation: rotGlow 30s linear infinite;
                pointer-events: none;
            }
            .mono-center-panel::after {
                content: '';
                position: absolute;
                inset: 16px;
                border-radius: 16px;
                border: 1px dashed rgba(34,211,238,0.22);
                background:
                    linear-gradient(90deg, transparent 49%, rgba(34,211,238,0.08) 50%, transparent 51%),
                    linear-gradient(0deg, transparent 49%, rgba(236,72,153,0.06) 50%, transparent 51%);
                background-size: 34px 34px;
                pointer-events: none;
                opacity: 0.5;
            }
            @keyframes rotGlow { to { transform: rotate(360deg); } }

            /* Dice */
            .mono-dice-wrap {
                display: flex;
                gap: 18px;
                margin: 10px 0;
                perspective: 400px;
                z-index: 1;
            }
            .mono-dice {
                width: 84px;
                height: 84px;
                background:
                    radial-gradient(circle at 28% 24%, rgba(255,255,255,0.26), transparent 19%),
                    linear-gradient(145deg, #1c2365 0%, #33124b 62%, #120923 100%);
                border: 3px solid #e9d5ff;
                border-radius: 20px;
                box-shadow:
                    0 13px 0 rgba(43,16,75,0.82),
                    0 0 34px rgba(192,132,252,0.6),
                    0 0 52px rgba(34,211,238,0.14),
                    inset 0 2px 0 rgba(255,255,255,0.25),
                    inset 0 -14px 18px rgba(0,0,0,0.62);
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                transform: perspective(260px) rotateX(7deg) rotateY(-7deg);
            }
            .mono-dice::before {
                content: '';
                position: absolute;
                inset: 8px 10px auto 10px;
                height: 20px;
                border-radius: 999px;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.24), transparent);
                pointer-events: none;
            }
            .mono-dice.rolling {
                animation: diceShake3D 0.2s infinite alternate;
            }
            @keyframes diceShake3D {
                0% { transform: perspective(260px) scale(0.96) rotateX(21deg) rotateY(-18deg) rotateZ(6deg) translateY(-3px); }
                100% { transform: perspective(260px) scale(1.06) rotateX(-18deg) rotateY(18deg) rotateZ(-7deg) translateY(3px); }
            }
            .mono-dice-face {
                width: 100%;
                height: 100%;
                position: relative;
                box-sizing: border-box;
            }
            .dice-dot {
                position: absolute;
                width: 13px;
                height: 13px;
                background: #22ffff;
                box-shadow: 0 0 7px #22ffff, 0 0 18px rgba(34,255,255,0.72);
                border-radius: 50%;
                transform: translate(-50%, -50%);
            }
            .dot-center { top: 50%; left: 50%; }
            .dot-top-left { top: 25%; left: 25%; }
            .dot-top-right { top: 25%; left: 75%; }
            .dot-mid-left { top: 50%; left: 25%; }
            .dot-mid-right { top: 50%; left: 75%; }
            .dot-bottom-left { top: 75%; left: 25%; }
            .dot-bottom-right { top: 75%; left: 75%; }

            /* HUD Panels */
            .mono-hud-players, .mono-hud-logs {
                background:
                    radial-gradient(circle at 12% 0%, rgba(16,185,129,0.08), transparent 38%),
                    linear-gradient(145deg, rgba(15,23,42,0.82), rgba(20,12,48,0.74));
                border: 1px solid rgba(167,139,250,0.14);
                border-radius: 18px;
                padding: 18px;
                backdrop-filter: blur(12px);
                box-shadow: 0 16px 40px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.06);
                position: relative;
                overflow: hidden;
            }
            .mono-hud-players::before, .mono-hud-logs::before {
                content: '';
                position: absolute;
                left: 14px;
                right: 14px;
                top: 0;
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(34,211,238,0.5), transparent);
                opacity: 0.7;
            }
            .mono-hud-title {
                margin: 0 0 12px 0;
                color: #c4b5fd;
                font-size: 11px;
                font-weight: 900;
                text-transform: uppercase;
                letter-spacing: 1px;
                border-bottom: 1px solid rgba(139,92,246,0.18);
                padding-bottom: 9px;
                display: flex;
                align-items: center;
                gap: 7px;
            }
            .mono-player-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 11px 12px;
                border-radius: 12px;
                transition: all 0.25s;
                box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
            }
            .mono-log-entry {
                line-height: 1.45;
                padding: 7px 9px;
                border-radius: 8px;
                background: rgba(255,255,255,0.024);
                border-left: 2px solid rgba(139,92,246,0.22);
                box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
            }
            .mono-hud-logs {
                display: flex;
                flex-direction: column;
            }
            #mono-log-area::-webkit-scrollbar { width: 4px; }
            #mono-log-area::-webkit-scrollbar-track { background: transparent; }
            #mono-log-area::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.3); border-radius: 4px; }

            /* Overlays */
            .chance-overlay {
                position: fixed;
                top: 0; left: 0; width: 100vw; height: 100vh;
                background: rgba(0,0,0,0.88);
                z-index: 10001;
                display: flex;
                align-items: center;
                justify-content: center;
                backdrop-filter: blur(10px);
                animation: overlayFadeIn 0.3s ease;
            }
            @keyframes overlayFadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes chibiScaleIn {
                from { transform: scale(0.7) translateY(20px); opacity: 0; }
                to { transform: scale(1) translateY(0); opacity: 1; }
            }
            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-8px); }
            }
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }

            /* Monopoly Board 60-70% Grid Layout */
            .mono-layout-wrapper {
                display: flex;
                gap: 28px;
                align-items: flex-start;
                width: 100%;
                max-width: 1460px;
                margin: 0 auto;
            }
            .mono-layout-left {
                flex: 0 0 66%;
                min-width: 340px;
            }
            .mono-layout-right {
                flex: 0 0 31%;
                min-width: 285px;
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            @media (max-width: 950px) {
                .mono-layout-wrapper {
                    flex-direction: column;
                    align-items: stretch;
                }
                .mono-layout-left, .mono-layout-right {
                    flex: 1 1 100%;
                    width: 100%;
                }
            }

            /* Building models on property tiles */
            .mono-building-container {
                position: absolute;
                top: 52%;
                left: 50%;
                transform: translate(-50%, -50%);
                display: grid;
                place-items: center;
                justify-content: center;
                align-items: flex-end;
                height: 54px;
                width: 64px;
                pointer-events: none;
                z-index: 4;
                opacity: 0.95;
                animation: buildingRise 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            }
            @keyframes buildingRise {
                from { transform: translate(-50%, -14%) scale(0.35); opacity: 0; }
                to { transform: translate(-50%, -50%) scale(1); opacity: 0.95; }
            }
            .mono-building {
                position: relative;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: flex-end;
                width: 56px;
                height: 44px;
                transition: all 0.3s;
                filter: drop-shadow(0 7px 10px rgba(0,0,0,0.62));
            }
            .building-ground {
                position: absolute;
                left: 5px;
                right: 5px;
                bottom: 0;
                height: 8px;
                border-radius: 50%;
                background: radial-gradient(ellipse at center, var(--owner-color), transparent 72%);
                opacity: 0.8;
                filter: blur(1px);
            }
            .building-pad {
                position: relative;
                width: 46px;
                height: 12px;
                border-radius: 5px 5px 8px 8px;
                background: linear-gradient(180deg, #94a3b8, #334155 62%, #111827);
                border: 2px solid var(--owner-color);
                box-shadow: 0 0 12px var(--owner-color), inset 0 3px 0 rgba(255,255,255,0.22);
                transform: perspective(60px) rotateX(22deg);
                z-index: 3;
            }
            .building-rebar {
                position: absolute;
                bottom: 11px;
                width: 4px;
                height: 18px;
                border-radius: 3px;
                background: linear-gradient(180deg, #fbbf24, #64748b);
                box-shadow: 0 0 6px rgba(251,191,36,0.7);
            }
            .building-rebar.r1 { left: 14px; height: 14px; }
            .building-rebar.r2 { left: 26px; height: 21px; }
            .building-rebar.r3 { right: 13px; height: 16px; }
            .house-roof {
                width: 46px;
                height: 18px;
                clip-path: polygon(50% 0, 100% 100%, 0 100%);
                background: linear-gradient(135deg, var(--owner-color), #fbbf24);
                border-radius: 4px 4px 0 0;
                box-shadow: 0 0 12px var(--owner-color);
                z-index: 4;
                margin-bottom: -2px;
            }
            .house-body {
                position: relative;
                width: 40px;
                height: 24px;
                border-radius: 5px 5px 8px 8px;
                border: 2px solid var(--owner-color);
                background: linear-gradient(180deg, rgba(226,232,240,0.96), rgba(100,116,139,0.92));
                box-shadow: inset 0 -8px 0 rgba(15,23,42,0.25), 0 0 12px var(--owner-color);
                z-index: 3;
            }
            .house-body::before,
            .house-body::after {
                content: '';
                position: absolute;
                top: 7px;
                width: 8px;
                height: 7px;
                border-radius: 2px;
                background: #22d3ee;
                box-shadow: 0 0 8px #22d3ee;
            }
            .house-body::before { left: 7px; }
            .house-body::after { right: 7px; }
            .house-door {
                position: absolute;
                left: 50%;
                bottom: -1px;
                width: 9px;
                height: 13px;
                transform: translateX(-50%);
                border-radius: 4px 4px 2px 2px;
                background: #111827;
                border: 1px solid rgba(255,255,255,0.22);
            }
            .tower-spire {
                width: 5px;
                height: 10px;
                border-radius: 5px 5px 0 0;
                background: #fbbf24;
                box-shadow: 0 0 10px #fbbf24;
                z-index: 6;
            }
            .tower-roof {
                width: 42px;
                height: 8px;
                border-radius: 8px 8px 3px 3px;
                background: linear-gradient(90deg, #fbbf24, #ec4899, #22d3ee);
                box-shadow: 0 0 14px #fbbf24;
                z-index: 5;
            }
            .tower-body {
                position: relative;
                width: 46px;
                height: 34px;
                border-radius: 6px 6px 8px 8px;
                border: 2px solid #fbbf24;
                background:
                    repeating-linear-gradient(90deg, rgba(255,255,255,0.1) 0 2px, transparent 2px 9px),
                    linear-gradient(180deg, rgba(30,41,59,0.98), rgba(88,28,135,0.94));
                box-shadow: 0 0 16px #fbbf24, inset 0 0 12px rgba(34,211,238,0.25);
                z-index: 4;
            }
            .tower-body::before {
                content: '';
                position: absolute;
                inset: 6px 7px;
                background-image: radial-gradient(circle, #fde68a 22%, transparent 25%);
                background-size: 9px 8px;
                filter: drop-shadow(0 0 4px #fbbf24);
            }
            .villa-wing {
                position: absolute;
                bottom: 8px;
                width: 18px;
                height: 20px;
                border: 1.5px solid #ec4899;
                background: rgba(15,23,42,0.92);
                box-shadow: 0 0 9px rgba(236,72,153,0.6);
                z-index: 3;
            }
            .villa-wing.left { left: 0; border-radius: 5px 0 5px 5px; }
            .villa-wing.right { right: 0; border-radius: 0 5px 5px 5px; }
            .building-stage-label {
                position: absolute;
                right: -3px;
                bottom: -2px;
                padding: 2px 5px;
                border-radius: 999px;
                background: rgba(2,6,23,0.86);
                border: 1px solid rgba(251,191,36,0.65);
                color: #fbbf24;
                font-size: 7px;
                font-weight: 900;
                line-height: 1;
                z-index: 8;
            }
        `;
        document.head.appendChild(style);
    },

    render: async () => {
        let container = document.getElementById('games-view');
        if (!container) {
            container = document.getElementById('hub-content-monopoly');
        }
        if (!container) return;

        // Load available users for Monopoly pickers
        try {
            if (typeof DB !== 'undefined' && typeof DB.getAccounts === 'function') {
                const accounts = await DB.getAccounts() || [];
                GamesModule.monopoly.availableEmployees = accounts.filter(a => a.username !== 'admin');
            }
        } catch (e) {
            console.error("Error loading accounts:", e);
        }

        GamesModule.injectStyles();

        container.innerHTML = `
            <div class="games-container">
                <!-- Navigation Tabs -->
                <div class="games-nav-tabs">
                    <button class="games-nav-tab ${GamesModule.activeTab === 'caro' ? 'active' : ''}" onclick="GamesModule.switchTab('caro')">
                        <i class="fa-solid fa-square-check"></i> Cờ Caro 15x15
                    </button>
                    <button class="games-nav-tab ${GamesModule.activeTab === 'monopoly' ? 'active' : ''}" onclick="GamesModule.switchTab('monopoly')">
                        <i class="fa-solid fa-dice"></i> Cờ Tỷ Phú Văn Phòng
                    </button>
                </div>

                <!-- Tab Panels -->
                <div id="games-tab-content">
                    <!-- Dynamic injection -->
                </div>
            </div>
        `;

        GamesModule.renderTabContent();
    },

    switchTab: (tabId) => {
        GamesModule.activeTab = tabId;
        
        // Clean active monopoly room subscriptions if switching to Caro
        if (tabId !== 'monopoly' && GamesModule.monopoly.activeRoomId) {
            // we keep it running unless explicitly left, but let's not disconnect unless needed.
        }
        GamesModule.renderTabContent();
    },

    renderTabContent: () => {
        GamesModule.injectStyles();
        let panel = document.getElementById('games-tab-content');
        if (!panel) {
            panel = document.getElementById('hub-content-monopoly');
        }
        if (!panel) return;

        if (GamesModule.activeTab === 'caro') {
            GamesModule.renderCaro(panel);
        } else if (GamesModule.activeTab === 'monopoly') {
            GamesModule.renderMonopoly(panel);
        }
    },

    // ==========================================
    // ============= CỜ CARO ENGINE =============
    // ==========================================
    renderCaro: (container) => {
        if (GamesModule.caro.board.length === 0) {
            GamesModule.resetCaroState();
        }

        const cState = GamesModule.caro;
        let boardCellsHtml = '';

        for (let r = 0; r < cState.boardSize; r++) {
            for (let c = 0; c < cState.boardSize; c++) {
                const val = cState.board[r][c];
                const isWin = cState.winLine.some(coord => coord[0] === r && coord[1] === c);
                const cellClass = `caro-cell ${val ? 'filled ' + val : ''} ${isWin ? 'win-highlight' : ''}`;
                
                boardCellsHtml += `
                    <div class="${cellClass}" onclick="GamesModule.makeCaroMove(${r}, ${c})">
                        ${val || ''}
                    </div>
                `;
            }
        }

        container.innerHTML = `
            <div class="caro-arena">
                <!-- Caro Board -->
                <div class="caro-board-panel">
                    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 16px;">
                        <span style="font-weight: bold; font-size: 14px; color: #94a3b8; display: flex; align-items: center; gap: 8px;">
                            ⚡ Lượt đi: 
                            <span style="color: ${cState.currentPlayer === 'X' ? '#06b6d4' : '#ec4899'}; font-size: 16px; font-weight: 900;">
                                ${cState.currentPlayer === 'X' ? 'BẠN (X)' : (cState.gameMode === 'ai' ? 'SẾP AI (O)' : 'ĐỒNG NGHIỆP (O)')}
                            </span>
                        </span>
                        <span style="font-size: 12px; background: rgba(255,255,255,0.05); padding: 4px 10px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.08);">
                            Quy tắc: 5 quân thẳng hàng để Thắng
                        </span>
                    </div>

                    <div class="caro-grid">
                        ${boardCellsHtml}
                    </div>
                </div>

                <!-- Caro Sidebar controls -->
                <div class="caro-sidebar-panel">
                    <div>
                        <h4 style="margin: 0 0 12px 0; color: #fff; font-size: 15px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">⚙️ Thiết Lập Trận Đấu</h4>
                        <div style="display: flex; flex-direction: column; gap: 10px;">
                            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); padding: 12px; border-radius: 10px; transition: all 0.2s;">
                                <input type="radio" name="caro-mode" value="ai" ${cState.gameMode === 'ai' ? 'checked' : ''} onchange="GamesModule.setCaroMode('ai')" style="cursor: pointer; accent-color: #06b6d4;">
                                <div>
                                    <div style="font-weight: bold; color: #fff; font-size: 13px;">💻 Đấu với Sếp AI</div>
                                    <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Trí tuệ nhân tạo phòng ban, cực kỳ nguy hiểm</div>
                                </div>
                            </label>
                            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); padding: 12px; border-radius: 10px; transition: all 0.2s;">
                                <input type="radio" name="caro-mode" value="local" ${cState.gameMode === 'local' ? 'checked' : ''} onchange="GamesModule.setCaroMode('local')" style="cursor: pointer; accent-color: #06b6d4;">
                                <div>
                                    <div style="font-weight: bold; color: #fff; font-size: 13px;">👥 Chơi 1v1 Local</div>
                                    <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Chơi hai người chung máy tính/thiết bị</div>
                                </div>
                            </label>
                        </div>
                    </div>

                    ${(typeof Auth !== 'undefined' && Auth.currentUser && (Auth.currentUser.role === 'admin' || Auth.currentUser.username === 'admin')) ? `
                        <div style="border: 1px solid rgba(239, 68, 68, 0.25); background: rgba(239, 68, 68, 0.05); border-radius: 12px; padding: 14px; margin-top: 10px;">
                            <h4 style="margin: 0 0 10px 0; color: #ef4444; font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px;">
                                <i class="fa-solid fa-ghost"></i> Admin Hack Mode 😈
                            </h4>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                <label style="display: flex; align-items: center; justify-content: space-between; cursor: pointer; font-size: 12px; color: #cbd5e1;">
                                    <span>Bật tự động đi hộ (Hack):</span>
                                    <input type="checkbox" id="caro-hack-toggle" ${cState.hackMode ? 'checked' : ''} onchange="GamesModule.toggleCaroHack(this.checked)" style="width: 16px; height: 16px; accent-color: #ef4444; cursor: pointer;">
                                </label>
                                ${cState.hackMode ? `
                                    <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; margin-top: 4px;">
                                        <span style="color: #94a3b8;">Chọn quân tự động đi:</span>
                                        <select onchange="GamesModule.setCaroHackPlayer(this.value)" style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); color: #fff; border-radius: 4px; padding: 2px 6px; font-size: 11px; outline: none; cursor: pointer;">
                                            <option value="O" ${cState.hackPlayer === 'O' ? 'selected' : ''}>Quân O</option>
                                            <option value="X" ${cState.hackPlayer === 'X' ? 'selected' : ''}>Quân X</option>
                                        </select>
                                    </div>
                                    <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; margin-top: 6px;">
                                        <span style="color: #94a3b8; white-space: nowrap;">Độ trễ đi cờ: <strong style="color:#ef4444" id="caro-local-delay-val">${((cState.hackDelayMs || 1500) / 1000).toFixed(1)}s</strong></span>
                                        <input type="range" min="500" max="5000" step="500" value="${cState.hackDelayMs || 1500}" oninput="GamesModule.setCaroLocalDelay(this.value)" style="width: 80px; accent-color: #ef4444; height: 4px; cursor: pointer; margin: 0;">
                                    </div>
                                    <div style="color: #ef4444; font-size: 9.5px; font-style: italic; margin-top: 2px; line-height: 1.3;">
                                        * Sếp AI siêu khó sẽ tự động đi hộ khi đến lượt của quân bài được chọn.
                                    </div>
                                ` : ''}
                                <button onclick="GamesModule.makeCaroAiMove()" class="btn btn-outline" style="width: 100%; font-size: 11px; padding: 6px 12px; border-color: rgba(255,255,255,0.15); color: #fff; margin-top: 6px; display: flex; align-items: center; justify-content: center; gap: 6px; background: rgba(255,255,255,0.02);">
                                    <i class="fa-solid fa-robot"></i> Đi hộ nước cờ này 🤖
                                </button>
                            </div>
                        </div>
                    ` : ''}

                    <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 0;">

                    <div>
                        <h4 style="margin: 0 0 10px 0; color: #fff; font-size: 15px; font-weight: 800; text-transform: uppercase;">🏆 Trạng Thái Trận Đấu</h4>
                        <div style="background: rgba(0,0,0,0.25); border-radius: 12px; padding: 16px; border: 1px solid rgba(255,255,255,0.04); display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100px;">
                            ${cState.gameActive ? `
                                <div style="font-size: 28px; margin-bottom: 6px; animation: floatSparkle 1s infinite alternate;">⚔️</div>
                                <span style="font-weight: bold; color: #cbd5e1; font-size: 13px;">Trận đấu đang diễn ra...</span>
                            ` : `
                                <div style="font-size: 32px; margin-bottom: 6px;">🎉</div>
                                <span style="font-weight: 900; font-size: 16px; color: ${cState.winner === 'X' ? '#06b6d4' : '#ec4899'}; text-transform: uppercase; text-shadow: 0 0 10px currentColor; text-align: center;">
                                    ${cState.winner === 'X' ? 'BẠN ĐÃ THẮNG! 👑' : (cState.gameMode === 'ai' ? 'SẾP AI CHIẾN THẮNG! 🤖' : 'NGƯỜI CHƠI O THẮNG! 👑')}
                                </span>
                            `}
                        </div>
                    </div>

                    <button onclick="GamesModule.restartCaro()" style="width: 100%; margin-top: auto; padding: 14px; background: linear-gradient(135deg, #06b6d4, #8b5cf6); border: none; border-radius: 12px; color: #fff; font-weight: 800; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 15px rgba(6,182,212,0.3); transition: all 0.3s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                        <i class="fa-solid fa-arrow-rotate-left"></i> CHƠI VÁN MỚI
                    </button>
                </div>
            </div>
        `;
    },

    resetCaroState: () => {
        const sz = GamesModule.caro.boardSize;
        GamesModule.caro.board = Array.from({ length: sz }, () => Array(sz).fill(null));
        GamesModule.caro.currentPlayer = 'X';
        GamesModule.caro.gameActive = true;
        GamesModule.caro.winner = null;
        GamesModule.caro.winLine = [];
    },

    setCaroMode: (mode) => {
        GamesModule.caro.gameMode = mode;
        GamesModule.restartCaro();
    },

    scheduleCaroAiMove: () => {
        const cState = GamesModule.caro;
        if (cState.hackTimeout) {
            clearTimeout(cState.hackTimeout);
            cState.hackTimeout = null;
        }
        if (cState.gameActive && cState.gameMode === 'local' && cState.hackMode && cState.currentPlayer === cState.hackPlayer) {
            const delay = cState.hackDelayMs !== undefined ? cState.hackDelayMs : 1500;
            cState.hackTimeout = setTimeout(() => {
                cState.hackTimeout = null;
                GamesModule.makeCaroAiMove();
            }, delay);
        }
    },

    setCaroLocalDelay: (val) => {
        GamesModule.caro.hackDelayMs = parseInt(val) || 1500;
        const display = document.getElementById('caro-local-delay-val');
        if (display) {
            display.textContent = (GamesModule.caro.hackDelayMs / 1000).toFixed(1) + 's';
        }
    },

    toggleCaroHack: (val) => {
        GamesModule.caro.hackMode = val;
        if (!val && GamesModule.caro.hackTimeout) {
            clearTimeout(GamesModule.caro.hackTimeout);
            GamesModule.caro.hackTimeout = null;
        }
        GamesModule.scheduleCaroAiMove();
        GamesModule.renderTabContent();
    },

    setCaroHackPlayer: (player) => {
        GamesModule.caro.hackPlayer = player;
        GamesModule.scheduleCaroAiMove();
        GamesModule.renderTabContent();
    },

    restartCaro: () => {
        const cState = GamesModule.caro;
        if (cState.hackTimeout) {
            clearTimeout(cState.hackTimeout);
            cState.hackTimeout = null;
        }
        GamesModule.resetCaroState();
        GamesModule.renderTabContent();
        GamesModule.scheduleCaroAiMove();
    },

    makeCaroMove: (r, c) => {
        const cState = GamesModule.caro;
        if (!cState.gameActive || cState.board[r][c] !== null) return;

        // Chặn người dùng click thủ công khi đang là lượt của quân Hack
        if (cState.gameMode === 'local' && cState.hackMode && cState.currentPlayer === cState.hackPlayer) {
            return;
        }

        cState.board[r][c] = cState.currentPlayer;
        GamesSynth.playMove();

        if (GamesModule.checkCaroWin(r, c)) {
            cState.gameActive = false;
            cState.winner = cState.currentPlayer;
            GamesSynth.playWin();
            GamesModule.renderTabContent();
            return;
        }

        cState.currentPlayer = cState.currentPlayer === 'X' ? 'O' : 'X';
        GamesModule.renderTabContent();

        if (cState.gameActive) {
            if (cState.gameMode === 'ai' && cState.currentPlayer === 'O') {
                setTimeout(() => {
                    GamesModule.makeCaroAiMove();
                }, 400);
            } else if (cState.gameMode === 'local' && cState.hackMode && cState.currentPlayer === cState.hackPlayer) {
                GamesModule.scheduleCaroAiMove();
            }
        }
    },

    checkCaroWin: (r, c) => {
        const cState = GamesModule.caro;
        const player = cState.board[r][c];
        const directions = [
            [[0, 1], [0, -1]], 
            [[1, 0], [-1, 0]], 
            [[1, 1], [-1, -1]],
            [[1, -1], [-1, 1]] 
        ];

        for (const dir of directions) {
            let winLine = [[r, c]];
            for (const [dr, dc] of dir) {
                let nr = r + dr;
                let nc = c + dc;
                while (
                    nr >= 0 && nr < cState.boardSize &&
                    nc >= 0 && nc < cState.boardSize &&
                    cState.board[nr][nc] === player
                ) {
                    winLine.push([nr, nc]);
                    nr += dr;
                    nc += dc;
                }
            }
            if (winLine.length >= 5) {
                cState.winLine = winLine;
                return true;
            }
        }
        return false;
    },

    makeCaroAiMove: () => {
        const cState = GamesModule.caro;
        if (!cState.gameActive) return;

        let bestScore = -1;
        let bestMoves = [];

        const aiPlayer = cState.currentPlayer;
        const humanPlayer = aiPlayer === 'X' ? 'O' : 'X';

        for (let r = 0; r < cState.boardSize; r++) {
            for (let c = 0; c < cState.boardSize; c++) {
                if (cState.board[r][c] !== null) continue;

                const scoreAI = GamesModule.evaluateCaroCell(r, c, aiPlayer);
                const scoreHuman = GamesModule.evaluateCaroCell(r, c, humanPlayer);
                const defenseWeight = cState.hackMode ? 1.3 : 1.15;
                let score = scoreAI + scoreHuman * defenseWeight;

                // Ưu tiên tuyệt đối nước đi giúp mình chiến thắng ngay lập tức
                if (scoreAI >= 100000) {
                    score = 1000000 + scoreAI;
                }

                if (score > bestScore) {
                    bestScore = score;
                    bestMoves = [[r, c]];
                } else if (score === bestScore) {
                    bestMoves.push([r, c]);
                }
            }
        }

        if (bestMoves.length > 0) {
            const [r, c] = bestMoves[Math.floor(Math.random() * bestMoves.length)];
            cState.board[r][c] = aiPlayer;
            GamesSynth.playMove();

            if (GamesModule.checkCaroWin(r, c)) {
                cState.gameActive = false;
                cState.winner = aiPlayer;
                if (cState.gameMode === 'ai' && aiPlayer === 'O') {
                    GamesSynth.playLose();
                } else {
                    GamesSynth.playWin();
                }
            } else {
                cState.currentPlayer = humanPlayer;
            }
        }

        GamesModule.renderTabContent();
    },

    evaluateCaroCell: (r, c, player) => {
        const cState = GamesModule.caro;
        const board = cState.board;
        const size = cState.boardSize;
        
        const dirPairs = [
            [0, 1],   // Ngang
            [1, 0],   // Dọc
            [1, 1],   // Chéo xuống-phải
            [1, -1]   // Chéo xuống-trái
        ];
        
        let totalScore = 0;
        const opponent = player === 'X' ? 'O' : 'X';

        // Giả lập đặt quân cờ xuống để quét thế trận
        board[r][c] = player;

        for (const [dr, dc] of dirPairs) {
            // Lấy chuỗi 9 ô cờ xung quanh (r, c)
            let line = [];
            for (let i = -4; i <= 4; i++) {
                let nr = r + i * dr;
                let nc = c + i * dc;
                if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
                    line.push(board[nr][nc] || '.');
                } else {
                    line.push('#'); // Biên bảng
                }
            }
            let lineStr = line.join('');
            
            // Chuận hóa dòng: 'P' là quân mình, 'O' là quân đối thủ
            let s = lineStr.replace(new RegExp(player, 'g'), 'P')
                           .replace(new RegExp(opponent, 'g'), 'O');

            // 1. Đủ 5 quân để thắng
            if (s.includes('PPPPP')) {
                totalScore += 100000;
            }
            // 2. Bốn quân mở 2 đầu (Live 4)
            else if (s.includes('.PPPP.')) {
                totalScore += 30000;
            }
            // 3. Bốn quân bị chặn 1 đầu hoặc có lỗ hổng (Rush 4 / Gapped 4)
            else if (s.includes('PPPP.') || s.includes('.PPPP') || 
                     s.includes('P.PPP') || s.includes('PP.PP') || s.includes('PPP.P')) {
                totalScore += 8000;
            }
            // 4. Ba quân mở 2 đầu (Live 3)
            else if (s.includes('.PPP..') || s.includes('..PPP.') || 
                     s.includes('.P.PP.') || s.includes('.PP.P.')) {
                totalScore += 3000;
            }
            // 5. Ba quân bị chặn hoặc có lỗ hổng (Blocked 3)
            else if (s.includes('OPPP.') || s.includes('.PPPO') || 
                     s.includes('#PPP.') || s.includes('.PPP#') || 
                     s.includes('P.PP') || s.includes('PP.P') || s.includes('P.P.P')) {
                totalScore += 800;
            }
            // 6. Hai quân mở (Live 2)
            else if (s.includes('.PP..') || s.includes('..PP.') || s.includes('.P.P.')) {
                totalScore += 200;
            }
            // 7. Quân đơn lẻ gần trung tâm
            else if (s.includes('P')) {
                totalScore += 10;
            }
        }

        // Trả lại trạng thái ô trống
        board[r][c] = null;

        // Ưu tiên các nước đi gần trung tâm bàn cờ hơn
        const mid = size / 2;
        const dist = Math.sqrt(Math.pow(r - mid, 2) + Math.pow(c - mid, 2));
        totalScore += (mid - dist) * 0.5;

        return totalScore;
    },

    // ==========================================
    // =========== CỜ TỶ PHÚ ENGINE ============
    // ==========================================
    renderMonopoly: (container) => {
        const mState = GamesModule.monopoly;

        if (!mState.activeRoomId) {
            const overlay = document.getElementById('mono-board-overlay');
            if (overlay) overlay.remove();
            GamesModule.renderMonopolyLobby(container);
            return;
        }

        // Inside a room
        if (!mState.gameActive) {
            const overlay = document.getElementById('mono-board-overlay');
            if (overlay) overlay.remove();
            GamesModule.renderMonopolyRoomStandby(container);
            return;
        }

        // Active game board - redirect to overlay if inside Chibi lobby
        let boardContainer = container;
        if (document.getElementById('lobby-view')) {
            let overlay = document.getElementById('mono-board-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'mono-board-overlay';
                overlay.className = 'caro-modal';
                document.getElementById('lobby-view').appendChild(overlay);
            }
            boardContainer = overlay;
        }

        // Initialize visual positions local track if not present
        if (!GamesModule.monopoly.visualPositions) {
            GamesModule.monopoly.visualPositions = {};
        }
        mState.players.forEach(p => {
            if (GamesModule.monopoly.visualPositions[p.name] === undefined) {
                GamesModule.monopoly.visualPositions[p.name] = p.position;
            }
        });

        // Trigger hopping animation for any player whose visual position is catching up
        if (!mState.visualAnimationRunning) mState.visualAnimationRunning = {};

        mState.players.forEach(p => {
            if (!p.isBankrupt && GamesModule.monopoly.visualPositions[p.name] !== p.position) {
                if (!GamesModule.monopoly.visualAnimationRunning[p.name]) {
                    GamesModule.animateVisualPawn(p.name);
                }
            }
        });

        // Active game board
        const getTileHtml = (idx) => {
            const tile = mState.tiles[idx];
            const isOwned = tile.type === 'property' && tile.owner !== null;
            const isCorner = [0, 5, 10, 15].includes(idx);
            const lvl = tile.level || 1;
            
            // Level class mapping
            const lvlClass = isOwned ? `level-${lvl}` : '';

            // Determine side for color bar direction + grid position
            let sideClass = '', gridPos = '';
            if (idx >= 0 && idx <= 5) {
                gridPos = `grid-column: ${idx + 1}; grid-row: 1;`;
                sideClass = 'side-top';
            } else if (idx >= 6 && idx <= 9) {
                gridPos = `grid-column: 6; grid-row: ${idx - 4};`;
                sideClass = 'side-right';
            } else if (idx >= 10 && idx <= 15) {
                gridPos = `grid-column: ${16 - idx}; grid-row: 6;`;
                sideClass = 'side-bottom';
            } else if (idx >= 16 && idx <= 19) {
                gridPos = `grid-column: 1; grid-row: ${21 - idx};`;
                sideClass = 'side-left';
            }

            const tilePawns = mState.players
                .filter(p => !p.isBankrupt && GamesModule.monopoly.visualPositions[p.name] === idx)
                .map(p => {
                    if (typeof ChibiModule !== 'undefined' && p.chibiConfig) {
                        try {
                            const chibiSvg = ChibiModule.renderChibiSVG(p.chibiConfig, true, 50);
                            return `
                                <div class="mono-pawn has-chibi" title="${p.displayName} (@${p.name})">
                                    <div class="mono-pawn-chibi-wrapper">
                                        ${chibiSvg}
                                    </div>
                                    <div class="mono-pawn-base" style="background: ${p.color}; box-shadow: 0 0 8px ${p.color};"></div>
                                </div>
                            `;
                        } catch (e) {
                            console.error("Error rendering pawn Chibi SVG:", e);
                        }
                    }
                    return `<div class="mono-pawn" style="background:${p.color};" title="${p.displayName} (@${p.name})">${p.name.charAt(0).toUpperCase()}</div>`;
                })
                .join('');
            const hasPawns = mState.players.some(p => !p.isBankrupt && GamesModule.monopoly.visualPositions[p.name] === idx);

            // Icon markup based on level
            let levelIcon = '';
            let stars = '';
            if (isOwned) {
                if (lvl === 1) levelIcon = '🏠 ';
                else if (lvl === 2) levelIcon = '🏢 ';
                else if (lvl === 3) levelIcon = '👑 ';
                stars = '★'.repeat(lvl);
            }
            const rentValue = isOwned ? GamesModule.getTileRent(tile) : tile.rent;

            let ownerTileStyle = '';
            let ownerBadgeHtml = '';
            let buildingHtml = '';
            if (isOwned) {
                const oColor = tile.owner.color;
                if (lvl === 1) {
                    ownerTileStyle = `border: 2px solid ${oColor} !important; box-shadow: inset 0 0 8px ${oColor}25, 0 0 10px ${oColor}20 !important; background: linear-gradient(135deg, ${oColor}18, rgba(16,24,48,0.92)) !important;`;
                    buildingHtml = `
                        <div class="mono-building-container" title="Nha 1 sao - mong nha">
                            <div class="mono-building lvl-1" style="--owner-color: ${oColor}">
                                <div class="building-ground"></div>
                                <div class="building-rebar r1"></div>
                                <div class="building-rebar r2"></div>
                                <div class="building-rebar r3"></div>
                                <div class="building-pad"></div>
                                <div class="building-stage-label">1*</div>
                            </div>
                        </div>
                    `;
                } else if (lvl === 2) {
                    ownerTileStyle = `border: 2.2px solid #00f3ff !important; box-shadow: inset 0 0 10px ${oColor}25, 0 0 15px rgba(0, 243, 255, 0.4) !important; background: linear-gradient(135deg, ${oColor}18, rgba(16,24,48,0.92)) !important;`;
                    buildingHtml = `
                        <div class="mono-building-container" title="Nha 2 sao - nha cap 4">
                            <div class="mono-building lvl-2" style="--owner-color: ${oColor}">
                                <div class="building-ground"></div>
                                <div class="house-roof"></div>
                                <div class="house-body"><span class="house-door"></span></div>
                                <div class="building-stage-label">2*</div>
                            </div>
                        </div>
                    `;
                } else if (lvl === 3) {
                    ownerTileStyle = `border: 2.5px solid #fbbf24 !important; box-shadow: inset 0 0 12px ${oColor}25, 0 0 20px rgba(251, 191, 36, 0.5) !important; background: linear-gradient(135deg, rgba(31,10,50,0.95), ${oColor}15, rgba(15,23,42,0.95)) !important;`;
                    buildingHtml = `
                        <div class="mono-building-container" title="Nha 3 sao - biet thu cao oc">
                            <div class="mono-building lvl-3" style="--owner-color: ${oColor}">
                                <div class="building-ground"></div>
                                <div class="villa-wing left"></div>
                                <div class="villa-wing right"></div>
                                <div class="tower-spire"></div>
                                <div class="tower-roof"></div>
                                <div class="tower-body"></div>
                                <div class="building-stage-label">3*</div>
                            </div>
                        </div>
                    `;
                }
                ownerBadgeHtml = `
                    <div class="mono-owner-badge" style="background: ${oColor}; box-shadow: 0 0 6px ${oColor};" title="@${tile.owner.name}">
                        @${tile.owner.name.toUpperCase()}
                    </div>
                `;
            }

            let bubbleHtml = '';
            mState.players.forEach(p => {
                if (!p.isBankrupt && GamesModule.monopoly.visualPositions[p.name] === idx) {
                    const bubble = mState.pointBubbles?.[p.name];
                    if (bubble) {
                        bubbleHtml += `<div class="point-bubble ${bubble.type}">${bubble.text}</div>`;
                    }
                }
            });

            const tileClickHtml = tile.type === 'property' ? `onclick="GamesModule.selectCenterDeed('${tile.id}')"` : '';

            return `
                <div class="mono-tile ${tile.type} ${sideClass} ${lvlClass} ${isCorner ? 'corner-tile' : ''} ${hasPawns ? 'has-player' : ''}" ${tileClickHtml} style="--bar-color: ${tile.color || 'transparent'}; ${gridPos} ${ownerTileStyle}">
                    <div class="mono-step-badge">${idx}</div>
                    ${tile.type === 'property' ? '<div class="mono-color-bar"></div>' : ''}
                    <div class="mono-tile-name">${tile.name}</div>
                    ${tile.type === 'property' ? `<div class="mono-tile-cost">${levelIcon}${tile.cost}đ ${stars ? `<span style="color:#fbbf24; font-weight: 900;">${stars}</span>` : ''}</div>` : ''}
                    ${isOwned ? `<div class="mono-tile-owner" style="border-left:2px solid ${tile.owner.color}">${rentValue}đ</div>` : ''}
                    ${buildingHtml}
                    ${ownerBadgeHtml}
                    ${tilePawns ? `<div class="mono-tile-pawns">${tilePawns}</div>` : ''}
                    ${bubbleHtml}
                </div>`;
        };

        let tilesHtml = '';
        for (let i = 0; i < 20; i++) tilesHtml += getTileHtml(i);

        const activePlayer = mState.players[mState.currentPlayerIdx];
        if (!activePlayer) {
            boardContainer.innerHTML = `<div style="text-align:center; padding: 40px; color:#cbd5e1; font-weight: bold; background: rgba(0,0,0,0.2); border-radius: 12px; margin: 20px auto; max-width: 500px;">⏳ Đang đồng bộ danh sách người chơi...</div>`;
            return;
        }
        const isMyTurn = activePlayer && activePlayer.name === Auth.currentUser.username;
        const isRollLocked = mState.isRolling || mState.awaitingAction || mState.isMovingSequentially;

        // Custom Dice rendering HTML
        const getDiceFaceHtml = (v) => {
            const dotCenters = {
                1: ['dot-center'],
                2: ['dot-top-left', 'dot-bottom-right'],
                3: ['dot-top-left', 'dot-center', 'dot-bottom-right'],
                4: ['dot-top-left', 'dot-top-right', 'dot-bottom-left', 'dot-bottom-right'],
                5: ['dot-top-left', 'dot-top-right', 'dot-center', 'dot-bottom-left', 'dot-bottom-right'],
                6: ['dot-top-left', 'dot-top-right', 'dot-mid-left', 'dot-mid-right', 'dot-bottom-left', 'dot-bottom-right']
            };
            const dots = dotCenters[v] || [];
            return `
                <div class="mono-dice ${mState.isRolling ? 'rolling' : ''}">
                    <div class="mono-dice-face">
                        ${dots.map(d => `<span class="dice-dot ${d}"></span>`).join('')}
                    </div>
                </div>
            `;
        };

        const centerPanelHtml = `
            <div class="mono-center-panel">
                <div style="font-size: 18px; font-weight: 900; color: #a78bfa; letter-spacing: 2px; text-transform: uppercase; text-shadow: 0 0 20px rgba(167,139,250,0.35); position: relative; z-index: 1;">
                    🎲 CỜ TỶ PHÚ
                </div>
                <div style="font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 2px; position: relative; z-index: 1; font-weight: 700; margin-bottom: 2px;">ONLINE REAL-TIME</div>

                <div style="display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,0.5); padding: 6px 12px; border-radius: 20px; border: 1.5px solid ${activePlayer.color}; box-shadow: 0 0 12px ${activePlayer.color}35; position: relative; z-index: 1; max-width: 90%;">
                    <div style="width: 22px; height: 22px; border-radius: 50%; background: ${activePlayer.color}; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 10px; color: #fff; box-shadow: 0 0 8px ${activePlayer.color}; flex-shrink: 0;">
                        ${activePlayer.name.charAt(0).toUpperCase()}
                    </div>
                    <div style="overflow: hidden; text-align: left;">
                        <div style="font-weight: 800; font-size: 11px; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">@${activePlayer.name}</div>
                        <div style="font-size: 8px; color: #94a3b8;">${activePlayer.displayName} ${activePlayer.isJailed ? '🔒' : ''}</div>
                    </div>
                </div>

                <div class="mono-dice-wrap" style="margin: 10px 0;">
                    ${mState.diceValues.map(v => getDiceFaceHtml(v)).join('')}
                </div>

                ${mState.isRolling ? `
                    <div style="font-size: 10px; color: #ec4899; font-weight: 900; animation: pulse 0.5s infinite alternate; z-index: 1;">
                        🔥 ĐANG LẮC XÚC XẮC...
                    </div>
                ` : ''}

                <div style="width: 100%; max-width: 200px; position: relative; z-index: 1; margin-top: 6px;">
                    ${isMyTurn ? `
                        <button onclick="GamesModule.rollMonopolyDice()" ${isRollLocked ? 'disabled' : ''} style="width: 100%; padding: 12px; background: linear-gradient(135deg, #8b5cf6, #ec4899); border: none; border-radius: 12px; color: #fff; font-weight: 900; font-size: 14px; cursor: ${isRollLocked ? 'not-allowed' : 'pointer'}; opacity: ${isRollLocked ? '0.58' : '1'}; box-shadow: 0 4px 20px rgba(139,92,246,0.4); text-transform: uppercase; letter-spacing: 1px; transition: all 0.2s;" onmouseover="if(!this.disabled){this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 25px rgba(139,92,246,0.5)'}" onmouseout="this.style.transform=''; this.style.boxShadow='0 4px 20px rgba(139,92,246,0.4)'">
                            🎲 ĐỔ XÚC XẮC
                        </button>
                    ` : `
                        <div style="width: 100%; padding: 12px; background: rgba(255,255,255,0.02); border: 1.5px dashed rgba(255,255,255,0.08); border-radius: 12px; color: #64748b; font-size: 11px; font-weight: 700; text-align: center;">
                            ⏳ Đợi lượt @${activePlayer.name}...
                        </div>
                    `}
                </div>
            </div>
        `;

        boardContainer.innerHTML = `
            <div class="mono-arena">
                <div class="mono-match-header">
                    <h3 class="mono-match-title">
                        <span style="font-size: 20px;">🎲</span> CỜ TỶ PHÚ VĂN PHÒNG
                        <span style="font-size: 8px; background: linear-gradient(135deg, rgba(16,185,129,0.2), rgba(6,182,212,0.2)); color: #10b981; padding: 3px 8px; border-radius: 10px; font-weight: 800; border: 1px solid rgba(16,185,129,0.3); animation: pulse 2s infinite;">🔴 LIVE</span>
                    </h3>
                    <button class="mono-leave-btn" onclick="GamesModule.leaveOnlineRoom()">
                        🚪 RỜI PHÒNG
                    </button>
                </div>

                <div class="mono-layout-wrapper">
                    <div class="mono-layout-left">
                        <div class="mono-board">
                            ${tilesHtml}
                            ${centerPanelHtml}
                        </div>
                    </div>

                    <div class="mono-layout-right">
                        <div class="mono-hud-players">
                            <h4 class="mono-hud-title">
                                👑 BẢNG XẾP HẠNG CÔNG ĐỨC
                            </h4>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                ${mState.players.map((p, idx) => `
                                    <div class="mono-player-row" style="background: ${idx === mState.currentPlayerIdx && !p.isBankrupt ? `linear-gradient(135deg, ${p.color}18, ${p.color}07)` : 'rgba(255,255,255,0.018)'}; border: 1.5px solid ${idx === mState.currentPlayerIdx && !p.isBankrupt ? p.color + '52' : 'rgba(255,255,255,0.05)'}; opacity: ${p.isBankrupt ? '0.35' : '1'};">
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <div style="width: 26px; height: 26px; border-radius: 50%; background: ${p.color}; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 900; color: #fff; box-shadow: 0 0 8px ${p.color}50; flex-shrink: 0;">
                                                ${p.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div style="font-weight: 800; font-size: 12px; color: ${idx === mState.currentPlayerIdx && !p.isBankrupt ? '#fff' : '#cbd5e1'};">@${p.name}</div>
                                                <div style="font-size: 9px; color: #64748b;">${p.displayName} ${p.isBankrupt ? '💀' : (p.isJailed ? '🔒' : '')}</div>
                                            </div>
                                        </div>
                                        <div style="text-align: right;">
                                            <div style="font-weight: 900; font-size: 15px; color: ${p.isBankrupt ? '#475569' : '#fbbf24'}; text-shadow: ${p.isBankrupt ? 'none' : '0 0 6px rgba(251,191,36,0.2)'};">
                                                ${p.isBankrupt ? '0' : p.cash}đ
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <div class="mono-hud-logs">
                            <h4 class="mono-hud-title">
                                📜 NHẬT KÝ TRẬN ĐẤU
                            </h4>
                            <div id="mono-log-area" style="flex: 1; max-height: 200px; min-height: 120px; overflow-y: auto; display: flex; flex-direction: column; gap: 5px; font-size: 11px; color: #94a3b8; padding-right: 4px;">
                                ${mState.logs.map(log => `
                                    <div class="mono-log-entry">
                                        ${log}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const logArea = document.getElementById('mono-log-area');
        if (logArea) {
            // Ensure visual rendering completes before scrolling
            requestAnimationFrame(() => {
                logArea.scrollTop = logArea.scrollHeight;
            });
        }
    },

    getTileRent: (tile) => {
        const baseRent = tile.rent || 1;
        const lvl = tile.level || 1;
        if (lvl === 1) return baseRent;
        if (lvl === 2) return Math.round(baseRent * 2.2 * 10) / 10;
        return Math.round(baseRent * 4.5 * 10) / 10;
    },

    getTileUpgradeCost: (tile) => {
        return Math.round((tile.cost || 5) * 0.8);
    },

    getMonopolyRollInfo: (rollInput) => {
        const diceValues = Array.isArray(rollInput?.diceValues)
            ? rollInput.diceValues.map(v => Number(v))
            : (Array.isArray(GamesModule.monopoly.diceValues) ? GamesModule.monopoly.diceValues.map(v => Number(v)) : []);
        const safeDiceValues = diceValues.length === 2 && diceValues.every(v => Number.isInteger(v) && v >= 1 && v <= 6)
            ? diceValues
            : null;
        const total = safeDiceValues
            ? safeDiceValues[0] + safeDiceValues[1]
            : Number(rollInput?.total ?? rollInput);

        const fallbackFirstDie = Number.isInteger(total) && total >= 2
            ? Math.max(1, Math.min(6, total - 1))
            : 1;
        const fallbackSecondDie = Number.isInteger(total) && total >= 2
            ? Math.max(1, Math.min(6, total - fallbackFirstDie))
            : 1;

        return {
            diceValues: safeDiceValues || [fallbackFirstDie, fallbackSecondDie],
            total,
            isDouble: !!safeDiceValues && safeDiceValues[0] === safeDiceValues[1],
            isValid: Number.isInteger(total) && total > 0
        };
    },

    calculateMonopolyMove: (startPosition, steps, boardSize = 20) => {
        const start = Number(startPosition) || 0;
        const totalSteps = Number(steps) || 0;
        const size = Number(boardSize) || 20;
        return {
            start,
            steps: totalSteps,
            end: ((start + totalSteps) % size + size) % size,
            passedStart: start + totalSteps >= size
        };
    },

    pickWeightedMonopolyCard: (deck) => {
        const totalWeight = deck.reduce((sum, card) => sum + (card.weight || 1), 0);
        let roll = Math.random() * totalWeight;
        for (const card of deck) {
            roll -= card.weight || 1;
            if (roll <= 0) return card;
        }
        return deck[deck.length - 1];
    },

    executeMonopolyMoveToTile: async (player, targetTileId, reason = 'special-move') => {
        const mState = GamesModule.monopoly;
        const target = Number(targetTileId);
        if (!Number.isInteger(target) || target < 0 || target >= mState.tiles.length) return;

        const from = player.position;
        const distance = (target - from + mState.tiles.length) % mState.tiles.length;
        const move = GamesModule.calculateMonopolyMove(from, distance, mState.tiles.length);
        move.end = target;
        move.passedStart = target === 0 || from + distance >= mState.tiles.length;

        mState.visualPositions = mState.visualPositions || {};
        mState.visualAnimationRunning = mState.visualAnimationRunning || {};
        mState.visualPositions[player.name] = from;
        delete mState.visualAnimationRunning[player.name];

        player.position = target;
        mState.isMovingSequentially = distance > 0;
        mState.movementLockEndTime = Date.now() + (Math.max(distance, 1) * 320) + 1200;
        mState.awaitingAction = true;
        mState.lastMove = {
            id: `${player.name}_${Date.now()}_${from}_${target}_${reason}`,
            playerName: player.name,
            from,
            to: target,
            roll: distance,
            diceValues: [...(mState.diceValues || [1, 1])],
            passedStart: move.passedStart,
            reason
        };

        if (move.passedStart) {
            const bonus = mState.startBonus || 5;
            player.cash += bonus;
            mState.logs.push(`START BONUS: <b>@${player.name}</b> moved through Start and received +${bonus}d.`);
        }

        const tile = mState.tiles[player.position];
        mState.logs.push(`SPECIAL MOVE: <b>@${player.name}</b> moved to <b>${tile.name}</b>.`);

        await GamesModule.syncRoomToFirestore();
        GamesModule.renderTabContent();

        if (distance === 0) {
            mState.isMovingSequentially = false;
            mState.movementLockEndTime = null;
            mState.awaitingAction = false;
            await GamesModule.executeTileAction(player);
        }
    },

    animateVisualPawn: (playerName) => {
        const mState = GamesModule.monopoly;
        const player = mState.players.find(p => p.name === playerName);
        if (!player) return;

        if (!mState.visualAnimationRunning) mState.visualAnimationRunning = {};
        if (mState.visualAnimationRunning[playerName]) return; 
        
        mState.visualAnimationRunning[playerName] = true;

        const step = () => {
            const p = mState.players.find(x => x.name === playerName);
            if (!p) {
                delete mState.visualAnimationRunning[playerName];
                return;
            }

            const visualPos = mState.visualPositions[playerName] ?? p.position;
            const targetPos = p.position;

            if (visualPos !== targetPos) {
                mState.visualPositions[playerName] = (visualPos + 1) % 20;
                GamesSynth.playMove();

                let container = document.getElementById('games-view') || document.getElementById('hub-content-monopoly');
                if (container) {
                    GamesModule.renderMonopoly(container);
                }

                setTimeout(step, 280);
            } else {
                delete mState.visualAnimationRunning[playerName];

                const activePlayer = mState.players[mState.currentPlayerIdx];
                if (playerName === activePlayer?.name) {
                    mState.isMovingSequentially = false;
                    mState.movementLockEndTime = null;

                    const destTile = mState.tiles[activePlayer.position];
                    if (destTile && destTile.type === 'property') {
                        mState.centerDeedTileId = destTile.id;
                    } else {
                        mState.centerDeedTileId = null;
                    }
                    let container = document.getElementById('games-view') || document.getElementById('hub-content-monopoly');
                    if (container) GamesModule.renderMonopoly(container);
                }

                const isMyTurn = activePlayer && activePlayer.name === Auth.currentUser.username;
                if (isMyTurn && playerName === activePlayer.name && mState.awaitingAction) {
                    mState.awaitingAction = false;
                    GamesModule.executeTileAction(activePlayer);
                }
            }
        };

        setTimeout(step, 100);
    },

    executeTileAction: async (player) => {
        const mState = GamesModule.monopoly;
        const tile = mState.tiles[player.position];

        if (tile.type === 'property') {
            GamesModule.handlePropertyTile(player, tile);
        } else if (tile.type === 'tax') {
            player.cash = Math.max(0, player.cash - tile.cost);
            mState.logs.push(`💸 <b>@${player.name}</b> ${tile.desc}. Trừ ${tile.cost}đ Công Đức!`);
            GamesModule.checkBankruptcy(player);
            await GamesModule.finishMonopolyTurn();
        } else if (tile.type === 'buff') {
            player.cash += mState.startBonus || 5;
            mState.logs.push(`🍔 <b>@${player.name}</b> ${tile.desc}. Cộng +${mState.startBonus || 5}đ Công Đức!`);
            await GamesModule.finishMonopolyTurn();
        } else if (tile.type === 'jail') {
            player.isJailed = true;
            player.jailTurns = 2;
            mState.logs.push(`🔒 Cảnh báo! <b>@${player.name}</b> bị HR phát hiện Đi Muộn không lý do! Bị tạm giam phạt đứng tại đây.`);
            await GamesModule.finishMonopolyTurn();
        } else if (tile.type === 'chance' || tile.type === 'lucky') {
            GamesModule.drawMonopolyCardV2(player, tile.type);
        } else {
            // Check if START tile (position 0)
            if (player.position === 0) {
                const upgradeableTiles = mState.tiles.filter(t => t.type === 'property' && t.owner && t.owner.name === player.name && (t.level || 1) < 3);
                if (upgradeableTiles.length > 0) {
                    GamesModule.renderStartDistanceUpgradeModal(player, upgradeableTiles);
                    return; // Don't finish turn yet! Wait for modal choice
                }
            }
            await GamesModule.finishMonopolyTurn();
        }
    },

    renderMonopolyUpgradeModal: (player, tile) => {
        const overlay = document.createElement('div');
        overlay.id = 'mono-upgrade-overlay';
        overlay.className = 'chance-overlay';
        overlay.style.zIndex = '99999';

        const currentLvl = tile.level || 1;
        const nextLvl = currentLvl + 1;
        const upgradeCost = GamesModule.getTileUpgradeCost(tile);
        const nextRent = GamesModule.getTileRent({ ...tile, level: nextLvl });
        const canAfford = player.cash >= upgradeCost;

        overlay.innerHTML = `
            <div style="background: rgba(15,23,42,0.96); border: 2px solid #a855f7; border-radius: 16px; padding: 24px; max-width: 400px; width: 90%; text-align: center; box-shadow: 0 0 30px rgba(168,85,247,0.4); color: #fff;">
                <div style="font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: bold; margin-bottom: 6px;">Nâng Cấp Phòng Ban</div>
                <h3 style="margin: 0; color: #a855f7; font-size: 20px; font-weight: 900;">${tile.name}</h3>
                
                <div style="margin: 20px 0; background: rgba(0,0,0,0.3); padding: 14px; border-radius: 10px; text-align: left; font-size: 13px; line-height: 1.6;">
                    <div style="display:flex; justify-content:space-between; margin-bottom: 6px;">
                        <span>Cấp độ hiện tại:</span>
                        <strong style="color: #cbd5e1;">Cấp ${currentLvl} ${'★'.repeat(currentLvl)}</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-bottom: 6px;">
                        <span>Chi phí nâng cấp:</span>
                        <strong style="color: #fbbf24;">${upgradeCost}đ Công Đức</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-bottom: 6px;">
                        <span>Điểm thuê hiện tại:</span>
                        <strong style="color: #94a3b8;">${GamesModule.getTileRent(tile)}đ</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between;">
                        <span>Điểm thuê mới (Cấp ${nextLvl}):</span>
                        <strong style="color: #10b981;">${nextRent}đ Công Đức</strong>
                    </div>
                </div>

                <div style="font-size: 12px; margin-bottom: 20px; color: ${canAfford ? '#38bdf8' : '#f87171'}; font-weight: bold;">
                    Số dư hiện tại của bạn: ${player.cash}đ Công Đức 
                    ${canAfford ? '(Đủ điều kiện)' : '(Không đủ điểm)'}
                </div>

                <div style="display: flex; gap: 10px;">
                    <button onclick="GamesModule.upgradeProperty('${tile.id}')" ${!canAfford ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''} style="flex: 1; padding: 12px; background: linear-gradient(135deg, #10b981, #059669); border: none; border-radius: 8px; color: #fff; font-weight: bold; cursor: pointer;">
                        ⭐ NÂNG CẤP
                    </button>
                    <button onclick="GamesModule.skipUpgrade()" style="flex: 1; padding: 12px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #cbd5e1; font-weight: bold; cursor: pointer;">
                        ❌ BỎ QUA
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
    },

    upgradeProperty: async (tileId) => {
        const mState = GamesModule.monopoly;
        const player = mState.players[mState.currentPlayerIdx];
        const tile = mState.tiles.find(t => t.id === parseInt(tileId, 10));

        if (tile && tile.owner && tile.owner.name === player.name) {
            const cost = GamesModule.getTileUpgradeCost(tile);
            if (player.cash >= cost) {
                player.cash -= cost;
                tile.level = (tile.level || 1) + 1;
                mState.logs.push(`⭐ <b>@${player.name}</b> đã nâng cấp thành công <b>${tile.name}</b> lên Cấp ${tile.level} (${'★'.repeat(tile.level)})!`);
                GamesSynth.playWin();
            }
        }

        document.getElementById('mono-upgrade-overlay')?.remove();
        await GamesModule.finishMonopolyTurn();
    },

    skipUpgrade: async () => {
        const mState = GamesModule.monopoly;
        const player = mState.players[mState.currentPlayerIdx];
        mState.logs.push(`💨 <b>@${player.name}</b> giữ nguyên cấp độ phòng ban hiện tại.`);
        document.getElementById('mono-upgrade-overlay')?.remove();
        await GamesModule.finishMonopolyTurn();
    },

    triggerPointBubble: (username, text, type) => {
        if (!GamesModule.monopoly.pointBubbles) GamesModule.monopoly.pointBubbles = {};
        GamesModule.monopoly.pointBubbles[username] = { text, type };
        
        let container = document.getElementById('games-view') || document.getElementById('hub-content-monopoly');
        if (container) GamesModule.renderMonopoly(container);

        setTimeout(() => {
            if (GamesModule.monopoly.pointBubbles?.[username]) {
                delete GamesModule.monopoly.pointBubbles[username];
                if (container) GamesModule.renderMonopoly(container);
            }
        }, 1600);
    },

    renderStartDistanceUpgradeModal: (player, tiles) => {
        const overlay = document.createElement('div');
        overlay.id = 'mono-start-upgrade-overlay';
        overlay.className = 'chance-overlay';
        overlay.style.zIndex = '99999';

        overlay.innerHTML = `
            <div style="background: rgba(15,23,42,0.96); border: 2px solid #10b981; border-radius: 16px; padding: 24px; max-width: 400px; width: 90%; text-align: center; box-shadow: 0 0 35px rgba(16,185,129,0.5); color: #fff;">
                <div style="font-size: 32px; margin-bottom: 6px;">🚩 Thần Tài Gõ Cửa!</div>
                <div style="font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: bold; margin-bottom: 6px;">Đặc Quyền Tại Ô Bắt Đầu</div>
                <p style="font-size: 13px; color: #cbd5e1; margin-bottom: 20px;">
                    Bạn đã dừng chân chính xác tại ô <b>BẮT ĐẦU</b>! Bạn được đặc quyền chi điểm Công Đức để nâng cấp từ xa cho một bất động sản đã sở hữu.
                </p>

                <div style="max-height: 200px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px;">
                    ${tiles.map(t => {
                        const nextLvl = (t.level || 1) + 1;
                        const cost = GamesModule.getTileUpgradeCost(t);
                        const canAfford = player.cash >= cost;
                        return `
                            <button onclick="GamesModule.upgradeStartProperty('${t.id}')" ${!canAfford ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''} style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(16,185,129,0.1); border: 1.5px solid rgba(16,185,129,0.3); border-radius: 10px; cursor: pointer; color: #fff; width: 100%; transition: all 0.2s;" onmouseover="this.style.background='rgba(16,185,129,0.25)'" onmouseout="this.style.background='rgba(16,185,129,0.1)'">
                                <div style="text-align: left;">
                                    <div style="font-weight: bold; font-size: 13px;">${t.name}</div>
                                    <div style="font-size: 10px; color: #a78bfa;">Cấp ${t.level || 1} ➔ Cấp ${nextLvl}</div>
                                </div>
                                <div style="font-weight: bold; font-size: 12px; color: #fbbf24;">${cost}đ</div>
                            </button>
                        `;
                    }).join('')}
                </div>

                <button onclick="GamesModule.skipStartDistanceUpgrade()" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #cbd5e1; font-weight: bold; cursor: pointer;">
                    ❌ BỎ QUA ĐẶC QUYỀN
                </button>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    upgradeStartProperty: async (tileId) => {
        const mState = GamesModule.monopoly;
        const player = mState.players[mState.currentPlayerIdx];
        const tile = mState.tiles.find(t => t.id === parseInt(tileId, 10));

        if (tile && tile.owner && tile.owner.name === player.name) {
            const cost = GamesModule.getTileUpgradeCost(tile);
            if (player.cash >= cost) {
                player.cash -= cost;
                tile.level = (tile.level || 1) + 1;
                mState.logs.push(`🚩⭐ <b>@${player.name}</b> đã kích hoạt đặc quyền ô BẮT ĐẦU nâng cấp từ xa <b>${tile.name}</b> lên Cấp ${tile.level} (${'★'.repeat(tile.level)})!`);
                GamesSynth.playWin();
            }
        }

        document.getElementById('mono-start-upgrade-overlay')?.remove();
        await GamesModule.finishMonopolyTurn();
    },

    skipStartDistanceUpgrade: async () => {
        document.getElementById('mono-start-upgrade-overlay')?.remove();
        await GamesModule.finishMonopolyTurn();
    },

    renderMonopolyJailModal: (player) => {
        const overlay = document.createElement('div');
        overlay.id = 'mono-jail-overlay';
        overlay.className = 'chance-overlay';
        overlay.style.zIndex = '99999';

        const bailCost = 2;
        const canAffordBail = player.cash >= bailCost;
        const turnsLeft = player.jailTurns || 2;

        overlay.innerHTML = `
            <div style="background: rgba(15,23,42,0.96); border: 2px solid #ec4899; border-radius: 16px; padding: 24px; max-width: 400px; width: 90%; text-align: center; box-shadow: 0 0 35px rgba(236,72,153,0.5); color: #fff;">
                <div style="font-size: 32px; margin-bottom: 6px;">🔒 Phạt Đi Muộn!</div>
                <div style="font-size: 11px; text-transform: uppercase; color: #ec4899; font-weight: bold; margin-bottom: 6px;">Đang Bị HR Tạm Giữ (Còn lại ${turnsLeft} lượt)</div>
                <p style="font-size: 13px; color: #cbd5e1; margin-bottom: 20px;">
                    Bạn đang đứng tại khu vực Tạm Giam của HR. Hãy lựa chọn phương án để thoát án phạt:
                </p>

                <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;">
                    <button onclick="GamesModule.payMonopolyJailBail()" ${!canAffordBail ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''} style="padding: 14px; background: linear-gradient(135deg, #10b981, #059669); border: none; border-radius: 10px; color: #fff; font-weight: bold; cursor: pointer; transition: all 0.2s; font-size: 12.5px;">
                        💸 NỘP PHẠT ${bailCost}đ CÔNG ĐỨC (Thoát ngay)
                    </button>
                    <button onclick="GamesModule.attemptMonopolyJailDoubleRoll()" style="padding: 14px; background: linear-gradient(135deg, #8b5cf6, #ec4899); border: none; border-radius: 10px; color: #fff; font-weight: bold; cursor: pointer; transition: all 0.2s; font-size: 12.5px;">
                        🎲 THỬ VẬN MAY ĐỔ CÚ ĐÚP (Miễn phí)
                    </button>
                </div>

                <div style="font-size: 11px; color: #94a3b8; font-style: italic;">
                    Chú ý: Thử vận may không ra cú đúp sẽ mất lượt giam giữ. Hết 2 lượt sẽ được tự do miễn phí!
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    payMonopolyJailBail: async () => {
        const mState = GamesModule.monopoly;
        const player = mState.players[mState.currentPlayerIdx];
        
        player.cash = Math.max(0, player.cash - 2);
        player.isJailed = false;
        player.jailTurns = 0;
        mState.logs.push(`💸 <b>@${player.name}</b> đã nộp phạt 2đ Công Đức để thoát khỏi án Phạt đi muộn lập tức.`);
        
        mState.jailChoiceMade = true;
        mState.jailRollAttempt = false;

        document.getElementById('mono-jail-overlay')?.remove();
        GamesModule.rollMonopolyDice();
    },

    attemptMonopolyJailDoubleRoll: async () => {
        const mState = GamesModule.monopoly;
        mState.jailChoiceMade = true;
        mState.jailRollAttempt = true;

        document.getElementById('mono-jail-overlay')?.remove();
        GamesModule.rollMonopolyDice();
    },

    selectCenterDeed: (tileId) => {
        const mState = GamesModule.monopoly;
        if (tileId === null) return;
        const tile = mState.tiles.find(t => t.id === parseInt(tileId, 10));
        if (tile && tile.type === 'property') {
            GamesModule.renderMonopolyInspectDeedModal(tile);
        }
    },

    renderMonopolyInspectDeedModal: (tile) => {
        const overlay = document.createElement('div');
        overlay.id = 'mono-inspect-deed-overlay';
        overlay.className = 'chance-overlay';
        overlay.style.zIndex = '99999';
        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
        };

        const deedHtml = GamesModule.renderTitleDeedCardHtml(tile);

        overlay.innerHTML = `
            <div style="position: relative; animation: modalPop 0.3s ease; max-width: 280px; width: 90%;">
                ${deedHtml}
                <button onclick="document.getElementById('mono-inspect-deed-overlay')?.remove()" style="position: absolute; top: -10px; right: -10px; width: 28px; height: 28px; border-radius: 50%; background: #ef4444; border: 2px solid #fff; color: #fff; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.5); z-index: 101;">
                    ✕
                </button>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    renderTitleDeedCardHtml: (tile) => {
        const isOwned = tile.owner !== null;
        const lvl = tile.level || 1;
        const baseRent = tile.rent;
        const rent2 = Math.round(baseRent * 2.2);
        const rent3 = Math.round(baseRent * 4.5);
        
        let starsHtml = '★'.repeat(lvl);
        let levelIcon = '🏠';
        if (lvl === 2) levelIcon = '🏢';
        else if (lvl === 3) levelIcon = '👑';

        let ownerText = isOwned ? `Đã sở hữu bởi @${tile.owner.name}` : 'Đất công chưa sở hữu';

        return `
            <div class="title-deed-card" style="border-color: ${tile.color || '#fbbf24'};">
                <div class="deed-header" style="background: ${tile.color || '#1e293b'};">
                    <div class="deed-header-icon">${levelIcon}</div>
                    <div class="deed-header-name">${tile.name}</div>
                    <div class="deed-stars">${starsHtml}</div>
                </div>
                <div class="deed-info-box">
                    <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-weight:800; color:#fbbf24; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:2px;">
                        <span>Giá nhượng quyền:</span>
                        <span>${tile.cost}đ Công Đức</span>
                    </div>
                    <div class="deed-rent-row ${lvl === 1 ? 'active' : 'inactive'}">
                        <span>Cấp 1 (Phòng thô):</span>
                        <span>${baseRent}đ</span>
                    </div>
                    <div class="deed-rent-row ${lvl === 2 ? 'active' : 'inactive'}">
                        <span>Cấp 2 (Pro Office):</span>
                        <span>${rent2}đ</span>
                    </div>
                    <div class="deed-rent-row ${lvl === 3 ? 'active' : 'inactive'}">
                        <span>Cấp 3 (VVIP Suite):</span>
                        <span>${rent3}đ</span>
                    </div>
                </div>
                <div class="deed-footer">
                    <span style="color: ${isOwned ? tile.owner.color : '#94a3b8'}; font-weight:800;">
                        ${ownerText}
                    </span>
                </div>
                <!-- Close Button to return to normal logo view -->
                <button onclick="event.stopPropagation(); GamesModule.selectCenterDeed(null)" style="position:absolute; top:-6px; right:-6px; width:18px; height:18px; border-radius:50%; background:#ef4444; border:none; color:#fff; font-size:9px; font-weight:bold; display:flex; align-items:center; justify-content:center; box-shadow: 0 0 6px #ef4444; cursor: pointer;">
                    ×
                </button>
            </div>
        `;
    },

    getTileTotalSpent: (tile) => {
        const cost = tile.cost || 5;
        const upgradeCost = Math.round(cost * 0.8);
        const lvl = tile.level || 1;
        return cost + (lvl - 1) * upgradeCost;
    },

    renderMonopolyBuyoutModal: (player, tile, rent, buyoutCost) => {
        const overlay = document.createElement('div');
        overlay.id = 'mono-buyout-overlay';
        overlay.className = 'chance-overlay';
        overlay.style.zIndex = '99999';

        const canAfford = player.cash >= buyoutCost;

        overlay.innerHTML = `
            <div style="background: rgba(15,23,42,0.96); border: 2px solid #ef4444; border-radius: 16px; padding: 24px; max-width: 400px; width: 90%; text-align: center; box-shadow: 0 0 30px rgba(239,68,68,0.4); color: #fff;">
                <div style="font-size: 11px; text-transform: uppercase; color: #f87171; font-weight: bold; margin-bottom: 6px;">Cướp Quyền Sở Hữu</div>
                <h3 style="margin: 0; color: #ef4444; font-size: 20px; font-weight: 900;">💥 MUA LẠI PHÒNG BAN</h3>
                <p style="font-size: 13px; color: #cbd5e1; margin-top: 8px;">
                    Bạn đã trả <strong>${rent}đ</strong> tiền thuê. Bạn có muốn bỏ thêm tiền mua đứt phòng ban <strong>${tile.name}</strong> từ <strong>@${tile.owner.name}</strong> không?
                </p>

                <div style="margin: 20px 0; background: rgba(0,0,0,0.3); padding: 14px; border-radius: 10px; text-align: left; font-size: 13px; line-height: 1.6;">
                    <div style="display:flex; justify-content:space-between; margin-bottom: 6px;">
                        <span>Tổng vốn đối thủ đã xây:</span>
                        <strong style="color: #cbd5e1;">${GamesModule.getTileTotalSpent(tile)}đ</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 6px;">
                        <span>Giá mua lại (1.4x):</span>
                        <strong style="color: #fbbf24; font-size: 15px;">${buyoutCost}đ Công Đức</strong>
                    </div>
                </div>

                <div style="font-size: 12px; margin-bottom: 20px; color: ${canAfford ? '#38bdf8' : '#f87171'}; font-weight: bold;">
                    Số dư hiện tại của bạn: ${player.cash}đ Công Đức 
                    ${canAfford ? '(Đủ điều kiện)' : '(Không đủ điểm để mua lại)'}
                </div>

                <div style="display: flex; gap: 10px;">
                    <button onclick="GamesModule.buyoutProperty('${tile.id}', ${buyoutCost})" ${!canAfford ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''} style="flex: 1; padding: 12px; background: linear-gradient(135deg, #ef4444, #b91c1c); border: none; border-radius: 8px; color: #fff; font-weight: bold; cursor: pointer;">
                        💥 MUA LẠI ĐẤT
                    </button>
                    <button onclick="GamesModule.skipBuyoutProperty()" style="flex: 1; padding: 12px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #cbd5e1; font-weight: bold; cursor: pointer;">
                        ❌ BỎ QUA
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
    },

    buyoutProperty: async (tileId, buyoutCost) => {
        const mState = GamesModule.monopoly;
        const player = mState.players[mState.currentPlayerIdx];
        const tile = mState.tiles.find(t => t.id === parseInt(tileId, 10));

        if (tile && tile.owner && player.cash >= buyoutCost) {
            const previousOwner = tile.owner;
            
            // Deduct buyout cost from current player
            player.cash = Math.round((player.cash - buyoutCost) * 10) / 10;
            
            // Find previous owner and add buyout cost
            const prevOwnerObj = mState.players.find(p => p.name === previousOwner.name);
            if (prevOwnerObj) {
                prevOwnerObj.cash = Math.round((prevOwnerObj.cash + buyoutCost) * 10) / 10;
            }

            // Transfer ownership
            tile.owner = player;
            mState.logs.push(`💥 <b>@${player.name}</b> đã chiêu mộ/mua lại ô <b>${tile.name}</b> từ <b>@${previousOwner.name}</b> với giá ${buyoutCost}đ Công Đức!`);
            GamesSynth.playWin();
        }

        document.getElementById('mono-buyout-overlay')?.remove();
        await GamesModule.finishMonopolyTurn();
    },

    skipBuyoutProperty: async () => {
        document.getElementById('mono-buyout-overlay')?.remove();
        await GamesModule.finishMonopolyTurn();
    },

    // Sảnh Chờ Lobby Danh Sách Các Phòng Đang Mở Real-time
    renderMonopolyLobby: (container) => {
        const mState = GamesModule.monopoly;
        
        // Start listening to all waiting lobby rooms if not already doing so
        if (typeof db !== 'undefined' && !mState.lobbyListener) {
            mState.lobbyListener = db.collection("monopoly_rooms")
                .onSnapshot((snapshot) => {
                    mState.lobbyRooms = [];
                    snapshot.forEach(doc => {
                        const room = doc.data();
                        const players = Array.isArray(room.players) ? room.players : [];
                        if (players.length === 0) {
                            doc.ref.delete().catch(e => console.error("Error cleaning empty monopoly room:", e));
                            return;
                        }
                        mState.lobbyRooms.push({ ...room, id: room.id || doc.id, players });
                    });
                    // Re-render only if currently in lobby mode
                    if (GamesModule.activeTab === 'monopoly' && !mState.activeRoomId) {
                        GamesModule.renderTabContent();
                    }
                });
        }

        const visibleRooms = mState.lobbyRooms.filter(r => Array.isArray(r.players) && r.players.length > 0);

        const roomsHtml = visibleRooms.length === 0 
            ? `<div style="text-align:center; padding: 40px; color:#64748b; font-size: 13px;">Chưa có phòng đấu nào mở. Hãy làm chủ phòng tạo phòng đầu tiên! 🚀</div>`
            : visibleRooms.map(r => {
                const isFull = r.players.length >= 4;
                const canJoin = r.status === 'waiting' && !isFull;
                return `
                    <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 14px 20px; gap: 12px; margin-bottom: 8px;">
                        <div>
                            <div style="font-weight: bold; color: #fff; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                                🛡️ ${r.name} 
                                <span style="font-size: 9px; padding: 2px 6px; border-radius: 10px; font-weight: bold; ${r.status === 'waiting' ? 'background: rgba(16,185,129,0.15); color: #10b981;' : 'background: rgba(239,68,68,0.15); color: #ef4444;'}">
                                    ${r.status === 'waiting' ? 'ĐANG CHỜ' : 'ĐANG CHƠI'}
                                </span>
                            </div>
                            <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
                                Chủ phòng: @${r.host} | Sĩ số: <strong style="color: #cbd5e1;">${r.players.length}/4 người chơi</strong>
                            </div>
                        </div>
                        <button onclick="GamesModule.joinOnlineRoom('${r.id}')" ${!canJoin ? 'disabled style="opacity: 0.4; cursor: not-allowed;"' : ''} style="padding: 8px 16px; background: linear-gradient(135deg, #06b6d4, #8b5cf6); border: none; border-radius: 8px; color: #fff; font-weight: bold; font-size: 12px; cursor: pointer; transition: all 0.2s;">
                            🚪 GIA NHẬP
                        </button>
                    </div>
                `;
            }).join('');

        container.innerHTML = `
            <div class="mono-setup-panel" style="max-width: 620px; margin: 0 auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h3 style="margin: 0; font-size: 18px; font-weight: 800; text-transform: uppercase; color: #a78bfa; display: flex; align-items: center; gap: 8px;">
                        🎲 SẢNH CHỜ TRỰC TUYẾN CỜ TỶ PHÚ
                    </h3>
                    <button onclick="GamesModule.createOnlineRoom()" style="padding: 10px 16px; background: linear-gradient(135deg, #8b5cf6, #ec4899); border: none; border-radius: 10px; color: #fff; font-weight: bold; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(139,92,246,0.3);" onmouseover="this.style.transform='translateY(-1px)';" onmouseout="this.style.transform='translateY(0)';">
                        <i class="fa-solid fa-plus-circle"></i> TẠO PHÒNG MỚI
                    </button>
                </div>
                
                <p style="color: #64748b; font-size: 12px; margin: 0 0 20px 0; line-height: 1.4;">
                    Tìm một phòng đang mở của đồng nghiệp để gia nhập đấu trí, hoặc tự tạo phòng cờ của riêng bạn và mời mọi người vào gieo xúc xắc tranh đoạt phòng ban!
                </p>

                <div style="max-height: 320px; overflow-y: auto; padding-right: 4px;">
                    ${roomsHtml}
                </div>
            </div>
        `;
    },

    // Giao Diện Đợi Của Phòng Chờ Standby
    renderMonopolyRoomStandby: (container) => {
        const mState = GamesModule.monopoly;
        const currentUser = Auth.currentUser;
        const activeRoom = mState.lobbyRooms.find(r => r.id === mState.activeRoomId) || { players: mState.players, host: '' };
        
        const isHost = activeRoom.host === currentUser.username;
        const empsJoined = activeRoom.players;

        const playersListHtml = empsJoined.map((p, idx) => `
            <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); padding: 12px 20px; border-radius: 12px; margin-bottom: 8px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 24px; height: 24px; border-radius: 50%; background: ${p.color}; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; color: #fff;">
                        ${p.name.charAt(0).toUpperCase()}
                    </div>
                    <span style="font-weight: 700; color: #fff; font-size: 13px;">
                        @${p.name} (${p.displayName})
                    </span>
                </div>
                <span style="font-size: 10px; font-weight: bold; ${idx === 0 ? 'color: #eab308; background: rgba(234,179,8,0.15);' : 'color:#94a3b8; background: rgba(255,255,255,0.08);'} padding: 3px 8px; border-radius: 6px; text-transform: uppercase;">
                    ${idx === 0 ? '👑 Chủ phòng' : '🎮 Sẵn sàng'}
                </span>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="mono-setup-panel" style="max-width: 580px; margin: 0 auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <h3 style="margin: 0; font-size: 18px; font-weight: 800; text-transform: uppercase; color: #a78bfa; display: flex; align-items: center; gap: 8px;">
                        🚪 PHÒNG GAME ONLINE ĐANG CHỜ (${empsJoined.length}/4)
                    </h3>
                    <button onclick="GamesModule.leaveOnlineRoom()" style="background: rgba(239,68,68,0.15); border: 1.5px solid #ef4444; color: #ef4444; padding: 6px 16px; border-radius: 8px; font-size: 11px; cursor: pointer; font-weight: bold; transition: all 0.2s;" onmouseover="this.style.background='#ef4444'; this.style.color='#fff'">
                        🚪 RỜI PHÒNG
                    </button>
                </div>
                
                <p style="color: #64748b; font-size: 12px; margin: 0 0 20px 0; line-height: 1.4;">
                    Phòng đấu đang mở cửa. Người chơi trong danh sách sẽ được đồng bộ lượt gieo xúc xắc thời gian thực qua máy chủ Firestore.
                </p>

                <div style="margin-bottom: 24px;">
                    ${playersListHtml}
                </div>

                <div style="display: flex; gap: 12px;">
                    ${isHost ? `
                        <button onclick="GamesModule.openInviteEmployeesModal()" style="flex: 1; padding: 12px; background: rgba(255,255,255,0.05); border: 1.5px solid rgba(255,255,255,0.1); border-radius: 10px; color: #fff; font-weight: bold; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'">
                            ✉️ MỜI ĐỒNG NGHIỆP
                        </button>
                        <button onclick="GamesModule.startOnlineMonopolyMatch()" ${empsJoined.length < 2 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''} style="flex: 1.2; padding: 12px; background: linear-gradient(135deg, #10b981, #059669); border: none; border-radius: 10px; color: #fff; font-weight: bold; cursor: pointer; box-shadow: 0 4px 15px rgba(16,185,129,0.3);" onmouseover="this.style.transform='translateY(-1px)';" onmouseout="this.style.transform='translateY(0)';">
                            🚀 BẮT ĐẦU TRẬN ĐẤU
                        </button>
                    ` : `
                        <div style="flex: 1; text-align: center; color: #94a3b8; font-size: 13px; font-weight: bold; padding: 12px; border: 1.5px dashed rgba(255,255,255,0.1); border-radius: 10px; background: rgba(0,0,0,0.2);">
                            ⏳ Đang chờ chủ phòng bắt đầu trận đấu...
                        </div>
                    `}
                </div>
            </div>
        `;
    },

    // Tạo Phòng Đấu Online
    createOnlineRoom: async () => {
        if (typeof db === 'undefined') {
            Utils.showToast("Không tìm thấy kết nối Firebase!", "error");
            return;
        }

        const user = Auth.currentUser;
        if (!user) return;

        const display = user.profile?.fullname || user.username;
        const theme = user.profile?.color || '#00f3ff';
        const roomId = "room_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);

        const playerObj = {
            name: user.username,
            displayName: display,
            color: theme,
            chibiConfig: user.profile?.chibiConfig || null,
            position: 0,
            cash: GamesModule.monopoly.startingCash || 30,
            isJailed: false,
            isBankrupt: false
        };

        const room = {
            id: roomId,
            name: `Phòng cờ của ${display}`,
            host: user.username,
            status: 'waiting',
            players: [playerObj],
            currentPlayerIdx: 0,
            diceValues: [1, 1],
            isRolling: false,
            logs: [`🏁 Phòng đấu online được kiến tạo bởi @${user.username}.`],
            tiles: GamesModule.monopoly.tiles.map(t => ({ id: t.id, ownerName: null, level: 1 }))
        };

        try {
            await db.collection("monopoly_rooms").doc(roomId).set(room);
            GamesModule.joinRoomState(roomId);
            Utils.showToast("Đã kiến tạo phòng cờ Tỷ Phú online thành công! 🚀", "success");
        } catch (e) {
            console.error("Lỗi tạo phòng:", e);
            Utils.showToast("Không thể khởi tạo phòng trên Firestore!", "error");
        }
    },

    // Gia Nhập Phòng Đấu Online
    joinOnlineRoom: async (roomId) => {
        if (typeof db === 'undefined') return;
        const user = Auth.currentUser;
        if (!user) return;

        const display = user.profile?.fullname || user.username;
        const theme = user.profile?.color || '#00f3ff';
        const playerObj = {
            name: user.username,
            displayName: display,
            color: theme,
            chibiConfig: user.profile?.chibiConfig || null,
            position: 0,
            cash: GamesModule.monopoly.startingCash || 30,
            isJailed: false,
            isBankrupt: false
        };

        try {
            const roomDoc = await db.collection("monopoly_rooms").doc(roomId).get();
            if (roomDoc.exists) {
                const room = roomDoc.data();
                if (room.players.length >= 4) {
                    Utils.showToast("Phòng đấu đã đầy người!", "warning");
                    return;
                }
                if (room.status !== 'waiting') {
                    Utils.showToast("Trận đấu trong phòng này đã bắt đầu rồi!", "warning");
                    return;
                }

                // Append if not exist
                if (!room.players.some(p => p.name === user.username)) {
                    room.players.push(playerObj);
                    room.logs.push(`🚪 @${user.username} đã gia nhập sảnh chờ phòng cờ.`);
                    await db.collection("monopoly_rooms").doc(roomId).set(room);
                }

                GamesModule.joinRoomState(roomId);
                Utils.showToast(`Gia nhập phòng cờ "${room.name}" thành công!`, "success");
            }
        } catch (e) {
            console.error("Lỗi gia nhập phòng:", e);
            Utils.showToast("Gia nhập phòng thất bại!", "error");
        }
    },

    // Cài đặt listener theo dõi phòng online và cập nhật State local
    joinRoomState: (roomId) => {
        const isNewRoom = GamesModule.monopoly.activeRoomId !== roomId;
        GamesModule.monopoly.activeRoomId = roomId;
        if (isNewRoom) {
            GamesModule.monopoly.visualPositions = {};
            GamesModule.monopoly.visualAnimationRunning = {};
            GamesModule.monopoly.awaitingAction = false;
            GamesModule.monopoly.centerDeedTileId = null;
            GamesModule.monopoly.lastMove = null;
        }

        if (GamesModule.monopoly.roomListener) GamesModule.monopoly.roomListener();

        GamesModule.monopoly.roomListener = db.collection("monopoly_rooms").doc(roomId)
            .onSnapshot((doc) => {
                if (!doc.exists) {
                    GamesModule.leaveRoomState("Phòng đấu đã bị đóng bởi chủ phòng!");
                    return;
                }

                const room = doc.data();
                const mState = GamesModule.monopoly;

                // Track cash changes to trigger floating point bubbles locally
                if (GamesModule.monopoly.players && GamesModule.monopoly.players.length > 0) {
                    room.players.forEach(newP => {
                        const oldP = GamesModule.monopoly.players.find(p => p.name === newP.name);
                        if (oldP && oldP.cash !== newP.cash) {
                            const delta = newP.cash - oldP.cash;
                            const text = `${delta > 0 ? '+' : ''}${delta}đ`;
                            const type = delta > 0 ? 'plus' : 'minus';
                            GamesModule.triggerPointBubble(newP.name, text, type);
                        }
                    });
                }

                if (room.players) {
                    const localPlayers = mState.players || [];
                    // Position from Firestore is now the authoritative final tile.
                    // visualPositions handles the hop animation, so keeping a local
                    // locked position here can make pawns stop after only 1-2 cells.
                    mState.players = room.players.map(remoteP => ({
                        ...(localPlayers.find(p => p.name === remoteP.name) || {}),
                        ...remoteP
                    }));
                }

                if (room.lastMove && (!mState.lastMove || room.lastMove.id !== mState.lastMove.id)) {
                    const move = room.lastMove;
                    if (move.playerName && Number.isInteger(move.from)) {
                        mState.visualPositions = mState.visualPositions || {};
                        // Only reset start position if not already animating for this move
                        if (!mState.visualAnimationRunning?.[move.playerName]) {
                           mState.visualPositions[move.playerName] = move.from;
                        }
                    }
                }
                mState.lastMove = room.lastMove || mState.lastMove || null;

                mState.currentPlayerIdx = room.currentPlayerIdx;
                mState.diceValues = room.diceValues;
                mState.isRolling = room.isRolling;
                mState.logs = room.logs;

                // Sync tile ownership dynamically
                room.tiles.forEach(rt => {
                    const localTile = GamesModule.monopoly.tiles.find(t => t.id === rt.id);
                    if (localTile) {
                        localTile.level = rt.level || 1;
                        if (rt.ownerName) {
                            localTile.owner = room.players.find(p => p.name === rt.ownerName) || null;
                        } else {
                            localTile.owner = null;
                        }
                    }
                });

                if (room.status === 'playing') {
                    GamesModule.monopoly.gameActive = true;
                } else if (room.status === 'waiting') {
                    GamesModule.monopoly.gameActive = false;
                }

                GamesModule.renderTabContent();
            });
    },

    leaveRoomState: (message) => {
        if (GamesModule.monopoly.roomListener) {
            GamesModule.monopoly.roomListener();
            GamesModule.monopoly.roomListener = null;
        }

        GamesModule.monopoly.activeRoomId = null;
        GamesModule.monopoly.gameActive = false;
        GamesModule.monopoly.players = [];
        GamesModule.monopoly.visualPositions = {};
        GamesModule.monopoly.visualAnimationRunning = {};
        GamesModule.monopoly.awaitingAction = false;
        GamesModule.monopoly.lastMove = null;

        if (message) Utils.showToast(message, "warning");
        GamesModule.renderTabContent();
    },

    // Người chơi tự rời phòng hoặc chủ phòng xóa phòng
    leaveOnlineRoom: async () => {
        const mState = GamesModule.monopoly;
        if (!mState.activeRoomId || typeof db === 'undefined') return;

        const user = Auth.currentUser;
        if (!confirm("Bạn có chắc chắn muốn rời phòng đấu?")) return;

        try {
            const roomRef = db.collection("monopoly_rooms").doc(mState.activeRoomId);
            const roomDoc = await roomRef.get();
            if (!roomDoc.exists) {
                GamesModule.leaveRoomState("Phong dau da khong con ton tai.");
                return;
            }

            const room = roomDoc.data();
            const players = Array.isArray(room.players) ? room.players : [];
            const isHost = room.host === user.username || players[0]?.name === user.username;

            if (isHost) {
                // Host leaves: Delete entire room
                await roomRef.delete();
            } else {
                // Member leaves: Remove player
                room.players = players.filter(p => p.name !== user.username);
                if (room.players.length === 0) {
                    await roomRef.delete();
                } else {
                    room.logs = Array.isArray(room.logs) ? room.logs : [];
                    room.logs.push(`🚪 @${user.username} đã rời khỏi sảnh phòng cờ.`);
                    await roomRef.set(room);
                }
            }
            GamesModule.leaveRoomState("Đã rời khỏi phòng đấu.");
        } catch (e) {
            console.error("Error leaving room:", e);
            GamesModule.leaveRoomState();
        }
    },

    // Bắt đầu trận đấu (Chủ phòng kích hoạt)
    startOnlineMonopolyMatch: async () => {
        const mState = GamesModule.monopoly;
        if (!mState.activeRoomId || typeof db === 'undefined') return;

        try {
            const roomDoc = await db.collection("monopoly_rooms").doc(mState.activeRoomId).get();
            if (roomDoc.exists) {
                const room = roomDoc.data();
                if (room.players.length < 2) {
                    Utils.showToast("Cần tối thiểu 2 người chơi để khai trận!", "warning");
                    return;
                }
                
                room.status = 'playing';
                room.logs.push("🚀 Trận chiến Tỷ Phú trực tuyến chính thức khai hỏa! Xúc xắc đã sẵn sàng.");
                await db.collection("monopoly_rooms").doc(mState.activeRoomId).set(room);
                Utils.showToast("🎲 Trận cờ Tỷ Phú bắt đầu! Chúc may mắn!", "success");
            }
        } catch (e) {
            console.error(e);
            Utils.showToast("Khởi trận thất bại!", "error");
        }
    },

    // Mở Modal Mời Đồng Nghiệp Chơi Cờ
    openInviteEmployeesModal: async () => {
        // Load available users dynamically to ensure we always have the list
        let emps = [];
        try {
            const accounts = (typeof Auth !== 'undefined' && typeof Auth.getAccounts === 'function')
                ? await Auth.getAccounts()
                : (typeof DB !== 'undefined' && typeof DB.getAccounts === 'function')
                    ? await DB.getAccounts()
                    : [];
            const currentUser = Auth.currentUser || { username: '' };
            emps = accounts.filter(a => a.username !== currentUser.username);
            GamesModule.monopoly.availableEmployees = emps;
        } catch (e) {
            console.error("Error loading accounts:", e);
        }

        const joinedNames = GamesModule.monopoly.players.map(p => p.name);
        const filtered = emps.filter(e => !joinedNames.includes(e.username));

        const overlay = document.createElement('div');
        overlay.id = 'mono-invite-employees-overlay';
        overlay.className = 'chance-overlay';
        overlay.style.zIndex = '99999';

        overlay.innerHTML = `
            <div style="background: rgba(15,23,42,0.98); border: 2px solid #8b5cf6; border-radius: 16px; padding: 24px; max-width: 400px; width: 90%; box-shadow: 0 0 30px rgba(139,92,246,0.3); color: #fff;">
                <h3 style="margin: 0 0 6px 0; color: #8b5cf6; text-align: center; font-size: 16px; font-weight: 800; text-transform: uppercase;">
                    ✉️ MỜI ĐỒNG NGHIỆP TRỰC TUYẾN
                </h3>
                <p style="color: #64748b; text-align: center; font-size: 12px; margin: 0 0 16px 0;">
                    Chọn nhân viên để gửi lời mời Popup real-time lên màn hình của họ
                </p>

                <div style="max-height: 250px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 4px;">
                    ${filtered.length === 0 ? '<div style="text-align:center; color:#64748b; font-size:12px; padding:20px;">Tất cả đồng nghiệp đã trong phòng!</div>' : filtered.map(emp => `
                        <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 10px; border-radius: 8px;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <div style="width: 18px; height: 18px; border-radius: 50%; background: ${emp.profile?.color || '#cbd5e1'};"></div>
                                <span style="font-size: 12px; font-weight: bold;">@${emp.username} (${emp.profile?.fullname || emp.username})</span>
                            </div>
                            <button onclick="GamesModule.sendOnlineInvitation('${emp.username}')" style="padding: 6px 12px; background: rgba(139,92,246,0.15); border: 1px solid #8b5cf6; border-radius: 6px; color: #8b5cf6; font-size: 11px; cursor: pointer; font-weight: bold; transition: all 0.2s;" onmouseover="this.style.background='#8b5cf6'; this.style.color='#fff'">
                                MỜI CHƠI
                            </button>
                        </div>
                    `).join('')}
                </div>

                <button onclick="document.getElementById('mono-invite-employees-overlay').remove()" style="margin-top: 16px; width: 100%; padding: 10px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #94a3b8; cursor: pointer; font-size: 12px; font-weight: bold;">
                    ❌ HỦY BỎ
                </button>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    // Gửi Yêu Cầu Lời Mời Lên Firestore
    sendOnlineInvitation: async (targetUsername) => {
        if (typeof db === 'undefined') return;
        const mState = GamesModule.monopoly;
        const user = Auth.currentUser;
        
        const hostDisplay = user.profile?.fullname || user.username;
        const inviteId = "invite_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);

        const invite = {
            id: inviteId,
            host: user.username,
            hostDisplayName: hostDisplay,
            roomName: `Phòng của ${hostDisplay}`,
            roomId: mState.activeRoomId,
            target: targetUsername,
            status: 'pending',
            timestamp: Date.now()
        };

        try {
            await db.collection("monopoly_invitations").doc(inviteId).set(invite);
            
            Utils.showToast(`Đã gửi lời mời cờ Tỷ Phú tới @${targetUsername}!`, "success");
        } catch (e) {
            console.error("Lỗi gửi lời mời:", e);
            Utils.showToast("Gửi lời mời thất bại!", "error");
        }
    },

    // Đồng Bộ Trạng Thái Phòng Lên Firestore Sau Mỗi Nước Đi
    syncRoomToFirestore: async () => {
        const mState = GamesModule.monopoly;
        if (!mState.activeRoomId || typeof db === 'undefined') return;

        const room = {
            id: mState.activeRoomId,
            name: mState.players[0] ? `Phòng cờ của ${mState.players[0].displayName}` : "Phòng cờ Tỷ Phú",
            host: mState.players[0] ? mState.players[0].name : "",
            status: mState.gameActive ? 'playing' : 'waiting',
            players: mState.players,
            currentPlayerIdx: mState.currentPlayerIdx,
            diceValues: mState.diceValues,
            isRolling: mState.isRolling,
            logs: mState.logs,
            lastMove: mState.lastMove || null,
            tiles: mState.tiles.map(t => ({ id: t.id, ownerName: t.owner ? t.owner.name : null, level: t.level || 1 }))
        };

        try {
            await db.collection("monopoly_rooms").doc(mState.activeRoomId).set(room);
        } catch (e) {
            console.error("Error syncing room:", e);
        }
    },

    rollMonopolyDice: async () => {
        const mState = GamesModule.monopoly;
        if (mState.isRolling) return;

        const player = mState.players[mState.currentPlayerIdx];
        if (!player || player.name !== Auth.currentUser?.username || mState.awaitingAction || mState.isMovingSequentially) return;

        if (player.nextTurnChooseTile) {
            GamesModule.renderMonopolyChooseTileModal(player);
            return;
        }

        if (player.isJailed && (player.jailTurns !== undefined && player.jailTurns <= 0)) {
            player.isJailed = false;
            player.jailTurns = 0;
            mState.logs.push(`🔓 Đã hết 2 lượt giam giữ. <b>@${player.name}</b> được HR thả tự do miễn phí!`);
            await GamesModule.syncRoomToFirestore();
        }

        if (player.isJailed) {
            if (!mState.jailChoiceMade) {
                GamesModule.renderMonopolyJailModal(player);
                return;
            }
        }

        // Start roll state on Firestore to notify dice shake globally
        mState.isRolling = true;
        await GamesModule.syncRoomToFirestore();

        GamesSynth.playRoll();

        // Local Dice roll animation tick
        let rollCounter = 0;
        const interval = setInterval(async () => {
            const tempD1 = Math.floor(Math.random() * 6) + 1;
            const tempD2 = Math.floor(Math.random() * 6) + 1;
            mState.diceValues = [tempD1, tempD2];
            GamesModule.renderTabContent();
            rollCounter++;

            if (rollCounter >= 8) {
                clearInterval(interval);
                mState.isRolling = false;

                // Final Dice Result calculation (2 dice)
                const d1 = Math.floor(Math.random() * 6) + 1;
                const d2 = Math.floor(Math.random() * 6) + 1;
                mState.diceValues = [d1, d2];
                const finalRoll = d1 + d2;
                
                await GamesModule.processMonopolyTurn({ total: finalRoll, diceValues: [d1, d2] });
            }
        }, 100);
    },

    processMonopolyTurn: async (rollInput) => {
        const mState = GamesModule.monopoly;
        const player = mState.players[mState.currentPlayerIdx];
        const rollInfo = GamesModule.getMonopolyRollInfo(rollInput);

        if (!player || !rollInfo.isValid) {
            console.warn('[Monopoly] Invalid roll ignored:', rollInput);
            mState.isRolling = false;
            await GamesModule.syncRoomToFirestore();
            GamesModule.renderTabContent();
            return;
        }

        const roll = rollInfo.total;
        mState.diceValues = [...rollInfo.diceValues];
        mState.isRolling = false;
        mState.awaitingAction = false;
        mState.logs.push(`DICE: <b>@${player.name}</b> rolled <b>${roll}</b> steps (${mState.diceValues[0]} - ${mState.diceValues[1]}).`);

        if (player.isJailed) {
            if (mState.jailRollAttempt) {
                if (rollInfo.isDouble) {
                    player.isJailed = false;
                    player.jailTurns = 0;
                    mState.logs.push(`JAIL BREAK: <b>@${player.name}</b> rolled doubles and can move ${roll} steps.`);
                } else {
                    player.jailTurns = Math.max(0, (player.jailTurns || 2) - 1);
                    mState.jailChoiceMade = false;
                    mState.jailRollAttempt = false;
                    mState.logs.push(`JAIL: <b>@${player.name}</b> did not roll doubles. Remaining jail turns: ${player.jailTurns}.`);
                    await GamesModule.finishMonopolyTurn();
                    return;
                }
            }
        } else if (rollInfo.isDouble) {
            mState.doubleRollCount = (mState.doubleRollCount || 0) + 1;
            if (mState.doubleRollCount >= 3) {
                mState.doubleRollCount = 0;
                mState.rollAgain = false;
                player.isJailed = true;
                player.jailTurns = 2;
                mState.visualPositions = mState.visualPositions || {};
                mState.visualPositions[player.name] = player.position;
                player.position = 10;
                mState.lastMove = {
                    id: `${player.name}_${Date.now()}_jail`,
                    playerName: player.name,
                    from: mState.visualPositions[player.name],
                    to: player.position,
                    roll: 0,
                    diceValues: [...mState.diceValues],
                    reason: 'triple-double-jail'
                };
                mState.logs.push(`TRIPLE DOUBLE: <b>@${player.name}</b> rolled doubles 3 times and goes to jail.`);
                await GamesModule.finishMonopolyTurn();
                return;
            }
            mState.rollAgain = true;
            mState.logs.push(`DOUBLE: <b>@${player.name}</b> will roll again after this tile is resolved.`);
        } else {
            mState.doubleRollCount = 0;
            mState.rollAgain = false;
        }

        const move = GamesModule.calculateMonopolyMove(player.position, roll, mState.tiles.length);
        mState.visualPositions = mState.visualPositions || {};
        mState.visualAnimationRunning = mState.visualAnimationRunning || {};
        mState.visualPositions[player.name] = move.start;
        delete mState.visualAnimationRunning[player.name];

        player.position = move.end;
        mState.isMovingSequentially = true;
        mState.movementLockEndTime = Date.now() + (move.steps * 320) + 1800;
        mState.lastMove = {
            id: `${player.name}_${Date.now()}_${move.start}_${move.end}_${roll}`,
            playerName: player.name,
            from: move.start,
            to: move.end,
            roll,
            diceValues: [...mState.diceValues],
            passedStart: move.passedStart
        };

        if (move.passedStart) {
            const bonus = mState.startBonus || 5;
            player.cash += bonus;
            mState.logs.push(`START BONUS: <b>@${player.name}</b> passed Start and received +${bonus}d.`);
        }

        const tile = mState.tiles[player.position];
        mState.logs.push(`LAND: <b>@${player.name}</b> stopped at <b>${tile.name}</b> after exactly ${roll} steps.`);
        mState.awaitingAction = true;

        await GamesModule.syncRoomToFirestore();
        GamesModule.renderTabContent();
    },

    handlePropertyTile: (player, tile) => {
        const mState = GamesModule.monopoly;

        if (tile.owner === null) {
            GamesModule.renderMonopolyPurchaseModal(player, tile);
        } else if (tile.owner.name === player.name) {
            if (!tile.level || tile.level < 3) {
                GamesModule.renderMonopolyUpgradeModal(player, tile);
            } else {
                mState.logs.push(`👑 <b>@${player.name}</b> ghé thăm trụ sở VVIP tối thượng <b>${tile.name}</b>!`);
                GamesModule.finishMonopolyTurn();
            }
        } else {
            const rent = GamesModule.getTileRent(tile);
            player.cash = Math.round((player.cash - rent) * 10) / 10;
            
            // Find owner in roster and add rent
            const ownerObj = mState.players.find(p => p.name === tile.owner.name);
            if (ownerObj) {
                ownerObj.cash = Math.round((ownerObj.cash + rent) * 10) / 10;
            }

            mState.logs.push(`💸 <b>@${player.name}</b> dẫm vào ô của <b>@${tile.owner.name}</b>! Trả tiền thuê <b>${rent}đ</b> Công Đức.`);
            
            GamesModule.checkBankruptcy(player);
            if (player.isBankrupt) {
                GamesModule.finishMonopolyTurn();
                return;
            }

            // Buyout logic: check if the tile is below level 3 (Level 1 or 2)
            const currentLvl = tile.level || 1;
            if (currentLvl < 3) {
                const totalSpent = GamesModule.getTileTotalSpent(tile);
                const buyoutCost = Math.round(totalSpent * 1.4 * 10) / 10;
                GamesModule.renderMonopolyBuyoutModal(player, tile, rent, buyoutCost);
            } else {
                mState.logs.push(`👑 Ô <b>${tile.name}</b> đã đạt cấp VVIP tối thượng, không thể mua lại!`);
                GamesModule.finishMonopolyTurn();
            }
        }
    },

    renderMonopolyPurchaseModal: (player, tile) => {
        const overlay = document.createElement('div');
        overlay.id = 'mono-purchase-overlay';
        overlay.className = 'chance-overlay';
        overlay.style.zIndex = '99999';

        const canAfford = player.cash >= tile.cost;

        overlay.innerHTML = `
            <div style="background: rgba(15,23,42,0.96); border: 2px solid ${tile.color}; border-radius: 16px; padding: 24px; max-width: 400px; width: 90%; text-align: center; box-shadow: 0 0 30px ${tile.color}40; color: #fff;">
                <div style="font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: bold; margin-bottom: 6px;">Mua Phòng Ban</div>
                <h3 style="margin: 0; color: ${tile.color}; font-size: 20px; font-weight: 900;">${tile.name}</h3>
                
                <div style="margin: 20px 0; background: rgba(0,0,0,0.3); padding: 14px; border-radius: 10px; text-align: left; font-size: 13px; line-height: 1.6;">
                    <div style="display:flex; justify-content:space-between; margin-bottom: 6px;">
                        <span>Giá nhượng quyền:</span>
                        <strong style="color: #fbbf24;">${tile.cost}đ Công Đức</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between;">
                        <span>Điểm thuê mặc định:</span>
                        <strong style="color: #ef4444;">${tile.rent}đ Công Đức</strong>
                      </div>
                  </div>

                  <div style="font-size: 12px; margin-bottom: 20px; color: ${canAfford ? '#38bdf8' : '#f87171'}; font-weight: bold;">
                      Số dư hiện tại của bạn: ${player.cash}đ Công Đức 
                      ${canAfford ? '(Đủ điều kiện)' : '(Không đủ điểm)'}
                  </div>

                  <div style="display: flex; gap: 10px;">
                      <button onclick="GamesModule.buyProperty('${tile.id}')" ${!canAfford ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''} style="flex: 1; padding: 12px; background: linear-gradient(135deg, #10b981, #059669); border: none; border-radius: 8px; color: #fff; font-weight: bold; cursor: pointer;">
                          🤝 MUA NGAY
                      </button>
                      <button onclick="GamesModule.skipProperty()" style="flex: 1; padding: 12px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #cbd5e1; font-weight: bold; cursor: pointer;">
                          ❌ BỎ QUA
                      </button>
                  </div>
              </div>
          `;

          document.body.appendChild(overlay);
      },

    buyProperty: async (tileId) => {
        const mState = GamesModule.monopoly;
        const player = mState.players[mState.currentPlayerIdx];
        const tile = mState.tiles.find(t => t.id === parseInt(tileId, 10));

        if (tile && player.cash >= tile.cost) {
            player.cash -= tile.cost;
            tile.owner = player;
            tile.level = 1;
            mState.logs.push(`🤝 <b>@${player.name}</b> quyết định nhượng quyền ô <b>${tile.name}</b> với giá ${tile.cost}đ Công Đức!`);
            GamesSynth.playWin();
        }

        document.getElementById('mono-purchase-overlay')?.remove();
        await GamesModule.finishMonopolyTurn();
    },

    skipProperty: async () => {
        const mState = GamesModule.monopoly;
        const player = mState.players[mState.currentPlayerIdx];
        mState.logs.push(`💨 <b>@${player.name}</b> lướt qua cơ hội sở hữu phòng ban này.`);
        
        document.getElementById('mono-purchase-overlay')?.remove();
        await GamesModule.finishMonopolyTurn();
    },

    renderForcedSellHouseModal: (player) => {
        const mState = GamesModule.monopoly;
        const tiles = mState.tiles.filter(t => t.type === 'property' && t.owner?.name === player.name && (t.level || 1) > 1);

        if (tiles.length === 0) {
            player.cash = Math.max(0, player.cash - 2);
            mState.logs.push(`🏚️ <b>@${player.name}</b> không có nhà để bán, bị phạt kiểm kê tài sản -2đ.`);
            GamesModule.checkBankruptcy(player);
            GamesModule.finishMonopolyTurn();
            return;
        }

        const overlay = document.createElement('div');
        overlay.id = 'mono-forced-sell-overlay';
        overlay.className = 'chance-overlay';
        overlay.style.zIndex = '99999';
        overlay.innerHTML = `
            <div style="background: rgba(15,23,42,0.97); border: 2px solid #ef4444; border-radius: 16px; padding: 24px; max-width: 430px; width: 90%; color: #fff; box-shadow: 0 0 35px rgba(239,68,68,0.45);">
                <h3 style="margin:0 0 8px; color:#f87171; text-align:center; font-size:18px; font-weight:900;">🏚️ BẮT BUỘC BÁN 1 NHÀ</h3>
                <p style="font-size:12px;color:#cbd5e1;text-align:center;margin:0 0 16px;">Chọn một tài sản đã nâng cấp để hạ xuống 1 cấp. Bạn nhận lại 40% phí nâng cấp.</p>
                <div style="display:flex;flex-direction:column;gap:8px;max-height:260px;overflow:auto;">
                    ${tiles.map(t => {
                        const refund = Math.max(1, Math.round(GamesModule.getTileUpgradeCost(t) * 0.4));
                        return `
                            <button onclick="GamesModule.confirmForcedSellHouse('${t.id}', ${refund})" style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.35);border-radius:10px;color:#fff;cursor:pointer;">
                                <span style="text-align:left;"><b>${t.name}</b><br><small style="color:#94a3b8;">Cấp ${t.level || 1} ➜ Cấp ${(t.level || 1) - 1}</small></span>
                                <b style="color:#fbbf24;">+${refund}đ</b>
                            </button>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    confirmForcedSellHouse: async (tileId, refund) => {
        const mState = GamesModule.monopoly;
        const player = mState.players[mState.currentPlayerIdx];
        const tile = mState.tiles.find(t => t.id === parseInt(tileId, 10));
        if (tile && tile.owner?.name === player.name && (tile.level || 1) > 1) {
            tile.level = Math.max(1, (tile.level || 1) - 1);
            player.cash += Number(refund) || 0;
            mState.logs.push(`🏚️ <b>@${player.name}</b> bị buộc bán bớt nhà tại <b>${tile.name}</b>. Hạ còn cấp ${tile.level}, thu hồi +${refund}đ.`);
            GamesSynth.playLose();
        }
        document.getElementById('mono-forced-sell-overlay')?.remove();
        await GamesModule.finishMonopolyTurn();
    },

    renderFreeUpgradeAnyModal: (player) => {
        const mState = GamesModule.monopoly;
        const tiles = mState.tiles.filter(t => t.type === 'property' && t.owner?.name === player.name && (t.level || 1) < 3);

        if (tiles.length === 0) {
            mState.logs.push(`🏗️ <b>@${player.name}</b> nhận quyền xây nhà miễn phí nhưng chưa có tài sản phù hợp.`);
            GamesModule.finishMonopolyTurn();
            return;
        }

        const overlay = document.createElement('div');
        overlay.id = 'mono-free-upgrade-overlay';
        overlay.className = 'chance-overlay';
        overlay.style.zIndex = '99999';
        overlay.innerHTML = `
            <div style="background: rgba(15,23,42,0.97); border: 2px solid #10b981; border-radius: 16px; padding: 24px; max-width: 430px; width: 90%; color: #fff; box-shadow: 0 0 35px rgba(16,185,129,0.45);">
                <h3 style="margin:0 0 8px; color:#34d399; text-align:center; font-size:18px; font-weight:900;">🏗️ XÂY NHÀ MIỄN PHÍ</h3>
                <p style="font-size:12px;color:#cbd5e1;text-align:center;margin:0 0 16px;">Chọn một tài sản bất kỳ của bạn để nâng cấp miễn phí 1 cấp.</p>
                <div style="display:flex;flex-direction:column;gap:8px;max-height:260px;overflow:auto;">
                    ${tiles.map(t => `
                        <button onclick="GamesModule.confirmFreeUpgradeAny('${t.id}')" style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.35);border-radius:10px;color:#fff;cursor:pointer;">
                            <span style="text-align:left;"><b>${t.name}</b><br><small style="color:#94a3b8;">Cấp ${t.level || 1} ➜ Cấp ${(t.level || 1) + 1}</small></span>
                            <b style="color:#34d399;">FREE</b>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    confirmFreeUpgradeAny: async (tileId) => {
        const mState = GamesModule.monopoly;
        const player = mState.players[mState.currentPlayerIdx];
        const tile = mState.tiles.find(t => t.id === parseInt(tileId, 10));
        if (tile && tile.owner?.name === player.name && (tile.level || 1) < 3) {
            tile.level = (tile.level || 1) + 1;
            mState.logs.push(`🏗️ <b>@${player.name}</b> xây nhà miễn phí tại <b>${tile.name}</b>, lên cấp ${tile.level}!`);
            GamesSynth.playWin();
        }
        document.getElementById('mono-free-upgrade-overlay')?.remove();
        await GamesModule.finishMonopolyTurn();
    },

    renderMonopolyChooseTileModal: (player) => {
        const mState = GamesModule.monopoly;
        const overlay = document.createElement('div');
        overlay.id = 'mono-choose-tile-overlay';
        overlay.className = 'chance-overlay';
        overlay.style.zIndex = '99999';
        overlay.innerHTML = `
            <div style="background: rgba(15,23,42,0.98); border: 2px solid #22d3ee; border-radius: 16px; padding: 24px; max-width: 560px; width: 92%; color: #fff; box-shadow: 0 0 35px rgba(34,211,238,0.45);">
                <h3 style="margin:0 0 8px; color:#67e8f9; text-align:center; font-size:18px; font-weight:900;">🧭 CHỌN Ô MUỐN ĐI TỚI</h3>
                <p style="font-size:12px;color:#cbd5e1;text-align:center;margin:0 0 16px;">Vé điều hướng lượt sau đang kích hoạt. Chọn bất kỳ ô nào trên bàn cờ.</p>
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;max-height:360px;overflow:auto;">
                    ${mState.tiles.map(t => `
                        <button onclick="GamesModule.confirmChooseTileMove('${t.id}')" style="padding:10px;background:rgba(34,211,238,0.08);border:1px solid rgba(34,211,238,0.28);border-radius:10px;color:#fff;cursor:pointer;text-align:left;">
                            <b style="color:#67e8f9;">#${t.id}</b><br>
                            <span style="font-size:11px;">${t.name}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    confirmChooseTileMove: async (tileId) => {
        const mState = GamesModule.monopoly;
        const player = mState.players[mState.currentPlayerIdx];
        if (!player) return;
        player.nextTurnChooseTile = false;
        document.getElementById('mono-choose-tile-overlay')?.remove();
        mState.logs.push(`🧭 <b>@${player.name}</b> dùng vé điều hướng để chọn ô #${tileId}.`);
        await GamesModule.executeMonopolyMoveToTile(player, parseInt(tileId, 10), 'choose-tile-ticket');
    },

    drawMonopolyCardV2: (player, cardType) => {
        const mState = GamesModule.monopoly;

        const chanceCards = [
            { text: "OT giải cứu dự án, sếp ký thưởng nóng.", amt: 3, weight: 14 },
            { text: "Prompt lỗi làm server quá tải, đền điểm vận hành.", amt: -2, weight: 16 },
            { text: "Lỡ lộ bí mật nội bộ trên nhóm chat, bị phạt cảnh cáo.", amt: -1, weight: 16 },
            { text: "Bàn phím gaming liệt phím, mua đồ mới mất điểm.", amt: -2, weight: 12 },
            { text: "Phạt thuế văn phòng đột xuất: truy thu 3đ Công Đức.", amt: -3, weight: 12, effect: "taxFine" },
            { text: "Kiểm toán tài sản bất ngờ: buộc phải bán 1 ngôi nhà đang sở hữu.", amt: 0, weight: 10, effect: "forcedSellHouse" },
            { text: "Cứu đồng nghiệp gánh task thành công, nhận điểm kết nghĩa.", amt: 2, weight: 12 },
            { text: "Tìm ra lỗ hổng bảo mật nghiêm trọng, phòng IT thưởng lớn.", amt: 3, weight: 8 }
        ];

        const luckyCards = [
            { text: "Sếp bao ăn cả phòng, được hoàn điểm cơm trưa.", amt: 2, weight: 18 },
            { text: "Nhặt được điểm tích lũy rơi bên máy pha cafe.", amt: 1, weight: 18 },
            { text: "Được giao đào tạo prompt AI cho người mới, thưởng công.", amt: 3, weight: 16 },
            { text: "TikTok công ty lên xu hướng, truyền thông tung hoa.", amt: 3, weight: 14 },
            { text: "Thẻ thần tài: di chuyển về ô BẮT ĐẦU, nhận thưởng và được chọn xây nhà bất kỳ.", amt: 0, weight: 12, effect: "moveToStartFreeUpgrade" },
            { text: "Vé điều hướng: lượt sau bạn được chọn di chuyển tới 1 ô bất kỳ mong muốn.", amt: 0, weight: 10, effect: "nextTurnChooseTile" }
        ];

        const deck = cardType === 'chance' ? chanceCards : luckyCards;
        const card = GamesModule.pickWeightedMonopolyCard(deck);
        const totalWeight = deck.reduce((sum, item) => sum + (item.weight || 1), 0);
        const cardRate = Math.round(((card.weight || 1) / totalWeight) * 100);
        let resultText = card.amt ? `${card.amt >= 0 ? '+' : ''}${card.amt}đ Công Đức` : 'Hiệu ứng đặc biệt';
        let resultColor = card.amt >= 0 ? '#10b981' : '#ef4444';

        if (card.amt) {
            player.cash = Math.max(0, player.cash + card.amt);
        }

        if (card.effect === 'forcedSellHouse') {
            mState.pendingCardAction = { type: 'forcedSellHouse', playerName: player.name };
            resultText = 'Phải bán 1 ngôi nhà';
            resultColor = '#f97316';
        } else if (card.effect === 'nextTurnChooseTile') {
            player.nextTurnChooseTile = true;
            resultText = 'Lượt sau được chọn ô bất kỳ';
            resultColor = '#22d3ee';
        } else if (card.effect === 'moveToStartFreeUpgrade') {
            const from = player.position;
            const bonus = mState.startBonus || 5;
            player.position = 0;
            player.cash += bonus;
            mState.visualPositions = mState.visualPositions || {};
            mState.visualPositions[player.name] = from;
            mState.lastMove = {
                id: `${player.name}_${Date.now()}_card_start`,
                playerName: player.name,
                from,
                to: 0,
                roll: (mState.tiles.length - from) % mState.tiles.length,
                diceValues: [...(mState.diceValues || [1, 1])],
                passedStart: true,
                reason: 'card-move-to-start'
            };
            mState.pendingCardAction = { type: 'freeUpgradeAny', playerName: player.name };
            resultText = `Về BẮT ĐẦU +${bonus}đ và chọn xây nhà`;
            resultColor = '#34d399';
        }

        const cardName = cardType === 'chance' ? 'CƠ HỘI' : 'VẬN MAY';
        mState.logs.push(`CARD: <b>@${player.name}</b> rut the <b>${cardName}</b>: "${card.text}" <b>(${resultText})</b>`);

        const overlay = document.createElement('div');
        overlay.id = 'mono-card-overlay';
        overlay.className = 'chance-overlay';
        overlay.style.zIndex = '99999';

        overlay.innerHTML = `
            <div style="background: rgba(15,23,42,0.96); border: 2.5px solid ${cardType === 'chance' ? '#a855f7' : '#00f3ff'}; border-radius: 20px; padding: 28px; max-width: 420px; width: 90%; text-align: center; box-shadow: 0 0 35px ${cardType === 'chance' ? '#a855f7' : '#00f3ff'}50; color: #fff;">
                <div style="font-size: 42px; margin-bottom: 12px;">${cardType === 'chance' ? '?' : '*'}</div>
                <h3 style="margin: 0 0 16px 0; color: ${cardType === 'chance' ? '#a855f7' : '#00f3ff'}; font-size: 20px; font-weight: 900; text-transform: uppercase;">
                    Thẻ ${cardName}
                </h3>
                <div style="display:inline-flex;align-items:center;gap:6px;margin:-6px 0 16px;padding:5px 10px;border-radius:999px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.14);color:#cbd5e1;font-size:11px;font-weight:800;">
                    Tỉ lệ rút ~${cardRate}%
                </div>
                <p style="font-size: 14px; line-height: 1.6; color: #e2e8f0; margin-bottom: 20px; text-align: justify; background: rgba(0,0,0,0.3); padding: 16px; border-radius: 10px; border-left: 3px solid ${cardType === 'chance' ? '#a855f7' : '#00f3ff'};">
                    "${card.text}"
                </p>
                <div style="font-size: 18px; font-weight: 900; color: ${resultColor}; margin-bottom: 24px;">
                    ${resultText}
                </div>
                <button onclick="GamesModule.closeCardModal()" style="width: 100%; padding: 12px; background: linear-gradient(135deg, ${cardType === 'chance' ? '#a855f7' : '#00f3ff'}, #8b5cf6); border: none; border-radius: 8px; color: #fff; font-weight: bold; cursor: pointer; text-transform: uppercase; font-size: 13px;">
                    Xác Nhận
                </button>
            </div>
        `;

        document.body.appendChild(overlay);
        if (card.amt < 0 || card.effect === 'forcedSellHouse') GamesSynth.playLose();
        else GamesSynth.playWin();
    },

    drawMonopolyCard: (player, cardType) => {
        const mState = GamesModule.monopoly;

        const chanceCards = [
            { text: "Làm OT tăng ca nhiệt tình cho dự án Thanh Long, Sếp ký duyệt thưởng nóng!", amt: 3 },
            { text: "Xử lý prompt AI lỗi kỹ thuật làm Server quá tải mất 3 tiếng, đền tiền đền điểm!", amt: -2 },
            { text: "Cứu đồng nghiệp gánh tạ thành công, nhận điểm kết nghĩa anh em!", amt: 2 },
            { text: "Lỡ miệng bàn luận bí mật nội bộ trên nhóm chat, bị sếp phát hiện phạt cảnh cáo!", amt: -1 },
            { text: "Hoàn thành sớm Task được sếp bao trà sữa Gongcha siêu to khổng lồ!", amt: 2 },
            { text: "Bàn phím Gaming đột nhiên liệt phím, mua bàn phím mới trả phí Công Đức!", amt: -2 },
            { text: "Tìm ra lỗ hổng bảo mật nghiêm trọng trong DB, phòng IT thưởng lớn!", amt: 3 }
        ];

        const luckyCards = [
            { text: "Sếp vui vẻ bao ăn cả phòng nhân ngày cuối tháng, được hoàn điểm cơm trưa!", amt: 2 },
            { text: "Nhặt được điểm tích lũy rơi vãi bên hành lang pha cafe!", amt: 1 },
            { text: "Được sếp giao phó đứng lớp đào tạo prompt AI cho người mới, thưởng công!", amt: 3 },
            { text: "Kênh TikTok bỗng dưng lọt xu hướng triệu view, truyền thông tung hoa!", amt: 3 }
        ];

        const deck = cardType === 'chance' ? chanceCards : luckyCards;
        const card = deck[Math.floor(Math.random() * deck.length)];

        player.cash = Math.max(0, player.cash + card.amt);
        mState.logs.push(`📬 <b>@${player.name}</b> rút thẻ <b>${cardType === 'chance' ? 'CƠ HỘI' : 'VẬN MAY'}</b>: "${card.text}" <b>(${card.amt >= 0 ? '+' : ''}${card.amt}đ)</b>`);

        const overlay = document.createElement('div');
        overlay.id = 'mono-card-overlay';
        overlay.className = 'chance-overlay';
        overlay.style.zIndex = '99999';

        overlay.innerHTML = `
            <div style="background: rgba(15,23,42,0.96); border: 2.5px solid ${cardType === 'chance' ? '#a855f7' : '#00f3ff'}; border-radius: 20px; padding: 28px; max-width: 400px; width: 90%; text-align: center; box-shadow: 0 0 35px ${cardType === 'chance' ? '#a855f7' : '#00f3ff'}50; color: #fff;">
                <div style="font-size: 42px; margin-bottom: 12px;">${cardType === 'chance' ? '❓' : '🍀'}</div>
                <h3 style="margin: 0 0 16px 0; color: ${cardType === 'chance' ? '#a855f7' : '#00f3ff'}; font-size: 20px; font-weight: 900; text-transform: uppercase;">
                    ${cardType === 'chance' ? 'Thẻ Cơ Hội' : 'Thẻ Vận May'}
                </h3>
                <p style="font-size: 14px; line-height: 1.6; color: #e2e8f0; margin-bottom: 20px; text-align: justify; background: rgba(0,0,0,0.3); padding: 16px; border-radius: 10px; border-left: 3px solid ${cardType === 'chance' ? '#a855f7' : '#00f3ff'};">
                    "${card.text}"
                </p>
                <div style="font-size: 18px; font-weight: 900; color: ${card.amt >= 0 ? '#10b981' : '#ef4444'}; margin-bottom: 24px;">
                    ${card.amt >= 0 ? `🔥 NHẬN +${card.amt}đ` : `💸 MẤT ${card.amt}đ`} CÔNG ĐỨC
                </div>
                <button onclick="GamesModule.closeCardModal()" style="width: 100%; padding: 12px; background: linear-gradient(135deg, ${cardType === 'chance' ? '#a855f7' : '#00f3ff'}, #8b5cf6); border: none; border-radius: 8px; color: #fff; font-weight: bold; cursor: text-transform: uppercase; font-size: 13px;">
                    Xác Nhận
                </button>
            </div>
        `;

        document.body.appendChild(overlay);
        if (card.amt >= 0) GamesSynth.playWin();
        else GamesSynth.playLose();
    },

    closeCardModal: async () => {
        const mState = GamesModule.monopoly;
        const player = mState.players[mState.currentPlayerIdx];
        const pending = mState.pendingCardAction && mState.pendingCardAction.playerName === player?.name
            ? mState.pendingCardAction
            : null;

        document.getElementById('mono-card-overlay')?.remove();
        if (pending) delete mState.pendingCardAction;

        GamesModule.checkBankruptcy(player);
        if (player?.isBankrupt) {
            await GamesModule.finishMonopolyTurn();
            return;
        }

        if (pending?.type === 'forcedSellHouse') {
            GamesModule.renderForcedSellHouseModal(player);
            return;
        }

        if (pending?.type === 'freeUpgradeAny') {
            GamesModule.renderFreeUpgradeAnyModal(player);
            return;
        }

        await GamesModule.finishMonopolyTurn();
    },

    checkBankruptcy: (player) => {
        const mState = GamesModule.monopoly;
        if (player.cash <= 0) {
            player.isBankrupt = true;
            
            const funnyMessages = [
                `😂 Chia buồn cùng @${player.name}, hết tiền thì đi làm công đức tiếp đi nhé!`,
                `👻 @${player.name} đã chính thức "ra đê"! Ai có lòng tốt cho mượn cái chiếu?`,
                `🤡 Cố quá thành "quá cố", @${player.name} đã trắng tay!`,
                `💸 @${player.name} phá sản rồi! Cảnh báo: Đừng ai dại dột cho người này vay tiền!`,
                `📉 @${player.name} vừa thực hiện cú nhảy cầu tài chính ngoạn mục!`,
                `🤣 @${player.name} đã bị đuổi khỏi văn phòng vì nợ nần chồng chất!`,
                `🧨 BÙM! Tài khoản của @${player.name} vừa bốc hơi như chưa từng tồn tại!`
            ];
            const randomMsg = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];
            
            mState.logs.push(`💀 <b>@${player.name}</b> đã tuyên bố Phá Sản!`);
            mState.logs.push(`📢 <b>THÔNG BÁO:</b> ${randomMsg}`);
            
            // Public toast for maximum trolling
            Utils.showToast(`${player.name} phá sản rồi! Haha!`, "warning");
            
            mState.tiles.forEach(t => {
                if (t.type === 'property' && t.owner?.name === player.name) {
                    t.owner = null;
                }
            });
            GamesSynth.playLose();
        }
    },

    finishMonopolyTurn: async () => {
        const mState = GamesModule.monopoly;
        
        const activePlayers = mState.players.filter(p => !p.isBankrupt);
        if (activePlayers.length === 1) {
            mState.gameActive = false;
            mState.logs.push(`👑 <b>@${activePlayers[0].name} (${activePlayers[0].displayName})</b> LÀ NGƯỜI CHÚA TỂ PHÒNG BAN MẠNH NHẤT - CHIẾN THẮNG CHUNG CUỘC!`);
            GamesSynth.playWin();
            
            // Sync game over to Firestore
            await GamesModule.syncRoomToFirestore();
            return;
        }

        // Reset temporary choice flags
        mState.jailChoiceMade = false;
        mState.jailRollAttempt = false;

        // If double roll, current player gets another turn!
        if (mState.rollAgain) {
            mState.rollAgain = false; // reset flag
            mState.logs.push(`🎲 <b>@${mState.players[mState.currentPlayerIdx].name}</b> tiếp tục gieo xúc xắc vì có cú đúp!`);
            await GamesModule.syncRoomToFirestore();
            return;
        }

        // Reset double roll count if turn changes
        mState.doubleRollCount = 0;

        let nextIdx = mState.currentPlayerIdx;
        do {
            nextIdx = (nextIdx + 1) % mState.players.length;
        } while (mState.players[nextIdx].isBankrupt);

        mState.currentPlayerIdx = nextIdx;
        
        // Sync turn completion to Firestore (this pushes update globally!)
        await GamesModule.syncRoomToFirestore();
    }
};
