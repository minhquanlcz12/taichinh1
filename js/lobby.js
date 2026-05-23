/**
 * js/lobby.js - Chibi Lobby Module
 * Manages movement, chat, and Caro PvP
 */

const LobbyModule = {
    state: {
        isConnected: false,
        users: {}, // { username: { x, y, config } }
        myPos: { x: 500, y: 500 },
        unsubscribePresence: null,
        unsubscribeChat: null,
        isMoving: false
    },

    init: () => {
        console.log("LobbyModule initialized");
    },

    enterLobby: async () => {
        if (LobbyModule.state.isConnected) return;
        
        const user = Auth.currentUser;
        if (!user) return;

        // Initial position
        LobbyModule.state.myPos = {
            x: Math.random() * (window.innerWidth - 100) + 50,
            y: Math.random() * (window.innerHeight - 200) + 100
        };

        LobbyModule.state.inviteShown = null;
        LobbyModule.renderLobbyBase();
        LobbyModule.state.isConnected = true;
        
        // Start listening to logic
        LobbyModule.startListening();
        LobbyModule.listenToGames();
        
        // Send initial presence
        await LobbyModule.syncMyPresence();
        
        // Add click listener for movement
        document.getElementById('lobby-map-container').addEventListener('mousedown', LobbyModule.handleMapClick);
    },

    leaveLobby: () => {
        if (LobbyModule.state.unsubscribePresence) LobbyModule.state.unsubscribePresence();
        if (LobbyModule.state.unsubscribeChat) LobbyModule.state.unsubscribeChat();
        
        LobbyModule.state.isConnected = false;
        
        // Remove from persistent if needed or let heartbeat handle it
    },

    renderLobbyBase: () => {
        const container = document.getElementById('lobby-view');
        if (!container) return;

        container.innerHTML = `
            <div id="lobby-map-container" style="width: 100%; height: 100%; position: relative; cursor: crosshair; overflow: hidden;">
                <div class="lobby-map" id="lobby-map">
                    <!-- Global users rendered here -->
                </div>
                
                <!-- Chat Overlay -->
                <div class="lobby-chat-overlay">
                    <div class="lobby-chat-messages" id="lobby-chat-messages">
                        <div class="lobby-message">
                            <span class="lobby-msg-text" style="color: #a855f7; font-style: italic;">Hệ thống: Chào mừng tới Sảnh Chờ Chibi! Click chuột để di chuyển.</span>
                        </div>
                    </div>
                    <form class="lobby-chat-input-wrap" onsubmit="LobbyModule.sendChat(event)">
                        <input type="text" id="lobby-chat-input" class="lobby-chat-input" placeholder="Chat với mọi người..." autocomplete="off">
                    </form>
                </div>
            </div>
        `;
    },

    handleMapClick: (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Visual feedback
        const ripple = document.createElement('div');
        ripple.className = 'lobby-click-ripple';
        ripple.style.left = `${x - 10}px`;
        ripple.style.top = `${y - 5}px`;
        e.currentTarget.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);

        LobbyModule.moveTo(x, y);
    },

    moveTo: async (x, y) => {
        LobbyModule.state.myPos = { x, y };
        LobbyModule.renderUser('me', Auth.currentUser.username, x, y, Auth.currentUser.profile?.chibiConfig);
        await LobbyModule.syncMyPresence();
    },

    renderUser: (id, username, x, y, config) => {
        let el = document.getElementById(`user-${username}`);
        const isMe = username === Auth.currentUser.username;
        
        if (!el) {
            el = document.createElement('div');
            el.id = `user-${username}`;
            el.className = `lobby-user-wrapper ${isMe ? 'me' : ''}`;
            
            // Context menu on click
            if (!isMe) {
                el.style.cursor = 'pointer';
                el.onclick = (e) => {
                    e.stopPropagation();
                    LobbyModule.showUserMenu(username);
                };
            }
            
            document.getElementById('lobby-map').appendChild(el);
        }

        const chibiSvg = ChibiModule.renderChibiSVG(config || {}, false, 0);
        
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.innerHTML = `
            <div class="lobby-user-name">${username}</div>
            <div class="lobby-chibi-container" style="transform: scale(0.6);">
                ${chibiSvg}
            </div>
            ${!isMe ? `<div class="lobby-user-status">Click to Challenge</div>` : ''}
        `;
    },

    showUserMenu: (targetUser) => {
        Utils.showModal(
            `⚔️ THÁCH ĐẤU: ${targetUser}`,
            `<div style="text-align: center;">
                <p>Bạn có muốn thách đấu Cờ Caro với <b>${targetUser}</b> không?</p>
                <div style="margin-top: 20px; font-size: 13px; color: var(--text-secondary);">Người thắng sẽ được cộng điểm cống hiến!</div>
            </div>`,
            async () => {
                LobbyModule.inviteToCaro(targetUser);
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

    // Handle incoming invites and game updates
    // In startListening, we should also listen to games where I am player2 and status is 'playing'
    listenToGames: () => {
        const me = Auth.currentUser.username;
        // Simplified: Listen to games where status is 'playing' and I am one of the players
        // In a real app, query by player1 OR player2. 
        // For here, I'll just listen to the whole collection for simplicity in this demo environment.
        db.collection("lobby_games")
            .where("status", "==", "playing")
            .onSnapshot(snapshot => {
                snapshot.docChanges().forEach(change => {
                    const game = change.doc.data();
                    const gameId = change.doc.id;

                    if (game.player2 === me && !game.p2Accepted) {
                        LobbyModule.showIncomingInvite(gameId, game.player1);
                    } else if (LobbyModule.state.currentGameId === gameId) {
                        LobbyModule.onGameUpdate(game);
                    } else if ((game.player1 === me || game.player2 === me) && game.p2Accepted) {
                        LobbyModule.openCaroBoard(gameId, game);
                    }
                });
            });
    },

    showIncomingInvite: (gameId, fromUser) => {
        if (LobbyModule.state.inviteShown === gameId) return;
        LobbyModule.state.inviteShown = gameId;

        Utils.showModal(
            `🎮 LỜI MỜI THÁCH ĐẤU`,
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
        if (LobbyModule.state.currentGameId === gameId) return;
        LobbyModule.state.currentGameId = gameId;

        const container = document.getElementById('lobby-view');
        const boardOverlay = document.createElement('div');
        boardOverlay.id = 'caro-overlay';
        boardOverlay.className = 'caro-modal';
        boardOverlay.innerHTML = `
            <div class="caro-board-container">
                <div style="display: flex; justify-content: space-between; margin-bottom: 15px; align-items: center;">
                    <div style="color: #fff;">
                        <span id="caro-p1" style="font-weight: bold;">${game.player1} (X)</span> vs 
                        <span id="caro-p2" style="font-weight: bold;">${game.player2} (O)</span>
                    </div>
                    <button class="btn btn-sm btn-danger" onclick="LobbyModule.forfeitGame()">Cầu Hòa/Bỏ cuộc</button>
                </div>
                <div id="caro-status-msg" style="color: var(--lobby-accent); font-weight: bold; margin-bottom: 10px; text-align: center;">Đang chờ lượt...</div>
                <div class="caro-grid" id="caro-grid">
                    ${Array(225).fill(0).map((_, i) => `<div class="caro-cell" data-index="${i}" onclick="LobbyModule.makeMove(${i})"></div>`).join('')}
                </div>
            </div>
        `;
        container.appendChild(boardOverlay);
        LobbyModule.onGameUpdate(game);
    },

    makeMove: async (index) => {
        const gameId = LobbyModule.state.currentGameId;
        const game = LobbyModule.state.currentGameData;
        const me = Auth.currentUser.username;

        if (game.turn !== me) {
            Utils.showToast("Chưa tới lượt của bạn!", "warning");
            return;
        }
        if (game.board[index]) return;

        const newBoard = [...game.board];
        newBoard[index] = (me === game.player1) ? 'X' : 'O';
        
        const winner = LobbyModule.checkWin(newBoard, index);
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
        LobbyModule.state.currentGameData = game;
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
                document.getElementById('caro-overlay').remove();
                LobbyModule.state.currentGameId = null;
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

        const directions = [
            [1, 0],  // Ngang
            [0, 1],  // Dọc
            [1, 1],  // Chéo chính
            [1, -1]  // Chéo phụ
        ];

        for (const [dx, dy] of directions) {
            let count = 1;
            // Tiến
            for (let i = 1; i < 5; i++) {
                const nx = x + dx * i;
                const ny = y + dy * i;
                if (nx >= 0 && nx < size && ny >= 0 && ny < size && board[ny * size + nx] === symbol) count++;
                else break;
            }
            // Lùi
            for (let i = 1; i < 5; i++) {
                const nx = x - dx * i;
                const ny = y - dy * i;
                if (nx >= 0 && nx < size && ny >= 0 && ny < size && board[ny * size + nx] === symbol) count++;
                else break;
            }
            if (count >= 5) return true;
        }
        return false;
    },

    forfeitGame: async () => {
        if (!confirm("Bạn muốn bỏ cuộc?")) return;
        const gameId = LobbyModule.state.currentGameId;
        const game = LobbyModule.state.currentGameData;
        const me = Auth.currentUser.username;
        const opponent = (me === game.player1) ? game.player2 : game.player1;

        await DB.updateLobbyGame(gameId, {
            status: 'finished',
            winner: opponent
        });
    }
};
