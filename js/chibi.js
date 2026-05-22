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
        shoe: 8,   // Style 0 is barefoot, 1-7 are shoe styles
        accessory: 19 // Style 0 is none, 1-18 are accessory styles
    },

    // State
    currentConfig: null,
    activeTab: 'skin',

    gearRequirements: {
        11: { label: "Đại Đao Lửa", count: 10 },
        12: { label: "Súng Vô Cực", count: 12 },
        13: { label: "Kiếm Cyber Laser", count: 15 },
        14: { label: "Cưỡi Ô Tô Siêu Cấp", count: 20 },
        15: { label: "Cưỡi Xe Máy Cực Ngầu", count: 18 },
        16: { label: "Đeo Phao Hồng Hạc", count: 8 },
        17: { label: "Cánh Thiên Thần VVIP", count: 22 },
        18: { label: "Cánh Ác Quỷ VVIP", count: 25 }
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
        if (index <= 10) return false;
        if (typeof Auth === 'undefined' || !Auth.currentUser) return true;
        if (Auth.currentUser.role === 'admin') return false;

        const req = ChibiModule.gearRequirements[index];
        if (!req) return false;

        const completed = ChibiModule.getCompletedTasksCount();
        return completed < req.count;
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
            accessory: 0
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

        // Dynamic camera zoom-out / viewBox
        let viewBox = "0 0 200 200";
        if (c.accessory >= 11 && c.accessory <= 18) {
            viewBox = "-45 -45 290 290";
        }

        // Rider transformation body wrappers
        let bodyWrapperStart = "";
        let bodyWrapperEnd = "";
        if (c.accessory === 14) {
            bodyWrapperStart = '<g class="rider-car-transform" transform="translate(0, 16)">';
            bodyWrapperEnd = '</g>';
        } else if (c.accessory === 15) {
            bodyWrapperStart = '<g class="rider-moto-transform" transform="translate(-12, 10) rotate(8, 100, 180)">';
            bodyWrapperEnd = '</g>';
        }

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

        // Custom Arms configuration for vehicles or normal dance pose
        let armsHtml = '';
        if (c.accessory === 14) {
            // Sports Car driver arms & hands in shifted space (gripping wheel)
            armsHtml = `
                <!-- Left Arm & Hand on Steering Wheel -->
                <path d="M 85 116 Q 74 125 91 116" fill="${skinColor}" stroke="#1e1b4b" stroke-width="2.5" />
                <circle cx="91" cy="116" r="4.8" fill="${skinColor}" stroke="#1e1b4b" stroke-width="1.2" />
                
                <!-- Right Arm & Hand on Steering Wheel -->
                <path d="M 115 116 Q 126 125 109 116" fill="${skinColor}" stroke="#1e1b4b" stroke-width="2.5" />
                <circle cx="109" cy="116" r="4.8" fill="${skinColor}" stroke="#1e1b4b" stroke-width="1.2" />
            `;
        } else if (c.accessory === 15) {
            // Cyber Motorcycle rider arms & hands in shifted space (gripping handlebars)
            armsHtml = `
                <!-- Left Arm & Hand on handlebar grip -->
                <path d="M 85 116 Q 100 108 115 112" fill="${skinColor}" stroke="#1e1b4b" stroke-width="2.5" />
                <circle cx="115" cy="112" r="4.8" fill="${skinColor}" stroke="#1e1b4b" stroke-width="1.2" />
                
                <!-- Right Arm & Hand on handlebar grip -->
                <path d="M 115 116 Q 128 112 135 110" fill="${skinColor}" stroke="#1e1b4b" stroke-width="2.5" />
                <circle cx="135" cy="110" r="4.8" fill="${skinColor}" stroke="#1e1b4b" stroke-width="1.2" />
            `;
        } else {
            // Default dancing arms
            armsHtml = `
                <path class="${isD ? 'chibi-arm-left-dance' : ''}" d="M 85 116 Q 66 128 64 140 C 63 145 69 146 72 142 L 85 125 Z" fill="${skinColor}" stroke="#1e1b4b" stroke-width="2.5" />
                <path class="${isD ? 'chibi-arm-right-dance' : ''}" d="M 115 116 Q 134 128 136 140 C 137 145 131 146 128 142 L 115 125 Z" fill="${skinColor}" stroke="#1e1b4b" stroke-width="2.5" />
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
            ${armsHtml}
            
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

        // 8. Eyelashes Layer (For Female)
        let eyelashesHtml = '';
        if (gender === 'nữ') {
            eyelashesHtml = `
                <!-- Adorable Eyelashes -->
                <path d="M 74 77 Q 80 72 86 76" stroke="#1e1b4b" stroke-width="2.2" fill="none" stroke-linecap="round" />
                <path d="M 72 78 L 68 75" stroke="#1e1b4b" stroke-width="1.8" stroke-linecap="round" />
                <path d="M 126 77 Q 120 72 114 76" stroke="#1e1b4b" stroke-width="2.2" fill="none" stroke-linecap="round" />
                <path d="M 128 78 L 132 75" stroke="#1e1b4b" stroke-width="1.8" stroke-linecap="round" />
            `;
        }

        // 9. Back Accessories Layer
        let backAccessoryHtml = '';
        if (c.accessory === 11) { // Đại Đao Lửa (Epic Guan Dao)
            backAccessoryHtml = `
                <!-- Huge Epic Flame Guan Dao behind back -->
                <g class="${isD ? 'chibi-tail-dance' : ''}" style="filter: drop-shadow(0 0 12px #ff4500) drop-shadow(0 0 25px #ff8c00);">
                    <g transform="rotate(-32 70 85)">
                        <!-- Pole/Shaft -->
                        <rect x="68" y="-10" width="6" height="180" rx="3" fill="#1e2937" stroke="#fbbf24" stroke-width="1.2" />
                        
                        <!-- Gold fittings & Dragon Guard -->
                        <path d="M 60 25 L 82 25 L 86 42 L 56 42 Z" fill="#fbbf24" stroke="#78350f" stroke-width="1.5" />
                        <circle cx="71" cy="33" r="3" fill="#ef4444" />
                        
                        <!-- Giant Flame Blade -->
                        <path d="M 46 25 C 32 -30 15 -70 35 -85 C 60 -55 58 5 71 25 Z" fill="url(#bladeFlame)" stroke="#991b1b" stroke-width="2.5" />
                        
                        <!-- Inner Glowing Edge -->
                        <path d="M 42 15 C 33 -25 22 -55 35 -75" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.9" />
                        
                        <!-- Tassel on the hilt -->
                        <g transform="translate(71, 170)">
                            <circle cx="0" cy="0" r="4.5" fill="#d97706" stroke="#111" stroke-width="1" />
                            <path d="M 0 0 C -5 10 -8 25 -5 32 C -2 35 4 35 5 32 C 8 25 5 10 0 0" fill="#ef4444" stroke="#991b1b" stroke-width="1" />
                            <path d="M -3 12 L -3 28 M 3 12 L 3 28" stroke="#fbbf24" stroke-width="0.8" />
                        </g>
                    </g>
                    <!-- Floating Sparks & Fire Aura Particles -->
                    <circle cx="35" cy="20" r="3.5" fill="#fbbf24" style="animation: floatSparkle 1.2s infinite ease-in-out;" />
                    <circle cx="50" cy="5" r="2.5" fill="#f97316" style="animation: floatSparkle 1.5s infinite 0.3s;" />
                    <circle cx="20" cy="-10" r="4" fill="#ef4444" style="animation: floatSparkle 1.8s infinite 0.6s;" />
                </g>
                <defs>
                    <linearGradient id="bladeFlame" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#ffffff" />
                        <stop offset="20%" stop-color="#fef08a" />
                        <stop offset="55%" stop-color="#f97316" />
                        <stop offset="85%" stop-color="#ef4444" />
                        <stop offset="100%" stop-color="#7f1d1d" />
                    </linearGradient>
                </defs>
            `;
        } else if (c.accessory === 13) { // Cyber Laser Greatsword (Scale up & Neon)
            backAccessoryHtml = `
                <!-- Huge Laser Cyber Blade -->
                <g class="${isD ? 'chibi-tail-dance' : ''}" style="filter: drop-shadow(0 0 12px #00f3ff) drop-shadow(0 0 25px #a855f7);">
                    <g transform="rotate(32 70 85)">
                        <!-- Blade outer energy glow -->
                        <rect x="61" y="-35" width="20" height="155" rx="8" fill="#00f3ff" opacity="0.4" />
                        <!-- Main Blade -->
                        <rect x="63" y="-32" width="16" height="150" rx="6" fill="#00f3ff" opacity="0.9" stroke="#fff" stroke-width="1.8" />
                        <!-- Core -->
                        <rect x="67" y="-28" width="8" height="142" rx="3" fill="#ffffff" />
                        
                        <!-- Futuristic Crossguard -->
                        <path d="M 50 118 L 92 118 L 86 128 L 56 128 Z" fill="#8b5cf6" stroke="#00f3ff" stroke-width="1.5" />
                        <rect x="66" y="119" width="10" height="8" fill="#00f3ff" style="animation: muzzleGlow 0.8s infinite alternate;" />
                        
                        <!-- Hilt / Handle -->
                        <rect x="67" y="128" width="8" height="42" rx="3" fill="#1e2937" stroke="#8b5cf6" stroke-width="1.5" />
                        <line x1="71" y1="134" x2="71" y2="164" stroke="#a855f7" stroke-width="1.5" stroke-dasharray="2,3" />
                        
                        <!-- Pommel glow -->
                        <circle cx="71" cy="172" r="3.5" fill="#00f3ff" />
                    </g>
                    <!-- Cyber Sparkles / Digitized Particles -->
                    <circle cx="45" cy="35" r="3.5" fill="#a855f7" style="animation: floatSparkle 1.2s infinite ease-in-out;" />
                    <circle cx="110" cy="5" r="2" fill="#00f3ff" style="animation: floatSparkle 1.5s infinite 0.3s;" />
                    <circle cx="30" cy="-15" r="2.8" fill="#ffffff" style="animation: floatSparkle 1.7s infinite 0.5s;" />
                </g>
            `;
        } else if (c.accessory === 17) { // Cánh Thiên Thần (Angel Wings)
            backAccessoryHtml = `
                <!-- VVIP Angel Wings behind back -->
                <g class="${isD ? 'chibi-tail-dance' : ''}" style="filter: drop-shadow(0 0 12px #fbbf24) drop-shadow(0 0 25px #f59e0b);">
                    <!-- Left Wing -->
                    <g>
                        <path d="M 100 110 C 60 70 30 50 15 75 C 5 95 20 120 45 125 C 25 125 15 135 25 150 C 35 160 55 155 75 145 C 55 150 45 162 55 172 C 65 180 85 165 100 145 Z" fill="url(#angelGold)" stroke="#d97706" stroke-width="2" />
                        <path d="M 100 110 C 70 85 50 70 35 90 C 25 105 35 125 55 130" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.8" />
                        <path d="M 100 110 C 80 100 65 95 55 110" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity="0.8" />
                    </g>
                    <!-- Right Wing (Flipped Horizontally across x=100) -->
                    <g transform="translate(100, 110) scale(-1, 1) translate(-100, -110)">
                        <path d="M 100 110 C 60 70 30 50 15 75 C 5 95 20 120 45 125 C 25 125 15 135 25 150 C 35 160 55 155 75 145 C 55 150 45 162 55 172 C 65 180 85 165 100 145 Z" fill="url(#angelGold)" stroke="#d97706" stroke-width="2" />
                        <path d="M 100 110 C 70 85 50 70 35 90 C 25 105 35 125 55 130" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.8" />
                        <path d="M 100 110 C 80 100 65 95 55 110" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity="0.8" />
                    </g>
                </g>
                <defs>
                    <linearGradient id="angelGold" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#ffffff" />
                        <stop offset="50%" stop-color="#fef08a" />
                        <stop offset="100%" stop-color="#fbbf24" />
                    </linearGradient>
                </defs>
            `;
        } else if (c.accessory === 18) { // Cánh Ác Quỷ (Devil Wings)
            backAccessoryHtml = `
                <!-- VVIP Devil Wings behind back -->
                <g class="${isD ? 'chibi-tail-dance' : ''}" style="filter: drop-shadow(0 0 12px #ef4444) drop-shadow(0 0 25px #7f1d1d);">
                    <!-- Left Wing (Bat style) -->
                    <g>
                        <!-- Main bone structure -->
                        <path d="M 100 110 C 80 80 50 60 20 70 C 15 72 10 78 12 84 L 18 100 L 22 120" fill="none" stroke="#1e1b4b" stroke-width="4.5" stroke-linecap="round" />
                        <!-- Wing web / skin panels -->
                        <path d="M 100 110 C 80 80 50 60 20 70 C 25 90 35 110 20 120 C 35 125 45 135 35 155 C 50 145 65 140 75 150 C 85 140 95 125 100 110 Z" fill="url(#devilDark)" stroke="#111827" stroke-width="2" />
                        <!-- Skeleton wing fingers -->
                        <path d="M 20 70 Q 35 100 35 155" fill="none" stroke="#1e1b4b" stroke-width="2.5" stroke-linecap="round" />
                        <path d="M 20 70 Q 55 105 75 150" fill="none" stroke="#1e1b4b" stroke-width="2.5" stroke-linecap="round" />
                    </g>
                    <!-- Right Wing (Flipped Horizontally across x=100) -->
                    <g transform="translate(100, 110) scale(-1, 1) translate(-100, -110)">
                        <!-- Main bone structure -->
                        <path d="M 100 110 C 80 80 50 60 20 70 C 15 72 10 78 12 84 L 18 100 L 22 120" fill="none" stroke="#1e1b4b" stroke-width="4.5" stroke-linecap="round" />
                        <!-- Wing web / skin panels -->
                        <path d="M 100 110 C 80 80 50 60 20 70 C 25 90 35 110 20 120 C 35 125 45 135 35 155 C 50 145 65 140 75 150 C 85 140 95 125 100 110 Z" fill="url(#devilDark)" stroke="#111827" stroke-width="2" />
                        <!-- Skeleton wing fingers -->
                        <path d="M 20 70 Q 35 100 35 155" fill="none" stroke="#1e1b4b" stroke-width="2.5" stroke-linecap="round" />
                        <path d="M 20 70 Q 55 105 75 150" fill="none" stroke="#1e1b4b" stroke-width="2.5" stroke-linecap="round" />
                    </g>
                </g>
                <defs>
                    <linearGradient id="devilDark" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#4c1d95" />
                        <stop offset="50%" stop-color="#ef4444" />
                        <stop offset="100%" stop-color="#000000" />
                    </linearGradient>
                </defs>
            `;
        }

        // 10. Tattoo Layer (Over Body skin, under clothes)
        let tattooHtml = '';
        if (c.accessory === 10) { // Xăm Kín Người
            tattooHtml = `
                <!-- Full Body Tattoo (Chest, Neck, Arms, Legs) -->
                <!-- Chest & Neck Tattoo -->
                <path d="M 96 106 Q 100 110 104 106 L 105 118 Q 100 125 95 118 Z" fill="#2d3748" opacity="0.8" />
                <path d="M 88 114 Q 100 118 112 114 L 110 128 Q 100 135 90 128 Z" fill="#1a202c" opacity="0.75" />
                <path d="M 94 116 C 90 120 92 135 100 132 C 108 135 110 120 106 116" stroke="#2d3748" stroke-width="1.8" fill="none" opacity="0.8" />
                
                <!-- Left Arm Tattoo sleeve -->
                <g class="${isD ? 'chibi-arm-left-dance' : ''}" opacity="0.8">
                    <path d="M 85 116 Q 66 128 64 140 C 63 145 69 146 72 142 L 85 125 Z" fill="#1a202c" />
                    <path d="M 83 118 L 68 138" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="2,2" />
                    <path d="M 80 122 Q 72 130 70 138" stroke="#1a202c" stroke-width="2.5" fill="none" />
                </g>
                
                <!-- Right Arm Tattoo sleeve -->
                <g class="${isD ? 'chibi-arm-right-dance' : ''}" opacity="0.8">
                    <path d="M 115 116 Q 134 128 136 140 C 137 145 131 146 128 142 L 115 125 Z" fill="#1a202c" />
                    <path d="M 117 118 L 132 138" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="2,2" />
                    <path d="M 120 122 Q 128 130 130 138" stroke="#1a202c" stroke-width="2.5" fill="none" />
                </g>
                
                <!-- Legs Tattoo sleeves -->
                <g opacity="0.8">
                    <!-- Left Leg -->
                    <path d="M 86 145 Q 83 165 82 175 L 89 175 L 94 145 Z" fill="#2d3748" />
                    <path d="M 84 150 Q 88 158 83 168" stroke="#1a202c" stroke-width="2" fill="none" />
                    <!-- Right Leg -->
                    <path d="M 114 145 Q 117 165 118 175 L 111 175 L 106 145 Z" fill="#2d3748" />
                    <path d="M 116 150 Q 112 158 117 168" stroke="#1a202c" stroke-width="2" fill="none" />
                </g>
            `;
        }

        // 11. Shoes Layer
        let shoeHtml = '';
        if (shoeStyle === 1) { // Active Sneakers (Giày thể thao năng động)
            shoeHtml = `
                <!-- Active Sneakers -->
                <!-- Left Shoe -->
                <path d="M 78 171 L 91 171 L 93 182 L 80 182 Z" fill="${shoeColor}" stroke="#1e1b4b" stroke-width="2" />
                <path d="M 80 182 L 85 182 L 84 179 L 79 179 Z" fill="#fff" />
                <rect x="79" y="180" width="14" height="2.5" fill="#ffffff" rx="0.5" />
                <line x1="84" y1="172" x2="88" y2="176" stroke="#ffffff" stroke-width="1.2" />
                <line x1="88" y1="172" x2="84" y2="176" stroke="#ffffff" stroke-width="1.2" />

                <!-- Right Shoe -->
                <path d="M 122 171 L 109 171 L 107 182 L 120 182 Z" fill="${shoeColor}" stroke="#1e1b4b" stroke-width="2" />
                <path d="M 120 182 L 115 182 L 116 179 L 121 179 Z" fill="#fff" />
                <rect x="107" y="180" width="14" height="2.5" fill="#ffffff" rx="0.5" />
                <line x1="116" y1="172" x2="112" y2="176" stroke="#ffffff" stroke-width="1.2" />
                <line x1="112" y1="172" x2="116" y2="176" stroke="#ffffff" stroke-width="1.2" />
            `;
        } else if (shoeStyle === 2) { // Cyber Neon Boots
            shoeHtml = `
                <!-- Cyber Neon Boots -->
                <!-- Left Boot -->
                <path d="M 76 166 L 92 166 L 93 182 L 78 182 Z" fill="${shoeColor}" stroke="#1e1b4b" stroke-width="2" />
                <path d="M 78 174 L 92 174" stroke="#00f3ff" stroke-width="2" style="filter: drop-shadow(0 0 3px #00f3ff);" />
                <rect x="77" y="180" width="16" height="2.5" fill="#00f3ff" rx="0.5" style="filter: drop-shadow(0 0 3px #00f3ff);" />
                
                <!-- Right Boot -->
                <path d="M 124 166 L 108 166 L 107 182 L 122 182 Z" fill="${shoeColor}" stroke="#1e1b4b" stroke-width="2" />
                <path d="M 122 174 L 108 174" stroke="#00f3ff" stroke-width="2" style="filter: drop-shadow(0 0 3px #00f3ff);" />
                <rect x="107" y="180" width="16" height="2.5" fill="#00f3ff" rx="0.5" style="filter: drop-shadow(0 0 3px #00f3ff);" />
            `;
        } else if (shoeStyle === 3) { // High Heels
            shoeHtml = `
                <!-- High Heels -->
                <!-- Left -->
                <path d="M 80 172 Q 86 174 91 176 L 87 183 L 81 181 Z" fill="${shoeColor}" stroke="#1e1b4b" stroke-width="1.8" />
                <line x1="81" y1="180" x2="81" y2="184" stroke="${shoeColor}" stroke-width="2.5" stroke-linecap="round" />
                <path d="M 82 171 Q 86 168 90 171" stroke="${shoeColor}" stroke-width="1.5" fill="none" />
                
                <!-- Right -->
                <path d="M 120 172 Q 114 174 109 176 L 113 183 L 119 181 Z" fill="${shoeColor}" stroke="#1e1b4b" stroke-width="1.8" />
                <line x1="119" y1="180" x2="119" y2="184" stroke="${shoeColor}" stroke-width="2.5" stroke-linecap="round" />
                <path d="M 118 171 Q 114 168 110 171" stroke="${shoeColor}" stroke-width="1.5" fill="none" />
            `;
        } else if (shoeStyle === 4) { // Combat Boots
            shoeHtml = `
                <!-- Combat Boots -->
                <!-- Left -->
                <path d="M 76 162 L 93 162 L 94 182 L 78 182 Z" fill="${shoeColor}" stroke="#1e1b4b" stroke-width="2" />
                <line x1="85" y1="165" x2="85" y2="178" stroke="#111" stroke-width="2" stroke-dasharray="2,2" />
                <rect x="77" y="180" width="17" height="3" fill="#111" />
                
                <!-- Right -->
                <path d="M 124 162 L 107 162 L 106 182 L 122 182 Z" fill="${shoeColor}" stroke="#1e1b4b" stroke-width="2" />
                <line x1="115" y1="165" x2="115" y2="178" stroke="#111" stroke-width="2" stroke-dasharray="2,2" />
                <rect x="106" y="180" width="17" height="3" fill="#111" />
            `;
        } else if (shoeStyle === 5) { // Panda Slippers
            shoeHtml = `
                <!-- Panda Slippers -->
                <!-- Left Slipper -->
                <ellipse cx="84" cy="178" rx="8" ry="5.5" fill="#ffffff" stroke="#1e1b4b" stroke-width="2" />
                <circle cx="79" cy="175" r="2.5" fill="#111" />
                <circle cx="89" cy="175" r="2.5" fill="#111" />
                <circle cx="82" cy="178" r="1.2" fill="#111" />
                <circle cx="86" cy="178" r="1.2" fill="#111" />
                <path d="M 83 181 Q 84 182 85 181" stroke="#111" stroke-width="1" fill="none" />
                
                <!-- Right Slipper -->
                <ellipse cx="116" cy="178" rx="8" ry="5.5" fill="#ffffff" stroke="#1e1b4b" stroke-width="2" />
                <circle cx="111" cy="175" r="2.5" fill="#111" />
                <circle cx="121" cy="175" r="2.5" fill="#111" />
                <circle cx="114" cy="178" r="1.2" fill="#111" />
                <circle cx="118" cy="178" r="1.2" fill="#111" />
                <path d="M 115 181 Q 116 182 117 181" stroke="#111" stroke-width="1" fill="none" />
            `;
        } else if (shoeStyle === 6) { // Retro Converse
            shoeHtml = `
                <!-- Retro Converse -->
                <!-- Left -->
                <path d="M 77 167 L 91 167 L 93 182 L 78 182 Z" fill="${shoeColor}" stroke="#1e1b4b" stroke-width="2" />
                <path d="M 86 182 L 93 182 L 93 175 Z" fill="#fff" stroke="#1e1b4b" stroke-width="1.5" />
                <circle cx="82" cy="172" r="2" fill="#fff" />
                <rect x="77" y="180" width="16" height="2.5" fill="#ffffff" rx="0.5" />
                
                <!-- Right -->
                <path d="M 123 167 L 109 167 L 107 182 L 122 182 Z" fill="${shoeColor}" stroke="#1e1b4b" stroke-width="2" />
                <path d="M 114 182 L 107 182 L 107 175 Z" fill="#fff" stroke="#1e1b4b" stroke-width="1.5" />
                <circle cx="118" cy="172" r="2" fill="#fff" />
                <rect x="107" y="180" width="16" height="2.5" fill="#ffffff" rx="0.5" />
            `;
        } else if (shoeStyle === 7) { // Rainbow Light-up Sneakers
            shoeHtml = `
                <!-- Rainbow Light-up Sneakers -->
                <!-- Left -->
                <path d="M 78 171 L 91 171 L 93 182 L 80 182 Z" fill="${shoeColor}" stroke="#1e1b4b" stroke-width="2" />
                <rect x="79" y="180" width="14" height="2.5" fill="url(#rainbowGlow)" rx="0.5" style="filter: drop-shadow(0 0 4px #a855f7);" />
                
                <!-- Right -->
                <path d="M 122 171 L 109 171 L 107 182 L 120 182 Z" fill="${shoeColor}" stroke="#1e1b4b" stroke-width="2" />
                <rect x="107" y="180" width="14" height="2.5" fill="url(#rainbowGlow)" rx="0.5" style="filter: drop-shadow(0 0 4px #a855f7);" />
                
                <defs>
                    <linearGradient id="rainbowGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stop-color="#ef4444" />
                        <stop offset="33%" stop-color="#3b82f6" />
                        <stop offset="66%" stop-color="#10b981" />
                        <stop offset="100%" stop-color="#eab308" />
                    </linearGradient>
                </defs>
            `;
        }

        // 12. Accessories Layer
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
                <circle cx="100" cy="45" r="4.5" fill="#fbbf24" stroke="#1e1b4b" stroke-width="2" />
            `;
        } else if (c.accessory === 12) { // Súng Vô Cực (Sci-Fi Rifle)
            accHtml = `
                <!-- Glowing Infinite Sci-Fi Rifle held in front -->
                <g class="${isD ? 'chibi-arm-right-dance' : ''}" style="filter: drop-shadow(0 0 10px #00f3ff) drop-shadow(0 0 18px #3b82f6);">
                    <!-- Gun Stock / Body -->
                    <rect x="52" y="116" width="88" height="18" rx="4" fill="#1e2937" stroke="#475569" stroke-width="1.8" />
                    <!-- Carbon fiber patterns -->
                    <line x1="60" y1="120" x2="130" y2="120" stroke="#0f172a" stroke-width="1.5" stroke-dasharray="3,3" />
                    <line x1="60" y1="128" x2="130" y2="128" stroke="#0f172a" stroke-width="1.5" stroke-dasharray="3,3" />
                    
                    <!-- Gun Barrel -->
                    <rect x="140" y="121" width="36" height="8" rx="2" fill="#334155" stroke="#111" stroke-width="1.2" />
                    <line x1="140" y1="125" x2="176" y2="125" stroke="#00f3ff" stroke-width="2" />
                    
                    <!-- Scope -->
                    <rect x="80" y="102" width="26" height="14" fill="#0f172a" stroke="#475569" stroke-width="1.5" rx="2" />
                    <circle cx="102" cy="109" r="2.5" fill="#ef4444" style="animation: muzzleGlow 0.5s infinite alternate;" />
                    <line x1="80" y1="109" x2="106" y2="109" stroke="#ef4444" stroke-width="1" opacity="0.7" />
                    
                    <!-- Laser Ammo Core -->
                    <rect x="84" y="120" width="40" height="10" rx="3" fill="#00f3ff" style="animation: muzzleGlow 0.7s infinite alternate;" />
                    <rect x="90" y="122" width="28" height="6" rx="1.5" fill="#fff" />
                    
                    <!-- Front Grip & Trigger -->
                    <rect x="70" y="134" width="8" height="14" rx="2" fill="#0f172a" stroke="#111" stroke-width="1.2" />
                    <rect x="115" y="134" width="8" height="12" rx="2" fill="#0f172a" stroke="#111" stroke-width="1.2" />
                    
                    <!-- Hands holding weapon -->
                    <circle cx="119" cy="136" r="5" fill="${skinColor}" stroke="#1e1b4b" stroke-width="1.5" />
                    <circle cx="74" cy="136" r="5" fill="${skinColor}" stroke="#1e1b4b" stroke-width="1.5" />
                    
                    <!-- Energy muzzle flash -->
                    <polygon points="176,118 196,125 176,132 182,125" fill="#00f3ff" opacity="0.9" style="animation: muzzleGlow 0.3s infinite alternate;" />
                    <circle cx="196" cy="125" r="2.5" fill="#fff" />
                </g>
                <style>
                    @keyframes muzzleGlow {
                        0% { opacity: 0.5; transform: scale(0.9); }
                        100% { opacity: 1; transform: scale(1.15); }
                    }
                </style>
            `;
        } else if (c.accessory === 14) { // Cưỡi Ô Tô Siêu Cấp (Sports Car Rider)
            accHtml = `
                <!-- Super Sports Car Rider covering legs -->
                <g style="filter: drop-shadow(0 6px 12px rgba(0,0,0,0.6));">
                    <!-- Wheels -->
                    <circle cx="46" cy="178" r="16" fill="#111" stroke="#ef4444" stroke-width="2.5" />
                    <circle cx="46" cy="178" r="7" fill="#cbd5e1" stroke="#334155" stroke-width="1" />
                    <circle cx="154" cy="178" r="16" fill="#111" stroke="#ef4444" stroke-width="2.5" />
                    <circle cx="154" cy="178" r="7" fill="#cbd5e1" stroke="#334155" stroke-width="1" />
                    
                    <!-- Car Body -->
                    <path d="M 20 176 C 20 156 35 140 60 138 L 140 138 C 165 140 180 156 180 176 C 180 188 170 192 140 192 L 60 192 C 30 192 20 188 20 176 Z" fill="url(#carRedBody)" stroke="#1e1b4b" stroke-width="2.5" />
                    
                    <!-- Front Grill & LED Strip -->
                    <rect x="70" y="174" width="60" height="8" rx="2" fill="#111" stroke="#475569" stroke-width="1" />
                    <line x1="74" y1="178" x2="126" y2="178" stroke="#00f3ff" stroke-width="2" style="filter: drop-shadow(0 0 3px #00f3ff);" />
                    
                    <!-- Windshield -->
                    <path d="M 58 138 L 72 120 L 128 120 L 142 138 Z" fill="rgba(6, 182, 212, 0.45)" stroke="#06b6d4" stroke-width="2.2" />
                    <line x1="76" y1="124" x2="124" y2="124" stroke="#fff" stroke-width="2.5" opacity="0.75" />
                    
                    <!-- Spoiler -->
                    <path d="M 22 146 L 6 132 L 10 148 Z" fill="#1e2937" stroke="#111" stroke-width="1.5" />
                    <!-- Decal sấm sét vàng -->
                    <path d="M 75 158 L 125 152 L 105 166 Z" fill="#fbbf24" stroke="#d97706" stroke-width="1.2" />
                    
                    <!-- Glowing Headlights & LED Beams -->
                    <polygon points="166,161 198,154 198,178 166,171" fill="url(#headlightBeam)" opacity="0.7" />
                    <ellipse cx="169" cy="166" rx="4.5" ry="7" fill="#ffffff" style="filter: drop-shadow(0 0 10px #ffffff);" />
                    <ellipse cx="31" cy="166" rx="3.5" ry="5.5" fill="#f59e0b" />
                    
                    <!-- Steering Wheel -->
                    <ellipse cx="100" cy="132" rx="14" ry="5" fill="none" stroke="#1f2937" stroke-width="3" />
                </g>
                <defs>
                    <linearGradient id="carRedBody" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="#ef4444" />
                        <stop offset="40%" stop-color="#dc2626" />
                        <stop offset="85%" stop-color="#991b1b" />
                        <stop offset="100%" stop-color="#450a0a" />
                    </linearGradient>
                    <linearGradient id="headlightBeam" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
                        <stop offset="30%" stop-color="#fef08a" stop-opacity="0.7" />
                        <stop offset="100%" stop-color="#fbbf24" stop-opacity="0" />
                    </linearGradient>
                </defs>
            `;
        } else if (c.accessory === 15) { // Cưỡi Xe Máy Cực Ngầu (Cyber Motorcycle)
            accHtml = `
                <!-- Cyberpunk Heavy Motorcycle -->
                <g style="filter: drop-shadow(0 6px 12px rgba(0,0,0,0.65));">
                    <!-- Neon wheels -->
                    <circle cx="42" cy="176" r="19" fill="#111" stroke="#00f3ff" stroke-width="4.5" style="filter: drop-shadow(0 0 6px #00f3ff);" />
                    <circle cx="42" cy="176" r="9" fill="#1e2937" stroke="#4b5563" stroke-width="1.5" />
                    <circle cx="158" cy="176" r="19" fill="#111" stroke="#00f3ff" stroke-width="4.5" style="filter: drop-shadow(0 0 6px #00f3ff);" />
                    <circle cx="158" cy="176" r="9" fill="#1e2937" stroke="#4b5563" stroke-width="1.5" />
                    
                    <!-- Heavy Metal Frame -->
                    <path d="M 42 176 L 82 142 L 118 142 L 158 176 Z" stroke="#334155" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none" />
                    <path d="M 42 176 L 82 142 L 118 142 L 158 176 Z" stroke="#00f3ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.75" />
                    
                    <!-- Exhaust Pipe with Flame Trail -->
                    <g transform="rotate(-12 34 176)">
                        <rect x="30" y="174" width="56" height="10" rx="3" fill="#475569" stroke="#111" stroke-width="1.5" />
                        <rect x="32" y="176" width="52" height="6" fill="#1e2937" />
                        <!-- Real Fire Exhaust Flame Effect -->
                        <polygon points="28,179 4,172 12,179 2,186" fill="#f97316" stroke="#ef4444" stroke-width="1" />
                        <polygon points="28,179 10,175 14,179 8,183" fill="#ffd700" />
                    </g>
                    
                    <!-- Moto Body -->
                    <path d="M 60 166 C 56 138 78 130 98 130 C 120 130 138 138 148 162 L 140 176 Z" fill="url(#motoBody)" stroke="#111" stroke-width="2.2" />
                    <!-- Cyber energy bar on body -->
                    <path d="M 78 146 Q 98 140 124 148" stroke="#a855f7" stroke-width="3" stroke-linecap="round" fill="none" style="filter: drop-shadow(0 0 4px #a855f7);" />
                    
                    <!-- Handlebars -->
                    <line x1="104" y1="134" x2="132" y2="114" stroke="#1e2937" stroke-width="6" stroke-linecap="round" />
                    <circle cx="132" cy="114" r="4.5" fill="#00f3ff" style="filter: drop-shadow(0 0 3px #00f3ff);" />
                    
                    <!-- Front visor & LED Headlight -->
                    <path d="M 126 122 L 148 132 L 142 144 L 122 134 Z" fill="#8b5cf6" stroke="#111" stroke-width="1.8" />
                    <polygon points="144,136 172,136 166,148 142,142" fill="url(#headlightBeam)" opacity="0.65" />
                    <ellipse cx="143" cy="139" rx="3" ry="5" fill="#00f3ff" style="filter: drop-shadow(0 0 6px #00f3ff);" />
                </g>
                <defs>
                    <linearGradient id="motoBody" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#8b5cf6" />
                        <stop offset="45%" stop-color="#3b0764" />
                        <stop offset="85%" stop-color="#1e1b4b" />
                        <stop offset="100%" stop-color="#090514" />
                    </linearGradient>
                </defs>
            `;
        } else if (c.accessory === 16) { // Đeo Phao Hồng Hạc (Pink Flamingo Float)
            accHtml = `
                <!-- Adorable Pink Flamingo Swim Float around waist -->
                <g style="filter: drop-shadow(0 5px 8px rgba(0,0,0,0.4));">
                    <!-- Float Ring -->
                    <ellipse cx="100" cy="148" rx="32" ry="15" fill="#f43f5e" stroke="#1e1b4b" stroke-width="2.5" />
                    <!-- Inner shading for 3D depth -->
                    <ellipse cx="100" cy="146" rx="20" ry="8" fill="#be123c" opacity="0.35" />
                    
                    <!-- Water ripples under float -->
                    <ellipse cx="100" cy="164" rx="42" ry="6" fill="none" stroke="#38bdf8" stroke-width="2" opacity="0.7" stroke-dasharray="10,5;5,10" style="animation: waterSpin 3s infinite linear;" />
                    
                    <!-- Flamingo Neck & Head -->
                    <path d="M 118 148 C 126 148 136 142 134 122 C 132 110 123 104 126 96 C 128 90 137 90 139 96 C 141 104 137 112 137 120" fill="#f43f5e" stroke="#1e1b4b" stroke-width="2.5" stroke-linecap="round" />
                    
                    <!-- Beak -->
                    <path d="M 139 94 C 143 94 148 99 146 103 C 142 104 139 100 139 94" fill="#111" />
                    <path d="M 139 95 C 141 95 143 98 142 99" fill="#ffffff" />
                    
                    <!-- Flamingo Eye with long eyelashes -->
                    <circle cx="132" cy="95" r="1.6" fill="#111" />
                    <circle cx="131" cy="94" r="0.6" fill="#fff" />
                    <path d="M 133 93 L 136 91" stroke="#111" stroke-width="0.8" />
                    
                    <!-- Cute Flamingo Wings on sides -->
                    <path d="M 72 144 C 64 144 60 152 68 155 C 72 153 74 148 72 144 Z" fill="#fda4af" stroke="#1e1b4b" stroke-width="1.8" />
                    <!-- Little Tail feather behind -->
                    <path d="M 68 140 Q 60 132 64 144 Z" fill="#f43f5e" stroke="#1e1b4b" stroke-width="1.8" />
                </g>
                <style>
                    @keyframes waterSpin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            `;
        }

        // 13. Sparkle / Aura effects for high merit points
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
            <svg viewBox="${viewBox}" width="100%" height="100%" class="${isD ? 'chibi-dance' : ''}" style="display: block;">
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
        } else if (type === 'shoe') {
            tempConfig.shoeStyle = index;
            tempConfig.shoeColor = color || '#1f2937';
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
        else if (type === 'shoe') viewBox = '70 160 60 25';
        else if (type === 'accessory') {
            if (index === 14 || index === 15 || index === 16) {
                // Ô tô, xe máy, phao: lấy vùng thân dưới rộng ra để vừa vặn
                viewBox = '15 100 170 100';
            } else if (index === 11 || index === 13) {
                // Đại đao, kiếm laser: cần toàn cảnh chéo cao
                viewBox = '20 15 160 175';
            } else if (index === 12) {
                // Súng vô cực: lấy vùng ngực tay cầm
                viewBox = '45 100 120 70';
            } else if (index === 17 || index === 18) {
                // Cánh thiên thần, ác quỷ: lấy vùng cánh rộng
                viewBox = '10 10 180 120';
            } else {
                viewBox = '50 25 100 70';
            }
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
     * Render Navigation Tabs in builder
     */
    renderTabs: function() {
        const tabs = [
            { id: 'skin', label: '🎨 Cơ Thể' },
            { id: 'hair', label: '💇 Tóc' },
            { id: 'face', label: '😊 Khuôn Mặt' },
            { id: 'clothing', label: '👕 Quần Áo' },
            { id: 'accessory', label: '👑 Phụ Kiện' },
            { id: 'gear', label: '🚀 Trang Bị VIP' }
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
            // ACCESSORIES SELECTION (Style 0 is None, 1-10 are standard accessories)
            const options = Array.from({ length: 11 }, (_, i) => i); // 0 to 10
            const accNames = [
                'Trống',
                'Kính râm',
                'Cài tóc mèo',
                'Tai nghe Gaming',
                'Vòng thiên sứ',
                'Vương miện',
                'Khẩu trang',
                'Mũ đầu bếp',
                'Bịt mắt cướp biển',
                'Nơ đỏ',
                'Xăm Kín Người'
            ];

            contentHtml = `
                <div>
                    <h4 style="margin: 0 0 10px 0; font-size: 13px; color: #94a3b8; text-transform: uppercase;">Phụ Kiện Thường</h4>
                    <div class="chibi-item-grid">
                        ${options.map(i => {
                            const activeClass = ChibiModule.currentConfig.accessory === i ? 'active' : '';
                            const miniSvg = ChibiModule.renderMiniOption('accessory', i);
                            return `
                                <div class="chibi-item-card ${activeClass}" onclick="ChibiModule.selectItem('accessory', ${i})">
                                    <div class="chibi-item-preview-wrap" style="transform: scale(1.15);">
                                        ${miniSvg}
                                    </div>
                                    <span class="chibi-item-label">${accNames[i]}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }
        else if (tabId === 'gear') {
            // VIP GEAR SELECTION (Style 0 is None, 11-18 are VIP gear)
            const options = [0, 11, 12, 13, 14, 15, 16, 17, 18];
            const accNames = {
                0: 'Trống',
                11: 'Đại Đao Lửa',
                12: 'Súng Vô Cực',
                13: 'Kiếm Cyber Laser',
                14: 'Cưỡi Ô Tô Siêu Cấp',
                15: 'Cưỡi Xe Máy Cực Ngầu',
                16: 'Đeo Phao Hồng Hạc',
                17: 'Cánh Thiên Thần VVIP',
                18: 'Cánh Ác Quỷ VVIP'
            };

            const completed = ChibiModule.getCompletedTasksCount();

            contentHtml = `
                <div>
                    <h4 style="margin: 0 0 6px 0; font-size: 13px; color: #fbbf24; text-transform: uppercase; display: flex; align-items: center; gap: 6px;">
                        <span>🚀 TRANG BỊ VIP HÀNG THÁNG</span>
                        <span style="font-size: 11px; color: #a78bfa; font-weight: normal; margin-left: auto;">Đã làm: ${completed} Task</span>
                    </h4>
                    <p style="margin: 0 0 16px 0; font-size: 11px; color: #64748b; line-height: 1.4;">
                        Hoàn thành số lượng công việc trong tháng hiện tại để mở khóa trang bị VIP cực phẩm. Tự động mở khóa cho Admin.
                    </p>
                    <div class="chibi-item-grid">
                        ${options.map(i => {
                            const activeClass = ChibiModule.currentConfig.accessory === i ? 'active' : '';
                            const miniSvg = ChibiModule.renderMiniOption('accessory', i);
                            
                            const isLocked = ChibiModule.isGearLocked(i);
                            const req = ChibiModule.gearRequirements[i];
                            const label = accNames[i];

                            return `
                                <div class="chibi-item-card ${activeClass} ${isLocked ? 'locked' : ''}" 
                                     style="position: relative; overflow: hidden; cursor: pointer;"
                                     onclick="ChibiModule.selectItem('accessory', ${i})">
                                    <div class="chibi-item-preview-wrap" style="transform: scale(1.15); ${isLocked ? 'filter: blur(1.5px) grayscale(0.5); opacity: 0.6;' : ''}">
                                        ${miniSvg}
                                    </div>
                                    <span class="chibi-item-label" style="${isLocked ? 'opacity: 0.7;' : ''}">${label}</span>
                                    ${isLocked ? `
                                        <!-- Lock overlay card -->
                                        <div class="chibi-item-lock-overlay" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15,23,42,0.65); backdrop-filter: blur(4px); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; padding: 4px;">
                                            <div style="font-size: 16px; text-shadow: 0 0 10px rgba(239,68,68,0.8);">🔒</div>
                                            <div style="font-size: 9px; font-weight: 800; color: #f87171; text-transform: uppercase; letter-spacing: 0.3px; text-align: center; line-height: 1.1;">
                                                Đạt ${req.count} Task
                                            </div>
                                            <div style="font-size: 8px; color: #94a3b8; font-weight: 600; text-align: center;">
                                                (${completed}/${req.count})
                                            </div>
                                        </div>
                                    ` : ''}
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
        if (property === 'accessory' && ChibiModule.isGearLocked(index)) {
            const req = ChibiModule.gearRequirements[index];
            const completed = ChibiModule.getCompletedTasksCount();
            Utils.showToast(`🔒 Bạn cần hoàn thành ít nhất ${req.count} công việc trong tháng này để mở khóa "${req.label}"! (Hiện tại: ${completed}/${req.count})`, "error");
            return;
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
            hairStyle: randStyle(ChibiModule.counts.hair - 1) + 1, // Avoid bald (style 0) in random
            hairColor: randomHair,
            eyeStyle: randStyle(ChibiModule.counts.eyes),
            mouthStyle: randStyle(ChibiModule.counts.mouth),
            topStyle: randStyle(ChibiModule.counts.top - 1) + 1, // Avoid naked (style 0) in random
            topColor: randomClothing1,
            bottomStyle: randStyle(ChibiModule.counts.bottom - 1) + 1, // Avoid underwear in random
            bottomColor: randomClothing2,
            shoeStyle: randStyle(ChibiModule.counts.shoe - 1) + 1, // Avoid barefoot in random
            shoeColor: randomClothing3,
            accessory: randomAccessory
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
