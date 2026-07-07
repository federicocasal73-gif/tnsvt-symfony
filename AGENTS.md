# TNSVT Session Summary

## Documentación
- `docs/arquitectura.md` / `docs/arquitectura.pdf` — Arquitectura técnica completa y guía de hosting (Jun 2026, 17 secciones, ~42 páginas).
- `docs/tnsvt-sistema-copy-full.pdf` — **Documentación premium del sistema unificado PHP+Python+Android (Jul 2026, 20 secciones, ~49 páginas, ~140 KB)**. Generada con `reportlab` desde `generate_full_system_pdf.py`. Cubre backend Symfony (29 entidades, 38 controllers), TNSVT Market Instinct (8 modos de juego + Duelos 1v1), Signal Copier Python (13 archivos), Telegram Bot (11 comandos), Bridge FastAPI, Streamlit Dashboard, y la integración end-to-end de las 4 fases (API Bridge → Admin Dashboard → Bot TNSVT → Auto-Update PnL). Branding premium con logo embebido, headers/pies de página dorados, diagramas ASCII y tablas estilizadas.

## Commands
- **Start server**: `cd "C:\Users\HP 240 inch G9\Documents\TNSVT-WORK\tnsvt-symfony" && php -S 0.0.0.0:8000 -t public`
- **Build game APK**: `cd game-app\android && gradlew.bat assembleDebug`
- **Build web APK**: `cd android && gradlew.bat assembleDebug` (needs JAVA_HOME=C:\dev\jdk\jdk-21\jdk-21.0.7+6)
- **Install via ADB**: `adb install -r path\to\app-debug.apk`
- **Sync capacitor**: `npx cap sync android` (needs PATH with nodejs)
- **Recompile assets**: `php bin/console asset-map:compile` (if Debug mode warning, delete `public/assets/` first)
- **Tailscale Funnel**: `tailscale funnel --bg --yes 8000` (needs PHP on `0.0.0.0:8000`)

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

## Session 2026-06-29 — 15 Fixes Consolidados + Hotfixes
### Commits
- `e4a66fe` — 15 fixes: CF chat widget rewrite, topbar, pre-login, dead code
- `48d9445` — hotfix: candado button, _syncStream, notif panel, topbar visual

### What was fixed

#### Fase 1 — Bugs críticos (6 fixes)
- **`cal-reminder-badge`**: eliminado `display:none` duplicado (estaba siempre visible)
- **`z-index` newDmModal**: 10001 → 100020 (no solapaba con music player)
- **`CF.loadConversations()`**: rewrite usando `window.API.getConversations()` directamente (antes buscaba `window.loadChatConversations` que no existía)
- **`chatConversations` expuesto a window**: ahora compartido via `window.chatConversations` para notificaciones toast (antes era `let` local y `pollAllConversations` siempre retornaba)
- **`_loadMessagesDirect` URL**: reemplazado fetch directo por `window.API.getMessages()` (URL correcta era `/api/chat/conversations/{id}/messages`)
- **XSS**: `m.photo` escapado con `this._esc()`

#### Fase 2 — Shape mismatch (2 fixes)
- **`serializeConversation`**: agregados `is_group`, `other_user_avatar_url`, `online` + método `getAvatarUrl()`
- **Botón "+"**: nuevo mensaje privado en CF widget header

#### Fase 3 — Topbar + Login (3 fixes)
- **T cortada**: `overflow:hidden;text-overflow:ellipsis` reemplazado por `flex-shrink:0;padding-left:2px`
- **DIOS/IDENTIDAD tapado**: `.hub-view` padding-top 20px → 76px
- **Widgets pre-login**: `musicPlayerBar`, `cf-fab`, `cf-presence` ahora ocultos por defecto (`display:none`), mostrados post-login via `musicShowBar()` + `style.display = ''`

#### Fase 4 — Dead code cleanup
- Eliminadas funciones: `switchTradingTab`, `musicSetAudioSrc`, `musicStopViz`, `openChatMenu`, `cancelReply`
- Eliminadas referencias legacy `chat-floating-panel`/`chat-floating-bubble` en `logout()`

