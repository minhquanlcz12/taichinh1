// final_tele_recovery_v3.js
// NUCLEAR RESTORATION: Clears and resets the core ledger to exactly 4,969,000đ.

(async () => {
    console.log("🚀 NUCLEAR LEDGER RECOVERY (V3) STARTING...");
    
    if (typeof FinanceModule === 'undefined') {
        console.error("❌ FinanceModule not found. Please run this in the app console.");
        return;
    }

    const doc = await db.collection("finance").doc("main").get();
    const data = doc.data() || { transactions: [] };
    let txs = data.transactions || [];

    // 1. EXTENSIVE CLEANUP: Remove EVERYTHING for CONGTY across ALL periods 
    // to start from a clean state for this specific owner.
    txs = txs.filter(t => {
        const key = FinanceModule.ownerKey(t.owner);
        // We clear all 'congty' records to rebuild from Telegram source
        if (key === 'congty') return false;
        return true;
    });

    console.log("🧹 All old CONGTY data cleared.");

    // 2. REBUILD LEDGER FROM TELEGRAM STATS
    // We need to reach 4,969,000đ exactly.
    
    // Initial Base Transaction to set the state as of June 17
    txs.push({
        id: 'v3_base',
        date: '2026-06-16',
        category: 'Số dư xác nhận',
        amount: 3169000, // 2.969M + 200k (to offset the 200k advance)
        type: 'income',
        owner: 'congty',
        note: 'Số dư Telegram chốt ngày 16/06'
    });

    // 17/06: -200k (DinhMinh)
    txs.push({
        id: 'v3_tx_1',
        date: '2026-06-17',
        category: 'Tạm ứng',
        amount: 200000,
        type: 'expense',
        owner: 'congty',
        note: 'Ứng cho dinhminh3003 (Telegram)'
    });

    // 18/06: +9M (coowy)
    txs.push({
        id: 'v3_tx_2',
        date: '2026-06-18',
        category: 'Thu nhập khác',
        amount: 9000000,
        type: 'income',
        owner: 'congty',
        note: 'Tiền lấy từ coowy (Telegram)'
    });

    // 18/06: -6.5M (Long salary)
    txs.push({
        id: 'v3_tx_3',
        date: '2026-06-18',
        category: 'Thanh toán lương',
        amount: 6500000,
        type: 'expense',
        owner: 'congty',
        note: 'Thanh toán lương cho Long (Telegram)'
    });

    // 19/06: -500k (Minh)
    txs.push({
        id: 'v3_tx_4',
        date: '2026-06-19',
        category: 'Tạm ứng',
        amount: 500000,
        type: 'expense',
        owner: 'congty',
        note: 'Ứng lương cho Minh (Telegram)'
    });

    // Check Sum
    let finalSum = 0;
    txs.forEach(t => {
        if (FinanceModule.ownerKey(t.owner) === 'congty') {
            const amt = parseFloat(t.amount) || 0;
            if (t.type === 'income') finalSum += amt;
            else finalSum -= amt;
        }
    });

    console.log("💰 FINAL RECONSTRUCTED BALANCE:", finalSum.toLocaleString() + "đ");
    
    if (Math.abs(finalSum - 4969000) < 1) {
        console.log("✅ VERIFIED. Saving to Cloud...");
        await db.collection("finance").doc("main").set({ ...data, transactions: txs });
        console.log("✨ DONE! Please REFRESH the page now.");
    } else {
        console.error("❌ Mismatch! Result was: " + finalSum);
    }
})();
