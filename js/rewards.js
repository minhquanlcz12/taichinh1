const RewardsModule = {
    _catalog: [
        { id: 'card_wfh', title: 'Làm Việc Tại Nhà', icon: 'fa-house-laptop', cost: 15, color: '#10b981', desc: 'Sử dụng để WFH 1 ngày không bị tính vắng.' },
        { id: 'card_late', title: 'Đi Muộn Miễn Phạt', icon: 'fa-clock', cost: 10, color: '#f59e0b', desc: 'Cứu cánh khi ngủ nướng, miễn phạt 1 lần đi muộn.' },
        { id: 'card_early', title: 'Về Sớm 1 Tiếng', icon: 'fa-person-running', cost: 8, color: '#3b82f6', desc: 'Xin sếp về sớm 1 chút để xử lý việc cá nhân.' },
        { id: 'card_leave', title: 'Nghỉ Phép Thêm 1 Ngày', icon: 'fa-umbrella-beach', cost: 25, color: '#a855f7', desc: 'Có ngay 1 ngày phép hưởng nguyên lương.' },
        { id: 'card_tea', title: '1 Lon Nước Ngọt 10k', icon: 'fa-glass-water', cost: 5, color: '#f43f5e', desc: 'Sếp bao 1 lon nước ngọt mát lạnh trị giá 10k.' },
        { id: 'card_rescue', title: 'Thánh Nhân Cứu Bồ', icon: 'fa-handshake-angle', cost: 12, color: '#ec4899', desc: 'Dùng để bảo lãnh/xoá án phạt đi muộn cho 1 NGƯỜI KHÁC (Tăng tình kết nghĩa anh em).' },
        { id: 'card_mystery', title: 'Quà Bất Ngờ', icon: 'fa-gift', cost: 30, color: '#ffd700', desc: 'Một món quà bí mật và giá trị do Quản lý chuẩn bị.' },
        { id: 'card_king', title: 'Chiếc Ghế Quyền Lực', icon: 'fa-crown', cost: 50, color: '#fbbf24', desc: 'Được quyền nhờ Quản lý đi pha 1 ly cafe/trà, hoặc Quản lý bao ăn trưa 1-1 đàm đạo riêng.' }
    ],
    
    _isSpinning: false,
    _currentRotation: 0,

    init: () => {
        console.log("RewardsModule v2.1 (Balanced Economy) Initialized");
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
        
        // Công thức mới: Tặng sẵn 1 điểm + công đức kiếm được (0.5đ mỗi lần điểm danh tốt)
        const earned = 1 + userHistory.reduce((acc, r) => acc + ((r.status === 'on_time' || r.status === 'late_excused') ? 0.5 : -1), 0);

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
        const accounts = await DB.getAccounts() || [];
        
        // Kiểm tra xem hôm nay đã quay chưa
        const today = new Date().toLocaleDateString();
        const hasSpunToday = allRewardsHistory.some(r => 
            r.username === currentUser.username && 
            r.cardId === 'wheel_entry' && 
            new Date(r.timestamp).toLocaleDateString() === today
        );
        
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
                                    <td style="color: #fff;">
                                        ${h.isUnopened ? `
                                            <span style="color: #ec4899; font-weight: bold; text-shadow: 0 0 10px rgba(236,72,153,0.3);">
                                                <i class="fa-solid fa-box-open" style="margin-right: 6px;"></i>${h.title} (Chưa Mở)
                                            </span>
                                        ` : `
                                            <i class="fa-solid ${h.icon}" style="margin-right: 6px; color: ${h.color};"></i>${h.title}
                                        `}
                                    </td>
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
                                    <td style="color: #fff;">
                                        ${h.isUnopened ? `
                                            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
                                                <span style="color: #ec4899; font-weight: bold; text-shadow: 0 0 10px rgba(236,72,153,0.3); display: flex; align-items: center; gap: 6px;">
                                                    <i class="fa-solid fa-box-open"></i> ${h.title}
                                                </span>
                                                <button onclick="RewardsModule.openMysteryPack('${h.id}')" class="boc-bao-btn">
                                                    <i class="fa-solid fa-envelope-open-text"></i> BÓC BAO THƯ
                                                </button>
                                            </div>
                                        ` : `
                                            <i class="fa-solid ${h.icon}" style="margin-right: 6px; color: ${h.color};"></i>${h.title}
                                        `}
                                    </td>
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

        const positionIcons = {
            'Editor': 'fa-video',
            'Content Creator': 'fa-pen-nib',
            'Diễn viên': 'fa-masks-theater',
            'Designer': 'fa-palette',
            'Photographer': 'fa-camera',
            'MC/Host': 'fa-microphone-lines',
            'Marketing': 'fa-chart-line',
            'Manager': 'fa-user-tie'
        };
        const positionLabels = {
            'Editor': '🎬 Editor',
            'Content Creator': '📝 Content Creator',
            'Diễn viên': '🎭 Diễn viên',
            'Designer': '🎨 Designer',
            'Photographer': '📸 Photographer',
            'MC/Host': '🎙️ MC / Host',
            'Marketing': '📊 Marketing',
            'Manager': '💼 Manager'
        };

        let employeesHtml = '';
        for (const acc of accounts) {
            const accMerit = await RewardsModule.calcUserMerit(acc.username);
            const profile = acc.profile || {};
            const fullname = profile.fullname || acc.username;
            const position = profile.position || 'Nhân sự';
            const positionLabel = positionLabels[position] || `💼 ${position}`;
            const positionIcon = positionIcons[position] || 'fa-user';
            const themeColor = profile.color || '#10b981';
            
            // Chibi rendering logic (if ChibiModule is defined and config exists)
            let chibiSvgHtml = '';
            if (profile.chibiConfig && typeof ChibiModule !== 'undefined') {
                chibiSvgHtml = ChibiModule.renderChibiSVG(profile.chibiConfig, true, accMerit.current);
            } else {
                chibiSvgHtml = `
                <div class="chibi-placeholder" style="width: 100px; height: 100px; border-radius: 50%; background: rgba(255,255,255,0.05); border: 2px dashed ${themeColor}; display: flex; align-items: center; justify-content: center; position: relative; margin: 0 auto; box-shadow: 0 0 10px rgba(0,0,0,0.5);">
                    <i class="fa-solid fa-ghost" style="font-size: 36px; color: ${themeColor}; opacity: 0.6; animation: floatGhost 3s infinite ease-in-out;"></i>
                    <div style="font-size: 9px; color: #64748b; position: absolute; bottom: 8px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Chưa tạo Chibi</div>
                </div>
                `;
            }

            employeesHtml += `
            <div class="employee-tcg-card" style="--emp-color: ${themeColor}; cursor: default;">
                <div class="tcg-card-inner">
                    <div class="tcg-card-cost" style="background: ${themeColor}; box-shadow: 0 0 10px ${themeColor}; border: 1px solid rgba(255,255,255,0.3); border-top: none;">
                        ⭐ ${accMerit.current}đ
                    </div>
                    
                    <div class="tcg-card-art-chibi">
                        <div style="transform: scale(0.95); display: flex; align-items: center; justify-content: center;">
                            ${chibiSvgHtml}
                        </div>
                        <div class="tcg-art-overlay"></div>
                    </div>
                    
                    <div class="tcg-card-body" style="text-align: center; padding: 10px;">
                        <div class="tcg-card-type" style="color: ${themeColor}; border: 1px solid rgba(255,255,255,0.15); display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 10px; font-weight: bold; background: rgba(0,0,0,0.3); text-transform: uppercase; letter-spacing: 1px;">
                            <i class="fa-solid ${positionIcon}" style="margin-right: 4px;"></i> ${positionLabel}
                        </div>
                        <div class="tcg-card-title" style="font-size: 15px; font-weight: 800; color: #fff; margin-top: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-transform: uppercase; letter-spacing: 1px;">
                            ${fullname}
                        </div>
                        <p class="tcg-card-desc" style="font-size: 11px; color: #64748b; font-family: monospace; margin: 4px 0 0 0;">
                            @${acc.username}
                        </p>
                    </div>
                    
                    <div class="tcg-card-footer" style="margin-top: auto; border-top: 1px solid rgba(255,255,255,0.05); padding: 8px 10px 10px; font-size: 10px; color: #475569; font-family: monospace; display: flex; justify-content: space-between; align-items: center;">
                        <span>MEM_ID: 1000${acc.username.length}</span>
                        <span style="color: ${themeColor}; font-weight: bold;">ACTIVE</span>
                    </div>
                </div>
            </div>
            `;
        }

        // === Build Inventory Bag Content ===
        const userItems = allRewardsHistory.filter(r => 
            r.username === currentUser.username && 
            (r.cardId?.startsWith('card_') || r.cardId?.startsWith('mystery_pack')) && 
            r.cost >= 0 && 
            !r.isUsed
        );
        const unopenedPacks = userItems.filter(r => r.isUnopened);
        const ownedCards = userItems.filter(r => !r.isUnopened);

        let bagContentHtml = '';
        if (userItems.length === 0) {
            bagContentHtml = `
                <div style="text-align: center; padding: 40px 20px; color: #64748b;">
                    <div style="font-size: 48px; margin-bottom: 12px; opacity: 0.5;">🎒</div>
                    <div style="font-size: 14px; line-height: 1.6;">Túi đồ trống rỗng!<br>Hãy quay hũ hoặc đổi thẻ nào! 🎒</div>
                </div>
            `;
        } else {
            let packsHtml = unopenedPacks.map(p => `
                <div style="background: linear-gradient(135deg, rgba(236,72,153,0.15), rgba(139,92,246,0.1)); border: 1px solid rgba(236,72,153,0.4); border-radius: 12px; padding: 14px; display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 8px; animation: packPulse 2s infinite alternate;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 38px; height: 38px; border-radius: 10px; background: linear-gradient(135deg, #ec4899, #8b5cf6); display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0;">📦</div>
                        <div>
                            <div style="color: #ec4899; font-weight: 700; font-size: 13px;">${p.title}</div>
                            <div style="color: #94a3b8; font-size: 10px;">${new Date(p.timestamp).toLocaleString('vi-VN')}</div>
                        </div>
                    </div>
                    <button onclick="RewardsModule.openMysteryPack('${p.id}')" class="boc-bao-btn" style="font-size: 10px; padding: 5px 12px; white-space: nowrap;">
                        <i class="fa-solid fa-envelope-open-text"></i> BÓC
                    </button>
                </div>
            `).join('');

            let cardsGridHtml = ownedCards.length > 0 ? `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px;">
                    ${ownedCards.map(c => {
                        const catCard = RewardsModule._catalog.find(cat => cat.id === c.cardId);
                        const icon = catCard ? catCard.icon : (c.icon || 'fa-ticket');
                        const color = catCard ? catCard.color : (c.color || '#10b981');
                        const title = catCard ? catCard.title : (c.title || 'Thẻ');
                        return `
                        <div class="inventory-card-premium" style="background: rgba(15,23,42,0.9); border: 1px solid ${color}40; border-radius: 12px; padding: 14px 10px; text-align: center; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative; overflow: hidden;">
                            <div style="width: 40px; height: 40px; border-radius: 12px; background: ${color}15; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; border: 1px solid ${color}30;">
                                <i class="fa-solid ${icon}" style="color: ${color}; font-size: 18px; filter: drop-shadow(0 0 5px ${color}60);"></i>
                            </div>
                            <div style="color: #e2e8f0; font-size: 11px; font-weight: 800; margin-bottom: 12px; line-height: 1.3; min-height: 28px; display: flex; align-items: center; justify-content: center; text-transform: uppercase; letter-spacing: 0.5px;">${title}</div>
                            <button onclick="RewardsModule.useCard('${c.id}')" class="btn-inventory-use" style="
                                background: linear-gradient(135deg, ${color}, ${color}dd);
                                color: #fff;
                                border: none;
                                padding: 8px 12px;
                                border-radius: 8px;
                                font-size: 10px;
                                font-weight: 900;
                                cursor: pointer;
                                width: 100%;
                                text-transform: uppercase;
                                letter-spacing: 1px;
                                transition: all 0.2s;
                                box-shadow: 0 4px 10px ${color}40;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 6px;
                            ">
                                <i class="fa-solid fa-bolt" style="font-size: 9px;"></i> SỬ DỤNG
                            </button>
                        </div>`;
                    }).join('')}
                </div>
            ` : '';
            bagContentHtml = packsHtml + cardsGridHtml;
        }

        // === Build Spin History Content ===
        const userSpinHistory = allRewardsHistory
            .filter(r => r.username === currentUser.username)
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 20);

        const timeAgo = (ts) => {
            const diff = Date.now() - ts;
            const mins = Math.floor(diff / 60000);
            if (mins < 1) return 'Vừa xong';
            if (mins < 60) return mins + ' phút trước';
            const hrs = Math.floor(mins / 60);
            if (hrs < 24) return hrs + ' giờ trước';
            const days = Math.floor(hrs / 24);
            return days + ' ngày trước';
        };

        let historyContentHtml = '';
        if (userSpinHistory.length === 0) {
            historyContentHtml = `
                <div style="text-align: center; padding: 40px 20px; color: #64748b;">
                    <div style="font-size: 40px; margin-bottom: 10px; opacity: 0.5;">📜</div>
                    <div style="font-size: 13px;">Chưa có lịch sử nào!</div>
                </div>
            `;
        } else {
            historyContentHtml = userSpinHistory.map(h => {
                let badge = '';
                let dotColor = '#6366f1';
                if (h.cardId === 'wheel_entry' || h.cost > 0) {
                    badge = '<span style="background: rgba(107,114,128,0.2); color: #9ca3af; padding: 2px 8px; border-radius: 4px; font-size: 9px; font-weight: 700;">⚫ PHÍ</span>';
                    dotColor = '#6b7280';
                } else if (h.cardId === 'wheel_miss' || h.cardId === 'wheel_dark') {
                    badge = '<span style="background: rgba(239,68,68,0.15); color: #ef4444; padding: 2px 8px; border-radius: 4px; font-size: 9px; font-weight: 700;">🔴 TRƯỢT</span>';
                    dotColor = '#ef4444';
                } else {
                    badge = '<span style="background: rgba(16,185,129,0.15); color: #10b981; padding: 2px 8px; border-radius: 4px; font-size: 9px; font-weight: 700;">🟢 TRÚNG</span>';
                    dotColor = '#10b981';
                }
                return `
                <div style="display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04);">
                    <div style="width: 8px; height: 8px; border-radius: 50%; background: ${dotColor}; flex-shrink: 0; box-shadow: 0 0 6px ${dotColor};"></div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="color: #e2e8f0; font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${h.title || 'Giao dịch'}</div>
                        <div style="color: #64748b; font-size: 10px;">${timeAgo(h.timestamp)}</div>
                    </div>
                    ${badge}
                </div>`;
            }).join('');
        }

        container.innerHTML = `
            <style>
            .tcg-digital-card {
                position: relative;
                width: 100%;
                aspect-ratio: 2.2 / 3.3;
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

            .employee-tcg-card {
                position: relative;
                width: 100%;
                aspect-ratio: 2.2 / 3.3;
                max-width: 280px;
                margin: 0 auto;
                border-radius: 12px;
                background: linear-gradient(135deg, rgba(20,20,30,0.95), rgba(5,5,10,0.98));
                border: 2px solid var(--emp-color);
                box-shadow: 0 0 15px rgba(0,0,0,0.8), inset 0 0 20px rgba(0,0,0,0.5);
                padding: 6px;
                cursor: pointer;
                transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                overflow: hidden;
            }

            .employee-tcg-card:hover {
                transform: translateY(-10px) scale(1.05);
                box-shadow: 0 20px 40px rgba(0,0,0,0.9), 0 0 30px var(--emp-color);
                z-index: 10;
            }

            .employee-tcg-card::before {
                content: '';
                position: absolute;
                top: -50%; left: -50%;
                width: 200%; height: 200%;
                background: linear-gradient(
                    115deg,
                    transparent 0%,
                    rgba(255, 255, 255, 0.05) 30%,
                    rgba(0, 224, 255, 0.1) 40%,
                    rgba(255, 0, 128, 0.1) 50%,
                    rgba(0, 255, 0, 0.05) 60%,
                    transparent 100%
                );
                transform: rotate(45deg);
                animation: holoShine 4s infinite alternate ease-in-out;
                pointer-events: none;
                z-index: 3;
                opacity: 0.3;
                transition: opacity 0.3s;
            }
            
            .employee-tcg-card:hover::before {
                opacity: 0.8;
                animation: holoShine 2s infinite alternate ease-in-out;
            }

            @keyframes holoShine {
                0% { transform: translate(-20%, -20%) rotate(25deg); }
                100% { transform: translate(20%, 20%) rotate(25deg); }
            }

            .tcg-card-art-chibi {
                height: 140px;
                margin: 10px;
                background: radial-gradient(circle at center, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.9) 100%);
                border-radius: 6px;
                display: flex;
                justify-content: center;
                align-items: center;
                position: relative;
                border: 1px solid rgba(255,255,255,0.08);
                overflow: hidden;
                box-shadow: inset 0 0 20px rgba(0,0,0,0.9);
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

            @keyframes floatGhost {
                0% { transform: translateY(0); }
                50% { transform: translateY(-8px); }
                100% { transform: translateY(0); }
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
                min-height: 40px;
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
                    #d97706 135deg 180deg,
                    #ec4899 180deg 225deg,
                    #92400e 225deg 270deg,
                    #991b1b 270deg 315deg,
                    #f43f5e 315deg 360deg
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
                transform: rotate(calc(45deg * var(--i) + 22.5deg));
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
            .wheel-item span {
                display: block;
                text-align: center;
                max-width: 70px;
                font-size: 11.5px;
                line-height: 1.25;
                word-wrap: break-word;
                white-space: normal;
                font-weight: 900;
            }
            .boc-bao-btn {
                background: linear-gradient(135deg, #ec4899, #8b5cf6);
                color: #fff;
                border: none;
                padding: 6px 14px;
                font-size: 11px;
                font-weight: bold;
                border-radius: 20px;
                cursor: pointer;
                box-shadow: 0 0 15px rgba(236,72,153,0.6);
                transition: all 0.3s ease;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                animation: packPulse 1.5s infinite alternate;
            }
            .boc-bao-btn:hover {
                transform: scale(1.08);
                box-shadow: 0 0 25px rgba(236,72,153,0.9);
            }
            @keyframes packPulse {
                0% { transform: scale(1); box-shadow: 0 0 10px rgba(236,72,153,0.5); }
                100% { transform: scale(1.04); box-shadow: 0 0 20px rgba(139,92,246,0.8); }
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

            /* === 3-COLUMN ARENA LAYOUT === */
            .wheel-arena {
                display: flex;
                gap: 20px;
                margin-bottom: 40px;
                align-items: stretch;
            }
            .arena-left, .arena-right {
                flex: 0 0 280px;
                min-width: 0;
            }
            .arena-center {
                flex: 1;
                min-width: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            @media (max-width: 900px) {
                .wheel-arena {
                    flex-direction: column;
                }
                .arena-center { order: 1; }
                .arena-right { order: 2; }
                .arena-left { order: 3; }
                .arena-left, .arena-right {
                    flex: none;
                    width: 100%;
                }
            }

            /* === INVENTORY PANEL === */
            .inv-panel {
                background: rgba(15,23,42,0.85);
                border: 1px solid rgba(16,185,129,0.2);
                border-radius: 16px;
                backdrop-filter: blur(12px);
                overflow: hidden;
                height: 100%;
                display: flex;
                flex-direction: column;
            }
            .inv-tabs {
                display: flex;
                border-bottom: 1px solid rgba(255,255,255,0.08);
            }
            .inv-tab {
                flex: 1;
                padding: 14px 8px;
                background: transparent;
                border: none;
                color: #64748b;
                font-weight: 700;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.3s;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                position: relative;
            }
            .inv-tab.active {
                color: #10b981;
                background: rgba(16,185,129,0.08);
            }
            .inv-tab.active::after {
                content: '';
                position: absolute;
                bottom: 0;
                left: 10%;
                width: 80%;
                height: 2px;
                background: #10b981;
                box-shadow: 0 0 10px #10b981;
                border-radius: 2px;
            }
            .inv-tab:hover:not(.active) {
                color: #94a3b8;
                background: rgba(255,255,255,0.03);
            }
            .inv-content-area {
                flex: 1;
                overflow-y: auto;
                padding: 14px;
                max-height: 520px;
            }
            .inv-content-area::-webkit-scrollbar {
                width: 4px;
            }
            .inv-content-area::-webkit-scrollbar-track {
                background: transparent;
            }
            .inv-content-area::-webkit-scrollbar-thumb {
                background: rgba(16,185,129,0.3);
                border-radius: 4px;
            }

            /* === PROBABILITY PANEL === */
            .prob-panel {
                background: rgba(15,23,42,0.85);
                border: 1px solid rgba(16,185,129,0.2);
                border-radius: 16px;
                padding: 20px;
                backdrop-filter: blur(12px);
                height: 100%;
            }
            .prob-panel-title {
                font-size: 13px;
                font-weight: 800;
                color: #10b981;
                text-transform: uppercase;
                letter-spacing: 1.5px;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                gap: 8px;
                padding-bottom: 12px;
                border-bottom: 1px solid rgba(16,185,129,0.15);
            }
            .prob-row {
                margin-bottom: 14px;
            }
            .prob-label {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 5px;
            }
            .prob-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                flex-shrink: 0;
            }
            .prob-name {
                font-size: 12px;
                color: #cbd5e1;
                font-weight: 600;
            }
            .prob-bar-track {
                width: 100%;
                height: 8px;
                background: rgba(255,255,255,0.05);
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 2px;
            }
            .prob-bar-fill {
                height: 100%;
                border-radius: 4px;
                transition: width 1s ease;
            }
            .prob-meta {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .prob-value {
                font-size: 13px;
                font-weight: 900;
                color: #fff;
                font-family: 'Courier New', monospace;
            }
            .prob-sub {
                font-size: 9px;
                color: #64748b;
                font-style: italic;
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

                <!-- ====== 3-COLUMN WHEEL ARENA ====== -->
                <div class="wheel-arena">

                    <!-- LEFT: Inventory Bag + History Tabs -->
                    <div class="arena-left">
                        <div class="inv-panel">
                            <div class="inv-tabs">
                                <button class="inv-tab active" onclick="RewardsModule.switchInvTab('bag')">🎒 TÚI ĐỒ</button>
                                <button class="inv-tab" onclick="RewardsModule.switchInvTab('history')">📜 LỊCH SỬ</button>
                            </div>
                            <div id="inv-bag-content" class="inv-content-area">
                                ${bagContentHtml}
                            </div>
                            <div id="inv-history-content" class="inv-content-area" style="display:none">
                                ${historyContentHtml}
                            </div>
                        </div>
                    </div>

                    <!-- CENTER: Wheel -->
                    <div class="arena-center">
                        <div class="glass-panel wheel-section" style="padding: 30px 20px; text-align: center; background: radial-gradient(circle at center, rgba(16,185,129,0.1), rgba(0,0,0,0.9)); border: 1px solid rgba(16,185,129,0.2); position: relative; overflow: hidden; border-radius: 20px; width: 100%;">
                            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(rgba(16,185,129,0.05), transparent); opacity: 0.5; pointer-events: none;"></div>
                            
                            <div style="margin: 0 auto; display: flex; flex-direction: column; align-items: center; gap: 24px; position: relative; z-index: 2;">
                                <div class="wheel-title-container">
                                    <h3 class="cyber-glitch-title" style="font-size: 22px; letter-spacing: 3px;">
                                        <i class="fa-solid fa-dharmachakra fa-spin" style="--fa-animation-duration: 10s; margin-right: 8px; color: #10b981;"></i>
                                        VÒNG QUAY NHÂN PHẨM
                                    </h3>
                                    <div class="cyber-subtitle" style="font-size: 11px; color: #64748b; letter-spacing: 2px; text-transform: uppercase;">THỬ VẬN MAY - NHẬN NGAY ĐẶC QUYỀN</div>
                                </div>

                                <div class="wheel-wrapper">
                                    <div class="wheel-pointer-premium"></div>
                                    <div class="wheel-rim-lights">
                                        ${Array.from({length: 12}).map((_, i) => `<div class="light-dot" style="transform: rotate(${i * 30}deg);"></div>`).join('')}
                                    </div>
                                    <div id="lucky-wheel-main" class="wheel-container-p idle">
                                        <div class="wheel-bg-gradient"></div>
                                        <div class="wheel-content-layer">
                                            <div class="wheel-item" style="--i:0;"><span>HỤT<br>RỒI!</span></div>
                                            <div class="wheel-item" style="--i:1;"><span>HÒA<br>VỐN</span></div>
                                            <div class="wheel-item" style="--i:2;"><span>LÃI<br>NHẸ</span></div>
                                            <div class="wheel-item" style="--i:3;"><span style="color:#ffd700;">QUÀ<br>TẶNG</span></div>
                                            <div class="wheel-item" style="--i:4;"><span style="color:#ec4899;">ĐỘC<br>ĐẮC</span></div>
                                            <div class="wheel-item" style="--i:5;"><span>HŨ<br>LỚN</span></div>
                                            <div class="wheel-item" style="--i:7;"><span style="color:#3b82f6;">THẺ<br>SỐ</span></div>
                                            <div class="wheel-item" style="--i:6;"><span style="color:#ff9999;">HẮC<br>ÁM</span></div>
                                        </div>
                                    </div>
                                    <div class="wheel-center-cap">
                                        <div class="cap-inner"></div>
                                    </div>
                                </div>

                                <div class="spin-controls" style="display: flex; flex-direction: column; align-items: center; width: 100%;">
                                    <button id="spin-btn-v2" onclick="RewardsModule.spinWheel()" class="spin-btn-premium" 
                                        ${meritInfo.current < 5 || RewardsModule._isSpinning || hasSpunToday ? 'disabled' : ''}>
                                        ${RewardsModule._isSpinning ? '<i class="fa-solid fa-sync fa-spin"></i> COMPUTER... ' : 
                                          (hasSpunToday ? '<i class="fa-solid fa-calendar-check"></i> MAI QUAY TIẾP NHÉ' : '<i class="fa-solid fa-bolt"></i> LIỀU THÌ ĂN NHIỀU (-1đ)')}
                                    </button>
                                    <div style="margin-top: 12px; font-size: 11px; color: #10b981; font-family: monospace; letter-spacing: 1px; text-shadow: 0 0 5px #10b981;">
                                        ${hasSpunToday ? 'LIMIT: DAILY_QUOTA_EXHAUSTED' : 'SYSLOAD: STATUS_REDHOT_READY'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- RIGHT: Probability Panel -->
                    <div class="arena-right">
                        <div class="prob-panel">
                            <div class="prob-panel-title">
                                <i class="fa-solid fa-chart-bar"></i> TỶ LỆ NHÂN PHẨM
                            </div>

                            <div class="prob-row">
                                <div class="prob-label">
                                    <span class="prob-dot" style="background: #6366f1; box-shadow: 0 0 8px #6366f1;"></span>
                                    <span class="prob-name">HỤT RỒI! 😅</span>
                                </div>
                                <div class="prob-bar-track">
                                    <div class="prob-bar-fill" style="width: 55%; background: linear-gradient(90deg, #6366f1, #818cf8);"></div>
                                </div>
                                <div class="prob-meta">
                                    <span class="prob-value">55.0%</span>
                                </div>
                            </div>
                            
                            <div class="prob-row">
                                <div class="prob-label">
                                    <span class="prob-dot" style="background: #10b981; box-shadow: 0 0 8px #10b981;"></span>
                                    <span class="prob-name">Hòa vốn (+1đ)</span>
                                </div>
                                <div class="prob-bar-track">
                                    <div class="prob-bar-fill" style="width: 15%; background: linear-gradient(90deg, #10b981, #34d399);"></div>
                                </div>
                                <div class="prob-meta">
                                    <span class="prob-value">15.0%</span>
                                </div>
                            </div>

                            <div class="prob-row">
                                <div class="prob-label">
                                    <span class="prob-dot" style="background: #14b8a6; box-shadow: 0 0 8px #14b8a6;"></span>
                                    <span class="prob-name">Lãi nhẹ (+2đ)</span>
                                </div>
                                <div class="prob-bar-track">
                                    <div class="prob-bar-fill" style="width: 8%; background: linear-gradient(90deg, #14b8a6, #2dd4bf);"></div>
                                </div>
                                <div class="prob-meta">
                                    <span class="prob-value">8.0%</span>
                                </div>
                            </div>

                            <div class="prob-row">
                                <div class="prob-label">
                                    <span class="prob-dot" style="background: #f59e0b; box-shadow: 0 0 8px #f59e0b;"></span>
                                    <span class="prob-name">Quà Tặng 🎁</span>
                                </div>
                                <div class="prob-bar-track">
                                    <div class="prob-bar-fill" style="width: 6%; background: linear-gradient(90deg, #f59e0b, #fbbf24);"></div>
                                </div>
                                <div class="prob-meta">
                                    <span class="prob-value">6.0%</span>
                                </div>
                            </div>

                            <div class="prob-row">
                                <div class="prob-label">
                                    <span class="prob-dot" style="background: #ec4899; box-shadow: 0 0 8px #ec4899;"></span>
                                    <span class="prob-name">ĐỘC ĐẮC 💎</span>
                                </div>
                                <div class="prob-bar-track">
                                    <div class="prob-bar-fill" style="width: 2%; background: linear-gradient(90deg, #ec4899, #f472b6);"></div>
                                </div>
                                <div class="prob-meta">
                                    <span class="prob-value">2.0%</span>
                                    <span class="prob-sub">Jackpot VVIP 0.1% | Thẻ Đặc Biệt 1.9%</span>
                                </div>
                            </div>

                            <div class="prob-row">
                                <div class="prob-label">
                                    <span class="prob-dot" style="background: #06b6d4; box-shadow: 0 0 8px #06b6d4;"></span>
                                    <span class="prob-name">Hũ lớn (+5đ)</span>
                                </div>
                                <div class="prob-bar-track">
                                    <div class="prob-bar-fill" style="width: 2%; background: linear-gradient(90deg, #06b6d4, #22d3ee);"></div>
                                </div>
                                <div class="prob-meta">
                                    <span class="prob-value">2.0%</span>
                                </div>
                            </div>

                            <div class="prob-row">
                                <div class="prob-label">
                                    <span class="prob-dot" style="background: #3b82f6; box-shadow: 0 0 8px #3b82f6;"></span>
                                    <span class="prob-name">Thẻ Đặc Quyền 🃏</span>
                                </div>
                                <div class="prob-bar-track">
                                    <div class="prob-bar-fill" style="width: 7%; background: linear-gradient(90deg, #3b82f6, #60a5fa);"></div>
                                </div>
                                <div class="prob-meta">
                                    <span class="prob-value">7.0%</span>
                                </div>
                            </div>

                            <div class="prob-row" style="margin-bottom: 16px;">
                                <div class="prob-label">
                                    <span class="prob-dot" style="background: #ef4444; box-shadow: 0 0 8px #ef4444;"></span>
                                    <span class="prob-name">Hắc ám (-1đ) 💀</span>
                                </div>
                                <div class="prob-bar-track">
                                    <div class="prob-bar-fill" style="width: 5%; background: linear-gradient(90deg, #ef4444, #f87171);"></div>
                                </div>
                                <div class="prob-meta">
                                    <span class="prob-value">5.0%</span>
                                </div>
                            </div>

                            <div style="font-size: 10px; color: #475569; font-style: italic; line-height: 1.5; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 12px;">
                                * Tỷ lệ hoàn toàn tĩnh và độc lập cho từng lượt quay riêng lẻ.
                            </div>
                        </div>
                    </div>

                </div>
                <!-- ====== END WHEEL ARENA ====== -->

                <!-- CỬA HÀNG ĐẶC QUYỀN -->
                <div style="margin-top: 40px; margin-bottom: 20px; font-size: 18px; text-transform: uppercase; font-weight: 900; letter-spacing: 2px; color: #10b981; text-shadow: 0 0 10px rgba(16,185,129,0.3); display: flex; align-items: center; gap: 10px;">
                    <i class="fa-solid fa-store"></i> CỬA HÀNG ĐẶC QUYỀN CÔNG ĐỨC
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 24px; padding: 10px; margin-bottom: 40px;">
                    ${cardsHtml}
                </div>

                <!-- ĐỘI NGŨ NHÂN SỰ PREMIUM -->
                <div style="margin-top: 40px; margin-bottom: 20px; font-size: 18px; text-transform: uppercase; font-weight: 900; letter-spacing: 2px; color: #ec4899; text-shadow: 0 0 10px rgba(236,72,153,0.3); display: flex; align-items: center; gap: 10px;">
                    <i class="fa-solid fa-users-viewfinder"></i> ĐỘI NGŨ NHÂN SỰ HOLOGRAPHIC
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 24px; padding: 10px; margin-bottom: 20px;">
                    ${employeesHtml}
                </div>

                <!-- Admin History Table -->
                ${currentUser.role === 'admin' ? customHistoryHtml : ''}
            </div>
        `;
    },

    switchInvTab: (tab) => {
        const bagEl = document.getElementById('inv-bag-content');
        const histEl = document.getElementById('inv-history-content');
        if (!bagEl || !histEl) return;

        document.querySelectorAll('.inv-tab').forEach(t => t.classList.remove('active'));
        event.target.classList.add('active');

        if (tab === 'bag') {
            bagEl.style.display = 'block';
            histEl.style.display = 'none';
        } else {
            bagEl.style.display = 'none';
            histEl.style.display = 'block';
        }
    },

    useCard: async (recordId) => {
        const user = Auth.currentUser;
        if (!user) return;

        const allRewards = await RewardsModule.loadData();
        const record = allRewards.find(r => r.id === recordId && r.username === user.username);
        if (!record || record.isUsed) { Utils.showToast('Không tìm thấy thẻ hoặc đã dùng!', 'error'); return; }

        const card = RewardsModule._catalog.find(c => c.id === record.cardId);
        const cardTitle = card ? card.title : record.title;
        const cardColor = card ? card.color : '#10b981';
        const cardIcon = card ? card.icon : 'fa-ticket';

        // 1. Dựng Modal Premium
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay active';
        overlay.style.zIndex = '100000';
        overlay.style.backdropFilter = 'blur(10px)';

        const isPhysical = record.cardId === 'card_tea' || record.cardId === 'card_mystery';

        overlay.innerHTML = `
            <div class="modal glass-card" style="width: 90%; max-width: 400px; padding: 0; overflow: hidden; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); background: rgba(15, 23, 42, 0.9); animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);">
                <div style="height: 120px; background: linear-gradient(135deg, ${cardColor}, #000); display: flex; align-items: center; justify-content: center; position: relative;">
                    <i class="fa-solid ${cardIcon}" style="font-size: 60px; color: #fff; filter: drop-shadow(0 0 15px rgba(255,255,255,0.5));"></i>
                    <div style="position: absolute; bottom: -15px; width: 100%; display: flex; justify-content: center;">
                        <span style="background: #1e293b; color: #fff; padding: 4px 16px; border-radius: 20px; font-size: 11px; border: 1px solid rgba(255,255,255,0.1); text-transform: uppercase; letter-spacing: 1px;">Ready to Use</span>
                    </div>
                </div>
                
                <div style="padding: 40px 24px 24px 24px; text-align: center;">
                    <h3 style="margin: 0; font-size: 22px; font-weight: 800; color: #fff; margin-bottom: 8px;">${cardTitle}</h3>
                    <p style="margin: 0; color: #94a3b8; font-size: 14px; line-height: 1.5;">${card ? card.desc : 'Thẻ đặc quyền từ hệ thống.'}</p>
                    
                    <div style="margin-top: 30px; display: flex; flex-direction: column; gap: 12px;">
                        ${isPhysical ? `
                            <button id="card-use-gift" class="btn" style="background: ${cardColor}; color: #fff; font-weight: 700; padding: 14px; border-radius: 12px; border: none; box-shadow: 0 4px 15px ${cardColor}44;">
                                <i class="fa-solid fa-gift"></i> NHẬN QUÀ TRỰC TIẾP
                            </button>
                            <button id="card-use-convert" class="btn" style="background: #10b981; color: #000; font-weight: 700; padding: 14px; border-radius: 12px; border: none; box-shadow: 0 4px 15px rgba(16,185,129,0.3);">
                                <i class="fa-solid fa-star"></i> ĐỔI LẤY +3 CÔNG ĐỨC
                            </button>
                        ` : `
                            <button id="card-use-standard" class="btn" style="background: ${cardColor}; color: #fff; font-weight: 700; padding: 14px; border-radius: 12px; border: none; box-shadow: 0 4px 15px ${cardColor}44;">
                                KÍCH HOẠT NGAY
                            </button>
                        `}
                        <button id="card-use-cancel" class="btn btn-text" style="color: #64748b; font-size: 13px; margin-top: 5px;">Để sau</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const close = () => overlay.remove();

        const processUse = async (mode = 'standard') => {
            record.isUsed = true;
            record.usedAt = Date.now();
            
            if (mode === 'convert') {
                // Thêm bản ghi cộng điểm
                const convertRecord = {
                    id: 'conv_' + Date.now(),
                    username: user.username,
                    timestamp: Date.now(),
                    cardId: 'merit_reward',
                    title: `Đổi ${cardTitle} lấy Merit`,
                    icon: 'fa-star',
                    color: '#10b981',
                    cost: -3 // Âm cost = cộng điểm
                };
                allRewards.push(convertRecord);
                Utils.showToast(`Đã đổi thẻ lấy +3 Công đức thành công! ✨`, 'success');
            } else {
                Utils.showToast(`Đã sử dụng thẻ "${cardTitle}" thành công! ✨`, 'success');
                Utils.notifyTelegram(`🃏 <b>[SỬ DỤNG THẺ]</b>\n👤 <b>${user.username}</b> vừa sử dụng thẻ: <b>${cardTitle}</b>`);
                
                // Action đặc biệt cho thẻ Leave
                if (record.cardId === 'card_leave' && typeof RewardsModule._autoApproveLeave === 'function') {
                    await RewardsModule._autoApproveLeave(user.username);
                }
            }

            await RewardsModule.saveData(allRewards);
            close();
            RewardsModule.render();
        };

        if (isPhysical) {
            document.getElementById('card-use-gift').onclick = () => processUse('standard');
            document.getElementById('card-use-convert').onclick = () => processUse('convert');
        } else {
            document.getElementById('card-use-standard').onclick = () => processUse('standard');
        }
        document.getElementById('card-use-cancel').onclick = close;
        overlay.onclick = (e) => { if (e.target === overlay) close(); };
    },

    useRescueCard: async (recordId) => {
        const user = Auth.currentUser;
        if (!user) return;

        // Get all accounts to show employee list
        let accounts = [];
        try {
            if (typeof DB !== 'undefined' && typeof DB.getAccounts === 'function') {
                accounts = await DB.getAccounts() || [];
            }
        } catch(e) { console.error(e); }

        // Filter out current user and admins
        const employees = accounts.filter(a => a.username !== user.username && a.role !== 'admin');

        if (employees.length === 0) {
            Utils.showToast('Không có nhân viên nào để cứu!', 'warning');
            return;
        }

        // Create employee picker overlay
        const overlay = document.createElement('div');
        overlay.id = 'rescue-picker-overlay';
        overlay.style = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.9); z-index: 9999;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            backdrop-filter: blur(10px); animation: fadeIn 0.3s ease;
        `;

        overlay.innerHTML = `
            <div style="max-width: 400px; width: 90%; background: rgba(15,23,42,0.95); border: 2px solid #ec4899; border-radius: 16px; padding: 30px; box-shadow: 0 0 50px rgba(236,72,153,0.3);">
                <h3 style="color: #ec4899; text-align: center; font-size: 20px; margin-bottom: 5px;">
                    <i class="fa-solid fa-handshake-angle"></i> THÁNH NHÂN CỨU BỒ
                </h3>
                <p style="color: #cbd5e1; text-align: center; font-size: 13px; margin-bottom: 20px;">
                    Chọn đồng nghiệp bạn muốn xóa án phạt đi muộn
                </p>
                <div style="max-height: 300px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;">
                    ${employees.map(emp => `
                        <button onclick="RewardsModule.confirmRescue('${recordId}', '${emp.username}')" 
                            style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: rgba(236,72,153,0.1); border: 1px solid rgba(236,72,153,0.3); border-radius: 10px; cursor: pointer; color: #fff; font-size: 14px; transition: all 0.3s; width: 100%;">
                            <div style="width: 40px; height: 40px; border-radius: 50%; background: ${emp.profile?.color || '#6366f1'}; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px; flex-shrink: 0;">
                                ${(emp.profile?.fullname || emp.username).charAt(0).toUpperCase()}
                            </div>
                            <div style="text-align: left;">
                                <div style="font-weight: bold;">${emp.profile?.fullname || emp.username}</div>
                                <div style="font-size: 11px; color: #94a3b8;">@${emp.username}</div>
                            </div>
                        </button>
                    `).join('')}
                </div>
                <button onclick="document.getElementById('rescue-picker-overlay').remove()" 
                    style="margin-top: 16px; width: 100%; padding: 10px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: #94a3b8; cursor: pointer; font-size: 13px;">
                    ❌ HỦY BỎ
                </button>
            </div>
        `;

        document.body.appendChild(overlay);
    },

    confirmRescue: async (recordId, targetUsername) => {
        const user = Auth.currentUser;
        if (!user) return;

        // Remove the picker overlay
        const picker = document.getElementById('rescue-picker-overlay');
        if (picker) picker.remove();

        // Load attendance data and find the most recent late record
        const allAttendance = await Attendance.loadData();
        const targetLateRecords = allAttendance.filter(r => 
            r.username === targetUsername && r.status === 'late'
        ).sort((a, b) => b.timestamp - a.timestamp);

        if (targetLateRecords.length === 0) {
            Utils.showToast(`${targetUsername} không có án phạt đi muộn nào để xóa!`, 'warning');
            return;
        }

        const latestLate = targetLateRecords[0];

        // Get target display name
        let targetDisplayName = targetUsername;
        try {
            if (typeof DB !== 'undefined' && typeof DB.getAccounts === 'function') {
                const accounts = await DB.getAccounts() || [];
                const targetAcc = accounts.find(a => a.username === targetUsername);
                if (targetAcc?.profile?.fullname) targetDisplayName = targetAcc.profile.fullname;
            }
        } catch(e) {}

        // Change the late record status to 'rescued'
        latestLate.status = 'late_excused';
        latestLate.rescuedBy = user.username;
        latestLate.rescuedAt = Date.now();
        latestLate.rescueNote = `Được ${user.username} sử dụng thẻ Thánh Nhân Cứu Bồ xóa án phạt`;
        await Attendance.saveData(allAttendance);

        // Mark the rescue card as used
        const allRewards = await RewardsModule.loadData();
        const record = allRewards.find(r => r.id === recordId && r.username === user.username);
        if (record) {
            record.isUsed = true;
            record.usedAt = Date.now();
            record.rescueTarget = targetUsername;
            await RewardsModule.saveData(allRewards);
        }

        Utils.showToast(`Đã xóa án phạt đi muộn ngày ${latestLate.dateStr} cho ${targetDisplayName}! 🦸`, 'success');
        Utils.notifyTelegram(`🦸 <b>[THÁNH NHÂN CỨU BỒ]</b>\n👤 <b>${user.username}</b> đã sử dụng thẻ để xóa án phạt đi muộn cho <b>${targetDisplayName}</b>!\n📅 Ngày: ${latestLate.dateStr}`);
        RewardsModule.render();
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
        Utils.showToast(`${card.title} đã về tay! ✨`, "success");
        RewardsModule.render();
    },

    /**
     * Lấy danh sách thẻ chưa sử dụng của user
     */
    getInventory: async (username) => {
        const all = await RewardsModule.loadData();
        return all.filter(r => r.username === username && r.cardId && r.cardId.startsWith('card_') && !r.isUsed);
    },

    /**
     * Kiểm tra xem hôm nay user có đang kích hoạt WFH không
     */
    hasActiveWFH: async (username) => {
        const all = await RewardsModule.loadData();
        const today = new Date().toLocaleDateString();
        return all.some(r => 
            r.username === username && 
            r.cardId === 'card_wfh' && 
            r.isUsed && 
            new Date(r.usedAt).toLocaleDateString() === today
        );
    },

    /**
     * Sử dụng một thẻ quà tặng
     */
    useCard: async (rewardId) => {
        const user = Auth.currentUser;
        if (!user) return;

        const allRewards = await RewardsModule.loadData();
        const rewardIdx = allRewards.findIndex(r => r.id === rewardId && r.username === user.username);
        
        if (rewardIdx === -1 || allRewards[rewardIdx].isUsed) {
            Utils.showToast("Thẻ không khả dụng hoặc đã dùng!", "error");
            return;
        }

        const reward = allRewards[rewardIdx];
        const confirm = await Utils.showConfirm("Xác nhận sử dụng", `Bạn có muốn kích hoạt thẻ [${reward.title}] ngay bây giờ không?`);
        if (!confirm) return;

        // Đánh dấu đã dùng
        allRewards[rewardIdx].isUsed = true;
        allRewards[rewardIdx].usedAt = Date.now();

        await RewardsModule.saveData(allRewards);
        Utils.showToast(`Đã kích hoạt thẻ: ${reward.title} ✨`, "success");

        // Action đặc biệt tùy loại thẻ
        if (reward.cardId === 'card_leave') {
            // Tự động tạo một yêu cầu xin nghỉ phép đã duyệt
            await RewardsModule._autoApproveLeave(user.username);
        }

        RewardsModule.render();
        // Nếu đang ở tab chấm công thì render lại bên đó
        if (typeof Attendance !== 'undefined') Attendance.render();
    },

    _autoApproveLeave: async (username) => {
        const today = new Date();
        const dateStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
        const newLeave = {
            id: 'leave_auto_' + Date.now(),
            username: username,
            startDate: dateStr,
            days: 1,
            reason: "Sử dụng Thẻ Nghỉ Phép May Mắn",
            status: 'approved',
            timestamp: Date.now(),
            resolvedBy: 'system'
        };
        const allLeaves = await Attendance.loadLeaveData();
        allLeaves.push(newLeave);
        await Attendance.saveLeaveData(allLeaves);
    },

    spinWheel: async () => {
        if (RewardsModule._isSpinning) return;
        
        const user = Auth.currentUser;
        if (!user) return;

        const meritInfo = await RewardsModule.calcUserMerit(user.username);
        const threshold = 5.0;

        if (meritInfo.current < threshold) {
            Utils.showToast(`Bạn cần tích lũy tối thiểu ${threshold}đ Công đức để có thể bắt đầu quay hũ!`, "warning");
            return;
        }

        if (meritInfo.current < 1) {
            Utils.showToast("Bạn không đủ Công Đức để quay hũ!", "error");
            return;
        }

        // Kiểm tra giới hạn 1 lần/ngày
        const allRewardsInit = await RewardsModule.loadData();
        const today = new Date().toLocaleDateString();
        const hasSpunToday = allRewardsInit.some(r => 
            r.username === user.username && 
            r.cardId === 'wheel_entry' && 
            new Date(r.timestamp).toLocaleDateString() === today
        );
        if (hasSpunToday) {
            Utils.showToast("Mỗi ngày chỉ được quay 1 lần thôi sếp ơi!", "warning");
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

            // Tính toán kết quả theo đúng tỷ lệ tĩnh, độc lập 100% được công khai
            const prizes = [
                { label: 'Hụt rồi!', pts: 0, msg: 'Hụt rồi! May mắn lần sau nhé 😅' },
                { label: 'Hòa vốn', pts: 1, msg: 'Hòa vốn! Bạn nhận lại 1 công đức 🧧' },
                { label: 'Lãi nhẹ', pts: 2, msg: 'Lãi rồi! Chúc mừng bạn được +2 công đức 🎆' },
                { label: 'QUÀ TẶNG', pts: 0, isCash: true, amount: 10000, msg: 'MAY MẮN! Bạn trúng một PHẦN QUÀ (Tiền mặt/Nước) trị giá 10k từ Quản lý 🎁' },
                { label: 'ĐỘC ĐẮC', pts: 0, isJackpot: true, msg: 'ỐI DỒI ÔI! TRÚNG GIẢI ĐỘC ĐẮC RỒI SẾP ƠI!!! 🎉🎉🎉' },
                { label: 'Hũ lớn', pts: 5, msg: 'XUẤT SẮC! Bạn trúng hũ +5 công đức 💎' },
                { label: 'Hắc ám', pts: -1, msg: 'ỐI GIỒI ÔI! Mất sạch vốn lẫn lãi (-1đ) 💀' },
                { label: 'THẺ SỐ', pts: 0, isRandomCard: true, msg: 'SIÊU CẤP TIỆN LỢI! Bạn trúng một THẺ ĐẶC QUYỀN (WFH/Trễ/Cứu Bồ) ngẫu nhiên 🃏' }
            ];

            const rand = Math.random();
            let prizeIdx = 0;
            let isVVIP = false;

            if (rand < 0.55) {
                prizeIdx = 0; // Hụt rồi (55.0%)
            } else if (rand < 0.70) {
                prizeIdx = 1; // Hòa vốn (15.0%)
            } else if (rand < 0.78) {
                prizeIdx = 2; // Lãi nhẹ (8.0%)
            } else if (rand < 0.84) {
                prizeIdx = 3; // QUÀ TẶNG (6.0%)
            } else if (rand < 0.86) {
                prizeIdx = 4; // ĐỘC ĐẮC (2.0% tổng)
                if (Math.random() < 0.05) isVVIP = true; 
            } else if (rand < 0.88) {
                prizeIdx = 5; // Hũ lớn (2.0%)
            } else if (rand < 0.95) {
                prizeIdx = 7; // THẺ SỐ (7.0%)
            } else {
                prizeIdx = 6; // Hắc ám (5.0%)
            }

            const prize = prizes[prizeIdx];
            
            const segmentAngle = 360 / 8;
            // Dừng ở tâm của phân đoạn (offset 22.5deg)
            const stopAngle = 360 - (prizeIdx * segmentAngle) - (segmentAngle / 2); 
            
            // Logic quay chuẩn: Dừng ở stopAngle tuyệt đối tính từ 12h
            if (RewardsModule._totalRot === undefined) RewardsModule._totalRot = currentAngle;
            
            const extraSpins = 8 + Math.floor(Math.random() * 5); 
            let currentMod = RewardsModule._totalRot % 360;
            if (currentMod < 0) currentMod += 360;
            
            let distance = stopAngle - currentMod;
            if (distance <= 0) distance += 360; // Luôn quay tối thiểu 1 vòng để mượt
            
            RewardsModule._totalRot += (extraSpins * 360) + distance;
            
            wheelEl.style.transform = `rotate(${RewardsModule._totalRot}deg)`;

            // Đợi quay xong (5s)
            setTimeout(async () => {
                const result = await RewardsModule.processWheelResult(prize);
                RewardsModule.showWheelResult(prize, result?.recordId);
                RewardsModule.render();
            }, 5100);
        }, 50);
    },

    processWheelResult: async (prize) => {
        const user = Auth.currentUser;
        if (!user) return null;

        const resultId = 'spin_' + (prize.isJackpot ? 'jackpot' : (prize.isCash ? 'gift' : (prize.isRandomCard ? 'card' : 'win'))) + '_' + Date.now();
        let newRecord = null;

        if (prize.pts > 0) {
            newRecord = {
                id: resultId,
                username: user.username,
                timestamp: Date.now(),
                cardId: 'wheel_win',
                title: `🎡 Thưởng: ${prize.label}`,
                icon: 'fa-gift',
                color: '#ffd700',
                cost: -prize.pts
            };
        } else if (prize.pts < 0) {
            newRecord = {
                id: resultId,
                username: user.username,
                timestamp: Date.now(),
                cardId: 'wheel_loss',
                title: `🎡 Mất điểm: ${prize.label}`,
                icon: 'fa-skull',
                color: '#ef4444',
                cost: Math.abs(prize.pts)
            };
        } else if (prize.isRandomCard) {
            const pool = ['card_wfh', 'card_late', 'card_rescue'];
            const chosenId = pool[Math.floor(Math.random() * pool.length)];
            const card = RewardsModule._catalog.find(c => c.id === chosenId);
            newRecord = {
                id: resultId,
                username: user.username,
                timestamp: Date.now(),
                cardId: card.id,
                title: `🎡 Thẻ Đặc Quyền: ${card.title}`,
                icon: card.icon,
                color: card.color,
                cost: 0
            };
            prize.cardTitle = card.title;
        } else if (prize.isCash) {
            newRecord = {
                id: resultId,
                username: user.username,
                timestamp: Date.now(),
                cardId: 'wheel_gift_10k',
                title: `🎡 Quà Tặng: ${prize.label}`,
                icon: 'fa-box',
                color: '#fbbf24',
                cost: 0
            };
        } else if (prize.isJackpot) {
            if (prize.isVVIP) {
                newRecord = {
                    id: resultId,
                    username: user.username,
                    timestamp: Date.now(),
                    cardId: 'wheel_jackpot_vvip',
                    title: '💎 VVIP: Quản Lý Mời Chầu Buffet',
                    icon: 'fa-utensils',
                    color: '#ffd700',
                    cost: 0
                };
            } else {
                newRecord = {
                    id: resultId,
                    username: user.username,
                    timestamp: Date.now(),
                    cardId: 'mystery_pack',
                    title: '🎁 Gói Thẻ Bí Ẩn (Chưa Mở)',
                    icon: 'fa-box-open',
                    color: '#ec4899',
                    cost: 0,
                    isUnopened: true
                };
                prize.isGacha = true;
            }
        }

        if (newRecord) {
            const data = await RewardsModule.loadData();
            data.push(newRecord);
            await RewardsModule.saveData(data);
            
            // Telegram notifications
            if (prize.pts < 0) Utils.notifyTelegram(`💀 <b>[NHỌ QUÁ NHỌ]</b>\n👤 <b>${user.username}</b> vừa trúng ô <b>Mất 1 Điểm</b>!`);
            if (prize.isRandomCard) Utils.notifyTelegram(`🎰 <b>[THẺ ĐẶC QUYỀN SỐ]</b>\n👤 <b>${user.username}</b> vừa trúng thẻ <b>${prize.cardTitle}</b>!`);
            if (prize.isCash) Utils.notifyTelegram(`🎁 <b>[TRÚNG QUÀ TẶNG]</b>\n👤 <b>${user.username}</b> vừa trúng <b>Phần Quà 10k</b>!`);
            if (prize.isJackpot) {
                if (prize.isVVIP) Utils.notifyTelegram(`💎 <b>[SIÊU ĐỘC ĐẮC - VVIP]</b>\n👤 <b>${user.username}</b> vừa trúng <b>Buffet Hoành Tráng</b>!`);
                else Utils.notifyTelegram(`🎁 <b>[TRÚNG GÓI THẺ BÍ ẨN]</b>\n👤 <b>${user.username}</b> vừa trúng <b>Gói Thẻ Bí Ẩn</b>!`);
            }
        }

        return { recordId: resultId };
    },

    showWheelResult: (prize, recordId) => {
        const overlay = document.createElement('div');
        overlay.id = 'wheel-result-overlay';
        overlay.style = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.9); z-index: 9999;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            animation: fadeIn 0.5s ease; backdrop-filter: blur(10px);
        `;

        const isWin = prize.pts > 0 || prize.isCard || prize.isCash || prize.isJackpot || prize.isRandomCard;
        const color = prize.pts < 0 ? '#ef4444' : (prize.isCash ? '#fbbf24' : (prize.isJackpot ? '#ec4899' : (isWin ? '#10b981' : '#64748b')));
        
        let humorMsg = "";
        if (prize.pts < 0) {
            humorMsg = "NHỌ HƠN CÀ PHÊ! ☕ Mất thêm 1đ nữa rồi sếp ơi. Hệ thống này 'cay' thật!";
        } else if (prize.isCash) {
            humorMsg = "QUÀ TẶNG! 🎁 Hãy liên hệ Quản lý để nhận một phần quà hoặc lì xì 10k cực nóng nhé!";
        } else if (prize.isRandomCard) {
            humorMsg = `TRÚNG THẺ ĐẶC QUYỀN! 🃏 Chúc mừng bạn nhận được thẻ "<b>${prize.cardTitle}</b>" miễn phí. Thẻ đã được thêm vào túi đồ!`;
        } else if (prize.pts === 0 && !prize.isCard && !prize.isJackpot && !prize.isRandomCard) {
            humorMsg = "MAY MẮN LẦN SAU! 🍀 Đừng buồn, coi như đóng góp quỹ nước ngọt cho anh em.";
        } else if (prize.pts === 1) {
            humorMsg = "HÒA VỐN! 🧧 May quá, coi như quay miễn phí, làm nháy nữa không sếp?";
        } else if (prize.pts === 2) {
            humorMsg = "LÃI NHẸ +2đ! 📈 Sướng nhất sếp, nhặt được hạt dẻ rồi nhé!";
        } else if (prize.pts === 5) {
            humorMsg = "ĂN ĐẬM +5đ! 💎 TRỜI ƠI TIN ĐƯỢC KHÔNG? Sếp vừa 'hack' hệ thống à?";
        } else if (prize.isJackpot) {
            if (prize.isVVIP) {
                humorMsg = "💎 SIÊU THẦN THOẠI 0.1%! Bạn vừa giật giải độc đắc tối thượng: ĐƯỢC QUẢN LÝ MỜI BUFFET HOÀNH TRÁNG! 🍾";
            } else {
                humorMsg = "🎁 SIÊU CẤP MAY MẮN! Bạn vừa trúng Gói Thẻ Bí Ẩn! Hãy vào Túi Đồ để BÓC BAO THƯ xem nhận thẻ bài gì nhé! 🎫";
            }
        }

        overlay.innerHTML = `
            <style>
                @keyframes bounceIn {
                    0% { transform: scale(0.3); opacity: 0; }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); opacity: 1; }
                }
                .result-card {
                    background: rgba(20,20,30,0.9);
                    padding: 50px; border-radius: 20px;
                    border: 3px solid ${color};
                    box-shadow: 0 0 50px ${color};
                    text-align: center; max-width: 90%;
                    animation: bounceIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .result-title {
                    font-size: 80px; font-weight: 900; color: #fff;
                    margin-bottom: 20px; text-transform: uppercase;
                    text-shadow: 0 0 20px ${color}, 0 0 40px ${color};
                }
                .result-humor {
                    font-size: 28px; color: #cbd5e1;
                    margin-bottom: 30px;
                }
                .action-btns { display: flex; gap: 15px; justify-content: center; }
                .close-overlay-btn, .convert-btn {
                    padding: 20px 40px; border-radius: 12px;
                    font-weight: 900; cursor: pointer;
                    text-transform: uppercase; letter-spacing: 2px;
                    font-size: 18px; transition: all 0.2s; border: none;
                }
                .close-overlay-btn { background: ${color}; color: #000; }
                .convert-btn { background: #14b8a6; color: #fff; box-shadow: 0 0 15px #14b8a6; }
                .close-overlay-btn:hover, .convert-btn:hover { transform: scale(1.05); }
            </style>
            <div class="result-card">
                <div class="result-title">${prize.label}</div>
                <div class="result-humor">${humorMsg}</div>
                <div class="action-btns">
                    ${prize.isCash ? `
                        <button class="convert-btn" onclick="RewardsModule.convertGiftToMerit('${recordId}')">
                            <i class="fa-solid fa-bolt"></i> QUY ĐỔI +5đ CÔNG ĐỨC
                        </button>
                    ` : ''}
                    <button class="close-overlay-btn" onclick="document.getElementById('wheel-result-overlay').remove()">
                        ${prize.isCash ? 'GIỮ LẠI QUÀ' : 'ĐÓNG'}
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    convertGiftToMerit: async (recordId) => {
        const user = Auth.currentUser;
        if (!user) return;

        const allRewards = await RewardsModule.loadData();
        const giftIdx = allRewards.findIndex(r => r.id === recordId && r.username === user.username);
        if (giftIdx === -1) { Utils.showToast('Không tìm thấy quà!', 'error'); return; }

        allRewards[giftIdx] = {
            id: 'convert_' + Date.now(),
            username: user.username,
            timestamp: Date.now(),
            cardId: 'wheel_win_converted',
            title: '🎡 Quy đổi: QUÀ TẶNG ➔ +3đ',
            icon: 'fa-bolt',
            color: '#14b8a6',
            cost: -3
        };

        await RewardsModule.saveData(allRewards);
        Utils.showToast("Đã quy đổi thành +3 điểm Công Đức! ✨", "success");
        const overlay = document.getElementById('wheel-result-overlay');
        if (overlay) overlay.remove();
        RewardsModule.render();
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
    },

    openMysteryPack: async (recordId) => {
        const user = Auth.currentUser;
        if (!user) return;

        const allRewards = await RewardsModule.loadData();
        const packRecord = allRewards.find(r => r.id === recordId && r.username === user.username && r.isUnopened);
        if (!packRecord) {
            Utils.showToast("Không tìm thấy gói thẻ bí ẩn hợp lệ hoặc gói đã được mở!", "error");
            return;
        }

        // Chọn ngẫu nhiên 1 thẻ đặc quyền từ cửa hàng (loại trừ card_mystery bản thân nó để tránh vô hạn)
        const validCards = RewardsModule._catalog.filter(c => c.id !== 'card_mystery');
        const luckyCard = validCards[Math.floor(Math.random() * validCards.length)];

        // Cập nhật bản ghi thành thẻ được mở
        packRecord.cardId = luckyCard.id;
        packRecord.title = `🎁 Đã Mở: Thẻ ${luckyCard.title}`;
        packRecord.icon = luckyCard.icon;
        packRecord.color = luckyCard.color;
        packRecord.isUnopened = false;
        packRecord.openedAt = Date.now();

        await RewardsModule.saveData(allRewards);

        // Hiển thị hiệu ứng gacha mở thẻ bài hoành tráng
        RewardsModule.showGachaOpeningEffect(luckyCard, () => {
            Utils.showToast(`Bóc bao thành công: Thẻ ${luckyCard.title}!`, "success");
            // Gửi Telegram
            Utils.notifyTelegram(`🎁 <b>[MỞ GÓI THẺ BÍ ẨN]</b>\n👤 Nhân sự: <b>${user.username}</b>\n🎫 Đã bóc bao nhận ngay Thẻ Đặc Quyền: <b>${luckyCard.title}</b>!`);
            RewardsModule.render();
        });
    },

    showGachaOpeningEffect: (card, onComplete) => {
        const overlay = document.createElement('div');
        overlay.id = 'gacha-opening-overlay';
        overlay.style = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(8,8,12,0.98); z-index: 10000;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            overflow: hidden; font-family: 'Inter', sans-serif; color: #fff;
        `;

        overlay.innerHTML = `
            <style>
                .gacha-bg-glow {
                    position: absolute; width: 600px; height: 600px;
                    background: radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%);
                    z-index: 1; pointer-events: none;
                    animation: pulseGlowBg 4s infinite alternate;
                }
                @keyframes pulseGlowBg {
                    0% { transform: scale(1); opacity: 0.6; }
                    100% { transform: scale(1.2); opacity: 1; }
                }
                .gacha-stage {
                    position: relative; z-index: 2;
                    display: flex; flex-direction: column; align-items: center;
                    justify-content: center; width: 100%; height: 100%;
                }
                .gacha-pack-container {
                    perspective: 1000px; cursor: pointer;
                    transition: all 0.3s;
                }
                .gacha-pack {
                    width: 240px; height: 350px;
                    background: linear-gradient(135deg, #1e1b4b, #2e1065);
                    border: 3px solid #ec4899; border-radius: 16px;
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    box-shadow: 0 0 30px rgba(236,72,153,0.4), inset 0 0 20px rgba(0,0,0,0.6);
                    position: relative; transition: all 0.3s ease;
                }
                .gacha-pack::before {
                    content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
                    background: linear-gradient(45deg, transparent, rgba(255,255,255,0.05), transparent);
                    transform: rotate(45deg); animation: cardShine 3s infinite linear;
                }
                .gacha-pack-seal {
                    position: absolute; top: 20px;
                    width: 40px; height: 40px; border-radius: 50%;
                    background: #ec4899; color: #fff;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 18px; box-shadow: 0 0 15px #ec4899;
                }
                .gacha-pack:hover {
                    transform: scale(1.05) rotateY(8deg);
                    box-shadow: 0 0 50px rgba(236,72,153,0.7), 0 0 35px rgba(139,92,246,0.5);
                    border-color: #8b5cf6;
                }
                .gacha-pack.shake {
                    animation: packShake 0.15s infinite alternate;
                }
                @keyframes packShake {
                    0% { transform: translate(5px, 5px) rotate(1deg); }
                    100% { transform: translate(-5px, -5px) rotate(-1deg); }
                }
                .gacha-flash {
                    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                    background: #fff; z-index: 99; opacity: 0; pointer-events: none;
                }
                .gacha-flash.active {
                    animation: flashAnim 0.8s ease-out forwards;
                }
                @keyframes flashAnim {
                    0% { opacity: 0; }
                    20% { opacity: 1; }
                    100% { opacity: 0; }
                }
                
                /* Thẻ bài sau khi mở */
                .gacha-card-reveal {
                    display: none; flex-direction: column; align-items: center;
                    animation: scaleUpReveal 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
                @keyframes scaleUpReveal {
                    0% { transform: scale(0.1) rotateY(180deg); opacity: 0; }
                    100% { transform: scale(1) rotateY(360deg); opacity: 1; }
                }
                
                .gacha-close-btn {
                    opacity: 0; transform: translateY(20px);
                    transition: all 0.5s ease 0.8s;
                }
                .gacha-close-btn.visible {
                    opacity: 1; transform: translateY(0);
                }
            </style>
            <div class="gacha-bg-glow"></div>
            <div class="gacha-flash" id="gacha-flash-screen"></div>
            <div class="gacha-stage">
                <!-- Màn 1: Gói thẻ bài chờ bốc -->
                <div class="gacha-pack-container" id="gacha-pack-envelope" onclick="RewardsModule.triggerPackRip('${card.id}')">
                    <div class="gacha-pack">
                        <div class="gacha-pack-seal"><i class="fa-solid fa-certificate"></i></div>
                        <i class="fa-solid fa-envelope-open-text" style="font-size: 80px; color: #ffd700; filter: drop-shadow(0 0 25px #ffd700); margin-bottom: 20px; animation: pulseGlow 1.5s infinite;"></i>
                        <div style="font-size: 19px; font-weight: 900; color: #fff; letter-spacing: 2px; text-transform: uppercase;">GÓI THẺ BÍ ẨN</div>
                        <div style="font-size: 11px; color: #cbd5e1; text-transform: uppercase; margin-top: 10px; letter-spacing: 1px; animation: pulseGlow 1s infinite alternate;">Nhấp Vào Bao Để Bóc Thẻ</div>
                    </div>
                </div>

                <!-- Màn 2: Thẻ bài lộ diện -->
                <div class="gacha-card-reveal" id="gacha-card-reveal-box">
                    <div class="tcg-digital-card" style="--card-color: ${card.color}; cursor: default; margin-bottom: 20px; box-shadow: 0 0 50px ${card.color}; pointer-events: none;">
                        <div class="tcg-card-inner">
                            <div class="tcg-card-cost">
                                <i class="fa-solid fa-star"></i> ${card.cost}
                            </div>
                            <div class="tcg-card-art">
                                <i class="fa-solid ${card.icon}" style="text-shadow: 0 0 25px ${card.color};"></i>
                                <div class="tcg-art-overlay"></div>
                            </div>
                            <div class="tcg-card-body">
                                <div class="tcg-card-type"><i class="fa-solid fa-microchip"></i> ĐẶC QUYỀN SỐ</div>
                                <div class="tcg-card-title">${card.title}</div>
                                <p class="tcg-card-desc">${card.desc}</p>
                            </div>
                            <div class="tcg-card-footer">
                                <span class="status-ready" style="color: ${card.color}; font-weight: bold;"><i class="fa-solid fa-gift"></i> ĐÃ BÓC THÀNH CÔNG</span>
                            </div>
                        </div>
                    </div>
                    <h2 style="font-size: 26px; font-weight: 900; color: #fff; text-shadow: 0 0 15px ${card.color}; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 2px;">
                        Chúc mừng bạn!
                    </h2>
                    <p style="color: #cbd5e1; font-size: 14px; margin-bottom: 25px;">Bạn đã nhận được Thẻ Đặc Quyền <strong>${card.title}</strong> cực chất!</p>
                    <button class="gacha-close-btn spin-btn-premium" id="gacha-finish-btn" style="padding: 12px 35px; font-size: 15px;">
                        ĐÚT KHO & ĐÓNG <i class="fa-solid fa-circle-check" style="margin-left: 6px;"></i>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        RewardsModule._gachaOnComplete = onComplete;
    },

    triggerPackRip: (cardId) => {
        const packEl = document.getElementById('gacha-pack-envelope');
        const flashEl = document.getElementById('gacha-flash-screen');
        const revealEl = document.getElementById('gacha-card-reveal-box');
        const finishBtn = document.getElementById('gacha-finish-btn');
        
        if (!packEl || packEl.classList.contains('shake')) return;

        // Bật âm thanh nếu có
        if (typeof AttendanceMusic !== 'undefined' && typeof AttendanceMusic.playRewardSound === 'function') {
            AttendanceMusic.playRewardSound();
        }

        // Tạo hiệu ứng rung lắc bao thư
        packEl.classList.add('shake');

        setTimeout(() => {
            // Flash sáng trắng cực đại
            flashEl.classList.add('active');

            setTimeout(() => {
                // Ẩn bao thư, hiện thẻ bài
                packEl.style.display = 'none';
                revealEl.style.display = 'flex';
                
                // Show nút Đóng
                setTimeout(() => {
                    finishBtn.classList.add('visible');
                    // Gán sự kiện cho nút để gọi callback
                    finishBtn.onclick = () => {
                        document.getElementById('gacha-opening-overlay').remove();
                        if (typeof RewardsModule._gachaOnComplete === 'function') {
                            RewardsModule._gachaOnComplete();
                        }
                    };
                }, 200);
            }, 200);
        }, 1200);
    }
};
