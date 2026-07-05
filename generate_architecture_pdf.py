#!/usr/bin/env python3
"""TNSVT Architecture PDF Generator - docs/arquitectura.pdf (~50 pages)"""
from fpdf import FPDF
import os, datetime

GOLD = (212, 175, 55)
VIOLET = (138, 60, 255)
DARK = (10, 7, 18)
WHITE = (255, 255, 255)
LGRAY = (200, 200, 200)
MGRAY = (120, 120, 120)

class TPDF(FPDF):
    def header(self):
        if self.page_no() == 1: return
        self.set_font("Helvetica","B",7)
        self.set_text_color(*LGRAY)
        self.cell(0,4,"T.N.S.V.T - Documentacion Tecnica de Arquitectura",align="C")
        self.ln(1)
        self.set_draw_color(*GOLD)
        self.set_line_width(0.3)
        self.line(10,self.get_y(),200,self.get_y())
        self.ln(3)
    def footer(self):
        if self.page_no()==1: return
        self.set_y(-15)
        self.set_font("Helvetica","I",7)
        self.set_text_color(*MGRAY)
        self.cell(0,10,f"--- {self.page_no()} ---",align="C")
        self.ln(2)
        self.set_font("Helvetica","",5)
        self.set_text_color(*LGRAY)
        self.cell(0,4,"TNSVT Trading Platform - Symfony 8.1 / PHP 8.4",align="C")
    def sec(self,n,t,ic="*"):
        if self.get_y()>250: self.add_page()
        self.set_x(10)
        self.set_font("Helvetica","B",16); self.set_text_color(*GOLD)
        self.cell(0,8,f"{ic} {n}. {t}",new_x="LMARGIN",new_y="NEXT")
        self.set_draw_color(*VIOLET); self.set_line_width(0.4)
        self.line(10,self.get_y(),200,self.get_y()); self.ln(4)
    def sub(self,t,sz=11):
        if self.get_y()>260: self.add_page()
        self.set_x(10); self.set_font("Helvetica","B",sz); self.set_text_color(*VIOLET)
        self.cell(0,6,t,new_x="LMARGIN",new_y="NEXT"); self.ln(1)
    def ssub(self,t):
        if self.get_y()>265: self.add_page()
        self.set_x(12); self.set_font("Helvetica","B",9); self.set_text_color(*GOLD)
        self.cell(0,5,t,new_x="LMARGIN",new_y="NEXT"); self.ln(1)
    def body(self,t):
        if self.get_y()>265: self.add_page()
        self.set_x(12); self.set_font("Helvetica","",8); self.set_text_color(*WHITE)
        self.multi_cell(188,4,t); self.ln(1)
    def code(self,t):
        if self.get_y()>250: self.add_page()
        self.set_x(14); self.set_font("Courier","",6.5); self.set_text_color(*GOLD)
        for line in t.split("\n"):
            if self.get_y()>270: self.add_page(); self.set_x(14)
            self.set_fill_color(15,12,30)
            self.cell(0,3.2,"  "+line,fill=True,new_x="LMARGIN",new_y="NEXT")
        self.set_x(10); self.ln(1)
    def kv(self,k,v):
        if self.get_y()>268: self.add_page()
        self.set_x(14); self.set_font("Courier","B",7); self.set_text_color(*VIOLET)
        self.cell(50,4,k)
        self.set_font("Courier","",7); self.set_text_color(*WHITE)
        self.multi_cell(130,4,v); self.ln(0.5)
    def bul(self,t,ind=14):
        if self.get_y()>270: self.add_page()
        self.set_x(ind); self.set_font("Helvetica","",8); self.set_text_color(*WHITE)
        self.cell(4,4,"-"); self.multi_cell(170-(ind-10),4,t); self.ln(0.5)
    def warn(self,t):
        if self.get_y()>265: self.add_page()
        self.set_x(12); self.set_font("Helvetica","I",7.5); self.set_text_color(*GOLD)
        self.multi_cell(188,4,f"[i] {t}"); self.ln(1)
    def note(self,t):
        if self.get_y()>255: self.add_page()
        self.set_x(14); self.set_fill_color(20,15,40); self.set_text_color(*GOLD)
        self.set_font("Helvetica","I",7); self.multi_cell(180,4,t,fill=True); self.ln(2)

pdf = TPDF()
pdf.set_auto_page_break(True,18)

# PAGE 1: PORTADA
pdf.add_page()
pdf.set_fill_color(*DARK); pdf.rect(0,0,210,297,"F")
pdf.set_y(50)
pdf.set_font("Helvetica","B",36); pdf.set_text_color(*GOLD)
pdf.cell(0,14,"T.N.S.V.T",align="C",new_x="LMARGIN",new_y="NEXT")
pdf.set_font("Helvetica","",14); pdf.set_text_color(*VIOLET)
pdf.cell(0,8,"Documentacion Tecnica de Arquitectura",align="C",new_x="LMARGIN",new_y="NEXT")
pdf.ln(8)
pdf.set_draw_color(*GOLD); pdf.set_line_width(0.5)
pdf.line(40,pdf.get_y(),170,pdf.get_y()); pdf.ln(8)
pdf.set_font("Helvetica","",10); pdf.set_text_color(*LGRAY)
pdf.cell(0,6,"Symfony 8.1 | PHP 8.4 | Doctrine ORM | Mercure | Firebase FCM",align="C",new_x="LMARGIN",new_y="NEXT")
pdf.cell(0,6,"Capacitor Android Web v8 | Capacitor Android Game v6 | MercadoPago | Binance Pay",align="C",new_x="LMARGIN",new_y="NEXT")
pdf.ln(12)

arch_diag = r"""
                +-------------------------------------------+
                |          T.N.S.V.T  PLATFORM              |
                |   Symfony 8.1  /  PHP 8.4  /  SQLite     |
                +-------------------------------------------+
                   |           |            |          |
          +--------+   +-------+------+  +--+------+  +-------+
          |   Web APK  |  | Game APK    |  | Admin   |  |Mercure |
          |Cap v8     |  |Cap v6       |  | Web UI  |  |Hub     |
          +-----------+  +-------------+  +---------+  +-------+
                |              |               |           |
                +--------------+---------------+-----------+
                               |
                    +----------+-----------+
                    |    TNSVT BACKEND      |
                    |  (Shared Symfony)     |
                    +----------+-----------+
                    |  |  |  |  |  |  |  |  |
                 +--+  |  |  |  |  |  |  +----+----+
                 |Wallet|MP|BNP|FCM|Chat|Journal|Duel|
                 +------+--+---+---+----+-------+----+
""".strip()
pdf.set_x(30); pdf.set_font("Courier","",6); pdf.set_text_color(*VIOLET)
for line in arch_diag.split("\n"):
    if pdf.get_y()>260: pdf.add_page(); pdf.set_x(30)
    pdf.set_x(30); pdf.cell(0,3,line,new_x="LMARGIN",new_y="NEXT")
pdf.ln(8)
pdf.set_font("Helvetica","",8); pdf.set_text_color(*MGRAY)
d = datetime.date.today().strftime("%d/%m/%Y")
pdf.cell(0,5,f"Version: 1.0 | Fecha: {d}",align="C",new_x="LMARGIN",new_y="NEXT")
pdf.cell(0,5,"Confidencial | Uso interno TNSVT",align="C",new_x="LMARGIN",new_y="NEXT")

