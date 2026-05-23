/**
 * Pet Chibi Avatar Builder Module
 * Phong cách Zepeto / Gacha Life - SVG Composite Layers
 */

const ChibiModule = {
    // Preset Colors
    colors: {
        skin: [
            '#ffe0bd', // Hồng hào sáng
            '#ffcd94', // Kem tự nhiên
            '#e0ac69', // Bánh mật ngọt ngào
            '#c68642', // Nâu ấm áp
            '#8d5524', // Nâu sô-cô-la
            '#3c1f06', // Đen mun huyền bí
            '#00f3ff', // Xanh người ngoài hành tinh
            '#a78bfa'  // Tím pastel mộng mơ
        ],
        hair: [
            '#111827', // Đen huyền
            '#4b5563', // Xám tro
            '#7c2d12', // Nâu đỏ auburn
            '#d97706', // Vàng bạch kim
            '#ec4899', // Hồng neon cực cháy
            '#8b5cf6', // Tím thủy chung
            '#10b981', // Xanh lục bảo
            '#3b82f6', // Xanh đại dương
            '#f3f4f6'  // Trắng tuyết
        ],
        clothing: [
            '#ef4444', // Đỏ rực rỡ
            '#ec4899', // Hồng ngọt ngào
            '#8b5cf6', // Tím mộng mơ
            '#3b82f6', // Xanh thanh lịch
            '#06b6d4', // Cyan mát lạnh
            '#10b981', // Xanh lá tươi
            '#eab308', // Vàng nắng
            '#f97316', // Cam nhiệt đới
            '#1f2937', // Đen tối thượng
            '#ffffff'  // Trắng tinh khôi
        ]
    },

    // Style Count configuration (0 index to Max-1)
    counts: {
        skin: 8,
        hair: 12,
        eyes: 8,
        mouth: 6,
        top: 10,
        bottom: 8,
        shoe: 8,
        accessory: 14, // Head/Glasses (0-13)
        gear: 20,     // Weapons (0-19)
        wing: 8,      // Wings (0-7)
        mount: 5,     // Vehicles (0-4)
        dragon: 4     // Dragon Spirits (0-3)
    },

    // State
    currentConfig: null,
    activeTab: 'skin',

    gearRequirements: {
        gear: {
            1: { label: "Đại Đao Lửa", count: 10 },
            2: { label: "Súng Vô Cực", count: 12 },
            3: { label: "Kiếm Cyber Laser", count: 15 },
            4: { label: "Thương Heo Tộc", count: 5 },
            5: { label: "Dép Tổ Ong Vàng", count: 3 },
            6: { label: "Chổi Tre Âm Dương", count: 7 },
            7: { label: "Muỗng Mì Hảo Hạng", count: 6 },
            8: { label: "Gậy Selfie Cánh Vàng", count: 20 },
            9: { label: "Cờ Lê Tia Chớp", count: 14 },
            10: { label: "Cây Lau Nhà Ma Thuật", count: 8 },
            11: { label: "Nón Lá Phi Tiêu", count: 18 },
            12: { label: "Vợt Muỗi Điện", count: 12 },
            13: { label: "Ghế Đỏ Quyền Lực", count: 25 },
            14: { label: "Quạt Trúc Thanh Lương", count: 10 },
            15: { label: "Lồng Đèn Hội An", count: 12 },
            16: { label: "Gánh Hàng Rong", count: 15 },
            17: { label: "Bánh Mì Sài Gòn", count: 5 },
            18: { label: "Cà Phê Phin", count: 8 },
            19: { label: "Dép Tổ Ong Huyền Thoại", count: 4 }
        },
        mount: {
            1: { label: "Ô Tô Siêu Cấp", count: 20 },
            2: { label: "Xe Máy Cực Ngầu", count: 18 },
            3: { label: "Phao Hồng Hạc", count: 8 },
            4: { label: "Xe Máy Dream Neon", count: 22 }
        },
        wing: {
            1: { label: "Cánh Thiên Thần", count: 22 },
            2: { label: "Cánh Ác Quỷ", count: 25 },
            3: { label: "Cánh Thiên Thần VIP", count: 30 },
            4: { label: "Cánh Bướm Pha Lê", count: 35 },
            5: { label: "Cánh Phượng Hoàng Lửa", count: 40 },
            6: { label: "Cánh Dơi Hắc Ám", count: 45 },
            7: { label: "Cánh Băng Tuyết VIP", count: 50 }
        },
        dragon: {
            1: { label: "Lam Long Thần", count: 30 },
            2: { label: "Xích Long Thần", count: 35 },
            3: { label: "Hoàng Long Thần", count: 50 }
        },
        accessory: {
            11: { label: "Mũ Cối Kháng Chiến", count: 10 },
            12: { label: "Nón Lá Truyền Thống", count: 12 },
            13: { label: "Khăn Rằn Nam Bộ", count: 8 }
        }
    },

    getCompletedTasksCount: function() {
        if (typeof Auth === 'undefined' || !Auth.currentUser) return 0;
        if (typeof WorkModule === 'undefined' || !WorkModule.data || !WorkModule.data.tasks) return 0;

        const username = Auth.currentUser.username;
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        let count = 0;
        WorkModule.data.tasks.forEach(t => {
            if (t.owner !== username) return;

            const status = (t.trangThai || '').toLowerCase();
            const isCompleted = status.includes('done') || status.includes('hoàn thành');
            if (!isCompleted) return;

            let taskMonth = -1;
            let taskYear = -1;
            const dateStr = t.ngayDang || t.deadline || '';
            if (dateStr.includes('-')) {
                const parts = dateStr.split('-');
                if (parts.length >= 2) {
                    taskYear = parseInt(parts[0], 10);
                    taskMonth = parseInt(parts[1], 10);
                }
            } else if (dateStr.includes('/')) {
                const parts = dateStr.split('/');
                if (parts.length === 3) {
                    taskYear = parseInt(parts[2], 10);
                    taskMonth = parseInt(parts[1], 10);
                }
            }

            if (taskMonth === currentMonth && taskYear === currentYear) {
                count++;
            }
        });
        return count;
    },

    isGearLocked: function(index) {
        // [MODIFIED] VIP Unlock for testing - Always return false
        return false;
        
        /* Original logic:
        if (index <= 10) return false;
        if (typeof Auth === 'undefined' || !Auth.currentUser) return true;
        if (Auth.currentUser.role === 'admin') return false;

        const req = ChibiModule.gearRequirements[index];
        if (!req) return false;

        const completed = ChibiModule.getCompletedTasksCount();
        return completed < req.count;
        */
    },

    /**
     * Render complete composite Chibi SVG
     */
    renderChibiSVG: function(config, isDancing, meritPoints) {
        const c = config || {
            gender: 'nam',
            skinColor: '#ffd1a9',
            hairStyle: 1,
            hairColor: '#343a40',
            eyeStyle: 0,
            mouthStyle: 0,
            topStyle: 1,
            topColor: '#e83e8c',
            bottomStyle: 1,
            bottomColor: '#007bff',
            shoeStyle: 1,
            shoeColor: '#1f2937',
            accessory: 0,
            gear: 0,
            wing: 0,
            mount: 0,
            dragon: 0
        };

        const isD = isDancing !== undefined ? isDancing : true;
        const pts = meritPoints !== undefined ? meritPoints : 0;

        const gender = c.gender || 'nam';
        const skinColor = c.skinColor || '#ffd1a9';
        const hairColor = c.hairColor || '#343a40';
        const topColor = c.topColor || '#e83e8c';
        const bottomColor = c.bottomColor || '#007bff';
        const shoeStyle = c.shoeStyle !== undefined ? c.shoeStyle : 1;
        const shoeColor = c.shoeColor || '#1f2937';

        // 0. Dynamic ViewBox & Scaling
        let viewBox = "0 0 200 200";
        // Expand if any large item is equipped
        if (c.gear > 0 || c.wing > 0 || c.mount > 0 || c.dragon > 0 || (c.accessory >= 11 && c.accessory <= 18)) {
            viewBox = "-55 -55 310 310";
        }

        // 1. Dragon Spirit Layer (Far Back)
        let dragonHtml = '';
        if (c.dragon === 1) { // Blue Dragon (Lam Long)
            dragonHtml = `
                <g class="dragon-wrap" style="filter: drop-shadow(0 0 15px #00f3ff) drop-shadow(0 0 30px #3b82f6);">
                    <!-- Majestic Blue Dragon Spiraling around -->
                    <path d="M 50 150 Q 0 100 50 50 Q 100 0 150 50 Q 200 100 150 150 Q 100 200 50 150" fill="none" stroke="url(#blueDragonGrad)" stroke-width="12" stroke-linecap="round" stroke-dasharray="10,5" style="animation: dragonFloat 4s infinite linear;" />
                    <g style="animation: dragonFloat 4s infinite linear;">
                         <circle cx="50" cy="150" r="10" fill="#00f3ff" />
                         <path d="M 45 150 L 35 140 L 40 160 Z" fill="#00f3ff" />
                    </g>
                </g>
                <defs>
                    <linearGradient id="blueDragonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stop-color="#00f3ff" /><stop offset="100%" stop-color="#3b82f6" />
                    </linearGradient>
                </defs>
            `;
        } else if (c.dragon === 2) { // Red Dragon (Xích Long)
            dragonHtml = `
                <g class="dragon-wrap" style="filter: drop-shadow(0 0 15px #ef4444) drop-shadow(0 0 30px #7f1d1d);">
                    <path d="M 30 170 Q 170 170 170 30 Q 30 30 30 170" fill="none" stroke="url(#redDragonGrad)" stroke-width="14" stroke-linecap="round" stroke-dasharray="15,8" style="animation: dragonFloat 3s infinite linear reverse;" />
                    <circle cx="30" cy="170" r="12" fill="#ef4444" style="animation: dragonFloat 3s infinite linear reverse;" />
                </g>
                <defs>
                    <linearGradient id="redDragonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stop-color="#ef4444" /><stop offset="100%" stop-color="#7f1d1d" />
                    </linearGradient>
                </defs>
            `;
        } else if (c.dragon === 3) { // Gold Dragon (Hoàng Long)
            dragonHtml = `
                <g class="dragon-wrap" style="filter: drop-shadow(0 0 20px #fbbf24) drop-shadow(0 0 40px #d97706);">
                    <path d="M 0 100 Q 100 -20 200 100 Q 100 220 0 100" fill="none" stroke="url(#goldDragonGrad)" stroke-width="15" stroke-linecap="round" stroke-dasharray="20,10" style="animation: dragonFloat 5s infinite linear;" />
                    <g style="animation: dragonFloat 5s infinite linear;">
                        <circle cx="0" cy="100" r="14" fill="#fbbf24" />
                        <path d="M -5 100 L -15 90 L -15 110 Z" fill="#fbbf24" />
                    </g>
                </g>
                <defs>
                    <linearGradient id="goldDragonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stop-color="#fff" /><stop offset="40%" stop-color="#fbbf24" /><stop offset="100%" stop-color="#d97706" />
                    </linearGradient>
                </defs>
            `;
        }

        // 2. Wing Layer (Behind Back)
        let wingHtml = '';
        if (c.wing === 1) { // Angel Wings
            wingHtml = `
                <g class="${isD ? 'chibi-tail-dance' : ''}" style="filter: drop-shadow(0 0 15px #fbbf24);">
                    <path d="M 100 110 C 20 70 -40 160 60 170 M 100 110 C 180 70 240 160 140 170" fill="rgba(255,255,255,0.9)" stroke="#fbbf24" stroke-width="3.5" />
                    <path d="M 60 170 Q 100 140 140 170" fill="none" stroke="#fbbf24" stroke-width="1" opacity="0.3" />
                </g>
            `;
        } else if (c.wing === 2) { // Devil Wings
            wingHtml = `
                <g class="${isD ? 'chibi-tail-dance' : ''}" style="filter: drop-shadow(0 0 15px #ef4444);">
                    <path d="M 100 110 C 30 60 -10 140 50 170 M 100 110 C 170 60 210 140 150 170" fill="#111" stroke="#ef4444" stroke-width="4" />
                    <path d="M 100 110 L 40 100 M 100 110 L 160 100" stroke="#ef4444" stroke-width="2" opacity="0.4" />
                </g>
            `;
        } else if (c.wing === 3) { // Golden Angel Wings VIP
            wingHtml = `
                <g class="${isD ? 'chibi-tail-dance' : ''}" style="filter: drop-shadow(0 0 15px #f97316);">
                    <path d="M 100 110 C 40 40 10 20 -10 60 C -25 90 0 130 40 135 C 10 135 0 150 15 175 C 30 195 60 185 90 165 C 60 175 45 195 65 210 Q 100 230 100 170" fill="#fbbf24" stroke="#fff" stroke-width="0.5" />
                    <g transform="translate(100, 110) scale(-1, 1) translate(-100, -110)">
                        <path d="M 100 110 C 40 40 10 20 -10 60 C -25 90 0 130 40 135 C 10 135 0 150 15 175 C 30 195 60 185 90 165 C 60 175 45 195 65 210 Q 100 230 100 170" fill="#fbbf24" stroke="#fff" stroke-width="0.5" />
                    </g>
                </g>
            `;
        } else if (c.wing === 4) { // Crystal Butterfly Wings
            wingHtml = `
                <g class="${isD ? 'chibi-tail-dance' : ''}" style="filter: drop-shadow(0 0 12px #8b5cf6);">
                    <path d="M 100 120 C 50 50 10 30 -5 85 C -15 130 30 160 50 145 C 30 180 50 210 90 195 C 100 185 100 140 100 120" fill="#c084fc" opacity="0.8" stroke="#fff" />
                    <g transform="translate(100, 120) scale(-1, 1) translate(-100, -120)">
                        <path d="M 100 120 C 50 50 10 30 -5 85 C -15 130 30 160 50 145 C 30 180 50 210 90 195 C 100 185 100 140 100 120" fill="#c084fc" opacity="0.8" stroke="#fff" />
                    </g>
                </g>
            `;
        } else if (c.wing === 5) { // Fire Phoenix Wings
            wingHtml = `
                <g class="${isD ? 'chibi-tail-dance' : ''}" style="filter: drop-shadow(0 0 20px #ef4444) drop-shadow(0 0 40px #f59e0b);">
                    <path d="M 100 110 C 20 40 -60 140 40 160 M 100 110 C 180 40 260 140 160 160" fill="url(#fireWingGrad)" stroke="#fff" stroke-width="0.5" />
                    <path d="M 100 110 L 10 100 M 100 110 L 190 100" stroke="#fef08a" stroke-width="2" opacity="0.5" />
                    <defs>
                        <linearGradient id="fireWingGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stop-color="#fef08a" /><stop offset="50%" stop-color="#f97316" /><stop offset="100%" stop-color="#991b1b" />
                        </linearGradient>
                    </defs>
                </g>
            `;
        } else if (c.wing === 6) { // Dark Bat Wings
            wingHtml = `
                <g class="${isD ? 'chibi-tail-dance' : ''}" style="filter: drop-shadow(0 0 15px #a855f7);">
                    <path d="M 100 110 C 30 40 -30 140 50 200 L 100 110 C 170 40 230 140 150 200 Z" fill="#2e1065" stroke="#a855f7" stroke-width="3" />
                    <path d="M 100 110 L 50 150 M 100 110 L 150 150" stroke="#fff" stroke-width="1" opacity="0.2" />
                </g>
            `;
        } else if (c.wing === 7) { // Ice Wings
            wingHtml = `
                <g class="${isD ? 'chibi-tail-dance' : ''}" style="filter: drop-shadow(0 0 18px #06b6d4);">
                    <path d="M 100 110 L 20 60 L 50 120 L 20 160 L 100 120 L 180 160 L 150 120 L 180 60 Z" fill="rgba(165, 243, 252, 0.7)" stroke="#fff" stroke-width="2" />
                    <path d="M 100 110 L 30 100 M 100 110 L 170 100" stroke="#fff" stroke-width="3" stroke-dasharray="8 4" />
                </g>
            `;
        }

        // 3. Back Hair Layer
        let backHairHtml = '';
        if (c.hairStyle === 2) { // Bob cut back hair
            backHairHtml = `<path d="M 60 75 Q 100 40 140 75 L 142 105 Q 100 110 58 105 Z" fill="${hairColor}" stroke="#1e1b4b" stroke-width="2.5" />`;
        } else if (c.hairStyle === 3) { // Ponytail tail
            backHairHtml = `<path class="${isD ? 'chibi-tail-dance' : ''}" d="M 136 76 Q 165 70 170 95 Q 165 120 140 100 Z" fill="${hairColor}" stroke="#1e1b4b" stroke-width="2.5" />`;
        } else if (c.hairStyle === 5) { // Long wavy back hair
            backHairHtml = `<path d="M 60 75 C 50 100 52 135 60 150 C 70 160 85 155 90 145 C 92 140 88 120 88 114 Q 100 112 112 114 C 112 120 108 140 110 145 C 115 155 130 160 140 150 C 148 135 150 100 140 75 Z" fill="${hairColor}" stroke="#1e1b4b" stroke-width="2.5" />`;
        } else if (c.hairStyle === 7) { // Twin Tails
            backHairHtml = `
                <path class="${isD ? 'chibi-tail-dance' : ''}" d="M 62 72 C 30 70 25 105 40 115 C 50 120 55 100 58 85 Z" fill="${hairColor}" stroke="#1e1b4b" stroke-width="2.5" />
                <path class="${isD ? 'chibi-tail-dance' : ''}" d="M 138 72 C 170 70 175 105 160 115 C 150 120 145 100 142 85 Z" fill="${hairColor}" stroke="#1e1b4b" stroke-width="2.5" />
            `;
        }

        // 4. Custom Arms configuration
        let armsHtml = '';
        if (c.mount === 1 || c.mount === 2 || c.accessory === 14 || c.accessory === 15) {
            // Vehicle hands
            armsHtml = `
                <path d="M 85 116 Q 74 125 91 116" fill="${skinColor}" stroke="#1e1b4b" stroke-width="2.5" />
                <circle cx="91" cy="116" r="4.8" fill="${skinColor}" stroke="#1e1b4b" stroke-width="1.2" />
                <path d="M 115 116 Q 126 125 109 116" fill="${skinColor}" stroke="#1e1b4b" stroke-width="2.5" />
                <circle cx="109" cy="116" r="4.8" fill="${skinColor}" stroke="#1e1b4b" stroke-width="1.2" />
            `;
        } else {
            armsHtml = `
                <path class="${isD ? 'chibi-arm-left-dance' : ''}" d="M 85 116 Q 66 128 64 140 C 63 145 69 146 72 142 L 85 125 Z" fill="${skinColor}" stroke="#1e1b4b" stroke-width="2.5" />
                <path class="${isD ? 'chibi-arm-right-dance' : ''}" d="M 115 116 Q 134 128 136 140 C 137 145 131 146 128 142 L 115 125 Z" fill="${skinColor}" stroke="#1e1b4b" stroke-width="2.5" />
            `;
        }

        // 5. Body Parts (Assemble in correct order)
        const bodyBaseHtml = `
            <rect x="96" y="104" width="8" height="12" fill="${skinColor}" stroke="#1e1b4b" stroke-width="2.5" />
            <path d="M 86 145 Q 83 165 82 175 C 81 180 89 182 91 176 L 95 145 Z" fill="${skinColor}" stroke="#1e1b4b" stroke-width="2.5" />
            <path d="M 114 145 Q 117 165 118 175 C 119 180 111 182 109 176 L 105 145 Z" fill="${skinColor}" stroke="#1e1b4b" stroke-width="2.5" />
            <path d="M 88 114 Q 100 112 112 114 L 115 145 Q 100 148 85 145 Z" fill="${skinColor}" stroke="#1e1b4b" stroke-width="2.5" />
            ${armsHtml}
            <circle cx="62" cy="80" r="7" fill="${skinColor}" stroke="#1e1b4b" stroke-width="2.5" />
            <circle cx="138" cy="80" r="7" fill="${skinColor}" stroke="#1e1b4b" stroke-width="2.5" />
            <ellipse cx="100" cy="80" rx="36" ry="32" fill="${skinColor}" stroke="#1e1b4b" stroke-width="2.5" />
            <ellipse cx="76" cy="86" rx="4" ry="2" fill="#f43f5e" opacity="0.45" />
            <ellipse cx="124" cy="86" rx="4" ry="2" fill="#f43f5e" opacity="0.45" />
        `;

        // 6. Clothing Selection
        let bottomHtml = '';
        if (c.bottomStyle === 1) bottomHtml = `<path d="M 84 138 L 116 138 L 118 160 L 102 160 L 100 146 L 98 160 L 82 160 Z" fill="${bottomColor}" stroke="#1e1b4b" stroke-width="2.5" />`;
        else if (c.bottomStyle === 2) bottomHtml = `<path d="M 85 138 L 115 138 L 122 154 Q 100 158 78 154 Z" fill="${bottomColor}" stroke="#1e1b4b" stroke-width="2.5" />`;
        else if (c.bottomStyle === 3) bottomHtml = `<path d="M 84 138 L 116 138 L 117 150 L 102 150 L 100 144 L 98 150 L 83 150 Z" fill="${bottomColor}" stroke="#1e1b4b" stroke-width="2.5" />`;
        else if (c.bottomStyle === 6) bottomHtml = `<path d="M 84 138 L 116 138 L 118 160 L 102 160 L 100 146 L 98 160 L 82 160 Z" fill="${bottomColor}" stroke="#1e1b4b" stroke-width="2.5" /><line x1="83" y1="145" x2="97" y2="145" stroke="#00f3ff" stroke-width="2" />`;

        let topHtml = '';
        if (c.topStyle === 1) topHtml = `<path d="M 88 114 Q 100 112 112 114 L 115 138 Q 100 140 85 138 Z" fill="${topColor}" stroke="#1e1b4b" stroke-width="2.5" />`;
        else if (c.topStyle === 2) topHtml = `<path d="M 80 114 C 80 102 120 102 120 114 Z" fill="${topColor}" stroke="#1e1b4b" stroke-width="2.5" /><path d="M 85 114 Q 100 112 115 114 L 116 142 Q 100 145 84 142 Z" fill="${topColor}" stroke="#1e1b4b" stroke-width="2.5" />`;
        else if (c.topStyle === 9) topHtml = `<path d="M 88 114 Q 100 112 112 114 L 115 140 Q 100 142 85 140 Z" fill="${topColor}" stroke="#1e1b4b" stroke-width="2.5" /><circle cx="100" cy="126" r="4.5" fill="#00f3ff" style="filter: drop-shadow(0 0 4px #00f3ff);" />`;

        let shoeHtml = '';
        if (shoeStyle === 1) shoeHtml = `<path d="M 78 171 L 91 171 L 93 182 L 80 182 Z" fill="${shoeColor}" stroke="#1e1b4b" stroke-width="2" /><path d="M 122 171 L 109 171 L 107 182 L 120 182 Z" fill="${shoeColor}" stroke="#1e1b4b" stroke-width="2" />`;

        // 7. Face Layer
        let eyesHtml = `<circle cx="84" cy="80" r="6" fill="#1e1b4b" /><circle cx="116" cy="80" r="6" fill="#1e1b4b" />`;
        if (c.eyeStyle === 1) eyesHtml = `<path d="M 84 75 L 89 79 L 87 85 L 81 85 L 79 79 Z" fill="#ffd700" /><path d="M 116 75 L 121 79 L 119 85 L 113 85 L 111 79 Z" fill="#ffd700" />`;
        else if (c.eyeStyle === 5) eyesHtml = `<path d="M 84 84 C 84 84 76 77 78 74 C 80 72 84 75 84 75 C 84 75 88 72 90 74 C 92 77 84 84 84 84 Z" fill="#ec4899" /><path d="M 116 84 C 116 84 108 77 110 74 C 112 72 116 75 116 75 C 116 75 120 72 122 74 C 124 77 116 84 116 84 Z" fill="#ec4899" />`;

        let mouthHtml = `<path d="M 96 93 Q 100 98 104 93" stroke="#1e1b4b" stroke-width="2.5" fill="none" stroke-linecap="round" />`;
        if (c.mouthStyle === 1) mouthHtml = `<path d="M 95 92 Q 100 92 105 92 Q 105 102 100 102 Q 95 102 95 92 Z" fill="#ef4444" />`;

        let eyelashesHtml = gender === 'nữ' ? `<path d="M 74 77 Q 80 72 86 76" stroke="#1e1b4b" stroke-width="2.2" fill="none" /><path d="M 126 77 Q 120 72 114 76" stroke="#1e1b4b" stroke-width="2.2" fill="none" />` : '';
        let frontHairHtml = `<path d="M 64 80 Q 100 45 136 80" fill="${hairColor}" stroke="#1e1b4b" stroke-width="2.5" />`;

        // 8. Tattoos / Merit Details
        let tattooHtml = pts > 20 ? `<path d="M 94 125 Q 100 132 106 125" stroke="#ef4444" stroke-width="1.5" fill="none" opacity="0.6" />` : '';
        if (c.accessory === 10) { // Xăm Kín Người
            tattooHtml += `
                <path d="M 96 106 Q 100 110 104 106 L 105 118 Q 100 125 95 118 Z" fill="#2d3748" opacity="0.8" />
                <path d="M 88 114 Q 100 118 112 114 L 110 128 Q 100 135 90 128 Z" fill="#1a202c" opacity="0.75" />
            `;
        }

        // 9. Back Accessories Layer - Cleaned (legacy removed, weapons now in gear slot, wings in wing slot)
        let backAccessoryHtml = '';

        // 10. Gear Layer (Weapons held in hand)
        let gearHtml = '';
        if (c.gear === 1) { // Đại Đao Lửa
            gearHtml = `
                <g class="${isD ? 'chibi-arm-right-dance' : ''}" style="filter: drop-shadow(0 0 8px #ff4500);">
                    <rect x="128" y="80" width="4" height="100" rx="2" fill="#4b5563" />
                    <path d="M 120 80 Q 130 40 150 70 L 132 85 Z" fill="#ff4500" stroke="#fff" stroke-width="1.5" />
                </g>
            `;
        } else if (c.gear === 2) { // Súng Vô Cực
            gearHtml = `
                <g class="${isD ? 'chibi-arm-right-dance' : ''}" style="filter: drop-shadow(0 0 8px #00f3ff);">
                    <rect x="125" y="125" width="25" height="12" rx="3" fill="#1f2937" stroke="#00f3ff" stroke-width="1.5" />
                    <rect x="145" y="120" width="12" height="6" rx="1" fill="#00f3ff" />
                </g>
            `;
        } else if (c.gear === 3) { // Kiếm Cyber Laser
            gearHtml = `
                <g class="${isD ? 'chibi-arm-right-dance' : ''}" style="filter: drop-shadow(0 0 10px #8b5cf6);">
                    <rect x="130" y="60" width="8" height="80" rx="4" fill="#a855f7" opacity="0.8" stroke="#fff" stroke-width="1.5" />
                </g>
            `;
        } else if (c.gear === 4) { // Thương Heo Tộc
            gearHtml = `
                <g class="${isD ? 'chibi-arm-right-dance' : ''}">
                    <rect x="130" y="50" width="5" height="110" rx="2.5" fill="#78350f" stroke="#451a03" stroke-width="1" />
                    <circle cx="132.5" cy="55" r="12" fill="#f472b6" stroke="#db2777" stroke-width="1.5" />
                    <ellipse cx="132.5" cy="61" rx="5" ry="3" fill="#fb923c" />
                    <path d="M 125 45 L 132.5 25 L 140 45 Z" fill="#94a3b8" stroke="#475569" stroke-width="1.5" />
                </g>
            `;
        } else if (c.gear === 5) { // Dép Tổ Ong
            gearHtml = `
                <g class="${isD ? 'chibi-arm-right-dance' : ''}">
                    <path d="M 125 125 Q 135 115 150 125 L 145 145 Q 130 150 125 140 Z" fill="#fbbf24" stroke="#d97706" stroke-width="2" />
                    <circle cx="132" cy="130" r="2" fill="#d97706" opacity="0.6" />
                    <circle cx="138" cy="135" r="2" fill="#d97706" opacity="0.6" />
                </g>
            `;
        } else if (c.gear === 6) { // Chổi Tre
            gearHtml = `
                <g class="${isD ? 'chibi-arm-right-dance' : ''}">
                    <rect x="130" y="40" width="6" height="100" rx="3" fill="#65a30d" stroke="#365314" stroke-width="1.5" />
                    <path d="M 120 140 L 146 140 L 155 170 Q 133 180 110 170 Z" fill="#fde047" stroke="#ca8a04" stroke-width="1.5" />
                </g>
            `;
        } else if (c.gear === 7) { // Muỗng Mì
            gearHtml = `
                <g class="${isD ? 'chibi-arm-right-dance' : ''}">
                    <rect x="130" y="90" width="6" height="60" rx="3" fill="#94a3b8" stroke="#475569" stroke-width="1.5" />
                    <circle cx="133" cy="80" r="18" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2" />
                    <path d="M 125 75 Q 130 85 135 75 M 132 75 Q 137 85 142 75" stroke="#fbbf24" stroke-width="2.5" fill="none" />
                </g>
            `;
        } else if (c.gear === 8) { // Gậy Selfie
            gearHtml = `
                <g class="${isD ? 'chibi-arm-right-dance' : ''}">
                    <rect x="131" y="40" width="4" height="110" fill="#cbd5e1" />
                    <rect x="120" y="30" width="26" height="14" rx="2" fill="#111" stroke="#fbbf24" stroke-width="1.5" />
                    <path d="M 133 100 C 150 90 165 110 155 125" fill="none" stroke="#fbbf24" stroke-width="2" />
                </g>
            `;
        } else if (c.gear === 9) { // Cờ Lê Điện
            gearHtml = `
                <g class="${isD ? 'chibi-arm-right-dance' : ''}">
                    <path d="M 125 120 L 140 120 L 145 155 L 125 155 Z" fill="#94a3b8" stroke="#334155" stroke-width="2" />
                    <path d="M 120 110 L 150 110 L 150 125 L 120 125 Z" fill="#64748b" stroke="#334155" stroke-width="2" />
                </g>
            `;
        } else if (c.gear === 10) { // Cây Lau Nhà
            gearHtml = `
                <g class="${isD ? 'chibi-arm-right-dance' : ''}">
                    <rect x="131" y="50" width="5" height="100" rx="2.5" fill="#ec4899" stroke="#9d174d" stroke-width="1" />
                    <circle cx="133.5" cy="150" r="15" fill="#fff" stroke="#3b82f6" stroke-width="1" />
                </g>
            `;
        } else if (c.gear === 11) { // Nón Lá Phi Tiêu
            gearHtml = `
                <g class="${isD ? 'chibi-arm-right-dance' : ''}">
                    <path d="M 120 140 L 150 140 L 135 110 Z" fill="#fde047" stroke="#ca8a04" stroke-width="2" />
                    <ellipse cx="135" cy="140" rx="20" ry="5" fill="none" stroke="#22c55e" stroke-width="2" opacity="0.6" />
                </g>
            `;
        } else if (c.gear === 12) { // Vợt Muỗi Điện
            gearHtml = `
                <g class="${isD ? 'chibi-arm-right-dance' : ''}">
                    <rect x="130" y="110" width="7" height="40" rx="3.5" fill="#1e2937" stroke="#a855f7" stroke-width="1.5" />
                    <ellipse cx="133.5" cy="95" rx="18" ry="22" fill="rgba(168, 85, 247, 0.2)" stroke="#a855f7" stroke-width="2.5" />
                </g>
            `;
        } else if (c.gear === 13) { // Ghế Đỏ Quyền Lực
            gearHtml = `
                <g class="${isD ? 'chibi-arm-right-dance' : ''}">
                    <rect x="131" y="110" width="6" height="50" rx="3" fill="#78350f" />
                    <rect x="110" y="80" width="45" height="35" rx="4" fill="#ef4444" stroke="#991b1b" stroke-width="2.5" />
                    <circle cx="132.5" cy="97.5" r="4.5" fill="#991b1b" />
                </g>
            `;
        } else if (c.gear === 14) { // Quạt Trúc
            gearHtml = `
                <g class="${isD ? 'chibi-arm-right-dance' : ''}" style="filter: drop-shadow(0 0 6px #22c55e);">
                    <path d="M 130 110 L 175 80 C 185 100 180 130 155 150 L 135 120 Z" fill="#166534" stroke="#fff" stroke-width="1.2" />
                    <path d="M 130 110 L 165 145" stroke="#fef08a" stroke-width="1" />
                    <path d="M 130 110 L 155 155" stroke="#fef08a" stroke-width="1" />
                    <path d="M 130 110 L 140 160" stroke="#fef08a" stroke-width="1" />
                    <circle cx="132" cy="112" r="4" fill="#facc15" />
                </g>
            `;
        } else if (c.gear === 15) { // Lồng Đèn Hội An
            gearHtml = `
                <g class="${isD ? 'chibi-arm-right-dance' : ''}" style="filter: drop-shadow(0 0 10px #f97316);">
                    <rect x="131" y="60" width="4" height="60" rx="2" fill="#451a03" />
                    <ellipse cx="133" cy="130" rx="22" ry="28" fill="#f97316" stroke="#451a03" stroke-width="1.5" />
                    <rect x="125" y="102" width="16" height="5" rx="2" fill="#451a03" />
                    <rect x="125" y="153" width="16" height="5" rx="2" fill="#451a03" />
                    <path d="M 133 158 L 133 180" stroke="#dc2626" stroke-width="3" stroke-dasharray="4 2" />
                    <circle cx="133" cy="158" r="3" fill="#fbbf24" />
                </g>
            `;
        } else if (c.gear === 16) { // Gánh Hàng Rong
            gearHtml = `
                <g style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));">
                    <rect x="50" y="105" width="100" height="6" rx="3" fill="#78350f" stroke="#451a03" stroke-width="1" />
                    <g transform="translate(45, 110)">
                        <path d="M -20 0 L 20 0 L 15 25 L -15 25 Z" fill="#b45309" stroke="#451a03" stroke-width="1.5" />
                        <circle cx="-5" cy="5" r="4" fill="#ef4444" /> <circle cx="5" cy="8" r="4" fill="#eab308" />
                    </g>
                    <g transform="translate(155, 110)">
                        <path d="M -20 0 L 20 0 L 15 25 L -15 25 Z" fill="#b45309" stroke="#451a03" stroke-width="1.5" />
                        <rect x="-10" y="-10" width="20" height="10" fill="#fff" stroke="#94a3b8" />
                    </g>
                </g>
            `;
        } else if (c.gear === 17) { // Bánh Mì
            gearHtml = `
                <g class="${isD ? 'chibi-arm-right-dance' : ''}" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
                    <ellipse cx="138" cy="130" rx="22" ry="10" transform="rotate(-15 138 130)" fill="#f59e0b" stroke="#92400e" stroke-width="1.5" />
                    <path d="M 125 125 L 155 125" stroke="#fff" stroke-width="2" opacity="0.4" />
                    <path d="M 130 135 L 145 135" stroke="#10b981" stroke-width="3" />
                </g>
            `;
        } else if (c.gear === 18) { // Cà Phê Phin
            gearHtml = `
                <g class="${isD ? 'chibi-arm-right-dance' : ''}">
                    <rect x="125" y="115" width="20" height="25" rx="4" fill="rgba(255,255,255,0.3)" stroke="#fff" stroke-width="1" />
                    <rect x="125" y="125" width="20" height="15" fill="#451a03" />
                    <rect x="122" y="105" width="26" height="15" rx="2" fill="#94a3b8" stroke="#475569" stroke-width="1" />
                    <circle cx="135" cy="115" r="8" fill="#94a3b8" />
                </g>
            `;
        } else if (c.gear === 19) { // Dép Tổ Ong Huyền Thoại (Dual)
             gearHtml = `
                <g class="${isD ? 'chibi-arm-right-dance' : ''}">
                    <path d="M 125 125 Q 135 115 150 125 L 145 145 Q 130 150 125 140 Z" fill="#fff" stroke="#94a3b8" stroke-width="1.5" />
                    <path d="M 110 125 Q 120 115 135 125 L 130 145 Q 115 150 110 140 Z" fill="#fff" stroke="#94a3b8" stroke-width="1.5" />
                </g>
            `;
        }

        // 11. Mount Layer (Vehicles covering legs)
        let mountHtml = '';
        if (c.mount === 1) { // Siêu Xe
            mountHtml = `
                <g style="filter: drop-shadow(0 6px 12px rgba(0,0,0,0.6));">
                    <circle cx="46" cy="178" r="16" fill="#111" stroke="#ef4444" stroke-width="2.5" />
                    <circle cx="154" cy="178" r="16" fill="#111" stroke="#ef4444" stroke-width="2.5" />
                    <path d="M 20 176 C 20 156 35 140 60 138 L 140 138 C 165 140 180 156 180 176 C 180 188 170 192 140 192 L 60 192 C 30 192 20 188 20 176 Z" fill="#dc2626" stroke="#1e1b4b" stroke-width="2.5" />
                </g>
            `;
        } else if (c.mount === 4) { // Xe Máy Dream Neon
            mountHtml = `
                <g style="filter: drop-shadow(0 8px 15px rgba(0,0,0,0.7));">
                    <circle cx="35" cy="180" r="22" fill="#111" stroke="#facc15" stroke-width="3" />
                    <circle cx="165" cy="180" r="22" fill="#111" stroke="#facc15" stroke-width="3" />
                    <path d="M 30 170 L 170 170 L 160 140 L 50 140 Z" fill="#334155" stroke="#facc15" stroke-width="2" />
                    <rect x="80" y="130" width="50" height="15" rx="5" fill="#1e2937" stroke="#fff" />
                    <path d="M 35 140 L 35 120 L 55 120" stroke="#fff" stroke-width="3" fill="none" />
                </g>
            `;
        }

        // 12. Sparkles / High Merit Particles
        let sparklesHtml = '';
        if (pts > 20) {
            const auraColor = pts > 50 ? '#fbbf24' : '#60a5fa';
            sparklesHtml = `
                <g class="chibi-auras">
                    <circle cx="45" cy="50" r="3" fill="${auraColor}" style="animation: floatSparkle 2s infinite ease-in-out;" />
                    <circle cx="155" cy="60" r="2.5" fill="${auraColor}" style="animation: floatSparkle 1.8s infinite ease-in-out 0.4s;" />
                </g>
            `;
        }

        // 13. Front Accessories Layer (Hats/Face)
        let accHtml = '';
        if (c.accessory === 11) { // Mũ Cối
            accHtml = `
                <g style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4));">
                    <path d="M 55 55 Q 100 20 145 55 L 145 70 Q 100 85 55 70 Z" fill="#3f6212" stroke="#1a2e05" stroke-width="2" />
                    <circle cx="100" cy="55" r="8" fill="#eab308" stroke="#854d0e" stroke-width="1.5" />
                    <path d="M 96 55 L 104 55 M 100 51 L 100 59" stroke="#fff" stroke-width="1" />
                </g>
            `;
        } else if (c.accessory === 12) { // Nón Lá
            accHtml = `
                <g style="filter: drop-shadow(0 4px 10px rgba(0,0,0,0.3));">
                    <path d="M 40 75 L 100 20 L 160 75 Z" fill="#fef08a" stroke="#ca8a04" stroke-width="1.5" />
                    <path d="M 60 75 Q 100 85 140 75" fill="none" stroke="#ca8a04" stroke-width="1" opacity="0.5" />
                    <path d="M 70 75 L 70 100 M 130 75 L 130 100" stroke="#f43f5e" stroke-width="2.5" />
                </g>
            `;
        } else if (c.accessory === 13) { // Khăn Rằn
            accHtml = `
                <g style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">
                    <path d="M 75 110 Q 100 135 125 110 L 120 140 Q 100 150 80 140 Z" fill="#111" />
                    <path d="M 75 110 Q 100 135 125 110 L 120 140 Q 100 150 80 140 Z" fill="url(#khanRanPattern)" opacity="0.8" />
                    <defs>
                        <pattern id="khanRanPattern" width="10" height="10" patternUnits="userSpaceOnUse">
                            <rect width="5" height="5" fill="#fff" />
                            <rect x="5" y="5" width="5" height="5" fill="#fff" />
                        </pattern>
                    </defs>
                </g>
            `;
        }
        return `
            <svg viewBox="${viewBox}" width="100%" height="100%" class="${isD ? 'chibi-dance' : ''}" style="display: block;">
                <style>
                    .chibi-dance { animation: chibiBounce 1.5s infinite ease-in-out; transform-origin: bottom center; }
                    @keyframes chibiBounce { 0%, 100% { transform: scale(1) translateY(0); } 50% { transform: scale(1.02, 0.98) translateY(-4px); } }
                    .chibi-arm-left-dance { animation: chibiArmLeftWave 1.5s infinite ease-in-out; transform-origin: 85px 125px; }
                    .chibi-arm-right-dance { animation: chibiArmRightWave 1.5s infinite ease-in-out; transform-origin: 115px 125px; }
                    @keyframes chibiArmLeftWave { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(12deg); } }
                    @keyframes chibiArmRightWave { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-12deg); } }
                    @keyframes floatSparkle { 0%, 100% { transform: translateY(0) scale(0.6); opacity: 0.3; } 50% { transform: translateY(-10px) scale(1.1); opacity: 1; } }
                </style>
                ${dragonHtml || ''}
                ${wingHtml || ''}
                ${sparklesHtml}
                ${bodyWrapperStart}
                ${backAccessoryHtml}
                ${backHairHtml}
                ${bodyBaseHtml}
                ${tattooHtml}
                ${shoeHtml}
                ${bottomHtml}
                ${topHtml}
                ${eyesHtml}
                ${eyelashesHtml}
                ${mouthHtml}
                ${frontHairHtml}
                ${gearHtml}
                ${mountHtml}
                ${bodyWrapperEnd}
                ${accHtml}
            </svg>
        `;
    },

    /**
     * Render a zoomed visual preview of a specific style item
     */
    renderMiniOption: function(type, index, color) {
        const tempConfig = {
            gender: 'nam',
            skinColor: '#ffd1a9',
            hairStyle: 0,
            hairColor: '#343a40',
            eyeStyle: 0,
            mouthStyle: 5,
            topStyle: 0,
            topColor: '#e83e8c',
            bottomStyle: 0,
            bottomColor: '#007bff',
            shoeStyle: 0,
            shoeColor: '#1f2937',
            accessory: 0,
            gear: 0,
            wing: 0,
            mount: 0,
            dragon: 0
        };

        // Override target property
        if (type === 'skin') {
            tempConfig.skinColor = color;
        } else if (type === 'hair') {
            tempConfig.hairStyle = index;
            tempConfig.hairColor = color || '#343a40';
        } else if (type === 'eyes') {
            tempConfig.eyeStyle = index;
        } else if (type === 'mouth') {
            tempConfig.mouthStyle = index;
        } else if (type === 'top') {
            tempConfig.topStyle = index;
            tempConfig.topColor = color || '#e83e8c';
        } else if (type === 'bottom') {
            tempConfig.bottomStyle = index;
            tempConfig.bottomColor = color || '#007bff';
        } else if (type === 'shoe') {
            tempConfig.shoeStyle = index;
            tempConfig.shoeColor = color || '#1f2937';
        } else if (type === 'accessory') {
            tempConfig.accessory = index;
        } else if (type === 'gear') {
            tempConfig.gear = index;
        } else if (type === 'wing') {
            tempConfig.wing = index;
        } else if (type === 'mount') {
            tempConfig.mount = index;
        } else if (type === 'dragon') {
            tempConfig.dragon = index;
        }

        const svgStr = ChibiModule.renderChibiSVG(tempConfig, false, 0);

        // Adjust viewBox to crop/zoom into the relevant body region
        let viewBox = '0 0 200 200';
        if (type === 'hair') viewBox = '50 25 100 80';
        else if (type === 'eyes') viewBox = '65 72 70 20';
        else if (type === 'mouth') viewBox = '85 86 30 18';
        else if (type === 'top') viewBox = '62 105 76 40';
        else if (type === 'bottom') viewBox = '70 135 60 38';
        else if (type === 'shoe') viewBox = '70 160 60 25';
        else if (type === 'accessory') {
            if (index >= 11 && index <= 12) viewBox = '40 20 120 70'; // Hats
            else if (index === 13) viewBox = '60 90 80 60'; // Scarf
            else viewBox = '50 25 100 70';
        } else if (type === 'gear') {
            if (index === 16) viewBox = '20 80 160 100'; // Vendor Pole
            else if (index === 15) viewBox = '100 50 70 140'; // Lantern
            else viewBox = '80 60 100 120';
        } else if (type === 'wing') {
            viewBox = '10 10 180 180';
        } else if (type === 'mount') {
            viewBox = '15 100 170 100';
        }

        return svgStr.replace(/<svg viewBox="[^"]*"/g, `<svg viewBox="${viewBox}"`);
    },

    /**
     * Open Chibi Avatar Builder Modal
     */
    openBuilder: function() {
        // Read current user's profile and config
        const user = Auth.currentUser;
        if (!user) {
            Utils.showToast("Bạn cần đăng nhập trước!", "error");
            return;
        }

        const profile = user.profile || {};
        
        // Initialize config (clone existing or load default with fallbacks)
        ChibiModule.currentConfig = profile.chibiConfig ? {
            gender: 'nam',
            shoeStyle: 1,
            shoeColor: '#1f2937',
            ...profile.chibiConfig
        } : {
            gender: 'nam',
            skinColor: '#ffcd94',
            hairStyle: 1,
            hairColor: '#111827',
            eyeStyle: 0,
            mouthStyle: 0,
            topStyle: 1,
            topColor: '#3b82f6',
            bottomStyle: 1,
            bottomColor: '#1f2937',
            shoeStyle: 1,
            shoeColor: '#1f2937',
            accessory: 0
        };

        ChibiModule.activeTab = 'skin';

        // Inject Styles dynamically if not already added
        if (!document.getElementById('chibi-builder-styles')) {
            const style = document.createElement('style');
            style.id = 'chibi-builder-styles';
            style.textContent = `
                @keyframes chibiScaleIn {
                    0% { transform: scale(0.92); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .chibi-btn-outline {
                    background: rgba(255,255,255,0.05);
                    color: #cbd5e1;
                    border: 1px solid rgba(255,255,255,0.1);
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .chibi-btn-outline:hover {
                    background: rgba(255,255,255,0.12);
                    color: #fff;
                    border-color: rgba(255,255,255,0.25);
                    transform: translateY(-1px);
                }
                .chibi-btn-outline.active {
                    background: rgba(139,92,246,0.25);
                    color: #fff;
                    border-color: #8b5cf6;
                    box-shadow: 0 0 10px rgba(139,92,246,0.3);
                }
                .chibi-tab-btn {
                    background: none;
                    border: none;
                    color: #64748b;
                    font-weight: 700;
                    font-size: 11px;
                    padding: 6px 12px;
                    border-radius: 6px;
                    cursor: pointer;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    transition: all 0.2s;
                }
                .chibi-tab-btn:hover {
                    color: #cbd5e1;
                    background: rgba(255,255,255,0.03);
                }
                .chibi-tab-btn.active {
                    color: #fff;
                    background: linear-gradient(135deg, rgba(236,72,153,0.25), rgba(139,92,246,0.25));
                    border: 1px solid rgba(139,92,246,0.4);
                    text-shadow: 0 0 10px rgba(139,92,246,0.5);
                }
                .chibi-item-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 10px;
                }
                @media (max-width: 580px) {
                    .chibi-item-grid {
                        grid-template-columns: repeat(3, 1fr);
                    }
                }
                .chibi-item-card {
                    height: 108px;
                    background: rgba(0,0,0,0.3);
                    border: 1.5px solid rgba(255,255,255,0.08);
                    border-radius: 10px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: flex-start;
                    padding: 4px;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                }
                .chibi-item-card:hover {
                    background: rgba(255,255,255,0.08);
                    border-color: rgba(139,92,246,0.45);
                    transform: scale(1.04);
                }
                .chibi-item-card.active {
                    background: rgba(139,92,246,0.18);
                    border-color: #8b5cf6;
                    box-shadow: 0 0 15px rgba(139,92,246,0.4);
                }
                .chibi-item-preview-wrap {
                    width: 100%;
                    height: 70px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 28px;
                }
                .chibi-item-label {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    min-height: 28px;
                    background: rgba(15, 23, 42, 0.92);
                    border-top: 1px solid rgba(255, 255, 255, 0.08);
                    padding: 4px 2px;
                    font-size: 10px;
                    color: #cbd5e1;
                    font-weight: 800;
                    text-align: center;
                    white-space: normal;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-sizing: border-box;
                    z-index: 2;
                    text-transform: uppercase;
                    transition: all 0.2s;
                }
                .chibi-item-card.active .chibi-item-label {
                    color: #a78bfa;
                    background: rgba(139, 92, 246, 0.25);
                    border-top-color: rgba(139, 92, 246, 0.4);
                }
                .chibi-color-circle {
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    cursor: pointer;
                    border: 2px solid transparent;
                    transition: all 0.2s;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.6);
                }
                .chibi-color-circle:hover {
                    transform: scale(1.12);
                }
                .chibi-color-circle.active {
                    border-color: #fff;
                    box-shadow: 0 0 10px #8b5cf6;
                    transform: scale(1.18);
                }
            `;
            document.head.appendChild(style);
        }

        // Render Builder Modal HTML
        let modalEl = document.getElementById('chibi-builder-modal-overlay');
        if (!modalEl) {
            modalEl = document.createElement('div');
            modalEl.id = 'chibi-builder-modal-overlay';
            document.body.appendChild(modalEl);
        }

        modalEl.outerHTML = `
        <div class="chibi-modal-overlay" id="chibi-builder-modal-overlay" style="display: flex; align-items: center; justify-content: center; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(5,5,10,0.85); backdrop-filter: blur(8px); z-index: 10000; transition: all 0.3s ease;">
            <div class="chibi-modal-content" style="background: linear-gradient(135deg, rgba(15,23,42,0.96), rgba(8,15,30,0.98)); border: 1px solid rgba(139, 92, 246, 0.3); box-shadow: 0 0 50px rgba(139, 92, 246, 0.25); border-radius: 20px; width: 90%; max-width: 820px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; font-family: system-ui, -apple-system, sans-serif; animation: chibiScaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); color: #fff;">
                
                <!-- Header -->
                <div style="padding: 16px 24px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.25);">
                    <h3 style="margin: 0; font-size: 18px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; background: linear-gradient(135deg, #ec4899, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; display: flex; align-items: center; gap: 10px;">
                        <i class="fa-solid fa-ghost"></i> Thiết Kế Pet Chibi Avatar
                    </h3>
                    <button onclick="ChibiModule.closeBuilder()" style="background: none; border: none; color: #64748b; cursor: pointer; font-size: 20px; transition: color 0.2s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#64748b'">
                        <i class="fa-solid fa-times"></i>
                    </button>
                </div>

                <!-- Body -->
                <div style="flex: 1; overflow-y: auto; display: flex; flex-wrap: wrap; padding: 24px; gap: 24px; background: rgba(10,10,20,0.2);">
                    
                    <!-- Left: Preview -->
                    <div style="flex: 1; min-width: 260px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; background: rgba(0,0,0,0.25); border-radius: 16px; padding: 20px; border: 1px solid rgba(255,255,255,0.05); box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
                        
                        <div id="chibi-preview-container" style="width: 200px; height: 240px; background: radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(0,0,0,0.6) 100%); border-radius: 12px; border: 2px solid rgba(139, 92, 246, 0.4); display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; box-shadow: inset 0 0 20px rgba(0,0,0,0.85);">
                            <!-- Chibi composite SVG injected here -->
                        </div>

                        <!-- Bounce dancing toggle -->
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; color: #cbd5e1; font-weight: bold; background: rgba(255,255,255,0.05); padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.08); user-select: none;">
                            <input type="checkbox" id="chibi-dance-toggle" checked onchange="ChibiModule.updatePreview()" style="cursor: pointer; accent-color: #8b5cf6;">
                            <span>💃 Chibi nhún nhảy cực chất</span>
                        </label>
                        
                        <!-- Mini controls -->
                        <div style="display: flex; gap: 10px; width: 100%;">
                            <button onclick="ChibiModule.randomizeBuilder()" class="chibi-btn-outline" style="flex: 1; padding: 10px; font-weight: bold; font-size: 13px; border-radius: 8px; display: flex; align-items: center; justify-content: center; gap: 6px; border: 1px solid rgba(255,255,255,0.1); transition: all 0.2s;">
                                <i class="fa-solid fa-dice"></i> Ngẫu nhiên
                            </button>
                            <button onclick="ChibiModule.resetBuilder()" class="chibi-btn-outline" style="flex: 1; padding: 10px; font-weight: bold; font-size: 13px; border-radius: 8px; display: flex; align-items: center; justify-content: center; gap: 6px; border: 1px solid rgba(255,255,255,0.1); transition: all 0.2s;">
                                <i class="fa-solid fa-arrow-rotate-left"></i> Reset
                            </button>
                        </div>
                    </div>

                    <!-- Right: Editor tabs -->
                    <div style="flex: 1.4; min-width: 320px; display: flex; flex-direction: column; gap: 16px;">
                        
                        <!-- Tabs -->
                        <div style="display: flex; flex-wrap: wrap; gap: 6px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 10px;" id="chibi-tabs-nav">
                            <!-- Injected by JS -->
                        </div>

                        <!-- Tab Content -->
                        <div id="chibi-tab-panel" style="flex: 1; min-height: 270px; background: rgba(0,0,0,0.2); border-radius: 12px; padding: 16px; border: 1px solid rgba(255,255,255,0.04); overflow-y: auto; max-height: 330px;">
                            <!-- Active editor panel items injected here -->
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div style="padding: 16px 24px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: flex-end; gap: 12px; background: rgba(0,0,0,0.25);">
                    <button onclick="ChibiModule.closeBuilder()" style="background: rgba(255,255,255,0.04); color: #cbd5e1; border: 1px solid rgba(255,255,255,0.1); padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.04)'">
                        HỦY BỎ
                    </button>
                    <button onclick="ChibiModule.saveBuilder()" style="background: linear-gradient(135deg, #ec4899, #8b5cf6); color: #fff; border: none; padding: 10px 24px; border-radius: 8px; font-weight: 800; cursor: pointer; transition: all 0.2s; box-shadow: 0 0 15px rgba(236,72,153,0.4);" onmouseover="this.style.transform='scale(1.02)'; this.style.boxShadow='0 0 20px rgba(236,72,153,0.6)'" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 0 15px rgba(236,72,153,0.4)'">
                        💾 LƯU AVATAR
                    </button>
                </div>
            </div>
        </div>
        `;

        ChibiModule.renderTabs();
        ChibiModule.switchTab('skin');
        ChibiModule.updatePreview();
    },

    /**
     * Render a grid of items for a specific category
     */
    renderGrid: function(property, options, labels, scale = 1.15) {
        return `
            <div class="chibi-item-grid">
                ${options.map(i => {
                    const activeClass = ChibiModule.currentConfig[property] === i ? 'active' : '';
                    const miniSvg = ChibiModule.renderMiniOption(property, i);
                    return `
                        <div class="chibi-item-card ${activeClass}" onclick="ChibiModule.selectItem('${property}', ${i})">
                            <div class="chibi-item-preview-wrap" style="transform: scale(${scale});">
                                ${miniSvg}
                            </div>
                            <span class="chibi-item-label">${labels[i] || (property + ' ' + i)}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    /**
     * Render Navigation Tabs in builder
     */
    renderTabs: function() {
        const tabs = [
            { id: 'skin', label: '🎨 Cơ Thể' },
            { id: 'hair', label: '💇 Tóc' },
            { id: 'face', label: '😊 Khuôn Mặt' },
            { id: 'clothing', label: '👕 Quần Áo' },
            { id: 'accessory', label: '👑 Phụ Kiện' },
            { id: 'gear', label: '⚔️ Vũ Khí' },
            { id: 'wing', label: '🕊️ Cánh' },
            { id: 'mount', label: '🏎️ Cưỡi' },
            { id: 'dragon', label: '🐉 Rồng' }
        ];

        const nav = document.getElementById('chibi-tabs-nav');
        if (!nav) return;

        nav.innerHTML = tabs.map(t => `
            <button class="chibi-tab-btn ${ChibiModule.activeTab === t.id ? 'active' : ''}" onclick="ChibiModule.switchTab('${t.id}')">
                ${t.label}
            </button>
        `).join('');
    },

    /**
     * Switch current editor tab
     */
    switchTab: function(tabId) {
        ChibiModule.activeTab = tabId;
        ChibiModule.renderTabs();

        const panel = document.getElementById('chibi-tab-panel');
        if (!panel) return;

        let contentHtml = '';

        if (tabId === 'skin') {
            // GENDER & SKIN COLOR PICKER
            contentHtml = `
                <div style="display: flex; flex-direction: column; gap: 16px;">
                    <div>
                        <h4 style="margin: 0 0 8px 0; font-size: 13px; color: #94a3b8; text-transform: uppercase;">Giới Tính (Gender)</h4>
                        <div style="display: flex; gap: 12px; margin-bottom: 16px;">
                            <button class="chibi-btn-outline ${ChibiModule.currentConfig.gender === 'nam' ? 'active' : ''}" 
                                    style="flex: 1; padding: 10px; font-weight: bold; border-radius: 8px; display: flex; align-items: center; justify-content: center; gap: 8px; border: 1px solid rgba(255,255,255,0.1); cursor: pointer;"
                                    onclick="ChibiModule.selectGender('nam')">
                                ♂️ NAM
                            </button>
                            <button class="chibi-btn-outline ${ChibiModule.currentConfig.gender === 'nữ' ? 'active' : ''}" 
                                    style="flex: 1; padding: 10px; font-weight: bold; border-radius: 8px; display: flex; align-items: center; justify-content: center; gap: 8px; border: 1px solid rgba(255,255,255,0.1); cursor: pointer;"
                                    onclick="ChibiModule.selectGender('nữ')">
                                ♀️ NỮ
                            </button>
                        </div>
                    </div>
                    <div>
                        <h4 style="margin: 0 0 8px 0; font-size: 13px; color: #94a3b8; text-transform: uppercase;">Lựa Chọn Màu Da</h4>
                        <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                            ${ChibiModule.colors.skin.map((col, idx) => `
                                <div class="chibi-color-circle ${ChibiModule.currentConfig.skinColor === col ? 'active' : ''}" 
                                     style="background: ${col};" 
                                     onclick="ChibiModule.selectColor('skinColor', '${col}')"></div>
                            `).join('')}
                        </div>
                    </div>
                    <div style="margin-top: 10px; display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.02); padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                        <span style="font-size: 12px; font-weight: bold; color: #cbd5e1;">Màu Tùy Chọn:</span>
                        <input type="color" value="${ChibiModule.currentConfig.skinColor}" 
                               onchange="ChibiModule.selectColor('skinColor', this.value)" 
                               style="background: none; border: none; width: 40px; height: 30px; cursor: pointer; outline: none;">
                    </div>
                </div>
            `;
        } 
        else if (tabId === 'hair') {
            // HAIR STYLE GRID & COLOR PICKER
            const options = Array.from({ length: ChibiModule.counts.hair }, (_, i) => i);
            contentHtml = `
                <div style="display: flex; flex-direction: column; gap: 16px;">
                    <div>
                        <h4 style="margin: 0 0 10px 0; font-size: 13px; color: #94a3b8; text-transform: uppercase;">Kiểu Tóc</h4>
                        <div class="chibi-item-grid">
                            ${options.map(i => {
                                const activeClass = ChibiModule.currentConfig.hairStyle === i ? 'active' : '';
                                const miniSvg = ChibiModule.renderMiniOption('hair', i, ChibiModule.currentConfig.hairColor);
                                return `
                                    <div class="chibi-item-card ${activeClass}" onclick="ChibiModule.selectItem('hairStyle', ${i})">
                                        <div class="chibi-item-preview-wrap" style="transform: scale(1.15);">
                                            ${miniSvg}
                                        </div>
                                        <span class="chibi-item-label">${i === 0 ? 'Trọc' : 'Tóc ' + i}</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                    <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 5px 0;">
                    <div>
                        <h4 style="margin: 0 0 8px 0; font-size: 13px; color: #94a3b8; text-transform: uppercase;">Màu Tóc</h4>
                        <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                            ${ChibiModule.colors.hair.map(col => `
                                <div class="chibi-color-circle ${ChibiModule.currentConfig.hairColor === col ? 'active' : ''}" 
                                     style="background: ${col};" 
                                     onclick="ChibiModule.selectColor('hairColor', '${col}')"></div>
                            `).join('')}
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.02); padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                        <span style="font-size: 12px; font-weight: bold; color: #cbd5e1;">Màu Tóc Tự Chọn:</span>
                        <input type="color" value="${ChibiModule.currentConfig.hairColor}" 
                               onchange="ChibiModule.selectColor('hairColor', this.value)" 
                               style="background: none; border: none; width: 40px; height: 30px; cursor: pointer; outline: none;">
                    </div>
                </div>
            `;
        } 
        else if (tabId === 'face') {
            // EYES & MOUTH STYLE SELECTION
            const eyeOptions = Array.from({ length: ChibiModule.counts.eyes }, (_, i) => i);
            const mouthOptions = Array.from({ length: ChibiModule.counts.mouth }, (_, i) => i);
            contentHtml = `
                <div style="display: flex; flex-direction: column; gap: 20px;">
                    <div>
                        <h4 style="margin: 0 0 10px 0; font-size: 13px; color: #94a3b8; text-transform: uppercase;">Kiểu Mắt</h4>
                        <div class="chibi-item-grid">
                            ${eyeOptions.map(i => {
                                const activeClass = ChibiModule.currentConfig.eyeStyle === i ? 'active' : '';
                                const miniSvg = ChibiModule.renderMiniOption('eyes', i);
                                return `
                                    <div class="chibi-item-card ${activeClass}" onclick="ChibiModule.selectItem('eyeStyle', ${i})">
                                        <div class="chibi-item-preview-wrap" style="transform: scale(1.6);">
                                            ${miniSvg}
                                        </div>
                                        <span class="chibi-item-label">Mắt ${i + 1}</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                    <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 5px 0;">
                    <div>
                        <h4 style="margin: 0 0 10px 0; font-size: 13px; color: #94a3b8; text-transform: uppercase;">Kiểu Miệng</h4>
                        <div class="chibi-item-grid">
                            ${mouthOptions.map(i => {
                                const activeClass = ChibiModule.currentConfig.mouthStyle === i ? 'active' : '';
                                const miniSvg = ChibiModule.renderMiniOption('mouth', i);
                                return `
                                    <div class="chibi-item-card ${activeClass}" onclick="ChibiModule.selectItem('mouthStyle', ${i})">
                                        <div class="chibi-item-preview-wrap" style="transform: scale(1.8);">
                                            ${miniSvg}
                                        </div>
                                        <span class="chibi-item-label">Miệng ${i + 1}</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            `;
        } 
        else if (tabId === 'clothing') {
            // TOPS, BOTTOMS & SHOES WITH INDEPENDENT STYLE + COLOR
            const topOptions = Array.from({ length: ChibiModule.counts.top }, (_, i) => i);
            const bottomOptions = Array.from({ length: ChibiModule.counts.bottom }, (_, i) => i);
            const shoeOptions = Array.from({ length: ChibiModule.counts.shoe }, (_, i) => i);
            const shoeNames = ['Chân trần', 'Sneaker', 'Bốt Cyber', 'Cao gót', 'Bốt chiến binh', 'Dép gấu', 'Converse', 'Giày phát sáng'];

            contentHtml = `
                <div style="display: flex; flex-direction: column; gap: 20px;">
                    <div>
                        <h4 style="margin: 0 0 10px 0; font-size: 13px; color: #94a3b8; text-transform: uppercase;">Kiểu Áo (Tops)</h4>
                        <div class="chibi-item-grid" style="margin-bottom: 12px;">
                            ${topOptions.map(i => {
                                const activeClass = ChibiModule.currentConfig.topStyle === i ? 'active' : '';
                                const miniSvg = ChibiModule.renderMiniOption('top', i, ChibiModule.currentConfig.topColor);
                                return `
                                    <div class="chibi-item-card ${activeClass}" onclick="ChibiModule.selectItem('topStyle', ${i})">
                                        <div class="chibi-item-preview-wrap" style="transform: scale(1.3);">
                                            ${miniSvg}
                                        </div>
                                        <span class="chibi-item-label">${i === 0 ? 'Mặc định' : 'Áo ' + i}</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                        <h5 style="margin: 8px 0 8px 0; font-size: 11px; color: #64748b; text-transform: uppercase;">Màu Áo</h5>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                            ${ChibiModule.colors.clothing.map(col => `
                                <div class="chibi-color-circle ${ChibiModule.currentConfig.topColor === col ? 'active' : ''}" 
                                     style="background: ${col}; width: 22px; height: 22px;" 
                                     onclick="ChibiModule.selectColor('topColor', '${col}')"></div>
                            `).join('')}
                            <input type="color" value="${ChibiModule.currentConfig.topColor}" 
                                   onchange="ChibiModule.selectColor('topColor', this.value)" 
                                   style="background: none; border: none; width: 26px; height: 22px; cursor: pointer; outline: none; padding: 0;">
                        </div>
                    </div>

                    <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 5px 0;">

                    <div>
                        <h4 style="margin: 0 0 10px 0; font-size: 13px; color: #94a3b8; text-transform: uppercase;">Kiểu Quần / Váy (Bottoms)</h4>
                        <div class="chibi-item-grid" style="margin-bottom: 12px;">
                            ${bottomOptions.map(i => {
                                const activeClass = ChibiModule.currentConfig.bottomStyle === i ? 'active' : '';
                                const miniSvg = ChibiModule.renderMiniOption('bottom', i, ChibiModule.currentConfig.bottomColor);
                                return `
                                    <div class="chibi-item-card ${activeClass}" onclick="ChibiModule.selectItem('bottomStyle', ${i})">
                                        <div class="chibi-item-preview-wrap" style="transform: scale(1.35);">
                                            ${miniSvg}
                                        </div>
                                        <span class="chibi-item-label">${i === 0 ? 'Mặc định' : 'Quần ' + i}</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                        <h5 style="margin: 8px 0 8px 0; font-size: 11px; color: #64748b; text-transform: uppercase;">Màu Quần</h5>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                            ${ChibiModule.colors.clothing.map(col => `
                                <div class="chibi-color-circle ${ChibiModule.currentConfig.bottomColor === col ? 'active' : ''}" 
                                     style="background: ${col}; width: 22px; height: 22px;" 
                                     onclick="ChibiModule.selectColor('bottomColor', '${col}')"></div>
                            `).join('')}
                            <input type="color" value="${ChibiModule.currentConfig.bottomColor}" 
                                   onchange="ChibiModule.selectColor('bottomColor', this.value)" 
                                   style="background: none; border: none; width: 26px; height: 22px; cursor: pointer; outline: none; padding: 0;">
                        </div>
                    </div>

                    <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 5px 0;">

                    <div>
                        <h4 style="margin: 0 0 10px 0; font-size: 13px; color: #94a3b8; text-transform: uppercase;">Kiểu Giày (Shoes)</h4>
                        <div class="chibi-item-grid" style="margin-bottom: 12px;">
                            ${shoeOptions.map(i => {
                                const activeClass = ChibiModule.currentConfig.shoeStyle === i ? 'active' : '';
                                const miniSvg = ChibiModule.renderMiniOption('shoe', i, ChibiModule.currentConfig.shoeColor);
                                return `
                                    <div class="chibi-item-card ${activeClass}" onclick="ChibiModule.selectItem('shoeStyle', ${i})">
                                        <div class="chibi-item-preview-wrap" style="transform: scale(1.65);">
                                            ${miniSvg}
                                        </div>
                                        <span class="chibi-item-label">${shoeNames[i]}</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                        <h5 style="margin: 8px 0 8px 0; font-size: 11px; color: #64748b; text-transform: uppercase;">Màu Giày</h5>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                            ${ChibiModule.colors.clothing.map(col => `
                                <div class="chibi-color-circle ${ChibiModule.currentConfig.shoeColor === col ? 'active' : ''}" 
                                     style="background: ${col}; width: 22px; height: 22px;" 
                                     onclick="ChibiModule.selectColor('shoeColor', '${col}')"></div>
                            `).join('')}
                            <input type="color" value="${ChibiModule.currentConfig.shoeColor || '#1f2937'}" 
                                   onchange="ChibiModule.selectColor('shoeColor', this.value)" 
                                   style="background: none; border: none; width: 26px; height: 22px; cursor: pointer; outline: none; padding: 0;">
                        </div>
                    </div>
                </div>
            `;
        } 
        else if (tabId === 'accessory') {
            const options = Array.from({ length: ChibiModule.counts.accessory }, (_, i) => i);
            const accNames = ['Trống', 'Kính râm', 'Mèo', 'Tai nghe', 'Vòng thiên sứ', 'Vương miện', 'Khẩu trang', 'Đầu bếp', 'Bịt mắt', 'Nơ', 'Xăm Kín', 'Mũ Cối VIP', 'Nón Lá VN', 'Khăn Rằn'];
            contentHtml = ChibiModule.renderGrid('accessory', options, accNames, 1.15);
        }
        else if (tabId === 'gear') {
            const options = Array.from({ length: ChibiModule.counts.gear }, (_, i) => i);
            const gearNames = ['Trống', 'Đại Đao Lửa', 'Súng Vô Cực', 'Kiếm Cyber', 'Thương Heo', 'Dép Tổ Ong', 'Chổi Tre', 'Muỗng Mì', 'Gậy Selfie', 'Cờ Lê Điện', 'Cây Lau Nhà', 'Nón Lá Phi Tiêu', 'Vợt Muỗi', 'Ghế Đỏ', 'Quạt Trúc', 'Lồng Đèn', 'Gánh Hàng Rong', 'Bánh Mì', 'Cà Phê Phin', 'Đôi Dép Trắng'];
            contentHtml = ChibiModule.renderGrid('gear', options, gearNames, 1.25);
        }
        else if (tabId === 'wing') {
            const options = Array.from({ length: ChibiModule.counts.wing }, (_, i) => i);
            const wingNames = ['Trống', 'Cánh Thiên Thần', 'Cánh Ác Quỷ', 'Thiên Thần VIP', 'Cánh Bướm Pha Lê', 'Phượng Hoàng Lửa', 'Dơi Hắc Ám', 'Băng Tuyết'];
            contentHtml = ChibiModule.renderGrid('wing', options, wingNames, 1.1);
        }
        else if (tabId === 'mount') {
            const options = Array.from({ length: ChibiModule.counts.mount }, (_, i) => i);
            const mountNames = ['Trống', 'Siêu Xe', 'Xe Máy', 'Hồng Hạc', 'Xe Dream Neon'];
            contentHtml = ChibiModule.renderGrid('mount', options, mountNames, 1.0);
        }
        else if (tabId === 'dragon') {
            const options = Array.from({ length: ChibiModule.counts.dragon }, (_, i) => i);
            const dragonNames = ['Trống', 'Lam Long', 'Xích Long', 'Hoàng Long'];
            contentHtml = ChibiModule.renderGrid('dragon', options, dragonNames, 0.9);
        }

        panel.innerHTML = contentHtml;
    },

    /**
     * Choose an item style
     */
    selectItem: function(property, index) {
        if (property === 'accessory' && ChibiModule.isGearLocked(index)) {
            const req = ChibiModule.gearRequirements[index];
            const completed = ChibiModule.getCompletedTasksCount();
            Utils.showToast(`✨ Đang mặc thử: "${req ? req.label : ''}". Đạt đủ ${req ? req.count : 0} Task trong tháng để lưu chính thức! (Hiện tại: ${completed}/${req ? req.count : 0})`, "info");
        }
        ChibiModule.currentConfig[property] = index;
        ChibiModule.updatePreview();
        ChibiModule.switchTab(ChibiModule.activeTab); // Rerender items in panel to show selected
    },

    /**
     * Choose an item color
     */
    selectColor: function(property, hexColor) {
        ChibiModule.currentConfig[property] = hexColor;
        ChibiModule.updatePreview();
        ChibiModule.switchTab(ChibiModule.activeTab); // Rerender items to update highlight
    },

    /**
     * Choose gender (nam/nữ) and update eyelashes
     */
    selectGender: function(gender) {
        ChibiModule.currentConfig.gender = gender;
        ChibiModule.updatePreview();
        ChibiModule.switchTab(ChibiModule.activeTab);
    },

    /**
     * Render and update live preview
     */
    updatePreview: function() {
        const container = document.getElementById('chibi-preview-container');
        if (!container) return;

        const isDacing = document.getElementById('chibi-dance-toggle')?.checked ?? true;
        
        // Render with 50 merits for cute sparkles preview in builder
        container.innerHTML = ChibiModule.renderChibiSVG(ChibiModule.currentConfig, isDacing, 50);
    },

    /**
     * Reset builder state to original config or standard default
     */
    resetBuilder: function() {
        const user = Auth.currentUser;
        const profile = user?.profile || {};
        
        ChibiModule.currentConfig = profile.chibiConfig ? {
            gender: 'nam',
            shoeStyle: 1,
            shoeColor: '#1f2937',
            gear: 0,
            wing: 0,
            mount: 0,
            dragon: 0,
            ...profile.chibiConfig
        } : {
            gender: 'nam',
            skinColor: '#ffcd94',
            hairStyle: 1,
            hairColor: '#111827',
            eyeStyle: 0,
            mouthStyle: 0,
            topStyle: 1,
            topColor: '#3b82f6',
            bottomStyle: 1,
            bottomColor: '#1f2937',
            shoeStyle: 1,
            shoeColor: '#1f2937',
            accessory: 0,
            gear: 0,
            wing: 0,
            mount: 0,
            dragon: 0
        };

        ChibiModule.updatePreview();
        ChibiModule.switchTab(ChibiModule.activeTab);
        Utils.showToast("Đã khôi phục thiết kế ban đầu!", "success");
    },

    /**
     * Generate cohesive beautiful random Chibi config
     */
    randomizeBuilder: function() {
        // Grab a random item from array
        const randItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
        // Grab random style from count
        const randStyle = (maxCount) => Math.floor(Math.random() * maxCount);

        const randomSkin = randItem(ChibiModule.colors.skin);
        const randomHair = randItem(ChibiModule.colors.hair);
        const randomClothing1 = randItem(ChibiModule.colors.clothing);
        const randomClothing2 = randItem(ChibiModule.colors.clothing);
        const randomClothing3 = randItem(ChibiModule.colors.clothing);

        // Filter unlocked accessories for randomization
        const unlockedAccessories = Array.from({ length: ChibiModule.counts.accessory }, (_, i) => i)
            .filter(i => !ChibiModule.isGearLocked(i));
        const randomAccessory = unlockedAccessories.length > 0 ? randItem(unlockedAccessories) : 0;

        ChibiModule.currentConfig = {
            gender: Math.random() > 0.5 ? 'nam' : 'nữ',
            skinColor: randomSkin,
            hairStyle: randStyle(ChibiModule.counts.hair - 1) + 1,
            hairColor: randomHair,
            eyeStyle: randStyle(ChibiModule.counts.eyes),
            mouthStyle: randStyle(ChibiModule.counts.mouth),
            topStyle: randStyle(ChibiModule.counts.top - 1) + 1,
            topColor: randomClothing1,
            bottomStyle: randStyle(ChibiModule.counts.bottom - 1) + 1,
            bottomColor: randomClothing2,
            shoeStyle: randStyle(ChibiModule.counts.shoe - 1) + 1,
            shoeColor: randomClothing3,
            accessory: randomAccessory,
            gear: randStyle(ChibiModule.counts.gear),
            wing: randStyle(ChibiModule.counts.wing),
            mount: randStyle(ChibiModule.counts.mount),
            dragon: randStyle(ChibiModule.counts.dragon)
        };

        ChibiModule.updatePreview();
        ChibiModule.switchTab(ChibiModule.activeTab);
        Utils.showToast("🎲 Bùm! Một bé Chibi siêu dễ thương đã xuất hiện!", "success");
    },

    /**
     * Close builder modal
     */
    closeBuilder: function() {
        const overlay = document.getElementById('chibi-builder-modal-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            overlay.style.pointerEvents = 'none';
            setTimeout(() => {
                overlay.remove();
            }, 300);
        }
    },

    /**
     * Save completed chibi design back to user profile and database
     */
    saveBuilder: async function() {
        const user = Auth.currentUser;
        if (!user) return;

        if (ChibiModule.isGearLocked(ChibiModule.currentConfig.accessory)) {
            const req = ChibiModule.gearRequirements[ChibiModule.currentConfig.accessory];
            const completed = ChibiModule.getCompletedTasksCount();
            Utils.showToast(`🔒 Bạn không thể lưu vì trang bị "${req ? req.label : ''}" đang khóa! (Hiện tại: ${completed}/${req ? req.count : 0})`, "error");
            return;
        }

        const profile = user.profile || {};
        profile.chibiConfig = { ...ChibiModule.currentConfig };
        user.profile = profile;

        // Save back to Auth.currentUser
        Utils.storage.set(Auth.currentUserKey, user);

        // Update in Accounts database
        try {
            const accounts = await Auth.getAccounts();
            const accIdx = accounts.findIndex(a => a.username === user.username);
            if (accIdx > -1) {
                accounts[accIdx].profile = profile;
                await Auth.saveAccounts(accounts);
            }
            
            Utils.showToast("🎉 Thiết kế Chibi đã được lưu thành công!", "success");
            
            // Close builder
            ChibiModule.closeBuilder();

            // Re-render core apps
            Auth.showApp();
            
            // Also re-render rewards cards if page is active
            if (typeof RewardsModule !== 'undefined' && document.getElementById('rewards-view') && document.getElementById('rewards-view').style.display !== 'none') {
                RewardsModule.render();
            }
        } catch (e) {
            console.error("Error saving chibi profile:", e);
            Utils.showToast("Có lỗi xảy ra khi lưu Chibi!", "error");
        }
    }
};
