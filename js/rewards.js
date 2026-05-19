const RewardsModule = {
    _catalog: [
        { id: 'card_wfh', title: 'Làm Việc Tại Nhà', icon: 'fa-house-laptop', cost: 15, color: '#10b981', desc: 'Sử dụng để WFH 1 ngày không bị tính vắng.' },
        { id: 'card_late', title: 'Đi Muộn Miễn Phạt', icon: 'fa-clock', cost: 10, color: '#f59e0b', desc: 'Cứu cánh khi ngủ nướng, miễn phạt 1 lần đi muộn.' },
        { id: 'card_early', title: 'Về Sớm 1 Tiếng', icon: 'fa-person-running', cost: 8, color: '#3b82f6', desc: 'Xin sếp về sớm 1 chút để xử lý việc cá nhân.' },
        { id: 'card_leave', title: 'Nghỉ Phép Thêm 1 Ngày', icon: 'fa-umbrella-beach', cost: 25, color: '#a855f7', desc: 'Có ngay 1 ngày phép hưởng nguyên lương.' },
        { id: 'card_tea', title: 'Trà Chiều Miễn Phí', icon: 'fa-mug-hot', cost: 5, color: '#f43f5e', desc: 'Sếp bao trà sữa / cafe ban chiều.' },
        { id: 'card_mystery', title: 'Quà Bất Ngờ', icon: 'fa-gift', cost: 30, color: '#ffd700', desc: 'Một món quà bí mật và giá trị do sếp chuẩn bị.' }
    ],

    init: () => {
        console.log("RewardsModule Initialized");
    },

    loadData: async () => {
        let rewardsData = [];
        try {
            // Dùng collection "rewards" trong Firebase nếu có DB helper support
            if (typeof DB !== 'undefined' && typeof DB.getRewards === 'function') {
                rewardsData = await DB.getRewards() || [];
            } else {
                rewardsData = JSON.parse(localStorage.getItem('tl_rewards') || '[]');
            }
        } catch (e) {
            console.error("Lỗi tải lịch sử Đổi thưởng:", e);
            rewardsData = JSON.parse(localStorage.getItem('tl_rewards') || '[]');
        }
        return rewardsData;
    },

    saveData: async (data) => {
        try {
            if (typeof DB !== 'undefined' && typeof DB.saveRewards === 'function') {
                await DB.saveRewards(data);
            } else {
                localStorage.setItem('tl_rewards', JSON.stringify(data));
            }
        } catch (e) {
            console.error("Lỗi lưu lịch sử Đổi thưởng:", e);
            localStorage.setItem('tl_rewards', JSON.stringify(data));
        }
    },

    calcUserMerit: async (username) => {
        // Tổng công đức = Tổng điểm earned (từ chấm công) - Tổng điểm used (từ đổi thẻ)
        const allAttendance = await Attendance.loadData();
        const userHistory = allAttendance.filter(r => r.username === username);
        const earned = userHistory.reduce((acc, r) => acc + (r.status === 'on_time' ? 2 : -1), 0);

        const allRewards = await RewardsModule.loadData();
        const userRewards = allRewards.filter(r => r.username === username);
        const used = userRewards.reduce((acc, r) => acc + r.cost, 0);

        return { earned, used, current: earned - used };
    },

    render: async () => {
        const container = document.getElementById('rewards-view');
        if (!container) return;
        
        const currentUser = Auth.currentUser;
        if (!currentUser) return;

        const meritInfo = await RewardsModule.calcUserMerit(currentUser.username);
        const allRewardsHistory = await RewardsModule.loadData();
        
        let customHistoryHtml = '';
        if (currentUser.role === 'admin') {
            const history = allRewardsHistory.sort((a,b) => b.timestamp - a.timestamp).slice(0, 50);
            customHistoryHtml = `
                <div class="glass-panel" style="margin-top: 24px; padding: 20px; border: 1px solid rgba(255,215,0,0.3);">
                    <h3 style="color: #ffd700; margin-bottom: 16px;"><i class="fa-solid fa-list-check"></i> Lịch Sử Đổi Thẻ Của Nhân Sự</h3>
                    <div class="table-responsive">
                        <table class="tl-table">
                            <thead>
                                <tr>
                                    <th>Thời Gian</th>
                                    <th>Nhân Sự</th>
                                    <th>Thẻ Đã Đổi</th>
                                    <th>Điểm</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${history.length === 0 ? '<tr><td colspan="4" style="text-align: center;">Chưa có giao dịch đổi thưởng nào</td></tr>' : history.map(h => `
                                <tr>
                                    <td>${new Date(h.timestamp).toLocaleString('vi-VN')}</td>
                                    <td><strong style="color: var(--primary);">${Utils.getUserDisplayName(h.username) || h.username}</strong></td>
                                    <td style="color: #fff;"><i class="fa-solid ${h.icon}" style="margin-right: 6px; color: ${h.color};"></i>${h.title}</td>
                                    <td style="color: var(--danger); font-weight: bold;">-${h.cost}</td>
                                </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } else {
            const history = allRewardsHistory.filter(r => r.username === currentUser.username).sort((a,b) => b.timestamp - a.timestamp);
            customHistoryHtml = `
                <div class="glass-panel" style="margin-top: 24px; padding: 20px;">
                    <h3 style="color: var(--text-secondary); margin-bottom: 16px;"><i class="fa-solid fa-clock-rotate-left"></i> Lịch Sử Đổi Thẻ Cá Nhân</h3>
                    <div class="table-responsive">
                        <table class="tl-table">
                            <thead>
                                <tr>
                                    <th>Thời Gian</th>
                                    <th>Thẻ Đã Đổi</th>
                                    <th>Điểm Đã Trừ</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${history.length === 0 ? '<tr><td colspan="3" style="text-align: center;">Bạn chưa đổi thẻ nào</td></tr>' : history.map(h => `
                                <tr>
                                    <td>${new Date(h.timestamp).toLocaleString('vi-VN')}</td>
                                    <td style="color: #fff;"><i class="fa-solid ${h.icon}" style="margin-right: 6px; color: ${h.color};"></i>${h.title}</td>
                                    <td style="color: var(--danger); font-weight: bold;">-${h.cost}</td>
                                </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }

        const cardsHtml = RewardsModule._catalog.map(card => `
            <div class="reward-card glass-card" style="padding: 20px; display: flex; flex-direction: column; align-items: center; border: 1px solid rgba(255,255,255,0.1); background: linear-gradient(145deg, rgba(20,20,30,0.8), rgba(5,5,10,0.9)); transition: 0.3s; position: relative; overflow: hidden; ${meritInfo.current >= card.cost ? '' : 'opacity: 0.6; filter: grayscale(0.8);'}" onmouseover="this.style.transform='translateY(-5px)';this.style.borderColor='${card.color}'" onmouseout="this.style.transform='none';this.style.borderColor='rgba(255,255,255,0.1)'">
                <div style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.5); padding: 4px 10px; border-radius: 12px; font-weight: bold; color: #ffd700; font-size: 13px; border: 1px solid rgba(255,215,0,0.3);">
                    <i class="fa-solid fa-star"></i> ${card.cost}
                </div>
                <div style="width: 64px; height: 64px; border-radius: 50%; background: ${card.color}22; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; border: 2px solid ${card.color}88; box-shadow: 0 0 15px ${card.color}44;">
                    <i class="fa-solid ${card.icon}" style="font-size: 28px; color: ${card.color};"></i>
                </div>
                <h4 style="color: #fff; font-size: 16px; margin-bottom: 8px; text-align: center;">${card.title}</h4>
                <p style="color: var(--text-secondary); font-size: 12px; text-align: center; margin-bottom: 20px; flex: 1;">${card.desc}</p>
                <button class="btn" style="width: 100%; background: ${meritInfo.current >= card.cost ? card.color : 'rgba(255,255,255,0.1)'}; color: ${meritInfo.current >= card.cost ? '#fff' : 'rgba(255,255,255,0.3)'}; border: none; font-weight: 600; padding: 10px;" ${meritInfo.current >= card.cost ? `onclick="RewardsModule.redeem('${card.id}')"` : 'disabled'}>
                    ${meritInfo.current >= card.cost ? 'ĐỔI NGAY' : 'CHƯA ĐỦ ĐIỂM'}
                </button>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="rewards-container" style="max-width: 1200px; margin: 0 auto; padding-bottom: 40px;">
                <div class="glass-header" style="display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; margin-bottom: 24px; border-radius: 12px; border: 1px solid rgba(255,215,0,0.2); background: linear-gradient(90deg, rgba(218,165,32,0.1) 0%, rgba(20,20,30,0.8) 100%);">
                    <div>
                        <h2 style="color: #ffd700; margin: 0; font-size: 20px; display: flex; align-items: center; gap: 8px;">
                            <i class="fa-solid fa-gift"></i> TỦ KÍNH ĐẶC QUYỀN
                        </h2>
                        <p style="color: var(--text-secondary); font-size: 13px; margin: 4px 0 0;">Dùng điểm Công Đức để đổi lấy thẻ bài đặc quyền bên dưới</p>
                    </div>
                    <div style="text-align: right; background: rgba(0,0,0,0.3); padding: 10px 20px; border-radius: 8px; border: 1px solid #ffd700; box-shadow: 0 0 15px rgba(255,215,0,0.2);">
                        <div style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 4px;">Công Đức Khả Dụng</div>
                        <div style="font-size: 28px; font-weight: 900; color: #ffd700; line-height: 1;">${meritInfo.current} <i class="fa-solid fa-star" style="font-size: 20px;"></i></div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">
                    ${cardsHtml}
                </div>

                ${customHistoryHtml}
            </div>
        `;
    },

    redeem: async (cardId) => {
        const user = Auth.currentUser;
        if (!user) return;

        const card = RewardsModule._catalog.find(c => c.id === cardId);
        if (!card) return;

        const meritInfo = await RewardsModule.calcUserMerit(user.username);
        if (meritInfo.current < card.cost) {
            Utils.showToast("Bạn không đủ điểm Công Đức để đổi mục này!", "error");
            return;
        }

        const isConfirm = await Utils.showConfirm(
            'Xác nhận đổi thưởng',
            `Bạn sẽ dùng <strong style="color:var(--danger)">${card.cost} Công Đức</strong> để đổi lấy phiếu: <br><br><strong style="color:${card.color}; font-size:18px;"><i class="fa-solid ${card.icon}"></i> ${card.title}</strong>`
        );
        if (!isConfirm) return;

        // Tiến hành lưu
        const newRecord = {
            id: 'reward_' + Date.now(),
            username: user.username,
            timestamp: Date.now(),
            cardId: card.id,
            title: card.title,
            icon: card.icon,
            color: card.color,
            cost: card.cost
        };

        const allRewards = await RewardsModule.loadData();
        allRewards.push(newRecord);
        await RewardsModule.saveData(allRewards);

        Utils.showToast(`Đổi thành công: ${card.title}!`, "success");

        // Gửi Telegram
        const msg = `🎁 <b>[NHÂN SỰ ĐỔI THƯỞNG]</b>\n👤 Nhân viên: <b>${user.username}</b>\n🎴 Đã đổi thẻ: <b>${card.title}</b>\n⭐ Trừ điểm: -${card.cost} Công Đức\n\n👉 Sếp nhớ áp dụng quyền lợi này nhé!`;
        Utils.notifyTelegram(msg);

        // Render lại tab
        RewardsModule.render();
    }
};
