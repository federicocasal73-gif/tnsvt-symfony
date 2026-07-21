# 📱 APK Audit — TNSVT Web App

**Fecha:** 2026-07-18  
**Versión APK analizada:** 4.15 (versionCode 302) — debug-signed  
**Backend live:** https://tnsvt.com  
**Dispositivo principal:** Samsung Galaxy Z Fold 6 (`RFCXA0HZXFZ`) — **no estaba disponible durante este audit (USB drivers "Unknown"), capturé solo data estática + emulación mental**

---

## 🎯 Resumen Ejecutivo

| Categoría | Estado actual | Acción |
|---|---|---|
| **Visual / responsive** | ⚠️ Problemas concretos identificados | Fix en Fase 1 |
| **Bundle / performance** | ⚠️ 582KB JS minificado + 205KB CSS | Optim en Fase 2 |
| **Offline (journal/trades)** | ❌ No implementado | Build en Fase 3 |
| **Push notifications** | ❌ Sin `google-services.json` ni `service-account.json` | Setup en Fase 4 |
| **Release signing** | ⚠️ Solo debug keystore | Setup en Fase 5 |
| **Foldable detection** | ❌ Sin soporte específico Z Fold 6 | Add en Fase 1 |

---

## 🐛 Issues Encontrados (priorizados)

### 🔴 **P0 — Critical (bloquean uso en producción)**

#### P0.1 — Inputs con font-size 0.82rem (~13px) → zoom forzado en iOS Safari
**Archivo:** `public/assets/styles/app-quwxj4o.css`  
**Líneas afectadas:** ~421, 459, 487 (`.journal-form input`, `.tj-filter-input`, `.tj-field input`)  
**Impacto:** En iOS Safari (no Android, pero afecta futuros iOS): al hacer focus, Safari hace zoom automático a 16px. Fix universal: `font-size: 16px !important` en inputs.

#### P0.2 — **Layout fullscreen canvas con `position: fixed; height: 100%`** ignora fold inner display
**Líneas 34 (`canvas`), 158 (`vector-lines`)**  
**Archivo:** `assets/styles/app-quwxj4o.css`  
**Impacto:** En Z Fold 6 cuando se abre, el WebView pasa de `904×2316` (cover) a `1812×2176` (main). El background canvas fixed puede parpadear si no se reposiciona. Hay `resize` listener en JS que arregla canvas (línea 664), pero el `position:fixed` puede crear gap visual.

#### P0.3 — **Push registration no está realmente conectado**
**Archivo:** `public/assets/app-Tw0rZEo.js` línea 5595/5640  
**Búsqueda:** Cero referencias a `PushNotifications.register()` o `PushNotifications.requestPermissions()`.  
**Conclusión:** El plugin se importa pero el `register` no se llama nunca. Sin register, no llega FCM token al server → no llegan pushes.

#### P0.4 — **Offline detection ausente**
**Búsqueda:** Cero referencias a `navigator.onLine`, listeners `online/offline`.  
**Impacto:** No hay UI que avise "estás offline". App depende 100% de la red. Si el usuario abre en subterráneo / avión, ve pantallas vacías.

---

### 🟠 **P1 — High (degrada UX significativamente)**

#### P1.1 — **Mix `100vh` / `100dvh` en CSS** (12 ocurrencias)
```
line 26:  width: 100%; min-height: 100vh;
line 38:  min-height: 100vh;
line 46:  min-height: 100vh;
line 105: min-height: 100dvh;  ← este está bien
line 211: max-height: calc(100vh - 140px);
line 2070: height: 100vh !important;
line 2097: max-height: calc(100dvh - 160px) !important;
line 2111: max-height: calc(100vh - 140px) !important;
line 2316: max-height: calc(100vh - 140px) !important;
line 2614: height:75vh !important; (.cf-panel)
```
**Impacto:** En navegadores antiguos (Chrome < 108, sin dvh) y en iOS Safari, `100vh` = viewport CON address bar visible (no se actualiza al ocultar). La app puede quedar con espacio vacío abajo o scroll extra en el primer render. **Fix:** estandarizar a `100dvh` con fallback `vh`.

#### P1.2 — **`.cf-panel` dimensiones fijas** (`75vh` + `bottom: 100px`)
**Líneas:** 2614-2615  
**Impacto:** En Z Fold 6 cover screen (904x2316, ~32:9 vertical), con safe-area bottom, el panel puede tapar el botón "Enviar" chat.

#### P1.3 — **No se detectó `min-height: 44px` / `44x44` tap targets** en la mayoría de iconos
**Análisis:** 64 declaraciones `overflow:auto/scroll/hidden` + muchos botones pequeños (`.icon-btn`, `.close-btn`, `.chip`).  
**Impacto:** Botones <44px fallan **WCAG 2.5.5 Target Size** y Apple HIG. Usuarios con dedos grandes fallan taps.

#### P1.4 — **`body` sin overflow control** + 64 `overflow:auto|hidden` declarados
**Impacto:** Posibles scroll-traps en modales: si un usuario scrollea en un modal, al llegar al fondo puede scrollear el body detrás (generando "doble scroll").

---

### 🟡 **P2 — Medium (mejoras de polish)**

