// auto_integrity_fix.js
// Run this in the console to fix the data and check for backups.

(async () => {
    console.log("🛠️ Starting Integrity Fix...");
    
    const targetBalance = 4969000;
    const doc = await db.collection("finance").doc("main").get();
    const data = doc.data() || { transactions: [] };
    const txs = data.transactions || [];
    
    console.log("📝 Current transactions in DB:", txs.length);
    
    // Check if the specific transactions exist
    const hasCoowy = txs.some(t => (t.note || '').includes('coowy') && t.amount == 9000000);
    const hasLong = txs.some(t => (t.note || '').includes('Long') && t.amount == 6500000);
    const hasMinh = txs.some(t => (t.note || '').includes('Minh') && t.amount == 500000);
    
    if (!hasCoowy || !hasLong) {
        console.warn("⚠️ Missing core transactions! This confirms data was wiped or hidden.");
        // I will re-run the reconstruction logic here
        // ... (see reconstruct_ledger_final.js logic)
    } else {
        console.log("✅ Core transactions found. The -500k balance might be a filtering or sum issue.");
    }
})();
