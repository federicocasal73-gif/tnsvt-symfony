# Plan: 3 Fixes de UI (aprobado por usuario)

## Issue 1: Nodos con texto cortado (hub-view)

**Archivo:** `assets/styles/app.css` línea 134-141

Reemplazar `.rect-node` — quitar `white-space: nowrap`, agregar `line-height: 1.3; max-width: 180px`:

```css
/* ANTES */
.rect-node {
    position: absolute; padding: 10px 16px; background: var(--node-bg);
    border: 1px solid rgba(212,175,55,0.3); border-radius: 8px;
    text-align: center; font-family: 'Orbitron', sans-serif; font-size: 0.6rem;
    font-weight: 700; letter-spacing: 1px; color: rgba(255,255,255,0.5);
    cursor: pointer; transition: all 0.3s; z-index: 5;
    white-space: nowrap;
}

/* DESPUÉS */
.rect-node {
    position: absolute; padding: 10px 16px; background: var(--node-bg);
    border: 1px solid rgba(212,175,55,0.3); border-radius: 8px;
    text-align: center; font-family: 'Orbitron', sans-serif; font-size: 0.6rem;
    font-weight: 700; letter-spacing: 1px; color: rgba(255,255,255,0.5);
    cursor: pointer; transition: all 0.3s; z-index: 5;
    line-height: 1.3; max-width: 180px;
}
```

## Issue 2: Foto de perfil parpadea / no se puede cambiar

**Archivo:** `assets/app.js`

### 2a. uploadAvatar() — línea ~2988, después de `renderHeaderAvatar();`
Agregar:
```js
if (typeof window.refreshTopbar === 'function') window.refreshTopbar();
```

### 2b. deleteMyAvatar() — línea ~3012, después de `renderHeaderAvatar();`
Agregar:
```js
if (typeof window.refreshTopbar === 'function') window.refreshTopbar();
```

## Issue 3: "Salir" → 2 botones: Volver + Salir

### 3a. `templates/base.html.twig` línea 264-271
Reemplazar el botón Salir por 2 botones:
```html
<button type="button"
        id="tnsvtBackBtn"
        onclick="backToHub()"
        style="display:none; padding:8px 14px; background:rgba(138,60,255,0.08); color:var(--violet); border:1px solid rgba(138,60,255,0.4); border-radius:10px; font-family:'Orbitron',sans-serif; font-size:0.65rem; font-weight:700; letter-spacing:1.5px; cursor:pointer; transition:all .2s; text-transform:uppercase;">
  ← Volver
</button>
<button type="button"
        id="tnsvtLogoutBtn"
        onclick="logout()"
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
        style="display:none; padding:8px 14px; background:rgba(212,175,55,0.08); color:var(--gold-bright); border:1px solid rgba(212,175,55,0.4); border-radius:10px; font-family:'Orbitron',sans-serif; font-size:0.65rem; font-weight:700; letter-spacing:1.5px; cursor:pointer; transition:all .2s; text-transform:uppercase;">
  Salir
</button>
```

### 3b. `assets/app.js` — nueva función cerca de `closeTradingPanel()` (línea 394)
```js
function backToHub() {
    document.getElementById('trading-panel').style.display = 'none';
    document.getElementById('module-panel').style.display = 'none';
    document.getElementById('hub-view').style.display = 'flex';
    var backBtn = document.getElementById('tnsvtBackBtn');
    if (backBtn) backBtn.style.display = 'none';
    updateNodeStates();
}
window.backToHub = backToHub;
```

### 3c. `assets/app.js` — en `clickTriggerCircle()` (línea ~391), agregar antes del cierre:
```js
var backBtn = document.getElementById('tnsvtBackBtn');
if (backBtn) backBtn.style.display = '';
```

### 3d. `assets/app.js` — en `openModule()` (línea ~362), agregar antes del cierre:
```js
var backBtn = document.getElementById('tnsvtBackBtn');
if (backBtn) backBtn.style.display = '';
```

## Git Status
- **tnsvt-symfony** tiene cambios sin commitear (app.js, base.html.twig, web-glowup.css, apk-glowup.css)
- `docs/FORWARD_TEST_GUIDE.md` y `docs/train_onnx_model.py` NO pertenecen a este repo — NO commitear
- **tnsvt-landing** está limpio

## Verificación
1. Abrir hub → los 5 nodos muestran texto completo en 2 líneas
2. Login → subir foto → se ve en topbar y en avatar (sin parpadeo)
3. Click en nodo † → trading panel → topbar muestra "← Volver" y "Salir"
4. Click "← Volver" → vuelve al hub
5. Click "Salir" → cierra sesión
