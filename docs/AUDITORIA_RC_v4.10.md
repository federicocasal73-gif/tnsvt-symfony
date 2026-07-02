# INFORME DE AUDITORÍA — TNSVT v4.10 → Release Candidate

**Fecha:** 2026-07-02
**Auditoría completa:** Web + Android APK
**Desde commit:** `b16e557` (APK v4.10)

---

## RESUMEN EJECUTIVO

| Categoría | Puntaje | Estado |
|-----------|---------|--------|
| Arquitectura | 7/10 | Modularización mejorable |
| Seguridad | **3/10** | 🔴 15 issues críticos |
| Performance | 6/10 | N+1 queries, memory leaks |
| UX/UI | 7/10 | Temática consistente |
| Código | 5/10 | Monolitos JS/CSS |
| Escalabilidad | 6/10 | Sin rate limiting |
| Accesibilidad | 4/10 | Sin aria-labels |
| Mantenibilidad | 4/10 | Duplicación, !important |
| Compatibilidad Android | 6/10 | ProGuard crítico |
| Compatibilidad Web | 7/10 | CSP roto |
| **Calidad General** | **5/10** | 🟡 No apto para RC |

---

## 🔴 ISSUES CRÍTICOS (15)

### C1 — Hardcoded Admin Password
- **Archivo:** `src/Security/AdminAuthTrait.php:15`
- **Problema:** `ADMIN_PASSWORD = 'TNSVT-2026-CristoRey!'` hardcodeado
- **Impacto:** Cualquiera con acceso al repo tiene password admin
- **Fix:** Mover a `$_ENV['ADMIN_PASSWORD']` en `.env.local`

### C2 — Webhook MP sin verificación de firma
- **Archivo:** `src/Controller/Api/MercadoPagoController.php:120-152`
- **Problema:** Acepta GET y POST sin verificar `X-Signature`
- **Impacto:** Replay attacks, DoS, llamadas no autorizadas a MP API
- **Fix:** Verificar HMAC-SHA256 con client secret. Remover GET

### C3 — Zero autenticación en FeedController
- **Archivo:** `src/Controller/Api/FeedController.php:58-64`
- **Problema:** `author_code` del body JSON sin verificar
- **Impacto:** Attacker postea/comenta como cualquier usuario
- **Fix:** `getCurrentUser()` con `X-Game-Code`

### C4 — Race condition double-spend en Duel entry fee
- **Archivo:** `src/Controller/Api/DuelController.php:105-107`
- **Problema:** `subtractFromWallet()` no es atómico
- **Impacto:** Usuario entra a múltiples duelos con mismo saldo
- **Fix:** Pessimistic locking o SQL atómico

### C5 — Race condition credit/debit wallet
- **Archivo:** `src/Controller/Api/AdminWalletController.php:76-90`
- **Problema:** `addToWallet()` no es atómico
- **Impacto:** Pérdida financiera en operaciones concurrentes
- **Fix:** Atomic SQL `UPDATE users SET balance = balance + :amount`

### C6 — XSS en feed (app.js)
- **Archivo:** `assets/app.js:2228-2284`
- **Problema:** 5+ vectores innerHTML sin escapar (authorName, signal data)
- **Impacto:** Stored XSS en el feed
- **Fix:** Usar `escapeHtml()` / `textContent`

### C7 — XSS en módulo Social (app.js)
- **Archivo:** `assets/app.js:6601-6750`
- **Problema:** `esc()` usado en onclick attributes permite quote breakout
- **Impacto:** Stored XSS en conexiones/permissions
- **Fix:** Usar data attributes + addEventListener

### C8 — SharedPreferences mismatch BiometricPlugin
- **Archivo:** `BiometricPlugin.java:26`
- **Problema:** `PREFS_NAME = "tnsvt_biometric_prefs"` vs `"CapacitorStorage"`
- **Impacto:** App lock bypass si se llama a plugin nativo
- **Fix:** Unificar ambos a `"CapacitorStorage"`

### C9 — android:allowBackup expone PIN hash
- **Archivo:** `AndroidManifest.xml:5`
- **Problema:** `allowBackup="true"`
- **Impacto:** PIN hash extraíble via adb backup
- **Fix:** `android:allowBackup="false"`

### C10 — ProGuard no protege com.tnsvt.app
- **Archivo:** `proguard-rules.pro:9-11`
- **Problema:** Faltan keep rules
- **Impacto:** Release APK crashea (BiometricPlugin undefined)
- **Fix:** Agregar `-keep class com.tnsvt.app.** { *; }`

### C11 — Syntax error potencial app.js:6080
- **Archivo:** `assets/app.js:6080`
- **Problema:** Extra `}` entre funciones
- **Impacto:** Mata módulos Diary, Social, AppLock
- **Fix:** Verificar y remover

### C12 — Zero auth en AcademiaController
- **Archivo:** `src/Controller/Api/AcademiaController.php:47-114`
- **Problema:** Sin auth en create/update/delete cursos
- **Impacto:** Cualquiera modifica contenido educativo
- **Fix:** Agregar RequireAdminTrait o X-Game-Code

