$serverDir = "C:\Users\HP 240 inch G9\Documents\TNSVT-WORK\tnsvt-symfony"
$serverPort = 8000

# Kill any existing PHP on our port
Get-Process -Name php -ErrorAction SilentlyContinue | Where-Object {
    try { (Get-NetTCPConnection -LocalPort $serverPort -OwningProcess $_.Id -ErrorAction Stop) -ne $null } catch { $false }
} | Stop-Process -Force -ErrorAction SilentlyContinue

Start-Sleep 1

# Start PHP dev server in background
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "php"
$psi.Arguments = "-S 127.0.0.1:$serverPort -t `"$serverDir\public`""
$psi.WorkingDirectory = $serverDir
$psi.CreateNoWindow = $true
$psi.UseShellExecute = $false
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$p = [System.Diagnostics.Process]::Start($psi)

Write-Output "PHP server started (PID $($p.Id)) on 127.0.0.1:$serverPort"

# Quick test
Start-Sleep 2
try {
    $r = Invoke-WebRequest -Uri "http://127.0.0.1:$serverPort/" -TimeoutSec 5 -UseBasicParsing
    Write-Output "Server OK ($($r.StatusCode))"
} catch {
    Write-Output "Server not responding yet"
}
