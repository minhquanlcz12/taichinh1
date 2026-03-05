// js/auth.js - Authentication System

const Auth = {
    accountsKey: 'tl_accounts',
    currentUserKey: 'tl_current_user',
    adminCreds: { username: 'admin', password: '88864623456789', role: 'admin' },

    currentUser: null,

    init: () => {
        // Initialize default admin if not exists
        let accounts = Utils.storage.get(Auth.accountsKey, []);
        if (!accounts.find(a => a.username === 'admin')) {
            accounts.push(Auth.adminCreds);
            Utils.storage.set(Auth.accountsKey, accounts);
        }

        Auth.checkLogin();
        Auth.setupListeners();
    },

    getAccounts: () => {
        return Utils.storage.get(Auth.accountsKey, []);
    },

    saveAccounts: (accounts) => {
        Utils.storage.set(Auth.accountsKey, accounts);
    },

    checkLogin: () => {
        const user = Utils.storage.get(Auth.currentUserKey);
        if (user) {
            Auth.currentUser = user;
            Auth.showApp();
        } else {
            Auth.showLogin();
        }
    },

    showLogin: () => {
        document.getElementById('auth-overlay').style.display = 'flex';
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('register-form').style.display = 'none';
        document.querySelector('.app-container').style.display = 'none';
    },

    showRegister: () => {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'block';
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

        // Render Settings specific to roles
        Auth.renderSettings();

        app.init(); // Boot the main app layout now that user is logged in
    },

    login: (e) => {
        e.preventDefault();
        const userIn = document.getElementById('login-user').value.trim();
        const passIn = document.getElementById('login-pass').value;

        const accounts = Auth.getAccounts();
        const found = accounts.find(a => a.username === userIn && a.password === passIn);

        if (found) {
            Auth.currentUser = { username: found.username, role: found.role };
            Utils.storage.set(Auth.currentUserKey, Auth.currentUser);
            Auth.showApp();
        } else {
            document.getElementById('login-error').textContent = 'Tên đăng nhập hoặc mật khẩu không đúng.';
        }
    },

    register: (e) => {
        e.preventDefault();
        const userIn = document.getElementById('reg-user').value.trim();
        const passIn = document.getElementById('reg-pass').value;
        const confirmIn = document.getElementById('reg-confirm').value;

        const errorEl = document.getElementById('reg-error');

        if (passIn !== confirmIn) {
            errorEl.textContent = 'Mật khẩu xác nhận không khớp.';
            return;
        }

        const accounts = Auth.getAccounts();
        if (accounts.find(a => a.username === userIn)) {
            errorEl.textContent = 'Tên đăng nhập đã tồn tại.';
            return;
        }

        accounts.push({ username: userIn, password: passIn, role: 'user' });
        Auth.saveAccounts(accounts);

        alert('Đăng ký thành công! Vui lòng Đăng nhập.');
        Auth.showLogin();
    },

    logout: () => {
        Utils.storage.remove(Auth.currentUserKey);
        Auth.currentUser = null;
        location.reload(); // Reload context wholly
    },

    setupListeners: () => {
        document.getElementById('login-form').addEventListener('submit', Auth.login);
        document.getElementById('register-form').addEventListener('submit', Auth.register);

        document.getElementById('go-to-reg').addEventListener('click', Auth.showRegister);
        document.getElementById('go-to-login').addEventListener('click', Auth.showLogin);
    },

    renderSettings: () => {
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
            const accounts = Auth.getAccounts();
            html += `
                <div class="glass-card" style="margin-bottom: 24px;">
                    <h3>Dữ liệu Hệ thống</h3>
                    <p style="color:var(--text-secondary); margin-bottom: 20px;">Lưu ý: Xóa dữ liệu sẽ làm mất vĩnh viễn toàn bộ giao dịch và kế hoạch.</p>
                    <button class="btn btn-danger" id="clear-data-btn">
                        Xóa toàn bộ dữ liệu (Reset DB)
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
            clearBtn.addEventListener('click', () => {
                if (confirm('Bạn có chắc chắn muốn xóa tất cả dữ liệu (Của CẢ HỆ THỐNG)? Hành động này không thể hoàn tác.')) {
                    Utils.storage.clearAll();
                    location.reload();
                }
            });
        }
    },

    deleteUser: (username) => {
        if (username === 'admin') return;

        if (confirm(`Bạn có chắc chắn xóa tài khoản "${username}" ? `)) {
            let accounts = Auth.getAccounts();
            accounts = accounts.filter(a => a.username !== username);
            Auth.saveAccounts(accounts);
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
            const base64 = e.target.result;
            const previewImg = document.getElementById('profile-preview-img');
            previewImg.src = base64;
            previewImg.style.display = 'block';
            document.getElementById('profile-img-base64').value = base64;
        };
        reader.readAsDataURL(file);
    },

    saveProfile: () => {
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
        const accounts = Auth.getAccounts();
        const accIdx = accounts.findIndex(a => a.username === Auth.currentUser.username);
        if (accIdx > -1) {
            accounts[accIdx].profile = profile;
            Auth.saveAccounts(accounts);
        }

        Auth.closeProfileModal();
        Auth.showApp(); // Re-render avatar
        alert("Đã lưu hồ sơ thành công!");
    }
};

// Replace app.init on DOM load with Auth.init
document.addEventListener('DOMContentLoaded', Auth.init);
