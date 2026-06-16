// .github/scripts/send_report.js
// Script gửi báo cáo tự động tích hợp Email & Telegram chạy từ GitHub Actions

const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const https = require('https');

// 1. Cấu hình & Utility Functions
const normalize = (str) => (str || '').replace(/\s+/g, '').toLowerCase();

// Hỗ trợ định dạng tiền tệ Việt Nam
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
        .format(amount)
        .replace('₫', 'đ');
}

// Hàm gửi tin nhắn qua Telegram Bot
function sendTelegramMessage(token, chatId, text) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify({
            chat_id: chatId,
            text: text,
            parse_mode: 'HTML'
        });

        const options = {
            hostname: 'api.telegram.org',
            port: 443,
            path: `/bot${token}/sendMessage`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(JSON.parse(data));
                } else {
                    reject(new Error(`Telegram API Error: ${data}`));
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(payload);
        req.end();
    });
}

async function run() {
    console.log("Starting periodic report script...");

    // 1. Kiểm tra tài khoản dịch vụ Firebase
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
        console.error("Missing FIREBASE_SERVICE_ACCOUNT environment variable.");
        process.exit(1);
    }

    // 2. Khởi tạo Firebase Admin SDK
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    const db = admin.firestore();

    // 3. Tính toán ngày hiện tại theo giờ Việt Nam (UTC+7)
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    const currentMonthStr = todayStr.substring(0, 7); // YYYY-MM
    console.log(`Current local date: ${todayStr}, Month: ${currentMonthStr}`);

    // 4. Lấy cấu hình hệ thống từ Firestore
    let settings = {};
    try {
        const settingsDoc = await db.collection("system").doc("settings").get();
        if (settingsDoc.exists) {
            settings = settingsDoc.data();
        }
    } catch (e) {
        console.error("Error fetching settings from Firestore:", e);
    }

    // 5. Kiểm tra tần suất và điều kiện gửi báo cáo
    const forceSend = process.env.FORCE_SEND === 'true';
    const reportFrequency = settings.reportFrequency || 'daily';
    const lastReportDate = settings.lastReportDate || '';

    console.log(`Report settings -> Frequency: ${reportFrequency}, Last sent: ${lastReportDate}, Force: ${forceSend}`);

    if (reportFrequency === 'disabled' && !forceSend) {
        console.log("Automated reports are disabled in settings. Exiting.");
        process.exit(0);
    }

    if (lastReportDate === todayStr && !forceSend) {
        console.log("Report for today has already been sent. Exiting.");
        process.exit(0);
    }

    if (lastReportDate && !forceSend) {
        const lastDate = new Date(lastReportDate + 'T00:00:00');
        const today = new Date(todayStr + 'T00:00:00');
        const diffTime = Math.abs(today - lastDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (reportFrequency === 'weekly' && diffDays < 7) {
            console.log(`Weekly report not due yet. Days since last report: ${diffDays} (needs 7). Exiting.`);
            process.exit(0);
        }
        if (reportFrequency === 'monthly' && diffDays < 30) {
            console.log(`Monthly report not due yet. Days since last report: ${diffDays} (needs 30). Exiting.`);
            process.exit(0);
        }
    }

    // 6. Đọc toàn bộ dữ liệu cần thiết từ Firestore
    let accounts = [];
    let transactions = [];
    let attendance = [];
    let leaveRequests = [];
    let tasks = [];

    try {
        const accDoc = await db.collection("system").doc("accounts").get();
        if (accDoc.exists && accDoc.data().data) accounts = accDoc.data().data;

        const finDoc = await db.collection("finance").doc("main").get();
        if (finDoc.exists && finDoc.data().transactions) transactions = finDoc.data().transactions;

        const attDoc = await db.collection("system").doc("attendance").get();
        if (attDoc.exists && attDoc.data().data) attendance = attDoc.data().data;

        const leaveDoc = await db.collection("system").doc("leave_requests").get();
        if (leaveDoc.exists && leaveDoc.data().data) leaveRequests = leaveDoc.data().data;

        const workDoc = await db.collection("work").doc("main").get();
        if (workDoc.exists && workDoc.data().tasks) tasks = workDoc.data().tasks;
    } catch (err) {
        console.error("Error querying collections:", err);
        process.exit(1);
    }

    // 7. Tổng hợp dữ liệu Tài chính
    let incomeToday = 0;
    let expenseToday = 0;
    let incomeMonth = 0;
    let expenseMonth = 0;
    let totalBalance = 0;
    let txsToday = [];

    transactions.forEach(tx => {
        // Chỉ tính các giao dịch thuộc tài khoản CONGTY
        const owner = (tx.owner || '').toLowerCase().trim().replace(/\s/g, '');
        if (owner !== 'congty' && owner !== 'côngty') return;

        const amount = parseFloat(tx.amount) || 0;
        // Tính số dư lũy kế toàn thời gian
        if (tx.type === 'income') {
            totalBalance += amount;
        } else {
            totalBalance -= amount;
        }

        // Lũy kế tháng
        if (tx.date && tx.date.startsWith(currentMonthStr)) {
            if (tx.type === 'income') incomeMonth += amount;
            else expenseMonth += amount;
        }

        // Phát sinh hôm nay
        if (tx.date === todayStr) {
            if (tx.type === 'income') incomeToday += amount;
            else expenseToday += amount;
            txsToday.push(tx);
        }
    });

    const netToday = incomeToday - expenseToday;
    const netMonth = incomeMonth - expenseMonth;

    // 8. Tổng hợp dữ liệu Nhân sự & Chấm công
    // Lọc bỏ tài khoản admin và CONGTY
    const activeStaff = accounts.filter(a => 
        a.role !== 'admin' && 
        a.username.toLowerCase() !== 'admin' && 
        a.username.toLowerCase() !== 'congty'
    );

    let presentMorning = 0;
    let presentAfternoon = 0;
    let lateMorning = 0;
    let lateAfternoon = 0;
    let leaveMorning = 0;
    let leaveAfternoon = 0;
    let absentMorning = 0;
    let absentAfternoon = 0;
    let totalPenaltyToday = 0;
    let attendanceDetails = [];

    activeStaff.forEach(staff => {
        const username = staff.username;
        const displayName = staff.profile?.displayName || username;

        const sUser = normalize(username);
        console.log(`--- Processing staff: ${username} (${displayName}) ---`);

        // Tìm điểm danh ca sáng & chiều (Sử dụng normalize để khớp chính xác username)
        const morningRecord = attendance.find(r => 
            normalize(r.username) === sUser && 
            r.dateStr === todayStr && 
            (r.type === 'morning' || !r.type)
        );

        const afternoonRecord = attendance.find(r => 
            normalize(r.username) === sUser && 
            r.dateStr === todayStr && 
            r.type === 'afternoon'
        );

        if (morningRecord) console.log(`  [MORNING] Found: ${morningRecord.status} at ${morningRecord.time}`);
        else console.log(`  [MORNING] No record found.`);

        if (afternoonRecord) console.log(`  [AFTERNOON] Found: ${afternoonRecord.status} at ${afternoonRecord.time}`);
        else console.log(`  [AFTERNOON] No record found.`);

        // Kiểm tra xem nhân sự có lịch phép hôm nay không
        const hasApprovedLeave = leaveRequests.some(l => {
            if (normalize(l.username) !== sUser || l.status !== 'approved') return false;
            const lDate = l.startDate || l.date || '';
            if (!lDate) return false;
            const start = new Date(lDate + 'T00:00:00');
            const daysCount = parseFloat(l.days) || 1;
            const end = new Date(start.getTime() + (daysCount - 1) * 24 * 60 * 60 * 1000);
            const target = new Date(todayStr + 'T00:00:00');
            return target >= start && target <= end;
        });

        // Xử lý Ca Sáng
        let mStatus = 'Vắng mặt';
        let mPenalty = 0;
        let mClass = 'status-absent';

        if (morningRecord && morningRecord.status !== 'absent_unexcused') {
            presentMorning++; 
            if (morningRecord.status === 'on_time') {
                mStatus = 'Đúng giờ';
                mClass = 'status-on-time';
            } else if (morningRecord.status === 'late_excused') {
                mStatus = 'Muộn (Có phép)';
                mClass = 'status-late-excused';
            } else if (morningRecord.status === 'late') {
                mStatus = `Muộn (${morningRecord.lateMinutes || 0}p)`;
                mClass = 'status-late';
                mPenalty = 20000;
                lateMorning++;
            }
        } else if (hasApprovedLeave) {
            mStatus = 'Nghỉ phép';
            mClass = 'status-leave';
            leaveMorning++;
        } else {
            absentMorning++;
            mPenalty = 50000; // Nghỉ không phép phạt 50k
        }

        // Xử lý Ca Chiều
        let aStatus = 'Vắng mặt';
        let aPenalty = 0;
        let aClass = 'status-absent';

        if (afternoonRecord && afternoonRecord.status !== 'absent_unexcused') {
            presentAfternoon++; 
            if (afternoonRecord.status === 'on_time') {
                aStatus = 'Đúng giờ';
                aClass = 'status-on-time';
            } else if (afternoonRecord.status === 'late_excused') {
                aStatus = 'Muộn (Có phép)';
                aClass = 'status-late-excused';
            } else if (afternoonRecord.status === 'late') {
                aStatus = `Muộn (${afternoonRecord.lateMinutes || 0}p)`;
                aClass = 'status-late';
                aPenalty = 20000;
                lateAfternoon++;
            }
        } else if (hasApprovedLeave) {
            aStatus = 'Nghỉ phép';
            aClass = 'status-leave';
            leaveAfternoon++;
        } else {
            absentAfternoon++;
            aPenalty = 50000; // Nghỉ không phép phạt 50k
        }

        const staffPenalty = mPenalty + aPenalty;
        totalPenaltyToday += staffPenalty;

        attendanceDetails.push({
            username,
            displayName,
            morning: { status: mStatus, penalty: mPenalty, class: mClass },
            afternoon: { status: aStatus, penalty: aPenalty, class: aClass },
            totalPenalty: staffPenalty
        });
    });

    // 9. Tổng hợp Tiến độ Task
    let doneTodayCount = 0;
    let expiredTasks = [];
    const todayTime = new Date(todayStr + 'T00:00:00').getTime();

    tasks.forEach(t => {
        const st = (t.trangThai || 'planned').toLowerCase();
        let dTime = 0;
        if (t.deadline) {
            if (t.deadline.includes('-')) {
                dTime = new Date(t.deadline).getTime();
            } else if (t.deadline.includes('/')) {
                const p = t.deadline.split('/');
                if (p.length === 3) dTime = new Date(`${p[2]}-${p[1]}-${p[0]}T00:00:00`).getTime();
            }
        }

        // Hoàn thành hôm nay
        if (st.includes('done') || st.includes('hoàn thành')) {
            if (dTime === todayTime) {
                doneTodayCount++;
            }
        } else if (t.deadline && dTime && dTime < todayTime) {
            // Quá hạn
            expiredTasks.push({
                project: t.project || 'Chung',
                title: t.tieuDe || t.mucTieu || 'Không tiêu đề',
                owner: t.owner || 'Không rõ',
                deadline: t.deadline
            });
        }
    });

    // 10. Gửi báo cáo Telegram
    const tgToken = settings.tgToken;
    const tgChatId = settings.tgChatId;

    if (tgToken && tgChatId) {
        console.log("Building Telegram Message...");
        let tgMsg = `📊 <b>BÁO CÁO TỔNG HỢP NGÀY ${todayStr.split('-').reverse().join('/')}</b>\n\n`;

        tgMsg += `💰 <b>TÀI CHÍNH HÔM NAY:</b>\n`;
        tgMsg += `+ Tổng Thu: <b>${formatCurrency(incomeToday)}</b>\n`;
        tgMsg += `- Tổng Chi: <b>${formatCurrency(expenseToday)}</b>\n`;
        tgMsg += `⚖️ Biến động: <b>${formatCurrency(netToday)}</b>\n`;
        tgMsg += `🏦 Số dư công ty: <b>${formatCurrency(totalBalance)}</b>\n\n`;

        tgMsg += `👥 <b>NHÂN SỰ & CHẤM CÔNG:</b>\n`;
        tgMsg += `✅ Ca Sáng: Đúng giờ/Phép: <b>${presentMorning}</b> | Muộn: <b>${lateMorning}</b> | Vắng: <b>${absentMorning}</b>\n`;
        tgMsg += `⏱️ Ca Chiều: Đúng giờ/Phép: <b>${presentAfternoon}</b> | Muộn: <b>${lateAfternoon}</b> | Vắng: <b>${absentAfternoon}</b>\n`;
        if (totalPenaltyToday > 0) {
            tgMsg += `💸 <b>Tổng phạt chấm công phát sinh:</b> <b>-${formatCurrency(totalPenaltyToday)}</b>\n`;
            
            const lateStaff = attendanceDetails.filter(d => d.totalPenalty > 0);
            lateStaff.forEach(s => {
                tgMsg += `  - <b>${s.displayName}</b>: -${formatCurrency(s.totalPenalty)}\n`;
            });
        } else {
            tgMsg += `🎉 Hôm nay không phát sinh phạt chấm công!\n`;
        }
        tgMsg += `\n`;

        tgMsg += `📝 <b>TIẾN ĐỘ CÔNG VIỆC:</b>\n`;
        tgMsg += `✅ Task hoàn thành hôm nay: <b>${doneTodayCount}</b>\n`;
        if (expiredTasks.length > 0) {
            tgMsg += `❌ Task đang trễ hạn (${expiredTasks.length}):\n`;
            expiredTasks.slice(0, 5).forEach(t => {
                tgMsg += `  - [${t.project}] ${t.title} (@${t.owner})\n`;
            });
            if (expiredTasks.length > 5) {
                tgMsg += `  ... và ${expiredTasks.length - 5} task khác (Xem trên web).\n`;
            }
        } else {
            tgMsg += `🎉 Không có công việc nào bị quá hạn tồn đọng!\n`;
        }

        try {
            console.log("Sending to Telegram group:", tgChatId);
            const result = await sendTelegramMessage(tgToken, tgChatId, tgMsg);
            console.log("Telegram notification response:", result);
        } catch (err) {
            console.error("CRITICAL ERROR sending Telegram message:", err.message);
            if (err.response) {
                console.error("Telegram API Error Data:", err.response.data);
            }
        }
    } else {
        console.log("Telegram Token or Chat ID not configured in database. Skipping Telegram notification.");
    }

    // 11. Gửi báo cáo Email HTML
    let emailRecipients = settings.reportEmails ? settings.reportEmails.split(/[,\n\r]+/).map(e => e.trim()).filter(Boolean) : [];
    if (emailRecipients.length === 0 && process.env.REPORT_RECIPIENT) {
        emailRecipients = process.env.REPORT_RECIPIENT.split(/[,\n\r]+/).map(e => e.trim()).filter(Boolean);
    }
    if (emailRecipients.length === 0 && process.env.EMAIL_USER) {
        emailRecipients = [process.env.EMAIL_USER];
    }

    if (emailRecipients.length > 0 && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        console.log(`Sending email report to: ${emailRecipients.join(', ')}`);

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true, // true for port 465
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Xây dựng email HTML đẹp mắt
        const formattedDate = todayStr.split('-').reverse().join('/');
        const netTodayColor = netToday >= 0 ? '#10b981' : '#ef4444';
        const netMonthColor = netMonth >= 0 ? '#10b981' : '#ef4444';

        let transactionsHtml = txsToday.length === 0 
            ? '<tr><td colspan="4" style="text-align:center; color:#64748b; font-style:italic; padding:15px;">Hôm nay không phát sinh giao dịch tài chính nào.</td></tr>'
            : txsToday.map(tx => `
                <tr>
                    <td style="padding:10px; border-bottom:1px solid #e2e8f0; font-weight:500;">${tx.category || 'Khác'}</td>
                    <td style="padding:10px; border-bottom:1px solid #e2e8f0; color: ${tx.type === 'income' ? '#10b981' : '#ef4444'}; font-weight:bold;">
                        ${tx.type === 'income' ? '+' : '-'}${formatCurrency(tx.amount)}
                    </td>
                    <td style="padding:10px; border-bottom:1px solid #e2e8f0; color:#475569; font-size:13px;">${tx.note || '---'}</td>
                    <td style="padding:10px; border-bottom:1px solid #e2e8f0; color:#64748b; font-size:12px;">@${tx.owner || 'admin'}</td>
                </tr>
            `).join('');

        let attendanceHtml = attendanceDetails.map(staff => `
            <tr>
                <td style="padding:12px 10px; border-bottom:1px solid #e2e8f0; font-weight:bold; color:#1e293b;">${staff.displayName}</td>
                <td style="padding:12px 10px; border-bottom:1px solid #e2e8f0;">
                    <span class="${staff.morning.class}" style="padding:4px 8px; border-radius:4px; font-size:12px; font-weight:bold;">
                        ${staff.morning.status}
                    </span>
                </td>
                <td style="padding:12px 10px; border-bottom:1px solid #e2e8f0;">
                    <span class="${staff.afternoon.class}" style="padding:4px 8px; border-radius:4px; font-size:12px; font-weight:bold;">
                        ${staff.afternoon.status}
                    </span>
                </td>
                <td style="padding:12px 10px; border-bottom:1px solid #e2e8f0; text-align:right; font-weight:bold; color:${staff.totalPenalty > 0 ? '#ef4444' : '#64748b'};">
                    ${staff.totalPenalty > 0 ? `-${formatCurrency(staff.totalPenalty)}` : '0đ'}
                </td>
            </tr>
        `).join('');

        let expiredTasksHtml = expiredTasks.length === 0
            ? '<div style="color:#10b981; font-weight:bold; padding:10px; background:#f0fdf4; border-radius:6px; border:1px solid #bbf7d0;">🎉 Tuyệt vời! Không có công việc nào bị quá hạn tồn đọng!</div>'
            : `<table style="width:100%; border-collapse:collapse; background:#fffdfd; border:1px solid #fee2e2; border-radius:6px; overflow:hidden;">
                <thead>
                    <tr style="background:#fef2f2; text-align:left; color:#991b1b; font-size:13px;">
                        <th style="padding:10px;">Dự án</th>
                        <th style="padding:10px;">Công việc</th>
                        <th style="padding:10px;">Phụ trách</th>
                        <th style="padding:10px; text-align:right;">Hạn chót</th>
                    </tr>
                </thead>
                <tbody>
                    ${expiredTasks.map(t => `
                        <tr style="color:#7f1d1d; font-size:13px; border-bottom:1px solid #fee2e2;">
                            <td style="padding:10px; font-weight:bold;">${t.project}</td>
                            <td style="padding:10px;">${t.title}</td>
                            <td style="padding:10px; font-style:italic;">@${t.owner}</td>
                            <td style="padding:10px; text-align:right; font-weight:bold; color:#ef4444;">${t.deadline}</td>
                        </tr>
                    `).join('')}
                </tbody>
               </table>`;

        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Báo Cáo Tổng Hợp</title>
            <style>
                body {
                    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                    background-color: #f1f5f9;
                    margin: 0;
                    padding: 20px;
                    color: #334155;
                }
                .container {
                    max-width: 700px;
                    background-color: #ffffff;
                    margin: 0 auto;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
                    overflow: hidden;
                    border: 1px solid #e2e8f0;
                }
                .header {
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                    padding: 30px;
                    text-align: center;
                    color: #ffffff;
                }
                .header h1 {
                    margin: 0;
                    font-size: 24px;
                    font-weight: 800;
                    letter-spacing: 1px;
                }
                .header p {
                    margin: 5px 0 0 0;
                    color: #94a3b8;
                    font-size: 14px;
                }
                .content {
                    padding: 30px;
                }
                .section-title {
                    font-size: 16px;
                    font-weight: 800;
                    color: #0f172a;
                    text-transform: uppercase;
                    border-bottom: 2px solid #e2e8f0;
                    padding-bottom: 8px;
                    margin-top: 30px;
                    margin-bottom: 15px;
                    letter-spacing: 0.5px;
                }
                .cards-grid {
                    display: table;
                    width: 100%;
                    table-layout: fixed;
                    margin-bottom: 25px;
                }
                .card-cell {
                    display: table-cell;
                    padding: 5px;
                }
                .card {
                    background-color: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 15px;
                    text-align: center;
                }
                .card-label {
                    font-size: 11px;
                    color: #64748b;
                    text-transform: uppercase;
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                .card-value {
                    font-size: 16px;
                    font-weight: 800;
                    color: #0f172a;
                }
                .status-on-time { background-color: #dcfce7; color: #15803d; }
                .status-late { background-color: #fee2e2; color: #b91c1c; }
                .status-late-excused { background-color: #fef3c7; color: #d97706; }
                .status-leave { background-color: #e0f2fe; color: #0369a1; }
                .status-absent { background-color: #f1f5f9; color: #64748b; border: 1px dashed #cbd5e1; }
                
                table.data-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                }
                table.data-table th {
                    background-color: #f8fafc;
                    color: #475569;
                    font-weight: bold;
                    text-align: left;
                    padding: 10px;
                    border-bottom: 2px solid #cbd5e1;
                    font-size: 13px;
                }
                table.data-table td {
                    padding: 10px;
                    border-bottom: 1px solid #e2e8f0;
                    font-size: 13px;
                }
                .footer {
                    background-color: #f8fafc;
                    padding: 20px;
                    text-align: center;
                    font-size: 12px;
                    color: #64748b;
                    border-top: 1px solid #e2e8f0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>THANH LONG WORK</h1>
                    <p>BÁO CÁO HOẠT ĐỘNG NGÀY ${formattedDate}</p>
                </div>
                <div class="content">
                    
                    <div class="section-title">📊 Tài Chính Hôm Nay</div>
                    <div class="cards-grid">
                        <div class="card-cell">
                            <div class="card">
                                <div class="card-label">Tổng Thu</div>
                                <div class="card-value" style="color:#10b981;">+${formatCurrency(incomeToday)}</div>
                            </div>
                        </div>
                        <div class="card-cell">
                            <div class="card">
                                <div class="card-label">Tổng Chi</div>
                                <div class="card-value" style="color:#ef4444;">-${formatCurrency(expenseToday)}</div>
                            </div>
                        </div>
                        <div class="card-cell">
                            <div class="card">
                                <div class="card-label">Biến Động</div>
                                <div class="card-value" style="color:${netTodayColor};">${netToday >= 0 ? '+' : ''}${formatCurrency(netToday)}</div>
                            </div>
                        </div>
                        <div class="card-cell">
                            <div class="card">
                                <div class="card-label">Quỹ Công Ty</div>
                                <div class="card-value" style="color:#0f172a;">${formatCurrency(totalBalance)}</div>
                            </div>
                        </div>
                    </div>

                    <div class="cards-grid" style="margin-top:-15px;">
                        <div class="card-cell" style="width:50%;">
                            <div class="card" style="padding:10px 15px; text-align:left;">
                                <span style="font-size:12px; color:#64748b;">Thu lũy kế tháng:</span>
                                <strong style="float:right; color:#10b981;">+${formatCurrency(incomeMonth)}</strong>
                            </div>
                        </div>
                        <div class="card-cell" style="width:50%;">
                            <div class="card" style="padding:10px 15px; text-align:left;">
                                <span style="font-size:12px; color:#64748b;">Chi lũy kế tháng:</span>
                                <strong style="float:right; color:#ef4444;">-${formatCurrency(expenseMonth)}</strong>
                            </div>
                        </div>
                    </div>

                    <h3 style="font-size:14px; margin-top:20px; color:#475569;">Giao dịch phát sinh ngày ${formattedDate}:</h3>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Hạng mục</th>
                                <th>Số tiền</th>
                                <th>Ghi chú</th>
                                <th>Người tạo</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${transactionsHtml}
                        </tbody>
                    </table>

                    <div class="section-title">👥 Nhân Sự & Chấm Công</div>
                    <div class="cards-grid">
                        <div class="card-cell" style="width: 33.3%;">
                            <div class="card" style="background:#ecfdf5; border-color:#a7f3d0;">
                                <div class="card-label" style="color:#065f46;">Mặt ca Sáng</div>
                                <div class="card-value" style="color:#047857;">${presentMorning}/${activeStaff.length}</div>
                            </div>
                        </div>
                        <div class="card-cell" style="width: 33.3%;">
                            <div class="card" style="background:#fffbeb; border-color:#fde68a;">
                                <div class="card-label" style="color:#92400e;">Mặt ca Chiều</div>
                                <div class="card-value" style="color:#b45309;">${presentAfternoon}/${activeStaff.length}</div>
                            </div>
                        </div>
                        <div class="card-cell" style="width: 33.3%;">
                            <div class="card" style="background:#fef2f2; border-color:#fca5a5;">
                                <div class="card-label" style="color:#991b1b;">Tổng Phạt VP</div>
                                <div class="card-value" style="color:#b91c1c;">-${formatCurrency(totalPenaltyToday)}</div>
                            </div>
                        </div>
                    </div>

                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Nhân sự</th>
                                <th>Ca Sáng (08:30)</th>
                                <th>Ca Chiều (14:00)</th>
                                <th style="text-align:right;">Phạt muộn</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${attendanceHtml}
                        </tbody>
                    </table>

                    <div class="section-title">📝 Tiến Độ Công Việc (Task)</div>
                    <div style="margin-bottom:15px; font-size:14px; font-weight:bold; color:#475569;">
                        Số công việc hoàn thành hôm nay: <span style="color:#10b981; font-size:16px;">${doneTodayCount}</span>
                    </div>
                    
                    <h3 style="font-size:14px; margin-top:20px; color:#991b1b;">Công việc quá hạn chưa hoàn thành (${expiredTasks.length}):</h3>
                    ${expiredTasksHtml}

                </div>
                <div class="footer">
                    <p>Báo cáo tự động được gửi từ hệ thống <strong>Thanh Long Work</strong>.</p>
                    <p style="font-size:11px; margin-top:5px; color:#94a3b8;">Tần suất gửi: ${reportFrequency === 'daily' ? 'Hàng ngày' : reportFrequency === 'weekly' ? 'Hàng tuần (7 ngày)' : reportFrequency === 'monthly' ? 'Hàng tháng (30 ngày)' : 'Thử nghiệm'}</p>
                </div>
            </div>
        </body>
        </html>
        `;

        try {
            await transporter.sendMail({
                from: `"Thanh Long Work" <${process.env.EMAIL_USER}>`,
                to: emailRecipients.join(', '),
                subject: `[Thanh Long Work] Báo cáo tổng hợp ngày ${formattedDate}`,
                html: htmlContent
            });
            console.log("Email report sent successfully.");
        } catch (err) {
            console.error("Error sending Email:", err.message);
        }
    } else {
        console.log("Email SMTP credentials not configured. Skipping email report.");
    }

    // 12. Ghi nhận ngày gửi báo cáo thành công lên Firestore settings
    try {
        await db.collection("system").doc("settings").set({
            lastReportDate: todayStr
        }, { merge: true });
        console.log(`Updated lastReportDate to ${todayStr} in Firestore settings.`);
    } catch (e) {
        console.error("Failed to update lastReportDate in Firestore:", e);
    }

    console.log("Report process finished successfully.");
    process.exit(0);
}

run().catch(err => {
    console.error("Critical error in report script:", err);
    process.exit(1);
});
