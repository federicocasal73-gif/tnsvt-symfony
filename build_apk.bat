@echo off
REM ========================================
REM TNSVT - Build APK
REM ========================================
setlocal

set "PROJECT_DIR=%~dp0"
set "ANDROID_HOME=C:\dev\android-sdk"
set "JAVA_HOME=C:\Program Files\Zulu\zulu-21"
set "PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\cmdline-tools\latest\bin;%ANDROID_HOME%\platform-tools;C:\Program Files\nodejs;%PATH%"

echo ========================================
echo   TNSVT - Build APK
echo ========================================
echo.

REM 1. Compilar assets
echo [1/3] Compilando assets Symfony...
php bin\console asset-map:compile
if %ERRORLEVEL% NEQ 0 goto :error

REM 2. Sync Capacitor
echo.
echo [2/3] Sincronizando web a Android...
call npx cap sync android
if %ERRORLEVEL% NEQ 0 goto :error

REM 3. Build APK
echo.
echo [3/3] Compilando APK debug...
cd android
call gradlew.bat assembleDebug --no-daemon
if %ERRORLEVEL% NEQ 0 goto :error

echo.
echo ========================================
echo   BUILD EXITOSO
echo ========================================
echo.
echo APK en: android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo Para instalar en el celular:
echo   1. Habilita "Instalar apps de origenes desconocidos" en Android
echo   2. Pasa el APK al celular (USB, Drive, WhatsApp)
echo   3. Toca el APK para instalar
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
