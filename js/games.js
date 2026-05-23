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
        winLine: [] 
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
            { id: 6, name: 'Phòng Design 🎨', type: 'property', cost: 5, rent: 2, owner: null, color: '#10b981' },
            { id: 7, name: 'Vận May 🍀', type: 'lucky', color: '#00f3ff' },
            { id: 8, name: 'Kênh TikTok 📈', type: 'property', cost: 6, rent: 2.5, owner: null, color: '#eab308' },
            { id: 9, name: 'Phòng Server 🖥️', type: 'property', cost: 6, rent: 2.5, owner: null, color: '#eab308' },
            { id: 10, name: 'Đi Trễ Phạt Đứng 🔒', type: 'jail', desc: 'Mất lượt trừ khi nộp 2đ Công Đức cho HR' },
            { id: 11, name: 'Phòng Content 📝', type: 'property', cost: 7, rent: 3, owner: null, color: '#fda4af' },
            { id: 12, name: 'Cơ Hội ❓', type: 'chance', color: '#a855f7' },
            { id: 13, name: 'Studio Live 🎥', type: 'property', cost: 8, rent: 3.5, owner: null, color: '#fda4af' },
            { id: 14, name: 'Sếp Bao Trưa 🍔', type: 'buff', desc: 'Thử việc xuất sắc được Sếp mời ăn +2đ' },
            { id: 15, name: 'Phòng Marketing 📊', type: 'property', cost: 9, rent: 4, owner: null, color: '#f97316' },
            { id: 16, name: 'Phòng Manager 💼', type: 'property', cost: 9, rent: 4, owner: null, color: '#f97316' },
            { id: 17, name: 'Vận May 🍀', type: 'lucky', color: '#00f3ff' },
            { id: 18, name: 'Xe Máy Của Sếp 🏎️', type: 'property', cost: 11, rent: 5, owner: null, color: '#a855f7' },
            { id: 19, name: 'Phòng Họp VIP 👑', type: 'property', cost: 13, rent: 6, owner: null, color: '#a855f7' }
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
        availableEmployees: [] 
    },

    init: async () => {
        console.log("GamesModule Initialized Online Listeners");
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

        container.innerHTML = `
            <style>
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
                    gap: 20px;
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
                    gap: 2px;
                    background: linear-gradient(145deg, #060d1e 0%, #130830 45%, #080e20 100%);
                    border: 3px solid;
                    border-image: linear-gradient(135deg, #8b5cf6, #a855f7, #ec4899, #06b6d4, #8b5cf6) 1;
                    padding: 3px;
                    width: 100%;
                    max-width: 740px;
                    margin: 0 auto;
                    aspect-ratio: 1;
                    box-shadow:
                        0 0 50px rgba(139,92,246,0.12),
                        0 0 100px rgba(139,92,246,0.06),
                        0 10px 40px rgba(0,0,0,0.7),
                        inset 0 0 30px rgba(0,0,0,0.5);
                    position: relative;
                }
                .mono-board::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(circle at 50% 50%, rgba(139,92,246,0.05) 0%, transparent 60%);
                    pointer-events: none;
                    z-index: 0;
                }

                /* Individual Tile */
                .mono-tile {
                    background: rgba(16,24,48,0.92);
                    border: 1px solid rgba(255,255,255,0.06);
                    padding: 2px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 1px;
                    position: relative;
                    overflow: hidden;
                    transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
                    z-index: 1;
                    cursor: default;
                }
                .mono-tile:hover {
                    z-index: 10;
                    box-shadow: 0 0 20px rgba(139,92,246,0.3), inset 0 0 15px rgba(139,92,246,0.08);
                    border-color: rgba(139,92,246,0.4);
                    transform: scale(1.06);
                }
                .mono-tile.has-player {
                    box-shadow: 0 0 12px rgba(255,255,255,0.08);
                }

                /* Corner Tiles */
                .mono-tile.corner-tile {
                    background: linear-gradient(135deg, rgba(22,18,55,0.95), rgba(18,28,52,0.95));
                    border-color: rgba(139,92,246,0.25);
                }

                /* Color bars on property tiles facing center */
                .mono-color-bar {
                    position: absolute;
                    background: var(--bar-color);
                    box-shadow: 0 0 8px var(--bar-color);
                    z-index: 2;
                }
                .side-top .mono-color-bar { bottom: 0; left: 0; right: 0; height: 5px; }
                .side-right .mono-color-bar { top: 0; left: 0; bottom: 0; width: 5px; }
                .side-bottom .mono-color-bar { top: 0; left: 0; right: 0; height: 5px; }
                .side-left .mono-color-bar { top: 0; right: 0; bottom: 0; width: 5px; }

                .mono-tile-name {
                    font-weight: 800;
                    color: #e2e8f0;
                    font-size: 8px;
                    text-align: center;
                    line-height: 1.15;
                    max-width: 100%;
                    padding: 0 1px;
                }
                .corner-tile .mono-tile-name {
                    font-size: 9px;
                    color: #a78bfa;
                }
                .mono-tile-cost {
                    font-size: 9px;
                    font-weight: 900;
                    color: #fbbf24;
                    text-shadow: 0 0 5px rgba(251,191,36,0.25);
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
                @keyframes pawnBob {
                    0% { transform: translateY(0) scale(1); }
                    100% { transform: translateY(-2px) scale(1.05); }
                }

                /* Center Panel - Premium Dashboard */
                .mono-center-panel {
                    grid-column: 2 / 6;
                    grid-row: 2 / 6;
                    background:
                        radial-gradient(ellipse at 50% 50%, rgba(139,92,246,0.07) 0%, transparent 65%),
                        linear-gradient(145deg, rgba(10,15,30,0.98), rgba(14,10,35,0.98));
                    border: 1.5px dashed rgba(139,92,246,0.18);
                    border-radius: 8px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 12px;
                    gap: 8px;
                    text-align: center;
                    box-shadow: inset 0 0 50px rgba(0,0,0,0.6);
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
                @keyframes rotGlow { to { transform: rotate(360deg); } }

                /* Dice */
                .mono-dice-wrap {
                    display: flex;
                    gap: 14px;
                    margin: 6px 0;
                    perspective: 300px;
                }
                .mono-dice {
                    width: 52px;
                    height: 52px;
                    background: linear-gradient(145deg, #2d1b69, #1a0e42);
                    border: 2.5px solid #8b5cf6;
                    border-radius: 11px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 26px;
                    color: #fff;
                    text-shadow: 0 0 12px #a78bfa;
                    box-shadow:
                        0 4px 20px rgba(139,92,246,0.35),
                        inset 0 -3px 6px rgba(0,0,0,0.4),
                        inset 0 2px 4px rgba(255,255,255,0.06);
                    transition: all 0.15s;
                }
                .mono-dice.rolling {
                    animation: dice3D 0.2s infinite;
                }
                @keyframes dice3D {
                    0%   { transform: rotateX(-12deg) rotateZ(-8deg) scale(0.94); }
                    25%  { transform: rotateX(12deg) rotateZ(6deg) scale(1.06); filter: brightness(1.25); }
                    50%  { transform: rotateX(-6deg) rotateZ(12deg) scale(0.97); }
                    75%  { transform: rotateX(10deg) rotateZ(-10deg) scale(1.03); filter: brightness(1.15); }
                    100% { transform: rotateX(-12deg) rotateZ(-8deg) scale(0.94); }
                }

                /* HUD Panels */
                .mono-hud-players, .mono-hud-logs {
                    background: linear-gradient(145deg, rgba(15,23,42,0.75), rgba(20,12,48,0.7));
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 16px;
                    padding: 18px;
                    backdrop-filter: blur(8px);
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
            </style>

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

    restartCaro: () => {
        GamesModule.resetCaroState();
        GamesModule.renderTabContent();
    },

    makeCaroMove: (r, c) => {
        const cState = GamesModule.caro;
        if (!cState.gameActive || cState.board[r][c] !== null) return;

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

        if (cState.gameActive && cState.gameMode === 'ai' && cState.currentPlayer === 'O') {
            setTimeout(() => {
                GamesModule.makeCaroAiMove();
            }, 400);
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

        for (let r = 0; r < cState.boardSize; r++) {
            for (let c = 0; c < cState.boardSize; c++) {
                if (cState.board[r][c] !== null) continue;

                const scoreO = GamesModule.evaluateCaroCell(r, c, 'O');
                const scoreX = GamesModule.evaluateCaroCell(r, c, 'X');
                const score = scoreO + scoreX * 1.1;

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
            cState.board[r][c] = 'O';
            GamesSynth.playMove();

            if (GamesModule.checkCaroWin(r, c)) {
                cState.gameActive = false;
                cState.winner = 'O';
                GamesSynth.playLose();
            } else {
                cState.currentPlayer = 'X';
            }
        }

        GamesModule.renderTabContent();
    },

    evaluateCaroCell: (r, c, player) => {
        const cState = GamesModule.caro;
        const directions = [[0,1], [1,0], [1,1], [1,-1]];
        let totalScore = 0;

        for (const [dr, dc] of directions) {
            let consecutive = 0;
            let openEnds = 0;

            let nr = r + dr;
            let nc = c + dc;
            while (nr >= 0 && nr < cState.boardSize && nc >= 0 && nc < cState.boardSize && cState.board[nr][nc] === player) {
                consecutive++;
                nr += dr;
                nc += dc;
            }
            if (nr >= 0 && nr < cState.boardSize && nc >= 0 && nc < cState.boardSize && cState.board[nr][nc] === null) {
                openEnds++;
            }

            nr = r - dr;
            nc = c - dc;
            while (nr >= 0 && nr < cState.boardSize && nc >= 0 && nc < cState.boardSize && cState.board[nr][nc] === player) {
                consecutive++;
                nr -= dr;
                nc -= dc;
            }
            if (nr >= 0 && nr < cState.boardSize && nc >= 0 && nc < cState.boardSize && cState.board[nr][nc] === null) {
                openEnds++;
            }

            if (consecutive >= 4) {
                totalScore += 10000;
            } else if (consecutive === 3) {
                totalScore += openEnds === 2 ? 2000 : (openEnds === 1 ? 500 : 0);
            } else if (consecutive === 2) {
                totalScore += openEnds === 2 ? 300 : (openEnds === 1 ? 80 : 0);
            } else if (consecutive === 1) {
                totalScore += openEnds === 2 ? 50 : (openEnds === 1 ? 10 : 0);
            }
        }

        const mid = cState.boardSize / 2;
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

        // Active game board
        const getTileHtml = (idx) => {
            const tile = mState.tiles[idx];
            const isOwned = tile.type === 'property' && tile.owner !== null;
            const isCorner = [0, 5, 10, 15].includes(idx);

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
                .filter(p => !p.isBankrupt && p.position === idx)
                .map(p => `<div class="mono-pawn" style="background:${p.color};" title="${p.displayName}">${p.name.charAt(0).toUpperCase()}</div>`)
                .join('');
            const hasPawns = mState.players.some(p => !p.isBankrupt && p.position === idx);

            return `
                <div class="mono-tile ${tile.type} ${sideClass} ${isCorner ? 'corner-tile' : ''} ${hasPawns ? 'has-player' : ''}" style="--bar-color: ${tile.color || 'transparent'}; ${gridPos}">
                    ${tile.type === 'property' ? '<div class="mono-color-bar"></div>' : ''}
                    <div class="mono-tile-name">${tile.name}</div>
                    ${tile.type === 'property' ? `<div class="mono-tile-cost">${tile.cost}đ</div>` : ''}
                    ${isOwned ? `<div class="mono-tile-owner" style="border-left:2px solid ${tile.owner.color}">@${tile.owner.name}</div>` : ''}
                    ${tilePawns ? `<div class="mono-tile-pawns">${tilePawns}</div>` : ''}
                </div>`;
        };

        let tilesHtml = '';
        for (let i = 0; i < 20; i++) tilesHtml += getTileHtml(i);

        const activePlayer = mState.players[mState.currentPlayerIdx];
        const isMyTurn = activePlayer && activePlayer.name === Auth.currentUser.username;

        const centerPanelHtml = `
            <div class="mono-center-panel">
                <div style="font-size: 18px; font-weight: 900; color: #a78bfa; letter-spacing: 2px; text-transform: uppercase; text-shadow: 0 0 20px rgba(167,139,250,0.35); position: relative; z-index: 1;">
                    🎲 CỜ TỶ PHÚ
                </div>
                <div style="font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 2px; position: relative; z-index: 1; font-weight: 600;">ONLINE REAL-TIME</div>

                <div style="display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,0.5); padding: 7px 14px; border-radius: 20px; border: 1.5px solid ${activePlayer.color}; box-shadow: 0 0 12px ${activePlayer.color}35; position: relative; z-index: 1; max-width: 90%;">
                    <div style="width: 22px; height: 22px; border-radius: 50%; background: ${activePlayer.color}; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 10px; color: #fff; box-shadow: 0 0 8px ${activePlayer.color}; flex-shrink: 0;">
                        ${activePlayer.name.charAt(0).toUpperCase()}
                    </div>
                    <div style="overflow: hidden;">
                        <div style="font-weight: 800; font-size: 11px; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">@${activePlayer.name}</div>
                        <div style="font-size: 8px; color: #94a3b8;">${activePlayer.displayName} ${activePlayer.isJailed ? '🔒' : ''}</div>
                    </div>
                </div>

                <div class="mono-dice-wrap">
                    ${mState.diceValues.map(v => `
                        <div class="mono-dice ${mState.isRolling ? 'rolling' : ''}">
                            ${v === 1 ? '⚀' : v === 2 ? '⚁' : v === 3 ? '⚂' : v === 4 ? '⚃' : v === 5 ? '⚄' : '⚅'}
                        </div>
                    `).join('')}
                </div>

                <div style="width: 100%; max-width: 200px; position: relative; z-index: 1;">
                    ${isMyTurn ? `
                        <button onclick="GamesModule.rollMonopolyDice()" ${mState.isRolling ? 'disabled' : ''} style="width: 100%; padding: 11px; background: linear-gradient(135deg, #8b5cf6, #ec4899); border: none; border-radius: 12px; color: #fff; font-weight: 900; font-size: 13px; cursor: pointer; box-shadow: 0 4px 20px rgba(139,92,246,0.4); text-transform: uppercase; letter-spacing: 1px; transition: all 0.2s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 25px rgba(139,92,246,0.5)'" onmouseout="this.style.transform=''; this.style.boxShadow='0 4px 20px rgba(139,92,246,0.4)'">
                            🎲 ĐỔ XÚC XẮC
                        </button>
                    ` : `
                        <div style="width: 100%; padding: 11px; background: rgba(255,255,255,0.02); border: 1.5px dashed rgba(255,255,255,0.08); border-radius: 12px; color: #64748b; font-size: 10px; font-weight: 700; text-align: center;">
                            ⏳ Đợi lượt @${activePlayer.name}...
                        </div>
                    `}
                </div>
            </div>`;

        boardContainer.innerHTML = `
            <div class="mono-arena">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0 2px;">
                    <h3 style="color: #fff; margin: 0; font-size: 16px; font-weight: 900; display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 20px;">🎲</span> CỜ TỶ PHÚ VĂN PHÒNG
                        <span style="font-size: 8px; background: linear-gradient(135deg, rgba(16,185,129,0.2), rgba(6,182,212,0.2)); color: #10b981; padding: 3px 8px; border-radius: 10px; font-weight: 800; border: 1px solid rgba(16,185,129,0.3); animation: pulse 2s infinite;">🔴 LIVE</span>
                    </h3>
                    <button onclick="GamesModule.leaveOnlineRoom()" style="background: rgba(239,68,68,0.08); border: 1.5px solid rgba(239,68,68,0.3); color: #ef4444; padding: 7px 14px; border-radius: 8px; font-size: 11px; cursor: pointer; font-weight: 800; transition: all 0.25s; text-transform: uppercase;" onmouseover="this.style.background='#ef4444'; this.style.color='#fff'" onmouseout="this.style.background='rgba(239,68,68,0.08)'; this.style.color='#ef4444'">
                        🚪 RỜI PHÒNG
                    </button>
                </div>

                <div style="display: flex; gap: 20px; flex-wrap: wrap; align-items: flex-start;">
                    <div style="flex: 1.3; min-width: 340px;">
                        <div class="mono-board">
                            ${tilesHtml}
                            ${centerPanelHtml}
                        </div>
                    </div>

                    <div style="flex: 0.7; min-width: 260px; display: flex; flex-direction: column; gap: 14px;">
                        <div class="mono-hud-players">
                            <h4 style="margin: 0 0 12px 0; color: #a78bfa; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid rgba(139,92,246,0.15); padding-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                                👑 BẢNG XẾP HẠNG CÔNG ĐỨC
                            </h4>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                ${mState.players.map((p, idx) => `
                                    <div style="display: flex; align-items: center; justify-content: space-between; background: ${idx === mState.currentPlayerIdx && !p.isBankrupt ? `linear-gradient(135deg, ${p.color}12, ${p.color}06)` : 'rgba(255,255,255,0.015)'}; border: 1.5px solid ${idx === mState.currentPlayerIdx && !p.isBankrupt ? p.color + '40' : 'rgba(255,255,255,0.04)'}; padding: 10px 12px; border-radius: 10px; opacity: ${p.isBankrupt ? '0.35' : '1'}; transition: all 0.3s;">
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
                            <h4 style="margin: 0 0 10px 0; color: #a78bfa; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid rgba(139,92,246,0.15); padding-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                                📜 NHẬT KÝ TRẬN ĐẤU
                            </h4>
                            <div id="mono-log-area" style="flex: 1; max-height: 200px; min-height: 120px; overflow-y: auto; display: flex; flex-direction: column; gap: 5px; font-size: 11px; color: #94a3b8; padding-right: 4px;">
                                ${mState.logs.map(log => `
                                    <div style="line-height: 1.4; padding: 4px 8px; border-radius: 5px; background: rgba(255,255,255,0.015); border-left: 2px solid rgba(139,92,246,0.15);">
                                        ${log}
                                    </div>
                                `).reverse().join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const logArea = document.getElementById('mono-log-area');
        if (logArea) logArea.scrollTop = logArea.scrollHeight;
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
                        mState.lobbyRooms.push(doc.data());
                    });
                    // Re-render only if currently in lobby mode
                    if (GamesModule.activeTab === 'monopoly' && !mState.activeRoomId) {
                        GamesModule.renderTabContent();
                    }
                });
        }

        const roomsHtml = mState.lobbyRooms.length === 0 
            ? `<div style="text-align:center; padding: 40px; color:#64748b; font-size: 13px;">Chưa có phòng đấu nào mở. Hãy làm chủ phòng tạo phòng đầu tiên! 🚀</div>`
            : mState.lobbyRooms.map(r => {
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
            cash: 15,
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
            diceValues: [1],
            isRolling: false,
            logs: [`🏁 Phòng đấu online được kiến tạo bởi @${user.username}.`],
            tiles: GamesModule.monopoly.tiles.map(t => ({ id: t.id, ownerName: null }))
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
            cash: 15,
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
        GamesModule.monopoly.activeRoomId = roomId;

        if (GamesModule.monopoly.roomListener) GamesModule.monopoly.roomListener();

        GamesModule.monopoly.roomListener = db.collection("monopoly_rooms").doc(roomId)
            .onSnapshot((doc) => {
                if (!doc.exists) {
                    GamesModule.leaveRoomState("Phòng đấu đã bị đóng bởi chủ phòng!");
                    return;
                }

                const room = doc.data();
                GamesModule.monopoly.players = room.players;
                GamesModule.monopoly.currentPlayerIdx = room.currentPlayerIdx;
                GamesModule.monopoly.diceValues = room.diceValues;
                GamesModule.monopoly.isRolling = room.isRolling;
                GamesModule.monopoly.logs = room.logs;

                // Sync tile ownership dynamically
                room.tiles.forEach(rt => {
                    const localTile = GamesModule.monopoly.tiles.find(t => t.id === rt.id);
                    if (localTile) {
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

        if (message) Utils.showToast(message, "warning");
        GamesModule.renderTabContent();
    },

    // Người chơi tự rời phòng hoặc chủ phòng xóa phòng
    leaveOnlineRoom: async () => {
        const mState = GamesModule.monopoly;
        if (!mState.activeRoomId || typeof db === 'undefined') return;

        const user = Auth.currentUser;
        const activeRoom = mState.lobbyRooms.find(r => r.id === mState.activeRoomId) || { host: '' };

        if (!confirm("Bạn có chắc chắn muốn rời phòng đấu?")) return;

        try {
            if (activeRoom.host === user.username) {
                // Host leaves: Delete entire room
                await db.collection("monopoly_rooms").doc(mState.activeRoomId).delete();
            } else {
                // Member leaves: Remove player
                const roomDoc = await db.collection("monopoly_rooms").doc(mState.activeRoomId).get();
                if (roomDoc.exists) {
                    const room = roomDoc.data();
                    room.players = room.players.filter(p => p.name !== user.username);
                    room.logs.push(`🚪 @${user.username} đã rời khỏi sảnh phòng cờ.`);
                    await db.collection("monopoly_rooms").doc(mState.activeRoomId).set(room);
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
    openInviteEmployeesModal: () => {
        const emps = GamesModule.monopoly.availableEmployees;
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
                                <span style="font-size: 12px; font-weight: bold;">@${emp.username}</span>
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
            tiles: mState.tiles.map(t => ({ id: t.id, ownerName: t.owner ? t.owner.name : null }))
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

        // Start roll state on Firestore to notify dice shake globally
        mState.isRolling = true;
        await GamesModule.syncRoomToFirestore();

        GamesSynth.playRoll();

        // Local Dice roll animation tick
        let rollCounter = 0;
        const interval = setInterval(async () => {
            mState.diceValues = [Math.floor(Math.random() * 6) + 1];
            GamesModule.renderTabContent();
            rollCounter++;

            if (rollCounter >= 8) {
                clearInterval(interval);
                mState.isRolling = false;

                // Final Dice Result calculation
                const finalRoll = Math.floor(Math.random() * 6) + 1;
                mState.diceValues = [finalRoll];
                
                GamesModule.processMonopolyTurn(finalRoll);
            }
        }, 100);
    },

    processMonopolyTurn: async (roll) => {
        const mState = GamesModule.monopoly;
        const player = mState.players[mState.currentPlayerIdx];

        mState.logs.push(`🎲 <b>@${player.name}</b> đổ ra <b>${roll}</b> nút!`);

        // Check if Jailed
        if (player.isJailed) {
            if (roll === 6) {
                player.isJailed = false;
                mState.logs.push(`🔓 <b>@${player.name}</b> đổ ra 6 và đã thoát án Phạt Đi Muộn thành công!`);
            } else {
                if (player.cash >= 2) {
                    player.cash -= 2;
                    player.isJailed = false;
                    mState.logs.push(`💸 <b>@${player.name}</b> tự đóng phạt 2đ Công Đức cho HR để thoát án Phạt đi muộn.`);
                } else {
                    mState.logs.push(`🔒 <b>@${player.name}</b> tiếp tục bị tạm giữ 1 lượt vì không đủ 2đ nộp phạt.`);
                    await GamesModule.finishMonopolyTurn();
                    return;
                }
            }
        }

        const oldPos = player.position;
        const newPos = (oldPos + roll) % 20;
        player.position = newPos;

        if (newPos < oldPos) {
            player.cash += 2;
            mState.logs.push(`🚩 <b>@${player.name}</b> đâm qua ô Khởi Đầu, HR thưởng nóng +2đ Công Đức!`);
        }

        const tile = mState.tiles[newPos];
        mState.logs.push(`📍 <b>@${player.name}</b> đặt chân lên ô <b>${tile.name}</b>.`);

        if (tile.type === 'property') {
            GamesModule.handlePropertyTile(player, tile);
        } else if (tile.type === 'tax') {
            player.cash = Math.max(0, player.cash - tile.cost);
            mState.logs.push(`💸 <b>@${player.name}</b> ${tile.desc}. Trừ ${tile.cost}đ Công Đức!`);
            GamesModule.checkBankruptcy(player);
            await GamesModule.finishMonopolyTurn();
        } else if (tile.type === 'buff') {
            player.cash += 2;
            mState.logs.push(`🍔 <b>@${player.name}</b> ${tile.desc}. Cộng +2đ Công Đức!`);
            await GamesModule.finishMonopolyTurn();
        } else if (tile.type === 'jail') {
            player.isJailed = true;
            mState.logs.push(`🔒 Cảnh báo! <b>@${player.name}</b> bị HR phát hiện Đi Muộn không lý do! Bị tạm giam phạt đứng tại đây.`);
            await GamesModule.finishMonopolyTurn();
        } else if (tile.type === 'chance' || tile.type === 'lucky') {
            GamesModule.drawMonopolyCard(player, tile.type);
        } else {
            await GamesModule.finishMonopolyTurn();
        }
    },

    handlePropertyTile: (player, tile) => {
        const mState = GamesModule.monopoly;

        if (tile.owner === null) {
            GamesModule.renderMonopolyPurchaseModal(player, tile);
        } else if (tile.owner.name === player.name) {
            mState.logs.push(`🏠 <b>@${player.name}</b> thanh tra phòng ban của chính mình.`);
            GamesModule.finishMonopolyTurn();
        } else {
            const rent = tile.rent;
            player.cash -= rent;
            
            // Find owner in roster and add rent
            const ownerObj = mState.players.find(p => p.name === tile.owner.name);
            if (ownerObj) ownerObj.cash += rent;

            mState.logs.push(`💸 <b>@${player.name}</b> dẫm vào ô của <b>@${tile.owner.name}</b>! Trả tiền thuê <b>${rent}đ</b> Công Đức.`);
            
            GamesModule.checkBankruptcy(player);
            GamesModule.finishMonopolyTurn();
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
                        <span>Điểm thuê phòng ban:</span>
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
        document.getElementById('mono-card-overlay')?.remove();
        GamesModule.checkBankruptcy(GamesModule.monopoly.players[GamesModule.monopoly.currentPlayerIdx]);
        await GamesModule.finishMonopolyTurn();
    },

    checkBankruptcy: (player) => {
        const mState = GamesModule.monopoly;
        if (player.cash <= 0) {
            player.isBankrupt = true;
            mState.logs.push(`💀 <b>@${player.name}</b> đã tuyên bố Phá Sản! Toàn bộ phòng ban sở hữu được trả về ngân hàng công ty.`);
            
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

        let nextIdx = mState.currentPlayerIdx;
        do {
            nextIdx = (nextIdx + 1) % mState.players.length;
        } while (mState.players[nextIdx].isBankrupt);

        mState.currentPlayerIdx = nextIdx;
        
        // Sync turn completion to Firestore (this pushes update globally!)
        await GamesModule.syncRoomToFirestore();
    }
};
