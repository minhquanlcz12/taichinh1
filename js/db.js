// js/db.js - Tích hợp Firebase Firestore

const firebaseConfig = {
    apiKey: "AIzaSyDnf92gy04FlMvifu2j_9GA2OYP8hVHW54",
    authDomain: "taichinh-2f40d.firebaseapp.com",
    projectId: "taichinh-2f40d",
    storageBucket: "taichinh-2f40d.firebasestorage.app",
    messagingSenderId: "302006845249",
    appId: "1:302006845249:web:d1b72124789f30810cebc0",
    measurementId: "G-YMZ3V27GD6"
};

// Initialize Firebase App
firebase.initializeApp(firebaseConfig);

// Initialize Cloud Firestore
const db = firebase.firestore();

const DB = {
    // --- LƯU TRỮ TÀI KHOẢN ---
    saveAccounts: async (accountsArray) => {
        try {
            Utils.storage.set('backup_accounts', accountsArray); // Offline Fallback
            await db.collection("system").doc("accounts").set({
                data: accountsArray
            });
            console.log("Accounts saved to Firebase");
        } catch (e) {
            console.error("Error saving accounts:", e);
        }
    },

    getAccounts: async () => {
        try {
            const doc = await db.collection("system").doc("accounts").get();
            if (doc.exists && doc.data() && doc.data().data) {
                return doc.data().data;
            }
        } catch (e) {
            console.error("Error getting accounts from Firebase, falling back to LocalStorage:", e);
        }
        const fallback = Utils.storage.get('backup_accounts', []);
        return Array.isArray(fallback) ? fallback : [];
    },

    incrementUserStats: async (username, statName) => {
        try {
            const normalizedU = (username || '').toLowerCase().trim();
            const accounts = await DB.getAccounts();
            const index = accounts.findIndex(a => (a.username || '').toLowerCase().trim() === normalizedU);
            if (index !== -1) {
                if (!accounts[index].stats) accounts[index].stats = { caroWins: 0, caroLosses: 0 };
                if (!accounts[index].stats[statName]) accounts[index].stats[statName] = 0;
                accounts[index].stats[statName]++;
                await DB.saveAccounts(accounts);

                // Nếu là thắng Caro -> Tự động kiểm tra và mở khóa danh hiệu Caro
                if (statName === 'caroWins' && typeof Auth !== 'undefined' && typeof Auth.checkAndUnlockCaroAchievements === 'function') {
                    await Auth.checkAndUnlockCaroAchievements(username);
                }

                return true;
            }
        } catch (e) {
            console.error("Error incrementing user stats:", e);
        }
        return false;
    },

    // --- LƯU TRỮ CÀI ĐẶT HỆ THỐNG ---
    saveSettings: async (settingsObj) => {
        try {
            Utils.storage.set('backup_settings', settingsObj);
            // Use merge:true to avoid overwriting other settings fields
            await db.collection("system").doc("settings").set(settingsObj, { merge: true });
        } catch (e) {
            console.error("Error saving settings:", e);
        }
    },

    getSettings: async () => {
        try {
            const doc = await db.collection("system").doc("settings").get();
            if (doc.exists) {
                return doc.data();
            }
        } catch (e) {
            console.error("Error getting settings:", e);
        }
        return Utils.storage.get('backup_settings', {});
    },

    // --- LƯU TRỮ YÊU CẦU CẤP LẠI MẬT KHẨU ---
    savePasswordRequests: async (requestsArray) => {
        try {
            Utils.storage.set('backup_pwd_reqs', requestsArray);
            await db.collection("system").doc("password_requests").set({
                data: requestsArray
            });
        } catch (e) {
            console.error("Error saving password requests:", e);
        }
    },

    getPasswordRequests: async () => {
        try {
            const doc = await db.collection("system").doc("password_requests").get();
            if (doc.exists && doc.data() && doc.data().data) {
                return doc.data().data;
            }
        } catch (e) {
            console.error("Error getting password requests:", e);
        }
        return Utils.storage.get('backup_pwd_reqs', []);
    },

    // --- LƯU TRỮ GIAO DỊCH TÀI CHÍNH ---
    financeOwnerKey: (owner) => String(owner || '')
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, ''),

    financeTxKey: (tx) => [
        tx && tx.date ? tx.date : '',
        DB.financeOwnerKey(tx && tx.owner),
        tx && tx.type ? tx.type : '',
        Number(tx && tx.amount ? tx.amount : 0),
        String(tx && tx.note ? tx.note : '').trim().toLowerCase()
    ].join('|'),

    mergeFinanceTransactions: (incomingTxs, remoteTxs) => {
        const merged = [];
        const seen = new Set();

        [...(remoteTxs || []), ...(incomingTxs || [])].forEach(tx => {
            if (!tx) return;
            const normalized = DB.financeOwnerKey(tx.owner) === 'congty'
                ? { ...tx, owner: 'CONGTY' }
                : tx;
            const key = normalized.id || DB.financeTxKey(normalized);
            if (seen.has(key)) return;
            seen.add(key);
            merged.push(normalized);
        });

        return merged;
    },

    saveFinanceData: async (financeDataObj) => {
        try {
            const incoming = financeDataObj && Array.isArray(financeDataObj.transactions)
                ? financeDataObj
                : { transactions: [] };
            let dataToSave = {
                ...incoming,
                transactions: (incoming.transactions || []).map(tx =>
                    DB.financeOwnerKey(tx && tx.owner) === 'congty' ? { ...tx, owner: 'CONGTY' } : tx
                )
            };

            try {
                const remoteDoc = await db.collection("finance").doc("main").get();
                const remoteData = remoteDoc.exists ? remoteDoc.data() : null;
                const remoteTxs = remoteData && Array.isArray(remoteData.transactions) ? remoteData.transactions : [];
                const incomingTxs = dataToSave.transactions || [];

                // A stale browser tab or old recovery tool must never overwrite a larger ledger.
                if (remoteTxs.length > incomingTxs.length + 3) {
                    console.warn('[DB] Prevented finance overwrite with fewer rows. Merging remote + incoming instead.', {
                        remote: remoteTxs.length,
                        incoming: incomingTxs.length
                    });
                    dataToSave = {
                        ...(remoteData || {}),
                        ...dataToSave,
                        transactions: DB.mergeFinanceTransactions(incomingTxs, remoteTxs)
                    };
                }
            } catch (guardError) {
                console.warn('[DB] Finance overwrite guard could not read remote data. Saving incoming data only.', guardError);
            }

            Utils.storage.set('backup_finance', dataToSave);
            await db.collection("finance").doc("main").set(dataToSave);
        } catch (e) {
            console.error("Error saving finance data:", e);
        }
    },

    getFinanceData: async () => {
        try {
            const doc = await db.collection("finance").doc("main").get();
            if (doc.exists && doc.data() && doc.data().transactions) {
                return doc.data();
            }
        } catch (e) {
            console.error("Error getting finance data tracking fallback:", e);
        }
        return Utils.storage.get('backup_finance', { transactions: [] });
    },

    // --- LƯU TRỮ KẾ HOẠCH CÔNG VIỆC ---
    saveWorkData: async (workDataObj) => {
        try {
            Utils.storage.set('backup_work', workDataObj);
            await db.collection("work").doc("main").set(workDataObj);
        } catch (e) {
            console.error("Error saving work data:", e);
        }
    },

    getWorkData: async () => {
        try {
            const doc = await db.collection("work").doc("main").get();
            if (doc.exists && doc.data() && doc.data().tasks) {
                return doc.data();
            }
        } catch (e) {
            console.error("Error getting work data tracking fallback:", e);
        }
        return Utils.storage.get('backup_work', { tasks: [] });
    },

    listenWorkData: (callback) => {
        try {
            return db.collection("work").doc("main").onSnapshot((doc) => {
                if (doc.exists && doc.data() && doc.data().tasks) {
                    const data = doc.data();
                    Utils.storage.set('backup_work', data);
                    callback(data);
                } else {
                    callback({ tasks: [] });
                }
            }, (error) => {
                console.error("Lỗi nghe work data realtime:", error);
            });
        } catch (e) {
            console.error("Error setting up work data listener:", e);
        }
    },

    // --- LƯU TRỮ PHỤ CẤP / THƯỞNG PHẠT TÙY CHỈNH ---
    saveCustomBonuses: async (bonusesObj) => {
        try {
            Utils.storage.set('backup_custom_bonuses', bonusesObj);
            await db.collection("system").doc("custom_bonuses").set(bonusesObj);
        } catch (e) {
            console.error("Error saving custom bonuses:", e);
            throw e;
        }
    },

    getCustomBonuses: async () => {
        try {
            const doc = await db.collection("system").doc("custom_bonuses").get();
            if (doc.exists && doc.data()) {
                let data = doc.data();
                Utils.storage.set('backup_custom_bonuses', data);
                return data;
            }
        } catch (e) {
            console.error("Error getting custom bonuses:", e);
        }
        return Utils.storage.get('backup_custom_bonuses', {});
    },

    saveCustomBonusApprovals: async (approvalsObj) => {
        try {
            Utils.storage.set('backup_custom_bonus_approvals', approvalsObj);
            await db.collection("system").doc("custom_bonus_approvals").set(approvalsObj);
            return true;
        } catch (e) {
            console.error("Error saving custom bonus approvals:", e);
            throw e;
        }
    },

    getCustomBonusApprovals: async () => {
        try {
            const doc = await db.collection("system").doc("custom_bonus_approvals").get();
            if (doc.exists && doc.data()) {
                const data = doc.data();
                Utils.storage.set('backup_custom_bonus_approvals', data);
                return data;
            }
        } catch (e) {
            console.error("Error getting custom bonus approvals:", e);
        }
        return Utils.storage.get('backup_custom_bonus_approvals', {});
    },

    saveLatePenaltyApprovals: async (approvalsObj) => {
        try {
            Utils.storage.set('backup_late_penalty_approvals', approvalsObj);
            await db.collection("system").doc("late_penalty_approvals").set(approvalsObj);
            return true;
        } catch (e) {
            console.error("Error saving late penalty approvals:", e);
            throw e;
        }
    },

    getLatePenaltyApprovals: async () => {
        try {
            const doc = await db.collection("system").doc("late_penalty_approvals").get();
            if (doc.exists && doc.data()) {
                const data = doc.data();
                Utils.storage.set('backup_late_penalty_approvals', data);
                return data;
            }
        } catch (e) {
            console.error("Error getting late penalty approvals:", e);
        }
        return Utils.storage.get('backup_late_penalty_approvals', {});
    },

    saveSalaryAdvances: async (advancesObj) => {
        try {
            Utils.storage.set('backup_salary_advances', advancesObj);
            await db.collection("system").doc("salary_advances").set(advancesObj);
        } catch (e) {
            console.error("Error saving salary advances:", e);
            throw e;
        }
    },

    getSalaryAdvances: async () => {
        try {
            const doc = await db.collection("system").doc("salary_advances").get();
            if (doc.exists && doc.data()) {
                let data = doc.data();
                Utils.storage.set('backup_salary_advances', data);
                return data;
            }
        } catch (e) {
            console.error("Error getting salary advances:", e);
        }
        return Utils.storage.get('backup_salary_advances', {});
    },

    // --- LƯU TRỮ PROMPT VAULT ---
    savePrompts: async (promptsArray) => {
        try {
            if (window.Utils && Utils.compressImageBase64) {
                for (let i = 0; i < promptsArray.length; i++) {
                    if (promptsArray[i].imgData) {
                        promptsArray[i].imgData = await Utils.compressImageBase64(promptsArray[i].imgData);
                    }
                }
            }
            Utils.storage.set('backup_prompts', promptsArray);
            await db.collection("system").doc("prompts").set({ data: promptsArray });
            return true;
        } catch (e) {
            console.error("Error saving prompts:", e);
            return false;
        }
    },

    getPrompts: async () => {
        try {
            const doc = await db.collection("system").doc("prompts").get();
            if (doc.exists && doc.data() && doc.data().data) {
                return doc.data().data;
            }
        } catch (e) {
            console.error("Error getting prompts fallback:", e);
        }
        return Utils.storage.get('backup_prompts', []);
    },

    // --- LƯU TRỮ CHATBOT VAULT ---
    saveChatbots: async (chatbotsArray) => {
        try {
            if (window.Utils && Utils.compressImageBase64) {
                for (let i = 0; i < chatbotsArray.length; i++) {
                    if (chatbotsArray[i].imgData) {
                        chatbotsArray[i].imgData = await Utils.compressImageBase64(chatbotsArray[i].imgData);
                    }
                }
            }
            Utils.storage.set('backup_chatbots', chatbotsArray);
            await db.collection("system").doc("chatbots").set({ data: chatbotsArray });
            return true;
        } catch (e) {
            console.error("Error saving chatbots:", e);
            return false;
        }
    },

    getChatbots: async () => {
        try {
            const doc = await db.collection("system").doc("chatbots").get();
            if (doc.exists && doc.data() && doc.data().data) {
                return doc.data().data;
            }
        } catch (e) {
            console.error("Error getting chatbots fallback:", e);
        }
        return Utils.storage.get('backup_chatbots', []);
    },

    // --- LƯU TRỮ RPG SẢNH CHỜ CHIBI ---
    saveChibiRpg: async (rpgData) => {
        try {
            Utils.storage.set('backup_chibi_rpg', rpgData);
            await db.collection("system").doc("chibi_rpg").set({ data: rpgData });
            return true;
        } catch (e) {
            console.error("Error saving chibi rpg:", e);
            return false;
        }
    },

    getChibiRpg: async () => {
        try {
            const doc = await db.collection("system").doc("chibi_rpg").get();
            if (doc.exists && doc.data() && doc.data().data) {
                return doc.data().data;
            }
        } catch (e) {
            console.error("Error getting chibi rpg fallback:", e);
        }
        return Utils.storage.get('backup_chibi_rpg', {});
    },

    // --- LƯU TRỮ CHẤM CÔNG ---
    attendanceUserKey: (username) => {
        if (typeof Attendance !== 'undefined' && typeof Attendance.usernameKey === 'function') {
            return Attendance.usernameKey(username);
        }
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

    attendanceDateStr: (record) => {
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

    attendanceShiftKey: (record) => record && record.type ? record.type : 'morning',

    attendanceRecordPriority: (record) => {
        const status = record && record.status;
        if (status === 'on_time') return 4;
        if (status === 'late_excused') return 3;
        if (status === 'late') return 2;
        if (status === 'absent_unexcused') return 1;
        return 0;
    },

    mergeAttendanceRecords: (...recordSets) => {
        const bySlot = new Map();
        const looseRecords = new Map();

        recordSets.flat().filter(Boolean).forEach(raw => {
            const record = { ...raw };
            record.dateStr = DB.attendanceDateStr(record) || record.dateStr;

            const userKey = DB.attendanceUserKey(record.username);
            const dateStr = record.dateStr || '';
            const shift = DB.attendanceShiftKey(record);

            if (!userKey || !dateStr) {
                const looseKey = record.id || `${JSON.stringify(record)}_${looseRecords.size}`;
                looseRecords.set(looseKey, record);
                return;
            }

            const key = `${userKey}|${dateStr}|${shift}`;
            const current = bySlot.get(key);
            const currentPriority = DB.attendanceRecordPriority(current);
            const recordPriority = DB.attendanceRecordPriority(record);
            if (!current || recordPriority > currentPriority ||
                (recordPriority === currentPriority && Number(record.timestamp || 0) > Number(current.timestamp || 0))) {
                bySlot.set(key, record);
            }
        });

        return [...bySlot.values(), ...looseRecords.values()]
            .sort((a, b) => {
                const dateCompare = String(a.dateStr || '').localeCompare(String(b.dateStr || ''));
                if (dateCompare !== 0) return dateCompare;
                return Number(a.timestamp || 0) - Number(b.timestamp || 0);
            });
    },

    saveAttendance: async (attendanceArray) => {
        try {
            const incoming = Array.isArray(attendanceArray) ? attendanceArray : [];
            const docRef = db.collection("system").doc("attendance");
            const currentDoc = await docRef.get();
            const remote = (currentDoc.exists && currentDoc.data() && Array.isArray(currentDoc.data().data))
                ? currentDoc.data().data
                : [];
            const merged = DB.mergeAttendanceRecords(remote, incoming);

            Utils.storage.set('backup_attendance', merged);
            Utils.storage.remove('tl_attendance');
            await docRef.set({ data: merged }, { merge: true });
            return merged;
        } catch (e) {
            console.error("Error saving attendance:", e);
            const fallback = Array.isArray(attendanceArray) ? attendanceArray : [];
            Utils.storage.set('tl_attendance', fallback);
            throw e;
        }
    },

    getAttendance: async () => {
        try {
            const doc = await db.collection("system").doc("attendance").get();
            if (doc.exists && doc.data() && doc.data().data) {
                const data = doc.data().data;
                Utils.storage.set('backup_attendance', data);
                return data;
            }
        } catch (e) {
            console.error("Error getting attendance fallback:", e);
        }
        return Utils.storage.get('backup_attendance', Utils.storage.get('tl_attendance', []));
    },

    // --- LƯU TRỮ XIN NGHỈ PHÉP ---
    saveLeaveRequests: async (leavesArray) => {
        try {
            Utils.storage.set('tl_leave_requests', leavesArray);
            await db.collection("system").doc("leave_requests").set({ data: leavesArray });
        } catch (e) {
            console.error("Error saving leave requests:", e);
            throw e;
        }
    },

    getLeaveRequests: async () => {
        try {
            const doc = await db.collection("system").doc("leave_requests").get();
            if (doc.exists && doc.data() && doc.data().data) {
                return doc.data().data;
            }
        } catch (e) {
            console.error("Error getting leave requests fallback:", e);
        }
        return Utils.storage.get('tl_leave_requests', []);
    },

    // --- LƯU TRỮ XIN ĐẾN TRỄ ---
    saveLateRequests: async (lateArray) => {
        try {
            Utils.storage.set('tl_late_requests', lateArray);
            await db.collection("system").doc("late_requests").set({ data: lateArray });
        } catch (e) {
            console.error("Error saving late requests:", e);
            throw e;
        }
    },

    getLateRequests: async () => {
        try {
            const doc = await db.collection("system").doc("late_requests").get();
            if (doc.exists && doc.data() && doc.data().data) {
                return doc.data().data;
            }
        } catch (e) {
            console.error("Error getting late requests fallback:", e);
        }
        return Utils.storage.get('tl_late_requests', []);
    },

    // --- LƯU TRỮ YÊU CẦU NẠP TIỀN ---
    saveTopupRequests: async (requestsArray) => {
        try {
            Utils.storage.set('backup_topup_reqs', requestsArray);
            await db.collection("system").doc("topup_requests").set({ data: requestsArray });
            return true;
        } catch (e) {
            console.error("Error saving topup requests:", e);
            return false;
        }
    },

    getTopupRequests: async () => {
        try {
            const doc = await db.collection("system").doc("topup_requests").get();
            if (doc.exists && doc.data() && doc.data().data) {
                return doc.data().data;
            }
        } catch (e) {
            console.error("Error getting topup requests:", e);
        }
        return Utils.storage.get('backup_topup_reqs', []);
    },

    // --- LƯU TRỮ LỊCH SỬ GIAO DỊCH CHATBOT (TÁCH BIỆT TÀI CHÍNH CÁ NHÂN) ---
    saveChatbotHistory: async (historyArray) => {
        try {
            Utils.storage.set('backup_cb_history', historyArray);
            await db.collection("system").doc("chatbot_history").set({ data: historyArray });
            return true;
        } catch (e) {
            console.error("Error saving chatbot history:", e);
            return false;
        }
    },

    getChatbotHistory: async () => {
        try {
            const doc = await db.collection("system").doc("chatbot_history").get();
            if (doc.exists && doc.data() && doc.data().data) {
                return doc.data().data;
            }
        } catch (e) {
            console.error("Error getting chatbot history:", e);
        }
        return Utils.storage.get('backup_cb_history', []);
    },

    // --- LƯU TRỮ LỊCH SỬ ĐỔI THƯỞNG CÔNG ĐỨC ---
    saveRewards: async (rewardsArray) => {
        try {
            Utils.storage.set('backup_rewards', rewardsArray);
            await db.collection("system").doc("rewards").set({ data: rewardsArray });
            return true;
        } catch (e) {
            console.error("Error saving rewards:", e);
            return false;
        }
    },

    getRewards: async () => {
        try {
            const doc = await db.collection("system").doc("rewards").get();
            if (doc.exists && doc.data() && doc.data().data) {
                return doc.data().data;
            }
        } catch (e) {
            console.error("Error getting rewards :", e);
        }
        return Utils.storage.get('backup_rewards', []);
    },

    // --- LƯU TRỮ PHÊ DUYỆT THƯỞNG CHUYÊN CẦN / THÁNG ---
    saveBonusApprovals: async (approvalsObj) => {
        try {
            Utils.storage.set('backup_bonus_approvals', approvalsObj);
            await db.collection("system").doc("bonus_approvals").set(approvalsObj);
            return true;
        } catch (e) {
            console.error("Error saving bonus approvals:", e);
            throw e;
        }
    },

    getBonusApprovals: async () => {
        try {
            const doc = await db.collection("system").doc("bonus_approvals").get();
            if (doc.exists && doc.data()) {
                const data = doc.data();
                Utils.storage.set('backup_bonus_approvals', data);
                return data;
            }
        } catch (e) {
            console.error("Error getting bonus approvals:", e);
        }
        return Utils.storage.get('backup_bonus_approvals', {});
    },

    // Xóa trắng dữ liệu thiết lập lại từ đầu
    clearAll: async () => {
        try {
            Utils.storage.remove('backup_accounts');
            Utils.storage.remove('backup_finance');
            Utils.storage.remove('backup_work');
            Utils.storage.remove('backup_attendance');
            Utils.storage.remove('tl_attendance');
            Utils.storage.remove('tl_leave_requests');
            Utils.storage.remove('tl_late_requests');
            Utils.storage.remove('backup_prompts');
            Utils.storage.remove('backup_chatbots');
            Utils.storage.remove('backup_chibi_rpg');
            Utils.storage.remove('backup_topup_reqs');
            Utils.storage.remove('backup_cb_history');
            Utils.storage.remove('backup_rewards');
            await db.collection("system").doc("accounts").delete();
            await db.collection("finance").doc("main").delete();
            await db.collection("work").doc("main").delete();
            await db.collection("system").doc("attendance").delete();
            await db.collection("system").doc("leave_requests").delete();
            await db.collection("system").doc("late_requests").delete();
            await db.collection("system").doc("prompts").delete();
            await db.collection("system").doc("chatbots").delete();
            await db.collection("system").doc("chibi_rpg").delete();
            await db.collection("system").doc("topup_requests").delete();
            await db.collection("system").doc("chatbot_history").delete();
            await db.collection("system").doc("rewards").delete();
            console.log("Database reset");
        } catch (e) {
            console.error("Error clearing data:", e);
        }
    },

    // --- LOBBY & REALTIME PRESENCE ---
    updateLobbyPresence: async (presenceData) => {
        try {
            // presenceData: { username, x, y, chibiConfig }
            await db.collection("lobby_presence").doc(presenceData.username).set({
                ...presenceData,
                lastSeen: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (e) {
            console.error("Error updating lobby presence:", e);
        }
    },

    listenLobbyPresence: (callback) => {
        return db.collection("lobby_presence")
            .onSnapshot(snapshot => {
                const presence = {};
                snapshot.forEach(doc => {
                    presence[doc.id] = doc.data();
                });
                callback(presence);
            }, err => console.error("Presence listener error:", err));
    },

    sendLobbyChat: async (chatData) => {
        try {
            // chatData: { sender, text }
            await db.collection("lobby_chat").add({
                ...chatData,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (e) {
            console.error("Error sending lobby chat:", e);
        }
    },

    listenLobbyChat: (callback) => {
        return db.collection("lobby_chat")
            .orderBy("timestamp", "desc")
            .limit(50)
            .onSnapshot(snapshot => {
                const messages = [];
                snapshot.forEach(doc => {
                    messages.push({ id: doc.id, ...doc.data() });
                });
                callback(messages.reverse());
            }, err => console.error("Chat listener error:", err));
    },

    // --- CARO GAME LOGIC ---
    createLobbyGame: async (p1, p2) => {
        try {
            // Randomly pre-determine who wins the coin flip (50/50)
            const starter = Math.random() < 0.5 ? p1 : p2;
            const gameData = {
                player1: p1,
                player2: p2,
                board: Array(15 * 15).fill(null),
                turn: 'flipping', // Special state to trigger UI coin flip
                starter: starter, // Who the coin actually lands on
                status: 'playing',
                winner: null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                p2Accepted: false
            };
            const docRef = await db.collection("lobby_games").add(gameData);
            return docRef.id;
        } catch (e) {
            console.error("Error creating caro game:", e);
            return null;
        }
    },

    updateLobbyGame: async (gameId, updateData) => {
        try {
            await db.collection("lobby_games").doc(gameId).update(updateData);
        } catch (e) {
            console.error("Error updating lobby game:", e);
        }
    },

    listenLobbyGame: (gameId, callback) => {
        return db.collection("lobby_games").doc(gameId)
            .onSnapshot(doc => {
                if (doc.exists) callback(doc.data());
            }, err => console.error("Game listener error:", err));
    },

    // --- NHIỆM VỤ (QUESTS/MISSIONS) ---
    getMissions: async () => {
        try {
            const snapshot = await db.collection("missions").orderBy("createdAt", "desc").get();
            const missions = [];
            snapshot.forEach(doc => {
                missions.push({ id: doc.id, ...doc.data() });
            });
            return missions;
        } catch (e) {
            console.error("Error getting missions:", e);
            return [];
        }
    },

    createMission: async (missionData) => {
        try {
            // missionData: { title, description, type: 'daily'|'monthly', reward, status: 'active' }
            const docRef = await db.collection("missions").add({
                ...missionData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return docRef.id;
        } catch (e) {
            console.error("Error creating mission:", e);
            return null;
        }
    },

    updateMissionStatus: async (missionId, status) => {
        try {
            await db.collection("missions").doc(missionId).update({ status });
            return true;
        } catch (e) {
            console.error("Error updating mission status:", e);
            return false;
        }
    },

    deleteMission: async (missionId) => {
        try {
            await db.collection("missions").doc(missionId).delete();
            return true;
        } catch (e) {
            console.error("Error deleting mission:", e);
            return false;
        }
    },

    listenMissions: (callback) => {
        return db.collection("missions").orderBy("createdAt", "desc")
            .onSnapshot(snapshot => {
                const missions = [];
                snapshot.forEach(doc => missions.push({ id: doc.id, ...doc.data() }));
                callback(missions);
            }, err => console.error("Missions listener error:", err));
    },

    listenSettings: (callback) => {
        try {
            return db.collection("system").doc("settings").onSnapshot((doc) => {
                if (doc.exists && doc.data()) {
                    const data = doc.data();
                    Utils.storage.set('backup_settings', data);
                    callback(data);
                } else {
                    callback({});
                }
            }, err => console.error("Settings listener error:", err));
        } catch (e) {
            console.error("Error setting up settings listener:", e);
        }
    }
};
