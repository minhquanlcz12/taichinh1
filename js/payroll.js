// js/payroll.js

const PayrollDefaultCycleMonth = (() => {
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth() + 1;
    if (now.getDate() < 10) {
        month -= 1;
        if (month === 0) {
            month = 12;
            year -= 1;
        }
    }
    return `${year}-${String(month).padStart(2, '0')}`;
})();

const PayrollModule = {
    currentMonth: PayrollDefaultCycleMonth, // YYYY-MM payroll cycle key, not calendar month
    LATE_PENALTY: 20000,
    _earlyCycleRepairPromise: null,
    usernameKey: (username) => {
        if (typeof Attendance !== 'undefined' && typeof Attendance.usernameKey === 'function') {
            return Attendance.usernameKey(username);
        }
        if (typeof Auth !== 'undefined' && typeof Auth.usernameKey === 'function') {
            return Auth.usernameKey(username);
        }
        return String(username || '').trim().toLowerCase();
    },
    sameUser: (left, right) => PayrollModule.usernameKey(left) === PayrollModule.usernameKey(right),
    getUserValue: (map, username, fallback = 0) => {
        const userKey = PayrollModule.usernameKey(username);
        const key = Object.keys(map || {}).find(k => PayrollModule.usernameKey(k) === userKey);
        return key ? map[key] : fallback;
    },
    viewMode: 'cards', // Dạng hiển thị mặc định (Thẻ Premium)

    // Đếm số ngày làm việc Thứ 2 - Thứ 7 trong tháng
    getWorkingDaysInMonth: (year, month) => {
        let count = 0;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let d = 1; d <= daysInMonth; d++) {
            const day = new Date(year, month, d).getDay();
            if (day !== 0) count++; // Bỏ Chủ nhật (0)
        }
        return count;
    },

    // Đếm số ngày Mon-Sat còn lại trong tháng đến hôm nay
    getWorkedWorkingDays: (year, month) => {
        const now = new Date();
        const endDay = (year === now.getFullYear() && month === now.getMonth()) ? now.getDate() - 1 : new Date(year, month + 1, 0).getDate();
        let count = 0;
        for (let d = 1; d <= endDay; d++) {
            const day = new Date(year, month, d).getDay();
            if (day !== 0) count++;
        }
        return count;
    },

    getCycleRange: (monthStr) => {
        const parts = monthStr.split('-');
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10); // 1-indexed

        let endYear = year;
        let endMonth = month + 1;
        if (endMonth > 12) {
            endMonth = 1;
            endYear++;
        }
        const startStr = `${year}-${String(month).padStart(2, '0')}-10`;
        const endStr = `${endYear}-${String(endMonth).padStart(2, '0')}-09`;

        return {
            startStr,
            endStr,
            startDate: new Date(`${startStr}T00:00:00`),
            endDate: new Date(`${endStr}T23:59:59`)
        };
    },

    getCycleLabel: (monthStr) => {
        const cycle = PayrollModule.getCycleRange(monthStr);
        const [, month] = String(monthStr || '').split('-');
        const format = (dateStr) => dateStr.split('-').reverse().join('/');
        return `Kỳ lương tháng ${parseInt(month, 10)} (${format(cycle.startStr)} - ${format(cycle.endStr)})`;
    },

    getCurrentCycleMonthStr: (date = new Date()) => {
        const y = date.getFullYear();
        const m = date.getMonth(); // 0-indexed
        const d = date.getDate();

        let targetYear = y;
        let targetMonth = m + 1; // 1-indexed

        if (d < 10) {
            targetMonth--;
            if (targetMonth === 0) {
                targetMonth = 12;
                targetYear--;
            }
        }

        return `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
    },

    getCalendarMonthStr: (date = new Date()) => {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    },

    getEarlyCycleRepairPair: (date = new Date()) => {
        if (date.getDate() >= 10) return null;
        const cycleMonth = PayrollModule.getCurrentCycleMonthStr(date);
        const calendarMonth = PayrollModule.getCalendarMonthStr(date);
        if (cycleMonth === calendarMonth) return null;
        return { cycleMonth, calendarMonth };
    },

    _clonePlain: (value) => {
        try {
            return JSON.parse(JSON.stringify(value || {}));
        } catch (e) {
            return {};
        }
    },

    _moveMisplacedPayrollBucket: (store, fromMonth, toMonth) => {
        if (!store || typeof store !== 'object') return 0;
        const from = store[fromMonth];
        if (!from || typeof from !== 'object') return 0;
        if (!store[toMonth] || typeof store[toMonth] !== 'object') {
            store[toMonth] = {};
        }

        const to = store[toMonth];
        let moved = 0;
        Object.keys(from).forEach(fromUser => {
            const existingKey = Object.keys(to).find(toUser => PayrollModule.sameUser(toUser, fromUser));
            const existingVal = existingKey ? to[existingKey] : undefined;
            const canRestore = !existingKey || existingVal === undefined || existingVal === null || existingVal === '' || existingVal === false || Number(existingVal) === 0;
            if (!canRestore) return;

            to[existingKey || fromUser] = from[fromUser];
            delete from[fromUser];
            moved += 1;
        });

        if (Object.keys(from).length === 0) {
            delete store[fromMonth];
        }
        return moved;
    },

    getCycleBucket: (store, monthStr, date = new Date()) => {
        const base = { ...((store && store[monthStr]) || {}) };
        const pair = PayrollModule.getEarlyCycleRepairPair(date);
        if (pair && monthStr === pair.cycleMonth && store && store[pair.calendarMonth]) {
            Object.keys(store[pair.calendarMonth]).forEach(username => {
                const existingKey = Object.keys(base).find(k => PayrollModule.sameUser(k, username));
                if (!existingKey) {
                    base[username] = store[pair.calendarMonth][username];
                }
            });
        }
        return base;
    },

    getCycleUserValue: (store, monthStr, username, fallback = 0) => {
        return PayrollModule.getUserValue(PayrollModule.getCycleBucket(store, monthStr), username, fallback);
    },

    repairEarlyMonthPayrollBuckets: async () => {
        if (PayrollModule._earlyCycleRepairPromise) {
            return PayrollModule._earlyCycleRepairPromise;
        }

        PayrollModule._earlyCycleRepairPromise = (async () => {
            const pair = PayrollModule.getEarlyCycleRepairPair(new Date());
            if (!pair || typeof DB === 'undefined') return null;

            const { calendarMonth, cycleMonth } = pair;
            const allCustomBonuses = await DB.getCustomBonuses();
            const allSalaryAdvances = await DB.getSalaryAdvances();
            const allBonusApprovals = await DB.getBonusApprovals();
            const allCustomBonusApprovals = await DB.getCustomBonusApprovals();
            const allLatePenaltyApprovals = await DB.getLatePenaltyApprovals();

            const backup = {
                fromMonth: calendarMonth,
                toMonth: cycleMonth,
                customBonuses: PayrollModule._clonePlain(allCustomBonuses),
                salaryAdvances: PayrollModule._clonePlain(allSalaryAdvances),
                bonusApprovals: PayrollModule._clonePlain(allBonusApprovals),
                customBonusApprovals: PayrollModule._clonePlain(allCustomBonusApprovals),
                latePenaltyApprovals: PayrollModule._clonePlain(allLatePenaltyApprovals),
                backedUpAt: new Date().toISOString()
            };

            const movedCustomBonuses = PayrollModule._moveMisplacedPayrollBucket(allCustomBonuses, calendarMonth, cycleMonth);
            const movedSalaryAdvances = PayrollModule._moveMisplacedPayrollBucket(allSalaryAdvances, calendarMonth, cycleMonth);
            const movedBonusApprovals = PayrollModule._moveMisplacedPayrollBucket(allBonusApprovals, calendarMonth, cycleMonth);
            const movedCustomBonusApprovals = PayrollModule._moveMisplacedPayrollBucket(allCustomBonusApprovals, calendarMonth, cycleMonth);
            const movedLatePenaltyApprovals = PayrollModule._moveMisplacedPayrollBucket(allLatePenaltyApprovals, calendarMonth, cycleMonth);

            if (movedCustomBonuses || movedSalaryAdvances || movedBonusApprovals || movedCustomBonusApprovals || movedLatePenaltyApprovals) {
                if (typeof Utils !== 'undefined' && Utils.storage) {
                    Utils.storage.set(`payroll_cycle_repair_backup_${Date.now()}`, backup);
                }
                if (movedCustomBonuses) await DB.saveCustomBonuses(allCustomBonuses);
                if (movedSalaryAdvances) await DB.saveSalaryAdvances(allSalaryAdvances);
                if (movedBonusApprovals) await DB.saveBonusApprovals(allBonusApprovals);
                if (movedCustomBonusApprovals) await DB.saveCustomBonusApprovals(allCustomBonusApprovals);
                if (movedLatePenaltyApprovals) await DB.saveLatePenaltyApprovals(allLatePenaltyApprovals);
                console.log(`[Payroll] Restored early-cycle payroll buckets ${calendarMonth} -> ${cycleMonth}`, {
                    movedCustomBonuses,
                    movedSalaryAdvances,
                    movedBonusApprovals,
                    movedCustomBonusApprovals,
                    movedLatePenaltyApprovals
                });
                return { movedCustomBonuses, movedSalaryAdvances, movedBonusApprovals, movedCustomBonusApprovals, movedLatePenaltyApprovals, fromMonth: calendarMonth, toMonth: cycleMonth };
            }

            return null;
        })().catch(err => {
            console.error('[Payroll] Early cycle payroll restore failed:', err);
            PayrollModule._earlyCycleRepairPromise = null;
            return null;
        });

        return PayrollModule._earlyCycleRepairPromise;
    },

    getWorkingDaysInCycle: (startDate, endDate) => {
        let count = 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        start.setHours(0,0,0,0);
        end.setHours(0,0,0,0);

        let current = new Date(start);
        while (current <= end) {
            if (current.getDay() !== 0) { // Not Sunday
                count++;
            }
            current.setDate(current.getDate() + 1);
        }
        return count;
    },

    getWorkedWorkingDaysInCycle: (startDate, endDate, referenceDate = new Date()) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        start.setHours(0,0,0,0);
        end.setHours(0,0,0,0);

        const now = new Date(referenceDate);
        now.setHours(0,0,0,0);

        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);

        if (yesterday < start) {
            return 0;
        }

        const limitDate = yesterday < end ? yesterday : end;

        let count = 0;
        let current = new Date(start);
        while (current <= limitDate) {
            if (current.getDay() !== 0) {
                count++;
            }
            current.setDate(current.getDate() + 1);
        }
        return count;
    },

    getAccruedSalaryDays: (cycle, attendanceSummary, referenceDate = new Date()) => {
        const workingDays = PayrollModule.getWorkingDaysInCycle(cycle.startDate, cycle.endDate);
        const accruedDays = PayrollModule.getWorkedWorkingDaysInCycle(cycle.startDate, cycle.endDate, referenceDate);
        const absentUnexcusedDays = Math.max(0, parseFloat(attendanceSummary && attendanceSummary.absentUnexcusedDays) || 0);
        return Math.max(0, Math.min(workingDays, accruedDays - absentUnexcusedDays));
    },

    getLocalTodayStr: () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    },

    getRecordDateStr: (record) => {
        if (!record) return '';
        const rawDate = record.dateStr || record.date || '';
        if (/^\d{4}-\d{2}-\d{2}$/.test(String(rawDate))) return String(rawDate);

        const timestamp = Number(record.timestamp || record.createdAt || 0);
        if (timestamp > 0) {
            const d = new Date(timestamp);
            if (!Number.isNaN(d.getTime())) {
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            }
        }

        return '';
    },

    getShiftKey: (record) => {
        if (record && record.type) return record.type;
        const ts = Number(record && record.timestamp);
        if (Number.isFinite(ts) && ts > 0) {
            return new Date(ts).getHours() < 12 ? 'morning' : 'afternoon';
        }
        return 'morning';
    },

    isSundayStr: (dateStr) => {
        if (!dateStr) return false;
        const parts = dateStr.split('-').map(n => parseInt(n, 10));
        if (parts.length !== 3 || parts.some(Number.isNaN)) return false;
        return new Date(parts[0], parts[1] - 1, parts[2]).getDay() === 0;
    },

    normalizeAttendanceRecord: (record) => {
        const normalized = { ...record };
        normalized.dateStr = PayrollModule.getRecordDateStr(normalized);

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

    getUserCycleAttendanceRecords: (allAttendance, username, cycle, todayStr = PayrollModule.getLocalTodayStr()) => {
        const byShift = new Map();
        (allAttendance || []).forEach(raw => {
            const record = PayrollModule.normalizeAttendanceRecord(raw);
            if (!PayrollModule.sameUser(record.username, username)) return;
            if (!record.dateStr || record.dateStr < cycle.startStr || record.dateStr > cycle.endStr) return;
            if (record.dateStr > todayStr) return;
            if (PayrollModule.isSundayStr(record.dateStr)) return;

            const key = `${PayrollModule.usernameKey(record.username)}|${record.dateStr}|${PayrollModule.getShiftKey(record)}`;
            const current = byShift.get(key);
            const currentPriority = PayrollModule.recordPriority(current);
            const recordPriority = PayrollModule.recordPriority(record);
            if (!current || recordPriority > currentPriority ||
                (recordPriority === currentPriority && Number(record.timestamp || 0) > Number(current.timestamp || 0))) {
                byShift.set(key, record);
            }
        });

        return Array.from(byShift.values());
    },

    getUserCycleLeaveDays: (allLeaves, username, cycle, todayStr = PayrollModule.getLocalTodayStr()) => {
        return (allLeaves || []).reduce((total, l) => {
            const lDate = l.startDate || l.date || '';
            if (!PayrollModule.sameUser(l.username, username) || l.status !== 'approved') return total;
            if (!lDate || lDate < cycle.startStr || lDate > cycle.endStr || lDate > todayStr) return total;
            return total + (parseFloat(l.days) || 1);
        }, 0);
    },

    summarizeUserCycleAttendance: (allAttendance, allLeaves, username, cycle, todayStr = PayrollModule.getLocalTodayStr()) => {
        let onTimeDays = 0;
        let lateDays = 0;
        let lateExcusedDays = 0;
        let absentUnexcusedDays = 0;
        let lateCount = 0;

        const records = PayrollModule.getUserCycleAttendanceRecords(allAttendance, username, cycle, todayStr);
        records.forEach(a => {
            const weight = a.type ? 0.5 : 1.0;
            if (a.status === 'absent_unexcused') {
                absentUnexcusedDays += weight;
                return;
            }
            if (a.status === 'on_time') onTimeDays += weight;
            else if (a.status === 'late_excused') lateExcusedDays += weight;
            else if (a.status === 'late') {
                lateDays += weight;
                if (a.dateStr !== '2026-06-13') {
                    lateCount++;
                }
            }
        });

        const approvedLeaveDays = PayrollModule.getUserCycleLeaveDays(allLeaves, username, cycle, todayStr);
        const paidDays = onTimeDays + lateExcusedDays + lateDays + approvedLeaveDays;

        return {
            records,
            onTimeDays,
            lateDays,
            lateExcusedDays,
            approvedLeaveDays,
            absentUnexcusedDays,
            lateCount,
            paidDays
        };
    },

    isEligibleForPunctualityBonus: (attendanceSummary) => {
        if (!attendanceSummary || attendanceSummary.lateCount !== 0) return false;
        const paidNoPenaltyDays = (attendanceSummary.onTimeDays || 0) +
            (attendanceSummary.lateExcusedDays || 0) +
            (attendanceSummary.approvedLeaveDays || 0);
        return paidNoPenaltyDays >= 15;
    },

    init: () => {
        PayrollModule.currentMonth = PayrollModule.getCurrentCycleMonthStr(new Date());
        PayrollModule.repairEarlyMonthPayrollBuckets();
    },

    toggleViewMode: (mode) => {
        PayrollModule.viewMode = mode;
        PayrollModule.render();
    },

    render: async () => {
        const container = document.getElementById('payroll-view');
        if (!container) return;

        const currentUser = Auth.currentUser;
        if (!currentUser) return;
        PayrollModule.currentMonth = PayrollModule.currentMonth || PayrollModule.getCurrentCycleMonthStr(new Date());
        await PayrollModule.repairEarlyMonthPayrollBuckets();

        // Container structure
        container.innerHTML = `
            <div class="finance-header" style="display:flex; justify-content:space-between; margin-bottom: 24px; align-items:center; flex-wrap: wrap; gap: 12px;">
                <h3 style="font-size: 20px; color: var(--success);"><i class="fa-solid fa-money-check-dollar" style="margin-right: 8px;"></i>${currentUser.role === 'admin' ? 'Bảng Lương Tổng Hợp' : 'Bảng Lương Cá Nhân'}</h3>
                
                <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
                    <!-- View Mode Toggle -->
                    <div class="view-mode-toggle" style="display: flex; background: rgba(0,0,0,0.4); padding: 4px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); box-shadow: inset 0 2px 5px rgba(0,0,0,0.5);">
                        <button class="btn-toggle-view ${PayrollModule.viewMode === 'cards' ? 'active' : ''}" onclick="PayrollModule.toggleViewMode('cards')" style="padding: 6px 14px; font-size: 12px; border-radius: 8px; border: none; background: ${PayrollModule.viewMode === 'cards' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent'}; color: ${PayrollModule.viewMode === 'cards' ? '#000000' : 'var(--text-secondary)'}; font-weight: bold; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); display: flex; align-items: center; gap: 6px;">
                            <i class="fa-solid fa-id-card" style="font-size: 13px;"></i> Thẻ Premium
                        </button>
                        <button class="btn-toggle-view ${PayrollModule.viewMode === 'table' ? 'active' : ''}" onclick="PayrollModule.toggleViewMode('table')" style="padding: 6px 14px; font-size: 12px; border-radius: 8px; border: none; background: ${PayrollModule.viewMode === 'table' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent'}; color: ${PayrollModule.viewMode === 'table' ? '#000000' : 'var(--text-secondary)'}; font-weight: bold; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); display: flex; align-items: center; gap: 6px;">
                            <i class="fa-solid fa-table" style="font-size: 13px;"></i> Bảng Dữ Liệu
                        </button>
                    </div>

                    <div style="display: flex; gap: 8px; align-items: center;">
                        <label style="color: var(--text-secondary); font-size: 13px; font-weight: 500;">Chọn kỳ:</label>
                        <button id="payroll-month-btn" class="btn btn-outline" style="min-width: 140px; border-color: rgba(255,255,255,0.12); color: #fff; background: rgba(20,20,30,0.6); height: 38px; display: flex; align-items: center; justify-content: center; gap: 8px; border-radius: 8px; transition: all 0.3s;" onclick="PayrollModule.openMonthPicker()">
                            <i class="fa-solid fa-calendar-check" style="color: var(--success);"></i>
                            <span style="font-weight: 600;">${PayrollModule.getCycleLabel(PayrollModule.currentMonth)}</span>
                        </button>
                        <button class="btn btn-success" style="border-radius: 8px; height: 38px; display: flex; align-items: center; gap: 6px;" onclick="PayrollModule.exportToExcel()"><i class="fa-solid fa-file-excel"></i> Excel</button>
                        <button class="btn btn-outline" style="border-color: #f1c40f; color: #f1c40f; border-radius: 8px; height: 38px; display: flex; align-items: center; gap: 6px;" onclick="PayrollModule.exportToPDF()"><i class="fa-solid fa-file-pdf"></i> PDF</button>
                    </div>
                </div>
            </div>
            
            <style>
                /* Cyber Card Grid Layout */
                .cyber-payroll-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
                    gap: 24px;
                    padding: 8px 4px;
                }
                
                /* TCG Card Outer Container with glowing border */
                .cyber-payroll-card {
                    position: relative;
                    border-radius: 18px;
                    background: linear-gradient(135deg, rgba(22,22,35,0.92), rgba(8,8,18,0.98));
                    border: 2px solid rgba(var(--card-glow-color, 255, 255, 255), 0.15);
                    box-shadow: 0 12px 35px rgba(0,0,0,0.6), inset 0 0 25px rgba(255,255,255,0.02);
                    padding: 6px;
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }
                
                /* Animated card overlay glow */
                .cyber-payroll-card::before {
                    content: '';
                    position: absolute;
                    top: -50%; left: -50%;
                    width: 200%; height: 200%;
                    background: linear-gradient(45deg, transparent, rgba(var(--card-glow-color, 255, 255, 255), 0.05), transparent);
                    transform: rotate(45deg);
                    transition: all 0.8s ease;
                    pointer-events: none;
                    z-index: 1;
                    opacity: 0;
                }
                
                .cyber-payroll-card:hover {
                    transform: translateY(-8px) scale(1.02);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.7), 0 0 25px rgba(var(--card-glow-color, 0, 229, 255), 0.35);
                    border-color: rgba(var(--card-glow-color, 0, 229, 255), 0.8);
                }
                
                .cyber-payroll-card:hover::before {
                    opacity: 1;
                    transform: translate(20%, 20%) rotate(45deg);
                }
                
                /* Card Inner Border */
                .card-inner {
                    position: relative;
                    z-index: 2;
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 12px;
                    padding: 16px;
                    background-image: 
                        linear-gradient(rgba(255,255,255,0.01) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.01) 1px, transparent 1px);
                    background-size: 20px 20px;
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    justify-content: space-between;
                }
                
                /* Header: Avatar, Name, Role badge */
                .card-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 14px;
                }
                
                .user-avatar {
                    width: 46px;
                    height: 46px;
                    border-radius: 12px;
                    border: 2px solid rgba(var(--card-glow-color), 1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: radial-gradient(circle, rgba(var(--card-glow-color), 0.2) 0%, rgba(0,0,0,0.5) 100%);
                    font-size: 18px;
                    box-shadow: 0 0 10px rgba(var(--card-glow-color), 0.3);
                    color: rgba(var(--card-glow-color), 1);
                    text-shadow: 0 0 8px rgba(var(--card-glow-color), 0.6);
                }
                
                .user-meta {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                
                .user-name {
                    font-size: 16px;
                    font-weight: 800;
                    color: #ffffff;
                    letter-spacing: 0.5px;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
                }
                
                .user-role-badge {
                    font-size: 9px;
                    font-weight: 900;
                    padding: 2px 6px;
                    border-radius: 4px;
                    color: #000000;
                    letter-spacing: 0.8px;
                    width: fit-content;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                    text-transform: uppercase;
                }
                
                .card-divider {
                    height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 50%, transparent);
                    margin-bottom: 14px;
                }
                
                .card-stats {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    flex-grow: 1;
                }
                
                .stat-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .stat-label {
                    font-size: 12.5px;
                    color: var(--text-secondary);
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                
                .stat-value {
                    font-size: 13.5px;
                    font-weight: 700;
                    color: #ffffff;
                }
                
                .stat-value.text-gold {
                    color: #ffd700;
                    text-shadow: 0 0 10px rgba(255,215,0,0.25);
                }
                
                .stat-group-title {
                    font-size: 9.5px;
                    font-weight: 900;
                    color: var(--text-secondary);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin-top: 6px;
                    margin-bottom: 2px;
                    border-left: 2px solid rgba(var(--card-glow-color), 1);
                    padding-left: 6px;
                }
                
                /* Grid of Attendance */
                .attendance-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 6px;
                    margin-bottom: 2px;
                }
                
                .att-box {
                    background: rgba(0,0,0,0.3);
                    border-radius: 8px;
                    padding: 8px 2px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    border: 1px solid rgba(255,255,255,0.03);
                    transition: all 0.2s ease;
                }
                
                .att-box:hover {
                    background: rgba(255,255,255,0.04);
                    border-color: rgba(255,255,255,0.08);
                }
                
                .att-num {
                    font-size: 15px;
                    font-weight: 800;
                }
                
                .att-lbl {
                    font-size: 8px;
                    color: var(--text-secondary);
                    margin-top: 3px;
                    text-align: center;
                    transform: scale(0.95);
                }
                
                .att-box.on-time { border-bottom: 2px solid var(--success); }
                .att-box.on-time .att-num { color: var(--success); text-shadow: 0 0 8px rgba(16,185,129,0.3); }
                
                .att-box.late-excused { border-bottom: 2px solid #64ffda; }
                .att-box.late-excused .att-num { color: #64ffda; text-shadow: 0 0 8px rgba(100,255,218,0.3); }
                
                .att-box.late { border-bottom: 2px solid var(--warning); }
                .att-box.late .att-num { color: var(--warning); text-shadow: 0 0 8px rgba(245,158,11,0.3); }
                
                .att-box.leave { border-bottom: 2px solid var(--primary); }
                .att-box.leave .att-num { color: var(--primary); text-shadow: 0 0 8px rgba(59,130,246,0.3); }
                
                /* Task badges row */
                .work-stats-row {
                    display: flex;
                    gap: 6px;
                }
                
                .work-badge {
                    flex: 1;
                    padding: 5px;
                    border-radius: 8px;
                    font-size: 10.5px;
                    font-weight: bold;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                    background: rgba(0,0,0,0.25);
                    border: 1px solid rgba(255,255,255,0.03);
                }
                
                .work-badge.done {
                    color: var(--success);
                    border-bottom: 1.5px solid rgba(16,185,129,0.6);
                }
                
                .work-badge.expired {
                    color: var(--danger);
                    border-bottom: 1.5px solid rgba(239,68,68,0.6);
                }
                
                /* Custom bonus and approved badging */
                .custom-bonus-section {
                    background: rgba(0,0,0,0.25);
                    border-radius: 8px;
                    padding: 8px 10px;
                    border: 1px solid rgba(255,255,255,0.04);
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                
                .admin-input-group {
                    display: flex;
                    align-items: center;
                    background: rgba(0,0,0,0.35);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 6px;
                    padding: 2px 8px;
                }
                
                .card-input {
                    background: transparent;
                    border: none;
                    outline: none;
                    color: #ffffff;
                    font-size: 12.5px;
                    font-weight: bold;
                    width: 100%;
                    text-align: right;
                    padding: 3px 0;
                }
                
                .card-input::-webkit-outer-spin-button,
                .card-input::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                
                .currency-unit {
                    font-size: 11px;
                    color: var(--text-secondary);
                    margin-left: 4px;
                }
                
                .bonus-value {
                    font-size: 13px;
                    text-align: right;
                    display: block;
                    font-weight: 700;
                }
                
                .punctuality-bonus-badge {
                    margin-top: 2px;
                }
                
                .bonus-approved {
                    color: #64ffda;
                    font-size: 11.5px;
                    font-weight: bold;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    background: rgba(100,255,218,0.08);
                    padding: 4px 8px;
                    border-radius: 6px;
                    border: 1.5px solid rgba(100,255,218,0.3);
                }
                
                .bonus-pending {
                    color: var(--warning);
                    font-size: 11px;
                    font-style: italic;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                
                .btn-approve-bonus {
                    width: 100%;
                    padding: 6px;
                    background: linear-gradient(135deg, var(--primary), #1d4ed8);
                    color: #ffffff;
                    font-size: 11px;
                    font-weight: bold;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                }
                
                .btn-approve-bonus:hover {
                    background: linear-gradient(135deg, #2563eb, #1e40af);
                    transform: translateY(-1px);
                }
                
                .penalty-text {
                    color: var(--danger);
                    font-size: 10.5px;
                    text-align: right;
                    font-weight: 600;
                }
                
                /* Net salary display footer */
                .card-footer {
                    margin-top: 14px;
                    background: rgba(0,0,0,0.45);
                    border-radius: 10px;
                    padding: 8px 12px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border: 1px solid rgba(255,255,255,0.06);
                    box-shadow: inset 0 2px 5px rgba(0,0,0,0.4);
                }
                
                .net-pay-label {
                    font-size: 10px;
                    font-weight: 900;
                    color: var(--text-secondary);
                    letter-spacing: 1.5px;
                }
                
                .net-pay-val {
                    font-size: 16px;
                    font-weight: 900;
                    letter-spacing: 0.5px;
                }

                /* Personal View 2 Columns Layout */
                .personal-payroll-container {
                    display: flex;
                    gap: 30px;
                    align-items: stretch;
                    flex-wrap: wrap;
                    margin-top: 10px;
                    width: 100%;
                }
                
                .personal-left-column {
                    flex: 1;
                    min-width: 310px;
                    max-width: 350px;
                    position: relative;
                }
                
                .personal-right-column {
                    flex: 1.8;
                    min-width: 320px;
                }
                
                /* Aura glowing effect behind the single TCG card */
                .card-aura-glow {
                    position: absolute;
                    top: 10%;
                    left: 10%;
                    right: 10%;
                    bottom: 10%;
                    background: radial-gradient(circle, rgba(var(--card-glow-color, 0, 229, 255), 0.28) 0%, transparent 70%);
                    filter: blur(35px);
                    z-index: 1;
                    pointer-events: none;
                    animation: auraPulse 4s infinite alternate ease-in-out;
                }
                
                @keyframes auraPulse {
                    0% { transform: scale(0.9); opacity: 0.5; }
                    100% { transform: scale(1.15); opacity: 0.95; }
                }
                
                /* Fine tune logs list scrollbar */
                .personal-logs-list::-webkit-scrollbar {
                    width: 5px;
                }
                .personal-logs-list::-webkit-scrollbar-track {
                    background: rgba(0,0,0,0.1);
                    border-radius: 4px;
                }
                .personal-logs-list::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.1);
                    border-radius: 4px;
                }
                .personal-logs-list::-webkit-scrollbar-thumb:hover {
                    background: rgba(255,255,255,0.2);
                }
            </style>
            
            <!-- Main Content Area -->
            <div id="payroll-content-area" style="margin-top: 10px;">
                <div style="text-align: center; padding: 40px; color: var(--text-secondary);"><i class="fa-solid fa-spinner fa-spin"></i> Đang tổng hợp dữ liệu...</div>
            </div>
            
            <!-- Hidden Table Area to facilitate PDF and Excel exports -->
            <div id="payroll-hidden-table-container" style="display: none;">
                <table class="data-table" style="width: 100%;">
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
                    </tbody>
                </table>
            </div>

            <div style="margin-top: 20px; font-size: 13px; color: var(--text-secondary); display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
                <span><i class="fa-solid fa-circle-info text-primary"></i> Lịch làm việc: <b>Thứ 2 - Thứ 7</b></span>
                <span><i class="fa-solid fa-sack-dollar text-success"></i> Ngày trả lương: <b>Mùng 10 hàng tháng</b></span>
                <span><i class="fa-solid fa-circle-info text-warning"></i> Phạt đi muộn = ${Utils.formatCurrency(PayrollModule.LATE_PENALTY)}/lần</span>
            </div>
        `;

        await PayrollModule.calculateAndRenderBody();
    },

    saveCustomBonus: async (username, amount) => {
        try {
            const val = parseFloat(amount) || 0;
            const monthStr = PayrollModule.currentMonth;
            const allCustomBonuses = await DB.getCustomBonuses();

            if (!allCustomBonuses[monthStr]) {
                allCustomBonuses[monthStr] = {};
            }
            const bonusKey = Object.keys(allCustomBonuses[monthStr]).find(k => PayrollModule.sameUser(k, username)) || username;
            allCustomBonuses[monthStr][bonusKey] = val;

            await DB.saveCustomBonuses(allCustomBonuses);
            const allApprovals = await DB.getCustomBonusApprovals();
            if (!allApprovals[monthStr]) allApprovals[monthStr] = {};
            const approvalKey = Object.keys(allApprovals[monthStr]).find(k => PayrollModule.sameUser(k, username)) || username;
            allApprovals[monthStr][approvalKey] = val === 0 ? true : false;
            await DB.saveCustomBonusApprovals(allApprovals);

            Utils.showToast(`Đã lưu đề xuất Thưởng/Phạt cho ${username}. Chưa tính vào lương khi chưa duyệt.`, 'success');
            PayrollModule.calculateAndRenderBody();
        } catch (e) {
            console.error("Lỗi lưu thưởng/phạt:", e);
            Utils.showToast("Chưa lưu được Thưởng/Phạt. Kiểm tra mạng rồi thử lại.", "error");
        }
    },

    applyAbsentPenalty: async (username, amount) => {
        try {
            const monthStr = PayrollModule.getCurrentCycleMonthStr(new Date());
            const allCustomBonuses = await DB.getCustomBonuses();
            
            if (!allCustomBonuses[monthStr]) {
                allCustomBonuses[monthStr] = {};
            }
            
            const bonusKey = Object.keys(allCustomBonuses[monthStr]).find(k => PayrollModule.sameUser(k, username)) || username;
            const currentBonus = allCustomBonuses[monthStr][bonusKey] || 0;
            allCustomBonuses[monthStr][bonusKey] = currentBonus - amount;
            
            await DB.saveCustomBonuses(allCustomBonuses);
            const allApprovals = await DB.getCustomBonusApprovals();
            if (!allApprovals[monthStr]) allApprovals[monthStr] = {};
            const approvalKey = Object.keys(allApprovals[monthStr]).find(k => PayrollModule.sameUser(k, username)) || username;
            allApprovals[monthStr][approvalKey] = (allCustomBonuses[monthStr][bonusKey] || 0) === 0 ? true : false;
            await DB.saveCustomBonusApprovals(allApprovals);
            console.log(`[System] Proposed absent penalty of ${amount} for ${username}; waiting admin approval`);
            return true;
        } catch (e) {
            console.error("Error applying absent penalty:", e);
            return false;
        }
    },

    approveCustomBonus: async (username) => {
        const monthStr = PayrollModule.currentMonth;
        const allCustomBonuses = await DB.getCustomBonuses();
        const monthlyBonuses = PayrollModule.getCycleBucket(allCustomBonuses, monthStr);
        const amount = parseFloat(PayrollModule.getUserValue(monthlyBonuses, username, 0)) || 0;
        if (!amount) {
            Utils.showToast("Không có thưởng/phạt khác để duyệt.", "info");
            return;
        }

        const confirmApprove = confirm(`Duyệt ${amount > 0 ? 'thưởng' : 'phạt'} ${Utils.formatCurrency(Math.abs(amount))} cho ${username} và tính vào lương?`);
        if (!confirmApprove) return;

        try {
            const allApprovals = await DB.getCustomBonusApprovals();
            if (!allApprovals[monthStr]) allApprovals[monthStr] = {};
            const approvalKey = Object.keys(allApprovals[monthStr]).find(k => PayrollModule.sameUser(k, username)) || username;
            allApprovals[monthStr][approvalKey] = true;
            await DB.saveCustomBonusApprovals(allApprovals);
            Utils.showToast(`Đã duyệt thưởng/phạt khác cho ${username}`, 'success');
            PayrollModule.calculateAndRenderBody();
        } catch (e) {
            console.error("Lỗi duyệt thưởng/phạt khác:", e);
            Utils.showToast("Chưa lưu được phê duyệt thưởng/phạt. Thử lại sau.", "error");
        }
    },

    approveLatePenalty: async (username) => {
        const confirmApprove = confirm(`Duyệt phạt đi muộn cho ${username} và tính vào lương kỳ này?`);
        if (!confirmApprove) return;

        try {
            const monthStr = PayrollModule.currentMonth;
            const allApprovals = await DB.getLatePenaltyApprovals();
            if (!allApprovals[monthStr]) allApprovals[monthStr] = {};
            const approvalKey = Object.keys(allApprovals[monthStr]).find(k => PayrollModule.sameUser(k, username)) || username;
            allApprovals[monthStr][approvalKey] = true;
            await DB.saveLatePenaltyApprovals(allApprovals);
            Utils.showToast(`Đã duyệt phạt đi muộn cho ${username}`, 'success');
            PayrollModule.calculateAndRenderBody();
        } catch (e) {
            console.error("Lỗi duyệt phạt đi muộn:", e);
            Utils.showToast("Chưa lưu được phê duyệt phạt đi muộn. Thử lại sau.", "error");
        }
    },

    calculateUserSalary: async (username, monthStr) => {
        try {
            await PayrollModule.repairEarlyMonthPayrollBuckets();
            const accounts = await Auth.getAccounts();
            const acc = accounts.find(a => PayrollModule.sameUser(a.username, username));
            if (!acc) return 0;

            const baseSalary = acc.baseSalary || 0;
            const allAttendance = (typeof Attendance.repairConflictingAbsentRecords === 'function')
                ? await Attendance.repairConflictingAbsentRecords(await Attendance.loadData())
                : await Attendance.loadData();
            const allLeaves = await Attendance.loadLeaveData();
            const allCustomBonuses = await DB.getCustomBonuses();
            const allSalaryAdvances = await DB.getSalaryAdvances();
            const allBonusApprovals = await DB.getBonusApprovals();
            const allCustomBonusApprovals = await DB.getCustomBonusApprovals();
            const allLatePenaltyApprovals = await DB.getLatePenaltyApprovals();
            
            const cycle = PayrollModule.getCycleRange(monthStr);
            const workingDays = PayrollModule.getWorkingDaysInCycle(cycle.startDate, cycle.endDate);
            const attendanceSummary = PayrollModule.summarizeUserCycleAttendance(allAttendance, allLeaves, username, cycle);

            const dailyRate = baseSalary / workingDays;
            const paidDays = PayrollModule.getAccruedSalaryDays(cycle, attendanceSummary);
            
            const attendancePay = paidDays * dailyRate;
            const latePenaltyCandidate = attendanceSummary.lateCount * PayrollModule.LATE_PENALTY;
            const latePenaltyApproved = latePenaltyCandidate === 0 || PayrollModule.getCycleUserValue(allLatePenaltyApprovals, monthStr, username, false) === true;
            const latePenaltyTotal = latePenaltyApproved ? latePenaltyCandidate : 0;
            const customBonusProposal = parseFloat(PayrollModule.getCycleUserValue(allCustomBonuses, monthStr, username, 0)) || 0;
            const customBonusApproved = customBonusProposal === 0 || PayrollModule.getCycleUserValue(allCustomBonusApprovals, monthStr, username, false) === true;
            const customBonus = customBonusApproved ? customBonusProposal : 0;
            const advance = parseFloat(PayrollModule.getCycleUserValue(allSalaryAdvances, monthStr, username, 0)) || 0;
            const isApproved = PayrollModule.getCycleUserValue(allBonusApprovals, monthStr, username, false) === true;
            const punctualityBonusVal = (PayrollModule.isEligibleForPunctualityBonus(attendanceSummary) && isApproved) ? 200000 : 0;

            const netSalary = attendancePay + customBonus + punctualityBonusVal - latePenaltyTotal - advance;
            const roundedNetSalary = Math.round(netSalary / 1000) * 1000;
            return Math.round(roundedNetSalary > 0 ? roundedNetSalary : 0);
        } catch (e) {
            console.error(e);
            return 0;
        }
    },

    changeMonth: (newMonth) => {
        PayrollModule.currentMonth = newMonth;
        const monthLabel = document.querySelector('#payroll-month-btn span');
        if (monthLabel) {
            monthLabel.textContent = PayrollModule.getCycleLabel(newMonth);
        }
        PayrollModule.calculateAndRenderBody();
    },

    calculateAndRenderBody: async () => {
        const tbody = document.getElementById('payroll-table-body');
        const contentArea = document.getElementById('payroll-content-area');
        if (!tbody || !contentArea) return;

        contentArea.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-secondary);"><i class="fa-solid fa-spinner fa-spin"></i> Đang tổng hợp dữ liệu...</div>';
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;"><i class="fa-solid fa-spinner fa-spin"></i> Đang tổng hợp dữ liệu...</td></tr>';

        try {
            const currentUser = Auth.currentUser;
            let accounts = await Auth.getAccounts();
            
            // Exclude only the literal 'admin' account, but keep 'congty' as it's the main finance account
            accounts = accounts.filter(a => a.username.toLowerCase() !== 'admin');
            
            // If not admin, only calculate for self
            if (currentUser.role !== 'admin') {
                const myAcc = (await Auth.getAccounts()).find(a => PayrollModule.sameUser(a.username, currentUser.username));
                accounts = myAcc ? [myAcc] : [];
            }

            // Load data
            const allAttendance = (typeof Attendance.repairConflictingAbsentRecords === 'function')
                ? await Attendance.repairConflictingAbsentRecords(await Attendance.loadData())
                : await Attendance.loadData();
            const allLeaves = await Attendance.loadLeaveData();
            const allBonusApprovals = await DB.getBonusApprovals();
            const monthlyApprovals = PayrollModule.getCycleBucket(allBonusApprovals, PayrollModule.currentMonth);
            
            // Load tasks ensuring we wait for them if not loaded
            if (typeof WorkModule !== 'undefined' && WorkModule.data && Array.isArray(WorkModule.data.tasks) && WorkModule.data.tasks.length === 0 && document.getElementById('work-view')) {
                await WorkModule.load();
            }
            const allTasks = (typeof WorkModule !== 'undefined' && WorkModule.data && Array.isArray(WorkModule.data.tasks))
                ? WorkModule.data.tasks
                : [];
            const allCustomBonuses = await DB.getCustomBonuses();
            const monthlyBonuses = PayrollModule.getCycleBucket(allCustomBonuses, PayrollModule.currentMonth);
            const allSalaryAdvances = await DB.getSalaryAdvances();
            const monthlyAdvances = PayrollModule.getCycleBucket(allSalaryAdvances, PayrollModule.currentMonth);
            const allCustomBonusApprovals = await DB.getCustomBonusApprovals();
            const monthlyCustomBonusApprovals = PayrollModule.getCycleBucket(allCustomBonusApprovals, PayrollModule.currentMonth);
            const allLatePenaltyApprovals = await DB.getLatePenaltyApprovals();
            const monthlyLatePenaltyApprovals = PayrollModule.getCycleBucket(allLatePenaltyApprovals, PayrollModule.currentMonth);

            const cycle = PayrollModule.getCycleRange(PayrollModule.currentMonth);
            const workingDays = PayrollModule.getWorkingDaysInCycle(cycle.startDate, cycle.endDate);

            // Lấy ngày hôm nay theo YYYY-MM-DD timezone Local
            const now = new Date();
            const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

            let cardsHtml = '';
            let rowsHtml = '';
            let personalRightHtml = '';
            let personalGlowColor = '0, 229, 255';

            accounts.forEach(acc => {
                const username = acc.username;
                const baseSalary = acc.baseSalary || 0;
                
                // 1. Attendance points
                let onTimeDays = 0;
                let lateDays = 0;
                let lateExcusedDays = 0;
                let approvedLeaveDays = 0;
                let lateCount = 0;

                const attendanceSummary = PayrollModule.summarizeUserCycleAttendance(allAttendance, allLeaves, username, cycle, todayStr);
                onTimeDays = attendanceSummary.onTimeDays;
                lateDays = attendanceSummary.lateDays;
                lateExcusedDays = attendanceSummary.lateExcusedDays;
                approvedLeaveDays = attendanceSummary.approvedLeaveDays;
                lateCount = attendanceSummary.lateCount;

                // 2. Tasks
                let doneTasks = 0;
                let expiredTasks = 0;

                allTasks.forEach(t => {
                    if (FinanceModule.ownerMatchesUser(t.owner, { username: username })) {
                        const dStr = t.deadline || t.ngayDang;
                        if (dStr) {
                            let d;
                            if (dStr.includes('-')) {
                                d = new Date(dStr);
                            } else if (dStr.includes('/')) {
                                const p = dStr.split('/');
                                if (p.length === 3) d = new Date(`${p[2]}-${p[1]}-${p[0]}T00:00:00`);
                            }
                            
                            if (d && d >= cycle.startDate && d <= cycle.endDate) {
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
                const dailyRate = baseSalary / workingDays;
                const paidDays = PayrollModule.getAccruedSalaryDays(cycle, attendanceSummary, now);
                
                const attendancePay = paidDays * dailyRate;
                const latePenaltyCandidate = lateCount * PayrollModule.LATE_PENALTY;
                const latePenaltyApproved = latePenaltyCandidate === 0 || PayrollModule.getUserValue(monthlyLatePenaltyApprovals, username, false) === true;
                const latePenaltyTotal = latePenaltyApproved ? latePenaltyCandidate : 0;
                
                // Thưởng chuyên cần: 200k nếu đi muộn 0 lần và có đi làm ít nhất 15 ngày
                const eligibleForBonus = PayrollModule.isEligibleForPunctualityBonus(attendanceSummary);

                // Kiểm tra xem sếp đã duyệt chưa
                const isApproved = PayrollModule.getUserValue(monthlyApprovals, username, false) === true;
                const punctualityBonusVal = (eligibleForBonus && isApproved) ? 200000 : 0;

                // Manual custom Bonus/Penalty
                const customBonusProposal = parseFloat(PayrollModule.getUserValue(monthlyBonuses, username, 0)) || 0;
                const customBonusApproved = customBonusProposal === 0 || PayrollModule.getUserValue(monthlyCustomBonusApprovals, username, false) === true;
                const customBonus = customBonusApproved ? customBonusProposal : 0;
                const advance = parseFloat(PayrollModule.getUserValue(monthlyAdvances, username, 0)) || 0;

                const netSalary = attendancePay + customBonus + punctualityBonusVal - latePenaltyTotal - advance;
                const roundedNetSalary = Math.round(netSalary > 0 ? Math.round(netSalary / 1000) * 1000 : 0);
                const customBonusStatusHtml = customBonusProposal !== 0
                    ? (customBonusApproved
                        ? `<div style="font-size:11px;color:#64ffda;margin-top:4px;"><i class="fa-solid fa-circle-check"></i> Thưởng/phạt khác đã duyệt</div>`
                        : (currentUser.role === 'admin'
                            ? `<button class="btn btn-primary" style="padding:3px 8px;font-size:11px;border-radius:4px;margin-top:5px;" onclick="PayrollModule.approveCustomBonus('${username}')"><i class="fa-solid fa-check"></i> Duyệt thưởng/phạt</button>`
                            : `<div style="font-size:11px;color:var(--warning);margin-top:4px;"><i class="fa-solid fa-hourglass-half"></i> Thưởng/phạt chờ duyệt</div>`))
                    : '';
                const latePenaltyStatusHtml = latePenaltyCandidate > 0
                    ? (latePenaltyApproved
                        ? `<div class="penalty-text"><i class="fa-solid fa-circle-check"></i> Phạt muộn đã duyệt: -${Utils.formatCurrency(latePenaltyCandidate)}</div>`
                        : (currentUser.role === 'admin'
                            ? `<button class="btn btn-outline" style="border-color:var(--warning);color:var(--warning);padding:3px 8px;font-size:11px;border-radius:4px;margin-top:5px;" onclick="PayrollModule.approveLatePenalty('${username}')"><i class="fa-solid fa-gavel"></i> Duyệt phạt muộn (-${Utils.formatCurrency(latePenaltyCandidate)})</button>`
                            : `<div class="penalty-text" style="color:var(--warning);"><i class="fa-solid fa-hourglass-half"></i> Phạt muộn chờ duyệt: -${Utils.formatCurrency(latePenaltyCandidate)}</div>`))
                    : '';

                // Setup Neon Border Theme based on role and success
                let glowColor = '0, 229, 255'; // Cyan neon
                let displayRole = 'Nhân sự';
                if (acc.role === 'admin') {
                    glowColor = '245, 158, 11'; // Vàng sếp (Amber)
                    displayRole = 'Giám Đốc';
                } else if (acc.role === 'kế toán' || acc.role === 'accountant') {
                    glowColor = '168, 85, 247'; // Tím mộng mơ (Purple)
                    displayRole = 'Kế Toán';
                } else if (roundedNetSalary > 10000000) {
                    glowColor = '16, 185, 129'; // Xanh lá chiến binh (Emerald)
                }

                // A. Generating Holographic Cards HTML
                cardsHtml += `
                    <div class="cyber-payroll-card" style="--card-glow-color: ${glowColor}; --card-color: rgb(${glowColor});">
                        <div class="card-inner">
                            <!-- Card Header -->
                            <div class="card-header">
                                <div class="user-avatar">
                                    <i class="fa-solid ${acc.role === 'admin' ? 'fa-crown' : (acc.role === 'kế toán' ? 'fa-file-invoice-dollar' : 'fa-user-ninja')}"></i>
                                </div>
                                <div class="user-meta">
                                    <span class="user-name" title="${username}">${Utils.getUserDisplayName(username) || username}</span>
                                    <span class="user-role-badge" style="background: rgb(${glowColor}); color: #000000;">${displayRole}</span>
                                </div>
                            </div>
                            
                            <div class="card-divider"></div>
                            
                            <!-- Card Body stats -->
                            <div class="card-stats">
                                <div class="stat-item">
                                    <span class="stat-label"><i class="fa-solid fa-gem" style="color: #ffd700;"></i> Lương cứng</span>
                                    <span class="stat-value text-gold">${Utils.formatCurrency(baseSalary)}</span>
                                </div>
                                
                                <div class="stat-group-title">Chấm công kỳ lương</div>
                                <div class="attendance-grid">
                                    <div class="att-box on-time" title="Đúng giờ">
                                        <span class="att-num">${onTimeDays}</span>
                                        <span class="att-lbl">Đúng giờ</span>
                                    </div>
                                    <div class="att-box late-excused" title="Muộn có phép">
                                        <span class="att-num">${lateExcusedDays}</span>
                                        <span class="att-lbl">Có phép</span>
                                    </div>
                                    <div class="att-box late" title="Muộn không phép">
                                        <span class="att-num">${lateCount}</span>
                                        <span class="att-lbl">Muộn</span>
                                    </div>
                                    <div class="att-box leave" title="Nghỉ phép">
                                        <span class="att-num">${approvedLeaveDays}</span>
                                        <span class="att-lbl">Nghỉ phép</span>
                                    </div>
                                </div>
                                
                                <div class="stat-group-title">Hiệu suất (Task)</div>
                                <div class="work-stats-row">
                                    <div class="work-badge done" title="Hoàn thành xuất sắc"><i class="fa-solid fa-square-check"></i> ${doneTasks} Done</div>
                                    <div class="work-badge expired" title="Task quá hạn"><i class="fa-solid fa-circle-exclamation"></i> ${expiredTasks} Expired</div>
                                </div>

                                <div class="stat-group-title">Thưởng & Phạt khác</div>
                                <div class="custom-bonus-section">
                                    ${currentUser.role === 'admin' ? 
                                    `<div class="admin-input-group" title="Sếp nhập thưởng phạt trực tiếp">
                                        <input type="number" class="card-input" style="color: ${customBonusProposal >= 0 ? '#10b981' : '#ef4444'};" value="${customBonusProposal}" placeholder="0" onchange="PayrollModule.saveCustomBonus('${username}', this.value)">
                                        <span class="currency-unit">đ</span>
                                    </div>` 
                                    : `<strong class="bonus-value" style="color: ${customBonusProposal >= 0 ? '#10b981' : '#ef4444'};">${customBonusProposal > 0 ? '+' : ''}${Utils.formatCurrency(customBonusProposal)}</strong>`}
                                    ${customBonusStatusHtml}
                                    
                                    ${eligibleForBonus ? `
                                        <div class="punctuality-bonus-badge">
                                            ${isApproved ? 
                                                `<span class="bonus-approved"><i class="fa-solid fa-award"></i> Chuyên cần: +${Utils.formatCurrency(200000)}</span>` : 
                                                (currentUser.role === 'admin' ? 
                                                    `<button class="btn-approve-bonus" onclick="PayrollModule.approvePunctualityBonus('${username}')"><i class="fa-solid fa-thumbs-up"></i> Duyệt chuyên cần (+200k)</button>` : 
                                                    `<span class="bonus-pending"><i class="fa-solid fa-hourglass-half"></i> Chờ sếp duyệt (+200k)</span>`)
                                            }
                                        </div>
                                    ` : ''}
                                    
                                    ${latePenaltyStatusHtml}
                                </div>

                                <div class="stat-group-title">Tạm ứng lương</div>
                                <div class="custom-bonus-section" style="margin-top: 4px;">
                                    ${currentUser.role === 'admin' ? 
                                    `<div class="admin-input-group" title="Sếp nhập tạm ứng lương">
                                        <input type="number" class="card-input" style="color: #ef4444;" value="${advance}" placeholder="0" onchange="PayrollModule.saveSalaryAdvance('${username}', this.value)">
                                        <span class="currency-unit">đ</span>
                                    </div>` 
                                    : `<strong class="bonus-value" style="color: #ef4444;">-${Utils.formatCurrency(advance)}</strong>`}
                                </div>
                            </div>

                            <!-- Card Footer: Thực Lĩnh -->
                            <div class="card-footer" style="cursor: pointer;" onclick="PayrollModule.showDetailModal('${username}')">
                                <div class="net-pay-label" style="display: flex; align-items: center; gap: 4px;">
                                    THỰC LĨNH <i class="fa-solid fa-circle-info" style="font-size: 10px; color: var(--success);" title="Xem chi tiết tính lương"></i>
                                </div>
                                <div class="net-pay-val" style="text-shadow: 0 0 10px rgba(${roundedNetSalary >= 0 ? '16,185,129' : '239,68,68'}, 0.5); color: ${roundedNetSalary >= 0 ? '#10b981' : '#ef4444'};">
                                    ${roundedNetSalary >= 0 ? '' : '-'}${Utils.formatCurrency(Math.abs(roundedNetSalary))}
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                if (currentUser.role !== 'admin') {
                    personalGlowColor = glowColor;
                    
                    // Generate chronological logs for target month
                    const logs = [];
                    
                    // Scan attendance logs
                    allAttendance.forEach(a => {
                        const recordDateStr = PayrollModule.getRecordDateStr(a);
                        if (PayrollModule.sameUser(a.username, username) && recordDateStr <= todayStr) {
                            if (recordDateStr >= cycle.startStr && recordDateStr <= cycle.endStr) {
                                if (a.status === 'late') {
                                    logs.push({
                                        date: recordDateStr,
                                        type: 'late',
                                        title: `Đi muộn không phép (-${Utils.formatCurrency(PayrollModule.LATE_PENALTY)})`,
                                        desc: `Check-in lúc: ${new Date(a.timestamp).toLocaleTimeString('vi-VN')} (Muộn ${a.lateMinutes || 0} phút)`,
                                        color: 'var(--danger)',
                                        icon: 'fa-triangle-exclamation'
                                    });
                                } else if (a.status === 'late_excused') {
                                    const reqMin = a.lateExcuse?.requestedMinutes || 30;
                                    const actMin = a.lateExcuse?.actualLateMinutes || a.lateMinutes || 0;
                                    const reason = a.lateExcuse?.reason || 'Lý do cá nhân';
                                    logs.push({
                                        date: recordDateStr,
                                        type: 'late_excused',
                                        title: 'Đi muộn có phép (Được duyệt)',
                                        desc: `Xin đi trễ ${reqMin} phút (Thực tế muộn ${actMin} phút). Lý do: "${reason}"`,
                                        color: '#64ffda',
                                        icon: 'fa-regular fa-clock'
                                    });
                                } else if (a.status === 'on_time') {
                                    logs.push({
                                        date: recordDateStr,
                                        type: 'on_time',
                                        title: 'Đi làm đúng giờ (+1 công đức)',
                                        desc: `Check-in lúc: ${new Date(a.timestamp).toLocaleTimeString('vi-VN')}`,
                                        color: 'var(--success)',
                                        icon: 'fa-circle-check'
                                    });
                                }
                            }
                        }
                    });
                    
                    // Scan leaves
                    allLeaves.forEach(l => {
                        const lDate = l.startDate || l.date || '';
                        if (PayrollModule.sameUser(l.username, username) && l.status === 'approved' && lDate <= todayStr) {
                            if (lDate >= cycle.startStr && lDate <= cycle.endStr) {
                                logs.push({
                                    date: lDate,
                                    type: 'leave',
                                    title: `Nghỉ phép không lương (${l.days || 1} ngày)`,
                                    desc: `Lý do: "${l.reason || 'Nghỉ phép năm'}"`,
                                    color: 'var(--primary)',
                                    icon: 'fa-bed'
                                });
                            }
                        }
                    });
                    
                    // Sort logs descending by date
                    logs.sort((a, b) => b.date.localeCompare(a.date));
                    
                    let logItemsHtml = '';
                    if (logs.length === 0) {
                        logItemsHtml = `<div style="text-align: center; color: var(--text-secondary); font-size: 13px; padding: 24px;">Không có ghi nhận vi phạm hay nghỉ phép nào trong tháng này.</div>`;
                    } else {
                        logItemsHtml = logs.map(log => `
                            <div style="display: flex; gap: 12px; background: rgba(255,255,255,0.02); padding: 10px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.03); align-items: start; transition: all 0.2s;">
                                <div style="background: rgba(255,255,255,0.05); color: ${log.color}; width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 13px; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.05);">
                                    <i class="fa-solid ${log.icon}"></i>
                                </div>
                                <div style="flex-grow: 1; font-size: 12px;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                                        <strong style="color: #ffffff;">${log.title}</strong>
                                        <span style="color: var(--text-secondary); font-size: 10px;">${log.date}</span>
                                    </div>
                                    <div style="color: var(--text-secondary); line-height: 1.4;">${log.desc}</div>
                                </div>
                            </div>
                        `).join('');
                    }

                    personalRightHtml = `
                        <div class="personal-right-column">
                            <div class="glass-card" style="padding: 24px; border-radius: 18px; border: 1px solid rgba(255,255,255,0.06); background: rgba(10,10,18,0.85); box-shadow: 0 12px 35px rgba(0,0,0,0.6); height: 100%; display: flex; flex-direction: column; gap: 20px;">
                                <!-- Section 1: Salary Formula & Breakdown -->
                                <div>
                                    <h4 style="font-size: 15px; color: #64ffda; margin-bottom: 6px; display: flex; align-items: center; gap: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                                        <i class="fa-solid fa-calculator"></i> Chi Tiết Tính Toán Lương
                                    </h4>
                                    <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 14px; display: flex; align-items: center; gap: 6px; border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 10px;">
                                        <i class="fa-solid fa-calendar-days" style="color: #64ffda;"></i> Chu kỳ tính: <b>${cycle.startStr.split('-').reverse().join('/')} - ${cycle.endStr.split('-').reverse().join('/')}</b>
                                    </div>
                                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; font-size: 12px; margin-bottom: 14px;">
                                        <div style="background: rgba(255,255,255,0.02); padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.04);">
                                            <span style="color: var(--text-secondary); font-size: 10px; text-transform: uppercase;">Lương cơ bản</span>
                                            <div style="font-size: 14px; font-weight: 800; color: #ffd700; margin-top: 4px;">${Utils.formatCurrency(baseSalary)}</div>
                                        </div>
                                        <div style="background: rgba(255,255,255,0.02); padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.04);">
                                            <span style="color: var(--text-secondary); font-size: 10px; text-transform: uppercase;">Ngày công chuẩn</span>
                                            <div style="font-size: 14px; font-weight: 800; color: #ffffff; margin-top: 4px;">${workingDays} ngày</div>
                                        </div>
                                        <div style="background: rgba(255,255,255,0.02); padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.04);">
                                            <span style="color: var(--text-secondary); font-size: 10px; text-transform: uppercase;">Ngày tính lương tạm</span>
                                            <div style="font-size: 14px; font-weight: 800; color: #10b981; margin-top: 4px;">${paidDays} ngày</div>
                                        </div>
                                        <div style="background: rgba(255,255,255,0.02); padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.04);">
                                            <span style="color: var(--text-secondary); font-size: 10px; text-transform: uppercase;">Còn lại/chưa tính</span>
                                            <div style="font-size: 14px; font-weight: 800; color: var(--warning); margin-top: 4px;">${Math.max(0, workingDays - paidDays)} ngày</div>
                                        </div>
                                    </div>
                                    
                                    <!-- Formula Block -->
                                    <div style="background: rgba(0,0,0,0.35); padding: 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.06); font-size: 12px; color: var(--text-secondary); line-height: 1.5;">
                                        <div style="color: #64ffda; font-weight: bold; margin-bottom: 4px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Công thức tính Thực Lĩnh:</div>
                                        Thực lĩnh = (Lương ngày &times; Ngày tính lương) + Thưởng - Phạt - Tạm ứng
                                        <div style="margin-top: 8px; font-size: 13px; color: #ffffff; font-weight: 600; border-top: 1px dashed rgba(255,255,255,0.08); padding-top: 8px;">
                                            = (${Utils.formatCurrency(Math.round(dailyRate))} &times; ${paidDays}) 
                                            ${customBonus !== 0 ? ` ${customBonus > 0 ? '+' : ''}${Utils.formatCurrency(customBonus)}` : ''}
                                            ${punctualityBonusVal > 0 ? ` + ${Utils.formatCurrency(punctualityBonusVal)}` : ''}
                                            ${latePenaltyTotal > 0 ? ` - ${Utils.formatCurrency(latePenaltyTotal)}` : ''}
                                            ${advance > 0 ? ` - ${Utils.formatCurrency(advance)}` : ''}
                                            = <span style="color: ${roundedNetSalary >= 0 ? '#10b981' : '#ef4444'}; font-weight: bold; cursor: pointer; text-decoration: underline;" onclick="PayrollModule.showDetailModal('${username}')">${Utils.formatCurrency(roundedNetSalary)} <i class="fa-solid fa-circle-info" style="font-size: 10px; margin-left: 2px;"></i></span>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Section 2: Chronological Log -->
                                <div style="flex-grow: 1; display: flex; flex-direction: column; min-height: 180px;">
                                    <h4 style="font-size: 15px; color: #64ffda; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;">
                                        <span style="display: flex; align-items: center; gap: 8px;"><i class="fa-solid fa-clock-rotate-left"></i> Nhật Ký Chi Tiết Chấm Công</span>
                                        <span style="font-size: 10px; background: rgba(100,255,218,0.1); color: #64ffda; padding: 2px 8px; border-radius: 20px; font-weight: bold;">Kỳ ${cycle.startStr.slice(5).replace('-','/')} - ${cycle.endStr.slice(5).replace('-','/')}</span>
                                    </h4>
                                    <div class="personal-logs-list" style="overflow-y: auto; flex-grow: 1; max-height: 240px; display: flex; flex-direction: column; gap: 10px; padding-right: 4px;">
                                        ${logItemsHtml}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }

                // B. Generating standard table rows (for printing/exports)
                rowsHtml += `
                    <tr>
                        <td>
                            <strong style="color: var(--primary); font-size: 15px;" title="${username}">${Utils.getUserDisplayName(username) || username}</strong><br>
                            <span class="badge ${acc.role === 'admin' ? 'badge-orange' : 'badge-blue'}" style="font-size: 10px; margin-top: 4px;">${acc.role}</span>
                        </td>
                        <td style="text-align: right; color: var(--text-secondary);">
                            ${Utils.formatCurrency(baseSalary)}
                        </td>
                        <td style="text-align: center; font-size: 13px;">
                            <span style="color: var(--success);" title="Đúng giờ"><i class="fa-solid fa-check-circle"></i> ${onTimeDays}</span> &nbsp;|&nbsp; 
                            ${lateExcusedDays > 0 ? `<span style="color: #64ffda; font-weight: bold;" title="Muộn có phép"><i class="fa-regular fa-clock"></i> ${lateExcusedDays}</span> &nbsp;|&nbsp; ` : ''}
                            <span style="color: var(--warning);" title="Đi muộn không phép"><i class="fa-solid fa-clock"></i> ${lateCount}</span> &nbsp;|&nbsp; 
                            <span style="color: var(--primary);" title="Nghỉ phép (Không lương)"><i class="fa-solid fa-bed"></i> ${approvedLeaveDays}</span>
                        </td>
                        <td style="text-align: center; font-size: 13px;">
                            <span class="badge bg-success" title="Hoàn thành">${doneTasks} Done</span>
                            <span class="badge bg-danger" title="Hết hạn">${expiredTasks} Expired</span>
                        </td>
                        <td style="text-align: right; font-size: 13px;">
                            ${currentUser.role === 'admin' ? 
                            `<div style="margin-bottom: 4px;"><input type="number" class="form-control" style="width: 100px; padding: 4px 8px; font-size: 13px; text-align: right; display: inline-block; color: ${customBonusProposal >= 0 ? 'var(--success)' : 'var(--danger)'}; border-color: rgba(255,255,255,0.1);" value="${customBonusProposal}" placeholder="0" onchange="PayrollModule.saveCustomBonus('${username}', this.value)"></div>`
                            : `<strong style="color: ${customBonusProposal >= 0 ? 'var(--success)' : 'var(--danger)'};">${customBonusProposal > 0 ? '+' : ''}${Utils.formatCurrency(customBonusProposal)}</strong>`}
                            ${customBonusStatusHtml}
                            
                            ${eligibleForBonus ? `
                                <div style="margin-top: 4px;">
                                    ${isApproved ? 
                                        `<span style="color: #64ffda; font-weight: bold;"><i class="fa-solid fa-circle-check"></i> Chuyên cần: +${Utils.formatCurrency(200000)}</span>` : 
                                        (currentUser.role === 'admin' ? 
                                            `<button class="btn btn-primary" style="padding: 2px 8px; font-size: 11px; border-radius: 4px;" onclick="PayrollModule.approvePunctualityBonus('${username}')">Duyệt thưởng (+200k)</button>` : 
                                            `<span style="color: var(--warning); font-style: italic;"><i class="fa-solid fa-hourglass-half"></i> Chờ sếp duyệt thưởng</span>`)
                                    }
                                </div>
                            ` : ''}
                            
                            ${latePenaltyStatusHtml}
                        </td>
                        <td style="text-align: right; font-size: 13px;">
                            ${currentUser.role === 'admin' ? 
                            `<input type="number" class="form-control" style="width: 100px; padding: 4px 8px; font-size: 13px; text-align: right; display: inline-block; color: var(--danger); border-color: rgba(255,255,255,0.1);" value="${advance}" placeholder="0" onchange="PayrollModule.saveSalaryAdvance('${username}', this.value)">` 
                            : `<strong style="color: var(--danger);">${advance > 0 ? '-' : ''}${Utils.formatCurrency(advance)}</strong>`}
                        </td>
                        <td style="text-align: right; cursor: pointer;" onclick="PayrollModule.showDetailModal('${username}')">
                            <strong style="font-size: 16px; color: ${roundedNetSalary >= 0 ? 'var(--success)' : 'var(--danger)'}; display: inline-flex; align-items: center; gap: 4px;">
                                ${roundedNetSalary >= 0 ? '' : '-'}${Utils.formatCurrency(Math.abs(roundedNetSalary))}
                                <i class="fa-solid fa-circle-info" style="font-size: 11px; color: var(--text-secondary);" title="Xem chi tiết"></i>
                            </strong>
                        </td>
                    </tr>
                `;
            });

            // Update standard hidden table body
            if (accounts.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: var(--text-secondary);">Không có dữ liệu tài khoản</td></tr>';
            } else {
                tbody.innerHTML = rowsHtml;
            }

            // Render view mode selection
            if (accounts.length === 0) {
                contentArea.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-secondary);"><i class="fa-solid fa-circle-exclamation"></i> Không có dữ liệu tài khoản</div>';
            } else {
                if (PayrollModule.viewMode === 'cards') {
                    if (currentUser.role !== 'admin') {
                        contentArea.innerHTML = `
                            <div class="personal-payroll-container">
                                <!-- Left Column: TCG Card with aura glow -->
                                <div class="personal-left-column">
                                    <div class="card-aura-glow" style="--card-glow-color: ${personalGlowColor};"></div>
                                    ${cardsHtml}
                                </div>
                                
                                <!-- Right Column: Highly analytical glassmorphism dashboard -->
                                ${personalRightHtml}
                            </div>
                        `;
                    } else {
                        contentArea.innerHTML = `<div class="cyber-payroll-grid">${cardsHtml}</div>`;
                    }
                } else {
                    contentArea.innerHTML = `
                        <div class="glass-card" style="overflow-x: auto; padding: 0; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); background: rgba(10,10,15,0.7);">
                            <table class="data-table" style="width: 100%; min-width: 800px; margin: 0;">
                                <thead>
                                    <tr>
                                        <th>Nhân sự</th>
                                        <th style="text-align: right;">Lương cứng</th>
                                        <th style="text-align: center;">Chấm công</th>
                                        <th style="text-align: center;">Hiệu suất (Task)</th>
                                        <th style="text-align: right;">Thưởng/Phạt khác</th>
                                        <th style="text-align: right;">Tạm ứng</th>
                                        <th style="text-align: right;">Thực Lĩnh</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${rowsHtml}
                                </tbody>
                            </table>
                        </div>
                    `;
                }
            }

        } catch (e) {
            console.error("Lỗi khi tính lương:", e);
            contentArea.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--danger);"><i class="fa-solid fa-triangle-exclamation"></i> Đã xảy ra lỗi trong quá trình tính toán.</div>';
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: var(--danger);">Đã xảy ra lỗi trong quá trình tính toán.</td></tr>';
        }
    },

    approvePunctualityBonus: async (username) => {
        const confirmApprove = confirm(`Phê duyệt thưởng chuyên cần 200k cho ${username}?`);
        if (!confirmApprove) return;

        const allApprovals = await DB.getBonusApprovals();
        const monthStr = PayrollModule.currentMonth;

        if (!allApprovals[monthStr]) allApprovals[monthStr] = {};
        const approvalKey = Object.keys(allApprovals[monthStr]).find(k => PayrollModule.sameUser(k, username)) || username;
        allApprovals[monthStr][approvalKey] = true;

        try {
            await DB.saveBonusApprovals(allApprovals);
            Utils.showToast(`Đã duyệt thưởng cho ${username}`, 'success');
            PayrollModule.calculateAndRenderBody();
        } catch (e) {
            console.error("Lỗi duyệt thưởng:", e);
            Utils.showToast("Chưa lưu được phê duyệt thưởng. Thử lại sau.", "error");
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
        const cycle = PayrollModule.getCycleRange(PayrollModule.currentMonth);
        const cycleStr = `${cycle.startStr.split('-').reverse().join('/')} - ${cycle.endStr.split('-').reverse().join('/')}`;

        clone.innerHTML = `
            <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #da251d; padding-bottom: 20px;">
                <h1 style="color: #da251d; margin-bottom: 5px;">THANH LONG WORK</h1>
                <h3>BẢNG LƯƠNG NHÂN SỰ TỔNG HỢP</h3>
                <p>${PayrollModule.getCycleLabel(PayrollModule.currentMonth)} &bull; Ngày xuất: ${today}</p>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px; font-size: 12px; text-align: left;">
                <thead>
                    <tr style="background: #f3f4f6;">
                        <th style="padding: 10px; border: 1px solid #d1d5db; text-align: left;">Nhân sự</th>
                        <th style="padding: 10px; border: 1px solid #d1d5db; text-align: right;">Lương cứng</th>
                        <th style="padding: 10px; border: 1px solid #d1d5db; text-align: center;">Chấm công</th>
                        <th style="padding: 10px; border: 1px solid #d1d5db; text-align: center;">Hiệu suất</th>
                        <th style="padding: 10px; border: 1px solid #d1d5db; text-align: right;">Thưởng/Phạt</th>
                        <th style="padding: 10px; border: 1px solid #d1d5db; text-align: right;">Tạm ứng</th>
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

        // Format input values nicely for PDF
        const inputs = clone.querySelectorAll('input');
        inputs.forEach(input => {
            const val = parseInt(input.value) || 0;
            const formatted = Utils.formatCurrency(val);
            const textNode = document.createTextNode(formatted);
            input.replaceWith(textNode);
        });

        // Remove the info circle icons in the print view
        const infoIcons = clone.querySelectorAll('.fa-circle-info');
        infoIcons.forEach(icon => icon.remove());

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

    openMonthPicker: async () => {
        const newVal = await Utils.showMonthPicker(PayrollModule.currentMonth);
        if (newVal) {
            PayrollModule.changeMonth(newVal);
        }
    },

    exportToExcel: async () => {
        Utils.showToast("Đang tạo Excel...", "info");
        const tbody = document.getElementById('payroll-table-body');
        if (!tbody) { Utils.showToast("Không có dữ liệu", "error"); return; }

        const currentUser = Auth.currentUser;
        let accounts = await Auth.getAccounts();
        
        // Exclude admin and CONGTY accounts
        accounts = accounts.filter(a => a.role !== 'admin' && a.username.toLowerCase() !== 'admin' && a.username.toLowerCase() !== 'congty');
        
        if (currentUser.role !== 'admin') {
            const myAcc = (await Auth.getAccounts()).find(a => PayrollModule.sameUser(a.username, currentUser.username));
            accounts = myAcc ? [myAcc] : [];
        }

        const allAttendance = (typeof Attendance.repairConflictingAbsentRecords === 'function')
            ? await Attendance.repairConflictingAbsentRecords(await Attendance.loadData())
            : await Attendance.loadData();
        const allLeaves = await Attendance.loadLeaveData();
        const allCustomBonuses = await DB.getCustomBonuses();
        const monthlyBonuses = PayrollModule.getCycleBucket(allCustomBonuses, PayrollModule.currentMonth);
        const allSalaryAdvances = await DB.getSalaryAdvances();
        const monthlyAdvances = PayrollModule.getCycleBucket(allSalaryAdvances, PayrollModule.currentMonth);
        const allBonusApprovals = await DB.getBonusApprovals();
        const monthlyApprovals = PayrollModule.getCycleBucket(allBonusApprovals, PayrollModule.currentMonth);
        const allCustomBonusApprovals = await DB.getCustomBonusApprovals();
        const monthlyCustomBonusApprovals = PayrollModule.getCycleBucket(allCustomBonusApprovals, PayrollModule.currentMonth);
        const allLatePenaltyApprovals = await DB.getLatePenaltyApprovals();
        const monthlyLatePenaltyApprovals = PayrollModule.getCycleBucket(allLatePenaltyApprovals, PayrollModule.currentMonth);

        const cycle = PayrollModule.getCycleRange(PayrollModule.currentMonth);
        const workingDays = PayrollModule.getWorkingDaysInCycle(cycle.startDate, cycle.endDate);
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

        const data = accounts.map(acc => {
            const username = acc.username;
            const baseSalary = acc.baseSalary || 0;
            let onTimeDays = 0, lateDays = 0, lateExcusedDays = 0, approvedLeaveDays = 0;
            let lateCount = 0;

            const attendanceSummary = PayrollModule.summarizeUserCycleAttendance(allAttendance, allLeaves, username, cycle, todayStr);
            onTimeDays = attendanceSummary.onTimeDays;
            lateDays = attendanceSummary.lateDays;
            lateExcusedDays = attendanceSummary.lateExcusedDays;
            approvedLeaveDays = attendanceSummary.approvedLeaveDays;
            lateCount = attendanceSummary.lateCount;

            const dailyRate = baseSalary / workingDays;
            const paidDays = PayrollModule.getAccruedSalaryDays(cycle, attendanceSummary, now);
            const attendancePay = paidDays * dailyRate;
            const latePenaltyCandidate = lateCount * PayrollModule.LATE_PENALTY;
            const latePenaltyApproved = latePenaltyCandidate === 0 || PayrollModule.getUserValue(monthlyLatePenaltyApprovals, username, false) === true;
            const latePenaltyTotal = latePenaltyApproved ? latePenaltyCandidate : 0;
            const isApproved = PayrollModule.getUserValue(monthlyApprovals, username, false) === true;
            const punctualityBonusVal = (PayrollModule.isEligibleForPunctualityBonus(attendanceSummary) && isApproved) ? 200000 : 0;
            
            // Tìm thưởng/ứng không phân biệt hoa thường
            const customBonusProposal = parseFloat(PayrollModule.getUserValue(monthlyBonuses, username, 0)) || 0;
            const customBonusApproved = customBonusProposal === 0 || PayrollModule.getUserValue(monthlyCustomBonusApprovals, username, false) === true;
            const customBonus = customBonusApproved ? customBonusProposal : 0;
            
            const advance = parseFloat(PayrollModule.getUserValue(monthlyAdvances, username, 0)) || 0;
            
            const netSalary = attendancePay + customBonus + punctualityBonusVal - latePenaltyTotal - advance;
            const roundedNetSalary = Math.round(netSalary > 0 ? Math.round(netSalary / 1000) * 1000 : 0);

            return {
                'Nhân sự': username,
                'Vai trò': acc.role,
                'Lương cứng': baseSalary,
                'Đúng giờ': onTimeDays,
                'Muộn có phép': lateExcusedDays,
                'Đi muộn không phép': lateDays,
                'Nghỉ phép': approvedLeaveDays,
                'Phạt muộn': -latePenaltyTotal,
                'Phạt muộn chờ duyệt': latePenaltyApproved ? 0 : -latePenaltyCandidate,
                'Tạm ứng': -advance,
                'Thưởng chuyên cần': punctualityBonusVal,
                'Thưởng/Phạt đã duyệt': customBonus,
                'Thưởng/Phạt chờ duyệt': customBonusApproved ? 0 : customBonusProposal,
                'Thực lĩnh': roundedNetSalary
            };
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Luong_' + PayrollModule.currentMonth);
        XLSX.writeFile(wb, `Bang_Luong_${PayrollModule.currentMonth}.xlsx`);
        Utils.showToast("Đã xuất Bảng Lương ra Excel!", "success");
    },

    saveSalaryAdvance: async (username, amount) => {
        try {
            const val = parseFloat(amount) || 0;
            const monthStr = PayrollModule.currentMonth;
            const allSalaryAdvances = await DB.getSalaryAdvances();

            if (!allSalaryAdvances[monthStr]) {
                allSalaryAdvances[monthStr] = {};
            }
            const advanceKey = Object.keys(allSalaryAdvances[monthStr]).find(k => PayrollModule.sameUser(k, username)) || username;
            allSalaryAdvances[monthStr][advanceKey] = val;

            await DB.saveSalaryAdvances(allSalaryAdvances);
            Utils.showToast(`Đã lưu Tạm ứng cho ${username}`, 'success');
            PayrollModule.calculateAndRenderBody();
        } catch (e) {
            console.error("Lỗi lưu tạm ứng:", e);
            Utils.showToast("Chưa lưu được Tạm ứng. Kiểm tra mạng rồi thử lại.", "error");
        }
    },

    currentDetailReport: null,

    showDetailModal: async (username) => {
        try {
            Utils.showToast("Đang tải chi tiết...", "info");
            const accounts = await Auth.getAccounts();
            const acc = accounts.find(a => PayrollModule.sameUser(a.username, username));
            if (!acc) return;

            const baseSalary = acc.baseSalary || 0;
            const allAttendance = (typeof Attendance.repairConflictingAbsentRecords === 'function')
                ? await Attendance.repairConflictingAbsentRecords(await Attendance.loadData())
                : await Attendance.loadData();
            const allLeaves = await Attendance.loadLeaveData();
            const allBonusApprovals = await DB.getBonusApprovals();
            const monthlyApprovals = PayrollModule.getCycleBucket(allBonusApprovals, PayrollModule.currentMonth);
            const allCustomBonuses = await DB.getCustomBonuses();
            const monthlyBonuses = PayrollModule.getCycleBucket(allCustomBonuses, PayrollModule.currentMonth);
            const allSalaryAdvances = await DB.getSalaryAdvances();
            const monthlyAdvances = PayrollModule.getCycleBucket(allSalaryAdvances, PayrollModule.currentMonth);
            const allCustomBonusApprovals = await DB.getCustomBonusApprovals();
            const monthlyCustomBonusApprovals = PayrollModule.getCycleBucket(allCustomBonusApprovals, PayrollModule.currentMonth);
            const allLatePenaltyApprovals = await DB.getLatePenaltyApprovals();
            const monthlyLatePenaltyApprovals = PayrollModule.getCycleBucket(allLatePenaltyApprovals, PayrollModule.currentMonth);

            const cycle = PayrollModule.getCycleRange(PayrollModule.currentMonth);
            const workingDays = PayrollModule.getWorkingDaysInCycle(cycle.startDate, cycle.endDate);

            const now = new Date();
            const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

            let onTimeDays = 0, lateDays = 0, lateExcusedDays = 0, approvedLeaveDays = 0;
            let lateCount = 0;

            const attendanceSummary = PayrollModule.summarizeUserCycleAttendance(allAttendance, allLeaves, username, cycle, todayStr);
            onTimeDays = attendanceSummary.onTimeDays;
            lateDays = attendanceSummary.lateDays;
            lateExcusedDays = attendanceSummary.lateExcusedDays;
            approvedLeaveDays = attendanceSummary.approvedLeaveDays;
            lateCount = attendanceSummary.lateCount;

            const dailyRate = baseSalary / workingDays;
            const paidDays = PayrollModule.getAccruedSalaryDays(cycle, attendanceSummary, now);
            const absentDays = Math.max(0, workingDays - paidDays);

            const attendancePay = paidDays * dailyRate;
            const latePenaltyCandidate = lateCount * PayrollModule.LATE_PENALTY;
            const latePenaltyApproved = latePenaltyCandidate === 0 || PayrollModule.getUserValue(monthlyLatePenaltyApprovals, username, false) === true;
            const latePenaltyTotal = latePenaltyApproved ? latePenaltyCandidate : 0;
            
            const eligibleForBonus = PayrollModule.isEligibleForPunctualityBonus(attendanceSummary);
            const isApproved = PayrollModule.getUserValue(monthlyApprovals, username, false) === true;
            const punctualityBonusVal = (eligibleForBonus && isApproved) ? 200000 : 0;

            const customBonusProposal = parseFloat(PayrollModule.getUserValue(monthlyBonuses, username, 0)) || 0;
            const customBonusApproved = customBonusProposal === 0 || PayrollModule.getUserValue(monthlyCustomBonusApprovals, username, false) === true;
            const customBonus = customBonusApproved ? customBonusProposal : 0;
            
            const advance = parseFloat(PayrollModule.getUserValue(monthlyAdvances, username, 0)) || 0;

            const totalDeductions = (dailyRate * absentDays) + advance + latePenaltyTotal + (customBonus < 0 ? Math.abs(customBonus) : 0);
            const totalAdditions = punctualityBonusVal + (customBonus > 0 ? customBonus : 0);

            const netSalary = attendancePay + customBonus + punctualityBonusVal - latePenaltyTotal - advance;
            const roundedNetSalary = Math.round(netSalary > 0 ? Math.round(netSalary / 1000) * 1000 : 0);

            const attendanceHistoryHtml = attendanceSummary.records
                .slice()
                .sort((a, b) => String(a.dateStr).localeCompare(String(b.dateStr)) || Number(a.timestamp || 0) - Number(b.timestamp || 0))
                .map(r => {
                    const shift = PayrollModule.getShiftKey(r) === 'afternoon' ? 'Chiều' : 'Sáng';
                    const statusMap = {
                        on_time: { label: 'Đúng giờ', color: 'var(--success)' },
                        late_excused: { label: 'Trễ có phép', color: '#64ffda' },
                        late: { label: `Muộn ${r.lateMinutes || 0}p`, color: 'var(--danger)' },
                        absent_unexcused: { label: 'Vắng', color: 'var(--danger)' }
                    };
                    const statusInfo = statusMap[r.status] || { label: r.status || 'Không rõ', color: 'var(--text-secondary)' };
                    const timeText = r.timestamp ? new Date(r.timestamp).toLocaleTimeString('vi-VN') : '--:--';
                    return `
                        <tr>
                            <td style="padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.06);">${r.dateStr}</td>
                            <td style="padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.06);">${shift}</td>
                            <td style="padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.06);color:${statusInfo.color};font-weight:700;">${statusInfo.label}</td>
                            <td style="padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.06);text-align:right;">${timeText}</td>
                        </tr>
                    `;
                }).join('');

            const leaveHistoryHtml = (allLeaves || [])
                .filter(l => PayrollModule.sameUser(l.username, username) && l.status === 'approved')
                .filter(l => {
                    const lDate = l.startDate || l.date || '';
                    return lDate >= cycle.startStr && lDate <= cycle.endStr && lDate <= todayStr;
                })
                .sort((a, b) => String(a.startDate || a.date || '').localeCompare(String(b.startDate || b.date || '')))
                .map(l => `
                    <tr>
                        <td style="padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.06);">${l.startDate || l.date || ''}</td>
                        <td style="padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.06);color:#64ffda;font-weight:700;">Nghỉ phép</td>
                        <td style="padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.06);text-align:right;">${parseFloat(l.days) || 1} ngày</td>
                    </tr>
                `).join('');

            PayrollModule.currentDetailReport = {
                displayName: Utils.getUserDisplayName(username) || username,
                month: PayrollModule.getCycleLabel(PayrollModule.currentMonth),
                baseSalary,
                workingDays,
                paidDays,
                absentDays,
                dailyRate,
                absentDeduction: dailyRate * absentDays,
                advance,
                lateCount,
                latePenaltyTotal,
                latePenaltyCandidate,
                latePenaltyApproved,
                customBonus,
                customBonusProposal,
                customBonusApproved,
                punctualityBonusVal,
                roundedNetSalary,
                netSalary
            };

            const body = document.getElementById('payroll-detail-modal-body');
            body.innerHTML = `
                <div style="font-family: 'Inter', sans-serif; color: #fff;">
                    <!-- Thông tin chung -->
                    <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; margin-bottom: 16px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px;">
                            <span style="color: var(--text-secondary);">Nhân sự:</span>
                            <strong style="color: var(--primary);">${Utils.getUserDisplayName(username) || username}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px;">
                            <span style="color: var(--text-secondary);">Kỳ lương:</span>
                            <strong>${PayrollModule.getCycleLabel(PayrollModule.currentMonth)}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 13px;">
                            <span style="color: var(--text-secondary);">Mức lương cơ bản:</span>
                            <strong style="color: #ffd700;">${Utils.formatCurrency(baseSalary)}</strong>
                        </div>
                    </div>

                    <!-- Chỉ số công -->
                    <h4 style="color: var(--primary); border-left: 3px solid var(--primary); padding-left: 8px; margin-bottom: 10px; font-size: 13px; text-transform: uppercase;">1. Chỉ số công & Ngày công</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; font-size: 13px;">
                        <div style="background: rgba(255,255,255,0.02); padding: 8px 10px; border-radius: 6px;">
                            <div style="color: var(--text-secondary); font-size: 11px;">Số ngày công chuẩn</div>
                            <strong style="font-size: 14px;">${workingDays} ngày</strong>
                        </div>
                        <div style="background: rgba(255,255,255,0.02); padding: 8px 10px; border-radius: 6px;">
                            <div style="color: var(--text-secondary); font-size: 11px;">Số ngày tính lương</div>
                            <strong style="color: var(--success); font-size: 14px;">${paidDays} ngày</strong>
                        </div>
                        <div style="background: rgba(255,255,255,0.02); padding: 8px 10px; border-radius: 6px;">
                            <div style="color: var(--text-secondary); font-size: 11px;">Lương 1 ngày công</div>
                            <strong style="font-size: 14px;">${Utils.formatCurrency(Math.round(dailyRate))}</strong>
                        </div>
                        <div style="background: rgba(255,255,255,0.02); padding: 8px 10px; border-radius: 6px;">
                            <div style="color: var(--text-secondary); font-size: 11px;">Còn lại/chưa tính lương</div>
                            <strong style="color: var(--warning); font-size: 14px;">${absentDays} ngày</strong>
                        </div>
                    </div>

                    <h4 style="color: #64ffda; border-left: 3px solid #64ffda; padding-left: 8px; margin-bottom: 10px; font-size: 13px; text-transform: uppercase;">Lịch sử trong kỳ</h4>
                    <div style="background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; margin-bottom: 16px; overflow: hidden;">
                        <table style="width:100%;border-collapse:collapse;font-size:12px;">
                            <thead style="background:rgba(255,255,255,0.04);color:var(--text-secondary);">
                                <tr>
                                    <th style="padding:7px 8px;text-align:left;">Ngày</th>
                                    <th style="padding:7px 8px;text-align:left;">Ca/Loại</th>
                                    <th style="padding:7px 8px;text-align:left;">Trạng thái</th>
                                    <th style="padding:7px 8px;text-align:right;">Giờ/Số ngày</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${attendanceHistoryHtml || ''}
                                ${leaveHistoryHtml || ''}
                                ${(!attendanceHistoryHtml && !leaveHistoryHtml) ? '<tr><td colspan="4" style="padding:12px;text-align:center;color:var(--text-secondary);">Chưa có dữ liệu trong kỳ này</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>

                    <!-- Các khoản cộng -->
                    <h4 style="color: var(--success); border-left: 3px solid var(--success); padding-left: 8px; margin-bottom: 10px; font-size: 13px; text-transform: uppercase;">2. Các khoản cộng thêm</h4>
                    <div style="background: rgba(46,204,113,0.03); border: 1px solid rgba(46,204,113,0.1); padding: 12px; border-radius: 8px; margin-bottom: 16px; font-size: 13px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span>Thưởng chuyên cần:</span>
                            <span style="color: var(--success); font-weight: bold;">+${Utils.formatCurrency(punctualityBonusVal)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span>Thưởng khác:</span>
                            <span style="color: var(--success); font-weight: bold;">+${Utils.formatCurrency(customBonus > 0 ? customBonus : 0)}</span>
                        </div>
                        ${customBonusProposal > 0 && !customBonusApproved ? `
                        <div style="display: flex; justify-content: space-between; margin-top: 8px;">
                            <span>Thưởng khác chờ duyệt:</span>
                            <span style="color: var(--warning); font-weight: bold;">+${Utils.formatCurrency(customBonusProposal)}</span>
                        </div>` : ''}
                    </div>

                    <!-- Chi tiết tạm tính & khấu trừ -->
                    <h4 style="color: var(--danger); border-left: 3px solid var(--danger); padding-left: 8px; margin-bottom: 10px; font-size: 13px; text-transform: uppercase;">3. Tạm tính & khấu trừ</h4>
                    <div style="background: rgba(231,76,60,0.03); border: 1px solid rgba(231,76,60,0.1); padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 13px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span>Ngày chưa tính/không lương (${absentDays} ngày):</span>
                            <span style="color: var(--danger); font-weight: bold;">-${Utils.formatCurrency(Math.round(dailyRate * absentDays))}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span>Trừ tiền đã tạm ứng:</span>
                            <span style="color: var(--danger); font-weight: bold;">-${Utils.formatCurrency(advance)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span>Phạt đi muộn (${lateCount} lần):</span>
                            <span style="color: var(--danger); font-weight: bold;">-${Utils.formatCurrency(latePenaltyTotal)}</span>
                        </div>
                        ${latePenaltyCandidate > 0 && !latePenaltyApproved ? `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span>Phạt đi muộn chờ duyệt:</span>
                            <span style="color: var(--warning); font-weight: bold;">-${Utils.formatCurrency(latePenaltyCandidate)}</span>
                        </div>` : ''}
                        <div style="display: flex; justify-content: space-between;">
                            <span>Khấu trừ khác:</span>
                            <span style="color: var(--danger); font-weight: bold;">-${Utils.formatCurrency(customBonus < 0 ? Math.abs(customBonus) : 0)}</span>
                        </div>
                        ${customBonusProposal < 0 && !customBonusApproved ? `
                        <div style="display: flex; justify-content: space-between; margin-top: 8px;">
                            <span>Khấu trừ khác chờ duyệt:</span>
                            <span style="color: var(--warning); font-weight: bold;">-${Utils.formatCurrency(Math.abs(customBonusProposal))}</span>
                        </div>` : ''}
                    </div>

                    <!-- Thực lĩnh -->
                    <div style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.25); padding: 14px; border-radius: 10px; font-size: 13px; text-align: center;">
                        <div style="color: var(--text-secondary); font-size: 11px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px; margin-bottom: 4px;">Số tiền lương thực lĩnh</div>
                        <div style="font-size: 24px; font-weight: 900; color: #10b981; margin-bottom: 6px;">${Utils.formatCurrency(roundedNetSalary)}</div>
                        <div style="font-size: 11px; color: var(--text-secondary); font-style: italic; line-height: 1.4; word-break: break-word;">
                            Công thức: (Lương ngày &times; Ngày tính lương) + Thưởng - Phạt - Tạm ứng<br>
                            Chi tiết: (${Utils.formatCurrency(Math.round(dailyRate))} &times; ${paidDays}) 
                            ${totalAdditions > 0 ? ` + ${Utils.formatCurrency(totalAdditions)}` : ''} 
                            ${(latePenaltyTotal + (customBonus < 0 ? Math.abs(customBonus) : 0)) > 0 ? ` - ${Utils.formatCurrency(latePenaltyTotal + (customBonus < 0 ? Math.abs(customBonus) : 0))}` : ''}
                            ${advance > 0 ? ` - ${Utils.formatCurrency(advance)}` : ''} 
                            = ${Utils.formatCurrency(Math.max(0, netSalary))} (Làm tròn: ${Utils.formatCurrency(roundedNetSalary)})
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('payroll-detail-modal-overlay').classList.add('active');
        } catch (e) {
            console.error("Lỗi khi hiển thị chi tiết lương:", e);
            Utils.showToast("Không thể hiển thị chi tiết", "error");
        }
    },

    closeDetailModal: () => {
        const modal = document.getElementById('payroll-detail-modal-overlay');
        if (modal) modal.classList.remove('active');
    },

    copyPayrollReportToClipboard: () => {
        const data = PayrollModule.currentDetailReport;
        if (!data) return;

        const text = `📊 BẢNG TÍNH LƯƠNG CHI TIẾT - THÁNG ${data.month}
👤 Nhân viên: ${data.displayName}
--------------------------------------
- Mức lương cơ bản: ${Utils.formatCurrency(data.baseSalary)}
- Số ngày công chuẩn: ${data.workingDays} ngày
- Số ngày tính lương: ${data.paidDays} ngày
- Số ngày còn lại/chưa tính lương: ${data.absentDays} ngày
- Lương 1 ngày công: ${Utils.formatCurrency(Math.round(data.dailyRate))}

💸 CHI TIẾT CÁC KHOẢN KHẤU TRỪ:
- Ngày chưa tính/không lương (${data.absentDays} ngày): ${Utils.formatCurrency(Math.round(data.absentDeduction))}
- Trừ tiền đã tạm ứng: ${Utils.formatCurrency(data.advance)}
- Phạt đi muộn (${data.lateCount} lần): ${Utils.formatCurrency(data.latePenaltyTotal)}
- Phạt đi muộn chờ duyệt: ${Utils.formatCurrency(data.latePenaltyApproved ? 0 : data.latePenaltyCandidate)}
- Khấu trừ khác: ${Utils.formatCurrency(data.customBonus < 0 ? Math.abs(data.customBonus) : 0)}
- Khấu trừ khác chờ duyệt: ${Utils.formatCurrency(data.customBonusProposal < 0 && !data.customBonusApproved ? Math.abs(data.customBonusProposal) : 0)}

🎁 CÁC KHOẢN CỘNG THÊM:
- Thưởng chuyên cần: ${Utils.formatCurrency(data.punctualityBonusVal)}
- Thưởng khác: ${Utils.formatCurrency(data.customBonus > 0 ? data.customBonus : 0)}
- Thưởng khác chờ duyệt: ${Utils.formatCurrency(data.customBonusProposal > 0 && !data.customBonusApproved ? data.customBonusProposal : 0)}

💰 SỐ TIỀN LƯƠNG THỰC LĨNH:
- Công thức: (Lương ngày x Ngày tính lương) + Thưởng - Phạt - Tạm ứng
- Chi tiết: (${Utils.formatCurrency(Math.round(data.dailyRate))} x ${data.paidDays}) + ${Utils.formatCurrency(data.punctualityBonusVal + (data.customBonus > 0 ? data.customBonus : 0))} - ${Utils.formatCurrency(data.latePenaltyTotal + (data.customBonus < 0 ? Math.abs(data.customBonus) : 0))} - ${Utils.formatCurrency(data.advance)} = ${Utils.formatCurrency(Math.max(0, data.netSalary))}
- Làm tròn: ${Utils.formatCurrency(data.roundedNetSalary)}
--------------------------------------
Thanh Long Work - Chúc bạn tháng mới làm việc hiệu quả!`;

        navigator.clipboard.writeText(text).then(() => {
            Utils.showToast("Đã copy báo cáo chi tiết vào bộ nhớ tạm!", "success");
        }).catch(err => {
            console.error("Lỗi khi copy:", err);
            Utils.showToast("Copy thất bại, vui lòng thử lại!", "error");
        });
    }
};
