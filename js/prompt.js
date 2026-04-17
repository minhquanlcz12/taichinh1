// js/prompt.js
const PromptModule = {
    data: {
        prompts: [],
        currentCategory: 'ALL'
    },

    init: async () => {
        // Load prompts from DB
        const dbPrompts = await DB.getPrompts();
        if (dbPrompts && dbPrompts.length > 0) {
            PromptModule.data.prompts = dbPrompts;
        } else {
            // Default prompts if empty
            PromptModule.data.prompts = [
                {
                    id: Utils.generateId(),
                    title: 'Lên Kịch Bản Video Ngắn',
                    category: 'Video',
                    desc: 'Dùng cho Tiktok, Reels. Hook 3s đầu.',
                    content: 'Đóng vai một chuyên gia viral video marketing. \n\nHãy viết cho tôi kịch bản video dọc dưới 1 phút về [Sản phẩm/Dịch vụ của bạn].\nYêu cầu phân chia thời lượng:\n- Hook (0-3s): Giật gân, đánh trúng nỗi đau, khiến người xem phải dừng lại.\n- Thân (3-45s): Nêu giải pháp và demo công dụng thật chân thực.\n- CTA (45-60s): Kêu gọi mua hàng mạnh mẽ, gắn link giỏ hàng hoặc nhắn tin.'
                },
                {
                    id: Utils.generateId(),
                    title: 'Viết Bài Chuẩn SEO Blog',
                    category: 'SEO',
                    desc: 'Dùng cho Blog, Website.',
                    content: 'Đóng vai chuyên gia Content SEO xuất sắc. \n\nHãy viết một bài blog dài khoảng 1000 chữ về chủ đề "[Chủ đề của bạn]".\nYêu cầu:\n- Tiêu đề chính (H1) chứa từ khóa, thu hút sự chú ý.\n- Cấu trúc: H2, H3 rõ ràng, có list dạng bullet.\n- Mật độ từ khóa rải đều tự nhiên, không nhồi nhét.\n- Văn phong chuyên nghiệp nhưng dễ hiểu.\n- Đoạn kết luận súc tích và có Call to Action rõ ràng cuối bài.'
                }
            ];
            // Save defaults
            await DB.savePrompts(PromptModule.data.prompts);
        }
    },

    setCategory: (category) => {
        PromptModule.data.currentCategory = category;
        PromptModule.render();
    },

    render: () => {
        const container = document.getElementById('prompt-view');
        if (!container) return;

        const isAdmin = Auth.currentUser && Auth.currentUser.role === 'admin';

        let html = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 48px; height: 48px; background: rgba(0, 240, 255, 0.1); border: 1px solid var(--primary); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                        <i class="fa-solid fa-terminal" style="color: var(--primary); font-size: 20px;"></i>
                    </div>
                    <div>
                        <h3 style="color: #fff; margin: 0; font-size: 20px;">Thư viện Prompt</h3>
                        <p style="color: var(--text-secondary); margin: 0; font-size: 13px;">Lưu trữ và gọi nhanh các câu lệnh AI tốt nhất</p>
                    </div>
                </div>
                
                <div style="display: flex; gap: 8px;">
                    ${isAdmin ? `
                    <button type="button" class="btn btn-outline" onclick="PromptModule.setChatbotLink()" title="Cài Link GPT" style="padding: 10px 14px;">
                        <i class="fa-solid fa-link"></i>
                    </button>
                    <button class="btn btn-primary" onclick="PromptModule.showModal()">
                        <i class="fa-solid fa-plus" style="margin-right: 8px;"></i>Thêm Prompt
                    </button>
                    ` : `<span class="badge badge-blue">Quyền Nhân Viên</span>`}
                    <button type="button" class="btn btn-success" onclick="PromptModule.openChatbot()" style="background: linear-gradient(135deg, #10b981, #059669); border: none;">
                        <i class="fa-solid fa-robot" style="margin-right: 8px;"></i>Mở Chatbot
                    </button>
                </div>
            </div>
            
            <!-- Category Filter Tabs -->
            <div style="display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 16px;">
                ${['ALL', 'Video', 'SEO', 'Chatbot', 'Sale', 'Khác'].map(cat => `
                    <button type="button" class="btn btn-sm ${PromptModule.data.currentCategory === cat ? 'btn-primary' : 'btn-text'}" style="border-radius: 20px; font-size: 13px; font-weight: 600;" onclick="PromptModule.setCategory('${cat}')">${cat === 'ALL' ? 'Tất cả' : cat}</button>
                `).join('')}
            </div>

            <div class="dashboard-grid" style="grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;">
        `;

        let filteredPrompts = PromptModule.data.prompts;
        if (PromptModule.data.currentCategory !== 'ALL') {
            filteredPrompts = filteredPrompts.filter(p => (p.category || 'Khác') === PromptModule.data.currentCategory);
        }

        if (filteredPrompts.length === 0) {
            html += `<div style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary); padding: 40px; background: rgba(255,255,255,0.02); border-radius: 8px; border: 1px dashed var(--border-color);">Chưa có Prompt nào trong mục này.</div>`;
        } else {
            filteredPrompts.forEach(p => {
                html += `
                    <div class="glass-card prompt-card" style="padding: 16px; border-left: 4px solid var(--primary); display: flex; flex-direction: column; gap: 12px; height: 100%;">
                        <div>
                            <h4 style="color: #fff; margin: 0 0 8px 0; font-size: 16px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis;">${p.title}</h4>
                            <p style="color: var(--warning); font-size: 13px; margin: 0; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.5; font-style: italic;">
                                <i class="fa-solid fa-tag" style="margin-right: 4px;"></i>${p.desc}
                            </p>
                        </div>
                        
                        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: auto; padding-top: 12px; border-top: 1px dashed rgba(255,255,255,0.1);">
                            <span class="badge badge-purple" style="font-size: 11px;">${p.category || 'Khác'}</span>
                            
                            <div style="display: flex; gap: 8px;">
                                ${isAdmin ? `
                                <button type="button" class="btn btn-outline btn-sm" onclick="PromptModule.showModal('${p.id}')" style="width: 32px; height: 32px; padding: 0; display: flex; align-items: center; justify-content: center;" title="Sửa">
                                    <i class="fa-solid fa-pen"></i>
                                </button>
                                <button type="button" class="btn btn-outline btn-sm" onclick="PromptModule.deletePrompt('${p.id}')" style="width: 32px; height: 32px; padding: 0; display: flex; align-items: center; justify-content: center; color: var(--danger); border-color: rgba(248, 113, 113, 0.3);" title="Xóa">
                                    <i class="fa-solid fa-trash"></i>
                                </button>
                                ` : ''}
                                <button type="button" class="btn btn-success btn-sm" onclick="PromptModule.copyToClipboard('${p.id}', this)" style="width: 32px; height: 32px; padding: 0; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #10b981, #059669); border: none;" title="Copy Prompt">
                                    <i class="fa-solid fa-copy"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });
        }

        html += `</div>`;
        container.innerHTML = html;
    },

    showModal: (id = null) => {
        // Prevent users from showing modal via console
        if (Auth.currentUser && Auth.currentUser.role !== 'admin') {
            Utils.showToast("Bạn không có quyền này!", "error");
            return;
        }

        const modal = document.getElementById('prompt-modal-overlay');
        const form = document.getElementById('prompt-form');
        
        form.reset();
        document.getElementById('prompt-id').value = '';
        document.getElementById('prompt-category').value = 'Khác';

        if (id) {
            const p = PromptModule.data.prompts.find(x => x.id === id);
            if (p) {
                document.getElementById('prompt-id').value = p.id;
                document.getElementById('prompt-title').value = p.title || '';
                document.getElementById('prompt-category').value = p.category || 'Khác';
                document.getElementById('prompt-desc').value = p.desc || '';
                document.getElementById('prompt-content').value = p.content || '';
            }
        }

        modal.classList.add('active');
        document.getElementById('prompt-modal').style.display = 'block';
    },

    closeModal: () => {
        document.getElementById('prompt-modal-overlay').classList.remove('active');
        document.getElementById('prompt-modal').style.display = 'none';
    },

    savePrompt: async () => {
        const id = document.getElementById('prompt-id').value;
        const title = document.getElementById('prompt-title').value.trim();
        const category = document.getElementById('prompt-category').value;
        const desc = document.getElementById('prompt-desc').value.trim();
        const content = document.getElementById('prompt-content').value.trim();

        if (!title || !content) {
            Utils.showToast("Vui lòng nhập Tên Prompt và Nội dung!", "error");
            return;
        }

        // Tải dữ liệu mới nhất từ DB để tránh ghi đè (Race Condition)
        const latestDbPrompts = await DB.getPrompts() || [];
        if (latestDbPrompts.length > 0) {
            PromptModule.data.prompts = latestDbPrompts;
        }

        if (id) {
            // Cập nhật
            const idx = PromptModule.data.prompts.findIndex(x => x.id === id);
            if (idx !== -1) {
                PromptModule.data.prompts[idx] = { id, title, category, desc, content };
            }
        } else {
            // Thêm mới
            PromptModule.data.prompts.push({
                id: Utils.generateId(),
                title,
                category,
                desc,
                content
            });
        }

        await DB.savePrompts(PromptModule.data.prompts);
        PromptModule.closeModal();
        PromptModule.render();
        Utils.showToast("Đã lưu Prompt thành công!", "success");
    },

    deletePrompt: async (id) => {
        if (confirm("Bạn có chắc chắn muốn xóa Prompt này?")) {
            // Tải dữ liệu mới nhất từ DB
            const latestDbPrompts = await DB.getPrompts() || [];
            if (latestDbPrompts.length > 0) {
                PromptModule.data.prompts = latestDbPrompts;
            }

            PromptModule.data.prompts = PromptModule.data.prompts.filter(x => x.id !== id);
            await DB.savePrompts(PromptModule.data.prompts);
            PromptModule.render();
            Utils.showToast("Đã xóa Prompt!", "success");
        }
    },

    copyToClipboard: (id, btnEl) => {
        const p = PromptModule.data.prompts.find(x => x.id === id);
        if (p && p.content) {
            navigator.clipboard.writeText(p.content).then(() => {
                Utils.showToast("Đã sao chép prompt vào Clipboard!", "success");
                // Hiệu ứng nút (giữ nguyên size ô vuông nhỏ)
                const originalHtml = btnEl.innerHTML;
                const originalBg = btnEl.style.background;
                btnEl.innerHTML = '<i class="fa-solid fa-check"></i>';
                btnEl.style.background = 'linear-gradient(135deg, #059669, #047857)';
                setTimeout(() => {
                    btnEl.innerHTML = originalHtml;
                    btnEl.style.background = originalBg;
                }, 1500);
            }).catch(err => {
                Utils.showToast("Không thể sao chép. Vui lòng thử lại.", "error");
                console.error(err);
            });
        }
    },

    setChatbotLink: async () => {
        const currentLink = (app.state.settings && app.state.settings.chatbotLink) ? app.state.settings.chatbotLink : 'https://chatgpt.com';
        const link = await Utils.showPrompt("Nhập link Chatbot GPT (Vd: https://chatgpt.com/g/g-xxxxx):", currentLink);
        if (link !== null && link.trim() !== '') {
            if (!app.state.settings) app.state.settings = {};
            app.state.settings.chatbotLink = link.trim();
            await DB.saveSettings(app.state.settings);
            Utils.showToast("Đã lưu Link Chatbot!", "success");
        }
    },

    openChatbot: () => {
        const link = (app.state.settings && app.state.settings.chatbotLink) ? app.state.settings.chatbotLink : 'https://chatgpt.com';
        window.open(link, '_blank');
    }
};
