
// Diagnostic script to check finance data
(async () => {
    try {
        const doc = await db.collection("finance").doc("main").get();
        if (doc.exists) {
            const data = doc.data();
            const txs = data.transactions || [];
            console.log('Total transactions in DB:', txs.length);
            
            const owners = [...new Set(txs.map(t => t.owner))];
            console.log('Owners present:', owners);
            
            const congtyTxs = txs.filter(t => {
                const key = String(t.owner || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                return key === 'congty';
            });
            console.log('Total "congty" transactions found (any casing):', congtyTxs.length);
            
            if (congtyTxs.length > 0) {
                console.log('Sample congty transaction:', congtyTxs[0]);
            }
            
            // Check if there are any transactions from BEFORE this month
            const months = [...new Set(txs.map(t => t.date.slice(0, 7)))];
            console.log('Months present in data:', months);
            
        } else {
            console.log('Document finance/main does not exist!');
        }
    } catch (e) {
        console.error(e);
    }
})();
