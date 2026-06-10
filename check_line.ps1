$raw = [System.IO.File]::ReadAllBytes('C:\Users\Admin\Desktop\taichinh1\js\games.js')
$text = [System.Text.Encoding]::UTF8.GetString($raw)
$lines = $text -split "`n"
Write-Host "=== Line 2372 ==="
Write-Host $lines[2371]
Write-Host ""
Write-Host "=== Hex of line 2372 ==="
$lineBytes = [System.Text.Encoding]::UTF8.GetBytes($lines[2371])
$hexParts = @()
foreach ($b in $lineBytes) {
    $hexParts += ('{0:X2}' -f $b)
}
Write-Host ($hexParts -join ' ')
