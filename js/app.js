// js/app.js - Main Application Logic

const app = {
    state: {
        currentView: 'dashboard-view',
        theme: 'dark',
        settings: {}
    },
    
    financeChartInstance: null,
    taskChartInstance: null,

    init: async () => {
        // Load settings
        app.state.settings = await DB.getSettings();

        // Load theme
        app.state.theme = Utils.storage.get('app_theme', 'dark');
        app.applyTheme();

        // Setup Event Listeners
        app.setupNavListeners();
        app.setupThemeToggle();

        // Init modules
        FinanceModule.init();
        WorkModule.init();
        if (typeof PayrollModule !== 'undefined') PayrollModule.init();
        if (typeof PromptModule !== 'undefined') PromptModule.init();
        if (typeof ChatbotModule !== 'undefined') ChatbotModule.init();
        if (typeof RewardsModule !== 'undefined') RewardsModule.init();
        if (typeof ClaudeModule !== 'undefined') ClaudeModule.init();
        if (typeof LobbyNeon !== 'undefined') LobbyNeon.init();

        // Bật vòng lặp kiểm tra các sự kiện theo thời gian (nhắc telegram, v.v)
        setTimeout(() => {
            setInterval(Utils.checkTimeBasedActions, 60000); // Check mỗi phút
            Utils.checkTimeBasedActions(); // Lần chạy đầu tiên
        }, 5000);

        // --- NEW: Alert Admin for Pending Tasks ---
        if (Auth.currentUser && Auth.currentUser.role === 'admin') {
            setTimeout(app.checkAdminPendingActions, 1500); 
        }
    },

    checkAdminPendingActions: async () => {
        // 1. Password reset requests
        const pwdReqs = await DB.getPasswordRequests();
        const pendingPwdCount = pwdReqs.length;

        // 2. Pending Leave requests
        // Wait, Attendance data is stored in DB.getAttendanceData() ??? No, wait.
        // It's in DB.getWorkData() for Tasks, but Attendance is not in DB.js?
        // Ah, Attendance Module loads from Firebase directly? Let's check Utils or DB.
        // I will just read "db.collection('system').doc('attendance')" directly to be safe.
        let pendingLeaveCount = 0;
        try {
            // Because I don't want to import AttendanceModule if it's not fully ready or if its method is different
            // Let's rely on DB or AttendanceModule
            if (typeof AttendanceModule !== 'undefined' && AttendanceModule.data && AttendanceModule.data.logs) {
                pendingLeaveCount = AttendanceModule.data.logs.filter(l => l.type === 'P' && l.status === 'pending').length;
            } else {
                // Fetch directly
                const attDoc = await db.collection("attendance").doc("main").get();
                if (attDoc.exists && attDoc.data().logs) {
                    pendingLeaveCount = attDoc.data().logs.filter(l => l.type === 'P' && l.status === 'pending').length;
                }
            }
        } catch (e) {
            console.error(e);
        }

        if (pendingPwdCount > 0 || pendingLeaveCount > 0) {
            Utils.showModal(
                '🔔 CÔNG VIỆC CẦN XỬ LÝ',
                `
                <div style="text-align: center;">
                    <i class="fa-solid fa-bell-concierge" style="font-size: 48px; color: var(--warning); margin-bottom: 16px;"></i>
                    <p style="font-size: 16px; margin-bottom: 16px;">Chào Admin, bạn có công việc chờ Duyệt!</p>
                    <div style="background: rgba(0,0,0,0.3); padding: 16px; border-radius: 8px; border: 1px dashed var(--warning); text-align: left;">
                        ${pendingLeaveCount > 0 ? `<p style="color: var(--warning); font-weight: bold; margin-bottom: 8px;">👉 ${pendingLeaveCount} Đơn xin nghỉ phép chờ duyệt</p>` : ''}
                        ${pendingPwdCount > 0 ? `<p style="color: var(--danger); font-weight: bold;">👉 ${pendingPwdCount} Yêu cầu cấp lại mật khẩu</p>` : ''}
                    </div>
                </div>
                `,
                () => {
                    // Navigate to appropriate section if they click OK.
                    // If both, let's just go to Settings? Or just close it.
                    if (pendingPwdCount > 0) {
                        app.navigateTo('settings-view');
                    } else if (pendingLeaveCount > 0) {
                        app.navigateTo('attendance-view');
                    }
                    return true;
                },
                'ĐI XỬ LÝ NGAY'
            );
        }
    },

    setupNavListeners: () => {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const target = e.currentTarget.dataset.target;

                // Update active state in nav
                navItems.forEach(nav => nav.classList.remove('active'));
                e.currentTarget.classList.add('active');

                app.navigateTo(target);

                // Auto close mobile sidebar
                const sidebar = document.getElementById('app-sidebar');
                const overlay = document.getElementById('sidebar-overlay');
                if (sidebar) sidebar.classList.remove('open');
                if (overlay) overlay.classList.remove('active');
            });
        });
    },

    setupThemeToggle: () => {
        const toggleBtn = document.getElementById('theme-toggle-btn');
        toggleBtn.addEventListener('click', () => {
            app.state.theme = app.state.theme === 'dark' ? 'light' : 'dark';
            Utils.storage.set('app_theme', app.state.theme);
            app.applyTheme();
        });
    },

    applyTheme: () => {
        const body = document.body;
        const toggleIcon = document.querySelector('#theme-toggle-btn i');
        const toggleText = document.querySelector('#theme-toggle-btn span');

        if (app.state.theme === 'dark') {
            body.classList.add('dark-theme');
            body.classList.remove('light-theme');
            toggleIcon.className = 'fa-solid fa-sun';
            toggleText.textContent = 'Giao diện Sáng';
        } else {
            body.classList.remove('dark-theme');
            body.classList.add('light-theme');
            toggleIcon.className = 'fa-solid fa-moon';
            toggleText.textContent = 'Giao diện Tối';
        }
    },

    navigateTo: (viewId) => {
        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        // Show target view
        document.getElementById(viewId).classList.add('active');
        app.state.currentView = viewId;

        // Sync Ambient Music
        if (typeof AttendanceMusic !== 'undefined') AttendanceMusic.updateTabState(viewId);

        // Update topbar title
        const titles = {
            'dashboard-view': { title: 'Tổng quan', sub: 'Cập nhật diễn biến nhanh chóng' },
            'finance-view': { title: 'Quản lý Tài chính', sub: 'Theo dõi dòng tiền chặt chẽ' },
            'payroll-view': { title: 'Lương & Thưởng', sub: 'Bảng tính tự động theo năng suất nhân sự' },
            'work-view': { title: 'Công việc & Lịch', sub: 'Sắp xếp kế hoạch hiệu quả' },
            'attendance-view': { title: 'Chấm Công Tự Động', sub: 'Quản lý ngày làm việc và chuyên cần' },
            'prompt-view': { title: 'Kho Prompt', sub: 'Thư viện câu lệnh AI mẫu' },
            'chatbot-view': { title: 'Thư viện Chatbot', sub: 'Trạm lưu trữ các Cỗ máy AI đa nhiệm' },
            'settings-view': { title: 'Cài đặt', sub: 'Tùy chỉnh hệ thống' },
            'rewards-view': { title: 'Đổi Thưởng', sub: 'Dùng Công Đức đổi Đặc Quyền' },
            'music-view': { title: '🎵 YouTube Music', sub: 'Nghe nhạc & xem MV ngay trong ứng dụng' },
            'lobby-view': { title: 'Sảnh Chờ Chibi', sub: 'Giao lưu, kết bạn và thách đấu cờ Caro' }
        };

        const titleInfo = titles[viewId] || titles['dashboard-view'];
        document.getElementById('view-title').textContent = titleInfo.title;
        document.getElementById('view-subtitle').textContent = titleInfo.sub;

        // specific actions on navigate
        if (viewId === 'dashboard-view') {
            app.renderDashboard();
            // sync active state in sidebar just in case triggered by code
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            document.querySelector('.nav-item[data-target="dashboard-view"]').classList.add('active');
        } else if (viewId === 'finance-view') {
            FinanceModule.render();
            // sync active state in sidebar just in case triggered by code
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            document.querySelector('.nav-item[data-target="finance-view"]').classList.add('active');
        } else if (viewId === 'work-view') {
            if (typeof WorkModule !== 'undefined') {
                const timeFilterEl = document.getElementById('work-time-filter');
                if (timeFilterEl) timeFilterEl.value = 'today';
                WorkModule.currentFilterTime = 'today';
                WorkModule.render();
            }
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            const workNav = document.querySelector('.nav-item[data-target="work-view"]');
            if (workNav) workNav.classList.add('active');
        } else if (viewId === 'attendance-view') {
            Attendance.render();
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            const attNav = document.querySelector('.nav-item[data-target="attendance-view"]');
            if (attNav) attNav.classList.add('active');
        } else if (viewId === 'payroll-view') {
            if (typeof PayrollModule !== 'undefined') {
                PayrollModule.render();
            }
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            const prNav = document.querySelector('.nav-item[data-target="payroll-view"]');
            if (prNav) prNav.classList.add('active');
        } else if (viewId === 'prompt-view') {
            if (typeof PromptModule !== 'undefined') {
                PromptModule.render();
            }
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            const pNav = document.querySelector('.nav-item[data-target="prompt-view"]');
            if (pNav) pNav.classList.add('active');
        } else if (viewId === 'chatbot-view') {
            if (typeof ChatbotModule !== 'undefined') {
                ChatbotModule.render();
            }
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            const cbNav = document.querySelector('.nav-item[data-target="chatbot-view"]');
            if (cbNav) cbNav.classList.add('active');
        } else if (viewId === 'settings-view') {
            document.getElementById('setting-tg-token').value = app.state.settings.tgToken || '';
            document.getElementById('setting-tg-chatid').value = app.state.settings.tgChatId || '';
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            const settingsNav = document.querySelector('.nav-item[data-target="settings-view"]');
            if (settingsNav) settingsNav.classList.add('active');
        } else if (viewId === 'music-view') {
            if (typeof MusicPlayer !== 'undefined') MusicPlayer.render();
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            const musicNav = document.querySelector('.nav-item[data-target="music-view"]');
            if (musicNav) musicNav.classList.add('active');
        } else if (viewId === 'rewards-view') {
            if (typeof RewardsModule !== 'undefined') RewardsModule.render();
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            const rewardsNav = document.querySelector('.nav-item[data-target="rewards-view"]');
            if (rewardsNav) rewardsNav.classList.add('active');
        } else if (viewId === 'lobby-view') {
            if (typeof LobbyNeon !== 'undefined') LobbyNeon.enterLobby();
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            const lobbyNav = document.querySelector('.nav-item[data-target="lobby-view"]');
            if (lobbyNav) lobbyNav.classList.add('active');
        }
        
        // Handle leaving lobby logic (custom hook)
        if (app.state.currentView === 'lobby-view' && viewId !== 'lobby-view') {
            if (typeof LobbyNeon !== 'undefined') LobbyNeon.leaveLobby();
        }
    },

    saveTelegramSettings: async () => {
        const token = document.getElementById('setting-tg-token').value.trim();
        const chatId = document.getElementById('setting-tg-chatid').value.trim();
        app.state.settings.tgToken = token;
        app.state.settings.tgChatId = chatId;
        await DB.saveSettings(app.state.settings);
        Utils.showToast("Đã lưu cấu hình Telegram Bot thành công!", "success");
    },

    sendAdminBroadcast: async () => {
        const input = document.getElementById('admin-broadcast-text');
        if (!input) return;
        const text = input.value.trim();
        if (!text) {
            Utils.showToast("Vui lòng nhập nội dung!", "warning");
            return;
        }

        const btn = input.nextElementSibling;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang gửi...';
        btn.disabled = true;

        const msg = `📢 <b>THÔNG BÁO TỪ ADMIN</b>\n\n${text}`;
        await Utils.notifyTelegram(msg);

        Utils.showToast("Đã phát bài thành công!", "success");
        input.value = '';
        btn.innerHTML = originalText;
        btn.disabled = false;
    },

    renderDashboard: async (filteredTransactions) => {
        // Gather data from modules
        const financeData = FinanceModule.getSummary(filteredTransactions);
        const recentTxs = FinanceModule.getRecentTransactions(5, filteredTransactions);
        const todaysTasks = WorkModule.getTodaysTasks();

        // Admin Broadcast section toggle
        const broadcastSection = document.getElementById('admin-broadcast-section');
        const adminTaskOverview = document.getElementById('admin-task-overview-section');
        if (Auth.currentUser) {
            const isAdmin = Auth.currentUser.role === 'admin';
            if (broadcastSection) broadcastSection.style.display = isAdmin ? 'block' : 'none';
            if (adminTaskOverview) {
                adminTaskOverview.style.display = 'block';
                app.renderAdminTaskOverview();
            }
        }

        // Update top cards with animation
        Utils.animateValue(document.getElementById('dash-balance'), 0, financeData.balance, 1000, Utils.formatCurrency);
        Utils.animateValue(document.getElementById('dash-income'), 0, financeData.income, 1000, Utils.formatCurrency);
        Utils.animateValue(document.getElementById('dash-expense'), 0, financeData.expense, 1000, Utils.formatCurrency);

        if (Auth.currentUser && typeof PayrollModule !== 'undefined') {
            const currentSalary = await PayrollModule.calculateUserSalary(Auth.currentUser.username, new Date().toISOString().slice(0, 7));
            Utils.animateValue(document.getElementById('dash-salary'), 0, currentSalary, 1000, Utils.formatCurrency);
        }

        // Update Recent Transactions
        const txList = document.getElementById('dash-transaction-list');
        if (recentTxs.length === 0) {
            txList.innerHTML = '<div class="transaction-item"><p>Chưa có giao dịch nào.</p></div>';
        } else {
            txList.innerHTML = recentTxs.map(tx => `
                <div class="transaction-item">
                    <div class="tx-info">
                        <div class="tx-icon ${tx.type === 'income' ? 'bg-success' : 'bg-danger'}">
                            <i class="fa-solid ${tx.type === 'income' ? 'fa-arrow-down' : 'fa-arrow-up'}"></i>
                        </div>
                        <div class="tx-details">
                            <h4>${tx.category}</h4>
                            <p>${tx.note || (tx.type === 'income' ? 'Thu nhập' : 'Chi tiêu')} • ${Utils.formatDate(tx.date)}</p>
                        </div>
                    </div>
                    <div class="tx-amount ${tx.type === 'income' ? 'text-success' : 'text-danger'}">
                        ${tx.type === 'income' ? '+' : '-'}${Utils.formatCurrency(tx.amount)}
                    </div>
                </div>
            `).join('');
        }

        // Update Today's Tasks
        const taskList = document.getElementById('dash-task-list');
        if (todaysTasks.length === 0) {
            taskList.innerHTML = `
                <div class="neon-empty-state" style="display: flex; flex-direction: column; align-items: center; padding: 40px 0;">
                    <svg width="200" height="120" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 24px;">
                        <g stroke="rgba(255,255,255,0.3)" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round">
                            <!-- Bề mặt bàn -->
                            <polygon points="30,60 170,60 150,80 10,80" fill="rgba(255,255,255,0.03)"/>
                            <!-- Chân bàn trái -->
                            <path d="M 15,80 L 15,110 L 40,110 L 40,60" />
                            <path d="M 25,70 L 25,100 L 32,100 L 32,60" />
                            <line x1="15" y1="110" x2="25" y2="100" />
                            <line x1="40" y1="110" x2="32" y2="100" />
                            <!-- Chân bàn phải -->
                            <path d="M 145,80 L 145,110 L 170,110 L 170,60" />
                            <path d="M 155,70 L 155,100 L 162,100 L 162,60" />
                            <line x1="145" y1="110" x2="155" y2="100" />
                            <line x1="170" y1="110" x2="162" y2="100" />
                            <!-- Thanh ngang dưới mặt bàn -->
                            <line x1="40" y1="67" x2="170" y2="67" />
                            
                            <!-- Lịch để bàn -->
                            <path d="M 100,20 L 130,20 L 140,48 L 90,48 Z" fill="rgba(255,255,255,0.06)" />
                            <path d="M 100,20 L 90,48" /> 
                            <path d="M 130,20 L 140,48" />
                            
                            <!-- Gáy lịch kim loại -->
                            <line x1="105" y1="16" x2="105" y2="24" stroke="rgba(255,255,255,0.7)"/>
                            <line x1="115" y1="16" x2="115" y2="24" stroke="rgba(255,255,255,0.7)"/>
                            <line x1="125" y1="16" x2="125" y2="24" stroke="rgba(255,255,255,0.7)"/>
                            
                            <!-- Ô kẻ ngày trên lịch -->
                            <rect x="98" y="28" width="5" height="4" rx="1" fill="rgba(255,255,255,0.3)"/>
                            <rect x="106" y="28" width="5" height="4" rx="1" fill="rgba(255,255,255,0.3)"/>
                            <rect x="114" y="28" width="5" height="4" rx="1" fill="rgba(255,255,255,0.3)"/>
                            <rect x="122" y="28" width="5" height="4" rx="1" fill="rgba(255,255,255,0.3)"/>

                            <rect x="96" y="36" width="5" height="4" rx="1" fill="rgba(255,255,255,0.3)"/>
                            <rect x="104" y="36" width="5" height="4" rx="1" fill="rgba(255,255,255,0.3)"/>
                            <rect x="112" y="36" width="5" height="4" rx="1" fill="rgba(255,255,255,0.3)"/>
                            <rect x="120" y="36" width="5" height="4" rx="1" fill="rgba(255,255,255,0.3)"/>
                        </g>

                        <!-- Đốm sáng trên mặt bàn (Glow effect) -->
                        <ellipse cx="90" cy="55" rx="30" ry="10" fill="url(#tableGlow)" opacity="0.6"/>
                        <defs>
                            <radialGradient id="tableGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                                <stop offset="0%" stop-color="#ffffff" stop-opacity="0.3"/>
                                <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
                            </radialGradient>
                        </defs>

                        <!-- Box đếm số 0 nổi -->
                        <g transform="translate(133, 4)">
                            <rect width="22" height="22" rx="6" fill="#4B5563" />
                            <text x="11" y="15" fill="white" font-size="12" font-weight="bold" font-family="'Inter', sans-serif" text-anchor="middle" dominant-baseline="middle">0</text>
                        </g>
                    </svg>
                    <p style="color:var(--text-secondary); font-size: 14px;">Không có công việc nào cần hoàn thành hôm nay.</p>
                </div>
            `;
        } else {
            taskList.innerHTML = todaysTasks.map(task => {
                const isCompleted = task.trangThai && task.trangThai.toLowerCase().includes('done');
                return `
                <div class="task-item ${isCompleted ? 'completed' : ''}">
                    <div class="task-icon-wrapper">
                        <i class="fa-solid ${isCompleted ? 'fa-check' : 'fa-bullhorn'}"></i>
                    </div>
                    <div class="task-content" style="cursor: pointer;" onclick="WorkModule.goToProject(this.dataset.project)" data-project="${task.project}">
                        <h4>
                            ${task.mucTieu || task.tieuDe || 'Công việc không tên'}
                            <span class="badge badge-orange" style="font-size:10px; margin-left: 8px;"><i class="fa-solid fa-user"></i> ${task.owner ? Utils.getUserDisplayName(task.owner) : 'Admin'}</span>
                            ${isCompleted ? '<span style="color: var(--success); font-weight: 600; font-size: 11px; margin-left: 8px;"><i class="fa-solid fa-check-circle"></i> Đã hoàn thành</span>' : ''}
                        </h4>
                        <p><i class="fa-regular fa-folder"></i> ${task.project} &nbsp;&bull;&nbsp; <i class="fa-regular fa-clock"></i> ${task.deadline}</p>
                    </div>
                    <div class="task-checkbox" onclick="WorkModule.toggleTaskStatus('${task.id}')">
                        <i class="fa-solid fa-check"></i>
                    </div>
                </div>
            `}).join('');
        }

        // Render Charts
        app.renderCharts(filteredTransactions);
    },

    renderCharts: (filteredTransactions) => {
        // Task Pie Chart
        const ctxTask = document.getElementById('taskChart');
        if (ctxTask && typeof Chart !== 'undefined') {
            let allTasks = WorkModule.data.tasks || [];
            if (Auth.currentUser && Auth.currentUser.role !== 'admin') {
                allTasks = allTasks.filter(t => t.owner === Auth.currentUser.username);
            }

            let planned = 0, doing = 0, done = 0, expired = 0;
            let owners = {};
            allTasks.forEach(t => {
                const st = (t.trangThai || 'planned').toLowerCase();
                if (st.includes('done') || st.includes('hoàn thành')) done++;
                else if (st.includes('hết hạn')) expired++;
                else if (st.includes('doing')) doing++;
                else planned++; 
                
                let o = t.owner || 'admin';
                owners[o] = (owners[o] || 0) + 1;
            });

            if (app.taskChartInstance) {
                app.taskChartInstance.destroy();
            }

            app.taskChartInstance = new Chart(ctxTask, {
                type: 'doughnut',
                data: {
                    labels: ['Mới (Planned)', 'Đang làm (Doing)', 'Hoàn thành (Done)', 'Trễ hạn (Expired)'],
                    datasets: [{
                        data: [planned, doing, done, expired],
                        backgroundColor: [
                            '#3b82f6', // blue
                            '#f59e0b', // yellow
                            '#10b981', // green
                            '#ef4444'  // red
                        ],
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false } // Hide chart legend to save space
                    },
                    cutout: '70%'
                }
            });

            const statsContainer = document.getElementById('task-chart-stats');
            if (statsContainer) {
                const total = planned + doing + done + expired;
                const ownersHtml = Object.keys(owners).map(o => `<span class="badge ${o==='admin'?'badge-orange':'badge-blue'}" style="font-size: 11px; padding: 4px 8px;">${Utils.getUserDisplayName(o) || o}: ${owners[o]}</span>`).join('');
                
                statsContainer.innerHTML = `
                    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">
                        <span style="color: var(--text-secondary);">Tổng số kế hoạch:</span>
                        <strong style="font-size: 16px; color: #fff;">${total}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--text-secondary);"><i class="fa-solid fa-circle" style="color: #10b981; font-size: 10px; margin-right: 6px;"></i>Hoàn thành:</span>
                        <strong style="color: #10b981;">${done}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--text-secondary);"><i class="fa-solid fa-circle" style="color: #ef4444; font-size: 10px; margin-right: 6px;"></i>Trễ hạn:</span>
                        <strong style="color: #ef4444;">${expired}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--text-secondary);"><i class="fa-solid fa-circle" style="color: #f59e0b; font-size: 10px; margin-right: 6px;"></i>Đang làm:</span>
                        <strong style="color: #f59e0b;">${doing}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="color: var(--text-secondary);"><i class="fa-solid fa-circle" style="color: #3b82f6; font-size: 10px; margin-right: 6px;"></i>Mới:</span>
                        <strong style="color: #3b82f6;">${planned}</strong>
                    </div>
                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">Phân bổ nhân sự:</div>
                    <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                        ${ownersHtml || '<span style="color: var(--text-secondary); font-size: 11px;">Chống</span>'}
                    </div>
                `;
            }
        }

        // --- BỔ SUNG: TIẾN ĐỘ DỰ ÁN & BẢNG VÀNG TUYÊN DƯƠNG ---
        const allTasksForLeaderboard = WorkModule.data.tasks || [];
        app.renderProjectProgress(allTasksForLeaderboard);
        app.renderHallOfFame(allTasksForLeaderboard);
        app.renderHallOfShame();
    },

    renderProjectProgress: (tasks) => {
        const container = document.getElementById('dash-project-progress');
        if (!container) return;

        // Nhóm task theo project
        const projects = {};
        tasks.forEach(t => {
            const p = t.project || 'Khác';
            if (!projects[p]) projects[p] = { total: 0, done: 0 };
            projects[p].total++;
            const st = (t.trangThai || '').toLowerCase();
            if (st.includes('done') || st.includes('hoàn thành')) {
                projects[p].done++;
            }
        });

        const sortedProjects = Object.keys(projects).map(p => {
            return {
                name: p,
                total: projects[p].total,
                done: projects[p].done,
                percent: Math.round((projects[p].done / projects[p].total) * 100)
            }
        }).sort((a, b) => b.total - a.total); // Sort theo project nhiều task nhất

        if (sortedProjects.length === 0) {
            container.innerHTML = '<div style="color: var(--text-secondary); font-size: 13px; text-align: center; padding: 20px 0;">Chưa có dự án nào đang chạy.</div>';
            return;
        }

        container.innerHTML = sortedProjects.map(p => {
            let color = '#3b82f6'; // default blue
            if (p.percent === 100) color = '#10b981'; // green
            else if (p.percent < 30) color = '#ef4444'; // red

            return `
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <div style="display: flex; justify-content: space-between; font-size: 13px;">
                        <strong style="color: #e2e8f0;"><i class="fa-regular fa-folder" style="color: var(--primary); margin-right: 6px;"></i>${p.name}</strong>
                        <span style="color: ${color}; font-weight: 600;">${p.done}/${p.total} (${p.percent}%)</span>
                    </div>
                    <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden;">
                        <div style="height: 100%; width: ${p.percent}%; background: ${color}; border-radius: 4px; transition: width 1s ease;"></div>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderHallOfFame: async (tasks) => {
        const container = document.getElementById('dash-hall-of-fame');
        if (!container) return;

        // Apply no-max-height style override to allow podium to breathe
        container.style.maxHeight = 'none';

        // Lấy danh sách account trước để khởi tạo users
        const accounts = await Auth.getAccounts();
        const users = {};
        accounts.forEach(acc => {
            users[acc.username] = { total: 0, done: 0, expired: 0, displayName: Utils.getUserDisplayName(acc.username) || acc.username, profile: acc.profile };
        });

        // Bảng vàng chỉ nên hiện các task đã hoàn thành TRONG THÁNG NÀY
        const allSystemTasks = WorkModule.data.tasks || [];
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        allSystemTasks.forEach(t => {
            const dateStr = t.ngayDang || t.deadline;
            if (!dateStr) return;
            let d;
            if (dateStr.includes('-')) d = new Date(dateStr);
            else if (dateStr.includes('/')) {
                const p = dateStr.split('/');
                if (p.length === 3) d = new Date(`${p[2]}-${p[1]}-${p[0]}T00:00:00`);
            }
            
            if (d && d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                const owner = t.owner || 'admin';
                if (!users[owner]) return;
                
                users[owner].total++;
                const st = (t.trangThai || '').toLowerCase();
                if (st.includes('done') || st.includes('hoàn thành')) users[owner].done++;
                else if (st.includes('hết hạn') || st.includes('quá hạn')) users[owner].expired++;
            }
        });

        const rankedUsers = Object.keys(users).map(u => {
            const userColor = Utils.getUserAvatarColor(u);
            const userData = users[u];
            
            let avatarHtml = `<span style="display:flex; align-items:center; justify-content:center; width:36px; height:36px; background:${userColor}; border-radius:50%; color:#fff; font-weight:bold; font-size:14px; border: 2px solid ${userColor}; box-shadow:0 0 8px ${userColor}88;">${u[0].toUpperCase()}</span>`;
            if (userData.profile && userData.profile.avatar) {
                avatarHtml = `<img src="${userData.profile.avatar}" style="width:36px; height:36px; border-radius:50%; object-fit:cover; border: 2px solid rgba(255,255,255,0.1);">`;
            }

            return {
                username: u,
                displayName: userData.displayName,
                done: userData.done,
                total: userData.total,
                expired: userData.expired,
                avatarHtml: avatarHtml,
                profile: userData.profile,
                rate: userData.total > 0 ? (userData.done / userData.total * 100) : 0
            }
        })
        .filter(u => u.done > 0)
        .sort((a, b) => b.done - a.done);

        const placeholderChibi = {
            gender: 'nam',
            skinColor: '#cbd5e1',
            hairStyle: 0,
            hairColor: '#475569',
            eyeStyle: 1,
            mouthStyle: 1,
            topStyle: 0,
            topColor: '#64748b',
            bottomStyle: 0,
            bottomColor: '#475569',
            shoeStyle: 0,
            shoeColor: '#334155',
            accessory: 0
        };

        const defaultChibi = {
            gender: 'nam',
            skinColor: '#ffcd94',
            hairStyle: 1,
            hairColor: '#111827',
            eyeStyle: 0,
            mouthStyle: 0,
            topStyle: 1,
            topColor: '#3b82f6',
            bottomStyle: 1,
            bottomColor: '#1f2937',
            shoeStyle: 1,
            shoeColor: '#1f2937',
            accessory: 0
        };

        const makePlaceholder = (rankVal) => {
            return {
                username: '',
                displayName: 'Chờ cống hiến...',
                done: 0,
                total: 0,
                expired: 0,
                rate: 0,
                profile: { chibiConfig: placeholderChibi },
                avatarHtml: `<span style="font-size: 24px; color: #475569;">?</span>`,
                placeholder: true
            };
        };

        const u1 = rankedUsers[0] || makePlaceholder(1);
        const u2 = rankedUsers[1] || makePlaceholder(2);
        const u3 = rankedUsers[2] || makePlaceholder(3);

        const getChibiSvg = (u) => {
            const config = (u.profile && u.profile.chibiConfig) ? u.profile.chibiConfig : (u.placeholder ? placeholderChibi : defaultChibi);
            const isDancing = !u.placeholder;
            return ChibiModule.renderChibiSVG(config, isDancing, 50);
        };

        let styleBlock = document.getElementById('podium-stage-styles');
        if (!styleBlock) {
            styleBlock = document.createElement('style');
            styleBlock.id = 'podium-stage-styles';
            styleBlock.textContent = `
                #dash-hall-of-fame {
                    max-height: none !important;
                }
                .podium-stage {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 100%;
                    background: linear-gradient(180deg, rgba(20,20,35,0.7) 0%, rgba(10,10,15,0.9) 100%);
                    border-radius: 16px;
                    padding: 24px 16px;
                    border: 1px solid rgba(168, 85, 247, 0.15);
                    box-shadow: 0 0 25px rgba(168, 85, 247, 0.1), inset 0 0 20px rgba(0,0,0,0.5);
                    position: relative;
                    overflow: hidden;
                    margin-bottom: 20px;
                }
                .podium-stage::before {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 120px;
                    background: radial-gradient(ellipse at bottom, rgba(168, 85, 247, 0.2) 0%, transparent 70%);
                    pointer-events: none;
                    z-index: 1;
                }
                .podium-container {
                    display: flex;
                    justify-content: center;
                    align-items: flex-end;
                    width: 100%;
                    height: 310px;
                    position: relative;
                    z-index: 2;
                }
                .podium-col {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    position: relative;
                    transition: all 0.3s ease;
                }
                .podium-col.rank-1 { width: 36%; z-index: 5; }
                .podium-col.rank-2 { width: 32%; z-index: 4; }
                .podium-col.rank-3 { width: 32%; z-index: 3; }

                .podium-spotlight {
                    position: absolute;
                    bottom: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 140px;
                    height: 280px;
                    clip-path: polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%);
                    pointer-events: none;
                    opacity: 0.7;
                    z-index: 1;
                    transform-origin: bottom center;
                }
                .rank-1 .podium-spotlight {
                    background: linear-gradient(to top, rgba(234, 179, 8, 0.5) 0%, rgba(234, 179, 8, 0.1) 60%, transparent 100%);
                    animation: spotlight-pulse-gold 3s infinite ease-in-out;
                }
                .rank-2 .podium-spotlight {
                    background: linear-gradient(to top, rgba(148, 163, 184, 0.4) 0%, rgba(148, 163, 184, 0.08) 65%, transparent 100%);
                    animation: spotlight-pulse-silver 3.5s infinite ease-in-out;
                }
                .rank-3 .podium-spotlight {
                    background: linear-gradient(to top, rgba(205, 127, 50, 0.4) 0%, rgba(205, 127, 50, 0.08) 65%, transparent 100%);
                    animation: spotlight-pulse-bronze 4s infinite ease-in-out;
                }

                @keyframes spotlight-pulse-gold {
                    0%, 100% { opacity: 0.5; transform: translateX(-50%) scaleX(0.9); }
                    50% { opacity: 0.9; transform: translateX(-50%) scaleX(1.2); filter: drop-shadow(0 0 20px rgba(234,179,8,0.5)); }
                }
                @keyframes spotlight-pulse-silver {
                    0%, 100% { opacity: 0.4; transform: translateX(-50%) scaleX(0.95); }
                    50% { opacity: 0.8; transform: translateX(-50%) scaleX(1.15); filter: drop-shadow(0 0 15px rgba(148,163,184,0.4)); }
                }
                @keyframes spotlight-pulse-bronze {
                    0%, 100% { opacity: 0.4; transform: translateX(-50%) scaleX(1.15); }
                    50% { opacity: 0.8; transform: translateX(-50%) scaleX(0.95); filter: drop-shadow(0 0 15px rgba(205,127,50,0.4)); }
                }

                .podium-character {
                    width: 90px;
                    height: 90px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    position: relative;
                    margin-bottom: 6px;
                    z-index: 3;
                }
                .rank-1 .podium-character {
                    width: 120px;
                    height: 120px;
                    margin-bottom: 10px;
                }
                .podium-character svg {
                    width: 100%;
                    height: 100%;
                }

                .podium-name {
                    font-size: 12px;
                    font-weight: 800;
                    color: #fff;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.9);
                    margin-bottom: 2px;
                    text-align: center;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 95%;
                    z-index: 3;
                }
                .rank-1 .podium-name {
                    font-size: 15px;
                    color: #ffd700;
                    font-weight: 900;
                }

                .podium-score {
                    font-size: 10px;
                    font-weight: bold;
                    color: #94a3b8;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.9);
                    margin-bottom: 8px;
                    z-index: 3;
                }
                .rank-1 .podium-score {
                    color: #f1f5f9;
                }

                .podium-badge {
                    position: absolute;
                    top: -12px;
                    z-index: 4;
                }
                .rank-1 .podium-badge {
                    top: -20px;
                    animation: crown-float 2s infinite ease-in-out;
                }
                @keyframes crown-float {
                    0%, 100% { transform: translateY(0) rotate(-6deg); }
                    50% { transform: translateY(-5px) rotate(6deg); }
                }

                .podium-block {
                    width: 90%;
                    border-radius: 8px 8px 4px 4px;
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.6);
                    z-index: 2;
                    border: 1px solid rgba(255,255,255,0.08);
                }
                .rank-1 .podium-block {
                    height: 110px;
                    background: linear-gradient(135deg, rgba(234, 179, 8, 0.3) 0%, rgba(234, 179, 8, 0.05) 100%);
                    border-color: rgba(234, 179, 8, 0.5);
                    box-shadow: 0 10px 30px rgba(234, 179, 8, 0.25), inset 0 0 20px rgba(234, 179, 8, 0.2);
                }
                .rank-2 .podium-block {
                    height: 80px;
                    background: linear-gradient(135deg, rgba(148, 163, 184, 0.25) 0%, rgba(148, 163, 184, 0.05) 100%);
                    border-color: rgba(148, 163, 184, 0.4);
                    box-shadow: 0 8px 22px rgba(148, 163, 184, 0.15), inset 0 0 15px rgba(148, 163, 184, 0.15);
                }
                .rank-3 .podium-block {
                    height: 60px;
                    background: linear-gradient(135deg, rgba(205, 127, 50, 0.25) 0%, rgba(205, 127, 50, 0.05) 100%);
                    border-color: rgba(205, 127, 50, 0.4);
                    box-shadow: 0 6px 18px rgba(205, 127, 50, 0.15), inset 0 0 12px rgba(205, 127, 50, 0.1);
                }

                .podium-number {
                    font-size: 26px;
                    font-weight: 900;
                    font-family: 'Outfit', sans-serif;
                    opacity: 0.9;
                }
                .rank-1 .podium-number { color: #ffd700; text-shadow: 0 0 12px rgba(234, 179, 8, 0.6); font-size: 34px; }
                .rank-2 .podium-number { color: #cbd5e1; text-shadow: 0 0 8px rgba(148, 163, 184, 0.4); }
                .rank-3 .podium-number { color: #cd7f32; text-shadow: 0 0 8px rgba(205, 127, 50, 0.4); }

                .podium-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    width: 100%;
                    margin-top: 16px;
                    padding-top: 16px;
                    border-top: 1px solid rgba(255,255,255,0.06);
                }
            `;
            document.head.appendChild(styleBlock);
        }

        // Render Podium columns in order: Rank 2 (Left), Rank 1 (Center), Rank 3 (Right)
        const renderColumn = (u, rank) => {
            const crownOrMedal = rank === 1 
                ? '<i class="fa-solid fa-crown" style="color: #ffd700; font-size: 24px;"></i>' 
                : (rank === 2 
                    ? '<i class="fa-solid fa-medal" style="color: #cbd5e1; font-size: 18px;"></i>' 
                    : '<i class="fa-solid fa-medal" style="color: #cd7f32; font-size: 18px;"></i>');

            const scoreText = u.placeholder ? 'Chưa hoạt động' : `${u.done} nhiệm vụ`;

            return `
                <div class="podium-col rank-${rank}">
                    <div class="podium-spotlight"></div>
                    <div class="podium-badge">${crownOrMedal}</div>
                    <div class="podium-character">
                        ${getChibiSvg(u)}
                    </div>
                    <div class="podium-name">${u.displayName}</div>
                    <div class="podium-score">${scoreText}</div>
                    <div class="podium-block">
                        <div class="podium-number">${rank}</div>
                    </div>
                </div>
            `;
        };

        const podiumStageHtml = `
            <div class="podium-stage">
                <div class="podium-container">
                    ${renderColumn(u2, 2)}
                    ${renderColumn(u1, 1)}
                    ${renderColumn(u3, 3)}
                </div>
            </div>
        `;

        // Render the remaining users (Rank 4 and below) in the standard list format below
        const restUsersHtml = rankedUsers.slice(3).map((u, idx) => {
            const actualRank = idx + 4;
            return `
                <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.02); padding: 8px 12px; border-radius: 8px; position: relative; border: 1px solid rgba(255,255,255,0.03);">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="font-size: 13px; font-weight: bold; color: var(--text-secondary); width: 15px; text-align: center;">${actualRank}</span>
                        <div style="position: relative;">
                            ${u.avatarHtml}
                        </div>
                        <div>
                            <div style="font-weight: 600; font-size: 13px; color: #fff;">${u.displayName}</div>
                            <div style="font-size: 11px; color: var(--text-secondary);">${u.done} nhiệm vụ hoàn thành</div>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 14px; font-weight: 900; color: var(--primary);">${Math.round(u.rate)}%</div>
                        <div style="font-size: 8px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-secondary);">Hiệu suất</div>
                    </div>
                </div>
            `;
        }).join('');

        const restContainerHtml = restUsersHtml.length > 0 
            ? `<div class="podium-list">${restUsersHtml}</div>` 
            : '';

        container.innerHTML = podiumStageHtml + restContainerHtml;
    },

    renderHallOfShame: async () => {
        const container = document.getElementById('dash-hall-of-shame');
        if (!container) return;

        // Apply style override
        container.style.maxHeight = 'none';

        // Tải dữ liệu chấm công từ AttendanceModule
        if (typeof Attendance === 'undefined' || !Attendance.loadData) return;
        
        const logs = await Attendance.loadData();
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Lọc dữ liệu đi muộn trong tháng này
        const lateStats = {};
        logs.forEach(log => {
            if (log.status === 'late') {
                const logDate = new Date(log.timestamp);
                if (logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear) {
                    const u = log.username;
                    if (!lateStats[u]) lateStats[u] = { count: 0, totalMinutes: 0 };
                    lateStats[u].count++;
                    lateStats[u].totalMinutes += (log.lateMinutes || 0);
                }
            }
        });

        const rankedShame = Object.keys(lateStats).map(u => {
            return {
                username: u,
                displayName: Utils.getUserDisplayName(u) || u,
                count: lateStats[u].count,
                totalMinutes: lateStats[u].totalMinutes,
                avatarHtml: ""
            };
        }).sort((a, b) => b.count - a.count || b.totalMinutes - a.totalMinutes);

        if (rankedShame.length === 0) {
            container.innerHTML = '<div style="color: var(--text-secondary); font-size: 13px; text-align: center; padding: 20px 0;">Tháng này thật tuyệt vời, không ai đi muộn! 🌟</div>';
            return;
        }

        const accounts = await Auth.getAccounts();

        const placeholderChibi = {
            gender: 'nam',
            skinColor: '#cbd5e1',
            hairStyle: 0,
            hairColor: '#475569',
            eyeStyle: 3,
            mouthStyle: 5,
            topStyle: 0,
            topColor: '#64748b',
            bottomStyle: 0,
            bottomColor: '#475569',
            shoeStyle: 0,
            shoeColor: '#334155',
            accessory: 0
        };

        const defaultChibi = {
            gender: 'nam',
            skinColor: '#ffcd94',
            hairStyle: 1,
            hairColor: '#111827',
            eyeStyle: 3,
            mouthStyle: 5,
            topStyle: 1,
            topColor: '#3b82f6',
            bottomStyle: 1,
            bottomColor: '#1f2937',
            shoeStyle: 1,
            shoeColor: '#1f2937',
            accessory: 0
        };

        const makePlaceholder = (rankVal) => {
            return {
                username: '',
                displayName: 'Bình yên...',
                count: 0,
                totalMinutes: 0,
                profile: { chibiConfig: placeholderChibi },
                placeholder: true
            };
        };

        const u1 = rankedShame[0] || makePlaceholder(1);
        const u2 = rankedShame[1] || makePlaceholder(2);
        const u3 = rankedShame[2] || makePlaceholder(3);

        const getShameChibiSvg = (u) => {
            const acc = accounts.find(a => a.username === u.username);
            let config = (acc && acc.profile && acc.profile.chibiConfig) ? acc.profile.chibiConfig : (u.placeholder ? placeholderChibi : defaultChibi);
            
            // Force sad/regretful expressions on Shame Podium: sleepy eyes (3) + flat straight mouth (5)
            const sadConfig = {
                ...config,
                eyeStyle: 3,
                mouthStyle: 5
            };
            return ChibiModule.renderChibiSVG(sadConfig, false, 0); // No dancing, no merits
        };

        // Inject Shame Podium Styles dynamically if not already added
        if (!document.getElementById('podium-shame-stage-styles')) {
            const style = document.createElement('style');
            style.id = 'podium-shame-stage-styles';
            style.textContent = `
                .shame-stage {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 100%;
                    background: linear-gradient(180deg, rgba(30,10,10,0.65) 0%, rgba(15,5,5,0.9) 100%);
                    border-radius: 16px;
                    padding: 24px 16px;
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    box-shadow: 0 0 25px rgba(239, 68, 68, 0.1), inset 0 0 20px rgba(0,0,0,0.6);
                    position: relative;
                    overflow: hidden;
                    margin-bottom: 20px;
                }
                .shame-stage::before {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 120px;
                    background: radial-gradient(ellipse at bottom, rgba(239, 68, 68, 0.22) 0%, transparent 70%);
                    pointer-events: none;
                    z-index: 1;
                }
                .shame-podium-container {
                    display: flex;
                    justify-content: center;
                    align-items: flex-end;
                    width: 100%;
                    height: 310px;
                    position: relative;
                    z-index: 2;
                }
                .shame-podium-col {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    position: relative;
                    transition: all 0.3s ease;
                }
                .shame-podium-col.rank-1 { width: 36%; z-index: 5; }
                .shame-podium-col.rank-2 { width: 32%; z-index: 4; }
                .shame-podium-col.rank-3 { width: 32%; z-index: 3; }

                .shame-podium-spotlight {
                    position: absolute;
                    bottom: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 140px;
                    height: 280px;
                    clip-path: polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%);
                    pointer-events: none;
                    opacity: 0.65;
                    z-index: 1;
                    transform-origin: bottom center;
                }
                .shame-podium-col.rank-1 .shame-podium-spotlight {
                    background: linear-gradient(to top, rgba(239, 68, 68, 0.5) 0%, rgba(239, 68, 68, 0.1) 60%, transparent 100%);
                    animation: shame-spotlight-pulse-red-1 3s infinite ease-in-out;
                }
                .shame-podium-col.rank-2 .shame-podium-spotlight {
                    background: linear-gradient(to top, rgba(249, 115, 22, 0.4) 0%, rgba(249, 115, 22, 0.08) 65%, transparent 100%);
                    animation: shame-spotlight-pulse-red-2 3.5s infinite ease-in-out;
                }
                .shame-podium-col.rank-3 .shame-podium-spotlight {
                    background: linear-gradient(to top, rgba(249, 115, 22, 0.35) 0%, rgba(249, 115, 22, 0.08) 65%, transparent 100%);
                    animation: shame-spotlight-pulse-red-3 4s infinite ease-in-out;
                }

                @keyframes shame-spotlight-pulse-red-1 {
                    0%, 100% { opacity: 0.45; transform: translateX(-50%) scaleX(0.9); }
                    50% { opacity: 0.85; transform: translateX(-50%) scaleX(1.2); filter: drop-shadow(0 0 20px rgba(239,68,68,0.5)); }
                }
                @keyframes shame-spotlight-pulse-red-2 {
                    0%, 100% { opacity: 0.35; transform: translateX(-50%) scaleX(0.95); }
                    50% { opacity: 0.75; transform: translateX(-50%) scaleX(1.15); filter: drop-shadow(0 0 15px rgba(249,115,22,0.4)); }
                }
                @keyframes shame-spotlight-pulse-red-3 {
                    0%, 100% { opacity: 0.35; transform: translateX(-50%) scaleX(1.15); }
                    50% { opacity: 0.75; transform: translateX(-50%) scaleX(0.95); filter: drop-shadow(0 0 15px rgba(249,115,22,0.4)); }
                }

                .shame-podium-character {
                    width: 90px;
                    height: 90px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    position: relative;
                    margin-bottom: 6px;
                    z-index: 3;
                }
                .shame-podium-col.rank-1 .shame-podium-character {
                    width: 120px;
                    height: 120px;
                    margin-bottom: 10px;
                }
                .shame-podium-character svg {
                    width: 100%;
                    height: 100%;
                }

                .shame-podium-name {
                    font-size: 12px;
                    font-weight: 800;
                    color: #ff9999;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.9);
                    margin-bottom: 2px;
                    text-align: center;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 95%;
                    z-index: 3;
                }
                .shame-podium-col.rank-1 .shame-podium-name {
                    font-size: 15px;
                    color: #ff4d4d;
                    font-weight: 900;
                }

                .shame-podium-score {
                    font-size: 10px;
                    font-weight: bold;
                    color: #a8a29e;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.9);
                    margin-bottom: 8px;
                    z-index: 3;
                }
                .shame-podium-col.rank-1 .shame-podium-score {
                    color: #ffb3b3;
                }

                .shame-podium-badge {
                    position: absolute;
                    top: -12px;
                    z-index: 4;
                }
                .shame-podium-col.rank-1 .shame-podium-badge {
                    top: -20px;
                }

                .shame-podium-block {
                    width: 90%;
                    border-radius: 8px 8px 4px 4px;
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.6);
                    z-index: 2;
                    border: 1px solid rgba(255,255,255,0.08);
                }
                .shame-podium-col.rank-1 .shame-podium-block {
                    height: 110px;
                    background: linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(239, 68, 68, 0.05) 100%);
                    border-color: rgba(239, 68, 68, 0.5);
                    box-shadow: 0 10px 30px rgba(239, 68, 68, 0.25), inset 0 0 20px rgba(239, 68, 68, 0.2);
                }
                .shame-podium-col.rank-2 .shame-podium-block {
                    height: 80px;
                    background: linear-gradient(135deg, rgba(249, 115, 22, 0.25) 0%, rgba(249, 115, 22, 0.05) 100%);
                    border-color: rgba(249, 115, 22, 0.4);
                    box-shadow: 0 8px 22px rgba(249, 115, 22, 0.15), inset 0 0 15px rgba(249, 115, 22, 0.15);
                }
                .shame-podium-col.rank-3 .shame-podium-block {
                    height: 60px;
                    background: linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(249, 115, 22, 0.05) 100%);
                    border-color: rgba(249, 115, 22, 0.35);
                    box-shadow: 0 6px 18px rgba(249, 115, 22, 0.15), inset 0 0 12px rgba(249, 115, 22, 0.1);
                }

                .shame-podium-number {
                    font-size: 26px;
                    font-weight: 900;
                    font-family: 'Outfit', sans-serif;
                    opacity: 0.9;
                }
                .shame-podium-col.rank-1 .shame-podium-number { color: #ff4d4d; text-shadow: 0 0 12px rgba(239, 68, 68, 0.6); font-size: 34px; }
                .shame-podium-col.rank-2 .shame-podium-number { color: #f97316; text-shadow: 0 0 8px rgba(249, 115, 22, 0.4); }
                .shame-podium-col.rank-3 .shame-podium-number { color: #f97316; text-shadow: 0 0 8px rgba(249, 115, 22, 0.3); }

                .shame-podium-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    width: 100%;
                    margin-top: 16px;
                    padding-top: 16px;
                    border-top: 1px solid rgba(255,255,255,0.06);
                }

                @keyframes zzz-bounce {
                    0% { transform: translate(0, 0) scale(0.6); opacity: 0; }
                    50% { opacity: 0.8; }
                    100% { transform: translate(12px, -20px) scale(1.1); opacity: 0; }
                }
                .zzz {
                    position: absolute;
                    color: #ff5555;
                    font-weight: bold;
                    font-family: monospace;
                    animation: zzz-bounce 2s infinite linear;
                    opacity: 0;
                }
                .zzz-1 { font-size: 10px; left: 16px; top: -10px; animation-delay: 0s; }
                .zzz-2 { font-size: 14px; left: 24px; top: -18px; animation-delay: 0.6s; }
                .zzz-3 { font-size: 18px; left: 32px; top: -26px; animation-delay: 1.2s; }
            `;
            document.head.appendChild(style);
        }

        // Render Podium columns: Rank 2 (Left), Rank 1 (Center), Rank 3 (Right)
        const renderColumn = (u, rank) => {
            const shameBadge = rank === 1 
                ? `<div style="position: relative; width: 40px; height: 30px;"><i class="fa-solid fa-moon" style="color: #ff4d4d; font-size: 24px; filter: drop-shadow(0 0 6px #ff4d4d);"></i><span class="zzz zzz-1">z</span><span class="zzz zzz-2">Z</span><span class="zzz zzz-3">z</span></div>` 
                : (rank === 2 
                    ? '<i class="fa-solid fa-clock" style="color: #f97316; font-size: 18px;"></i>' 
                    : '<i class="fa-solid fa-hourglass-half" style="color: #f97316; font-size: 18px;"></i>');

            const scoreText = u.placeholder ? 'Trong sạch' : `${u.count} lần muộn (${u.totalMinutes}p)`;

            return `
                <div class="shame-podium-col rank-${rank}">
                    <div class="shame-podium-spotlight"></div>
                    <div class="shame-podium-badge">${shameBadge}</div>
                    <div class="shame-podium-character">
                        ${getShameChibiSvg(u)}
                    </div>
                    <div class="shame-podium-name">${u.displayName}</div>
                    <div class="shame-podium-score">${scoreText}</div>
                    <div class="shame-podium-block">
                        <div class="shame-podium-number">${rank}</div>
                    </div>
                </div>
            `;
        };

        const shamePodiumStageHtml = `
            <div class="shame-stage">
                <div class="shame-podium-container">
                    ${renderColumn(u2, 2)}
                    ${renderColumn(u1, 1)}
                    ${renderColumn(u3, 3)}
                </div>
            </div>
        `;

        // Render the remaining late comers (Rank 4 and below) in the standard list format below
        const restUsersHtml = rankedShame.slice(3).map((u, idx) => {
            const actualRank = idx + 4;
            const acc = accounts.find(a => a.username === u.username);
            const userColor = Utils.getUserAvatarColor(u.username);
            
            let listAvatarHtml = `<span style="display:flex; align-items:center; justify-content:center; width:36px; height:36px; background:${userColor}; border-radius:50%; color:#fff; font-weight:bold; font-size:14px; border: 2px solid ${userColor}; box-shadow:0 0 8px ${userColor}88;">${u.username[0].toUpperCase()}</span>`;
            if (acc && acc.profile && acc.profile.avatar) {
                listAvatarHtml = `<img src="${acc.profile.avatar}" style="width:36px; height:36px; border-radius:50%; object-fit:cover; border: 2px solid rgba(255,255,255,0.1);">`;
            }

            return `
                <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(231,76,60,0.05); padding: 8px 12px; border-radius: 8px; position: relative; border-left: 3px solid #ef4444;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="font-size: 13px; font-weight: bold; color: #ff6b6b; width: 15px; text-align: center;">${actualRank}</span>
                        ${listAvatarHtml}
                        <div>
                            <div style="font-weight: 600; font-size: 13px; color: #ff6b6b;">${u.displayName}</div>
                            <div style="font-size: 11px; color: var(--text-secondary);">Vi phạm: <b>${u.count} lần</b> (${u.totalMinutes}p)</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        const restContainerHtml = restUsersHtml.length > 0 
            ? `<div class="shame-podium-list">${restUsersHtml}</div>` 
            : '';

        container.innerHTML = shamePodiumStageHtml + restContainerHtml;
    },

    viewUserTasks: (username) => {
        const userFilterEl = document.getElementById('work-user-filter');
        if (userFilterEl) {
            userFilterEl.value = username;
            WorkModule.filterByRole();
        }
        app.navigateTo('work-view');
    },

    renderAdminTaskOverview: async () => {
        const grid = document.getElementById('admin-task-overview-grid');
        if (!grid) return;
        grid.innerHTML = '<div style="color:var(--text-secondary); text-align:center; width:100%;">Đang tính toán hiệu suất...</div>';

        const accounts = await Auth.getAccounts();
        const allSystemTasks = WorkModule.data.tasks || [];
        
        // Filter for this month
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const userStats = {};
        accounts.forEach(acc => {
            userStats[acc.username] = { total: 0, done: 0, doing: 0, new: 0, expired: 0, profile: acc.profile, role: acc.role };
        });

        allSystemTasks.forEach(t => {
            let dStr = t.deadline || t.ngayDang;
            let d;
            if (dStr) {
                if (dStr.includes('-')) d = new Date(dStr);
                else if (dStr.includes('/')) {
                    const p = dStr.split('/');
                    if (p.length === 3) d = new Date(`${p[2]}-${p[1]}-${p[0]}T00:00:00`);
                }
            }
            if (d && d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                const owner = t.owner || 'admin';
                if (!userStats[owner]) return; // if user deleted

                userStats[owner].total++;
                const st = (t.trangThai || '').toLowerCase();
                if (st.includes('done') || st.includes('hoàn thành')) {
                    userStats[owner].done++;
                } else if (st.includes('doing') || st.includes('đang làm')) {
                    userStats[owner].doing++;
                } else if (st.includes('hết hạn') || st.includes('quá hạn')) {
                    userStats[owner].expired++;
                } else {
                    userStats[owner].new++;
                }
            }
        });

        grid.innerHTML = accounts.map(acc => {
            const u = acc.username;
            const stats = userStats[u];
            if (u === 'admin' && stats.total === 0) return ''; // hide admin if no tasks

            const userColor = Utils.getUserAvatarColor(u);
            const initial = u[0].toUpperCase();
            const avatarHtml = acc.profile && acc.profile.avatar 
                ? `<img src="${acc.profile.avatar}" style="width:40px; height:40px; border-radius:50%; object-fit:cover; border: 2px solid ${userColor}; box-shadow: 0 0 10px ${userColor}88;">`
                : `<div style="width:40px; height:40px; border-radius:50%; background:${userColor}; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:16px; box-shadow: 0 0 10px ${userColor}88;">${initial}</div>`;
            const dName = Utils.getUserDisplayName(u) || u;

            let chibiPetHtml = '';
            if (acc.profile && acc.profile.chibiConfig) {
                chibiPetHtml = `
                    <div class="chibi-pet-standing-card" style="width: 110px; height: 150px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; position: relative; margin-bottom: 8px; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.5)); transform-origin: bottom center; transition: all 0.3s;" onmouseover="this.style.transform='scale(1.08)';" onmouseout="this.style.transform='scale(1)';">
                        ${ChibiModule.renderChibiSVG(acc.profile.chibiConfig, true, 45)}
                    </div>
                `;
            } else {
                chibiPetHtml = `
                    <div onclick="ChibiModule.openBuilder()" class="chibi-pet-standing-card placeholder-dashed" style="width: 110px; height: 150px; flex-shrink: 0; border: 2px dashed rgba(168,85,247,0.3); border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; cursor: pointer; background: rgba(168,85,247,0.03); margin-bottom: 8px; box-sizing: border-box; transition: all 0.2s;" onmouseover="this.style.borderColor='#a855f7'; this.style.background='rgba(168,85,247,0.08)'; this.style.transform='scale(1.04)';" onmouseout="this.style.borderColor='rgba(168,85,247,0.3)'; this.style.background='rgba(168,85,247,0.03)'; this.style.transform='scale(1)';">
                        <i class="fa-solid fa-plus-circle" style="font-size: 24px; color: rgba(168,85,247,0.7);"></i>
                        <span style="font-size: 11px; font-weight: 800; color: rgba(168,85,247,0.8); text-align: center; text-transform: uppercase; letter-spacing: 0.5px;">+ Tạo Pet</span>
                    </div>
                `;
            }

            return `
                <div class="employee-performance-wrapper" style="display: flex; align-items: flex-end; gap: 16px; min-width: 390px; flex: 1 0 auto; position: relative;">
                    <div class="glass-card" style="flex: 1; min-width: 280px; background: linear-gradient(180deg, rgba(20,20,30,0.8) 0%, rgba(10,10,15,0.95) 100%); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 24px; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.3); transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 8px 25px ${userColor}33';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 20px rgba(0,0,0,0.3)';">
                        <!-- Badge role -->
                        <div style="position: absolute; top: 16px; right: 16px; background: rgba(255,255,255,0.1); padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: bold; text-transform: uppercase; color: var(--text-secondary); backdrop-filter: blur(4px);">
                            ${acc.role === 'admin' ? '<i class="fa-solid fa-crown" style="color: gold; margin-right: 4px;"></i>' : ''}${acc.role}
                        </div>

                        <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 24px;">
                            ${avatarHtml}
                            <div>
                                <h4 style="margin: 0; font-size: 16px; color: #fff; font-weight: 600;">${dName}</h4>
                                <p style="margin: 0; font-size: 12px; color: var(--text-secondary);">@${u}</p>
                            </div>
                        </div>

                        <div style="margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.08);">
                            <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;">Nhiệm vụ trong tháng</div>
                            <div style="font-size: 36px; font-weight: 800; color: #fff; line-height: 1;">${stats.total} <span style="font-size: 14px; font-weight: normal; color: var(--text-secondary);">/ tháng</span></div>
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 28px; font-size: 14px;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <i class="fa-solid fa-circle-check" style="color: #10b981; width: 16px; font-size: 16px;"></i>
                                <span style="color: var(--text-secondary);">Đã hoàn thành</span>
                                <strong style="margin-left: auto; color: #fff; font-size: 15px;">${stats.done}</strong>
                            </div>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <i class="fa-solid fa-clock" style="color: #f59e0b; width: 16px; font-size: 16px;"></i>
                                <span style="color: var(--text-secondary);">Đang xử lý</span>
                                <strong style="margin-left: auto; color: #fff; font-size: 15px;">${stats.doing}</strong>
                            </div>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <i class="fa-solid fa-circle-dot" style="color: #3b82f6; width: 16px; font-size: 16px;"></i>
                                <span style="color: var(--text-secondary);">Chưa làm / Mới</span>
                                <strong style="margin-left: auto; color: #fff; font-size: 15px;">${stats.new}</strong>
                            </div>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <i class="fa-solid fa-circle-exclamation" style="color: #ef4444; width: 16px; font-size: 16px;"></i>
                                <span style="color: var(--text-secondary);">Trễ hạn</span>
                                <strong style="margin-left: auto; color: ${stats.expired > 0 ? '#ef4444' : '#fff'}; font-size: 15px;">${stats.expired}</strong>
                            </div>
                        </div>

                        <button class="btn" style="width: 100%; background: #a855f7; color: #fff; border: none; font-weight: 600; font-size: 15px; border-radius: 8px; padding: 12px; transition: background 0.2s;" onmouseover="this.style.background='#9333ea'" onmouseout="this.style.background='#a855f7'" onclick="app.viewUserTasks('${u}')">
                            Xem chi tiết
                        </button>
                    </div>
                    ${chibiPetHtml}
                </div>
            `;
        }).join('');
    }
};

// Initialize App on DOM Load
