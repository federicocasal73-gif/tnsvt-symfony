# Plan: Journal Sharing Fixes

## Bug crítico encontrado

**`loadJournalFromApi()`** en `assets/app.js:3664` chequea `data.length` pero el backend devuelve `{success, scope, trades, stats}` (objeto, no array). Esto significa que **nunca se cargan trades de la API** — solo funciona con trades cacheados en localStorage.

## Issues a resolver

### 1. Fix `loadJournalFromApi()` (app.js:3664)
- Cambiar `if (data && data.length)` por `if (data && data.success && data.trades)`
- Agregar parámetro `targetCode` opcional (si no se pasa, usa `window.TNSVT_USER.code`)
- Guardar `window._journalViewingCode`, `window._journalScope`, `window._journalStats`
- Llamar a `tjRefresh()` que debe mostrar stats del otro usuario si `_journalViewingCode` está seteado

### 2. Banner "Viendo journal de X" (base.html.twig + app.js)
- Después del header místico del journal tab (línea 2600), agregar:
```html
<div id="journalViewingBanner" style="display:none; background:rgba(138,60,255,0.15); border:1px solid rgba(138,60,255,0.3); border-radius:8px; padding:10px 14px; margin-bottom:12px; align-items:center; gap:10px;">
  <span>👁️ Viendo journal de <strong id="journalViewingName">—</strong></span>
  <span style="font-size:0.75rem; color:#a499b8;" id="journalViewingScope"></span>
  <button class="post-btn" onclick="backToMyJournal()" style="padding:4px 12px; font-size:0.7rem; margin-left:auto;">Volver a mi journal</button>
</div>
```
- En `tjRefresh()`, mostrar/ocultar banner según `window._journalViewingCode`
- Función `backToMyJournal()` que limpia estado y recarga con `loadJournalFromApi()`

### 3. Botón "Ver Journal" en conexiones (app.js:6083)
- En `loadConnections()`, dentro del card HTML, agregar después del botón Permisos:
```js
<button class="post-btn" onclick="viewUserJournal('${esc(c.user_code)}','${esc(c.user_name)}')" style="padding:6px 10px;font-size:0.65rem;">📊 Ver Journal</button>
```
- Función `viewUserJournal(code, name)`:
```js
window.viewUserJournal = function(code, name) {
  window._journalViewingName = name;
  switchTab('tab-journal');
  loadJournalFromApi(code);
};
```

### 4. Fix notas: validar _key (app.js:5798)
- En `saveEntry()`, antes de `_encrypt()`, agregar:
```js
if (!_key) { _showError('Primero desbloqueá el diario con tu contraseña'); return; }
```

### 5. Debug privacidad
- El backend funciona (verificado por curl). Agregar `console.log` en `updateJournalVisibility` y `loadJournalSettings` para ver si el frontend ejecuta correctamente.

## Archivos a modificar
| Archivo | Cambios |
|---------|---------|
| `assets/app.js` | Fix `loadJournalFromApi()`, agregar `viewUserJournal()`, `backToMyJournal()`, banner logic, botón Ver Journal, validación `_key` |
| `templates/base.html.twig` | Agregar banner HTML en tab-journal |

## Orden de implementación
1. Fix `loadJournalFromApi()` (crítico, rompe todo el journal)
2. Banner + botón Ver Journal
3. Validación `_key` en diary
4. Debug privacidad (agregar logs)
