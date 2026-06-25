# TNSVT Session Summary

## Documentación
- `docs/arquitectura.md` / `docs/arquitectura.pdf` — Arquitectura técnica completa y guía de hosting (Jun 2026, 17 secciones, ~42 páginas).

## Commands
- **Start server**: `cd C:\Users\HP 240 inch G9\tnsvt-symfony && php -S 192.168.1.2:8000 -t public`
- **Build game APK**: `cd game-app\android && gradlew.bat assembleDebug`
- **Build web APK**: `cd android && gradlew.bat assembleDebug` (needs JAVA_HOME=C:\dev\jdk\jdk-21\jdk-21.0.7+6)
- **Install via ADB**: `adb install -r path\to\app-debug.apk`
- **Sync capacitor**: `npx cap sync android` (needs PATH with nodejs)

## This Session (2026-06-24/25)
### Commits
- (pending) 1v1 Duel mode: Duel + DuelRound entities, DuelController, WalletTransaction duel constants

### What was done
- Created `Duel` entity (`src/Entity/Duel.php`) with fields: code, player1, player2, winner, entryFee, prizePool, totalRounds, currentRound, player1Pnl, player2Pnl, startingPrice, status, timestamps, rounds OneToMany
- Created `DuelRound` entity (`src/Entity/DuelRound.php`) with fields: roundNumber, player1Move, player2Move, open/close/high/low prices, player1Pnl, player2Pnl, computed `computePnl()` and `isBothPlayed()` helpers
- Created `DuelRepository` and `DuelRoundRepository`
- Added WalletTransaction constants: `TYPE_DUEL_ENTRY`, `TYPE_DUEL_WIN`, `TYPE_DUEL_REFUND`
- Created `DuelController` (`src/Controller/Api/DuelController.php`) with routes:
  - `GET /api/duels` — list waiting duels + my active duels
  - `POST /api/duels/create` — create a duel (host sets entry_fee, total_rounds)
  - `POST /api/duels/join` — join a waiting duel by code
  - `GET /api/duels/{id}` — get duel details + rounds (players only)
  - `POST /api/duels/{id}/next-round` — host creates a new candle for current round
  - `POST /api/duels/{id}/play` — player submits move (long/short/skip)
  - `POST /api/duels/{id}/cancel` — host cancels a waiting duel
- Auth via `X-Game-Code` header (same as other game endpoints)
- PnL computed per round: `(close-open)/open * 100 * direction`
- Winner receives prize pool; ties split equally
- Migration `Version20260625021044` creates `duels` and `duel_rounds` tables
- Full flow tested end-to-end: create → join → next-round (3x) → play → finish → winner declared

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
- GitHub web: `https://github.com/federicocasal73-gif/-federicocasal73-gif-tnsvt-symfony` (privado, NUEVO, funcional)
- GitHub game: `https://github.com/federicocasal73-gif/tnsvt-market-instinct` (privado, funcional)

### Live Chart (Academia) - NUEVO 2026-06-21
- Reemplaza widget TradingView con chart canvas propio T.N.S.V.T
- Endpoint: `GET /api/market/candles?symbol=X&interval=Y&limit=Z`
  - Source: Binance public API (`api.binance.com/api/v3/klines`) + fallback random walk
  - Symbols: BTCUSDT, ETHUSDT, EURUSDT, GBPUSD, USDJPY, XAUUSD
  - Intervals: 1m, 5m, 15m, 30m, 1h, 4h, 1d
- Endpoint: `GET /api/market/symbols`
- Frontend: `initTradingViewWeb()` en `assets/app.js` (canvas DPR-aware, header OHLCV, auto-refresh 10s)
- Cache-bust: `?v=2.2`, SW `tnsvt-v34`

### Notas
- Game app uses Capacitor v6, web app uses Capacitor v8
- JDK 21 at `C:\dev\jdk\jdk-21\jdk-21.0.7+6`
- Service account JSON at `android/app/juego-app-store-trading-firebase-adminsdk-fbsvc-81993dce61.json`
- google-services.json package name: `T.N.S.V.TMarketInstic`
- **Push con HTTP 500**: cuando el repo tiene historial con archivos grandes (bundle 2.21 GB), usar `git push --force --thin` para enviar solo los objetos nuevos
- **Bundle backup**: `/_backup/tnsvt-symfony-FULL.bundle` (ignorado por .gitignore) - respaldo para clonar si se pierde el .git
- **APK web v1.6.0**: `public/downloads/tnsvt-app.apk` (134 MB) + `public/apk/tnsvt-v1.6.0.apk`
- **APK game v1.2.0**: `public/downloads/tnsvt-market-instinct.apk` (5.22 MB)
- Firebase project: `juego-app-store-trading`

## Fase 4 — Mercure Tiempo Real (2026-06-21)
- **MercureStreamCommand**: `mercure:stream-candles` — daemon que cada 3s fetch + publica velas 15m a Mercure
- **RealtimePublisher**: servicio que envía updates al hub Mercure via POST
- **MercureSubscriberService**: genera JWT de suscriptor + cookie `mercureAuthorization`
- **MercureController**: `GET /api/mercure/subscribe?exchange=X&symbol=Y` devuelve URL + setea cookie
- **chart.js**: conecta EventSource a Mercure, recibe velas en tiempo real, polling cae a 15s y a 5s si Mercure no conecta
- **Drawing toolbar funcional** con trendline, hline, vline, fib, rect, text, undo, clear
- **Docker**: `docker-compose.yml` para levantar Mercure hub local
- **Script**: `.\run-mercure.ps1` inicia/para el hub
- **Cache**: bump a v=2.5
- Para arrancar todo: `cd C:\Users\HP 240 inch G9\tnsvt-symfony && php -S 192.168.1.2:8000 -t public` + `.\run-mercure.ps1` (otra terminal)
