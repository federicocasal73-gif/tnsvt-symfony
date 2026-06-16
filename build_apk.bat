@echo off
REM ========================================
REM TNSVT - Build APK (debug o release)
REM Uso: build_apk.bat [debug^|release]
REM Default: debug
REM ========================================
setlocal

set "BUILD_TYPE=%1"
if "%BUILD_TYPE%"=="" set "BUILD_TYPE=debug"

set "PROJECT_DIR=%~dp0"
set "ANDROID_HOME=C:\dev\android-sdk"
set "JAVA_HOME=C:\Program Files\Zulu\zulu-21"
set "PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\cmdline-tools\latest\bin;%ANDROID_HOME%\platform-tools;C:\Program Files\nodejs;%PATH%"

echo ========================================
echo   TNSVT - Build APK (%BUILD_TYPE%)
echo ========================================
echo.

REM 1. Compilar assets
echo [1/4] Compilando assets Symfony...
php bin\console asset-map:compile
if %ERRORLEVEL% NEQ 0 goto :error

REM 2. Sync Capacitor
echo.
echo [2/4] Sincronizando web a Android...
call npx cap sync android
if %ERRORLEVEL% NEQ 0 goto :error

REM 3. Limpiar assets viejos del APK (despues del sync)
echo.
echo [3/4] Limpiando assets viejos del APK Android...
set "ASSET_DIR=android\app\src\main\assets\public\assets"
if exist "%ASSET_DIR%" (
    REM Solo dejar el archivo app-*.js mas reciente y el styles/app-*.css mas reciente
    for /f "delims=" %%f in ('dir /b /od "%ASSET_DIR%\app-*.js" 2^>nul') do set "NEWEST_APP=%%f"
    for /f "delims=" %%f in ('dir /b /od "%ASSET_DIR%\api-*.js" 2^>nul') do set "NEWEST_API=%%f"
    for /f "delims=" %%f in ('dir /b /od "%ASSET_DIR%\styles\app-*.css" 2^>nul') do set "NEWEST_CSS=%%f"
    for /f "delims=" %%f in ('dir /b "%ASSET_DIR%\app-*.js" 2^>nul ^| findstr /v /b "%NEWEST_APP%"') do del /q "%ASSET_DIR%\%%f" 2>nul
    for /f "delims=" %%f in ('dir /b "%ASSET_DIR%\api-*.js" 2^>nul ^| findstr /v /b "%NEWEST_API%"') do del /q "%ASSET_DIR%\%%f" 2>nul
    REM CSS: solo dejar el mas reciente
    for /f "delims=" %%f in ('dir /b "%ASSET_DIR%\styles\app-*.css" 2^>nul ^| findstr /v /b "%NEWEST_CSS%"') do del /q "%ASSET_DIR%\styles\%%f" 2>nul
    echo   OK
) else (
    echo   No hay assets previos
)

REM 4. Build APK
echo.
echo [4/4] Compilando APK %BUILD_TYPE%...
cd android
call gradlew.bat assemble%BUILD_TYPE:~0,1%%BUILD_TYPE:~1% --no-daemon
if %ERRORLEVEL% NEQ 0 goto :error

echo.
echo ========================================
echo   BUILD EXITOSO
echo ========================================
echo.
echo APK en: android\app\build\outputs\apk\%BUILD_TYPE%\app-%BUILD_TYPE%.apk
echo.
goto :end

:error
echo.
echo ========================================
echo   BUILD FALLIDO
echo ========================================
echo.

:end
endlocal
pause

