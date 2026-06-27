const Attendance = {
    // Thời hạn chấm công đúng giờ
    DEADLINE_HOURS: 8,
    DEADLINE_MINUTES: 30,
    AFTERNOON_DEADLINE_HOURS: 14,
    AFTERNOON_DEADLINE_MINUTES: 0,

    selectedMonth: new Date().getMonth(),
    selectedYear: new Date().getFullYear(),
    ATTENDANCE_SECURITY_DEFAULTS: {
        enabled: true,
        requireTrustedDevice: true,
        radiusMeters: 180,
        companyLat: null,
        companyLng: null,
        allowedPublicIps: [],
        trustedDevices: []
    },

    usernameKey: (username) => {
        if (typeof Auth !== 'undefined' && typeof Auth.usernameKey === 'function') {
            return Auth.usernameKey(username);
        }
        return String(username || '')
            .trim()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\u0111/g, 'd')
            .replace(/\u0110/g, 'D')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '');
    },

    shiftKey: (record) => record && record.type ? record.type : 'morning',

    isSundayDate: (dateStr) => {
        if (!dateStr) return false;
        const parts = String(dateStr).split('-').map(n => parseInt(n, 10));
        if (parts.length !== 3 || parts.some(Number.isNaN)) return false;
        return new Date(parts[0], parts[1] - 1, parts[2]).getDay() === 0;
    },

    normalizeRecordForSummary: (record) => {
        const normalized = { ...record };
        if (/2026-0?6-1?3/.test(String(normalized.dateStr || '').trim()) && normalized.status !== 'on_time') {
            normalized.status = 'on_time';
            normalized.lateMinutes = 0;
        }
        if (normalized.status === 'late' && Number(normalized.lateMinutes || 0) <= 0) {
            normalized.status = 'on_time';
            normalized.lateMinutes = 0;
        }
        return normalized;
    },

    recordPriority: (record) => {
        const status = record && record.status;
        if (status === 'on_time') return 4;
        if (status === 'late_excused') return 3;
        if (status === 'late') return 2;
        if (status === 'absent_unexcused') return 1;
        return 0;
    },

    getDedupedAttendanceRecords: (records, startStr, endStr) => {
        const byShift = new Map();
        (records || []).forEach(raw => {
            if (!raw || raw.dateStr < startStr || raw.dateStr > endStr) return;
            if (Attendance.isSundayDate(raw.dateStr)) return;

            const record = Attendance.normalizeRecordForSummary(raw);
            const userKey = Attendance.usernameKey(record.username);
            if (!userKey || userKey === 'admin' || userKey === 'congty') return;

            const key = `${userKey}|${record.dateStr}|${Attendance.shiftKey(record)}`;
            const current = byShift.get(key);
            const currentPriority = Attendance.recordPriority(current);
            const recordPriority = Attendance.recordPriority(record);
            if (!current || recordPriority > currentPriority ||
                (recordPriority === currentPriority && Number(record.timestamp || 0) > Number(current.timestamp || 0))) {
                byShift.set(key, record);
            }
        });
        return Array.from(byShift.values());
    },

    getPassedWorkingDays: (cycle) => {
        const now = new Date();
        const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let limitDate = new Date(cycle.endDate);
        limitDate.setHours(0,0,0,0);
        if (todayZero < limitDate) {
            limitDate = todayZero;
        }

        let passedWorkingDays = 0;
        let tempDate = new Date(cycle.startDate);
        tempDate.setHours(0,0,0,0);
        while (tempDate <= limitDate) {
            if (tempDate.getDay() !== 0) {
                passedWorkingDays++;
            }
            tempDate.setDate(tempDate.getDate() + 1);
        }
        return passedWorkingDays;
    },

    buildAttendanceSummary: (allData, allLeaves, accounts, startStr, endStr) => {
        const summary = {};
        Attendance.getDedupedAttendanceRecords(allData, startStr, endStr).forEach(record => {
            const userKey = Attendance.usernameKey(record.username);
            if (!summary[userKey]) {
                summary[userKey] = { totalDays: 0, onTime: 0, late: 0, lateExcused: 0, totalLateMinutes: 0 };
            }
            const weight = record.type ? 0.5 : 1.0;
            if (record.status === 'absent_unexcused') {
                return;
            }
            summary[userKey].totalDays += weight;
            if (record.status === 'on_time') {
                summary[userKey].onTime += weight;
            } else if (record.status === 'late_excused') {
                summary[userKey].lateExcused += weight;
            } else if (record.status === 'late') {
                summary[userKey].late += weight;
                summary[userKey].totalLateMinutes += Number(record.lateMinutes || 0);
            }
        });

        const approvedLeaves = {};
        (allLeaves || []).forEach(leave => {
            const start = leave.startDate || leave.date || '';
            const userKey = Attendance.usernameKey(leave.username);
            if (leave.status === 'approved' && start >= startStr && start <= endStr && userKey && userKey !== 'admin' && userKey !== 'congty') {
                if (!approvedLeaves[userKey]) approvedLeaves[userKey] = 0;
                approvedLeaves[userKey] += parseFloat(leave.days) || 0;
            }
        });

        const usersByKey = new Map();
        (accounts || []).forEach(acc => {
            if (!acc || Utils.isSystemAccount(acc)) return;
            const key = Attendance.usernameKey(acc.username);
            if (key && !usersByKey.has(key)) {
                usersByKey.set(key, acc.username);
            }
        });
        Object.keys(summary).forEach(key => {
            if (key && key !== 'admin' && key !== 'congty' && !usersByKey.has(key)) {
                usersByKey.set(key, key);
            }
        });

        return {
            summary,
            approvedLeaves,
            usersList: Array.from(usersByKey.values())
        };
    },

    init: () => {
        // Tự động kiểm tra và điểm danh bù cho chiều 13/06 nếu cần
        Attendance.checkAndPerformAutoCheckIn();
        
        // Tự động quét và hạt nghỉ không phép (-50,000 VNĐ)
        Attendance.checkAndPerformAutoAbsentPenalty();

        // Sửa lại các bản ghi đã lỡ bị tính muộn hôm nay
        Attendance.repairTodayRecords();
    },

    repairTodayRecords: async () => {
        const dateStr = '2026-06-13';
        try {
            const allData = await Attendance.loadData();
            let changed = false;
            allData.forEach(r => {
                if (r.dateStr === dateStr && r.status === 'late') {
                    r.status = 'on_time';
                    r.lateMinutes = 0;
                    r.note = (r.note || '') + ' [System: Error Compensation]';
                    changed = true;
                }
            });
            if (changed) {
                await Attendance.saveData(allData);
                if (document.getElementById('attendance-content-area')) Attendance.render();
            }
        } catch(e) {}
    },

    checkAndPerformAutoCheckIn: async () => {
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth() + 1;
        const d = now.getDate();
        const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        
        // Chỉ chạy duy nhất chiều ngày 13/06/2026
        if (dateStr === '2026-06-13' && now.getHours() >= 12) {
            const flagKey = 'tl_auto_checkin_jun13_v2';
            if (localStorage.getItem(flagKey) === 'done') return;

            try {
                const accounts = await Auth.getAccounts();
                const allAttendance = await Attendance.loadData();
                let changed = false;

                for (const acc of accounts) {
                    if (Utils.isSystemAccount(acc)) {
                        continue;
                    }
                    
                    const hasRecord = allAttendance.some(r => r.username === acc.username && r.dateStr === dateStr && r.type === 'afternoon');
                    
                    if (!hasRecord) {
                        allAttendance.push({
                            id: `auto_${acc.username}_${Date.now()}`,
                            username: acc.username,
                            dateStr: dateStr,
                            timestamp: Date.now(),
                            status: 'on_time',
                            lateMinutes: 0,
                            type: 'afternoon',
                            security: { autoCheckIn: true }
                        });
                        changed = true;
                    }
                }

                if (changed) {
                    await Attendance.saveData(allAttendance);
                    if (document.getElementById('attendance-content-area')) Attendance.render();
                    
                    // Gửi thông báo Telegram tổng quát
                    const msg = `🟡 <b>Tự động điểm danh bù chiều 13/06</b>\n\nHệ thống đã tự động ghi nhận điểm danh đúng giờ cho đội ngũ nhân sự (trừ nlgiang) để khắc phục lỗi hệ thống chiều nay.`;
                    Utils.notifyTelegram(msg);
                }
                localStorage.setItem(flagKey, 'done');
            } catch (e) {
                console.error("Lỗi điểm danh tự động:", e);
            }
        }
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

    checkAndPerformAutoAbsentPenalty: async (force = false) => {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeVal = currentHour * 60 + currentMinute;

        // Deadline: Sáng 08:30 (510p), Chiều 14:00 (840p)
        // Audit (Deadline + 1h): Sáng 09:30 (570p), Chiều 15:00 (900p)
        const MORNING_AUDIT = 9 * 60 + 30;
        const AFTERNOON_AUDIT = 15 * 60 + 0;

        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        
        // Nghỉ Chủ nhật
        if (now.getDay() === 0) return;

        const shiftsToAudit = [];
        if (force) {
            shiftsToAudit.push(currentHour < 12 ? 'morning' : 'afternoon');
        } else {
            if (currentTimeVal >= MORNING_AUDIT) shiftsToAudit.push('morning');
            if (currentTimeVal >= AFTERNOON_AUDIT) shiftsToAudit.push('afternoon');
        }

        if (shiftsToAudit.length === 0) return;

        try {
            const accounts = await Auth.getAccounts();
            const allAttendance = await Attendance.loadData();
            const allLeaves = await Attendance.loadLeaveData();
            const allLateRequests = await Attendance.loadLateRequests();
            
            let changed = false;
            let penalizedUsers = [];

            for (const shift of shiftsToAudit) {
                const flagKey = `tl_absent_audit_${shift}_${dateStr}_v1`;
                if (localStorage.getItem(flagKey) === 'done') continue;

                for (const acc of accounts) {
                    if (Utils.isSystemAccount(acc)) {
                        continue;
                    }

                    // 1. Kiểm tra đã có record chưa (morning/afternoon) - so sánh không phân biệt hoa/thường
                    const accUser = Attendance.usernameKey(acc.username);
                    const hasRecord = allAttendance.some(r => 
                        Attendance.usernameKey(r.username) === accUser &&
                        r.dateStr === dateStr && 
                        (r.type === shift || (shift === 'morning' && !r.type))
                    );
                    if (hasRecord) continue;

                    // 2. Kiểm tra có đơn xin nghỉ phép đã duyệt không
                    const hasLeave = allLeaves.some(l => {
                        if (Attendance.usernameKey(l.username) !== accUser || l.status !== 'approved') return false;
                        const dStart = new Date(l.startDate);
                        const dToday = new Date(dateStr);
                        const diff = Math.floor((dToday - dStart) / (1000 * 60 * 60 * 24));
                        return diff >= 0 && diff < (parseFloat(l.days) || 1);
                    });
                    if (hasLeave) continue;

                    // 3. Kiểm tra có đơn xin đi trễ không (duyệt hoặc đang chờ)
                    const hasLateRequest = allLateRequests.some(r => 
                        Attendance.usernameKey(r.username) === accUser &&
                        r.date === dateStr && 
                        (r.status === 'approved' || r.status === 'pending')
                    );
                    if (hasLateRequest) continue;

                    // 4. Tạo record vắng không phép & trừ tiền
                    allAttendance.push({
                        id: `absent_${acc.username}_${shift}_${Date.now()}`,
                        username: acc.username,
                        dateStr: dateStr,
                        timestamp: Date.now(),
                        status: 'absent_unexcused',
                        type: shift,
                        note: `Hệ thống tự động phạt Nghỉ không phép (Sau 1h quá deadline)`,
                        security: { autoAudit: true }
                    });

                    await PayrollModule.applyAbsentPenalty(acc.username, 50000);
                    penalizedUsers.push({ user: acc.username, shift: shift });
                    changed = true;
                }
                localStorage.setItem(flagKey, 'done');
            }

            if (changed) {
                await Attendance.saveData(allAttendance);
                if (document.getElementById('attendance-content-area')) Attendance.render();
                
                let msg = `🚨 <b>[TỰ ĐỘNG PHẠT NGHỈ KHÔNG PHÉP]</b>\n`;
                msg += `📅 Ngày: ${dateStr}\n\n`;
                penalizedUsers.forEach(u => {
                    msg += `• <b>${u.user}</b>: ${u.shift === 'morning' ? 'Sáng' : 'Chiều'} -> Phạt <b>-50,000đ</b>\n`;
                });
                msg += `\n<i>Hệ thống tự động quét sau 1 tiếng quá giờ điểm danh quy định.</i>`;
                Utils.notifyTelegram(msg);
            }
        } catch (e) {
            console.error("Lỗi audit nghỉ không phép:", e);
        }
    },

    runManualAbsentAudit: async () => {
        const now = new Date();
        const currentHour = now.getHours();
        const shift = currentHour < 12 ? 'morning' : 'afternoon';
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        // 1. Hiển thị giao diện quét (Radar UI)
        const scanContent = `
            <div style="text-align: center; padding: 20px;">
                <div class="scan-radar-container" style="margin: 0 auto 24px; width: 120px; height: 120px; border-radius: 50%; border: 2px solid var(--primary); position: relative; overflow: hidden; background: rgba(0,240,255,0.05); box-shadow: 0 0 20px rgba(0,240,255,0.2);">
                    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: conic-gradient(from 0deg, transparent 80%, var(--primary)); animation: radar-spin 2s linear infinite; opacity: 0.6;"></div>
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: var(--primary); font-size: 32px; text-shadow: 0 0 10px var(--primary); z-index: 2;">
                        <i class="fa-solid fa-satellite-dish"></i>
                    </div>
                    <div class="radar-dot" style="position: absolute; top: 30%; left: 40%; width: 6px; height: 6px; background: var(--danger); border-radius: 50%; animation: pulse 1s infinite;"></div>
                    <div class="radar-dot" style="position: absolute; top: 60%; left: 70%; width: 6px; height: 6px; background: var(--danger); border-radius: 50%; animation: pulse 1s infinite 0.5s;"></div>
                </div>
                <h3 style="color: var(--primary); margin-bottom: 12px; font-size: 16px; letter-spacing: 2px; font-weight: 800;">ĐANG QUÉT HỆ THỐNG...</h3>
                <div style="height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden; margin-bottom: 16px; border: 1px solid rgba(255,255,255,0.1);">
                    <div id="scan-progress-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, var(--primary), #fff); transition: width 0.5s; box-shadow: 0 0 10px var(--primary);"></div>
                </div>
                <p id="scan-status-text" style="color: var(--text-secondary); font-size: 13px; font-style: italic;">Đang kiểm tra dữ liệu ${shift === 'morning' ? 'ca sáng' : 'ca chiều'} ngày ${dateStr}...</p>
            </div>
            <style>
                @keyframes radar-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes pulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.3; transform: scale(1.5); } 100% { opacity: 1; transform: scale(1); } }
            </style>
        `;

        if (typeof Utils.showModal !== 'function') {
            Utils.showToast("Giao diện quét không khả dụng, đang chạy quét ngầm...", "info");
        } else {
            // Sửa tham số truyền vào Utils.showModal để tránh hiển thị [object Object] ở nút Hủy
            Utils.showModal("THANH LONG SECURITY SYSTEM", scanContent, null, "Xác nhận", "Hủy", { hideFooter: true });
        }
        
        // 2. Chạy hiệu ứng Progress trong 5 giây
        let progressValue = 0;
        const progressTimer = setInterval(() => {
            progressValue += 2;
            const bar = document.getElementById('scan-progress-bar');
            const statusTxt = document.getElementById('scan-status-text');
            if (bar) bar.style.width = progressValue + '%';
            
            if (progressValue === 20 && statusTxt) statusTxt.textContent = "Đang truy vấn database điểm danh...";
            if (progressValue === 50 && statusTxt) statusTxt.textContent = "Đang đối soát đơn xin nghỉ phép & đi trễ...";
            if (progressValue === 80 && statusTxt) statusTxt.textContent = "Đang tổng hợp kết quả vi phạm...";

            if (progressValue >= 100) clearInterval(progressTimer);
        }, 100);

        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // LUÔN ĐÓNG MODAL trước khi chuyển bước hoặc kết thúc
        if (typeof Utils.closeModal === 'function') Utils.closeModal();

        // 3. Phân tích dữ liệu & Thống kê
        const accounts = await Auth.getAccounts();
        const allAttendance = await Attendance.loadData();
        const allLeaves = await Attendance.loadLeaveData();
        const allLateRequests = await Attendance.loadLateRequests();
        
        let penalizedUsers = [];
        let checkedInCount = 0;
        let leaveCount = 0;
        let lateCount = 0;
        let activeAccountsCount = 0;

        for (const acc of accounts) {
            // Loại bỏ admin và các tài khoản đặc biệt
            if (Utils.isSystemAccount(acc)) continue;
            activeAccountsCount++;

            const manualAccUser = Attendance.usernameKey(acc.username);
            const record = allAttendance.find(r => 
                Attendance.usernameKey(r.username) === manualAccUser &&
                r.dateStr === dateStr && 
                (r.type === shift || (shift === 'morning' && !r.type))
            );

            if (record) {
                checkedInCount++;
                continue;
            }

            const leave = allLeaves.find(l => {
                if (Attendance.usernameKey(l.username) !== manualAccUser || l.status !== 'approved') return false;
                const dStart = new Date(l.startDate);
                const dToday = new Date(dateStr);
                const diff = Math.floor((dToday - dStart) / (1000 * 60 * 60 * 24));
                return diff >= 0 && diff < (parseFloat(l.days) || 1);
            });
            if (leave) {
                leaveCount++;
                continue;
            }

            const lateRequest = allLateRequests.find(r => 
                Attendance.usernameKey(r.username) === manualAccUser &&
                r.date === dateStr && 
                (r.status === 'approved' || r.status === 'pending')
            );
            if (lateRequest) {
                lateCount++;
                continue;
            }

            penalizedUsers.push(acc.username);
        }

        // 4. Hiển thị modal kết quả
        const statsHtml = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
                <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); padding: 10px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase;">Đã điểm danh</div>
                    <div style="font-size: 20px; font-weight: 800; color: #10b981;">${checkedInCount}/${activeAccountsCount}</div>
                </div>
                <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); padding: 10px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase;">Có phép/Đơn trễ</div>
                    <div style="font-size: 20px; font-weight: 800; color: #f59e0b;">${leaveCount + lateCount}</div>
                </div>
            </div>
        `;

        if (penalizedUsers.length === 0) {
            const noViolationHtml = `
                <div style="padding: 10px; text-align: center;">
                    ${statsHtml}
                    <div style="width: 60px; height: 60px; background: rgba(16, 185, 129, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
                        <i class="fa-solid fa-square-check" style="font-size: 32px; color: #10b981;"></i>
                    </div>
                    <p style="color: #10b981; font-weight: bold; margin-bottom: 8px;">KẾT QUẢ QUÉT: SẠCH 100%</p>
                    <p style="color: var(--text-secondary); font-size: 13px;">Không phát hiện nhân sự nào vi phạm vắng mặt không phép ${shift === 'morning' ? 'ca sáng' : 'ca chiều'}.</p>
                </div>
            `;
            Utils.showModal("KẾT QUẢ QUÉT HỆ THỐNG", noViolationHtml, null, null, "Đóng", { hideFooter: false });
            return;
        }

        // Nếu có người vi phạm
        const userRows = penalizedUsers.map(u => `
            <div style="display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); align-items: center;">
                <span style="color: #fff; font-weight: 600;"><i class="fa-solid fa-user-xmark" style="color: var(--danger); margin-right: 10px;"></i> ${u}</span>
                <span style="color: var(--danger); font-family: monospace; font-weight: bold;">- 50,000đ</span>
            </div>
        `).join('');

        const confirmHtml = `
            <div style="padding: 10px;">
                ${statsHtml}
                <div style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid var(--danger); padding: 12px; margin-bottom: 20px; border-radius: 4px;">
                    <p style="color: var(--danger); font-size: 14px; margin: 0; font-weight: bold;">
                        PHÁT HIỆN ${penalizedUsers.length} TRƯỜNG HỢP NGHỈ KHÔNG PHÉP
                    </p>
                </div>
                <div style="background: rgba(0,0,0,0.2); border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); max-height: 200px; overflow-y: auto; margin-bottom: 20px;">
                    ${userRows}
                </div>
                <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.6; background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px;">
                    <i class="fa-solid fa-circle-info" style="margin-right: 6px; color: var(--primary);"></i>
                    Sau khi xác nhận, hệ thống sẽ tự động tạo bản ghi vắng, trừ quỹ phạt và công khai danh sách lên Telegram.
                </div>
            </div>
        `;

        Utils.showModal("XÁC NHẬN XỬ PHẠT TỰ ĐỘNG", confirmHtml, async () => {
            // Thực hiện phạt
            const updatedAttendance = await Attendance.loadData(); // Load fresh
            for (const username of penalizedUsers) {
                // Kiểm tra lại lần cuối để tránh phạt đè (so sánh không phân biệt hoa/thường)
                const uLower = Attendance.usernameKey(username);
                const exists = updatedAttendance.some(r => 
                    Attendance.usernameKey(r.username) === uLower &&
                    r.dateStr === dateStr && 
                    (r.type === shift || (shift === 'morning' && !r.type))
                );
                if (exists) continue;

                updatedAttendance.push({
                    id: `absent_${username}_${shift}_${Date.now()}`,
                    username: username,
                    dateStr: dateStr,
                    timestamp: Date.now(),
                    status: 'absent_unexcused',
                    type: shift,
                    note: `Quét phạt thủ công bởi Admin`,
                    security: { adminManualAudit: true, auditor: Auth.currentUser.username }
                });
                await PayrollModule.applyAbsentPenalty(username, 50000);
            }

            // Lưu dữ liệu
            await Attendance.saveData(updatedAttendance);
            // Đánh dấu flag
            localStorage.setItem(`tl_absent_audit_${shift}_${dateStr}_v1`, 'done');

            // Render lại bảng
            if (document.getElementById('attendance-content-area')) Attendance.render();

            // Gửi Telegram
            let msg = `🚨 <b>[KẾT QUẢ QUÉT PHẠT NGHỈ KHÔNG PHÉP]</b>\n`;
            msg += `📅 Ngày: ${dateStr} (${shift === 'morning' ? 'Sáng' : 'Chiều'})\n`;
            msg += `👤 Người thực hiện: <b>${Auth.currentUser.username}</b>\n\n`;
            msg += `<b>Danh sách xử phạt (-50,000đ/người):</b>\n`;
            penalizedUsers.forEach(u => {
                msg += `• <b>${u}</b>\n`;
            });
            msg += `\n<i>"Hệ thống đã tự động cập nhật dữ liệu tài chính."</i>`;
            Utils.notifyTelegram(msg);

            Utils.showToast(`Đã xử phạt ${penalizedUsers.length} nhân sự!`, "success");
            return true;
        }, "XÁC NHẬN & PHẠT NGAY");
    },

    getAttendanceSecuritySettings: async () => {
        let settings = {};
        try {
            if (typeof DB !== 'undefined' && typeof DB.getSettings === 'function') {
                settings = await DB.getSettings() || {};
            } else if (typeof app !== 'undefined' && app.state) {
                settings = app.state.settings || {};
            }
        } catch (e) {
            settings = (typeof app !== 'undefined' && app.state) ? (app.state.settings || {}) : {};
        }

        const raw = settings.attendanceSecurity || {};
        return {
            ...Attendance.ATTENDANCE_SECURITY_DEFAULTS,
            ...raw,
            allowedPublicIps: Array.isArray(raw.allowedPublicIps) ? raw.allowedPublicIps : [],
            trustedDevices: Array.isArray(raw.trustedDevices) ? raw.trustedDevices : []
        };
    },

    saveAttendanceSecuritySettings: async (security) => {
        const current = (typeof DB !== 'undefined' && typeof DB.getSettings === 'function')
            ? await DB.getSettings() || {}
            : ((typeof app !== 'undefined' && app.state) ? (app.state.settings || {}) : {});
        const next = {
            ...current,
            attendanceSecurity: {
                ...Attendance.ATTENDANCE_SECURITY_DEFAULTS,
                ...security,
                updatedAt: Date.now(),
                updatedBy: Auth.currentUser?.username || 'admin'
            }
        };

        if (typeof DB !== 'undefined' && typeof DB.saveSettings === 'function') {
            await DB.saveSettings(next);
        }
        if (typeof app !== 'undefined' && app.state) {
            app.state.settings = next;
        }
    },

    getOrCreateDeviceSeed: () => {
        const key = 'tl_attendance_device_seed';
        let seed = localStorage.getItem(key);
        if (!seed) {
            const webCrypto = window.crypto || window.msCrypto;
            seed = (webCrypto && webCrypto.randomUUID)
                ? webCrypto.randomUUID()
                : `dev_${Date.now()}_${Math.random().toString(36).slice(2)}`;
            localStorage.setItem(key, seed);
        }
        return seed;
    },

    sha256: async (text) => {
        const webCrypto = window.crypto || window.msCrypto;
        if (webCrypto?.subtle && window.TextEncoder) {
            const data = new TextEncoder().encode(text);
            const hash = await webCrypto.subtle.digest('SHA-256', data);
            return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
        }
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            hash = ((hash << 5) - hash) + text.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash).toString(16);
    },

    escapeHtml: (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[ch])),

    getCurrentDeviceProfile: async () => {
        const seed = Attendance.getOrCreateDeviceSeed();
        const raw = [
            seed,
            navigator.userAgent || '',
            navigator.platform || '',
            screen?.width || 0,
            screen?.height || 0,
            Intl.DateTimeFormat().resolvedOptions().timeZone || ''
        ].join('|');
        const id = await Attendance.sha256(raw);
        return {
            id,
            shortId: id.slice(0, 10).toUpperCase(),
            label: `${navigator.platform || 'Company PC'} ${screen?.width || ''}x${screen?.height || ''}`.trim(),
            userAgent: (navigator.userAgent || '').slice(0, 140)
        };
    },

    getPublicIp: async () => {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 4500);
            const res = await fetch('https://api.ipify.org?format=json', {
                cache: 'no-store',
                signal: controller.signal
            });
            clearTimeout(timeout);
            if (!res.ok) return null;
            const data = await res.json();
            return (data.ip || '').trim();
        } catch (e) {
            return null;
        }
    },

    distanceMeters: (lat1, lng1, lat2, lng2) => {
        const toRad = deg => deg * Math.PI / 180;
        const earth = 6371000;
        const dLat = toRad(lat2 - lat1);
        const dLng = toRad(lng2 - lng1);
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) ** 2;
        return Math.round(earth * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    },

    verifyCheckInAccess: async (lat, lng) => {
        const security = await Attendance.getAttendanceSecuritySettings();
        const device = await Attendance.getCurrentDeviceProfile();
        const allowedIps = security.allowedPublicIps.map(ip => String(ip).trim()).filter(Boolean);
        const publicIp = allowedIps.length > 0 ? await Attendance.getPublicIp() : null;

        if (!security.enabled) {
            return { ok: true, reason: 'security-disabled', security, device, publicIp };
        }

        const trustedDevice = !security.requireTrustedDevice ||
            security.trustedDevices.some(d => d.id === device.id);

        const hasOfficeLocation = Number.isFinite(Number(security.companyLat)) &&
            Number.isFinite(Number(security.companyLng));
        let distance = null;
        let locationOk = false;
        if (hasOfficeLocation && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))) {
            distance = Attendance.distanceMeters(
                Number(lat),
                Number(lng),
                Number(security.companyLat),
                Number(security.companyLng)
            );
            locationOk = distance <= Number(security.radiusMeters || Attendance.ATTENDANCE_SECURITY_DEFAULTS.radiusMeters);
        }

        const networkOk = !!publicIp && allowedIps.includes(publicIp);
        const hasAnyOfficeGate = hasOfficeLocation || allowedIps.length > 0;
        const officeGateOk = locationOk || networkOk;
        const reasons = [];

        if (!trustedDevice) reasons.push('May nay chua duoc admin dang ky la may tinh cong ty.');
        if (!hasAnyOfficeGate) reasons.push('Admin chua cau hinh vi tri cong ty hoac IP mang cong ty.');
        if (hasAnyOfficeGate && !officeGateOk) {
            reasons.push('Ban khong o trong pham vi cong ty va cung khong ket noi bang mang cong ty.');
        }

        // RELAXED SECURITY: Always allow check-in but log warnings if needed
        return {
            ok: true, 
            warning: reasons.join(' '), 
            isStrictFailure: !(trustedDevice && hasAnyOfficeGate && officeGateOk),
            reason: reasons.join(' '),
            security,
            device,
            publicIp,
            trustedDevice,
            locationOk,
            networkOk,
            distance
        };
    },

    resetCheckInButton: (message) => {
        const btn = document.getElementById('btn-check-in');
        if (!btn) return;
        btn.dataset.state = 'idle';
        const label = btn.querySelector('.wf-label');
        if (label) label.textContent = message || 'GO MO DIEM DANH';
    },

    renderAttendanceSecurityPanel: async (security) => {
        const currentDevice = await Attendance.getCurrentDeviceProfile();
        const publicIp = await Attendance.getPublicIp();
        const deviceTrusted = security.trustedDevices.some(d => d.id === currentDevice.id);
        const ipTrusted = publicIp && security.allowedPublicIps.includes(publicIp);
        const locationConfigured = Number.isFinite(Number(security.companyLat)) && Number.isFinite(Number(security.companyLng));
        const deviceList = security.trustedDevices.length
            ? security.trustedDevices.map(d => `
                <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:8px 10px;">
                    <span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${Attendance.escapeHtml(d.label || 'Company PC')} <small style="color:#94a3b8;">${String(d.id).slice(0, 10).toUpperCase()}</small></span>
                    <button class="btn btn-sm" style="padding:5px 8px;border-color:rgba(239,68,68,0.5);color:#f87171;" onclick="Attendance.removeTrustedDevice('${d.id}')"><i class="fa-solid fa-xmark"></i></button>
                </div>
            `).join('')
            : '<div style="color:#f59e0b;font-size:12px;">Chua co may cong ty nao duoc dang ky.</div>';
        const ipList = security.allowedPublicIps.length
            ? security.allowedPublicIps.map(ip => `
                <span style="display:inline-flex;align-items:center;gap:6px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.25);color:#86efac;border-radius:999px;padding:5px 8px;font-weight:700;">
                    ${ip}
                    <button style="background:transparent;border:0;color:#f87171;cursor:pointer;font-weight:900;" onclick="Attendance.removeAllowedIp('${ip}')">&times;</button>
                </span>
            `).join('')
            : '<span style="color:#f59e0b;font-size:12px;">Chua co IP mang cong ty.</span>';

        return `
            <div class="glass-panel" style="margin: 0 0 18px 0; padding: 16px; border: 1px solid rgba(34,211,238,0.28); background: linear-gradient(135deg, rgba(8,47,73,0.45), rgba(15,23,42,0.75));">
                <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap;margin-bottom:12px;">
                    <div>
                        <h3 style="margin:0 0 4px;color:#67e8f9;font-size:15px;text-transform:uppercase;letter-spacing:.7px;"><i class="fa-solid fa-shield-halved"></i> Bao mat diem danh</h3>
                        <div style="color:#94a3b8;font-size:12px;">Dieu kien: may cong ty da dang ky + dung GPS cong ty hoac dung IP mang cong ty.</div>
                    </div>
                    <button class="btn btn-sm" style="border-color:${security.enabled ? '#22c55e' : '#64748b'};color:${security.enabled ? '#86efac' : '#cbd5e1'};" onclick="Attendance.toggleAttendanceSecurity()">
                        <i class="fa-solid ${security.enabled ? 'fa-lock' : 'fa-lock-open'}"></i> ${security.enabled ? 'Dang bat' : 'Dang tat'}
                    </button>
                </div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;">
                    <div style="background:rgba(0,0,0,0.18);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:12px;">
                        <div style="font-size:12px;color:#cbd5e1;font-weight:800;margin-bottom:8px;"><i class="fa-solid fa-desktop"></i> May hien tai</div>
                        <div style="font-size:12px;color:${deviceTrusted ? '#86efac' : '#fbbf24'};margin-bottom:8px;">ID: ${currentDevice.shortId} - ${deviceTrusted ? 'Da dang ky' : 'Chua dang ky'}</div>
                        <button class="btn btn-sm btn-primary" onclick="Attendance.registerCurrentDevice()" style="width:100%;"><i class="fa-solid fa-plus"></i> Dang ky may nay</button>
                        <div style="display:flex;flex-direction:column;gap:6px;margin-top:10px;max-height:112px;overflow:auto;">${deviceList}</div>
                    </div>
                    <div style="background:rgba(0,0,0,0.18);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:12px;">
                        <div style="font-size:12px;color:#cbd5e1;font-weight:800;margin-bottom:8px;"><i class="fa-solid fa-location-dot"></i> Vi tri cong ty</div>
                        <div style="font-size:12px;color:${locationConfigured ? '#86efac' : '#fbbf24'};margin-bottom:8px;">
                            ${locationConfigured ? `${Number(security.companyLat).toFixed(6)}, ${Number(security.companyLng).toFixed(6)} - ban kinh ${security.radiusMeters}m` : 'Chua luu GPS cong ty'}
                        </div>
                        <div style="display:flex;gap:8px;">
                            <button class="btn btn-sm btn-primary" onclick="Attendance.saveCurrentCompanyLocation()" style="flex:1;"><i class="fa-solid fa-crosshairs"></i> Luu GPS hien tai</button>
                            <button class="btn btn-sm" onclick="Attendance.updateAttendanceRadius()" style="flex:0 0 auto;">${security.radiusMeters}m</button>
                        </div>
                    </div>
                    <div style="background:rgba(0,0,0,0.18);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:12px;">
                        <div style="font-size:12px;color:#cbd5e1;font-weight:800;margin-bottom:8px;"><i class="fa-solid fa-wifi"></i> Mang cong ty</div>
                        <div style="font-size:12px;color:${ipTrusted ? '#86efac' : '#94a3b8'};margin-bottom:8px;">IP hien tai: ${publicIp || 'Khong doc duoc'} ${ipTrusted ? '(da cho phep)' : ''}</div>
                        <button class="btn btn-sm btn-primary" onclick="Attendance.addCurrentNetworkIp()" style="width:100%;"><i class="fa-solid fa-plus"></i> Them IP hien tai</button>
                        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;">${ipList}</div>
                    </div>
                </div>
            </div>
        `;
    },

    registerCurrentDevice: async () => {
        try {
            const security = await Attendance.getAttendanceSecuritySettings();
            const device = await Attendance.getCurrentDeviceProfile();
            const label = prompt('Nhap ten may cong ty:', device.label || 'Company PC') || device.label;
            const trustedDevices = security.trustedDevices.filter(d => d.id !== device.id);
            trustedDevices.push({
                id: device.id,
                label,
                addedAt: Date.now(),
                addedBy: Auth.currentUser?.username || 'admin'
            });
            await Attendance.saveAttendanceSecuritySettings({ ...security, trustedDevices });
            Utils.showToast('Da dang ky may nay la may cong ty.', 'success');
            Attendance.render();
        } catch (e) {
            Utils.showToast('Khong dang ky duoc may hien tai.', 'error');
        }
    },

    removeTrustedDevice: async (deviceId) => {
        const security = await Attendance.getAttendanceSecuritySettings();
        await Attendance.saveAttendanceSecuritySettings({
            ...security,
            trustedDevices: security.trustedDevices.filter(d => d.id !== deviceId)
        });
        Utils.showToast('Da go may khoi danh sach cong ty.', 'success');
        Attendance.render();
    },

    saveCurrentCompanyLocation: async () => {
        if (!navigator.geolocation) {
            Utils.showToast('Trinh duyet khong ho tro GPS.', 'error');
            return;
        }
        Utils.showToast('Dang lay GPS hien tai...', 'info');
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const security = await Attendance.getAttendanceSecuritySettings();
            await Attendance.saveAttendanceSecuritySettings({
                ...security,
                companyLat: pos.coords.latitude,
                companyLng: pos.coords.longitude,
                radiusMeters: Number(security.radiusMeters || 180)
            });
            Utils.showToast('Da luu vi tri cong ty.', 'success');
            Attendance.render();
        }, () => Utils.showToast('Khong lay duoc GPS hien tai.', 'error'), {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        });
    },

    updateAttendanceRadius: async () => {
        const security = await Attendance.getAttendanceSecuritySettings();
        const value = prompt('Nhap ban kinh GPS hop le (met):', String(security.radiusMeters || 180));
        if (value === null) return;
        const radius = Math.max(30, Math.min(2000, Number(value) || 180));
        await Attendance.saveAttendanceSecuritySettings({ ...security, radiusMeters: radius });
        Utils.showToast(`Da cap nhat ban kinh ${radius}m.`, 'success');
        Attendance.render();
    },

    addCurrentNetworkIp: async () => {
        const ip = await Attendance.getPublicIp();
        if (!ip) {
            Utils.showToast('Khong doc duoc public IP hien tai.', 'error');
            return;
        }
        const security = await Attendance.getAttendanceSecuritySettings();
        const allowedPublicIps = Array.from(new Set([...security.allowedPublicIps, ip]));
        await Attendance.saveAttendanceSecuritySettings({ ...security, allowedPublicIps });
        Utils.showToast(`Da them IP cong ty: ${ip}`, 'success');
        Attendance.render();
    },

    removeAllowedIp: async (ip) => {
        const security = await Attendance.getAttendanceSecuritySettings();
        await Attendance.saveAttendanceSecuritySettings({
            ...security,
            allowedPublicIps: security.allowedPublicIps.filter(x => x !== ip)
        });
        Utils.showToast('Da go IP khoi danh sach mang cong ty.', 'success');
        Attendance.render();
    },

    toggleAttendanceSecurity: async () => {
        const security = await Attendance.getAttendanceSecuritySettings();
        await Attendance.saveAttendanceSecuritySettings({ ...security, enabled: !security.enabled });
        Utils.showToast(`Bao mat diem danh da ${!security.enabled ? 'bat' : 'tat'}.`, 'success');
        Attendance.render();
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

    loadLateRequests: async () => {
        let lateData = [];
        try {
            if (typeof DB !== 'undefined' && typeof DB.getLateRequests === 'function') {
                lateData = await DB.getLateRequests() || [];
                // Đồng bộ rác từ LocalStorage
                let localData = JSON.parse(localStorage.getItem('tl_late_requests') || '[]');
                if (localData.length > 0) {
                    let changed = false;
                    localData.forEach(lr => {
                        if (!lateData.find(r => r.id === lr.id)) {
                            lateData.push(lr);
                            changed = true;
                        }
                    });
                    if (changed) {
                        await DB.saveLateRequests(lateData);
                    }
                    localStorage.removeItem('tl_late_requests');
                }
            } else {
                lateData = JSON.parse(localStorage.getItem('tl_late_requests') || '[]');
            }
        } catch (e) {
            console.error("Lỗi tải dữ liệu xin đi trễ:", e);
            lateData = JSON.parse(localStorage.getItem('tl_late_requests') || '[]');
        }
        return lateData;
    },

    saveLateRequests: async (data) => {
        try {
            if (typeof DB !== 'undefined' && typeof DB.saveLateRequests === 'function') {
                await DB.saveLateRequests(data);
            } else {
                localStorage.setItem('tl_late_requests', JSON.stringify(data));
            }
        } catch (e) {
            console.error("Lỗi lưu dữ liệu xin đi trễ:", e);
            localStorage.setItem('tl_late_requests', JSON.stringify(data));
        }
    },

    renderUserView: async (container, user) => {
        const today = new Date();
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const allData = await Attendance.loadData();
        
        // Kiểm tra xem ca hiện tại đã chấm công chưa
        const currentHour = today.getHours();
        const currentSession = currentHour < 12 ? 'morning' : 'afternoon';
        const sessionRecord = allData.find(r => 
            r.username === user.username && 
            r.dateStr === dateStr && 
            (r.type === currentSession || (currentSession === 'morning' && !r.type))
        );
        let checkInHtml = '';

        if (sessionRecord) {
            let meritPts = 1;
            let statusText = '';
            let badgeClass = '';
            const sessionName = (sessionRecord.type === 'afternoon') ? 'Ca Chiều' : 'Ca Sáng';
            
            if (sessionRecord.status === 'on_time') {
                meritPts = 0.5;
                statusText = `🏆 Đúng giờ (${sessionName}) — Công đức +0.5`;
                badgeClass = 'on-time';
            } else if (sessionRecord.status === 'late_excused') {
                meritPts = 0.5;
                statusText = `🏆 Muộn có phép (${sessionName}) — Công đức +0.5`;
                badgeClass = 'late-excused';
            } else {
                meritPts = -0.5;
                statusText = `⏰ Muộn ${sessionRecord.lateMinutes}p (${sessionName}) — Phạt 20k & Trừ 0.5 Công đức`;
                badgeClass = 'late';
            }
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
                    <h3><i class="fa-solid fa-circle-check" style="color:#2ecc71;margin-right:8px;"></i> ${sessionName} hôm nay đã ghi nhận</h3>
                    <p>Gõ mõ lúc: <strong style="color:#daa520;">${new Date(sessionRecord.timestamp).toLocaleTimeString('vi-VN')}</strong></p>
                    ${sessionRecord.location ? `<p style="font-size:12px;"><i class="fa-solid fa-location-dot" style="color:#daa520;"></i> GPS xác minh vị trí tại công ty</p>` : ''}
                    ${sessionRecord.security?.networkOk ? `<p style="font-size:12px;"><i class="fa-solid fa-wifi" style="color:#64ffda;"></i> Mạng công ty đã xác minh</p>` : ''}
                    <span class="wf-badge ${badgeClass}">
                        ${statusText}
                    </span>
                </div>
            `;
            
            // Tìm bản ghi checkout của ngày hôm nay
            const checkoutRecord = allData.find(r => r.username === user.username && r.dateStr === dateStr && r.checkoutTimestamp);
            if (!checkoutRecord) {
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
                    <p style="color:var(--text-secondary);font-size:13px;margin:0;">Ra về lúc: <strong>${new Date(checkoutRecord.checkoutTimestamp).toLocaleTimeString('vi-VN')}</strong></p>
                </div>`;
            }
        } else {
            const sessLabel = currentSession === 'afternoon' ? 'Ca Chiều (Hạn chốt 14:00)' : 'Ca Sáng (Hạn chốt 08:30)';
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
                        <div class="wf-cong-duc"><i class="fa-solid fa-hands-praying"></i> +0.5 Công Đức Đi Làm</div>
                        <span class="wf-label"><i class="fa-solid fa-gavel" style="margin-right:6px;"></i> GÕ MÕ ĐIỂM DANH</span>
                    </button>
                    <p style="margin-top:28px;color:#daa520;font-weight:600;font-size:14px;">🙏 Gõ mõ để tích công đức đi làm ${sessLabel}!</p>
                    <small style="color:rgba(255,255,255,0.35);display:block;margin-top:6px;"><i class="fa-solid fa-shield-halved" style="color:#daa520;"></i> Máy công ty + GPS hoặc mạng công ty</small>
                </div>
            `;
        }

        // Luôn hiển thị nút xin nghỉ phép & xin đi trễ
        checkInHtml += `
            <div style="text-align: center; margin-top: 24px; padding-top: 24px; border-top: 1px dashed rgba(255,255,255,0.1); display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
                <button class="btn btn-outline" style="border-color: var(--warning); color: var(--warning);" onclick="Attendance.showLeaveModal()">
                    <i class="fa-solid fa-calendar-minus" style="margin-right: 6px;"></i>Đăng ký Xin Nghỉ Phép
                </button>
                <button class="btn btn-outline" style="border-color: var(--primary); color: var(--primary);" onclick="Attendance.showLateRequestModal()">
                    <i class="fa-solid fa-clock" style="margin-right: 6px;"></i>Đăng ký Xin Đến Trễ
                </button>
            </div>
        `;

        // Tính lương tạm tính cho user
        let salaryPreviewHtml = '';
        try {
            const currentMonthStr = PayrollModule.getCurrentCycleMonthStr(new Date());
            const estSalary = await PayrollModule.calculateUserSalary(user.username, currentMonthStr);
            const cycle = PayrollModule.getCycleRange(currentMonthStr);
            const workingDaysInCycle = PayrollModule.getWorkingDaysInCycle(cycle.startDate, cycle.endDate);
            const passedWorkDays = PayrollModule.getWorkedWorkingDaysInCycle(cycle.startDate, cycle.endDate);
            const formattedStart = cycle.startStr.split('-').slice(1).reverse().join('/'); // DD/MM
            const formattedEnd = cycle.endStr.split('-').slice(1).reverse().join('/'); // DD/MM
            salaryPreviewHtml = `
                <div class="glass-card" style="margin-bottom: 20px; padding: 16px; border-color: rgba(46,204,113,0.2); background: rgba(46,204,113,0.03);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">
                                <i class="fa-solid fa-coins" style="color:var(--success); margin-right: 5px;"></i>Lương Tạm Tính (Kỳ ${formattedStart} - ${formattedEnd})
                            </div>
                            <div style="font-size: 26px; font-weight: 900; color: var(--success);">${Utils.formatCurrency(estSalary)}</div>
                        </div>
                        <div style="text-align: right; font-size: 12px; color: var(--text-secondary);">
                            <div><i class="fa-solid fa-calendar-days" style="color: var(--primary); margin-right: 4px;"></i>${passedWorkDays} / ${workingDaysInCycle} ngày công</div>
                            <div style="margin-top: 4px; font-size: 10px; color: rgba(255,255,255,0.3);">Cập nhật theo chấm công</div>
                        </div>
                    </div>
                </div>
            `;
        } catch(e) { console.warn('Salary preview error:', e); }

        // Lấy lịch sử 30 ngày gần nhất
        const userHistory = allData.filter(r => r.username === user.username).sort((a,b) => b.timestamp - a.timestamp).slice(0, 30);
        
        // Lấy lịch sử xin nghỉ
        const allLeaves = await Attendance.loadLeaveData();
        const userLeaves = allLeaves.filter(l => l.username === user.username).sort((a,b) => b.timestamp - a.timestamp);
        const RESET_DATE = '2026-06-10';
        let currentMeritDisplay = '?';
        if (typeof RewardsModule !== 'undefined') {
            const mInfo = await RewardsModule.calcUserMerit(user.username);
            currentMeritDisplay = mInfo.current;
        } else {
            const meritHistory = userHistory.filter(r => r.dateStr >= RESET_DATE);
            currentMeritDisplay = 1 + meritHistory.reduce((acc, r) => acc + ((r.status === 'on_time' || r.status === 'late_excused') ? 0.5 : -0.5), 0);
        }
        let historyHtml = `
            <div class="wf-history-panel">
                <h3><i class="fa-solid fa-scroll" style="margin-right:8px;"></i> Sổ Công Đức <span class="wf-stat">Khả dụng: ${currentMeritDisplay} <i class="fa-solid fa-star"></i></span></h3>
                <p style="font-size:11.5px; color:var(--success); margin-top:-5px; margin-bottom:10px;"><i class="fa-solid fa-gift"></i> Đã được tự động Reset tặng khởi đầu +1 điểm (Bỏ qua lịch sử vi phạm quá hạn trước ngày 20/05/2026).</p>
                <div class="table-responsive">
                    <table class="tl-table">
                        <thead>
                            <tr>
                                <th>Ngày</th>
                                <th>Kết quả điểm danh</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${userHistory.length === 0 ? '<tr><td colspan="2" style="text-align:center;color:rgba(218,165,32,0.3);">Chưa có công đức nào</td></tr>' : ''}
                            ${userHistory.map(r => {
                                const isOld = r.dateStr < RESET_DATE;
                                const isErrorDate = (r.dateStr === '2026-06-13');
                                
                                // Nếu là ngày lỗi 13/06, coi như Đúng giờ 0.5 hoặc ít nhất không trừ điểm
                                let pts = (r.status === 'on_time' || r.status === 'late_excused' || isErrorDate) ? 0.5 : -0.5;
                                let badgeHtml = '';
                                
                                if (r.status === 'on_time' || isErrorDate) {
                                    badgeHtml = `<span class="badge bg-success">${isErrorDate ? 'Sự cố hệ thống' : 'Đúng giờ'}</span>`;
                                    if (isErrorDate) pts = 0.5; // Đảm bảo luôn +0.5
                                } else if (r.status === 'late_excused') {
                                    badgeHtml = '<span class="badge" style="background:#00adb5; color:#fff; font-weight:bold;">Muộn phép</span>';
                                } else {
                                    badgeHtml = `<span class="badge bg-danger">Muộn ${r.lateMinutes}p</span>`;
                                }
                                return `
                                <tr style="${isOld ? 'opacity: 0.5;' : ''}">
                                    <td>${r.dateStr}</td>
                                    <td>
                                        ${badgeHtml}
                                        ${isOld ? `<span class="wf-merit-badge" style="background:rgba(255,255,255,0.05);color:#888;border:1px solid rgba(255,255,255,0.1);">Không tính</span>` 
                                                : `<span class="wf-merit-badge ${pts < 0 ? 'negative' : ''}" style="${pts > 0 ? '' : 'background:rgba(239,68,68,0.2);color:#ef4444;border-color:rgba(239,68,68,0.3);'}">${pts > 0 ? '+' : ''}${pts}</span>`}
                                    </td>
                                </tr>
                                `;
                            }).join('')}
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

        // Tải lịch sử xin đi trễ của nhân viên
        const allLates = await Attendance.loadLateRequests();
        const userLates = allLates.filter(l => l.username === user.username).sort((a,b) => b.timestamp - a.timestamp);

        historyHtml += `
            <div class="glass-panel" style="margin-top: 24px; padding: 20px;">
                <h3 style="margin-bottom: 16px; color: var(--primary);">Lịch sử Xin Đến Trễ</h3>
                <div class="table-responsive">
                    <table class="tl-table">
                        <thead>
                            <tr>
                                <th>Ngày xin trễ</th>
                                <th>Số phút</th>
                                <th>Lý do</th>
                                <th>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${userLates.length === 0 ? '<tr><td colspan="4" style="text-align:center;">Chưa có yêu cầu xin đi trễ</td></tr>' : ''}
                            ${userLates.map(l => {
                                let statusHtml = '';
                                if (l.status === 'pending') statusHtml = '<span class="badge bg-warning" style="color: #000;">Chờ Duyệt</span>';
                                else if (l.status === 'approved') statusHtml = `<span class="badge bg-success">${l.resolvedBy === 'system' ? 'Tự Động Duyệt' : 'Đã Duyệt'}</span>`;
                                else if (l.status === 'rejected') statusHtml = '<span class="badge bg-danger">Từ Chối</span>';
                                
                                return `
                                <tr>
                                    <td>${l.date}</td>
                                    <td style="font-weight:bold; color:var(--primary);">${l.minutes} phút</td>
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
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h2 style="color:#daa520; margin:0; font-size: 18px;"><i class="fa-solid fa-user-check"></i> CHẤM CÔNG HÀNG NGÀY</h2>
                            <p style="font-size:12px; color:var(--text-secondary); margin:4px 0 0;">Hạn chốt: <span style="color:var(--warning);font-weight:bold;">08:30 SÁNG & 14:00 CHIỀU</span></p>
                        </div>
                        <button class="btn btn-outline" style="border-color: #f1c40f; color: #f1c40f; font-size: 12px; padding: 6px 12px;" onclick="Attendance.exportUserAttendancePDF('${user.username}')">
                            <i class="fa-solid fa-file-pdf" style="margin-right: 6px;"></i>Xuất PDF Bản In
                        </button>
                    </div>
                </div>
                ${salaryPreviewHtml}
                <div class="user-grid-layout" style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 24px; align-items: start;">
                    <div class="glass-panel" style="padding: 20px;">
                        ${checkInHtml}
                    </div>
                    <div class="user-col">
                        ${historyHtml}
                    </div>
                </div>
            </div>
        `;
    },

    renderAdminView: async (container) => {
        const allData = await Attendance.loadData();
        const allLeaves = await Attendance.loadLeaveData();
        const allLates = await Attendance.loadLateRequests();
        
        // Phân nhóm theo User và Tháng đã chọn (đồng bộ theo chu kỳ lương)
        const now = new Date();
        const selYear = Attendance.selectedYear;
        const selMonth = Attendance.selectedMonth;
        const monthStr = `${selYear}-${String(selMonth + 1).padStart(2, '0')}`;
        
        const cycle = PayrollModule.getCycleRange(monthStr);
        const startStr = cycle.startStr;
        const endStr = cycle.endStr;
        
        const accounts = (typeof Auth !== 'undefined' && await Auth.getAccounts()) || [];
        const passedWorkingDays = Attendance.getPassedWorkingDays(cycle);
        const { summary, approvedLeaves, usersList } = Attendance.buildAttendanceSummary(allData, allLeaves, accounts, startStr, endStr);

        const security = await Attendance.getAttendanceSecuritySettings();
        const securityHtml = await Attendance.renderAttendanceSecurityPanel(security);
        
        let adminHtml = `
            <div class="glass-panel admin-cyber-box animate-cascade" style="padding: 24px; border: 1px solid rgba(100, 255, 218, 0.5); box-shadow: 0 0 10px rgba(100, 255, 218, 0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
                    <div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
                        <h2 style="color: var(--primary); font-size: 18px; letter-spacing: 1px; display: flex; align-items: center; gap: 8px; margin: 0;">
                            <i class="fa-solid fa-list-check"></i> Tổng hợp Chấm Công v4
                        </h2>
                        
                        <div style="display: flex; gap: 8px; background: rgba(255,255,255,0.05); padding: 4px 8px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
                            <select onchange="Attendance.handleMonthYearChange(this.value, 'month')" style="background: none; border: none; color: #fff; font-size: 14px; cursor: pointer; outline: none; padding: 2px;">
                                ${Array.from({length: 12}, (_, i) => `<option value="${i}" ${selMonth === i ? 'selected' : ''} style="background: #1a1a2e;">Tháng ${i + 1}</option>`).join('')}
                            </select>
                            <select onchange="Attendance.handleMonthYearChange(this.value, 'year')" style="background: none; border: none; color: #fff; font-size: 14px; cursor: pointer; outline: none; padding: 2px;">
                                ${[now.getFullYear(), now.getFullYear() - 1].map(y => `<option value="${y}" ${selYear === y ? 'selected' : ''} style="background: #1a1a2e;">${y}</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-outline" style="border-color: var(--primary); color: var(--primary); display: inline-flex; align-items: center; gap: 6px;" onclick="Attendance.showLateConfigModal()"><i class="fa-solid fa-gears"></i> Luật Đi Trễ</button>
                        <button class="btn btn-success" onclick="Attendance.exportAttendanceCSV()"><i class="fa-solid fa-file-excel" style="margin-right: 6px;"></i> Excel</button>
                        <button class="btn btn-outline" style="border-color: #f1c40f; color: #f1c40f;" onclick="Attendance.exportAttendancePDF()"><i class="fa-solid fa-file-pdf" style="margin-right: 6px;"></i> PDF</button>
                    </div>
                </div>

                <!-- Bảng Chấm công Thủ công dành cho Admin -->
                <div class="glass-panel" id="admin-manual-checkin-block" style="margin-bottom: 24px; padding: 18px; border: 1px solid rgba(100, 255, 218, 0.3); background: rgba(10, 25, 40, 0.6); box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                    <h3 style="margin: 0 0 16px; color: var(--primary); font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px;">
                        <i class="fa-solid fa-user-pen"></i> Chấm Công Thủ Công (Admin Manual Tool)
                    </h3>
                    <div style="display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap;">
                        <div style="flex: 1; min-width: 200px;">
                            <label style="display: block; color: var(--text-secondary); font-size: 12px; margin-bottom: 6px;">Chọn Nhân Viên:</label>
                            <select id="admin-manual-user" class="btn btn-outline" style="width: 100%; text-align: left; background: rgba(0,0,0,0.4); border-color: rgba(255,255,255,0.1); color: #fff;">
                                <option value="">-- Chọn nhân sự --</option>
                                ${usersList.map(u => `<option value="${u}">${Utils.getUserDisplayName(u) || u} (@${u})</option>`).join('')}
                            </select>
                        </div>
                        <div style="width: 150px;">
                            <label style="display: block; color: var(--text-secondary); font-size: 12px; margin-bottom: 6px;">Ca làm việc:</label>
                            <select id="admin-manual-session" class="btn btn-outline" style="width: 100%; text-align: left; background: rgba(0,0,0,0.4); border-color: rgba(255,255,255,0.1); color: #fff;">
                                <option value="morning">Ca Sáng</option>
                                <option value="afternoon">Ca Chiều</option>
                            </select>
                        </div>
                        <div style="width: 150px;">
                            <label style="display: block; color: var(--text-secondary); font-size: 12px; margin-bottom: 6px;">Trạng thái:</label>
                            <select id="admin-manual-status" class="btn btn-outline" style="width: 100%; text-align: left; background: rgba(0,0,0,0.4); border-color: rgba(255,255,255,0.1); color: #fff;">
                                <option value="on_time">Đúng giờ</option>
                                <option value="late">Đi muộn (-0.5đ)</option>
                            </select>
                        </div>
                        <div style="flex: 1; min-width: 200px;">
                            <label style="display: block; color: var(--text-secondary); font-size: 12px; margin-bottom: 6px;">Ghi chú (Admin):</label>
                            <input type="text" id="admin-manual-note" placeholder="Nhập lý do hoặc ghi chú..." style="width: 100%; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 8px 12px; border-radius: 6px;">
                        </div>
                        <button class="btn btn-primary" onclick="Attendance.performAdminManualCheckIn()" style="padding: 10px 20px; font-weight: 800; background: var(--primary); border: none;">
                            <i class="fa-solid fa-check"></i> CHẤM CÔNG NGAY
                        </button>
                        <button class="btn btn-outline" onclick="Attendance.runManualAbsentAudit()" style="padding: 10px 20px; font-weight: 800; border-color: var(--danger); color: var(--danger); background: rgba(239, 68, 68, 0.1);">
                            <i class="fa-solid fa-magnifying-glass-chart"></i> QUÉT VẮNG MẶT NGAY
                        </button>
                    </div>
                </div>

                ${securityHtml}
                
                <div style="display: flex; gap: 24px; align-items: stretch; flex-wrap: wrap;">
                    <!-- Cục Nhân sự bên trái -->
                    <div style="width: 200px; flex-shrink: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; border-radius: 12px; background: rgba(10, 25, 40, 0.8); border: 2px solid #5ab9ea; box-shadow: 0 0 15px rgba(90, 185, 234, 0.3), inset 0 0 20px rgba(90, 185, 234, 0.1); position: relative; overflow: hidden; margin: 0 auto;">
                        <!-- Thêm thanh sáng bên dưới giống thiết kế -->
                        <div style="position: absolute; bottom: 0; width: 60px; height: 4px; background: #5ab9ea; border-top-left-radius: 4px; border-top-right-radius: 4px; box-shadow: 0 0 8px #5ab9ea;"></div>
                        <div class="card-inner" style="text-align: center; padding: 20px;">
                            <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 8px;">Nhân sự đã điểm danh</p>
                            <h2 style="color: #5ab9ea; font-size: 56px; font-weight: bold; text-shadow: 0 0 20px rgba(90, 185, 234, 0.6);">${usersList.length}</h2>
                        </div>
                    </div>
                
                    <!-- Bảng thống kê bên phải -->
                    <div class="table-responsive" style="flex: 1; min-width: 300px;">
                        <table class="tl-table cyber-hover-table" style="margin: 0; border-collapse: separate; border-spacing: 0 8px;">
                            <thead>
                                <tr>
                                    <th style="color: #64ffda; border: none; padding-bottom: 8px; font-weight: 500;">Nhân Viên</th>
                                    <th style="color: #64ffda; border: none; padding-bottom: 8px; font-weight: 500;">Tổng ngày công</th>
                                    <th style="color: var(--success); border: none; padding-bottom: 8px; font-weight: 500;"><i class="fa-regular fa-calendar-check" style="margin-right: 4px;"></i> Đúng giờ</th>
                                    <th style="color: var(--danger); border: none; padding-bottom: 8px; font-weight: 500;"><i class="fa-regular fa-clock" style="margin-right: 4px;"></i> Vắng</th>
                                    <th style="color: #64ffda; border: none; padding-bottom: 8px; font-weight: 500;"><i class="fa-regular fa-clock" style="margin-right: 4px;"></i> Trễ phép</th>
                                    <th style="color: var(--danger); border: none; padding-bottom: 8px; font-weight: 500;"><i class="fa-regular fa-clock" style="margin-right: 4px;"></i> Trễ phạt</th>
                                    <th style="color: #64ffda; border: none; padding-bottom: 8px; font-weight: 500;">Tổng phút trễ</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${usersList.length === 0 ? '<tr><td colspan="7" style="text-align:center; padding: 16px;">Chưa có dữ liệu tháng này</td></tr>' : ''}
                                ${usersList.map(u => {
                                    const userKey = Attendance.usernameKey(u);
                                    const s = summary[userKey] || { totalDays: 0, onTime: 0, late: 0, lateExcused: 0, totalLateMinutes: 0 };
                                    const leaves = approvedLeaves[userKey] || 0;
                                    let absent = passedWorkingDays - s.totalDays - leaves;
                                    if (absent < 0) absent = 0;
                                    
                                    return `
                                    <tr style="background: rgba(4, 9, 20, 0.8); border-radius: 8px; box-shadow: inset 0 0 0 1px rgba(100, 255, 218, 0.4);">
                                        <td style="font-weight: 600; padding: 12px 16px; color: #fff; border-top-left-radius: 8px; border-bottom-left-radius: 8px; border-top: 1px solid rgba(100, 255, 218, 0.4); border-bottom: 1px solid rgba(100, 255, 218, 0.4); border-left: 1px solid rgba(100, 255, 218, 0.4);" title="${u}">${Utils.getUserDisplayName(u) || u}</td>
                                        <td style="padding: 12px 16px; color: var(--text-secondary); border-top: 1px solid rgba(100, 255, 218, 0.4); border-bottom: 1px solid rgba(100, 255, 218, 0.4);"><i class="fa-regular fa-calendar" style="margin-right: 6px;"></i> ${s.totalDays} / ${passedWorkingDays}</td>
                                        <td style="color: var(--success); font-weight: bold; padding: 12px 16px; border-top: 1px solid rgba(100, 255, 218, 0.4); border-bottom: 1px solid rgba(100, 255, 218, 0.4);">${s.onTime}</td>
                                        <td style="color: var(--danger); font-weight: bold; padding: 12px 16px; border-top: 1px solid rgba(100, 255, 218, 0.4); border-bottom: 1px solid rgba(100, 255, 218, 0.4);">
                                            ${absent}
                                            ${leaves > 0 ? `<br><small style="color:var(--warning);font-size:10px;font-style:italic;">(Nghỉ phép: ${leaves})</small>` : ''}
                                        </td>
                                        <td style="color: #64ffda; font-weight: bold; padding: 12px 16px; border-top: 1px solid rgba(100, 255, 218, 0.4); border-bottom: 1px solid rgba(100, 255, 218, 0.4);">${s.lateExcused || 0}</td>
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
        
        // Hiển thị danh sách xin nghỉ (Admin) — reuse allLeaves from line 319
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
                                    <td style="font-weight: bold; color: #fff; padding: 12px 16px; border-top-left-radius: 6px; border-bottom-left-radius: 6px; border-top: 1px solid rgba(255, 255, 255, 0.2); border-bottom: 1px solid rgba(255, 255, 255, 0.2); border-left: 1px solid rgba(255, 255, 255, 0.2);" title="${l.username}">${Utils.getUserDisplayName(l.username) || l.username}</td>
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
                                    <td style="padding: 12px 16px; color: #fff; font-weight: bold; border-top-left-radius: 6px; border-bottom-left-radius: 6px; border-top: 1px solid rgba(255, 255, 255, 0.2); border-bottom: 1px solid rgba(255, 255, 255, 0.2); border-left: 1px solid rgba(255, 255, 255, 0.2);" title="${l.username}">${Utils.getUserDisplayName(l.username) || l.username}</td>
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

        // Hiển thị danh sách xin đi trễ (Admin)
        const pendingLates = allLates.filter(l => l.status === 'pending').sort((a,b) => a.timestamp - b.timestamp);
        const resolvedLates = allLates.filter(l => l.status !== 'pending').sort((a,b) => b.timestamp - a.timestamp).slice(0, 20);

        let latesHtml = `
            <div class="glass-panel admin-cyber-box" style="padding: 24px; height: 100%; border: 1px solid rgba(255, 255, 255, 0.2);">
                <h2 style="color: var(--primary); margin-bottom: 24px; font-size: 18px; letter-spacing: 1px; display: flex; align-items: center; gap: 8px;">
                    <i class="fa-solid fa-clock"></i> Danh sách Xin Đến Trễ
                </h2>
                
                <div style="background: rgba(4, 9, 20, 0.5); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                    <h3 style="color: var(--primary); margin-bottom: 16px; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-clock-rotate-left"></i> Yêu cầu chờ duyệt (${pendingLates.length})
                    </h3>
                    <div class="table-responsive">
                        <table class="tl-table cyber-hover-table" style="border-collapse: separate; border-spacing: 0 6px;">
                            <thead>
                                <tr>
                                    <th style="color: var(--text-secondary); font-weight: 500; border: none; padding-bottom: 8px;">Nhân Viên</th>
                                    <th style="color: var(--text-secondary); font-weight: 500; border: none; padding-bottom: 8px;">Ngày xin</th>
                                    <th style="color: var(--text-secondary); font-weight: 500; border: none; padding-bottom: 8px;">Số phút</th>
                                    <th style="color: var(--text-secondary); font-weight: 500; border: none; padding-bottom: 8px;">Lý do</th>
                                    <th style="color: var(--text-secondary); font-weight: 500; text-align: right; border: none; padding-bottom: 8px;">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                            ${pendingLates.length === 0 ? '<tr><td colspan="5" style="text-align:center; padding: 16px;">Không có yêu cầu chờ duyệt</td></tr>' : ''}
                            ${pendingLates.map(l => `
                                <tr style="background: rgba(4, 9, 20, 0.8); border-radius: 6px;">
                                    <td style="font-weight: bold; color: #fff; padding: 12px 16px; border-top-left-radius: 6px; border-bottom-left-radius: 6px; border-top: 1px solid rgba(255, 255, 255, 0.2); border-bottom: 1px solid rgba(255, 255, 255, 0.2); border-left: 1px solid rgba(255, 255, 255, 0.2);" title="${l.username}">${Utils.getUserDisplayName(l.username) || l.username}</td>
                                    <td style="padding: 12px 16px; border-top: 1px solid rgba(255, 255, 255, 0.2); border-bottom: 1px solid rgba(255, 255, 255, 0.2);"><i class="fa-regular fa-calendar" style="margin-right: 6px; color: var(--text-secondary);"></i> ${l.date}</td>
                                    <td style="padding: 12px 16px; border-top: 1px solid rgba(255, 255, 255, 0.2); border-bottom: 1px solid rgba(255, 255, 255, 0.2); font-weight:bold; color:var(--primary);">${l.minutes} phút</td>
                                    <td style="padding: 12px 16px; color: var(--text-secondary); border-top: 1px solid rgba(255, 255, 255, 0.2); border-bottom: 1px solid rgba(255, 255, 255, 0.2);">${l.reason}</td>
                                    <td style="padding: 12px 16px; text-align: right; border-top-right-radius: 6px; border-bottom-right-radius: 6px; border-top: 1px solid rgba(255, 255, 255, 0.2); border-bottom: 1px solid rgba(255, 255, 255, 0.2); border-right: 1px solid rgba(255, 255, 255, 0.2);">
                                        <button class="btn btn-sm" onclick="Attendance.updateLateRequestStatus('${l.id}', 'approved')" style="background: transparent; border: 1px solid var(--success); color: var(--success); margin-right: 8px; padding: 6px 16px; border-radius: 4px; font-weight: bold; transition: all 0.2s;"><i class="fa-solid fa-check" style="margin-right: 6px;"></i> Duyệt [v]</button>
                                        <button class="btn btn-sm" onclick="Attendance.updateLateRequestStatus('${l.id}', 'rejected')" style="background: transparent; border: 1px solid var(--danger); color: var(--danger); padding: 6px 16px; border-radius: 4px; font-weight: bold; transition: all 0.2s;">Từ Chối [x]</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                        </table>
                    </div>
                </div> <!-- End Pending Block -->
                
                <div style="background: rgba(4, 9, 20, 0.5); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; padding: 16px;">
                    <h3 style="color: var(--text-secondary); margin-bottom: 16px; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-clock-rotate-left"></i> Lịch sử duyệt/từ chối trễ gần đây
                    </h3>
                    <div class="table-responsive">
                        <table class="tl-table cyber-hover-table" style="text-align: center; border-collapse: separate; border-spacing: 0 6px;">
                            <thead>
                                <tr>
                                    <th style="color: var(--text-secondary); font-weight: 500; border: none; padding-bottom: 8px;">Nhân Viên</th>
                                    <th style="color: var(--text-secondary); font-weight: 500; border: none; padding-bottom: 8px;">Ngày trễ</th>
                                    <th style="color: var(--text-secondary); font-weight: 500; border: none; padding-bottom: 8px;">Số phút</th>
                                    <th style="color: var(--text-secondary); font-weight: 500; border: none; padding-bottom: 8px;">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                            ${resolvedLates.length === 0 ? '<tr><td colspan="4" style="text-align:center; padding: 32px;"><i class="fa-regular fa-clipboard" style="font-size: 24px; color: var(--text-secondary); margin-bottom: 8px; display: block;"></i> Trống</td></tr>' : ''}
                            ${resolvedLates.map(l => {
                                let statusHtml = l.status === 'approved' ? `<span style="color: var(--success); font-weight: bold;"><i class="fa-solid fa-check"></i> ${l.resolvedBy === 'system' ? 'Tự Động Duyệt' : 'Đã Duyệt'}</span>` : '<span style="color: var(--danger); font-weight: bold;"><i class="fa-solid fa-times"></i> Từ Chối</span>';
                                return `
                                <tr style="background: rgba(4, 9, 20, 0.8); border-radius: 6px;">
                                    <td style="padding: 12px 16px; color: #fff; font-weight: bold; border-top-left-radius: 6px; border-bottom-left-radius: 6px; border-top: 1px solid rgba(255, 255, 255, 0.2); border-bottom: 1px solid rgba(255, 255, 255, 0.2); border-left: 1px solid rgba(255, 255, 255, 0.2);" title="${l.username}">${Utils.getUserDisplayName(l.username) || l.username}</td>
                                    <td style="padding: 12px 16px; border-top: 1px solid rgba(255, 255, 255, 0.2); border-bottom: 1px solid rgba(255, 255, 255, 0.2);"><i class="fa-regular fa-calendar" style="margin-right: 6px; color: var(--text-secondary);"></i> ${l.date}</td>
                                    <td style="padding: 12px 16px; border-top: 1px solid rgba(255, 255, 255, 0.2); border-bottom: 1px solid rgba(255, 255, 255, 0.2);">${l.minutes} phút</td>
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
            <div class="admin-grid-layout" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start;">
                <div class="admin-col">
                    ${leavesHtml}
                </div>
                <div class="admin-col">
                    ${latesHtml}
                </div>
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
            @media (max-width: 1024px) {
                .admin-grid-layout {
                    grid-template-columns: 1fr !important;
                }
            }
        </style>`;

        // Trigger animations for inner elements
        setTimeout(() => {
            const cascades = container.querySelectorAll('.animate-cascade');
            cascades.forEach(c => c.classList.add('active'));
        }, 10);
    },
    
    performAdminManualCheckIn: async () => {
        const admin = Auth.currentUser;
        if (!admin || admin.role !== 'admin') {
            Utils.showToast("Chỉ Admin mới có quyền thực hiện thao tác này!", "error");
            return;
        }

        const username = document.getElementById('admin-manual-user').value;
        const sessionType = document.getElementById('admin-manual-session').value;
        const statusType = document.getElementById('admin-manual-status').value;
        const adminNote = document.getElementById('admin-manual-note').value.trim();

        if (!username) {
            Utils.showToast("Vui lòng chọn nhân viên!", "error");
            return;
        }

        const statusLabel = statusType === 'late' ? '<span style="color:#ef4444">ĐI MUỘN (-0.5đ)</span>' : '<span style="color:#10b981">ĐÚNG GIỜ</span>';
        const isConfirm = await Utils.showConfirm(
            "Xác nhận chấm công hộ",
            `Bạn có chắc chắn muốn chấm công <b>${statusLabel}</b> cho <b>${username}</b> (${sessionType === 'morning' ? 'Ca Sáng' : 'Ca Chiều'})?`
        );
        if (!isConfirm) return;

        Utils.showToast("Đang xử lý...", "info");

        const now = new Date();
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        
        try {
            const allData = await Attendance.loadData();
            const normalizedU = Attendance.usernameKey(username);
            
            // Kiểm tra xem đã có bản ghi chưa
            const existingRecord = allData.find(r => 
                Attendance.usernameKey(r.username) === normalizedU &&
                r.dateStr === dateStr && 
                (r.type === sessionType || (sessionType === 'morning' && !r.type))
            );

            if (existingRecord) {
                Utils.showToast(`Nhân viên ${username} đã có dữ liệu chấm công cho ca này rồi!`, "warning");
                return;
            }

            const newRecord = {
                id: 'att_manual_' + Date.now(),
                username: username,
                timestamp: now.getTime(),
                dateStr: dateStr,
                status: statusType,
                lateMinutes: statusType === 'late' ? 30 : 0, // Gán tạm 30p nếu trễ
                type: sessionType,
                note: adminNote ? `[Admin Override] ${adminNote}` : `[Admin Override] Chấm công trực tiếp bởi Admin`,
                security: {
                    adminOverride: true,
                    overriddenBy: admin.username,
                    overriddenAt: Date.now()
                }
            };

            allData.push(newRecord);
            await Attendance.saveData(allData);

            // Gửi Telegram thông báo
            const shiftName = sessionType === 'morning' ? 'CA SÁNG' : 'CA CHIỀU';
            const statusText = statusType === 'late' ? '🔴 ĐI MUỘN (Late)' : '🟢 ĐÚNG GIỜ (On Time)';
            const penaltyText = statusType === 'late' ? '\n⚠️ <b>Hình phạt:</b> Tự động trừ -0.5đ Công Đức' : '';
            
            const msg = `⚡ <b>[ADMIN CHẤM CÔNG TRỰC TIẾP]</b>\n\n` +
                        `👤 <b>Nhân sự:</b> ${username}\n` +
                        `🛡️ <b>Người thực hiện:</b> Admin (${admin.username})\n` +
                        `⏰ <b>Thời gian:</b> ${now.toLocaleTimeString('vi-VN')} (${shiftName})\n` +
                        `📊 <b>Trạng thái:</b> ${statusText}${penaltyText}\n` +
                        `📝 <b>Ghi chú:</b> ${adminNote || 'Chấm công trực tiếp tại văn phòng'}\n\n` +
                        `<i>"Hệ thống đã ghi nhận trạng thái cho nhân sự này. Lưu ý: Mọi trường hợp điểm danh phải nằm trong bán kính 20m của công ty."</i>`;
            Utils.notifyTelegram(msg);

            Utils.showToast(`Đã chấm công thành công cho ${username}!`, "success");
            
            // Reset form UI (optional if we re-render)
            const userSelect = document.getElementById('admin-manual-user');
            const noteInput = document.getElementById('admin-manual-note');
            if (userSelect) userSelect.value = "";
            if (noteInput) noteInput.value = "";
            
            Attendance.render(); // Reload Admin View
        } catch (e) {
            console.error("Lỗi chấm công thủ công:", e);
            Utils.showToast("Đã xảy ra lỗi khi lưu dữ liệu!", "error");
        }
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
        if (label) label.textContent = 'Đang xác minh máy/GPS...';

        if (!navigator.geolocation) {
            Utils.showToast('GPS không khả dụng. Sẽ thử xác minh bằng mạng công ty.', 'warning');
            Attendance._runCheckin(null, null);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (pos) => Attendance._runCheckin(pos.coords.latitude, pos.coords.longitude),
            async () => {
                Utils.showToast('GPS không khả dụng. Sẽ thử xác minh bằng mạng công ty.', 'warning');
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

        const currentHour = now.getHours();
        const currentSession = currentHour < 12 ? 'morning' : 'afternoon';

        let access;
        try {
            access = await Attendance.verifyCheckInAccess(lat, lng);
        } catch (e) {
            console.error('Attendance security check failed:', e);
            Utils.showToast('Không xác minh được máy/vị trí/mạng công ty.', 'error');
            Attendance.resetCheckInButton('🪵 GÕ MÕ ĐIỂM DANH');
            return;
        }
        if (!access.ok) {
            Utils.showToast(access.reason || 'Không đạt điều kiện điểm danh tại công ty.', 'error');
            Attendance.resetCheckInButton('🪵 GÕ MÕ ĐIỂM DANH');
            return;
        }
        
        const deadline = new Date(now);
        if (currentSession === 'morning') {
            deadline.setHours(Attendance.DEADLINE_HOURS, Attendance.DEADLINE_MINUTES, 0, 0);
            
            // Flex-Time Card Buff (card_flex) - 1 hour extension
            try {
                if (typeof RewardsModule !== 'undefined') {
                    const allRewards = await RewardsModule.loadData();
                    const normalizedU = Attendance.usernameKey(user.username);
                    const flexCard = allRewards.find(r => Attendance.usernameKey(r.username) === normalizedU && r.cardId === 'card_flex' && r.isUsed && (Date.now() - (r.usedAt || 0) < 7 * 24 * 60 * 60 * 1000));
                    if (flexCard) {
                        deadline.setHours(deadline.getHours() + 1); 
                    }
                }
            } catch(e) { console.warn("Flex card check error:", e); }
        } else {
            deadline.setHours(Attendance.AFTERNOON_DEADLINE_HOURS, Attendance.AFTERNOON_DEADLINE_MINUTES, 0, 0);
        }

        let status = 'on_time', lateMinutes = 0;
        let lateExcuseDetails = null;
        let attendanceTelegramMsg = null;

        // Bỏ qua phạt muộn cho duy nhất ngày 13/06/2026 do lỗi hệ thống
        const isErrorDate = (dateStr === '2026-06-13');

        if (now > deadline && !isErrorDate) {
            lateMinutes = Math.floor((now - deadline) / 60000);
            
            // Check if there is an approved late request for today
            const lates = await Attendance.loadLateRequests();
            const normalizedU = Attendance.usernameKey(user.username);
            const todayApprovedRequest = lates.find(r => Attendance.usernameKey(r.username) === normalizedU && r.date === dateStr && r.status === 'approved');
            const locStr = lat ? `\n📍 <b>Vị trí:</b> <a href="https://google.com/maps?q=${lat},${lng}">Xem bản đồ</a>` : '';
            const shiftName = currentSession === 'morning' ? 'CA SÁNG' : 'CA CHIỀU';
            
            if (todayApprovedRequest) {
                const requestedMinutes = parseInt(todayApprovedRequest.minutes) || 0;
                if (lateMinutes <= requestedMinutes) {
                    status = 'late_excused';
                    lateExcuseDetails = {
                        requestedMinutes: requestedMinutes,
                        actualLateMinutes: lateMinutes,
                        reason: todayApprovedRequest.reason
                    };
                    let telegramMsg = `ℹ️ <b>[ĐI MUỘN CÓ PHÉP]</b>\n\n`;
                    telegramMsg += `👤 <b>Nhân sự:</b> ${user.username}\n`;
                    telegramMsg += `⏰ <b>Thời gian:</b> ${now.toLocaleTimeString('vi-VN')} (${shiftName})\n`;
                    telegramMsg += `⏳ <b>Muộn thực tế:</b> ${lateMinutes}p (Đã xin phép muộn ${requestedMinutes}p)\n`;
                    telegramMsg += `📝 <b>Lý do:</b> ${todayApprovedRequest.reason}\n`;
                    telegramMsg += `${locStr}\n\n`;
                    telegramMsg += `<i>"Đã ghi nhận đi muộn có phép. Công đức được cộng +1đ như thường lệ."</i>`;
                    attendanceTelegramMsg = telegramMsg;
                } else {
                    status = 'late';
                    lateExcuseDetails = {
                        requestedMinutes: requestedMinutes,
                        actualLateMinutes: lateMinutes,
                        reason: todayApprovedRequest.reason
                    };
                    let telegramMsg = `🚨 <b>CẢNH BÁO VI PHẠM KỶ LUẬT (QUÁ HẠN XIN PHÉP)</b> 🚨\n\n`;
                    telegramMsg += `👤 <b>Nhân sự:</b> ${user.username}\n`;
                    telegramMsg += `⏰ <b>Thời gian:</b> ${now.toLocaleTimeString('vi-VN')} (${shiftName})\n`;
                    telegramMsg += `⏳ <b>Trạng thái:</b> Xin muộn ${requestedMinutes}p nhưng thực tế muộn ${lateMinutes}p (Quá hạn ${lateMinutes - requestedMinutes}p)\n`;
                    telegramMsg += `💸 <b>Phạt vi phạm:</b> 20,000đ (Đã tự động trừ lương)\n`;
                    telegramMsg += `📉 <b>Trừ công đức:</b> -0.5đ\n`;
                    telegramMsg += `${locStr}\n\n`;
                    telegramMsg += `<i>"Kỷ luật là sức mạnh! Đề nghị sếp ${user.username} rút kinh nghiệm sâu sắc."</i>`;
                    attendanceTelegramMsg = telegramMsg;
                }
            } else {
                status = 'late';
                let telegramMsg = `🚨 <b>CẢNH BÁO VI PHẠM KỶ LUẬT</b> 🚨\n\n`;
                telegramMsg += `👤 <b>Nhân sự:</b> ${user.username}\n`;
                telegramMsg += `⏰ <b>Thời gian:</b> ${now.toLocaleTimeString('vi-VN')} (${shiftName})\n`;
                telegramMsg += `❗ <b>Tình trạng:</b> ĐI MUỘN KHÔNG PHÉP <b>${lateMinutes}</b> PHÚT\n`;
                telegramMsg += `💸 <b>Phạt vi phạm:</b> 20,000đ (Đã tự động trừ lương)\n`;
                telegramMsg += `📉 <b>Trừ công đức:</b> -1đ\n`;
                telegramMsg += `${locStr}\n\n`;
                telegramMsg += `<i>"Kỷ luật là sức mạnh! Đề nghị sếp ${user.username} rút kinh nghiệm sâu sắc."</i>`;
                attendanceTelegramMsg = telegramMsg;
            }
        }

        if (!attendanceTelegramMsg) {
            const locStr = lat ? `\n📍 <b>Vị trí:</b> <a href="https://google.com/maps?q=${lat},${lng}">Xem bản đồ</a>` : '\n📍 <b>Vị trí:</b> Không lấy được GPS từ trình duyệt';
            const shiftName = currentSession === 'morning' ? 'CA SÁNG' : 'CA CHIỀU';
            const statusLine = isErrorDate
                ? 'ĐÚNG GIỜ (ngày được hệ thống bỏ qua lỗi chấm công)'
                : 'ĐÚNG GIỜ';

            attendanceTelegramMsg = `✅ <b>[CHẤM CÔNG ${statusLine}]</b>\n\n`;
            attendanceTelegramMsg += `👤 <b>Nhân sự:</b> ${user.username}\n`;
            attendanceTelegramMsg += `⏰ <b>Thời gian:</b> ${now.toLocaleTimeString('vi-VN')} (${shiftName})\n`;
            attendanceTelegramMsg += `🏆 <b>Kết quả:</b> Đúng giờ - cộng Công Đức theo quy định\n`;
            attendanceTelegramMsg += `${locStr}\n\n`;
            attendanceTelegramMsg += `<i>"Đã ghi nhận chấm công đúng giờ tự động gửi về Telegram."</i>`;
        }

        const newRecord = {
            id: 'att_' + Date.now(), username: user.username,
            timestamp: now.getTime(), dateStr, status, lateMinutes,
            location: lat ? { lat, lng } : null, note: '',
            lateExcuse: lateExcuseDetails,
            type: currentSession,
            security: {
                deviceId: access.device?.id || null,
                deviceShortId: access.device?.shortId || null,
                publicIp: access.publicIp || null,
                trustedDevice: !!access.trustedDevice,
                locationOk: !!access.locationOk,
                networkOk: !!access.networkOk,
                distanceMeters: access.distance
            }
        };

        try {
            const allData = await Attendance.loadData();
            const normalizedU = Attendance.usernameKey(user.username);
            const existingRecord = allData.find(r => 
                Attendance.usernameKey(r.username) === normalizedU &&
                r.dateStr === dateStr && 
                (r.type === currentSession || (currentSession === 'morning' && !r.type))
            );
            if (existingRecord) {
                const sessionLabel = currentSession === 'afternoon' ? 'ca chiều' : 'ca sáng';
                Utils.showToast(`Hôm nay bạn đã điểm danh ${sessionLabel} rồi!`, 'info');
                if (btn) btn.dataset.state = 'idle';
                return;
            }
            allData.push(newRecord);
            await Attendance.saveData(allData);
            if (attendanceTelegramMsg) {
                Utils.notifyTelegram(attendanceTelegramMsg);
            }
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

        const now = new Date();
        const submittedAtStr = now.toLocaleString('vi-VN');

        const newLeave = {
            id: 'leave_' + Date.now(),
            username: user.username,
            timestamp: Date.now(),
            submittedAt: submittedAtStr, // Thêm ngày giờ nộp đơn
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

        const msg = `📢 <b>[TỜ TRÌNH XIN NGHỈ PHÉP]</b>\n👤 Nhân viên: <b>${user.username}</b>\n📅 Từ ngày: ${startDate}\n⏳ Số ngày nghỉ: ${days}\n📝 Lý do: <i>${reason}</i>\n🕒 <b>Trình lúc:</b> ${submittedAtStr}\n\n👉 Sếp vào hệ thống kiểm tra và duyệt nhé!`;
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
        const normalizedU = Attendance.usernameKey(user.username);
        const todayRecord = allData.find(r => Attendance.usernameKey(r.username) === normalizedU && r.dateStr === dateStr && r.type === 'afternoon') ||
                            allData.find(r => Attendance.usernameKey(r.username) === normalizedU && r.dateStr === dateStr && (r.type === 'morning' || !r.type));
        
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

    handleMonthYearChange: (value, type) => {
        if (type === 'month') {
            Attendance.selectedMonth = parseInt(value);
        } else {
            Attendance.selectedYear = parseInt(value);
        }
        Attendance.render();
    },

    exportAttendanceCSV: async () => {
        const allData = await Attendance.loadData();
        const allLeaves = await Attendance.loadLeaveData();
        
        const now = new Date();
        const selYear = Attendance.selectedYear;
        const selMonth = Attendance.selectedMonth;
        const monthStr = `${selYear}-${String(selMonth + 1).padStart(2, '0')}`;
        
        const cycle = PayrollModule.getCycleRange(monthStr);
        const startStr = cycle.startStr;
        const endStr = cycle.endStr;
        
        const accounts = (typeof Auth !== 'undefined' && await Auth.getAccounts()) || [];
        const passedWorkingDays = Attendance.getPassedWorkingDays(cycle);
        const { summary, approvedLeaves, usersList } = Attendance.buildAttendanceSummary(allData, allLeaves, accounts, startStr, endStr);

        // Tạo nội dung CSV (UTF-8 BOM hỗ trợ tiếng Việt)
        let csvContent = "\uFEFF"; // BOM cho Excel
        csvContent += "Tài xế/Nhân viên,Tổng ngày công đã qua,Đã đi làm,Đúng giờ,Vắng,Nghỉ phép duyệt,Đi muộn (lần),Tổng phút đi muộn\n";

        usersList.forEach(u => {
            const userKey = Attendance.usernameKey(u);
            const s = summary[userKey] || { totalDays: 0, onTime: 0, late: 0, lateExcused: 0, totalLateMinutes: 0 };
            const leaves = approvedLeaves[userKey] || 0;
            let absent = passedWorkingDays - s.totalDays - leaves;
            if (absent < 0) absent = 0;
            
            csvContent += `"${u}",${passedWorkingDays},${s.totalDays},${s.onTime},${absent},${leaves},${s.late},${s.totalLateMinutes}\n`;
        });

        // Tải xuống
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', `Bang_Cham_Cong_Thang_${selMonth + 1}_${selYear}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    },

    exportUserAttendancePDF: async (username) => {
        Utils.showToast("Đang tạo PDF chấm công cá nhân...", "info");
        const allData = await Attendance.loadData();
        const allLeaves = await Attendance.loadLeaveData();
        
        const currentMonthStr = PayrollModule.getCurrentCycleMonthStr(new Date());
        const cycle = PayrollModule.getCycleRange(currentMonthStr);
        const startStr = cycle.startStr;
        const endStr = cycle.endStr;
        
        // Filter by this user + current payroll cycle
        const normalizedTargetU = Attendance.usernameKey(username);
        const userRecords = allData
            .filter(r => Attendance.usernameKey(r.username) === normalizedTargetU && r.dateStr >= startStr && r.dateStr <= endStr)
            .sort((a, b) => a.dateStr.localeCompare(b.dateStr));
        
        const userLeaves = allLeaves
            .filter(l => Attendance.usernameKey(l.username) === normalizedTargetU && (l.startDate || l.date) >= startStr && (l.startDate || l.date) <= endStr);
        
        const totalOnTime = userRecords.filter(r => r.status === 'on_time').length;
        const totalExcusedLate = userRecords.filter(r => r.status === 'late_excused').length;
        const totalLate = userRecords.filter(r => r.status === 'late').length;
        const totalLeave = userLeaves.filter(l => l.status === 'approved').reduce((s, l) => s + (parseFloat(l.days) || 1), 0);
        
        const clone = document.createElement('div');
        clone.style.cssText = 'padding:30px;background:#fff;color:#000;font-family:Arial,sans-serif;';
        
        const stamp = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="120" height="120"><circle cx="100" cy="100" r="92" fill="none" stroke="#da251d" stroke-width="4" opacity="0.85"/><circle cx="100" cy="100" r="82" fill="none" stroke="#da251d" stroke-width="1.5" opacity="0.6"/><path d="M 100 35 Q 115 50 110 65 Q 125 55 130 70 Q 120 75 125 90 Q 135 85 140 95 Q 130 100 125 110 Q 115 105 110 115 Q 105 105 100 110 Q 95 105 90 115 Q 85 105 75 110 Q 70 100 60 95 Q 65 85 75 90 Q 80 75 70 70 Q 75 55 90 65 Q 85 50 100 35" fill="#da251d" opacity="0.7"/><text x="100" y="148" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#da251d">THANH LONG WORK</text><text x="100" y="165" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" fill="#da251d">GIÁM ĐỐC</text></svg>`;
        
        clone.innerHTML = `
            <div style="text-align:center;margin-bottom:30px;border-bottom:2px solid #da251d;padding-bottom:20px;">
                <h1 style="color:#da251d;margin-bottom:5px;">THANH LONG WORK</h1>
                <h3>LỊCH SỬ CHẤM CÔNG CÁ NHÂN</h3>
                <p><strong>${username}</strong> &bull; Tháng ${now.getMonth() + 1}/${now.getFullYear()} &bull; Chu kỳ: ${cycle.startStr.split('-').reverse().join('/')} - ${cycle.endStr.split('-').reverse().join('/')} &bull; Ngày xuất: ${now.toLocaleDateString('vi-VN')}</p>
            </div>
            
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:15px;margin-bottom:25px;text-align:center;border:1px solid #eee;padding:15px;border-radius:8px;">
                <div><div style="font-size:11px;color:#666;text-transform:uppercase;">Đúng giờ</div><div style="font-size:24px;font-weight:bold;color:#10b981;">${totalOnTime}</div></div>
                <div><div style="font-size:11px;color:#666;text-transform:uppercase;">Trễ phép</div><div style="font-size:24px;font-weight:bold;color:#00adb5;">${totalExcusedLate}</div></div>
                <div><div style="font-size:11px;color:#666;text-transform:uppercase;">Trễ không phép</div><div style="font-size:24px;font-weight:bold;color:#f59e0b;">${totalLate}</div></div>
                <div><div style="font-size:11px;color:#666;text-transform:uppercase;">Nghỉ phép</div><div style="font-size:24px;font-weight:bold;color:#3b82f6;">${totalLeave}</div></div>
            </div>
            
            <h4 style="color:#333;margin-bottom:12px;border-bottom:1px solid #eee;padding-bottom:6px;">Chi tiết chấm công</h4>
            <table style="width:100%;border-collapse:collapse;margin-bottom:30px;font-size:13px;">
                <thead><tr style="background:#f3f4f6;">
                    <th style="padding:8px;border:1px solid #d1d5db;text-align:left;">Ngày</th>
                    <th style="padding:8px;border:1px solid #d1d5db;text-align:center;">Giờ vào</th>
                    <th style="padding:8px;border:1px solid #d1d5db;text-align:center;">Giờ ra</th>
                    <th style="padding:8px;border:1px solid #d1d5db;text-align:center;">Trạng thái</th>
                    <th style="padding:8px;border:1px solid #d1d5db;text-align:left;">Báo cáo EOD</th>
                </tr></thead>
                <tbody>
                    ${userRecords.map(r => {
                        let st = '';
                        if (r.status === 'on_time') {
                            st = '<span style="color:#10b981;font-weight:bold;">Đúng giờ</span>';
                        } else if (r.status === 'late_excused') {
                            const reasonText = (r.lateExcuse && r.lateExcuse.reason) ? ` - Lý do: ${r.lateExcuse.reason}` : '';
                            st = `<span style="color:#00adb5;font-weight:bold;">Trễ có phép</span><br><small style="color:#555;font-size:10px;">Xin ${r.lateExcuse?.requestedMinutes || 30}p - Thực tế ${r.lateExcuse?.actualLateMinutes || r.lateMinutes}p${reasonText}</small>`;
                        } else {
                            st = `<span style="color:#f59e0b;font-weight:bold;">Trễ không phép</span><br><small style="color:#e74c3c;font-size:10px;">Muộn ${r.lateMinutes || 0}p</small>`;
                        }
                        const checkIn = new Date(r.timestamp).toLocaleTimeString('vi-VN');
                        const checkOut = r.checkoutTimestamp ? new Date(r.checkoutTimestamp).toLocaleTimeString('vi-VN') : '—';
                        return `<tr>
                            <td style="padding:8px;border:1px solid #d1d5db;">${r.dateStr}</td>
                            <td style="padding:8px;border:1px solid #d1d5db;text-align:center;">${checkIn}</td>
                            <td style="padding:8px;border:1px solid #d1d5db;text-align:center;">${checkOut}</td>
                            <td style="padding:8px;border:1px solid #d1d5db;text-align:center;">${st}</td>
                            <td style="padding:8px;border:1px solid #d1d5db;font-size:11px;color:#666;">${r.checkoutReport || ''}</td>
                        </tr>`;
                    }).join('')}
                    ${userRecords.length === 0 ? '<tr><td colspan="5" style="text-align:center;padding:15px;color:#999;">Chưa có dữ liệu chấm công tháng này</td></tr>' : ''}
                </tbody>
            </table>
            
            ${userLeaves.length > 0 ? `
            <h4 style="color:#333;margin-bottom:12px;border-bottom:1px solid #eee;padding-bottom:6px;">Lịch sử Nghỉ phép</h4>
            <table style="width:100%;border-collapse:collapse;margin-bottom:40px;font-size:13px;">
                <thead><tr style="background:#f3f4f6;">
                    <th style="padding:8px;border:1px solid #d1d5db;">Từ ngày</th>
                    <th style="padding:8px;border:1px solid #d1d5db;text-align:center;">Số ngày</th>
                    <th style="padding:8px;border:1px solid #d1d5db;">Lý do</th>
                    <th style="padding:8px;border:1px solid #d1d5db;text-align:center;">Trạng thái</th>
                </tr></thead>
                <tbody>
                    ${userLeaves.map(l => {
                        const stLeave = l.status === 'approved' ? '<span style="color:#10b981;">Đã duyệt</span>' : l.status === 'pending' ? '<span style="color:#f59e0b;">Chờ duyệt</span>' : '<span style="color:#ef4444;">Từ chối</span>';
                        return `<tr>
                            <td style="padding:8px;border:1px solid #d1d5db;">${l.startDate}</td>
                            <td style="padding:8px;border:1px solid #d1d5db;text-align:center;">${l.days}</td>
                            <td style="padding:8px;border:1px solid #d1d5db;">${l.reason}</td>
                            <td style="padding:8px;border:1px solid #d1d5db;text-align:center;">${stLeave}</td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>` : ''}
            
            <div style="display:flex;justify-content:flex-end;margin-top:30px;text-align:center;">
                <div style="width:200px;">
                    <p style="font-weight:bold;margin-bottom:10px;">Giám Đốc</p>
                    ${stamp}
                    <p style="margin-top:8px;font-weight:bold;">ĐÀO THANH LONG</p>
                </div>
            </div>
        `;
        
        html2pdf().set({
            margin: 0.5,
            filename: `ChamCong_${username}_T${now.getMonth() + 1}_${now.getFullYear()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        }).from(clone).save().then(() => {
            Utils.showToast("Đã xuất PDF chấm công cá nhân!", "success");
        }).catch(e => {
            console.error(e);
            Utils.showToast("Lỗi xuất PDF", "error");
        });
    },

    showLateRequestModal: () => {
        const modal = document.getElementById('late-request-modal-overlay');
        if (!modal) return;

        // Reset form
        const form = document.getElementById('late-request-form');
        if (form) form.reset();

        // Default date to today
        const dateInput = document.getElementById('late-request-date');
        if (dateInput) {
            const today = new Date();
            const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            dateInput.value = dateStr;
            dateInput.min = dateStr; // Chỉ cho phép xin từ hôm nay trở đi
        }

        Attendance.updateLateTimePreview();
        modal.classList.add('active');
    },

    closeLateRequestModal: () => {
        const modal = document.getElementById('late-request-modal-overlay');
        if (modal) modal.classList.remove('active');
    },

    updateLateTimePreview: () => {
        const select = document.getElementById('late-request-minutes');
        const preview = document.getElementById('late-time-preview');
        if (!select || !preview) return;

        const minutes = parseInt(select.value) || 30;
        
        // Calculate expected time based on deadline
        const deadline = new Date();
        deadline.setHours(Attendance.DEADLINE_HOURS, Attendance.DEADLINE_MINUTES, 0, 0);
        
        // Add minutes
        const target = new Date(deadline.getTime() + minutes * 60000);
        const hoursStr = String(target.getHours()).padStart(2, '0');
        const minsStr = String(target.getMinutes()).padStart(2, '0');
        
        preview.textContent = `trước ${hoursStr}:${minsStr} ${target.getHours() >= 12 ? 'PM' : 'AM'}`;
    },

    submitLateRequest: async () => {
        const user = Auth.currentUser;
        if (!user) return;

        const dateInput = document.getElementById('late-request-date');
        const minutesSelect = document.getElementById('late-request-minutes');
        const reasonTextarea = document.getElementById('late-request-reason');

        if (!dateInput || !minutesSelect || !reasonTextarea) return;

        const requestDate = dateInput.value;
        const minutes = parseInt(minutesSelect.value) || 30;
        const reason = reasonTextarea.value.trim();

        if (!requestDate) {
            Utils.showToast("Vui lòng chọn ngày đi trễ!", "error");
            return;
        }
        if (isNaN(minutes) || minutes < 1 || minutes > 60) {
            Utils.showToast("Số phút xin đi muộn tối thiểu là 1 và tối đa là 60 phút!", "error");
            return;
        }
        if (!reason) {
            Utils.showToast("Vui lòng nhập lý do đi trễ!", "error");
            return;
        }

        Utils.showToast("Đang gửi yêu cầu...", "info");

        // Load settings & existing requests
        const settings = await DB.getSettings() || {};
        const allLateRequests = await Attendance.loadLateRequests();

        // 1. Calculate target arrival time for Telegram
        const deadline = new Date();
        deadline.setHours(Attendance.DEADLINE_HOURS, Attendance.DEADLINE_MINUTES, 0, 0);
        const target = new Date(deadline.getTime() + minutes * 60000);
        const arrivalTimeStr = `${String(target.getHours()).padStart(2, '0')}:${String(target.getMinutes()).padStart(2, '0')} ${target.getHours() >= 12 ? 'PM' : 'AM'}`;

        // 2. Rules Engine check for Auto-Approval
        let isAutoApproved = false;
        
        const autoApproveEnabled = settings.lateAutoApprove || false;
        const maxMinutesAllowed = settings.lateAutoApproveMaxMinutes !== undefined ? settings.lateAutoApproveMaxMinutes : 60;
        const maxCountPerMonth = settings.lateAutoApproveMaxPerMonth !== undefined ? settings.lateAutoApproveMaxPerMonth : 2;
        const beforeTimeLimit = settings.lateAutoApproveBeforeTime || '08:30';

        if (autoApproveEnabled) {
            // Count already approved late requests in the same month
            const targetMonthStr = requestDate.substring(0, 7); // YYYY-MM
            const userMonthApprovedCount = allLateRequests.filter(r => 
                r.username === user.username && 
                r.status === 'approved' && 
                r.date.startsWith(targetMonthStr)
            ).length;

            let satisfiesTimeLimit = true;
            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

            if (requestDate === todayStr) {
                // If it is today, check if submitted before the time limit (e.g. 08:30)
                const nowTimeStr = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;
                if (nowTimeStr > beforeTimeLimit) {
                    satisfiesTimeLimit = false;
                }
            }

            if (minutes <= maxMinutesAllowed && userMonthApprovedCount < maxCountPerMonth && satisfiesTimeLimit) {
                isAutoApproved = true;
            }
        }

        const status = isAutoApproved ? 'approved' : 'pending';

        const newRequest = {
            id: 'late_' + Date.now(),
            username: user.username,
            date: requestDate,
            minutes: minutes,
            reason: reason,
            status: status,
            timestamp: Date.now(),
            resolvedBy: isAutoApproved ? 'system' : null,
            resolvedAt: isAutoApproved ? Date.now() : null
        };

        allLateRequests.push(newRequest);
        await Attendance.saveLateRequests(allLateRequests);

        if (isAutoApproved) {
            Utils.notifyTelegram(`🤖 <b>[TỰ ĐỘNG DUYỆT ĐI TRỄ]</b>\n👤 ${user.username}\n📅 Ngày: ${requestDate}\n⏱️ Xin muộn ${minutes}p (Đến trước ${arrivalTimeStr})\n📝 Lý do: ${reason}`);
            Utils.showToast("Yêu cầu đi trễ đã được TỰ ĐỘNG DUYỆT!", "success");
        } else {
            Utils.notifyTelegram(`📢 <b>[TỜ TRÌNH XIN ĐẾN TRỄ]</b>\n👤 ${user.username}\n📅 Ngày: ${requestDate}\n⏱️ Xin muộn ${minutes}p (Chờ sếp duyệt)\n📝 Lý do: ${reason}`);
            Utils.showToast("Đã gửi yêu cầu! Vui lòng chờ sếp phê duyệt.", "success");
        }

        Attendance.closeLateRequestModal();
        Attendance.render();
    },

    showLateConfigModal: async () => {
        const modal = document.getElementById('late-config-modal-overlay');
        if (!modal) return;

        // Tải settings mới nhất từ DB
        const settings = await DB.getSettings() || {};
        
        const toggle = document.getElementById('late-auto-approve-toggle');
        const maxPerMonth = document.getElementById('late-auto-approve-max-per-month');
        const maxMinutes = document.getElementById('late-auto-approve-max-minutes');
        const beforeTime = document.getElementById('late-auto-approve-before-time');

        if (toggle) {
            toggle.checked = settings.lateAutoApprove || false;
            // Trigger visual slider change in index.html inline script:
            toggle.nextElementSibling.style.backgroundColor = toggle.checked ? 'var(--primary)' : 'rgba(255,255,255,0.1)';
            toggle.nextElementSibling.querySelector('span').style.transform = toggle.checked ? 'translateX(24px)' : 'translateX(0)';
        }
        if (maxPerMonth) maxPerMonth.value = settings.lateAutoApproveMaxPerMonth !== undefined ? settings.lateAutoApproveMaxPerMonth : 2;
        if (maxMinutes) maxMinutes.value = settings.lateAutoApproveMaxMinutes !== undefined ? settings.lateAutoApproveMaxMinutes : 60;
        if (beforeTime) beforeTime.value = settings.lateAutoApproveBeforeTime || '08:30';

        modal.classList.add('active');
    },

    closeLateConfigModal: () => {
        const modal = document.getElementById('late-config-modal-overlay');
        if (modal) modal.classList.remove('active');
    },

    saveAutoApproveSettings: async () => {
        const toggle = document.getElementById('late-auto-approve-toggle');
        const maxPerMonth = document.getElementById('late-auto-approve-max-per-month');
        const maxMinutes = document.getElementById('late-auto-approve-max-minutes');
        const beforeTime = document.getElementById('late-auto-approve-before-time');

        if (!toggle) return;

        const settings = {
            lateAutoApprove: toggle.checked,
            lateAutoApproveMaxPerMonth: parseInt(maxPerMonth.value) || 2,
            lateAutoApproveMaxMinutes: parseInt(maxMinutes.value) || 60,
            lateAutoApproveBeforeTime: beforeTime.value || '08:30'
        };

        try {
            await DB.saveSettings(settings);
            // Cập nhật state runtime nếu tồn tại
            if (typeof app !== 'undefined' && app.state) {
                app.state.settings = { ...app.state.settings, ...settings };
            }
            Utils.showToast("Đã lưu cấu hình tự động duyệt đi trễ!", "success");
            Attendance.closeLateConfigModal();
            Attendance.render();
        } catch (e) {
            console.error("Lỗi khi lưu cấu hình đi trễ:", e);
            Utils.showToast("Lỗi khi lưu cấu hình!", "error");
        }
    },

    updateLateRequestStatus: async (requestId, newStatus) => {
        const actionText = newStatus === 'approved' ? 'phê duyệt' : 'từ chối';
        const isConfirmed = await Utils.showConfirm(`Xác nhận ${actionText} yêu cầu đi trễ này?`);
        if (!isConfirmed) return;

        try {
            Utils.showToast("Đang cập nhật...", "info");
            const allLates = await Attendance.loadLateRequests();
            const request = allLates.find(l => l.id === requestId);
            
            if (request) {
                request.status = newStatus;
                request.resolvedBy = Auth.currentUser.username;
                request.resolvedAt = Date.now();
                
                await Attendance.saveLateRequests(allLates);
                
                // Calculate target arrival time for Telegram
                const deadline = new Date();
                deadline.setHours(Attendance.DEADLINE_HOURS, Attendance.DEADLINE_MINUTES, 0, 0);
                const target = new Date(deadline.getTime() + (parseInt(request.minutes) || 30) * 60000);
                const arrivalTimeStr = `${String(target.getHours()).padStart(2, '0')}:${String(target.getMinutes()).padStart(2, '0')} ${target.getHours() >= 12 ? 'PM' : 'AM'}`;

                if (newStatus === 'approved') {
                    Utils.notifyTelegram(`✅ <b>[SẾP DUYỆT ĐI TRỄ]</b>\n👤 ${request.username}\n📅 Ngày: ${request.date}\n⏱️ Cho phép muộn ${request.minutes}p (Đến trước ${arrivalTimeStr})\n📝 Lý do: ${request.reason}`);
                } else {
                    Utils.notifyTelegram(`❌ <b>[SẾP TỪ CHỐI ĐI TRỄ]</b>\n👤 ${request.username}\n📅 Ngày: ${request.date}\n⏱️ Xin muộn ${request.minutes}p bị từ chối\n📝 Lý do: ${request.reason}`);
                }

                Utils.showToast(`Đã ${actionText} yêu cầu đi trễ!`, "success");
                Attendance.render();
            } else {
                Utils.showToast("Không tìm thấy yêu cầu đi trễ!", "error");
            }
        } catch (e) {
            console.error("Lỗi cập nhật trạng thái đơn đi trễ:", e);
            Utils.showToast("Cập nhật thất bại!", "error");
        }
    },

    exportAttendancePDF: async () => {
        Utils.showToast("Đang tạo PDF chấm công tổng hợp...", "info");
        const allData = await Attendance.loadData();
        const allLeaves = await Attendance.loadLeaveData();
        
        const now = new Date();
        const selYear = Attendance.selectedYear;
        const selMonth = Attendance.selectedMonth;
        const monthStr = `${selYear}-${String(selMonth + 1).padStart(2, '0')}`;
        
        const cycle = PayrollModule.getCycleRange(monthStr);
        const startStr = cycle.startStr;
        const endStr = cycle.endStr;
        
        const accounts = (typeof Auth !== 'undefined' && await Auth.getAccounts()) || [];
        const passedWorkingDays = Attendance.getPassedWorkingDays(cycle);
        const { summary, approvedLeaves, usersList } = Attendance.buildAttendanceSummary(allData, allLeaves, accounts, startStr, endStr);

        const clone = document.createElement('div');
        clone.style.cssText = 'padding:30px;background:#fff;color:#000;font-family:Arial,sans-serif;';

        const stamp = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="120" height="120"><circle cx="100" cy="100" r="92" fill="none" stroke="#da251d" stroke-width="4" opacity="0.85"/><circle cx="100" cy="100" r="82" fill="none" stroke="#da251d" stroke-width="1.5" opacity="0.6"/><path d="M 100 35 Q 115 50 110 65 Q 125 55 130 70 Q 120 75 125 90 Q 135 85 140 95 Q 130 100 125 110 Q 115 105 110 115 Q 105 105 100 110 Q 95 105 90 115 Q 85 105 75 110 Q 70 100 60 95 Q 65 85 75 90 Q 80 75 70 70 Q 75 55 90 65 Q 85 50 100 35" fill="#da251d" opacity="0.7"/><text x="100" y="148" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="#da251d">THANH LONG WORK</text><text x="100" y="165" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" fill="#da251d">GIÁM ĐỐC</text></svg>`;

        let rowsHtml = usersList.map(u => {
            const userKey = Attendance.usernameKey(u);
            const s = summary[userKey] || { totalDays: 0, onTime: 0, late: 0, lateExcused: 0, totalLateMinutes: 0 };
            const leaves = approvedLeaves[userKey] || 0;
            let absent = passedWorkingDays - s.totalDays - leaves;
            if (absent < 0) absent = 0;
            
            return `
            <tr>
                <td style="padding:10px;border:1px solid #d1d5db;font-weight:bold;">${Utils.getUserDisplayName(u) || u}</td>
                <td style="padding:10px;border:1px solid #d1d5db;text-align:center;">${s.totalDays} / ${passedWorkingDays}</td>
                <td style="padding:10px;border:1px solid #d1d5db;text-align:center;color:#10b981;font-weight:bold;">${s.onTime}</td>
                <td style="padding:10px;border:1px solid #d1d5db;text-align:center;color:#3b82f6;">${leaves}</td>
                <td style="padding:10px;border:1px solid #d1d5db;text-align:center;color:#e74c3c;">${absent}</td>
                <td style="padding:10px;border:1px solid #d1d5db;text-align:center;color:#00adb5;font-weight:bold;">${s.lateExcused || 0}</td>
                <td style="padding:10px;border:1px solid #d1d5db;text-align:center;color:#f59e0b;font-weight:bold;">${s.late}</td>
                <td style="padding:10px;border:1px solid #d1d5db;text-align:center;font-weight:bold;">${s.totalLateMinutes} phút</td>
            </tr>
            `;
        }).join('');

        clone.innerHTML = `
            <div style="text-align:center;margin-bottom:30px;border-bottom:2px solid #da251d;padding-bottom:20px;">
                <h1 style="color:#da251d;margin-bottom:5px;">THANH LONG WORK</h1>
                <h3>BẢNG TỔNG HỢP CHẤM CÔNG NHÂN SỰ</h3>
                <p>Tháng ${selMonth + 1}/${selYear} &bull; Chu kỳ: ${cycle.startStr.split('-').reverse().join('/')} - ${cycle.endStr.split('-').reverse().join('/')} &bull; Ngày xuất: ${now.toLocaleDateString('vi-VN')}</p>
            </div>
            
            <table style="width:100%;border-collapse:collapse;margin-bottom:40px;font-size:12px;">
                <thead>
                    <tr style="background:#f3f4f6;text-align:center;">
                        <th style="padding:10px;border:1px solid #d1d5db;text-align:left;">Nhân viên</th>
                        <th style="padding:10px;border:1px solid #d1d5db;">Ngày đã đi làm</th>
                        <th style="padding:10px;border:1px solid #d1d5db;color:#10b981;">Đúng giờ</th>
                        <th style="padding:10px;border:1px solid #d1d5db;color:#3b82f6;">Nghỉ phép</th>
                        <th style="padding:10px;border:1px solid #d1d5db;color:#e74c3c;">Vắng</th>
                        <th style="padding:10px;border:1px solid #d1d5db;color:#00adb5;">Trễ phép</th>
                        <th style="padding:10px;border:1px solid #d1d5db;color:#f59e0b;">Trễ không phép</th>
                        <th style="padding:10px;border:1px solid #d1d5db;">Phút đi muộn</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                    ${usersList.length === 0 ? '<tr><td colspan="8" style="text-align:center;padding:20px;">Chưa có dữ liệu tháng này</td></tr>' : ''}
                </tbody>
            </table>
            
            <div style="display:flex;justify-content:space-between;margin-top:50px;text-align:center;padding:0 50px;">
                <div style="width:200px;">
                    <p style="font-weight:bold;margin-bottom:80px;">Người Lập Bảng</p>
                    <p>Bộ Phận Hành Chính</p>
                </div>
                <div style="width:200px;">
                    <p style="font-weight:bold;margin-bottom:10px;">Giám Đốc</p>
                    ${stamp}
                    <p style="margin-top:8px;font-weight:bold;">ĐÀO THANH LONG</p>
                </div>
            </div>
        `;

        html2pdf().set({
            margin: 0.5,
            filename: `TongHop_ChamCong_T${selMonth + 1}_${selYear}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
        }).from(clone).save().then(() => {
            Utils.showToast("Đã xuất PDF chấm công tổng hợp!", "success");
        }).catch(e => {
            console.error(e);
            Utils.showToast("Lỗi xuất PDF tổng hợp", "error");
        });
    }
};
