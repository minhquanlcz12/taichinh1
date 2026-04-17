// js/chatbot.js
const ChatbotModule = {
    data: {
        chatbots: [],
    },

    init: async () => {
        // Load chatbots from DB
        const dbChatbots = await DB.getChatbots();
        if (dbChatbots && dbChatbots.length > 0) {
            ChatbotModule.data.chatbots = dbChatbots;
        } else {
            // Default chatbots if empty
            ChatbotModule.data.chatbots = [
                {
                    id: Utils.generateId(),
                    title: 'ChatGPT Chuẩn SEO',
                    icon: '🤖',
                    desc: 'Chatbot được tùy biến riêng để viết bài chuẩn SEO, tự động chèn H1, H2, H3 và tối ưu Keyword mật độ cao.',
                    url: 'https://chatgpt.com/'
                },
                {
                    id: Utils.generateId(),
                    title: 'Claude 3 Opus - Phân Tích',
                    icon: '🧠',
                    desc: 'Dùng để phân tích dữ liệu tài chính, đọc báo cáo Excel và đưa ra nhận định kinh doanh sắc bén.',
                    url: 'https://claude.ai/'
                }
            ];
            await DB.saveChatbots(ChatbotModule.data.chatbots);
        }
    },

    render: () => {
        const container = document.getElementById('chatbot-view');
        if (!container) return;

        const isAdmin = Auth.currentUser && Auth.currentUser.role === 'admin';

        let html = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 48px; height: 48px; background: rgba(16, 185, 129, 0.1); border: 1px solid var(--success); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                        <i class="fa-solid fa-robot" style="color: var(--success); font-size: 20px;"></i>
                    </div>
                    <div>
                        <h3 style="color: #fff; margin: 0; font-size: 20px;">Thư viện Chatbot</h3>
                        <p style="color: var(--text-secondary); margin: 0; font-size: 13px;">Tập hợp các trợ lý AI chuyên biệt cho từng tác vụ</p>
                    </div>
                </div>
                
                <div style="display: flex; gap: 8px;">
                    ${isAdmin ? `
                    <button class="btn btn-primary" onclick="ChatbotModule.showModal()">
                        <i class="fa-solid fa-plus" style="margin-right: 8px;"></i>Thêm Chatbot
                    </button>
                    ` : `<span class="badge badge-blue">Quyền Nhân Viên</span>`}
                </div>
            </div>
            
            <div class="dashboard-grid" style="grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;">
        `;

        if (ChatbotModule.data.chatbots.length === 0) {
            html += `<div style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary); padding: 40px; background: rgba(255,255,255,0.02); border-radius: 8px; border: 1px dashed var(--border-color);">Chưa có Chatbot nào.</div>`;
        } else {
            ChatbotModule.data.chatbots.forEach(p => {
                html += `
                    <div class="glass-card prompt-card" style="padding: 16px; border-left: 4px solid var(--success); display: flex; flex-direction: column; gap: 12px; height: 100%;">
                        <div style="display: flex; gap: 12px; align-items: flex-start;">
                            <div style="font-size: 32px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); border-radius: 12px; width: 50px; height: 50px;">
                                ${p.icon || '🤖'}
                            </div>
                            <div style="flex: 1;">
                                <h4 style="color: #fff; margin: 0 0 8px 0; font-size: 16px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis;">${p.title}</h4>
                                <p style="color: var(--text-secondary); font-size: 13px; margin: 0; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.5;">
                                    ${p.desc}
                                </p>
                            </div>
                        </div>
                        
                        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: auto; padding-top: 12px; border-top: 1px dashed rgba(255,255,255,0.1);">
                            <div></div>
                            <div style="display: flex; gap: 8px;">
                                ${isAdmin ? `
                                <button type="button" class="btn btn-outline btn-sm" onclick="ChatbotModule.showModal('${p.id}')" style="width: 32px; height: 32px; padding: 0; display: flex; align-items: center; justify-content: center;" title="Sửa">
                                    <i class="fa-solid fa-pen"></i>
                                </button>
                                <button type="button" class="btn btn-outline btn-sm" onclick="ChatbotModule.deleteChatbot('${p.id}')" style="width: 32px; height: 32px; padding: 0; display: flex; align-items: center; justify-content: center; color: var(--danger); border-color: rgba(248, 113, 113, 0.3);" title="Xóa">
                                    <i class="fa-solid fa-trash"></i>
                                </button>
                                ` : ''}
                                <a href="${p.url}" target="_blank" class="btn btn-success btn-sm" style="height: 32px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #10b981, #059669); border: none; text-decoration: none; padding: 0 16px; font-weight: 600; border-radius: 6px;" title="Truy cập">
                                    Truy cập ngay <i class="fa-solid fa-arrow-up-right-from-square" style="margin-left: 8px; font-size: 11px;"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                `;
            });
        }

        html += `</div>`;
        
        // Add minimal Modal HTML directly to the container to keep it contained
        if (isAdmin && !document.getElementById('chatbot-modal-overlay')) {
            const modalHtml = `
            <div id="chatbot-modal-overlay" class="modal-overlay">
                <div class="modal glass-card" id="chatbot-modal" style="display: none; animation: slideIn 0.3s ease; max-width: 500px; width: 90%;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 12px;">
                        <h3 style="color: #fff; margin: 0; display: flex; align-items: center; gap: 8px;">
                            <i class="fa-solid fa-robot" style="color: var(--success);"></i> Thiết lập Chatbot
                        </h3>
                        <button class="btn btn-text" onclick="ChatbotModule.closeModal()" style="padding: 4px; color: var(--text-secondary);"><i class="fa-solid fa-xmark" style="font-size: 20px;"></i></button>
                    </div>
                    <form id="chatbot-form" onsubmit="event.preventDefault(); ChatbotModule.saveChatbot();">
                        <input type="hidden" id="chatbot-id">
                        
                        <div style="display: flex; gap: 12px;">
                            <div class="form-group" style="width: 80px; flex-shrink: 0;">
                                <label style="display: flex; align-items: center; gap: 6px;">Icon <i class="fa-solid fa-face-smile" style="color: var(--warning);"></i></label>
                                <input type="text" id="chatbot-icon" required placeholder="🤖" value="🤖" style="text-align: center; font-size: 20px;">
                            </div>
                            
                            <div class="form-group" style="flex: 1;">
                                <label style="display: flex; align-items: center; gap: 4px;">Tên Chatbot/AI <span style="color: var(--danger);">*</span></label>
                                <input type="text" id="chatbot-title" required placeholder="Vd: Chuyên gia Khuyến mãi">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label style="display: flex; align-items: center; gap: 4px;">Đường link truy cập (URL) <span style="color: var(--danger);">*</span></label>
                            <input type="url" id="chatbot-url" required placeholder="https://chatgpt.com/g/g-xxxxxx">
                        </div>

                        <div class="form-group">
                            <label>Mô tả tác dụng của Bot</label>
                            <textarea id="chatbot-desc" placeholder="Dùng để làm gì? Lưu ý gì khi dùng?" style="height: 80px; resize: none; background: rgba(0,0,0,0.2); border: 1px solid var(--glass-border); padding: 12px; border-radius: 8px; color: #fff; font-family: 'Poppins', sans-serif;"></textarea>
                        </div>

                        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
                            <button type="button" class="btn btn-text" onclick="ChatbotModule.closeModal()">Hủy</button>
                            <button type="submit" class="btn btn-success"><i class="fa-solid fa-save" style="margin-right: 8px;"></i> Lưu lại</button>
                        </div>
                    </form>
                </div>
            </div>`;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        }

        container.innerHTML = html;
    },

    showModal: (id = null) => {
        if (Auth.currentUser && Auth.currentUser.role !== 'admin') {
            Utils.showToast("Bạn không có quyền này!", "error");
            return;
        }

        const modalOverlay = document.getElementById('chatbot-modal-overlay');
        const form = document.getElementById('chatbot-form');
        
        form.reset();
        document.getElementById('chatbot-id').value = '';
        document.getElementById('chatbot-icon').value = '🤖';

        if (id) {
            const p = ChatbotModule.data.chatbots.find(x => x.id === id);
            if (p) {
                document.getElementById('chatbot-id').value = p.id;
                document.getElementById('chatbot-title').value = p.title || '';
                document.getElementById('chatbot-icon').value = p.icon || '🤖';
                document.getElementById('chatbot-desc').value = p.desc || '';
                document.getElementById('chatbot-url').value = p.url || '';
            }
        }

        modalOverlay.classList.add('active');
        document.getElementById('chatbot-modal').style.display = 'block';
    },

    closeModal: () => {
        document.getElementById('chatbot-modal-overlay').classList.remove('active');
        document.getElementById('chatbot-modal').style.display = 'none';
    },

    saveChatbot: async () => {
        const id = document.getElementById('chatbot-id').value;
        const title = document.getElementById('chatbot-title').value.trim();
        const icon = document.getElementById('chatbot-icon').value.trim() || '🤖';
        const desc = document.getElementById('chatbot-desc').value.trim();
        const url = document.getElementById('chatbot-url').value.trim();

        if (!title || !url) {
            Utils.showToast("Vui lòng nhập Tên và URL!", "error");
            return;
        }

        // Tải dữ liệu mới nhất từ DB
        const latestDb = await DB.getChatbots() || [];
        if (latestDb.length > 0) {
            ChatbotModule.data.chatbots = latestDb;
        }

        if (id) {
            const idx = ChatbotModule.data.chatbots.findIndex(x => x.id === id);
            if (idx !== -1) {
                ChatbotModule.data.chatbots[idx] = { id, title, icon, desc, url };
            }
        } else {
            ChatbotModule.data.chatbots.push({
                id: Utils.generateId(),
                title,
                icon,
                desc,
                url
            });
        }

        await DB.saveChatbots(ChatbotModule.data.chatbots);
        ChatbotModule.closeModal();
        ChatbotModule.render();
        Utils.showToast("Đã lưu Chatbot thành công!", "success");
    },

    deleteChatbot: async (id) => {
        if (confirm("Bạn có chắc chắn muốn xóa Chatbot này?")) {
            const latestDb = await DB.getChatbots() || [];
            if (latestDb.length > 0) {
                ChatbotModule.data.chatbots = latestDb;
            }

            ChatbotModule.data.chatbots = ChatbotModule.data.chatbots.filter(x => x.id !== id);
            await DB.saveChatbots(ChatbotModule.data.chatbots);
            ChatbotModule.render();
            Utils.showToast("Đã xóa Chatbot!", "success");
        }
    }
};
