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
        hair: 12, // Style 0 is bald, 1-11 are hair styles
        eyes: 8,
        mouth: 6,
        top: 10,  // Style 0 is naked, 1-9 are top styles
        bottom: 8, // Style 0 is underwear, 1-7 are bottoms
        accessory: 10 // Style 0 is none, 1-9 are accessory styles
    },

    // State
    currentConfig: null,
    activeTab: 'skin',

    /**
     * Render complete composite Chibi SVG
     */
    renderChibiSVG: function(config, isDancing, meritPoints) {
        const c = config || {
            skinColor: '#ffd1a9',
            hairStyle: 1,
            hairColor: '#343a40',
            eyeStyle: 0,
            mouthStyle: 0,
            topStyle: 1,
            topColor: '#e83e8c',
            bottomStyle: 1,
            bottomColor: '#007bff',
            accessory: 0
        };

        const isD = isDancing !== undefined ? isDancing : true;
        const pts = meritPoints !== undefined ? meritPoints : 0;

        const skinColor = c.skinColor || '#ffd1a9';
        const hairColor = c.hairColor || '#343a40';
        const topColor = c.topColor || '#e83e8c';
        const bottomColor = c.bottomColor || '#007bff';

        // 1. Back Hair Layer
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

        // 2. Base Skin / Body Layers
        const bodyBaseHtml = `
            <!-- Neck -->
            <rect x="96" y="104" width="8" height="12" fill="${skinColor}" stroke="#1e1b4b" stroke-width="2.5" />
            
            <!-- Legs -->
            <path d="M 86 145 Q 83 165 82 175 C 81 180 89 182 91 176 L 95 145 Z" fill="${skinColor}" stroke="#1e1b4b" stroke-width="2.5" />
            <path d="M 114 145 Q 117 165 118 175 C 119 180 111 182 109 176 L 105 145 Z" fill="${skinColor}" stroke="#1e1b4b" stroke-width="2.5" />
            
            <!-- Torso -->
            <path d="M 88 114 Q 100 112 112 114 L 115 145 Q 100 148 85 145 Z" fill="${skinColor}" stroke="#1e1b4b" stroke-width="2.5" />
            
            <!-- Arms -->
            <path class="${isD ? 'chibi-arm-left-dance' : ''}" d="M 85 116 Q 66 128 64 140 C 63 145 69 146 72 142 L 85 125 Z" fill="${skinColor}" stroke="#1e1b4b" stroke-width="2.5" />
            <path class="${isD ? 'chibi-arm-right-dance' : ''}" d="M 115 116 Q 134 128 136 140 C 137 145 131 146 128 142 L 115 125 Z" fill="${skinColor}" stroke="#1e1b4b" stroke-width="2.5" />
            
            <!-- Head / Face base -->
            <circle cx="62" cy="80" r="7" fill="${skinColor}" stroke="#1e1b4b" stroke-width="2.5" />
            <circle cx="138" cy="80" r="7" fill="${skinColor}" stroke="#1e1b4b" stroke-width="2.5" />
            <ellipse cx="100" cy="80" rx="36" ry="32" fill="${skinColor}" stroke="#1e1b4b" stroke-width="2.5" />
            
            <!-- Blushing Cheeks -->
            <ellipse cx="76" cy="86" rx="4" ry="2" fill="#f43f5e" opacity="0.45" />
            <ellipse cx="124" cy="86" rx="4" ry="2" fill="#f43f5e" opacity="0.45" />
        `;

        // 3. Clothing Bottom
        let bottomHtml = '';
        if (c.bottomStyle === 1) { // Jeans
            bottomHtml = `<path d="M 84 138 L 116 138 L 118 160 L 102 160 L 100 146 L 98 160 L 82 160 Z" fill="${bottomColor}" stroke="#1e1b4b" stroke-width="2.5" />`;
        } else if (c.bottomStyle === 2) { // Skirt
            bottomHtml = `
                <path d="M 85 138 L 115 138 L 122 154 Q 100 158 78 154 Z" fill="${bottomColor}" stroke="#1e1b4b" stroke-width="2.5" />
                <line x1="92" y1="138" x2="88" y2="154" stroke="rgba(0,0,0,0.25)" stroke-width="1.5" />
                <line x1="100" y1="138" x2="100" y2="156" stroke="rgba(0,0,0,0.25)" stroke-width="1.5" />
                <line x1="108" y1="138" x2="112" y2="154" stroke="rgba(0,0,0,0.25)" stroke-width="1.5" />
            `;
        } else if (c.bottomStyle === 3) { // Shorts
            bottomHtml = `<path d="M 84 138 L 116 138 L 117 150 L 102 150 L 100 144 L 98 150 L 83 150 Z" fill="${bottomColor}" stroke="#1e1b4b" stroke-width="2.5" />`;
        } else if (c.bottomStyle === 4) { // Joggers
            bottomHtml = `
                <path d="M 84 138 L 116 138 L 118 165 L 108 165 L 106 161 L 102 161 L 100 145 L 98 161 L 94 161 L 92 165 L 82 165 Z" fill="${bottomColor}" stroke="#1e1b4b" stroke-width="2.5" />
                <rect x="83" y="161" width="9" height="4" fill="rgba(0,0,0,0.18)" />
                <rect x="108" y="161" width="9" height="4" fill="rgba(0,0,0,0.18)" />
            `;
        } else if (c.bottomStyle === 5) { // Overalls
            bottomHtml = `
                <path d="M 84 138 L 116 138 L 118 160 L 102 160 L 100 146 L 98 160 L 82 160 Z" fill="${bottomColor}" stroke="#1e1b4b" stroke-width="2.5" />
                <path d="M 87 138 L 87 114 M 113 138 L 113 114" stroke="${bottomColor}" stroke-width="3" stroke-linecap="round" />
                <rect x="88" y="128" width="24" height="10" fill="${bottomColor}" stroke="#1e1b4b" stroke-width="2" />
            `;
        } else if (c.bottomStyle === 6) { // Cyber tights
            bottomHtml = `
                <path d="M 84 138 L 116 138 L 118 160 L 102 160 L 100 146 L 98 160 L 82 160 Z" fill="${bottomColor}" stroke="#1e1b4b" stroke-width="2.5" />
                <line x1="83" y1="145" x2="97" y2="145" stroke="#00f3ff" stroke-width="2" />
                <line x1="103" y1="145" x2="117" y2="145" stroke="#00f3ff" stroke-width="2" />
            `;
        } else if (c.bottomStyle === 7) { // Ripped Jeans
            bottomHtml = `
                <path d="M 84 138 L 116 138 L 118 160 L 102 160 L 100 146 L 98 160 L 82 160 Z" fill="${bottomColor}" stroke="#1e1b4b" stroke-width="2.5" />
                <rect x="86" y="145" width="8" height="3" fill="${skinColor}" />
                <rect x="106" y="150" width="8" height="3" fill="${skinColor}" />
            `;
        }

        // 4. Clothing Top
        let topHtml = '';
        if (c.topStyle === 1) { // T-Shirt
            topHtml = `
                <path d="M 88 114 Q 100 112 112 114 L 115 138 Q 100 140 85 138 Z" fill="${topColor}" stroke="#1e1b4b" stroke-width="2.5" />
                <path d="M 88 114 L 75 124 L 70 131 L 80 125 Z" fill="${topColor}" stroke="#1e1b4b" stroke-width="2.5" />
                <path d="M 112 114 L 125 124 L 130 131 L 120 125 Z" fill="${topColor}" stroke="#1e1b4b" stroke-width="2.5" />
                <path d="M 94 114 Q 100 120 106 114 Z" fill="${skinColor}" stroke="#1e1b4b" stroke-width="2" />
            `;
        } else if (c.topStyle === 2) { // Hoodie
            topHtml = `
                <path d="M 80 114 C 80 102 120 102 120 114 Z" fill="${topColor}" stroke="#1e1b4b" stroke-width="2.5" />
                <path d="M 85 114 Q 100 112 115 114 L 116 142 Q 100 145 84 142 Z" fill="${topColor}" stroke="#1e1b4b" stroke-width="2.5" />
                <path class="${isD ? 'chibi-arm-left-dance' : ''}" d="M 85 116 Q 66 128 64 138 C 63 141 68 141 70 139 L 84 123 Z" fill="${topColor}" stroke="#1e1b4b" stroke-width="2.5" />
                <path class="${isD ? 'chibi-arm-right-dance' : ''}" d="M 115 116 Q 134 128 136 138 C 137 141 132 141 130 139 L 116 123 Z" fill="${topColor}" stroke="#1e1b4b" stroke-width="2.5" />
                <path d="M 90 130 L 110 130 L 108 140 L 92 140 Z" fill="rgba(0,0,0,0.18)" stroke="#1e1b4b" stroke-width="1.8" />
            `;
        } else if (c.topStyle === 3) { // Striped Sweater
            topHtml = `
                <path d="M 88 114 Q 100 112 112 114 L 115 138 Q 100 140 85 138 Z" fill="${topColor}" stroke="#1e1b4b" stroke-width="2.5" />
                <path d="M 88 114 L 73 126 L 68 134 L 80 125 Z" fill="${topColor}" stroke="#1e1b4b" stroke-width="2.5" />
                <path d="M 112 114 L 127 126 L 132 134 L 120 125 Z" fill="${topColor}" stroke="#1e1b4b" stroke-width="2.5" />
                <path d="M 94 114 Q 100 120 106 114 Z" fill="${skinColor}" stroke="#1e1b4b" stroke-width="2" />
                <line x1="86" y1="122" x2="114" y2="122" stroke="#fff" stroke-width="3.5" />
                <line x1="85" y1="132" x2="115" y2="132" stroke="#fff" stroke-width="3.5" />
            `;
        } else if (c.topStyle === 4) { // Suit & Tie
            topHtml = `
                <path d="M 88 114 L 112 114 L 112 138 L 88 138 Z" fill="#ffffff" stroke="#1e1b4b" stroke-width="2.5" />
                <path d="M 88 114 L 97 122 L 95 138 L 85 138 Z" fill="${topColor}" stroke="#1e1b4b" stroke-width="2.5" />
                <path d="M 112 114 L 103 122 L 105 138 L 115 138 Z" fill="${topColor}" stroke="#1e1b4b" stroke-width="2.5" />
                <path d="M 98 120 L 102 120 L 103 132 L 100 136 L 97 132 Z" fill="#ef4444" />
            `;
        } else if (c.topStyle === 5) { // Crop Top
            topHtml = `
                <path d="M 88 114 Q 100 112 112 114 L 114 126 Q 100 128 86 126 Z" fill="${topColor}" stroke="#1e1b4b" stroke-width="2.5" />
                <path d="M 88 114 L 75 124 L 70 131 L 80 125 Z" fill="${topColor}" stroke="#1e1b4b" stroke-width="2.5" />
                <path d="M 112 114 L 125 124 L 130 131 L 120 125 Z" fill="${topColor}" stroke="#1e1b4b" stroke-width="2.5" />
                <path d="M 94 114 Q 100 120 106 114 Z" fill="${skinColor}" stroke="#1e1b4b" stroke-width="2" />
            `;
        } else if (c.topStyle === 6) { // Bomber Jacket
            topHtml = `
                <path d="M 88 114 L 112 114 L 115 138 L 85 138 Z" fill="#24292e" />
                <path d="M 88 114 L 96 120 L 93 138 L 84 138 Z" fill="${topColor}" stroke="#1e1b4b" stroke-width="2.5" />
                <path d="M 112 114 L 104 120 L 107 138 L 116 138 Z" fill="${topColor}" stroke="#1e1b4b" stroke-width="2.5" />
                <path class="${isD ? 'chibi-arm-left-dance' : ''}" d="M 85 116 Q 66 128 64 138 C 63 141 68 141 70 139 L 84 123 Z" fill="${topColor}" stroke="#1e1b4b" stroke-width="2.5" />
                <path class="${isD ? 'chibi-arm-right-dance' : ''}" d="M 115 116 Q 134 128 136 138 C 137 141 132 141 130 139 L 116 123 Z" fill="${topColor}" stroke="#1e1b4b" stroke-width="2.5" />
            `;
        } else if (c.topStyle === 7) { // Off-shoulder Sweater
            topHtml = `
                <path d="M 80 118 Q 100 112 116 113 L 116 142 Q 100 145 84 142 Z" fill="${topColor}" stroke="#1e1b4b" stroke-width="2.5" />
                <path class="${isD ? 'chibi-arm-left-dance' : ''}" d="M 85 116 Q 66 128 64 138 C 63 141 68 141 70 139 L 84 123 Z" fill="${topColor}" stroke="#1e1b4b" stroke-width="2.5" />
                <path class="${isD ? 'chibi-arm-right-dance' : ''}" d="M 115 116 Q 134 128 136 138 C 137 141 132 141 130 139 L 116 123 Z" fill="${topColor}" stroke="#1e1b4b" stroke-width="2.5" />
            `;
        } else if (c.topStyle === 8) { // Vest
            topHtml = `
                <path d="M 88 114 Q 100 112 112 114 L 115 138 Q 100 142 85 138 Z" fill="${topColor}" stroke="#1e1b4b" stroke-width="2.5" />
                <path d="M 97 114 L 100 124 L 103 114 Z" fill="${skinColor}" stroke="#1e1b4b" stroke-width="1.5" />
                <circle cx="100" cy="126" r="1.5" fill="#fff" />
                <circle cx="100" cy="132" r="1.5" fill="#fff" />
            `;
        } else if (c.topStyle === 9) { // Sci-Fi Armor
            topHtml = `
                <path d="M 88 114 Q 100 112 112 114 L 115 140 Q 100 142 85 140 Z" fill="${topColor}" stroke="#1e1b4b" stroke-width="2.5" />
                <circle cx="100" cy="126" r="4.5" fill="#00f3ff" stroke="#fff" stroke-width="1" style="filter: drop-shadow(0 0 4px #00f3ff);" />
                <path d="M 88 114 L 75 124 L 70 131 L 80 125 Z" fill="${topColor}" stroke="#1e1b4b" stroke-width="2.5" />
                <path d="M 112 114 L 125 124 L 130 131 L 120 125 Z" fill="${topColor}" stroke="#1e1b4b" stroke-width="2.5" />
            `;
        }

        // 5. Eye Expressions
        let eyesHtml = '';
        if (c.eyeStyle === 0) { // Normal Cute
            eyesHtml = `
                <circle cx="84" cy="80" r="6" fill="#1e1b4b" />
                <circle cx="82" cy="78" r="2" fill="#fff" />
                <circle cx="85" cy="82" r="0.8" fill="#fff" />
                
                <circle cx="116" cy="80" r="6" fill="#1e1b4b" />
                <circle cx="114" cy="78" r="2" fill="#fff" />
                <circle cx="117" cy="82" r="0.8" fill="#fff" />
            `;
        } else if (c.eyeStyle === 1) { // Star Eyes
            eyesHtml = `
                <circle cx="84" cy="80" r="6" fill="#1e1b4b" />
                <path d="M 84 75 L 85.5 78.5 L 89 79 L 86 81.5 L 87 85 L 84 83 L 81 85 L 82 81.5 L 79 79 L 82.5 78.5 Z" fill="#ffd700" />
                
                <circle cx="116" cy="80" r="6" fill="#1e1b4b" />
                <path d="M 116 75 L 117.5 78.5 L 121 79 L 118 81.5 L 119 85 L 116 83 L 113 85 L 114 81.5 L 111 79 L 114.5 78.5 Z" fill="#ffd700" />
            `;
        } else if (c.eyeStyle === 2) { // Wink
            eyesHtml = `
                <circle cx="84" cy="80" r="6" fill="#1e1b4b" />
                <circle cx="82" cy="78" r="2" fill="#fff" />
                <path d="M 110 82 Q 116 74 122 82" stroke="#1e1b4b" stroke-width="3.5" fill="none" stroke-linecap="round" />
            `;
        } else if (c.eyeStyle === 3) { // Sleepy/Cool
            eyesHtml = `
                <path d="M 77 78 L 91 78 M 78 80 L 90 84" stroke="#1e1b4b" stroke-width="3" stroke-linecap="round" fill="none" />
                <circle cx="84" cy="83" r="3.5" fill="#1e1b4b" />
                
                <path d="M 109 78 L 123 78 M 110 80 L 122 84" stroke="#1e1b4b" stroke-width="3" stroke-linecap="round" fill="none" />
                <circle cx="116" cy="83" r="3.5" fill="#1e1b4b" />
            `;
        } else if (c.eyeStyle === 4) { // Cat Eyes
            eyesHtml = `
                <ellipse cx="84" cy="80" rx="5" ry="6" fill="#10b981" stroke="#1e1b4b" stroke-width="1.5" />
                <ellipse cx="84" cy="80" rx="1.5" ry="4" fill="#1e1b4b" />
                <circle cx="82" cy="77" r="1.5" fill="#fff" />
                
                <ellipse cx="116" cy="80" rx="5" ry="6" fill="#10b981" stroke="#1e1b4b" stroke-width="1.5" />
                <ellipse cx="116" cy="80" rx="1.5" ry="4" fill="#1e1b4b" />
                <circle cx="114" cy="77" r="1.5" fill="#fff" />
            `;
        } else if (c.eyeStyle === 5) { // Heart Eyes
            eyesHtml = `
                <path d="M 84 84 C 84 84 76 77 78 74 C 80 72 84 75 84 75 C 84 75 88 72 90 74 C 92 77 84 84 84 84 Z" fill="#ec4899" stroke="#1e1b4b" stroke-width="1.5" />
                <path d="M 116 84 C 116 84 108 77 110 74 C 112 72 116 75 116 75 C 116 75 120 72 122 74 C 124 77 116 84 116 84 Z" fill="#ec4899" stroke="#1e1b4b" stroke-width="1.5" />
            `;
        } else if (c.eyeStyle === 6) { // Happy ^^
            eyesHtml = `
                <path d="M 77 82 Q 84 74 91 82" stroke="#1e1b4b" stroke-width="3.5" fill="none" stroke-linecap="round" />
                <path d="M 109 82 Q 116 74 123 82" stroke="#1e1b4b" stroke-width="3.5" fill="none" stroke-linecap="round" />
            `;
        } else if (c.eyeStyle === 7) { // Visor glasses
            eyesHtml = `
                <path d="M 70 74 L 130 74 L 126 88 L 74 88 Z" fill="rgba(239, 68, 68, 0.4)" stroke="#ef4444" stroke-width="2.5" />
                <rect x="78" y="79" width="44" height="2" fill="#fff" opacity="0.85" />
            `;
        }

        // 6. Mouth Expressions
        let mouthHtml = '';
        if (c.mouthStyle === 0) { // Smile
            mouthHtml = `<path d="M 96 93 Q 100 98 104 93" stroke="#1e1b4b" stroke-width="2.5" fill="none" stroke-linecap="round" />`;
        } else if (c.mouthStyle === 1) { // Open Smile :D
            mouthHtml = `<path d="M 95 92 Q 100 92 105 92 Q 105 102 100 102 Q 95 102 95 92 Z" fill="#ef4444" stroke="#1e1b4b" stroke-width="2" /><path d="M 97 93 Q 100 96 103 93" fill="#fff" />`;
        } else if (c.mouthStyle === 2) { // Cat Mouth :3
            mouthHtml = `<path d="M 94 94 Q 97 97 100 94 Q 103 97 106 94" stroke="#1e1b4b" stroke-width="2.5" fill="none" stroke-linecap="round" />`;
        } else if (c.mouthStyle === 3) { // Shocked :o
            mouthHtml = `<circle cx="100" cy="95" r="4.5" fill="#ef4444" stroke="#1e1b4b" stroke-width="2" />`;
        } else if (c.mouthStyle === 4) { // Tongue Out
            mouthHtml = `
                <path d="M 95 92 Q 100 98 105 92" stroke="#1e1b4b" stroke-width="2.5" fill="none" stroke-linecap="round" />
                <path d="M 98 94 Q 100 101 102 94 Z" fill="#ec4899" />
            `;
        } else if (c.mouthStyle === 5) { // Straight / Shy
            mouthHtml = `<line x1="95" y1="94" x2="105" y2="94" stroke="#1e1b4b" stroke-width="2.5" stroke-linecap="round" />`;
        }

        // 7. Front Hair (Bangs & Crests)
        let frontHairHtml = '';
        if (c.hairStyle === 1) { // Short Spiky
            frontHairHtml = `
                <path d="M 64 80 Q 75 60 85 64 Q 95 56 100 68 Q 110 56 120 64 Q 130 60 136 80 Q 125 78 120 74 Q 110 78 100 72 Q 90 78 80 74 Q 75 78 64 80 Z" fill="${hairColor}" stroke="#1e1b4b" stroke-width="2.5" />
                <path d="M 64 80 C 50 60 70 45 80 40 C 85 32 95 38 100 35 C 105 38 115 32 120 40 C 130 45 150 60 136 80 C 134 76 130 74 125 74 Z" fill="${hairColor}" stroke="#1e1b4b" stroke-width="2.5" />
            `;
        } else if (c.hairStyle === 2) { // Bob cut bangs
            frontHairHtml = `<path d="M 60 75 Q 100 48 140 75 C 138 78 135 80 130 80 Q 115 82 100 78 Q 85 82 70 80 C 65 80 62 78 60 75 Z" fill="${hairColor}" stroke="#1e1b4b" stroke-width="2.5" />`;
        } else if (c.hairStyle === 3) { // Ponytail bangs
            frontHairHtml = `<path d="M 62 76 Q 100 45 138 76 Q 138 82 125 80 Q 100 74 75 80 Q 62 82 62 76 Z" fill="${hairColor}" stroke="#1e1b4b" stroke-width="2.5" />`;
        } else if (c.hairStyle === 4) { // Curly/Afro
            frontHairHtml = `<path d="M 60 75 C 45 60 45 40 60 30 C 75 20 95 20 100 30 C 105 20 125 20 140 30 C 155 40 155 60 140 75 C 145 85 135 95 125 90 C 100 95 75 90 60 75 Z" fill="${hairColor}" stroke="#1e1b4b" stroke-width="2.5" />`;
        } else if (c.hairStyle === 5) { // Long Wavy bangs
            frontHairHtml = `<path d="M 60 75 Q 100 45 140 75 C 135 85 125 82 115 88 C 105 82 95 82 85 88 C 75 82 65 85 60 75 Z" fill="${hairColor}" stroke="#1e1b4b" stroke-width="2.5" />`;
        } else if (c.hairStyle === 6) { // Mohawk
            frontHairHtml = `
                <path d="M 90 50 Q 80 20 100 10 Q 120 20 110 50 L 105 60 L 95 60 Z" fill="${hairColor}" stroke="#1e1b4b" stroke-width="2.5" />
                <path d="M 62 76 Q 100 65 138 76" stroke="#1e1b4b" stroke-width="2" fill="none" stroke-dasharray="3,3" />
            `;
        } else if (c.hairStyle === 7) { // Twin Tails bangs
            frontHairHtml = `<path d="M 62 76 Q 100 45 138 76 Q 138 82 125 80 Q 100 74 75 80 Q 62 82 62 76 Z" fill="${hairColor}" stroke="#1e1b4b" stroke-width="2.5" />`;
        } else if (c.hairStyle === 8) { // Side part
            frontHairHtml = `<path d="M 61 74 C 55 50 85 40 100 45 C 115 40 145 50 139 74 C 130 72 120 68 105 66 Q 85 64 61 74 Z" fill="${hairColor}" stroke="#1e1b4b" stroke-width="2.5" />`;
        } else if (c.hairStyle === 9) { // Samurai knot base
            frontHairHtml = `
                <circle cx="100" cy="36" r="12" fill="${hairColor}" stroke="#1e1b4b" stroke-width="2.5" />
                <ellipse cx="100" cy="46" rx="6" ry="2" fill="#ef4444" />
                <path d="M 62 75 C 60 50 80 44 100 44 C 120 44 140 50 138 75 C 125 72 100 72 62 75 Z" fill="${hairColor}" stroke="#1e1b4b" stroke-width="2.5" />
            `;
        } else if (c.hairStyle === 10) { // Fluffy curtains
            frontHairHtml = `
                <path d="M 60 75 C 50 55 75 35 100 38 C 125 35 150 55 140 75 C 135 68 65 68 60 75 Z" fill="${hairColor}" stroke="#1e1b4b" stroke-width="2.5" />
                <path d="M 60 75 Q 100 42 140 75 C 135 88 120 85 110 88 C 100 80 100 80 90 88 C 80 85 65 88 60 75 Z" fill="${hairColor}" stroke="#1e1b4b" stroke-width="2.5" />
            `;
        } else if (c.hairStyle === 11) { // Cat Ear Hair
            frontHairHtml = `
                <path d="M 62 70 L 68 35 L 85 55 Z" fill="${hairColor}" stroke="#1e1b4b" stroke-width="2.5" />
                <path d="M 138 70 L 132 35 L 115 55 Z" fill="${hairColor}" stroke="#1e1b4b" stroke-width="2.5" />
                <path d="M 62 76 Q 100 45 138 76 Q 125 82 110 78 Q 100 84 90 78 Q 75 82 62 76 Z" fill="${hairColor}" stroke="#1e1b4b" stroke-width="2.5" />
            `;
        }

        // 8. Accessories Layer
        let accHtml = '';
        if (c.accessory === 1) { // Sunglasses
            accHtml = `<path d="M 72 76 Q 84 76 84 84 Q 84 90 72 90 Z M 116 76 Q 128 76 128 84 Q 128 90 116 90 Z" fill="#111" stroke="#fff" stroke-width="1.5" /><line x1="84" y1="80" x2="116" y2="80" stroke="#fff" stroke-width="2.5" />`;
        } else if (c.accessory === 2) { // Cat headband
            accHtml = `
                <path d="M 64 68 A 40 40 0 0 1 136 68" stroke="#24292e" stroke-width="3.5" fill="none" />
                <path d="M 66 62 L 56 38 L 80 50 Z" fill="#ec4899" stroke="#1e1b4b" stroke-width="2" />
                <path d="M 70 57 L 64 43 L 78 50 Z" fill="#ffb7b2" />
                <path d="M 134 62 L 144 38 L 120 50 Z" fill="#ec4899" stroke="#1e1b4b" stroke-width="2" />
                <path d="M 130 57 L 136 43 L 122 50 Z" fill="#ffb7b2" />
            `;
        } else if (c.accessory === 3) { // Gaming headphones
            accHtml = `
                <path d="M 64 74 A 38 38 0 0 1 136 74" stroke="#8b5cf6" stroke-width="4.5" fill="none" />
                <rect x="54" y="68" width="10" height="22" rx="5" fill="#8b5cf6" stroke="#1e1b4b" stroke-width="2" />
                <circle cx="59" cy="79" r="2.5" fill="#00f3ff" />
                <rect x="136" y="68" width="10" height="22" rx="5" fill="#8b5cf6" stroke="#1e1b4b" stroke-width="2" />
                <circle cx="141" cy="79" r="2.5" fill="#00f3ff" />
            `;
        } else if (c.accessory === 4) { // Angel Halo
            accHtml = `<ellipse cx="100" cy="30" rx="24" ry="6" fill="none" stroke="#f59e0b" stroke-width="3" style="filter: drop-shadow(0 0 6px #f59e0b);" />`;
        } else if (c.accessory === 5) { // Golden Crown
            accHtml = `
                <path d="M 78 52 L 82 35 L 91 44 L 100 32 L 109 44 L 118 35 L 122 52 Z" fill="#fbbf24" stroke="#1e1b4b" stroke-width="2" />
                <circle cx="82" cy="33" r="1.5" fill="#ef4444" />
                <circle cx="100" cy="30" r="1.5" fill="#3b82f6" />
                <circle cx="118" cy="33" r="1.5" fill="#ef4444" />
            `;
        } else if (c.accessory === 6) { // Face mask
            accHtml = `
                <path d="M 86 94 Q 100 88 114 94 L 110 108 Q 100 114 90 108 Z" fill="#24292e" stroke="#1e1b4b" stroke-width="2" />
                <line x1="90" y1="102" x2="110" y2="102" stroke="#475569" stroke-width="1.5" />
            `;
        } else if (c.accessory === 7) { // Chef Hat
            accHtml = `
                <path d="M 80 50 C 70 30 130 30 120 50 Z" fill="#fff" stroke="#1e1b4b" stroke-width="2" />
                <rect x="84" y="46" width="32" height="6" fill="#fff" stroke="#1e1b4b" stroke-width="2" />
            `;
        } else if (c.accessory === 8) { // Pirate Eye Patch
            accHtml = `
                <line x1="62" y1="74" x2="138" y2="84" stroke="#111" stroke-width="2" />
                <circle cx="84" cy="80" r="8.5" fill="#111" stroke="#1e1b4b" stroke-width="1.5" />
            `;
        } else if (c.accessory === 9) { // Ribbon Bow
            accHtml = `
                <path d="M 85 45 Q 100 52 115 45 Q 125 35 110 38 Q 100 50 90 38 Q 75 35 85 45 Z" fill="#ef4444" stroke="#1e1b4b" stroke-width="2" />
                <circle cx="100" cy="44" r="4.5" fill="#b91c1c" />
            `;
        }

        // 9. Sparkle / Aura effects for high merit points
        let sparklesHtml = '';
        if (pts > 20) {
            const auraColor = pts > 50 ? '#fbbf24' : '#60a5fa';
            sparklesHtml = `
                <g class="chibi-auras">
                    <circle cx="45" cy="50" r="3" fill="${auraColor}" style="animation: floatSparkle 2s infinite ease-in-out;" />
                    <circle cx="155" cy="60" r="2.5" fill="${auraColor}" style="animation: floatSparkle 1.8s infinite ease-in-out 0.4s;" />
                    <path d="M 100 16 L 101.5 20 L 105 21.5 L 101.5 23 L 100 27 L 98.5 23 L 95 21.5 L 98.5 20 Z" fill="#f59e0b" style="animation: floatSparkle 2.2s infinite ease-in-out 0.8s;" />
                    <path d="M 50 150 L 51 153 L 54 154 L 51 155 L 50 158 L 49 155 L 46 154 L 49 153 Z" fill="#f59e0b" style="animation: floatSparkle 2.5s infinite ease-in-out 0.2s;" />
                    <path d="M 150 140 L 151 143 L 154 144 L 151 145 L 150 148 L 149 145 L 146 144 L 149 143 Z" fill="#f59e0b" style="animation: floatSparkle 1.7s infinite ease-in-out 0.6s;" />
                </g>
                <style>
                    @keyframes floatSparkle {
                        0%, 100% { transform: translateY(0) scale(0.6); opacity: 0.3; }
                        50% { transform: translateY(-10px) scale(1.1); opacity: 1; }
                    }
                    .chibi-auras > * {
                        transform-origin: center;
                    }
                </style>
            `;
        }

        // Assemble Final Composite SVG
        return `
            <svg viewBox="0 0 200 200" width="100%" height="100%" class="${isD ? 'chibi-dance' : ''}" style="display: block;">
                <style>
                    .chibi-dance {
                        animation: chibiBounce 1.5s infinite ease-in-out;
                        transform-origin: bottom center;
                    }
                    @keyframes chibiBounce {
                        0%, 100% { transform: scale(1) translateY(0); }
                        50% { transform: scale(1.02, 0.98) translateY(-4px); }
                    }
                    .chibi-arm-left-dance {
                        animation: chibiArmLeftWave 1.5s infinite ease-in-out;
                        transform-origin: 85px 125px;
                    }
                    .chibi-arm-right-dance {
                        animation: chibiArmRightWave 1.5s infinite ease-in-out;
                        transform-origin: 115px 125px;
                    }
                    @keyframes chibiArmLeftWave {
                        0%, 100% { transform: rotate(0deg); }
                        50% { transform: rotate(12deg); }
                    }
                    @keyframes chibiArmRightWave {
                        0%, 100% { transform: rotate(0deg); }
                        50% { transform: rotate(-12deg); }
                    }
                    .chibi-tail-dance {
                        animation: chibiTailWag 1.5s infinite ease-in-out;
                        transform-origin: 100px 80px;
                    }
                    @keyframes chibiTailWag {
                        0%, 100% { transform: rotate(-6deg); }
                        50% { transform: rotate(6deg); }
                    }
                </style>
                ${sparklesHtml}
                ${backHairHtml}
                ${bodyBaseHtml}
                ${bottomHtml}
                ${topHtml}
                ${eyesHtml}
                ${mouthHtml}
                ${frontHairHtml}
                ${accHtml}
            </svg>
        `;
    },

    /**
     * Render a zoomed visual preview of a specific style item
     */
    renderMiniOption: function(type, index, color) {
        const tempConfig = {
            skinColor: '#ffd1a9',
            hairStyle: 0,
            hairColor: '#343a40',
            eyeStyle: 0,
            mouthStyle: 5,
            topStyle: 0,
            topColor: '#e83e8c',
            bottomStyle: 0,
            bottomColor: '#007bff',
            accessory: 0
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
        } else if (type === 'accessory') {
            tempConfig.accessory = index;
        }

        const svgStr = ChibiModule.renderChibiSVG(tempConfig, false, 0);

        // Adjust viewBox to crop/zoom into the relevant body region
        let viewBox = '0 0 200 200';
        if (type === 'hair') viewBox = '50 25 100 80';
        else if (type === 'eyes') viewBox = '65 72 70 20';
        else if (type === 'mouth') viewBox = '85 86 30 18';
        else if (type === 'top') viewBox = '62 105 76 40';
        else if (type === 'bottom') viewBox = '70 135 60 38';
        else if (type === 'accessory') viewBox = '50 25 100 70';

        return svgStr.replace(/<svg viewBox="0 0 200 200"/g, `<svg viewBox="${viewBox}"`);
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
        
        // Initialize config (clone existing or load default)
        ChibiModule.currentConfig = profile.chibiConfig ? { ...profile.chibiConfig } : {
            skinColor: '#ffcd94',
            hairStyle: 1,
            hairColor: '#111827',
            eyeStyle: 0,
            mouthStyle: 0,
            topStyle: 1,
            topColor: '#3b82f6',
            bottomStyle: 1,
            bottomColor: '#1f2937',
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
                    aspect-ratio: 1;
                    background: rgba(0,0,0,0.2);
                    border: 1.5px solid rgba(255,255,255,0.08);
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    overflow: hidden;
                    position: relative;
                }
                .chibi-item-card:hover {
                    background: rgba(255,255,255,0.08);
                    border-color: rgba(139,92,246,0.4);
                    transform: scale(1.04);
                }
                .chibi-item-card.active {
                    background: rgba(139,92,246,0.18);
                    border-color: #8b5cf6;
                    box-shadow: 0 0 15px rgba(139,92,246,0.4);
                }
                .chibi-item-label {
                    position: absolute;
                    bottom: 4px;
                    font-size: 8px;
                    color: #64748b;
                    font-weight: bold;
                    text-transform: uppercase;
                }
                .chibi-item-card.active .chibi-item-label {
                    color: #a78bfa;
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
     * Render Navigation Tabs in builder
     */
    renderTabs: function() {
        const tabs = [
            { id: 'skin', label: '🎨 Cơ Thể' },
            { id: 'hair', label: '💇 Tóc' },
            { id: 'face', label: '😊 Khuôn Mặt' },
            { id: 'clothing', label: '👕 Quần Áo' },
            { id: 'accessory', label: '👑 Phụ Kiện' }
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
            // SKIN COLOR PICKER
            contentHtml = `
                <div style="display: flex; flex-direction: column; gap: 16px;">
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
                                        <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; transform: scale(1.15);">
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
                                        <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; transform: scale(1.6);">
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
                                        <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; transform: scale(1.8);">
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
            // TOPS & BOTTOMS WITH INDEPENDENT STYLE + COLOR
            const topOptions = Array.from({ length: ChibiModule.counts.top }, (_, i) => i);
            const bottomOptions = Array.from({ length: ChibiModule.counts.bottom }, (_, i) => i);
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
                                        <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; transform: scale(1.3);">
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
                                        <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; transform: scale(1.35);">
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
                </div>
            `;
        } 
        else if (tabId === 'accessory') {
            // ACCESSORIES SELECTION (Style 0 is None)
            const options = Array.from({ length: ChibiModule.counts.accessory }, (_, i) => i);
            contentHtml = `
                <div>
                    <h4 style="margin: 0 0 10px 0; font-size: 13px; color: #94a3b8; text-transform: uppercase;">Phụ Kiện Đi Kèm</h4>
                    <div class="chibi-item-grid">
                        ${options.map(i => {
                            const activeClass = ChibiModule.currentConfig.accessory === i ? 'active' : '';
                            const miniSvg = ChibiModule.renderMiniOption('accessory', i);
                            return `
                                <div class="chibi-item-card ${activeClass}" onclick="ChibiModule.selectItem('accessory', ${i})">
                                    <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; transform: scale(1.15);">
                                        ${miniSvg}
                                    </div>
                                    <span class="chibi-item-label">${i === 0 ? 'Trống' : 'Phụ Kiện ' + i}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        panel.innerHTML = contentHtml;
    },

    /**
     * Choose an item style
     */
    selectItem: function(property, index) {
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
        
        ChibiModule.currentConfig = profile.chibiConfig ? { ...profile.chibiConfig } : {
            skinColor: '#ffcd94',
            hairStyle: 1,
            hairColor: '#111827',
            eyeStyle: 0,
            mouthStyle: 0,
            topStyle: 1,
            topColor: '#3b82f6',
            bottomStyle: 1,
            bottomColor: '#1f2937',
            accessory: 0
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

        ChibiModule.currentConfig = {
            skinColor: randomSkin,
            hairStyle: randStyle(ChibiModule.counts.hair - 1) + 1, // Avoid bald (style 0) in random
            hairColor: randomHair,
            eyeStyle: randStyle(ChibiModule.counts.eyes),
            mouthStyle: randStyle(ChibiModule.counts.mouth),
            topStyle: randStyle(ChibiModule.counts.top - 1) + 1, // Avoid naked (style 0) in random
            topColor: randomClothing1,
            bottomStyle: randStyle(ChibiModule.counts.bottom - 1) + 1, // Avoid underwear in random
            bottomColor: randomClothing2,
            accessory: randStyle(ChibiModule.counts.accessory) // Can be none (style 0)
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
