// js/auth.js - Authentication System

const Auth = {
    accountsKey: 'tl_accounts',
    currentUserKey: 'tl_current_user',
    adminCreds: { username: 'admin', password: '88864623456789', role: 'admin' },

    currentUser: null,

    init: async () => {
        // Initialize default admin if not exists
        let accounts = await DB.getAccounts();
        if (!accounts.find(a => a.username === 'admin')) {
            accounts.push(Auth.adminCreds);
            await DB.saveAccounts(accounts);
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
        } else {
            profileEl.innerHTML = `<span>${Auth.currentUser.username[0].toUpperCase()}</span>`;
        }
        profileEl.setAttribute('title', `Role: ${Auth.currentUser.role}`);

        Auth.renderSettings();

        app.init(); // Boot the main app layout now that user is logged in
        if (typeof ChatModule !== 'undefined') ChatModule.startListening();
    },

    login: async (e) => {
        e.preventDefault();
        const userIn = document.getElementById('login-user').value.trim();
        const passIn = document.getElementById('login-pass').value;

        const accounts = await Auth.getAccounts();
        const found = accounts.find(a => a.username === userIn && a.password === passIn);

        if (found) {
            Auth.currentUser = { username: found.username, role: found.role, profile: found.profile || {} };
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

        accounts.push({ username: userIn, password: passIn, role: 'user', profile: {} });
        await Auth.saveAccounts(accounts);

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
    
    handleForgotPassword: (e) => {
        e.preventDefault();
        const userIn = document.getElementById('forgot-user').value.trim();
        if (userIn) {
            Utils.showModal(
                'SYSTEM ACTIVATED',
                `
                <div style="text-align: center;">
                    <i class="fa-solid fa-shield-halved" style="font-size: 48px; color: var(--warning); margin-bottom: 16px;"></i>
                    <p style="font-size: 16px; margin-bottom: 16px;">Yêu cầu cấp lại mật khẩu cho tài khoản <strong style="color: var(--primary);">"${userIn}"</strong> đã được tiếp nhận.</p>
                    <div style="background: rgba(0,0,0,0.3); padding: 16px; border-radius: 8px; border: 1px dashed var(--warning);">
                        <p style="color: var(--text-secondary); margin-bottom: 8px;">Vui lòng liên hệ trực tiếp Quản trị viên:</p>
                        <p style="font-weight: bold; font-family: monospace; font-size: 20px; color: var(--success); letter-spacing: 2px;">0886 46 2345</p>
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

    renderSettings: async () => {
        const settingsView = document.getElementById('settings-view');

        let html = `
            <div class="glass-card" style="margin-bottom: 24px;">
                <h3>Cài đặt ứng dụng</h3>
                <p style="color:var(--text-secondary); margin-bottom: 20px;">Quản lý tài khoản hiện tại của bạn.</p>
                <div style="display:flex; align-items:center; gap:16px;">
                    <div class="avatar" style="width: 64px; height: 64px;">${Auth.currentUser.username[0].toUpperCase()}</div>
                    <div>
                        <h4 style="font-size:18px;">${Auth.currentUser.username} <span class="badge ${Auth.currentUser.role === 'admin' ? 'badge-orange' : 'badge-blue'}">${Auth.currentUser.role.toUpperCase()}</span></h4>
                        <button class="btn btn-danger" onclick="Auth.logout()" style="margin-top: 8px;">Đăng xuất</button>
                    </div>
                </div>
            </div>
        `;

        if (Auth.currentUser.role === 'admin') {
            const accounts = await Auth.getAccounts();
            html += `
                <div class="glass-card" style="margin-bottom: 24px;">
                    <h3>Dữ liệu Hệ thống</h3>
                    <p style="color:var(--text-secondary); margin-bottom: 20px;">Lưu ý: Xóa dữ liệu sẽ làm mất vĩnh viễn toàn bộ giao dịch và kế hoạch trên toàn hệ thống.</p>
                    <button class="btn btn-danger" id="clear-data-btn">
                        Xóa toàn bộ dữ liệu (Reset DB Firebase)
                    </button>
                </div>

                <div class="glass-card">
                    <h3>Quản lý Người dùng (Admin Only)</h3>
                    <p style="color:var(--text-secondary); margin-bottom: 16px;">Danh sách các tài khoản đã đăng ký trên máy này.</p>
                    
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
                </div>
            `;
        }

        settingsView.innerHTML = html;

        // re-bind clear data IF it exists
        const clearBtn = document.getElementById('clear-data-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', async () => {
                if (confirm('Bạn có chắc chắn muốn xóa tất cả dữ liệu (Của CẢ HỆ THỐNG)? Hành động này không thể hoàn tác.')) {
                    await DB.clearAll();
                    Utils.storage.clearAll(); // clear local session
                    location.reload();
                }
            });
        }
    },

    deleteUser: async (username) => {
        if (username === 'admin') return;

        if (confirm(`Bạn có chắc chắn xóa tài khoản "${username}" ? `)) {
            let accounts = await Auth.getAccounts();
            accounts = accounts.filter(a => a.username !== username);
            await Auth.saveAccounts(accounts);
            Auth.renderSettings();
        }
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
        const profile = {
            fullname: document.getElementById('profile-fullname').value,
            dob: document.getElementById('profile-dob').value,
            phone: document.getElementById('profile-phone').value,
            address: document.getElementById('profile-address').value,
            avatar: document.getElementById('profile-img-base64').value
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
                <div style="width: 100px; height: 100px; border-radius: 50%; margin: 0 auto; overflow: hidden; border: 3px solid var(--primary); background: var(--bg-card); display: flex; align-items: center; justify-content: center;">
                    ${hasAvatar ? `<img src="${avatarSrc}" style="width: 100%; height: 100%; object-fit: cover;">` : `<i class="fa-solid fa-user" style="font-size: 40px; color: var(--text-secondary);"></i>`}
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
            </div>
        `;

        document.getElementById('view-profile-content').innerHTML = contentHtml;
        document.getElementById('view-profile-modal-overlay').classList.add('active');
        document.getElementById('view-profile-modal').style.display = 'block';
    },

    closeViewProfileModal: () => {
        document.getElementById('view-profile-modal-overlay').classList.remove('active');
        document.getElementById('view-profile-modal').style.display = 'none';
    }
};

// Replace app.init on DOM load with Auth.init
document.addEventListener('DOMContentLoaded', Auth.init);
