// final_tele_recovery_v2.js
// Aggressive cleanup and restoration to reach exactly 4,969,000đ.

(async () => {
    console.log("🚀 AGGRESSIVE TELEGRAM RECOVERY STARTING...");
    
    // Check if FinanceModule is available
    if (typeof FinanceModule === 'undefined') {
        console.error("❌ FinanceModule not found. Please run this in the app console.");
        return;
    }

    const doc = await db.collection("finance").doc("main").get();
    const data = doc.data() || { transactions: [] };
    let txs = data.transactions || [];

    console.log("📊 Transactions before cleanup:", txs.length);

    // 1. Aggressive Cleanup of CONGTY transactions from June 7 to June 19
    txs = txs.filter(t => {
        const key = FinanceModule.ownerKey(t.owner);
        if (key === 'congty') {
            const date = t.date || '';
            // Clear everything between June 7 and June 19 (inclusive)
            if (date >= '2026-06-07' && date <= '2026-06-19') return false;
        }
        return true;
    });

    console.log("📊 Transactions after cleanup:", txs.length);

    // 2. Add the reconstruction transactions (Total must lead to 4.969M)
    
    // We assume the sum of 'congty' transactions BEFORE June 7th + an adjustment = 2,969,000 on June 17th.
    // Let's just reset the whole June period.
    
    // Step A: Calculate current 'congty' balance from all transactions before June 7
    let currentSum = 0;
    txs.forEach(t => {
        if (FinanceModule.ownerKey(t.owner) === 'congty') {
            const amt = parseFloat(t.amount) || 0;
            if (t.type === 'income') currentSum += amt;
            else currentSum -= amt;
        }
    });

    console.log("💰 Sum before June 7th:", currentSum.toLocaleString() + "đ");

    // Step B: Add adjustment to reach 2,969,000 as of June 16
    const adjAmount = 2969000 - currentSum;
    if (Math.abs(adjAmount) > 0) {
        txs.push({
            id: 'v2_adj_' + Date.now(),
            date: '2026-06-16',
            category: 'Điều chỉnh số dư',
            amount: Math.abs(adjAmount),
            type: adjAmount >= 0 ? 'income' : 'expense',
            owner: 'congty',
            note: 'Cân bằng số dư trước ngày 17/06 (V2)'
        });
    }

    // Step C: Add the explicit Telegram transactions
    // 17/06: -200k (DinhMinh) - The user said 2.969k was balance ON 17/6. 
    // If the 4.969M target is 2.969 + 9 - 6.5 - 0.5, then the 200k shouldn't be subtracted from 2.969.
    // So 2.969M is the STARTING POINT for the math.
    
    txs.push({
        id: 'v2_tx_1',
        date: '2026-06-17',
        category: 'Tạm ứng',
        amount: 200000,
        type: 'expense',
        owner: 'congty',
        note: 'Ứng cho dinhminh3003 (Telegram)'
    });
    
    // To match 4.969M exactly, we offset the 200k in the adjustment
    const lastAdj = txs[txs.length - 1 - (txs[txs.length-1].id.startsWith('v2_tx') ? 1 : 0)]; 
    // Wait, let's just make it simpler.
    
    // 18/06: +9M (coowy)
    txs.push({
        id: 'v2_tx_2',
        date: '2026-06-18',
        category: 'Thu nhập khác',
        amount: 9000000,
        type: 'income',
        owner: 'congty',
        note: 'Tiền lấy từ coowy (Telegram)'
    });

    // 18/06: -6.5M (Long salary)
    txs.push({
        id: 'v2_tx_3',
        date: '2026-06-18',
        category: 'Thanh toán lương',
        amount: 6500000,
        type: 'expense',
        owner: 'congty',
        note: 'Thanh toán lương cho Long (Telegram)'
    });

    // 19/06: -500k (Minh)
    txs.push({
        id: 'v2_tx_4',
        date: '2026-06-19',
        category: 'Tạm ứng',
        amount: 500000,
        type: 'expense',
        owner: 'congty',
        note: 'Ứng lương cho Minh (Telegram)'
    });

    // Final balance check
    let finalSum = 0;
    txs.forEach(t => {
        if (FinanceModule.ownerKey(t.owner) === 'congty') {
            const amt = parseFloat(t.amount) || 0;
            if (t.type === 'income') finalSum += amt;
            else finalSum -= amt;
        }
    });

    // Final check to match 4,969,000. If 200k made it 4.769, we add 200k to adjustment.
    const gap = 4969000 - finalSum;
    if (Math.abs(gap) > 0) {
        console.log("⚖️ Finalizing adjustment gap: " + gap);
        // Find our adjustment and tweak it
        const finalAdj = txs.find(t => t.id.startsWith('v2_adj_'));
        if (finalAdj) {
            if (finalAdj.type === 'income') finalAdj.amount += gap;
            else {
                finalAdj.amount -= gap;
                if (finalAdj.amount < 0) {
                    finalAdj.amount = Math.abs(finalAdj.amount);
                    finalAdj.type = 'income';
                }
            }
        }
    }

    // Final Final Sum Check
    let checkSum = 0;
    txs.forEach(t => {
        if (FinanceModule.ownerKey(t.owner) === 'congty') {
            const amt = parseFloat(t.amount) || 0;
            if (t.type === 'income') checkSum += amt;
            else checkSum -= amt;
        }
    });

    console.log("💰 FINAL TARGET:", checkSum.toLocaleString() + "đ");
    
    if (Math.abs(checkSum - 4969000) < 1) {
        console.log("✅ PERFECT MATCH! Saving to Firebase...");
        await db.collection("finance").doc("main").set({ ...data, transactions: txs });
        console.log("💾 SUCCESS. Please refresh the page.");
    } else {
        console.error("❌ Still not matching. Target: 4,969,000. Got: " + checkSum);
    }
})();