# PAGE 2: INDICE
pdf.add_page(); pdf.sec("","Indice General","*")
toc=[("1","Resumen Ejecutivo"),("2","Arquitectura General"),("3","Stack Tecnologico"),
     ("4","Estructura del Proyecto"),("5","Entidades del Sistema (26)"),("6","Controladores API (27)"),
     ("7","Servicios del Backend (7)"),("8","Frontend Web"),("9","Aplicaciones Moviles (APKs)"),
     ("10","Sistema de Pagos Compartido"),("11","Tiempo Real con Mercure"),
     ("12","Push Notifications (FCM)"),("13","Autenticacion y Seguridad"),
     ("14","Base de Datos y Migraciones"),("15","Roadmap")]
for n,t in toc:
    pdf.set_x(14); pdf.set_font("Helvetica","B",9); pdf.set_text_color(*GOLD)
    pdf.cell(10,5,n+".")
    pdf.set_font("Helvetica","",9); pdf.set_text_color(*WHITE)
    pdf.cell(160,5,t); pdf.ln(5)


pdf.sub("1. Resumen Ejecutivo")
pdf.body("T.N.S.V.T (Trading Network for Strategic Visionary Traders) es una plataforma integral de trading educativo y social. El sistema combina un backend Symfony 8.1 con dos aplicaciones Android independientes (Web APK y Game APK) que comparten la misma infraestructura de backend.")

pdf.sub("Componentes Principales")
pdf.bul("Backend Symfony 8.1 con 26 entidades, 27 controladores y 115+ endpoints REST")
pdf.bul("Web APK (com.tnsvt.app, Capacitor v8) - Academia, Journal, Chat, Social, Chart")
pdf.bul("Game APK (com.tnsvt.market.instinct, Capacitor v6) - Trading game, Torneos, Duelos")
pdf.bul("Sistema de pagos compartido: MercadoPago (ARS) y Binance Pay (USDT)")
pdf.bul("Tiempo real via Mercure Hub (Docker) con streaming de velas cada 3 segundos")
pdf.bul("Push notifications via Firebase Cloud Messaging (FCM v1 API)")
pdf.bul("Autenticacion por codigo de usuario (X-Game-Code) sin password para usuarios regulares")

pdf.sub("Metricas Clave")
pdf.kv("Entidades:","26 gestionadas por Doctrine ORM 3.6")
pdf.kv("Tablas:","14 migraciones (Jun 2026)")
pdf.kv("Endpoints:","115+ en 27 controladores")
pdf.kv("Servicios:","7 servicios de backend")
pdf.kv("Comandos:","8 comandos console (seed, process, stream)")
pdf.kv("Frontend:","6,271 lineas JS (modular), 326 lineas API client")
pdf.kv("SW PWA:","Service Worker v37 con soporte offline")
pdf.kv("Usuarios:","22 seed users (admin + ejecutores + alumnos)")

pdf.note("NOTA: Este documento cubre ambos APKs. Las secciones de pagos, autenticacion y notificaciones aplican al BACKEND COMPARTIDO, NO son exclusivas de ninguna aplicacion.")

# 2. ARQUITECTURA GENERAL
pdf.add_page(); pdf.sec("2","Arquitectura General")
pdf.body("La plataforma sigue una arquitectura cliente-servidor con un backend monolitico Symfony que sirve a dos aplicaciones Android independientes y a una interfaz web PWA. El backend expone una API REST JSON consumida por todos los clientes.")

diag2 = r"""
  +------------------------------------------------------------------+
  |                  TNSVT BACKEND (Symfony 8.1)                     |
  |  +----------+ +----------+ +----------+ +------------------+     |
  |  |Controller| | Services | | Commands | |  Doctrine ORM    |     |
  |  | 27 APIs  | |  7 srv   | |  8 cmd   | |  26 Entities     |     |
  |  +----+-----+ +----+-----+ +----+-----+ +--------+---------+     |
  |       |            |             |                 |              |
  +-------+------------+-------------+-----------------+--------------+
                       |               SQLite DB
          +------------+---+-------------------+
          |                |                   |
    +-----+------+  +-----+------+  +---------+--------+
    |  Web APK   |  |  Game APK  |  | Mercure Hub:3000 |
    | Cap v8/PWA |  | Cap v6     |  | Docker           |
    +------------+  +------------+  +------------------+
                       |
    +------------------+--------------------------------+
    | External: Binance API  MercadoPago  Binance Pay    |
    |          Firebase FCM  Yahoo Finance  DolarAPI     |
    +---------------------------------------------------+
""".strip()
pdf.set_x(12); pdf.set_font("Courier","",5.5); pdf.set_text_color(*VIOLET)
for line in diag2.split("\n"):
    if pdf.get_y()>268: pdf.add_page(); pdf.set_x(12)
    pdf.cell(0,2.8,line,new_x="LMARGIN",new_y="NEXT")
pdf.ln(3)

pdf.sub("Flujo de Datos")
pdf.body("1. Cliente (Web/Game APK) -> HTTP request al backend Symfony")
pdf.body("2. CodeAuthenticator valida X-Game-Code header (o session)")
pdf.body("3. Controlador procesa logica, invoca servicios y repositorios")
pdf.body("4. Doctrine ORM interactua con SQLite/PostgreSQL")
pdf.body("5. Mercure hub recibe updates via publisher, distribuye via SSE")
pdf.body("6. Push notifications via FCM v1 API o legacy API")
pdf.body("7. Pagos externos via MercadoPago (ARS) o Binance Pay (USDT)")

# 3. STACK TECNOLOGICO
pdf.add_page(); pdf.sec("3","Stack Tecnologico")
pdf.sub("Backend")
for k,v in [("Framework:","Symfony 8.1.*"),("PHP:",">= 8.4"),("ORM:","Doctrine ORM 3.6 + Migrations 4.0"),
            ("Database:","SQLite (dev) / PostgreSQL (prod)"),("Security:","Custom CodeAuthenticator + PasswordHasher"),
            ("CORS:","NelmioCorsBundle"),("Mailer:","Symfony Mailer (null://null)"),
            ("Real-time:","Symfony Mercure Bundle + Docker hub"),("HTTP:","Symfony HttpClient"),
            ("Serialization:","Symfony Serializer + PropertyAccess"),("Logging:","Monolog + MonitorEvent entity"),
            ("Templating:","Twig 3.x + Symfony Asset Mapper")]:
    pdf.kv(k,v)

pdf.sub("Frontend Web (PWA)")
for k,v in [("HTML/CSS:","Twig + CSS in base.html.twig"),("JavaScript:","Vanilla JS modular (~6,300 lines)"),
            ("API Client:","Custom fetch wrapper (api.js, 326 lines)"),
            ("Charts:","Lightweight Charts (TradingView) v4.2.1"),
            ("PWA:","Service Worker v37 con cache-first + offline"),
            ("Biometrics:","@aparajita/capacitor-biometric-auth v10"),
            ("Push Web:","Firebase Web SDK (VAPID)")]:
    pdf.kv(k,v)

pdf.sub("Aplicaciones Moviles")
for k,v in [("Web APK:","Capacitor v8, com.tnsvt.app, v1.6.x"),("Game APK:","Capacitor v6, com.tnsvt.market.instinct, v1.2.x"),
            ("JDK:","21.0.7+6 en C:\\dev\\jdk\\jdk-21"),("Build:","Gradle assembleDebug + npx cap sync android")]:
    pdf.kv(k,v)

pdf.sub("Servicios Externos")
for k,v in [("MercadoPago:","Checkout Pro API (ARS)"),("Binance Pay:","Bpay API (USDT)"),
            ("Binance API:","Market data / klines"),("Firebase:","FCM v1 API"),
            ("Mercure:","Real-time events hub (Docker)"),("Yahoo Finance:","Forex/indices/stock prices"),
            ("DolarAPI:","Argentina exchange rates")]:
    pdf.kv(k,v)

