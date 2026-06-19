
// Check finance data for 'congty' or 'CONGTY'
(async () => {
    try {
        const data = await DB.getFinanceData();
        const txs = data.transactions || [];
        const congtyTxs = txs.filter(t => (t.owner || '').toLowerCase().includes('congty'));
        console.log('Total transactions:', txs.length);
        console.log('Congty transactions found:', congtyTxs.length);
        console.log('Sample Congty transactions:', JSON.stringify(congtyTxs.slice(-3), null, 2));
        
        const accounts = await DB.getAccounts();
        const congtyAcc = accounts.find(a => a.username.toLowerCase() === 'congty');
        console.log('Congty account info:', JSON.stringify(congtyAcc, null, 2));
    } catch (e) {
        console.error(e);
    }
})();
