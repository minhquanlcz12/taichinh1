const Attendance = {
    // Thời hạn chấm công đúng giờ: 08:30 AM
    DEADLINE_HOURS: 8,
    DEADLINE_MINUTES: 30,

    init: () => {
        // Chỉ render khi người dùng click vào tab chấm công (hoặc init lần đầu nếu cần)
    },

    loadData: async () => {
        let attendanceData = [];
        try {
            if (typeof DB !== 'undefined' && typeof DB.getAttendance === 'function') {
                attendanceData = await DB.getAttendance() || [];
                // Đồng bộ mồ côi từ LocalStorage lỡ lưu lúc chưa update
                let localData = JSON.parse(localStorage.getItem('tl_attendance') || '[]');
                if (localData.length > 0) {
                    let changed = false;
                    localData.forEach(lr => {
                        if (!attendanceData.find(r => r.id === lr.id)) {
                            attendanceData.push(lr);
                            changed = true;
                        }
                    });
                    if (changed) {
                        await DB.saveAttendance(attendanceData);
                    }
                    localStorage.removeItem('tl_attendance');
                }
            } else {
                attendanceData = JSON.parse(localStorage.getItem('tl_attendance') || '[]');
            }
        } catch (e) {
            console.error("Lỗi tải dữ liệu chấm công:", e);
            attendanceData = JSON.parse(localStorage.getItem('tl_attendance') || '[]');
        }
        return attendanceData;
    },

    saveData: async (data) => {
        try {
            if (typeof DB !== 'undefined' && typeof DB.saveAttendance === 'function') {
                await DB.saveAttendance(data);
            } else {
                localStorage.setItem('tl_attendance', JSON.stringify(data));
            }
        } catch (e) {
            console.error("Lỗi lưu dữ liệu chấm công:", e);
            localStorage.setItem('tl_attendance', JSON.stringify(data));
        }
    },

    render: async () => {
        const container = document.getElementById('attendance-content-area');
        if (!container) return;
        
        const currentUser = Auth.currentUser;
        if (!currentUser) return;

        if (currentUser.role === 'admin') {
            await Attendance.renderAdminView(container);
        } else {
            await Attendance.renderUserView(container, currentUser);
        }
    },

    loadLeaveData: async () => {
        let leaveData = [];
        try {
            if (typeof DB !== 'undefined' && typeof DB.getLeaveRequests === 'function') {
                leaveData = await DB.getLeaveRequests() || [];
                // Đồng bộ rác từ LocalStorage
                let localData = JSON.parse(localStorage.getItem('tl_leave_requests') || '[]');
                if (localData.length > 0) {
                    let changed = false;
                    localData.forEach(lr => {
                        if (!leaveData.find(r => r.id === lr.id)) {
                            leaveData.push(lr);
                            changed = true;
                        }
                    });
                    if (changed) {
                        await DB.saveLeaveRequests(leaveData);
                    }
                    localStorage.removeItem('tl_leave_requests');
                }
            } else {
                leaveData = JSON.parse(localStorage.getItem('tl_leave_requests') || '[]');
            }
        } catch (e) {
            console.error("Lỗi tải dữ liệu xin nghỉ:", e);
            leaveData = JSON.parse(localStorage.getItem('tl_leave_requests') || '[]');
        }
        return leaveData;
    },

    saveLeaveData: async (data) => {
        try {
            if (typeof DB !== 'undefined' && typeof DB.saveLeaveRequests === 'function') {
                await DB.saveLeaveRequests(data);
            } else {
                localStorage.setItem('tl_leave_requests', JSON.stringify(data));
            }
        } catch (e) {
            console.error("Lỗi lưu dữ liệu xin nghỉ:", e);
            localStorage.setItem('tl_leave_requests', JSON.stringify(data));
        }
    },

    renderUserView: async (container, user) => {
        const today = new Date();
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const allData = await Attendance.loadData();
        
        // Kiểm tra xem hôm nay đã chấm công chưa
        const todayRecord = allData.find(r => r.username === user.username && r.dateStr === dateStr);
        let checkInHtml = '';

        if (todayRecord) {
            checkInHtml = `
                <div class="attendance-status success-ring">
                    <div style="font-size: 48px; margin-bottom: 16px;">🪵✅</div>
                    <h3 style="color: #ffd700;">🙏 Đã Tích Công Đức</h3>
                    <p style="color: var(--text-secondary); margin-top: 8px;">Gõ mõ lúc: <strong>${new Date(todayRecord.timestamp).toLocaleTimeString('vi-VN')}</strong>
                        ${todayRecord.location ? `<br><small style="color: #daa520;"><i class="fa-solid fa-location-dot"></i> Đã xác minh vị trí chùa... à nhầm, công ty 😄</small>` : ''}
                    </p>
                    <p style="margin-top: 8px;">Trạng thái: 
                        <span class="badge ${todayRecord.status === 'on_time' ? 'bg-success' : 'bg-danger'}">
                            ${todayRecord.status === 'on_time' ? '🏆 Đúng giờ — Công đức +2' : `⏰ Đi muộn ${todayRecord.lateMinutes} phút — Công đức +1`}
                        </span>
                    </p>
                </div>
            `;
            
            // Nếu đã checkin nhưng chưa checkout
            if (!todayRecord.checkoutTimestamp) {
                checkInHtml += `
                <div style="text-align: center; margin-top: 20px;">
                    <button class="btn" style="background: var(--info); color: #fff; padding: 12px 24px; font-weight: bold; border-radius: 30px; box-shadow: 0 4px 15px rgba(0, 240, 255, 0.3);" onclick="Attendance.showCheckoutModal()">
                        <i class="fa-solid fa-person-walking-arrow-right" style="margin-right: 8px;"></i> BÁO CÁO RA VÊ (CHECK-OUT)
                    </button>
                    <p style="color: var(--text-secondary); font-size: 12px; margin-top: 8px;">Vui lòng làm báo cáo EOD trước khi kết thúc ngày.</p>
                </div>`;
            } else {
                checkInHtml += `
                <div class="glass-panel" style="margin-top: 20px; padding: 16px; border-color: var(--success);">
                    <h4 style="color: var(--success); margin-bottom: 8px;"><i class="fa-solid fa-clipboard-check"></i> Đã hoàn thành ngày làm việc</h4>
                    <p style="color: var(--text-secondary); font-size: 13px; margin: 0;">Ra về lúc: <strong>${new Date(todayRecord.checkoutTimestamp).toLocaleTimeString('vi-VN')}</strong></p>
                </div>`;
            }

        } else {
            checkInHtml = `
                <div class="check-in-box">
                    <button id="btn-check-in" class="btn-radar-cyber" onclick="Attendance.handleCheckIn()">
                        <span class="radar-text">🪵 GÕ MÕ<br>ĐIỂM DANH</span>
                        <div class="radar-ring"></div>
                        <div class="radar-scan"></div>
                    </button>
                    <p style="margin-top: 24px; color: #daa520; font-weight: 600;">🙏 Gõ mõ để tích công đức đi làm hôm nay!</p>
                    <small style="color: var(--warning); display: block; margin-top: 8px;"><i class="fa-solid fa-location-dot"></i> Yêu cầu GPS để xác minh vị trí tại chùa... à nhầm, tại công ty 😄</small>
                </div>
            `;
        }

        // Luôn hiển thị nút xin nghỉ phép
        checkInHtml += `
            <div style="text-align: center; margin-top: 24px; padding-top: 24px; border-top: 1px dashed rgba(255,255,255,0.1);">
                <button class="btn btn-outline" style="border-color: var(--warning); color: var(--warning);" onclick="Attendance.showLeaveModal()">
                    <i class="fa-solid fa-calendar-minus" style="margin-right: 6px;"></i>Đăng ký Xin Nghỉ Phép
                </button>
            </div>
        `;

        // Lấy lịch sử 30 ngày gần nhất
        const userHistory = allData.filter(r => r.username === user.username).sort((a,b) => b.timestamp - a.timestamp).slice(0, 30);
        
        // Lấy lịch sử xin nghỉ
        const allLeaves = await Attendance.loadLeaveData();
        const userLeaves = allLeaves.filter(l => l.username === user.username).sort((a,b) => b.timestamp - a.timestamp);
        let historyHtml = `
            <div class="glass-panel" style="margin-top: 30px; padding: 20px;">
                <h3 style="margin-bottom: 16px; color: #daa520;">🪵 Sổ Công Đức (30 ngày gần nhất)</h3>
                <div class="table-responsive">
                    <table class="tl-table">
                        <thead>
                            <tr>
                                <th>Ngày</th>
                                <th>Thời gian</th>
                                <th>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${userHistory.length === 0 ? '<tr><td colspan="3" style="text-align:center;">Chưa có dữ liệu</td></tr>' : ''}
                            ${userHistory.map(r => `
                                <tr>
                                    <td>${r.dateStr}</td>
                                    <td>${new Date(r.timestamp).toLocaleTimeString('vi-VN')} ${r.checkoutTimestamp ? `<br><small style="color:var(--success)">Ra: ${new Date(r.checkoutTimestamp).toLocaleTimeString('vi-VN')}</small>` : ''}</td>
                                    <td>
                                        <span class="badge ${r.status === 'on_time' ? 'bg-success' : 'bg-danger'}">
                                            ${r.status === 'on_time' ? 'Đúng giờ' : `Muộn ${r.lateMinutes}p`}
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="glass-panel" style="margin-top: 24px; padding: 20px;">
                <h3 style="margin-bottom: 16px; color: var(--warning);">Lịch sử Xin nghỉ phép</h3>
                <div class="table-responsive">
                    <table class="tl-table">
                        <thead>
                            <tr>
                                <th>Ngày nghỉ</th>
                                <th>Số ngày</th>
                                <th>Lý do</th>
                                <th>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${userLeaves.length === 0 ? '<tr><td colspan="4" style="text-align:center;">Chưa có yêu cầu xin nghỉ</td></tr>' : ''}
                            ${userLeaves.map(l => {
                                let statusHtml = '';
                                if (l.status === 'pending') statusHtml = '<span class="badge bg-warning" style="color: #000;">Chờ Duyệt</span>';
                                else if (l.status === 'approved') statusHtml = '<span class="badge bg-success">Đã Duyệt</span>';
                                else if (l.status === 'rejected') statusHtml = '<span class="badge bg-danger">Từ Chối</span>';
                                
                                return `
                                <tr>
                                    <td>${l.startDate}</td>
                                    <td>${l.days}</td>
                                    <td style="max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${l.reason}">${l.reason}</td>
                                    <td>${statusHtml}</td>
                                </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        container.innerHTML = `
            <div class="attendance-user-container">
                <div class="attendance-header" style="text-align: center; margin-bottom: 30px;">
                    <h2 style="color: var(--primary); text-transform: uppercase; letter-spacing: 2px;">Chấm Công Hàng Ngày</h2>
                    <p style="color: var(--text-secondary);">Hạn chót: <strong>08:30 AM</strong></p>
                </div>
                ${checkInHtml}
                ${historyHtml}
            </div>
        `;
    },

    renderAdminView: async (container) => {
        const allData = await Attendance.loadData();
        const allLeaves = await Attendance.loadLeaveData();
        
        // Phân nhóm theo User và Tháng hiện tại
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const currentMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
        
        // Tính số ngày làm việc đã qua trong tháng (Loại trừ Chủ nhật)
        let passedWorkingDays = 0;
        for (let day = 1; day <= now.getDate(); day++) {
             let d = new Date(currentYear, currentMonth, day);
             if (d.getDay() !== 0) passedWorkingDays++;
        }

        const summary = {};
        allData.forEach(r => {
            if (r.dateStr.startsWith(currentMonthPrefix)) {
                if (!summary[r.username]) {
                    summary[r.username] = { totalDays: 0, onTime: 0, late: 0, totalLateMinutes: 0 };
                }
                summary[r.username].totalDays++;
                if (r.status === 'on_time') {
                    summary[r.username].onTime++;
                } else {
                    summary[r.username].late++;
                    summary[r.username].totalLateMinutes += r.lateMinutes || 0;
                }
            }
        });

        const approvedLeaves = {};
        allLeaves.forEach(l => {
            if (l.status === 'approved' && l.startDate.startsWith(currentMonthPrefix)) {
                if (!approvedLeaves[l.username]) approvedLeaves[l.username] = 0;
                approvedLeaves[l.username] += parseFloat(l.days) || 0;
            }
        });

        // Lấy tất cả user từ DB (loại admin) để hiển thị kể cả khi chưa điểm danh
        const accounts = (typeof Auth !== 'undefined' && await Auth.getAccounts()) || [];
        const usersList = accounts.filter(a => a.role !== 'admin').map(a => a.username);
        
        // Cứ thêm user có dữ liệu điểm danh lỡ như tài khoản bị xoá
        Object.keys(summary).forEach(u => {
            if (!usersList.includes(u) && u !== 'admin') usersList.push(u);
        });
        
        let adminHtml = `
            <div class="glass-panel admin-cyber-box" style="padding: 24px; border: 1px solid rgba(100, 255, 218, 0.5); box-shadow: 0 0 10px rgba(100, 255, 218, 0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h2 style="color: var(--primary); font-size: 18px; letter-spacing: 1px; display: flex; align-items: center; gap: 8px; margin: 0;">
                        <i class="fa-solid fa-list-check"></i> Tổng hợp Chấm Công (Tháng ${now.getMonth() + 1}/${now.getFullYear()})
                    </h2>
                    <button class="btn btn-success" onclick="Attendance.exportAttendanceCSV()"><i class="fa-solid fa-file-excel" style="margin-right: 6px;"></i> Xuất Excel</button>
                </div>
                
                <div style="display: flex; gap: 24px; align-items: stretch;">
                    <!-- Cục Nhân sự bên trái -->
                    <div style="width: 200px; flex-shrink: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; border-radius: 12px; background: rgba(10, 25, 40, 0.8); border: 2px solid #5ab9ea; box-shadow: 0 0 15px rgba(90, 185, 234, 0.3), inset 0 0 20px rgba(90, 185, 234, 0.1); position: relative; overflow: hidden;">
                        <!-- Thêm thanh sáng bên dưới giống thiết kế -->
                        <div style="position: absolute; bottom: 0; width: 60px; height: 4px; background: #5ab9ea; border-top-left-radius: 4px; border-top-right-radius: 4px; box-shadow: 0 0 8px #5ab9ea;"></div>
                        <div class="card-inner" style="text-align: center; padding: 20px;">
                            <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 8px;">Nhân sự đã điểm danh</p>
                            <h2 style="color: #5ab9ea; font-size: 56px; font-weight: bold; text-shadow: 0 0 20px rgba(90, 185, 234, 0.6);">${usersList.length}</h2>
                        </div>
                    </div>
                
                    <!-- Bảng thống kê bên phải -->
                    <div class="table-responsive" style="flex: 1;">
                        <table class="tl-table cyber-hover-table" style="margin: 0; border-collapse: separate; border-spacing: 0 8px;">
                            <thead>
                                <tr>
                                    <th style="color: #64ffda; border: none; padding-bottom: 8px; font-weight: 500;">Nhân Viên</th>
                                    <th style="color: #64ffda; border: none; padding-bottom: 8px; font-weight: 500;">Tổng ngày công</th>
                                    <th style="color: var(--success); border: none; padding-bottom: 8px; font-weight: 500;"><i class="fa-regular fa-calendar-check" style="margin-right: 4px;"></i> 1 Công</th>
                                    <th style="color: var(--danger); border: none; padding-bottom: 8px; font-weight: 500;"><i class="fa-regular fa-clock" style="margin-right: 4px;"></i> Vắng</th>
                                    <th style="color: var(--danger); border: none; padding-bottom: 8px; font-weight: 500;"><i class="fa-regular fa-clock" style="margin-right: 4px;"></i> Muộn</th>
                                    <th style="color: #64ffda; border: none; padding-bottom: 8px; font-weight: 500;">Tổng phút</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${usersList.length === 0 ? '<tr><td colspan="6" style="text-align:center; padding: 16px;">Chưa có dữ liệu tháng này</td></tr>' : ''}
                                ${usersList.map(u => {
                                    const s = summary[u] || { totalDays: 0, onTime: 0, late: 0, totalLateMinutes: 0 };
                                    const leaves = approvedLeaves[u] || 0;
                                    let absent = passedWorkingDays - s.totalDays - leaves;
                                    if (absent < 0) absent = 0;
                                    
                                    return `
                                    <tr style="background: rgba(4, 9, 20, 0.8); border-radius: 8px; box-shadow: inset 0 0 0 1px rgba(100, 255, 218, 0.4);">
                                        <td style="font-weight: 600; padding: 12px 16px; color: #fff; border-top-left-radius: 8px; border-bottom-left-radius: 8px; border-top: 1px solid rgba(100, 255, 218, 0.4); border-bottom: 1px solid rgba(100, 255, 218, 0.4); border-left: 1px solid rgba(100, 255, 218, 0.4);">${u}</td>
                                        <td style="padding: 12px 16px; color: var(--text-secondary); border-top: 1px solid rgba(100, 255, 218, 0.4); border-bottom: 1px solid rgba(100, 255, 218, 0.4);"><i class="fa-regular fa-calendar" style="margin-right: 6px;"></i> ${s.totalDays} / ${passedWorkingDays}</td>
                                        <td style="color: var(--success); font-weight: bold; padding: 12px 16px; border-top: 1px solid rgba(100, 255, 218, 0.4); border-bottom: 1px solid rgba(100, 255, 218, 0.4);">${s.onTime}</td>
                                        <td style="color: var(--danger); font-weight: bold; padding: 12px 16px; border-top: 1px solid rgba(100, 255, 218, 0.4); border-bottom: 1px solid rgba(100, 255, 218, 0.4);">
                                            ${absent}
                                            ${leaves > 0 ? `<br><small style="color:var(--warning);font-size:10px;font-style:italic;">(Nghỉ phép: ${leaves})</small>` : ''}
                                        </td>
                                        <td style="color: var(--danger); font-weight: bold; padding: 12px 16px; border-top: 1px solid rgba(100, 255, 218, 0.4); border-bottom: 1px solid rgba(100, 255, 218, 0.4);">${s.late}</td>
                                        <td style="padding: 12px 16px; border-top-right-radius: 8px; border-bottom-right-radius: 8px; border-top: 1px solid rgba(100, 255, 218, 0.4); border-bottom: 1px solid rgba(100, 255, 218, 0.4); border-right: 1px solid rgba(100, 255, 218, 0.4);"><span style="color: #64ffda; font-weight: 500; display: inline-flex; align-items: center; gap: 6px;"><i class="fa-regular fa-clock"></i> ${s.totalLateMinutes} p</span></td>
                                    </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        // Hiển thị danh sách xin nghỉ (Admin) — reuse allLeaves from line 260
        const pendingLeaves = allLeaves.filter(l => l.status === 'pending').sort((a,b) => a.timestamp - b.timestamp);
        const resolvedLeaves = allLeaves.filter(l => l.status !== 'pending').sort((a,b) => b.timestamp - a.timestamp).slice(0, 20);

        let leavesHtml = `
            <div class="glass-panel admin-cyber-box" style="padding: 24px; height: 100%; border: 1px solid rgba(255, 255, 255, 0.2);">
                <h2 style="color: var(--warning); margin-bottom: 24px; font-size: 18px; letter-spacing: 1px; display: flex; align-items: center; gap: 8px;">
                    <i class="fa-solid fa-wallet"></i> Danh sách Xin Nghỉ Phép
                </h2>
                
                <div style="background: rgba(4, 9, 20, 0.5); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                    <h3 style="color: var(--warning); margin-bottom: 16px; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-clock-rotate-left"></i> Yêu cầu chờ duyệt (${pendingLeaves.length})
                    </h3>
                    <div class="table-responsive">
                        <table class="tl-table cyber-hover-table" style="border-collapse: separate; border-spacing: 0 6px;">
                            <thead>
                                <tr>
                                    <th style="color: var(--text-secondary); font-weight: 500; border: none; padding-bottom: 8px;">Nhân Viên</th>
                                    <th style="color: var(--text-secondary); font-weight: 500; border: none; padding-bottom: 8px;">Ngày nghỉ</th>
                                    <th style="color: var(--text-secondary); font-weight: 500; border: none; padding-bottom: 8px;">Số ngày</th>
                                    <th style="color: var(--text-secondary); font-weight: 500; border: none; padding-bottom: 8px;">Lý do</th>
                                    <th style="color: var(--text-secondary); font-weight: 500; text-align: right; border: none; padding-bottom: 8px;">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                            ${pendingLeaves.length === 0 ? '<tr><td colspan="5" style="text-align:center; padding: 16px;">Không có yêu cầu chờ duyệt</td></tr>' : ''}
                            ${pendingLeaves.map(l => `
                                <tr style="background: rgba(4, 9, 20, 0.8); border-radius: 6px;">
                                    <td style="font-weight: bold; color: #fff; padding: 12px 16px; border-top-left-radius: 6px; border-bottom-left-radius: 6px; border-top: 1px solid rgba(255, 255, 255, 0.2); border-bottom: 1px solid rgba(255, 255, 255, 0.2); border-left: 1px solid rgba(255, 255, 255, 0.2);">${l.username}</td>
                                    <td style="padding: 12px 16px; border-top: 1px solid rgba(255, 255, 255, 0.2); border-bottom: 1px solid rgba(255, 255, 255, 0.2);"><i class="fa-regular fa-calendar" style="margin-right: 6px; color: var(--text-secondary);"></i> ${l.startDate}</td>
                                    <td style="padding: 12px 16px; border-top: 1px solid rgba(255, 255, 255, 0.2); border-bottom: 1px solid rgba(255, 255, 255, 0.2);">${l.days}</td>
                                    <td style="padding: 12px 16px; color: var(--danger); border-top: 1px solid rgba(255, 255, 255, 0.2); border-bottom: 1px solid rgba(255, 255, 255, 0.2);"><i class="fa-solid fa-triangle-exclamation" style="margin-right: 4px;"></i> ${l.reason}</td>
                                    <td style="padding: 12px 16px; text-align: right; border-top-right-radius: 6px; border-bottom-right-radius: 6px; border-top: 1px solid rgba(255, 255, 255, 0.2); border-bottom: 1px solid rgba(255, 255, 255, 0.2); border-right: 1px solid rgba(255, 255, 255, 0.2);">
                                        <button class="btn btn-sm" onclick="Attendance.updateLeaveStatus('${l.id}', 'approved')" style="background: transparent; border: 1px solid var(--success); color: var(--success); margin-right: 8px; padding: 6px 16px; border-radius: 4px; font-weight: bold; transition: all 0.2s;"><i class="fa-solid fa-check" style="margin-right: 6px;"></i> Duyệt [v]</button>
                                        <button class="btn btn-sm" onclick="Attendance.updateLeaveStatus('${l.id}', 'rejected')" style="background: transparent; border: 1px solid var(--danger); color: var(--danger); padding: 6px 16px; border-radius: 4px; font-weight: bold; transition: all 0.2s;">Từ Chối [x]</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                </div> <!-- End Pending Block -->
                
                <div style="background: rgba(4, 9, 20, 0.5); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; padding: 16px;">
                    <h3 style="color: var(--text-secondary); margin-bottom: 16px; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-clock-rotate-left"></i> Lịch sử đã duyệt/từ chối gần đây
                    </h3>
                    <div class="table-responsive">
                        <table class="tl-table cyber-hover-table" style="text-align: center; border-collapse: separate; border-spacing: 0 6px;">
                            <thead>
                                <tr>
                                    <th style="color: var(--text-secondary); font-weight: 500; border: none; padding-bottom: 8px;">Nhân Viên</th>
                                    <th style="color: var(--text-secondary); font-weight: 500; border: none; padding-bottom: 8px;">Ngày nghỉ</th>
                                    <th style="color: var(--text-secondary); font-weight: 500; border: none; padding-bottom: 8px;">Số ngày</th>
                                    <th style="color: var(--text-secondary); font-weight: 500; border: none; padding-bottom: 8px;">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                            ${resolvedLeaves.length === 0 ? '<tr><td colspan="4" style="text-align:center; padding: 32px;"><i class="fa-regular fa-clipboard" style="font-size: 24px; color: var(--text-secondary); margin-bottom: 8px; display: block;"></i> Trống</td></tr>' : ''}
                            ${resolvedLeaves.map(l => {
                                let statusHtml = l.status === 'approved' ? '<span style="color: var(--success); font-weight: bold;"><i class="fa-solid fa-check"></i> Đã Duyệt</span>' : '<span style="color: var(--danger); font-weight: bold;"><i class="fa-solid fa-times"></i> Từ Chối</span>';
                                return `
                                <tr style="background: rgba(4, 9, 20, 0.8); border-radius: 6px;">
                                    <td style="padding: 12px 16px; color: #fff; font-weight: bold; border-top-left-radius: 6px; border-bottom-left-radius: 6px; border-top: 1px solid rgba(255, 255, 255, 0.2); border-bottom: 1px solid rgba(255, 255, 255, 0.2); border-left: 1px solid rgba(255, 255, 255, 0.2);">${l.username}</td>
                                    <td style="padding: 12px 16px; border-top: 1px solid rgba(255, 255, 255, 0.2); border-bottom: 1px solid rgba(255, 255, 255, 0.2);"><i class="fa-regular fa-calendar" style="margin-right: 6px; color: var(--text-secondary);"></i> ${l.startDate}</td>
                                    <td style="padding: 12px 16px; border-top: 1px solid rgba(255, 255, 255, 0.2); border-bottom: 1px solid rgba(255, 255, 255, 0.2);">${l.days}</td>
                                    <td style="padding: 12px 16px; border-top-right-radius: 6px; border-bottom-right-radius: 6px; border-top: 1px solid rgba(255, 255, 255, 0.2); border-bottom: 1px solid rgba(255, 255, 255, 0.2); border-right: 1px solid rgba(255, 255, 255, 0.2);">${statusHtml}</td>
                                </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
                </div> <!-- End Resolved Block -->
            </div>
        `;

        container.innerHTML = `<div class="cyber-admin-container" style="display: flex; flex-direction: column; gap: 24px; padding-bottom: 40px;">
            <div class="admin-col">
                ${adminHtml}
            </div>
            <div class="admin-col">
                ${leavesHtml}
            </div>
        </div>
        <style>
            .admin-cyber-box {
                background: rgba(10, 20, 35, 0.6) !important;
                border: 1px solid rgba(136, 255, 209, 0.2) !important;
                border-radius: 8px;
            }
            .cyber-hover-table tbody tr:hover {
                background: rgba(255,255,255,0.05) !important;
            }
            .cyber-hover-table th, .cyber-hover-table td {
                vertical-align: middle;
            }
        </style>`;
    },

    handleCheckIn: async () => {
        const user = Auth.currentUser;
        if (!user) return;

        // Yêu cầu Location (GPS) Validation
        const btn = document.getElementById('btn-check-in');
        if (btn) btn.disabled = true; // Ngăn bấm nhiều lần

        if (!navigator.geolocation) {
            Utils.showToast('Trình duyệt của bạn không hỗ trợ định vị GPS để chấm công.', 'error');
            if (btn) btn.disabled = false;
            return;
        }

        Utils.showToast('Đang lấy vị trí GPS...', 'info');
        
        navigator.geolocation.getCurrentPosition(async (position) => {
            await Attendance._processCheckinWithLocation(position.coords.latitude, position.coords.longitude);
        }, async (error) => {
            console.error("Lỗi lấy vị trí:", error);
            // Một số nơi có thể ép buộc phải có GPS mới cho checkin. Tạm thời vẫn cho checkin nhưng lưu là ko có GPS.
            Utils.showToast('Không thể lấy vị trí GPS. Đã ghi nhận chấm công không có vị trí.', 'warning');
            await Attendance._processCheckinWithLocation(null, null);
        }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    },

    _processCheckinWithLocation: async (lat, lng) => {
        const user = Auth.currentUser;
        const now = new Date();
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        
        // Tính toán độ trễ
        const deadline = new Date(now);
        deadline.setHours(Attendance.DEADLINE_HOURS, Attendance.DEADLINE_MINUTES, 0, 0);

        let status = 'on_time';
        let lateMinutes = 0;

        if (now > deadline) {
            status = 'late';
            const diffMs = now - deadline;
            lateMinutes = Math.floor(diffMs / 60000);
            
            // Thông báo lên Bot Telegram nếu đi muộn
            let locStr = lat ? `\n📍 Vị trí: https://google.com/maps?q=${lat},${lng}` : '';
            const msg = `⚠️ <b>[BÁO CÁO ĐI MUỘN]</b>\n👤 Nhân viên: <b>${user.username}</b>\n⏰ Điểm danh lúc: ${now.toLocaleTimeString('vi-VN')}\n⏳ Đi muộn: ${lateMinutes} phút so với giờ quy định (08:30).${locStr}`;
            Utils.notifyTelegram(msg);
        }

        const newRecord = {
            id: 'att_' + Date.now(),
            username: user.username,
            timestamp: now.getTime(),
            dateStr: dateStr,
            status: status,
            lateMinutes: lateMinutes,
            location: lat ? { lat, lng } : null,
            note: ''
        };

        const allData = await Attendance.loadData();
        // Cẩn thận double click
        if (allData.find(r => r.username === user.username && r.dateStr === dateStr)) {
            Utils.showToast('Hôm nay bạn đã điểm danh rồi!', 'info');
            return;
        }

        allData.push(newRecord);
        await Attendance.saveData(allData);

        // Hiệu ứng MÕ và Render lại
        const btn = document.getElementById('btn-check-in');
        if (btn) {
            // Phát tiếng mõ bằng Web Audio API
            try {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                // Tiếng "tốc" của mõ gỗ
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(180, audioCtx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + 0.15);
                gain.gain.setValueAtTime(0.8, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
                osc.connect(gain).connect(audioCtx.destination);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.5);
                // Tiếng vang
                const osc2 = audioCtx.createOscillator();
                const gain2 = audioCtx.createGain();
                osc2.type = 'triangle';
                osc2.frequency.setValueAtTime(120, audioCtx.currentTime + 0.05);
                osc2.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.4);
                gain2.gain.setValueAtTime(0.4, audioCtx.currentTime + 0.05);
                gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
                osc2.connect(gain2).connect(audioCtx.destination);
                osc2.start(audioCtx.currentTime + 0.05);
                osc2.stop(audioCtx.currentTime + 0.8);
            } catch(e) { console.log('Audio not supported'); }

            // Hiệu ứng +1 Công Đức nổi lên
            const floatEl = document.createElement('div');
            floatEl.className = 'cong-duc-float';
            floatEl.innerHTML = '🙏 +1 Công Đức Đi Làm!';
            btn.parentElement.style.position = 'relative';
            btn.parentElement.appendChild(floatEl);
            setTimeout(() => floatEl.remove(), 2000);

            btn.innerHTML = '<div style="font-size:40px;">🪵✅</div><div style="color:#ffd700;font-weight:800;font-size:14px;margin-top:4px;">CÔNG ĐỨC +1</div>';
            btn.style.background = 'radial-gradient(circle, rgba(218,165,32,0.3), rgba(0,0,0,0.5))';
            btn.style.boxShadow = '0 0 40px rgba(255,215,0,0.5)';
            btn.style.borderColor = '#ffd700';
            setTimeout(() => {
                Attendance.render();
            }, 2000);
        } else {
            Attendance.render();
        }
    },

    showLeaveModal: () => {
        document.getElementById('leave-form').reset();
        
        // Đặt mặc định ngày là hôm nay
        const today = new Date();
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        document.getElementById('leave-start-date').value = dateStr;
        
        document.getElementById('leave-modal-overlay').classList.add('active');
    },

    closeLeaveModal: () => {
        document.getElementById('leave-modal-overlay').classList.remove('active');
    },

    submitLeaveRequest: async () => {
        const user = Auth.currentUser;
        if (!user) return;

        const startDate = document.getElementById('leave-start-date').value;
        const days = document.getElementById('leave-days').value;
        const reason = document.getElementById('leave-reason').value;

        if (!startDate || !days || !reason) {
            Utils.showToast("Vui lòng điền đầy đủ thông tin xin nghỉ!", "error");
            return;
        }

        const newLeave = {
            id: 'leave_' + Date.now(),
            username: user.username,
            timestamp: Date.now(),
            startDate: startDate,
            days: parseFloat(days),
            reason: reason,
            status: 'pending' // pending, approved, rejected
        };

        const allLeaves = await Attendance.loadLeaveData();
        allLeaves.push(newLeave);
        await Attendance.saveLeaveData(allLeaves);

        Attendance.closeLeaveModal();
        Utils.showToast("Đã gửi yêu cầu xin nghỉ phép thành công!", "success");

        const msg = `📢 <b>[TỜ TRÌNH XIN NGHỈ PHÉP]</b>\n👤 Nhân viên: <b>${user.username}</b>\n📅 Từ ngày: ${startDate}\n⏳ Số ngày nghỉ: ${days}\n📝 Lý do: <i>${reason}</i>\n\n👉 Sếp vào hệ thống kiểm tra và duyệt nhé!`;
        Utils.notifyTelegram(msg);

        Attendance.render(); // Tải lại view
    },

    updateLeaveStatus: async (leaveId, newStatus) => {
        const actionText = newStatus === 'approved' ? 'DUYỆT' : 'TỪ CHỐI';
        const color = newStatus === 'approved' ? 'var(--success)' : 'var(--danger)';
        
        const isConfirm = await Utils.showConfirm(
            'Xác nhận thao tác', 
            `Bạn có chắc chắn muốn <span style="color: ${color}; font-weight: bold; font-size: 16px;">${actionText}</span> yêu cầu nghỉ phép này?`
        );
        
        if (!isConfirm) return;

        const allLeaves = await Attendance.loadLeaveData();
        const leaveIndex = allLeaves.findIndex(l => l.id === leaveId);
        
        if (leaveIndex > -1) {
            allLeaves[leaveIndex].status = newStatus;
            await Attendance.saveLeaveData(allLeaves);
            Utils.showToast(`Đã ${newStatus === 'approved' ? 'duyệt' : 'từ chối'} yêu cầu thành công!`, "success");
            Attendance.render(); // Tải lại view Admin
        }
    },

    showCheckoutModal: () => {
        document.getElementById('checkout-form').reset();
        document.getElementById('checkout-modal-overlay').classList.add('active');
    },

    closeCheckoutModal: () => {
        document.getElementById('checkout-modal-overlay').classList.remove('active');
    },

    submitCheckout: async () => {
        const user = Auth.currentUser;
        if (!user) return;

        const report = document.getElementById('checkout-report').value.trim();
        if (!report) {
            Utils.showToast("Vui lòng nhập báo cáo công việc!", "error");
            return;
        }

        const now = new Date();
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        
        const allData = await Attendance.loadData();
        const todayRecord = allData.find(r => r.username === user.username && r.dateStr === dateStr);
        
        if (todayRecord) {
            todayRecord.checkoutTimestamp = now.getTime();
            todayRecord.checkoutReport = report;
            await Attendance.saveData(allData);

            // Gửi Telegram EOD Report
            const msg = `✅ <b>[BÁO CÁO CUỐI NGÀY DỰ ÁN]</b>\n👤 Nhân viên: <b>${user.username}</b>\n⏰ Ra về lúc: ${now.toLocaleTimeString('vi-VN')}\n\n📝 <b>Công việc đã hoàn thành:</b>\n${report}`;
            Utils.notifyTelegram(msg);

            Attendance.closeCheckoutModal();
            Utils.showToast("Gửi báo cáo và Ra về thành công!", "success");
            Attendance.render();
        } else {
            Utils.showToast("Không tìm thấy dữ liệu điểm danh ban sáng?", "error");
        }
    },

    exportAttendanceCSV: async () => {
        const allData = await Attendance.loadData();
        const allLeaves = await Attendance.loadLeaveData();
        
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const currentMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
        
        let passedWorkingDays = 0;
        for (let day = 1; day <= now.getDate(); day++) {
             let d = new Date(currentYear, currentMonth, day);
             if (d.getDay() !== 0) passedWorkingDays++;
        }

        const summary = {};
        allData.forEach(r => {
            if (r.dateStr.startsWith(currentMonthPrefix)) {
                if (!summary[r.username]) summary[r.username] = { totalDays: 0, onTime: 0, late: 0, totalLateMinutes: 0 };
                summary[r.username].totalDays++;
                if (r.status === 'on_time') summary[r.username].onTime++;
                else {
                    summary[r.username].late++;
                    summary[r.username].totalLateMinutes += r.lateMinutes || 0;
                }
            }
        });

        const approvedLeaves = {};
        allLeaves.forEach(l => {
            if (l.status === 'approved' && l.startDate.startsWith(currentMonthPrefix)) {
                if (!approvedLeaves[l.username]) approvedLeaves[l.username] = 0;
                approvedLeaves[l.username] += parseFloat(l.days) || 0;
            }
        });

        const accounts = (typeof Auth !== 'undefined' && await Auth.getAccounts()) || [];
        const usersList = accounts.filter(a => a.role !== 'admin').map(a => a.username);
        Object.keys(summary).forEach(u => {
            if (!usersList.includes(u) && u !== 'admin') usersList.push(u);
        });

        // Tạo nội dung CSV (UTF-8 BOM hỗ trợ tiếng Việt)
        let csvContent = "\uFEFF"; // BOM cho Excel
        csvContent += "Tài xế/Nhân viên,Tổng ngày công đã qua,Đã đi làm,Đúng giờ,Vắng,Nghỉ phép duyệt,Đi muộn (lần),Tổng phút đi muộn\n";

        usersList.forEach(u => {
            const s = summary[u] || { totalDays: 0, onTime: 0, late: 0, totalLateMinutes: 0 };
            const leaves = approvedLeaves[u] || 0;
            let absent = passedWorkingDays - s.totalDays - leaves;
            if (absent < 0) absent = 0;
            
            csvContent += `"${u}",${passedWorkingDays},${s.totalDays},${s.onTime},${absent},${leaves},${s.late},${s.totalLateMinutes}\n`;
        });

        // Tải xuống
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', `Bang_Cham_Cong_Thang_${currentMonth + 1}_${currentYear}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
};
