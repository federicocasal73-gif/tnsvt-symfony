/* ═══════════════════════════════════════════════════════════════════════════
   ⛧ TNSVT — Z Fold 6 Fold-Bridge
   ────────────────────────────────────────────────────────────────────────────
   Detecta plegado/desplegado del Samsung Galaxy Z Fold 6 (y similares)
   en vivo. No toca app.js. Se carga DESPUÉS de capacitor-bridge.js.

   Aporta:
   - body.layout-fold-closed  (≤420px → cover screen plegada)
   - body.layout-fold-open    (884px-1280px → inner screen desplegada)
   - body.is-spanned          (Visual Viewport Segments API: 2 segmentos)

   API pública:
   - window.TNSVTFold.isFolded()
   - window.TNSVTFold.isUnfolded()
   - window.TNSVTFold.isSpanned()
   - window.TNSVTFold.refresh()
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── Media queries para los dos estados del Fold ───
  var mqFolded   = window.matchMedia('(max-width: 420px)');
  var mqUnfolded = window.matchMedia('(min-width: 884px) and (max-width: 1280px)');

  function updateFoldLayout() {
    var body = document.body;
    if (!body) return;

    if (mqUnfolded.matches) {
      body.classList.add('layout-fold-open');
      body.classList.remove('layout-fold-closed');
      try { console.log('[TNSVT] Fold: DESPLEGADO (' + window.innerWidth + 'x' + window.innerHeight + ')'); } catch (_) {}
    } else if (mqFolded.matches) {
      body.classList.add('layout-fold-closed');
      body.classList.remove('layout-fold-open');
      try { console.log('[TNSVT] Fold: PLEGADO (' + window.innerWidth + 'x' + window.innerHeight + ')'); } catch (_) {}
    } else {
      body.classList.remove('layout-fold-open', 'layout-fold-closed');
    }

    // Visual Viewport Segments API (dual-screen foldables)
    try {
      if (window.visualViewport && 'segments' in window.visualViewport) {
        var segs = window.visualViewport.segments;
        if (segs && segs.length === 2) {
          body.classList.add('is-spanned');
          try { console.log('[TNSVT] Fold: app SPANNED across 2 segments'); } catch (_) {}
        } else {
          body.classList.remove('is-spanned');
        }
      }
    } catch (e) { /* API no disponible */ }
  }

  // ─── Watch sidebar toggle para body.sidebar-open ───
  function watchSidebar() {
    var sidebar = document.querySelector('.sidebar, #sidebar, aside.sidebar, .trading-sidebar');
    if (!sidebar) return;
    var obs = new MutationObserver(function () {
      var open = sidebar.classList.contains('open') || sidebar.classList.contains('active');
      document.body.classList.toggle('sidebar-open', open);
    });
    obs.observe(sidebar, { attributes: true, attributeFilter: ['class'] });
  }

  // ─── Listeners ───
  function attach() {
    // matchMedia change (responde al pliegue/despliegue en vivo)
    if (mqFolded.addEventListener) {
      mqFolded.addEventListener('change', updateFoldLayout);
      mqUnfolded.addEventListener('change', updateFoldLayout);
    } else if (mqFolded.addListener) {
      // Fallback Safari viejo
      mqFolded.addListener(updateFoldLayout);
      mqUnfolded.addListener(updateFoldLayout);
    }

    // Resize + orientation
    window.addEventListener('resize', updateFoldLayout, { passive: true });
    window.addEventListener('orientationchange', updateFoldLayout, { passive: true });

    // Visual viewport changes (foldables nativos)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateFoldLayout, { passive: true });
    }

    // Capacitor App event (cuando vuelve de background, re-evaluar)
    try {
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
        var App = window.Capacitor.Plugins.App;
        if (App.addListener) {
          App.addListener('appStateChange', function (state) {
            if (state && state.isActive) {
              setTimeout(updateFoldLayout, 250);
            }
          });
        }
      }
    } catch (_) {}

    updateFoldLayout();
    watchSidebar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attach);
  } else {
    attach();
  }

  // ─── API pública ───
  window.TNSVTFold = {
    isFolded:   function () { return mqFolded.matches; },
    isUnfolded: function () { return mqUnfolded.matches; },
    isSpanned:  function () { return document.body.classList.contains('is-spanned'); },
    refresh:    updateFoldLayout
  };

  try { console.log('[TNSVT] Fold bridge initialized ⛧'); } catch (_) {}
})();
