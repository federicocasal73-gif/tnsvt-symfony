@echo off
REM ============================================================
REM T.N.S.V.T Market Instinct — Build script
REM Compila el APK release firmado del juego
REM Uso: build_game_apk.bat
REM ============================================================

setlocal enabledelayedexpansion

echo.
echo ============================================================
echo  T.N.S.V.T MARKET INSTINCT - BUILD APK
echo ============================================================
echo.

REM --- Configurar entorno ---
set "PROJECT_DIR=%~dp0.."
set "PROJECT_DIR=%PROJECT_DIR:~0,-1%"
set "JAVA_HOME=C:\dev\jdk\jdk-17.0.11+9"
set "ANDROID_HOME=C:\dev\android-sdk"
set "ANDROID_SDK_ROOT=C:\dev\android-sdk"
set "PATH=C:\Program Files\nodejs;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\build-tools\34.0.0;%JAVA_HOME%\bin;%PATH%"

cd /d "%PROJECT_DIR%\game-app"

echo [1/6] Verificando entorno...
where java >nul 2>&1
if errorlevel 1 (
    echo ERROR: java no encontrado en %JAVA_HOME%
    exit /b 1
)
where node >nul 2>&1
if errorlevel 1 (
    echo ERROR: node no encontrado
    exit /b 1
)
if not exist "%ANDROID_HOME%\platform-tools\adb.exe" (
    echo ERROR: Android SDK no encontrado en %ANDROID_HOME%
    exit /b 1
)
echo    Java:    OK
echo    Node:    OK
echo    Android: OK

echo.
echo [2/6] Sincronizando web assets con Android...
call npx cap sync android
if errorlevel 1 (
    echo ERROR: cap sync fallo
    exit /b 1
)

echo.
echo [3/6] Compilando APK release...
cd android
call gradlew.bat assembleRelease
if errorlevel 1 (
    echo ERROR: gradle build fallo
    exit /b 1
)

echo.
echo [4/6] Verificando firma del APK...
set "APK_PATH=app\build\outputs\apk\release\app-release.apk"
if not exist "%APK_PATH%" (
    echo ERROR: APK no generado
    exit /b 1
)
call apksigner verify --print-certs "%APK_PATH%" 2>nul | findstr "Verified"
if errorlevel 1 (
    echo ERROR: APK no firmado correctamente
    exit /b 1
)

echo.
echo [5/6] Extrayendo version del APK...
for /f "tokens=2 delims==" %%v in ('aapt dump badging "%APK_PATH%" 2^>nul ^| findstr "package:"') do (
    set "PKG_INFO=%%v"
)
echo    %PKG_INFO%

echo.
echo [6/6] Copiando APK a Downloads...
set "DL_PATH=%USERPROFILE%\Downloads\tnsvt-market-instinct-v1.0.0.apk"
copy /Y "%APK_PATH%" "%DL_PATH%" >nul
if errorlevel 1 (
    echo ERROR: No se pudo copiar a Downloads
    exit /b 1
)
echo    Copiado a: %DL_PATH%

REM Tamano
for %%A in ("%DL_PATH%") do echo    Tamano: %%~zA bytes

REM SHA-256
echo    SHA-256:
certutil -hashfile "%DL_PATH%" SHA256 2>nul | findstr /v "hash CertUtil" | findstr /v "^$"

echo.
echo ============================================================
echo  BUILD COMPLETO
echo ============================================================
echo.
echo  APK firmado: %DL_PATH%
echo.
echo  Para instalar en el cell:
echo    adb install -r "%DL_PATH%"
echo.
echo  O copialo a /tnsvt-symfony/public/downloads/ para distribuir:
echo    copy /Y "%DL_PATH%" "..\public\downloads\tnsvt-market-instinct.apk"
echo.

endlocal
