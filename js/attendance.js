const Attendance = {
    // Thá»i háº¡n cháº¥m cÃ´ng Ä‘Ãºng giá»: 08:30 AM
    DEADLINE_HOURS: 8,
    DEADLINE_MINUTES: 30,

    init: () => {
        // Chá»‰ render khi ngÆ°á»i dÃ¹ng click vÃ o tab cháº¥m cÃ´ng (hoáº·c init láº§n Ä‘áº§u náº¿u cáº§n)
    },

    loadData: async () => {
        let attendanceData = [];
        try {
            if (typeof DB !== 'undefined' && typeof DB.getAttendance === 'function') {
                attendanceData = await DB.getAttendance() || [];
                // Äá»“ng bá»™ má»“ cÃ´i tá»« LocalStorage lá»¡ lÆ°u lÃºc chÆ°a update
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
            console.error("Lá»—i táº£i dá»¯ liá»‡u cháº¥m cÃ´ng:", e);
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
            console.error("Lá»—i lÆ°u dá»¯ liá»‡u cháº¥m cÃ´ng:", e);
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
                // Äá»“ng bá»™ rÃ¡c tá»« LocalStorage
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
            console.error("Lá»—i táº£i dá»¯ liá»‡u xin nghá»‰:", e);
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
            console.error("Lá»—i lÆ°u dá»¯ liá»‡u xin nghá»‰:", e);
            localStorage.setItem('tl_leave_requests', JSON.stringify(data));
        }
    },

    renderUserView: async (container, user) => {
        const today = new Date();
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const allData = await Attendance.loadData();
        
        // Kiá»ƒm tra xem hÃ´m nay Ä‘Ã£ cháº¥m cÃ´ng chÆ°a
        const todayRecord = allData.find(r => r.username === user.username && r.dateStr === dateStr);
        let checkInHtml = '';

        if (todayRecord) {
            const meritPts = todayRecord.status === 'on_time' ? 2 : 1;
            checkInHtml = `
                <div class="wf-success">
                    <div class="wf-success-icon" style="color:#daa520;">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12,2C6.47,2,2,6.47,2,12s4.47,10,10,10,10-4.47,10-10S17.53,2,12,2Zm0,18c-4.41,0-8-3.59-8-8s3.59-8,8-8,8,3.59,8,8-3.59,8-8,8ZM11,7h2v6h-2V7Zm0,8h2v2h-2v-2Z" opacity=".3"/>
                            <path d="M12,4c-4.42,0-8,3.58-8,8s3.58,8,8,8,8-3.58,8-8-3.58-8-8-8Zm0,14c-3.31,0-6-2.69-6-6s2.69-6,6-6,6,2.69,6,6-2.69,6-6,6Z"/>
                            <circle cx="12" cy="12" r="3" />
                        </svg>
                    </div>
                    <h3><i class="fa-solid fa-circle-check" style="color:#2ecc71;margin-right:8px;"></i> CÃ´ng Ä‘á»©c hÃ´m nay Ä‘Ã£ ghi nháº­n</h3>
                    <p>GÃµ mÃµ lÃºc: <strong style="color:#daa520;">${new Date(todayRecord.timestamp).toLocaleTimeString('vi-VN')}</strong></p>
                    ${todayRecord.location ? `<p style="font-size:12px;"><i class="fa-solid fa-location-dot" style="color:#daa520;"></i> GPS xÃ¡c minh vá»‹ trÃ­ táº¡i cÃ´ng ty</p>` : ''}
                    <span class="wf-badge ${todayRecord.status === 'on_time' ? 'on-time' : 'late'}">
                        ${todayRecord.status === 'on_time' ? `ðŸ† ÄÃºng giá» â€” CÃ´ng Ä‘á»©c +${meritPts}` : `â° Muá»™n ${todayRecord.lateMinutes}p â€” CÃ´ng Ä‘á»©c +${meritPts}`}
                    </span>
                </div>
            `;
            if (!todayRecord.checkoutTimestamp) {
                checkInHtml += `
                <div style="text-align:center;margin-top:20px;">
                    <button class="btn" style="background:var(--info);color:#fff;padding:12px 24px;font-weight:bold;border-radius:30px;box-shadow:0 4px 15px rgba(0,240,255,0.3);" onclick="Attendance.showCheckoutModal()">
                        <i class="fa-solid fa-person-walking-arrow-right" style="margin-right:8px;"></i> CHECK-OUT
                    </button>
                    <p style="color:var(--text-secondary);font-size:12px;margin-top:8px;">BÃ¡o cÃ¡o EOD trÆ°á»›c khi káº¿t thÃºc ngÃ y.</p>
                </div>`;
            } else {
                checkInHtml += `
                <div class="glass-panel" style="margin-top:20px;padding:16px;border-color:rgba(218,165,32,0.2);">
                    <h4 style="color:#daa520;margin-bottom:8px;"><i class="fa-solid fa-clipboard-check"></i> HoÃ n thÃ nh ngÃ y lÃ m viá»‡c</h4>
                    <p style="color:var(--text-secondary);font-size:13px;margin:0;">Ra vá» lÃºc: <strong>${new Date(todayRecord.checkoutTimestamp).toLocaleTimeString('vi-VN')}</strong></p>
                </div>`;
            }
        } else {
            checkInHtml = `
                <div class="check-in-box">
                    <button id="btn-check-in" class="wf-assembly" data-state="idle" type="button"
                            aria-label="GÃµ mÃµ Ä‘iá»ƒm danh" onclick="Attendance.handleCheckIn()">
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
                        <div class="wf-cong-duc"><i class="fa-solid fa-hands-praying"></i> +1 CÃ´ng Äá»©c Äi LÃ m</div>
                        <span class="wf-label"><i class="fa-solid fa-gavel" style="margin-right:6px;"></i> GÃ• MÃ• ÄIá»‚M DANH</span>
                    </button>
                    <p style="margin-top:28px;color:#daa520;font-weight:600;font-size:14px;">ðŸ™ GÃµ mÃµ Ä‘á»ƒ tÃ­ch cÃ´ng Ä‘á»©c Ä‘i lÃ m hÃ´m nay!</p>
                    <small style="color:rgba(255,255,255,0.35);display:block;margin-top:6px;"><i class="fa-solid fa-location-dot" style="color:#daa520;"></i> GPS xÃ¡c minh vá»‹ trÃ­ táº¡i cÃ´ng ty</small>
                </div>
            `;
        }

        // LuÃ´n hiá»ƒn thá»‹ nÃºt xin nghá»‰ phÃ©p
        checkInHtml += `
            <div style="text-align: center; margin-top: 24px; padding-top: 24px; border-top: 1px dashed rgba(255,255,255,0.1);">
                <button class="btn btn-outline" style="border-color: var(--warning); color: var(--warning);" onclick="Attendance.showLeaveModal()">
                    <i class="fa-solid fa-calendar-minus" style="margin-right: 6px;"></i>ÄÄƒng kÃ½ Xin Nghá»‰ PhÃ©p
                </button>
            </div>
        `;

        // Láº¥y lá»‹ch sá»­ 30 ngÃ y gáº§n nháº¥t
        const userHistory = allData.filter(r => r.username === user.username).sort((a,b) => b.timestamp - a.timestamp).slice(0, 30);
        
        // Láº¥y lá»‹ch sá»­ xin nghá»‰
        const allLeaves = await Attendance.loadLeaveData();
        const userLeaves = allLeaves.filter(l => l.username === user.username).sort((a,b) => b.timestamp - a.timestamp);
        const totalMerit = userHistory.reduce((acc, r) => acc + (r.status === 'on_time' ? 2 : 1), 0);
        let historyHtml = `
            <div class="wf-history-panel">
                <h3><i class="fa-solid fa-scroll" style="margin-right:8px;"></i> Sá»• CÃ´ng Äá»©c <span class="wf-stat">TÃ­ch lÅ©y: ${totalMerit} cÃ´ng Ä‘á»©c</span></h3>
                <div class="table-responsive">
                    <table class="tl-table">
                        <thead>
                            <tr>
                                <th>NgÃ y</th>
                                <th>Thá»i gian</th>
                                <th>Tráº¡ng thÃ¡i</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${userHistory.length === 0 ? '<tr><td colspan="3" style="text-align:center;color:rgba(218,165,32,0.3);">ChÆ°a cÃ³ cÃ´ng Ä‘á»©c nÃ o</td></tr>' : ''}
                            ${userHistory.map(r => {
                                const pts = r.status === 'on_time' ? 2 : 1;
                                return `
                                <tr>
                                    <td>${r.dateStr}</td>
                                    <td>${new Date(r.timestamp).toLocaleTimeString('vi-VN')} ${r.checkoutTimestamp ? `<br><small style="color:#2ecc71">Ra: ${new Date(r.checkoutTimestamp).toLocaleTimeString('vi-VN')}</small>` : ''}</td>
                                    <td>
                                        <span class="badge ${r.status === 'on_time' ? 'bg-success' : 'bg-danger'}">
                                            ${r.status === 'on_time' ? 'ÄÃºng giá»' : `Muá»™n ${r.lateMinutes}p`}
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
                <h3 style="margin-bottom: 16px; color: var(--warning);">Lá»‹ch sá»­ Xin nghá»‰ phÃ©p</h3>
                <div class="table-responsive">
                    <table class="tl-table">
                        <thead>
                            <tr>
                                <th>NgÃ y nghá»‰</th>
                                <th>Sá»‘ ngÃ y</th>
                                <th>LÃ½ do</th>
                                <th>Tráº¡ng thÃ¡i</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${userLeaves.length === 0 ? '<tr><td colspan="4" style="text-align:center;">ChÆ°a cÃ³ yÃªu cáº§u xin nghá»‰</td></tr>' : ''}
                            ${userLeaves.map(l => {
                                let statusHtml = '';
                                if (l.status === 'pending') statusHtml = '<span class="badge bg-warning" style="color: #000;">Chá» Duyá»‡t</span>';
                                else if (l.status === 'approved') statusHtml = '<span class="badge bg-success">ÄÃ£ Duyá»‡t</span>';
                                else if (l.status === 'rejected') statusHtml = '<span class="badge bg-danger">Tá»« Chá»‘i</span>';
                                
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
                                <div class="glass-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 24px; padding: 15px 20px; background: rgba(255,165,0,0.05); border-radius: 12px; border: 1px solid rgba(255,165,0,0.1);">
                    <div>
                        <h2 style="color:var(--primary); margin:0; font-size: 18px;"><i class="fa-solid fa-user-check"></i> CHáº¤M CÃ”NG HÃ€NG NGÃ€Y</h2>
                        <p style="font-size:12px; color:var(--text-secondary); margin:4px 0 0;">Háº¡n chá»‘t: <span style="color:var(--warning);font-weight:bold;">08:30 AM</span></p>
                    </div>
                    <div style="display:flex; align-items:center; gap:12px;">
                        <span style="font-size:11px; color:#daa520; font-weight:600;"><i class="fa-solid fa-music"></i> NHáº C Ná»€N CHÃ™A</span>
                        <label class="switch">
                            <input type="checkbox" id="wf-ambient-toggle" onchange="AttendanceMusic.toggle(this.checked)">
                            <span class="slider round"></span>
                        </label>
                    </div>
                </div>
                <div style="display:none;">
                    <h2 style="color: var(--primary); text-transform: uppercase; letter-spacing: 2px;">Cháº¥m CÃ´ng HÃ ng NgÃ y</h2>
                    <p style="color: var(--text-secondary);">Háº¡n chÃ³t: <strong>08:30 AM</strong></p>
                </div>
                ${checkInHtml}
                ${historyHtml}
            </div>
        `;
    },

    renderAdminView: async (container) => {
        const allData = await Attendance.loadData();
        const allLeaves = await Attendance.loadLeaveData();
        
        // PhÃ¢n nhÃ³m theo User vÃ  ThÃ¡ng hiá»‡n táº¡i
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const currentMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
        
        // TÃ­nh sá»‘ ngÃ y lÃ m viá»‡c Ä‘Ã£ qua trong thÃ¡ng (Loáº¡i trá»« Chá»§ nháº­t)
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

        // Láº¥y táº¥t cáº£ user tá»« DB (loáº¡i admin) Ä‘á»ƒ hiá»ƒn thá»‹ ká»ƒ cáº£ khi chÆ°a Ä‘iá»ƒm danh
        const accounts = (typeof Auth !== 'undefined' && await Auth.getAccounts()) || [];
        const usersList = accounts.filter(a => a.role !== 'admin').map(a => a.username);
        
        // Cá»© thÃªm user cÃ³ dá»¯ liá»‡u Ä‘iá»ƒm danh lá»¡ nhÆ° tÃ i khoáº£n bá»‹ xoÃ¡
        Object.keys(summary).forEach(u => {
            if (!usersList.includes(u) && u !== 'admin') usersList.push(u);
        });
        
        let adminHtml = `
            <div class="glass-panel admin-cyber-box" style="padding: 24px; border: 1px solid rgba(100, 255, 218, 0.5); box-shadow: 0 0 10px rgba(100, 255, 218, 0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h2 style="color: var(--primary); font-size: 18px; letter-spacing: 1px; display: flex; align-items: center; gap: 8px; margin: 0;">
                        <i class="fa-solid fa-list-check"></i> Tá»•ng há»£p Cháº¥m CÃ´ng (ThÃ¡ng ${now.getMonth() + 1}/${now.getFullYear()})
                    </h2>
                    <button class="btn btn-success" onclick="Attendance.exportAttendanceCSV()"><i class="fa-solid fa-file-excel" style="margin-right: 6px;"></i> Xuáº¥t Excel</button>
                </div>
                
                <div style="display: flex; gap: 24px; align-items: stretch;">
                    <!-- Cá»¥c NhÃ¢n sá»± bÃªn trÃ¡i -->
                    <div style="width: 200px; flex-shrink: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; border-radius: 12px; background: rgba(10, 25, 40, 0.8); border: 2px solid #5ab9ea; box-shadow: 0 0 15px rgba(90, 185, 234, 0.3), inset 0 0 20px rgba(90, 185, 234, 0.1); position: relative; overflow: hidden;">
                        <!-- ThÃªm thanh sÃ¡ng bÃªn dÆ°á»›i giá»‘ng thiáº¿t káº¿ -->
                        <div style="position: absolute; bottom: 0; width: 60px; height: 4px; background: #5ab9ea; border-top-left-radius: 4px; border-top-right-radius: 4px; box-shadow: 0 0 8px #5ab9ea;"></div>
                        <div class="card-inner" style="text-align: center; padding: 20px;">
                            <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 8px;">NhÃ¢n sá»± Ä‘Ã£ Ä‘iá»ƒm danh</p>
                            <h2 style="color: #5ab9ea; font-size: 56px; font-weight: bold; text-shadow: 0 0 20px rgba(90, 185, 234, 0.6);">${usersList.length}</h2>
                        </div>
                    </div>
                
                    <!-- Báº£ng thá»‘ng kÃª bÃªn pháº£i -->
                    <div class="table-responsive" style="flex: 1;">
                        <table class="tl-table cyber-hover-table" style="margin: 0; border-collapse: separate; border-spacing: 0 8px;">
                            <thead>
                                <tr>
                                    <th style="color: #64ffda; border: none; padding-bottom: 8px; font-weight: 500;">NhÃ¢n ViÃªn</th>
                                    <th style="color: #64ffda; border: none; padding-bottom: 8px; font-weight: 500;">Tá»•ng ngÃ y cÃ´ng</th>
                                    <th style="color: var(--success); border: none; padding-bottom: 8px; font-weight: 500;"><i class="fa-regular fa-calendar-check" style="margin-right: 4px;"></i> 1 CÃ´ng</th>
                                    <th style="color: var(--danger); border: none; padding-bottom: 8px; font-weight: 500;"><i class="fa-regular fa-clock" style="margin-right: 4px;"></i> Váº¯ng</th>
                                    <th style="color: var(--danger); border: none; padding-bottom: 8px; font-weight: 500;"><i class="fa-regular fa-clock" style="margin-right: 4px;"></i> Muá»™n</th>
                                    <th style="color: #64ffda; border: none; padding-bottom: 8px; font-weight: 500;">Tá»•ng phÃºt</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${usersList.length === 0 ? '<tr><td colspan="6" style="text-align:center; padding: 16px;">ChÆ°a cÃ³ dá»¯ liá»‡u thÃ¡ng nÃ y</td></tr>' : ''}
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
                                            ${leaves > 0 ? `<br><small style="color:var(--warning);font-size:10px;font-style:italic;">(Nghá»‰ phÃ©p: ${leaves})</small>` : ''}
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
        
        // Hiá»ƒn thá»‹ danh sÃ¡ch xin nghá»‰ (Admin) â€” reuse allLeaves from line 260
        const pendingLeaves = allLeaves.filter(l => l.status === 'pending').sort((a,b) => a.timestamp - b.timestamp);
        const resolvedLeaves = allLeaves.filter(l => l.status !== 'pending').sort((a,b) => b.timestamp - a.timestamp).slice(0, 20);

        let leavesHtml = `
            <div class="glass-panel admin-cyber-box" style="padding: 24px; height: 100%; border: 1px solid rgba(255, 255, 255, 0.2);">
                <h2 style="color: var(--warning); margin-bottom: 24px; font-size: 18px; letter-spacing: 1px; display: flex; align-items: center; gap: 8px;">
                    <i class="fa-solid fa-wallet"></i> Danh sÃ¡ch Xin Nghá»‰ PhÃ©p
                </h2>
                
                <div style="background: rgba(4, 9, 20, 0.5); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                    <h3 style="color: var(--warning); margin-bottom: 16px; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-clock-rotate-left"></i> YÃªu cáº§u chá» duyá»‡t (${pendingLeaves.length})
                    </h3>
                    <div class="table-responsive">
                        <table class="tl-table cyber-hover-table" style="border-collapse: separate; border-spacing: 0 6px;">
                            <thead>
                                <tr>
                                    <th style="color: var(--text-secondary); font-weight: 500; border: none; padding-bottom: 8px;">NhÃ¢n ViÃªn</th>
                                    <th style="color: var(--text-secondary); font-weight: 500; border: none; padding-bottom: 8px;">NgÃ y nghá»‰</th>
                                    <th style="color: var(--text-secondary); font-weight: 500; border: none; padding-bottom: 8px;">Sá»‘ ngÃ y</th>
                                    <th style="color: var(--text-secondary); font-weight: 500; border: none; padding-bottom: 8px;">LÃ½ do</th>
                                    <th style="color: var(--text-secondary); font-weight: 500; text-align: right; border: none; padding-bottom: 8px;">Thao tÃ¡c</th>
                                </tr>
                            </thead>
                            <tbody>
                            ${pendingLeaves.length === 0 ? '<tr><td colspan="5" style="text-align:center; padding: 16px;">KhÃ´ng cÃ³ yÃªu cáº§u chá» duyá»‡t</td></tr>' : ''}
                            ${pendingLeaves.map(l => `
                                <tr style="background: rgba(4, 9, 20, 0.8); border-radius: 6px;">
                                    <td style="font-weight: bold; color: #fff; padding: 12px 16px; border-top-left-radius: 6px; border-bottom-left-radius: 6px; border-top: 1px solid rgba(255, 255, 255, 0.2); border-bottom: 1px solid rgba(255, 255, 255, 0.2); border-left: 1px solid rgba(255, 255, 255, 0.2);">${l.username}</td>
                                    <td style="padding: 12px 16px; border-top: 1px solid rgba(255, 255, 255, 0.2); border-bottom: 1px solid rgba(255, 255, 255, 0.2);"><i class="fa-regular fa-calendar" style="margin-right: 6px; color: var(--text-secondary);"></i> ${l.startDate}</td>
                                    <td style="padding: 12px 16px; border-top: 1px solid rgba(255, 255, 255, 0.2); border-bottom: 1px solid rgba(255, 255, 255, 0.2);">${l.days}</td>
                                    <td style="padding: 12px 16px; color: var(--danger); border-top: 1px solid rgba(255, 255, 255, 0.2); border-bottom: 1px solid rgba(255, 255, 255, 0.2);"><i class="fa-solid fa-triangle-exclamation" style="margin-right: 4px;"></i> ${l.reason}</td>
                                    <td style="padding: 12px 16px; text-align: right; border-top-right-radius: 6px; border-bottom-right-radius: 6px; border-top: 1px solid rgba(255, 255, 255, 0.2); border-bottom: 1px solid rgba(255, 255, 255, 0.2); border-right: 1px solid rgba(255, 255, 255, 0.2);">
                                        <button class="btn btn-sm" onclick="Attendance.updateLeaveStatus('${l.id}', 'approved')" style="background: transparent; border: 1px solid var(--success); color: var(--success); margin-right: 8px; padding: 6px 16px; border-radius: 4px; font-weight: bold; transition: all 0.2s;"><i class="fa-solid fa-check" style="margin-right: 6px;"></i> Duyá»‡t [v]</button>
                                        <button class="btn btn-sm" onclick="Attendance.updateLeaveStatus('${l.id}', 'rejected')" style="background: transparent; border: 1px solid var(--danger); color: var(--danger); padding: 6px 16px; border-radius: 4px; font-weight: bold; transition: all 0.2s;">Tá»« Chá»‘i [x]</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                </div> <!-- End Pending Block -->
                
                <div style="background: rgba(4, 9, 20, 0.5); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; padding: 16px;">
                    <h3 style="color: var(--text-secondary); margin-bottom: 16px; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-clock-rotate-left"></i> Lá»‹ch sá»­ Ä‘Ã£ duyá»‡t/tá»« chá»‘i gáº§n Ä‘Ã¢y
                    </h3>
                    <div class="table-responsive">
                        <table class="tl-table cyber-hover-table" style="text-align: center; border-collapse: separate; border-spacing: 0 6px;">
                            <thead>
                                <tr>
                                    <th style="color: var(--text-secondary); font-weight: 500; border: none; padding-bottom: 8px;">NhÃ¢n ViÃªn</th>
                                    <th style="color: var(--text-secondary); font-weight: 500; border: none; padding-bottom: 8px;">NgÃ y nghá»‰</th>
                                    <th style="color: var(--text-secondary); font-weight: 500; border: none; padding-bottom: 8px;">Sá»‘ ngÃ y</th>
                                    <th style="color: var(--text-secondary); font-weight: 500; border: none; padding-bottom: 8px;">Tráº¡ng thÃ¡i</th>
                                </tr>
                            </thead>
                            <tbody>
                            ${resolvedLeaves.length === 0 ? '<tr><td colspan="4" style="text-align:center; padding: 32px;"><i class="fa-regular fa-clipboard" style="font-size: 24px; color: var(--text-secondary); margin-bottom: 8px; display: block;"></i> Trá»‘ng</td></tr>' : ''}
                            ${resolvedLeaves.map(l => {
                                let statusHtml = l.status === 'approved' ? '<span style="color: var(--success); font-weight: bold;"><i class="fa-solid fa-check"></i> ÄÃ£ Duyá»‡t</span>' : '<span style="color: var(--danger); font-weight: bold;"><i class="fa-solid fa-times"></i> Tá»« Chá»‘i</span>';
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
                // File not available or blocked â€” synthesize
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
        if (label) label.textContent = 'ðŸ“ Äang láº¥y GPS...';

        if (!navigator.geolocation) {
            Utils.showToast('TrÃ¬nh duyá»‡t khÃ´ng há»— trá»£ GPS.', 'error');
            btn.dataset.state = 'idle';
            if (label) label.textContent = 'ðŸªµ GÃ• MÃ• ÄIá»‚M DANH';
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (pos) => Attendance._runCheckin(pos.coords.latitude, pos.coords.longitude),
            async () => {
                Utils.showToast('GPS khÃ´ng kháº£ dá»¥ng. Cháº¥m cÃ´ng khÃ´ng vá»‹ trÃ­.', 'warning');
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
            const locStr = lat ? `\nðŸ“ https://google.com/maps?q=${lat},${lng}` : '';
            Utils.notifyTelegram(`âš ï¸ <b>[ÄI MUá»˜N]</b>\nðŸ‘¤ ${user.username}\nâ° ${now.toLocaleTimeString('vi-VN')}\nâ³ Muá»™n ${lateMinutes}p${locStr}`);
        }

        const newRecord = {
            id: 'att_' + Date.now(), username: user.username,
            timestamp: now.getTime(), dateStr, status, lateMinutes,
            location: lat ? { lat, lng } : null, note: ''
        };

        try {
            const allData = await Attendance.loadData();
            if (allData.find(r => r.username === user.username && r.dateStr === dateStr)) {
                Utils.showToast('HÃ´m nay Ä‘Ã£ Ä‘iá»ƒm danh rá»“i!', 'info');
                if (btn) btn.dataset.state = 'idle';
                return;
            }
            allData.push(newRecord);
            await Attendance.saveData(allData);
        } catch (err) {
            Utils.showToast('Lá»—i lÆ°u dá»¯ liá»‡u. Thá»­ láº¡i!', 'error');
            if (btn) {
                btn.dataset.state = 'idle';
                const l = btn.querySelector('.wf-label');
                if (l) l.textContent = 'ðŸªµ GÃ• MÃ• ÄIá»‚M DANH';
            }
            return;
        }

        // --- State: animating ---
        if (!btn) { Attendance.render(); return; }
        btn.dataset.state = 'animating';
        const label = btn.querySelector('.wf-label');
        if (label) label.textContent = 'Äang gÃµ mÃµ...';

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

        // Float +1 CÃ´ng Äá»©c
        setTimeout(() => {
            const cd = btn.querySelector('.wf-cong-duc');
            if (cd) { cd.classList.add('active'); setTimeout(() => cd.classList.remove('active'), 1500); }
        }, 300);

        // After animation, show success
        setTimeout(() => {
            if (label) label.textContent = 'CÃ´ng Äá»©c +1';
            btn.dataset.state = 'success';
            setTimeout(() => Attendance.render(), 1200);
        }, 900);
    },

    showLeaveModal: () => {
        document.getElementById('leave-form').reset();
        
        // Äáº·t máº·c Ä‘á»‹nh ngÃ y lÃ  hÃ´m nay
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
            Utils.showToast("Vui lÃ²ng Ä‘iá»n Ä‘áº§y Ä‘á»§ thÃ´ng tin xin nghá»‰!", "error");
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
        Utils.showToast("ÄÃ£ gá»­i yÃªu cáº§u xin nghá»‰ phÃ©p thÃ nh cÃ´ng!", "success");

        const msg = `ðŸ“¢ <b>[Tá»œ TRÃŒNH XIN NGHá»ˆ PHÃ‰P]</b>\nðŸ‘¤ NhÃ¢n viÃªn: <b>${user.username}</b>\nðŸ“… Tá»« ngÃ y: ${startDate}\nâ³ Sá»‘ ngÃ y nghá»‰: ${days}\nðŸ“ LÃ½ do: <i>${reason}</i>\n\nðŸ‘‰ Sáº¿p vÃ o há»‡ thá»‘ng kiá»ƒm tra vÃ  duyá»‡t nhÃ©!`;
        Utils.notifyTelegram(msg);

        Attendance.render(); // Táº£i láº¡i view
    },

    updateLeaveStatus: async (leaveId, newStatus) => {
        const actionText = newStatus === 'approved' ? 'DUYá»†T' : 'Tá»ª CHá»I';
        const color = newStatus === 'approved' ? 'var(--success)' : 'var(--danger)';
        
        const isConfirm = await Utils.showConfirm(
            'XÃ¡c nháº­n thao tÃ¡c', 
            `Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n <span style="color: ${color}; font-weight: bold; font-size: 16px;">${actionText}</span> yÃªu cáº§u nghá»‰ phÃ©p nÃ y?`
        );
        
        if (!isConfirm) return;

        const allLeaves = await Attendance.loadLeaveData();
        const leaveIndex = allLeaves.findIndex(l => l.id === leaveId);
        
        if (leaveIndex > -1) {
            allLeaves[leaveIndex].status = newStatus;
            await Attendance.saveLeaveData(allLeaves);
            Utils.showToast(`ÄÃ£ ${newStatus === 'approved' ? 'duyá»‡t' : 'tá»« chá»‘i'} yÃªu cáº§u thÃ nh cÃ´ng!`, "success");
            Attendance.render(); // Táº£i láº¡i view Admin
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
            Utils.showToast("Vui lÃ²ng nháº­p bÃ¡o cÃ¡o cÃ´ng viá»‡c!", "error");
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

            // Gá»­i Telegram EOD Report
            const msg = `âœ… <b>[BÃO CÃO CUá»I NGÃ€Y Dá»° ÃN]</b>\nðŸ‘¤ NhÃ¢n viÃªn: <b>${user.username}</b>\nâ° Ra vá» lÃºc: ${now.toLocaleTimeString('vi-VN')}\n\nðŸ“ <b>CÃ´ng viá»‡c Ä‘Ã£ hoÃ n thÃ nh:</b>\n${report}`;
            Utils.notifyTelegram(msg);

            Attendance.closeCheckoutModal();
            Utils.showToast("Gá»­i bÃ¡o cÃ¡o vÃ  Ra vá» thÃ nh cÃ´ng!", "success");
            Attendance.render();
        } else {
            Utils.showToast("KhÃ´ng tÃ¬m tháº¥y dá»¯ liá»‡u Ä‘iá»ƒm danh ban sÃ¡ng?", "error");
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

        // Táº¡o ná»™i dung CSV (UTF-8 BOM há»— trá»£ tiáº¿ng Viá»‡t)
        let csvContent = "\uFEFF"; // BOM cho Excel
        csvContent += "TÃ i xáº¿/NhÃ¢n viÃªn,Tá»•ng ngÃ y cÃ´ng Ä‘Ã£ qua,ÄÃ£ Ä‘i lÃ m,ÄÃºng giá»,Váº¯ng,Nghá»‰ phÃ©p duyá»‡t,Äi muá»™n (láº§n),Tá»•ng phÃºt Ä‘i muá»™n\n";

        usersList.forEach(u => {
            const s = summary[u] || { totalDays: 0, onTime: 0, late: 0, totalLateMinutes: 0 };
            const leaves = approvedLeaves[u] || 0;
            let absent = passedWorkingDays - s.totalDays - leaves;
            if (absent < 0) absent = 0;
            
            csvContent += `"${u}",${passedWorkingDays},${s.totalDays},${s.onTime},${absent},${leaves},${s.late},${s.totalLateMinutes}\n`;
        });

        // Táº£i xuá»‘ng
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
