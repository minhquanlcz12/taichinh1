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
            'music-view': { title: '🎵 YouTube Music', sub: 'Nghe nhạc & xem MV ngay trong ứng dụng' }
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
        if (broadcastSection && Auth.currentUser) {
            broadcastSection.style.display = Auth.currentUser.role === 'admin' ? 'block' : 'none';
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
        // Finance Line Chart (Last 30 days)
        const ctxFinance = document.getElementById('financeChart');
        if (ctxFinance && typeof Chart !== 'undefined') {
            let txs = filteredTransactions || FinanceModule.data.transactions;
            const currentUser = Auth.currentUser;
            if (!filteredTransactions && currentUser) {
                txs = txs.filter(t => t.owner === currentUser.username || (!t.owner && currentUser.username === 'admin'));
            }
            
            // Group by day for last 30 days
            const last30Days = [...Array(30)].map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (29 - i));
                return d.toISOString().split('T')[0];
            });

            const incomeData = Array(30).fill(0);
            const expenseData = Array(30).fill(0);

            txs.forEach(tx => {
                const idx = last30Days.indexOf(tx.date);
                if (idx !== -1) {
                    if (tx.type === 'income') incomeData[idx] += tx.amount;
                    else expenseData[idx] += tx.amount;
                }
            });

            if (app.financeChartInstance) {
                app.financeChartInstance.destroy();
            }

            app.financeChartInstance = new Chart(ctxFinance, {
                type: 'line',
                data: {
                    labels: last30Days.map(d => d.substring(5).replace('-', '/')),
                    datasets: [
                        {
                            label: 'Thu nhập',
                            data: incomeData,
                            borderColor: '#4ade80',
                            backgroundColor: 'rgba(74, 222, 128, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: 'Chi tiêu',
                            data: expenseData,
                            borderColor: '#f87171',
                            backgroundColor: 'rgba(248, 113, 113, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { labels: { color: '#a0aec0' } },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.dataset.label + ': ' + Utils.formatCurrency(context.parsed.y);
                                }
                            }
                        }
                    },
                    scales: {
                        x: { ticks: { color: '#a0aec0' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                        y: { 
                            ticks: { 
                                color: '#a0aec0', 
                                callback: function(val) { return val >= 1000 ? (val/1000) + 'k' : val; } 
                            }, 
                            grid: { color: 'rgba(255,255,255,0.05)' } 
                        }
                    }
                }
            });
        }

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
        let allTasks = WorkModule.data.tasks || [];
        if (Auth.currentUser && Auth.currentUser.role !== 'admin') {
            allTasks = allTasks.filter(t => t.owner === Auth.currentUser.username);
        }
        app.renderProjectProgress(allTasks);
        app.renderHallOfFame(allTasks);
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

        // Bảng vàng chỉ nên hiện task done
        const allSystemTasks = WorkModule.data.tasks || [];
        
        const users = {};
        allSystemTasks.forEach(t => {
            const owner = t.owner || 'admin';
            if (!users[owner]) users[owner] = { total: 0, done: 0, expired: 0 };
            users[owner].total++;
            
            const st = (t.trangThai || '').toLowerCase();
            if (st.includes('done') || st.includes('hoàn thành')) users[owner].done++;
            else if (st.includes('hết hạn') || st.includes('quá hạn')) users[owner].expired++;
        });

        // Lấy thông tin account để hiển thị avatar
        const accounts = await Auth.getAccounts();

        const rankedUsers = Object.keys(users).map(u => {
            const account = accounts.find(a => a.username === u);
            let avatarHtml = `<span style="display:flex; align-items:center; justify-content:center; width:36px; height:36px; background:var(--gradient-primary); border-radius:50%; color:#fff; font-weight:bold; font-size:14px;">${u[0].toUpperCase()}</span>`;
            if (account && account.profile && account.profile.avatar) {
                avatarHtml = `<img src="${account.profile.avatar}" style="width:36px; height:36px; border-radius:50%; object-fit:cover; border: 2px solid rgba(255,255,255,0.1);">`;
            }

            return {
                name: Utils.getUserDisplayName(u) || u,
                done: users[u].done,
                total: users[u].total,
                expired: users[u].expired,
                avatarHtml: avatarHtml,
                rate: users[u].total > 0 ? (users[u].done / users[u].total * 100) : 0
            }
        })
        .filter(u => accounts.some(a => a.username === u.name))
        .filter(u => u.done > 0)
        .sort((a, b) => b.done - a.done);

        if (rankedUsers.length === 0) {
            container.innerHTML = '<div style="color: var(--text-secondary); font-size: 13px; text-align: center; padding: 20px 0;">Chưa có thành tích nào được ghi nhận...</div>';
            return;
        }

        container.innerHTML = rankedUsers.slice(0, 5).map((u, index) => {
            let rankIcon = `<span style="display:inline-block; width:20px; text-align:center; font-weight:bold; color:var(--text-secondary);">#${index + 1}</span>`;
            if (index === 0) rankIcon = `<i class="fa-solid fa-medal" style="color: #ffd700; font-size: 16px;"></i>`;
            else if (index === 1) rankIcon = `<i class="fa-solid fa-medal" style="color: #c0c0c0; font-size: 16px;"></i>`;
            else if (index === 2) rankIcon = `<i class="fa-solid fa-medal" style="color: #cd7f32; font-size: 16px;"></i>`;

            const isFlawless = (u.expired === 0 && u.done === u.total);

            return `
                <div style="display: flex; align-items: center; gap: 12px; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px; border-left: 3px solid ${index === 0 ? '#ffd700' : 'rgba(255,255,255,0.1)'};">
                    <div style="width: 24px; text-align: center;">${rankIcon}</div>
                    <div style="width: 36px; height: 36px; flex-shrink: 0;">${u.avatarHtml}</div>
                    <div style="flex: 1; display: flex; flex-direction: column;">
                        <strong style="color: #fff; font-size: 14px;">${u.name} ${isFlawless ? '<i class="fa-solid fa-fire" style="color: #ff4500; font-size: 12px;" title="Tỷ lệ hoàn thành 100%"></i>' : ''}</strong>
                        <span style="color: var(--text-secondary); font-size: 11px;">Hoàn thành: <span style="color: #10b981; font-weight:bold;">${u.done}</span> nhiệm vụ</span>
                    </div>
                </div>
            `;
        }).join('');
    }
};

// Initialize App on DOM Load
