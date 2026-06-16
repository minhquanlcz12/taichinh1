// js/chatbot.js
const ChatbotModule = {
    data: { chatbots: [] },
    filters: { query: '', price: 'all' },

    init: async () => {
        const dbChatbots = await DB.getChatbots();
        if (Array.isArray(dbChatbots) && dbChatbots.length > 0) {
            ChatbotModule.data.chatbots = dbChatbots;
            return;
        }

        ChatbotModule.data.chatbots = [
            {
                id: Utils.generateId(),
                title: 'Trợ lý Chiến lược Marketing',
                icon: '📣',
                desc: 'Lên kế hoạch nội dung, phân tích insight khách hàng và gợi ý chiến dịch theo mục tiêu.',
                url: 'https://chatgpt.com/',
                originalPrice: '200000',
                currentPrice: '0',
                category: 'Marketing'
            },
            {
                id: Utils.generateId(),
                title: 'Trợ lý Quy trình Nội bộ',
                icon: '🧭',
                desc: 'Tóm tắt quy định, soạn checklist vận hành và chuẩn hóa câu trả lời cho nhân sự.',
                url: 'https://claude.ai/',
                originalPrice: '200000',
                currentPrice: '0',
                category: 'Vận hành'
            }
        ];
        await DB.saveChatbots(ChatbotModule.data.chatbots);
    },

    _escape: (value) => String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;'),

    _parsePrice: (priceStr) => parseInt(String(priceStr || '0').replace(/\D/g, ''), 10) || 0,

    _formatMoney: (amount) => {
        const n = Number(amount) || 0;
        if (typeof Utils !== 'undefined' && Utils.formatCurrency) return Utils.formatCurrency(n);
        return `${n.toLocaleString('vi-VN')}đ`;
    },

    _ownedIds: () => Array.isArray(Auth.currentUser?.purchasedBots) ? Auth.currentUser.purchasedBots : [],

    _injectStyles: () => {
        if (document.getElementById('chatbot-v2-styles')) return;
        const style = document.createElement('style');
        style.id = 'chatbot-v2-styles';
        style.textContent = `
            .cb-shell{display:flex;flex-direction:column;gap:18px;min-height:calc(100vh - 150px);padding:18px;border-radius:24px;background:radial-gradient(circle at 18% 12%,rgba(16,185,129,.14),transparent 28%),radial-gradient(circle at 84% 28%,rgba(34,211,238,.10),transparent 26%),linear-gradient(135deg,rgba(2,6,23,.54),rgba(15,23,42,.24));position:relative;overflow:hidden}
            .cb-shell:before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(16,185,129,.035) 1px,transparent 1px),linear-gradient(0deg,rgba(34,211,238,.026) 1px,transparent 1px);background-size:44px 44px;mask-image:radial-gradient(circle at 45% 20%,#000 0%,transparent 72%);pointer-events:none}
            .cb-shell>*{position:relative;z-index:1}
            .cb-topbar{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;padding:16px 18px;border:1px solid rgba(148,163,184,.14);border-radius:18px;background:linear-gradient(135deg,rgba(15,23,42,.82),rgba(17,24,39,.48));box-shadow:0 18px 45px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.06)}
            .cb-title-row{display:flex;align-items:center;gap:13px;min-width:260px}
            .cb-logo{width:46px;height:46px;border-radius:14px;display:grid;place-items:center;background:linear-gradient(135deg,rgba(16,185,129,.22),rgba(34,211,238,.16));border:1px solid rgba(16,185,129,.38);color:#34d399;font-size:20px;box-shadow:0 0 22px rgba(16,185,129,.16)}
            .cb-title{margin:0;color:#f8fafc;font-size:21px;font-weight:950;letter-spacing:.2px}
            .cb-subtitle{margin:2px 0 0;color:#94a3b8;font-size:12px;font-weight:650}
            .cb-actions{display:flex;align-items:center;gap:9px;flex-wrap:wrap}
            .cb-wallet{display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(16,185,129,.32);background:rgba(16,185,129,.09);color:#34d399;border-radius:999px;padding:9px 13px;font-size:12px;font-weight:900}
            .cb-btn{border:1px solid rgba(148,163,184,.18);background:rgba(15,23,42,.76);color:#e5e7eb;border-radius:11px;padding:10px 13px;font-size:12px;font-weight:850;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:8px;transition:transform .18s ease,border-color .18s ease,background .18s ease;white-space:nowrap}
            .cb-btn:hover{transform:translateY(-1px);border-color:rgba(34,211,238,.38);background:rgba(15,23,42,.95)}
            .cb-btn.primary{border-color:rgba(16,185,129,.45);background:linear-gradient(135deg,#10b981,#06b6d4);color:#fff;box-shadow:0 12px 26px rgba(16,185,129,.18)}
            .cb-btn.warning{border-color:rgba(251,191,36,.38);color:#fbbf24;background:rgba(251,191,36,.08)}
            .cb-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
            .cb-stat{padding:14px;border:1px solid rgba(148,163,184,.12);border-radius:16px;background:rgba(15,23,42,.54)}
            .cb-stat span{display:block;color:#94a3b8;font-size:11px;font-weight:850;text-transform:uppercase;letter-spacing:.5px}
            .cb-stat b{display:block;color:#f8fafc;font-size:22px;margin-top:5px}
            .cb-toolbar{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap}
            .cb-search{flex:1;min-width:260px;display:flex;align-items:center;gap:9px;padding:0 13px;border:1px solid rgba(148,163,184,.16);border-radius:13px;background:rgba(2,6,23,.48)}
            .cb-search i{color:#22d3ee;font-size:13px}
            .cb-search input{width:100%;height:42px;border:none;outline:none;background:transparent;color:#f8fafc;font-size:13px;font-weight:650}
            .cb-search input::placeholder{color:#64748b}
            .cb-segment{display:flex;gap:5px;padding:5px;border:1px solid rgba(148,163,184,.14);border-radius:13px;background:rgba(2,6,23,.42)}
            .cb-segment button{border:none;border-radius:9px;background:transparent;color:#94a3b8;padding:9px 12px;font-size:12px;font-weight:850;cursor:pointer}
            .cb-segment button.active{background:rgba(34,211,238,.14);color:#67e8f9}
            .cb-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:15px}
            .cb-card{min-height:282px;display:flex;flex-direction:column;border:1px solid rgba(148,163,184,.14);border-radius:18px;background:linear-gradient(160deg,rgba(15,23,42,.92),rgba(17,24,39,.72));overflow:hidden;box-shadow:0 18px 42px rgba(0,0,0,.22),inset 0 1px 0 rgba(255,255,255,.05);transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease}
            .cb-card:hover{transform:translateY(-4px);border-color:rgba(34,211,238,.34);box-shadow:0 24px 58px rgba(0,0,0,.32),0 0 28px rgba(34,211,238,.08)}
            .cb-cover{height:116px;position:relative;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 30% 10%,rgba(34,211,238,.18),transparent 34%),linear-gradient(135deg,rgba(16,185,129,.12),rgba(139,92,246,.12))}
            .cb-cover img{width:100%;height:100%;object-fit:cover}
            .cb-icon{width:58px;height:58px;border-radius:18px;display:grid;place-items:center;background:rgba(2,6,23,.58);border:1px solid rgba(255,255,255,.12);font-size:28px;box-shadow:0 16px 30px rgba(0,0,0,.26)}
            .cb-chip{position:absolute;top:10px;left:10px;border-radius:999px;padding:5px 9px;font-size:10px;font-weight:900;background:rgba(2,6,23,.66);border:1px solid rgba(255,255,255,.12);color:#cbd5e1}
            .cb-chip.owned{color:#34d399;border-color:rgba(16,185,129,.32);background:rgba(16,185,129,.12)}
            .cb-card-body{padding:15px;display:flex;flex-direction:column;gap:11px;flex:1}
            .cb-card-title{margin:0;color:#f8fafc;font-size:15px;font-weight:950;line-height:1.28}
            .cb-desc{margin:0;color:#94a3b8;font-size:12px;line-height:1.55;min-height:38px}
            .cb-meta{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:auto}
            .cb-price{display:flex;flex-direction:column;line-height:1.1}
            .cb-price small{color:#64748b;text-decoration:line-through;font-size:11px}
            .cb-price b{color:#fbbf24;font-size:16px}
            .cb-card-actions{display:flex;gap:7px;align-items:center}
            .cb-icon-btn{width:32px;height:32px;border-radius:10px;border:1px solid rgba(148,163,184,.16);background:rgba(2,6,23,.42);color:#cbd5e1;display:grid;place-items:center;cursor:pointer}
            .cb-icon-btn.danger{color:#f87171;border-color:rgba(248,113,113,.26)}
            .cb-open{width:100%;margin-top:2px}
            .cb-history{border:1px solid rgba(148,163,184,.12);border-radius:18px;background:rgba(15,23,42,.56);overflow:hidden}
            .cb-history-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px 16px;border-bottom:1px solid rgba(148,163,184,.10)}
            .cb-history-head h3{margin:0;color:#f8fafc;font-size:16px;font-weight:950}
            .cb-table{width:100%;border-collapse:collapse}
            .cb-table th{padding:12px 14px;text-align:left;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:.6px;background:rgba(255,255,255,.025)}
            .cb-table td{padding:14px;border-top:1px solid rgba(255,255,255,.045);color:#e5e7eb;font-size:13px}
            .cb-empty{grid-column:1/-1;text-align:center;padding:48px 20px;border:1px dashed rgba(148,163,184,.22);border-radius:18px;color:#94a3b8;background:rgba(15,23,42,.34)}
            .cb-modal-overlay{position:fixed;inset:0;background:rgba(2,6,23,.76);display:flex;align-items:center;justify-content:center;z-index:99999;backdrop-filter:blur(10px);padding:18px}
            .cb-modal{width:min(620px,96vw);max-height:88vh;overflow:auto;border:1px solid rgba(148,163,184,.18);border-radius:20px;background:#0f172a;box-shadow:0 30px 80px rgba(0,0,0,.5)}
            .cb-modal-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px;border-bottom:1px solid rgba(148,163,184,.12)}
            .cb-modal-head h3{margin:0;color:#f8fafc;font-size:17px;font-weight:950}
            .cb-modal-body{padding:18px}
            .cb-form-grid{display:grid;grid-template-columns:90px 1fr;gap:12px}
            .cb-field{display:flex;flex-direction:column;gap:6px;margin-bottom:12px}
            .cb-field label{color:#cbd5e1;font-size:12px;font-weight:850}
            .cb-field input,.cb-field textarea{border:1px solid rgba(148,163,184,.18);border-radius:11px;background:rgba(2,6,23,.46);color:#f8fafc;padding:11px 12px;font-size:13px;outline:none}
            .cb-field textarea{min-height:76px;resize:vertical}
            .cb-drop{border:1.5px dashed rgba(34,211,238,.28);border-radius:13px;background:rgba(34,211,238,.04);padding:15px;text-align:center;cursor:pointer;color:#94a3b8;font-size:12px}
            .cb-modal-actions{display:flex;justify-content:flex-end;gap:9px;padding:0 18px 18px}
            .cb-badge{display:inline-flex;align-items:center;border-radius:999px;padding:5px 9px;font-size:11px;font-weight:900}
            .cb-badge.success{background:rgba(16,185,129,.13);color:#34d399}
            .cb-badge.warning{background:rgba(251,191,36,.14);color:#fbbf24}
            .cb-badge.danger{background:rgba(248,113,113,.13);color:#f87171}
            @media(max-width:720px){.cb-shell{padding:12px;border-radius:18px}.cb-stats{grid-template-columns:1fr}.cb-form-grid{grid-template-columns:1fr}.cb-table th:nth-child(1),.cb-table td:nth-child(1){display:none}.cb-actions{width:100%}.cb-actions .cb-btn,.cb-wallet{flex:1}.cb-segment{width:100%;overflow:auto}.cb-title{font-size:18px}}
        `;
        document.head.appendChild(style);
    },

    _filteredBots: () => {
        const q = ChatbotModule.filters.query.trim().toLowerCase();
        const priceFilter = ChatbotModule.filters.price;
        return ChatbotModule.data.chatbots.filter((bot) => {
            const price = ChatbotModule._parsePrice(bot.currentPrice);
            const text = `${bot.title || ''} ${bot.desc || ''} ${bot.category || ''}`.toLowerCase();
            const matchQuery = !q || text.includes(q);
            const matchPrice = priceFilter === 'all' || (priceFilter === 'free' ? price === 0 : price > 0);
            return matchQuery && matchPrice;
        });
    },

    _renderAccessBtn: (bot) => {
        const price = ChatbotModule._parsePrice(bot.currentPrice);
        const owned = ChatbotModule._ownedIds().includes(bot.id);
        const safeUrl = ChatbotModule._escape(bot.url || '#');

        if (price === 0 || owned) {
            return `
                <a class="cb-btn primary cb-open" href="${safeUrl}" target="_blank" rel="noopener">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i>
                    ${owned ? 'Mở chatbot đã sở hữu' : 'Mở chatbot miễn phí'}
                </a>`;
        }

        return `
            <button type="button" class="cb-btn primary cb-open" onclick="ChatbotModule.purchaseBot('${bot.id}')">
                <i class="fa-solid fa-cart-shopping"></i>
                Mua ${ChatbotModule._formatMoney(price)}
            </button>`;
    },

    _renderBotCard: (bot, isAdmin) => {
        const owned = ChatbotModule._ownedIds().includes(bot.id);
        const price = ChatbotModule._parsePrice(bot.currentPrice);
        const originalPrice = ChatbotModule._parsePrice(bot.originalPrice);
        const cover = bot.imgData
            ? `<img src="${bot.imgData}" alt="${ChatbotModule._escape(bot.title)}">`
            : `<div class="cb-icon">${ChatbotModule._escape(bot.icon || '🤖')}</div>`;
        const category = bot.category || (price === 0 ? 'Miễn phí' : 'Premium');

        return `
            <article class="cb-card">
                <div class="cb-cover">
                    ${cover}
                    <span class="cb-chip ${owned ? 'owned' : ''}">
                        <i class="fa-solid ${owned ? 'fa-circle-check' : 'fa-wand-magic-sparkles'}"></i>
                        ${owned ? 'Đã sở hữu' : ChatbotModule._escape(category)}
                    </span>
                </div>
                <div class="cb-card-body">
                    <h4 class="cb-card-title">${ChatbotModule._escape(bot.title || 'Chatbot chưa đặt tên')}</h4>
                    <p class="cb-desc">${ChatbotModule._escape(bot.desc || 'Chưa có mô tả cho chatbot này.')}</p>
                    <div class="cb-meta">
                        <div class="cb-price">
                            ${originalPrice > price && originalPrice > 0 ? `<small>${ChatbotModule._formatMoney(originalPrice)}</small>` : '<small>Truy cập</small>'}
                            <b>${price === 0 ? 'Miễn phí' : ChatbotModule._formatMoney(price)}</b>
                        </div>
                        ${isAdmin ? `
                            <div class="cb-card-actions">
                                <button type="button" class="cb-icon-btn" onclick="ChatbotModule.showModal('${bot.id}')" title="Sửa chatbot"><i class="fa-solid fa-pen"></i></button>
                                <button type="button" class="cb-icon-btn danger" onclick="ChatbotModule.deleteChatbot('${bot.id}')" title="Xóa chatbot"><i class="fa-solid fa-trash"></i></button>
                            </div>` : ''}
                    </div>
                    ${ChatbotModule._renderAccessBtn(bot)}
                </div>
            </article>`;
    },

    render: async () => {
        ChatbotModule._injectStyles();
        const container = document.getElementById('chatbot-view');
        if (!container) return;

        const user = Auth.currentUser || {};
        const isAdmin = user.role === 'admin';
        const bots = ChatbotModule._filteredBots();
        const ownedCount = ChatbotModule.data.chatbots.filter(b => ChatbotModule._ownedIds().includes(b.id)).length;
        const freeCount = ChatbotModule.data.chatbots.filter(b => ChatbotModule._parsePrice(b.currentPrice) === 0).length;

        container.innerHTML = `
            <section class="cb-shell">
                <div class="cb-topbar">
                    <div class="cb-title-row">
                        <div class="cb-logo"><i class="fa-solid fa-robot"></i></div>
                        <div>
                            <h2 class="cb-title">Thư viện Chatbot</h2>
                            <p class="cb-subtitle">Kho trợ lý AI chuyên môn cho công việc hằng ngày</p>
                        </div>
                    </div>
                    <div class="cb-actions">
                        <span class="cb-wallet" id="chatbot-wallet-badge"><i class="fa-solid fa-wallet"></i>${ChatbotModule._formatMoney(user.balance || 0)}</span>
                        <button type="button" class="cb-btn" onclick="ChatbotModule.showTopupModal()"><i class="fa-solid fa-plus"></i>Nạp tiền</button>
                        ${isAdmin ? `
                            <button type="button" class="cb-btn warning" onclick="ChatbotModule.showTopupApproval()"><i class="fa-solid fa-clipboard-check"></i>Duyệt nạp</button>
                            <button type="button" class="cb-btn primary" onclick="ChatbotModule.showModal()"><i class="fa-solid fa-plus"></i>Thêm Chatbot</button>
                        ` : ''}
                    </div>
                </div>

                <div class="cb-stats">
                    <div class="cb-stat"><span>Tổng chatbot</span><b>${ChatbotModule.data.chatbots.length}</b></div>
                    <div class="cb-stat"><span>Miễn phí</span><b>${freeCount}</b></div>
                    <div class="cb-stat"><span>Đã sở hữu</span><b>${ownedCount}</b></div>
                </div>

                <div class="cb-toolbar">
                    <label class="cb-search">
                        <i class="fa-solid fa-magnifying-glass"></i>
                        <input id="chatbot-search-input" type="search" placeholder="Tìm chatbot theo tên, mô tả, chuyên môn..." value="${ChatbotModule._escape(ChatbotModule.filters.query)}" oninput="ChatbotModule.setSearch(this.value)">
                    </label>
                    <div class="cb-segment" role="tablist" aria-label="Lọc chatbot theo giá">
                        <button type="button" class="${ChatbotModule.filters.price === 'all' ? 'active' : ''}" onclick="ChatbotModule.setPriceFilter('all')">Tất cả</button>
                        <button type="button" class="${ChatbotModule.filters.price === 'free' ? 'active' : ''}" onclick="ChatbotModule.setPriceFilter('free')">Miễn phí</button>
                        <button type="button" class="${ChatbotModule.filters.price === 'paid' ? 'active' : ''}" onclick="ChatbotModule.setPriceFilter('paid')">Premium</button>
                    </div>
                </div>

                <div class="cb-grid">
                    ${bots.length ? bots.map(bot => ChatbotModule._renderBotCard(bot, isAdmin)).join('') : `
                        <div class="cb-empty">
                            <i class="fa-solid fa-magnifying-glass" style="font-size:28px;color:#22d3ee;margin-bottom:10px;"></i>
                            <div style="font-weight:900;color:#e5e7eb;margin-bottom:4px;">Không tìm thấy chatbot phù hợp</div>
                            <div>Thử đổi từ khóa hoặc bộ lọc.</div>
                        </div>`}
                </div>

                <div id="chatbot-history-section">${await ChatbotModule.renderHistory()}</div>
                ${ChatbotModule.renderEditorModal()}
            </section>
        `;
    },

    setSearch: (value) => {
        ChatbotModule.filters.query = value || '';
        ChatbotModule.render().then(() => {
            const input = document.getElementById('chatbot-search-input');
            if (input) {
                input.focus();
                input.setSelectionRange(input.value.length, input.value.length);
            }
        });
    },

    setPriceFilter: (value) => {
        ChatbotModule.filters.price = value || 'all';
        ChatbotModule.render();
    },

    renderEditorModal: () => `
        <div id="chatbot-modal-overlay" class="modal-overlay" onclick="if(event.target===this)ChatbotModule.closeModal()">
            <div class="modal glass-card" id="chatbot-modal" style="display:none;max-width:620px;width:94%;padding:0;border-radius:20px;overflow:hidden;">
                <div class="cb-modal-head">
                    <h3><i class="fa-solid fa-robot" style="color:#34d399;margin-right:8px;"></i><span id="chatbot-modal-title">Thiết lập Chatbot</span></h3>
                    <button type="button" class="cb-icon-btn" onclick="ChatbotModule.closeModal()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <form id="chatbot-form" onsubmit="event.preventDefault(); ChatbotModule.saveChatbot();">
                    <div class="cb-modal-body">
                        <input type="hidden" id="chatbot-id">
                        <input type="hidden" id="chatbot-img-data">
                        <div class="cb-field">
                            <label>Ảnh bìa</label>
                            <div id="chatbot-img-dropzone" class="cb-drop" onclick="document.getElementById('chatbot-img-input').click()" ondragover="event.preventDefault();this.style.background='rgba(34,211,238,.10)'" ondragleave="this.style.background='rgba(34,211,238,.04)'" ondrop="event.preventDefault();this.style.background='rgba(34,211,238,.04)';ChatbotModule.handleImageDrop(event)">
                                <div id="chatbot-img-preview-wrap"><i class="fa-solid fa-cloud-arrow-up" style="font-size:24px;color:#22d3ee;"></i><div style="margin-top:8px;">Nhấn hoặc kéo thả ảnh bìa</div></div>
                            </div>
                            <input type="file" id="chatbot-img-input" accept="image/*" style="display:none" onchange="ChatbotModule.handleImageSelect(event)">
                        </div>
                        <div class="cb-form-grid">
                            <div class="cb-field"><label>Icon</label><input type="text" id="chatbot-icon" placeholder="🤖" maxlength="4" style="text-align:center;font-size:22px;"></div>
                            <div class="cb-field"><label>Tên Chatbot</label><input type="text" id="chatbot-title" required placeholder="Ví dụ: Trợ lý content TikTok"></div>
                        </div>
                        <div class="cb-field"><label>Mô tả ngắn</label><textarea id="chatbot-desc" placeholder="Chatbot này giúp xử lý việc gì?"></textarea></div>
                        <div class="cb-field"><label>URL đích</label><input type="url" id="chatbot-url" required placeholder="https://chatgpt.com/g/..."></div>
                        <div class="cb-form-grid" style="grid-template-columns:1fr 1fr;">
                            <div class="cb-field"><label>Giá gốc</label><input type="text" id="chatbot-original-price" placeholder="200000"></div>
                            <div class="cb-field"><label>Giá hiện tại</label><input type="text" id="chatbot-current-price" placeholder="0"></div>
                        </div>
                        <div class="cb-field"><label>Chuyên môn</label><input type="text" id="chatbot-category" placeholder="Marketing, Vận hành, Nhân sự..."></div>
                    </div>
                    <div class="cb-modal-actions">
                        <button type="button" class="cb-btn" onclick="ChatbotModule.closeModal()">Hủy</button>
                        <button type="submit" class="cb-btn primary"><i class="fa-solid fa-floppy-disk"></i>Lưu Chatbot</button>
                    </div>
                </form>
            </div>
        </div>`,

    renderHistory: async () => {
        const user = Auth.currentUser;
        if (!user) return '';

        const topups = await DB.getTopupRequests() || [];
        const userTopups = topups.filter(r => r.username === user.username && r.status !== 'approved');
        const transactions = await DB.getChatbotHistory() || [];
        const userTransactions = transactions.filter(t => t.username === user.username);
        let legacyTransactions = [];

        if (typeof FinanceModule !== 'undefined' && FinanceModule.data?.transactions) {
            legacyTransactions = FinanceModule.data.transactions.filter(t =>
                t.owner === user.username &&
                (t.category === 'Nạp tiền' || t.category === 'Mua Chatbot')
            );
        }

        const allHistory = [
            ...userTopups.map(r => ({
                id: r.id,
                date: r.createdAt,
                type: 'deposit',
                amount: r.amount,
                status: r.status,
                note: r.status === 'pending' ? 'Đang chờ admin duyệt' : 'Yêu cầu nạp bị từ chối'
            })),
            ...userTransactions.map(t => ({
                id: t.id,
                date: t.date,
                type: t.type === 'deposit' ? 'deposit' : 'purchase',
                amount: t.amount,
                status: 'approved',
                note: t.note
            })),
            ...legacyTransactions.map(t => ({
                id: t.id,
                date: t.date,
                type: t.type === 'income' ? 'deposit' : 'purchase',
                amount: t.amount,
                status: 'approved',
                note: t.note || (t.type === 'income' ? 'Nạp tiền thành công' : 'Mua chatbot')
            }))
        ];

        const unique = new Map();
        allHistory.forEach(h => unique.set(h.id || `${h.date}-${h.amount}-${h.note}`, h));
        const sorted = Array.from(unique.values()).sort((a, b) => new Date(b.date) - new Date(a.date));

        const rows = sorted.length ? sorted.map(h => {
            const isDeposit = h.type === 'deposit';
            const amountColor = isDeposit ? '#34d399' : '#f87171';
            const badge = h.status === 'approved'
                ? '<span class="cb-badge success">Thành công</span>'
                : h.status === 'pending'
                    ? '<span class="cb-badge warning">Đang xử lý</span>'
                    : '<span class="cb-badge danger">Từ chối</span>';
            return `
                <tr>
                    <td>${new Date(h.date).toLocaleString('vi-VN')}</td>
                    <td><b>${isDeposit ? 'Nạp tiền vào ví' : 'Mua Chatbot'}</b><div style="color:#94a3b8;font-size:11px;margin-top:3px;">${ChatbotModule._escape(h.note || '')}</div></td>
                    <td style="text-align:right;color:${amountColor};font-weight:950;">${isDeposit ? '+' : '-'}${ChatbotModule._formatMoney(h.amount)}</td>
                    <td style="text-align:right;">${badge}</td>
                </tr>`;
        }).join('') : `<tr><td colspan="4" style="text-align:center;padding:30px;color:#94a3b8;font-style:italic;">Chưa có lịch sử giao dịch nào.</td></tr>`;

        return `
            <section class="cb-history">
                <div class="cb-history-head">
                    <h3><i class="fa-solid fa-clock-rotate-left" style="color:#fbbf24;margin-right:8px;"></i>Lịch sử giao dịch</h3>
                </div>
                <div class="table-responsive">
                    <table class="cb-table">
                        <thead><tr><th>Ngày giờ</th><th>Nội dung</th><th style="text-align:right;">Số tiền</th><th style="text-align:right;">Trạng thái</th></tr></thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            </section>`;
    },

    purchaseBot: async (botId) => {
        const bot = ChatbotModule.data.chatbots.find(b => b.id === botId);
        if (!bot) return;
        const price = ChatbotModule._parsePrice(bot.currentPrice);
        const balance = Auth.currentUser.balance || 0;

        if (ChatbotModule._ownedIds().includes(botId)) {
            window.open(bot.url, '_blank');
            return;
        }

        if (balance < price) {
            Utils.showToast(`Số dư không đủ. Cần ${ChatbotModule._formatMoney(price)}, hiện có ${ChatbotModule._formatMoney(balance)}.`, 'error');
            ChatbotModule.showTopupModal();
            return;
        }

        const ok = await Utils.showConfirm(
            'Xác nhận mua Chatbot',
            `Mua "<b>${ChatbotModule._escape(bot.title)}</b>" với giá <b style="color:#fbbf24">${ChatbotModule._formatMoney(price)}</b>?<br><br>Số dư sau khi mua: <b>${ChatbotModule._formatMoney(balance - price)}</b>`,
            'Mua ngay',
            'Hủy'
        );
        if (!ok) return;

        const accounts = await Auth.getAccounts();
        const acc = accounts.find(a => a.username === Auth.currentUser.username);
        if (!acc) { Utils.showToast('Không tìm thấy tài khoản.', 'error'); return; }

        acc.balance = (acc.balance || 0) - price;
        acc.purchasedBots = Array.isArray(acc.purchasedBots) ? acc.purchasedBots : [];
        if (!acc.purchasedBots.includes(botId)) acc.purchasedBots.push(botId);
        await Auth.saveAccounts(accounts);

        Auth.currentUser.balance = acc.balance;
        Auth.currentUser.purchasedBots = acc.purchasedBots;
        Utils.storage.set('tl_current_user', Auth.currentUser);
        ChatbotModule.updateWalletBadges(acc.balance);

        await ChatbotModule.logTransaction('purchase', price, `Mua bot: ${bot.title}`);
        Utils.showToast(`Đã mua "${bot.title}".`, 'success');
        await ChatbotModule.render();
        setTimeout(() => window.open(bot.url, '_blank'), 500);
    },

    updateWalletBadges: (balance) => {
        const text = `<i class="fa-solid fa-wallet"></i> ${ChatbotModule._formatMoney(balance || 0)}`;
        const main = document.getElementById('wallet-balance-badge');
        const local = document.getElementById('chatbot-wallet-badge');
        if (main) main.innerHTML = text;
        if (local) local.innerHTML = text;
    },

    showTopupModal: () => {
        document.getElementById('topup-overlay')?.remove();
        const bal = Auth.currentUser.balance || 0;
        const overlay = document.createElement('div');
        overlay.id = 'topup-overlay';
        overlay.className = 'cb-modal-overlay';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
        overlay.innerHTML = `
            <div class="cb-modal">
                <div class="cb-modal-head">
                    <h3><i class="fa-solid fa-wallet" style="color:#34d399;margin-right:8px;"></i>Nạp tiền vào ví</h3>
                    <button type="button" class="cb-icon-btn" onclick="document.getElementById('topup-overlay').remove()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="cb-modal-body">
                    <div class="cb-stat" style="margin-bottom:14px;"><span>Số dư hiện tại</span><b style="color:#34d399;">${ChatbotModule._formatMoney(bal)}</b></div>
                    <div style="background:#fff;border-radius:14px;padding:16px;text-align:center;margin-bottom:14px;color:#111827;">
                        <div style="font-weight:900;font-size:16px;">DAO THANH LONG</div>
                        <div style="font-size:13px;color:#475569;margin:4px 0 12px;">TK: 033096666666 - LPBank</div>
                        <img src="assets/qr_lpbank.jpg" style="max-width:210px;width:100%;border-radius:10px;" alt="QR LPBank">
                    </div>
                    <div style="padding:12px;border-radius:12px;background:rgba(251,191,36,.10);border:1px solid rgba(251,191,36,.25);color:#fbbf24;font-size:13px;margin-bottom:14px;">
                        Nội dung chuyển khoản: <b>NAPTIEN ${ChatbotModule._escape(Auth.currentUser.username)} [số tiền]</b>
                    </div>
                    <div style="display:flex;gap:9px;">
                        <input type="number" id="topup-amount-input" placeholder="Nhập số tiền đã chuyển..." style="flex:1;border:1px solid rgba(148,163,184,.18);border-radius:11px;background:rgba(2,6,23,.46);color:#fff;padding:11px 12px;">
                        <button type="button" class="cb-btn primary" onclick="ChatbotModule.submitTopup()">Gửi yêu cầu</button>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(overlay);
    },

    submitTopup: async () => {
        const input = document.getElementById('topup-amount-input');
        const amount = parseInt(input?.value, 10);
        if (!amount || amount <= 0) {
            Utils.showToast('Vui lòng nhập số tiền hợp lệ.', 'error');
            return;
        }

        const requests = await DB.getTopupRequests() || [];
        requests.push({
            id: Utils.generateId(),
            username: Auth.currentUser.username,
            amount,
            status: 'pending',
            createdAt: new Date().toISOString()
        });
        await DB.saveTopupRequests(requests);
        document.getElementById('topup-overlay')?.remove();
        Utils.showToast('Đã gửi yêu cầu nạp tiền. Chờ admin duyệt.', 'success');
        await ChatbotModule.render();
    },

    showTopupApproval: async () => {
        if (!Auth.currentUser || Auth.currentUser.role !== 'admin') return;
        document.getElementById('topup-approval-overlay')?.remove();
        const requests = await DB.getTopupRequests() || [];
        const pending = requests.filter(r => r.status === 'pending');

        const listHtml = pending.length ? pending.map(r => `
            <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px;border-top:1px solid rgba(255,255,255,.06);">
                <div>
                    <div style="font-weight:900;color:#fff;">${ChatbotModule._escape(r.username)}</div>
                    <div style="font-size:11px;color:#94a3b8;margin-top:2px;">${new Date(r.createdAt).toLocaleString('vi-VN')}</div>
                </div>
                <div style="font-weight:950;color:#fbbf24;">${ChatbotModule._formatMoney(r.amount)}</div>
                <div style="display:flex;gap:7px;">
                    <button type="button" class="cb-icon-btn" style="color:#34d399;" onclick="ChatbotModule.approveTopup('${r.id}')"><i class="fa-solid fa-check"></i></button>
                    <button type="button" class="cb-icon-btn danger" onclick="ChatbotModule.rejectTopup('${r.id}')"><i class="fa-solid fa-xmark"></i></button>
                </div>
            </div>`).join('') : '<div style="text-align:center;color:#94a3b8;padding:28px;">Không có yêu cầu nào đang chờ duyệt.</div>';

        const overlay = document.createElement('div');
        overlay.id = 'topup-approval-overlay';
        overlay.className = 'cb-modal-overlay';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
        overlay.innerHTML = `
            <div class="cb-modal">
                <div class="cb-modal-head">
                    <h3><i class="fa-solid fa-clipboard-check" style="color:#fbbf24;margin-right:8px;"></i>Duyệt yêu cầu nạp</h3>
                    <button type="button" class="cb-icon-btn" onclick="document.getElementById('topup-approval-overlay').remove()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="cb-modal-body" style="padding:0;">${listHtml}</div>
            </div>`;
        document.body.appendChild(overlay);
    },

    approveTopup: async (reqId) => {
        const requests = await DB.getTopupRequests() || [];
        const req = requests.find(r => r.id === reqId);
        if (!req) return;
        req.status = 'approved';
        await DB.saveTopupRequests(requests);

        const accounts = await Auth.getAccounts();
        const acc = accounts.find(a => a.username === req.username);
        if (acc) {
            acc.balance = (acc.balance || 0) + Number(req.amount || 0);
            await Auth.saveAccounts(accounts);
            if (Auth.currentUser.username === req.username) {
                Auth.currentUser.balance = acc.balance;
                Utils.storage.set('tl_current_user', Auth.currentUser);
                ChatbotModule.updateWalletBadges(acc.balance);
            }
        }

        await ChatbotModule.logTransaction('deposit', req.amount, `Nạp tiền: ${req.id}`, req.username);
        Utils.showToast(`Đã duyệt nạp ${ChatbotModule._formatMoney(req.amount)} cho ${req.username}.`, 'success');
        await ChatbotModule.showTopupApproval();
        if (app.state.currentView === 'chatbot-view') await ChatbotModule.render();
    },

    rejectTopup: async (reqId) => {
        const ok = await Utils.showConfirm('Xác nhận', 'Từ chối yêu cầu nạp tiền này?', 'Từ chối', 'Đóng');
        if (!ok) return;
        const requests = await DB.getTopupRequests() || [];
        const req = requests.find(r => r.id === reqId);
        if (!req) return;
        req.status = 'rejected';
        await DB.saveTopupRequests(requests);
        Utils.showToast('Đã từ chối yêu cầu.', 'success');
        await ChatbotModule.showTopupApproval();
        if (app.state.currentView === 'chatbot-view') await ChatbotModule.render();
    },

    logTransaction: async (type, amount, note, targetUser = null) => {
        const username = targetUser || Auth.currentUser?.username || 'admin';
        const history = await DB.getChatbotHistory() || [];
        history.push({
            id: Utils.generateId(),
            username,
            type,
            amount: Number(amount) || 0,
            note,
            date: new Date().toISOString()
        });
        await DB.saveChatbotHistory(history);
    },

    showModal: (id = null) => {
        if (!Auth.currentUser || Auth.currentUser.role !== 'admin') {
            Utils.showToast('Bạn không có quyền này.', 'error');
            return;
        }

        const overlay = document.getElementById('chatbot-modal-overlay');
        if (!overlay) { ChatbotModule.render().then(() => ChatbotModule.showModal(id)); return; }

        const bot = id ? ChatbotModule.data.chatbots.find(x => x.id === id) : null;
        document.getElementById('chatbot-modal-title').textContent = bot ? 'Sửa Chatbot' : 'Thêm Chatbot';
        document.getElementById('chatbot-id').value = bot?.id || '';
        document.getElementById('chatbot-title').value = bot?.title || '';
        document.getElementById('chatbot-icon').value = bot?.icon || '🤖';
        document.getElementById('chatbot-desc').value = bot?.desc || '';
        document.getElementById('chatbot-url').value = bot?.url || '';
        document.getElementById('chatbot-original-price').value = bot?.originalPrice || '';
        document.getElementById('chatbot-current-price').value = bot?.currentPrice || '';
        document.getElementById('chatbot-category').value = bot?.category || '';
        document.getElementById('chatbot-img-data').value = bot?.imgData || '';

        const prev = document.getElementById('chatbot-img-preview-wrap');
        if (prev) {
            prev.innerHTML = bot?.imgData
                ? `<img src="${bot.imgData}" style="max-height:130px;border-radius:10px;object-fit:cover;"><div style="margin-top:8px;color:#34d399;">Đã có ảnh bìa</div>`
                : `<i class="fa-solid fa-cloud-arrow-up" style="font-size:24px;color:#22d3ee;"></i><div style="margin-top:8px;">Nhấn hoặc kéo thả ảnh bìa</div>`;
        }

        overlay.classList.add('active');
        document.getElementById('chatbot-modal').style.display = 'block';
    },

    closeModal: () => {
        document.getElementById('chatbot-modal-overlay')?.classList.remove('active');
        const modal = document.getElementById('chatbot-modal');
        if (modal) modal.style.display = 'none';
    },

    handleImageSelect: (event) => {
        const file = event.target.files?.[0];
        if (file) ChatbotModule._readImageFile(file);
    },

    handleImageDrop: (event) => {
        const file = event.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) ChatbotModule._readImageFile(file);
    },

    _readImageFile: (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const max = 700;
                let { width, height } = img;
                if (width > height && width > max) { height *= max / width; width = max; }
                if (height >= width && height > max) { width *= max / height; height = max; }
                canvas.width = Math.round(width);
                canvas.height = Math.round(height);
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/webp', 0.68);
                document.getElementById('chatbot-img-data').value = dataUrl;
                const prev = document.getElementById('chatbot-img-preview-wrap');
                if (prev) prev.innerHTML = `<img src="${dataUrl}" style="max-height:130px;border-radius:10px;object-fit:cover;"><div style="margin-top:8px;color:#34d399;">Ảnh đã được nén</div>`;
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    },

    saveChatbot: async () => {
        if (!Auth.currentUser || Auth.currentUser.role !== 'admin') {
            Utils.showToast('Không có quyền.', 'error');
            return;
        }

        const id = document.getElementById('chatbot-id').value;
        const title = document.getElementById('chatbot-title').value.trim();
        const icon = document.getElementById('chatbot-icon').value.trim() || '🤖';
        const desc = document.getElementById('chatbot-desc').value.trim();
        const url = document.getElementById('chatbot-url').value.trim();
        const originalPrice = document.getElementById('chatbot-original-price').value.trim();
        const currentPrice = document.getElementById('chatbot-current-price').value.trim() || '0';
        const category = document.getElementById('chatbot-category').value.trim();
        let imgData = document.getElementById('chatbot-img-data').value;

        if (!title || !url) {
            Utils.showToast('Vui lòng nhập tên chatbot và URL.', 'error');
            return;
        }

        if (Utils.compressImageBase64) imgData = await Utils.compressImageBase64(imgData);
        const latest = await DB.getChatbots() || [];
        if (latest.length > 0) ChatbotModule.data.chatbots = latest;

        const payload = { id: id || Utils.generateId(), title, icon, desc, url, originalPrice, currentPrice, category, imgData };
        if (id) {
            const idx = ChatbotModule.data.chatbots.findIndex(x => x.id === id);
            if (idx !== -1) ChatbotModule.data.chatbots[idx] = payload;
        } else {
            ChatbotModule.data.chatbots.push(payload);
        }

        const saved = await DB.saveChatbots(ChatbotModule.data.chatbots);
        if (!saved) {
            Utils.showToast('Lỗi lưu chatbot. Ảnh có thể quá lớn.', 'error');
            return;
        }

        ChatbotModule.closeModal();
        Utils.showToast('Đã lưu chatbot.', 'success');
        await ChatbotModule.render();
    },

    deleteChatbot: async (id) => {
        if (!Auth.currentUser || Auth.currentUser.role !== 'admin') {
            Utils.showToast('Không có quyền.', 'error');
            return;
        }

        const ok = await Utils.showConfirm('Xác nhận xóa', 'Xóa chatbot này khỏi thư viện?', 'Xóa', 'Hủy');
        if (!ok) return;

        const latest = await DB.getChatbots() || [];
        if (latest.length > 0) ChatbotModule.data.chatbots = latest;
        ChatbotModule.data.chatbots = ChatbotModule.data.chatbots.filter(x => x.id !== id);
        const saved = await DB.saveChatbots(ChatbotModule.data.chatbots);
        if (!saved) {
            Utils.showToast('Lỗi xóa chatbot.', 'error');
            return;
        }

        Utils.showToast('Đã xóa chatbot.', 'success');
        await ChatbotModule.render();
    }
};
