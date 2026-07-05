# TNSVT Symfony Backend — Session Notes

> Documento vivo. Resumen del backend, endpoints, entidades, y decisiones arquitectónicas.
> Última actualización: 2026-06-25 (sesión final)

---

## 1. Descripción

Backend Symfony 6.4 para T.N.S.V.T Market Instinct. Maneja autenticación, wallet, torneos, duelos 1v1, pagos (MercadoPago + Binance Pay), y proporciona precios reales del mercado.

**Stack:**
- Symfony 6.4 (PHP 8.4)
- Doctrine ORM con SQLite (dev) / PostgreSQL (prod)
- API REST con JSON
- Autenticación via `X-Game-Code` header
- Admin via Sonata Admin Bundle

---

## 2. Estructura del Repo

```
src/
  Controller/Api/
    AuthController.php           # Login, register, sync
    WalletController.php         # Balance, deposits, withdrawals
    TournamentController.php     # Tournaments CRUD
    DuelController.php           # 1v1 duels
    MarketController.php         # Market data + /prices endpoint
    MercadoPagoController.php    # Payment integration
    BinancePayController.php     # Crypto payments
  Entity/
    User.php                     # Player account
    Wallet.php                   # Balance tracking
    WalletTransaction.php        # Tx history
    Tournament.php               # Tournament metadata
    TournamentParticipant.php    # User in tournament
    Duel.php                     # 1v1 duel
    DuelRound.php                # Each round in duel
    MarketCandle.php             # Historical OHLCV
  Repository/
    (matching repos for each entity)
  Service/
    (business logic)
config/
  packages/                      # Bundle configs
  routes.yaml
  services.yaml
migrations/
  Version*.php                   # Database migrations
var/
  data_dev.db                    # SQLite (dev)
  cache/
  log/
public/
  index.php                      # Entry point
bin/
  console                        # Symfony CLI
.env                              # Environment config
```

---

## 3. Base de Datos

**SQLite en dev**: `var/data_dev.db`
**Esquema principal:**

```
users                  — accounts, codes, balances
wallets               — balances por user
wallet_transactions   — historial de movimientos
tournaments           — torneos (públicos, privados)
tournament_participants — inscripciones + performance
duels                 — duelos 1v1 entre users
duel_rounds           — cada round con PnL
market_candles        — OHLCV data cacheada
```

---

## 4. Endpoints API

### Auth
- `POST /api/auth/login` — Login con código
- `POST /api/auth/register` — Registro nuevo user
- `GET  /api/auth/me` — User actual (via X-Game-Code)

### Wallet
- `GET  /api/wallet/balance` — Balance actual
- `POST /api/wallet/deposit` — Depositar (MercadoPago / BinancePay)
- `POST /api/wallet/withdraw` — Retirar
- `GET  /api/wallet/transactions` — Historial

### Tournaments
- `GET    /api/tournaments` — Listar torneos disponibles
- `POST   /api/tournaments` — Crear torneo
- `POST   /api/tournaments/{id}/join` — Inscribirse
- `POST   /api/tournaments/{id}/play` — Hacer trade en torneo
- `GET    /api/tournaments/{id}/leaderboard` — Top del torneo

### Duels (1v1)
- `GET    /api/duels` — Listar duelos disponibles
- `POST   /api/duels` — Crear duelo (challenge)
- `POST   /api/duels/{id}/join` — Aceptar duelo
- `GET    /api/duels/{id}` — Estado del duelo
- `POST   /api/duels/{id}/next-round` — Avanzar ronda
- `POST   /api/duels/{id}/play` — Hacer trade en round
- `POST   /api/duels/{id}/cancel` — Cancelar duelo

### Market Data
- `GET  /api/market/candles` — Velas históricas OHLCV
- `GET  /api/market/symbols` — Lista de símbolos disponibles
- `GET  /api/market/prices` — **Precios en tiempo real** (18 instrumentos)
- `GET  /api/market/exchanges` — Exchanges soportados

