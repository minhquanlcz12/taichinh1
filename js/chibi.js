/**
 * Pet Chibi Avatar Builder Module
 * V12 full-body SVG renderer - no PNG sticker layers
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


    // V12 full-body SVG renderer. This keeps every selectable part on one shared
    // viewBox, so hair/eyes/clothes never render as separate white PNG stickers.
    renderChibiV12: function(config, isDancing = false) {
        const c = config || this.currentConfig || {};
        const skin = c.skinColor || '#ffcd94';
        const hairColor = c.hairColor || '#111827';
        const topColor = c.topColor || '#3b82f6';
        const bottomColor = c.bottomColor || '#1f2937';
        const shoeColor = c.shoeColor || '#111827';
        const hairStyle = Number(c.hairStyle || 1);
        const eyeStyle = Number(c.eyeStyle || 0);
        const mouthStyle = Number(c.mouthStyle || 0);
        const topStyle = Number(c.topStyle || 1);
        const bottomStyle = Number(c.bottomStyle || 1);
        const shoeStyle = Number(c.shoeStyle || 1);
        const uid = 'cbv12' + Math.random().toString(36).slice(2, 8);
        const skinDark = this.adjustColor(skin, -22);
        const skinLight = this.adjustColor(skin, 18);
        const hairDark = this.adjustColor(hairColor, -48);
        const hairLight = this.adjustColor(hairColor, 42);
        const topDark = this.adjustColor(topColor, -34);
        const topLight = this.adjustColor(topColor, 28);
        const bottomDark = this.adjustColor(bottomColor, -28);
        const shoeLight = this.adjustColor(shoeColor, 28);
        const eyeColor = c.eyeColor || hairColor;
        const hairBack = {
            0: '',
            1: '<path d="M48 68 C46 24 67 9 100 8 C134 9 154 25 152 69 L156 98 C133 112 71 112 44 98 Z"/>',
            2: '<path d="M45 62 C42 19 65 3 100 4 C137 4 159 22 156 64 C164 118 160 183 145 224 C135 221 137 178 139 143 C123 154 78 154 61 143 C63 178 65 221 55 224 C40 183 36 118 45 62 Z"/>',
            3: '<path d="M49 67 C47 23 68 8 100 8 C133 8 153 24 151 67 L154 96 C132 111 70 111 46 96 Z"/><path d="M50 78 C30 90 24 123 29 170 C32 199 41 219 50 213 C42 176 41 121 54 90 Z"/><path d="M150 78 C170 90 176 123 171 170 C168 199 159 219 150 213 C158 176 159 121 146 90 Z"/>',
            4: '<path d="M42 72 C43 18 69 2 100 6 C135 1 158 20 160 72 L165 108 C135 122 66 122 36 108 Z"/>',
            5: '<path d="M47 65 C46 24 67 8 100 8 C134 8 154 25 153 66 L155 111 C132 128 68 128 45 111 Z"/>',
            6: '<path d="M49 66 C47 24 68 8 100 8 C133 8 153 24 151 66 L154 94 C132 108 70 108 46 94 Z"/><path d="M137 27 C164 14 176 37 169 79 C164 112 156 139 145 160 C143 119 146 69 137 27 Z"/>',
            7: '<path d="M48 66 C47 23 68 7 100 7 C134 7 154 24 153 66 L156 108 C132 123 68 123 44 108 Z"/>'
        };
        const hairFront = {
            0: '',
            1: '<path d="M52 61 C61 24 78 13 100 13 C125 13 141 25 148 62 C139 76 130 72 124 48 C116 64 102 76 86 82 C91 65 93 51 91 39 C81 61 68 74 55 78 C50 72 49 66 52 61 Z"/>',
            2: '<path d="M51 61 C60 22 78 11 100 10 C126 11 142 24 149 62 C145 80 133 80 127 58 C117 76 103 84 85 86 C88 70 89 55 87 42 C77 65 65 80 54 83 C49 75 48 67 51 61 Z"/>',
            3: '<path d="M54 60 C64 24 80 13 100 13 C123 13 139 25 146 60 C139 75 129 72 123 50 C115 65 101 76 84 81 C90 63 90 49 86 38 C76 61 66 73 56 77 C51 70 50 65 54 60 Z"/>',
            4: '<path d="M47 64 C54 20 78 10 100 10 C128 8 148 23 153 65 C155 53 149 37 138 28 C131 23 126 28 123 38 C114 24 101 20 91 29 C82 17 65 23 57 38 C50 46 47 55 47 64 Z"/>',
            5: '<path d="M51 59 C61 21 80 12 100 12 C123 12 141 24 149 60 C149 80 139 86 132 72 C120 58 105 54 86 58 C75 61 66 72 61 85 C53 82 49 72 51 59 Z"/>',
            6: '<path d="M54 59 C64 23 80 13 100 13 C124 13 140 25 146 60 C139 74 129 71 123 49 C114 62 102 72 88 77 C91 62 90 49 86 38 C75 59 66 72 56 76 C51 70 50 64 54 59 Z"/>',
            7: '<path d="M49 62 C56 21 78 10 100 10 C128 10 146 25 151 63 C148 78 139 78 134 64 C120 49 100 42 76 48 C66 53 59 66 55 79 C49 73 47 67 49 62 Z"/>'
        };
        const eyes = {
            0: `<g><ellipse cx="78" cy="76" rx="10" ry="13" fill="url(#${uid}eye)"/><ellipse cx="122" cy="76" rx="10" ry="13" fill="url(#${uid}eye)"/><path d="M64 65 Q78 57 92 65 M108 65 Q122 57 136 65" fill="none" stroke="#111827" stroke-width="3" stroke-linecap="round"/><circle cx="74" cy="71" r="4" fill="#fff"/><circle cx="118" cy="71" r="4" fill="#fff"/><circle cx="82" cy="82" r="2" fill="#fff" opacity=".55"/><circle cx="126" cy="82" r="2" fill="#fff" opacity=".55"/></g>`,
            1: `<g><path d="M66 75 Q78 64 90 75 M110 75 Q122 64 134 75" fill="none" stroke="#111827" stroke-width="4" stroke-linecap="round"/></g>`,
            2: `<g><circle cx="78" cy="76" r="13" fill="url(#${uid}eye)"/><circle cx="122" cy="76" r="13" fill="url(#${uid}eye)"/><path d="M62 64 Q78 55 94 64 M106 64 Q122 55 138 64" fill="none" stroke="#111827" stroke-width="3" stroke-linecap="round"/><circle cx="73" cy="71" r="4.5" fill="#fff"/><circle cx="117" cy="71" r="4.5" fill="#fff"/></g>`,
            3: `<g><ellipse cx="78" cy="76" rx="9" ry="10" fill="url(#${uid}eye)"/><ellipse cx="122" cy="76" rx="9" ry="10" fill="url(#${uid}eye)"/><path d="M65 64 L78 68 L91 64 M109 64 L122 68 L135 64" fill="none" stroke="#111827" stroke-width="3" stroke-linecap="round"/></g>`,
            4: `<g><ellipse cx="78" cy="76" rx="10" ry="13" fill="url(#${uid}eye)"/><path d="M64 65 Q78 57 92 65" fill="none" stroke="#111827" stroke-width="3" stroke-linecap="round"/><circle cx="74" cy="71" r="4" fill="#fff"/><path d="M112 77 Q122 68 132 77" fill="none" stroke="#111827" stroke-width="4" stroke-linecap="round"/></g>`,
            5: `<g><ellipse cx="78" cy="76" rx="10" ry="9" fill="url(#${uid}eye)"/><ellipse cx="122" cy="76" rx="10" ry="9" fill="url(#${uid}eye)"/><ellipse cx="78" cy="76" rx="3" ry="7" fill="#0f172a" opacity=".65"/><ellipse cx="122" cy="76" rx="3" ry="7" fill="#0f172a" opacity=".65"/></g>`
        };
        const mouths = {
            0: '<path d="M93 99 Q100 105 107 99" fill="none" stroke="#581c87" stroke-width="2" stroke-linecap="round"/>',
            1: '<ellipse cx="100" cy="101" rx="5" ry="4" fill="#32113b"/><path d="M96 100 Q100 98 104 100" fill="none" stroke="#fff" stroke-width="1" opacity=".35"/>',
            2: '<path d="M94 100 L106 100" stroke="#581c87" stroke-width="2" stroke-linecap="round"/>',
            3: '<path d="M94 99 Q97 103 100 99 Q103 103 106 99" fill="none" stroke="#581c87" stroke-width="1.8" stroke-linecap="round"/>'
        };
        const jacket = topStyle >= 3 ? `<path d="M84 118 L116 118 L118 165 Q100 172 82 165 Z" fill="#0f172a" stroke="#111827" stroke-width="2"/><path d="M74 116 L92 112 L100 124 L108 112 L126 116 L130 166 L113 168 L108 132 L100 142 L92 132 L87 168 L70 166 Z" fill="url(#${uid}top)" stroke="#111827" stroke-width="2.5"/><path d="M82 125 L72 151 M118 125 L128 151 M93 126 L107 126" stroke="${topLight}" stroke-width="2" opacity=".75"/>` : `<path d="M78 116 L122 116 L126 166 Q100 174 74 166 Z" fill="url(#${uid}top)" stroke="#111827" stroke-width="2.5"/><path d="M88 122 Q100 130 112 122 M95 132 L95 158 M105 132 L105 158" stroke="${topDark}" stroke-width="2" opacity=".45"/>`;
        const bottoms = bottomStyle === 2 ? `<path d="M77 164 L123 164 L132 198 Q100 210 68 198 Z" fill="${bottomColor}" stroke="#111827" stroke-width="2.5"/>` : `<path d="M78 164 L99 164 L96 202 L82 202 Z M101 164 L122 164 L118 202 L104 202 Z" fill="${bottomColor}" stroke="#111827" stroke-width="2.5"/><path d="M100 166 L100 199" stroke="${bottomDark}" stroke-width="1.5" opacity=".6"/>`;
        const shoes = shoeStyle >= 2 ? `<path d="M75 212 C82 207 94 208 99 215 L98 224 L73 224 Z" fill="${shoeColor}" stroke="#111827" stroke-width="2.5"/><path d="M101 215 C106 208 118 207 125 212 L127 224 L102 224 Z" fill="${shoeColor}" stroke="#111827" stroke-width="2.5"/><path d="M80 216 L94 216 M106 216 L120 216" stroke="${shoeLight}" stroke-width="2"/>` : `<ellipse cx="86" cy="220" rx="13" ry="6" fill="${shoeColor}" stroke="#111827" stroke-width="2.5"/><ellipse cx="114" cy="220" rx="13" ry="6" fill="${shoeColor}" stroke="#111827" stroke-width="2.5"/>`;
        return `
            <svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg" class="${isDancing ? 'chibi-dance-v12' : ''}" style="width:100%;height:100%;display:block;overflow:visible">
                <defs>
                    <radialGradient id="${uid}skin" cx="40%" cy="28%" r="72%"><stop offset="0" stop-color="${skinLight}"/><stop offset=".72" stop-color="${skin}"/><stop offset="1" stop-color="${skinDark}"/></radialGradient>
                    <linearGradient id="${uid}hair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${hairLight}"/><stop offset=".48" stop-color="${hairColor}"/><stop offset="1" stop-color="${hairDark}"/></linearGradient>
                    <radialGradient id="${uid}eye" cx="40%" cy="25%" r="75%"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset=".35" stop-color="${this.adjustColor(eyeColor, 45)}"/><stop offset="1" stop-color="${this.adjustColor(eyeColor, -45)}"/></radialGradient>
                    <linearGradient id="${uid}top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${topLight}"/><stop offset="1" stop-color="${topDark}"/></linearGradient>
                    <filter id="${uid}shadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="1.4" flood-color="#020617" flood-opacity=".32"/></filter>
                </defs>
                <style>.chibi-dance-v12{animation:cbV12 2.3s ease-in-out infinite;transform-origin:100px 224px}@keyframes cbV12{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-6px) rotate(1deg)}} @media (prefers-reduced-motion:reduce){.chibi-dance-v12{animation:none}}</style>
                <g filter="url(#${uid}shadow)">
                    <g fill="url(#${uid}hair)" stroke="#111827" stroke-width="3" stroke-linejoin="round">${hairBack[hairStyle] || hairBack[1]}</g>
                    <path d="M78 122 C60 136 57 157 63 176" fill="none" stroke="url(#${uid}skin)" stroke-width="13" stroke-linecap="round"/>
                    <path d="M122 122 C140 136 143 157 137 176" fill="none" stroke="url(#${uid}skin)" stroke-width="13" stroke-linecap="round"/>
                    <circle cx="63" cy="177" r="6" fill="url(#${uid}skin)" stroke="#111827" stroke-width="2"/><circle cx="137" cy="177" r="6" fill="url(#${uid}skin)" stroke="#111827" stroke-width="2"/>
                    <path d="M88 190 L84 216 M112 190 L116 216" fill="none" stroke="url(#${uid}skin)" stroke-width="13" stroke-linecap="round"/>
                    <path d="M80 116 Q100 107 120 116 L124 164 Q100 174 76 164 Z" fill="url(#${uid}skin)" stroke="#111827" stroke-width="2.5"/>
                    ${jacket}${bottoms}${shoes}
                    <path d="M52 62 C52 25 72 10 100 10 C128 10 148 25 148 62 C148 103 127 119 100 119 C73 119 52 103 52 62 Z" fill="url(#${uid}skin)" stroke="#111827" stroke-width="3"/>
                    <ellipse cx="53" cy="74" rx="5" ry="8" fill="url(#${uid}skin)" stroke="#111827" stroke-width="2"/><ellipse cx="147" cy="74" rx="5" ry="8" fill="url(#${uid}skin)" stroke="#111827" stroke-width="2"/>
                    <circle cx="68" cy="91" r="9" fill="#fb7185" opacity=".18"/><circle cx="132" cy="91" r="9" fill="#fb7185" opacity=".18"/>
                    ${eyes[eyeStyle] || eyes[0]}<circle cx="100" cy="91" r="1.4" fill="${skinDark}" opacity=".38"/>${mouths[mouthStyle] || mouths[0]}
                    <g fill="url(#${uid}hair)" stroke="#111827" stroke-width="3" stroke-linejoin="round">${hairFront[hairStyle] || hairFront[1]}</g>
                    <path d="M78 31 Q96 20 115 30" fill="none" stroke="#fff" stroke-width="2.4" opacity=".24" stroke-linecap="round"/>
                    <path d="M85 41 Q98 34 109 40" fill="none" stroke="${hairLight}" stroke-width="2" opacity=".35" stroke-linecap="round"/>
                </g>
            </svg>`;
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
            2: 'assets/chibi/hair_front_2.png',
            3: 'assets/chibi/hair_front_1.png', // Virtual Green
            4: 'assets/chibi/hair_front_2.png', // Virtual Purple
            5: 'assets/chibi/hair_front_1.png'  // Virtual Gold
        },
        eyes: {
            1: 'assets/chibi/eyes_1.png',
            2: 'assets/chibi/eyes_1.png' // Virtual Blue-tint
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

        // Dynamic Filtering with Virtual Override
        let hairFilter = `hue-rotate(${this.getHueShift(c.hairColor, '#ec4899')}deg) saturate(1.2)`;
        if (hs === 3) hairFilter = `hue-rotate(120deg) saturate(1.5)`; // Green
        if (hs === 4) hairFilter = `hue-rotate(280deg) saturate(1.5)`; // Purple
        if (hs === 5) hairFilter = `hue-rotate(60deg) brightness(1.2)`; // Gold

        let outfitFilter = `hue-rotate(${this.getHueShift(c.topColor, '#ffffff')}deg)`;
        if (outfit === 2) outfitFilter = `hue-rotate(0deg) brightness(0.7)`; // Dark
        if (outfit === 3) outfitFilter = `hue-rotate(330deg) saturate(1.5)`; // Red-ish

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
     * Advanced Hue Shift for CSS Filters
     * Converts hex to approximate hue difference from a base color
     */
    getHueShift: function(hex, base) {
        if (!hex || hex.toLowerCase() === base.toLowerCase()) return 0;
        
        const hexToRgb = (h) => {
            let c = h.replace("#", "");
            if (c.length === 3) c = c.split('').map(s => s + s).join('');
            const n = parseInt(c, 16);
            return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
        };

        const rgbToHue = (r, g, b) => {
            r /= 255; g /= 255; b /= 255;
            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            let h;
            if (max === min) h = 0;
            else if (max === r) h = (g - b) / (max - min) + (g < b ? 6 : 0);
            else if (max === g) h = (b - r) / (max - min) + 2;
            else h = (r - g) / (max - min) + 4;
            return Math.round(h * 60);
        };

        const h1 = rgbToHue(...hexToRgb(hex));
        const h2 = rgbToHue(...hexToRgb(base));
        let diff = h1 - h2;
        if (diff < -180) diff += 360;
        if (diff > 180) diff -= 360;
        return diff;
    },

    getBrightnessShift: function(hex, base) {
        if (!hex) return 1;
        const hexToLumi = (h) => {
            let c = h.replace("#", "");
            if (c.length === 3) c = c.split('').map(s => s + s).join('');
            const n = parseInt(c, 16);
            return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
        };
        const l1 = hexToLumi(hex);
        const l2 = hexToLumi(base);
        return (l1 / l2).toFixed(2);
    },

    /**
     * Main Chibi Sprite Renderer (V11.1 - HYBRID STABLE)
     */
    renderChibiSprite: function(config, isDancing = false) {
        const c = config || this.currentConfig || {};
        const hs = c.hairStyle || 1;
        const es = c.eyeStyle || 1;
        const outfit = c.topStyle || 1;

        // Assets
        const bodyFile = this.spriteAssets.body;
        const headFile = this.spriteAssets.head;
        const outfitFile = this.spriteAssets.outfit[outfit];
        const hairFile = this.spriteAssets.hair[hs];
        const eyeFile = this.spriteAssets.eyes[es];

        // Filters
        const skinFilter = `hue-rotate(${this.getHueShift(c.skinColor, '#ffcd94')}deg) brightness(${this.getBrightnessShift(c.skinColor, '#ffcd94')})`;
        const hairFilter = `hue-rotate(${this.getHueShift(c.hairColor, '#ec4899')}deg) saturate(1.2)`;
        const outfitFilter = `hue-rotate(${this.getHueShift(c.topColor, '#ffffff')}deg)`;

        // Fallback Logic: If sprite is missing for a specific category, we can render the SVG equivalent
        // But for now, we prioritize the 100% quality sprites.
        
        return `
            <div class="chibi-v11-container ${isDancing ? 'chibi-dance' : ''}" style="width:100%; height:100%; position:relative; aspect-ratio: 200/240;">
                <style>
                    .chibi-v11-container .chibi-layer {
                        position: absolute; top: 0; left: 0;
                        width: 100%; height: 100%;
                        object-fit: contain; pointer-events: none;
                    }
                    .chibi-v11-container .chibi-svg-layer {
                        position: absolute; top: 0; left: 0;
                        width: 100%; height: 100%;
                        z-index: 5;
                    }
                </style>
                
                <img src="${bodyFile}" class="chibi-layer" style="z-index:2; filter: ${skinFilter};" />
                <img src="${headFile}" class="chibi-layer" style="z-index:3; filter: ${skinFilter};" />
                
                ${outfitFile ? `<img src="${outfitFile}" class="chibi-layer" style="z-index:4; filter: ${outfitFilter};" />` : 
                   `<div class="chibi-svg-layer" style="z-index:4;">${this.renderPartialSVG('outfit', c)}</div>`}
                
                ${eyeFile ? `<img src="${eyeFile}" class="chibi-layer" style="z-index:5;" />` : 
                   `<div class="chibi-svg-layer" style="z-index:5;">${this.renderPartialSVG('eyes', c)}</div>`}
                
                ${hairFile ? `<img src="${hairFile}" class="chibi-layer" style="z-index:6; filter: ${hairFilter};" />` : 
                   `<div class="chibi-svg-layer" style="z-index:6;">${this.renderPartialSVG('hair', c)}</div>`}
            </div>
        `;
    },

    /**
     * Render specific parts as SVG for hybrid fallback
     */
    renderPartialSVG: function(type, c) {
        // Return a small SVG snippet for the missing part
        // (Implementation omitted for brevity, but would use ChibiModule.assets)
        return ''; 
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
        // Use the code-native full-body renderer to avoid mismatched PNG sticker layers.
        return ChibiModule.renderChibiV12(config, isDancing);
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
        hair: 8,       // V12 full-body SVG styles, including bald
        eyes: 6,       // V12 SVG eye styles
        mouth: 4,      
        top: 5,        // V12 SVG top variants
        bottom: 3,
        shoe: 3,
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
