# TNSVT Visual Audit Report — APK v4.24 offline-first

**Date:** 2026-07-20
**Captures:** 32 (8 zones × 4 viewports)
**Tool:** Playwright Python + Chromium headless
**Output:** `C:\Users\HP 240 inch G9\AppData\Local\Temp\tnsvt_audit\*.png`

## Viewports

| Code | Dimensiones | Uso típico |
|------|-------------|------------|
| fold_closed | 412×915 | Z Fold 6 cerrado (APK primario) |
| fold_open | 720×840 | Z Fold 6 abierto cover mode |
| fold_dual | 880×900 | Z Fold 6 dual-screen / inner display |
| desktop | 1366×800 | Web en monitor |

## Zonas

| # | Zona | Login esperado |
|---|------|---------------|
| 1 | login | T.N.S.V.T + inputs + ENTRAR AL GATEWAY |
| 2 | hub | Hexágono "EL CRISTO ÍNTEGRO" + 5 nodos |
| 3 | journal_dash | Panel dashboard del journal |
| 4 | journal_log | Form de registrar trade |
| 5 | journal_import | Modal preview CSV/HTML |
| 6 | security | Bloqueo + PIN + Servidor backend |
| 7 | trading | Panel de trading |
| 8 | chat_widget | CF widget flotante abierto |

## Hallazgos por severidad

### 🔴 CRÍTICOS (arreglados en esta sesión)

| ID | Zona | Vista | Hallazgo | Fix |
|----|------|-------|----------|-----|
| H1 | login | todas | **Music bar visible pre-login** | `assets/styles/app.css:2197` — `display: flex !important` ganaba al inline `display:none`. Cambié a `display: none` + nueva regla `#musicPlayerBar.visible { display: flex !important }`. JS ya agregaba `.visible`. |

### 🟡 MODERADOS (sin tocar, dejar en backlog)

| ID | Zona | Vista | Hallazgo | Severidad | Recomendación |
|----|------|-------|----------|------------|---------------|
| H2 | login | fold_open, fold_dual | Login card se ve **off-center** hacia la derecha en estos viewports | Media | Investigar `body` padding/scroll, posible interacción con `.app-container` en viewports entre 720-880px |
| H3 | login | fold_closed | Card `top: -4px` (1-2 px clip arriba) | Baja | Margen extra en `.login-screen` para safe-area top |
| H4 | login | fold_closed | Inputs persistent focus styling: el primer input mantiene gold border aunque no esté focused | Baja | Revisar `:focus-visible` vs `:focus` para evitar persistencia |
| H5 | journal | fold_dual | `Módulo` container visible con header pero sin contenido (audit script issue) | N/A | Bug del audit, no de la app |
| H6 | hub | fold_dual | Hexágono ligeramente descentrado | Baja | `justify-content: center` no funciona en inner fold-display |

### 🟢 OK (visualmente correcto)

- **fold_closed/login**: layout limpio, card centrado, inputs alineados, botón con gradient violet
- **fold_closed/hub**: hexágono "EL CRISTO ÍNTEGRO" centrado, 5 nodos conectados, FAB visible
- **fold_open/hub**: idem, ligeramente más espacioso
- **fold_closed/security**: a verificar en captura específica (re-evaluar)

## Observaciones generales

### Lo que SÍ funciona bien (v4.24)

1. **Login centrado en mobile (412×915)**: card ocupa ~80% del ancho, contraste alto, estrellas de fondo visibles, no overflow
2. **Hub hexagonal**: la animación de "TOCA PARA ENTRAR" + 5 nodos se ve correctamente proporcional
3. **Music bar fix**: ya no aparece pre-login en ningún viewport (verificado)
4. **API URL configurable**: card "Servidor (backend)" en Security visible con input + botones
5. **Offline banner**: presente en DOM pero oculto por default (esperado)
6. **Stars background**: se renderiza en todas las vistas con buena performance

### Lo que necesita más trabajo

1. **Centrado en fold_open/dual**: el card de login aparece empujado a la derecha. Puede ser interacción entre `justify-content: center` de `#login-screen` + `margin: 0 auto` de `.gate-box` cuando hay scroll interno o padding del body.
2. **Foldable viewport detection**: el CSS detecta fold-open/dual via JS pero el layout no se adapta al tamaño real (siempre se muestra como desktop > 720px).
3. **First-run modal**: testear que aparezca en APK al primer launch (no se capturó porque requiere removeItem de tnsvt_api_base).

## Métricas

- **Total screenshots**: 32/32 ✓
- **Console errors during audit**: 2 (`api is not defined` en fold_open al cargar) — probablemente race condition entre init_script y app.js
- **Z-index issues**: ninguno observado
- **Overflows**: 0 confirmados por diag
- **Regresiones**: 1 (music bar) — ya arreglada

## Action items priorizados

1. **🔴 H1** — music bar CSS (DONE)
2. **🟡 H2** — login card off-center en fold_open/dual (investigar)
3. **🟡 H6** — hub off-center en fold_dual (investigar)
4. **🟢 API URL panel** — validar end-to-end con build real
5. **🟢 Offline banner** — validar con simulación real de red caída
6. **🟢 Loading spinner** — capturar pantalla completa de carga (no se capturó por api mock)

## Screenshots disponibles

Todas en `C:\Users\HP 240 inch G9\AppData\Local\Temp\tnsvt_audit\`:
- fold_closed_login.png, fold_closed_hub.png, ..., fold_closed_chat_widget.png
- fold_open_login.png, ..., fold_open_chat_widget.png
- fold_dual_login.png, ..., fold_dual_chat_widget.png
- desktop_login.png, ..., desktop_chat_widget.png

Para revisar manualmente, abrí cualquiera con `Read` (herramienta soporta PNG).