### Payments
- `POST /api/mercadopago/create-preference` — Crear preference MP
- `POST /api/mercadopago/webhook` — Webhook de pago
- `POST /api/binance-pay/create-order` — Crear orden crypto
- `POST /api/binance-pay/webhook` — Webhook Binance

---

## 5. Mercado en Tiempo Real (NUEVO)

**Endpoint:** `GET /api/market/prices`

**Respuesta:**
```json
{
  "prices": {
    "BTC": 60774, "ETH": 1617, "SOL": 67.6, "BNB": 565, "XRP": 1.07,
    "GOLD": 3975, "EURUSD": 1.13, "SP500": 7358, "NASDAQ": 25476, "WTI": 69.1,
    "AMD": 519, "MSFT": 365, "NVDA": 199, "AAPL": 293, "TSLA": 375,
    "GOOGL": 345, "AMZN": 234, "META": 557
  },
  "sources": {
    "BTC": "binance", "ETH": "binance", ..., "EURUSD": "yahoo", "AMD": "yahoo", ...
  },
  "updated_at": "2026-06-25T03:33:04+00:00"
}
```

**Implementación:**
- **Binance batch ticker** (1 call) para: BTC, ETH, SOL, BNB, XRP, GOLD (PAXGUSDT)
- **Yahoo Finance** individual chart calls (8 calls paralelos) para: EURUSD, SP500, NASDAQ, WTI, AMD, MSFT, NVDA, AAPL, TSLA, GOOGL, AMZN, META
- **File-based cache** en `/tmp/tnsvt_cache_*.json` con TTL 8s
- **Fallback prices** hardcoded si todas las fuentes fallan

**Cold cache:** ~4-8s (Binance + 12 Yahoo calls)
**Warm cache:** ~300-400ms (just file read)

**Nota importante:**
- Yahoo Finance EURUSD=X se usa para forex (NO Binance EURUSDT — estructura no real)
- GOLD usa PAXGUSDT (PAX Gold tokenized) como proxy de oro real

---

## 6. Duelos 1v1 (NUEVO)

### Entidades

**Duel:**
- `id` (PK)
- `creator` (FK → User)
- `opponent` (FK → User, nullable hasta join)
- `entryFee` (decimal)
- `status` (waiting/active/finished/cancelled)
- `winner` (FK → User, nullable)
- `totalRounds` (default 3)
- `currentRound` (default 0)
- `createdAt`, `updatedAt`

**DuelRound:**
- `id` (PK)
- `duel` (FK → Duel)
- `roundNumber` (int)
- `player1Move` (enum: long/short/skip)
- `player1Entry`, `player1Exit`, `player1PnlUsd`, `player1PnlPct`
- `player2Move`, `player2Entry`, `player2Exit`, `player2PnlUsd`, `player2PnlPct`
- `winner` (FK → User, nullable)
- `exitReason1`, `exitReason2` (sl/tp/trailing/close)
- `candlesData` (JSON snapshot de las velas)
- `createdAt`

### WalletTransaction types
```
TYPE_DUEL_ENTRY   — fee debited when joining duel
TYPE_DUEL_WIN     — pot credited to winner
TYPE_DUEL_REFUND  — refund on cancel
```

### Flow típico
1. User A: `POST /api/duels {entryFee: 50}` → Duel creado (status=waiting)
2. User B: `POST /api/duels/{id}/join` → debita $50, status=active
3. Round 1: Ambos hacen `POST /api/duels/{id}/play {direction: long, asset: BTC, ...}`
4. Backend calcula PnL en cada vela, exit reason (SL/TP/trailing/close)
5. Al tercer round, `GET /api/duels/{id}` muestra winner, status=finished
6. Winner recibe 2× entryFee via `TYPE_DUEL_WIN`

### Test E2E
Probado: create → join → 3 rounds → PnL correct → winner → finished status

---

## 7. Decisiones Arquitectónicas

### Cache Strategy
- **File-based cache** en `php -S` (built-in server) — static vars NO persisten entre requests
- TTL: 8 segundos para prices (suficiente para evitar rate limits)
- Yahoo Finance v7 batch quote endpoint está rate-limited, así que usamos v8/chart individual