# 4. ESTRUCTURA DEL PROYECTO
pdf.add_page(); pdf.sec("4","Estructura del Proyecto")
pdf.body("El proyecto sigue la estructura estandar Symfony con carpetas organizadas por funcionalidad.")

tree = r"""
  tnsvt-symfony/
  +-- assets/
  |   +-- app.js            # Frontend principal (6,271 lines)
  |   +-- api.js             # API client (326 lines)
  |   +-- chart.js           # Chart TradingView + Mercure
  |   +-- styles/app.css     # Estilos
  +-- config/packages/       # Symfony bundles config
  |   +-- routes.yaml        # Route loading (attribute-based)
  +-- docker-compose.yml     # Mercure hub
  +-- docs/                  # PDF documentation
  +-- migrations/            # 14 migration files
  +-- public/
  |   +-- sw.js              # Service Worker v37
  |   +-- uploads/avatars/   # Avatar images
  |   +-- downloads/         # APK files
  |   +-- apk/               # APK versioned backups
  +-- src/
  |   +-- Command/           # 8 console commands
  |   +-- Controller/Api/   # 27 API controllers
  |   +-- Entity/            # 26 Doctrine entities
  |   +-- Repository/        # Doctrine repositories
  |   +-- Security/          # CodeAuthenticator, UserProvider
  |   +-- Service/           # 7 business services
  +-- templates/
  |   +-- base.html.twig     # Single-page app template
  |   +-- emails/            # Email templates (Twig)
  +-- var/
  |   +-- data_dev.db        # SQLite database (dev)
  |   +-- log/               # Logs + debug emails
  +-- composer.json          # PHP dependencies
  +-- package.json           # npm dependencies
  +-- .env                   # Environment config
  +-- run-mercure.ps1        # Mercure start/stop script
""".strip()
pdf.set_x(12); pdf.set_font("Courier","",5.5); pdf.set_text_color(*VIOLET)
for line in tree.split("\n"):
    if pdf.get_y()>268: pdf.add_page(); pdf.set_x(12)
    pdf.cell(0,2.8,line,new_x="LMARGIN",new_y="NEXT")

# 5. ENTIDADES
pdf.add_page(); pdf.sec("5","Entidades del Sistema (26)")
pdf.body("26 entidades Doctrine organizadas por dominio funcional. Se detallan campos y relaciones.")

pdf.ssub("5.1 User (users)")
pdf.code("""
  id              int (PK, auto)
  code            string(50), unique    # Codigo usuario (DEMO, ADMIN01)
  email           string(180), nullable
  name            string(100)
  active          boolean, default true
  lastLogin       DateTimeImmutable, nullable
  roles           json                   # ["ROLE_USER"]
  password        string(255), nullable  # Solo admin
  walletBalance   decimal(12,2)          # default 0.00
  diarySetupToken text, nullable         # Encryption key token
  diarySetupIv    string(48), nullable   # Encryption IV
  -------------
  OneToMany WalletTransaction   user.walletTransactions
  OneToMany TournamentEntry     user.tournamentEntries
  OneToMany DiaryEntry          user.diaryEntries
  OneToMany Connection          user.connections
  OneToOne  JournalSetting      user.journalSetting
""".strip())
pdf.body("Implementa UserInterface, PasswordAuthenticatedUserInterface. getUserIdentifier() retorna code. Wallet helpers: addToWallet(), subtractFromWallet(), hasBalance(), getWalletBalanceFloat().")

ents = [
("5.2 Trade (trades)","id, date, asset, direction(long/short), entry, sl, tp, result(win/loss), pnl, ratio, notes, photos(json)","ManyToOne -> User","Trading journal personal. Fuente leaderboard."),
("5.3 Tournament (tournaments)","id, name, entryFee(5.00), prizePool, prizeDistribution(60,30,10), startDate, endDate, status(pending/active/closed/finished/cancelled), maxPlayers(100)","ManyToOne->User(createdBy), OneToMany->TournamentEntry","Torneos de trading con prize pool."),
("5.4 TournamentEntry (tournament_entries)","startingEquity, finalEquity, pnlUsd, pnlPct, finalRank, payoutAmount, status(active/finished/disqualified)","ManyToOne->Tournament, ManyToOne->User","Unique: tournament+user. computeCurrentPnl()."),
("5.5 WalletTransaction (wallet_transactions)","type(deposit/entry_fee/payout/refund/withdraw/duel_*), amount, currency(USD), refPaymentId, status, notes","ManyToOne->User, ManyToOne->Tournament(refTournament)","Constantes: TYPE_DEPOSIT, TYPE_PAYOUT, TYPE_DUEL_ENTRY, etc."),
("5.6 Duel (duels)","code(DUEL-XXXX), entryFee, prizePool, totalRounds(5), currentRound, player1Pnl, player2Pnl, startingPrice, status(waiting/active/finished/cancelled)","ManyToOne->User(p1), ManyToOne->User(p2), ManyToOne->User(winner), OneToMany->DuelRound","1v1 trading duel mode."),
("5.7 DuelRound (duel_rounds)","roundNumber, player1Move(long/short), player2Move, openPrice, closePrice, highPrice, lowPrice, player1Pnl, player2Pnl","ManyToOne->Duel","isBothPlayed(), computePnl()."),
("5.8 FeedPost (feed_posts)","content(text), category, likes(int), comments(json), signal(json), photo(text)","ManyToOne->User(author)","Social feed con posts y seniales."),
("5.9 Message (messages)","content(text), photo(text), isAi(bool), metadata(json)","ManyToOne->Conversation, ManyToOne->User(sender)","Chat con soporte AI."),
("5.10 Conversation (conversations)","type(group/dm/ai), title, aiUserCode","OneToMany->Participant, OneToMany->Message","Agrupacion de mensajes."),
("5.11 ConversationParticipant","lastReadAt, joinedAt","ManyToOne->Conversation, ManyToOne->User","Miembros de conversacion."),
]

for name, fields, rel, desc in ents:
    pdf.ssub(name)
    pdf.body(desc)
    pdf.kv("Campos:",fields)
    pdf.kv("Relacion:",rel)


pdf.add_page()
pdf.sub("Entidades de Soporte (5.12 - 5.26)")

m_ents = [
("5.12 AcademiaContent","academia_content","title, subtitle, emoji, description, videoUrl, orden, locked, lessons(json). Cursos educativos.","[Ninguna]"),
("5.13 AccessRequest","access_requests","status(pending/accepted/rejected/cancelled). Solicitudes de acceso al journal.","ManyToOne->User(requester), ManyToOne->User(target). Unique: (requester,target)"),
("5.14 Connection","connections","Relacion bidireccional entre usuarios (2 filas).","ManyToOne->User(user), ManyToOne->User(connectedUser)"),
("5.15 DiaryEntry","diary_entries","encryptedData(text AES-256-GCM), iv(48). Diario personal cifrado.","ManyToOne->User"),
("5.16 Device","devices","fcmToken(512), platform(32), deviceModel(128). Registro FCM push.","ManyToOne->User. Unique: fcm_token"),
("5.17 GameScore","game_scores","mode(classic/survival/daily/arena/torneo/fractal/portfolio/hist), score, xpGained, metadata(json)","ManyToOne->User"),
("5.18 JournalPermission","journal_permissions","6 flags: canViewStats, canViewTrades, canViewNotes, canViewComments, canDownloadCsv, canViewRealtime","ManyToOne->User(grantor), ManyToOne->User(grantee). Unique"),
("5.19 JournalSetting","journal_settings","visibility(public/connections/private). Visibilidad del journal.","OneToOne->User"),
("5.20 LikedPost","liked_posts","Registro de likes en posts.","ManyToOne->User, ManyToOne->FeedPost"),
("5.21 MarketCandle","market_candle","symbol, exchange, interval, open/high/low/close(20,8), volume, timestamp. OHLCV.","[Ninguna] Index: (symbol,exchange,interval,timestamp)"),
("5.22 ModuleProgress","module_progress","moduleId, completed(bool). Progreso en academia.","ManyToOne->User"),
("5.23 MonitorEvent","monitor_event","level(error/warning/info), message, stack, source, userCode, url. Logging frontend.","[Ninguna] Indexes: (user_code,created_at), (level,created_at)"),
("5.24 Notification","notifications","type, content, link, isRead. Notificaciones in-app + push.","ManyToOne->User"),
("5.25 Task","tasks","title, description, orden, active. Tareas operativas de ejecutores.","[Ninguna]"),
("5.26 TraderProfile","trader_profiles","strategy, style, favoritePairs, riskPerTrade, experience, extraNotes.","OneToOne->User"),
]