#### P2.1 — **Solo `localStorage`** para estado, **cero `IndexedDB`**
**Archivo:** `assets/app-Tw0rZEo.js` líneas 30-690  
**Impacto:** 
- Límite 5-10MB localStorage
- Sin API estructurada para offline data
- Sin índices ni queries
- Para journal entries, trades, esto no escala

#### P2.2 — **No visualViewport API** para keyboards mobile
**Búsqueda:** Cero referencias a `window.visualViewport`  
**Impacto:** Cuando aparece keyboard, el viewport cambia pero el layout no se ajusta → cover screen queda con botones cubiertos por teclado.

#### P2.3 — **Capacitor Preferences plugin instalado pero no usado**
**Búsqueda:** Cero referencias a `Preferences.get/set`  
**Impacto:** Capacitor's `Preferences` debería usarse para guardar tokens FCM, last-seen, etc. en lugar de localStorage (persiste mejor en WebViews).

---

## 📊 Bundle Analysis

| Asset | Tamaño | Estado |
|---|---|---|
| `api-*.js` | 16 KB | ✅ |
| `app-*.js` | 378 KB | ⚠️ Grande (377 KB es > 200KB threshold) |
| `chart-*.js` | 27 KB | ✅ |
| `stimulus_bootstrap-*.js` | 0.2 KB | ✅ |
| `styles/app-*.css` | 205 KB | ⚠️ Grande (debería ser <100KB con code-split) |
| **JS total** | **422 KB** | Target: <200 KB con code-split |
| **CSS total** | **205 KB** | Target: <80 KB |

---

## 📁 Server-side: lo que YA existe

```
✅ 39 controllers en src/Controller/Api/
✅ /api/journal (GET, POST, PUT, DELETE)
✅ /api/journal/settings, /journal/stats, /journal/drawdown, /journal/tags
✅ /api/diary/* (DiaryController)
❌ /api/sync/* (a crear)
❌ /api/trades/* (parece incluido en journal - verificar)
```

---

## 🌐 Capacitor Config Status

```json
{
  "appId": "com.tnsvt.app",
  "server.url": "https://tnsvt.com",     ✅ actualizado
  "androidScheme": "https",                ✅
  "allowMixedContent": true,               ⚠️ innecesario si HTTPS puro
  "webContentsDebuggingEnabled": true      ⚠️ debería ser false en release
}
```

---

## 🎯 Plan de Acción por Fase

### **Fase 1 — Fixes visuales (~2-3 horas)**
- [ ] P0.1: Inputs font-size 16px (scan + fix todos los selectores)
- [ ] P0.2: Canvas/vector-lines reposition en resize fold (listener para `matchMedia('(spanning: single-fold-vertical)')`)
- [ ] P1.1: Estandarizar `100dvh` con fallback `100vh` (usar `@supports`)
- [ ] P1.3: Min tap target 44px via CSS global rule + spots fijos
- [ ] P2.2: `visualViewport.addEventListener('resize', ...)` para keyboards

### **Fase 2 — Bundle optimization (~3-4 horas)**
- [ ] Code-split `app.js` por tab (lazy imports via `import()`)
- [ ] Tree-shake dependencias no usadas
- [ ] Comprimir imágenes (iconos 512px PNG → WebP)
- [ ] R8 + shrinkResources (ya está en build.gradle, verificar reglas)
- [ ] Service Worker: precache solo `index.html` + `manifest.json` + `app-*.js` actual
- [ ] Lighthouse mobile audit after

### **Fase 3 — Offline journal/trades (~6-8 horas)**
Backend:
- [ ] `POST /api/sync/push` recibe batch ops → devuelve IDs servidor
- [ ] `GET /api/sync/snapshot?since=<ts>` → full state para cache inicial
- [ ] Tabla `sync_queue` audit
- [ ] Conflict resolution last-write-wins con timestamps
Cliente:
- [ ] IndexedDB schema: `journal_entries`, `trades`, `pending_ops`
- [ ] `OfflineAPI` wrapper (transparent fallback)
- [ ] Sync UI badge (topbar indicator)
- [ ] Background sync cada 30s cuando vuelve online

### **Fase 4 — Push FCM (~2-3 horas, requiere credenciales del usuario)**
- [ ] Generar/download `google-services.json` (Firebase Console)
- [ ] Subir `service-account.json` a `var/firebase/` del server
- [ ] Llamar `PushNotifications.register()` post-login en JS
- [ ] Backend guarda token en tabla `Device`
- [ ] Test push desde backend al APK real

### **Fase 5 — Release-signed APK (~1 hora)**
- [ ] Generar keystore privado
- [ ] Crear `app/keystore.properties` (no commiteado)
- [ ] `gradlew assembleRelease`
- [ ] Test on Z Fold 6
- [ ] Subir a `https://tnsvt.com/downloads/`
- [ ] Página `/beta.html` con instrucciones

### **Fase 6 — Play Store assets (opcional)**
Solo si decidís publicar. No prioritario para beta cerrada.

---

## 🔧 Dependencias del usuario

| Recurso | Estado | Acción |
|---|---|---|
| Z Fold 6 físico | ❌ desconectado | Reconectar USB y aceptar RSA popup |
| `var/firebase/service-account.json` (server) | ❌ falta | Generar en Firebase Console |
| `android/app/google-services.json` | ❌ falta | Generar en Firebase Console |

---

## 📝 Próximo paso inmediato

**Fase 1 fixes** — Empezar por los P0 críticos. ¿Voy adelante?