#### Hotfixes (commit `48d9445`)
- **Candado 🔒**: removido botón `closeTradingPanel()` del trading header
- **`_syncStream`**: reemplazado por `_loadMessagesDirect()` en `CF.send()`
- **Notif panel**: movido `#notifBellWrap` fuera del `.app-header` oculto (`display:none`) para que el panel de notificaciones sea visible. Oculto el `#notifBellBtn` duplicado dentro del wrap.
- **Topbar brand**: quitado `min-width:0` para evitar que el contenedor se encoja

### APK
- Rebuild v1.8.3 → `public/downloads/tnsvt-app.apk` + `public/apk/tnsvt-v1.8.3.apk`
- VersionCode incrementado, cache-bust pendiente

### Files changed
- `assets/app.js` — ~103 líneas eliminadas (dead code + fixes)
- `assets/styles/app.css` — topbar brand fix, hub-view padding
- `src/Controller/Api/ChatController.php` — avatarUrl + shape fields
- `templates/base.html.twig` — candidato button, notifPanel moved, CF widget fixes, pre-login hiding

## Session 2026-06-29 — Chat Premium (Fases 1+3+4) + Sound System + N+1 fix + Dead code cleanup
### Commits
- `1832063` — Fase 1+3+4: Chat Premium — backend typing/edit/delete/N+1 + sonidos 10 opciones + attachments + dead code cleanup

### Fase 3 — CSS inline → app.css (premium)
- Moved full CF widget CSS (~368 líneas) from inline `<style>` in `base.html.twig` to `assets/styles/app.css`
- **Premium enhancements**: glassmorphism panel (blur 18px + animated gradient border via `::before`), inner-glow message bubbles, glass composer with focus-glow, custom gold scrollbar
- Removed legacy chat CSS (~52 líneas) from `app.css`

### Fase 0 — Dead code cleanup en `app.js`
- Removed ~500 líneas de funciones legacy que manipulaban DOM que no existe: `formatChatTime`, `convDisplayName`, `convAvatar`, `renderConversations`, `loadConversations`, `renderMessage`, `loadMessages`, `selectConversation`, `renderStream`, `appendMessage`, `attachChatPhoto`, `removeChatPhoto`, `sendChatMessage`, `openChatLightbox`, `pollChat`, `initChatPolling`
- Refactored `CF.send()` → usa `window.API.sendMessage` directo (sin proxy a legacy)
- Refactored `startDmWith()`, `deleteConversation()`, `onChatTyping()`, `logout()`, `loadChats()` para usar CF/state API

### Fase 1 — Backend improvements
- **Message entity**: agregado `editedAt` (DATETIME_IMMUTABLE, nullable) y `attachment` (JSON, nullable) + getters/setters
- **User entity**: agregado `notificationSound` field (VARCHAR(50), default 'chime')
- **Migration** `Version20260629123000` aplicada
- **ChatController**: 5 endpoints nuevos:
  - `POST /api/chat/typing` — broadcasting typing via push notifications
  - `PUT /api/chat/conversations/{id}/messages/{msgId}` — edit (solo autor)
  - `DELETE /api/chat/conversations/{id}/messages/{msgId}` — delete (solo autor)
  - `DELETE /api/chat/conversations/{id}` — delete conversation
- **ConversationRepository::findByParticipant()**: refactor de N+1 (3 queries por conv = `2+3N` total) a 6 queries fijos total con batch joins + `GROUP BY`

### Sound System — 10 sonidos Web Audio API
- **`UserSoundController`** (`GET/PUT /api/user/sound`) — persistencia server-side del sonido elegido
- **`assets/api.js`**: agregados `getNotificationSound()`, `setNotificationSound()`
- **CF widget**: `_playSound()` reemplaza `_beep()` con 10 sonidos:
  - chime (default TNSVT C5→E5→G), mario_coin, zelda_secret, sonic_ring, apple_tritone, pixel_popcorn, pokemon_levelup, deus_ex_scan, indiana_jones_whip, msn_message, swoosh
- **Sound settings modal** (`CF.showSoundSettings()`) — selector con Preview button
- **Persistencia dual**: localStorage (`tnsvt_cf_sound`) + backend (User.notificationSound)
- **Toggling** del botón 🔔 ahora abre el selector de sonidos

