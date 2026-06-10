$path = "C:\Users\Admin\Desktop\taichinh1\js\chibi.js"
$lines = Get-Content -Path $path -Encoding UTF8

$hairStartLine = -1
$hairEndLine = -1

for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match "// 5. Hair Layer") {
        $hairStartLine = $i
    }
    if ($lines[$i] -match "// --- EYES") {
        $hairEndLine = $i
        break
    }
}

if ($hairStartLine -eq -1 -or $hairEndLine -eq -1) {
    Write-Error "Could not find Hair section delimiters"
    exit 1
}

$v8HairBlock = @"
        // 5. Hair Layer (V8 ULTIMATE REFINEMENT - 10 STYLES)
        let hairHtml = '', backHairHtml = '';
        const hStyle = c.hairStyle;
        const hc = c.hairColor;
        const darkHair = this.adjustColor(hc, -30);

        if (hStyle === 1) { // 🌪️ Super Saiyan Prime
            hairHtml = \`
                <g filter="url(#glowStrong)">
                    <path d="M 60 80 Q 45 30 80 40 L 85 10 L 100 35 L 115 10 L 120 40 Q 155 30 140 80 Z" fill="url(#hairGradV5)" stroke="\${darkHair}" stroke-width="2" />
                    <path d="M 85 40 L 80 20 M 115 40 L 120 20" stroke="\${hc}" stroke-width="2" opacity="0.6"/>
                    <path d="M 70 50 L 65 35 M 130 50 L 135 35" stroke="#fff" stroke-width="1.5" opacity="0.2"/>
                </g>\`;
            backHairHtml = \`<path d="M 60 80 Q 30 110 60 140 M 140 80 Q 170 110 140 140" stroke="\${hc}" stroke-width="10" opacity="0.3" fill="none" stroke-linecap="round"/>\`;
        } else if (hStyle === 2) { // 🌊 Cyber Flow (K-Pop)
            hairHtml = \`
                <g>
                    <path d="M 58 75 Q 60 25 100 25 Q 140 25 142 75 L 145 85 Q 100 80 55 85 Z" fill="url(#hairGradV5)" stroke="\${darkHair}" stroke-width="1.8" />
                    <path d="M 80 25 Q 100 50 120 25" stroke="\${hc}" stroke-width="2" fill="none" opacity="0.4"/>
                    <path d="M 65 45 Q 100 40 135 45" stroke="#fff" stroke-width="3" opacity="0.15" fill="none"/>
                </g>\`;
        } else if (hStyle === 3) { // 🎀 Twin Galaxy Tails
            hairHtml = \`<path d="M 62 70 Q 100 35 138 70 L 142 85 Q 100 75 58 85 Z" fill="url(#hairGradV5)" stroke="\${darkHair}" stroke-width="2" />\`;
            backHairHtml = \`
                <g filter="url(#glowNeon)">
                    <path d="M 60 70 Q 5 80 25 145 Q 55 125 60 100" fill="\${hc}" stroke="\${darkHair}" stroke-width="2" />
                    <path d="M 140 70 Q 195 80 175 145 Q 145 125 140 100" fill="\${hc}" stroke="\${darkHair}" stroke-width="2" />
                    <circle cx="58" cy="74" r="6" fill="#f43f5e" stroke="#fff" stroke-width="1"/>
                    <circle cx="142" cy="74" r="6" fill="#f43f5e" stroke="#fff" stroke-width="1"/>
                </g>\`;
        } else if (hStyle === 4) { // 🔥 Infernal Mohawk
            hairHtml = \`
                <g filter="url(#glowStrong)">
                    <path d="M 85 65 Q 100 -20 115 65 L 105 78 Q 100 70 95 78 Z" fill="#ef4444" stroke="#991b1b" stroke-width="2" />
                    <path d="M 80 75 Q 60 0 95 65" fill="#f59e0b" opacity="0.8"/>
                    <path d="M 120 75 Q 140 0 105 65" fill="#f59e0b" opacity="0.8"/>
                    <path d="M 100 10 L 100 50" stroke="#fef08a" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
                </g>\`;
        } else if (hStyle === 5) { // 🏯 Shogun Top-knot
            hairHtml = \`
                <path d="M 65 75 Q 100 40 135 75 L 140 85 Q 100 75 60 85 Z" fill="url(#hairGradV5)" stroke="\${darkHair}" stroke-width="2" />
                <rect x="91" y="30" width="18" height="15" rx="5" fill="#1e293b" stroke="#334155" stroke-width="1"/>
                <path d="M 92 30 Q 100 0 108 30" fill="\${hc}" stroke="\${darkHair}" stroke-width="1.5" />\`;
        } else if (hStyle === 6) { // 🌹 Majestic Silk (Nữ)
            hairHtml = \`<path d="M 60 75 Q 100 35 140 75 L 145 90 Q 100 80 55 90 Z" fill="url(#hairGradV5)" stroke="\${darkHair}" stroke-width="2" />\`;
            backHairHtml = \`
                <path d="M 58 85 L 50 170 Q 100 190 150 170 L 142 85" fill="\${hc}" stroke="\${darkHair}" stroke-width="2" />
                <path d="M 75 90 L 75 160 M 100 90 L 100 175 M 125 90 L 125 160" stroke="\${darkHair}" stroke-width="1" opacity="0.2"/>\`;
        } else if (hStyle === 7) { // 🚁 Cyber Pompadour (Glow)
            hairHtml = \`
                <g filter="url(#glowNeon)">
                    <path d="M 62 82 Q 55 15 125 25 Q 145 35 138 82 L 140 90 Q 100 82 60 90 Z" fill="url(#hairGradV5)" stroke="#fff" stroke-width="1" />
                    <path d="M 75 55 L 115 50" stroke="#fff" stroke-width="4" opacity="0.3" stroke-linecap="round" />
                </g>\`;
        } else if (hStyle === 8) { // 🍡 Urban Bob + Beret
            hairHtml = \`
                <path d="M 60 80 Q 100 40 140 80 L 145 115 Q 145 115 130 110 L 130 85 Q 100 80 70 85 L 70 110 Q 55 115 55 115 Z" fill="url(#hairGradV5)" stroke="\${darkHair}" stroke-width="1.8" />
                <ellipse cx="100" cy="45" rx="38" ry="18" fill="#1e1b4b" stroke="#4338ca" stroke-width="2.5" />
                <circle cx="100" cy="30" r="4" fill="#4338ca" />\`;
        } else if (hStyle === 9) { // 🎸 Rockstar Edge
            hairHtml = \`<path d="M 65 75 Q 100 40 135 75 L 140 95 Q 100 85 60 95 Z" fill="url(#hairGradV5)" stroke="\${darkHair}" stroke-width="2" />\`;
            backHairHtml = \`
                <path d="M 65 95 L 45 150 M 135 95 L 155 150" stroke="\${hc}" stroke-width="14" stroke-linecap="round" />
                <path d="M 45 150 L 35 160 M 155 150 L 165 160" stroke="\${darkHair}" stroke-width="4" stroke-linecap="round" />\`;
        } else if (hStyle === 10) { // 🛸 Galactic Spikes (Animated)
            hairHtml = \`
                 <g filter="url(#glowStrong)">
                     <path d="M 60 80 L 35 35 L 80 60 L 100 5 L 120 60 L 165 35 L 140 80" fill="url(#hairGradV5)" stroke="#fff" stroke-width="1.5" />
                     <circle cx="100" cy="15" r="3" fill="#fff" style="animation: glowPulse 0.5s infinite;"/>
                 </g>\`;
        } else { // Standard Shaved/Short
            hairHtml = \`<path d="M 65 75 Q 100 45 135 75 L 140 88 Q 100 80 60 88 Z" fill="url(#hairGradV5)" stroke="\${darkHair}" stroke-width="1.5" />\`;
        }
"@

$finalLines = $lines[0..($hairStartLine-1)] + $v8HairBlock.Split("`r`n") + $lines[$hairEndLine..($lines.Count-1)]

[System.IO.File]::WriteAllLines($path, $finalLines, [System.Text.Encoding]::UTF8)
Write-Output "Successfully applied Ultimate Hair Refinement via PowerShell."
