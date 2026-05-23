/**
 * js/lobby_v100.js - Chibi Lobby Module (Complete Rewrite)
 * Manages: Chibi movement, Chat, Caro PvP
 */

const LobbyNPS = {
    state: {
        isConnected: false,
        users: {},
        myPos: { x: 300, y: 300 },
        unsubscribePresence: null,
        unsubscribeChat: null,
        inviteShown: null,
        currentGameId: null,
        currentGameData: null,
        heartbeatInterval: null
    },

    init: () => {
        console.log("LobbyNPS initialized");
    },

    // ========== ENTRY / EXIT ==========
    enterLobby: async () => {
        console.log("LobbyNPS.enterLobby called");
        if (LobbyNPS.state.isConnected) {
            console.log("Already connected, skip.");
            return;
        }

        const user = Auth.currentUser;
        if (!user) {
            console.error("LobbyNPS: No Auth.currentUser!");
            return;
        }

        // Random initial position (within visible area)
        const mapContainer = document.getElementById('lobby-view');
        const w = mapContainer ? mapContainer.offsetWidth : 800;
        const h = mapContainer ? mapContainer.offsetHeight : 600;
        LobbyNPS.state.myPos = {
            x: Math.floor(Math.random() * (w - 200)) + 100,
            y: Math.floor(Math.random() * (h - 300)) + 80
        };

        // Render base UI
        LobbyNPS.renderLobbyBase();
        LobbyNPS.state.isConnected = true;
        LobbyNPS.state.inviteShown = null;

        // Render my Chibi immediately (local)
        console.log("Rendering my Chibi at", LobbyNPS.state.myPos);
        LobbyNPS.renderUser(user.username, LobbyNPS.state.myPos.x, LobbyNPS.state.myPos.y, user.profile?.chibiConfig);

        // Start real-time listeners
        LobbyNPS.startListening();
        LobbyNPS.listenToGames();

        // Push my presence to Firestore
        await LobbyNPS.syncMyPresence();

        // Heartbeat every 15s
        LobbyNPS.state.heartbeatInterval = setInterval(() => {
            LobbyNPS.syncMyPresence();
        }, 15000);

        // Click to move
        const container = document.getElementById('lobby-map-container');
        if (container) {
            container.addEventListener('mousedown', LobbyNPS.handleMapClick);
        }

        console.log("LobbyNPS fully initialized!");
    },

    leaveLobby: () => {
        if (LobbyNPS.state.unsubscribePresence) LobbyNPS.state.unsubscribePresence();
        if (LobbyNPS.state.unsubscribeChat) LobbyNPS.state.unsubscribeChat();
        if (LobbyNPS.state.heartbeatInterval) clearInterval(LobbyNPS.state.heartbeatInterval);
        LobbyNPS.state.isConnected = false;
        LobbyNPS.state.currentGameId = null;
    },

    // ========== SYNC / PRESENCE ==========
    syncMyPresence: async () => {
        const user = Auth.currentUser;
        if (!user) return;
        try {
            await DB.updateLobbyPresence({
                username: user.username,
                x: LobbyNPS.state.myPos.x,
                y: LobbyNPS.state.myPos.y,
                chibiConfig: user.profile?.chibiConfig || {}
            });
        } catch (e) {
            console.error("syncMyPresence error:", e);
        }
    },

    startListening: () => {
        const me = Auth.currentUser?.username;
        if (!me) return;

        // Listen to all users' presence
        LobbyNPS.state.unsubscribePresence = DB.listenLobbyPresence((allUsers) => {
            const now = Date.now();
            Object.entries(allUsers).forEach(([username, data]) => {
                // Skip stale users (>60s)
                if (data.lastSeen && data.lastSeen.toDate) {
                    const diff = now - data.lastSeen.toDate().getTime();
                    if (diff > 60000) {
                        // Remove stale
                        const staleEl = document.getElementById(`user-${username}`);
                        if (staleEl) staleEl.remove();
                        return;
                    }
                }
                // Render other users (skip self to avoid jitter)
                if (username !== me) {
                    LobbyNPS.renderUser(username, data.x, data.y, data.chibiConfig);
                }
            });
        });

        // Listen to chat
        LobbyNPS.state.unsubscribeChat = DB.listenLobbyChat((messages) => {
            LobbyNPS.renderChatMessages(messages);
        });
    },

    // ========== RENDER ==========
    renderLobbyBase: () => {
        const container = document.getElementById('lobby-view');
        if (!container) {
            console.error("lobby-view not found!");
            return;
        }

        container.innerHTML = `
            <div id="lobby-map-container" style="width: 100%; height: 100%; position: relative; cursor: crosshair; overflow: hidden;">
                <div class="lobby-map" id="lobby-map">
                    <!-- Chibi characters go here -->
                </div>

                <div class="lobby-chat-overlay">
                    <div class="lobby-chat-messages" id="lobby-chat-messages">
                        <div class="lobby-message">
                            <span class="lobby-msg-text" style="color: #a855f7; font-style: italic;">Hệ thống: Chào mừng tới Sảnh Chờ Chibi! Click chuột để di chuyển nhân vật.</span>
                        </div>
                    </div>
                    <form class="lobby-chat-input-wrap" onsubmit="LobbyNPS.sendChat(event)">
                        <input type="text" id="lobby-chat-input" class="lobby-chat-input" placeholder="Nhắn tin với mọi người..." autocomplete="off">
                    </form>
                </div>
            </div>
        `;
    },

    renderUser: (username, x, y, config) => {
        const map = document.getElementById('lobby-map');
        if (!map) {
            console.error("lobby-map not found, cannot render", username);
            return;
        }

        let el = document.getElementById(`user-${username}`);
        const me = Auth.currentUser?.username;
        const isMe = username === me;

        if (!el) {
            el = document.createElement('div');
            el.id = `user-${username}`;
            el.className = `lobby-user-wrapper ${isMe ? 'me' : ''}`;

            if (!isMe) {
                el.style.cursor = 'pointer';
                el.onclick = (e) => {
                    e.stopPropagation();
                    LobbyNPS.showUserMenu(username);
                };
            }
            map.appendChild(el);
        }

        // Generate Chibi SVG
        let chibiSvg = '';
        try {
            chibiSvg = ChibiModule.renderChibiSVG(config || {}, false, 0);
        } catch (e) {
            console.error("renderChibiSVG error:", e);
            chibiSvg = `<div style="width:50px;height:50px;background:#a855f7;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;">🧑</div>`;
        }

        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.innerHTML = `
            <div class="lobby-user-name">${username}</div>
            <div class="lobby-chibi-container" style="transform: scale(0.6);">
                ${chibiSvg}
            </div>
            ${!isMe ? '<div class="lobby-user-status">⚔️ Thách đấu</div>' : ''}
        `;
    },

    // ========== MOVEMENT ==========
    handleMapClick: (e) => {
        // Don't move if clicking on chat overlay
        if (e.target.closest('.lobby-chat-overlay')) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Ripple effect
        const ripple = document.createElement('div');
        ripple.className = 'lobby-click-ripple';
        ripple.style.left = `${x - 10}px`;
        ripple.style.top = `${y - 5}px`;
        document.getElementById('lobby-map-container').appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);

        LobbyNPS.moveTo(x, y);
    },

    moveTo: async (x, y) => {
        LobbyNPS.state.myPos = { x, y };
        LobbyNPS.renderUser(Auth.currentUser.username, x, y, Auth.currentUser.profile?.chibiConfig);
        await LobbyNPS.syncMyPresence();
    },

    // ========== CHAT ==========
    sendChat: async (e) => {
        e.preventDefault();
        const input = document.getElementById('lobby-chat-input');
        const text = input.value.trim();
        if (!text) return;
        input.value = '';

        await DB.sendLobbyChat({
            sender: Auth.currentUser.username,
            text: text
        });
    },

    renderChatMessages: (messages) => {
        const container = document.getElementById('lobby-chat-messages');
        if (!container) return;

        // Keep system message + render new ones
        let html = `<div class="lobby-message">
            <span class="lobby-msg-text" style="color: #a855f7; font-style: italic;">Hệ thống: Chào mừng tới Sảnh Chờ Chibi!</span>
        </div>`;

        messages.forEach(msg => {
            html += `
                <div class="lobby-message">
                    <span class="lobby-msg-sender">${msg.sender}:</span>
                    <span class="lobby-msg-text">${msg.text}</span>
                </div>
            `;
        });

        container.innerHTML = html;
        container.scrollTop = container.scrollHeight;
    },

    // ========== CHALLENGE / CARO ==========
    showUserMenu: (targetUser) => {
        Utils.showModal(
            `⚔️ THÁCH ĐẤU: ${targetUser}`,
            `<div style="text-align: center;">
                <p>Bạn có muốn thách đấu <b>Cờ Caro</b> với <b>${targetUser}</b> không?</p>
                <div style="margin-top: 20px; font-size: 13px; color: var(--text-secondary);">Người thắng sẽ được cộng điểm cống hiến!</div>
            </div>`,
            async () => {
                LobbyNPS.inviteToCaro(targetUser);
                return true;
            },
            'GỬI LỜI MỜI'
        );
    },

    inviteToCaro: async (targetUser) => {
        const gameId = await DB.createLobbyGame(Auth.currentUser.username, targetUser);
        if (gameId) {
            Utils.showToast(`Đã gửi lời mời thách đấu tới ${targetUser}!`, 'info');
        }
    },

    listenToGames: () => {
        const me = Auth.currentUser?.username;
        if (!me) return;

        db.collection("lobby_games")
            .where("status", "==", "playing")
            .onSnapshot(snapshot => {
                snapshot.docChanges().forEach(change => {
                    const game = change.doc.data();
                    const gameId = change.doc.id;

                    if (game.player2 === me && !game.p2Accepted) {
                        LobbyNPS.showIncomingInvite(gameId, game.player1);
                    } else if (LobbyNPS.state.currentGameId === gameId) {
                        LobbyNPS.onGameUpdate(game);
                    } else if ((game.player1 === me || game.player2 === me) && game.p2Accepted) {
                        LobbyNPS.openCaroBoard(gameId, game);
                    }
                });
            });
    },

    showIncomingInvite: (gameId, fromUser) => {
        if (LobbyNPS.state.inviteShown === gameId) return;
        LobbyNPS.state.inviteShown = gameId;

        Utils.showModal(
            '🎮 LỜI MỜI THÁCH ĐẤU',
            `<div style="text-align: center;">
                <p><b>${fromUser}</b> muốn thách đấu Cờ Caro với bạn!</p>
            </div>`,
            async () => {
                await DB.updateLobbyGame(gameId, { p2Accepted: true });
                return true;
            },
            'CHẤP NHẬN',
            'TỪ CHỐI',
            async () => {
                await DB.updateLobbyGame(gameId, { status: 'rejected' });
                return true;
            }
        );
    },

    openCaroBoard: (gameId, game) => {
        if (LobbyNPS.state.currentGameId === gameId) return;
        LobbyNPS.state.currentGameId = gameId;

        const container = document.getElementById('lobby-view');
        const boardOverlay = document.createElement('div');
        boardOverlay.id = 'caro-overlay';
        boardOverlay.className = 'caro-modal';
        boardOverlay.innerHTML = `
            <div class="caro-board-container">
                <div style="display: flex; justify-content: space-between; margin-bottom: 15px; align-items: center;">
                    <div style="color: #fff;">
                        <span style="font-weight: bold;">${game.player1} (X)</span> vs 
                        <span style="font-weight: bold;">${game.player2} (O)</span>
                    </div>
                    <button class="btn btn-sm btn-danger" onclick="LobbyNPS.forfeitGame()">Bỏ cuộc</button>
                </div>
                <div id="caro-status-msg" style="color: var(--lobby-accent); font-weight: bold; margin-bottom: 10px; text-align: center;">Đang chờ lượt...</div>
                <div class="caro-grid" id="caro-grid">
                    ${Array(225).fill(0).map((_, i) => `<div class="caro-cell" data-index="${i}" onclick="LobbyNPS.makeMove(${i})"></div>`).join('')}
                </div>
            </div>
        `;
        container.appendChild(boardOverlay);
        LobbyNPS.onGameUpdate(game);
    },

    makeMove: async (index) => {
        const gameId = LobbyNPS.state.currentGameId;
        const game = LobbyNPS.state.currentGameData;
        const me = Auth.currentUser.username;

        if (game.turn !== me) {
            Utils.showToast("Chưa tới lượt của bạn!", "warning");
            return;
        }
        if (game.board[index]) return;

        const newBoard = [...game.board];
        newBoard[index] = (me === game.player1) ? 'X' : 'O';

        const winner = LobbyNPS.checkWin(newBoard, index);
        const updateData = {
            board: newBoard,
            turn: (me === game.player1) ? game.player2 : game.player1
        };

        if (winner) {
            updateData.status = 'finished';
            updateData.winner = me;
        }

        await DB.updateLobbyGame(gameId, updateData);
    },

    onGameUpdate: (game) => {
        LobbyNPS.state.currentGameData = game;
        const grid = document.getElementById('caro-grid');
        if (!grid) return;

        const cells = grid.querySelectorAll('.caro-cell');
        game.board.forEach((val, i) => {
            if (val) {
                cells[i].textContent = val;
                cells[i].className = `caro-cell ${val.toLowerCase()}`;
            }
        });

        const me = Auth.currentUser.username;
        const statusMsg = document.getElementById('caro-status-msg');
        if (game.status === 'finished') {
            statusMsg.textContent = game.winner === me ? "🎉 BẠN ĐÃ THẮNG!" : `💀 ${game.winner} đã thắng!`;
            setTimeout(() => {
                const overlay = document.getElementById('caro-overlay');
                if (overlay) overlay.remove();
                LobbyNPS.state.currentGameId = null;
            }, 5000);
        } else {
            statusMsg.textContent = game.turn === me ? "🟢 TỚI LƯỢT CỦA BẠN" : `⏳ Chờ ${game.turn} đi quân...`;
        }
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
        if (!confirm("Bạn muốn bỏ cuộc?")) return;
        const gameId = LobbyNPS.state.currentGameId;
        const game = LobbyNPS.state.currentGameData;
        const me = Auth.currentUser.username;
        const opponent = (me === game.player1) ? game.player2 : game.player1;

        await DB.updateLobbyGame(gameId, {
            status: 'finished',
            winner: opponent
        });
    }
};