### C13 — Zero auth en NotificationController
- **Archivo:** `src/Controller/Api/NotificationController.php:70-115`
- **Problema:** Sin auth en markRead/delete
- **Impacto:** Cualquiera manipula notificaciones ajenas
- **Fix:** Verificar ownership del user

### C14 — User enumeration en login
- **Archivo:** `src/Security/CodeAuthenticator.php:44-59`
- **Problema:** Mensajes de error diferentes según existencia del usuario
- **Impacto:** Attacker descubre códigos válidos
- **Fix:** Mensaje genérico "Credenciales inválidas"

### C15 — CSS backdrop-filter syntax roto
- **Archivo:** `assets/styles/app.css:51,82,178,525,552,652,863`
- **Problema:** `-webkit-backdrop-filter: backdrop-filter: blur(...)`
- **Impacto:** Sin glass/blur effect en Safari/Capacitor WebView
- **Fix:** `-webkit-backdrop-filter: blur(...); backdrop-filter: blur(...);`

---

## 🟡 ISSUES ALTOS (12)

| # | Archivo | Problema | Fix |
|---|---------|----------|-----|
| H1 | `ChatController.php:48-59` | Auth por user_code en query param | Usar X-Game-Code header |
| H2 | `ChatController.php:202-204` | Photo threshold 14MB vs mensaje "10MB" | Alinear constante y mensaje |
| H3 | `ChatUploadController.php:63` | guessExtension() riesgo ejecución | Validar por MIME + extensión allowlist |
| H4 | `EconomicReminderController.php:132` | Cancel bypass con empty user_code | Validar siempre |
| H5 | `GameController.php:132-134` | XP inflation via metadata | Calcular XP server-side |
| H6 | `MarketController.php:339` | mt_srand() contamina PRNG global | Usar Randomizer dedicado |
| H7 | `ProfileController.php:44-102` | Sin auth avatar upload/delete | Validar X-Game-Code |
| H8 | `ProfileController.php:121-122` | Wallet balance público | Solo al owner/admins |
| H9 | `MusicController.php:284-285` | CURLOPT_SSL_VERIFYPEER=false | Habilitar verificación SSL |
| H10 | `SecurityHeadersSubscriber.php:62-66` | CSP unsafe-inline + connect-src * | Usar nonces, restringir connect-src |
| H11 | `network_security_config.xml` | User CA trust + cleartext | Remover user CAs, solo HTTPS |
| H12 | `MainActivity.java:177` | PIN sin lockout | Agregar contador + delay |

---

## 🔵 ISSUES MEDIOS (20)

| # | Archivo | Problema |
|---|---------|----------|
| M1 | `WalletTransaction.php:120` | isCredit() omite duel_win y duel_refund |
| M2 | `SeedUsersCommand.php:21` | Default password + leak a stdout |
| M3 | `DeviceController.php:42-49` | FCM token hijacking |
| M4 | `app.js:3679,4710,5747` | 3x setInterval sin cleanup |
| M5 | `app.js:5067` | Toast notifications sin sanitize |
| M6 | `app.css:336-885` | ~350 líneas CSS duplicado |
| M7 | `app.css` | !important abuse (~100+) |
| M8 | `app.css` | z-index conflicts |
| M9 | `app.css` | Faltan --green, --red |
| M10 | `base.html.twig` | DOM estructural roto |
| M11 | `base.html.twig` | 3x img src="" innecesarios |
| M12 | `ChatController.php:328-357` | typing sin rate limit |
| M13 | `ChatController.php:359-377` | listUsers() expone todos |
| M14 | `ConversationRepository.php:156-190` | Race condition DMs duplicados |
| M15 | `DuelController.php:364-368` | Candle data manipulable |
| M16 | `DuelController.php:294-326` | Race condition PnL no computado |
| M17 | `TournamentMailer.php:88` | Prize pool doble conteo |
| M18 | `TournamentMailer.php:170-177` | Emails world-readable |
| M19 | `GameController.php:180-192` | Leaderboard query lenta |
| M20 | `app.js:2758` | adminWalletRefresh undefined |

---

## PLAN DE ACCIÓN (5 Fases)

### FASE 0 — Hotfix Inmediato
1. Admin password → $_ENV
2. app.js:6080 → verificar/remover extra }
3. AndroidManifest → allowBackup="false"
4. proguard-rules → keep rules
5. BiometricPlugin → unificar PREFS_NAME

### FASE 1 — Seguridad Crítica
6. FeedController → X-Game-Code auth
7. NotificationController → auth
8. AcademiaController → auth
9. MercadoPagoController → X-Signature
10. DuelController → locking + race fix
11. AdminWalletController → atomic SQL
12. ProfileController → auth avatar

### FASE 2 — XSS Frontend
13-17. Sanitizar app.js templates + fix CSS

### FASE 3 — Android APK Hardening
18-22. Network config, PIN lockout, FileProvider, crash loop, salt

### FASE 4 — Deuda Técnica
23-28. CSS dedup, memory leaks, DOM fix, WalletTransaction fix

### FASE 5 — Code Quality
29-34. RateLimiter, tests, modularización, cleanup
