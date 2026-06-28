# TNSVT Session Summary

## Documentación
- `docs/arquitectura.md` / `docs/arquitectura.pdf` — Arquitectura técnica completa y guía de hosting (Jun 2026, 17 secciones, ~42 páginas).

## Commands
- **Start server**: `cd C:\Users\HP 240 inch G9\tnsvt-symfony && php -S 192.168.1.2:8000 -t public`
- **Build game APK**: `cd game-app\android && gradlew.bat assembleDebug`
- **Build web APK**: `cd android && gradlew.bat assembleDebug` (needs JAVA_HOME=C:\dev\jdk\jdk-21\jdk-21.0.7+6)
- **Install via ADB**: `adb install -r path\to\app-debug.apk`
- **Sync capacitor**: `npx cap sync android` (needs PATH with nodejs)

## Session 2026-06-24/25 — 1v1 Duel Backend + Game App fixes
### Commits (Symfony)
- `c350902` → `bff87cf` (rebased) — 1v1 Duel mode: entities, controller, API, wallet constants, migration

### Commits (Game App)
- `0e2705b` — Resume torneo button + removed bounty system + active flag

### Backend: 1v1 Duel Mode
- `Duel` entity: code, player1, player2, winner, entryFee, prizePool, totalRounds, currentRound, player1Pnl, player2Pnl, startingPrice, status, timestamps, rounds OneToMany
- `DuelRound` entity: roundNumber, player1Move, player2Move, OHLC prices, player1Pnl, player2Pnl, `computePnl()`, `isBothPlayed()`
- `DuelController` with 7 endpoints (list, create, join, get, next-round, play, cancel)
- Auth via `X-Game-Code` header
- PnL = `(close-open)/open * 100 * direction`, winner gets prize pool, ties split
- WalletTransaction constants: `TYPE_DUEL_ENTRY`, `TYPE_DUEL_WIN`, `TYPE_DUEL_REFUND`
- Migration `Version20260625021044` creates both tables
- **Tested end-to-end:** create → join → 3 rounds → PnL correcto → winner declared → finished status

### Game App Changes
- **Reanudar Torneo**: resume button in lobby, conditional on `torneoState.active`, `resumeTorneo()` restores game panel
- **Bounty removed**: deleted HTML row, `setBounty()`, `populateBountyTargets()`, bounty fields from state
- **LB button**: moved from bounty row to direction buttons area
- **active flag**: `torneoState.active = true` on `startTorneo()`, used to show resume button

### Game App — Torneo Trading Panel Integral (2026-06-25)
- Panel de trading del torneo reemplazado por el diseño completo del portfolio:
  asset selector, price card, size USD/%/unidades, leverage slider 1x-25x,
  SL/TP multímode, trailing stop, order preview con R:R
- SL/TP/trailing ahora se chequean contra **cada vela generada**, no solo contra el close final
- Asset seleccionable por el usuario (antes random)
- Commit: `934f8ae`

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

## Session 2026-06-27 — Journal Social System (Permissions + Connections)

### What was done
- **Trading Journal Social System**: complete permissions/connections/access system for social trading journal sharing.
- Permite a usuarios buscar otros usuarios, solicitar acceso al journal, aceptar/rechazar solicitudes, configurar permisos granulares (qué ver y qué no), y controlar la visibilidad del propio journal.

## Session 2026-06-28 — Architecture PDF + Release Notes
### Commits
- `9908a0e` — docs: add arquitectura PDF + release notes generator + opencode plans

