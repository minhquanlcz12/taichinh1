/**
 * Pet Chibi Avatar Builder Module
 * Phong cÃ¡ch Zepeto / Gacha Life - SVG Composite Layers
 */

const ChibiModule = {
    // Preset Colors
    colors: {
        skin: [
            '#ffe0bd', // Há»“ng hÃ o sÃ¡ng
            '#ffcd94', // Kem tá»± nhiÃªn
            '#e0ac69', // BÃ¡nh máº­t ngá»t ngÃ o
            '#c68642', // NÃ¢u áº¥m Ã¡p
            '#8d5524', // NÃ¢u sÃ´-cÃ´-la
            '#3c1f06', // Äen mun huyá»n bÃ­
            '#00f3ff', // Xanh ngÆ°á»i ngoÃ i hÃ nh tinh
            '#a78bfa'  // TÃ­m pastel má»™ng mÆ¡
        ],
        hair: [
            '#111827', // Äen huyá»n
            '#4b5563', // XÃ¡m tro
            '#7c2d12', // NÃ¢u Ä‘á» auburn
            '#d97706', // VÃ ng báº¡ch kim
            '#ec4899', // Há»“ng neon cá»±c chÃ¡y
            '#8b5cf6', // TÃ­m thá»§y chung
            '#10b981', // Xanh lá»¥c báº£o
            '#3b82f6', // Xanh Ä‘áº¡i dÆ°Æ¡ng
            '#f3f4f6'  // Tráº¯ng tuyáº¿t
        ],
        clothing: [
            '#ef4444', // Äá» rá»±c rá»¡
            '#ec4899', // Há»“ng ngá»t ngÃ o
            '#8b5cf6', // TÃ­m má»™ng mÆ¡
            '#3b82f6', // Xanh thanh lá»‹ch
            '#06b6d4', // Cyan mÃ¡t láº¡nh
            '#10b981', // Xanh lÃ¡ tÆ°Æ¡i
            '#eab308', // VÃ ng náº¯ng
            '#f97316', // Cam nhiá»‡t Ä‘á»›i
            '#1f2937', // Äen tá»‘i thÆ°á»£ng
            '#ffffff'  // Tráº¯ng tinh khÃ´i
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

    // Style Count configuration (0 index to Max-1)
    counts: {
        skin: 8,
        hair: 20,      // Expanded to 20 styles
        eyes: 12,      // Expanded to 12 styles
        mouth: 10,     // Expanded to 10 styles
        top: 11,      
        bottom: 8,
        shoe: 8,       
        accessory: 15, 
        gear: 20,
        wing: 8,
        mount: 6,      // Added 5th vehicle
        dragon: 5,     // Added 4th dragon
        aura: 8        // Expanded to 8 styles
    },

    // State
    currentConfig: null,
    activeTab: 'skin',

    gearRequirements: {
        gear: {
            1: { label: "Äáº¡i Äao Lá»­a", requiredLevel: 2 },
            2: { label: "SÃºng VÃ´ Cá»±c", requiredLevel: 2 },
            3: { label: "Kiáº¿m Cyber Laser", requiredLevel: 3 },
            4: { label: "ThÆ°Æ¡ng Heo Tá»™c", requiredLevel: 1 },
            5: { label: "DÃ©p Tá»• Ong VÃ ng", requiredLevel: 1 },
            6: { label: "Chá»•i Tre Ã‚m DÆ°Æ¡ng", requiredLevel: 2 },
            7: { label: "Muá»—ng MÃ¬ Háº£o Háº¡ng", requiredLevel: 1 },
            8: { label: "Gáº­y Selfie CÃ¡nh VÃ ng", requiredLevel: 4 },
            9: { label: "Cá» LÃª Tia Chá»›p", requiredLevel: 3 },
            10: { label: "CÃ¢y Lau NhÃ  Ma Thuáº­t", requiredLevel: 2 },
            11: { label: "NÃ³n LÃ¡ Phi TiÃªu", requiredLevel: 4 },
            12: { label: "Vá»£t Muá»—i Äiá»‡n", requiredLevel: 3 },
            13: { label: "Gháº¿ Äá» Quyá»n Lá»±c", requiredLevel: 5 },
            14: { label: "Quáº¡t TrÃºc Thanh LÆ°Æ¡ng", requiredLevel: 2 },
            15: { label: "Lá»“ng ÄÃ¨n Há»™i An", requiredLevel: 3 },
            16: { label: "GÃ¡nh HÃ ng Rong", requiredLevel: 3 },
            17: { label: "BÃ¡nh MÃ¬ SÃ i GÃ²n", requiredLevel: 1 },
            18: { label: "CÃ  PhÃª Phin", requiredLevel: 2 },
            19: { label: "DÃ©p Tá»• Ong Huyá»n Thoáº¡i", requiredLevel: 1 }
        },
        mount: {
            1: { label: "ðŸŽï¸ SiÃªu Xe Thá»ƒ Thao V6", requiredLevel: 7 },
            2: { label: "ðŸï¸ Motor Cyber TRON V6", requiredLevel: 5 },
            3: { label: "ðŸ›¹ VÃ¡n TrÆ°á»£t Bay V6", requiredLevel: 5 },
            4: { label: "ðŸ›µ Vespa Cá»• Äiá»ƒn V6", requiredLevel: 4 },
            5: { label: "ðŸš Drone Chiáº¿n Äáº¥u V6", requiredLevel: 8 }
        },
        wing: {
            1: { label: "CÃ¡nh ThiÃªn Tháº§n", requiredLevel: 5 },
            2: { label: "CÃ¡nh Ãc Quá»·", requiredLevel: 6 },
            3: { label: "CÃ¡nh ThiÃªn Tháº§n VIP", requiredLevel: 7 },
            4: { label: "CÃ¡nh BÆ°á»›m Pha LÃª", requiredLevel: 8 },
            5: { label: "CÃ¡nh PhÆ°á»£ng HoÃ ng Lá»­a", requiredLevel: 9 },
            6: { label: "CÃ¡nh DÆ¡i Háº¯c Ãm", requiredLevel: 10 },
            7: { label: "CÃ¡nh BÄƒng Tuyáº¿t VIP", requiredLevel: 12 }
        },
        dragon: {
            1: { label: "ðŸŒŠ Lam Long Tháº§n V6", requiredLevel: 7 },
            2: { label: "ðŸ”¥ XÃ­ch Long Tháº§n V6", requiredLevel: 9 },
            3: { label: "âš¡ HoÃ ng Long Tháº§n V6", requiredLevel: 12 },
            4: { label: "ðŸŒ‘ Háº¯c Long Tháº§n V6", requiredLevel: 15 }
        },
        accessory: {
            11: { label: "MÅ© Cá»‘i KhÃ¡ng Chiáº¿n", requiredLevel: 3 },
            12: { label: "NÃ³n LÃ¡ Truyá»n Thá»‘ng", requiredLevel: 3 },
            13: { label: "KhÄƒn Ráº±n Nam Bá»™", requiredLevel: 2 }
        }
    },

    // NEW: Full SET Presets
    presets: [
        {
            id: 'tokyo-cyber',
            name: 'SiÃªu NhÃ¢n Äiá»‡n Quang (Cyber)',
            desc: 'Phong cÃ¡ch Cyberpunk tÆ°Æ¡ng lai cá»±c chÃ¡y.',
            config: { gender: 'nam', hairStyle: 3, hairColor: '#00f3ff', eyeStyle: 1, mouthStyle: 6, topStyle: 3, topColor: '#1e293b', bottomStyle: 5, bottomColor: '#1e293b', shoeStyle: 4, mount: 2, dragon: 1, aura: 1 }
        },
        {
            id: 'viet-legend',
            name: 'Huyá»n Thoáº¡i Viá»‡t Nam ðŸ‡»ðŸ‡³',
            desc: 'Ão dÃ i, nÃ³n lÃ¡, hÃ i lÃ²ng dÃ¢n tá»™c!',
            config: { gender: 'ná»¯', hairStyle: 2, hairColor: '#111827', eyeStyle: 0, mouthStyle: 0, topStyle: 7, topColor: '#b91c1c', bottomStyle: 2, bottomColor: '#ffffff', shoeStyle: 1, accessory: 12, mount: 4, dragon: 3, aura: 6 }
        },
        {
            id: 'samurai-spirit',
            name: 'VÃµ SÄ© Äáº¡o (Samurai)',
            desc: 'Tinh tháº§n thÃ©p, Ä‘áº¡i Ä‘ao lá»­a!',
            config: { gender: 'nam', hairStyle: 2, hairColor: '#111827', eyeStyle: 5, mouthStyle: 8, topStyle: 4, topColor: '#1e293b', bottomStyle: 7, bottomColor: '#1e293b', shoeStyle: 3, gear: 1, dragon: 2, aura: 2 }
        },
        {
            id: 'hero-divine',
            name: 'Anh HÃ¹ng CÃ´ng LÃ½',
            desc: 'Báº£o vá»‡ tháº¿ giá»›i khá»i bÃ³ng tá»‘i!',
            config: { gender: 'nam', hairStyle: 7, hairColor: '#facc15', eyeStyle: 7, mouthStyle: 0, topStyle: 8, topColor: '#3b82f6', bottomStyle: 4, bottomColor: '#1e3a8a', shoeStyle: 3, aura: 6, dragon: 3 }
        },

        {
            id: 'to-ong-king',
            name: 'Vua DÃ©p Tá»• Ong ðŸ',
            desc: 'DÃ¢n chÆ¡i xÃ³m nÃºp lÃ¹m!',
            config: { gender: 'nam', hairStyle: 1, hairColor: '#7c2d12', eyeStyle: 9, mouthStyle: 2, topStyle: 1, topColor: '#ffffff', bottomStyle: 3, bottomColor: '#2563eb', shoeStyle: 1, gear: 19, accessory: 11, mount: 4 }
        },
        {
            id: 'angel-divine',
            name: 'ThiÃªn Tháº§n Thanh Khiáº¿t',
            desc: 'Sá»©c máº¡nh tá»« thiÃªn giá»›i.',
            config: { gender: 'ná»¯', hairStyle: 12, hairColor: '#ffffff', eyeStyle: 7, mouthStyle: 0, topStyle: 1, topColor: '#ffffff', bottomStyle: 2, bottomColor: '#ffffff', shoeStyle: 6, wing: 1, dragon: 3 }
        },
        {
            id: 'reaper-soul',
            name: 'Tá»­ Tháº§n Háº¯c Ãm',
            desc: 'BÃ³ng tá»‘i vÄ©nh háº±ng...',
            config: { gender: 'nam', hairStyle: 17, hairColor: '#1e1b4b', eyeStyle: 8, mouthStyle: 4, topStyle: 5, topColor: '#111', bottomStyle: 1, bottomColor: '#111', shoeStyle: 5, wing: 6, dragon: 5 }
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
            const isCompleted = status.includes('done') || status.includes('hoÃ n thÃ nh');
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
        // Kiá»ƒm tra trang bá»‹ cÃ³ bá»‹ khÃ³a theo Level khÃ´ng
        if (typeof Auth === 'undefined' || !Auth.currentUser) return true;
        if (Auth.currentUser.role === 'admin') return false;

        const userLevel = Auth.currentUser.level || 1;
        const cat = category || ChibiModule.activeTab || 'gear';
        const reqs = ChibiModule.gearRequirements[cat];
        if (!reqs || !reqs[index]) return false; // KhÃ´ng cÃ³ yÃªu cáº§u = luÃ´n má»Ÿ

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
    /**
     * Main Chibi SVG Renderer (V8 - HIGH FIDELITY)
     */
    renderChibiSVG: function(config, isD = false, pts = 0) {
        const c = config || this.currentConfig;
        const skinColor = c.skinColor || "#ffd1a9";
        const darkSkin = this.adjustColor(skinColor, -25);
        const hc = c.hairColor || "#343a40";
        const darkHair = this.adjustColor(hc, -40);
        const gender = c.gender || "nam";
        const viewBox = "0 0 200 220";
        const hs = c.hairStyle;
        const hStyle = hs;
        const es = c.eyeStyle;
        const mo = c.mouthStyle;

        // 1. Dragon Layer (Below all)
        let dragonHtml = '';
        if (c.dragon > 0) {
            const dc = ChibiModule.colors.dragons[c.dragon-1] || "#fbbf24";
            dragonHtml = `<g filter="url(#glowStrong)" style="animation: dragonFloat 4s infinite ease-in-out;">
                <path d="M 40 140 Q 20 100 60 60 Q 100 20 140 60 Q 180 100 160 140" fill="none" stroke="${dc}" stroke-width="12" stroke-linecap="round" opacity="0.6" />
                <circle cx="160" cy="140" r="8" fill="${dc}" />
            </g>`;
        }

        // 2. Aura Layer
        let auraHtml = '';
        if (pts > 50) {
            auraHtml = `<circle cx="100" cy="110" r="90" fill="none" stroke="url(#glowNeon)" stroke-width="2" opacity="0.3" style="animation: runeRotate 10s linear infinite;"/>`;
        }

        // 3. Wings Layer (V8)
        let wingHtml = '';
        const w = c.wing;
        if (w === 1 || w === 2) { // Angelic
            wingHtml = `<g class="chibi-wing-flap" filter="url(#glowStrong)">
                <path d="M 80 110 Q 20 40 40 140 Q 60 160 85 130 Z" fill="#fff" opacity="0.8" />
                <path d="M 120 110 Q 180 40 160 140 Q 140 160 115 130 Z" fill="#fff" opacity="0.8" />
            </g>`;
        } else if (w === 5 || w === 6) { // Dark/Bat
            wingHtml = `<g class="chibi-wing-flap" filter="url(#glowStrong)">
                <path d="M 85 115 L 30 80 L 50 130 L 30 140 L 85 135 Z" fill="#1e293b" />
                <path d="M 115 115 L 170 80 L 150 130 L 170 140 L 115 135 Z" fill="#1e293b" />
            </g>`;
        }

        // 4. Hair & Back Hair (V8)
        let hairHtml = '', backHairHtml = '';
        if ([2, 4, 6, 8, 10, 12, 14, 16, 18, 20].includes(hs)) {
            backHairHtml = `<path d="M 50 100 Q 100 180 150 100 L 160 140 Q 100 220 40 140 Z" fill="url(#hairGradV5)" opacity="0.8" />`;
        }
        
        if (hs === 1) { // Cyber Spiky
            hairHtml = `<g filter="url(#glowStrong)"><path d="M 60 70 L 100 10 L 140 70 L 155 100 Q 100 125 45 100 Z" fill="url(#hairGradV5)" /><path d="M 75 50 L 85 25 M 115 25 L 125 50" stroke="${hc}" stroke-width="4" opacity="0.6" /></g>`;
        } else if (hs === 2) { // Sleek Bob
            hairHtml = `<path d="M 55 75 Q 100 25 145 75 L 155 125 Q 100 145 45 125 Z" fill="url(#hairGradV5)" stroke="rgba(0,0,0,0.1)" />`;
        } else if (hs === 3) { // Royal Topknot
            hairHtml = `<g><circle cx="100" cy="30" r="18" fill="url(#hairGradV5)" stroke="rgba(0,0,0,0.2)" /><path d="M 60 75 Q 100 35 140 75 L 150 110 Q 100 125 50 110 Z" fill="url(#hairGradV5)" /></g>`;
        } else if (hs === 10) { // Legendary V8 Flow
            hairHtml = `<g filter="url(#glowStrong)"><path d="M 55 85 Q 100 20 145 85 L 150 115 Q 100 135 50 115 Z" fill="url(#hairGradV5)" /><path d="M 70 45 Q 100 10 130 45" stroke="${hc}" stroke-width="5" fill="none" opacity="0.5" /></g>`;
        } else {
            hairHtml = `<path d="M 58 75 Q 100 28 142 75 L 150 105 Q 100 120 50 105 Z" fill="url(#hairGradV5)" />`;
        }

        // 5. Face Features (V8)
        let eyesHtml = '', mouthHtml = '', faceFeaturesHtml = '';
        if (es === 1) { // Large Sparkle
            eyesHtml = `<g class="chibi-blink"><circle cx="85" cy="82" r="6" fill="#111" /><circle cx="115" cy="82" r="6" fill="#111" /><circle cx="87" cy="80" r="2.5" fill="#fff" /><circle cx="117" cy="80" r="2.5" fill="#fff" /></g>`;
        } else if (es === 4) { // Heart Eyes
            eyesHtml = `<g class="chibi-blink"><path d="M 80 80 Q 85 70 90 80 L 85 90 Z M 110 80 Q 115 70 120 80 L 115 90 Z" fill="#f43f5e" /></g>`;
        } else {
            eyesHtml = `<g class="chibi-blink"><circle cx="85" cy="82" r="5" fill="#111" /><circle cx="115" cy="82" r="5" fill="#111" /></g>`;
        }
        
        if (mo === 1) { // Smile
            mouthHtml = `<path d="M 90 100 Q 100 110 110 100" fill="none" stroke="#000" stroke-width="2" />`;
        } else if (mo === 2) { // Open
            mouthHtml = `<circle cx="100" cy="105" r="4" fill="#660000" />`;
        } else {
            mouthHtml = `<path d="M 95 102 Q 100 105 105 102" fill="none" stroke="#000" stroke-width="1.5" />`;
        }
        
        faceFeaturesHtml = `<g class="chibi-head-bob">${eyesHtml}${mouthHtml}</g>`;

        // 6. Clothing & Accessories (V8)
        let topHtml = '', bottomHtml = '', gearHtml = '', accHtml = '', backAccessoryHtml = '';
        const topCol = c.topColor || "#e83e8c", botCol = c.bottomColor || "#3b82f6";
        
        topHtml = `<path d="M 85 110 L 115 110 L 120 160 L 80 160 Z" fill="${topCol}" />`;
        bottomHtml = `<path d="M 85 160 L 115 160 L 118 190 L 82 190 Z" fill="${botCol}" />`;
        
        if (c.accessory === 11) { // Mũ Cối
             accHtml = `<path d="M 50 60 Q 100 20 150 60 L 150 75 Q 100 95 50 75 Z" fill="#365314" stroke="#1a2e05" stroke-width="2" />`;
        }

        // 7. Gear & Mount
        if (c.gear === 1) { // Greatsword
            gearHtml = `<g transform="translate(130, 120) rotate(15)"><rect x="-5" y="-60" width="10" height="85" fill="url(#bladeSteel)" stroke="#334155" /></g>`;
        }
        
        let mountHtml = '';
        if (c.mount === 14) { // Neon Bike
            mountHtml = `<g filter="url(#glowStrong)"><path d="M 40 180 L 160 180 L 170 210 L 30 210 Z" fill="#dc2626" stroke="#fbbf24" stroke-width="2" /></g>`;
        } else {
            mountHtml = `<ellipse cx="100" cy="200" rx="60" ry="10" fill="#000" opacity="0.3" />`;
        }

        let sparklesHtml = pts > 20 ? `<circle cx="50" cy="50" r="3" fill="#fbbf24" style="animation: floatSparkle 2s infinite;" />` : '';

        return `
            <svg viewBox="${viewBox}" width="100%" height="100%" class="${isD ? 'chibi-dance' : ''}" style="display: block;">
                <style>
                    .chibi-dance { animation: chibiBounce 2s infinite ease-in-out; transform-origin: bottom center; }
                    @keyframes chibiBounce { 0%, 100% { transform: scale(1) translateY(0); } 50% { transform: scale(1.02, 0.98) translateY(-4px); } }
                    .chibi-breathe { animation: chibiBreathe 3s infinite ease-in-out; transform-origin: center; }
                    @keyframes floatSparkle { 0%, 100% { transform: translateY(0) scale(0.6); opacity: 0.3; } 50% { transform: translateY(-10px) scale(1.1); opacity: 1; } }
                    .chibi-wing-flap { animation: wingFlap 2.5s infinite ease-in-out; transform-origin: 100px 110px; }
                    @keyframes wingFlap { 0%, 100% { transform: scaleX(1); } 50% { transform: scaleX(0.85); } }
                    @keyframes glowPulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
                    @keyframes runeRotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                </style>
                <defs>
                    <linearGradient id="skinGradV5" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="${skinColor}" /><stop offset="100%" stop-color="${this.adjustColor(skinColor, -12)}" />
                    </linearGradient>
                    <linearGradient id="hairGradV5" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="${hc}" /><stop offset="100%" stop-color="${this.adjustColor(hc, -30)}" />
                    </linearGradient>
                    <linearGradient id="bladeSteel" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stop-color="#94a3b8" /><stop offset="40%" stop-color="#e2e8f0" /><stop offset="60%" stop-color="#f8fafc" /><stop offset="100%" stop-color="#94a3b8" />
                    </linearGradient>
                    <filter id="glowStrong"><feGaussianBlur stdDeviation="3.5" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/></filter>
                </defs>
                ${dragonHtml}${auraHtml}${mountHtml}${wingHtml}${sparklesHtml}${backHairHtml}
                <g class="chibi-breathe">
                    <g class="chibi-body">
                        <path d="M 85 125 L 70 150" stroke="${skinColor}" stroke-width="12" stroke-linecap="round" />
                        <path d="M 115 125 L 130 150" stroke="${skinColor}" stroke-width="12" stroke-linecap="round" />
                        <path d="M 90 175 L 85 200" stroke="${skinColor}" stroke-width="13" stroke-linecap="round" />
                        <path d="M 110 175 L 115 200" stroke="${skinColor}" stroke-width="13" stroke-linecap="round" />
                        <path d="M 85 110 L 115 110 L 120 175 Q 100 185 80 175 Z" fill="${skinColor}" />
                        ${bottomHtml}${topHtml}
                    </g>
                    <g transform="translate(100, 75)"><circle r="40" fill="${skinColor}" /></g>
                    ${faceFeaturesHtml}${hairHtml}${accHtml}${gearHtml}
                </g>
            </svg>
        `;
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

        // Adjust viewBox to crop/zoom into the relevant body region (V5 PRO)
        let viewBox = '0 0 200 200';
        if (type === 'hair') viewBox = '45 20 110 85';
        else if (type === 'eyes') viewBox = '65 75 70 20';
        else if (type === 'mouth') viewBox = '85 92 30 18';
        else if (type === 'top') viewBox = '60 108 80 45';
        else if (type === 'bottom') viewBox = '65 135 70 45';
        else if (type === 'shoe') viewBox = '70 165 60 30';
        else if (type === 'accessory') {
            if (index >= 11 && index <= 12) viewBox = '35 15 130 85'; // Hats V5
            else if (index === 13) viewBox = '55 60 90 60'; // Scarf V5
            else viewBox = '40 20 120 85';
        } else if (type === 'gear') {
            if (index === 16) viewBox = '10 70 180 120'; // Vendor Pole
            else if (index === 15) viewBox = '100 50 80 150'; // Lantern
            else viewBox = '80 50 110 140';
        } else if (type === 'wing') {
            viewBox = '-10 -10 220 220';
        } else if (type === 'mount') {
            viewBox = '0 80 200 130';
        } else if (type === 'aura') {
            viewBox = '30 150 140 60';
        } else if (type === 'dragon') {
            viewBox = '30 0 140 180';
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
            Utils.showToast("Báº¡n cáº§n Ä‘Äƒng nháº­p trÆ°á»›c!", "error");
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
                        <i class="fa-solid fa-ghost"></i> Thiáº¿t Káº¿ Pet Chibi Avatar
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
                            <button onclick="ChibiModule.currentConfig.gender='ná»¯'; ChibiModule.updatePreview(); this.parentNode.querySelectorAll('button').forEach(b=>b.classList.remove('active')); this.classList.add('active');" 
                                    class="chibi-btn-outline ${ChibiModule.currentConfig.gender==='ná»¯'?'active':''}" 
                                    style="flex: 1; padding: 8px; font-weight: 800; border-radius: 8px;">
                                <i class="fa-solid fa-venus"></i> Ná»®
                            </button>
                        </div>

                        <div id="chibi-preview-container" style="width: 200px; height: 240px; background: radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(0,0,0,0.6) 100%); border-radius: 12px; border: 2px solid rgba(139, 92, 246, 0.4); display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; box-shadow: inset 0 0 20px rgba(0,0,0,0.85);">
                            <!-- Chibi composite SVG injected here -->
                        </div>

                        <!-- Bounce dancing toggle -->
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; color: #cbd5e1; font-weight: bold; background: rgba(255,255,255,0.05); padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.08); user-select: none;">
                            <input type="checkbox" id="chibi-dance-toggle" checked onchange="ChibiModule.updatePreview()" style="cursor: pointer; accent-color: #8b5cf6;">
                            <span>ðŸ’ƒ Hiá»‡u á»©ng Animation VIP</span>
                        </label>
                        
                        <!-- Mini controls -->
                        <div style="display: flex; gap: 10px; width: 100%;">
                            <button onclick="ChibiModule.randomizeBuilder()" class="chibi-btn-outline" style="flex: 1; padding: 10px; font-weight: bold; font-size: 13px; border-radius: 8px; display: flex; align-items: center; justify-content: center; gap: 6px; border: 1px solid rgba(255,255,255,0.1); transition: all 0.2s;">
                                <i class="fa-solid fa-dice"></i> Ngáº«u nhiÃªn
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
                            <button onclick="ChibiModule.switchTab('hair')" class="chibi-tab-btn" id="tab-hair">TÃ³c</button>
                            <button onclick="ChibiModule.switchTab('eyes')" class="chibi-tab-btn" id="tab-eyes">Máº¯t</button>
                            <button onclick="ChibiModule.switchTab('top')" class="chibi-tab-btn" id="tab-top">Ão</button>
                            <button onclick="ChibiModule.switchTab('bottom')" class="chibi-tab-btn" id="tab-bottom">Quáº§n</button>
                            <button onclick="ChibiModule.switchTab('shoe')" class="chibi-tab-btn" id="tab-shoe">GiÃ y</button>
                            <button onclick="ChibiModule.switchTab('accessory')" class="chibi-tab-btn" id="tab-accessory">NÃ³n/KÃ­nh</button>
                            <button onclick="ChibiModule.switchTab('gear')" class="chibi-tab-btn" id="tab-gear">VÅ© KhÃ­</button>
                            <button onclick="ChibiModule.switchTab('aura')" class="chibi-tab-btn" id="tab-aura">VÃ²ng SÃ¡ng</button>
                            <button onclick="ChibiModule.switchTab('wing')" class="chibi-tab-btn" id="tab-wing">CÃ¡nh</button>
                            <button onclick="ChibiModule.switchTab('dragon')" class="chibi-tab-btn" id="tab-dragon">Linh ThÃº</button>
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
                        ðŸ·ï¸ Äá»”I DANH HIá»†U Láº¤P LÃNH
                    </button>
                    <button onclick="ChibiModule.closeBuilder()" style="background: rgba(255,255,255,0.04); color: #cbd5e1; border: 1px solid rgba(255,255,255,0.1); padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.04)'">
                        Há»¦Y Bá»Ž
                    </button>
                    <button onclick="ChibiModule.saveBuilder()" style="background: linear-gradient(135deg, #ec4899, #8b5cf6); color: #fff; border: none; padding: 10px 24px; border-radius: 8px; font-weight: 800; cursor: pointer; transition: all 0.2s; box-shadow: 0 0 15px rgba(236,72,153,0.4);" onmouseover="this.style.transform='scale(1.02)'; this.style.boxShadow='0 0 20px rgba(236,72,153,0.6)'" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 0 15px rgba(236,72,153,0.4)'">
                        ðŸ’¾ LÆ¯U AVATAR
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
                    const lockInfo = locked && req ? `Cáº¥p ${req.requiredLevel}` : '';
                    if (locked) {
                        return `
                            <div class="chibi-item-card chibi-item-locked" onclick="ChibiModule.selectItem('${property}', ${i})" title="ðŸ”’ ${req ? req.label : ''} - YÃªu cáº§u ${lockInfo}">
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
            { id: 'skin', label: 'ðŸŽ¨ CÆ¡ Thá»ƒ' },
            { id: 'hair', label: 'ðŸ’‡ TÃ³c' },
            { id: 'face', label: 'ðŸ˜Š KhuÃ´n Máº·t' },
            { id: 'clothing', label: 'ðŸ‘• Quáº§n Ão' },
            { id: 'accessory', label: 'ðŸ‘‘ Phá»¥ Kiá»‡n' },
            { id: 'gear', label: 'âš”ï¸ VÅ© KhÃ­' },
            { id: 'wing', label: 'ðŸ•Šï¸ CÃ¡nh' },
            { id: 'mount', label: 'ðŸŽï¸ CÆ°á»¡i' },
            { id: 'dragon', label: 'ðŸ‰ Rá»“ng' },
            { id: 'aura', label: 'âœ¨ Hiá»‡u á»©ng' },
            { id: 'presets', label: 'â­ Full SET' }
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
                        <h4 style="margin: 0 0 8px 0; font-size: 13px; color: #94a3b8; text-transform: uppercase;">Giá»›i TÃ­nh (Gender)</h4>
                        <div style="display: flex; gap: 12px; margin-bottom: 16px;">
                            <button class="chibi-btn-outline ${ChibiModule.currentConfig.gender === 'nam' ? 'active' : ''}" 
                                    style="flex: 1; padding: 10px; font-weight: bold; border-radius: 8px; display: flex; align-items: center; justify-content: center; gap: 8px; border: 1px solid rgba(255,255,255,0.1); cursor: pointer;"
                                    onclick="ChibiModule.selectGender('nam')">
                                â™‚ï¸ NAM
                            </button>
                            <button class="chibi-btn-outline ${ChibiModule.currentConfig.gender === 'ná»¯' ? 'active' : ''}" 
                                    style="flex: 1; padding: 10px; font-weight: bold; border-radius: 8px; display: flex; align-items: center; justify-content: center; gap: 8px; border: 1px solid rgba(255,255,255,0.1); cursor: pointer;"
                                    onclick="ChibiModule.selectGender('ná»¯')">
                                â™€ï¸ Ná»®
                            </button>
                        </div>
                    </div>
                    <div>
                        <h4 style="margin: 0 0 8px 0; font-size: 13px; color: #94a3b8; text-transform: uppercase;">Lá»±a Chá»n MÃ u Da</h4>
                        <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                            ${ChibiModule.colors.skin.map((col, idx) => `
                                <div class="chibi-color-circle ${ChibiModule.currentConfig.skinColor === col ? 'active' : ''}" 
                                     style="background: ${col};"" 
                                     onclick="ChibiModule.selectColor('skinColor', '${col}')"></div>
                            `).join('')}
                        </div>
                    </div>
                    <div style="margin-top: 10px; display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.02); padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                        <span style="font-size: 12px; font-weight: bold; color: #cbd5e1;">MÃ u TÃ¹y Chá»n:</span>
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
                        <h4 style="margin: 0 0 10px 0; font-size: 13px; color: #94a3b8; text-transform: uppercase;">Kiá»ƒu TÃ³c</h4>
                        <div class="chibi-item-grid">
                            ${options.map(i => {
                                const activeClass = ChibiModule.currentConfig.hairStyle === i ? 'active' : '';
                                const miniSvg = ChibiModule.renderMiniOption('hair', i, ChibiModule.currentConfig.hairColor);
                                return `
                                    <div class="chibi-item-card ${activeClass}" onclick="ChibiModule.selectItem('hairStyle', ${i})">
                                        <div class="chibi-item-preview-wrap" style="transform: scale(1.15);">
                                            ${miniSvg}
                                        </div>
                                        <span class="chibi-item-label">${i === 0 ? 'Trá»c' : 'TÃ³c ' + i}</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                    <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 5px 0;">
                    <div>
                        <h4 style="margin: 0 0 8px 0; font-size: 13px; color: #94a3b8; text-transform: uppercase;">MÃ u TÃ³c</h4>
                        <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                            ${ChibiModule.colors.hair.map(col => `
                                <div class="chibi-color-circle ${ChibiModule.currentConfig.hairColor === col ? 'active' : ''}" 
                                     style="background: ${col};"" 
                                     onclick="ChibiModule.selectColor('hairColor', '${col}')"></div>
                            `).join('')}
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.02); padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                        <span style="font-size: 12px; font-weight: bold; color: #cbd5e1;">MÃ u TÃ³c Tá»± Chá»n:</span>
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
                        <h4 style="margin: 0 0 10px 0; font-size: 13px; color: #94a3b8; text-transform: uppercase;">Kiá»ƒu Máº¯t</h4>
                        <div class="chibi-item-grid">
                            ${eyeOptions.map(i => {
                                const activeClass = ChibiModule.currentConfig.eyeStyle === i ? 'active' : '';
                                const miniSvg = ChibiModule.renderMiniOption('eyes', i);
                                return `
                                    <div class="chibi-item-card ${activeClass}" onclick="ChibiModule.selectItem('eyeStyle', ${i})">
                                        <div class="chibi-item-preview-wrap" style="transform: scale(1.6);">
                                            ${miniSvg}
                                        </div>
                                        <span class="chibi-item-label">Máº¯t ${i + 1}</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                    <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 5px 0;">
                    <div>
                        <h4 style="margin: 0 0 10px 0; font-size: 13px; color: #94a3b8; text-transform: uppercase;">Kiá»ƒu Miá»‡ng</h4>
                        <div class="chibi-item-grid">
                            ${mouthOptions.map(i => {
                                const activeClass = ChibiModule.currentConfig.mouthStyle === i ? 'active' : '';
                                const miniSvg = ChibiModule.renderMiniOption('mouth', i);
                                return `
                                    <div class="chibi-item-card ${activeClass}" onclick="ChibiModule.selectItem('mouthStyle', ${i})">
                                        <div class="chibi-item-preview-wrap" style="transform: scale(1.8);">
                                            ${miniSvg}
                                        </div>
                                        <span class="chibi-item-label">Miá»‡ng ${i + 1}</span>
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
            const topNames = ['Máº·c Ä‘á»‹nh', 'Ão PhÃ´ng Neo', 'Vest CÃ´ng Sá»Ÿ', 'GiÃ¡p Cyber Titan', 'Ronin Kimono', 'Vest Äáº·c Nhiá»‡m', 'Hoodie Dáº¡o Phá»‘', 'Ão DÃ i HoÃ ng Gia ðŸ‡»ðŸ‡³', 'SiÃªu NhÃ¢n Hero', 'Shinobi ðŸ¥·', 'Tu SÄ© Rá»“ng', 'Phi CÃ´ng Tinh Há»‡']; 

            contentHtml = `
                <div style="display: flex; flex-direction: column; gap: 20px;">
                    <div>
                        <h4 style="margin: 0 0 10px 0; font-size: 13px; color: #94a3b8; text-transform: uppercase;">Kiá»ƒu Ão (Tops)</h4>
                        <div class="chibi-item-grid" style="margin-bottom: 12px;">
                            ${topOptions.map(i => {
                                const activeClass = ChibiModule.currentConfig.topStyle === i ? 'active' : '';
                                const miniSvg = ChibiModule.renderMiniOption('top', i, ChibiModule.currentConfig.topColor);
                                return `
                                    <div class="chibi-item-card ${activeClass}" onclick="ChibiModule.selectItem('topStyle', ${i})">
                                        <div class="chibi-item-preview-wrap" style="transform: scale(1.3);">
                                            ${miniSvg}
                                        </div>
                                        <span class="chibi-item-label">${topNames[i] || 'Ão ' + i}</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                        <h5 style="margin: 8px 0 8px 0; font-size: 11px; color: #64748b; text-transform: uppercase;">MÃ u Ão</h5>
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
                        <h4 style="margin: 0 0 10px 0; font-size: 13px; color: #94a3b8; text-transform: uppercase;">Kiá»ƒu Quáº§n / VÃ¡y (Bottoms)</h4>
                        <div class="chibi-item-grid" style="margin-bottom: 12px;">
                            ${bottomOptions.map(i => {
                                const bottomNames = ['Máº·c Ä‘á»‹nh', 'Quáº§n TÃ¢y', 'VÃ¡y Xáº¿p Ly', 'Quáº§n Short', 'Quáº§n Jogger', 'GiÃ¡p ChÃ¢n Cyber', 'Tech-Cargo', 'Hakama VÃµ SÄ©', 'Quáº§n Váº£y Rá»“ng'];
                                const activeClass = ChibiModule.currentConfig.bottomStyle === i ? 'active' : '';
                                const miniSvg = ChibiModule.renderMiniOption('bottom', i, ChibiModule.currentConfig.bottomColor);
                                return `
                                    <div class="chibi-item-card ${activeClass}" onclick="ChibiModule.selectItem('bottomStyle', ${i})">
                                        <div class="chibi-item-preview-wrap" style="transform: scale(1.35);">
                                            ${miniSvg}
                                        </div>
                                        <span class="chibi-item-label">${bottomNames[i] || 'Quáº§n ' + i}</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                        <h5 style="margin: 8px 0 8px 0; font-size: 11px; color: #64748b; text-transform: uppercase;">MÃ u Quáº§n</h5>
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
                        <h4 style="margin: 0 0 10px 0; font-size: 13px; color: #94a3b8; text-transform: uppercase;">Kiá»ƒu GiÃ y (Shoes)</h4>
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
                        <h5 style="margin: 8px 0 8px 0; font-size: 11px; color: #64748b; text-transform: uppercase;">MÃ u GiÃ y</h5>
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
            const accNames = ['Trá»‘ng', 'KÃ­nh rÃ¢m Neon', 'MÃ¨o Tháº§n TÃ i', 'Tai nghe Gaming', 'VÃ²ng thiÃªn sá»©', 'VÆ°Æ¡ng miá»‡n VÃ ng', 'Kháº©u trang Ninja', 'Äáº§u báº¿p Master', 'Bá»‹t máº¯t Háº£i táº·c', 'NÆ¡ Há»“ng', 'XÄƒm KÃ­n NgÆ°á»i', 'MÅ© Cá»‘i VIP ðŸ‡»ðŸ‡³', 'NÃ³n LÃ¡ Váº¡n XuÃ¢n ðŸ‡»ðŸ‡³', 'KhÄƒn Ráº±n Nam Bá»™ ðŸ‡»ðŸ‡³', 'KhÄƒn ÄÃ³ng Cung ÄÃ¬nh ðŸ‡»ðŸ‡³'];
            contentHtml = ChibiModule.renderGrid('accessory', options, accNames, 1.15);
        }
        else if (tabId === 'gear') {
            const options = Array.from({ length: ChibiModule.counts.gear }, (_, i) => i);
            const gearNames = ['Trá»‘ng', 'Äáº¡i Äao Lá»­a', 'SÃºng VÃ´ Cá»±c', 'Kiáº¿m Cyber', 'ThÆ°Æ¡ng Heo Tá»™c', 'DÃ©p Tá»• Ong', 'Chá»•i Tre PhÃ¡p SÆ°', 'Muá»—ng MÃ¬ Tháº§n ThÃ¡nh', 'Gáº­y Selfie', 'Cá» LÃª Äiá»‡n', 'CÃ¢y Lau NhÃ ', 'NÃ³n LÃ¡ Phi TiÃªu', 'Vá»£t Muá»—i Äiá»‡n', 'Gháº¿ Äá» Quyá»n Lá»±c', 'Quáº¡t TrÃºc', 'Lá»“ng ÄÃ¨n Há»™i An', 'GÃ¡nh HÃ ng Rong', 'BÃ¡nh MÃ¬ SÃ i GÃ²n', 'CÃ  PhÃª Phin', 'ÄÃ´i DÃ©p Tráº¯ng'];
            contentHtml = ChibiModule.renderGrid('gear', options, gearNames, 1.25);
        }
        else if (tabId === 'wing') {
            const options = Array.from({ length: ChibiModule.counts.wing }, (_, i) => i);
            const wingNames = ['Trá»‘ng', 'CÃ¡nh ThiÃªn Tháº§n', 'CÃ¡nh Ãc Quá»·', 'ThiÃªn Tháº§n VIP', 'CÃ¡nh BÆ°á»›m Pha LÃª', 'PhÆ°á»£ng HoÃ ng Lá»­a', 'DÆ¡i Háº¯c Ãm', 'BÄƒng Tuyáº¿t VÄ©nh Cá»­u'];
            contentHtml = ChibiModule.renderGrid('wing', options, wingNames, 1.1);
        }
        else if (tabId === 'mount') {
            const options = Array.from({ length: ChibiModule.counts.mount + 1 }, (_, i) => i);
            const mountNames = ['Äi bá»™', 'SiÃªu Xe X-200', 'MÃ´ TÃ´ Ãnh SÃ¡ng', 'Há»“ng Háº¡c Floatie', 'Xe Dream Neon ðŸ‡»ðŸ‡³', 'VÃ¡n Bay Hover', 'Vespa Classique'];
            contentHtml = ChibiModule.renderGrid('mount', options, mountNames, 1.0);
        }
        else if (tabId === 'dragon') {
            const options = Array.from({ length: ChibiModule.counts.dragon + 1 }, (_, i) => i);
            const dragonNames = ['Trá»‘ng', 'Lam Long Neon', 'XÃ­ch Long Há»a', 'HoÃ ng Long Kim', 'Lá»¥c Long Má»™c', 'Háº¯c Long áº¢nh'];
            contentHtml = ChibiModule.renderGrid('dragon', options, dragonNames, 0.9);
        }
        else if (tabId === 'aura') {
            const options = Array.from({ length: ChibiModule.counts.aura + 1 }, (_, i) => i);
            const labels = ['KhÃ´ng', 'Neon Ring', 'Magic Rune', 'Fire Aura', 'Blood Ritual', 'Zen Circle', 'Void Aura', 'Ethereal Mist'];
            contentHtml = ChibiModule.renderGrid('aura', options, labels);
        }
        else if (tabId === 'presets') {
            // FULL SET PRESETS
            contentHtml = `
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    <div style="background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.2); padding: 12px; border-radius: 10px; margin-bottom: 5px;">
                        <span style="color: #fbbf24; font-size: 13px; font-weight: bold; display: flex; align-items: center; gap: 8px;">
                            <i class="fa-solid fa-star"></i> CHá»ŒN TRANG PHá»¤C THEO Bá»˜
                        </span>
                        <p style="margin: 5px 0 0 0; font-size: 11px; color: #94a3b8;">Trang bá»‹ Ä‘á»“ng bá»™ toÃ n bá»™ tá»« TÃ³c, Quáº§n Ão Ä‘áº¿n Rá»“ng vÃ  VÅ© KhÃ­.</p>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        ${ChibiModule.presets.map(set => `
                            <div class="chibi-preset-card" onclick="ChibiModule.applyPreset('${set.id}')"
                                 style="background: rgba(255,255,255,0.03); border: 1.5px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 12px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 15px;">
                                <div style="width: 40px; height: 40px; background: rgba(139, 92, 246, 0.2); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                                    ${set.id.includes('cyber') ? 'ðŸ¤–' : set.id.includes('samurai') ? 'âš”ï¸' : set.id.includes('to-ong') ? 'ðŸ¯' : set.id.includes('reaper') ? 'ðŸ’€' : 'ðŸ˜‡'}
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
            Utils.showToast(`ðŸ”’ Trang bá»‹ "${req ? req.label : ''}" yÃªu cáº§u Cáº¥p ${req ? req.requiredLevel : '?'}! (Báº¡n Ä‘ang Cáº¥p ${userLevel}). CÃ y nhiá»‡m vá»¥ Ä‘á»ƒ lÃªn cáº¥p nÃ o!`, "info");
            return; // KhÃ´ng cho chá»n trang bá»‹ bá»‹ khÃ³a
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
     * Choose gender (nam/ná»¯)
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
        Utils.showToast("ÄÃ£ khÃ´i phá»¥c thiáº¿t káº¿ ban Ä‘áº§u!", "success");
    },

    /**
     * Generate cohesive beautiful random Chibi config (chá»‰ chá»n tá»« trang bá»‹ Ä‘Ã£ má»Ÿ khÃ³a)
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

        // Helper: lá»c chá»‰ láº¥y trang bá»‹ Ä‘Ã£ má»Ÿ khÃ³a cho 1 category
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
            gender: Math.random() > 0.5 ? 'nam' : 'ná»¯',
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
        Utils.showToast("ðŸŽ² BÃ¹m! Má»™t bÃ© Chibi siÃªu dá»… thÆ°Æ¡ng Ä‘Ã£ xuáº¥t hiá»‡n!", "success");
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

        // Kiá»ƒm tra táº¥t cáº£ trang bá»‹ Ä‘ang máº·c cÃ³ bá»‹ khÃ³a khÃ´ng
        const lockCategories = ['gear', 'mount', 'wing', 'dragon', 'accessory'];
        for (const cat of lockCategories) {
            const itemIndex = ChibiModule.currentConfig[cat];
            if (itemIndex && ChibiModule.isGearLocked(itemIndex, cat)) {
                const reqs = ChibiModule.gearRequirements[cat];
                const req = reqs ? reqs[itemIndex] : null;
                const userLevel = Auth.currentUser?.level || 1;
                Utils.showToast(`ðŸ”’ KhÃ´ng thá»ƒ lÆ°u! Trang bá»‹ "${req ? req.label : ''}" yÃªu cáº§u Cáº¥p ${req ? req.requiredLevel : '?'}! (Báº¡n Ä‘ang Cáº¥p ${userLevel})`, "error");
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
            
            Utils.showToast("ðŸŽ‰ Thiáº¿t káº¿ Chibi V5 Ä‘Ã£ Ä‘Æ°á»£c lÆ°u thÃ nh cÃ´ng!", "success");
            ChibiModule.closeBuilder();
            Auth.showApp();
        } catch (e) {
            console.error("Error saving chibi:", e);
            Utils.showToast("CÃ³ lá»—i xáº£y ra khi lÆ°u Chibi!", "error");
        }
    }
};
