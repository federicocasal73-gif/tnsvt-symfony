@echo off
REM Detiene el cron de torneos

powershell -NoProfile -Command "Get-Process -Name php -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like '*tournaments:process*watch*' } | Stop-Process -Force" 2>nul

echo Cron de torneos detenido.
endlocal
