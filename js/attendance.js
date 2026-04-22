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
            const meritPts = todayRecord.status === 'on_time' ? 2 : 1;
            checkInHtml = `
                <div class="wf-success">
                    <div class="monk-video-container" style="margin: 0 auto 20px; width: fit-content; border-radius: 12px; overflow: hidden; border: 1px solid rgba(218,165,0,0.2); box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                        <video autoplay loop muted playsinline style="width: 100%; max-width: 200px; display: block;">
                            <source src="assets/videos/monk_mo.mp4" type="video/mp4">
                        </video>
                    </div>
                    <div class="wf-success-icon" style="color:#daa520;">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12,2C6.47,2,2,6.47,2,12s4.47,10,10,10,10-4.47,10-10S17.53,2,12,2Zm0,18c-4.41,0-8-3.59-8-8s3.59-8,8-8,8,3.59,8,8-3.59,8-8,8ZM11,7h2v6h-2V7Zm0,8h2v2h-2v-2Z" opacity=".3"/>
                            <path d="M12,4c-4.42,0-8,3.58-8,8s3.58,8,8,8,8-3.58,8-8-3.58-8-8-8Zm0,14c-3.31,0-6-2.69-6-6s2.69-6,6-6,6,2.69,6,6-2.69,6-6,6Z"/>
                            <circle cx="12" cy="12" r="3" />
                        </svg>
                    </div>
                    <h3><i class="fa-solid fa-circle-check" style="color:#2ecc71;margin-right:8px;"></i> Công đức hôm nay đã ghi nhận</h3>
                    <p>Gõ mõ lúc: <strong style="color:#daa520;">${new Date(todayRecord.timestamp).toLocaleTimeString('vi-VN')}</strong></p>
                    ${todayRecord.location ? `<p style="font-size:12px;"><i class="fa-solid fa-location-dot" style="color:#daa520;"></i> GPS xác minh vị trí tại công ty</p>` : ''}
                    <span class="wf-badge ${todayRecord.status === 'on_time' ? 'on-time' : 'late'}">
                        ${todayRecord.status === 'on_time' ? `🏆 Đúng giờ — Công đức +${meritPts}` : `⏰ Muộn ${todayRecord.lateMinutes}p — Công đức +${meritPts}`}
                    </span>
                </div>
            `;
            if (!todayRecord.checkoutTimestamp) {
                checkInHtml += `
                <div style="text-align:center;margin-top:20px;">
                    <button class="btn" style="background:#daa520;color:#000;padding:12px 24px;font-weight:bold;border-radius:30px;box-shadow:0 4px 15px rgba(218,165,32,0.4);" onclick="Attendance.showCheckoutModal()">
                        <i class="fa-solid fa-person-walking-arrow-right" style="margin-right:8px;"></i> CHECK-OUT
                    </button>
                    <p style="color:var(--text-secondary);font-size:12px;margin-top:8px;">Báo cáo EOD trước khi kết thúc ngày.</p>
                </div>`;
            } else {
                checkInHtml += `
                <div class="glass-panel" style="margin-top:20px;padding:16px;border-color:rgba(218,165,32,0.2);">
                    <h4 style="color:#daa520;margin-bottom:8px;"><i class="fa-solid fa-clipboard-check"></i> Hoàn thành ngày làm việc</h4>
                    <p style="color:var(--text-secondary);font-size:13px;margin:0;">Ra về lúc: <strong>${new Date(todayRecord.checkoutTimestamp).toLocaleTimeString('vi-VN')}</strong></p>
                </div>`;
            }
        } else {
            checkInHtml = `
                <div class="check-in-box" style="text-align: center;">
                    <div class="monk-video-container" style="margin: 0 auto 24px; width: fit-content; border-radius: 16px; overflow: hidden; border: 2px solid rgba(218,165,32,0.2); box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                        <video autoplay loop muted playsinline style="width: 100%; max-width: 280px; display: block;">
                            <source src="assets/videos/monk_mo.mp4" type="video/mp4">
                        </video>
                    </div>
                    <button id="btn-check-in" class="wf-assembly" data-state="idle" type="button"
                            aria-label="Gõ mõ điểm danh" onclick="Attendance.handleCheckIn()">
                        <div class="wf-aura"></div>
                        <div class="wf-body"><div class="wf-body-img"></div></div>
                        <div class="wf-mallet">
                            <div class="wf-mallet-handle"></div>
                            <div class="wf-mallet-head"></div>
                        </div>
                        <div class="wf-impact-ring"></div>
                        <span class="wf-particle" style="top:45%;left:30%;--wf-p-dir:translate(-30px,-25px)"></span>
                        <span class="wf-particle" style="top:35%;left:55%;--wf-p-dir:translate(10px,-35px)"></span>
                        <span class="wf-particle" style="top:55%;left:65%;--wf-p-dir:translate(25px,15px)"></span>
                        <span class="wf-particle" style="top:60%;left:35%;--wf-p-dir:translate(-20px,20px)"></span>
                        <span class="wf-particle" style="top:30%;left:40%;--wf-p-dir:translate(-15px,-30px)"></span>
                        <span class="wf-particle" style="top:50%;left:70%;--wf-p-dir:translate(30px,-5px)"></span>
                        <div class="wf-cong-duc"><i class="fa-solid fa-hands-praying"></i> +1 Công Đức Đi Làm</div>
                        <span class="wf-label"><i class="fa-solid fa-gavel" style="margin-right:6px;"></i> GÕ MÕ ĐIỂM DANH</span>
                    </button>
                    <p style="margin-top:28px;color:#daa520;font-weight:600;font-size:14px;">🙏 Gõ mõ để tích công đức đi làm hôm nay!</p>
                    <small style="color:rgba(255,255,255,0.35);display:block;margin-top:6px;"><i class="fa-solid fa-location-dot" style="color:#daa520;"></i> GPS xác minh vị trí tại công ty</small>
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
        const totalMerit = userHistory.reduce((acc, r) => acc + (r.status === 'on_time' ? 2 : 1), 0);
        let historyHtml = `
            <div class="wf-history-panel">
                <h3><i class="fa-solid fa-scroll" style="margin-right:8px;"></i> Sổ Công Đức <span class="wf-stat">Tích lũy: ${totalMerit} công đức</span></h3>
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
                            ${userHistory.length === 0 ? '<tr><td colspan="3" style="text-align:center;color:rgba(218,165,32,0.3);">Chưa có công đức nào</td></tr>' : ''}
                            ${userHistory.map(r => {
                                const pts = r.status === 'on_time' ? 2 : 1;
                                return `
                                <tr>
                                    <td>${r.dateStr}</td>
                                    <td>${new Date(r.timestamp).toLocaleTimeString('vi-VN')} ${r.checkoutTimestamp ? `<br><small style="color:#2ecc71">Ra: ${new Date(r.checkoutTimestamp).toLocaleTimeString('vi-VN')}</small>` : ''}</td>
                                    <td>
                                        <span class="badge ${r.status === 'on_time' ? 'bg-success' : 'bg-danger'}">
                                            ${r.status === 'on_time' ? 'Đúng giờ' : `Muộn ${r.lateMinutes}p`}
                                        </span>
                                        <span class="wf-merit-badge">+${pts}</span>
                                    </td>
                                </tr>
                            `}).join('')}
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
                <div class="glass-header" style="text-align: center; margin-bottom: 24px; padding: 15px 20px; background: rgba(218,165,32,0.05); border-radius: 12px; border: 1px solid rgba(218,165,32,0.1);">
                    <div>
                        <h2 style="color:#daa520; margin:0; font-size: 18px;"><i class="fa-solid fa-user-check"></i> CHẤM CÔNG HÀNG NGÀY</h2>
                        <p style="font-size:12px; color:var(--text-secondary); margin:4px 0 0;">Hạn chốt: <span style="color:var(--warning);font-weight:bold;">08:30 AM</span></p>
                    </div>
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
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-success" onclick="Attendance.exportAttendanceCSV()"><i class="fa-solid fa-file-excel" style="margin-right: 6px;"></i> Excel</button>
                        <button class="btn btn-outline" style="border-color: #f1c40f; color: #f1c40f;" onclick="Attendance.exportAttendancePDF()"><i class="fa-solid fa-file-pdf" style="margin-right: 6px;"></i> PDF</button>
                    </div>
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

    /* --- Wooden Fish Sound Engine --- */
    _playWoodenFishSound: () => {
        // Try real audio file first, fall back to Web Audio synthesis
        const tryFile = new Audio('sounds/wooden-fish-hit.mp3');
        tryFile.volume = 0.7;
        const filePromise = tryFile.play().catch(() => null);
        filePromise.then(result => {
            if (result === null) {
                // File not available or blocked — synthesize
                try {
                    const ctx = new (window.AudioContext || window.webkitAudioContext)();
                    const t = ctx.currentTime;
                    // Deep "tok"
                    const o1 = ctx.createOscillator(); const g1 = ctx.createGain();
                    o1.type = 'sine';
                    o1.frequency.setValueAtTime(200, t);
                    o1.frequency.exponentialRampToValueAtTime(55, t + 0.12);
                    g1.gain.setValueAtTime(0.9, t);
                    g1.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
                    o1.connect(g1).connect(ctx.destination);
                    o1.start(t); o1.stop(t + 0.4);
                    // Resonance
                    const o2 = ctx.createOscillator(); const g2 = ctx.createGain();
                    o2.type = 'triangle';
                    o2.frequency.setValueAtTime(130, t + 0.04);
                    o2.frequency.exponentialRampToValueAtTime(35, t + 0.35);
                    g2.gain.setValueAtTime(0.35, t + 0.04);
                    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
                    o2.connect(g2).connect(ctx.destination);
                    o2.start(t + 0.04); o2.stop(t + 0.7);
                } catch(e) { /* Audio fully unsupported */ }
            }
        });
    },

    handleCheckIn: async () => {
        const user = Auth.currentUser;
        if (!user) return;

        const btn = document.getElementById('btn-check-in');
        if (!btn || btn.dataset.state === 'animating' || btn.dataset.state === 'loading') return;

        // --- State: loading ---
        btn.dataset.state = 'loading';
        const label = btn.querySelector('.wf-label');
        if (label) label.textContent = '📍 Đang lấy GPS...';

        if (!navigator.geolocation) {
            Utils.showToast('Trình duyệt không hỗ trợ GPS.', 'error');
            btn.dataset.state = 'idle';
            if (label) label.textContent = '🪵 GÕ MÕ ĐIỂM DANH';
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (pos) => Attendance._runCheckin(pos.coords.latitude, pos.coords.longitude),
            async () => {
                Utils.showToast('GPS không khả dụng. Chấm công không vị trí.', 'warning');
                Attendance._runCheckin(null, null);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    },

    _runCheckin: async (lat, lng) => {
        const user = Auth.currentUser;
        const btn = document.getElementById('btn-check-in');
        const now = new Date();
        const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

        const deadline = new Date(now);
        deadline.setHours(Attendance.DEADLINE_HOURS, Attendance.DEADLINE_MINUTES, 0, 0);

        let status = 'on_time', lateMinutes = 0;
        if (now > deadline) {
            status = 'late';
            lateMinutes = Math.floor((now - deadline) / 60000);
            const locStr = lat ? `\n📍 https://google.com/maps?q=${lat},${lng}` : '';
            Utils.notifyTelegram(`⚠️ <b>[ĐI MUỘN]</b>\n👤 ${user.username}\n⏰ ${now.toLocaleTimeString('vi-VN')}\n⏳ Muộn ${lateMinutes}p${locStr}`);
        }

        const newRecord = {
            id: 'att_' + Date.now(), username: user.username,
            timestamp: now.getTime(), dateStr, status, lateMinutes,
            location: lat ? { lat, lng } : null, note: ''
        };

        try {
            const allData = await Attendance.loadData();
            if (allData.find(r => r.username === user.username && r.dateStr === dateStr)) {
                Utils.showToast('Hôm nay đã điểm danh rồi!', 'info');
                if (btn) btn.dataset.state = 'idle';
                return;
            }
            allData.push(newRecord);
            await Attendance.saveData(allData);
        } catch (err) {
            Utils.showToast('Lỗi lưu dữ liệu. Thử lại!', 'error');
            if (btn) {
                btn.dataset.state = 'idle';
                const l = btn.querySelector('.wf-label');
                if (l) l.textContent = '🪵 GÕ MÕ ĐIỂM DANH';
            }
            return;
        }

        // --- State: animating ---
        if (!btn) { Attendance.render(); return; }
        btn.dataset.state = 'animating';
        const label = btn.querySelector('.wf-label');
        if (label) label.textContent = 'Đang gõ mõ...';

        // Play sound at impact moment (~200ms into the mallet swing)
        setTimeout(() => Attendance._playWoodenFishSound(), 200);

        // Trigger impact ring
        setTimeout(() => {
            const ring = btn.querySelector('.wf-impact-ring');
            if (ring) { ring.classList.add('active'); setTimeout(() => ring.classList.remove('active'), 700); }
        }, 220);

        // Trigger particles
        setTimeout(() => {
            btn.querySelectorAll('.wf-particle').forEach(p => {
                p.classList.add('active');
                setTimeout(() => p.classList.remove('active'), 800);
            });
        }, 250);

        // Float +1 Công Đức
        setTimeout(() => {
            const cd = btn.querySelector('.wf-cong-duc');
            if (cd) { cd.classList.add('active'); setTimeout(() => cd.classList.remove('active'), 1500); }
        }, 300);

        // After animation, show success
        setTimeout(() => {
            if (label) label.textContent = 'Công Đức +1';
            btn.dataset.state = 'success';
            setTimeout(() => Attendance.render(), 1200);
        }, 900);
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
    },

    exportAttendancePDF: async () => {
        Utils.showToast("Đang tạo PDF Chấm Công...", "info");
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const currentMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

        const allData = await Attendance.loadData();
        const allLeaves = await Attendance.loadLeaveData();
        const accounts = (typeof Auth !== 'undefined' && await Auth.getAccounts()) || [];
        const usersList = accounts.filter(a => a.role !== 'admin').map(a => a.username);

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
                else { summary[r.username].late++; summary[r.username].totalLateMinutes += r.lateMinutes || 0; }
            }
        });

        const approvedLeaves = {};
        allLeaves.forEach(l => {
            if (l.status === 'approved' && l.startDate && l.startDate.startsWith(currentMonthPrefix)) {
                if (!approvedLeaves[l.username]) approvedLeaves[l.username] = 0;
                approvedLeaves[l.username] += parseFloat(l.days) || 0;
            }
        });

        const clone = document.createElement('div');
        clone.style.cssText = 'padding:30px;background:#fff;color:#000;font-family:Arial,sans-serif;';
        const today = now.toLocaleDateString('vi-VN');

        let rowsHtml = usersList.map(u => {
            const s = summary[u] || { totalDays: 0, onTime: 0, late: 0, totalLateMinutes: 0 };
            const leaves = approvedLeaves[u] || 0;
            let absent = passedWorkingDays - s.totalDays - leaves;
            if (absent < 0) absent = 0;
            return `<tr>
                <td style="padding:10px;border:1px solid #d1d5db;font-weight:bold;">${u}</td>
                <td style="padding:10px;border:1px solid #d1d5db;text-align:center;">${passedWorkingDays}</td>
                <td style="padding:10px;border:1px solid #d1d5db;text-align:center;">${s.totalDays}</td>
                <td style="padding:10px;border:1px solid #d1d5db;text-align:center;color:#10b981;">${s.onTime}</td>
                <td style="padding:10px;border:1px solid #d1d5db;text-align:center;color:#ef4444;">${absent}</td>
                <td style="padding:10px;border:1px solid #d1d5db;text-align:center;color:#3b82f6;">${leaves}</td>
                <td style="padding:10px;border:1px solid #d1d5db;text-align:center;color:#f59e0b;">${s.late}</td>
                <td style="padding:10px;border:1px solid #d1d5db;text-align:center;">${s.totalLateMinutes}p</td>
            </tr>`;
        }).join('');

        clone.innerHTML = `
            <div style="text-align:center;margin-bottom:30px;border-bottom:2px solid #da251d;padding-bottom:20px;">
                <h1 style="color:#da251d;margin-bottom:5px;">THANH LONG WORK</h1>
                <h3>BẢNG CHẤM CÔNG TỔNG HỢP</h3>
                <p>Tháng ${currentMonth + 1}/${currentYear} &bull; Ngày xuất: ${today}</p>
            </div>
            <table style="width:100%;border-collapse:collapse;margin-bottom:40px;font-size:13px;">
                <thead><tr style="background:#f3f4f6;">
                    <th style="padding:10px;border:1px solid #d1d5db;">Nhân viên</th>
                    <th style="padding:10px;border:1px solid #d1d5db;text-align:center;">Ngày công</th>
                    <th style="padding:10px;border:1px solid #d1d5db;text-align:center;">Đi làm</th>
                    <th style="padding:10px;border:1px solid #d1d5db;text-align:center;">Đúng giờ</th>
                    <th style="padding:10px;border:1px solid #d1d5db;text-align:center;">Vắng</th>
                    <th style="padding:10px;border:1px solid #d1d5db;text-align:center;">Nghỉ phép</th>
                    <th style="padding:10px;border:1px solid #d1d5db;text-align:center;">Muộn</th>
                    <th style="padding:10px;border:1px solid #d1d5db;text-align:center;">Phút trễ</th>
                </tr></thead>
                <tbody>${rowsHtml}</tbody>
            </table>
            <div style="display:flex;justify-content:flex-end;margin-top:50px;text-align:center;">
                <div style="width:250px;position:relative;">
                    <p style="font-weight:bold;margin-bottom:15px;">Giám Đốc</p>
                    <div style="margin:0 auto;width:160px;height:160px;">
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
                    <p style="margin-top:10px;font-weight:bold;">ĐÀO THANH LONG</p>
                </div>
            </div>`;

        html2pdf().set({
            margin: 0.5, filename: `Bang_Cham_Cong_T${currentMonth+1}_${currentYear}.pdf`,
            image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
        }).from(clone).save().then(() => {
            Utils.showToast("Đã xuất Bảng Chấm Công ra PDF!", "success");
        }).catch(e => {
            console.error(e);
            Utils.showToast("Lỗi xuất PDF", "error");
        });
    }
};
