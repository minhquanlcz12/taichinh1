$path = "C:\Users\Admin\Desktop\taichinh1\js\chibi.js"
$content = Get-Content -Path $path -Raw -Encoding UTF8

# Fix backtick escaping issues from previous run
$content = $content -replace "hairHtml = \\", "hairHtml = ``"
$content = $content -replace "backHairHtml = \\", "backHairHtml = ``"
$content = $content -replace "eyesHtml = \\", "eyesHtml = ``"
$content = $content -replace "mouthHtml = \\", "mouthHtml = ``"
$content = $content -replace "Z\`";", "Z``;"
$content = $content -replace "}\`;", "}``;"

# Implement Phase C: Clothing Redesign
$clothingStartStr = "        // 8. Clothing & Vietnamese Theme (V5)"
$clothingEndStr = "        // 8. Tattoos / Merit Details"

$startIndex = $content.IndexOf($clothingStartStr)
$endIndex = $content.IndexOf($clothingEndStr)

if ($startIndex -ne -1 -and $endIndex -ne -1) {
    $v7ClothingBlock = @"
        // 8. Clothing Overhaul (V7 MEGA - 10 ITEMS)
        let topHtml = '', bottomHtml = '';
        const ts = c.topStyle;
        const bs = c.bottomStyle;
        const topCol = c.topColor || '#e83e8c';
        const botCol = c.bottomColor || '#3b82f6';

        // --- TOPS ---
        if (ts === 1) { // 🧥 Cyber Hoodie
            topHtml = \`
                <path d="M 80 110 L 120 110 L 125 155 L 75 155 Z" fill="\${topCol}" />
                <path d="M 95 110 L 100 135 L 105 110" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2" />
                <path d="M 75 115 Q 100 100 125 115" fill="none" stroke="\${topCol}" stroke-width="8" stroke-linecap="round" />\`;
        } else if (ts === 2) { // 👘 Neo-Kimono
            topHtml = \`
                <path d="M 80 110 L 120 110 L 130 160 L 70 160 Z" fill="\${topCol}" />
                <path d="M 80 110 L 100 140 L 120 110" fill="none" stroke="#fff" stroke-width="2" />
                <rect x="85" y="135" width="30" height="8" fill="#111" />\`;
        } else if (ts === 3) { // 🦺 Tactical Vest
            topHtml = \`
                <path d="M 82 110 L 118 110 L 122 150 L 78 150 Z" fill="#1e293b" />
                <rect x="85" y="115" width="12" height="10" rx="2" fill="\${topCol}" />
                <rect x="103" y="115" width="12" height="10" rx="2" fill="\${topCol}" />
                <path d="M 100 110 L 100 150" stroke="rgba(255,255,255,0.2)" stroke-width="1" />\`;
        } else if (ts === 4) { // 🐉 Imperial Robe
            topHtml = \`
                <g filter="url(#glowStrong)">
                    <path d="M 75 110 L 125 110 L 135 175 L 65 175 Z" fill="\${topCol}" />
                    <circle cx="100" cy="135" r="10" fill="none" stroke="#fbbf24" stroke-width="1.5" opacity="0.6" />
                    <path d="M 90 135 Q 100 125 110 135" stroke="#fbbf24" fill="none" />
                </g>\`;
        } else if (ts === 7) { // 🇻🇳 Áo Dài (V7)
            topHtml = \`
                <path d="M 85 110 L 115 110 L 125 180 Q 100 185 75 180 Z" fill="\${topCol}" />
                <path d="M 92 106 Q 100 103 108 106 L 110 110 Q 100 108 90 110 Z" fill="\${topCol}" stroke="rgba(0,0,0,0.1)" />\`;
        } else { // Plain Tee
            topHtml = \`<path d="M 82 110 L 118 110 L 120 145 L 80 145 Z" fill="\${topCol}" />\`;
        }

        // --- BOTTOMS ---
        if (bs === 1) { // 👖 Tech-Joggers
            bottomHtml = \`
                <path d="M 85 145 L 115 145 L 118 185 L 82 185 Z" fill="\${botCol}" />
                <rect x="80" y="160" width="8" height="12" rx="2" fill="#1e293b" />
                <rect x="112" y="160" width="8" height="12" rx="2" fill="#1e293b" />\`;
        } else if (bs === 2) { // 👘 Samurai Skirt / Hakama
            bottomHtml = \`
                <path d="M 75 145 L 125 145 L 135 185 L 65 185 Z" fill="\${botCol}" />
                <path d="M 90 145 L 85 185 M 100 145 L 100 185 M 110 145 L 115 185" stroke="rgba(0,0,0,0.15)" stroke-width="1.5" />\`;
        } else if (bs === 3) { // 🩳 Shorts + Leggings
            bottomHtml = \`
                <path d="M 85 165 L 115 165 L 115 185 L 85 185 Z" fill="#111" />
                <path d="M 82 145 L 118 145 L 120 165 L 80 165 Z" fill="\${botCol}" />\`;
        } else if (bs === 4) { // ✨ Glitch Pants
            bottomHtml = \`
                <path d="M 85 145 L 115 145 L 118 185 L 82 185 Z" fill="\${botCol}" />
                <rect x="80" y="170" width="40" height="2" fill="#00f3ff" opacity="0.6" />\`;
        } else { // Standard Jeans
            bottomHtml = \`<path d="M 85 145 L 115 145 L 118 185 L 82 185 Z" fill="\${botCol}" />\`;
        }
"@
    $content = $content.Substring(0, $startIndex) + $v7ClothingBlock + $content.Substring($endIndex)
}

[System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
Write-Output "Successfully applied Phase C and fixed escaping in chibi.js."
