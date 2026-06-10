$path = "C:\Users\Admin\Desktop\taichinh1\js\chibi.js"
$lines = Get-Content -Path $path -Encoding UTF8

# Find anchors for Gear and Mount sections
$gearStartLine = -1
$mountEndLine = -1

for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match "// 10. Gear Layer") {
        $gearStartLine = $i
    }
    if ($lines[$i] -match "// 12. Sparkles") {
        $mountEndLine = $i
        break
    }
}

if ($gearStartLine -eq -1 -or $mountEndLine -eq -1) {
    Write-Error "Could not find Gear/Mount delimiters"
    exit 1
}

$v8GearMountBlock = @"
        // 10. Gear Layer (V8 LEGENDARY ARSENAL - HIGH FIDELITY)
        let gearHtml = '';
        const g = c.gear;
        if (g === 1) { // ⚔️ Greatsword of Eternity
            gearHtml = \`
                <g class="\${isD ? 'chibi-arm-right-dance' : ''}" filter="url(#glowStrong)">
                    <g transform="translate(132, 110) rotate(15)">
                        <path d="M -8 -85 L 8 -85 L 14 0 L -14 0 Z" fill="url(#bladeSteel)" stroke="#1e293b" stroke-width="1.5"/>
                        <path d="M 0 -80 L 0 -10" stroke="#3b82f6" stroke-width="2" stroke-dasharray="4 2" style="animation: glowPulse 1s infinite;"/>
                        <rect x="-18" y="0" width="36" height="10" rx="4" fill="#0f172a" stroke="#3b82f6"/>
                        <rect x="-5" y="10" width="10" height="35" rx="3" fill="#1e293b"/>
                        <circle cx="0" cy="45" r="6" fill="#3b82f6" style="animation: glowPulse 1.5s infinite;"/>
                    </g>
                </g>\`;
        } else if (g === 4) { // 🔱 Royal Trident of Atlantis
            gearHtml = \`
                <g class="\${isD ? 'chibi-arm-right-dance' : ''}">
                    <g transform="translate(132, 90)">
                        <rect x="-3" y="-60" width="6" height="150" fill="#fbbf24" stroke="#92400e"/>
                        <path d="M -20 -70 Q -10 -100 0 -70 Q 10 -100 20 -70 L 20 -50 Q 0 -60 -20 -50 Z" fill="#60a5fa" stroke="#fff" filter="url(#glowNeon)"/>
                        <path d="M 0 -100 L 0 -60" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
                    </g>
                </g>\`;
        } else if (g === 5) { // 🌸 Golden Lotus Staff
            gearHtml = \`
                <g class="\${isD ? 'chibi-arm-right-dance' : ''}">
                    <g transform="translate(132, 100)">
                        <rect x="-3" y="-50" width="6" height="140" fill="#78350f" rx="3"/>
                        <g transform="translate(0, -60)" filter="url(#glowStrong)">
                            <path d="M -15 0 C -15 -25 0 -35 0 -35 C 0 -35 15 -25 15 0 Z" fill="#fbbf24" />
                            <circle r="8" fill="#fef08a" style="animation: glowPulse 1s infinite;"/>
                        </g>
                    </g>
                </g>\`;
        } else if (g === 12) { // 💀 Void Scythe
            gearHtml = \`
                <g class="\${isD ? 'chibi-arm-right-dance' : ''}" filter="url(#glowStrong)">
                     <g transform="translate(132, 40)">
                         <rect x="-3" y="0" width="6" height="160" fill="#111" stroke="#a855f7" stroke-width="1.5" rx="3"/>
                         <path d="M 0 10 Q 60 20 80 80 L 70 85 Q 50 40 0 30 Z" fill="#2e1065" stroke="#a855f7" stroke-width="2" transform="rotate(-15)"/>
                         <circle cx="0" cy="10" r="10" fill="#111" stroke="#a855f7"/>
                     </g>
                </g>\`;
        } else { // Standard Hero Sword
            gearHtml = \`
                <g class="\${isD ? 'chibi-arm-right-dance' : ''}">
                    <path d="M 132 120 L 132 40 L 140 35 L 140 120 Z" fill="url(#bladeSteel)" stroke="#475569"/>
                    <rect x="125" y="110" width="20" height="6" rx="2" fill="#1e293b"/>
                </g>\`;
        }

        // 11. Mount Layer (V8 HIGH-IMPACT RIDES)
        let mountHtml = '';
        const m = c.mount;
        if (m === 1) { // 🏎️ Cyber-Speedster X1
            mountHtml = \`
                <g style="filter: drop-shadow(0 15px 30px rgba(0,0,0,0.8));">
                    <path d="M 10 185 Q 10 125 50 120 L 150 120 Q 190 125 190 185 Z" fill="#f8fafc" stroke="#3b82f6" stroke-width="3" />
                    <path d="M 60 125 L 80 95 L 120 95 L 140 125" fill="rgba(59, 130, 246, 0.4)" stroke="#3b82f6" />
                    <circle cx="45" cy="190" r="15" fill="#111" stroke="#3b82f6" stroke-width="4" />
                    <circle cx="155" cy="190" r="15" fill="#111" stroke="#3b82f6" stroke-width="4" />
                    <path d="M 20 190 L 180 190" stroke="#3b82f6" stroke-width="6" opacity="0.4" style="filter: blur(8px);"/>
                </g>\`;
        } else if (m === 2) { // 🏍️ Void-Cycle (Hubless)
            mountHtml = \`
                <g style="filter: drop-shadow(0 10px 20px rgba(168, 85, 247, 0.5));">
                    <circle cx="35" cy="180" r="28" fill="none" stroke="#a855f7" stroke-width="8" />
                    <circle cx="165" cy="180" r="28" fill="none" stroke="#a855f7" stroke-width="8" />
                    <path d="M 35 180 L 165 180 L 140 115 Q 100 105 60 115 Z" fill="#0f172a" stroke="#a855f7" stroke-width="2" />
                    <path d="M 65 130 L 135 130" stroke="#a855f7" stroke-width="4" style="animation: glowPulse 0.5s infinite alternate;"/>
                </g>\`;
        } else if (m === 4) { // 🐲 Neon Dragon Bike
            mountHtml = \`
                <g style="filter: drop-shadow(0 12px 25px rgba(0,0,0,0.7));">
                    <circle cx="40" cy="185" r="22" fill="#111" stroke="#ef4444" stroke-width="5" />
                    <circle cx="160" cy="185" r="22" fill="#111" stroke="#ef4444" stroke-width="5" />
                    <path d="M 30 185 Q 30 110 80 110 L 150 110 Q 180 110 180 185" fill="none" stroke="#1e293b" stroke-width="12" />
                    <g transform="translate(60, 100)">
                        <path d="M 0 0 Q -20 -20 -40 10 L -30 20 Q -10 -5 0 10 Z" fill="#ef4444" stroke="#991b1b" />
                        <circle cx="-25" cy="5" r="3" fill="#fff" style="animation: glowPulse 0.8s infinite;"/>
                    </g>
                </g>\`;
        } else if (m === 5) { // 🛹 Plasma Skateboard
            mountHtml = \`
                <g filter="url(#glowStrong)">
                    <path d="M 30 175 L 170 175 Q 185 175 185 185 L 15 185 Q 15 175 30 175" fill="#1e293b" stroke="#00f3ff" stroke-width="2" />
                    <rect x="50" y="185" width="20" height="15" fill="rgba(0, 243, 255, 0.6)" style="animation: fireDance 0.3s infinite;" />
                    <rect x="130" y="185" width="20" height="15" fill="rgba(0, 243, 255, 0.6)" style="animation: fireDance 0.3s infinite;" />
                    <path d="M 20 188 L 180 188" stroke="#00f3ff" stroke-width="10" opacity="0.3" style="filter: blur(10px);"/>
                </g>\`;
        }
"@

$finalLines = $lines[0..($gearStartLine-1)] + $v8GearMountBlock.Split("`r`n") + $lines[$mountEndLine..($lines.Count-1)]

[System.IO.File]::WriteAllLines($path, $finalLines, [System.Text.Encoding]::UTF8)
Write-Output "Successfully applied Chibi V8 Gear & Mounts via PowerShell."
