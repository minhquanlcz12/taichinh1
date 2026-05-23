/**
 * js/lobby_v100.js - Chibi Lobby Module (Neon Upgrade)
 * Manages: Chibi movement, Chat, Caro PvP
 */

const LobbyNeon = {
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
        isMakingMove: false
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

        LobbyNeon.startListening();
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

    startListening: () => {
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
        });

        LobbyNeon.state.unsubscribeChat = DB.listenLobbyChat((messages) => {
            LobbyNeon.renderChatMessages(messages);
        });
    },

    // ========== RENDER ==========
    renderLobbyBase: () => {
        const container = document.getElementById('lobby-view');
        if (!container) return;

        container.innerHTML = `
            <div id="lobby-map-container" style="width: 100%; height: 100%; position: relative; cursor: crosshair; overflow: hidden; background: radial-gradient(circle at center, #1e293b 0%, #0f172a 100%);">
                <div class="lobby-map" id="lobby-map"></div>

                <div class="lobby-chat-overlay">
                    <div class="lobby-chat-messages" id="lobby-chat-messages">
                        <div class="lobby-message">
                            <span class="lobby-msg-text" style="color: #a855f7; font-style: italic; opacity: 0.8;">Hệ thống: Chào mừng tới Sảnh Chờ Neon! Click chuột để di chuyển.</span>
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
            // INCREASE SCALE to 1.2 for bigger character
            chibiSvg = ChibiModule.renderChibiSVG(config || {}, false, 0);
        } catch (e) {
            chibiSvg = `<div style="font-size: 40px;">👤</div>`;
        }

        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.innerHTML = `
            <div class="lobby-user-name">${username}</div>
            <div class="lobby-chibi-container" style="transform: scale(1.3);">
                ${chibiSvg}
            </div>
            ${!isMe ? '<div class="lobby-user-status">⚔️ THÁCH ĐẤU</div>' : ''}
        `;
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
        let html = `<div class="lobby-message"><span class="lobby-msg-text" style="color: #a855f7; font-style: italic; opacity: 0.7;">Hệ thống: Chào mừng tới Sảnh Chờ Neon!</span></div>`;
        messages.forEach(msg => {
            html += `<div class="lobby-message"><span class="lobby-msg-sender">${msg.sender}:</span><span class="lobby-msg-text">${msg.text}</span></div>`;
        });
        container.innerHTML = html;
        container.scrollTop = container.scrollHeight;
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
                    <div style="color: #fff; font-size: 16px;">
                        <span style="color: #ff4757; font-weight: 900; text-shadow: 0 0 5px #ff4757;">${game.player1} (X)</span> 
                        <span style="margin: 0 10px; opacity: 0.5;">VS</span> 
                        <span style="color: #2ed573; font-weight: 900; text-shadow: 0 0 5px #2ed573;">${game.player2} (O)</span>
                    </div>
                    <button class="btn-neon-danger" onclick="LobbyNeon.forfeitGame()">Rút lui</button>
                </div>
                <div id="caro-status-msg" style="color: #fff; font-weight: 800; font-size: 14px; margin-bottom: 15px; text-align: center; background: rgba(168, 85, 247, 0.2); padding: 5px; border-radius: 8px;">Đang chuẩn bị...</div>
                <div class="caro-grid" id="caro-grid">
                    ${Array(225).fill(0).map((_, i) => `<div class="caro-cell" onclick="LobbyNeon.makeMove(${i})"></div>`).join('')}
                </div>
                <div id="caro-winner-ui" class="caro-winner-overlay" style="display: none;">
                    <div class="winner-text">🎉 THẮNG CUỘC!</div>
                    <p style="color: #fff; font-size: 18px;">Hài lòng với chiến tích này?</p>
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
        } catch (e) {
            console.error("makeMove error:", e);
        } finally {
            LobbyNeon.state.isMakingMove = false;
        }
    },

    onGameUpdate: (game) => {
        LobbyNeon.state.currentGameData = game;
        const grid = document.getElementById('caro-grid');
        if (!grid) return;

        const cells = grid.querySelectorAll('.caro-cell');
        game.board.forEach((val, i) => {
            if (val && !cells[i].classList.contains(val.toLowerCase())) {
                cells[i].textContent = val;
                cells[i].className = `caro-cell ${val.toLowerCase()}`;
            }
        });

        const me = Auth.currentUser.username;
        const statusMsg = document.getElementById('caro-status-msg');
        const winnerUI = document.getElementById('caro-winner-ui');

        if (game.status === 'finished') {
            winnerUI.style.display = 'flex';
            const winnerText = winnerUI.querySelector('.winner-text');
            if (game.winner === me) {
                winnerText.innerHTML = "🏆 CHIẾN THẮNG!";
                winnerText.style.color = "#2ed573";
                winnerText.style.textShadow = "0 0 20px #2ed573";
            } else {
                winnerText.innerHTML = "💀 BẠI TRẬN!";
                winnerText.style.color = "#ff4757";
                winnerText.style.textShadow = "0 0 20px #ff4757";
            }
            
            setTimeout(() => {
                const overlay = document.getElementById('caro-overlay');
                if (overlay) overlay.remove();
                LobbyNeon.state.currentGameId = null;
            }, 6000);
        } else {
            statusMsg.innerHTML = game.turn === me ? 
                `<span style="color:#2ed573">🟢 ĐẾN LƯỢT TIÊN PHONG</span>` : 
                `<span style="color:#94a3b8">⏳ CHỜ ĐỐI THỦ HÀNH QUÂN...</span>`;
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
                return true;
            },
            'CHẤP NHẬN BẠI TRẬN',
            'QUAY LẠI ỨNG CHIẾN'
        );
    }
};
