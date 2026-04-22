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
                
                <div style="display: flex; gap: 8px; align-items: center;">
                    <label style="color: var(--text-secondary); font-size: 13px;">Chọn tháng:</label>
                    <input type="month" id="payroll-month" class="form-control" style="width: auto; display: inline-block; height: 38px;" value="${PayrollModule.currentMonth}" onchange="PayrollModule.changeMonth(this.value)">
                    <button class="btn btn-success" onclick="PayrollModule.exportToExcel()"><i class="fa-solid fa-file-excel"></i> Excel</button>
                    <button class="btn btn-outline" style="border-color: #f1c40f; color: #f1c40f;" onclick="PayrollModule.exportToPDF()"><i class="fa-solid fa-file-pdf"></i> PDF</button>
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

    calculateUserSalary: async (username, monthStr) => {
        try {
            const accounts = await Auth.getAccounts();
            const acc = accounts.find(a => a.username === username);
            if (!acc) return 0;

            const baseSalary = acc.baseSalary || 0;
            const allAttendance = await Attendance.loadData();
            const allLeaves = await Attendance.loadLeaveData();
            const allCustomBonuses = await DB.getCustomBonuses();
            
            let onTimeDays = 0, lateDays = 0, approvedLeaveDays = 0;
            const targetMonth = parseInt(monthStr.split('-')[1]) - 1;
            const targetYear = parseInt(monthStr.split('-')[0]);

            // Lấy ngày hôm nay
            const now = new Date();
            const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

            allAttendance.forEach(a => {
                if (a.username === username && a.dateStr < todayStr) {
                    const d = new Date(a.dateStr);
                    if (d.getMonth() === targetMonth && d.getFullYear() === targetYear) {
                        if (a.status === 'on_time') onTimeDays++;
                        else if (a.status === 'late') lateDays++;
                    }
                }
            });

            allLeaves.forEach(l => {
                if (l.username === username && l.status === 'approved' && l.date < todayStr) {
                    const d = new Date(l.date);
                    if (d.getMonth() === targetMonth && d.getFullYear() === targetYear) {
                        approvedLeaveDays += (parseInt(l.days) || 1);
                    }
                }
            });

            const dailyRate = baseSalary / PayrollModule.STANDARD_WORK_DAYS;
            const paidDays = onTimeDays + lateDays + approvedLeaveDays;
            
            const attendancePay = paidDays * dailyRate;
            const latePenaltyTotal = lateDays * PayrollModule.LATE_PENALTY;
            const customBonus = parseFloat((allCustomBonuses[monthStr] || {})[username]) || 0;

            const netSalary = attendancePay + customBonus - latePenaltyTotal;
            return Math.round(netSalary > 0 ? netSalary : 0);
        } catch (e) {
            console.error(e);
            return 0;
        }
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

            // Lấy ngày hôm nay theo YYYY-MM-DD timezone Local
            const now = new Date();
            const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

            const rowsHtml = accounts.map(acc => {
                const username = acc.username;
                const baseSalary = acc.baseSalary || 0;
                
                // 1. Attendance points
                let onTimeDays = 0;
                let lateDays = 0;
                let approvedLeaveDays = 0;

                // Scan attendance
                allAttendance.forEach(a => {
                    if (a.username === username && a.dateStr < todayStr) {
                        const d = new Date(a.dateStr);
                        if (d.getMonth() === targetMonth && d.getFullYear() === targetYear) {
                            if (a.status === 'on_time') onTimeDays++;
                            else if (a.status === 'late') lateDays++;
                        }
                    }
                });

                // Scan leaves
                allLeaves.forEach(l => {
                    if (l.username === username && l.status === 'approved' && l.date < todayStr) {
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
    },

    exportToPDF: () => {
        const tbody = document.getElementById('payroll-table-body');
        if (!tbody || tbody.innerHTML.includes('Chưa có dữ liệu') || tbody.innerHTML.includes('Không có dữ liệu')) {
            Utils.showToast("Không có dữ liệu để xuất", "error");
            return;
        }

        Utils.showToast("Đang tạo file bảng lương PDF...", "info");

        let cloneRowHtml = tbody.innerHTML.replace(/var\(--primary\)/g, '#3b82f6')
                                            .replace(/var\(--text-secondary\)/g, '#4b5563')
                                            .replace(/var\(--success\)/g, '#10b981')
                                            .replace(/var\(--warning\)/g, '#f59e0b')
                                            .replace(/var\(--danger\)/g, '#ef4444');

        const clone = document.createElement('div');
        clone.style.padding = '30px';
        clone.style.background = '#ffffff';
        clone.style.color = '#000000';
        clone.style.fontFamily = 'Arial, sans-serif';

        const today = new Date().toLocaleDateString('vi-VN');

        clone.innerHTML = `
            <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #da251d; padding-bottom: 20px;">
                <h1 style="color: #da251d; margin-bottom: 5px;">THANH LONG WORK</h1>
                <h3>BẢNG LƯƠNG NHÂN SỰ TỔNG HỢP</h3>
                <p>Kỳ tháng: ${PayrollModule.currentMonth.replace('-', '/')} &bull; Ngày xuất: ${today}</p>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px; font-size: 12px; text-align: left;">
                <thead>
                    <tr style="background: #f3f4f6;">
                        <th style="padding: 10px; border: 1px solid #d1d5db; text-align: left;">Nhân sự</th>
                        <th style="padding: 10px; border: 1px solid #d1d5db; text-align: right;">Lương cứng</th>
                        <th style="padding: 10px; border: 1px solid #d1d5db; text-align: center;">Chấm công</th>
                        <th style="padding: 10px; border: 1px solid #d1d5db; text-align: center;">Hiệu suất</th>
                        <th style="padding: 10px; border: 1px solid #d1d5db; text-align: right;">Thưởng/Phạt</th>
                        <th style="padding: 10px; border: 1px solid #d1d5db; text-align: right;">Thực Lĩnh</th>
                    </tr>
                </thead>
                <tbody>
                    ${cloneRowHtml}
                </tbody>
            </table>

            <div style="display: flex; justify-content: space-between; margin-top: 50px; text-align: center; padding: 0 50px;">
                <div style="width: 200px;">
                    <p style="font-weight: bold; margin-bottom: 80px;">Người Lập Bảng</p>
                    <p>Kế toán</p>
                </div>
                <div style="width: 250px; position: relative;">
                    <p style="font-weight: bold; margin-bottom: 15px;">Giám Đốc</p>
                    <div style="margin: 0 auto; width: 160px; height: 160px;">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="160" height="160">
                            <circle cx="100" cy="100" r="92" fill="none" stroke="#da251d" stroke-width="4" opacity="0.85"/>
                            <circle cx="100" cy="100" r="82" fill="none" stroke="#da251d" stroke-width="1.5" opacity="0.6"/>
                            <path d="M 100 35 Q 115 50 110 65 Q 125 55 130 70 Q 120 75 125 90 Q 135 85 140 95 Q 130 100 125 110 Q 115 105 110 115 Q 105 105 100 110 Q 95 105 90 115 Q 85 105 75 110 Q 70 100 60 95 Q 65 85 75 90 Q 80 75 70 70 Q 75 55 90 65 Q 85 50 100 35" fill="#da251d" opacity="0.7"/>
                            <text x="100" y="148" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#da251d">THANH LONG WORK</text>
                            <text x="100" y="165" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" fill="#da251d">GIÁM ĐỐC</text>
                            <line x1="55" y1="130" x2="145" y2="130" stroke="#da251d" stroke-width="0.8" opacity="0.5"/>
                            <text x="100" y="182" text-anchor="middle" font-family="Arial,sans-serif" font-size="7" fill="#da251d" opacity="0.6">★ Since 2026 ★</text>
                        </svg>
                    </div>
                    <p style="margin-top: 10px; font-weight: bold;">ĐÀO THANH LONG</p>
                </div>
            </div>
        `;

        // Strip input tags for PDF formatting
        const inputs = clone.querySelectorAll('input');
        inputs.forEach(input => {
            const val = input.value;
            const textNode = document.createTextNode(val + 'đ');
            input.replaceWith(textNode);
        });

        const bdgs = clone.querySelectorAll('.badge');
        bdgs.forEach(b => {
            b.style.display = 'inline-block';
            b.style.padding = '3px 6px';
            b.style.border = '1px solid #ccc';
            b.style.borderRadius = '4px';
            b.style.fontSize = '10px';
            b.style.color = '#333';
            b.style.background = 'transparent';
        });

        const opt = {
            margin:       0.5,
            filename:     'bang_luong_' + PayrollModule.currentMonth + '.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'in', format: 'a4', orientation: 'landscape' }
        };

        html2pdf().set(opt).from(clone).save().then(() => {
            Utils.showToast("Đã xuất Bảng lương ra PDF!", "success");
        }).catch(err => {
            console.error("Lỗi xuất PDF:", err);
            Utils.showToast("Lỗi xuất báo cáo PDF", "error");
        });
    },

    exportToExcel: async () => {
        Utils.showToast("Đang tạo Excel...", "info");
        const tbody = document.getElementById('payroll-table-body');
        if (!tbody) { Utils.showToast("Không có dữ liệu", "error"); return; }

        const currentUser = Auth.currentUser;
        let accounts = await Auth.getAccounts();
        if (currentUser.role !== 'admin') {
            accounts = accounts.filter(a => a.username === currentUser.username);
        }

        const allAttendance = await Attendance.loadData();
        const allLeaves = await Attendance.loadLeaveData();
        const allCustomBonuses = await DB.getCustomBonuses();
        const monthlyBonuses = allCustomBonuses[PayrollModule.currentMonth] || {};

        const selectedDate = new Date(PayrollModule.currentMonth + '-01');
        const targetMonth = selectedDate.getMonth();
        const targetYear = selectedDate.getFullYear();
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

        const data = accounts.map(acc => {
            const username = acc.username;
            const baseSalary = acc.baseSalary || 0;
            let onTimeDays = 0, lateDays = 0, approvedLeaveDays = 0;

            allAttendance.forEach(a => {
                if (a.username === username && a.dateStr < todayStr) {
                    const d = new Date(a.dateStr);
                    if (d.getMonth() === targetMonth && d.getFullYear() === targetYear) {
                        if (a.status === 'on_time') onTimeDays++;
                        else if (a.status === 'late') lateDays++;
                    }
                }
            });

            allLeaves.forEach(l => {
                if (l.username === username && l.status === 'approved' && l.date < todayStr) {
                    const d = new Date(l.date);
                    if (d.getMonth() === targetMonth && d.getFullYear() === targetYear) {
                        approvedLeaveDays += (parseInt(l.days) || 1);
                    }
                }
            });

            const dailyRate = baseSalary / PayrollModule.STANDARD_WORK_DAYS;
            const paidDays = onTimeDays + lateDays + approvedLeaveDays;
            const attendancePay = paidDays * dailyRate;
            const latePenaltyTotal = lateDays * PayrollModule.LATE_PENALTY;
            const customBonus = parseFloat(monthlyBonuses[username]) || 0;
            const netSalary = Math.round(Math.max(0, attendancePay + customBonus - latePenaltyTotal));

            return {
                'Nhân sự': username,
                'Vai trò': acc.role,
                'Lương cứng': baseSalary,
                'Đúng giờ': onTimeDays,
                'Đi muộn': lateDays,
                'Nghỉ phép': approvedLeaveDays,
                'Phạt muộn': -latePenaltyTotal,
                'Thưởng/Phạt khác': customBonus,
                'Thực lĩnh': netSalary
            };
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Luong_' + PayrollModule.currentMonth);
        XLSX.writeFile(wb, `Bang_Luong_${PayrollModule.currentMonth}.xlsx`);
        Utils.showToast("Đã xuất Bảng Lương ra Excel!", "success");
    }
};
