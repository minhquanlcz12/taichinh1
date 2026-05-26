// js/auth.js - Authentication System

const Auth = {
    accountsKey: 'tl_accounts',
    currentUserKey: 'tl_current_user',

    currentUser: null,

    init: async () => {
        // Verify admin account exists; if not, log a warning (do NOT auto-create with hardcoded credentials)
        let accounts = await DB.getAccounts();
        if (!accounts.find(a => a.role === 'admin')) {
            console.warn('[Auth] Không tìm thấy tài khoản admin trong database. Vui lòng tạo tài khoản admin trực tiếp trong Firebase Console.');
        }

        Auth.checkLogin();
        Auth.setupListeners();
    },

    getAccounts: async () => {
        return await DB.getAccounts();
    },

    saveAccounts: async (accounts) => {
        await DB.saveAccounts(accounts);
    },

    checkLogin: () => {
        const user = Utils.storage.get(Auth.currentUserKey);
        if (user) {
            Auth.currentUser = user;
            Auth.showApp();
        } else {
            Auth.showLogin();
        }

        // --- Handle Boot Sequence (In-Card HUD) ---
        const bootScreen = document.getElementById('incard-boot-screen');
        const loginWrapper = document.getElementById('login-wrapper');
        const loginForm = document.getElementById('login-form');
        const progressTrack = document.getElementById('cyber-progress-track');

        if (bootScreen && loginWrapper && loginForm && progressTrack) {
            // Hiển thị trạng thái Boot
            bootScreen.style.display = 'flex';
            loginWrapper.style.display = 'none';
            loginForm.style.display = 'none';
            progressTrack.innerHTML = ''; // reset

            const NUM_PILLS = 24;
            for (let i = 0; i < NUM_PILLS; i++) {
                const pill = document.createElement('div');
                pill.className = 'cyber-pill';
                progressTrack.appendChild(pill);
            }

            // Simulate loading by activating pills one by one
            const pills = progressTrack.querySelectorAll('.cyber-pill');
            const progressText = document.getElementById('cyber-progress-text');
            let currentPill = 0;
            const loadInterval = setInterval(() => {
                if (currentPill < pills.length) {
                    pills[currentPill].classList.add('active');
                    currentPill++;
                    if (progressText) {
                        const percent = Math.round((currentPill / pills.length) * 100);
                        progressText.textContent = percent + '%';
                    }
                } else {
                    clearInterval(loadInterval);
                    // Loading finished, transition to form
                    setTimeout(() => {
                        bootScreen.style.opacity = '0';
                        setTimeout(() => {
                            bootScreen.style.display = 'none';
                            loginWrapper.style.display = 'block';
                            loginForm.style.display = 'block';
                            loginWrapper.style.animation = 'fadeIn 0.5s ease';
                        }, 300);
                    }, 400); // small delay before fade
                }
            }, 60); // 60ms * 24 pills = ~1.44 seconds load time
        }
    },

    showLogin: () => {
        document.getElementById('auth-overlay').style.display = 'flex';
        document.getElementById('login-wrapper').style.display = 'block'; // Ensure the new wrapper is shown
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('register-form').style.display = 'none';
        
        // Ensure forgot password modal is hidden when returning to login
        const forgotModal = document.getElementById('forgot-password-modal');
        if (forgotModal) forgotModal.style.display = 'none';
        
        document.querySelector('.app-container').style.display = 'none';
        
        // Hide boot screen if we are just switching back to login
        const bootScreen = document.getElementById('incard-boot-screen');
        if (bootScreen) bootScreen.style.display = 'none';
    },

    showRegister: () => {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'block';
        
        // Ensure forgot password modal is hidden
        const forgotModal = document.getElementById('forgot-password-modal');
        if (forgotModal) forgotModal.style.display = 'none';
        
        // Hide boot screen if we are just switching to register
        const bootScreen = document.getElementById('incard-boot-screen');
        if (bootScreen) bootScreen.style.display = 'none';
    },

    showForgotPassword: (e) => {
        if (e) e.preventDefault();
        // Hide the wrappers and forms, then show the modal
        document.getElementById('login-wrapper').style.display = 'none';
        document.getElementById('forgot-password-modal').style.display = 'flex';
    },

    showApp: () => {
        document.getElementById('auth-overlay').style.display = 'none';
        document.querySelector('.app-container').style.display = 'flex';

        // Update user profile UI
        const profileEl = document.querySelector('.user-profile .avatar');
        if (Auth.currentUser.profile && Auth.currentUser.profile.avatar) {
            profileEl.innerHTML = `<img src="${Auth.currentUser.profile.avatar}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
            profileEl.style.background = 'transparent';
            profileEl.style.border = '';
            profileEl.style.boxShadow = '';
        } else {
            const userColor = Utils.getUserAvatarColor(Auth.currentUser.username);
            profileEl.innerHTML = `<span style="color: #fff; font-weight: bold;">${Auth.currentUser.username[0].toUpperCase()}</span>`;
            profileEl.style.background = userColor;
            profileEl.style.border = '';
            profileEl.style.boxShadow = '';
        }
        profileEl.setAttribute('title', `Role: ${Auth.currentUser.role}`);

        // Wallet Balance Badge
        let walletBadge = document.getElementById('wallet-balance-badge');
        if (!walletBadge) {
            walletBadge = document.createElement('div');
            walletBadge.id = 'wallet-balance-badge';
            walletBadge.style.cssText = 'display:flex;align-items:center;gap:6px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);padding:8px 14px;border-radius:20px;cursor:pointer;font-weight:600;color:#10b981;font-size:14px;';
            walletBadge.onclick = () => { if (typeof ChatbotModule !== 'undefined') ChatbotModule.showTopupModal(); };
            document.querySelector('.user-profile').insertBefore(walletBadge, document.querySelector('.user-profile .avatar'));
        }
        const bal = Auth.currentUser.balance || 0;
        walletBadge.innerHTML = `<i class="fa-solid fa-wallet"></i> ${bal.toLocaleString('vi-VN')}đ`;

        Auth.renderSettings();

        if (typeof AttendanceMusic !== 'undefined') AttendanceMusic.init();
        app.init(); // Boot the main app layout now that user is logged in
        if (typeof ChatModule !== 'undefined') ChatModule.startListening();
        if (typeof GamesModule !== 'undefined') GamesModule.init();
        if (typeof LobbyNeon !== 'undefined') LobbyNeon.startGlobalMissionListening();
    },

    login: async (e) => {
        e.preventDefault();
        const userIn = document.getElementById('login-user').value.trim();
        const passIn = document.getElementById('login-pass').value;

        const accounts = await Auth.getAccounts();
        const found = accounts.find(a => a.username === userIn && a.password === passIn);

        if (found) {
            Auth.currentUser = { username: found.username, role: found.role, profile: found.profile || {}, balance: found.balance || 0, purchasedBots: found.purchasedBots || [], exp: found.exp || 0, level: found.level || 1, selectedTitleLevel: found.selectedTitleLevel ?? null, selectedTitleKey: found.selectedTitleKey ?? null, achievements: found.achievements || [] };
            Utils.storage.set(Auth.currentUserKey, Auth.currentUser); // Keep current user locally for session
            Utils.showToast('Đăng nhập thành công!', 'success');
            Auth.showApp();
        } else {
            document.getElementById('login-error').textContent = 'Tên đăng nhập hoặc mật khẩu không đúng.';
        }
    },

    register: async (e) => {
        e.preventDefault();
        const userIn = document.getElementById('reg-user').value.trim();
        const passIn = document.getElementById('reg-pass').value;
        const confirmIn = document.getElementById('reg-confirm').value;

        const errorEl = document.getElementById('reg-error');

        if (passIn !== confirmIn) {
            errorEl.textContent = 'Mật khẩu xác nhận không khớp.';
            return;
        }

        const accounts = await Auth.getAccounts();
        if (accounts.find(a => a.username === userIn)) {
            errorEl.textContent = 'Tên đăng nhập đã tồn tại.';
            return;
        }

        accounts.push({ username: userIn, password: passIn, role: 'user', profile: {}, balance: 0, purchasedBots: [], exp: 0, level: 1 });
        await Auth.saveAccounts(accounts);

        // --- NEW: Lời chào Telegram khi có nhân viên mới ---
        // Phải getSettings thủ công vì lúc này người dùng chưa đăng nhập nên app.state.settings có thể chưa tải
        const currentSettings = await DB.getSettings();
        if (currentSettings && currentSettings.tgToken && currentSettings.tgChatId) {
            const welcomeMsg = `🎉 <b>CHÀO MỪNG NHÂN VIÊN MỚI</b> 🎉\n\n` +
                               `👤 <b>Tài khoản:</b> ${userIn}\n` +
                               `💼 <b>Chức vụ:</b> Nhân viên (User)\n\n` +
                               `🎊 Chúc bạn hoàn thành xuất sắc công việc được giao nhé! Chào mừng đến với công ty Tiến Dũng Digital!\n` +
                               `👉 <a href="https://minhquanlcz12.github.io/taichinh1/">Đăng nhập Hệ thống</a>`;
            
            try {
                const url = `https://api.telegram.org/bot${currentSettings.tgToken}/sendMessage`;
                fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: currentSettings.tgChatId,
                        text: welcomeMsg,
                        parse_mode: 'HTML'
                    })
                });
            } catch (e) {
                console.error("Lỗi gửi lời chào Telegram:", e);
            }
        }

        Utils.showToast('Đăng ký thành công! Vui lòng Đăng nhập.', 'success');
        Auth.showLogin();
    },

    logout: () => {
        if (typeof ChatModule !== 'undefined') ChatModule.stopListening();
        Utils.storage.remove(Auth.currentUserKey);
        Auth.currentUser = null;
        location.reload(); // Reload context wholly
    },

    setupListeners: () => {
        document.getElementById('login-form').addEventListener('submit', Auth.login);
        document.getElementById('register-form').addEventListener('submit', Auth.register);

        document.getElementById('go-to-reg').addEventListener('click', Auth.showRegister);
        document.getElementById('go-to-login').addEventListener('click', Auth.showLogin);
        
        const forgotLink = document.getElementById('go-to-forgot');
        if(forgotLink) {
            forgotLink.addEventListener('click', Auth.showForgotPassword);
        }
        
        const cancelForgotBtn = document.getElementById('btn-cancel-forgot');
        if(cancelForgotBtn) {
            cancelForgotBtn.addEventListener('click', () => {
                document.getElementById('forgot-password-modal').style.display = 'none';
                document.getElementById('login-wrapper').style.display = 'block';
            });
        }
        
        const forgotForm = document.getElementById('forgot-form');
        if(forgotForm) {
            forgotForm.addEventListener('submit', Auth.handleForgotPassword);
        }
    },
    
    handleForgotPassword: async (e) => {
        e.preventDefault();
        const userIn = document.getElementById('forgot-user').value.trim();
        if (userIn) {
            const accounts = await Auth.getAccounts();
            if(!accounts.find(a => a.username === userIn)) {
                Utils.showToast('Tài khoản không tồn tại.', 'error');
                return;
            }
            
            let reqs = await DB.getPasswordRequests();
            if(!reqs.find(r => r.username === userIn)) {
                reqs.push({ username: userIn, date: new Date().toISOString() });
                await DB.savePasswordRequests(reqs);
            }

            Utils.showModal(
                'SYSTEM ACTIVATED',
                `
                <div style="text-align: center;">
                    <i class="fa-solid fa-shield-halved" style="font-size: 48px; color: var(--warning); margin-bottom: 16px;"></i>
                    <p style="font-size: 16px; margin-bottom: 16px;">Yêu cầu cấp lại mật khẩu cho tài khoản <strong style="color: var(--primary);">"${userIn}"</strong> đã được tiếp nhận.</p>
                    <div style="background: rgba(0,0,0,0.3); padding: 16px; border-radius: 8px; border: 1px dashed var(--warning);">
                        <p style="color: var(--text-secondary); margin-bottom: 8px;">Yêu cầu của bạn đang chờ Quản trị viên phê duyệt.</p>
                    </div>
                </div>
                `,
                () => {
                    document.getElementById('forgot-user').value = '';
                    document.getElementById('forgot-password-modal').style.display = 'none';
                    document.getElementById('login-wrapper').style.display = 'block';
                    return true;
                },
                'ĐÃ HIỂU'
            );
        }
    },

    toggleAccordion: (headerEl) => {
        const content = headerEl.nextElementSibling;
        const icon = headerEl.querySelector('.accordion-icon');
        if (content.style.display === 'none') {
            content.style.display = 'block';
            if (icon) { icon.classList.remove('fa-chevron-down'); icon.classList.add('fa-chevron-up'); }
        } else {
            content.style.display = 'none';
            if (icon) { icon.classList.remove('fa-chevron-up'); icon.classList.add('fa-chevron-down'); }
        }
    },

    createAccordionBlock: (id, title, iconClass, contentHtml, openByDefault = false, styleOverride = '', titleStyleOverride = '') => {
        return `
            <div class="glass-card" data-accordion-id="${id}" style="margin-bottom: 24px; padding: 0; overflow: hidden; ${styleOverride}">
                <div onclick="Auth.toggleAccordion(this)" style="padding: 16px 24px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); transition: background 0.2s;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <h3 style="margin: 0; font-size: 16px; color: var(--primary); ${titleStyleOverride}"><i class="fa-solid ${iconClass}" style="margin-right: 8px;"></i>${title}</h3>
                    </div>
                    <i class="fa-solid ${openByDefault ? 'fa-chevron-up' : 'fa-chevron-down'} accordion-icon" style="color:var(--text-secondary);"></i>
                </div>
                <div class="accordion-content" style="display: ${openByDefault ? 'block' : 'none'}; padding: 16px 24px; border-top: 1px solid rgba(255,255,255,0.05);">
                    ${contentHtml}
                </div>
            </div>
        `;
    },

    renderSettings: async () => {
        const settingsView = document.getElementById('settings-view');

        // Track what was previously open if re-rendering
        const previouslyOpen = new Set();
        let hasRenderedBefore = false;
        if (settingsView.innerHTML.trim() !== '') {
            hasRenderedBefore = true;
            settingsView.querySelectorAll('.glass-card').forEach(card => {
                const idAttr = card.getAttribute('data-accordion-id');
                const content = card.querySelector('.accordion-content');
                if (idAttr && content && content.style.display === 'block') {
                    previouslyOpen.add(idAttr);
                }
            });
        }
        
        const isOpen = (id, defaultVal) => hasRenderedBefore ? previouslyOpen.has(id) : defaultVal;

        let currentKey = Utils.storage.get('claude_api_key') || '';
        let currentModel = Utils.storage.get('claude_api_model') || 'claude-3-haiku-20240307';
        let isCustomModel = !['claude-3-haiku-20240307', 'claude-3-5-sonnet-20240620', 'claude-3-opus-20240229', 'opus-4.7', 'sonnet-4.6', 'haiku-4.5'].includes(currentModel);
        
        let html = '';

        html += Auth.createAccordionBlock('acc-password', 'Đổi mật khẩu', 'fa-key', `
            <p style="color:var(--text-secondary); margin-bottom: 16px; margin-top: 0;">Thay đổi mật khẩu đăng nhập của bạn. Khuyến nghị cập nhật thường xuyên.</p>
            <div class="form-group" style="margin-bottom: 12px;">
                <input type="password" id="cp-old" class="form-control" placeholder="Mật khẩu hiện tại" autocomplete="off">
            </div>
            <div style="display: flex; gap: 12px; margin-bottom: 16px;">
                <input type="password" id="cp-new" class="form-control" placeholder="Mật khẩu mới" autocomplete="off" style="flex:1;">
                <input type="password" id="cp-confirm" class="form-control" placeholder="Xác nhận mật khẩu mới" autocomplete="off" style="flex:1;">
            </div>
            <button class="btn btn-warning" onclick="Auth.changePassword()">
                <i class="fa-solid fa-key"></i> Cập nhật Mật khẩu
            </button>
        `, isOpen('acc-password', false));

        const userColor = Utils.getUserAvatarColor(Auth.currentUser.username);
        html += `
            <div class="glass-card" style="margin-bottom: 24px; padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px; background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%); border: 1px solid rgba(255,255,255,0.1);">
                <div style="display:flex; align-items:center; gap:16px;">
                    <div class="avatar" style="width: 50px; height: 50px; font-size: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.5); background: ${userColor}; color: #fff;">${Auth.currentUser.username[0].toUpperCase()}</div>
                    <div>
                        <h4 style="font-size:16px; margin: 0 0 4px 0; color: var(--primary);">${Auth.currentUser.username} <span class="badge ${Auth.currentUser.role === 'admin' ? 'badge-orange' : 'badge-blue'}" style="vertical-align: middle; margin-left: 4px; font-size: 10px;">${Auth.currentUser.role.toUpperCase()} (v1.1)</span></h4>
                        <p style="color:var(--text-secondary); margin: 0; font-size: 12px;">Phiên đăng nhập hiện tại</p>
                    </div>
                </div>
                <button class="btn btn-danger" onclick="Auth.logout()" style="padding: 10px 20px; font-weight: bold; box-shadow: 0 4px 15px rgba(248, 113, 113, 0.3);">
                    <i class="fa-solid fa-right-from-bracket"></i> Đăng xuất
                </button>
            </div>
        `;

        html += Auth.createAccordionBlock('acc-ai', 'Tích hợp AI Claude (MỚI - v1.1)', 'fa-robot', `
            <p style="color:var(--text-secondary); margin-bottom: 16px; margin-top: 0;">Nhập mã API Anthropic của bạn để kích hoạt chức năng tự động viết Nội dung/Kịch bản ở cấp độ chuyên gia.</p>
            <div class="form-group" style="display:flex; gap: 8px;">
                <input type="password" id="claude-api-key" class="form-control" placeholder="sk-ant-api03-..." value="${currentKey}" style="flex:1;">
                <button class="btn btn-primary" onclick="Auth.saveClaudeKey()"><i class="fa-solid fa-floppy-disk"></i> Lưu Cấu Hình</button>
            </div>

            <div class="form-group" style="margin-top: 12px;">
                <label style="color: var(--text-secondary); font-size: 13px;">API Base URL (Dành cho Proxy/Mirror):</label>
                <input type="text" id="claude-api-base" class="form-control" placeholder="Mặc định: https://api.anthropic.com" value="${Utils.storage.get('claude_api_base') || ''}" style="margin-top:4px; background: rgba(0,0,0,0.2); font-size:12px;">
                <p style="color: var(--text-secondary); font-size: 11px; margin-top: 4px;">* Nếu dùng API từ web khác (như OpenAI Proxy), hãy nhập URL gốc của backend proxy đó.</p>
            </div>
            
            <div class="form-group" style="margin-top: 12px;">
                <label style="color: var(--text-secondary); font-size: 13px;">Chọn Model AI (Ưu tiên hàng mạnh nhất):</label>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px;">
                    <label style="display:flex; align-items:center; gap:4px; font-size: 12px;">
                        <input type="radio" name="claude-model" value="claude-3-haiku-20240307" ${currentModel === 'claude-3-haiku-20240307' ? 'checked' : ''}>
                        Haiku 3.0 (Cơ bản)
                    </label>
                    <label style="display:flex; align-items:center; gap:4px; font-size: 12px; color: var(--warning);">
                        <input type="radio" name="claude-model" value="claude-3-5-sonnet-20240620" ${currentModel === 'claude-3-5-sonnet-20240620' ? 'checked' : ''}>
                        Sonnet 3.5 (Chuẩn)
                    </label>
                    <label style="display:flex; align-items:center; gap:4px; font-size: 12px; color: var(--danger); font-weight: bold;">
                        <input type="radio" name="claude-model" value="opus-4.7" ${currentModel === 'opus-4.7' ? 'checked' : ''}>
                        OPUS 4.7 (Vô đối 🔥)
                    </label>
                    <label style="display:flex; align-items:center; gap:4px; font-size: 12px; color: #a855f7;">
                        <input type="radio" name="claude-model" value="sonnet-4.6" ${currentModel === 'sonnet-4.6' ? 'checked' : ''}>
                        Sonnet 4.6 (Mạnh)
                    </label>
                    <label style="display:flex; align-items:center; gap:4px; font-size: 12px;">
                        <input type="radio" name="claude-model" value="custom" ${isCustomModel ? 'checked' : ''} onclick="document.getElementById('custom-model-input-group').style.display='block'">
                        Khác (Tùy chỉnh)
                    </label>
                </div>
                <div id="custom-model-input-group" style="margin-top: 10px; display: ${isCustomModel ? 'block' : 'none'};">
                    <input type="text" id="claude-model-custom" class="form-control" placeholder="Nhập tên model (vd: claude-3-opus-20240229)" value="${isCustomModel ? currentModel : ''}" style="font-size: 12px; background: rgba(168, 85, 247, 0.1); border-color: var(--primary);">
                </div>
            </div>

            <small style="color: var(--text-secondary); display:block; margin-top:8px;"><i class="fa-solid fa-circle-info"></i> API Key chỉ lưu bảo mật trên trình duyệt máy tính của bạn. Nếu API bị lỗi CORS do Browser, app sẽ tự động fallback về mẫu Local.</small>
        `, isOpen('acc-ai', false));

        if (Auth.currentUser.role === 'admin') {
            const accounts = await Auth.getAccounts();
            const pwdReqs = await DB.getPasswordRequests();

            const pwdReqsHtml = `
                <p style="color:var(--text-secondary); margin-bottom: 16px; margin-top: 0;">Nhân viên quên mật khẩu sẽ hiện ở đây để chờ Admin cấp lại.</p>
                ${pwdReqs.length === 0 ? '<p style="color: var(--text-secondary); font-style: italic;">Không có yêu cầu nào.</p>' : `
                <table class="data-table" style="width: 100%;">
                    <thead>
                        <tr>
                            <th>Tài khoản</th>
                            <th>Thời gian gửi</th>
                            <th style="text-align:right;">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pwdReqs.map(r => `
                            <tr>
                                <td><strong style="color: var(--primary);">${r.username}</strong></td>
                                <td>${new Date(r.date).toLocaleString('vi-VN')}</td>
                                <td style="text-align:right;">
                                    <button class="btn btn-primary" onclick="Auth.approvePasswordReset('${r.username}')" style="margin-right:8px;"><i class="fa-solid fa-check"></i> Xác nhận (Pass: 123456)</button>
                                    <button class="btn-text text-danger" onclick="Auth.rejectPasswordReset('${r.username}')"><i class="fa-solid fa-trash"></i> Hủy</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                `}
            `;
            html += Auth.createAccordionBlock('acc-pwd', 'Yêu cầu cấp lại mật khẩu' + (pwdReqs.length > 0 ? ` <span class="badge badge-orange" style="margin-left: 8px;">${pwdReqs.length}</span>` : ''), 'fa-bell', pwdReqsHtml, isOpen('acc-pwd', pwdReqs.length > 0), pwdReqs.length > 0 ? 'border-color: rgba(234, 179, 8, 0.3);' : '', pwdReqs.length > 0 ? 'color: var(--warning);' : '');

            html += Auth.createAccordionBlock('acc-bot', 'Tích hợp Telegram Bot', 'fa-telegram', `
                <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 20px; margin-top: 0; line-height: 1.6;">
                    Nhận thông báo tự động (Đơn xin nghỉ phép, Cảnh báo Deadline) trực tiếp về điện thoại thông qua Telegram Bot.
                </p>
                <div class="form-group">
                    <label>1. Telegram Bot Token <span style="font-weight: normal; font-size: 11px; color: var(--warning);">(Tạo từ @BotFather)</span></label>
                    <input type="text" id="setting-tg-token" class="form-control" placeholder="Ví dụ: 1234567890:ABCdefGhIJKlmNoPQRstuVWXyz..." value="${app.state.settings.tgToken || ''}">
                </div>
                <div class="form-group" style="margin-top: 16px;">
                    <label>2. Group Chat ID / User Chat ID <span style="font-weight: normal; font-size: 11px; color: var(--warning);">(Lấy từ @userinfobot hoặc thêm bot vào nhóm)</span></label>
                    <input type="text" id="setting-tg-chatid" class="form-control" placeholder="Ví dụ: -100123456789" value="${app.state.settings.tgChatId || ''}">
                </div>
                <button class="btn btn-primary" onclick="app.saveTelegramSettings()" style="margin-top: 16px;">
                    <i class="fa-solid fa-floppy-disk"></i> Lưu Cài Đặt Telegram
                </button>
            `, isOpen('acc-bot', false));

            html += Auth.createAccordionBlock('acc-users', 'Quản lý Người dùng', 'fa-users', `
                <p style="color:var(--text-secondary); margin-bottom: 16px; margin-top: 0;">Danh sách các tài khoản đã đăng ký trên máy này.</p>
                
                <table class="data-table" style="width: 100%;">
                    <thead>
                        <tr>
                            <th>Tên đăng nhập</th>
                            <th>Vai trò</th>
                            <th style="text-align:right;">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${accounts.map(acc => `
                            <tr>
                                <td>${acc.username}</td>
                                <td><span class="badge ${acc.role === 'admin' ? 'badge-orange' : 'badge-blue'}">${acc.role}</span></td>
                                <td style="text-align:right;">
                                    <button class="btn-text" style="color:var(--primary); margin-right: 8px;" onclick="Auth.showViewProfileModal('${acc.username}')"><i class="fa-solid fa-eye"></i> Xem</button>
                                    ${acc.username !== 'admin' ?
                `<button class="btn-text text-danger" onclick="Auth.deleteUser('${acc.username}')"><i class="fa-solid fa-trash"></i> Xóa</button>` :
                '<span style="color:var(--text-secondary); font-size:12px;">Không thể xóa Admin</span>'}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `, isOpen('acc-users', true));

            html += Auth.createAccordionBlock('acc-danger', 'Dữ liệu Hệ thống (Vùng nguy hiểm)', 'fa-triangle-exclamation', `
                <p style="color:var(--text-secondary); margin-bottom: 20px; margin-top: 0;">Lưu ý: Xóa dữ liệu sẽ làm mất vĩnh viễn toàn bộ giao dịch và kế hoạch hệ thống.</p>
                <button class="btn btn-danger" id="clear-data-btn">
                    Xóa toàn bộ dữ liệu (Hard Reset)
                </button>
            `, isOpen('acc-danger', false), 'border-color: rgba(248, 113, 113, 0.3);', 'color: var(--danger);');
        }

        settingsView.innerHTML = html;

        // re-bind clear data IF it exists
            const clearBtn = document.getElementById('clear-data-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', async () => {
                if (await Utils.showConfirm('Vùng nguy hiểm', 'Bạn có chắc chắn muốn xóa tất cả dữ liệu (Của CẢ HỆ THỐNG)? Hành động này không thể hoàn tác.', 'Xóa toàn bộ', 'Hủy bỏ')) {
                    await DB.clearAll();
                    Utils.storage.clearAll(); // clear local session
                    location.reload();
                }
            });
        }
    },

    saveClaudeKey: () => {
        const key = document.getElementById('claude-api-key').value.trim();
        const baseUrl = document.getElementById('claude-api-base').value.trim();
        let model = document.querySelector('input[name="claude-model"]:checked').value;
        if (model === 'custom') {
            model = document.getElementById('claude-model-custom').value.trim() || 'claude-3-haiku-20240307';
        }
        
        Utils.storage.set('claude_api_key', key);
        Utils.storage.set('claude_api_base', baseUrl);
        Utils.storage.set('claude_api_model', model);
        
        Utils.showToast('Đã lưu Cấu hình AI an toàn tại trình duyệt!', 'success');
    },

    deleteUser: async (username) => {
        if (username === 'admin') return;

        if (await Utils.showConfirm('Xác nhận Xóa', `Bạn có chắc chắn xóa tài khoản "${username}"?`)) {
            let accounts = await Auth.getAccounts();
            accounts = accounts.filter(a => a.username !== username);
            await Auth.saveAccounts(accounts);
            Auth.renderSettings();
        }
    },

    changePassword: async () => {
        const oldP = document.getElementById('cp-old').value;
        const newP = document.getElementById('cp-new').value;
        const confirmP = document.getElementById('cp-confirm').value;

        if(!oldP || !newP || !confirmP) {
            Utils.showToast("Vui lòng điền đủ thông tin.", "error");
            return;
        }

        if (newP !== confirmP) {
            Utils.showToast("Mật khẩu mới không khớp.", "error");
            return;
        }

        let accounts = await Auth.getAccounts();
        const me = accounts.find(a => a.username === Auth.currentUser.username);
        if (!me || me.password !== oldP) {
            Utils.showToast("Mật khẩu hiện tại không đúng.", "error");
            return;
        }

        me.password = newP;
        await Auth.saveAccounts(accounts);
        
        document.getElementById('cp-old').value = '';
        document.getElementById('cp-new').value = '';
        document.getElementById('cp-confirm').value = '';

        Utils.showToast("Đổi mật khẩu thành công!", "success");
    },

    approvePasswordReset: async (username) => {
        if (!await Utils.showConfirm('Xác nhận', `Xác nhận cấp lại mật khẩu cho tài khoản "${username}" về mặc định "123456"?`)) return;

        // 1. Change password
        let accounts = await Auth.getAccounts();
        const target = accounts.find(a => a.username === username);
        if (target) {
            target.password = '123456';
            await Auth.saveAccounts(accounts);
        }

        // 2. Remove Request
        let reqs = await DB.getPasswordRequests();
        reqs = reqs.filter(r => r.username !== username);
        await DB.savePasswordRequests(reqs);

        // 3. Rerender
        Auth.renderSettings();

        // 4. Báo cáo (Do Bot không inbox riêng được nên chỉ hiện Toast cho Admin biết)
        Utils.showToast(`Đã reset mật khẩu của "${username}" về 123456. Vui lòng nhắn tin riêng cho nhân sự đó.`, "success");
    },

    rejectPasswordReset: async (username) => {
        if (!await Utils.showConfirm('Xác nhận Hủy', `Bạn muốn hủy yêu cầu cấp lại mật khẩu của "${username}"?`)) return;
        let reqs = await DB.getPasswordRequests();
        reqs = reqs.filter(r => r.username !== username);
        await DB.savePasswordRequests(reqs);
        Auth.renderSettings();
    },

    // Profile Management
    showProfileModal: () => {
        const modal = document.getElementById('profile-modal');
        document.getElementById('profile-modal-overlay').classList.add('active');
        modal.style.display = 'block';

        const profile = Auth.currentUser.profile || {};

        document.getElementById('profile-fullname').value = profile.fullname || '';
        document.getElementById('profile-dob').value = profile.dob || '';
        document.getElementById('profile-phone').value = profile.phone || '';
        document.getElementById('profile-address').value = profile.address || '';
        document.getElementById('profile-position').value = profile.position || '';
        document.getElementById('profile-color').value = profile.color || '#00b4d8';

        const previewImg = document.getElementById('profile-preview-img');
        const b64Input = document.getElementById('profile-img-base64');
        if (profile.avatar) {
            previewImg.src = profile.avatar;
            previewImg.style.display = 'block';
            b64Input.value = profile.avatar;
        } else {
            previewImg.style.display = 'none';
            b64Input.value = '';
        }
    },

    closeProfileModal: () => {
        document.getElementById('profile-modal-overlay').classList.remove('active');
        document.getElementById('profile-modal').style.display = 'none';
    },

    handleProfileImageUpload: (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_SIZE = 150;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_SIZE) {
                        height *= MAX_SIZE / width;
                        width = MAX_SIZE;
                    }
                } else {
                    if (height > MAX_SIZE) {
                        width *= MAX_SIZE / height;
                        height = MAX_SIZE;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Compress as JPEG 0.7 quality to save size (Base64)
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);

                const previewImg = document.getElementById('profile-preview-img');
                previewImg.src = dataUrl;
                previewImg.style.display = 'block';
                document.getElementById('profile-img-base64').value = dataUrl;
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    },

    saveProfile: async () => {
        const currentProfile = Auth.currentUser.profile || {};
        const profile = {
            fullname: document.getElementById('profile-fullname').value,
            dob: document.getElementById('profile-dob').value,
            phone: document.getElementById('profile-phone').value,
            address: document.getElementById('profile-address').value,
            color: document.getElementById('profile-color').value,
            avatar: document.getElementById('profile-img-base64').value,
            position: document.getElementById('profile-position').value,
            chibiConfig: currentProfile.chibiConfig || null
        };

        Auth.currentUser.profile = profile;
        Utils.storage.set(Auth.currentUserKey, Auth.currentUser);

        // Update in accounts array too
        const accounts = await Auth.getAccounts();
        const accIdx = accounts.findIndex(a => a.username === Auth.currentUser.username);
        if (accIdx > -1) {
            accounts[accIdx].profile = profile;
            await Auth.saveAccounts(accounts);
        }

        Auth.closeProfileModal();
        Auth.showApp(); // Re-render avatar
        
        // Also re-render rewards if visible
        if (typeof RewardsModule !== 'undefined' && document.getElementById('rewards-view') && document.getElementById('rewards-view').style.display !== 'none') {
            RewardsModule.render();
        }

        Utils.showToast("Đã lưu hồ sơ thành công!", "success");
    },

    // Admin View Profile Management
    showViewProfileModal: async (username) => {
        const accounts = await Auth.getAccounts();
        const acc = accounts.find(a => a.username === username);
        if (!acc) return;

        const profile = acc.profile || {};
        const avatarSrc = profile.avatar || '';
        const hasAvatar = !!avatarSrc;

        const contentHtml = `
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="width: 100px; height: 100px; border-radius: 50%; margin: 0 auto; overflow: hidden; border: 3px solid var(--primary); background: ${hasAvatar ? 'transparent' : Utils.getUserAvatarColor(username)}; display: flex; align-items: center; justify-content: center;">
                    ${hasAvatar ? `<img src="${avatarSrc}" style="width: 100%; height: 100%; object-fit: cover;">` : `<b style="font-size: 40px; color: #fff;">${username[0].toUpperCase()}</b>`}
                </div>
                <h4 style="margin-top: 12px; font-size: 18px;">${profile.fullname || acc.username}</h4>
                <div style="color: var(--text-secondary); font-size: 13px;">Vai trò: <span style="text-transform: capitalize;">${acc.role}</span></div>
            </div>
            
            <div class="glass-card" style="padding: 16px;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid var(--border-color);">
                    <i class="fa-regular fa-calendar" style="color: var(--primary); width: 20px; text-align: center;"></i>
                    <div style="flex: 1;">
                        <div style="font-size: 11px; color: var(--text-secondary);">Ngày sinh</div>
                        <div style="font-weight: 500;">${profile.dob ? Utils.formatDate(profile.dob) : 'Chưa cập nhật'}</div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid var(--border-color);">
                    <i class="fa-solid fa-phone" style="color: var(--primary); width: 20px; text-align: center;"></i>
                    <div style="flex: 1;">
                        <div style="font-size: 11px; color: var(--text-secondary);">Số điện thoại</div>
                        <div style="font-weight: 500;">${profile.phone || 'Chưa cập nhật'}</div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <i class="fa-solid fa-location-dot" style="color: var(--primary); width: 20px; text-align: center;"></i>
                    <div style="flex: 1;">
                        <div style="font-size: 11px; color: var(--text-secondary);">Nơi ở</div>
                        <div style="font-weight: 500; line-height: 1.4;">${profile.address || 'Chưa cập nhật'}</div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px; margin-top: 16px; padding-top: 16px; border-top: 1px dashed var(--warning);">
                    <i class="fa-solid fa-money-bill-wave" style="color: var(--success); width: 20px; text-align: center; font-size: 18px;"></i>
                    <div style="flex: 1; display: flex; gap: 8px; align-items: flex-end;">
                        <div style="flex: 1;">
                            <div style="font-size: 12px; color: var(--warning); margin-bottom: 4px; font-weight: bold;">CÀI ĐẶT LƯƠNG CƠ BẢN (VNĐ/Tháng)</div>
                            <input type="number" id="admin-edit-base-salary" class="form-control" value="${acc.baseSalary || 0}" style="padding: 6px 12px; font-size: 14px; font-weight: bold; color: var(--success);">
                        </div>
                        <button class="btn btn-success" style="padding: 6px 16px; height: 35px;" onclick="Auth.saveBaseSalary('${username}')"><i class="fa-solid fa-save"></i> LƯU</button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('view-profile-content').innerHTML = contentHtml;
        document.getElementById('view-profile-modal-overlay').classList.add('active');
        document.getElementById('view-profile-modal').style.display = 'block';
    },

    closeViewProfileModal: () => {
        document.getElementById('view-profile-modal-overlay').classList.remove('active');
        document.getElementById('view-profile-modal').style.display = 'none';
    },

    saveBaseSalary: async (username) => {
        const inputVal = document.getElementById('admin-edit-base-salary').value;
        const newSalary = parseInt(inputVal) || 0;

        let accounts = await Auth.getAccounts();
        const accIdx = accounts.findIndex(a => a.username === username);
        if (accIdx > -1) {
            accounts[accIdx].baseSalary = newSalary;
            await Auth.saveAccounts(accounts);
            Utils.showToast(`Đã lưu Lương cơ bản của ${username}: ${Utils.formatCurrency(newSalary)}`, 'success');
        }
    },

    // ========== HỆ THỐNG EXP & CẤP ĐỘ ==========
    EXP_MULTIPLIER: 80, // 1 reward point = 80 EXP

    getExpForLevel: (level) => {
        // EXP cần để lên từ cấp (N-1) sang cấp N = 60 × N
        // Tổng EXP tích lũy để đạt cấp N = sum(60×2 + 60×3 + ... + 60×N)
        // ~3 tháng để đạt cấp 15 (max) với ~2400 EXP/tháng
        if (level <= 1) return 0;
        let total = 0;
        for (let i = 2; i <= level; i++) total += 60 * i;
        return total;
    },

    // Danh sách tất cả danh hiệu
    TITLE_LIST: [
        { level: 1,  title: '🌱 Lính Mới Vào Nghề',    color: '#94a3b8', glow: false, bubbleColor: 'rgba(255,255,255,0.95)', bubbleGlow: 'none' },
        { level: 3,  title: '📋 Dân Agency Chính Hiệu', color: '#38bdf8', glow: false, bubbleColor: '#38bdf8', bubbleGlow: 'none' },
        { level: 5,  title: '⚡ Sát Thủ Deadline',      color: '#10b981', glow: false, bubbleColor: 'linear-gradient(135deg, #10b981, #059669)', bubbleGlow: '0 0 8px #10b98160' },
        { level: 7,  title: '🔥 Thánh Cày Overtime',    color: '#a855f7', glow: false, bubbleColor: 'linear-gradient(135deg, #a855f7, #6366f1)', bubbleGlow: '0 0 10px #a855f780' },
        { level: 10, title: '💎 Trùm Agency Ngầm',      color: '#fbbf24', glow: true,  bubbleColor: 'linear-gradient(135deg, #fbbf24, #f59e0b)', bubbleGlow: '0 0 12px #fbbf2480' },
        { level: 12, title: '🏆 Huyền Thoại Cháy KPI',  color: '#f59e0b', glow: true,  bubbleColor: 'linear-gradient(135deg, #f59e0b, #fbbf24)', bubbleGlow: '0 0 12px #f59e0b80' },
        { level: 15, title: '👑 Bố Già Marketing',      color: '#ff6b6b', glow: true,  bubbleColor: 'linear-gradient(135deg, #ff6b6b, #fbbf24, #a855f7)', bubbleGlow: '0 0 15px #ff6b6b, 0 0 30px #fbbf2440' },
        // Danh hiệu đặc biệt - mở khóa qua thành tích
        { level: 0, achievement: 'top1_monthly', title: '🏅 Quán Quân Bảng Vàng', color: '#00f3ff', glow: true, bubbleColor: 'linear-gradient(135deg, #00f3ff, #fbbf24)', bubbleGlow: '0 0 15px #00f3ff, 0 0 25px #fbbf2440' },
        { level: 0, achievement: 'caro_5_wins', title: '🎲 Thần Đồng Bàn Cờ', color: '#a855f7', glow: true, bubbleColor: 'linear-gradient(135deg, #a855f7, #38bdf8)', bubbleGlow: '0 0 10px #a855f790' },
        { level: 0, achievement: 'caro_15_wins', title: '⚔️ Độc Cô Cầu Bại Caro', color: '#fbbf24', glow: true, bubbleColor: 'linear-gradient(135deg, #fbbf24, #ff4757)', bubbleGlow: '0 0 15px #fbbf2490' },
        { level: 0, achievement: 'caro_30_wins', title: '👑 Kỳ Thánh Caro Cơ Quan', color: '#ff4757', glow: true, bubbleColor: 'linear-gradient(135deg, #ff4757, #fbbf24, #00f3ff)', bubbleGlow: '0 0 20px #ff4757, 0 0 35px #00f3ff60' },
    ],

    getLevelTitle: (level) => {
        // Trả về danh hiệu MẶC ĐỊNH cao nhất cho level này
        const list = Auth.TITLE_LIST;
        for (let i = list.length - 1; i >= 0; i--) {
            if (level >= list[i].level) return { ...list[i] };
        }
        return { ...list[0] };
    },

    getAllUnlockedTitles: (level, achievements) => {
        // Trả về tất cả danh hiệu mà user đã mở khóa (cả level và achievement)
        const userAchievements = achievements || [];
        return Auth.TITLE_LIST.filter(t => {
            if (t.achievement) return userAchievements.includes(t.achievement);
            return level >= t.level;
        });
    },

    getDisplayTitle: (user) => {
        // Trả về danh hiệu user ĐANG CHỌN hiển thị (hoặc mặc định cao nhất)
        const userLevel = user?.level || 1;
        const selectedKey = user?.selectedTitleKey;
        const selectedLevel = user?.selectedTitleLevel;
        const achievements = user?.achievements || [];
        
        // Ưu tiên selectedTitleKey (dành cho achievement titles)
        if (selectedKey) {
            const selected = Auth.TITLE_LIST.find(t => t.achievement === selectedKey);
            if (selected && achievements.includes(selectedKey)) return { ...selected };
        }
        // Fall back to selectedTitleLevel
        if (selectedLevel != null) {
            const selected = Auth.TITLE_LIST.find(t => !t.achievement && t.level === selectedLevel);
            if (selected && userLevel >= selected.level) return { ...selected };
        }
        return Auth.getLevelTitle(userLevel);
    },

    setSelectedTitle: async (titleLevel, achievementKey) => {
        if (!Auth.currentUser) return;
        const userLevel = Auth.currentUser.level || 1;
        const achievements = Auth.currentUser.achievements || [];
        let titleEntry;

        if (achievementKey) {
            titleEntry = Auth.TITLE_LIST.find(t => t.achievement === achievementKey);
            if (!titleEntry || !achievements.includes(achievementKey)) {
                Utils.showToast('Bạn chưa mở khóa danh hiệu này!', 'error');
                return;
            }
            Auth.currentUser.selectedTitleKey = achievementKey;
            Auth.currentUser.selectedTitleLevel = null;
        } else {
            titleEntry = Auth.TITLE_LIST.find(t => !t.achievement && t.level === titleLevel);
            if (!titleEntry || userLevel < titleEntry.level) {
                Utils.showToast('Bạn chưa đủ cấp để dùng danh hiệu này!', 'error');
                return;
            }
            Auth.currentUser.selectedTitleLevel = titleLevel;
            Auth.currentUser.selectedTitleKey = null;
        }

        Utils.storage.set(Auth.currentUserKey, Auth.currentUser);

        // Lưu vào database
        const accounts = await Auth.getAccounts();
        const acc = accounts.find(a => a.username === Auth.currentUser.username);
        if (acc) {
            acc.selectedTitleLevel = Auth.currentUser.selectedTitleLevel;
            acc.selectedTitleKey = Auth.currentUser.selectedTitleKey;
            await Auth.saveAccounts(accounts);
        }

        Utils.showToast(`Đã đổi danh hiệu thành "${titleEntry.title}"! Ngầu quá trời! 😎`, 'success');

        // Re-render chibi trong sảnh nếu đang ở lobby
        if (typeof LobbyNeon !== 'undefined' && LobbyNeon.state?.myPos) {
            const user = Auth.currentUser;
            LobbyNeon.renderUser(user.username, LobbyNeon.state.myPos.x, LobbyNeon.state.myPos.y, user.profile?.chibiConfig, true);
        }
    },

    checkAndUnlockCaroAchievements: async (username) => {
        try {
            const accounts = await Auth.getAccounts();
            const acc = accounts.find(a => a.username === username);
            if (!acc) return;

            if (!acc.achievements) acc.achievements = [];
            const caroWins = acc.stats?.caroWins || 0;
            
            let unlockedNew = false;
            let lastNewTitle = '';

            const checkUnlock = (threshold, key, title) => {
                if (caroWins >= threshold && !acc.achievements.includes(key)) {
                    acc.achievements.push(key);
                    unlockedNew = true;
                    lastNewTitle = title;
                    return true;
                }
                return false;
            };

            checkUnlock(5, 'caro_5_wins', '🎲 Thần Đồng Bàn Cờ');
            checkUnlock(15, 'caro_15_wins', '⚔️ Độc Cô Cầu Bại Caro');
            checkUnlock(30, 'caro_30_wins', '👑 Kỳ Thánh Caro Cơ Quan');

            if (unlockedNew) {
                await Auth.saveAccounts(accounts);
                
                // Cập nhật session user hiện tại của người đang đăng nhập
                if (Auth.currentUser && Auth.currentUser.username === username) {
                    Auth.currentUser.achievements = acc.achievements;
                    Utils.storage.set(Auth.currentUserKey, Auth.currentUser);
                }

                // Hiện thông báo mở khóa cực hoành tráng
                Utils.showModal(
                    '✨ MỞ KHÓA DANH HIỆU THỜI THƯỢNG!',
                    `<div style="text-align: center; padding: 15px;">
                        <div style="font-size: 80px; margin-bottom: 15px; animation: float 2s infinite ease-in-out;">🏆</div>
                        <p style="color: #94a3b8; font-size: 15px;">Sếp vừa mở khóa danh hiệu Caro độc quyền nhờ thành tích xuất sắc:</p>
                        <h2 style="color: #fbbf24; font-size: 26px; margin: 15px 0; text-shadow: 0 0 15px rgba(251, 191, 36, 0.6); font-weight: 900;">
                            ${lastNewTitle}
                        </h2>
                        <p style="color: #64748b; font-size: 13px; font-style: italic;">(Sếp có thể vào phần Cài đặt Chibi để đổi danh hiệu hiển thị bất cứ lúc nào!)</p>
                    </div>`,
                    null,
                    'PHONG ẤN ĐI NGAY'
                );
            }
        } catch (e) {
            console.error("Error checking caro achievements:", e);
        }
    },

    openTitleSelector: () => {
        if (!Auth.currentUser) return;
        const userLevel = Auth.currentUser.level || 1;
        const achievements = Auth.currentUser.achievements || [];
        const allTitles = Auth.TITLE_LIST;
        const currentSelectedLevel = Auth.currentUser.selectedTitleLevel;
        const currentSelectedKey = Auth.currentUser.selectedTitleKey;

        let html = `
            <div style="max-height: 400px; overflow-y: auto; padding: 5px;">
                <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-bottom: 15px; font-style: italic;">
                    Chọn danh hiệu yêu thích! Cấp hiện tại: <span style="color: #fbbf24; font-weight: 900;">Lv.${userLevel}</span>
                </p>
                ${allTitles.map(t => {
                    const isAchievement = !!t.achievement;
                    const unlocked = isAchievement ? achievements.includes(t.achievement) : userLevel >= t.level;
                    const isSelected = isAchievement 
                        ? (currentSelectedKey === t.achievement) 
                        : (!currentSelectedKey && t.level === (currentSelectedLevel ?? Auth.getLevelTitle(userLevel).level));
                    const onclickCode = isAchievement 
                        ? `Auth.setSelectedTitle(null, '${t.achievement}'); document.getElementById('modal-overlay').classList.remove('active');`
                        : `Auth.setSelectedTitle(${t.level}); document.getElementById('modal-overlay').classList.remove('active');`;
                    const reqText = isAchievement ? '🏅 TOP 1 Bảng Vàng' : `Cấp ${t.level}+`;
                    const lockText = isAchievement ? '🔒 Đạt TOP 1 bất kỳ tháng nào' : '🔒 Yêu cầu Cấp ' + t.level;
                    return `
                        <div onclick="${unlocked ? onclickCode : ''}"
                            style="display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; margin-bottom: 8px;
                            background: ${isSelected ? 'rgba(0,243,255,0.1)' : isAchievement && unlocked ? 'rgba(0,243,255,0.05)' : 'rgba(15,23,42,0.6)'};
                            border: 2px solid ${isSelected ? t.color : unlocked ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)'};
                            border-radius: 12px; cursor: ${unlocked ? 'pointer' : 'not-allowed'}; opacity: ${unlocked ? '1' : '0.4'};
                            transition: all 0.2s; ${unlocked ? '' : 'filter: grayscale(0.8);'}
                            ${isAchievement && unlocked ? 'box-shadow: 0 0 12px rgba(0,243,255,0.15);' : ''}"
                            ${unlocked ? 'onmouseover="this.style.transform=\'scale(1.02)\'" onmouseout="this.style.transform=\'scale(1)\'"' : ''}>
                            <div>
                                <div style="font-size: 15px; font-weight: 900; color: ${t.color}; margin-bottom: 3px;">
                                    ${t.title}
                                    ${isAchievement ? '<span style="font-size: 9px; background: rgba(0,243,255,0.2); color: #00f3ff; padding: 1px 6px; border-radius: 6px; margin-left: 6px;">THÀNH TÍCH</span>' : ''}
                                </div>
                                <div style="font-size: 10px; color: #64748b;">
                                    ${unlocked ? '✅ Đã mở khóa' : lockText}
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 11px; font-weight: 800; color: ${unlocked ? t.color : '#475569'};">${reqText}</div>
                                ${isSelected ? '<div style="font-size: 9px; color: #10b981; font-weight: 900; margin-top: 2px;">✨ ĐANG DÙNG</div>' : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        Utils.showModal('🏷️ CHỌN DANH HIỆU CỦA BẠN', html, null, 'ĐÓNG');
    grantAchievement: async (username, achievementKey) => {
        const accounts = await Auth.getAccounts();
        const acc = accounts.find(a => a.username === username);
        if (!acc) return false;

        if (!acc.achievements) acc.achievements = [];
        if (acc.achievements.includes(achievementKey)) return false; // Đã có rồi

        acc.achievements.push(achievementKey);
        await Auth.saveAccounts(accounts);

        // Cập nhật session nếu là user đang đăng nhập
        if (Auth.currentUser && Auth.currentUser.username === username) {
            Auth.currentUser.achievements = acc.achievements;
            Utils.storage.set(Auth.currentUserKey, Auth.currentUser);
        }

        // Tìm danh hiệu tương ứng
        const titleEntry = Auth.TITLE_LIST.find(t => t.achievement === achievementKey);
        if (titleEntry) {
            Utils.showModal(
                '🏅 DANH HIỆU ĐẶC BIỆT MỚI KHÓA!',
                `<div style="text-align: center;">
                    <div style="font-size: 80px; margin-bottom: 15px; animation: float 2s infinite ease-in-out;">🏅</div>
                    <h2 style="color: ${titleEntry.color}; font-size: 24px; margin: 10px 0; text-shadow: 0 0 20px ${titleEntry.color}60;">
                        ${titleEntry.title}
                    </h2>
                    <div style="margin: 12px auto; padding: 10px 16px; background: rgba(0,243,255,0.1); border: 1px dashed #00f3ff; border-radius: 10px; max-width: 280px;">
                        <div style="font-size: 10px; color: #00f3ff; font-weight: 900; text-transform: uppercase; margin-bottom: 4px;">🏆 THÀNH TÍCH</div>
                        <div style="font-size: 13px; color: #e2e8f0; font-weight: 600;">Bạn đã đạt TOP 1 Bảng Vàng Tuyên Dương!</div>
                    </div>
                    <p style="color: #94a3b8; font-size: 13px; margin-top: 10px; font-style: italic;">
                        Cả công ty đang ngước nhìn bạn! Vào chọn danh hiệu để khoe ngay! 😎
                    </p>
                </div>`,
                null,
                'KHOE NGAY THÔI'
            );
        }
        return true;
    },

    getLevelPerks: (level) => {
        const perks = [];
        if (level >= 1) perks.push('🌱 Trang phục cơ bản + Danh hiệu "Lính Mới Vào Nghề"');
        if (level >= 2) perks.push('🗡️ Mở thêm vũ khí mới');
        if (level >= 3) perks.push('🎩 Phụ kiện đặc biệt + Danh hiệu "Dân Agency Chính Hiệu"');
        if (level >= 5) perks.push('🦅 Cánh + Thú cưỡi + Bong bóng chat xanh lá + Dấu chân ✧');
        if (level >= 7) perks.push('🐉 Rồng + Aura + Bong bóng chat tím + Danh hiệu "Thánh Cày Overtime"');
        if (level >= 10) perks.push('🌟 Mở TOÀN BỘ trang phục + Bong bóng vàng kim');
        if (level >= 12) perks.push('🔥 Dấu chân lửa + Danh hiệu "Huyền Thoại Cháy KPI"');
        if (level >= 15) perks.push('🌈 Bong bóng cầu vồng + Dấu chân vàng + Danh hiệu "Bố Già Marketing"');
        return perks;
    },

    addExpToUser: async (username, rewardPoints) => {
        const expGained = rewardPoints * Auth.EXP_MULTIPLIER;
        const accounts = await Auth.getAccounts();
        const acc = accounts.find(a => a.username === username);
        if (!acc) return { leveled: false, expGained: 0 };

        const oldLevel = acc.level || 1;
        acc.exp = (acc.exp || 0) + expGained;

        // Kiểm tra lên cấp
        let newLevel = oldLevel;
        while (true) {
            const nextLevelExp = Auth.getExpForLevel(newLevel + 1);
            if (acc.exp >= nextLevelExp) {
                newLevel++;
            } else {
                break;
            }
        }

        acc.level = newLevel;
        await Auth.saveAccounts(accounts);

        // Cập nhật session hiện tại nếu là user đang đăng nhập
        if (Auth.currentUser && Auth.currentUser.username === username) {
            Auth.currentUser.exp = acc.exp;
            Auth.currentUser.level = newLevel;
            Utils.storage.set(Auth.currentUserKey, Auth.currentUser);
        }

        const leveled = newLevel > oldLevel;
        if (leveled) {
            const titleInfo = Auth.getLevelTitle(newLevel);
            const perks = Auth.getLevelPerks(newLevel);
            const latestPerk = perks[perks.length - 1] || '';
            const funnyQuotes = [
                'Sếp đang xem xét tăng lương cho bạn... Đùa thôi, cày tiếp đi! 😂',
                'CV của bạn vừa dày thêm 1 trang. HR đang rình xem bạn nghỉ lúc nào! 🕵️',
                'Đồng nghiệp đang ghen tị vì bạn lên cấp nhanh hơn deadline! 🚀',
                'Bạn chính thức trở thành "người đáng sợ nhất phòng Marketing"! 💀',
                'KPI tháng này coi như xong. Còn tháng sau thì... cày tiếp! 📊',
            ];
            const randomQuote = funnyQuotes[Math.floor(Math.random() * funnyQuotes.length)];
            
            Utils.showModal(
                '🎊 THĂNG CẤP! LÊN ĐỜI RỒI!',
                `<div style="text-align: center;">
                    <div style="font-size: 80px; margin-bottom: 15px; animation: float 2s infinite ease-in-out;">⬆️</div>
                    <h2 style="color: ${titleInfo.color}; font-size: 28px; margin: 10px 0; text-shadow: 0 0 20px ${titleInfo.color}60;">
                        CẤP ${newLevel}
                    </h2>
                    <div style="font-size: 18px; color: ${titleInfo.color}; font-weight: 900; margin-bottom: 15px; padding: 8px 20px; background: rgba(0,0,0,0.3); border-radius: 20px; display: inline-block; border: 1px solid ${titleInfo.color}40;">
                        ${titleInfo.title}
                    </div>
                    ${latestPerk ? `<div style="margin: 12px auto; padding: 10px 16px; background: rgba(16,185,129,0.1); border: 1px dashed #10b981; border-radius: 10px; max-width: 280px;">
                        <div style="font-size: 10px; color: #10b981; font-weight: 900; text-transform: uppercase; margin-bottom: 4px;">🔓 ĐÃ MỞ KHÓA</div>
                        <div style="font-size: 13px; color: #e2e8f0; font-weight: 600;">${latestPerk}</div>
                    </div>` : ''}
                    <p style="color: #94a3b8; font-size: 13px; margin-top: 10px; font-style: italic;">
                        ${randomQuote}
                    </p>
                </div>`,
                null,
                'PHONG ẤN ĐI NGAY'
            );
        }

        return { leveled, expGained, newLevel, oldLevel };
    },

    renderExpBar: (exp, level, compact = false) => {
        const currentLevelExp = Auth.getExpForLevel(level);
        const nextLevelExp = Auth.getExpForLevel(level + 1);
        const expInLevel = exp - currentLevelExp;
        const expNeeded = nextLevelExp - currentLevelExp;
        const progress = expNeeded > 0 ? Math.min((expInLevel / expNeeded) * 100, 100) : 100;
        const titleInfo = Auth.getLevelTitle(level);

        if (compact) {
            return `
                <div style="width: 100%; max-width: 120px; margin: 2px auto 0;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                        <span style="font-size: 9px; font-weight: 900; color: ${titleInfo.color};">Lv.${level}</span>
                        <span style="font-size: 8px; color: #64748b;">${expInLevel}/${expNeeded}</span>
                    </div>
                    <div style="width: 100%; height: 4px; background: rgba(0,0,0,0.4); border-radius: 2px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
                        <div style="width: ${progress}%; height: 100%; background: linear-gradient(90deg, ${titleInfo.color}, ${titleInfo.color}cc); border-radius: 2px; transition: width 0.5s ease; ${titleInfo.glow ? 'box-shadow: 0 0 8px ' + titleInfo.color + '80;' : ''}"></div>
                    </div>
                </div>
            `;
        }

        return `
            <div style="width: 100%; max-width: 300px; margin: 8px auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <span style="font-size: 11px; font-weight: 900; color: ${titleInfo.color};">${titleInfo.title}</span>
                    <span style="font-size: 10px; color: #94a3b8; font-weight: bold;">Cấp ${level}</span>
                </div>
                <div style="width: 100%; height: 8px; background: rgba(0,0,0,0.4); border-radius: 4px; overflow: hidden; border: 1px solid rgba(255,255,255,0.15);">
                    <div style="width: ${progress}%; height: 100%; background: linear-gradient(90deg, ${titleInfo.color}, ${titleInfo.color}aa); border-radius: 4px; transition: width 0.8s ease; ${titleInfo.glow ? 'box-shadow: 0 0 12px ' + titleInfo.color + '80;' : ''}"></div>
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 3px;">
                    <span style="font-size: 9px; color: #64748b;">⚡ ${expInLevel.toLocaleString()} / ${expNeeded.toLocaleString()} EXP</span>
                    <span style="font-size: 9px; color: #64748b;">Tổng: ${exp.toLocaleString()} EXP</span>
                </div>
            </div>
        `;
    }
};

// Replace app.init on DOM load with Auth.init
document.addEventListener('DOMContentLoaded', Auth.init);