for name, table, fields, rel in m_ents:
    if pdf.get_y()>240: pdf.add_page()
    pdf.ssub(f"{name} ({table})")
    pdf.body(fields)
    pdf.kv("Relacion:",rel)

# 6. CONTROLADORES API
pdf.add_page(); pdf.sec("6","Controladores API (27)")
pdf.body("115+ endpoints REST JSON en 27 controladores. Autenticacion via header X-Game-Code (CodeAuthenticator) o session web.")

ctrls = [
("6.1 DuelController","/api/duels",["GET /duels","POST /duels/create","POST /duels/join","GET /duels/{id}","POST /duels/{id}/play","POST /duels/{id}/next-round","POST /duels/{id}/cancel"],"Duelos 1v1 Game APK. 7 endpoints."),
("6.2 SocialController","/api",["POST /access-request","GET /access-request","PATCH /access-request/{id}","DELETE /access-request/{id}","GET /connections","DELETE /connections/{id}","POST /connections/{id}/block","GET /permissions/{code}","PATCH /permissions/{code}","GET /journal/settings","PATCH /journal/settings","GET /access-status/{code}","GET /users/search?q="],"Sistema social de permisos. 13 endpoints."),
("6.3 JournalController","/api/journal",["GET /journal","POST /journal","PUT /journal/{id}","DELETE /journal/{id}","GET /journal/export"],"Trading journal CRUD con permisos. 5 endpoints."),
("6.4 TournamentController","/api/tournaments",["GET /tournaments/active","GET /tournaments/{id}","POST /tournaments/{id}/join","POST /tournaments/{id}/update-equity","GET /tournaments/{id}/leaderboard","GET /tournaments/my","POST /tournaments/admin/create","POST /tournaments/admin/{id}/close","POST /tournaments/admin/{id}/cancel"],"Torneos con prize pool. 9 endpoints."),
("6.5 MercadoPagoController","/api/mercadopago",["POST /mercadopago/create-payment","POST/GET /mercadopago/webhook"],"Pagos MP. 2 endpoints."),
("6.6 BinancePayController","/api/binance-pay",["POST /binance-pay/create-order","POST /binance-pay/webhook","POST /binance-pay/query-order"],"Pagos Binance Pay. 3 endpoints."),
]

for name, base, routes, desc in ctrls:
    pdf.ssub(name)
    pdf.body(desc)
    for r in routes:
        pdf.bul(f"{r}",16)

pdf.add_page()
pdf.sub("Controladores Adicionales (6.7 - 6.27)")
others = [
"AcademiaController (/api/academia) - CRUD cursos academia. Push en create/update.",
"AdminWalletController (/api/admin/wallet) - Credit, debit, withdrawals, approve/reject. X-Admin-Password.",
"AppVersionController (/api/app) - GET /api/app/version, GET /api/app/game-version. APK info.",
"AuthController (/api/auth) - POST login (code+password), GET check (session).",
"ChatController (/api/chat) - Conversaciones DM/grupo, mensajes, usuarios. 6 endpoints.",
"DeviceController (/api/devices) - Register/unregister FCM tokens.",
"DiaryController (/api/diary) - CRUD entradas cifradas. Setup token/IV.",
"DolarController (/api/wallet/rates) - ARS exchange rates (dolarapi.com). Cache 1h.",
"FeedController (/api/feed) - Social feed, likes, comments, seniales. Push notifications.",
"FirebaseConfigController (/api/firebase/config) - Firebase Web SDK config.",
"GameAppController (/api/app) - Version info + APK downloads (web + game).",
"GameController (/api/game) - Session, auth, saveScore, leaderboard, myStats. XP + ranks.",
"LeaderboardController (/api/leaderboard) - Top 50 traders por PnL del journal.",
"MarketController (/api/market) - Prices, exchanges, symbols, candles. Binance + Yahoo.",
"MercureController (/api/mercure) - Subscribe URL + auth cookie para SSE.",
"MonitoringController (/api/monitoring) - Logging frontend: log, stats, createEvent.",
"MusicController (/api/music) - Playlist admin: upload, URLs externas, stream con Range.",
"NotificationController (/api/notifications) - List, markRead, markAllRead, count, delete.",
"ProfileController (/api/profile) - Avatar CRUD, perfil publico.",
"TaskController (/api/tasks) - List tareas activas ordenadas.",
"WalletController (/api/wallet) - Balance, transactions, withdraw, me.",
]
for c in others:
    if pdf.get_y()>255: pdf.add_page()
    pdf.bul(c,14)


# 7. SERVICIOS
pdf.add_page(); pdf.sec("7","Servicios del Backend (7)")
pdf.body("7 servicios que encapsulan logica de negocio compartida entre controladores.")

svcs = [
("MercadoPagoService (162 lines)","Integracion MP Checkout Pro.",
 ["createPreference(ref, amountARS, title, backUrls) -> id, init_point","getPayment(paymentId) -> ?array","searchByExternalRef(ref) -> ?array", "callAPI(method,path,body,query) -> HTTP Bearer"],
 "file_get_contents + stream_context. Notification URL desde APP_SERVER_URL."),
("BinancePayService (155 lines)","Integracion Binance Pay (USDT).",
 ["createOrder(merchantTradeNo, amountUSD, returnUrl) -> prepayId, checkoutUrl","queryOrder(merchantTradeNo) -> ?array","verifyWebhookSignature(payload, signature) -> HMAC-SHA512","callAPI(method,path,body,timestamp) -> HMAC-SHA256"],
 "Headers: BinancePay-Timestamp, BinancePay-Nonce, BinancePay-Certificate-SN."),
("PushNotificationService (234 lines)","FCM dual-mode.",
 ["sendToUser(user, title, body, data) -> count notified","broadcast(title, body, data) -> all devices","sendV1(token...) -> FCM v1 API (OAuth2 JWT)","sendLegacy(token...) -> FCM legacy API","getAccessToken() -> Google OAuth2 via JWT assertion"],
 "Prioriza v1 API con service account. Fallback legacy."),
("PushService (alternative)","Kreait Firebase Admin SDK + Notification entity.",
 ["notify(user, type, content, data, link) -> entity + FCM","broadcast(type, content, data, filter, link) -> all users","sendPushToUser(user, type, content, data, notifId)"],
 "titleForType() mapea 10+ tipos a titulos en espanol."),
("TournamentMailer","Email + push transaccional.",
 ["notifyTournamentCreated(t) -> emails + push broadcast","notifyTournamentClosed(t) -> emails + push por participante"],
 "Twig en templates/emails/. Debug en var/log/emails/."),
("RealtimePublisher","Publica mensajes al hub Mercure.",
 ["publish(topic, data, private, type) -> bool"],
 "Usa Symfony Mercure Hub integration."),
("MercureSubscriberService","JWT y cookies para suscriptores Mercure.",
 ["getSubscribeUrl(topics) -> SSE URL","createSubscribeJwt(topics) -> JWT 1h","createAuthCookie(request, subscribe) -> mercureAuthorization cookie"],
 "JWT con claim mercure.subscribe y SameSite=Strict."),
]

