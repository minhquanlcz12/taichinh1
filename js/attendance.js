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

        // Lấy lịch sử 30 ngày gần nhất
        const userHistory = allData.filter(r => r.username === user.username).sort((a,b) => b.timestamp - a.timestamp).slice(0, 30);
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

        container.innerHTML = adminHtml;
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
            alert('Hôm nay bạn đã điểm danh rồi!');
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
    }
};
