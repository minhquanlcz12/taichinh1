const admin = require('firebase-admin');
const fs = require('fs');

async function checkFinance() {
    // We can't use admin SDK here easily without service account. 
    // I will use a script that I can run in the browser or just assume I can see the content via diagnostic.
}

// I'll create a script that I can run via a fake 'node' command if I had one, 
// but since this is a web app, I'll use the diagnostic tool I created before 
// or create a new one that strictly prints the transactions in order.

const script = `
(async () => {
    const doc = await db.collection("finance").doc("main").get();
    const data = doc.data();
    const txs = data.transactions || [];
    console.log("--- RAW TRANSACTIONS ---");
    txs.sort((a,b) => new Date(a.date) - new Date(b.date)).forEach(t => {
        console.log(\`[\${t.date}] \${t.owner} | \${t.type} | \${t.amount} | \${t.category} | \${t.note}\`);
    });
})();
`;
console.log(script);
