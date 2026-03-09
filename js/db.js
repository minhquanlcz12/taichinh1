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
            if (doc.exists && doc.data().data && doc.data().data.length > 0) {
                return doc.data().data;
            }
        } catch (e) {
            console.error("Error getting accounts from Firebase, falling back to LocalStorage:", e);
        }
        return Utils.storage.get('backup_accounts', []);
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
            if (doc.exists && doc.data().transactions && doc.data().transactions.length > 0) {
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
            if (doc.exists && doc.data().tasks && doc.data().tasks.length > 0) {
                return doc.data();
            }
        } catch (e) {
            console.error("Error getting work data tracking fallback:", e);
        }
        return Utils.storage.get('backup_work', { tasks: [] });
    },

    // Xóa trắng dữ liệu thiết lập lại từ đầu
    clearAll: async () => {
        try {
            Utils.storage.remove('backup_accounts');
            Utils.storage.remove('backup_finance');
            Utils.storage.remove('backup_work');
            await db.collection("system").doc("accounts").delete();
            await db.collection("finance").doc("main").delete();
            await db.collection("work").doc("main").delete();
            console.log("Database reset");
        } catch (e) {
            console.error("Error clearing data:", e);
        }
    }
};
