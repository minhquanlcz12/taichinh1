// js/app.js - Main Application Logic

const app = {
    state: {
        currentView: 'dashboard-view',
        theme: 'dark'
    },

    init: () => {
        // Load theme
        app.state.theme = Utils.storage.get('app_theme', 'dark');
        app.applyTheme();

        // Setup Event Listeners
        app.setupNavListeners();
        app.setupThemeToggle();

        // Init modules
        FinanceModule.init();
        WorkModule.init();

        // Initial dashboard render handled by module inits, 
        // as they use app.renderDashboard(filteredTx)
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

        // Update topbar title
        const titles = {
            'dashboard-view': { title: 'Tổng quan', sub: 'Cập nhật tình hình gia đình bạn' },
            'finance-view': { title: 'Quản lý Tài chính', sub: 'Theo dõi thu chi chi tiết' },
            'work-view': { title: 'Công việc & Lịch', sub: 'Sắp xếp thời gian hiệu quả' },
            'settings-view': { title: 'Cài đặt', sub: 'Tùy chỉnh hệ thống' }
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
        }
    },

    renderDashboard: (filteredTransactions) => {
        // Gather data from modules
        const financeData = FinanceModule.getSummary(filteredTransactions);
        const recentTxs = FinanceModule.getRecentTransactions(5, filteredTransactions);
        const todaysTasks = WorkModule.getTodaysTasks();

        // Update top cards with animation
        Utils.animateValue(document.getElementById('dash-balance'), 0, financeData.balance, 1000, Utils.formatCurrency);
        Utils.animateValue(document.getElementById('dash-income'), 0, financeData.income, 1000, Utils.formatCurrency);
        Utils.animateValue(document.getElementById('dash-expense'), 0, financeData.expense, 1000, Utils.formatCurrency);

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
                            <span class="badge badge-orange" style="font-size:10px; margin-left: 8px;"><i class="fa-solid fa-user"></i> ${task.owner || 'admin'}</span>
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
    }
};

// Initialize App on DOM Load
