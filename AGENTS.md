# TNSVT Session Summary

## Commands
- **Start server**: `cd C:\Users\HP 240 inch G9\tnsvt-symfony && php -S 192.168.1.2:8000 -t public`
- **Build game APK**: `cd game-app\android && gradlew.bat assembleDebug`
- **Build web APK**: `cd android && gradlew.bat assembleDebug` (needs JAVA_HOME=C:\dev\jdk\jdk-21\jdk-21.0.7+6)
- **Install via ADB**: `adb install -r path\to\app-debug.apk`
- **Sync capacitor**: `npx cap sync android` (needs PATH with nodejs)

## This Session (2026-06-17/18)
### Commits
- `25afc7c` Stage 8.1+8.3: Email notifications, sticky perfil, auto-update
- `2d00630` Stage 8.2: MercadoPago Argentina integration
- `ad65fa0` Phase 3: Binance Pay integration
- `3ddc8eb` FCM Push Notifications backend
- `2222fff` FCM v1: service account JSON OAuth2
- `5569672` FCM frontend: plugin + token register
- `20ca3e5` Moved MP/Binance/FCM to game-app/www/index.html
- `46cc221` Reverted web app base.html.twig + app.js to baseline

### What was done
- MercadoPago Service + Controller + Webhook
- Binance Pay Service + Controller + Webhook
- FCM Push Notifications (v1 API con service account)
- Email notifications (TournamentMailer + Twig)
- Auto-update endpoint (/api/app/version)
- Sticky Perfil hero+stats (game-app)
- All frontend features added to game-app/www/index.html (NOT to web templates)

### Files changed
- Game app: `game-app/www/index.html` (MP/Binance buttons + modals + FCM push)
- Backend: `src/Service/MercadoPagoService.php`, `src/Service/BinancePayService.php`, `src/Service/PushNotificationService.php`
- Backend: `src/Controller/Api/MercadoPagoController.php`, `src/Controller/Api/BinancePayController.php`
- Backend: `src/Service/TournamentMailer.php` (added push notifications)
- Backend: `src/Controller/Api/AdminWalletController.php` (added push on credit)
- Config: `.env` (MP, Binance, FCM vars)

### Connected devices
- Z Fold 6: `RFCXA0HZXFZ`

### Key addresses
- Server: `http://192.168.1.2:8000`
- GitHub: `https://github.com/federicocasal73-gif/tnsvt-symfony`

### Notes
- Game app uses Capacitor v6, web app uses Capacitor v8
- JDK 21 at `C:\dev\jdk\jdk-21\jdk-21.0.7+6`
- Service account JSON at `android/app/juego-app-store-trading-firebase-adminsdk-fbsvc-81993dce61.json`
- google-services.json package name: `T.N.S.V.TMarketInstic`
- Firebase project: `juego-app-store-trading`
