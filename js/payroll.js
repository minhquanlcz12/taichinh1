// js/payroll.js

const PayrollModule = {
    currentMonth: new Date().toISOString().slice(0, 7), // YYYY-MM
    LATE_PENALTY: 20000,
    STANDARD_WORK_DAYS: 22,

    init: () => {
        // Nothing heavy on init, data is fetched on render
    },

    render: async () => {
        const container = document.getElementById('payroll-view');
        if (!container) return;

        const currentUser = Auth.currentUser;
        if (!currentUser) return;

        // Container structure
        container.innerHTML = `
            <div class="finance-header" style="display:flex; justify-content:space-between; margin-bottom: 24px; align-items:center; flex-wrap: wrap; gap: 12px;">
                <h3 style="font-size: 20px; color: var(--success);"><i class="fa-solid fa-money-check-dollar" style="margin-right: 8px;"></i>${currentUser.role === 'admin' ? 'Bảng Lương Tổng Hợp' : 'Bảng Lương Cá Nhân'}</h3>
                
                <div style="display: flex; gap: 12px; align-items: center;">
                    <label style="color: var(--text-secondary); font-size: 13px;">Chọn tháng:</label>
                    <input type="month" id="payroll-month" class="form-control" style="width: auto; display: inline-block; height: 38px;" value="${PayrollModule.currentMonth}" onchange="PayrollModule.changeMonth(this.value)">
                </div>
            </div>
            
            <div class="glass-card" style="overflow-x: auto;">
                <table class="data-table" style="width: 100%; min-width: 800px;">
                    <thead>
                        <tr>
                            <th>Nhân sự</th>
                            <th style="text-align: right;">Lương cứng</th>
                            <th style="text-align: center;">Chấm công</th>
                            <th style="text-align: center;">Hiệu suất (Task)</th>
                            <th style="text-align: right;">Thưởng/Phạt khác</th>
                            <th style="text-align: right;">Thực Lĩnh</th>
                        </tr>
                    </thead>
                    <tbody id="payroll-table-body">
                        <tr><td colspan="6" style="text-align: center; padding: 20px;"><i class="fa-solid fa-spinner fa-spin"></i> Đang tính toán...</td></tr>
                    </tbody>
                </table>
            </div>

            <div style="margin-top: 16px; font-size: 11px; color: var(--text-secondary); display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
                <span><i class="fa-solid fa-circle-info text-primary"></i> Lương ngày = Lương cứng / ${PayrollModule.STANDARD_WORK_DAYS} ngày</span>
                <span><i class="fa-solid fa-circle-info text-warning"></i> Phạt đi muộn = ${Utils.formatCurrency(PayrollModule.LATE_PENALTY)}đ / lần</span>
                <span><i class="fa-solid fa-circle-info text-success"></i> Thưởng/Phạt Tuỳ chỉnh: Do Admin tự đánh giá nhập tay dựa trên hiệu suất (Task Done)</span>
            </div>
        `;

        await PayrollModule.calculateAndRenderBody();
    },

    saveCustomBonus: async (username, amount) => {
        const val = parseFloat(amount) || 0;
        const monthStr = PayrollModule.currentMonth;
        const allCustomBonuses = await DB.getCustomBonuses();
        
        if (!allCustomBonuses[monthStr]) {
            allCustomBonuses[monthStr] = {};
        }
        allCustomBonuses[monthStr][username] = val;
        
        await DB.saveCustomBonuses(allCustomBonuses);
        Utils.showToast(`Đã lưu Thưởng/Phạt cho ${username}`, 'success');
        PayrollModule.calculateAndRenderBody();
    },

    changeMonth: (newMonth) => {
        PayrollModule.currentMonth = newMonth;
        PayrollModule.calculateAndRenderBody();
    },

    calculateAndRenderBody: async () => {
        const tbody = document.getElementById('payroll-table-body');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;"><i class="fa-solid fa-spinner fa-spin"></i> Đang tổng hợp dữ liệu...</td></tr>';

        try {
            const currentUser = Auth.currentUser;
            let accounts = await Auth.getAccounts();
            
            // If not admin, only calculate for self
            if (currentUser.role !== 'admin') {
                accounts = accounts.filter(a => a.username === currentUser.username);
            }

            // Load data
            const allAttendance = await Attendance.loadData();
            const allLeaves = await Attendance.loadLeaveData();
            
            // Load tasks ensuring we wait for them if not loaded
            if (WorkModule.data.tasks.length === 0 && document.getElementById('work-view')) {
                // Try to load tasks explicitly if empty
                await WorkModule.load();
            }
            const allTasks = WorkModule.data.tasks;
            const allCustomBonuses = await DB.getCustomBonuses();
            const monthlyBonuses = allCustomBonuses[PayrollModule.currentMonth] || {};

            const selectedDate = new Date(PayrollModule.currentMonth + '-01');
            const targetMonth = selectedDate.getMonth();
            const targetYear = selectedDate.getFullYear();

            const rowsHtml = accounts.map(acc => {
                const username = acc.username;
                const baseSalary = acc.baseSalary || 0;
                
                // 1. Attendance points
                let onTimeDays = 0;
                let lateDays = 0;
                let approvedLeaveDays = 0;

                // Scan attendance
                allAttendance.forEach(a => {
                    if (a.username === username) {
                        const d = new Date(a.dateStr);
                        if (d.getMonth() === targetMonth && d.getFullYear() === targetYear) {
                            if (a.status === 'on_time') onTimeDays++;
                            else if (a.status === 'late') lateDays++;
                        }
                    }
                });

                // Scan leaves
                allLeaves.forEach(l => {
                    if (l.username === username && l.status === 'approved') {
                        // Assuming l.date is YYYY-MM-DD
                        const d = new Date(l.date);
                        if (d.getMonth() === targetMonth && d.getFullYear() === targetYear) {
                            approvedLeaveDays += (parseInt(l.days) || 1);
                        }
                    }
                });

                // 2. Tasks
                let doneTasks = 0;
                let expiredTasks = 0;

                allTasks.forEach(t => {
                    if (t.owner === username || (!t.owner && username === 'admin')) {
                        // Check if task deadline or completion falls in this month
                        // Usually we check deadline
                        const dStr = t.deadline || t.ngayDang;
                        if (dStr) {
                            let d;
                            if (dStr.includes('-')) {
                                d = new Date(dStr);
                            } else if (dStr.includes('/')) {
                                const p = dStr.split('/');
                                if (p.length === 3) d = new Date(`${p[2]}-${p[1]}-${p[0]}T00:00:00`);
                            }
                            
                            if (d && d.getMonth() === targetMonth && d.getFullYear() === targetYear) {
                                const st = (t.trangThai || '').toLowerCase();
                                if (st.includes('done') || st.includes('hoàn thành')) {
                                    doneTasks++;
                                } else if (st.includes('hết hạn')) {
                                    expiredTasks++;
                                }
                            }
                        }
                    }
                });

                // 3. Calculation
                const dailyRate = baseSalary / PayrollModule.STANDARD_WORK_DAYS;
                const paidDays = onTimeDays + lateDays + approvedLeaveDays;
                
                const attendancePay = paidDays * dailyRate;
                const latePenaltyTotal = lateDays * PayrollModule.LATE_PENALTY;
                
                // Manual custom Bonus/Penalty
                const customBonus = parseFloat(monthlyBonuses[username]) || 0;

                const netSalary = attendancePay + customBonus - latePenaltyTotal;

                return `
                    <tr>
                        <td>
                            <strong style="color: var(--primary); font-size: 15px;">${username}</strong><br>
                            <span class="badge ${acc.role === 'admin' ? 'badge-orange' : 'badge-blue'}" style="font-size: 10px; margin-top: 4px;">${acc.role}</span>
                        </td>
                        <td style="text-align: right; color: var(--text-secondary);">
                            ${Utils.formatCurrency(baseSalary)}đ
                        </td>
                        <td style="text-align: center; font-size: 13px;">
                            <span style="color: var(--success);" title="Đúng giờ"><i class="fa-solid fa-check-circle"></i> ${onTimeDays}</span> &nbsp;|&nbsp; 
                            <span style="color: var(--warning);" title="Đi muộn"><i class="fa-solid fa-clock"></i> ${lateDays}</span> &nbsp;|&nbsp; 
                            <span style="color: var(--primary);" title="Nghỉ phép (Có lương)"><i class="fa-solid fa-bed"></i> ${approvedLeaveDays}</span>
                        </td>
                        <td style="text-align: center; font-size: 13px;">
                            <span class="badge bg-success" title="Hoàn thành">${doneTasks} Done</span>
                            <span class="badge bg-danger" title="Hết hạn">${expiredTasks} Expired</span>
                        </td>
                        <td style="text-align: right; font-size: 13px;">
                            ${currentUser.role === 'admin' ? 
                            `<input type="number" class="form-control" style="width: 100px; padding: 4px 8px; font-size: 13px; text-align: right; display: inline-block; color: ${customBonus >= 0 ? 'var(--success)' : 'var(--danger)'}; border-color: rgba(255,255,255,0.1);" value="${customBonus}" placeholder="0" onchange="PayrollModule.saveCustomBonus('${username}', this.value)">` 
                            : `<strong style="color: ${customBonus >= 0 ? 'var(--success)' : 'var(--danger)'};">${customBonus > 0 ? '+' : ''}${Utils.formatCurrency(customBonus)}đ</strong>`}
                            ${latePenaltyTotal > 0 ? `<div style="color: var(--warning); font-size: 11px; margin-top: 4px;">Phạt muộn: -${Utils.formatCurrency(latePenaltyTotal)}đ</div>` : ''}
                        </td>
                        <td style="text-align: right;">
                            <strong style="font-size: 16px; color: ${netSalary >= 0 ? 'var(--success)' : 'var(--danger)'};">
                                ${netSalary >= 0 ? '' : '-'}${Utils.formatCurrency(Math.abs(Math.round(netSalary)))}đ
                            </strong>
                        </td>
                    </tr>
                `;
            }).join('');

            if (accounts.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: var(--text-secondary);">Không có dữ liệu tài khoản</td></tr>';
            } else {
                tbody.innerHTML = rowsHtml;
            }

        } catch (e) {
            console.error("Lỗi khi tính lương:", e);
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: var(--danger);">Đã xảy ra lỗi trong quá trình tính toán.</td></tr>';
        }
    }
};