### What was done
- **Arquitectura PDF**: `docs/arquitectura.pdf` generado (23 páginas, 41 KB) con `generate_architecture_pdf.py` (fpdf)
  - 15 secciones: resumen, arquitectura, stack, estructura, 26 entidades, 27 controladores, 7 servicios, frontend, APKs, pagos compartido, Mercure, FCM push, auth, DB/migraciones, roadmap
  - Diagramas ASCII, snippets de código, branding TNSVT (gold #d4af37, violet #8a3cff, dark #0a0712)
  - Énfasis en que MP y Binance Pay son backend **compartido** entre ambos APKs
- **Release notes PDF**: `docs/TNSVT-v1.6.3-release-notes.pdf` (9 páginas, sesión anterior)

### Key files
- `docs/arquitectura.pdf` - Documentación técnica de arquitectura
- `generate_architecture_pdf.py` - Script generador del PDF (Python + fpdf2)
- `generate_release_pdf.py` - Script generador de release notes

### 4 new entities + migrations
- `AccessRequest`: requester, target, status (pending/accepted/rejected)
- `Connection`: user, connected_user (bidirectional — 2 rows per connection)
- `JournalPermission`: grantor, grantee + 6 boolean permission flags (can_view_stats, can_view_trades, can_view_notes, can_view_comments, can_download_csv, can_view_realtime)
- `JournalSetting`: user, visibility (public/connections/private)
- Migration `Version20260627214623` applied

### API endpoints (SocialController)
- `POST /api/access-request` — send access request
- `GET /api/access-request` — list received/sent pending requests
- `PATCH /api/access-request/{id}` — accept/reject (creates bidirectional connections + default permissions on accept)
- `DELETE /api/access-request/{id}` — cancel own request
- `GET /api/access-status/{code}` — check relationship status (none/pending/connected/owner/received_pending)
- `GET /api/connections` — list connections
- `DELETE /api/connections/{id}` — remove connection (removes reverse connection + permissions)
- `POST /api/connections/{id}/block` — block connection
- `GET /api/permissions/{code}` — get permissions for a connected user
- `PATCH /api/permissions/{code}` — update permissions
- `GET /api/journal/settings` — get visibility setting
- `PATCH /api/journal/settings` — update visibility
- `GET /api/profile/{code}` — public profile

### JournalController modified
- `list`: 3 scopes — `owner` (full data), `connected` (filtered by permissions), `public` (stats-only)
- `create/update/delete`: ownership verification (403 if not owner)
- `export`: checks can_download_csv permission
- Added `getCurrentUser()` helper (X-Game-Code header or query/body param)
- Added `computeStats()` returning total, wins, losses, win_rate, total_pnl

### Frontend
- **Social tab** in sidebar (🔗 Social) between Academia and Chat
- Social badge on sidebar for pending access_request notifications
- **User search** by code (DEMO/ADMIN01)
- **Access requests panel**: received (accept/reject) + sent (pending badge)
- **Connections panel**: list with Permissions button + Remove
- **Permissions modal**: checkboxes for 6 permission flags
- **Privacy settings**: visibility dropdown (public/connections/private) with descriptions
- Notification icons + titles for 5 new types: access_request, access_accepted, access_rejected, connection_removed, permissions_changed

### Files changed
- `src/Entity/AccessRequest.php` (new)
- `src/Entity/Connection.php` (new)
- `src/Entity/JournalPermission.php` (new)
- `src/Entity/JournalSetting.php` (new)
- `src/Repository/AccessRequestRepository.php` (new)
- `src/Repository/ConnectionRepository.php` (new)
- `src/Repository/JournalPermissionRepository.php` (new)
- `src/Repository/JournalSettingRepository.php` (new)
- `src/Entity/User.php` — added `$connections` (OneToMany) + `$journalSetting` (OneToOne)
- `src/Controller/Api/SocialController.php` (new, 14 endpoints)
- `src/Controller/Api/JournalController.php` — permission checks + auth + stats
- `src/Controller/Api/NotificationController.php` — RELATED_URLS for 5 new social types
- `assets/api.js` — 15 new API methods + patch helper
- `assets/app.js` — social module (600+ lines) + notification updates
- `templates/base.html.twig` — sidebar button, tab-content with full UI
- `migrations/Version20260627214623.php` (new migration)

### Commands
- **Compile assets**: `php bin/console asset-map:compile` then delete `public/assets/` (debug mode)
- **Test endpoints**: use `Invoke-RestMethod` with `X-Game-Code` header

### Tested end-to-end
- Create access request (ADMIN01 -> DEMO) ✓
- Accept request => bidirectional connections + default permissions + notification ✓
- Check access status (pending -> connected) ✓
- View journal as connected user (scope: connected, filtered by permissions) ✓
- Update permissions (can_view_notes) ✓
- View journal again (notes now visible) ✓
- Set journal to private => 403 for non-owner ✓
- Set journal to connections => connected user can see, non-connected gets 403 ✓
- Export CSV with/without can_download_csv ✓
- Create/update/delete trade ownership checks ✓