for name, desc, methods, notes in svcs:
    if pdf.get_y()>240: pdf.add_page()
    pdf.ssub(name)
    pdf.body(desc)
    for m in methods:
        pdf.bul(m,16)
    pdf.warn(notes)

pdf.add_page()
pdf.sub("Comandos Console (8)")
cmds = [
("tournaments:process","Auto-cierra torneos vencidos. --dry-run, --watch, --interval seg."),
("app:seed-users","Crea 22 usuarios iniciales (DEMO, ADMIN01, EXEC01-10, ALUMNO01-20)."),
("app:seed-trades","Crea 24 trades ejemplo (12 DEMO crypto, 12 ADMIN01 forex). Idempotente."),
("app:seed-tasks","Crea 5 tareas operativas iniciales."),
("app:seed-academia","Crea 6 cursos de academia."),
("tnsvt:reset-web-data","Truncate 14 tablas contenido web. --force."),
("mercure:stream-candles","Daemon: cada 3s fetch + publica velas 15m a Mercure. 18 symbols."),
("app:create-student","Crea alumno individual (code + name)."),
]
for n,d in cmds:
    pdf.ssub(n); pdf.body(d)

# 8. FRONTEND WEB
pdf.add_page(); pdf.sec("8","Frontend Web")
pdf.body("Single-Page Application (SPA) con Twig + Vanilla JS + Symfony Asset Mapper + Service Worker PWA.")

pdf.sub("8.1 assets/app.js (6,271 lines)")
pdf.body("Modulos principales:")
mods = [
"CONFIG & SUPABASE - Config inicial",
"AUTH & LOGIN - toggleAdminPassField, verifyGateKey, logout",
"HUB VIEW - Divine Canvas con nodos SVG de estudio",
"TRADING PANEL - switchTab, 14 sidebar buttons, 13 tabs",
"DIVINE BACKGROUND - Particle system canvas",
"MACROECONOMIA - 12 sub-paneles educativos (FED, BCE, PMI, CPI, Dot Plot, Quiz)",
"TAREAS - loadTasks, toggleTask, updateInnerLocks",
"CALENDARIO ECONOMICO - switchCalTab, loadCalendarData",
"TRADING JOURNAL - CRUD completo: tjAddTrade, tjEditTrade, tjSetPeriod, tjExportCSV/HTML, tjImport",
"FEED - filterFeed, createNewPost, likeFeedPost, submitComment, initFeedRealtime",
"ACADEMIA - renderAcademia, cursos",
"MUSIC PLAYER - Barra persistente estilo Spotify",
"PUSH NOTIFICATIONS - requestPushPermission, initFCM, getFCMToken, onMessage",
"DEEP LINKS - Capacitor appUrlOpen handler",
"SW REGISTRATION - registerSW, skipWaiting",
"BIOMETRIC AUTH - isAvailable, authenticate, isEnabled",
"DIARIO AES-256-GCM - setupPassword, _deriveKey, _encrypt, _decrypt, saveEntry, openReader",
"SOCIAL MODULE - searchUsers, sendAccessReq, loadConnections, updatePerm, loadJournalSettings",
]
for m in mods:
    if pdf.get_y()>260: pdf.add_page()
    pdf.bul(m,14)

pdf.sub("8.2 assets/api.js (326 lines)")
pdf.body("Cliente API expuesto como window.API. Funciones: request(), get(), post(), put(), del(), patch(). 60+ metodos organizados por dominio. Resolucion automatica de base URL para Capacitor vs browser.")

pdf.sub("8.3 templates/base.html.twig")
pdf.body("Template unico con toda la UI:")
pdf.bul("Login screen: gateKey + admin password toggle")
pdf.bul("Header: logo T.N.S.V.T, notification bell, user badge con avatar dropdown")
pdf.bul("Hub view: nodos SVG de aprendizaje (PSI, TEC, FUN, FIB, STEP)")
pdf.bul("Trading panel: 14 sidebar buttons, 13 tab contents (Posts, Chart, Macro, 2Steps, Tasks, Calendar, Journal, Diary, Leaderboard, Academia, Chat, Social, Admin)")
pdf.bul("Modals: Notificaciones, Avatar menu, Journal Day Modal, Social Profile, Music Player Bar")


# 9. APLICACIONES MOVILES (APKs)
pdf.add_page(); pdf.sec("9","Aplicaciones Moviles (APKs)")
pdf.body("El proyecto incluye DOS aplicaciones Android independientes que comparten el mismo backend Symfony.")

pdf.sub("9.1 Web APK (com.tnsvt.app)")
pdf.body("Aplicacion principal para academia, journal, chat, social, chart en vivo.")
pdf.kv("Framework:","Capacitor v8 (Android)")
pdf.kv("Package:","com.tnsvt.app")
pdf.kv("Version:","1.6.x (actual 1.6.3, versionCode 9)")
pdf.kv("Tamano:","268 MB")
pdf.kv("Build:","cd android && gradlew.bat assembleDebug (JAVA_HOME=C:\\dev\\jdk\\jdk-21)")
pdf.kv("Sync:","npx cap sync android")
pdf.kv("Contenido:","Todo el frontend web empaquetado como APK (app.js, api.js, chart.js, base.html.twig)")
pdf.kv("APK file:","public/downloads/tnsvt-app.apk / public/apk/tnsvt-v1.6.3.apk")

pdf.sub("9.2 Game APK (com.tnsvt.market.instinct)")
pdf.body("Aplicacion de juego de trading con canvas propio, sistema de torneos y duelos 1v1.")
pdf.kv("Framework:","Capacitor v6 (Android)")
pdf.kv("Package:","com.tnsvt.market.instinct")
pdf.kv("Version:","1.2.x")
pdf.kv("Tamano:","5.2 MB")
pdf.kv("Build:","cd game-app/android && gradlew.bat assembleDebug")
pdf.kv("Contenido:","HTML5 canvas game, torneo trading panel, duelos 1v1")
pdf.kv("APK file:","public/downloads/tnsvt-market-instinct.apk")
pdf.kv("Nota:","El Game APK tiene firebase-messaging 23.1.2 (compatible con Android 14)")

pdf.sub("9.3 Backend Compartido")
pdf.body("AMBAS aplicaciones consumen el MISMO backend Symfony. NO hay backend separado por APK.")
pdf.bul("Misma entidad Wallet y WalletTransaction")
pdf.bul("Mismo sistema de pagos (MercadoPago + Binance Pay)")
pdf.bul("Misma autenticacion (X-Game-Code header)")
pdf.bul("Mismas push notifications (FCM)")
pdf.bul("Mismo sistema de torneos (Tournament/TournamentEntry)")
pdf.bul("Mismos duelos 1v1 (Duel/DuelRound)")

pdf.sub("9.4 Service Worker (PWA)")
pdf.body("Service Worker v37 (tnsvt-v37) con estrategia:")
pdf.bul("API calls: network-first, fallback to cache, offline JSON error response")
pdf.bul("Cache-bust (con ?v=): network-only")
pdf.bul("Static assets: cache-first, fallback to network, store in runtime cache")
pdf.bul("Push notifications: event.push handler con JSON payload, native notification")
pdf.bul("Precache: index, manifest.json, icons")

