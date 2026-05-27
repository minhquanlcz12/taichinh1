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
        top: 11,      // Added Ao Dai (index 10)
        bottom: 8,
        shoe: 8,       // Added Guốc Mộc (index 7)
        accessory: 15, // Added Khăn Đóng (index 14)
        gear: 20,
        wing: 8,
        mount: 5,
        dragon: 4,
        aura: 6        // Added V5 Magic Circles
    },

    // State
    currentConfig: null,
    activeTab: 'skin',

    gearRequirements: {
        gear: {
            1: { label: "Đại Đao Lửa", requiredLevel: 2 },
            2: { label: "Súng Vô Cực", requiredLevel: 2 },
            3: { label: "Kiếm Cyber Laser", requiredLevel: 3 },
            4: { label: "Thương Heo Tộc", requiredLevel: 1 },
            5: { label: "Dép Tổ Ong Vàng", requiredLevel: 1 },
            6: { label: "Chổi Tre Âm Dương", requiredLevel: 2 },
            7: { label: "Muỗng Mì Hảo Hạng", requiredLevel: 1 },
            8: { label: "Gậy Selfie Cánh Vàng", requiredLevel: 4 },
            9: { label: "Cờ Lê Tia Chớp", requiredLevel: 3 },
            10: { label: "Cây Lau Nhà Ma Thuật", requiredLevel: 2 },
            11: { label: "Nón Lá Phi Tiêu", requiredLevel: 4 },
            12: { label: "Vợt Muỗi Điện", requiredLevel: 3 },
            13: { label: "Ghế Đỏ Quyền Lực", requiredLevel: 5 },
            14: { label: "Quạt Trúc Thanh Lương", requiredLevel: 2 },
            15: { label: "Lồng Đèn Hội An", requiredLevel: 3 },
            16: { label: "Gánh Hàng Rong", requiredLevel: 3 },
            17: { label: "Bánh Mì Sài Gòn", requiredLevel: 1 },
            18: { label: "Cà Phê Phin", requiredLevel: 2 },
            19: { label: "Dép Tổ Ong Huyền Thoại", requiredLevel: 1 }
        },
        mount: {
            1: { label: "Ô Tô Siêu Cấp", requiredLevel: 7 },
            2: { label: "Xe Máy Cực Ngầu", requiredLevel: 5 },
            3: { label: "Phao Hồng Hạc", requiredLevel: 5 },
            4: { label: "Xe Máy Dream Neon", requiredLevel: 8 }
        },
        wing: {
            1: { label: "Cánh Thiên Thần", requiredLevel: 5 },
            2: { label: "Cánh Ác Quỷ", requiredLevel: 6 },
            3: { label: "Cánh Thiên Thần VIP", requiredLevel: 7 },
            4: { label: "Cánh Bướm Pha Lê", requiredLevel: 8 },
            5: { label: "Cánh Phượng Hoàng Lửa", requiredLevel: 9 },
            6: { label: "Cánh Dơi Hắc Ám", requiredLevel: 10 },
            7: { label: "Cánh Băng Tuyết VIP", requiredLevel: 12 }
        },
        dragon: {
            1: { label: "Lam Long Thần", requiredLevel: 7 },
            2: { label: "Xích Long Thần", requiredLevel: 9 },
            3: { label: "Hoàng Long Thần", requiredLevel: 12 }
        },
        accessory: {
            11: { label: "Mũ Cối Kháng Chiến", requiredLevel: 3 },
            12: { label: "Nón Lá Truyền Thống", requiredLevel: 3 },
            13: { label: "Khăn Rằn Nam Bộ", requiredLevel: 2 }
        }
    },

    // NEW: Full SET Presets
    presets: [
        {
            id: 'set-vietnam-male',
            name: '🇻🇳 Áo Dài Truyền Thống (Nam)',
            desc: 'Vẻ đẹp văn hóa Việt bản Premium',
            config: {
                gender: 'nam', skinColor: '#ffcd94',
                hairStyle: 4, hairColor: '#111827',
                topStyle: 7, topColor: '#1e40af',
                bottomStyle: 1, bottomColor: '#ffffff',
                shoeStyle: 7, accessory: 13,
                gear: 0, aura: 5
            }
        },
        {
            id: 'set-vietnam-female',
            name: '🇻🇳 Áo Dài Duyênt Dáng (Nữ)',
            desc: 'Nét đẹp dịu dàng thiếu nữ Việt',
            config: {
                gender: 'nữ', skinColor: '#ffe0bd',
                hairStyle: 5, hairColor: '#111827',
                topStyle: 7, topColor: '#ec4899',
                bottomStyle: 1, bottomColor: '#ffffff',
                shoeStyle: 7, accessory: 12,
                gear: 0, aura: 2
            }
        },
        {
            id: 'set-cyber-v5',
            name: '⚡ Cyber Warrior V5',
            desc: 'Chiến binh tương lai bản Premium',
            config: {
                gender: 'nam', skinColor: '#ffcd94',
                hairStyle: 2, hairColor: '#00f3ff',
                topStyle: 3, topColor: '#1e2937',
                bottomStyle: 6, bottomColor: '#1f2937',
                shoeStyle: 4, gear: 1, aura: 1, wing: 6, dragon: 1
            }
        },
        {
            id: 'set-royal-mage',
            name: '🔮 Royal Mage V5',
            desc: 'Pháp sư hoàng gia huyền bí',
            config: {
                gender: 'nữ', skinColor: '#ffe0bd',
                hairStyle: 3, hairColor: '#7c3aed',
                topStyle: 4, topColor: '#4c1d95',
                bottomStyle: 2, bottomColor: '#1e1b4b',
                shoeStyle: 2, gear: 3, aura: 2, wing: 4, dragon: 3
            }
        },
        {
            id: 'set-to-ong',
            name: '🐝 Thần Thánh Tổ Ong V5',
            desc: 'Combo huyền thoại xóm làng',
            config: {
                gender: 'nam', skinColor: '#ffcd94',
                hairStyle: 1, hairColor: '#343a40',
                topStyle: 1, topColor: '#ffffff',
                bottomStyle: 1, bottomColor: '#3b82f6',
                shoeStyle: 1, gear: 19, accessory: 11, aura: 1
            }
        }
    ],

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

    isGearLocked: function(index, category) {
        // Kiểm tra trang bị có bị khóa theo Level không
        if (typeof Auth === 'undefined' || !Auth.currentUser) return true;
        if (Auth.currentUser.role === 'admin') return false;

        const userLevel = Auth.currentUser.level || 1;
        const cat = category || ChibiModule.activeTab || 'gear';
        const reqs = ChibiModule.gearRequirements[cat];
        if (!reqs || !reqs[index]) return false; // Không có yêu cầu = luôn mở

        return userLevel < reqs[index].requiredLevel;
    },

    /**
     * Helper to lighten/darken a color (hex)
     */
    adjustColor: function(color, percent) {
        const num = parseInt(color.replace("#",""), 16),
            amt = Math.round(2.55 * percent),
            R = (num >> 16) + amt,
            G = (num >> 8 & 0x00FF) + amt,
            B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R<255?R<0?0:R:255)*0x10000 + (G<255?G<0?0:G:255)*0x100 + (B<255?B<0?0:B:255)).toString(16).slice(1);
    },

    /**
     * Render complete composite Chibi SVG
     */
    renderChibiSVG: function(config, isDancing, meritPoints) {
        const defaults = {
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
            dragon: 0,
            aura: 0
        };
        const c = { ...defaults, ...config };

        const isD = isDancing !== undefined ? isDancing : true;
        const pts = meritPoints !== undefined ? meritPoints : 0;

        const gender = c.gender || 'nam';
        const skinColor = c.skinColor || (gender === 'nam' ? '#ffd1a9' : '#fff0e6');
        const hairColor = c.hairColor || '#343a40';
        const topColor = c.topColor || '#e83e8c';
        const bottomColor = c.bottomColor || '#007bff';
        const shoeStyle = c.shoeStyle !== undefined ? c.shoeStyle : 1;
        const shoeColor = c.shoeColor || '#1f2937';
        const hc = hairColor;

        // 0. Dynamic ViewBox & Scaling optimized per VIP accessory for maximum size
        let viewBox = "0 0 200 200";
        if (c.gear > 0 || c.wing > 0 || c.mount > 0 || c.dragon > 0 || c.aura > 0) {
            viewBox = "-55 -55 310 310"; // Keep expanded for other large/VVIP categories
        } else if (c.accessory === 11) {
            viewBox = "-42 -42 284 284"; // Guan Dao (Epic flame weapon)
        } else if (c.accessory === 12) {
            viewBox = "0 0 200 200"; // Infinite Sci-Fi Rifle (Held close, fits standard, 100% scale!)
        } else if (c.accessory === 13) {
            viewBox = "-12 -12 224 224"; // Cyber Laser Sword (89% scale)
        } else if (c.accessory === 14) {
            viewBox = "-5 -5 210 210"; // Sports Car Rider (95% scale!)
        } else if (c.accessory === 15) {
            viewBox = "-5 -5 210 210"; // Cyber Motorcycle Rider (95% scale!)
        } else if (c.accessory === 16) {
            viewBox = "0 0 200 200"; // Pink Flamingo Swim Float (Standard fits perfectly, 100% scale!)
        } else if (c.accessory === 17 || c.accessory === 18) {
            viewBox = "-15 -15 230 230"; // VVIP Wings (Angel / Devil, 87% scale)
        } else if (c.accessory >= 11 && c.accessory <= 18) {
            viewBox = "-55 -55 310 310"; // Fallback for other special accessories
        }

        // 1.5 Aura / Magic Circle Layer (Under Feet) - UPGRADED V5 PREMIUM
        let auraHtml = '';
        if (pts > 0 || c.aura >= 1) { // Merit now automatically gives a basic aura
            const auraIdx = c.aura || (pts > 50 ? 3 : (pts > 20 ? 1 : 0));
            if (auraIdx > 0) {
                const auraColors = {
                    1: { name: 'Cyber Neon', main: '#00f3ff', alt: '#3b82f6' },
                    2: { name: 'Royal Magic', main: '#c084fc', alt: '#7c3aed' },
                    3: { name: 'Inferno', main: '#facc15', alt: '#ef4444' },
                    4: { name: 'Void Blood', main: '#ef4444', alt: '#7f1d1d' },
                    5: { name: 'Zen Forest', main: '#22c55e', alt: '#166534' }
                };
                const aCol = auraColors[auraIdx] || auraColors[1];
                
                // Detailed 3-layer V5 Magic Circle
                auraHtml = `
                    <g transform="translate(100, 185)" filter="url(#glowStrong)">
                        <!-- Ground Glow -->
                        <ellipse rx="55" ry="18" fill="${aCol.main}" opacity="0.1" />
                        <!-- Outer Ring (Slow spin) -->
                        <g style="animation: runeRotate 15s linear infinite;">
                            <ellipse rx="52" ry="16" fill="none" stroke="${aCol.main}" stroke-width="2.2" stroke-dasharray="10 4" opacity="0.8"/>
                            <ellipse rx="48" ry="14" fill="none" stroke="${aCol.main}" stroke-width="0.8" opacity="0.4"/>
                            <line x1="-50" y1="0" x2="-44" y2="0" stroke="${aCol.main}" stroke-width="2" stroke-linecap="round"/>
                            <line x1="44" y1="0" x2="50" y2="0" stroke="${aCol.main}" stroke-width="2" stroke-linecap="round"/>
                            <line x1="0" y1="-15" x2="0" y2="-11" stroke="${aCol.main}" stroke-width="2" stroke-linecap="round"/>
                            <line x1="0" y1="11" x2="0" y2="15" stroke="${aCol.main}" stroke-width="2" stroke-linecap="round"/>
                        </g>
                        <!-- Middle Ring (Reverse spin) -->
                        <g style="animation: runeRotateRev 20s linear infinite;">
                            <ellipse rx="38" ry="11" fill="none" stroke="${aCol.alt}" stroke-width="1.8" stroke-dasharray="6 8" opacity="0.7"/>
                            <path d="M -32 -6 L 32 6 M 32 -6 L -32 6" fill="none" stroke="${aCol.alt}" stroke-width="0.6" opacity="0.5"/>
                        </g>
                        <!-- Inner Core (Pulsing) -->
                        <g style="animation: runeRotate 6s linear infinite;">
                            <ellipse rx="12" ry="4" fill="none" stroke="${aCol.main}" stroke-width="1.2" opacity="0.8"/>
                        </g>
                        <ellipse rx="5" ry="2" fill="${aCol.main}" opacity="0.6" style="animation: glowPulse 2s ease-in-out infinite;">
                            <animate attributeName="rx" values="4;7;4" dur="2s" repeatCount="indefinite"/>
                        </ellipse>
                    </g>
                `;
            }
        }

        // 1. Dragon Spirit Layer (Majestic Spirits V2 - PREMIUM)
        let dragonHtml = '';
        if (c.dragon >= 1 && c.dragon <= 3) {
            const colors = {
                1: { main: '#00f3ff', alt: '#3b82f6', glow: '#60a5fa', id: 'blue' },
                2: { main: '#ef4444', alt: '#7f1d1d', glow: '#f87171', id: 'red' },
                3: { main: '#facc15', alt: '#d97706', glow: '#fbef5a', id: 'gold' }
            };
            const col = colors[c.dragon];
            dragonHtml = `
                <g class="dragon-wrap" style="filter: drop-shadow(0 0 15px ${col.main});">
                    <defs>
                        <linearGradient id="dragonGrad-${col.id}" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stop-color="${col.alt}" />
                            <stop offset="50%" stop-color="${col.main}" />
                            <stop offset="100%" stop-color="${col.alt}" />
                        </linearGradient>
                    </defs>
                    <!-- Serpentine Body V2 -->
                    <path d="M 80 50 Q 40 10 110 5 T 160 35 T 130 75" fill="none" stroke="url(#dragonGrad-${col.id})" stroke-width="8" stroke-linecap="round" style="animation: dragonWave 4s infinite ease-in-out;" />
                    <path d="M 80 50 Q 40 10 110 5 T 160 35 T 130 75" fill="none" stroke="#fff" stroke-width="1.5" stroke-dasharray="1 6" opacity="0.8" style="animation: dragonWave 4s infinite ease-in-out;" />
                    
                    <!-- Majestic Head V2 -->
                    <g style="animation: dragonWave 4s infinite ease-in-out;">
                        <g transform="translate(75, 45)">
                            <path d="M 0 0 C -12 -8 -20 12 5 12 C 20 12 15 -8 0 0" fill="${col.main}" />
                            <path d="M -6 -4 L -15 -18 M 6 -4 L 15 -18" stroke="${col.glow}" stroke-width="2.5" stroke-linecap="round" /> <!-- Glowing Horns -->
                            <path d="M -9 6 Q -20 10 -15 20 M 9 6 Q 20 10 15 20" stroke="${col.alt}" stroke-width="1" fill="none" /> <!-- Long Whiskers -->
                            <path d="M -7 -6 Q 0 -22 7 -6" fill="#fff" opacity="0.6" /> <!-- Mane -->
                            <circle cx="-3" cy="5" r="2" fill="#fff" style="animation: eyeGlow 1s infinite alternate;" /> 
                            <circle cx="3" cy="5" r="2" fill="#fff" style="animation: eyeGlow 1s infinite alternate;" />
                        </g>
                    </g>
                    
                    <!-- Energy Particles -->
                    <circle cx="100" cy="15" r="1.5" fill="#fff"><animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" /></circle>
                    <circle cx="150" cy="40" r="1.5" fill="#fff"><animate attributeName="opacity" values="0;1;0" dur="2.5s" repeatCount="indefinite" /></circle>
                </g>
                <style>
                    @keyframes dragonWave { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-10px) rotate(2deg); } }
                </style>
            `;
        }

        // 2. Wing Layer (Premium Reskin V5 - High-Fidelity)
        let wingHtml = '';
        if (c.wing === 1) { // 🕊️ Divine Angel Wings (Premium V5)
            wingHtml = `
                <g class="${isD ? 'chibi-wing-flap' : ''}" filter="url(#glowStrong)">
                    <defs>
                        <linearGradient id="wingGrad-angelV5" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stop-color="#ffffff" />
                            <stop offset="60%" stop-color="#cbd5e1" />
                            <stop offset="100%" stop-color="#d8b4fe" />
                        </linearGradient>
                    </defs>
                    <g>
                        <!-- Main Feather Layer -->
                        <path d="M 100 110 C 20 50 -80 160 50 200 Q 75 210 100 130" fill="url(#wingGrad-angelV5)" stroke="#fff" stroke-width="0.8" />
                        <!-- Inner Feather Layer -->
                        <path d="M 100 115 C 50 80 -20 150 70 180 Q 85 190 100 135" fill="rgba(255,255,255,0.4)" stroke="#fff" stroke-width="0.5" />
                        <!-- Feather Detail Lines -->
                        <path d="M 35 105 L 65 120 M 20 135 L 70 145 M 30 165 L 80 170" stroke="rgba(255,255,255,0.8)" stroke-width="1.8" stroke-linecap="round" />
                        <!-- Sparkling Particles -->
                        <circle cx="40" cy="140" r="1.5" fill="#fff" style="animation: floatSparkle 1.5s infinite;" />
                        <circle cx="60" cy="160" r="1" fill="#fff" style="animation: floatSparkle 2s infinite 0.5s;" />
                    </g>
                    <g transform="translate(100, 110) scale(-1, 1) translate(-100, -110)">
                        <path d="M 100 110 C 20 50 -80 160 50 200 Q 75 210 100 130" fill="url(#wingGrad-angelV5)" stroke="#fff" stroke-width="0.8" />
                        <path d="M 100 115 C 50 80 -20 150 70 180 Q 85 190 100 135" fill="rgba(255,255,255,0.4)" stroke="#fff" stroke-width="0.5" />
                        <path d="M 35 105 L 65 120 M 20 135 L 70 145 M 30 165 L 80 170" stroke="rgba(255,255,255,0.8)" stroke-width="1.8" stroke-linecap="round" />
                        <circle cx="40" cy="140" r="1.5" fill="#fff" style="animation: floatSparkle 1.5s infinite;" />
                    </g>
                </g>
            `;
        } else if (c.wing === 2) { // 🦇 Dread Bat Wings (Premium V5)
            wingHtml = `
                <g class="${isD ? 'chibi-wing-flap' : ''}" style="filter: drop-shadow(0 0 10px #ef4444);">
                    <g>
                        <!-- Wing Membrane -->
                        <path d="M 100 110 L 10 50 L 50 110 L 5 160 L 65 160 L 45 220 L 100 140" fill="rgba(34, 17, 17, 0.9)" stroke="#ef4444" stroke-width="1.5" />
                        <!-- Bone Structure -->
                        <path d="M 100 110 L 12 52 M 100 110 L 52 112 M 100 110 L 7 162" stroke="#450a0a" stroke-width="3" stroke-linecap="round" />
                        <path d="M 12 52 L 5 45 Q 10 35 20 45" fill="#450a0a" /> <!-- Bone claw tip -->
                    </g>
                    <g transform="translate(100, 110) scale(-1, 1) translate(-100, -110)">
                        <path d="M 100 110 L 10 50 L 50 110 L 5 160 L 65 160 L 45 220 L 100 140" fill="rgba(34, 17, 17, 0.9)" stroke="#ef4444" stroke-width="1.5" />
                        <path d="M 100 110 L 12 52 M 100 110 L 52 112 M 100 110 L 7 162" stroke="#450a0a" stroke-width="3" stroke-linecap="round" />
                        <path d="M 12 52 L 5 45 Q 10 35 20 45" fill="#450a0a" />
                    </g>
                </g>
            `;
        } else if (c.wing === 3) { // 👑 Imperial Gold Wings (Premium V5)
            wingHtml = `
                <g class="${isD ? 'chibi-wing-flap' : ''}" style="filter: drop-shadow(0 0 15px #facc15);">
                    <defs>
                        <linearGradient id="goldWingV5" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#fff" /><stop offset="30%" stop-color="#fef08a" /><stop offset="70%" stop-color="#facc15" /><stop offset="100%" stop-color="#854d0e" />
                        </linearGradient>
                    </defs>
                    <g>
                        <!-- Metallic Feather Layers -->
                        <path d="M 100 110 C -10 20 -130 180 70 215 L 100 135" fill="url(#goldWingV5)" stroke="#854d0e" stroke-width="0.5" />
                        <path d="M 90 115 C 20 50 -50 160 85 185" fill="rgba(255,255,255,0.3)" />
                        <!-- Holy Rays -->
                        <line x1="10" y1="80" x2="60" y2="120" stroke="#fff" stroke-width="4" opacity="0.3" stroke-linecap="round" style="animation: glowPulse 2s infinite;" />
                        <line x1="5" y1="120" x2="65" y2="140" stroke="#fff" stroke-width="3" opacity="0.2" stroke-linecap="round" />
                    </g>
                    <g transform="translate(100, 110) scale(-1, 1) translate(-100, -110)">
                        <path d="M 100 110 C -10 20 -130 180 70 215 L 100 135" fill="url(#goldWingV5)" stroke="#854d0e" stroke-width="0.5" />
                        <path d="M 90 115 C 20 50 -50 160 85 185" fill="rgba(255,255,255,0.3)" />
                        <line x1="10" y1="80" x2="60" y2="120" stroke="#fff" stroke-width="4" opacity="0.3" stroke-linecap="round" style="animation: glowPulse 2s infinite;" />
                    </g>
                </g>
            `;
        } else if (c.wing === 4) { // 💠 Crystal Shard Wings (Premium V5)
            wingHtml = `
                <g class="${isD ? 'chibi-wing-flap' : ''}" style="filter: drop-shadow(0 0 15px #22d3ee);">
                    <g>
                        <!-- Main Crystal Shards -->
                        <path d="M 100 120 L -10 30 L 50 110 L -20 200 L 100 150" fill="rgba(34, 211, 238, 0.4)" stroke="#fff" stroke-width="1.5" />
                        <path d="M 100 120 L 20 60 L 60 115 L 15 170 L 100 145" fill="rgba(255, 255, 255, 0.3)" />
                        <!-- Core Core -->
                        <path d="M 100 120 L 50 115 L 100 125" fill="#fff" />
                        <!-- Neon Pulse -->
                        <path d="M -10 30 L 50 110 L -20 200" fill="none" stroke="#22d3ee" stroke-width="1" opacity="0.8" style="animation: glowPulse 1.5s infinite;" />
                    </g>
                    <g transform="translate(100, 120) scale(-1, 1) translate(-100, -120)">
                        <path d="M 100 120 L -10 30 L 50 110 L -20 200 L 100 150" fill="rgba(34, 211, 238, 0.4)" stroke="#fff" stroke-width="1.5" />
                        <path d="M 100 120 L 20 60 L 60 115 L 15 170 L 100 145" fill="rgba(255, 255, 255, 0.3)" />
                    </g>
                </g>
            `;
        } else if (c.wing === 5) { // 🔥 Phoenix Inferno Wings (Premium V5)
            wingHtml = `
                <g class="${isD ? 'chibi-wing-flap' : ''}" style="filter: drop-shadow(0 0 20px #f97316);">
                    <defs>
                        <linearGradient id="fireWingV5Grad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stop-color="#fef08a" />
                            <stop offset="40%" stop-color="#f97316" />
                            <stop offset="100%" stop-color="#7c2d12" />
                        </linearGradient>
                    </defs>
                    <g>
                        <!-- Fire Layers -->
                        <path d="M 100 110 C -30 20 -160 150 40 230 L 100 130" fill="url(#fireWingV5Grad)" />
                        <path d="M 95 115 C 20 60 -80 140 70 200" fill="rgba(251, 191, 36, 0.5)" style="animation: fireDance 0.8s infinite;" />
                        <!-- Embers -->
                        <circle cx="10" cy="120" r="2" fill="#facc15" style="animation: floatSparkle 1.2s infinite;" />
                        <circle cx="30" cy="180" r="1.5" fill="#facc15" style="animation: floatSparkle 1.5s infinite 0.3s;" />
                        <circle cx="0" cy="80" r="1" fill="#fff" style="animation: floatSparkle 2s infinite 0.7s;" />
                    </g>
                    <g transform="translate(100, 110) scale(-1, 1) translate(-100, -110)">
                        <path d="M 100 110 C -30 20 -160 150 40 230 L 100 130" fill="url(#fireWingV5Grad)" />
                        <path d="M 95 115 C 20 60 -80 140 70 200" fill="rgba(251, 191, 36, 0.5)" style="animation: fireDance 0.8s infinite;" />
                    </g>
                </g>
            `;
        } else if (c.wing === 6) { // 🧿 Harbinger Void Wings (Premium V5)
            wingHtml = `
                <g class="${isD ? 'chibi-wing-flap' : ''}" style="filter: drop-shadow(0 0 15px #a855f7);">
                    <g>
                        <!-- Jagged Void Shards -->
                        <path d="M 100 110 L -20 20 L 40 120 L -30 180 L 60 180 L 20 250 L 100 145" fill="#1e1b4b" stroke="#7e22ce" stroke-width="2.5" />
                        <!-- Core Void Pulse -->
                        <path d="M 100 110 L 10 70 L 50 125 L 10 160 L 100 140" fill="rgba(168, 85, 247, 0.3)" style="animation: glowPulse 2s infinite;" />
                        <!-- Pulsing Void Eyes -->
                        <g transform="translate(-5, 60) scale(0.6)">
                            <ellipse rx="8" ry="10" fill="#fff" />
                            <circle r="4" fill="#a855f7" style="animation: eyeGlow 0.8s infinite alternate;" />
                        </g>
                        <g transform="translate(-15, 140) scale(0.5)">
                            <ellipse rx="8" ry="10" fill="#fff" />
                            <circle r="4" fill="#a855f7" style="animation: eyeGlow 1.2s infinite alternate;" />
                        </g>
                    </g>
                    <g transform="translate(100, 110) scale(-1, 1) translate(-100, -110)">
                        <path d="M 100 110 L -20 20 L 40 120 L -30 180 L 60 180 L 20 250 L 100 145" fill="#1e1b4b" stroke="#7e22ce" stroke-width="2.5" />
                        <g transform="translate(-5, 60) scale(0.6)">
                            <ellipse rx="8" ry="10" fill="#fff" />
                            <circle r="4" fill="#a855f7" style="animation: eyeGlow 0.8s infinite alternate;" />
                        </g>
                    </g>
                </g>
            `;
        } else if (c.wing === 7) { // ❄️ Frost Crystalline Wings (Premium V5)
            wingHtml = `
                <g class="${isD ? 'chibi-wing-flap' : ''}" style="filter: drop-shadow(0 0 12px #e0f2fe);">
                    <g>
                        <!-- Ice Form -->
                        <path d="M 100 110 L 0 10 L 60 110 L -10 160 L 80 160 L 40 240 L 100 140" fill="rgba(186, 230, 253, 0.5)" stroke="#fff" stroke-width="1.5" />
                        <!-- Refractive Highlight -->
                        <path d="M 100 110 L 25 35 L 55 105 L 15 150 L 100 135" fill="rgba(255,255,255,0.4)" stroke="#fff" stroke-width="0.5" />
                        <!-- Snow Particles -->
                        <circle cx="20" cy="60" r="1.2" fill="#fff" opacity="0.8" style="animation: floatSparkle 3s infinite;" />
                        <circle cx="45" cy="130" r="1" fill="#fff" opacity="0.6" style="animation: floatSparkle 2.5s infinite 1s;" />
                        <circle cx="5" cy="180" r="1.5" fill="#fff" opacity="0.7" style="animation: floatSparkle 4s infinite 0.5s;" />
                    </g>
                    <g transform="translate(100, 110) scale(-1, 1) translate(-100, -110)">
                        <path d="M 100 110 L 0 10 L 60 110 L -10 160 L 80 160 L 40 240 L 100 140" fill="rgba(186, 230, 253, 0.5)" stroke="#fff" stroke-width="1.5" />
                        <circle cx="20" cy="60" r="1.2" fill="#fff" opacity="0.8" style="animation: floatSparkle 3s infinite;" />
                    </g>
                </g>
            `;
        }

        if (c.hairStyle === 1) { // Basic
            hairHtml = `<path d="M 85 105 Q 100 85 115 105 L 115 115 Q 100 105 85 115 Z" fill="${hc}" />`;
        } else if (c.hairStyle === 2) { // Spiky Cyber
            hairHtml = `
                <path d="M 85 105 Q 100 65 115 105" fill="${hc}" />
                <path d="M 85 105 L 80 90 L 90 100 L 95 80 L 100 100 L 105 80 L 110 100 L 120 90 L 115 105 Z" fill="${hc}" stroke="#fff" stroke-width="0.5" />
            `;
        } else if (c.hairStyle === 3) { // Mohawk
            hairHtml = `
                <path d="M 82 105 L 118 105 L 118 115 L 82 115 Z" fill="${hc}" opacity="0.4" />
                <path d="M 95 105 L 95 65 Q 100 60 105 65 L 105 105 Z" fill="${hc}" stroke="#fff" stroke-width="1" />
            `;
        } else if (c.hairStyle === 4) { // Samurai Bun
            hairHtml = `
                <path d="M 85 105 Q 100 85 115 105 Q 115 115 100 115 Q 85 115 85 105" fill="${hc}" />
                <circle cx="100" cy="85" r="8" fill="${hc}" />
                <rect x="97" y="80" width="6" height="15" fill="#555" transform="rotate(45 100 85)" />
            `;
        } else if (c.hairStyle === 5) { // Long Braids
            hairHtml = `
                <path d="M 85 105 Q 100 85 115 105" fill="${hc}" />
                <path d="M 85 105 L 80 145" stroke="${hc}" stroke-width="4" stroke-dasharray="5 2" />
                <path d="M 115 105 L 120 145" stroke="${hc}" stroke-width="4" stroke-dasharray="5 2" />
            `;
        } else if (c.hairStyle === 6) { // Pompadour Rocker
            hairHtml = `
                <path d="M 80 105 Q 100 50 120 105 L 115 115 Q 100 105 85 115 Z" fill="${hc}" />
                <path d="M 80 105 Q 100 60 120 105" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2" />
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

        // 5. Body Parts (V5 Premium - Gender Specific)
        let bodyBaseHtml = '';
        if (gender === 'nam') {
            bodyBaseHtml = `
                <g class="chibi-breathe">
                    <!-- Neck -->
                    <rect x="95" y="104" width="10" height="14" rx="3" fill="url(#skinGradV5)" stroke="${this.adjustColor(skinColor, -30)}" stroke-width="1.5"/>
                    <!-- Legs -->
                    <path d="M 87 148 Q 84 168 82 178 C 81 183 89 184 91 179 L 95 148 Z" fill="url(#skinGradV5)" stroke="${this.adjustColor(skinColor, -30)}" stroke-width="1.5"/>
                    <path d="M 113 148 Q 116 168 118 178 C 119 183 111 184 109 179 L 105 148 Z" fill="url(#skinGradV5)" stroke="${this.adjustColor(skinColor, -30)}" stroke-width="1.5"/>
                    <!-- Torso -->
                    <path d="M 86 114 Q 100 110 114 114 L 117 148 Q 100 152 83 148 Z" fill="url(#skinGradV5)" stroke="${this.adjustColor(skinColor, -30)}" stroke-width="1.5"/>
                    ${armsHtml}
                    <!-- Head Base -->
                    <ellipse cx="63" cy="82" rx="7" ry="8" fill="url(#skinGradV5)" stroke="${this.adjustColor(skinColor, -25)}" stroke-width="1.5"/>
                    <ellipse cx="137" cy="82" rx="7" ry="8" fill="url(#skinGradV5)" stroke="${this.adjustColor(skinColor, -25)}" stroke-width="1.5"/>
                    <ellipse cx="100" cy="80" rx="38" ry="34" fill="url(#skinGradV5)" stroke="${this.adjustColor(skinColor, -25)}" stroke-width="2"/>
                    <ellipse cx="76" cy="88" rx="6" ry="3" fill="#f43f5e" opacity="0.25"/>
                    <ellipse cx="124" cy="88" rx="6" ry="3" fill="#f43f5e" opacity="0.25"/>
                </g>
            `;
        } else { // Nữ - Slender & Elegant
            bodyBaseHtml = `
                <g class="chibi-breathe">
                    <!-- Neck (slender) -->
                    <rect x="96" y="106" width="8" height="12" rx="3" fill="url(#skinGradV5)" stroke="${this.adjustColor(skinColor, -30)}" stroke-width="1.2"/>
                    <!-- Legs (slender) -->
                    <path d="M 90 155 Q 88 172 87 180 C 86 184 92 184 93 180 L 95 155 Z" fill="url(#skinGradV5)" stroke="${this.adjustColor(skinColor, -30)}" stroke-width="1.2"/>
                    <path d="M 110 155 Q 112 172 113 180 C 114 184 108 184 107 180 L 105 155 Z" fill="url(#skinGradV5)" stroke="${this.adjustColor(skinColor, -30)}" stroke-width="1.2"/>
                    <!-- Torso (slender) -->
                    <path d="M 88 116 Q 100 114 112 116 L 114 150 Q 100 155 86 150 Z" fill="url(#skinGradV5)" stroke="${this.adjustColor(skinColor, -30)}" stroke-width="1.2"/>
                    ${armsHtml}
                    <!-- Head Base -->
                    <ellipse cx="63" cy="82" rx="6" ry="7" fill="url(#skinGradV5)" stroke="${this.adjustColor(skinColor, -25)}" stroke-width="1.2"/>
                    <ellipse cx="137" cy="82" rx="6" ry="7" fill="url(#skinGradV5)" stroke="${this.adjustColor(skinColor, -25)}" stroke-width="1.2"/>
                    <ellipse cx="100" cy="80" rx="36" ry="33" fill="url(#skinGradV5)" stroke="${this.adjustColor(skinColor, -25)}" stroke-width="1.8"/>
                    <ellipse cx="78" cy="88" rx="7" ry="3.5" fill="#f43f5e" opacity="0.2"/>
                    <ellipse cx="122" cy="88" rx="7" ry="3.5" fill="#f43f5e" opacity="0.2"/>
                </g>
            `;
        }

        // 6. Clothing Selection
        let bottomHtml = '';
        if (c.bottomStyle === 1) bottomHtml = `<path d="M 84 138 L 116 138 L 118 160 L 102 160 L 100 146 L 98 160 L 82 160 Z" fill="${bottomColor}" stroke="#1e1b4b" stroke-width="2.5" />`;
        else if (c.bottomStyle === 2) bottomHtml = `<path d="M 85 138 L 115 138 L 122 154 Q 100 158 78 154 Z" fill="${bottomColor}" stroke="#1e1b4b" stroke-width="2.5" />`;
        else if (c.bottomStyle === 3) bottomHtml = `<path d="M 84 138 L 116 138 L 117 150 L 102 150 L 100 144 L 98 150 L 83 150 Z" fill="${bottomColor}" stroke="#1e1b4b" stroke-width="2.5" />`;
        else if (c.bottomStyle === 6) bottomHtml = `<path d="M 84 138 L 116 138 L 118 160 L 102 160 L 100 146 L 98 160 L 82 160 Z" fill="${bottomColor}" stroke="#1e1b4b" stroke-width="2.5" /><line x1="83" y1="145" x2="97" y2="145" stroke="#00f3ff" stroke-width="2" />`;

        let topHtml = '';
        if (c.topStyle === 1) { // Basic Shirt
            topHtml = `<path d="M 88 114 Q 100 112 112 114 L 115 138 Q 100 140 85 138 Z" fill="${topColor}" stroke="#1e1b4b" stroke-width="2.5" />`;
        } else if (c.topStyle === 2) { // Formal Suit
            topHtml = `
                <path d="M 85 114 L 115 114 L 118 140 Q 100 145 82 140 Z" fill="${topColor}" stroke="#1e1b4b" stroke-width="2.5" />
                <path d="M 100 114 L 100 142" stroke="rgba(255,255,255,0.2)" stroke-width="1" />
                <path d="M 100 114 L 94 125 L 100 125 L 106 125 Z" fill="#ef4444" /> <!-- Tie -->
            `;
        } else if (c.topStyle === 3) { // Cyber Armor
            topHtml = `
                <path d="M 88 114 Q 100 112 112 114 L 115 140 Q 100 142 85 140 Z" fill="${topColor}" stroke="#1e1b4b" stroke-width="2.5" />
                <rect x="92" y="120" width="16" height="12" rx="2" fill="rgba(0,243,255,0.2)" stroke="#00f3ff" stroke-width="0.8" />
                <path d="M 88 114 L 95 125 M 112 114 L 105 125" stroke="#00f3ff" stroke-width="1.5" />
            `;
        } else if (c.topStyle === 4) { // Samurai Kimono
            topHtml = `
                <path d="M 85 114 L 115 114 L 125 150 L 75 150 Z" fill="${topColor}" stroke="#1e1b4b" stroke-width="2.5" />
                <path d="M 100 114 L 125 150 M 100 114 L 75 150" stroke="rgba(255,255,255,0.3)" stroke-width="2" />
                <rect x="85" y="140" width="30" height="6" fill="#111" /> <!-- Belt -->
            `;
        } else if (c.topStyle === 5) { // Tactical Vest
            topHtml = `
                <path d="M 88 114 Q 100 112 112 114 L 115 140 Q 100 142 85 140 Z" fill="${topColor}" stroke="#1e1b4b" stroke-width="2.5" />
                <rect x="90" y="118" width="20" height="18" rx="1" fill="rgba(0,0,0,0.3)" stroke="#fff" stroke-width="0.5" />
                <rect x="94" y="122" width="5" height="4" fill="#666" /> <rect x="101" y="122" width="5" height="4" fill="#666" />
            `;
        }

        let shoeHtml = '';
        const sc = shoeColor;
        if (shoeStyle === 0) { // Basic Sneakers
            shoeHtml = `
                <path d="M 78 171 L 91 171 L 93 182 L 80 182 Z" fill="${sc}" stroke="#1e1b4b" stroke-width="2" />
                <path d="M 122 171 L 109 171 L 107 182 L 120 182 Z" fill="${sc}" stroke="#1e1b4b" stroke-width="2" />
            `;
        } else if (shoeStyle === 1) { // 🇻🇳 Dép Tổ Ong V5 (Legendary)
            shoeHtml = `
                <g filter="url(#glowStrong)">
                    <path d="M 77 172 L 92 172 L 94 184 L 76 184 Z" fill="#fef3c7" stroke="#d97706" stroke-width="1.5" />
                    <!-- Honeycomb Holes -->
                    <circle cx="81" cy="176" r="1.2" fill="#d97706" opacity="0.6" />
                    <circle cx="85" cy="176" r="1.2" fill="#d97706" opacity="0.6" />
                    <circle cx="89" cy="176" r="1.2" fill="#d97706" opacity="0.6" />
                    <circle cx="83" cy="180" r="1.2" fill="#d97706" opacity="0.6" />
                    <circle cx="87" cy="180" r="1.2" fill="#d97706" opacity="0.6" />
                    
                    <path d="M 123 172 L 108 172 L 106 184 L 124 184 Z" fill="#fef3c7" stroke="#d97706" stroke-width="1.5" />
                    <circle cx="119" cy="176" r="1.2" fill="#d97706" opacity="0.6" />
                    <circle cx="115" cy="176" r="1.2" fill="#d97706" opacity="0.6" />
                    <circle cx="111" cy="176" r="1.2" fill="#d97706" opacity="0.6" />
                    <circle cx="117" cy="180" r="1.2" fill="#d97706" opacity="0.6" />
                    <circle cx="113" cy="180" r="1.2" fill="#d97706" opacity="0.6" />
                </g>
            `;
        } else if (shoeStyle === 7) { // 🇻🇳 Guốc Mộc (Traditional Wooden Clogs)
            shoeHtml = `
                <g>
                    <!-- Wood Base -->
                    <path d="M 76 178 L 94 178 L 94 186 L 76 186 Z" fill="#78350f" stroke="#451a03" stroke-width="1" />
                    <path d="M 124 178 L 106 178 L 106 186 L 124 186 Z" fill="#78350f" stroke="#451a03" stroke-width="1" />
                    <!-- Strap -->
                    <path d="M 76 178 Q 85 174 94 178" fill="none" stroke="#111" stroke-width="3" />
                    <path d="M 106 178 Q 115 174 124 178" fill="none" stroke="#111" stroke-width="3" />
                </g>
            `;
        } else if (shoeStyle === 2) { // Modern High-top
            shoeHtml = `
                <path d="M 76 168 L 93 168 L 94 184 Q 85 186 75 184 Z" fill="${sc}" stroke="#1e1b4b" stroke-width="2" />
                <path d="M 124 168 L 107 168 L 106 184 Q 115 186 125 184 Z" fill="${sc}" stroke="#1e1b4b" stroke-width="2" />
                <rect x="76" y="178" width="18" height="3" fill="#fff" opacity="0.8" /> <rect x="106" y="178" width="18" height="3" fill="#fff" opacity="0.8" />
            `;
        } else if (shoeStyle === 3) { // Tactical Boots
            shoeHtml = `
                <path d="M 76 164 L 93 164 L 95 184 L 75 184 Z" fill="${sc}" stroke="#1e1b4b" stroke-width="2.5" />
                <path d="M 124 164 L 107 164 L 105 184 L 125 184 Z" fill="${sc}" stroke="#1e1b4b" stroke-width="2.5" />
                <line x1="77" y1="168" x2="92" y2="168" stroke="rgba(255,255,255,0.4)" stroke-width="1.5" />
            `;
        } else if (shoeStyle === 4) { // Cyber Neon Boots
            shoeHtml = `
                <path d="M 76 167 L 93 167 L 95 185 L 75 185 Z" fill="#000" stroke="#00f3ff" stroke-width="2.2" />
                <path d="M 124 167 L 107 167 L 105 185 L 125 185 Z" fill="#000" stroke="#00f3ff" stroke-width="2.2" />
                <circle cx="85" cy="176" r="3" fill="#00f3ff" opacity="0.6" style="filter: blur(2px);" />
                <circle cx="115" cy="176" r="3" fill="#00f3ff" opacity="0.6" style="filter: blur(2px);" />
            `;
        } else if (shoeStyle === 5) { // Leather Loafers
            shoeHtml = `
                <path d="M 78 172 L 94 172 Q 95 184 75 184 Z" fill="${sc}" stroke="#1e1b4b" stroke-width="2" />
                <path d="M 122 172 L 106 172 Q 105 184 125 184 Z" fill="${sc}" stroke="#1e1b4b" stroke-width="2" />
            `;
        } else if (shoeStyle === 6) { // Barefoot (Feet)
            shoeHtml = `
                <path d="M 78 171 Q 84 185 80 185" fill="none" stroke="${skinColor}" stroke-width="4" stroke-linecap="round" />
                <path d="M 122 171 Q 116 185 120 185" fill="none" stroke="${skinColor}" stroke-width="4" stroke-linecap="round" />
            `;
        } else { // Generic
            shoeHtml = `<path d="M 78 171 L 91 171 L 93 182 L 80 182 Z" fill="${sc}" stroke="#1e1b4b" stroke-width="2" />`;
        }

        // 7. Face Layer (Premium Anime V5)
        let eyesHtml = '';
        if (gender === 'nam') {
            eyesHtml = `
                <g transform="translate(84, 78)">
                    <ellipse rx="8" ry="9" fill="#fff" stroke="#1e1b4b" stroke-width="1.5"/>
                    <ellipse rx="6" ry="7" fill="#1e40af" cy="1"/>
                    <ellipse rx="4" ry="5" fill="#1e1b4b" cy="1"/>
                    <circle cx="3" cy="-2" r="2.5" fill="#fff"/>
                    <path d="M -8 -5 Q -6 -9 -2 -9 Q 2 -9 6 -7 Q 8 -5 8 -3" fill="none" stroke="#1e1b4b" stroke-width="2.5" stroke-linecap="round"/>
                </g>
                <g transform="translate(116, 78)">
                    <ellipse rx="8" ry="9" fill="#fff" stroke="#1e1b4b" stroke-width="1.5"/>
                    <ellipse rx="6" ry="7" fill="#1e40af" cy="1"/>
                    <ellipse rx="4" ry="5" fill="#1e1b4b" cy="1"/>
                    <circle cx="-3" cy="-2" r="2.5" fill="#fff"/>
                    <path d="M -8 -3 Q -8 -5 -6 -7 Q -2 -9 2 -9 Q 6 -9 8 -5" fill="none" stroke="#1e1b4b" stroke-width="2.5" stroke-linecap="round"/>
                </g>
            `;
        } else { // Nữ - Elegant Anime Eyes
            eyesHtml = `
                <g transform="translate(84, 78)">
                    <ellipse rx="9" ry="10" fill="#fff" stroke="#1e1b4b" stroke-width="1.2"/>
                    <ellipse rx="7" ry="8" fill="#7c3aed" cy="1"/>
                    <ellipse rx="5" ry="6" fill="#4c1d95" cy="1"/>
                    <circle cx="3" cy="-3" r="3" fill="#fff"/>
                    <path d="M -9 -5 Q -7 -11 0 -11 Q 7 -11 9 -5" fill="none" stroke="#1e1b4b" stroke-width="2.5" stroke-linecap="round"/>
                    <path d="M -10 -6 L -12 -10 M -6 -9 L -8 -13 M 6 -9 L 8 -13 M 10 -6 L 12 -10" stroke="#1e1b4b" stroke-width="1.5" stroke-linecap="round"/>
                </g>
                <g transform="translate(116, 78)">
                    <ellipse rx="9" ry="10" fill="#fff" stroke="#1e1b4b" stroke-width="1.2"/>
                    <ellipse rx="7" ry="8" fill="#7c3aed" cy="1"/>
                    <ellipse rx="5" ry="6" fill="#4c1d95" cy="1"/>
                    <circle cx="-3" cy="-3" r="3" fill="#fff"/>
                    <path d="M -9 -5 Q -7 -11 0 -11 Q 7 -11 9 -5" fill="none" stroke="#1e1b4b" stroke-width="2.5" stroke-linecap="round"/>
                    <path d="M -10 -6 L -12 -10 M -6 -9 L -8 -13 M 6 -9 L -8 -13 M 10 -6 L 12 -10" stroke="#1e1b4b" stroke-width="1.5" stroke-linecap="round"/>
                </g>
            `;
        }

        let mouthHtml = '';
        if (gender === 'nam') {
            mouthHtml = `<path d="M 94 96 Q 100 101 106 96" stroke="#1e1b4b" stroke-width="2" fill="none" stroke-linecap="round"/>`;
        } else {
            mouthHtml = `
                <path d="M 95 96 Q 100 100 105 96" stroke="#ec4899" stroke-width="2" fill="none" stroke-linecap="round"/>
                <path d="M 96 97 Q 100 93 104 97" stroke="#f9a8d4" stroke-width="1" fill="none" opacity="0.5"/>
            `;
        }

        let eyelashesHtml = ''; // Integrated into eyesHtml for V5
        let frontHairHtml = `<path d="M 64 82 Q 64 48 100 42 Q 136 48 136 82 L 133 72 Q 100 60 67 72 Z" fill="url(#hairGradV5)" stroke="${this.adjustColor(hc, -40)}" stroke-width="1.5" />`;
        
        // 8. Clothing & Vietnamese Theme (V5)
        if (c.topStyle === 7) { // 🇻🇳 Áo Dài Việt Nam (Premium V5)
            const aoDaiCol = topColor;
            topHtml = `
                <g filter="url(#glowNeon)">
                    <path d="M 85 110 L 115 110 L 125 180 Q 100 185 75 180 Z" fill="${aoDaiCol}" stroke="${this.adjustColor(aoDaiCol, -20)}" stroke-width="1.5" />
                    <!-- Neck collar -->
                    <path d="M 92 106 Q 100 103 108 106 L 110 110 Q 100 108 90 110 Z" fill="${aoDaiCol}" stroke="${this.adjustColor(aoDaiCol, -20)}" stroke-width="1.2" />
                    <!-- Chest pattern -->
                    <circle cx="102" cy="115" r="2" fill="#fbbf24" opacity="0.8" />
                    <circle cx="102" cy="122" r="2" fill="#fbbf24" opacity="0.8" />
                </g>
            `;
            bottomHtml = `<path d="M 88 140 L 112 140 L 115 180 Q 100 185 85 180 Z" fill="#fff" stroke="#ccc" stroke-width="1" />`;
        }

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

        // 10. Gear Layer (Weapons held in hand - UPGRADED V5)
        let gearHtml = '';
        if (c.gear === 1) { // ⚔️ Đại Đao Lửa (Premium V5)
            gearHtml = `
                <g class="${isD ? 'chibi-arm-right-dance' : ''}" style="filter: drop-shadow(0 0 12px #ef4444);">
                    <g transform="translate(132, 110) rotate(15)">
                        <!-- Blade -->
                        <path d="M -5 -65 L 5 -65 L 8 -5 L -8 -5 Z" fill="url(#bladeSteel)" stroke="#475569" stroke-width="1.2"/>
                        <!-- Animated Fire -->
                        <g style="animation: fireDance 0.6s ease-in-out infinite;">
                            <path d="M -8 -60 Q -22 -80 -10 -45 Q -18 -55 -6 -30" fill="none" stroke="url(#fireGradV5)" stroke-width="4" stroke-linecap="round" opacity="0.9"/>
                            <path d="M 8 -60 Q 22 -80 10 -45 Q 18 -55 6 -30" fill="none" stroke="url(#fireGradV5)" stroke-width="4" stroke-linecap="round" opacity="0.9"/>
                        </g>
                        <!-- Guard -->
                        <rect x="-12" y="-5" width="24" height="6" rx="3" fill="#475569" stroke="#94a3b8" stroke-width="1"/>
                        <!-- Handle -->
                        <rect x="-4" y="1" width="8" height="25" rx="3" fill="#1e293b" stroke="#475569" stroke-width="1.2"/>
                        <!-- Pommel -->
                        <circle cx="0" cy="28" r="4" fill="#ef4444" style="filter: blur(1px);"/>
                    </g>
                </g>
                <defs>
                    <linearGradient id="fireGradV5" x1="0%" y1="100%" x2="0%" y2="0%">
                        <stop offset="0%" stop-color="#f59e0b"/><stop offset="50%" stop-color="#ef4444"/><stop offset="100%" stop-color="#fbbf24"/>
                    </linearGradient>
                    <linearGradient id="bladeSteel" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stop-color="#94a3b8"/><stop offset="50%" stop-color="#e2e8f0"/><stop offset="100%" stop-color="#94a3b8"/>
                    </linearGradient>
                </defs>
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
        if (c.mount === 1) { // Super Car (Siêu Xe Tương Lai)
            mountHtml = `
                <g style="filter: drop-shadow(0 10px 20px rgba(0,0,0,0.8));">
                    <path d="M 10 180 Q 10 140 50 135 L 150 135 Q 190 140 190 180 L 180 200 L 20 200 Z" fill="url(#carBodyGrad)" stroke="#00f3ff" stroke-width="1.5" />
                    <circle cx="50" cy="190" r="15" fill="#111" stroke="#00f3ff" stroke-width="3" />
                    <circle cx="150" cy="190" r="15" fill="#111" stroke="#00f3ff" stroke-width="3" />
                    <path d="M 60 135 L 80 110 L 120 110 L 140 135" fill="rgba(0, 243, 255, 0.2)" stroke="#00f3ff" />
                    <defs>
                        <linearGradient id="carBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stop-color="#1e2937" /><stop offset="100%" stop-color="#0f172a" />
                        </linearGradient>
                    </defs>
                </g>
            `;
        } else if (c.mount === 2) { // Cyber Motorbike (Xe Máy Cực Ngầu)
            mountHtml = `
                <g style="filter: drop-shadow(0 8px 15px rgba(0,0,0,0.7));">
                    <circle cx="35" cy="180" r="22" fill="#111" stroke="#8b5cf6" stroke-width="4" />
                    <circle cx="165" cy="180" r="22" fill="#111" stroke="#8b5cf6" stroke-width="4" />
                    <path d="M 35 180 L 165 180 L 140 130 Q 100 120 60 130 Z" fill="#4c1d95" stroke="#a855f7" stroke-width="2" />
                    <path d="M 60 130 L 40 100 L 60 100" stroke="#fff" stroke-width="4" fill="none" />
                </g>
            `;
        } else if (c.mount === 3) { // VVIP Flamingo Phao
            mountHtml = `
                <g style="filter: drop-shadow(0 5px 15px rgba(244, 63, 94, 0.4));">
                    <ellipse cx="100" cy="155" rx="40" ry="20" fill="#fb7185" stroke="#f43f5e" stroke-width="2" />
                    <path d="M 130 155 C 150 155 160 140 155 110 C 152 90 140 85 145 75 C 148 68 160 68 165 75" fill="none" stroke="#f43f5e" stroke-width="6" stroke-linecap="round" />
                    <path d="M 165 75 L 175 80" stroke="#111" stroke-width="3" stroke-linecap="round" />
                    <path d="M 70 155 Q 50 140 40 155" stroke="#fff" stroke-width="2" opacity="0.5" />
                </g>
            `;
        } else if (c.mount === 4) { // Xe Dream Neon Pro
            mountHtml = `
                <g style="filter: drop-shadow(0 10px 20px rgba(0,0,0,0.8));">
                    <!-- Accurate Frame -->
                    <path d="M 35 180 L 165 180" stroke="#334155" stroke-width="8" />
                    <circle cx="35" cy="180" r="22" fill="#111" stroke="#facc15" stroke-width="3" />
                    <circle cx="165" cy="180" r="22" fill="#111" stroke="#facc15" stroke-width="3" />
                    <!-- Seat and Body -->
                    <path d="M 60 160 L 160 160 L 155 135 Q 110 130 70 135 Z" fill="#1e2937" stroke="#facc15" stroke-width="1.5" />
                    <!-- Handlebar -->
                    <path d="M 45 160 L 40 110 L 60 110" stroke="#94a3b8" stroke-width="4" stroke-linecap="round" fill="none" />
                    <!-- Neon light -->
                    <path d="M 70 160 L 150 160" stroke="#facc15" stroke-width="1" style="animation: neonPulse 1.5s infinite;" />
                </g>
                <style>
                    @keyframes neonPulse { 0%, 100% { opacity: 1; filter: brightness(1.5); } 50% { opacity: 0.5; filter: brightness(1); } }
                </style>
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

        // 13. Front Accessories Layer (Hats/V5 PREMIUM)
        let accHtml = '';
        if (c.accessory === 11) { // 🇻🇳 Mũ Cối V5
            accHtml = `
                <g filter="url(#glowStrong)">
                    <path d="M 50 60 Q 100 20 150 60 L 150 75 Q 100 95 50 75 Z" fill="#365314" stroke="#1a2e05" stroke-width="2" />
                    <circle cx="100" cy="55" r="9" fill="#eab308" stroke="#854d0e" stroke-width="1.5" />
                    <path d="M 96 55 L 104 55 M 100 51 L 100 59" stroke="#fff" stroke-width="1" />
                    <!-- Shine -->
                    <path d="M 70 50 Q 100 35 130 50" stroke="#fff" stroke-width="2" opacity="0.2" fill="none" />
                </g>
            `;
        } else if (c.accessory === 12) { // 🇻🇳 Nón Lá V5 (Premium)
            accHtml = `
                <g filter="url(#glowStrong)">
                    <path d="M 35 80 L 100 15 L 165 80 Z" fill="#fef08a" stroke="#ca8a04" stroke-width="2" />
                    <path d="M 50 80 Q 100 95 150 80" fill="none" stroke="#ca8a04" stroke-width="1" opacity="0.6" />
                    <!-- Ribbon -->
                    <path d="M 65 80 Q 65 110 75 110 M 135 80 Q 135 110 125 110" fill="none" stroke="#f43f5e" stroke-width="3" stroke-linecap="round" />
                    <!-- Texture -->
                    <path d="M 68 55 L 132 55 M 80 40 L 120 40" stroke="#ca8a04" stroke-width="0.5" opacity="0.4" />
                </g>
            `;
        } else if (c.accessory === 13) { // 🇻🇳 Khăn Đóng / Khăn Xếp (V5)
            accHtml = `
                <g filter="url(#glowStrong)">
                    <path d="M 62 65 Q 100 55 138 65 L 140 85 Q 100 75 60 85 Z" fill="#1e1b4b" stroke="#312e81" stroke-width="2.5" />
                    <!-- Folding lines -->
                    <path d="M 65 72 Q 100 62 135 72 M 68 78 Q 100 68 132 78" stroke="#4338ca" stroke-width="1" opacity="0.6" fill="none" />
                    <!-- Gem -->
                    <circle cx="100" cy="72" r="4" fill="#ef4444" stroke="#fff" stroke-width="0.8" />
                </g>
            `;
        }
        return `
            <svg viewBox="${viewBox}" width="100%" height="100%" class="${isD ? 'chibi-dance' : ''}" style="display: block;">
                <style>
                    .chibi-dance { animation: chibiBounce 2s infinite ease-in-out; transform-origin: bottom center; }
                    @keyframes chibiBounce { 0%, 100% { transform: scale(1) translateY(0); } 50% { transform: scale(1.02, 0.98) translateY(-4px); } }
                    .chibi-breathe { animation: chibiBreathe 3s infinite ease-in-out; transform-origin: center; }
                    @keyframes chibiBreathe { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
                    .chibi-arm-left-dance { animation: chibiArmLeftWave 2s infinite ease-in-out; transform-origin: 85px 125px; }
                    .chibi-arm-right-dance { animation: chibiArmRightWave 2s infinite ease-in-out; transform-origin: 115px 125px; }
                    @keyframes chibiArmLeftWave { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(12deg); } }
                    @keyframes chibiArmRightWave { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-12deg); } }
                    @keyframes floatSparkle { 0%, 100% { transform: translateY(0) scale(0.6); opacity: 0.3; } 50% { transform: translateY(-10px) scale(1.1); opacity: 1; } }
                    .chibi-wing-flap { animation: wingFlap 2.5s infinite ease-in-out; transform-origin: 100px 110px; }
                    @keyframes wingFlap { 0%, 100% { transform: scaleX(1); } 50% { transform: scaleX(0.85); } }
                    .chibi-tail-dance { animation: tailWag 3s infinite ease-in-out; transform-origin: 100px 110px; }
                    @keyframes tailWag { 0%, 100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
                    @keyframes runeRotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                    @keyframes runeRotateRev { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
                    @keyframes glowPulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
                    @keyframes fireDance { 0%, 100% { transform: scaleY(1) translateY(0); } 50% { transform: scaleY(1.1) translateY(-2px); } }
                </style>
                <defs>
                    <linearGradient id="skinGradV5" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="${skinColor}" /><stop offset="100%" stop-color="${this.adjustColor(skinColor, -15)}" />
                    </linearGradient>
                    <linearGradient id="hairGradV5" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="${hc}" /><stop offset="100%" stop-color="${this.adjustColor(hc, -30)}" />
                    </linearGradient>
                    <filter id="glowStrong"><feGaussianBlur stdDeviation="3.5" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/></filter>
                    <filter id="glowNeon"><feGaussianBlur stdDeviation="2" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/></filter>
                </defs>
                ${dragonHtml || ''}
                ${auraHtml || ''}
                ${wingHtml || ''}
                ${sparklesHtml}
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
        } else if (type === 'aura') {
            tempConfig.aura = index;
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
        } else if (type === 'aura') {
            viewBox = '40 150 120 50';
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
            aura: 0,
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
                .chibi-item-locked {
                    opacity: 0.65;
                    border-color: rgba(251, 191, 36, 0.15) !important;
                    cursor: not-allowed !important;
                }
                .chibi-item-locked:hover {
                    border-color: rgba(251, 191, 36, 0.4) !important;
                    background: rgba(251, 191, 36, 0.06) !important;
                    transform: scale(1.01) !important;
                }
                .chibi-lock-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: calc(100% - 28px);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    z-index: 3;
                    pointer-events: none;
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
                        
                        <!-- Gender Selection (NEW V5) -->
                        <div style="display: flex; gap: 8px; width: 100%; margin-bottom: 5px;">
                            <button onclick="ChibiModule.currentConfig.gender='nam'; ChibiModule.updatePreview(); this.parentNode.querySelectorAll('button').forEach(b=>b.classList.remove('active')); this.classList.add('active');" 
                                    class="chibi-btn-outline ${ChibiModule.currentConfig.gender==='nam'?'active':''}" 
                                    style="flex: 1; padding: 8px; font-weight: 800; border-radius: 8px;">
                                <i class="fa-solid fa-mars"></i> NAM
                            </button>
                            <button onclick="ChibiModule.currentConfig.gender='nữ'; ChibiModule.updatePreview(); this.parentNode.querySelectorAll('button').forEach(b=>b.classList.remove('active')); this.classList.add('active');" 
                                    class="chibi-btn-outline ${ChibiModule.currentConfig.gender==='nữ'?'active':''}" 
                                    style="flex: 1; padding: 8px; font-weight: 800; border-radius: 8px;">
                                <i class="fa-solid fa-venus"></i> NỮ
                            </button>
                        </div>

                        <div id="chibi-preview-container" style="width: 200px; height: 240px; background: radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(0,0,0,0.6) 100%); border-radius: 12px; border: 2px solid rgba(139, 92, 246, 0.4); display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; box-shadow: inset 0 0 20px rgba(0,0,0,0.85);">
                            <!-- Chibi composite SVG injected here -->
                        </div>

                        <!-- Bounce dancing toggle -->
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; color: #cbd5e1; font-weight: bold; background: rgba(255,255,255,0.05); padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.08); user-select: none;">
                            <input type="checkbox" id="chibi-dance-toggle" checked onchange="ChibiModule.updatePreview()" style="cursor: pointer; accent-color: #8b5cf6;">
                            <span>💃 Hiệu ứng Animation VIP</span>
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
                            <button onclick="ChibiModule.switchTab('presets')" class="chibi-tab-btn" id="tab-presets"><i class="fa-solid fa-star"></i> SETs</button>
                            <button onclick="ChibiModule.switchTab('skin')" class="chibi-tab-btn active" id="tab-skin">Da</button>
                            <button onclick="ChibiModule.switchTab('hair')" class="chibi-tab-btn" id="tab-hair">Tóc</button>
                            <button onclick="ChibiModule.switchTab('eyes')" class="chibi-tab-btn" id="tab-eyes">Mắt</button>
                            <button onclick="ChibiModule.switchTab('top')" class="chibi-tab-btn" id="tab-top">Áo</button>
                            <button onclick="ChibiModule.switchTab('bottom')" class="chibi-tab-btn" id="tab-bottom">Quần</button>
                            <button onclick="ChibiModule.switchTab('shoe')" class="chibi-tab-btn" id="tab-shoe">Giày</button>
                            <button onclick="ChibiModule.switchTab('accessory')" class="chibi-tab-btn" id="tab-accessory">Nón/Kính</button>
                            <button onclick="ChibiModule.switchTab('gear')" class="chibi-tab-btn" id="tab-gear">Vũ Khí</button>
                            <button onclick="ChibiModule.switchTab('aura')" class="chibi-tab-btn" id="tab-aura">Vòng Sáng</button>
                            <button onclick="ChibiModule.switchTab('wing')" class="chibi-tab-btn" id="tab-wing">Cánh</button>
                            <button onclick="ChibiModule.switchTab('dragon')" class="chibi-tab-btn" id="tab-dragon">Linh Thú</button>
                        </div>

                        <!-- Tab Content -->
                        <div id="chibi-tab-panel" style="flex: 1; min-height: 270px; background: rgba(0,0,0,0.2); border-radius: 12px; padding: 16px; border: 1px solid rgba(255,255,255,0.04); overflow-y: auto; max-height: 330px;">
                            <!-- Active editor panel items injected here -->
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div style="padding: 16px 24px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: flex-end; gap: 12px; background: rgba(0,0,0,0.25); align-items: center;">
                    <button onclick="Auth.openTitleSelector()" style="background: linear-gradient(135deg, #a855f7, #38bdf8); color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: all 0.2s; box-shadow: 0 0 15px rgba(168,85,247,0.4); margin-right: auto;" onmouseover="this.style.transform='scale(1.02)'; this.style.boxShadow='0 0 20px rgba(168,85,247,0.6)'" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 0 15px rgba(168,85,247,0.4)'">
                        🏷️ ĐỔI DANH HIỆU LẤP LÁNH
                    </button>
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
                    const locked = ChibiModule.isGearLocked(i, property);
                    const miniSvg = ChibiModule.renderMiniOption(property, i);
                    const reqs = ChibiModule.gearRequirements[property];
                    const req = reqs ? reqs[i] : null;
                    const lockInfo = locked && req ? `Cấp ${req.requiredLevel}` : '';
                    if (locked) {
                        return `
                            <div class="chibi-item-card chibi-item-locked" onclick="ChibiModule.selectItem('${property}', ${i})" title="🔒 ${req ? req.label : ''} - Yêu cầu ${lockInfo}">
                                <div class="chibi-item-preview-wrap" style="transform: scale(${scale}); filter: grayscale(0.8) brightness(0.5);">
                                    ${miniSvg}
                                </div>
                                <div class="chibi-lock-overlay">
                                    <i class="fa-solid fa-lock" style="font-size: 16px; color: #fbbf24; text-shadow: 0 0 8px rgba(251,191,36,0.6);"></i>
                                    <span style="font-size: 9px; color: #fbbf24; font-weight: 700; margin-top: 2px;">${lockInfo}</span>
                                </div>
                                <span class="chibi-item-label" style="color: #475569;">${labels[i] || (property + ' ' + i)}</span>
                            </div>
                        `;
                    }
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
            { id: 'dragon', label: '🐉 Rồng' },
            { id: 'aura', label: '✨ Hiệu ứng' },
            { id: 'presets', label: '⭐ Full SET' }
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
            const shoeNames = ['Sneaker Thể Thao', 'Dép Tổ Ong (Legend)', 'Bốt Cao Cổ', 'Bốt Chiến Binh', 'Bốt Cyber Neon', 'Giày Da Công Sở', 'Chân Trần'];

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
            const options = Array.from({ length: ChibiModule.counts.dragon + 1 }, (_, i) => i);
            const dragonNames = ['Trống', 'Lam Long', 'Xích Long', 'Hoàng Long'];
            contentHtml = ChibiModule.renderGrid('dragon', options, dragonNames, 0.9);
        }
        else if (tabId === 'aura') {
            const options = Array.from({ length: ChibiModule.counts.aura + 1 }, (_, i) => i);
            const labels = ['Không', 'Neon Ring', 'Magic Rune', 'Fire Aura', 'Blood Ritual', 'Zen Circle'];
            contentHtml = ChibiModule.renderGrid('aura', options, labels);
        }
        else if (tabId === 'presets') {
            // FULL SET PRESETS
            contentHtml = `
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    <div style="background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.2); padding: 12px; border-radius: 10px; margin-bottom: 5px;">
                        <span style="color: #fbbf24; font-size: 13px; font-weight: bold; display: flex; align-items: center; gap: 8px;">
                            <i class="fa-solid fa-star"></i> CHỌN TRANG PHỤC THEO BỘ
                        </span>
                        <p style="margin: 5px 0 0 0; font-size: 11px; color: #94a3b8;">Trang bị đồng bộ toàn bộ từ Tóc, Quần Áo đến Rồng và Vũ Khí.</p>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        ${ChibiModule.presets.map(set => `
                            <div class="chibi-preset-card" onclick="ChibiModule.applyPreset('${set.id}')"
                                 style="background: rgba(255,255,255,0.03); border: 1.5px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 12px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 15px;">
                                <div style="width: 40px; height: 40px; background: rgba(139, 92, 246, 0.2); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                                    ${set.id.includes('cyber') ? '🤖' : set.id.includes('samurai') ? '⚔️' : set.id.includes('to-ong') ? '🍯' : set.id.includes('reaper') ? '💀' : '😇'}
                                </div>
                                <div style="flex: 1;">
                                    <div style="font-weight: 900; font-size: 14px; color: #fff;">${set.name}</div>
                                    <div style="font-size: 11px; color: #94a3b8;">${set.desc}</div>
                                </div>
                                <i class="fa-solid fa-chevron-right" style="color: #475569;"></i>
                            </div>
                        `).join('')}
                    </div>
                    <style>
                        .chibi-preset-card:hover {
                            background: rgba(139, 92, 246, 0.1) !important;
                            border-color: #8b5cf6 !important;
                            transform: translateX(5px);
                        }
                    </style>
                </div>
            `;
        }

        panel.innerHTML = contentHtml;
    },

    /**
     * Apply a Full SET Preset
     */
    applyPreset: function(presetId) {
        const preset = ChibiModule.presets.find(p => p.id === presetId);
        if (!preset) return;

        // Apply all config values
        Object.keys(preset.config).forEach(key => {
            ChibiModule.currentConfig[key] = preset.config[key];
        });

        // Effect for feedback
        const preview = document.getElementById('chibi-preview-container');
        if (preview) {
            preview.style.transition = 'none';
            preview.style.filter = 'brightness(2) contrast(1.2)';
            setTimeout(() => {
                preview.style.transition = 'filter 0.5s ease';
                preview.style.filter = 'none';
            }, 50);
        }

        ChibiModule.updatePreview();
        ChibiModule.switchTab('presets'); // Refresh to keep the highlight/state
    },

    /**
     * Choose an item style
     */
    selectItem: function(property, index) {
        if (ChibiModule.isGearLocked(index, property)) {
            const reqs = ChibiModule.gearRequirements[property];
            const req = reqs ? reqs[index] : null;
            const userLevel = Auth.currentUser?.level || 1;
            Utils.showToast(`🔒 Trang bị "${req ? req.label : ''}" yêu cầu Cấp ${req ? req.requiredLevel : '?'}! (Bạn đang Cấp ${userLevel}). Cày nhiệm vụ để lên cấp nào!`, "info");
            return; // Không cho chọn trang bị bị khóa
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
     * Choose gender (nam/nữ)
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
     * Generate cohesive beautiful random Chibi config (chỉ chọn từ trang bị đã mở khóa)
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

        // Helper: lọc chỉ lấy trang bị đã mở khóa cho 1 category
        const getUnlocked = (category, maxCount) => {
            return Array.from({ length: maxCount }, (_, i) => i)
                .filter(i => !ChibiModule.isGearLocked(i, category));
        };

        // Filter unlocked items for ALL lockable categories
        const unlockedAccessories = getUnlocked('accessory', ChibiModule.counts.accessory);
        const unlockedGear = getUnlocked('gear', ChibiModule.counts.gear);
        const unlockedWing = getUnlocked('wing', ChibiModule.counts.wing);
        const unlockedMount = getUnlocked('mount', ChibiModule.counts.mount);
        const unlockedDragon = getUnlocked('dragon', ChibiModule.counts.dragon + 1);

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
            accessory: unlockedAccessories.length > 0 ? randItem(unlockedAccessories) : 0,
            gear: unlockedGear.length > 0 ? randItem(unlockedGear) : 0,
            wing: unlockedWing.length > 0 ? randItem(unlockedWing) : 0,
            mount: unlockedMount.length > 0 ? randItem(unlockedMount) : 0,
            dragon: unlockedDragon.length > 0 ? randItem(unlockedDragon) : 0
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
     * Save completed chibi design
     */
    saveBuilder: async function() {
        const user = Auth.currentUser;
        if (!user) return;

        // Kiểm tra tất cả trang bị đang mặc có bị khóa không
        const lockCategories = ['gear', 'mount', 'wing', 'dragon', 'accessory'];
        for (const cat of lockCategories) {
            const itemIndex = ChibiModule.currentConfig[cat];
            if (itemIndex && ChibiModule.isGearLocked(itemIndex, cat)) {
                const reqs = ChibiModule.gearRequirements[cat];
                const req = reqs ? reqs[itemIndex] : null;
                const userLevel = Auth.currentUser?.level || 1;
                Utils.showToast(`🔒 Không thể lưu! Trang bị "${req ? req.label : ''}" yêu cầu Cấp ${req ? req.requiredLevel : '?'}! (Bạn đang Cấp ${userLevel})`, "error");
                return;
            }
        }

        const profile = user.profile || {};
        profile.chibiConfig = { ...ChibiModule.currentConfig };
        user.profile = profile;

        Utils.storage.set(Auth.currentUserKey, user);

        try {
            const accounts = await Auth.getAccounts();
            const accIdx = accounts.findIndex(a => a.username === user.username);
            if (accIdx > -1) {
                accounts[accIdx].profile = profile;
                await Auth.saveAccounts(accounts);
            }
            
            Utils.showToast("🎉 Thiết kế Chibi V5 đã được lưu thành công!", "success");
            ChibiModule.closeBuilder();
            Auth.showApp();
        } catch (e) {
            console.error("Error saving chibi:", e);
            Utils.showToast("Có lỗi xảy ra khi lưu Chibi!", "error");
        }
    }
};
