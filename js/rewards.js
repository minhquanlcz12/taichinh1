const RewardsModule = {
    _catalog: [
        { id: 'card_wfh', title: 'Làm Việc Tại Nhà', icon: 'fa-house-laptop', cost: 15, color: '#10b981', desc: 'Sử dụng để WFH 1 ngày không bị tính vắng.' },
        { id: 'card_late', title: 'Đi Muộn Miễn Phạt', icon: 'fa-clock', cost: 10, color: '#f59e0b', desc: 'Cứu cánh khi ngủ nướng, miễn phạt 1 lần đi muộn.' },
        { id: 'card_early', title: 'Về Sớm 1 Tiếng', icon: 'fa-person-running', cost: 8, color: '#3b82f6', desc: 'Xin sếp về sớm 1 chút để xử lý việc cá nhân.' },
        { id: 'card_leave', title: 'Nghỉ Phép Thêm 1 Ngày', icon: 'fa-umbrella-beach', cost: 25, color: '#a855f7', desc: 'Có ngay 1 ngày phép hưởng nguyên lương.' },
        { id: 'card_tea', title: 'Trà Chiều Miễn Phí', icon: 'fa-mug-hot', cost: 5, color: '#f43f5e', desc: 'Sếp bao trà sữa / cafe ban chiều.' },
        { id: 'card_rescue', title: 'Thánh Nhân Cứu Bồ', icon: 'fa-handshake-angle', cost: 12, color: '#ec4899', desc: 'Dùng để bảo lãnh/xoá án phạt đi muộn cho 1 NGƯỜI KHÁC (Tăng tình kết nghĩa anh em).' },
        { id: 'card_mystery', title: 'Quà Bất Ngờ', icon: 'fa-gift', cost: 30, color: '#ffd700', desc: 'Một món quà bí mật và giá trị do sếp chuẩn bị.' },
        { id: 'card_king', title: 'Chiếc Ghế Quyền Lực', icon: 'fa-crown', cost: 50, color: '#fbbf24', desc: 'Được quyền nhờ Sếp đi pha 1 ly cafe/trà, hoặc Sếp bao ăn trưa 1-1 đàm đạo riêng.' }
    ],
    
    _isSpinning: false,
    _currentRotation: 0,

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
                background-image: 
                    linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
                background-size: 20px 20px;
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
            }

            .wheel-wrapper {
                position: relative;
                width: 360px;
                height: 360px;
                padding: 20px;
                background: #000;
                border-radius: 50%;
                box-shadow: 0 0 50px rgba(16, 185, 129, 0.4), inset 0 0 30px rgba(16, 185, 129, 0.2);
                border: 3px solid #10b981;
                display: flex; align-items: center; justify-content: center;
            }
            /* Đèn LED viền */
            .wheel-rim-lights {
                position: absolute;
                width: 100%; height: 100%;
                border-radius: 50%;
                z-index: 5;
                pointer-events: none;
            }
            .light-dot {
                position: absolute;
                width: 8px; height: 8px;
                background: #fff;
                border-radius: 50%;
                left: 50%; top: 5px;
                transform-origin: 50% 175px;
                box-shadow: 0 0 10px #fff, 0 0 20px #10b981;
                animation: ledBlink 1s infinite alternate;
            }
            @keyframes ledBlink {
                0% { opacity: 0.3; filter: brightness(0.5); }
                100% { opacity: 1; filter: brightness(1.5); box-shadow: 0 0 15px #10b981, 0 0 30px #10b981; }
            }

            .wheel-pointer-premium {
                position: absolute;
                top: -15px;
                left: 50%;
                transform: translateX(-50%);
                width: 45px;
                height: 55px;
                background: #fff;
                clip-path: polygon(0 0, 100% 0, 50% 100%);
                z-index: 25;
                filter: drop-shadow(0 5px 15px rgba(0,0,0,0.8));
                border-bottom-left-radius: 5px;
                border-bottom-right-radius: 5px;
            }
            .wheel-container-p {
                width: 100%;
                height: 100%;
                border-radius: 50%;
                position: relative;
                overflow: hidden;
                transition: transform 5s cubic-bezier(0.1, 0, 0, 1);
                border: 6px solid #111;
                background: #111;
            }
            /* Animation xoay nhẹ lúc đứng yên */
            .wheel-container-p.idle {
                animation: wheelIdle 20s infinite linear;
            }
            @keyframes wheelIdle {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }

            .wheel-bg-gradient {
                position: absolute;
                width: 100%;
                height: 100%;
                background: conic-gradient(
                    #1e1b4b 0deg 45deg,
                    #059669 45deg 90deg,
                    #064e3b 90deg 135deg,
                    #1e1b4b 135deg 180deg,
                    #059669 180deg 225deg,
                    #92400e 225deg 270deg,
                    #1e1b4b 270deg 315deg,
                    #9d174d 315deg 360deg
                );
            }
            .wheel-content-layer {
                position: absolute;
                width: 100%;
                height: 100%;
            }
            .wheel-item {
                position: absolute;
                width: 100%;
                height: 100%;
                transform: rotate(calc(45deg * var(--i)));
                display: flex;
                justify-content: center;
                padding-top: 35px;
                color: #fff;
                font-weight: 900;
                font-size: 15px;
                text-transform: uppercase;
                letter-spacing: 1px;
                text-shadow: 0 2px 8px rgba(0,0,0,1);
            }
            .wheel-center-cap {
                position: absolute;
                top: 50%; left: 50%;
                transform: translate(-50%, -50%);
                width: 70px; height: 70px;
                background: #000;
                border-radius: 50%;
                z-index: 15;
                border: 4px solid #10b981;
                display: flex; align-items: center; justify-content: center;
                box-shadow: 0 0 30px rgba(16, 185, 129, 0.6);
            }
            .cap-inner {
                width: 25px; height: 25px;
                background: #10b981;
                border-radius: 50%;
                box-shadow: 0 0 15px #10b981;
                animation: pulseGlow 2s infinite;
            }
            @keyframes pulseGlow {
                0% { transform: scale(1); opacity: 0.8; }
                50% { transform: scale(1.2); opacity: 1; box-shadow: 0 0 25px #10b981; }
                100% { transform: scale(1); opacity: 0.8; }
            }

            .cyber-glitch-title {
                font-size: 28px;
                font-weight: 900;
                color: #fff;
                letter-spacing: 5px;
                margin-bottom: 5px;
                text-shadow: 3px 3px #ff00ff, -3px -3px #00ffff;
                animation: titleGlitch 5s infinite;
            }
            @keyframes titleGlitch {
                0%, 90%, 100% { transform: none; opacity: 1; }
                91% { transform: skewX(20deg); opacity: 0.8; }
                93% { transform: skewX(-20deg); opacity: 0.9; }
                95% { transform: translate(5px, -5px); }
            }

            .spin-btn-premium {
                background: linear-gradient(135deg, #10b981, #059669);
                color: #000;
                border: none;
                padding: 18px 60px;
                border-radius: 4px;
                font-weight: 900;
                font-size: 20px;
                cursor: pointer;
                box-shadow: 0 0 30px rgba(16, 185, 129, 0.5);
                transition: all 0.3s;
                text-transform: uppercase;
                letter-spacing: 2px;
                clip-path: polygon(10% 0, 100% 0, 90% 100%, 0% 100%);
            }
            .spin-btn-premium:hover:not(:disabled) {
                transform: scale(1.1) skewX(-2deg);
                box-shadow: 0 0 50px rgba(16, 185, 129, 0.9);
                color: #fff;
            }
            .spin-btn-premium:disabled {
                background: #1e293b;
                cursor: not-allowed;
                opacity: 0.5;
                color: #475569;
            }

            .rewards-container {
                max-width: 1200px;
                margin: 0 auto;
                padding-bottom: 40px;
                perspective: 1200px;
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
                        <div style="font-size: 32px; font-weight: 900; color: #ffd700; line-height: 1;">
                            ${meritInfo.current} <i class="fa-solid fa-star" style="font-size: 24px; text-shadow: 0 0 15px #ffd700;"></i>
                        </div>
                        ${currentUser.role === 'admin' ? `
                        <div style="margin-top: 10px;">
                            <button onclick="RewardsModule.adminCheatPoints('${currentUser.username}')" style="background: rgba(16, 185, 129, 0.2); border: 1px solid #10b981; color: #10b981; padding: 6px 12px; border-radius: 6px; font-size: 11px; cursor: pointer; font-weight: bold; width: 100%; text-transform: uppercase;">
                                <i class="fa-solid fa-wand-magic-sparkles"></i> Hack 50 Điểm Test
                            </button>
                        </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Lucky Wheel Section - Premium Cyberpunk Version -->
                <div class="glass-panel wheel-section" style="margin-bottom: 50px; padding: 40px 20px; text-align: center; background: radial-gradient(circle at center, rgba(16,185,129,0.1), rgba(0,0,0,0.9)); border: 1px solid rgba(16,185,129,0.2); position: relative; overflow: hidden; border-radius: 20px;">
                    <!-- Trang trí nền -->
                    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(rgba(16,185,129,0.05), transparent); opacity: 0.5; pointer-events: none;"></div>
                    
                    <div style="max-width: 600px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; gap: 30px; position: relative; z-index: 2;">
                        <div class="wheel-title-container">
                            <h3 class="cyber-glitch-title">
                                <i class="fa-solid fa-dharmachakra fa-spin" style="--fa-animation-duration: 10s; margin-right: 10px; color: #10b981;"></i>
                                VÒNG QUAY NHÂN PHẨM
                            </h3>
                            <div class="cyber-subtitle">THỬ VẬN MAY - NHẬN NGAY ĐẶC QUYỀN</div>
                        </div>

                        <div class="wheel-wrapper">
                            <div class="wheel-pointer-premium"></div>
                            <div class="wheel-rim-lights">
                                ${Array.from({length: 12}).map((_, i) => `<div class="light-dot" style="transform: rotate(${i * 30}deg);"></div>`).join('')}
                            </div>
                            <div id="lucky-wheel-main" class="wheel-container-p idle">
                                <div class="wheel-bg-gradient"></div>
                                <div class="wheel-content-layer">
                                    <div class="wheel-item" style="--i:0;"><span>Hụt rồi!</span></div>
                                    <div class="wheel-item" style="--i:1;"><span>+1đ</span></div>
                                    <div class="wheel-item" style="--i:2;"><span>+2đ</span></div>
                                    <div class="wheel-item" style="--i:3;"><span>Hụt rồi!</span></div>
                                    <div class="wheel-item" style="--i:4;"><span>+1đ</span></div>
                                    <div class="wheel-item" style="--i:5;"><span>+5đ</span></div>
                                    <div class="wheel-item" style="--i:6;"><span>Hụt rồi!</span></div>
                                    <div class="wheel-item" style="--i:7;"><span>THẺ TRÀ</span></div>
                                </div>
                            </div>
                            <div class="wheel-center-cap">
                                <div class="cap-inner"></div>
                            </div>
                        </div>

                        <div class="spin-controls">
                            <button id="spin-btn-v2" onclick="RewardsModule.spinWheel()" class="spin-btn-premium" ${meritInfo.current < 1 || RewardsModule._isSpinning ? 'disabled' : ''}>
                                ${RewardsModule._isSpinning ? '<i class="fa-solid fa-sync fa-spin"></i> COMPUTER... ' : '<i class="fa-solid fa-bolt"></i> LIỀU THÌ ĂN NHIỀU (-1đ)'}
                            </button>
                            <div style="margin-top: 15px; font-size: 11px; color: #10b981; font-family: monospace; letter-spacing: 1px; text-shadow: 0 0 5px #10b981;">SYSLOAD: STATUS_REDHOT_READY</div>
                        </div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 24px; padding: 10px;">
                    ${cardsHtml}
                </div>

                ${customHistoryHtml}
            </div>
        `;
    },

    adminCheatPoints: async (username) => {
        if (!Auth.currentUser || Auth.currentUser.role !== 'admin') return;
        
        const newRecord = {
            id: 'reward_cheat_' + Date.now(),
            username: username,
            timestamp: Date.now(),
            cardId: 'admin_cheat',
            title: '🎁 Quỹ Hỗ Trợ Khẩn Cấp (Test)',
            icon: 'fa-wand-magic-sparkles',
            color: '#10b981',
            cost: -50 // Âm = Cộng điểm
        };

        const allRewards = await RewardsModule.loadData();
        allRewards.push(newRecord);
        await RewardsModule.saveData(allRewards);
        
        Utils.showToast("Bơm thành công +50 điểm!", "success");
        RewardsModule.render();
    },

    spinWheel: async () => {
        if (RewardsModule._isSpinning) return;
        
        const user = Auth.currentUser;
        if (!user) return;

        const meritInfo = await RewardsModule.calcUserMerit(user.username);
        if (meritInfo.current < 1) {
            Utils.showToast("Bạn cần ít nhất 1 điểm Công Đức để quay!", "error");
            return;
        }

        // Bắt đầu quay
        RewardsModule._isSpinning = true;
        const wheelEl = document.getElementById('lucky-wheel-main');
        if (!wheelEl) return;

        // Xử lý việc chuyển từ IDLE sang SPIN: 
        // 1. Lấy góc hiện tại
        const style = window.getComputedStyle(wheelEl);
        const matrix = style.getPropertyValue("transform");
        let currentAngle = 0;
        if (matrix !== "none") {
            const values = matrix.split('(')[1].split(')')[0].split(',');
            const a = values[0]; const b = values[1];
            currentAngle = Math.round(Math.atan2(b, a) * (180/Math.PI));
            if (currentAngle < 0) currentAngle += 360;
        }
        
        // 2. Dừng animation idle và set transform cứng
        wheelEl.classList.remove('idle');
        wheelEl.style.transform = `rotate(${currentAngle}deg)`;
        
        // Timeout nhỏ để trình duyệt nhận diện việc remove class rồi mới apply transition mới
        setTimeout(async () => {
            // Trừ 1 điểm phí tham gia ngay lập tức
            const participationRecord = {
                id: 'spin_fee_' + Date.now(),
                username: user.username,
                timestamp: Date.now(),
                cardId: 'wheel_entry',
                title: '🎡 Lượt Quay May Mắn',
                icon: 'fa-spinner',
                color: '#34d399',
                cost: 1
            };
            const allRewards = await RewardsModule.loadData();
            allRewards.push(participationRecord);
            await RewardsModule.saveData(allRewards);

            // Tính toán kết quả
            const prizes = [
                { label: 'Hụt rồi!', pts: 0, msg: 'Hụt rồi! May mắn lần sau nhé 😅' },
                { label: '+1 Điểm', pts: 1, msg: 'Hòa vốn! Bạn nhận lại 1 công đức 🧧' },
                { label: '+2 Điểm', pts: 2, msg: 'Lãi rồi! Chúc mừng bạn được +2 công đức 🎆' },
                { label: 'Hụt rồi!', pts: 0, msg: 'Suýt trúng! Cố lên bạn ơi 🍀' },
                { label: '+1 Điểm', pts: 1, msg: 'Hòa vốn! Nhận lại 1 công đức nè 🧧' },
                { label: '+5 Điểm', pts: 5, msg: 'XUẤT SẮC! Bạn trúng hũ +5 công đức 💎' },
                { label: 'Hụt rồi!', pts: 0, msg: 'Hụt mất rồi! Quay lại phát nữa xem sao? ✨' },
                { label: 'THẺ TRÀ', pts: 0, isCard: true, cardId: 'card_tea', msg: 'SIÊU CẤP MAY MẮN! Trúng ngay 1 THẺ TRÀ CHIỀU 🥤' }
            ];

            const rand = Math.random();
            let prizeIdx = 0;
            if (rand < 0.40) prizeIdx = [0, 3, 6][Math.floor(Math.random() * 3)];
            else if (rand < 0.75) prizeIdx = [1, 4][Math.floor(Math.random() * 2)];
            else if (rand < 0.88) prizeIdx = 2;
            else if (rand < 0.96) prizeIdx = 5;
            else prizeIdx = 7;

            const prize = prizes[prizeIdx];
            
            const segmentAngle = 360 / 8;
            const stopAngle = 360 - (prizeIdx * segmentAngle) - (segmentAngle / 2); 
            
            // Tính toán rotation tiếp theo cộng dồn vào currentAngle
            // Ta muốn rotation mới = currentAngle + (vòng quay thêm) + (góc tới đích từ currentAngle)
            const extraSpins = 8 + Math.floor(Math.random() * 5); 
            const finalRotation = (extraSpins * 360) + stopAngle;
            
            // Tổng rotation từ lúc load trang đến giờ (để CSS transition chạy mượt)
            // Vì currentAngle là góc hiện tại mod 360, ta cần cẩn thận
            // Để đơn giản ta dùng biến lưu trữ tổng rotation tích lũy
            if (!RewardsModule._totalRot) RewardsModule._totalRot = currentAngle;
            RewardsModule._totalRot += finalRotation;
            
            wheelEl.style.transform = `rotate(${RewardsModule._totalRot}deg)`;

            // Đợi quay xong (5s)
            setTimeout(async () => {
                if (prize.pts > 0) {
                    const winRecord = {
                        id: 'spin_win_' + Date.now(),
                        username: user.username,
                        timestamp: Date.now(),
                        cardId: 'wheel_win',
                        title: `🎡 Thưởng: ${prize.label}`,
                        icon: 'fa-gift',
                        color: '#ffd700',
                        cost: -prize.pts
                    };
                    const data = await RewardsModule.loadData();
                    data.push(winRecord);
                    await RewardsModule.saveData(data);
                } else if (prize.isCard) {
                    const card = RewardsModule._catalog.find(c => c.id === prize.cardId);
                    const winCardRecord = {
                        id: 'spin_card_' + Date.now(),
                        username: user.username,
                        timestamp: Date.now(),
                        cardId: card.id,
                        title: `🎡 Trúng Thẻ: ${card.title}`,
                        icon: card.icon,
                        color: card.color,
                        cost: 0
                    };
                    const data = await RewardsModule.loadData();
                    data.push(winCardRecord);
                    await RewardsModule.saveData(data);
                    Utils.notifyTelegram(`🎰 <b>[SIÊU CẤP MAY MẮN]</b>\n👤 <b>${user.username}</b> vừa quay hũ trúng ngay <b>${card.title}</b> miễn phí!`);
                }

                RewardsModule._isSpinning = false;
                RewardsModule.showWheelResult(prize);
                RewardsModule.render();
            }, 5100);
        }, 50);
    },

    showWheelResult: (prize) => {
        const overlay = document.createElement('div');
        overlay.id = 'wheel-result-overlay';
        overlay.style = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.9); z-index: 9999;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            animation: fadeIn 0.5s ease; backdrop-filter: blur(10px);
        `;

        const isWin = prize.pts > 0 || prize.isCard;
        const color = isWin ? '#10b981' : '#ef4444';
        
        let humorMsg = "";
        if (prize.pts === 0 && !prize.isCard) {
            const fails = [
                "NHÂN PHẨM BAY MÀU! 🕯️ Chắc tại nãy đi làm sếp quên thắp nhang rồi.",
                "TRƯỢT VỎ CHUỐI! 🍌 Gần lắm rồi, chỉ thiếu 0.0001mm là trúng hũ.",
                "MAY MẮN LẦN SAU! 🍀 Đừng buồn, coi như đóng góp quỹ trà đá cho anh em.",
                "SUÝT THÌ ĐƯỢC! 😂 Thôi nịnh đồng nghiệp kiếm thêm điểm rồi quay tiếp nhen."
            ];
            humorMsg = fails[Math.floor(Math.random() * fails.length)];
        } else if (prize.pts === 1) {
            humorMsg = "HÒA VỐN! 🧧 May quá, coi như quay miễn phí, làm nháy nữa không sếp?";
        } else if (prize.pts === 2) {
            humorMsg = "LÃI NHẸ +2đ! 📈 Sướng nhất sếp, nhặt được hạt dẻ rồi nhé!";
        } else if (prize.pts === 5) {
            humorMsg = "ĂN ĐẬM +5đ! 💎 TRỜI ƠI TIN ĐƯỢC KHÔNG? Sếp vừa 'hack' hệ thống à?";
        } else if (prize.isCard) {
            humorMsg = "TRÚNG THẺ TRÀ! 🥤 Ôi đỉnh vãi, chuẩn bị có trà sữa sướng nhé!";
        }

        overlay.innerHTML = `
            <style>
                @keyframes bounceIn {
                    0% { transform: scale(0.3); opacity: 0; }
                    50% { transform: scale(1.1); }
                    70% { transform: scale(0.9); }
                    100% { transform: scale(1); opacity: 1; }
                }
                .result-card {
                    background: rgba(20,20,30,0.9);
                    padding: 50px; border-radius: 20px;
                    border: 3px solid ${color};
                    box-shadow: 0 0 50px ${color};
                    text-align: center; max-width: 90%;
                    animation: bounceIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    position: relative;
                }
                .result-title {
                    font-size: 80px; font-weight: 900; color: #fff;
                    margin-bottom: 20px; text-transform: uppercase;
                    text-shadow: 0 0 20px ${color}, 0 0 40px ${color};
                }
                .result-humor {
                    font-size: 28px; color: #cbd5e1;
                    font-weight: 500; line-height: 1.6;
                    margin-bottom: 30px;
                }
                .close-overlay-btn {
                    padding: 20px 60px;
                    background: ${color}; color: #000;
                    border: none; border-radius: 12px;
                    font-weight: 900; cursor: pointer;
                    text-transform: uppercase; letter-spacing: 2px;
                    font-size: 20px; transition: all 0.2s;
                }
                .close-overlay-btn:hover {
                    transform: scale(1.1);
                    box-shadow: 0 0 30px ${color};
                }
            </style>
            <div class="result-card">
                <div class="result-title">${prize.label}</div>
                <div class="result-humor">${humorMsg}</div>
                <button class="close-overlay-btn" onclick="document.getElementById('wheel-result-overlay').remove()">ĐÓNG VÀ QUAY TIẾP</button>
            </div>
        `;
        document.body.appendChild(overlay);
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
