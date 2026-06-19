// diagnostic_and_fix_finance.js
const fs = require('fs');
const path = require('path');

// Mock a environment to run logic
const Utils = {
    normalizeUsername: (u) => String(u || '').trim().toLowerCase(),
    ownerKey: (owner) => String(owner || '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase().replace(/[^a-z0-9]/g, ''),
};

async function diagnostic() {
    console.log("--- FINANCE DIAGNOSTIC & RECOVERY ---");
    
    // In a real environment, we'd fetch from Firebase. 
    // Here we will create a script that the user can run in the browser console.
}

/* 
COPY THE BELOW CODE INTO YOUR BROWSER CONSOLE (Ctrl+Shift+I -> Console)
This will check for corrupted data and help us find why the balance is 0đ.
*/
const scriptForConsole = `
(async () => {
    console.log("🔎 Starting Deep Finance Diagnostic...");
    const d = await db.collection("finance").doc("main").get();
    if (!d.exists) {
        console.error("❌ Document 'finance/main' not found!");
        return;
    }
    
    const data = d.data();
    const txs = data.transactions || [];
    console.log("📊 Total transactions in DB:", txs.length);
    
    let nanCount = 0;
    let missingAmountCount = 0;
    let totalSum = 0;
    let corruptedIds = [];

    // Diagnostic
    txs.forEach(t => {
        const amt = parseFloat(t.amount);
        if (isNaN(amt)) {
            nanCount++;
            corruptedIds.push(t.id);
        } else if (t.amount === undefined || t.amount === null) {
            missingAmountCount++;
            corruptedIds.push(t.id);
        } else {
            if (t.type === 'income') totalSum += amt;
            else totalSum -= amt;
        }
    });

    console.log("❌ Corrupted (NaN/Missing):", corruptedIds.length);
    console.log("💰 Valid Total Sum Calculated:", totalSum.toLocaleString() + "đ");

    // Check for 'congty' variants
    const congtyTxs = txs.filter(t => {
        const key = (t.owner || '').trim().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase().replace(/[^a-z0-9]/g, '');
        return key === 'congty';
    });
    console.log("🏢 Transactions owned by 'congty' (all variants):", congtyTxs.length);

    // FIXING DATA
    if (corruptedIds.length > 0) {
        console.log("🔧 Attempting to auto-fix corrupted records...");
        const fixedTxs = txs.map(t => {
            if (corruptedIds.includes(t.id)) {
                return { ...t, amount: parseFloat(t.amount) || 0 };
            }
            return t;
        });
        await db.collection("finance").doc("main").set({ ...data, transactions: fixedTxs });
        console.log("✅ Fixed corrupted records and saved to Firebase.");
    } else {
        console.log("✅ No corruption detected. Checking for logic errors...");
    }

    // SEARCH FOR LOST DATA GAPS
    const dates = txs.map(t => t.date).sort();
    console.log("📅 Date Range:", dates[0], "to", dates[dates.length - 1]);
    
    // Check if user is logged in as 'congty' and what they see
    const currentUser = JSON.parse(localStorage.getItem('tl_current_user') || '{}');
    console.log("👤 Current User logged in as:", currentUser.username);
    
    // Check filterByRole logic
    const matchesUser = (owner, user) => {
        const oKey = (owner || '').trim().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase().replace(/[^a-z0-9]/g, '');
        const uName = (user.username || '').toLowerCase();
        if (oKey === 'congty' && (uName === 'congty' || uName === 'congtyuser')) return true;
        return oKey === uName;
    };
    
    const visibleTxs = txs.filter(t => matchesUser(t.owner, currentUser));
    console.log("👁️ Transactions visible to you:", visibleTxs.length);

})();
`;

console.log("--- CONSOLE SCRIPT GENERATED ---");
console.log(scriptForConsole);
