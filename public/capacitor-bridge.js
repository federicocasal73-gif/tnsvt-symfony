/* ════════════════════════════════════════════════════════════════════════════
   ⛧ TNSVT - Reino del Cristo Íntegro
   Capacitor Bridge v2.0 — APK Web Android

   Comportamientos:
   1. Detecta si estamos dentro del WebView Capacitor (window.Capacitor.isNativePlatform)
      → si NO: return (la web sigue funcionando igual, no se rompe NADA)
      → si SÍ: agrega 'is-apk' a <html> y <body>

   2. Status bar: DARK, color #07030f (místico), overlaysWebView:true

   3. Splash screen: hide con fade-out 300ms cuando load

   4. Hardware back button (Android):
      a) Si hay modal/sidebar/cf-panel abierto → cerrarlo y stop
      b) Si activeTab !== tab-posts → switchTab('tab-posts') y stop
      c) Sino → App.minimizeApp()

   5. Keyboard show/hide:
      → setea CSS var --keyboard-height en :root
      → toggle body.keyboard-open
      → CSS levanta cf-panel y modals según --keyboard-height

   6. Network listener:
      → offline: toast naranja "Sin conexión"
      → online:  toast verde  "Conexión restablecida"

   7. Push notifications:
      → requestPermissions, register
      → on registration: POST /api/devices/register {fcm_token, platform:'android', user_code}
         ⚠ La API real es /api/devices/register (no /api/push/register como dice el prompt original)
      → on actionPerformed: si data.tab → switchTab(data.tab)

   CARGADO: al FINAL de base.html.twig, antes de </body>, DEFER.
   ════════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── Detección: ¿estamos dentro de Capacitor? ───
  const isCapacitor = !!(
    window.Capacitor &&
    window.Capacitor.isNativePlatform &&
    window.Capacitor.isNativePlatform()
  );

  // Marcar <html> y <body> para que el CSS pueda diferenciar APK vs web
  if (isCapacitor) {
    document.documentElement.classList.add('is-apk');
    if (document.body) {
      document.body.classList.add('is-apk');
    } else {
      // Si el script corre antes de <body>, esperamos al DOMContentLoaded
      document.addEventListener('DOMContentLoaded', function () {
        document.body && document.body.classList.add('is-apk');
      });
    }

    // ═══ ACTIVAR BELL LEGACY — REPEATED INTERVAL ═══
    // El bell #notifBellBtnOld del twig viene con display:none inline
    // porque el JS app.js lo muestra/oculta según cantidad de notifs.
    // App.js puede togglear el bell constantemente, así que iteramos cada
    // 800ms hasta 30 intentos para siempre mostrar el bell si hay user.
    var bellCheckCount = 0;
    var bellInterval = setInterval(function() {
      bellCheckCount++;
      var oldBell = document.getElementById('notifBellBtnOld');
      var wrap = document.getElementById('notifBellWrap');
      var hasUser = !!window.TNSVT_USER;
      if (oldBell && wrap && hasUser) {
        // Force bell visible
        oldBell.style.display = 'flex';
        wrap.style.display = 'block';
        if (bellCheckCount === 1) {
          try {
            var rect = wrap.getBoundingClientRect();
            console.log('[TNSVT] bell visible: top=' + rect.top + ' right=' + rect.right + ' w=' + rect.width + ' h=' + rect.height);
          } catch (e) {}
        }
      }
      if (bellCheckCount >= 30) clearInterval(bellInterval);
    }, 800);
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        // Trigger immediately
        setTimeout(bellInterval, 0);
      });
    }
  } else {
    // No estamos en Capacitor: no hacemos nada más
    return;
  }

  // ─── Cargar plugins (Capacitor v8: Plugins.* es compatible pero deprecated) ───
  const Capacitor = window.Capacitor;
  const Plugins = (Capacitor && Capacitor.Plugins) || {};
  const StatusBar = Plugins.StatusBar;
  const SplashScreen = Plugins.SplashScreen;
  const App = Plugins.App;
  const Keyboard = Plugins.Keyboard;
  const Network = Plugins.Network;
  const PushNotifications = Plugins.PushNotifications;

  // ════════════════════════════════════════════════════════════════════════
  // 2. STATUS BAR
  // ════════════════════════════════════════════════════════════════════════
  if (StatusBar) {
    try {
      StatusBar.setStyle({ style: 'DARK' });
      StatusBar.setBackgroundColor({ color: '#07030f' });
      StatusBar.setOverlaysWebView({ overlay: true });
    } catch (e) {
      console.warn('[TNSVT] StatusBar plugin error', e);
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // 3. SPLASH SCREEN — fade-out 300ms cuando load
  // ════════════════════════════════════════════════════════════════════════
  function hideSplash() {
    if (SplashScreen) {
      try {
        SplashScreen.hide({ fadeOutDuration: 300 });
      } catch (e) {
        console.warn('[TNSVT] SplashScreen hide error', e);
      }
    }
  }

  if (document.readyState === 'complete') {
    setTimeout(hideSplash, 500);
  } else {
    window.addEventListener('load', function () {
      setTimeout(hideSplash, 500);
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  // Helper: ¿hay un modal abierto?
  // (busca por clase show, display:flex/block, o atributo open)
  // ════════════════════════════════════════════════════════════════════════
  function getOpenModal() {
    // 1) Clase .show
    var m1 = document.querySelector('.modal.show');
    if (m1) return m1;
    // 2) display:flex o display:block inline (la app usa style="display:flex")
    var m2 = document.querySelector(
      '.modal[style*="display: flex"], .modal[style*="display:flex"], ' +
      '.modal[style*="display: block"], .modal[style*="display:block"]'
    );
    if (m2) return m2;
    return null;
  }

  // ════════════════════════════════════════════════════════════════════════
  // Helper: ¿hay un panel CF (chat) abierto?
  // ════════════════════════════════════════════════════════════════════════
  function getOpenCfPanel() {
    // CF panel usa clase .cf-show para abrir
    var p1 = document.querySelector('.cf-panel.cf-show');
    if (p1) return p1;
    // Por si está con display inline
    var p2 = document.querySelector('.cf-panel[style*="display: flex"], .cf-panel[style*="display:flex"]');
    if (p2) return p2;
    return null;
  }

  // ════════════════════════════════════════════════════════════════════════
  // Helper: ¿hay un sidebar abierto?
  // ⚠ En TNSVT la clase real es .trading-sidebar.open (NO .sidebar.open)
  // ════════════════════════════════════════════════════════════════════════
  function getOpenSidebar() {
    return document.querySelector('.trading-sidebar.open');
  }

  // ════════════════════════════════════════════════════════════════════════
  // Helper: ¿está abierto el sidebar overlay?
  // ════════════════════════════════════════════════════════════════════════
  function getOpenSidebarOverlay() {
    return document.querySelector('#sidebar-overlay.active');
  }

  // ════════════════════════════════════════════════════════════════════════
  // Helper: obtener la tab actualmente activa
  // ════════════════════════════════════════════════════════════════════════
  function getActiveTab() {
    return document.querySelector('.tab-content.active');
  }

  // ════════════════════════════════════════════════════════════════════════
  // Helper: cerrar un modal (display:none + remove .show)
  // ════════════════════════════════════════════════════════════════════════
  function closeModal(m) {
    if (!m) return;
    m.style.display = 'none';
    m.classList.remove('show');
    m.classList.remove('open');
    m.setAttribute('aria-hidden', 'true');
  }

  // ════════════════════════════════════════════════════════════════════════
  // 4. HARDWARE BACK BUTTON (Android)
  // ════════════════════════════════════════════════════════════════════════
  if (App) {
    App.addListener('backButton', function (ev) {
      // a) Modal abierto
      var modal = getOpenModal();
      if (modal) {
        closeModal(modal);
        return;
      }
      // b) Sidebar abierto (incluye overlay)
      var sidebar = getOpenSidebar();
      if (sidebar || getOpenSidebarOverlay()) {
        if (sidebar) sidebar.classList.remove('open');
        var overlay = getOpenSidebarOverlay();
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
        return;
      }
      // c) CF Panel abierto
      var cfPanel = getOpenCfPanel();
      if (cfPanel) {
        cfPanel.classList.remove('cf-show');
        cfPanel.style.display = 'none';
        return;
      }
      // d) Si hay un drawer/open de notificaciones
      var notifPanel = document.querySelector(
        '.notif-panel.open, .notif-panel[style*="display: block"], .notif-panel[style*="display:block"]'
      );
      if (notifPanel) {
        closeModal(notifPanel);
        return;
      }
      // e) Si estamos en una sub-tab, volver al feed principal
      var activeTab = getActiveTab();
      if (activeTab && activeTab.id !== 'tab-posts' && typeof window.switchTab === 'function') {
        window.switchTab('tab-posts');
        return;
      }
      // f) Si el navegador tiene historial, usar history.back
      if (ev && ev.canGoBack) {
        window.history.back();
        return;
      }
      // g) Sino, minimizar la app
      try {
        App.minimizeApp();
      } catch (e) {
        console.warn('[TNSVT] minimizeApp failed', e);
      }
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  // 5. KEYBOARD show/hide
  //    → setea CSS var --keyboard-height en :root
  //    → toggle body.keyboard-open
  // ════════════════════════════════════════════════════════════════════════
  if (Keyboard) {
    try {
      Keyboard.addListener('keyboardWillShow', function (info) {
        var h = (info && info.keyboardHeight) || 0;
        document.documentElement.style.setProperty('--keyboard-height', h + 'px');
        document.body.classList.add('keyboard-open');
      });
      Keyboard.addListener('keyboardWillHide', function () {
        document.documentElement.style.setProperty('--keyboard-height', '0px');
        document.body.classList.remove('keyboard-open');
      });
      // Fallback para Android (keyboardDidShow) por si WillShow no dispara
      Keyboard.addListener('keyboardDidShow', function (info) {
        var h = (info && info.keyboardHeight) || 0;
        document.documentElement.style.setProperty('--keyboard-height', h + 'px');
        document.body.classList.add('keyboard-open');
      });
      Keyboard.addListener('keyboardDidHide', function () {
        document.documentElement.style.setProperty('--keyboard-height', '0px');
        document.body.classList.remove('keyboard-open');
      });
    } catch (e) {
      console.warn('[TNSVT] Keyboard listeners failed', e);
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // 6. NETWORK listener
  //    → offline: toast naranja
  //    → online:  toast verde
  // ════════════════════════════════════════════════════════════════════════
  if (Network) {
    try {
      // Estado inicial
      Network.getStatus().then(function (status) {
        if (status && status.connected === false) {
          showToast('⚠ Sin conexión — algunas funciones estarán limitadas', 'warn');
        }
      }).catch(function () {});

      Network.addListener('networkStatusChange', function (status) {
        if (!status || status.connected === false) {
          showToast('⚠ Sin conexión — algunas funciones estarán limitadas', 'warn');
        } else {
          showToast('✓ Conexión restablecida', 'ok');
        }
      });
    } catch (e) {
      console.warn('[TNSVT] Network listener failed', e);
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // 7. PUSH NOTIFICATIONS
  //    ⚠ FIX: la API real es /api/devices/register (no /api/push/register)
  //    ⚠ FIX: hay que enviar user_code desde window.TNSVT_USER
  // ════════════════════════════════════════════════════════════════════════
  if (PushNotifications) {
    try {
      PushNotifications.requestPermissions().then(function (result) {
        if (result && result.receive === 'granted') {
          PushNotifications.register();
        } else {
          console.warn('[TNSVT] Push permission denied');
        }
      }).catch(function (e) {
        console.warn('[TNSVT] Push permission request failed', e);
      });

      PushNotifications.addListener('registration', function (token) {
        if (!token || !token.value) return;
        console.log('[TNSVT] FCM token obtained:', token.value.substring(0, 20) + '...');

        // Obtener user_code desde el state de la app
        // TNSVT guarda el usuario logueado en window.TNSVT_USER
        var userCode = null;
        try {
          if (window.TNSVT_USER && window.TNSVT_USER.code) {
            userCode = window.TNSVT_USER.code;
          } else if (window.TNSVT_USER && window.TNSVT_USER.user_code) {
            userCode = window.TNSVT_USER.user_code;
          } else {
            // Fallback: localStorage
            userCode = localStorage.getItem('tnsvt_user_code')
                    || localStorage.getItem('tnsvt_user')
                    || localStorage.getItem('user_code');
          }
        } catch (_) {}

        // Mandar al backend Symfony (endpoint real: /api/devices/register)
        if (window.fetch) {
          var body = {
            fcm_token: token.value,
            platform: 'android',
            device_model: (navigator.userAgent || '').substring(0, 200),
          };
          if (userCode) body.user_code = userCode;

          fetch('/api/devices/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify(body),
          })
            .then(function (r) { return r.json(); })
            .then(function (d) {
              console.log('[TNSVT] Push registered OK', d);
            })
            .catch(function (e) {
              // Si falla porque no hay sesión activa, lo reintentamos cuando el usuario se loguee
              console.warn('[TNSVT] Push register failed (will retry after login)', e);
              // Guardar token para reintento
              try { sessionStorage.setItem('tnsvt_pending_fcm_token', token.value); } catch (_) {}
            });
        }
      });

      PushNotifications.addListener('pushNotificationReceived', function (notification) {
        console.log('[TNSVT] Push received in foreground:', notification);
        // El backend TNSVT ya hace toast + browser Notification cuando llega en foreground
        // acá solo logueamos.
      });

      PushNotifications.addListener('pushNotificationActionPerformed', function (action) {
        // El usuario tocó la notificación
        console.log('[TNSVT] Push action performed:', action);
        // Si el push trae data.tab → switchTab
        var data = (action && action.notification && action.notification.data) || {};
        if (data.tab && typeof window.switchTab === 'function') {
          window.switchTab(data.tab);
        } else if (data.url) {
          // Si trae URL, dejar que el WebView la abra (allowNavigation)
          window.location.href = data.url;
        }
      });

      // Re-registrar token pendiente cuando el usuario se loguea
      window.addEventListener('tnsvt:user-logged-in', function () {
        try {
          var pending = sessionStorage.getItem('tnsvt_pending_fcm_token');
          if (pending && PushNotifications && PushNotifications.register) {
            sessionStorage.removeItem('tnsvt_pending_fcm_token');
            PushNotifications.register();
          }
        } catch (_) {}
      });
    } catch (e) {
      console.warn('[TNSVT] PushNotifications setup failed', e);
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // Helper: toast simple (funciona offline, sin deps)
  // ════════════════════════════════════════════════════════════════════════
  function showToast(msg, kind) {
    try {
      var t = document.createElement('div');
      t.textContent = msg;
      t.style.cssText = [
        'position:fixed',
        'left:50%',
        'bottom:calc(env(safe-area-inset-bottom, 0px) + 120px)',
        'transform:translateX(-50%)',
        'z-index:99999',
        'padding:10px 18px',
        'border-radius:10px',
        'background:' + (kind === 'warn' ? 'rgba(255,59,48,0.95)' : 'rgba(52,199,89,0.95)'),
        'color:#fff',
        "font-family:'Orbitron',sans-serif",
        'font-size:0.8rem',
        'letter-spacing:1px',
        'box-shadow:0 4px 20px rgba(0,0,0,0.5)',
        'pointer-events:none',
        'animation:tnsvtToastIn 0.25s ease',
        'max-width:80vw',
        'text-align:center',
      ].join(';');
      document.body.appendChild(t);
      setTimeout(function () {
        if (t && t.parentNode) t.parentNode.removeChild(t);
      }, 3500);
    } catch (_) {}
  }

  // Exponer el helper por si alguna parte del HTML lo necesita
  window.tnsvtShowToast = showToast;

  console.log('%c[TNSVT] ⛧ Capacitor bridge v2.0 inicializado', 'color:#d4af37;font-weight:bold;');
})();