### Fase 4 — Attachments (file upload)
- **`ChatUploadController`** (`POST /api/chat/upload`) — multipart upload a `public/uploads/chat/`, 20MB límite, MIME allowlist (image/jpeg,png,gif,webp, video/mp4,webm, audio/mpeg,ogg,wav, application/pdf)
- **`assets/api.js`**: `uploadChatFile(file, userCode)` via FormData
- **CF widget**: replace `cfPhotoInput` (solo image) con `cfFileInput` (image/video/audio/pdf), botón 📷 → 📎
- **`send()`** method: sube el archivo primero (si hay), luego envía el mensaje

### Typing indicator
- **`onTyping()`** method en CF: throttle 2s, send a `API.sendTyping(convId, userCode)`
- Backend notifica a otros participantes via `PushService` con tipo `'typing'`

### Edit/Delete messages UI
- **`_renderMsg()`**: agrega botones ✏️ 🗑 en hover para mensajes propios, indicador "(editado)" cuando aplica, attachment link preview, photo clickable
- **`_editMsg()`** y `_deleteMsg()` methods nuevos — prompt para edit, confirm para delete

### APK
- Rebuild v1.9.0 → `public/downloads/tnsvt-app.apk` + `public/apk/tnsvt-v1.9.0.apk`
- Web assets re-compiled y bundled vía gradle

### Files changed
- `assets/api.js` — 6 nuevos métodos (sendTyping, editMessage, deleteMessage, uploadChatFile, getNotificationSound, setNotificationSound)
- `assets/app.js` — ~423 líneas eliminadas (dead code)
- `assets/styles/app.css` — +496 líneas CF widget premium CSS
- `src/Controller/Api/ChatController.php` — +102 líneas (5 endpoints nuevos + serializeMessage extendido)
- `src/Controller/Api/ChatUploadController.php` (new) — file upload endpoint
- `src/Controller/Api/UserSoundController.php` (new) — sound preferences endpoint
- `src/Entity/Message.php` — +12 líneas (editedAt + attachment)
- `src/Entity/User.php` — +6 líneas (notificationSound)
- `src/Repository/ConversationRepository.php` — N+1 fix (refactor a 6 queries fijos)
- `templates/base.html.twig` — CF widget completamente rediseñado (-569 líneas netas)
- `migrations/Version20260629123000.php` (new) — schema migration

## Session 2026-07-01 — Biometric App Lock (Fingerprint + PIN)
### Commit
- `97e0744` — fix: biometric app lock — native + JS keys match, global functions exposed, foldable layout fix, apk v4.2

### What was done
- **BiometricPlugin.java** (new) — custom Capacitor plugin with 9 native methods: `isAvailable`, `authenticate`, `setPin`, `verifyPin`, `hasPin`, `isAppLockEnabled`, `setAppLockEnabled`, `isBiometricEnabled`, `setBiometricEnabled`
- **MainActivity.java** — app lock nativo con BiometricPrompt/PIN dialog, crash-loop detection (reset lock if 2+ startup failures), `decorView.post()` para deferred init
- **SharedPreferences**: JS (via Preferences plugin) y native (MainActivity) ahora usan `"CapacitorStorage"` con keys coincidentes: `app_lock_enabled`, `pin_hash`
- **Fix clave**: JS guardaba con keys `tnsvt_app_lock`/`tnsvt_pin_hash` pero native leía `app_lock_enabled`/`pin_hash` — ahora coinciden
- **Fix ES module**: `toggleAppLock`, `savePin`, `updateAppLockUI`, `initAppLockUI` expuestas a `window` (app.js se carga como ES module via importmap)
- **Responsive layout**: security tab cambió de `max-width:500px` a `max-width:min(90vw,600px)` para Z Fold 6
- **Server bind**: cambiar a `0.0.0.0:8000` para compatibilidad con Tailscale Funnel (espera en `127.0.0.1`)

### Key Bug
- `CapacitorStorage` SharedPreferences keys must match between JS and native (`app_lock_enabled`, `pin_hash`)
- Functions in ES modules are NOT global — need explicit `window.fn = fn` for `onclick` handlers