# 10. SISTEMA DE PAGOS COMPARTIDO
pdf.add_page(); pdf.sec("10","Sistema de Pagos Compartido")
pdf.note("IMPORTANTE: MercadoPago y Binance Pay son parte del BACKEND SYMFONY COMPARTIDO. NO son exclusivos del Game APK ni del Web APK. Ambos APKs pueden usar cualquiera de los dos metodos de pago.")

pdf.sub("10.1 Arquitectura de Pagos")
pay_diag = r"""
  Web APK                 Game APK
    |                        |
    +----------+-------------+
               |
    POST /api/mercadopago/create-payment
    POST /api/binance-pay/create-order
               |
    +----------+-----------+
    |  Symfony Backend     |
    |  MercadoPagoService  |
    |  BinancePayService   |
    +----------+-----------+
               |
    +----------+-----------+
    | Wallet Transaction   |
    | User.walletBalance   |
    +----------------------+
""".strip()
pdf.set_x(25); pdf.set_font("Courier","",6); pdf.set_text_color(*VIOLET)
for line in pay_diag.split("\n"):
    if pdf.get_y()>268: pdf.add_page(); pdf.set_x(25)
    pdf.cell(0,3,line,new_x="LMARGIN",new_y="NEXT")
pdf.ln(3)

pdf.sub("10.2 MercadoPago Checkout Pro")
pdf.body("Pagos en ARS (pesos argentinos). Flujo:")
pdf.bul("1. Cliente solicita POST /api/mercadopago/create-payment con amount_usd (1-1000)")
pdf.bul("2. Backend convierte USD a ARS via DolarController (dolarapi.com)")
pdf.bul("3. MercadoPagoService::createPreference() crea preferencia en MP API")
pdf.bul("4. Retorna init_point URL. Cliente abre en WebView/browser")
pdf.bul("5. MP envia IPN a POST /api/mercadopago/webhook")
pdf.bul("6. processPaymentNotification() verifica pago, credita wallet, marca WalletTransaction como confirmed")
pdf.bul("7. Idempotente: verifica refPaymentId duplicado")
pdf.ssub("Metodos MercadoPagoService")
pdf.bul("createPreference(externalRef, amountARS, title, backUrls) -> {id, init_point}",16)
pdf.bul("getPayment(paymentId) -> ?array",16)
pdf.bul("searchByExternalRef(externalRef) -> ?array",16)
pdf.warn("MP_ACCESS_TOKEN debe configurarse en .env. Sin token, endpoints retornan 501.")

pdf.add_page()
pdf.sub("10.3 Binance Pay (USDT)")
pdf.body("Pagos en USDT (stablecoin Binance Smart Chain). Flujo:")
pdf.bul("1. Cliente POST /api/binance-pay/create-order con amount_usd (1-1000)")
pdf.bul("2. BinancePayService::createOrder() crea orden en Binance Pay API")
pdf.bul("3. Retorna checkoutUrl. Cliente abre en WebView")
pdf.bul("4. Binance envia IPN con HMAC-SHA512 signature a POST /api/binance-pay/webhook")
pdf.bul("5. verifyWebhookSignature() valida firma contra BINANCE_PAY_SECRET_KEY")
pdf.bul("6. Si PAY_SUCCESS, credita wallet, actualiza WalletTransaction")
pdf.ssub("Metodos BinancePayService")
pdf.bul("createOrder(merchantTradeNo, amountUSD, returnUrl) -> {prepayId, checkoutUrl}",16)
pdf.bul("queryOrder(merchantTradeNo) -> ?array",16)
pdf.bul("verifyWebhookSignature(payload, signature) -> bool (HMAC-SHA512)",16)
pdf.warn("BINANCE_PAY_API_KEY y BINANCE_PAY_SECRET_KEY en .env. Sin config, endpoints 501.")

pdf.sub("10.4 WalletTransaction - Tipos y Estados")
pdf.code("""
  TYPES:
    TYPE_DEPOSIT      = "deposit"       # Credito manual/admin
    TYPE_ENTRY_FEE    = "entry_fee"     # Fee de torneo
    TYPE_PAYOUT       = "payout"        # Premio de torneo
    TYPE_REFUND       = "refund"        # Reembolso
    TYPE_WITHDRAW     = "withdraw"      # Retiro solicitado
    TYPE_DUEL_ENTRY   = "duel_entry"    # Fee de duelo 1v1
    TYPE_DUEL_WIN     = "duel_win"      # Premio de duelo
    TYPE_DUEL_REFUND  = "duel_refund"   # Reembolso de duelo

  STATUSES:
    STATUS_PENDING    = "pending"       # Transaccion pendiente
    STATUS_CONFIRMED  = "confirmed"     # Confirmada
    STATUS_REJECTED   = "rejected"      # Rechazada
    STATUS_REFUNDED   = "refunded"      # Reembolsada

  METHODS:
    METHOD_MANUAL_MP, METHOD_MANUAL_BINANCE, METHOD_MANUAL_CRYPTO,
    METHOD_AUTO_MP, METHOD_AUTO_BINANCE, METHOD_AUTO_CRYPTO,
    METHOD_GIFT, METHOD_OTHER
""".strip())

pdf.sub("10.5 Admin Wallet (Credit/Debit)")
pdf.body("Admin puede creditar/debitar wallets via AdminWalletController con X-Admin-Password.")
pdf.bul("POST /api/admin/wallet/credit -> code + amount + notes (idempotente via payment_id)")
pdf.bul("POST /api/admin/wallet/debit -> code + amount + notes")
pdf.bul("GET /api/admin/wallet/pending -> withdrawals pendientes")
pdf.bul("POST /api/admin/wallet/withdraw/{id}/approve -> aprueba retiro")
pdf.bul("POST /api/admin/wallet/withdraw/{id}/reject -> rechaza y reembolsa")
pdf.bul("GET /api/admin/wallet/transactions -> auditoria (ultimas N)")


# 11. TIEMPO REAL CON MERCURE
pdf.add_page(); pdf.sec("11","Tiempo Real con Mercure")
pdf.body("Sistema de tiempo real basado en Mercure (Server-Sent Events) para streaming de velas y tickers.")

pdf.sub("11.1 Arquitectura Mercure")
merc_diag = r"""
  +-------------------+       +-------------------+       +-----------------+
  | MercureStreamCmd  | ----> | RealtimePublisher  | ----> | Mercure Hub     |
  | (PHP daemon 3s)   |       | Symfony Service    |       | Docker :3000    |
  +-------------------+       +-------------------+       +--------+--------+
                                                                   |
                                                          +--------+--------+
                                                          |  SSE Stream     |
                                                          | /chart/{ex}/{s} |
                                                          | /chart/ticker   |
                                                          +--------+--------+
                                                                   |
                                                    +---------------+---------------+
                                                    |                               |
                                            +-------+--------+           +----------+------+
                                            | Web APK PWA    |           | Game APK       |
                                            | chart.js       |           | HTML5 Canvas   |
                                            | EventSource    |           | EventSource    |
                                            +----------------+           +----------------+
""".strip()
pdf.set_x(12); pdf.set_font("Courier","",5.5); pdf.set_text_color(*VIOLET)
for line in merc_diag.split("\n"):
    if pdf.get_y()>268: pdf.add_page(); pdf.set_x(12)
    pdf.cell(0,2.8,line,new_x="LMARGIN",new_y="NEXT")
pdf.ln(3)

