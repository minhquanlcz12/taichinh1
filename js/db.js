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
        return Utils.storage.get('backup_accounts', []);
    },

    incrementUserStats: async (username, statName) => {
        try {
            const accounts = await DB.getAccounts();
            const index = accounts.findIndex(a => a.username === username);
            if (index !== -1) {
                if (!accounts[index].stats) accounts[index].stats = { caroWins: 0, caroLosses: 0 };
                if (!accounts[index].stats[statName]) accounts[index].stats[statName] = 0;
                accounts[index].stats[statName]++;
                await DB.saveAccounts(accounts);
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
    saveFinanceData: async (financeDataObj) => {
        try {
            Utils.storage.set('backup_finance', financeDataObj);
            await db.collection("finance").doc("main").set(financeDataObj);
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

    // --- LƯU TRỮ CHẤM CÔNG ---
    saveAttendance: async (attendanceArray) => {
        try {
            Utils.storage.set('tl_attendance', attendanceArray);
            await db.collection("system").doc("attendance").set({ data: attendanceArray });
        } catch (e) {
            console.error("Error saving attendance:", e);
        }
    },

    getAttendance: async () => {
        try {
            const doc = await db.collection("system").doc("attendance").get();
            if (doc.exists && doc.data() && doc.data().data) {
                return doc.data().data;
            }
        } catch (e) {
            console.error("Error getting attendance fallback:", e);
        }
        return Utils.storage.get('tl_attendance', []);
    },

    // --- LƯU TRỮ XIN NGHỈ PHÉP ---
    saveLeaveRequests: async (leavesArray) => {
        try {
            Utils.storage.set('tl_leave_requests', leavesArray);
            await db.collection("system").doc("leave_requests").set({ data: leavesArray });
        } catch (e) {
            console.error("Error saving leave requests:", e);
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
            return false;
        }
    },

    getBonusApprovals: async () => {
        try {
            const doc = await db.collection("system").doc("bonus_approvals").get();
            if (doc.exists && doc.data()) {
                return doc.data();
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
            Utils.storage.remove('tl_attendance');
            Utils.storage.remove('tl_leave_requests');
            Utils.storage.remove('tl_late_requests');
            Utils.storage.remove('backup_prompts');
            Utils.storage.remove('backup_chatbots');
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
            const gameData = {
                player1: p1,
                player2: p2,
                board: Array(15 * 15).fill(null),
                turn: p1,
                status: 'playing',
                winner: null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
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
    }
};
