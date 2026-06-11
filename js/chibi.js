/**
 * Pet Chibi Avatar Builder Module
 * Phong cách Gacha Life - Hybrid Sprite + SVG Engine V11
 */

const ChibiModule = {
    // Robust color adjustment utility
    adjustColor: function(hex, amt) {
        if (!hex) return "#000000";
        let c = hex.replace("#", "");
        if (c.length === 3) c = c.split('').map(s => s + s).join('');
        let num = parseInt(c, 16);
        let r = Math.min(255, Math.max(0, (num >> 16) + amt));
        let g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt));
        let b = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    },

    /**
     * Sprite Asset Mapping (indices to filenames) - V11
     */
    spriteAssets: {
        body: 'assets/chibi/body_base.png',
        head: 'assets/chibi/head_base.png',
        outfit: {
            1: 'assets/chibi/outfit_cyber.png'
        },
        hair: {
            1: 'assets/chibi/hair_front_1.png',
            2: 'assets/chibi/hair_front_2.png'
        },
        eyes: {
            1: 'assets/chibi/eyes_1.png'
        }
    },

    /**
     * Main Chibi Sprite Renderer (V11 - ULTRA FIDELITY)
     * Renders stacked PNG layers with CSS transforms and filters
     */
    renderChibiSprite: function(config, isDancing = false) {
        const c = config || this.currentConfig || {};
        const hs = c.hairStyle || 1;
        const es = c.eyeStyle || 1;
        const outfit = c.topStyle || 1; // Assuming topStyle maps to outfit in V11

        // Resolve files
        const bodyFile = this.spriteAssets.body;
        const headFile = this.spriteAssets.head;
        const outfitFile = this.spriteAssets.outfit[outfit] || this.spriteAssets.outfit[1];
        const hairFile = this.spriteAssets.hair[hs] || this.spriteAssets.hair[1];
        const eyeFile = this.spriteAssets.eyes[es] || this.spriteAssets.eyes[1];

        // Dynamic Filtering
        const skinFilter = `hue-rotate(${this.getHueShift(c.skinColor, '#ffcd94')}deg) brightness(${this.getBrightnessShift(c.skinColor, '#ffcd94')})`;
        const hairFilter = `hue-rotate(${this.getHueShift(c.hairColor, '#ec4899')}deg) saturate(1.2)`;
        const outfitFilter = `hue-rotate(${this.getHueShift(c.topColor, '#ffffff')}deg)`;

        return `
            <div class="chibi-v11-container ${isDancing ? 'chibi-dance' : ''}" style="width:100%; height:100%; position:relative; aspect-ratio: 200/240;">
                <style>
                    .chibi-v11-container .chibi-layer {
                        position: absolute;
                        top: 0; left: 0;
                        width: 100%; height: 100%;
                        object-fit: contain;
                        pointer-events: none;
                    }
                    .chibi-dance { animation: cbV11 2.5s infinite ease-in-out; transform-origin: bottom center; }
                    @keyframes cbV11 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
                </style>
                
                <!-- 1. Body -->
                <img src="${bodyFile}" class="chibi-layer" style="z-index:2; filter: ${skinFilter};" />
                
                <!-- 2. Head -->
                <img src="${headFile}" class="chibi-layer" style="z-index:3; filter: ${skinFilter};" />
                
                <!-- 3. Outfit -->
                <img src="${outfitFile}" class="chibi-layer" style="z-index:4; filter: ${outfitFilter};" />
                
                <!-- 4. Eyes/Face -->
                <img src="${eyeFile}" class="chibi-layer" style="z-index:5;" />
                
                <!-- 5. Hair (Front) -->
                <img src="${hairFile}" class="chibi-layer" style="z-index:6; filter: ${hairFilter};" />
            </div>
        `;
    },

    /**
     * Simple Hue/Brightness shift calculation for filters
     */
    getHueShift: function(hex, base) {
        if (!hex || hex === base) return 0;
        // Placeholder: deterministic shift for dev/demo
        return (parseInt(hex.replace('#',''), 16) % 360) - 180;
    },
    getBrightnessShift: function(hex, base) {
        if (!hex) return 1;
        return 1.0; // Keep original brightness for now
    },

    /**
     * Helpers for CSS Filters (Simplified for prototype)
     */
    getHueForColor: function(hex, baseHex) { 
        // This is a placeholder. Real hue calculation would convert both to HSL and return the difference.
        // For now, return a deterministic shift based on the hex value.
        if (!hex || hex === baseHex) return 0;
        return (parseInt(hex.replace('#',''), 16) % 360); 
    },
    getBrightnessForColor: function(hex) {
        if (!hex) return 1;
        const num = parseInt(hex.replace('#',''), 16);
        const r = (num >> 16);
        const g = (num >> 8 & 0x00FF);
        const b = (num & 0x0000FF);
        const avg = (r + g + b) / 3;
        return (avg / 128).toFixed(2);
    },
    // === ASSET LIBRARY V11: HIGH-FIDELITY PATHS ===
    assets: {
        // Head with soft jawline and cheeks
        head: "M 55 50 Q 55 105 100 115 Q 145 105 145 50 Q 145 10 100 10 Q 55 10 55 50 Z",
        
        // Detailed Gacha Eyes (Standard)
        eyes: {
            0: `
                <!-- Outer Lashes -->
                <path d="M 72 82 Q 82 72 92 82" fill="none" stroke="#0f172a" stroke-width="4" stroke-linecap="round" />
                <path d="M 108 82 Q 118 72 128 82" fill="none" stroke="#0f172a" stroke-width="4" stroke-linecap="round" />
                <!-- Irises with internal gradients -->
                <circle cx="82" cy="88" r="8" fill="url(#irisG)" />
                <circle cx="118" cy="88" r="8" fill="url(#irisG)" />
                <!-- Main Highlights -->
                <circle cx="79" cy="85" r="3" fill="#fff" opacity="0.8" />
                <circle cx="115" cy="85" r="3" fill="#fff" opacity="0.8" />
                <!-- Lower Bloom -->
                <circle cx="85" cy="92" r="2" fill="#fff" opacity="0.3" />
                <circle cx="121" cy="92" r="2" fill="#fff" opacity="0.3" />
            `,
            1: `<!-- Sparkle Eyes (Wink/Cute) -->
                <path d="M 72 85 Q 82 75 92 85" fill="none" stroke="#0f172a" stroke-width="4" />
                <path d="M 115 88 L 125 78 M 115 78 L 125 88" stroke="#0f172a" stroke-width="3" />
            `
        },
        
        // Body Structure (Anime Proportions)
        body: {
            torso: "M 85 110 L 115 110 L 120 180 Q 100 190 80 180 Z",
            armL: "M 82 120 Q 60 135 65 170",
            armR: "M 118 120 Q 140 135 135 170",
            legL: "M 90 180 L 88 220",
            legR: "M 110 180 L 112 220"
        }
    },

    /**
     * UNIVERSAL RENDERER (Wrapper) — Used by Lobby, NPCs, etc.
     * Returns SVG for backward compatibility with existing UI.
     */
    render: function(config, isDancing = false, points = 0) {
        // V11 Upgrade: Switch to Sprite rendering by default for higher quality
        return ChibiModule.renderChibiSprite(config, isDancing);
    },

    /**
     * Render complete composite Chibi SVG (Legacy but kept for fallback)
     */
    renderChibiSVG: function(config, isD = false, pts = 0) {
        const c = config || this.currentConfig || {};
        const sk = c.skinColor || "#ffd1a9";
        const hc = c.hairColor || "#343a40";
        const hs = c.hairStyle || 0;
        const es = c.eyeStyle || 0;
        const topCol = c.topColor || "#e83e8c";
        const botCol = c.bottomColor || "#3b82f6";

        const u = 'v11' + Math.random().toString(36).substr(2, 4);
        const skG = `${u}sk`, hrG = `${u}hr`, irG = `${u}ir`;
        const fS = `${u}fs`; // Shadow filter

        return `
            <svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg" class="${isD ? 'chibi-dance' : ''}" style="width:100%; height:100%; display:block;">
                <defs>
                    <radialGradient id="${skG}" cx="45%" cy="40%" r="60%">
                        <stop offset="0%" stop-color="${sk}" />
                        <stop offset="100%" stop-color="${this.adjustColor(sk, -15)}" />
                    </radialGradient>
                    <linearGradient id="${hrG}" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="${hc}" />
                        <stop offset="100%" stop-color="${this.adjustColor(hc, -40)}" />
                    </linearGradient>
                    <radialGradient id="${irG}" cx="50%" cy="30%" r="70%">
                        <stop offset="0%" stop-color="#fff" stop-opacity="0.2" />
                        <stop offset="100%" stop-color="#000" />
                    </radialGradient>
                    <filter id="${fS}" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
                    </filter>
                </defs>

                <style>
                    .chibi-dance { animation: cbV11 2s infinite ease-in-out; transform-origin: bottom center; }
                    @keyframes cbV11 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px) rotate(1deg)} }
                </style>

                    <!-- Hair Background -->
                    <g filter="url(#${fS})">
                        <path d="M 50 80 Q 50 10 100 10 Q 150 10 150 80 L 155 120 Q 100 140 45 120 Z" fill="url(#${hrG})" />
                    </g>
                    
                    <!-- Body -->
                    <g filter="url(#${fS})">
                        <path d="${this.assets.body.armL}" fill="none" stroke="${sk}" stroke-width="12" stroke-linecap="round" />
                        <path d="${this.assets.body.armR}" fill="none" stroke="${sk}" stroke-width="12" stroke-linecap="round" />
                        <path d="${this.assets.body.legL}" fill="none" stroke="${sk}" stroke-width="12" stroke-linecap="round" />
                        <path d="${this.assets.body.legR}" fill="none" stroke="${sk}" stroke-width="12" stroke-linecap="round" />
                        <path d="${this.assets.body.torso}" fill="${sk}" />
                        <path d="M 82 115 L 118 115 L 122 155 L 78 155 Z" fill="${topCol}" />
                        <path d="M 78 155 L 122 155 L 120 185 L 80 185 Z" fill="${botCol}" />
                    </g>

                    <!-- Head & Face -->
                    <g filter="url(#${fS})">
                        <path d="${this.assets.head}" fill="url(#${skG})" />
                        <circle cx="75" cy="100" r="10" fill="#f43f5e" opacity="0.15" />
                        <circle cx="125" cy="100" r="10" fill="#f43f5e" opacity="0.15" />
                        <g class="chibi-eye-group">
                            ${this.assets.eyes[es === 1 ? 1 : 0].replace(/irisG/g, irG)}
                        </g>
                        <path d="M 96 108 Q 100 112 104 108" fill="none" stroke="#4a044e" stroke-width="1.5" stroke-linecap="round" />
                    </g>

                    <!-- Hair Foreground (Bangs/Fringe) -->
                    <g filter="url(#${fS})">
                        <path d="M 52 70 Q 70 20 100 20 Q 130 20 148 70 Q 148 90 135 95 Q 120 70 100 70 Q 80 70 65 95 Q 52 90 52 70 Z" fill="url(#${hrG})" />
                        <path d="M 75 40 Q 90 32 105 40" fill="none" stroke="#fff" stroke-width="2" opacity="0.15" />
                    </g>
                </g>
            </svg>
        `;
    },


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
        ],
        dragons: [
            '#3b82f6', // Lam Long
            '#ef4444', // Xich Long
            '#fbbf24', // Hoang Long
            '#10b981', // Luc Long
            '#111827'  // Hac Long
        ],
        aura: [
            '#00f3ff', // Neon Cyan
            '#8b5cf6', // Magic Purple
            '#ef4444', // Fire Red
            '#ec4899', // Pink Aura
            '#10b981', // Nature Green
            '#f97316', // Orange Flame
            '#ffffff', // Pure White
            '#1f2937'  // Dark Void
        ]
    },

    // Style Count configuration (0 index to Max-1) - V11 SPRITE COUNTS
    counts: {
        skin: 8,
        hair: 2,       // V11 Sprites: 1, 2
        eyes: 1,       // V11 Sprites: 1
        mouth: 1,      
        top: 1,        // V11 Sprites: 1
        bottom: 0,     // Integrated in outfit for better shading
        shoe: 0,
        accessory: 0, 
        gear: 0,
        wing: 0,
        mount: 0,
        dragon: 0,
        aura: 0
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
            1: { label: "🏎️ Siêu Xe Thể Thao V6", requiredLevel: 7 },
            2: { label: "🏍️ Motor Cyber TRON V6", requiredLevel: 5 },
            3: { label: "🛹 Ván Trượt Bay V6", requiredLevel: 5 },
            4: { label: "🛵 Vespa Cổ Điển V6", requiredLevel: 4 },
            5: { label: "🚁 Drone Chiến Đấu V6", requiredLevel: 8 }
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
            1: { label: "🌊 Lam Long Thần V6", requiredLevel: 7 },
            2: { label: "🔥 Xích Long Thần V6", requiredLevel: 9 },
            3: { label: "⚡ Hoàng Long Thần V6", requiredLevel: 12 },
            4: { label: "🌑 Hắc Long Thần V6", requiredLevel: 15 }
        },
        accessory: {
            11: { label: "Mũ Cối Kháng Chiến", requiredLevel: 3 },
            12: { label: "Nón Lá Truyền Thống", requiredLevel: 3 },
            13: { label: "Khăn Rằn Nam Bộ", requiredLevel: 2 }
        }
    },

    presets: [
        {
            id: 'premium-gacha-v11',
            name: '✨ Gacha Pro (V11 Sprite)',
            desc: 'Chất lượng phác thảo 100%. Sprite Layering Engine.',
            config: { gender: 'nữ', hairStyle: 1, hairColor: '#ec4899', topStyle: 1, topColor: '#ffffff', skinColor: '#ffcd94', eyeStyle: 1 }
        },
        {
            id: 'premium-gacha-old',
            name: '✨ Gacha Premium (Mới)',
            desc: 'Phong cách minh họa Gacha-Life chất lượng cao nhất.',
            isSprite: true,
            spritePath: 'img/chibi/preset_default.png',
            config: { gender: 'nữ', hairStyle: 12, hairColor: '#ec4899', topColor: '#ffffff', bottomColor: '#1f2937' }
        },
        {
            id: 'tokyo-cyber',
            name: 'Siêu Nhân Điện Quang (Cyber)',
            desc: 'Phong cách Cyberpunk tương lai cực cháy.',
            config: { gender: 'nam', hairStyle: 3, hairColor: '#00f3ff', eyeStyle: 1, mouthStyle: 6, topStyle: 3, topColor: '#1e293b', bottomStyle: 5, bottomColor: '#1e293b', shoeStyle: 4, mount: 2, dragon: 1, aura: 1 }
        },
        {
            id: 'viet-legend',
            name: 'Huyền Thoại Việt Nam 🇻🇳',
            desc: 'Áo dài, nón lá, hài lòng dân tộc!',
            config: { gender: 'nữ', hairStyle: 2, hairColor: '#111827', eyeStyle: 0, mouthStyle: 0, topStyle: 7, topColor: '#b91c1c', bottomStyle: 2, bottomColor: '#ffffff', shoeStyle: 1, accessory: 12, mount: 4, dragon: 3, aura: 6 }
        },
        {
            id: 'samurai-spirit',
            name: 'Võ Sĩ Đạo (Samurai)',
            desc: 'Tinh thần thép, đại đao lửa!',
            config: { gender: 'nam', hairStyle: 2, hairColor: '#111827', eyeStyle: 5, mouthStyle: 8, topStyle: 4, topColor: '#1e293b', bottomStyle: 7, bottomColor: '#1e293b', shoeStyle: 3, gear: 1, dragon: 2, aura: 2 }
        },
        {
            id: 'hero-divine',
            name: 'Anh Hùng Công Lý',
            desc: 'Bảo vệ thế giới khỏi bóng tối!',
            config: { gender: 'nam', hairStyle: 7, hairColor: '#facc15', eyeStyle: 7, mouthStyle: 0, topStyle: 8, topColor: '#3b82f6', bottomStyle: 4, bottomColor: '#1e3a8a', shoeStyle: 3, aura: 6, dragon: 3 }
        },
        {
            id: 'to-ong-king',
            name: 'Vua Dép Tổ Ong 🐝',
            desc: 'Dân chơi xóm núp lùm!',
            config: { gender: 'nam', hairStyle: 1, hairColor: '#7c2d12', eyeStyle: 9, mouthStyle: 2, topStyle: 1, topColor: '#ffffff', bottomStyle: 3, bottomColor: '#2563eb', shoeStyle: 1, gear: 19, accessory: 11, mount: 4 }
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
        // ALWAYS UNLOCKED for everyone as per user request
        return false;
    },



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
        if (type === 'skin') tempConfig.skinColor = color;
        else if (type === 'hair') { tempConfig.hairStyle = index; tempConfig.hairColor = color || '#343a40'; }
        else if (type === 'eyes') tempConfig.eyeStyle = index;
        else if (type === 'mouth') tempConfig.mouthStyle = index;
        else if (type === 'top') { tempConfig.topStyle = index; tempConfig.topColor = color || '#e83e8c'; }
        else if (type === 'bottom') { tempConfig.bottomStyle = index; tempConfig.bottomColor = color || '#007bff'; }
        else if (type === 'shoe') { tempConfig.shoeStyle = index; tempConfig.shoeColor = color || '#1f2937'; }
        else if (type === 'accessory') tempConfig.accessory = index;
        else if (type === 'gear') tempConfig.gear = index;
        else if (type === 'wing') tempConfig.wing = index;
        else if (type === 'mount') tempConfig.mount = index;
        else if (type === 'dragon') tempConfig.dragon = index;
        else if (type === 'aura') tempConfig.aura = index;

        // Zoom into relevant parts for the grid (Adapted for Sprite)
        const renderStr = ChibiModule.render(tempConfig);
        
        // Since Sprite uses <img> in <div>, we wrap it in a zoomed wrapper
        let scale = 1, top = 0, left = 0;
        if (type === 'hair') { scale = 2; top = -10; }
        else if (type === 'eyes') { scale = 3; top = -70; }
        else if (type === 'mouth') { scale = 4; top = -90; }
        else if (type === 'top') { scale = 2; top = -130; }
        
        return `
            <div style="width:100%; height:100%; overflow:hidden; position:relative;">
                <div style="transform: scale(${scale}) translateY(${top}px); transform-origin: top center;">
                    ${renderStr}
                </div>
            </div>
        `;
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
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 12px;
                    padding: 8px;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    position: relative;
                    overflow: hidden;
                    backdrop-filter: blur(4px);
                }
                .chibi-item-card:hover {
                    background: rgba(139, 92, 246, 0.1);
                    border-color: rgba(139, 92, 246, 0.5);
                    transform: translateY(-5px);
                    box-shadow: 0 10px 20px rgba(0,0,0,0.3);
                }
                .chibi-item-card.active {
                    background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2));
                    border-color: #a78bfa;
                    box-shadow: 0 0 20px rgba(139, 92, 246, 0.4);
                }
                .chibi-item-preview-wrap {
                    width: 100%;
                    height: 80px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 30px;
                }
                .chibi-item-label {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    min-height: 30px;
                    background: rgba(15, 23, 42, 0.95);
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 6px 4px;
                    font-size: 11px;
                    color: #94a3b8;
                    font-weight: 700;
                    text-align: center;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2;
                    text-transform: uppercase;
                    transition: all 0.2s;
                }
                .chibi-item-card.active .chibi-item-label {
                    color: #fff;
                    background: linear-gradient(90deg, #8b5cf6, #ec4899);
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
                /* SPRITE ENGINE CLASSES */
                .chibi-sprite-container {
                    background: transparent;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .chibi-layer {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                    pointer-events: none;
                }
                .chibi-item-preview-wrap .chibi-sprite-container {
                    transform: translateY(-5px);
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
                                     style="background: ${col};"" 
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
                                     style="background: ${col};"" 
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
            const shoeNames = ['Chan tran', 'Sneaker Neon', 'Giay Tay Xin', 'Ung Cyber', 'Dep To Ong', 'Sandal Dao Pho', 'Giap Chan Titan', 'Hai Co Trang'];
            const topNames = ['Mặc định', 'Áo Phông Neo', 'Vest Công Sở', 'Giáp Cyber Titan', 'Ronin Kimono', 'Vest Đặc Nhiệm', 'Hoodie Dạo Phố', 'Áo Dài Hoàng Gia 🇻🇳', 'Siêu Nhân Hero', 'Shinobi 🥷', 'Tu Sĩ Rồng', 'Phi Công Tinh Hệ']; 

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
                                        <span class="chibi-item-label">${topNames[i] || 'Áo ' + i}</span>
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
                                const bottomNames = ['Mặc định', 'Quần Tây', 'Váy Xếp Ly', 'Quần Short', 'Quần Jogger', 'Giáp Chân Cyber', 'Tech-Cargo', 'Hakama Võ Sĩ', 'Quần Vảy Rồng'];
                                const activeClass = ChibiModule.currentConfig.bottomStyle === i ? 'active' : '';
                                const miniSvg = ChibiModule.renderMiniOption('bottom', i, ChibiModule.currentConfig.bottomColor);
                                return `
                                    <div class="chibi-item-card ${activeClass}" onclick="ChibiModule.selectItem('bottomStyle', ${i})">
                                        <div class="chibi-item-preview-wrap" style="transform: scale(1.35);">
                                            ${miniSvg}
                                        </div>
                                        <span class="chibi-item-label">${bottomNames[i] || 'Quần ' + i}</span>
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
            const accNames = ['Trống', 'Kính râm Neon', 'Mèo Thần Tài', 'Tai nghe Gaming', 'Vòng thiên sứ', 'Vương miện Vàng', 'Khẩu trang Ninja', 'Đầu bếp Master', 'Bịt mắt Hải tặc', 'Nơ Hồng', 'Xăm Kín Người', 'Mũ Cối VIP 🇻🇳', 'Nón Lá Vạn Xuân 🇻🇳', 'Khăn Rằn Nam Bộ 🇻🇳', 'Khăn Đóng Cung Đình 🇻🇳'];
            contentHtml = ChibiModule.renderGrid('accessory', options, accNames, 1.15);
        }
        else if (tabId === 'gear') {
            const options = Array.from({ length: ChibiModule.counts.gear }, (_, i) => i);
            const gearNames = ['Trống', 'Đại Đao Lửa', 'Súng Vô Cực', 'Kiếm Cyber', 'Thương Heo Tộc', 'Dép Tổ Ong', 'Chổi Tre Pháp Sư', 'Muỗng Mì Thần Thánh', 'Gậy Selfie', 'Cờ Lê Điện', 'Cây Lau Nhà', 'Nón Lá Phi Tiêu', 'Vợt Muỗi Điện', 'Ghế Đỏ Quyền Lực', 'Quạt Trúc', 'Lồng Đèn Hội An', 'Gánh Hàng Rong', 'Bánh Mì Sài Gòn', 'Cà Phê Phin', 'Đôi Dép Trắng'];
            contentHtml = ChibiModule.renderGrid('gear', options, gearNames, 1.25);
        }
        else if (tabId === 'wing') {
            const options = Array.from({ length: ChibiModule.counts.wing }, (_, i) => i);
            const wingNames = ['Trống', 'Cánh Thiên Thần', 'Cánh Ác Quỷ', 'Thiên Thần VIP', 'Cánh Bướm Pha Lê', 'Phượng Hoàng Lửa', 'Dơi Hắc Ám', 'Băng Tuyết Vĩnh Cửu'];
            contentHtml = ChibiModule.renderGrid('wing', options, wingNames, 1.1);
        }
        else if (tabId === 'mount') {
            const options = Array.from({ length: ChibiModule.counts.mount + 1 }, (_, i) => i);
            const mountNames = ['Đi bộ', 'Siêu Xe X-200', 'Mô Tô Ánh Sáng', 'Hồng Hạc Floatie', 'Xe Dream Neon 🇻🇳', 'Ván Bay Hover', 'Vespa Classique'];
            contentHtml = ChibiModule.renderGrid('mount', options, mountNames, 1.0);
        }
        else if (tabId === 'dragon') {
            const options = Array.from({ length: ChibiModule.counts.dragon + 1 }, (_, i) => i);
            const dragonNames = ['Trống', 'Lam Long Neon', 'Xích Long Hỏa', 'Hoàng Long Kim', 'Lục Long Mộc', 'Hắc Long Ảnh'];
            contentHtml = ChibiModule.renderGrid('dragon', options, dragonNames, 0.9);
        }
        else if (tabId === 'aura') {
            const options = Array.from({ length: ChibiModule.counts.aura + 1 }, (_, i) => i);
            const labels = ['Không', 'Neon Ring', 'Magic Rune', 'Fire Aura', 'Blood Ritual', 'Zen Circle', 'Void Aura', 'Ethereal Mist'];
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

        const isDancing = document.getElementById('chibi-dance-toggle')?.checked ?? true;
        const config = ChibiModule.currentConfig;

        // Use HIGH-FIDELITY Sprite renderer for the Builder preview
        const spriteHtml = ChibiModule.renderChibiSprite(config);
        container.innerHTML = `<div class="${isDancing ? 'chibi-dance' : ''}" style="width:100%;height:100%;">${spriteHtml}</div>`;
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
