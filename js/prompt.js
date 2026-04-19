// js/prompt.js
const PromptModule = {
    data: {
        prompts: [],
        currentCategory: 'ALL',
        categories: []
    },

    init: async () => {
        // Build settings & categories
        const settings = await DB.getSettings() || {};
        if (settings.promptCategories && settings.promptCategories.length > 0) {
            PromptModule.data.categories = settings.promptCategories;
        } else {
            PromptModule.data.categories = ['Video', 'SEO', 'Chatbot', 'Sale', 'Khác'];
            settings.promptCategories = PromptModule.data.categories;
            await DB.saveSettings(settings);
        }

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
                    <button class="btn btn-outline" onclick="PromptModule.manageCategories()" style="padding: 10px 14px; margin-right: 8px;">
                        <i class="fa-solid fa-list-ul" style="margin-right: 8px;"></i>Quản lý Danh mục
                    </button>
                    <button class="btn btn-primary" onclick="PromptModule.showModal()">
                        <i class="fa-solid fa-plus" style="margin-right: 8px;"></i>Thêm Prompt
                    </button>
                    ` : `<span class="badge badge-blue">Quyền Nhân Viên</span>`}
                </div>
            </div>
            
            <!-- Category Filter Tabs -->
            <div style="display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 16px;">
                <button type="button" class="btn btn-sm ${PromptModule.data.currentCategory === 'ALL' ? 'btn-primary' : 'btn-text'}" style="border-radius: 20px; font-size: 13px; font-weight: 600;" onclick="PromptModule.setCategory('ALL')">Tất cả</button>
                ${PromptModule.data.categories.map(cat => `
                    <button type="button" class="btn btn-sm ${PromptModule.data.currentCategory === cat ? 'btn-primary' : 'btn-text'}" style="border-radius: 20px; font-size: 13px; font-weight: 600;" onclick="PromptModule.setCategory('${cat}')">${cat}</button>
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
                            <h4 class="title-glow" style="margin: 0 0 8px 0; font-size: 16px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis;">${p.title}</h4>
                            <p style="color: var(--warning); font-size: 13px; margin: 0; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.5; font-style: italic;">
                                <i class="fa-solid fa-tag" style="margin-right: 4px;"></i>${p.desc}
                            </p>
                            ${p.imgData ? `<img src="${p.imgData}" style="width:100%; max-height:140px; object-fit:contain; border-radius:6px; margin-top:10px; border:1px solid rgba(255,255,255,0.08); background:rgba(0,0,0,0.2); cursor: crosshair;" onmouseenter="PromptModule.showPreview(this.src, this)" onmouseleave="PromptModule.hidePreview()">` : ''}
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

    showPreview: (src, imgElem) => {
        let preview = document.getElementById('global-prompt-image-preview');
        if (!preview) {
            preview = document.createElement('div');
            preview.id = 'global-prompt-image-preview';
            preview.style.cssText = 'position: fixed; z-index: 99999; max-width: 450px; background: rgba(5, 10, 20, 0.95); border: 1px solid var(--primary); border-radius: 8px; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 240, 255, 0.2); padding: 8px; pointer-events: none; transition: opacity 0.15s ease, transform 0.15s ease; opacity: 0; transform: scale(0.95) translateY(10px); display: flex; transform-origin: bottom center;';
            preview.innerHTML = '<img id="global-prompt-image-preview-src" src="" style="width: 100%; height: auto; max-height: 480px; object-fit: contain; border-radius: 4px;">';
            document.body.appendChild(preview);
        }
        
        document.getElementById('global-prompt-image-preview-src').src = src;
        preview.style.display = 'block';

        if (imgElem) {
            const card = imgElem.closest('.prompt-card') || imgElem;
            const cardRect = card.getBoundingClientRect();
            preview.style.bottom = (window.innerHeight - cardRect.top + 10) + 'px';
            preview.style.top = 'auto';

            // Căn lề phải của popup trùng với lề phải của thẻ card
            let rightPos = window.innerWidth - cardRect.right;
            if (rightPos < 10) rightPos = 10; // Không sát mép màn hình quá
            preview.style.right = rightPos + 'px';
            preview.style.left = 'auto';

            // Nếu card ở quá gần mép trên làm hình bị che, đẩy xuống dưới card
            if (cardRect.top < 300) {
                preview.style.top = (cardRect.bottom + 10) + 'px';
                preview.style.bottom = 'auto';
                preview.style.transformOrigin = 'top center';
                preview.style.transform = 'scale(0.95) translateY(-10px)';
            } else {
                preview.style.transformOrigin = 'bottom center';
                preview.style.transform = 'scale(0.95) translateY(10px)';
            }
        }
        
        setTimeout(() => {
            preview.style.opacity = '1';
            preview.style.transform = 'scale(1) translateY(0)';
        }, 10);
    },

    hidePreview: () => {
        const preview = document.getElementById('global-prompt-image-preview');
        if (preview) {
            preview.style.opacity = '0';
            const originText = preview.style.transformOrigin;
            preview.style.transform = originText.includes('top') ? 'scale(0.95) translateY(-10px)' : 'scale(0.95) translateY(10px)';
            setTimeout(() => { if (preview.style.opacity === '0') preview.style.display = 'none'; }, 150);
        }
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

        // Dynamic inject categories
        const catSelect = document.getElementById('prompt-category');
        if (catSelect) {
            catSelect.innerHTML = PromptModule.data.categories.map(c => `<option value="${c}">${c}</option>`).join('');
        }

        if (id) {
            const p = PromptModule.data.prompts.find(x => x.id === id);
            if (p) {
                document.getElementById('prompt-id').value = p.id;
                document.getElementById('prompt-title').value = p.title || '';
                document.getElementById('prompt-category').value = p.category || 'Khác';
                document.getElementById('prompt-desc').value = p.desc || '';
                document.getElementById('prompt-content').value = p.content || '';
                // Load image preview if exists
                document.getElementById('prompt-img-data').value = p.imgData || '';
                const prevWrap = document.getElementById('prompt-img-preview-wrap');
                if (p.imgData && prevWrap) {
                    prevWrap.innerHTML = `<img src="${p.imgData}" style="max-height:100px;border-radius:6px;object-fit:contain;">`;
                }
            }
        } else {
            document.getElementById('prompt-img-data').value = '';
            const prevWrap = document.getElementById('prompt-img-preview-wrap');
            if (prevWrap) prevWrap.innerHTML = `<i class="fa-solid fa-cloud-arrow-up" style="font-size:24px;color:var(--primary);opacity:0.5;"></i><p style="color:var(--text-secondary);margin:8px 0 0;font-size:13px;">Nhấp hoặc kéo thả ảnh vào đây</p>`;
        }

        modal.classList.add('active');
        document.getElementById('prompt-modal').style.display = 'block';
    },

    closeModal: () => {
        document.getElementById('prompt-modal-overlay').classList.remove('active');
        document.getElementById('prompt-modal').style.display = 'none';
    },

    manageCategories: () => {
        if (!Auth.currentUser || Auth.currentUser.role !== 'admin') return;
        const cats = PromptModule.data.categories || [];
        let html = `
            <div style="margin-bottom: 16px;">
                <p style="color:var(--warning); font-size:12px; margin-top:0;"><i class="fa-solid fa-triangle-exclamation"></i> Xóa danh mục sẽ chuyển các Prompt bên trong sang "Khác".</p>
                <ul id="prompt-cat-list" style="list-style:none; padding:0; margin:0; max-height:200px; overflow-y:auto; background:rgba(0,0,0,0.2); border-radius:8px;">
                    ${cats.map(c => `
                        <li style="display:flex; justify-content:space-between; padding: 10px 12px; border-bottom: 1px dashed rgba(255,255,255,0.05); color:#fff; align-items:center;">
                            <span>${c}</span>
                            ${c === 'Khác' ? '' : `<button onclick="PromptModule.deleteCategory('${c}')" style="color:var(--danger); background:none; border:none; cursor:pointer; padding:4px;"><i class="fa-solid fa-trash"></i></button>`}
                        </li>
                    `).join('')}
                </ul>
            </div>
            <div style="display:flex; gap: 8px;">
                <input type="text" id="new-prompt-cat" class="form-control" style="background:rgba(255,255,255,0.05); color:#fff;" placeholder="Tên danh mục mới...">
                <button type="button" class="btn btn-primary" onclick="PromptModule.addCategory()">Thêm</button>
            </div>
        `;
        Utils.showModal("🛠 Quản lý Danh mục", html, null, null);
    },

    addCategory: async () => {
        const val = document.getElementById('new-prompt-cat').value.trim();
        if (!val) return;
        if (PromptModule.data.categories.includes(val)) {
            Utils.showToast("Danh mục đã tồn tại!", "error"); return;
        }
        PromptModule.data.categories.push(val);
        const settings = await DB.getSettings() || {};
        settings.promptCategories = PromptModule.data.categories;
        await DB.saveSettings(settings);
        PromptModule.render();
        PromptModule.manageCategories();
        Utils.showToast("Đã thêm danh mục!", "success");
    },

    deleteCategory: async (catName) => {
        const isConfirmed = await Utils.showConfirm("Xác nhận Xóa", `Xóa danh mục "<b>${catName}</b>"?`, "Xóa", "Hủy");
        if(!isConfirmed) return;
        PromptModule.data.categories = PromptModule.data.categories.filter(c => c !== catName);
        if (!PromptModule.data.categories.includes('Khác')) PromptModule.data.categories.push('Khác');
        
        const settings = await DB.getSettings() || {};
        settings.promptCategories = PromptModule.data.categories;
        await DB.saveSettings(settings);
        
        let changed = false;
        PromptModule.data.prompts.forEach(p => {
            if(p.category === catName) { p.category = 'Khác'; changed = true; }
        });
        if(changed) await DB.savePrompts(PromptModule.data.prompts);

        PromptModule.render();
        PromptModule.manageCategories();
        Utils.showToast("Đã xóa danh mục!", "success");
    },

    savePrompt: async () => {
        // Bảo mật: Chỉ Admin mới được lưu
        if (!Auth.currentUser || Auth.currentUser.role !== 'admin') {
            Utils.showToast("⛔ Bạn không có quyền thực hiện thao tác này!", "error");
            return;
        }
        const id = document.getElementById('prompt-id').value;
        const title = document.getElementById('prompt-title').value.trim();
        const category = document.getElementById('prompt-category').value;
        const desc = document.getElementById('prompt-desc').value.trim();
        const content = document.getElementById('prompt-content').value.trim();
        let imgData = document.getElementById('prompt-img-data').value;

        // Ép nén lại nếu ảnh từ DB cũ kéo xuống quá to
        imgData = await Utils.compressImageBase64(imgData);

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
                PromptModule.data.prompts[idx] = { id, title, category, desc, content, imgData };
            }
        } else {
            // Thêm mới
            PromptModule.data.prompts.push({
                id: Utils.generateId(),
                title,
                category,
                desc,
                content,
                imgData
            });
        }

        const success = await DB.savePrompts(PromptModule.data.prompts);
        if(!success) {
            Utils.showToast("⛔ Lỗi lưu dữ liệu! Vượt quá dung lượng 1MB.", "error");
            return;
        }
        PromptModule.closeModal();
        PromptModule.render();
        Utils.showToast("Đã lưu Prompt thành công!", "success");
    },

    deletePrompt: async (id) => {
        // Bảo mật: Chỉ Admin mới được xóa
        if (!Auth.currentUser || Auth.currentUser.role !== 'admin') {
            Utils.showToast("⛔ Bạn không có quyền xóa Prompt!", "error");
            return;
        }
        const isConfirmed = await Utils.showConfirm("Xác nhận Xóa", "Bạn có chắc chắn muốn xóa Prompt này?", "Xóa", "Hủy");
        if (isConfirmed) {
            // Tải dữ liệu mới nhất từ DB
            const latestDbPrompts = await DB.getPrompts() || [];
            if (latestDbPrompts.length > 0) {
                PromptModule.data.prompts = latestDbPrompts;
            }

            PromptModule.data.prompts = PromptModule.data.prompts.filter(x => x.id !== id);
            const success = await DB.savePrompts(PromptModule.data.prompts);
            if(!success) {
                Utils.showToast("⛔ Lỗi xóa dữ liệu!", "error");
                return;
            }
            PromptModule.render();
            Utils.showToast("Đã xóa Prompt!", "success");
        }
    },

    copyToClipboard: (id, btnEl) => {
        const p = PromptModule.data.prompts.find(x => x.id === id);
        if (p && p.content) {
            navigator.clipboard.writeText(p.content).then(() => {
                Utils.showToast("Đã sao chép prompt vào Clipboard!", "success");
                const originalHtml = btnEl.innerHTML;
                const originalBg = btnEl.style.background;
                btnEl.innerHTML = '<i class="fa-solid fa-check"></i>';
                btnEl.style.background = 'linear-gradient(135deg, #059669, #047857)';
                setTimeout(() => { btnEl.innerHTML = originalHtml; btnEl.style.background = originalBg; }, 1500);
            }).catch(err => {
                Utils.showToast("Không thể sao chép.", "error");
            });
        }
    },

    handleImageSelect: (event) => {
        const file = event.target.files[0];
        if (file) PromptModule._readImageFile(file);
    },

    handleImageDrop: (event) => {
        const file = event.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) PromptModule._readImageFile(file);
    },

    _readImageFile: (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 400;
                const MAX_HEIGHT = 400;
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

                const dataUrl = canvas.toDataURL('image/webp', 0.6);
                
                document.getElementById('prompt-img-data').value = dataUrl;
                const prevWrap = document.getElementById('prompt-img-preview-wrap');
                if (prevWrap) prevWrap.innerHTML = `<img src="${dataUrl}" style="max-height:120px;border-radius:6px;object-fit:contain;background:rgba(0,0,0,0.2);"><p style="color:var(--success);font-size:12px;margin:6px 0 0;"><i class="fa-solid fa-check"></i> Đã nén ảnh thành công</p>`;
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    },

    setChatbotLink: async () => {
        const currentLink = (app.state.settings && app.state.settings.chatbotLink) ? app.state.settings.chatbotLink : 'https://chatgpt.com';
        const link = await Utils.showPrompt("Nhập link Chatbot GPT:", currentLink);
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
