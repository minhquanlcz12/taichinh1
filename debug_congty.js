
// Check congty account role and transactions
(async () => {
    try {
        const accounts = await DB.getAccounts();
        const congty = accounts.find(a => (a.username || '').toLowerCase() === 'congty');
        console.log('Congty account:', JSON.stringify(congty, null, 2));
        
        const finance = await DB.getFinanceData();
        const txs = finance.transactions || [];
        const owners = [...new Set(txs.map(t => t.owner))];
        console.log('Unique owners in transactions:', owners);
        
        const congtyTxs = txs.filter(t => (t.owner || '').toLowerCase() === 'congty');
        console.log('Total congty transactions:', congtyTxs.length);
    } catch (e) {
        console.error(e);
    }
})();
