@echo off
REM ============================================================
REM TNSVT - Cron worker para torneos
REM Inicia el auto-close de torneos en background.
REM Cierra y distribuye premios automaticamente cada 60s.
REM ============================================================

setlocal

cd /d "%~dp0"

if not exist "var\log" mkdir "var\log"

REM Matar instancia previa si existe
echo Matando instancia previa del cron...
powershell -NoProfile -Command "Get-Process -Name php -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like '*tournaments:process*watch*' } | Stop-Process -Force" 2>nul
timeout /t 1 /nobreak >nul

REM Iniciar el cron en background
echo.
echo Iniciando tournaments:process --watch en background...
powershell -NoProfile -Command ^
    "Start-Process -FilePath 'php' -ArgumentList 'bin/console','tournaments:process','--watch' -WorkingDirectory '%CD%' -RedirectStandardOutput '%CD%\var\log\tournaments.log' -RedirectStandardError '%CD%\var\log\tournaments.err.log' -WindowStyle Hidden -PassThru | Select-Object Id | Format-Table -AutoSize | Out-String | Write-Host"

timeout /t 1 /nobreak >nul

REM Verificar que arranco
echo.
echo Verificando que arranco...
powershell -NoProfile -Command ^
    "$p = Get-Process -Name php -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like '*tournaments:process*watch*' }; if ($p) { Write-Host ('   OK - cron corriendo (PID ' + $p[0].Id + ')') -ForegroundColor Green } else { Write-Host '   ERROR - cron no arranco' -ForegroundColor Red; exit 1 }"

echo.
echo ============================================================
echo  tournaments:process --watch corriendo en background.
echo  Log: var\log\tournaments.log
echo  Err: var\log\tournaments.err.log
echo.
echo  Para detenerlo: stop_cron.bat
echo  Para ver logs: tail var\log\tournaments.log
echo ============================================================
echo.

endlocal
