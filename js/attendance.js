const Attendance = {
    // Thời hạn chấm công đúng giờ: 08:30 AM
    DEADLINE_HOURS: 8,
    DEADLINE_MINUTES: 30,

    init: () => {
        // Chỉ render khi người dùng click vào tab chấm công (hoặc init lần đầu nếu cần)
    },

    loadData: async () => {
        // Lấy dữ liệu từ DB (Local/Firebase)
        let attendanceData = [];
        try {
            if (window.db && typeof db.getAttendance === 'function') {
                attendanceData = await db.getAttendance() || [];
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
            if (window.db && typeof db.saveAttendance === 'function') {
                await db.saveAttendance(data);
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
            leaveData = JSON.parse(localStorage.getItem('tl_leave_requests') || '[]');
        } catch (e) {
            console.error("Lỗi tải dữ liệu xin nghỉ:", e);
            leaveData = JSON.parse(localStorage.getItem('tl_leave_requests') || '[]');
        }
        return leaveData;
    },

    saveLeaveData: async (data) => {
        try {
            localStorage.setItem('tl_leave_requests', JSON.stringify(data));
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
                    <i class="fa-solid fa-check-circle" style="font-size: 48px; color: var(--success); margin-bottom: 16px;"></i>
                    <h3 style="color: var(--success);">Đã Điểm Danh</h3>
                    <p style="color: var(--text-secondary); margin-top: 8px;">Thời gian: <strong>${new Date(todayRecord.timestamp).toLocaleTimeString('vi-VN')}</strong></p>
                    <p style="margin-top: 8px;">Trạng thái: 
                        <span class="badge ${todayRecord.status === 'on_time' ? 'bg-success' : 'bg-danger'}">
                            ${todayRecord.status === 'on_time' ? 'Đúng giờ' : `Đi muộn ${todayRecord.lateMinutes} phút`}
                        </span>
                    </p>
                </div>
            `;
        } else {
            checkInHtml = `
                <div class="check-in-box">
                    <button id="btn-check-in" class="btn-radar-cyber" onclick="Attendance.handleCheckIn()">
                        <span class="radar-text">ĐIỂM DANH<br>NGAY</span>
                        <div class="radar-ring"></div>
                        <div class="radar-scan"></div>
                    </button>
                    <p style="margin-top: 24px; color: var(--text-secondary);">Nhấp vào vòng tròn để xác nhận có mặt hôm nay.</p>
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
                <h3 style="margin-bottom: 16px; color: var(--primary);">Lịch sử điểm danh (30 ngày)</h3>
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
                                    <td>${new Date(r.timestamp).toLocaleTimeString('vi-VN')}</td>
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
        
        // Phân nhóm theo User và Tháng hiện tại
        const now = new Date();
        const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
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

        const usersList = Object.keys(summary);
        
        let adminHtml = `
            <div class="glass-panel" style="padding: 24px;">
                <h2 style="color: var(--primary); margin-bottom: 24px;"><i class="fa-solid fa-list-check"></i> Tổng hợp Chấm Công (Tháng ${now.getMonth() + 1}/${now.getFullYear()})</h2>
                
                <div class="dashboard-grid" style="margin-bottom: 24px;">
                    <div class="summary-card neon-card-blue">
                        <div class="card-inner">
                            <div class="card-info">
                                <h3>Nhân sự đã điểm danh</h3>
                                <p class="amount">${usersList.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="table-responsive">
                    <table class="tl-table">
                        <thead>
                            <tr>
                                <th>Nhân Viên</th>
                                <th>Tổng ngày công</th>
                                <th>Đúng giờ</th>
                                <th>Đi muộn</th>
                                <th style="color: var(--danger);">Tổng phút muộn</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${usersList.length === 0 ? '<tr><td colspan="5" style="text-align:center;">Chưa có dữ liệu tháng này</td></tr>' : ''}
                            ${usersList.map(u => `
                                <tr>
                                    <td style="font-weight: 600;">${u}</td>
                                    <td><span class="badge bg-primary" style="font-size: 14px;">${summary[u].totalDays}</span></td>
                                    <td style="color: var(--success); font-weight: bold;">${summary[u].onTime}</td>
                                    <td style="color: var(--danger); font-weight: bold;">${summary[u].late}</td>
                                    <td><span style="color: var(--danger); font-weight: 700;">${summary[u].totalLateMinutes} p</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        // Hiển thị danh sách xin nghỉ (Admin)
        const allLeaves = await Attendance.loadLeaveData();
        const pendingLeaves = allLeaves.filter(l => l.status === 'pending').sort((a,b) => a.timestamp - b.timestamp);
        const resolvedLeaves = allLeaves.filter(l => l.status !== 'pending').sort((a,b) => b.timestamp - a.timestamp).slice(0, 20);

        let leavesHtml = `
            <div class="glass-panel" style="padding: 24px; margin-top: 24px;">
                <h2 style="color: var(--warning); margin-bottom: 24px;"><i class="fa-solid fa-envelope-open-text"></i> Danh sách Xin Nghỉ Phép</h2>
                
                <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                    <h3 style="color: var(--primary); margin-bottom: 16px; font-size: 16px; display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-clock-rotate-left"></i> Yêu cầu chờ duyệt (${pendingLeaves.length})
                    </h3>
                    <div class="table-responsive">
                        <table class="tl-table">
                            <thead>
                                <tr>
                                    <th>Nhân Viên</th>
                                    <th>Ngày nghỉ</th>
                                    <th>Số ngày</th>
                                    <th>Lý do</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                            ${pendingLeaves.length === 0 ? '<tr><td colspan="5" style="text-align:center;">Không có yêu cầu chờ duyệt</td></tr>' : ''}
                            ${pendingLeaves.map(l => `
                                <tr>
                                    <td style="font-weight: 600;">${l.username}</td>
                                    <td>${l.startDate}</td>
                                    <td>${l.days}</td>
                                    <td title="${l.reason}" style="max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${l.reason}</td>
                                    <td>
                                        <button class="btn btn-sm btn-success" onclick="Attendance.updateLeaveStatus('${l.id}', 'approved')" style="margin-right: 4px; padding: 4px 12px; display: inline-flex; align-items: center; gap: 6px;"><i class="fa-solid fa-check"></i> Duyệt</button>
                                        <button class="btn btn-sm btn-danger" onclick="Attendance.updateLeaveStatus('${l.id}', 'rejected')" style="padding: 4px 12px; display: inline-flex; align-items: center; gap: 6px;"><i class="fa-solid fa-times"></i> Từ chối</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                </div> <!-- End Pending Block -->
                
                <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 16px;">
                    <h3 style="color: var(--text-secondary); margin-bottom: 16px; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-clock-rotate-left"></i> Lịch sử đã duyệt/từ chối gần đây
                    </h3>
                    <div class="table-responsive">
                        <table class="tl-table">
                            <thead>
                                <tr>
                                    <th>Nhân Viên</th>
                                    <th>Ngày nghỉ</th>
                                    <th>Số ngày</th>
                                    <th>Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                            ${resolvedLeaves.length === 0 ? '<tr><td colspan="4" style="text-align:center;">Trống</td></tr>' : ''}
                            ${resolvedLeaves.map(l => {
                                let statusHtml = l.status === 'approved' ? '<span class="badge bg-success">Đã Duyệt</span>' : '<span class="badge bg-danger">Từ Chối</span>';
                                return `
                                <tr>
                                    <td>${l.username}</td>
                                    <td>${l.startDate}</td>
                                    <td>${l.days}</td>
                                    <td>${statusHtml}</td>
                                </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
                </div> <!-- End Resolved Block -->
            </div>
        `;

        container.innerHTML = adminHtml + leavesHtml;
    },

    handleCheckIn: async () => {
        const user = Auth.currentUser;
        if (!user) return;

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
        }

        const newRecord = {
            id: 'att_' + Date.now(),
            username: user.username,
            timestamp: now.getTime(),
            dateStr: dateStr,
            status: status,
            lateMinutes: lateMinutes,
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

        // Hiệu ứng và Render lại
        const btn = document.getElementById('btn-check-in');
        if (btn) {
            btn.innerHTML = '<i class="fa-solid fa-check" style="font-size:40px; color: #fff;"></i>';
            btn.style.background = 'var(--success)';
            btn.style.boxShadow = '0 0 30px var(--success)';
            setTimeout(() => {
                Attendance.render();
            }, 1000);
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
        Attendance.render(); // Tải lại view
    },

    updateLeaveStatus: async (leaveId, newStatus) => {
        if (!confirm(`Bạn có chắc chắn muốn ${newStatus === 'approved' ? 'DUYỆT' : 'TỪ CHỐI'} yêu cầu này?`)) return;

        const allLeaves = await Attendance.loadLeaveData();
        const leaveIndex = allLeaves.findIndex(l => l.id === leaveId);
        
        if (leaveIndex > -1) {
            allLeaves[leaveIndex].status = newStatus;
            await Attendance.saveLeaveData(allLeaves);
            Utils.showToast(`Đã ${newStatus === 'approved' ? 'duyệt' : 'từ chối'} yêu cầu thành công!`, "success");
            Attendance.render(); // Tải lại view Admin
        }
    }
};
