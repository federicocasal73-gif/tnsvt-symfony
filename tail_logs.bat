@echo off
REM ============================================================
REM TNSVT - Tail logs
REM Muestra los logs del server en vivo (Ctrl+C para salir)
REM ============================================================

setlocal
cd /d "%~dp0"

if not exist "var\log\server.log" (
    echo No hay log todavia. Inicia el server con start_server.bat primero.
    exit /b 1
)

echo.
echo Siguiendo var\log\server.log (Ctrl+C para salir)
echo ============================================================
echo.

powershell -NoProfile -Command "Get-Content '%CD%\var\log\server.log' -Wait -Tail 50"
