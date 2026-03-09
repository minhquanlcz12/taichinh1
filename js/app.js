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
            taskList.innerHTML = '<p style="color:var(--text-secondary); padding: 16px;">Không có công việc nào cần hoàn thành hôm nay.</p>';
        } else {
            taskList.innerHTML = todaysTasks.map(task => {
                const isCompleted = task.trangThai && task.trangThai.toLowerCase().includes('done');
                return `
                <div class="task-item ${isCompleted ? 'completed' : ''}">
                    <div class="task-checkbox" onclick="WorkModule.toggleTaskStatus('${task.id}')">
                        <i class="fa-solid fa-check"></i>
                    </div>
                    <div class="task-content">
                        <h4>${task.mucTieu || task.tieuDe || 'Công việc không tên'}</h4>
                        <p>${task.project} • ${task.deadline}</p>
                    </div>
                </div>
            `}).join('');
        }
    }
};

// Initialize App on DOM Load
