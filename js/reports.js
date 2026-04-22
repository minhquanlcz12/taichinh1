// js/reports.js

const ReportsModule = {
    data: {
        currentMonth: new Date().toISOString().slice(0, 7), // YYYY-MM
    },

    init: async () => {
        // Automatically handled when view switches to 'reports-view'
    },

    setMonth: (month) => {
        ReportsModule.data.currentMonth = month;
        ReportsModule.render();
    },

    render: async () => {
        const container = document.getElementById('finance-view'); // We'll inject it here or in a dedicated view
        if (!container) return;

        const currentUser = Auth.currentUser;
        const isAdmin = currentUser && currentUser.role === 'admin';
        
        // Get data from FinanceModule
        let transactions = FinanceModule.data.transactions || [];
        
        // Filter by Month
        transactions = transactions.filter(t => t.date.startsWith(ReportsModule.data.currentMonth));

        // Filter by Owner (Security)
        if (!isAdmin) {
            transactions = transactions.filter(t => t.owner === currentUser.username);
        } else {
            const userFilter = document.getElementById('finance-user-filter');
            if (userFilter && userFilter.value !== 'all') {
                transactions = transactions.filter(t => t.owner === userFilter.value);
            }
        }

        const summary = FinanceModule.getSummary(transactions);
        
        let html = `
            <div class="reports-container" style="animation: fadeIn 0.5s ease;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h3 style="margin: 0;"><i class="fa-solid fa-chart-line" style="margin-right: 8px; color: var(--primary);"></i> Báo cáo Tài chính Tháng ${ReportsModule.data.currentMonth}</h3>
                    <div style="display: flex; gap: 12px;">
                        <input type="month" class="form-control" value="${ReportsModule.data.currentMonth}" onchange="ReportsModule.setMonth(this.value)" style="width: auto;">
                        <button class="btn btn-success" onclick="ReportsModule.exportToExcel()">
                            <i class="fa-solid fa-file-excel"></i> Excel
                        </button>
                        <button class="btn btn-outline" style="border-color: #ef4444; color: #ef4444;" onclick="ReportsModule.exportToPDF()">
                            <i class="fa-solid fa-file-pdf"></i> PDF
                        </button>
                        <button class="btn btn-outline" onclick="FinanceModule.render()">
                            <i class="fa-solid fa-arrow-left"></i> Thoát
                        </button>
                    </div>
                </div>

                <div class="dashboard-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 24px;">
                    <div class="glass-card stat-card" style="border-left: 4px solid #10b981;">
                        <p>Thu nhập</p>
                        <h2 class="text-success">${Utils.formatCurrency(summary.income)}đ</h2>
                    </div>
                    <div class="glass-card stat-card" style="border-left: 4px solid #ef4444;">
                        <p>Chi tiêu</p>
                        <h2 class="text-danger">${Utils.formatCurrency(summary.expense)}đ</h2>
                    </div>
                    <div class="glass-card stat-card" style="border-left: 4px solid var(--primary);">
                        <p>Số dư tháng</p>
                        <h2 class="title-glow">${Utils.formatCurrency(summary.income - summary.expense)}đ</h2>
                    </div>
                </div>

                <div class="dashboard-grid" style="grid-template-columns: 1.5fr 1fr; gap: 20px;">
                    <div class="glass-card" style="padding: 20px;">
                        <h4 style="margin-top: 0; margin-bottom: 20px;">Diễn biến Thu/Chi</h4>
                        <canvas id="balanceChart" height="250"></canvas>
                    </div>
                    <div class="glass-card" style="padding: 20px;">
                        <h4 style="margin-top: 0; margin-bottom: 20px;">Cơ cấu Chi tiêu</h4>
                        <canvas id="categoryChart" height="250"></canvas>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
    },

    exportToExcel: () => {
        const currentUser = Auth.currentUser;
        const isAdmin = currentUser && currentUser.role === 'admin';
        let transactions = FinanceModule.data.transactions.filter(t => t.date.startsWith(ReportsModule.data.currentMonth));
        
        if (isAdmin) {
            const reportUserFilter = document.getElementById('report-user-filter');
            const selectedUser = reportUserFilter ? reportUserFilter.value : 'all';
            if (selectedUser !== 'all') {
                transactions = transactions.filter(t => t.owner === selectedUser || (!t.owner && selectedUser === 'admin'));
            }
        } else {
            transactions = transactions.filter(t => t.owner === currentUser.username);
        }

        const data = transactions.map(t => ({
            'Ngày': Utils.formatDate(t.date),
            'Loại': t.type === 'income' ? 'Thu nhập' : 'Chi tiêu',
            'Danh mục': t.category,
            'Số tiền': t.amount,
            'Ghi chú': t.note || '',
            'Người thực hiện': t.owner || 'admin'
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "BaoCao_" + ReportsModule.data.currentMonth);
        XLSX.writeFile(wb, `baocao_taichinh_${ReportsModule.data.currentMonth}.xlsx`);
        Utils.showToast("Đã trích xuất file Excel!", "success");
    },

    exportToPDF: () => {
        const currentUser = Auth.currentUser;
        const isAdmin = currentUser && currentUser.role === 'admin';
        let transactions = FinanceModule.data.transactions.filter(t => t.date.startsWith(ReportsModule.data.currentMonth));
        
        let userTitle = 'Tất cả nhân viên';
        if (isAdmin) {
            const reportUserFilter = document.getElementById('report-user-filter');
            const selectedUser = reportUserFilter ? reportUserFilter.value : 'all';
            if (selectedUser !== 'all') {
                transactions = transactions.filter(t => t.owner === selectedUser || (!t.owner && selectedUser === 'admin'));
                userTitle = `Nhân viên: ${selectedUser}`;
            }
        } else {
            transactions = transactions.filter(t => t.owner === currentUser.username);
            userTitle = `Tài khoản: ${currentUser.username}`;
        }

        const title = `BÁO CÁO TÀI CHÍNH THÁNG ${ReportsModule.data.currentMonth}\n(${userTitle})`;
        FinanceModule.exportToPDF(transactions, title);
    }
};