### Autenticación
- Header `X-Game-Code` con código del usuario (no JWT para simplicidad mobile)
- Admin panel usa sesión estándar de Symfony

### Base de Datos
- SQLite en dev (zero-config)
- Migraciones versionadas con `doctrine/migrations`
- Migración `Version20260625021044` crea las tablas `duels` y `duel_rounds`

### Errores
- Respuestas JSON con `success: bool` y `error: string`
- HTTP 400/404/500 según corresponda
- Logging via Monolog

---

## 8. Datos de Testing

**User principal (ADMIN01):**
```
code: ADMIN01
balance: $327.8 (real de testing)
```

**Migration más reciente:** `Version20260625021044` (duels tables)

---

## 9. Comandos Útiles

```bash
# Iniciar servidor
cd C:\Users\HP 240 inch G9\tnsvt-symfony
php -S 192.168.1.2:8000 -t public

# Crear nueva entity
php bin/console make:entity

# Crear migración
php bin/console make:migration
php bin/console doctrine:migrations:migrate

# Limpiar cache
php bin/console cache:clear

# Ver rutas
php bin/console debug:router

# Crear user admin
php bin/console app:create-user "ADMIN01" "TNSVT-2026-CristoRey!" 50000
```

---

## 10. Build / Deploy

**Sin build step** — PHP se ejecuta directamente. Para prod:
1. Configurar `.env` con DATABASE_URL apuntando a PostgreSQL/MySQL
2. `php bin/console doctrine:migrations:migrate --no-interaction`
3. `php bin/console cache:clear --env=prod`
4. Servir con Nginx + PHP-FPM (NO usar `php -S` en prod — sin static cache)

---

## 11. Historial de Commits

| Commit | Descripción |
|---|---|
| `c350902` | Initial duel backend + AGENTS.md |
| `bff87cf` | Rebase |
| `813f99f` | Rebase |
| `f34c55c` | Rebase + AGENTS.md updates |
| `d858089` | Market: add /api/market/prices endpoint |
| `10cace4` | Stocks: add AMD MSFT NVDA AAPL TSLA GOOGL AMZN META |
| `bb28d2d` | fix: fetch stocks individually (batch quote rate-limited) |

---

## 12. Próximas Mejoras / Pendientes

- **Tour onboarding en Survival/Arena/Daily** — el frontend ya tiene infrastructure, falta los steps
- **Achievements dinámicos** — actualmente son estáticos en el game app, deberían sincronizarse con backend
- **Multi-currency wallet** — actualmente todo en USD
- **Tournament brackets** — sistema de eliminación más rico
- **Rate limiting** en API — actualmente sin protección (dev)
- **WebSocket para duels realtime** — actualmente polling
- **Matchmaking skill-based** para duelos
- **Audit log** — quién hizo qué cuándo

---

## 13. Notas Técnicas

### Yahoo Finance Rate Limits
- v7 batch quote (`/v7/finance/quote?symbols=...`) → **Too Many Requests**
- v8 individual chart (`/v8/finance/chart/{symbol}`) → funciona consistentemente
- v8 spark batch → también rate-limited

**Decisión:** usar v8 individual calls + file cache para evitar rate limits.

### User-Agent
Yahoo bloquea requests sin User-Agent. El MarketController setea:
```
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
```

### EURUSD
- `EURUSD=X` en Yahoo Finance es el forex real
- `EURUSDT` en Binance tiene estructura diferente (no es forex real)
- **Decisión:** siempre usar Yahoo EURUSD=X para forex

### GOLD
- Yahoo Finance no tiene XAU/USD directo
- `PAXGUSDT` en Binance es un token respaldado por oro real (Paxos Standard)
- **Decisión:** usar PAXGUSDT como proxy de oro real

---

## 14. Contacto / Soporte

Para retomar trabajo en este backend, los puntos clave son:
1. La entidad `Duel` y `DuelRound` (recién agregadas)
2. El endpoint `/api/market/prices` (recién agregado)
3. La integración con Yahoo Finance + Binance

Cualquier cosa nueva, seguir el patrón:
1. Entity
2. Repository
3. Migration
4. Controller
5. Test E2E con curl/Postman