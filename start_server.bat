@echo off
REM ============================================================
REM TNSVT - Server starter
REM Levanta php -S 0.0.0.0:8000 en background, accesible en:
REM   - localhost:8000  (solo esta PC)
REM   - 192.168.x.x:8000  (LAN de tu casa)
REM   - 100.x.y.z:8000  (Tailscale - celular y amigos en tu tailnet)
REM ============================================================

setlocal

REM Ir a la raiz del proyecto
cd /d "%~dp0"

REM 1. Matar cualquier instancia previa de PHP corriendo en :8000
echo.
echo [1/4] Matando instancias previas de PHP...
for /f "tokens=*" %%i in ('powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { (Get-Process -Id \$_.OwningProcess).Id }" 2^>nul') do (
    echo   - Matando PID %%i
    powershell -NoProfile -Command "Stop-Process -Id %%i -Force -ErrorAction SilentlyContinue" 2>nul
)

REM 2. Crear directorio de logs si no existe
if not exist "var\log" mkdir "var\log"

REM 3. Levantar el server en background via PowerShell
echo.
echo [2/4] Iniciando PHP server en background...
powershell -NoProfile -Command ^
    "Start-Process -FilePath 'php' -ArgumentList '-S','0.0.0.0:8000','-t','public' -WorkingDirectory '%CD%' -RedirectStandardOutput '%CD%\var\log\server.log' -RedirectStandardError '%CD%\var\log\server.err.log' -WindowStyle Hidden -PassThru | Select-Object Id, ProcessName | Format-Table -AutoSize | Out-String | Write-Host"

REM 4. Esperar 2 segundos y verificar que arrancó
echo.
echo [3/4] Verificando que el server arranco...
timeout /t 2 /nobreak >nul
powershell -NoProfile -Command ^
    "if (Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue) { Write-Host '   OK - server escuchando en :8000' -ForegroundColor Green } else { Write-Host '   ERROR - server no arranco, revisa var\log\server.err.log' -ForegroundColor Red; exit 1 }"

REM 5. Detectar IPs y mostrar URLs disponibles
echo.
echo [4/4] URLs disponibles:
echo   - http://localhost:8000  (local)
powershell -NoProfile -Command "Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '169.254.*' -and $_.IPAddress -ne '127.0.0.1' } | ForEach-Object { Write-Host ('   - http://' + $_.IPAddress + ':8000  (LAN/Tailscale)') }"
powershell -NoProfile -Command "try { \$ts = & 'C:\Program Files\Tailscale\tailscale.exe' ip 2>\$null | Select-Object -First 1; if (\$ts) { Write-Host ('   Tailscale IP: ' + \$ts) -ForegroundColor Yellow } } catch {}"

echo.
echo ============================================================
echo  Server TNSVT corriendo en background.
echo  Log:  var\log\server.log
echo  Err:  var\log\server.err.log
echo.
echo  Para detenerlo: stop_server.bat
echo  Para ver logs en vivo: tail_logs.bat
echo ============================================================
echo.

endlocal