pdf.sub("11.2 Componentes")
pdf.ssub("MercureStreamCommand (mercure:stream-candles)")
pdf.body("Daemon PHP que cada 3 segundos:")
pdf.bul("Fetch ultimas 3 velas (interval 15m) desde Binance API",16)
pdf.bul("Para 18 symbols en 3 exchanges (binance, bybit, kraken)",16)
pdf.bul("Publica por symbol a /chart/{exchange}/{symbol}",16)
pdf.bul("Publica snapshot agregado a /chart/ticker",16)

pdf.ssub("RealtimePublisher")
pdf.body("Servicio que envua updates al hub Mercure via POST.")
pdf.kv("Metodo:","publish(topic, data, private, type) -> bool")
pdf.kv("Auth:","JWT publisher key desde MERCURE_JWT_SECRET")

pdf.ssub("MercureSubscriberService")
pdf.body("Genera JWT subscriber tokens y auth cookies.")
pdf.kv("getSubscribeUrl():","Construye URL SSE con topic params")
pdf.kv("createSubscribeJwt():","JWT 1h con claim mercure.subscribe")
pdf.kv("createAuthCookie():","Cookie mercureAuthorization con SameSite=Strict")

pdf.ssub("MercureController")
pdf.bul("GET /api/mercure/subscribe?exchange=X&symbol=Y -> URL + auth cookie")
pdf.bul("GET /api/mercure/ticker -> URL + auth cookie para ticker")

pdf.sub("11.3 Frontend (chart.js)")
pdf.body("El frontend se conecta a Mercure via EventSource nativo:")
pdf.bul("Primero obtiene subscribe URL de /api/mercure/subscribe")
pdf.bul("Abre EventSource a la URL del hub Mercure (con cookie de auth)")
pdf.bul("Recibe velas en tiempo real, actualiza grafico Lightweight Charts")
pdf.bul("Polling cae a 15s y luego a 5s si Mercure no conecta")
pdf.bul("Drawing toolbar: trendline, hline, vline, fib, rect, text, undo, clear")

pdf.sub("11.4 Docker")
pdf.code("""
  services:
    mercure:
      image: dunglas/mercure:latest
      ports:
        - "3000:3000"
      environment:
        MERCURE_PUBLISHER_JWT_KEY: ${MERCURE_JWT_SECRET}
        MERCURE_SUBSCRIBER_JWT_KEY: ${MERCURE_JWT_SECRET}
        SERVER_NAME: ':3000'
        MERCURE_EXTRA_DIRECTIVES: cors_origins http://192.168.1.2:8000
""".strip())

# 12. PUSH NOTIFICATIONS (FCM)
pdf.add_page(); pdf.sec("12","Push Notifications (FCM)")
pdf.body("Sistema de notificaciones push dual-mode usando Firebase Cloud Messaging.")

pdf.sub("12.1 Arquitectura Push")
push_diag = r"""
  Symfony Backend
       |
  +----+----+
  |  Push   |
  | Service |
  +----+----+
       |
  +----+-------------+
  |                  |
  FCM v1 API     FCM Legacy
  (preferred)    (fallback)
       |               |
  +----+----+    +-----+------+
  | Service  |    | Server Key |
  | Account  |    | (legacy)   |
  +---------+    +------------+
       |               |
       +-------+-------+
               |
      Firebase Cloud Messaging
               |
     +---------+---------+
     |                   |
  Android Push         Web Push
  (FCM native)        (VAPID + SW)
""".strip()
pdf.set_x(25); pdf.set_font("Courier","",5.5); pdf.set_text_color(*VIOLET)
for line in push_diag.split("\n"):
    if pdf.get_y()>268: pdf.add_page(); pdf.set_x(25)
    pdf.cell(0,2.8,line,new_x="LMARGIN",new_y="NEXT")
pdf.ln(3)

pdf.sub("12.2 PushNotificationService (234 lines)")
pdf.body("Servicio principal de push con dos modos de envio:")
pdf.ssub("Modo v1 (preferido)")
pdf.bul("Usa service account JSON (FCM_SERVICE_ACCOUNT env var)",14)
pdf.bul("Genera JWT assertion RS256 firmada con private key",14)
pdf.bul("Exchange por OAuth2 access token via Google API",14)
pdf.bul("Envia a https://fcm.googleapis.com/v1/projects/{id}/messages:send",14)
pdf.ssub("Modo Legacy (fallback)")
pdf.bul("Usa FCM_SERVER_KEY (legacy)",14)
pdf.bul("Envia a https://fcm.googleapis.com/fcm/send con key={serverKey}",14)

pdf.sub("12.3 PushService (alternativo)")
pdf.body("Usa Kreait Firebase Admin SDK (composer: kreait/firebase-php ^8.2). Ademas persiste Notification entities en DB.")
pdf.bul("notify(user, type, content, data, link) -> Notification entity + push")
pdf.bul("broadcast(type, content, data, filter, link) -> all active users")
pdf.bul("titleForType() mapea tipos: comment, like, post, mention, signal, dm, academia, task, access_request, access_accepted, etc.")

pdf.sub("12.4 Device Registration")
pdf.body("Cada dispositivo debe registrar su FCM token via:")
pdf.bul("POST /api/devices/register -> user_code, fcm_token, platform, device_model")
pdf.bul("POST /api/devices/unregister -> fcm_token")
pdf.kv("Entity:","Device: fcmToken(512), platform, deviceModel, registeredAt, lastSeenAt")

pdf.sub("12.5 Notification Types")
pdf.code("""
  comment, like, post, mention    -> Feed social
  signal                          -> Senial de trading
  dm                              -> Mensaje directo
  academia                        -> Nuevo curso
  task                            -> Nueva tarea
  access_request                  -> Solicitud de acceso social
  access_accepted                 -> Solicitud aceptada
  access_rejected                 -> Solicitud rechazada
  connection_removed              -> Conexion eliminada
  permissions_changed             -> Permisos actualizados
""".strip())


# 13. AUTENTICACION Y SEGURIDAD
pdf.add_page(); pdf.sec("13","Autenticacion y Seguridad")
pdf.body("Sistema de autenticacion basado en codigo de usuario con soporte para administradores con password.")

pdf.sub("13.1 CodeAuthenticator")
pdf.body("Custom authenticator que valida usuarios mediante el header X-Game-Code:")
pdf.bul("1. Request llega con header X-Game-Code: DEMO")
pdf.bul("2. CodeAuthenticator extrae el codigo y busca User en DB via UserProvider")
pdf.bul("3. Si existe y active=true, crea session (Symfony) o retorna passport")
pdf.bul("4. Si no existe, retorna 401 Unauthorized")
pdf.bul("Los controladores tambien aceptan user_code en body/query via helper getCurrentUser()")

pdf.sub("13.2 UserProvider")
pdf.kv("Metodo:","loadUserByIdentifier(code) -> busca User por code")
pdf.kv("Metodo:","refreshUser(user) -> refresca desde DB")
pdf.kv("Metodo:","supportsClass() -> App\\Entity\\User")

pdf.sub("13.3 Admin Auth")
pdf.body("Los endpoints administrativos usan header X-Admin-Password (via AdminAuthTrait):")
pdf.bul("AdminWalletController: credit, debit, withdrawals")
pdf.bul("TournamentController: create, close, cancel")
pdf.bul("MusicController: playlist management")
pdf.bul("FeedController: Admin puede eliminar cualquier post")
pdf.kv("Password:","ACADEMIA_ADMIN_PASS en .env (actual: TNSVT-Academia-2026)")

