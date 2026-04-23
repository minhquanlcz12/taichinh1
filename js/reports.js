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
        const container = document.getElementById('finance-view');
        if (!container) return;

        const currentUser = Auth.currentUser;
        const isAdmin = currentUser && currentUser.role === 'admin';
        
        // Get data from FinanceModule
        let transactions = FinanceModule.data.transactions || [];
        
        // Filter by Month
        transactions = transactions.filter(t => t.date.startsWith(ReportsModule.data.currentMonth));

        // Filter by Owner (Security/Admin)
        let selectedUser = 'all';
        if (isAdmin) {
            const reportUserFilter = document.getElementById('report-user-filter');
            if (reportUserFilter) {
                selectedUser = reportUserFilter.value;
            } else {
                // Fallback to main finance filter if it exists
                const mainFilter = document.getElementById('finance-user-filter');
                if (mainFilter) selectedUser = mainFilter.value;
            }
            
            if (selectedUser !== 'all') {
                transactions = transactions.filter(t => t.owner === selectedUser || (!t.owner && selectedUser === 'admin'));
            }
        } else {
            transactions = transactions.filter(t => t.owner === currentUser.username);
        }

        const summary = FinanceModule.getSummary(transactions);

        let userFilterHtml = '';
        if (isAdmin) {
            const accounts = await Auth.getAccounts();
            let opts = `<option value="all" ${selectedUser === 'all' ? 'selected' : ''}>Tất cả nhân viên</option>`;
            accounts.forEach(a => {
                opts += `<option value="${a.username}" ${selectedUser === a.username ? 'selected' : ''}>${a.username}</option>`;
            });
            userFilterHtml = `
                <select class="form-control" id="report-user-filter" style="width: auto; margin-right: 8px; height: 38px; background: rgba(255,255,255,0.05); color: #fff; border: 1px solid var(--border);" onchange="ReportsModule.render()">
                    ${opts}
                </select>
            `;
        }
        
        let html = `
            <div class="reports-container" style="animation: fadeIn 0.4s ease;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
                    <h3 style="margin: 0; font-size: 20px;"><i class="fa-solid fa-file-invoice-dollar" style="margin-right: 8px; color: var(--primary);"></i> Báo cáo Tài chính</h3>
                    <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                        ${userFilterHtml}
                        <input type="month" class="form-control" value="${ReportsModule.data.currentMonth}" onchange="ReportsModule.setMonth(this.value)" style="width: auto; height: 38px; background: rgba(255,255,255,0.05); color: #fff; border: 1px solid var(--border);">
                        <button class="btn btn-success" onclick="ReportsModule.exportToExcel()" style="height: 38px;">
                            <i class="fa-solid fa-file-excel"></i> Excel
                        </button>
                        <button class="btn btn-outline" style="border-color: #ef4444; color: #ef4444; height: 38px;" onclick="ReportsModule.exportToPDF()">
                            <i class="fa-solid fa-file-pdf"></i> PDF
                        </button>
                        <button class="btn btn-outline" onclick="FinanceModule.render()" style="height: 38px;">
                            <i class="fa-solid fa-arrow-left"></i> Thoát
                        </button>
                    </div>
                </div>

                <div class="dashboard-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); margin-bottom: 24px; gap: 16px;">
                    <div class="glass-card" style="border-left: 4px solid #10b981; padding: 20px; background: rgba(16, 185, 129, 0.05);">
                        <h2 class="text-success" style="font-size: 24px; margin: 0;">${Utils.formatCurrency(summary.income)}</h2>
                        <div class="text-secondary" style="font-size: 12px; text-transform: uppercase; margin-top: 4px;">Thu nhập</div>
                    </div>
                    <div class="glass-card" style="border-left: 4px solid #ef4444; padding: 20px; background: rgba(239, 68, 68, 0.05);">
                        <h2 class="text-danger" style="font-size: 24px; margin: 0;">${Utils.formatCurrency(summary.expense)}</h2>
                        <div class="text-secondary" style="font-size: 12px; text-transform: uppercase; margin-top: 4px;">Chi tiêu</div>
                    </div>
                    <div class="glass-card" style="border-left: 4px solid var(--primary); padding: 20px; background: rgba(0, 240, 255, 0.05);">
                        <h2 class="title-glow" style="font-size: 24px; margin: 0;">${Utils.formatCurrency(summary.income - summary.expense)}</h2>
                        <div class="text-secondary" style="font-size: 12px; text-transform: uppercase; margin-top: 4px;">Số dư (Tháng)</div>
                    </div>
                </div>

                <div class="glass-card" style="padding: 0; overflow: hidden; border: 1px solid var(--border);">
                    <div style="padding: 16px 20px; border-bottom: 1px solid var(--border); background: rgba(255,255,255,0.02); display: flex; justify-content: space-between; align-items: center;">
                        <h4 style="margin: 0; font-size: 16px;">Chi tiết Giao dịch Tháng ${ReportsModule.data.currentMonth}</h4>
                        <span style="font-size: 12px; color: var(--text-secondary);">${transactions.length} bản ghi</span>
                    </div>
                    <div style="max-height: 500px; overflow-y: auto;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 13.5px;">
                            <thead style="position: sticky; top: 0; background: #0a0f1a; z-index: 10;">
                                <tr style="border-bottom: 1px solid var(--border);">
                                    <th style="padding: 12px 20px; text-align: left; color: var(--text-secondary); font-weight: 500;">Ngày</th>
                                    <th style="padding: 12px 20px; text-align: left; color: var(--text-secondary); font-weight: 500;">Hạng mục</th>
                                    <th style="padding: 12px 20px; text-align: right; color: var(--text-secondary); font-weight: 500;">Số tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${transactions.sort((a,b) => new Date(b.date) - new Date(a.date)).map(t => `
                                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                                        <td style="padding: 14px 20px; color: var(--text-secondary);">${Utils.formatDate(t.date)}</td>
                                        <td style="padding: 14px 20px;">
                                            <div style="font-weight: 500;">${t.category}</div>
                                            <div style="color: var(--text-muted); font-size: 11px; margin-top: 2px;">${t.note || ''}</div>
                                        </td>
                                        <td style="padding: 14px 20px; text-align: right; font-family: monospace; font-size: 15px; font-weight: 600; color: ${t.type === 'income' ? '#10b981' : '#ef4444'};">
                                            ${t.type === 'income' ? '+' : '-'}${Utils.formatCurrency(t.amount)}
                                        </td>
                                    </tr>
                                `).join('')}
                                ${transactions.length === 0 ? '<tr><td colspan="3" style="padding: 60px; text-align: center; color: var(--text-secondary); font-style: italic;">Không có dữ liệu giao dịch.</td></tr>' : ''}
                            </tbody>
                        </table>
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
