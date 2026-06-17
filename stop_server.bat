@echo off
REM ============================================================
REM TNSVT - Stop server
REM Mata el proceso PHP escuchando en :8000
REM ============================================================

echo.
echo Deteniendo TNSVT server (puerto 8000)...

powershell -NoProfile -Command ^
    "$pids = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { (Get-Process -Id \$_.OwningProcess).Id }; if (\$pids) { foreach (\$id in \$pids) { Stop-Process -Id \$id -Force -ErrorAction SilentlyContinue; Write-Host ('   Matado PID ' + \$id) -ForegroundColor Yellow } } else { Write-Host '   No hay server corriendo en :8000' -ForegroundColor Gray }"

echo.
echo Listo.
echo.
