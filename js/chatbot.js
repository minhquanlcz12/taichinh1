// js/chatbot.js
const ChatbotModule = {
    data: { chatbots: [] },

    init: async () => {
        const dbChatbots = await DB.getChatbots();
        if (dbChatbots && dbChatbots.length > 0) {
            ChatbotModule.data.chatbots = dbChatbots;
        } else {
            ChatbotModule.data.chatbots = [
                { id: Utils.generateId(), title: 'Chatbot PT Gymer ảo', icon: '💪', desc: 'Giải pháp xây dựng kênh fitness mà không cần...', url: 'https://chatgpt.com/', originalPrice: '200.000', currentPrice: '0' },
                { id: Utils.generateId(), title: 'Chatbot Kỹ sư điện mặt trời', icon: '☀️', desc: 'Giải đáp, tư vấn thiết kế thi công điện năng lượng mặt trời.', url: 'https://claude.ai/', originalPrice: '200.000', currentPrice: '0' }
            ];
            await DB.saveChatbots(ChatbotModule.data.chatbots);
        }
    },

    render: () => {
        const container = document.getElementById('chatbot-view');
        if (!container) return;
        const isAdmin = Auth.currentUser && Auth.currentUser.role === 'admin';

        let cardsHtml = '';
        if (ChatbotModule.data.chatbots.length === 0) {
            cardsHtml = `<div style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary); padding: 40px; background: rgba(255,255,255,0.02); border-radius: 8px; border: 1px dashed var(--border-color);">Chưa có Chatbot nào. Admin hãy thêm vào!</div>`;
        } else {
            ChatbotModule.data.chatbots.forEach(p => {
                const imgPart = p.imgData ? `<img src="${p.imgData}" style="width: 100%; height: 100%; object-fit: cover;">` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:48px;">${p.icon || '🤖'}</div>`;
                
                cardsHtml += `
                <div class="glass-card storefront-card" style="display: flex; flex-direction: column; overflow: hidden; padding: 0; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; height: 100%; background: #131722; transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.4)';" onmouseout="this.style.transform='none';this.style.boxShadow='none';">
                    <!-- Top Image Container -->
                    <div style="position: relative; height: 180px; width: 100%; background: #1b2131;">
                        ${imgPart}
                        
                        <!-- Badges -->
                        <div style="position: absolute; top: 12px; left: 12px; display: flex; flex-direction: column; gap: 6px;">
                            <span style="background: #f59e0b; color: white; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"><i class="fa-solid fa-crown"></i> Premium</span>
                            <span style="background: #10b981; color: white; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; width: max-content; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"><i class="fa-solid fa-sparkles"></i> Mới</span>
                        </div>
                        <div style="position: absolute; top: 12px; right: 12px;">
                            <span style="background: white; color: #1a1e2d; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"><i class="fa-regular fa-message"></i> Chatbot AI</span>
                        </div>
                    </div>
                    
                    <!-- Bottom Info -->
                    <div style="padding: 16px; display: flex; flex-direction: column; flex: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                            <h4 style="color: #fff; margin: 0; font-size: 15px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; flex: 1; margin-right: 8px;">${p.title}</h4>
                            <span style="border: 1px solid rgba(0,240,255,0.3); color: rgba(0,240,255,0.8); padding: 2px 6px; border-radius: 4px; font-size: 10px; flex-shrink: 0;"><i class="fa-solid fa-tag"></i> v1.0</span>
                        </div>
                        <p style="color: var(--text-secondary); font-size: 12px; margin: 0 0 16px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.5; height: 36px;">${p.desc}</p>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto;">
                            <div style="display: flex; gap: 6px;">
                                ${isAdmin ? `
                                <button type="button" class="btn btn-outline btn-sm" onclick="ChatbotModule.showModal('${p.id}')" style="width:28px;height:28px;padding:0;display:inline-flex;align-items:center;justify-content:center;border-color:rgba(255,255,255,0.1);" title="Sửa"><i class="fa-solid fa-pen" style="color:var(--text-secondary)"></i></button>
                                <button type="button" class="btn btn-outline btn-sm" onclick="ChatbotModule.deleteChatbot('${p.id}')" style="width:28px;height:28px;padding:0;display:inline-flex;align-items:center;justify-content:center;color:var(--danger);border-color:rgba(248,113,113,0.3);" title="Xóa"><i class="fa-solid fa-trash"></i></button>
                                ` : ''}
                            </div>
                            <div style="text-align: right; line-height: 1.2;">
                                ${p.originalPrice ? `<div style="text-decoration: line-through; color: var(--text-secondary); font-size: 11px;">${Utils.formatCurrency ? Utils.formatCurrency(p.originalPrice) : (!isNaN(parseInt(p.originalPrice.replace(/\\D/g,''))) ? parseInt(p.originalPrice.replace(/\\D/g,'')).toLocaleString('vi-VN') + 'đ' : p.originalPrice)}</div>` : ''}
                                <div style="color: #fbbf24; font-weight: 800; font-size: 15px;">${(!p.currentPrice || p.currentPrice == '0') ? '0đ' : (!isNaN(parseInt(p.currentPrice.replace(/\\D/g,''))) ? parseInt(p.currentPrice.replace(/\\D/g,'')).toLocaleString('vi-VN') + 'đ' : p.currentPrice)}</div>
                            </div>
                        </div>
                        
                        <!-- Access Button -->
                        <a href="${p.url}" target="_blank" class="btn btn-primary" style="margin-top: 14px; width: 100%; display: flex; align-items: center; justify-content: center; background: rgba(0, 240, 255, 0.1); border-color: rgba(0,240,255,0.3); color: var(--primary); padding: 10px; font-weight: 600; border-radius: 8px;">Mở Chatbot ngay <i class="fa-solid fa-arrow-up-right-from-square" style="margin-left:8px;"></i></a>
                    </div>
                </div>`;
            });
        }

        const modalHtml = isAdmin ? `
        <div id="chatbot-modal-overlay" class="modal-overlay" onclick="if(event.target===this)ChatbotModule.closeModal()">
            <div class="modal glass-card" id="chatbot-modal" style="display:none;max-width:500px;width:90%;padding:28px;border-radius:12px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;border-bottom:1px dashed rgba(255,255,255,0.1);padding-bottom:12px;">
                    <h3 style="color:#fff;margin:0;display:flex;align-items:center;gap:8px;"><i class="fa-solid fa-robot" style="color:var(--success);"></i> Thiết lập Chatbot Store</h3>
                    <button type="button" class="btn btn-text" onclick="ChatbotModule.closeModal()" style="padding:4px;"><i class="fa-solid fa-xmark" style="font-size:20px;"></i></button>
                </div>
                <form id="chatbot-form" onsubmit="event.preventDefault(); ChatbotModule.saveChatbot();">
                    <input type="hidden" id="chatbot-id">
                    
                    <div class="form-group" style="margin-bottom: 12px;">
                        <label style="display: flex; align-items: center; gap: 6px;">
                            <i class="fa-solid fa-image" style="color: var(--primary);"></i> Ảnh Bìa / Ảnh minh họa
                        </label>
                        <div id="chatbot-img-dropzone" style="border: 2px dashed rgba(0,240,255,0.3); border-radius: 8px; padding: 16px; text-align: center; cursor: pointer; transition: all 0.2s; background: rgba(0,240,255,0.02);" onclick="document.getElementById('chatbot-img-input').click()" ondragover="event.preventDefault();this.style.background='rgba(0,240,255,0.08)'" ondragleave="this.style.background='rgba(0,240,255,0.02)'" ondrop="event.preventDefault();this.style.background='rgba(0,240,255,0.02)';ChatbotModule.handleImageDrop(event)">
                            <div id="chatbot-img-preview-wrap">
                                <i class="fa-solid fa-cloud-arrow-up" style="font-size: 24px; color: var(--primary); opacity: 0.5;"></i>
                                <p style="color: var(--text-secondary); margin: 8px 0 0; font-size: 13px;">Nhấp hoặc kéo thả ảnh vào đây</p>
                            </div>
                        </div>
                        <input type="file" id="chatbot-img-input" accept="image/*" style="display:none" onchange="ChatbotModule.handleImageSelect(event)">
                        <input type="hidden" id="chatbot-img-data">
                    </div>

                    <div style="display:flex;gap:12px; margin-bottom:12px;">
                        <div class="form-group" style="width:70px;flex-shrink:0;margin-bottom:0;">
                            <label>Icon 😊</label>
                            <input type="text" id="chatbot-icon" placeholder="🤖" style="text-align:center;font-size:20px;">
                        </div>
                        <div class="form-group" style="flex:1;margin-bottom:0;">
                            <label>Tên Chatbot <span style="color:var(--danger)">*</span></label>
                            <input type="text" id="chatbot-title" required placeholder="Vd: Chuyên gia Marketing">
                        </div>
                    </div>
                    
                    <div style="display:flex;gap:12px; margin-bottom:12px;">
                        <div class="form-group" style="flex:1;margin-bottom:0;">
                            <label>Giá gốc (Vd: 200.000)</label>
                            <input type="text" id="chatbot-original-price" placeholder="200.000">
                        </div>
                        <div class="form-group" style="flex:1;margin-bottom:0;">
                            <label>Giá hiện tại (Vd: 0)</label>
                            <input type="text" id="chatbot-current-price" placeholder="0">
                        </div>
                    </div>

                    <div class="form-group" style="margin-bottom:12px;">
                        <label>Đường link URL đích <span style="color:var(--danger)">*</span></label>
                        <input type="text" id="chatbot-url" required placeholder="https://chatgpt.com/g/g-xxxxxx">
                    </div>
                    <div class="form-group" style="margin-bottom:12px;">
                        <label>Mô tả ngắn</label>
                        <textarea id="chatbot-desc" placeholder="Bot này dùng để làm gì?..." style="height:60px;resize:none;background:rgba(0,0,0,0.2);border:1px solid var(--glass-border);padding:12px;border-radius:8px;color:#fff;font-family:'Poppins',sans-serif;width:100%;box-sizing:border-box;"></textarea>
                    </div>
                    <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:20px;">
                        <button type="button" class="btn btn-text" onclick="ChatbotModule.closeModal()">Hủy</button>
                        <button type="submit" class="btn btn-success"><i class="fa-solid fa-save" style="margin-right:8px;"></i>Lưu lại</button>
                    </div>
                </form>
            </div>
        </div>` : '';

        container.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
                <div style="display:flex;align-items:center;gap:12px;">
                    <div style="width:48px;height:48px;background:rgba(16,185,129,0.1);border:1px solid var(--success);border-radius:12px;display:flex;align-items:center;justify-content:center;">
                        <i class="fa-solid fa-robot" style="color:var(--success);font-size:20px;"></i>
                    </div>
                    <div>
                        <h3 style="color:#fff;margin:0;font-size:20px;">Thư viện Chatbot</h3>
                        <p style="color:var(--text-secondary);margin:0;font-size:13px;">Marketplace trợ lý AI chuyên môn</p>
                    </div>
                </div>
                ${isAdmin ? `<button type="button" class="btn btn-primary" onclick="ChatbotModule.showModal()"><i class="fa-solid fa-plus" style="margin-right:8px;"></i>Thêm Chatbot</button>` : `<span class="badge badge-blue">Quyền Nhân Viên</span>`}
            </div>

            <div class="dashboard-grid" style="grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;">
                ${cardsHtml}
            </div>

            ${modalHtml}
        `;
    },

    showModal: (id = null) => {
        if (!Auth.currentUser || Auth.currentUser.role !== 'admin') {
            Utils.showToast("Bạn không có quyền này!", "error");
            return;
        }
        const overlay = document.getElementById('chatbot-modal-overlay');
        if (!overlay) { ChatbotModule.render(); return; }

        document.getElementById('chatbot-id').value = '';
        document.getElementById('chatbot-title').value = '';
        document.getElementById('chatbot-icon').value = '🤖';
        document.getElementById('chatbot-desc').value = '';
        document.getElementById('chatbot-url').value = '';
        document.getElementById('chatbot-original-price').value = '';
        document.getElementById('chatbot-current-price').value = '';
        
        document.getElementById('chatbot-img-data').value = '';
        const prevWrap = document.getElementById('chatbot-img-preview-wrap');
        if (prevWrap) prevWrap.innerHTML = `<i class="fa-solid fa-cloud-arrow-up" style="font-size:24px;color:var(--primary);opacity:0.5;"></i><p style="color:var(--text-secondary);margin:8px 0 0;font-size:13px;">Nhấp hoặc kéo thả ảnh vào đây</p>`;


        if (id) {
            const p = ChatbotModule.data.chatbots.find(x => x.id === id);
            if (p) {
                document.getElementById('chatbot-id').value = p.id;
                document.getElementById('chatbot-title').value = p.title || '';
                document.getElementById('chatbot-icon').value = p.icon || '🤖';
                document.getElementById('chatbot-desc').value = p.desc || '';
                document.getElementById('chatbot-url').value = p.url || '';
                document.getElementById('chatbot-original-price').value = p.originalPrice || '';
                document.getElementById('chatbot-current-price').value = p.currentPrice || '';
                
                document.getElementById('chatbot-img-data').value = p.imgData || '';
                if (p.imgData && prevWrap) {
                    prevWrap.innerHTML = `<img src="${p.imgData}" style="max-height:100px;border-radius:6px;object-fit:contain;">`;
                }
            }
        }
        overlay.classList.add('active');
        document.getElementById('chatbot-modal').style.display = 'block';
    },

    closeModal: () => {
        const overlay = document.getElementById('chatbot-modal-overlay');
        if (overlay) overlay.classList.remove('active');
        const modal = document.getElementById('chatbot-modal');
        if (modal) modal.style.display = 'none';
    },

    handleImageSelect: (event) => {
        const file = event.target.files[0];
        if (file) ChatbotModule._readImageFile(file);
    },

    handleImageDrop: (event) => {
        const file = event.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) ChatbotModule._readImageFile(file);
    },

    _readImageFile: (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 600;
                const MAX_HEIGHT = 600;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                } else {
                    if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Mức nén 0.8 cho JPEG
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                
                document.getElementById('chatbot-img-data').value = dataUrl;
                const prevWrap = document.getElementById('chatbot-img-preview-wrap');
                if (prevWrap) prevWrap.innerHTML = `<img src="${dataUrl}" style="max-height:120px;border-radius:6px;object-fit:cover;"><p style="color:var(--success);font-size:12px;margin:6px 0 0;"><i class="fa-solid fa-check"></i> Đã chọn & Nén ảnh</p>`;
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    },

    saveChatbot: async () => {
        if (!Auth.currentUser || Auth.currentUser.role !== 'admin') {
            Utils.showToast("⛔ Bạn không có quyền thực hiện thao tác này!", "error");
            return;
        }

        const id = document.getElementById('chatbot-id').value;
        const title = document.getElementById('chatbot-title').value.trim();
        const icon = document.getElementById('chatbot-icon').value.trim() || '🤖';
        const desc = document.getElementById('chatbot-desc').value.trim();
        const url = document.getElementById('chatbot-url').value.trim();
        const originalPrice = document.getElementById('chatbot-original-price').value.trim();
        const currentPrice = document.getElementById('chatbot-current-price').value.trim();
        const imgData = document.getElementById('chatbot-img-data').value;

        if (!title || !url) {
            Utils.showToast("Vui lòng nhập Tên và URL!", "error");
            return;
        }

        const latestDb = await DB.getChatbots() || [];
        if (latestDb.length > 0) ChatbotModule.data.chatbots = latestDb;

        if (id) {
            const idx = ChatbotModule.data.chatbots.findIndex(x => x.id === id);
            if (idx !== -1) ChatbotModule.data.chatbots[idx] = { id, title, icon, desc, url, originalPrice, currentPrice, imgData };
        } else {
            ChatbotModule.data.chatbots.push({ id: Utils.generateId(), title, icon, desc, url, originalPrice, currentPrice, imgData });
        }

        await DB.saveChatbots(ChatbotModule.data.chatbots);
        ChatbotModule.render();
        Utils.showToast("Đã lưu Chatbot thành công!", "success");
    },

    deleteChatbot: async (id) => {
        if (!Auth.currentUser || Auth.currentUser.role !== 'admin') {
            Utils.showToast("⛔ Bạn không có quyền xóa Chatbot!", "error");
            return;
        }
        if (!confirm("Xóa Chatbot này?")) return;
        
        const latestDb = await DB.getChatbots() || [];
        if (latestDb.length > 0) ChatbotModule.data.chatbots = latestDb;
        
        ChatbotModule.data.chatbots = ChatbotModule.data.chatbots.filter(x => x.id !== id);
        await DB.saveChatbots(ChatbotModule.data.chatbots);
        ChatbotModule.render();
        Utils.showToast("Đã xóa Chatbot!", "success");
    }
};