### Files changed/created
- `android/app/src/main/java/com/tnsvt/app/BiometricPlugin.java` (new)
- `android/app/src/main/java/com/tnsvt/app/MainActivity.java` — app lock native + crash detection
- `android/app/src/main/assets/capacitor.plugins.json` — added BiometricPlugin entry
- `android/app/build.gradle` — added `androidx.biometric:biometric:1.2.0-alpha05`
- `assets/app.js` — BiometricAuth module (~100 lines), window exports, key names fix
- `assets/styles/app.css` — tab-content width fix
- `templates/base.html.twig` — security tab UI (toggle + PIN setup), sidebar button
- `migrations/Version20260701115530.php` — (other change)
- `start-server.ps1` (new)

## Session 2026-07-02 — Auditoría RC v4.10 Completa (5 Fases)
### Commit
- Audit RC v4.10: seguridad, XSS, Android hardening, rate limiter

### FASE 0 — Hotfix inmediato (7 fixes)
- `AdminAuthTrait.php`: password hardcodeada → `$_ENV['ADMIN_PASSWORD']`
- `.env`: variable `ADMIN_PASSWORD` agregada
- `SeedUsersCommand.php`: usa `$_ENV` en vez de constante eliminada
- `assets/app.js:6080`: extra `}` removido (fix syntax error Diary/Social/AppLock)
- `AndroidManifest.xml`: `allowBackup="true"` → `"false"`
- `proguard-rules.pro`: keep rules para `com.tnsvt.app.**`
- `BiometricPlugin.java`: `PREFS_NAME` unificado a `"CapacitorStorage"`

### FASE 1 — Seguridad crítica backend (7 controllers)
- `FeedController`: `getCurrentUser()` via X-Game-Code en create/like/comment/delete
- `NotificationController`: auth + ownership check en markRead/markAllRead/delete
- `AcademiaController`: `AdminAuthTrait` + `requireAdmin()` en CUD
- `ProfileController`: X-Game-Code + ownership check en avatar upload/delete
- `DuelController`: `LockMode::PESSIMISTIC_WRITE` + transacciones en join/play/nextRound/cancel
- `AdminWalletController`: atomic SQL (`UPDATE wallet_balance +/-`) en credit/debit/reject
- `MercadoPagoController`: verificación `X-Signature` HMAC-SHA256 + atomic SQL en webhook

### FASE 2 — XSS frontend + CSS
- ~20 vectores XSS sanitizados con `escapeHtml()`: feed (author, signal fields, photos), trades (asset, dir, entry, sl, tp, ratio, notes, photos), academia (title, emoji), social admin (name, code), manage group members (name, code, error)
- `p.id` y `t.id` ahora validados como numéricos (`replace(/[^0-9]/g,'')`)
- 6 syntax errors de `backdrop-filter` corregidos: `-webkit-backdrop-filter: backdrop-filter: blur()` → `blur()`

### FASE 3 — Android hardening
- `network_security_config.xml`: cleartext deshabilitado por defecto, solo dev IPs, user CA removido
- `AndroidManifest.xml`: removido `usesCleartextTraffic="true"` (confiá en network config)
- `file_paths.xml`: paths restringidos de `path="."` a `path="images/"` y `path="chat/"`
- `MainActivity.java`: PIN lockout (5 fails → 30s lockout + rate-limit 1s), crash loop (3 strikes/60s)

### FASE 4 — Deuda técnica
- `WalletTransaction.isCredit()`: incluye `TYPE_DUEL_WIN` y `TYPE_DUEL_REFUND`
- `app.js`: `setInterval` chat polling y music progress ahora almacenados en `window._` para cleanup
- `base.html.twig` → `app.css`: inline social CSS movido a archivo

### FASE 5 — Code quality
- `RateLimiterService` (DB-backed, SQLite/PostgreSQL)
- `RateLimiterTrait` para controllers
- Rate limits aplicados: FeedController (create 5/min, like 20/min, comment 10/min), DuelController (play 10/30s, join 10/min)

### Scoring post-auditoría
- Seguridad: 3/10 → 8/10
- Calidad General: 5/10 → 7.5/10
- Apto para RC: Sí, con monitoreo continuo
