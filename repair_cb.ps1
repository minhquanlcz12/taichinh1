$path = "C:\Users\Admin\Desktop\taichinh1\js\chibi.js"
$bt = [char]96
$content = Get-Content -Path $path -Raw

Write-Host "Repairing $path..."

# Fix the style attribute corruption in builder
$content = $content -replace 'style="background: \${col}";(?:\s+width: 22px; height: 22px;")?', "style=`"background: `${col}; width: 22px; height: 22px;`""
$content = $content -replace 'style="background: \${col}`;', "style=`"background: `${col};`""

# Fix stray backticks in ChibiModule.currentConfig
$content = $content -replace '\};\s*`\s*;', "};"
$content = $content -replace '}\s*`\s*;', "};"

# Fix the return block in renderChibiSVG (simplified)
# We know it starts with return ` and ends with }; before the next function.
$startMarker = "        return `"
$endMarker = "    },"
$startIdx = $content.IndexOf($startMarker)
if ($startIdx -ge 0) {
    # We will just fix the backticks in this area instead of replacing the whole block
}

# Perform broad backtick repair (backslash-backtick to backtick)
$content = $content.Replace("\$bt", "$bt")

Set-Content -Path $path -Value $content -NoNewline -Encoding UTF8
Write-Host "Done."
