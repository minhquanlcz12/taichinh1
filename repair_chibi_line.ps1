$path = "C:\Users\Admin\Desktop\taichinh1\js\chibi.js"
$lines = Get-Content -Path $path -Encoding UTF8

$startIndex = -1
$endIndex = -1

for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match "Main Hair Layer \(Premium V6") {
        $startIndex = $i
    }
    if ($lines[$i] -match "Clothing & Vietnamese Theme") {
        $endIndex = $i
        break
    }
}

if ($startIndex -eq -1 -or $endIndex -eq -1) {
    Write-Error "Could not find anchors: start=$startIndex, end=$endIndex"
    exit 1
}

$v7Block = @"
        // 5. Hair Layer (V7 MEGA OVERHAUL - 10 STYLES)
        let hairHtml = '', backHairHtml = '';
        const hStyle = c.hairStyle;
        const hc = c.hairColor;
        const darkHair = this.adjustColor(hc, -30);

        if (hStyle === 1) { // Super Saiyan Spike
            hairHtml = \`
                <g filter="url(#glowStrong)">
                    <path d="M 60 80 Q 55 40 80 45 L 85 20 L 100 40 L 115 20 L 120 45 Q 145 40 140 80 Z" fill="url(#hairGradV5)" stroke="\${darkHair}" stroke-width="1.5" />
                    <path d="M 75 45 L 70 25 M 125 45 L 130 25" stroke="\${darkHair}" stroke-width="1" opacity="0.4" />
                </g>\`;
            backHairHtml = \`<path d="M 60 80 Q 40 100 60 120 M 140 80 Q 160 100 140 120" stroke="\${hc}" stroke-width="8" opacity="0.3" fill="none" />\`;
        } else if (hStyle === 2) { // Cyber Wave K-Pop
            hairHtml = \`
                <path d="M 58 75 Q 60 35 100 35 Q 140 35 142 75 L 145 85 Q 100 80 55 85 Z" fill="url(#hairGradV5)" stroke="\${darkHair}" stroke-width="1.5" />
                <path d="M 100 35 L 100 60" stroke="\${darkHair}" stroke-width="1" opacity="0.3" />
                <path d="M 65 50 Q 100 45 135 50" fill="none" stroke="#fff" stroke-width="2" opacity="0.15" />\`;
        } else if (hStyle === 3) { // Twin Drill Tails
            hairHtml = \`<path d="M 62 70 Q 100 40 138 70 L 140 85 Q 100 75 60 85 Z" fill="url(#hairGradV5)" stroke="\${darkHair}" stroke-width="1.5" />\`;
            backHairHtml = \`
                <g filter="url(#glowNeon)">
                    <path d="M 60 70 Q 15 80 30 140 Q 55 120 60 100" fill="\${hc}" stroke="\${darkHair}" stroke-width="1.5" />
                    <path d="M 140 70 Q 185 80 170 140 Q 145 120 140 100" fill="\${hc}" stroke="\${darkHair}" stroke-width="1.5" />
                    <circle cx="55" cy="75" r="5" fill="#f43f5e" /> <circle cx="145" cy="75" r="5" fill="#f43f5e" />
                </g>\`;
        } else if (hStyle === 4) { // Flaming Mohawk
            hairHtml = \`
                <g filter="url(#glowStrong)">
                    <path d="M 90 60 Q 100 0 110 60 L 105 75 Q 100 70 95 75 Z" fill="#ef4444" stroke="#991b1b" stroke-width="2" />
                    <path d="M 85 70 Q 70 10 95 65" fill="#f59e0b" opacity="0.6"/>
                    <path d="M 115 70 Q 130 10 105 65" fill="#f59e0b" opacity="0.6"/>
                </g>\`;
        } else if (hStyle === 5) { // Samurai Top-knot
            hairHtml = \`
                <path d="M 65 75 Q 100 45 135 75 L 138 85 Q 100 75 62 85 Z" fill="url(#hairGradV5)" stroke="\${darkHair}" stroke-width="1.5" />
                <rect x="92" y="35" width="16" height="12" rx="4" fill="#1e293b" />
                <path d="M 95 35 Q 100 10 105 35" fill="none" stroke="\${hc}" stroke-width="8" stroke-linecap="round" />\`;
        } else if (hStyle === 6) { // Elegant Long
            hairHtml = \`<path d="M 60 75 Q 100 40 140 75 L 140 90 Q 100 80 60 90 Z" fill="url(#hairGradV5)" stroke="\${darkHair}" stroke-width="1.5" />\`;
            backHairHtml = \`<path d="M 60 85 L 60 160 Q 100 175 140 160 L 140 85" fill="\${hc}" stroke="\${darkHair}" stroke-width="1.5" />\`;
        } else if (hStyle === 7) { // Cyber Pompadour
            hairHtml = \`
                <g filter="url(#glowNeon)">
                    <path d="M 65 80 Q 60 20 120 30 Q 140 40 135 80" fill="url(#hairGradV5)" stroke="\${darkHair}" stroke-width="2" />
                    <path d="M 75 55 L 115 50" stroke="#fff" stroke-width="3" opacity="0.2" />
                </g>\`;
        } else if (hStyle === 8) { // Short Bob + Beret
            hairHtml = \`
                <path d="M 60 80 Q 100 45 140 80 L 140 110 Q 140 110 125 105 L 125 85 Q 100 80 75 85 L 75 105 Q 60 110 60 110 Z" fill="url(#hairGradV5)" stroke="\${darkHair}" stroke-width="1.5" />
                <ellipse cx="100" cy="50" rx="35" ry="15" fill="#1e1b4b" stroke="#4338ca" stroke-width="2" />\`;
        } else if (hStyle === 9) { // Rockstar Mullet
            hairHtml = \`<path d="M 65 75 Q 100 45 135 75 L 135 90 Q 100 80 65 90 Z" fill="url(#hairGradV5)" stroke="\${darkHair}" stroke-width="1.5" />\`;
            backHairHtml = \`<path d="M 65 90 L 55 140 M 135 90 L 145 140" stroke="\${hc}" stroke-width="12" stroke-linecap="round" />\`;
        } else if (hStyle === 10) { // Galactic Spikes
            hairHtml = \`
                 <g filter="url(#glowStrong)">
                     <path d="M 60 80 L 40 40 L 80 60 L 100 10 L 120 60 L 160 40 L 140 80" fill="url(#hairGradV5)" stroke="#fff" stroke-width="1" />
                 </g>\`;
        } else { // Standard Shaved/Short
            hairHtml = \`<path d="M 65 75 Q 100 50 135 75 L 138 85 Q 100 78 62 85 Z" fill="url(#hairGradV5)" stroke="\${darkHair}" stroke-width="1.2" />\`;
        }

        // --- EYES (V7 MEGA OVERHAUL - 2X SIZE) ---
        let eyesHtml = '';
        const ey = c.eyeStyle;
        const eSize = { rx: 11, ry: 13 }; // Doubled impact
        
        if (ey === 0) { // Large Shine Anime (V7)
            eyesHtml = \`
                <g class="chibi-blink">
                    <g transform="translate(80, 80)">
                        <ellipse rx="\${eSize.rx}" ry="\${eSize.ry}" fill="#fff" stroke="#1e1b4b" stroke-width="1.5"/>
                        <ellipse rx="8" ry="10" fill="\${gender==='nữ'?'#7c3aed':'#1e40af'}" cy="1"/>
                        <circle r="4.5" fill="#000" cy="2"/>
                        <circle cx="4" cy="-4" r="3" fill="#fff"/>
                    </g>
                    <g transform="translate(120, 80)">
                        <ellipse rx="\${eSize.rx}" ry="\${eSize.ry}" fill="#fff" stroke="#1e1b4b" stroke-width="1.5"/>
                        <ellipse rx="8" ry="10" fill="\${gender==='nữ'?'#7c3aed':'#1e40af'}" cy="1"/>
                        <circle r="4.5" fill="#000" cy="2"/>
                        <circle cx="-4" cy="-4" r="3" fill="#fff"/>
                    </g>
                </g>
            \`;
        } else if (ey === 1) { // Angry
            eyesHtml = \`
                <g class="chibi-blink">
                    <path d="M 65 65 L 90 85" stroke="#000" stroke-width="4" stroke-linecap="round" />
                    <path d="M 135 65 L 110 85" stroke="#000" stroke-width="4" stroke-linecap="round" />
                    <circle cx="80" cy="85" r="5" fill="\${eyeColor}" />
                    <circle cx="120" cy="85" r="5" fill="\${eyeColor}" />
                </g>
            \`;
        } else if (ey === 2) { // Heart
            eyesHtml = \`
                <g class="chibi-blink">
                    <path d="M 80 95 Q 65 75 80 65 Q 95 75 80 95" fill="#f43f5e" filter="url(#glowStrong)" />
                    <path d="M 120 95 Q 105 75 120 65 Q 135 75 120 95" fill="#f43f5e" filter="url(#glowStrong)" />
                </g>
            \`;
        } else if (ey === 3) { // Dizzy
            eyesHtml = \`
                <g stroke="#000" stroke-width="4" stroke-linecap="round">
                    <path d="M 70 70 L 90 90 M 90 70 L 70 90" />
                    <path d="M 110 70 L 130 90 M 130 70 L 110 90" />
                </g>
            \`;
        } else if (ey === 4) { // Happy
            eyesHtml = \`
                <path d="M 70 85 Q 80 70 90 85" fill="none" stroke="#000" stroke-width="5" stroke-linecap="round" />
                <path d="M 110 85 Q 120 70 130 85" fill="none" stroke="#000" stroke-width="5" stroke-linecap="round" />
            \`;
        } else if (ey === 5) { // Focused
            eyesHtml = \`
                <g class="chibi-blink">
                    <rect x="70" y="75" width="20" height="8" rx="2" fill="\${eyeColor}" />
                    <rect x="110" y="75" width="20" height="8" rx="2" fill="\${eyeColor}" />
                    <path d="M 68 70 L 92 73 M 132 70 L 108 73" stroke="#000" stroke-width="3" />
                </g>
            \`;
        } else if (ey === 6) { // Teary
            eyesHtml = \`
                <g class="chibi-blink">
                    <ellipse cx="80" cy="80" rx="10" ry="12" fill="\${eyeColor}" />
                    <circle cx="76" cy="74" r="5" fill="#fff" />
                    <circle cx="84" cy="88" r="3" fill="#fff" opacity="0.6" />
                    <ellipse cx="120" cy="80" rx="10" ry="12" fill="\${eyeColor}" />
                    <circle cx="116" cy="74" r="5" fill="#fff" />
                    <circle cx="124" cy="88" r="3" fill="#fff" opacity="0.6" />
                </g>
            \`;
        } else if (ey === 7) { // Sunglasses
            eyesHtml = \`
                <rect x="65" y="75" width="70" height="15" rx="7.5" fill="rgba(0,0,0,0.9)" stroke="#fff" stroke-width="1" />
                <path d="M 85 75 L 115 75" stroke="#fff" opacity="0.2" />
            \`;
        } else if (ey === 8) { // Mystic
            eyesHtml = \`
                <g class="chibi-blink">
                    <circle cx="80" cy="80" r="10" fill="#000" />
                    <circle cx="80" cy="80" r="7" fill="#dc2626" />
                    <circle cx="80" cy="80" r="2.5" fill="#000" />
                    <circle cx="120" cy="80" r="10" fill="#000" />
                    <circle cx="120" cy="80" r="7" fill="#dc2626" />
                    <circle cx="120" cy="80" r="2.5" fill="#000" />
                </g>
            \`;
        } else if (ey === 9) { // Wink
            eyesHtml = \`
                <g class="chibi-blink"><ellipse cx="80" cy="80" rx="9" ry="11" fill="#fff" /><circle cx="80" cy="80" r="6" fill="\${eyeColor}" /></g>
                <path d="M 110 85 Q 120 95 130 85" fill="none" stroke="#000" stroke-width="4" stroke-linecap="round" />
            \`;
        } else if (ey === 10) { // Sleepy
            eyesHtml = \`
                <path d="M 70 80 Q 80 90 90 80" fill="none" stroke="#000" stroke-width="3" stroke-linecap="round" />
                <path d="M 110 80 Q 120 90 130 80" fill="none" stroke="#000" stroke-width="3" stroke-linecap="round" />
            \`;
        } else if (ey === 11) { // Sparkle
            eyesHtml = \`
                <g class="chibi-blink" filter="url(#glowStrong)">
                    <path d="M 80 65 L 85 78 L 95 80 L 85 82 L 80 95 L 75 82 L 65 80 L 75 78 Z" fill="#facc15" />
                    <path d="M 120 65 L 125 78 L 135 80 L 125 82 L 120 95 L 115 82 L 105 80 L 115 78 Z" fill="#facc15" />
                </g>
            \`;
        }

        // --- MOUTHS (V7 MEGA OVERHAUL) ---
        let mouthHtml = '';
        const mo = c.mouthStyle;
        if (mo === 0) { // Smile
            mouthHtml = \`<path d="M 90 100 Q 100 112 110 100" fill="none" stroke="#000" stroke-width="3" stroke-linecap="round" />\`;
        } else if (mo === 1) { // O
            mouthHtml = \`<circle cx="100" cy="105" r="5" fill="#000" />\`;
        } else if (mo === 2) { // Tongue
            mouthHtml = \`
                <path d="M 92 100 Q 100 100 108 100" stroke="#000" stroke-width="2" />
                <path d="M 95 100 Q 100 115 105 100 Z" fill="#fb7185" stroke="#be185d" />
            \`;
        } else if (mo === 3) { // Frown
            mouthHtml = \`<path d="M 90 108 Q 100 98 110 108" fill="none" stroke="#000" stroke-width="3" stroke-linecap="round" />\`;
        } else if (mo === 4) { // Grin
            mouthHtml = \`<path d="M 88 100 Q 100 115 112 100 Z" fill="#fff" stroke="#000" stroke-width="2" />\`;
        } else if (mo === 5) { // Neko
            mouthHtml = \`<path d="M 90 102 Q 95 108 100 102 Q 105 108 110 102" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round" />\`;
        } else if (mo === 6) { // Smirk
            mouthHtml = \`<path d="M 100 102 L 115 98" stroke="#000" stroke-width="3" stroke-linecap="round" />\`;
        } else if (mo === 7) { // Candy
            mouthHtml = \`
                <circle cx="100" cy="105" r="4" fill="#ec4899" />
                <rect x="99" y="105" width="2" height="10" fill="#fff" />
            \`;
        } else if (mo === 8) { // Sealed
            mouthHtml = \`<line x1="90" y1="102" x2="110" y2="102" stroke="#000" stroke-width="4" stroke-linecap="round" />\`;
        } else if (mo === 9) { // Meat
            mouthHtml = \`
                <path d="M 92 102 Q 100 112 108 102" fill="#fff" stroke="#000" />
                <rect x="102" y="98" width="12" height="8" rx="3" fill="#78350f" />
            \`;
        }

        let eyelashesHtml = '';
        let frontHairHtml = '';

        
"@

$finalLines = $lines[0..($startIndex-1)] + $v7Block.Split("`r`n") + $lines[$endIndex..($lines.Count-1)]

# Clean up tattoo mojibake if present
for ($i = 0; $i -lt $finalLines.Count; $i++) {
    if ($finalLines[$i] -match "X.m .n Ng.i") {
        $finalLines[$i] = "        if (c.accessory === 10) { // Xam Kin Nguoi"
    }
}

[System.IO.File]::WriteAllLines($path, $finalLines, [System.Text.Encoding]::UTF8)
Write-Output "Successfully repaired chibi.js via Line-Based PowerShell."