pdf.sub("13.4 Security Configuration")
pdf.code("""
  security:
    password_hashers:
      App\\Entity\\User: 'auto'
    providers:
      app_user_provider:
        id: App\\Security\\UserProvider
    firewalls:
      main:
        lazy: true
        provider: app_user_provider
        custom_authenticator: App\\Security\\CodeAuthenticator
        logout:
          path: /api/auth/logout
    access_control:
      - { path: ^/, roles: PUBLIC_ACCESS }
""".strip())

pdf.sub("13.5 Journal Access Control")
pdf.body("El sistema de journal social tiene 3 niveles de visibilidad y 6 permisos granulares:")
pdf.kv("Visibilidad:","public (todos ven stats), connections (solo conectados), private (solo owner)")
pdf.kv("Permisos:","canViewStats, canViewTrades, canViewNotes, canViewComments, canDownloadCsv, canViewRealtime")
pdf.body("Cuando un usuario no-propietario accede al journal, el controlador filtra los datos segun el permiso activo. Los permisos se configuran via PATCH /api/permissions/{code}.")

# 14. BASE DE DATOS Y MIGRACIONES
pdf.add_page(); pdf.sec("14","Base de Datos y Migraciones")
pdf.body("El sistema usa Doctrine ORM 3.6 con SQLite en desarrollo y PostgreSQL en produccion. 14 migraciones aplicadas durante Junio 2026.")

pdf.sub("14.1 Migraciones")
pdf.code("""
  2026-06-10  Version20260610213518.php   # Usuarios iniciales + auth
  2026-06-11  Version20260611003208.php   # Wallet + transactions
  2026-06-12  Version20260612144923.php   # Torneos
  2026-06-13  Version20260613051000.php   # Feed + posts
  2026-06-17  Version20260617171951.php   # Chat + mensajes
  2026-06-17  Version20260617192614.php   # Notificaciones
  2026-06-17  Version20260617193440.php   # Academia + cursos
  2026-06-17  Version20260617235932.php   # Juego + scores
  2026-06-22  Version20260622002308.php   # MercadoPago + Binance
  2026-06-22  Version20260622025850.php   # Push notifications
  2026-06-22  Version20260622025909.php   # Music player
  2026-06-25  Version20260625021044.php   # Duelos 1v1 + rounds
  2026-06-27  Version20260627140251.php   # Diary + traits
  2026-06-27  Version20260627214623.php   # Journal social system
""".strip())

pdf.sub("14.2 Diagrama de Relaciones (Simplificado)")
rel_diag = r"""
  users
    |--- wallet_transactions (OneToMany)
    |--- tournament_entries (OneToMany)
    |--- diary_entries (OneToMany)
    |--- connections (OneToMany)
    |--- journal_settings (OneToOne)
    |--- trader_profiles (OneToOne)
    |--- devices (OneToMany)
    |--- notifications (OneToMany)
    |--- game_scores (OneToMany)
    |--- module_progress (OneToMany)
    |
  tournaments
    |--- tournament_entries (OneToMany)
    |
  duels
    |--- duel_rounds (OneToMany)
    |--- player1 -> User (ManyToOne)
    |--- player2 -> User (ManyToOne)
    |--- winner -> User (ManyToOne)
    |
  conversations
    |--- messages (OneToMany)
    |--- conversation_participants (OneToMany)
    |
  feed_posts
    |--- liked_posts (OneToMany)
    |--- author -> User (ManyToOne)
""".strip()
pdf.set_x(12); pdf.set_font("Courier","",5.5); pdf.set_text_color(*VIOLET)
for line in rel_diag.split("\n"):
    if pdf.get_y()>268: pdf.add_page(); pdf.set_x(12)
    pdf.cell(0,2.8,line,new_x="LMARGIN",new_y="NEXT")

pdf.sub("14.3 Composer Dependencies Clave")
pdf.kv("Doctrine:","doctrine/doctrine-bundle ^3.2, doctrine/orm ^3.6, doctrine/migrations ^4.0")
pdf.kv("Firebase:","kreait/firebase-php ^8.2")
pdf.kv("CORS:","nelmio/cors-bundle ^2.6")
pdf.kv("Mercure:","symfony/mercure")
pdf.kv("Mailer:","symfony/mailer (actualmente null://null)")
pdf.kv("Security:","symfony/security-bundle 8.1.*")
pdf.kv("Serialization:","symfony/serializer + property-access + property-info")

# 15. ROADMAP
pdf.add_page(); pdf.sec("15","Roadmap y Proximos Pasos")
pdf.body("Hoja de ruta planificada para el proyecto TNSVT.")

roadmap = [
("Completado","Junio 2026","Backend Symfony (26 entidades, 27 controladores, 7 servicios)"),
("Completado","Junio 2026","Web APK v1.6.3 con Capacitor v8"),
("Completado","Junio 2026","Game APK v1.2.0 con Capacitor v6"),
("Completado","Junio 2026","Sistema de pagos: MercadoPago + Binance Pay"),
("Completado","Junio 2026","Tiempo real via Mercure Hub (Docker)"),
("Completado","Junio 2026","Push notifications FCM v1 + Legacy"),
("Completado","Junio 2026","Journal Social System (permisos + conexiones)"),
("Completado","Junio 2026","Duelos 1v1 (modo de juego)"),
("Completado","Junio 2026","Autenticacion por codigo con CodeAuthenticator"),
("Completado","Junio 2026","Chat de ejecutores con soporte AI"),
("Completado","Junio 2026","Academia (cursos educativos con progreso)"),
("Completado","Junio 2026","Macroeconomia (12 modulos interactivos)"),
("Completado","Junio 2026","Service Worker PWA v37 con offline"),
("Pendiente","Corto plazo","PostgreSQL migration (produccion)"),
("Pendiente","Corto plazo","Configurar SMTP real para TournamentMailer"),
("Pendiente","Mediano plazo","WebSocket nativo como alternativa a Mercure"),
("Pendiente","Mediano plazo","Sistema de alerts/notificaciones programables"),
("Pendiente","Mediano plazo","API publica para terceros con API keys"),
("Pendiente","Largo plazo","iOS version via Capacitor"),
("Pendiente","Largo plazo","Multi-idioma (EN/PT)"),
("Pendiente","Largo plazo","Despliegue en produccion con CI/CD"),
]

for status, timeframe, task in roadmap:
    if pdf.get_y()>250: pdf.add_page()
    pdf.ssub(f"[{status}] {timeframe}")
    pdf.body(task)
    if status == "Pendiente":
        pdf.set_text_color(*GOLD)
    else:
        pdf.set_text_color(*WHITE)

# FINAL
pdf.add_page()
pdf.set_y(100)
pdf.set_font("Helvetica","B",24); pdf.set_text_color(*GOLD)
pdf.cell(0,14,"T.N.S.V.T",align="C",new_x="LMARGIN",new_y="NEXT")
pdf.set_font("Helvetica","",12); pdf.set_text_color(*VIOLET)
pdf.cell(0,8,"Documentacion Tecnica de Arquitectura",align="C",new_x="LMARGIN",new_y="NEXT")
pdf.ln(10)
pdf.set_font("Helvetica","",9); pdf.set_text_color(*LGRAY)
pdf.cell(0,6,"Fin del documento",align="C",new_x="LMARGIN",new_y="NEXT")
d = datetime.date.today().strftime("%d/%m/%Y")
pdf.cell(0,6,f"Generado: {d} | Symfony 8.1 / PHP 8.4 | TNSVT Platform",align="C",new_x="LMARGIN",new_y="NEXT")

# OUTPUT
os.makedirs("docs", exist_ok=True)
pdf.output("docs/arquitectura.pdf")
print(f"PDF generated: docs/arquitectura.pdf ({pdf.page_no()} pages)")
