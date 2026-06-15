@echo off
setlocal
cd /d C:\Users\HP 240 inch G9\tnsvt-symfony
set PHP_EXE="C:\Users\HP 240 inch G9\AppData\Local\Microsoft\WinGet\Packages\PHP.PHP.8.4_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe"

echo ============================================
echo   T.N.S.V.T - INICIANDO SERVIDOR
echo ============================================

REM 1) Compilar assets (CSS + JS bundleados)
echo [1/2] Compilando assets del frontend...
%PHP_EXE% bin/console asset-map:compile --env=dev
if errorlevel 1 (
    echo [WARN] asset-map:compile fallo - los assets pueden estar desactualizados.
    echo         La pagina puede no cargar CSS/JS hasta que lo arregles.
)

REM 2) Limpiar cache (opcional pero util en dev)
echo [2/2] Limpiando cache de Symfony...
%PHP_EXE% bin/console cache:clear --env=dev >nul 2>&1

echo.
echo ============================================
echo   Servidor listo en http://localhost:8000
echo   PHP: %PHP_EXE%
echo   Para frenar: cerra esta ventana o Ctrl+C
echo ============================================
echo.

REM 3) Levantar el server PHP
%PHP_EXE% -S 0.0.0.0:8000 -t "C:\Users\HP 240 inch G9\tnsvt-symfony\public" "C:\Users\HP 240 inch G9\tnsvt-symfony\public\router.php"
