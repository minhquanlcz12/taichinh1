// css/utils.js - Shared utilities

const Utils = {
    // LocalStorage wrappers
    storage: {
        get: (key, defaultValue = null) => {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.error('Error reading from localStorage', error);
                return defaultValue;
            }
        },
        set: (key, value) => {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (error) {
                console.error('Error saving to localStorage', error);
            }
        },
        remove: (key) => {
            localStorage.removeItem(key);
        },
        clearAll: () => {
            localStorage.clear();
        }
    },

    // Formatters
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('vi-VN').format(amount || 0) + 'đ';
    },

    formatDate: (dateString) => {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('vi-VN', options);
    },

    // Fix for Excel Serial dates (e.g. 45082)
    convertExcelDate: (excelDateCode) => {
        if (!excelDateCode) return '';

        // If it's already a standard string, normalize to DD/MM/YYYY
        if (typeof excelDateCode === 'string' && isNaN(Number(excelDateCode))) {
            let str = excelDateCode.trim();
            let parts = str.split(/[\/\-]/);
            if (parts.length >= 2 && parts.length <= 3) {
                let d = String(parts[0]).padStart(2, '0');
                let m = String(parts[1]).padStart(2, '0');
                let y = parts.length === 3 ? parts[2] : new Date().getFullYear();
                if (String(y).length === 2) y = '20' + y;
                return `${d}/${m}/${y}`;
            }
            return str;
        }

        const serialNumber = Number(excelDateCode);
        if (isNaN(serialNumber) || serialNumber <= 0) return '';

        // Excel epoch is Jan 1, 1900. JS epoch is Jan 1, 1970.
        // Difference is 25569 days (which includes the Lotus 1-2-3 leap year bug).
        const msPerDay = 86400000;
        const jsDateCode = Math.round((serialNumber - 25569) * msPerDay);

        // Use UTC methods to avoid time zone offset shifting
        const date = new Date(jsDateCode);

        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const year = date.getUTCFullYear();

        return `${day}/${month}/${year}`;
    },

    getTodayString: () => {
        const today = new Date();
        const d = String(today.getDate()).padStart(2, '0');
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const y = today.getFullYear();
        return `${d}/${m}/${y}`;
    },

    generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // UI Animations
    animateValue: (obj, start, end, duration, formatter) => {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            // easeOutQuart
            const easeProgress = 1 - Math.pow(1 - progress, 4);
            const currentVal = Math.floor(easeProgress * (end - start) + start);
            obj.textContent = formatter ? formatter(currentVal) : currentVal;
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    },

    // Modal Builder
    showModal: (title, contentHtml, onConfirm = null, confirmText = 'Xác nhận') => {
        const overlay = document.getElementById('modal-overlay');

        // Remove existing modal if any
        overlay.innerHTML = '';

        const modalHtml = `
            <div class="modal">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="close-btn" id="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    ${contentHtml}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-text" id="modal-cancel">Hủy</button>
                    ${onConfirm ? `<button class="btn btn-primary" id="modal-confirm">${confirmText}</button>` : ''}
                </div>
            </div>
        `;

        overlay.innerHTML = modalHtml;
        overlay.classList.add('active');

        // Event listeners
        const closeModal = () => overlay.classList.remove('active');

        document.getElementById('modal-close').addEventListener('click', closeModal);
        document.getElementById('modal-cancel').addEventListener('click', closeModal);

        if (onConfirm) {
            document.getElementById('modal-confirm').addEventListener('click', () => {
                if (onConfirm()) {
                    closeModal();
                }
            });
        }

        // Close on clicking outside
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });
    },

    // Custom Prompt Modal (Returns Promise)
    showPrompt: (title, defaultValue = '') => {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay active';
            overlay.style.zIndex = '9999';
            overlay.style.backdropFilter = 'blur(5px)';
            overlay.innerHTML = `
                <div class="modal glass-card" style="width: 90%; max-width: 450px; padding: 24px; animation: slideIn 0.3s ease;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                        <i class="fa-solid fa-folder-plus" style="font-size: 24px; color: var(--primary);"></i>
                        <h3 style="font-weight: 600; font-size: 18px; margin: 0;">${title}</h3>
                    </div>
                    <input type="text" id="custom-prompt-input" class="form-control" value="${defaultValue}" style="margin-bottom: 24px; width: 100%; border: 1px solid var(--glass-border); background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; font-size: 15px;" autocomplete="off" spellcheck="false">
                    <div style="display: flex; justify-content: flex-end; gap: 12px;">
                        <button class="btn btn-text" id="custom-prompt-cancel" style="padding: 10px 20px;">Hủy bỏ</button>
                        <button class="btn btn-primary" id="custom-prompt-ok" style="padding: 10px 24px;">Tiếp tục</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);

            const input = document.getElementById('custom-prompt-input');
            input.focus();
            input.select();

            const close = (val) => {
                overlay.remove();
                resolve(val);
            };

            document.getElementById('custom-prompt-cancel').onclick = () => close(null);
            document.getElementById('custom-prompt-ok').onclick = () => close(input.value.trim());

            input.onkeydown = (e) => {
                if (e.key === 'Enter') close(input.value.trim());
                if (e.key === 'Escape') close(null);
            };
        });
    },

    // Custom Confirm Modal (Returns Promise)
    showConfirm: (title, message, confirmText = 'Xác nhận', cancelText = 'Hủy') => {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay active';
            overlay.style.zIndex = '9999';
            overlay.style.backdropFilter = 'blur(5px)';
            overlay.innerHTML = `
                <div class="modal glass-card" style="width: 90%; max-width: 320px; padding: 20px; animation: slideIn 0.3s ease; text-align: center; border-radius: 12px; border: 1px solid rgba(136, 255, 209, 0.3); box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);">
                    <div style="margin-bottom: 20px;">
                        <div style="width: 50px; height: 50px; border-radius: 50%; background: rgba(255, 193, 7, 0.1); border: 2px solid var(--warning); display: flex; align-items: center; justify-content: center; margin: 0 auto 12px auto; box-shadow: 0 0 15px rgba(255, 193, 7, 0.2);">
                            <i class="fa-solid fa-triangle-exclamation" style="font-size: 24px; color: var(--warning);"></i>
                        </div>
                        <h3 style="font-weight: bold; font-size: 16px; margin: 0; margin-bottom: 8px; color: #fff;">${title}</h3>
                        <p style="color: var(--text-secondary); font-size: 13px; line-height: 1.5; margin: 0;">${message}</p>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn btn-text" id="custom-confirm-cancel" style="flex: 1; padding: 10px 0; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; display: flex; justify-content: center; align-items: center; text-align: center;">${cancelText}</button>
                        <button class="btn" id="custom-confirm-ok" style="flex: 1; padding: 10px 0; background: var(--warning); color: #000; font-weight: bold; border-radius: 6px; box-shadow: 0 0 10px rgba(255, 193, 7, 0.4); display: flex; justify-content: center; align-items: center; text-align: center;">${confirmText}</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);

            const close = (val) => {
                overlay.remove();
                resolve(val);
            };

            document.getElementById('custom-confirm-cancel').onclick = () => close(false);
            document.getElementById('custom-confirm-ok').onclick = () => close(true);
        });
    },

    // Custom Month Picker Modal (Returns Promise)
    /**
     * @param {string} initialValue - format: 'YYYY-MM'
     */
    showMonthPicker: (initialValue) => {
        return new Promise((resolve) => {
            const [initYear, initMonth] = (initialValue || new Date().toISOString().slice(0, 7)).split('-').map(Number);
            let viewingYear = initYear;

            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay active';
            overlay.style.zIndex = '10000';
            overlay.style.backdropFilter = 'blur(8px)';
            
            const renderPicker = (year) => {
                const months = [
                    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
                    'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
                    'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
                ];
                
                const currentMonthIdx = new Date().getMonth();
                const currentYear = new Date().getFullYear();

                overlay.innerHTML = `
                    <div class="modal glass-card" style="width: 90%; max-width: 320px; padding: 20px; animation: scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); border-radius: 16px; background: rgba(15, 23, 42, 0.95); border: 1px solid rgba(255,255,255,0.1);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding: 0 5px;">
                            <button id="prev-year" class="btn btn-text" style="color: var(--primary); font-size: 20px; padding: 5px 12px;"><i class="fa-solid fa-chevron-left"></i></button>
                            <h2 style="font-size: 20px; font-weight: 700; color: #fff; margin: 0; letter-spacing: 1px;">Năm ${year}</h2>
                            <button id="next-year" class="btn btn-text" style="color: var(--primary); font-size: 20px; padding: 5px 12px;"><i class="fa-solid fa-chevron-right"></i></button>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; padding: 5px;">
                            ${months.map((m, i) => {
                                const mNum = i + 1;
                                const isSelected = year === initYear && mNum === initMonth;
                                const isCurrent = year === currentYear && i === currentMonthIdx;
                                
                                return `
                                    <button class="month-btn" data-month="${mNum}" style="
                                        padding: 12px 0;
                                        border: none;
                                        border-radius: 10px;
                                        font-size: 14px;
                                        font-weight: ${isSelected ? '700' : '500'};
                                        cursor: pointer;
                                        transition: all 0.2s;
                                        background: ${isSelected ? 'var(--primary)' : isCurrent ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255,255,255,0.03)'};
                                        color: ${isSelected ? '#000' : isCurrent ? 'var(--primary)' : 'rgba(255,255,255,0.7)'};
                                        ${isCurrent && !isSelected ? 'border: 1px solid rgba(0, 240, 255, 0.3);' : ''}
                                    ">
                                        ${m}
                                    </button>
                                `;
                            }).join('')}
                        </div>
                        
                        <div style="margin-top: 20px; display: flex; justify-content: center; gap: 10px;">
                            <button class="btn btn-text" id="picker-cancel" style="font-size: 13px; color: var(--text-secondary);">Hủy bỏ</button>
                            ${year !== currentYear || initMonth !== (currentMonthIdx + 1) ? `<button class="btn btn-text" id="picker-today" style="font-size: 13px; color: var(--primary);">Tháng này</button>` : ''}
                        </div>
                    </div>
                `;

                // Events
                document.getElementById('prev-year').onclick = () => { viewingYear--; renderPicker(viewingYear); };
                document.getElementById('next-year').onclick = () => { viewingYear++; renderPicker(viewingYear); };
                document.getElementById('picker-cancel').onclick = () => { overlay.remove(); resolve(null); };
                
                const todayBtn = document.getElementById('picker-today');
                if (todayBtn) {
                    todayBtn.onclick = () => {
                        const now = new Date();
                        const val = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                        overlay.remove();
                        resolve(val);
                    };
                }

                overlay.querySelectorAll('.month-btn').forEach(btn => {
                    btn.onclick = () => {
                        const month = String(btn.dataset.month).padStart(2, '0');
                        const finalVal = `${year}-${month}`;
                        overlay.remove();
                        resolve(finalVal);
                    };
                    
                    // Hover effects
                    btn.onmouseenter = () => {
                        if (btn.style.background.includes('var(--primary)')) return;
                        btn.style.background = 'rgba(255,255,255,0.08)';
                        btn.style.color = '#fff';
                    };
                    btn.onmouseleave = () => {
                        if (btn.style.background.includes('var(--primary)')) return;
                        const isC = year === currentYear && parseInt(btn.dataset.month)-1 === currentMonthIdx;
                        btn.style.background = isC ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255,255,255,0.03)';
                        btn.style.color = isC ? 'var(--primary)' : 'rgba(255,255,255,0.7)';
                    };
                });
            };

            document.body.appendChild(overlay);
            renderPicker(viewingYear);
            
            overlay.onclick = (e) => {
                if (e.target === overlay) {
                    overlay.remove();
                    resolve(null);
                }
            };
        });
    },

    // Toast Notification Builder
    showToast: (message, type = 'success') => {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        let iconClass = 'fa-check-circle';
        if (type === 'error') iconClass = 'fa-circle-xmark';
        if (type === 'info') iconClass = 'fa-circle-info';

        toast.innerHTML = `
            <i class="fa-solid ${iconClass} toast-icon"></i>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
        `;

        container.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                toast.classList.add('show');
            });
        });

        // Auto remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 400); // Wait for transition finish
        }, 3000);
    },

    notifyTelegram: async (message) => {
        if (!app.state.settings || !app.state.settings.tgToken || !app.state.settings.tgChatId) return;
        try {
            const url = `https://api.telegram.org/bot${app.state.settings.tgToken}/sendMessage`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: app.state.settings.tgChatId,
                    text: message,
                    parse_mode: 'HTML'
                })
            });
            if (!response.ok) {
                const errText = await response.text();
                console.error("Telegram API Error:", errText);
                let specificErr = "Lỗi rỗng";
                try {
                    const parsed = JSON.parse(errText);
                    specificErr = parsed.description || errText;
                } catch(e) { specificErr = errText; }
                Utils.showToast("Lỗi gửi Telegram: " + specificErr, "error");
            } else {
                console.log("Telegram notification sent successfully.");
            }
        } catch (e) {
            console.error("Lỗi mạng khi gửi Telegram:", e);
            Utils.showToast("Lỗi mạng khi gửi Telegram", "error");
        }
    },

    checkTimeBasedActions: async () => {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();

        // 1. Nhắc nhở chấm công lúc 8:15 AM
        if (hours === 8 && minutes >= 15 && minutes <= 30) {
            await Utils.remindAttendance();
        }

        // 2. Tóm tắt cuối ngày lúc 18:00 PM (chạy từ 18:00 đến 18:30 nếu lỡ tắt máy)
        if (hours === 18 && minutes >= 0 && minutes <= 30) {
            await Utils.checkDailyTelegramSummary();
        }
    },

    remindAttendance: async () => {
        if (!app.state.settings || !app.state.settings.tgToken || !app.state.settings.tgChatId) return;
        const todayIso = new Date().toISOString().split('T')[0];
        if (app.state.settings.lastAttRemindDate === todayIso) return; // Kiểm tra nhanh cache

        let shouldSend = false;
        try {
            const settingsRef = db.collection("system").doc("settings");
            await db.runTransaction(async (transaction) => {
                const doc = await transaction.get(settingsRef);
                if (!doc.exists) {
                    transaction.set(settingsRef, { lastAttRemindDate: todayIso }, { merge: true });
                    shouldSend = true;
                } else {
                    const data = doc.data();
                    if (data.lastAttRemindDate !== todayIso) {
                        transaction.set(settingsRef, { lastAttRemindDate: todayIso }, { merge: true });
                        shouldSend = true;
                    }
                }
            });
        } catch (e) {
            console.error("Transaction failed in remindAttendance:", e);
            return;
        }

        if (!shouldSend) {
            app.state.settings.lastAttRemindDate = todayIso;
            return;
        }

        // Đánh dấu cờ nội bộ để ngăn lặp
        app.state.settings.lastAttRemindDate = todayIso;

        let accounts = [];
        try { accounts = await Auth.getAccounts(); } catch (e) { return; }

        let attendanceData = [];
        try { attendanceData = await Attendance.loadData(); } catch (e) { return; }

        const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-${String(new Date().getDate()).padStart(2,'0')}`;
        const checkedInUsers = attendanceData.filter(r => r.dateStr === todayStr).map(r => r.username);
        const missingUsers = accounts.map(a => a.username).filter(u => !checkedInUsers.includes(u) && u !== 'admin');

        if (missingUsers.length > 0) {
            let msg = `⏰ <b>NHẮC NHỞ ĐIỂM DANH SÁNG</b>\n\nHiện tại là <b>08:15</b>, chỉ còn 15 phút nữa là chốt công!\n\n`;
            msg += `Các đồng chí sau chưa điểm danh, hãy vào hệ thống điểm danh ngay nhé:\n`;
            missingUsers.forEach(u => msg += `- <b>${u}</b>\n`);
            msg += `\n👉 Bấm vào trang web Thanh Long Work phân hệ 'Chấm Công' để thực hiện.`;

            await Utils.notifyTelegram(msg);
        }
    },

    checkDailyTelegramSummary: async () => {
        if (!app.state.settings || !app.state.settings.tgToken || !app.state.settings.tgChatId) return;
        const todayIso = new Date().toISOString().split('T')[0];
        if (app.state.settings.lastTgSummaryDate === todayIso) return; // Kiểm tra nhanh cache

        let shouldSend = false;
        try {
            const settingsRef = db.collection("system").doc("settings");
            await db.runTransaction(async (transaction) => {
                const doc = await transaction.get(settingsRef);
                if (!doc.exists) {
                    transaction.set(settingsRef, { lastTgSummaryDate: todayIso }, { merge: true });
                    shouldSend = true;
                } else {
                    const data = doc.data();
                    if (data.lastTgSummaryDate !== todayIso) {
                        transaction.set(settingsRef, { lastTgSummaryDate: todayIso }, { merge: true });
                        shouldSend = true;
                    }
                }
            });
        } catch (e) {
            console.error("Transaction failed in checkDailyTelegramSummary:", e);
            return;
        }

        if (!shouldSend) {
            app.state.settings.lastTgSummaryDate = todayIso;
            return;
        }

        // Đánh dấu cờ nội bộ
        app.state.settings.lastTgSummaryDate = todayIso;

        // 1. Lấy danh sách tasks
        let allTasks = await DB.getWorkData();
        let tasks = (allTasks && allTasks.tasks) ? allTasks.tasks : [];

        // 2. Lấy data thu chi trong ngày
        let financeData = await DB.getFinanceData();
        let incomeToday = 0;
        let expenseToday = 0;
        if (financeData && financeData.transactions) {
            financeData.transactions.forEach(tx => {
                if (tx.date === todayIso) {
                    if (tx.type === 'income') incomeToday += parseFloat(tx.amount);
                    else expenseToday += parseFloat(tx.amount);
                }
            });
        }

        // 3. Lấy thông tin vắng mặt
        let allAtt = [];
        try { allAtt = await Attendance.loadData(); } catch (e) {}
        let accounts = [];
        try { accounts = await Auth.getAccounts(); } catch (e) {}

        const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-${String(new Date().getDate()).padStart(2,'0')}`;
        const checkedInUsers = allAtt.filter(r => r.dateStr === todayStr).map(r => r.username);
        const missingUsers = accounts.map(a => a.username).filter(u => !checkedInUsers.includes(u) && u !== 'admin');

        // Logic phân tích Task
        const pToday = Utils.getTodayString().split('/');
        const todayTime = new Date(`${pToday[2]}-${pToday[1]}-${pToday[0]}T00:00:00`).getTime();

        let expiredTxs = [];
        let doneToday = 0;

        tasks.forEach(t => {
            const st = (t.trangThai || 'planned').toLowerCase();
            if (st.includes('done') || st.includes('hoàn thành')) {
                if (t.deadline) {
                    let dTime;
                    if (t.deadline.includes('-')) dTime = new Date(t.deadline).getTime();
                    else if (t.deadline.includes('/')) {
                        const p = t.deadline.split('/');
                        if (p.length === 3) dTime = new Date(`${p[2]}-${p[1]}-${p[0]}T00:00:00`).getTime();
                    }
                    if (dTime === todayTime) doneToday++;
                }
                return;
            }
            if (!t.deadline) return;

            let deadlineTime;
            if (t.deadline.includes('-')) deadlineTime = new Date(t.deadline).getTime();
            else if (t.deadline.includes('/')) {
                const p = t.deadline.split('/');
                if (p.length === 3) deadlineTime = new Date(`${p[2]}-${p[1]}-${p[0]}T00:00:00`).getTime();
            }

            if (deadlineTime && !isNaN(deadlineTime)) {
                const diffDays = Math.round((deadlineTime - todayTime) / (1000 * 60 * 60 * 24));
                if (diffDays < 0) {
                    expiredTxs.push(`- [${t.project}] ${t.tieuDe || t.mucTieu} (@${t.owner})`);
                }
            }
        });

        // 4. Build tin nhắn Report
        let msg = `<b>📊 BÁO CÁO TỔNG HỢP CUỐI NGÀY</b>\n\n`;
        msg += `<b>MẢNG 1: TÀI CHÍNH</b>\n`;
        msg += `+ Tổng Thu: <b>${Utils.formatCurrency(incomeToday)}</b>\n`;
        msg += `- Tổng Chi: <b>${Utils.formatCurrency(expenseToday)}</b>\n\n`;

        msg += `<b>MẢNG 2: NHÂN SỰ</b>\n`;
        if (missingUsers.length > 0) {
            msg += `❌ Vắng mặt (Khác): <b>${missingUsers.join(', ')}</b>\n\n`;
        } else {
            msg += `✅ 100% nhân sự đi làm đầy đủ!\n\n`;
        }

        msg += `<b>MẢNG 3: TIẾN ĐỘ THỰC THI (TASK)</b>\n`;
        msg += `✅ Hoàn thành (Deadline hôm nay): <b>${doneToday}</b>\n`;
        if (expiredTxs.length > 0) {
            msg += `❌ Đang quá hạn (${expiredTxs.length}):\n${expiredTxs.slice(0, 5).join('\n')}${expiredTxs.length > 5 ? '\\n... (Xem nội bộ)' : ''}\n\n`;
        } else {
            msg += `🎉 Không có công việc nào bị quá hạn tồn đọng!\n\n`;
        }

        msg += `<i>Cảm ơn sự đóng góp của team hôm nay!</i> 🌙`;

        await Utils.notifyTelegram(msg);
    },

    compressImageBase64: async (base64) => {
        if (!base64 || !base64.startsWith('data:image/')) return base64;
        if (base64.length < 15000) return base64; // ~10KB bypass only
        
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width; let height = img.height;
                const MAX_WIDTH = 250; const MAX_HEIGHT = 250;
                if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } } 
                else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                // Nén qua WEBP
                resolve(canvas.toDataURL('image/webp', 0.6));
            };
            img.onerror = () => resolve(base64);
            img.src = base64;
        });
    }
};
