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
        // RESET DATE 20/05/2026: Tặng 1 điểm mốc khởi đầu, không tính các lỗi đi muộn trước đó.
        const RESET_DATE = '2026-05-20';
        const allAttendance = await Attendance.loadData();
        // Lọc những bản ghi từ sau ngày Reset
        const userHistory = allAttendance.filter(r => r.username === username && r.dateStr >= RESET_DATE);
        
        // Công thức mới: Tặng sẵn 1 điểm + công đức kiếm được
        const earned = 1 + userHistory.reduce((acc, r) => acc + (r.status === 'on_time' ? 1 : -1), 0);

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

        const cardsHtml = RewardsModule._catalog.map(card => {
            const isAffordable = meritInfo.current >= card.cost;
            return `
            <div class="tcg-digital-card ${!isAffordable ? 'locked' : ''}" style="--card-color: ${card.color};" onclick="${isAffordable ? `RewardsModule.redeem('${card.id}')` : ''}">
                <div class="tcg-card-inner">
                    <div class="tcg-card-cost">
                        <i class="fa-solid fa-star"></i> ${card.cost}
                    </div>
                    
                    <div class="tcg-card-art">
                        <i class="fa-solid ${card.icon}"></i>
                        <div class="tcg-art-overlay"></div>
                    </div>
                    
                    <div class="tcg-card-body">
                        <div class="tcg-card-type"><i class="fa-solid fa-microchip"></i> ĐẶC QUYỀN SỐ</div>
                        <div class="tcg-card-title">${card.title}</div>
                        <p class="tcg-card-desc">${card.desc}</p>
                    </div>

                    <div class="tcg-card-footer">
                        ${isAffordable ? '<span class="status-ready"><i class="fa-solid fa-bolt"></i> NHẤP ĐỂ ĐỔI</span>' : '<span class="status-locked"><i class="fa-solid fa-lock"></i> THIẾU ĐIỂM</span>'}
                    </div>
                </div>
            </div>
            `;
        }).join('');

        container.innerHTML = `
            <style>
            .tcg-digital-card {
                position: relative;
                width: 100%;
                aspect-ratio: 2.2 / 3.3; /* Tỉ lệ thẻ bài truyền thống */
                max-width: 280px;
                margin: 0 auto;
                border-radius: 12px;
                background: linear-gradient(135deg, rgba(20,20,30,0.95), rgba(5,5,10,0.98));
                border: 2px solid var(--card-color);
                box-shadow: 0 0 15px rgba(0,0,0,0.8), inset 0 0 20px rgba(0,0,0,0.5);
                padding: 6px;
                cursor: pointer;
                transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                overflow: hidden;
            }

            .tcg-digital-card:hover {
                transform: translateY(-10px) scale(1.05);
                box-shadow: 0 20px 40px rgba(0,0,0,0.9), 0 0 30px var(--card-color);
                z-index: 10;
            }

            .tcg-digital-card::before {
                content: '';
                position: absolute;
                top: -50%; left: -50%;
                width: 200%; height: 200%;
                background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
                transform: rotate(45deg);
                animation: cardShine 3s infinite linear;
                pointer-events: none;
                z-index: 3;
                opacity: 0;
                transition: opacity 0.3s;
            }
            .tcg-digital-card:hover::before { opacity: 1; }

            @keyframes cardShine {
                0% { transform: translateY(-100%) rotate(45deg); }
                100% { transform: translateY(100%) rotate(45deg); }
            }

            .tcg-digital-card.locked {
                filter: grayscale(1) opacity(0.6);
                cursor: not-allowed;
                border-color: rgba(255,255,255,0.1) !important;
                box-shadow: inset 0 0 20px rgba(0,0,0,0.8) !important;
            }
            .tcg-digital-card.locked:hover {
                transform: none;
                box-shadow: inset 0 0 20px rgba(0,0,0,0.8) !important;
            }
            .tcg-digital-card.locked::before { display: none; }

            .tcg-card-inner {
                border: 1px solid rgba(255,255,255,0.1);
                height: 100%;
                border-radius: 8px;
                display: flex;
                flex-direction: column;
                background: url('data:image/svg+xml;utf8,<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h20v20H0z" fill="none"/><path d="M10 0v20M0 10h20" stroke="rgba(255,255,255,0.02)" stroke-width="1"/></svg>') repeat;
                position: relative;
            }

            .tcg-card-cost {
                position: absolute;
                top: 0;
                right: 12px;
                background: linear-gradient(to bottom, var(--card-color), #333);
                color: #fff;
                padding: 6px 14px;
                font-weight: 900;
                font-size: 18px;
                border-bottom-left-radius: 12px;
                border-bottom-right-radius: 12px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.6);
                text-shadow: 1px 1px 2px rgba(0,0,0,1);
                z-index: 2;
                border: 1px solid rgba(255,255,255,0.3);
                border-top: none;
            }

            .tcg-card-art {
                height: 42%;
                margin: 10px;
                background: radial-gradient(circle at center, var(--card-color) 0%, rgba(0,0,0,1) 100%);
                border-radius: 6px;
                display: flex;
                justify-content: center;
                align-items: center;
                position: relative;
                border: 2px solid rgba(255,255,255,0.1);
                overflow: hidden;
                box-shadow: inset 0 0 20px rgba(0,0,0,0.8);
            }

            .tcg-card-art i {
                font-size: 65px;
                color: #fff;
                text-shadow: 0 0 25px var(--card-color), 0 0 10px rgba(255,255,255,0.5);
                z-index: 2;
                transition: transform 0.5s;
            }
            .tcg-digital-card:hover .tcg-card-art i {
                transform: scale(1.1);
            }

            .tcg-art-overlay {
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.2) 2px, rgba(0,0,0,0.2) 4px);
                z-index: 1;
            }

            .tcg-card-body {
                flex: 1;
                padding: 0 12px 10px 12px;
                display: flex;
                flex-direction: column;
            }

            .tcg-card-type {
                font-size: 10px;
                text-transform: uppercase;
                letter-spacing: 2px;
                color: var(--card-color);
                margin-bottom: 8px;
                text-align: center;
                font-weight: bold;
                border-bottom: 1px solid rgba(255,255,255,0.05);
                padding-bottom: 6px;
            }

            .tcg-card-title {
                font-size: 17px;
                color: #fff;
                text-align: center;
                font-weight: 800;
                margin-bottom: 12px;
                text-transform: uppercase;
                text-shadow: 0 0 10px rgba(0,0,0,0.5);
                min-height: 40px; /* Cân đối tiêu đề 2 dòng */
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .tcg-card-desc {
                font-size: 12.5px;
                color: #cbd5e1;
                text-align: justify;
                line-height: 1.5;
                background: rgba(0,0,0,0.5);
                padding: 10px;
                border-radius: 6px;
                border-left: 2px solid var(--card-color);
                flex: 1;
            }

            .tcg-card-footer {
                padding: 12px;
                text-align: center;
                border-top: 1px solid rgba(255,255,255,0.1);
                background: rgba(0,0,0,0.4);
                border-bottom-left-radius: 8px;
                border-bottom-right-radius: 8px;
            }

            .status-ready {
                color: #fff;
                font-weight: bold;
                font-size: 14px;
                letter-spacing: 1px;
                text-shadow: 0 0 5px var(--card-color), 0 0 15px var(--card-color);
            }

            .status-locked {
                color: #ef4444;
                font-weight: bold;
                font-size: 14px;
                letter-spacing: 1px;
            }
            
            .rewards-container {
                max-width: 1200px;
                margin: 0 auto;
                padding-bottom: 40px;
                perspective: 1000px; /* Thêm 3D perspective cho mượt */
            }
            </style>

            <div class="rewards-container">
                <div class="glass-header" style="display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; margin-bottom: 30px; border-radius: 12px; border: 1px solid rgba(255,215,0,0.2); background: linear-gradient(90deg, rgba(218,165,32,0.1) 0%, rgba(20,20,30,0.8) 100%);">
                    <div>
                        <h2 style="color: #ffd700; margin: 0; font-size: 22px; display: flex; align-items: center; gap: 8px; text-transform: uppercase;">
                            <i class="fa-solid fa-gamepad"></i> KHO THẺ BÀI SỐ HÓA
                        </h2>
                        <p style="color: var(--text-secondary); font-size: 14px; margin: 4px 0 0;">Cửa hàng Đặc quyền - Dùng Tiền Công Đức để mua Thẻ</p>
                    </div>
                    <div style="text-align: right; background: rgba(0,0,0,0.5); padding: 12px 24px; border-radius: 8px; border: 1px solid #ffd700; box-shadow: 0 0 20px rgba(255,215,0,0.2);">
                        <div style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 4px; letter-spacing: 1px;">Số dư Công Đức</div>
                        <div style="font-size: 32px; font-weight: 900; color: #ffd700; line-height: 1;">${meritInfo.current} <i class="fa-solid fa-star" style="font-size: 24px; text-shadow: 0 0 15px #ffd700;"></i></div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 24px; padding: 10px;">
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
