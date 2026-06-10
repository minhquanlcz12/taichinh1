$path = "C:\Users\Admin\Desktop\taichinh1\js\chibi.js"
$content = Get-Content -Path $path -Raw
$bt = [char]96

# Define the complete V8 renderChibiSVG function
$v8Function = @"
    renderChibiSVG: function(config, isD = false, pts = 0) {
        const c = config || this.currentConfig;
        const skinColor = c.skinColor || "#ffd1a9";
        const darkSkin = this.adjustColor(skinColor, -25);
        const hc = c.hairColor || "#343a40";
        const gender = c.gender || "nam";
        const viewBox = "0 0 200 220";

        // 1. Dragon Layer (Below all)
        let dragonHtml = '';
        if (c.dragon > 0 && c.dragon <= 10) {
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

        // 3. Wings Layer (V8 Ultra High Fidelity)
        let wingHtml = '';
        const w = c.wing;
        if (w === 1) { // 🕊️ Angelic Wings
            wingHtml = `<g class="chibi-wing-flap" filter="url(#glowStrong)">
                <path d="M 80 110 Q 20 40 40 140 Q 60 160 85 130 Z" fill="#fff" opacity="0.8" />
                <path d="M 120 110 Q 180 40 160 140 Q 140 160 115 130 Z" fill="#fff" opacity="0.8" />
            </g>`;
        } else if (w === 5) { // 🦇 Bat Wings
            wingHtml = `<g class="chibi-wing-flap" filter="url(#glowStrong)">
                <path d="M 85 115 L 30 80 L 50 130 L 30 140 L 85 135 Z" fill="#1e293b" />
                <path d="M 115 115 L 170 80 L 150 130 L 170 140 L 115 135 Z" fill="#1e293b" />
            </g>`;
        } else if (w === 6) { // 🔥 Phoenix Wings
            wingHtml = `<g class="chibi-wing-flap" filter="url(#glowStrong)">
                <path d="M 80 110 Q 10 60 30 150 Z" fill="#f59e0b" style="animation: glowPulse 2s infinite;" />
                <path d="M 120 110 Q 190 60 170 150 Z" fill="#f59e0b" style="animation: glowPulse 2s infinite;" />
            </g>`;
        }

        // 4. Back Hair
        let backHairHtml = '';
        const hs = c.hairStyle;
        if ([2,4,6,8,10].includes(hs)) {
             backHairHtml = `<path d="M 60 80 Q 100 160 140 80" fill="url(#hairGradV5)" />`;
        }

        // 5. Hair (Main)
        let hairHtml = '';
        if (hs === 1) { // Spiky Cyber
             hairHtml = `<path d="M 60 70 L 100 20 L 140 70 L 150 90 Q 100 110 50 90 Z" fill="url(#hairGradV5)" />`;
        } else if (hs === 3) { // Royal Topknot
             hairHtml = `<circle cx="100" cy="35" r="15" fill="url(#hairGradV5)" /><path d="M 65 75 Q 100 40 135 75 Z" fill="url(#hairGradV5)"/>`;
        } else if (hs === 10) { // Legendary V8 Flow
             hairHtml = `
                <path d="M 55 85 Q 100 30 145 85 L 145 105 Q 100 120 55 105 Z" fill="url(#hairGradV5)" />
                <path d="M 60 50 L 70 30 M 130 30 L 140 50" stroke="${hc}" stroke-width="4" stroke-linecap="round" />
             `;
        } else {
             hairHtml = `<path d="M 60 75 Q 100 30 140 75 L 145 100 Q 100 115 55 100 Z" fill="url(#hairGradV5)" />`;
        }

        // 6. Face Features
        let eyesHtml = '', mouthHtml = '';
        const es = c.eyeStyle, mo = c.mouthStyle;
        if (es === 1) { // Large Sparkle
            eyesHtml = `
                <circle cx="85" cy="82" r="6" fill="#111" />
                <circle cx="115" cy="82" r="6" fill="#111" />
                <circle cx="87" cy="80" r="2.5" fill="#fff" />
                <circle cx="117" cy="80" r="2.5" fill="#fff" />
            `;
        } else {
            eyesHtml = `<circle cx="85" cy="82" r="5" fill="#111" /><circle cx="115" cy="82" r="5" fill="#111" />`;
        }
        
        if (mo === 1) { // Smile
            mouthHtml = `<path d="M 90 100 Q 100 110 110 100" fill="none" stroke="#000" stroke-width="2" />`;
        } else {
            mouthHtml = `<path d="M 95 102 Q 100 105 105 102" fill="none" stroke="#000" stroke-width="1.5" />`;
        }

        // 7. Clothing
        let topHtml = '', bottomHtml = '';
        const ts = c.topStyle, bs = c.bottomStyle;
        const topCol = c.topColor || "#e83e8c", botCol = c.bottomColor || "#3b82f6";
        topHtml = `<path d="M 85 110 L 115 110 L 120 160 L 80 160 Z" fill="${topCol}" />`;
        bottomHtml = `<path d="M 85 160 L 115 160 L 115 185 L 85 185 Z" fill="${botCol}" />`;

        // 8. Gear
        let gearHtml = '';
        const g = c.gear;
        if (g === 1) { // Greatsword
            gearHtml = `<g transform="translate(130, 110) rotate(15)">
                <rect x="-5" y="-60" width="10" height="80" fill="url(#bladeSteel)" />
                <rect x="-10" y="20" width="20" height="5" fill="#334155" />
            </g>`;
        }

        // 9. Mount
        let mountHtml = '';
        const m = c.mount;
        if (m === 12) { // Cyber Car
            mountHtml = `<path d="M 30 170 L 170 170 Q 190 210 170 210 L 30 210 Q 10 210 30 170 Z" fill="#1e293b" stroke="#00f3ff" />`;
        } else {
            mountHtml = `<ellipse cx="100" cy="200" rx="60" ry="10" fill="#475569" opacity="0.4" />`;
        }

        // 10. Sparkles
        let sparklesHtml = '';
        if (pts > 20) {
            sparklesHtml = `<circle cx="50" cy="50" r="3" fill="#fbbf24" style="animation: floatSparkle 2s infinite;" />`;
        }

        return \`
            <svg viewBox="\${viewBox}" width="100%" height="100%" class="\${isD ? 'chibi-dance' : ''}" style="display: block;">
                <style>
                    .chibi-dance { animation: chibiBounce 2s infinite ease-in-out; transform-origin: bottom center; }
                    @keyframes chibiBounce { 0%, 100% { transform: scale(1) translateY(0); } 50% { transform: scale(1.02, 0.98) translateY(-4px); } }
                    .chibi-breathe { animation: chibiBreathe 3s infinite ease-in-out; transform-origin: center; }
                    @keyframes chibiBreathe { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
                    @keyframes floatSparkle { 0%, 100% { transform: translateY(0) scale(0.6); opacity: 0.3; } 50% { transform: translateY(-10px) scale(1.1); opacity: 1; } }
                    .chibi-wing-flap { animation: wingFlap 2.5s infinite ease-in-out; transform-origin: 100px 110px; }
                    @keyframes wingFlap { 0%, 100% { transform: scaleX(1); } 50% { transform: scaleX(0.85); } }
                    @keyframes glowPulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
                    @keyframes runeRotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                </style>
                <defs>
                    <linearGradient id="skinGradV5" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="\${skinColor}" /><stop offset="100%" stop-color="\${this.adjustColor(skinColor, -12)}" />
                    </linearGradient>
                    <linearGradient id="hairGradV5" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="\${hc}" /><stop offset="100%" stop-color="\${this.adjustColor(hc, -30)}" />
                    </linearGradient>
                    <linearGradient id="bladeSteel" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stop-color="#94a3b8" /><stop offset="40%" stop-color="#e2e8f0" /><stop offset="60%" stop-color="#f8fafc" /><stop offset="100%" stop-color="#94a3b8" />
                    </linearGradient>
                    <filter id="glowStrong"><feGaussianBlur stdDeviation="3.5" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/></filter>
                </defs>
                \${dragonHtml}
                \${auraHtml}
                \${mountHtml}
                \${wingHtml}
                \${sparklesHtml}
                \${backHairHtml}
                <g class="chibi-breathe">
                    <g class="chibi-body">
                        <path d="M 85 125 L 70 150" stroke="\${skinColor}" stroke-width="12" stroke-linecap="round" />
                        <path d="M 115 125 L 130 150" stroke="\${skinColor}" stroke-width="12" stroke-linecap="round" />
                        <path d="M 90 175 L 85 200" stroke="\${skinColor}" stroke-width="13" stroke-linecap="round" />
                        <path d="M 110 175 L 115 200" stroke="\${skinColor}" stroke-width="13" stroke-linecap="round" />
                        <path d="M 85 110 L 115 110 L 120 175 Q 100 185 80 175 Z" fill="\${skinColor}" />
                        \${bottomHtml}
                        \${topHtml}
                    </g>
                    <g transform="translate(100, 75)">
                        <circle r="40" fill="\${skinColor}" />
                    </g>
                    <g class="chibi-head-bob">
                        \${eyesHtml}
                        \${mouthHtml}
                    </g>
                    \${hairHtml}
                    \${gearHtml}
                </g>
            </svg>
        \`;
    },
"@

# Helper function to escape backticks for the replacement string
function Escape-Backticks($str) {
    return $str.Replace("`", "\`")
}

# The replacement logic
$startMarker = "    renderChibiSVG: function"
$endMarker = "    renderMiniOption:"

$startIdx = $content.IndexOf($startMarker)
$endIdx = $content.IndexOf($endMarker)

if ($startIdx -ge 0 -and $endIdx -gt $startIdx) {
    $newContent = $content.Substring(0, $startIdx) + $v8Function + "`r`n`n" + $content.Substring($endIdx)
    # Fix the stray backticks in the rest of the file
    $newContent = $newContent.Replace("\`", "`")
    Set-Content -Path $path -Value $newContent -NoNewline -Encoding UTF8
    Write-Host "V8 Engine Repaired Successfully."
} else {
    Write-Error "Could not find markers for renderChibiSVG"
}
