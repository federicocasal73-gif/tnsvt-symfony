/* ============================================================
   T.N.S.V.T — app.js
   Reino del Cristo Íntegro — Neuro-Spiritual Value Theory
   ============================================================
   Secciones:
   1. CONFIG & SUPABASE INIT
   2. AUTH & LOGIN
   3. NAVEGACIÓN & TABS
   4. TRADING JOURNAL
   5. FEED (Supabase realtime)
   6. NOTIFICACIONES
   7. ACADEMIA
   8. CALENDARIO ECONÓMICO
   9. MACRO (mcNav, quiz, etc)
   10. UTILS (toast, etc)
   ============================================================ */

let sb = window.API;




  


      // ==================== TOKEN Y VARIABLES GLOBALES ====================
      const CORRECT_TOKEN = "TNSV777YWHV";
      // Limpiar keys obsoletas (codigo BOS2026 eliminado)
      localStorage.removeItem('tnsv_2step_inner_unlocked');
      let activeUserSession = null;
      let learnedNodes = new Set(JSON.parse(localStorage.getItem('tnsv_learned_nodes')) || []);
      let godActivated = sessionStorage.getItem('tnsv_god_activated') === 'true';
      const nodeSequence = ['psi', 'tec', 'fun', 'fib', 'step'];

      // Calendario económico — declarar al inicio para evitar TDZ cuando setupCalFilters() corre en window.onload
      let _calEvents = [];
      let _calRefreshTimer = null;
      let _calCountdownTimer = null;
      let _calNowTimer = null;
      let _calReminderKey = null;
      const CAL_FLAG = { US:'\uD83C\uDDFA\uD83C\uDDF8', EU:'\uD83C\uDDEA\uD83C\uDDFA', GB:'\uD83C\uDDEC\uD83C\uDDE7', JP:'\uD83C\uDDEF\uD83C\uDDF5', CA:'\uD83C\uDDE8\uD83C\uDDE6', AU:'\uD83C\uDDE6\uD83C\uDDFA', CH:'\uD83C\uDDE8\uD83C\uDDED', CN:'\uD83C\uDDE8\uD83C\uDDF3', DE:'\uD83C\uDDE9\uD83C\uDDEA', FR:'\uD83C\uDDEB\uD83C\uDDF7', IT:'\uD83C\uDDEE\uD83C\uDDF9', ES:'\uD83C\uDDEA\uD83C\uDDF8' };

      // NotifList se inicializa temprano para evitar TDZ cuando updateBadge() se llama antes que la sección SISTEMA DE NOTIFICACIONES se ejecute
      let notifList = [];

      // ── Multi-trading-accounts ──
      let _tjAccounts = [];
      let _tjActiveAccountId = null;
      let _tjAccountsMax = 3;

      // Módulos de estudio (resumidos, pero igual que antes)
      const modulesData = {
        psi: {
          title: "1. Psicología e Identidad Anclada",
          blocks: [
            { key: "La Fractura de Identidad", text: "El dinero nunca fue tu problema real. Es el resultado visible de tu nivel de conexión subyacente. Cuando tu identidad se rompe, el mercado deja de ser un tablero probabilístico y se transforma en un tribunal juzgando tu valor personal." },
            { key: "El Colapso Biológico", text: "Si la psicología no tiene suelo firme, la mente se nubla y el cerebro entra en modo supervivencia pura. El cuerpo lo grita mediante cortisol, ansiedad y urgencia de clickear. Para operar el mercado con precisión, primero tenés que aprender a operarte a vos mismo." },
            { key: "El Protocolo del Observador No Reactivo", text: "Para neutralizar la descarga adrenérgica provocada por el parpadeo del precio, el operador debe disociar su valor personal del resultado de la operación. El stop loss no es un fracaso identitario, es el costo operativo de recolectar datos probabilísticos." },
            { key: "Regulación Vagocelular Operativa", text: "Antes de pulsar el disparador de órdenes, aplicá respiración táctica (4 segundos de inhalación, 4 de retención, 4 de exhalación). Si las pulsaciones superan las 90 ppm, tu corteza prefrontal está anulada; el sistema autónomo saboteará tu ratio de acierto." }
          ]
        },
        tec: {
          title: "2. Análisis Técnico Algorítmico",
          blocks: [
            { key: "La Huella Institucional", text: "Rompemos el paradigma retail. El algoritmo interbancario no reconoce soportes ni resistencias como zonas de rebote, sino como piscinas de liquidez acumulada diseñadas para ser limpiadas." },
            { key: "Mapeo de Estructuras", text: "Identificamos de forma sistemática la dirección estructural mayor analizando cierres de velas con cuerpos sólidos, evitando ruidos temporales en fracciones menores de tiempo." },
            { key: "Piscinas de Liquidez vs. Retail Soporte", text: "Las consolidaciones minoristas (dobles techos y dobles suelos) son ingeniería de liquidez. El algoritmo inyecta órdenes pesadas para inducir a las masas a comprar o vender, acumulando Stop Losses que luego serán capturados como contrapartida." },
            { key: "Rangos de Tiempo Sagrados (Killzones)", text: "El precio solo se mueve con verdadera intención en ventanas específicas de tiempo volumétrico: Killzone de Londres (03:00 - 05:00 NY) y Killzone de Nueva York (07:00 - 10:00 NY). Operar fuera de estos bloques es regalar capital al algoritmo de rango." }
          ]
        },
        fun: {
          title: "3. Análisis Fundamental & Flujo Macro",
          blocks: [
            { key: "La Energía Detrás del Gráfico", text: "El mercado no altera su cotización por capricho de patrones geométricos. Los flujos de capital real se desplazan siguiendo las inyecciones de liquidez de los Bancos Centrales y las variaciones de tasas de interés." },
            { key: "PMI e Indicadores Adelantados", text: "El desglose del PMI de manufacturas y servicios traza el mapa del crecimiento. Valores sobre 50 aceleran la inyección del enjambre de traders; valores debajo disparan pánico institucional y búsquedas de refugio." },
            { key: "La Ecuación del Diferencial de Tasas", text: "El capital global busca rendimiento y seguridad. Si la FED mantiene tasas altas al 5.25% y el BCE las reduce al 3.5%, el dinero liquidará Euros para comprar Dólares. Esto genera una macro-tendencia bajista estructural que anula cualquier patrón retail de compra." },
            { key: "Divergencia entre PMI y Soft Landing", text: "Un PMI industrial cayendo por debajo de 45 anuncia contracción económica profunda. Las declaraciones oficiales de los políticos sobre un 'Soft Landing' son simple retórica electoralista para estabilizar las masas mientras el dinero institucional se refugia." }
          ]
        },
        fib: {
          title: "4. Niveles OTE Sagrados",
          blocks: [
            { key: "Zonas Óptimas de Retroceso (OTE)", text: "Mapeamos de manera quirúrgica la zona de descuento profunda entre el 61.8%, 70.5% y el 79% del retroceso de Fibonacci. Es allí donde el precio se abarata lo suficiente para que los bancos promedien sus compras." },
            { key: "Unión en Armonía con la Tendencia", text: "Nuestra victoria matemática no reside en predecir reversiones imposibles, sino en unirnos con precisión absoluta a la velocidad de la tendencia dominante establecida." },
            { key: "Premium vs. Discount Zone", text: "Nunca compres en la mitad superior de un rango operativo (Zona Premium). El Fibonacci se extiende para hallar la Zona de Descuento (por debajo del 50%). Las entradas de alta precisión ocurren exclusivamente en el descuento profundo (70.5% - 79%)." },
            { key: "Confluencia de Bloques de Órdenes", text: "El nivel OTE alcanza su máxima probabilidad estadística cuando se acopla con un Order Block institucional previo. Esto valida que las grandes firmas de inversión están defendiendo activamente sus posiciones de bloque." }
          ]
        },
        step: {
          title: "5. Lógica de Ejecución (2 Steps Inicial)",
          blocks: [
            { key: "La Simplificación de la Complejidad", text: "En un entorno saturado de indicadores ruidosos, el método se comprime en rastrear dos señales secuenciales limpias: un barrido de stops minoristas seguido de un cambio de dirección violento corporativo." },
            { key: "Introducción al Modelo Madre", text: "El circuito preliminar se cierra entendiendo la base del BOS y del LG como las huellas unificadas que se repiten perpetuamente en todos los activos del mundo." },
            { key: "Anatomía de un LG (Liquidity Grab) Válido", text: "Una toma de liquidez legítima debe ocurrir mediante una mecha rápida que penetre el Punto A (alto o bajo previo macro) y cierre inmediatamente por dentro del rango anterior. Si el cuerpo de la vela cierra por fuera, no es un barrido, es una ruptura estructural continuada." },
            { key: "El Filtro del BOS Interno", text: "Tras el barrido (LG), esperamos el rompimiento de la estructura interna (BOS) en temporalidades menores como M1 o M5. Este quiebre debe ser limpio, con desplazamiento acelerado, dejando un vacío de liquidez (Fair Value Gap) donde programaremos nuestra orden entry." }
          ]
        }
      };

      // ==================== FUNCIONES DE LOGIN Y NAVEGACIÓN ====================
      function toggleAdminPassField() {
        const code = document.getElementById('gateKey').value.trim().toUpperCase();
        const passWrap = document.getElementById('gatePassWrap');
        const hint = document.getElementById('adminPassHint');
        const nameField = document.getElementById('gateName');
        const isAdminCode = /^ADMIN/i.test(code) && code.length >= 4;
        if (isAdminCode) {
          passWrap.style.display = 'block';
          hint.style.display = 'block';
          if (nameField) nameField.style.display = 'none';
        } else {
          passWrap.style.display = 'none';
          hint.style.display = 'none';
          if (nameField) nameField.style.display = '';
        }
        hideLoginError();
      }

      function maybeFocusPass() {
        const code = document.getElementById('gateKey').value.trim().toUpperCase();
        if (/^ADMIN/i.test(code) && code.length >= 4) {
          const passEl = document.getElementById('gatePass');
          if (passEl && passEl.style.display !== 'none') {
            passEl.focus();
            return;
          }
        }
        verifyGateKey();
      }
      window.maybeFocusPass = maybeFocusPass;

      function togglePassVisibility() {
        const el = document.getElementById('gatePass');
        const btn = document.getElementById('gatePassToggle');
        if (!el || !btn) return;
        const isPassword = el.type === 'password';
        el.type = isPassword ? 'text' : 'password';
        btn.textContent = isPassword ? '🙈' : '👁';
        btn.setAttribute('aria-label', isPassword ? 'Ocultar contraseña' : 'Mostrar contraseña');
        btn.title = isPassword ? 'Ocultar contraseña 🙈' : 'Mostrar contraseña 👁';
        btn.style.background = isPassword ? 'rgba(212,175,55,0.3)' : 'rgba(212,175,55,0.1)';
        btn.style.borderColor = isPassword ? 'var(--gold-bright)' : 'rgba(212,175,55,0.3)';
        // Mantener el cursor donde estaba
        const cursorPos = el.selectionStart;
        el.focus();
        try { el.setSelectionRange(cursorPos, cursorPos); } catch (_) {}
      }
      window.togglePassVisibility = togglePassVisibility;

      function showLoginError(msg) {
        const el = document.getElementById('loginError');
        if (!el) return;
        el.innerText = msg;
        el.style.display = 'block';
      }
      function hideLoginError() {
        const el = document.getElementById('loginError');
        if (el) el.style.display = 'none';
      }

      async function verifyGateKey() {
        const code = document.getElementById('gateKey').value.trim().toUpperCase();
        const name = document.getElementById('gateName')?.value.trim() || '';
        const password = document.getElementById('gatePass')?.value || '';
        hideLoginError();
        if (!code) { showLoginError("⚠️ Ingresá tu código de acceso."); return; }
        if (!sb) { showLoginError("❌ API no disponible."); return; }
        const isAdminCode = /^ADMIN/i.test(code) && code.length >= 4;
        if (!isAdminCode && !name) { showLoginError("⚠️ Ingresá tu nombre de usuario."); return; }
        const loginBtn = document.querySelector('.login-btn');
        if (loginBtn) { loginBtn.disabled = true; loginBtn.innerText = '⏳ Verificando…'; }
        try {
          const data = await sb.login(code, name, password);
          if (!data.success || !data.user) {
            const err = data.error || 'Código inválido';
            let friendly = '❌ ' + err;
            if (/password|contrase/i.test(err)) {
              friendly = '❌ Contraseña incorrecta. Consultá al administrador.';
            } else if (/nombre.*incorrecto|usuario.*incorrecto/i.test(err)) {
              friendly = '❌ Nombre de usuario incorrecto. Revisá que sea el que te dió el administrador.';
            } else if (/invalido|desactivado/i.test(err)) {
              friendly = '❌ Código inválido o desactivado. Revisá que esté bien escrito.';
            } else if (/requerida/i.test(err)) {
              friendly = '⚠️ Este código es de admin — necesitás contraseña.';
            }
            showLoginError(friendly);
            const passEl = document.getElementById('gatePass');
            if (passEl) { passEl.value = ''; passEl.focus(); }
            return;
          }
          const isAdmin = data.user.isAdmin || false;
          activeUserSession = { codename: data.user.name || "Alma Electa", token: code, isAdmin };
          sessionStorage.setItem('tnsv_auth', 'true');
          localStorage.setItem('tnsv_user', JSON.stringify(activeUserSession));
          window.TNSVT_USER = { code: code, name: data.user.name || 'Trader', isAdmin };
          document.getElementById('login-screen').style.display = 'none';
          document.getElementById('main-content').style.display = 'block';
          document.getElementById('profileCodename').innerText = data.user.name || "Alma Electa";
          const roleEl = document.getElementById('profileRole');
          if (roleEl) roleEl.innerText = isAdmin ? '👑 Administrador' : '🎓 Conexión Divina';
          roleEl.style.color = isAdmin ? 'var(--gold)' : '';
          showToast("✨ Acceso concedido, " + (data.user.name || "Trader") + " ✨");
          updateNodeStates();
          // Mostrar avatar inmediatamente con la inicial del nombre
          // (sin esperar a que cargue el profile del backend)
          renderHeaderAvatar();
          if (typeof bindAvatarEvents === 'function') bindAvatarEvents();
          // Mostrar el topbar nuevo (hamburger + brand + notif + admin block)
          if (typeof window.refreshTopbar === 'function') window.refreshTopbar();
          // Cargar foto de perfil (en background)
          loadMyProfile();
          loaderInitWatch();
          if (typeof initAllPanels === 'function') initAllPanels();
          // Mostrar la barra persistente de música en cualquier sección
          musicShowBar();
          // Mostrar FAB del chat y burbujas de presencia
          const cfFab = document.querySelector('.cf-fab');
          const cfPres = document.querySelector('.cf-presence');
          if (cfFab) cfFab.style.display = '';
          if (cfPres) cfPres.style.display = '';
          // Mostrar el botón ⚙️ Admin INMEDIATAMENTE después del login
          applyAdminFeatures(isAdmin);
        } catch (e) {
          showLoginError("❌ Error de conexión: " + (e.message || 'intentá de nuevo'));
        } finally {
          if (loginBtn) { loginBtn.disabled = false; loginBtn.innerText = 'ENTRAR AL GATEWAY'; }
        }
      }

      function logout() {
        sessionStorage.removeItem('tnsv_auth');
        localStorage.removeItem('tnsv_user');
        window.TNSVT_USER = null;
        tjTrades = [];
        notifList = [];
        chatConversations = [];
        window.chatConversations = chatConversations;
        activeConvId = null;
        acadCoursesCache = [];
        postPhotoData = null;
        signalPhotoData = null;
        musicHideBar();
        musicHideFullPlayer();
        const a = document.getElementById('bgMusicAudio');
        if (a) { try { a.pause(); } catch (_) {} }
        // Ocultar FAB del chat y burbujas de presencia
        const cfFab = document.querySelector('.cf-fab');
        const cfPres = document.querySelector('.cf-presence');
        if (cfFab) cfFab.style.display = 'none';
        if (cfPres) cfPres.style.display = 'none';
        document.getElementById('main-content').style.display = 'none';
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('gateKey').value = '';
        const nameField = document.getElementById('gateName');
        if (nameField) { nameField.value = ''; nameField.style.display = ''; }
        const passEl = document.getElementById('gatePass');
        if (passEl) { passEl.value = ''; passEl.style.display = ''; passEl.type = 'password'; }
        document.getElementById('gatePassWrap').style.display = 'none';
        const hint = document.getElementById('adminPassHint');
        if (hint) hint.style.display = 'none';
        document.getElementById('adminSidebarBtn').style.display = 'none';
        document.getElementById('hub-view').style.display = 'flex';
        document.getElementById('module-panel').style.display = 'none';
        document.getElementById('trading-panel').style.display = 'none';
        showToast("🔒 Sesión cerrada.");
        // Refrescar topbar (ocultar)
        if (typeof window.refreshTopbar === 'function') window.refreshTopbar();
        try {
          // Usar API baseURL para evitar Mixed Content (HTTPS -> HTTP)
          const logoutUrl = (window.API && typeof window.API._resolve === 'function')
            ? window.API._resolve('/api/auth/logout')
            : '/api/auth/logout';
          fetch(logoutUrl, { method: 'POST', credentials: 'include' });
        } catch(e) {}
      }

      // ==================== DIAGRAMA Y NODOS ====================
      function drawLines() {
        const svg = document.getElementById('svgLines');
        if (!svg) return;
        svg.innerHTML = '';
        const cristo = document.getElementById('cristoNode');
        if (!cristo) return;
        const cRect = cristo.getBoundingClientRect();
        const sRect = svg.getBoundingClientRect();
        if (sRect.width === 0) return;
        const cX = cRect.left + cRect.width/2 - sRect.left;
        const cY = cRect.top + cRect.height/2 - sRect.top;
        nodeSequence.forEach(id => {
          const node = document.getElementById(`node-${id}`);
          if (!node) return;
          const nRect = node.getBoundingClientRect();
          const nX = nRect.left + nRect.width/2 - sRect.left;
          const nY = nRect.top + nRect.height/2 - sRect.top;
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', cX); line.setAttribute('y1', cY);
          line.setAttribute('x2', nX); line.setAttribute('y2', nY);
          line.setAttribute('class', 'path-line');
          if (learnedNodes.has(id)) line.classList.add('illuminated');
          svg.appendChild(line);
        });
        const godNode = document.getElementById('node-god');
        const gRect = godNode.getBoundingClientRect();
        const gX = gRect.left + gRect.width/2 - sRect.left;
        const gY = gRect.top + gRect.height - sRect.top;
        const godLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        godLine.setAttribute('x1', cX); godLine.setAttribute('y1', cY - cRect.height/2);
        godLine.setAttribute('x2', gX); godLine.setAttribute('y2', gY);
        godLine.setAttribute('class', 'path-line');
        if (godActivated) godLine.classList.add('illuminated');
        svg.appendChild(godLine);
      }

      function updateNodeStates() {
        nodeSequence.forEach((id, index) => {
          const node = document.getElementById(`node-${id}`);
          if (node) {
            node.classList.remove('completed', 'active-learning');
            if (learnedNodes.has(id)) node.classList.add('completed');
            else if (index === learnedNodes.size) node.classList.add('active-learning');
          }
        });
        const trigger = document.getElementById('triggerCircle');
        if (trigger) trigger.classList.add('ready-pulse');
        const godNode = document.getElementById('node-god');
        if (godActivated) godNode.classList.add('unlocked');
        else godNode.classList.remove('unlocked');
        drawLines();
      }

      function handleNodeClick(id) {
        const idx = nodeSequence.indexOf(id);
        if (learnedNodes.has(id) || idx === learnedNodes.size) openModule(id);
        else showToast(`🔒 Completa primero: ${nodeSequence[learnedNodes.size].toUpperCase()}`);
      }

      function openModule(id) {
        const data = modulesData[id];
        document.getElementById('moduleTitle').innerHTML = data.title;
        let html = '';
        data.blocks.forEach((b,i) => {
          html += `<div class="key-card"><div class="key-card-title">${b.key}</div><p>${b.text}</p></div>`;
          if (i < data.blocks.length-1) html += `<div class="golden-line"></div>`;
        });
        if (!learnedNodes.has(id)) {
          html += `<button class="login-btn" style="margin-top:20px; width:100%;" onclick="markAsLearned('${id}')">✓ Sintonizar y Completar</button>`;
        }
        document.getElementById('moduleContent').innerHTML = html;
        document.getElementById('hub-view').style.display = 'none';
        document.getElementById('module-panel').style.display = 'block';
      }

      function closeModule() {
        document.getElementById('hub-view').style.display = 'flex';
        document.getElementById('module-panel').style.display = 'none';
        updateNodeStates();
      }

      function markAsLearned(id) {
        learnedNodes.add(id);
        localStorage.setItem('tnsv_learned_nodes', JSON.stringify([...learnedNodes]));
        updateNodeStates();
        showToast(`✅ ${modulesData[id].title} completado.`);
        closeModule();
      }

      function clickTriggerCircle() {
        godActivated = true;
        sessionStorage.setItem('tnsv_god_activated', 'true');
        updateNodeStates();
        showToast(`👁️‍🗨️ El Cristo Íntegro se ha manifestado.`);
        document.getElementById('trading-panel').style.display = 'block';
        document.getElementById('hub-view').style.display = 'none';
        if (typeof initAllPanels === 'function') initAllPanels();
      }

      function closeTradingPanel() {
        document.getElementById('trading-panel').style.display = 'none';
        document.getElementById('hub-view').style.display = 'flex';
      }

      // ============================================================
      // T.N.S.V.T — MARKET INSTINCT GAME
      // El juego es una app Android separada (com.tnsvt.game).
      // No hay integración inline en TNSVT.
      // ============================================================

      // ==================== SIDEBAR DRAWER (Mobile) ====================
      function toggleSidebar() {
        const sidebar = document.querySelector('.trading-sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (!sidebar || !overlay) return;
        const opening = !sidebar.classList.contains('open');
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
        document.body.style.overflow = opening ? 'hidden' : '';
        if (opening) {
          // Ensure first button is focusable
          const firstBtn = sidebar.querySelector('.sidebar-btn');
          if (firstBtn) setTimeout(() => firstBtn.focus(), 100);
        }
      }
      // Close drawer on ESC
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
          const sidebar = document.querySelector('.trading-sidebar.open');
          if (sidebar) toggleSidebar();
        }
      });
      window.toggleSidebar = toggleSidebar;

      function switchTab(tabId) {
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
        const target = document.getElementById(tabId);
        if (target) {
          target.classList.add('active');
        } else {
          console.warn('[switchTab] tab not found:', tabId);
        }
        const btn = document.querySelector(`.sidebar-btn[onclick*="'${tabId}'"]`);
        if (btn) btn.classList.add('active');
        // Chat: ahora se maneja con el CF widget flotante
        if (tabId === 'tab-chat') {
          if (window.CF && typeof window.CF.open === 'function') {
            window.CF.open();
          }
          return;
        }
        if (tabId === 'tab-admin' && typeof adminRefreshList === 'function') adminRefreshList();
        if (tabId === 'tab-chart') {
          if (typeof window.initChartTab === 'function') {
            window.initChartTab();
          }
        }
        if (tabId === 'tab-leaderboard') {
          if (typeof lbRefresh === 'function') lbRefresh();
        }
        if (tabId === 'tab-diary') {
          if (typeof Diary !== 'undefined' && Diary.init) Diary.init();
        }
        if (tabId === 'tab-journal') {
          // Recargar el journal para que el calendario se renderice
          // loadJournalFromApi() llama a tjRefresh() que incluye tjRenderCal()
          if (typeof loadJournalFromApi === 'function') {
            // Solo recargar si no estamos viendo el journal de otro usuario
            // (viewUserJournal ya llama a loadJournalFromApi por su cuenta)
            if (!window._journalViewingCode) {
              loadJournalFromApi();
            } else if (typeof tjRefresh === 'function') {
              tjRefresh();
            }
          } else if (typeof tjRefresh === 'function') {
            tjRefresh();
          }
        }
        // Close drawer on tab switch (mobile)
        if (window.innerWidth <= 950) {
          const s = document.querySelector('.trading-sidebar');
          const o = document.getElementById('sidebar-overlay');
          if (s) s.classList.remove('open');
          if (o) o.classList.remove('active');
          document.body.style.overflow = '';
        }
      }
      // ==================== FONDO DIVINO ====================
      const canvas = document.getElementById('divineCanvas');
      const ctx = canvas.getContext('2d');
      let stars = [], meteors = [], particles = [];

      function initDivineBackground() {
        canvas.width = window.innerWidth; canvas.height = window.innerHeight;
        for (let i=0;i<300;i++) stars.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, radius: Math.random()*2+0.5, alpha: Math.random()*0.5+0.3, twinkle: Math.random()*0.02+0.01 });
        for (let i=0;i<80;i++) particles.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, radius: Math.random()*3+1, alpha: Math.random()*0.6+0.2, vy: Math.random()*0.5+0.2, vx: (Math.random()-0.5)*0.3 });
      }

      function createMeteor() { if (Math.random()>0.02) return; meteors.push({ x: Math.random()*canvas.width, y:0, radius: Math.random()*3+2, vx: (Math.random()-0.5)*3, vy: Math.random()*6+4, trail: [], life:100 }); }

      function drawDivineBackground() {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        const grad = ctx.createRadialGradient(canvas.width/2,canvas.height/2,50,canvas.width/2,canvas.height/2,canvas.width/2);
        grad.addColorStop(0,'#0a0618'); grad.addColorStop(0.5,'#05030c'); grad.addColorStop(1,'#010003');
        ctx.fillStyle=grad; ctx.fillRect(0,0,canvas.width,canvas.height);
        stars.forEach(s=>{ ctx.beginPath(); ctx.arc(s.x,s.y,s.radius,0,Math.PI*2); ctx.fillStyle=`rgba(255,215,150,${s.alpha+Math.sin(Date.now()*s.twinkle)*0.15})`; ctx.fill(); });
        particles.forEach(p=>{ ctx.beginPath(); ctx.arc(p.x,p.y,p.radius,0,Math.PI*2); ctx.fillStyle=`rgba(255,215,100,${p.alpha})`; ctx.fill(); p.x+=p.vx; p.y+=p.vy; if(p.y>canvas.height){p.y=0;p.x=Math.random()*canvas.width;} if(p.x<0)p.x=canvas.width; if(p.x>canvas.width)p.x=0; });
        meteors.forEach((m,idx)=>{ m.trail.push({x:m.x,y:m.y}); if(m.trail.length>15)m.trail.shift(); for(let i=0;i<m.trail.length;i++){ let t=m.trail[i]; let alpha=(i/m.trail.length)*0.5; ctx.beginPath(); ctx.arc(t.x,t.y,m.radius*(i/m.trail.length+0.5),0,Math.PI*2); ctx.fillStyle=`rgba(255,200,80,${alpha})`; ctx.fill(); } ctx.beginPath(); ctx.arc(m.x,m.y,m.radius,0,Math.PI*2); ctx.fillStyle=`rgba(255,220,100,0.9)`; ctx.fill(); m.x+=m.vx; m.y+=m.vy; m.life--; if(m.y>canvas.height||m.x<0||m.x>canvas.width||m.life<=0) meteors.splice(idx,1); });
        createMeteor();
        requestAnimationFrame(drawDivineBackground);
      }

      window.addEventListener('resize', () => { canvas.width=window.innerWidth; canvas.height=window.innerHeight; stars=[]; particles=[]; meteors=[]; initDivineBackground(); });

      // ==================== INICIALIZACIÓN ====================
      async function checkAuthStatus() {
        if (sessionStorage.getItem('tnsv_auth') === 'true') {
          try {
            const data = await sb.checkAuth();
            if (!data.authenticated) {
              sessionStorage.removeItem('tnsv_auth');
              localStorage.removeItem('tnsv_user');
              return;
            }
          } catch(e) { return; }
          document.getElementById('login-screen').style.display = 'none';
          document.getElementById('main-content').style.display = 'block';
          musicShowBar();
          let el = document.querySelector('.cf-fab'); if(el) el.style.display = '';
          el = document.querySelector('.cf-presence'); if(el) el.style.display = '';
          const cachedUser = localStorage.getItem('tnsv_user');
          if (cachedUser) {
            activeUserSession = JSON.parse(cachedUser);
            document.getElementById('profileCodename').innerText = activeUserSession.codename || "Alma Electa";
            const roleEl = document.getElementById('profileRole');
            if (roleEl) {
              const isAdmin = !!activeUserSession.isAdmin;
              roleEl.innerText = isAdmin ? '👑 Administrador' : '🎓 Conexión Divina';
              roleEl.style.color = isAdmin ? 'var(--gold)' : '';
            }
            window.TNSVT_USER = {
              code: activeUserSession.token,
              name: activeUserSession.codename || 'Trader',
              isAdmin: !!activeUserSession.isAdmin
            };
            // Mostrar botones Admin y Chart al restaurar sesión
            applyAdminFeatures(!!activeUserSession.isAdmin);
          }
          updateNodeStates();
          loaderInitWatch();
          if (typeof initAllPanels === 'function') initAllPanels();
          // Mostrar avatar inmediatamente
          renderHeaderAvatar();
          if (typeof bindAvatarEvents === 'function') bindAvatarEvents();
          // Cargar foto de perfil (si la sesión se restauró)
          if (window.TNSVT_USER?.code) loadMyProfile();
        }
      }

      function showToast(msg) {
        // Usar el toast viejo si existe (backward compat)
        const old = document.getElementById('toast');
        if (old) {
          old.innerText = msg;
          old.style.display = 'block';
          setTimeout(() => old.style.display = 'none', 3000);
          return;
        }
        // Fallback al toast del CF widget (si existe)
        const cfText = document.getElementById('cfToastText');
        const cfName = document.getElementById('cfToastName');
        const cfToast = document.getElementById('cfToast');
        if (cfToast && cfText) {
          if (cfName) cfName.textContent = '🔔 Sistema';
          cfText.textContent = msg;
          cfToast.classList.add('cf-show');
          if (window.CF && window.CF._toastTimer) clearTimeout(window.CF._toastTimer);
          setTimeout(() => cfToast.classList.remove('cf-show'), 3000);
          return;
        }
        // Si no hay ningún toast disponible, log a consola
        console.log('[toast]', msg);
      }

      // ==================== LOADER GLOBAL DE INICIALIZACIÓN ====================
      let appInitCompleted = false;
      let appInitStartedAt = 0;
      function loaderShow() {
        const overlay = document.getElementById('appLoadingOverlay');
        if (overlay) overlay.style.display = 'flex';
        const toast = document.getElementById('appLoadingToast');
        if (toast) toast.style.display = 'flex';
        if (!appInitStartedAt) appInitStartedAt = Date.now();
      }
      function loaderHide() {
        const overlay = document.getElementById('appLoadingOverlay');
        if (overlay) {
          overlay.style.transition = 'opacity 0.4s';
          overlay.style.opacity = '0';
          setTimeout(() => { overlay.style.display = 'none'; overlay.style.opacity = ''; }, 400);
        }
        const toast = document.getElementById('appLoadingToast');
        if (toast) {
          toast.style.transition = 'opacity 0.4s';
          toast.style.opacity = '0';
          setTimeout(() => { toast.style.display = 'none'; toast.style.opacity = ''; }, 400);
        }
        appInitCompleted = true;
      }
      function loaderUpdateStatus(text) {
        const el = document.getElementById('appLoadingStatus');
        if (el) el.innerText = text || 'Cargando…';
      }
      function loaderUpdateProgress(done, total) {
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        const bar = document.getElementById('appLoadingBarFill');
        const pbar = document.getElementById('appLoadingProgress');
        if (bar) bar.style.width = pct + '%';
        if (pbar) pbar.style.width = pct + '%';
        const counter = document.getElementById('appLoadingCounter');
        if (counter) counter.innerText = done + '/' + total + ' (' + pct + '%)';
      }
      function loaderInitWatch() {
        if (typeof API === 'undefined' || !API.onLoadingChange) {
          setTimeout(loaderInitWatch, 50);
          return;
        }
        const u = window.TNSVT_USER;
        const expectedBase = 5; // tasks, calendar, feed, academia, music
        const expectedJournal = (u && u.code) ? 1 : 0;
        const expectedAdmin = (u && u.isAdmin) ? 1 : 0;
        const expectedTotal = expectedBase + expectedJournal + expectedAdmin;
        let done = 0;
        const stepLabels = ['Tareas', 'Calendario', 'Feed', 'Academia', 'Música'];
        if (expectedJournal) stepLabels.push('Diario');
        if (expectedAdmin) stepLabels.push('Admin');
        let currentStep = 0;
        let pendingInitial = expectedTotal;
        let anyStarted = false;
        const unsub = API.onLoadingChange((pending) => {
          if (pending > 0) {
            if (!anyStarted) {
              anyStarted = true;
              loaderShow();
            }
            pendingInitial = pending + done;
          } else if (anyStarted) {
            if (currentStep < stepLabels.length) {
              currentStep++;
            }
            done = Math.min(done + 1, expectedTotal);
            loaderUpdateStatus(stepLabels[currentStep - 1] || 'Cargando datos…');
            loaderUpdateProgress(done, expectedTotal);
            if (done >= expectedTotal) {
              setTimeout(() => {
                if (API.loadingCount === 0) loaderHide();
              }, 250);
              unsub();
            }
          }
        });
        // Hard timeout: si después de 12s no terminó, ocultar igual
        setTimeout(() => { if (!appInitCompleted) loaderHide(); }, 12000);
      }

      window.onload = () => {
        initDivineBackground();
        drawDivineBackground();
        checkAuthStatus();
        setupCalFilters();
        setTimeout(() => { if (document.getElementById('svgLines')) drawLines(); }, 200);
        window.addEventListener('resize', () => setTimeout(drawLines, 100));
      };
    


      // ==================== FUNCIONES DE MACROECONOMÍA ====================
      function mcNav2(panelId, btn) {
        document.querySelectorAll('.mpanel').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.mc-navbtn').forEach(b => b.classList.remove('active'));
        const panel = document.getElementById(panelId);
        if (panel) panel.classList.add('active');
        if (btn) btn.classList.add('active');
      }

      const mcNodeData = {
        fed: { label: '🏛 Banco Central (FED)', text: 'El principal market maker del mercado Forex. Su función es inyectar liquidez o encarecer el crédito.' },
        bonos: { label: '📜 Compra de Bonos', text: 'El Estado emite un bono al Banco Central. Así se financia y se inyecta liquidez.' },
        tasas: { label: '📈 Tasas de Interés', text: 'El precio del dinero. Tasas bajas → economía se calienta, Dólar débil. Tasas altas → economía se enfría, Dólar fuerte.' },
        ciudadanos: { label: '👥 Economía Real', text: 'El destinatario final de la política monetaria. Crédito barato estimula consumo e inversión.' }
      };

      function mcShowNode(id) {
        document.querySelectorAll('.mc-flow-node').forEach(n => n.classList.remove('highlighted'));
        const nodeBtn = document.querySelector(`.mc-flow-node[onclick*="mcShowNode('${id}')"]`);
        if (nodeBtn) nodeBtn.classList.add('highlighted');
        const box = document.getElementById('mc-node-info');
        if (box && mcNodeData[id]) {
          document.getElementById('mc-node-label').innerHTML = mcNodeData[id].label;
          document.getElementById('mc-node-text').innerHTML = mcNodeData[id].text;
          box.classList.add('show');
        }
      }

      function mcCalcInterest() {
        const rate = parseInt(document.getElementById('mc-rate-slider')?.value || 1);
        const total = 1000 + (1000 * rate / 100);
        const rateEl = document.getElementById('mc-rate-val');
        const totalEl = document.getElementById('mc-total-val');
        const acceptEl = document.getElementById('mc-accept-val');
        const econEl = document.getElementById('mc-econ-val');
        const dollarEl = document.getElementById('mc-dollar-val');
        if (rateEl) rateEl.textContent = rate + '%';
        if (totalEl) totalEl.textContent = '$' + total.toLocaleString('es');
        if (rate <= 3) {
          if (acceptEl) { acceptEl.textContent = '😊 Sí, es barato'; acceptEl.className = 'mc-data-val up'; }
          if (econEl) { econEl.textContent = '📈 Se estimula'; econEl.className = 'mc-data-val up'; }
          if (dollarEl) { dollarEl.textContent = '📉 Se debilita'; dollarEl.className = 'mc-data-val down'; }
        } else if (rate <= 8) {
          if (acceptEl) { acceptEl.textContent = '😐 Tal vez...'; acceptEl.className = 'mc-data-val lateral'; }
          if (econEl) { econEl.textContent = '↔️ Neutral'; econEl.className = 'mc-data-val lateral'; }
          if (dollarEl) { dollarEl.textContent = '↔️ Neutral'; dollarEl.className = 'mc-data-val lateral'; }
        } else {
          if (acceptEl) { acceptEl.textContent = '😤 No, demasiado caro'; acceptEl.className = 'mc-data-val down'; }
          if (econEl) { econEl.textContent = '📉 Se enfría'; econEl.className = 'mc-data-val down'; }
          if (dollarEl) { dollarEl.textContent = '📈 Se fortalece'; dollarEl.className = 'mc-data-val up'; }
        }
      }

      function mcCycle(idx) {
        document.querySelectorAll('.mc-cycle-tab').forEach((t, i) => t.classList.toggle('active', i === idx));
        document.querySelectorAll('.mc-cycle-body').forEach((c, i) => c.classList.toggle('active', i === idx));
      }

      function mcToggleAcc(id) {
        const acc = document.getElementById('mca-' + id);
        if (!acc) return;
        const wasOpen = acc.classList.contains('open');
        document.querySelectorAll('.mc-accordion').forEach(a => a.classList.remove('open'));
        if (!wasOpen) acc.classList.add('open');
      }

      function mcScen(id, ev) {
        ev.stopPropagation();
        const container = ev.target.closest('.mc-acc-inner');
        if (!container) return;
        container.querySelectorAll('.mc-scen-tab').forEach(t => t.classList.remove('active'));
        container.querySelectorAll('.mc-scen-panel').forEach(p => p.classList.remove('active'));
        ev.target.classList.add('active');
        const targetPanel = container.querySelector('#mc-scen-' + id);
        if (targetPanel) targetPanel.classList.add('active');
      }

      // Quiz macro
      let mcScore = 0;
      const mcExplanations = {
        q1: '✅ Los Bancos Centrales son los únicos actores que pueden influir directamente en el valor de una divisa.',
        q2: '✅ Si los empleos suben pero los salarios bajan, no hay presión inflacionaria → Dólar cae.',
        q3: '✅ El CPI sale entre los días 10-15 del mes: Capítulo 3 (La Tendencia).',
        q4: '✅ El mercado anticipa el futuro. Si el Dot Plot promete recortes, se vende Dólar HOY.',
        q5: '✅ El Core CPI es el dato "puro". Si sube, inflación subyacente viva → FED agresiva → Dólar fuerte.',
        q6: '✅ El NFP barre ambos lados. Esperar a que el caos se asiente es el protocolo correcto.',
        q7: '✅ Conflicto en Europa → Risk Off: EUR cae, refugios (USD, CHF, JPY, Oro) suben.',
        q8: '✅ Divergencia máxima: USA hawkish + crecimiento vs Europa dovish + contracción → EUR/USD bajista.',
        q9: '✅ Petróleo sube → CAD se fortalece → USD/CAD baja. Correlación confiable.',
        q10: '✅ Convergencia perfecta = lateralización. Buscar otro par con divergencia clara.'
      };

      function mcAnswer(qId, btn, isCorrect) {
        const fb = document.getElementById('mcfb-' + qId);
        if (!fb) return;
        btn.parentElement.querySelectorAll('.mc-quiz-opt').forEach(o => o.classList.add('disabled'));
        if (isCorrect) {
          btn.classList.add('correct');
          mcScore++;
          fb.className = 'mc-quiz-fb show correct';
          fb.textContent = mcExplanations[qId] || '✅ Correcto.';
        } else {
          btn.classList.add('wrong');
          fb.className = 'mc-quiz-fb show wrong';
          fb.textContent = '❌ Incorrecto. ' + (mcExplanations[qId] || '');
        }
        setTimeout(() => mcNextQ(qId), 2400);
      }

      function mcNextQ(current) {
        const num = parseInt(current.replace('q', ''));
        const cur = document.getElementById('mcq' + num);
        const nxt = document.getElementById('mcq' + (num + 1));
        if (nxt) {
          if (cur) cur.style.display = 'none';
          nxt.style.display = 'block';
          nxt.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          if (cur) cur.style.display = 'none';
          const res = document.getElementById('mc-quiz-result');
          if (res) {
            res.style.display = 'block';
            res.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const tiers = [
              ['Seguí estudiando 💪', 'La macroeconomía se aprende con repetición.'],
              ['Vas por buen camino 📈', 'Tenés las bases sólidas.'],
              ['Nivel Avanzado ⭐', 'Entendés el ciclo macro y la geopolítica.'],
              ['Dominio Estructural 🏆', 'Excelente. Combiná con análisis técnico.']
            ];
            const t = mcScore < 4 ? 0 : mcScore < 7 ? 1 : mcScore < 9 ? 2 : 3;
            document.getElementById('mc-result-title').textContent = tiers[t][0];
            document.getElementById('mc-result-desc').textContent = tiers[t][1];
            document.getElementById('mc-result-score').textContent = mcScore + '/10';
          }
        }
      }

      function mcResetQuiz() {
        mcScore = 0;
        for (let i = 1; i <= 10; i++) {
          const qb = document.getElementById('mcq' + i);
          if (qb) {
            qb.style.display = i === 1 ? 'block' : 'none';
            qb.querySelectorAll('.mc-quiz-opt').forEach(o => o.className = 'mc-quiz-opt');
          }
          const fb = document.getElementById('mcfb-q' + i);
          if (fb) fb.className = 'mc-quiz-fb';
        }
        const resDiv = document.getElementById('mc-quiz-result');
        if (resDiv) resDiv.style.display = 'none';
        const firstQ = document.getElementById('mcq1');
        if (firstQ) firstQ.scrollIntoView({ behavior: 'smooth' });
      }

      // Geo inline quiz
      const geoAnswers = {
        'geo-q1': { correct: 'B', ex: '✅ EUR/CHF vendiendo EUR es el par ideal en conflicto europeo.' },
        'geo-q2': { correct: 'B', ex: '✅ El mercado anticipa incertidumbre y huida de capitales → BRL cae.' },
        'geo-q3': { correct: 'B', ex: '✅ Petróleo sube → inflación → FED hawkish → USD sube.' },
        'geo-q4': { correct: 'B', ex: '✅ El rendimiento del bono sube por desconfianza → EUR bajo presión.' },
        'geo-q5': { correct: 'B', ex: '✅ Petróleo sube → CAD fuerte → USD/CAD baja.' },
        'div-q1': { correct: 'A', ex: '✅ Diferencial de tasas FED vs BoJ → USD/JPY alcista estructural.' },
        'div-esc1': { correct: 'B', ex: '✅ Diferencial a favor del USD + economía USA fuerte → EUR/USD bajista.' },
        'div-esc2': { correct: 'A', ex: '✅ Australia sube tasas mientras USA las baja → AUD/USD alcista.' },
        'div-esc3': { correct: 'C', ex: '✅ Convergencia perfecta → lateralización. Buscar otro par.' },
        'ct-q1': { correct: 'B', ex: '✅ Carry unwinding: todos venden AUD y compran JPY → AUD/JPY cae.' },
        'ct-q2': { correct: 'C', ex: '✅ VIX alto = pánico → carry unwinding → JPY sube.' },
        'cy-q1': { correct: 'B', ex: '✅ Curva invertida (2Y > 10Y) → señal de recesión.' },
        'cy-q2': { correct: 'B', ex: '✅ La recesión suele empezar cuando la curva se desinvierte.' },
        'ce-q1': { correct: 'B', ex: '✅ Dos trimestres de PIB negativo + PMI bajo = recesión.' },
        'ce-q2': { correct: 'B', ex: '✅ El mercado anticipa la recuperación → fase 4.' },
        'ce-q3': { correct: 'B', ex: '✅ Stagflación: dilema imposible para el banco central.' }
      };

      function geoQ(qId, choice, isCorrect, fbId) {
        const fb = document.getElementById(fbId);
        const optsContainer = document.getElementById(qId + '-opts');
        if (optsContainer) optsContainer.querySelectorAll('.mc-quiz-opt').forEach(o => o.classList.add('disabled'));
        const btn = event.currentTarget;
        if (isCorrect) {
          btn.classList.add('correct');
          if (fb) {
            fb.className = 'mc-quiz-fb show correct';
            fb.textContent = geoAnswers[qId] ? geoAnswers[qId].ex : '✅ Correcto.';
          }
        } else {
          btn.classList.add('wrong');
          if (fb) {
            fb.className = 'mc-quiz-fb show wrong';
            fb.textContent = geoAnswers[qId] ? '❌ ' + geoAnswers[qId].ex : '❌ Incorrecto.';
          }
        }
      }

      // ==================== FUNCIONES DE TAREAS Y 2 STEPS ====================
      // Tareas ahora vienen de la API. Estado "completado" se guarda en localStorage
      // con la key 'tnsv_task_completed_<id>' (true/false).
      let initialTasks = [];

      function _getTaskCompleted(id) {
        return localStorage.getItem('tnsv_task_completed_' + id) === 'true';
      }
      function _setTaskCompleted(id, completed) {
        if (completed) localStorage.setItem('tnsv_task_completed_' + id, 'true');
        else localStorage.removeItem('tnsv_task_completed_' + id);
      }

      async function loadTasks() {
        const container = document.getElementById('taskListContainer');
        if (!container) return;
        try {
          const data = await sb.get('/api/tasks');
          initialTasks = (data || []).map(t => ({
            id: t.id,
            title: t.title,
            desc: t.description || '',
            completed: _getTaskCompleted(t.id)
          }));
        } catch (e) {
          console.error('Error cargando tareas:', e);
          initialTasks = [];
        }
        let completeCount = 0;
        container.innerHTML = initialTasks.map(t => {
          if (t.completed) completeCount++;
          return `
            <div class="task-card ${t.completed ? 'completed' : ''}">
              <div class="task-check" onclick="toggleTask(${t.id})">${t.completed ? '✓' : ''}</div>
              <div class="task-content-area">
                <div class="task-title">${escapeHtml(t.title)}</div>
                <div class="task-desc">${escapeHtml(t.desc)}</div>
              </div>
            </div>`;
        }).join('');
        const counterSpan = document.getElementById('task-counter');
        if (counterSpan) counterSpan.textContent = `(${completeCount}/${initialTasks.length})`;
      }

      function toggleTask(id) {
        const task = initialTasks.find(x => x.id === id);
        if (task) {
          task.completed = !task.completed;
          _setTaskCompleted(id, task.completed);
          loadTasks();
          showToast("Estado de tarea actualizado.");
        }
      }

      // Modulo 2 Steps siempre desbloqueado (codigo BOS2026 eliminado)
      let inner2StepsUnlocked = true;

      function updateInnerLocks() {
        const badge = document.getElementById('badge-2step-lock');
        if (badge) {
          badge.textContent = "⚡ Desbloqueado";
          badge.style.background = "rgba(52,199,89,0.15)";
          badge.style.borderColor = "#34c759";
        }
        const lockedDiv = document.getElementById('panel-2steps-locked');
        const unlockedDiv = document.getElementById('panel-2steps-unlocked');
        if (lockedDiv) lockedDiv.style.display = 'none';
        if (unlockedDiv) unlockedDiv.style.display = 'block';
      }

      // ==================== CALENDARIO ECONÓMICO ====================
      function switchCalTab(tab) {
        const live = document.getElementById('cal-live');
        const manual = document.getElementById('cal-manual');
        const btnLive = document.getElementById('cal-tab-live');
        const btnManual = document.getElementById('cal-tab-manual');
        if(live) live.style.display = tab==='live' ? 'block' : 'none';
        if(manual) manual.style.display = tab==='manual' ? 'block' : 'none';
        if(btnLive){ btnLive.style.background=tab==='live'?'var(--gold)':'transparent'; btnLive.style.color=tab==='live'?'#000':'#645a78'; }
        if(btnManual){ btnManual.style.background=tab==='manual'?'var(--gold)':'transparent'; btnManual.style.color=tab==='manual'?'#000':'#645a78'; }
      }

      // ==================== TRADING JOURNAL (versión completa) ====================
      let tjTrades = JSON.parse(localStorage.getItem('tj_trades') || '[]');
      let tjLoaded = false;
      let tjEditingId = null;
      let tjCalMonth = new Date().getMonth();
      let tjCalYear = new Date().getFullYear();
      let tjPeriodFilter = 'all';
      let tjChartPeriod = 'daily';
      let tjPhotoData = [null, null, null];

      function tjTab(panelId, btn) {
        document.querySelectorAll('.tj-panel').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.tj-tab').forEach(t => t.classList.remove('active'));
        document.getElementById(panelId).classList.add('active');
        btn.classList.add('active');
      }

      function tjPhotoPreview(idx, input) {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
          const img = new Image();
          img.onload = function() {
            const canvas = document.createElement('canvas');
            const maxW = 800;
            const scale = Math.min(1, maxW / img.width);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const compressed = canvas.toDataURL('image/jpeg', 0.6);
            tjPhotoData[idx] = compressed;
            const slot = document.getElementById('tj-photo-' + idx);
            if (slot) {
              slot.classList.add('has-img');
              let existing = slot.querySelector('img');
              if (existing) existing.remove();
              const imgEl = document.createElement('img');
              imgEl.src = compressed;
              slot.insertBefore(imgEl, slot.querySelector('.remove-photo'));
            }
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      }

      function tjPhotoRemove(idx, event) {
        event.stopPropagation();
        tjPhotoData[idx] = null;
        const slot = document.getElementById('tj-photo-' + idx);
        if (slot) {
          slot.classList.remove('has-img');
          const img = slot.querySelector('img');
          if (img) img.remove();
          const input = slot.querySelector('input');
          if (input) input.value = '';
        }
      }

      function tjResetPhotos() {
        tjPhotoData = [null, null, null];
        for (let i = 0; i < 3; i++) {
          const slot = document.getElementById('tj-photo-' + i);
          if (slot) {
            slot.classList.remove('has-img');
            const img = slot.querySelector('img');
            if (img) img.remove();
            const input = slot.querySelector('input');
            if (input) input.value = '';
          }
        }
      }

      async function tjAddTrade() {
        const asset = document.getElementById('tj-f-asset')?.value.trim();
        if (!asset) return alert('Ingresá el par/activo');
        const trade = {
          id: tjEditingId || Date.now(),
          date: tjEditingId ? (tjTrades.find(t => t.id === tjEditingId) || {}).date || new Date().toISOString() : new Date().toISOString(),
          asset: asset.toUpperCase(),
          dir: document.getElementById('tj-f-dir')?.value || 'BUY',
          entry: document.getElementById('tj-f-entry')?.value || '',
          sl: document.getElementById('tj-f-sl')?.value || '',
          tp: document.getElementById('tj-f-tp')?.value || '',
          result: document.getElementById('tj-f-result')?.value || 'WIN',
          pnl: parseFloat(document.getElementById('tj-f-pnl')?.value) || 0,
          ratio: document.getElementById('tj-f-ratio')?.value || '',
          notes: document.getElementById('tj-f-notes')?.value || '',
          photos: tjPhotoData.filter(p => p !== null)
        };
        trade.user_code = window.TNSVT_USER ? window.TNSVT_USER.code : null;
        if (_tjActiveAccountId) trade.account_id = _tjActiveAccountId;
        const wasEditing = tjEditingId;
        try {
          if (tjEditingId) {
            await sb.updateTrade(tjEditingId, trade);
            const idx = tjTrades.findIndex(t => t.id === tjEditingId);
            if (idx > -1) tjTrades[idx] = { ...tjTrades[idx], ...trade };
          } else {
            const result = await sb.createTrade(trade);
            trade.id = result.id;
            tjTrades.unshift(trade);
          }
        } catch(e) {
          showToast('❌ Error guardando trade');
          return;
        }
        ['tj-f-asset', 'tj-f-entry', 'tj-f-sl', 'tj-f-tp', 'tj-f-pnl', 'tj-f-ratio', 'tj-f-notes'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.value = '';
        });
        tjResetPhotos();
        tjEditingId = null;
        const submitBtn = document.getElementById('tj-submit-btn');
        if (submitBtn) submitBtn.textContent = 'Registrar Trade';
        tjRefresh();
        tjTab('tj-dash', document.querySelector('.tj-tab'));
        showToast(wasEditing ? 'Trade actualizado ✅' : 'Trade registrado ✅');
      }

      async function tjDeleteTrade(id) {
        if (!confirm('¿Eliminar este trade? No se puede deshacer.')) return;
        if (typeof id === 'number' && id < 1000000) {
          try { await sb.deleteTrade(id); } catch(e) { console.warn('[journal] backend delete:', e); }
        }
        tjTrades = tjTrades.filter(t => t.id !== id);
        tjRefresh();
      }

      function tjEditTrade(id) {
        const t = tjTrades.find(x => x.id === id);
        if (!t) return;
        document.getElementById('tj-f-asset').value = t.asset || '';
        document.getElementById('tj-f-dir').value = t.dir || 'BUY';
        document.getElementById('tj-f-entry').value = t.entry || '';
        document.getElementById('tj-f-sl').value = t.sl || '';
        document.getElementById('tj-f-tp').value = t.tp || '';
        document.getElementById('tj-f-result').value = t.result || 'WIN';
        document.getElementById('tj-f-pnl').value = t.pnl || '';
        document.getElementById('tj-f-ratio').value = t.ratio || '';
        document.getElementById('tj-f-notes').value = t.notes || '';
        tjResetPhotos();
        if (t.photos) {
          t.photos.forEach((p, i) => {
            if (i < 3) {
              tjPhotoData[i] = p;
              const slot = document.getElementById('tj-photo-' + i);
              if (slot) {
                slot.classList.add('has-img');
                const imgEl = document.createElement('img');
                imgEl.src = p;
                slot.insertBefore(imgEl, slot.querySelector('.remove-photo'));
              }
            }
          });
        }
        tjEditingId = id;
        const submitBtn = document.getElementById('tj-submit-btn');
        if (submitBtn) submitBtn.textContent = 'Guardar Cambios';
        tjTab('tj-log', document.querySelectorAll('.tj-tab')[1]);
        showToast('Editando trade — modificá y guardá');
      }

      function tjCancelEdit() {
        tjEditingId = null;
        const submitBtn = document.getElementById('tj-submit-btn');
        if (submitBtn) submitBtn.textContent = 'Registrar Trade';
      }
      window.tjCancelEdit = tjCancelEdit;

      function tjRenderStats() {
        const empty = document.getElementById('tj-stats-empty');
        const content = document.getElementById('tj-stats-content');
        if(!empty||!content) return;
        if(tjTrades.length===0){ empty.style.display='block'; content.style.display='none'; return; }
        empty.style.display='none'; content.style.display='block';
        const wins=tjTrades.filter(t=>t.result==='WIN');
        const losses=tjTrades.filter(t=>t.result==='LOSS');
        const grossWin=wins.reduce((s,t)=>s+t.pnl,0);
        const grossLoss=Math.abs(losses.reduce((s,t)=>s+t.pnl,0));
        const pf=grossLoss>0?(grossWin/grossLoss):(grossWin>0?Infinity:0);
        const exp=tjTrades.reduce((s,t)=>s+t.pnl,0)/tjTrades.length;
        const avgWin=wins.length?grossWin/wins.length:0;
        const avgLoss=losses.length?grossLoss/losses.length:0;
        const set = (id, val) => { const el=document.getElementById(id); if(el) el.textContent=val; };
        const setColor = (id, color) => { const el=document.getElementById(id); if(el) el.style.color=color; };
        set('kpi-pf', pf===Infinity?'∞':pf.toFixed(2));
        setColor('kpi-pf', pf>=1.5?'#34c759':pf>=1?'#ff9500':'var(--red-impact)');
        set('kpi-exp', '$'+(exp>=0?'+':'')+exp.toFixed(2));
        setColor('kpi-exp', exp>=0?'#34c759':'var(--red-impact)');
        set('kpi-avgwin', '$'+avgWin.toFixed(2));
        set('kpi-avgloss', '-$'+avgLoss.toFixed(2));
        const sorted=[...tjTrades].sort((a,b)=>b.pnl-a.pnl);
        const best=sorted[0], worst=sorted[sorted.length-1];
        set('kpi-best', '$'+(best.pnl>=0?'+':'')+best.pnl.toFixed(2));
        set('kpi-best-asset', best.asset);
        set('kpi-worst', '$'+worst.pnl.toFixed(2));
        set('kpi-worst-asset', worst.asset);
        const chrono=[...tjTrades].reverse();
        let maxW=0,maxL=0,curW=0,curL=0;
        chrono.forEach(t=>{if(t.result==='WIN'){curW++;curL=0;if(curW>maxW)maxW=curW;}else if(t.result==='LOSS'){curL++;curW=0;if(curL>maxL)maxL=curL;}else{curW=0;curL=0;}});
        set('kpi-winstreak', maxW);
        set('kpi-lossstreak', maxL);
        const byAsset={};
        tjTrades.forEach(t=>{if(!byAsset[t.asset])byAsset[t.asset]={pnl:0,n:0,w:0};byAsset[t.asset].pnl+=t.pnl;byAsset[t.asset].n++;if(t.result==='WIN')byAsset[t.asset].w++;});
        const assetArr=Object.entries(byAsset).sort((a,b)=>b[1].pnl-a[1].pnl);
        const maxAbs=Math.max(...assetArr.map(a=>Math.abs(a[1].pnl)),1);
        const assetEl=document.getElementById('tj-by-asset');
        if(assetEl) assetEl.innerHTML=assetArr.map(([asset,d])=>{
          const pct=Math.abs(d.pnl)/maxAbs*100;
          const color=d.pnl>=0?'#34c759':'var(--red-impact)';
          return '<div class="tj-bar-row"><span class="tj-bar-label">'+asset+'</span><div class="tj-bar-track"><div class="tj-bar-fill" style="width:'+pct+'%;background:'+color+';">'+d.n+'t · '+((d.w/d.n)*100).toFixed(0)+'%</div></div><span class="tj-bar-pnl" style="color:'+color+';">$'+(d.pnl>=0?'+':'')+d.pnl.toFixed(0)+'</span></div>';
        }).join('');
        const days=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
        const byDay={};
        tjTrades.forEach(t=>{const wd=new Date(t.date).getDay();if(!byDay[wd])byDay[wd]={pnl:0,n:0};byDay[wd].pnl+=t.pnl;byDay[wd].n++;});
        const maxDayAbs=Math.max(...Object.values(byDay).map(d=>Math.abs(d.pnl)),1);
        const dayEl=document.getElementById('tj-by-weekday');
        if(dayEl) dayEl.innerHTML=[1,2,3,4,5,6,0].filter(wd=>byDay[wd]).map(wd=>{
          const d=byDay[wd];const pct=Math.abs(d.pnl)/maxDayAbs*100;const color=d.pnl>=0?'#34c759':'var(--red-impact)';
          return '<div class="tj-bar-row"><span class="tj-bar-label">'+days[wd]+'</span><div class="tj-bar-track"><div class="tj-bar-fill" style="width:'+pct+'%;background:'+color+';">'+d.n+'t</div></div><span class="tj-bar-pnl" style="color:'+color+';">$'+(d.pnl>=0?'+':'')+d.pnl.toFixed(0)+'</span></div>';
        }).join('');
      }

      function tjSetPeriod(period, btn) {
        tjChartPeriod = period;
        document.querySelectorAll('#tj-chart-periods .tj-cperiod-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        tjRenderMonthly();
      }

      function _getWeekKey(dateStr) {
        const d = new Date(dateStr);
        const dayNum = d.getDay() || 7;
        d.setDate(d.getDate() + 4 - dayNum);
        const y = d.getFullYear();
        const start = new Date(y, 0, 1);
        const week = Math.ceil((((d - start) / 86400000) + start.getDay() + 1) / 7);
        return y + '-W' + String(week).padStart(2, '0');
      }

      function _periodLabel(period, key) {
        if (period === 'daily') {
          const d = new Date(key);
          return d.toLocaleDateString('es', { day: 'numeric', month: 'short' });
        }
        if (period === 'weekly') return 'W' + key.slice(-2);
        const m = parseInt(key.slice(5));
        return ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][m - 1];
      }

      function _periodTitle(period, key) {
        if (period === 'daily') return key;
        if (period === 'weekly') return key;
        return key;
      }

      function tjRenderMonthly() {
        const svg = document.getElementById('tj-monthly-svg');
        if (!svg) return;
        const barsG = document.getElementById('mbar-bars');
        const wrLine = document.getElementById('mbar-wr-line');
        const empty = document.getElementById('mbar-empty');
        const tooltipBg = document.getElementById('mbar-tooltip-bg');
        const tooltipTitle = document.getElementById('mbar-tooltip-title');
        const tooltipPnl = document.getElementById('mbar-tooltip-pnl');
        const tooltipSub = document.getElementById('mbar-tooltip-sub');
        if (!barsG || !wrLine) return;

        if (tjTrades.length === 0) {
          if (empty) empty.style.display = 'block';
          barsG.innerHTML = '';
          wrLine.setAttribute('points', '');
          return;
        }
        if (empty) empty.style.display = 'none';

        // Group by period
        const byPeriod = {};
        tjTrades.forEach(t => {
          let key;
          if (tjChartPeriod === 'daily') key = t.date.slice(0, 10);
          else if (tjChartPeriod === 'weekly') key = _getWeekKey(t.date);
          else key = t.date.slice(0, 7);
          if (!byPeriod[key]) byPeriod[key] = { pnl: 0, n: 0, w: 0 };
          byPeriod[key].pnl += t.pnl;
          byPeriod[key].n++;
          if (t.result === 'WIN') byPeriod[key].w++;
        });

        const periods = Object.keys(byPeriod).sort();
        if (periods.length < 1) { barsG.innerHTML = ''; wrLine.setAttribute('points', ''); return; }

        const cL = 50, cR = 585, cT = 25, cB = 170;
        const halfSpace = 4;
        const totalSpace = cR - cL;
        const maxPeriods = Math.min(periods.length, 60);
        const barW = Math.min(40, (totalSpace / maxPeriods) - halfSpace * 2);
        const gap = barW + halfSpace * 2;

        const allPnl = periods.slice(0, 60).map(m => byPeriod[m].pnl);
        const maxPnl = Math.max(...allPnl, 1);
        const minPnl = Math.min(...allPnl, -1);
        const maxAbs = Math.max(Math.abs(maxPnl), Math.abs(minPnl), 1);
        const zeroY = cB - (0 - (-maxAbs)) / (maxAbs - (-maxAbs)) * (cB - cT);

        // Y labels
        const yT = document.getElementById('mbar-y-top');
        const yM = document.getElementById('mbar-y-mid');
        const yB = document.getElementById('mbar-y-bot');
        const fmt = v => '$' + (Math.abs(v) >= 1000 ? (v / 1000).toFixed(1) + 'k' : v.toFixed(0));
        if (yT) yT.textContent = fmt(maxAbs);
        if (yM) yM.textContent = fmt(0);
        if (yB) yB.textContent = fmt(-maxAbs);

        let barsHtml = '';
        const wrPts = [];
        periods.slice(0, 60).forEach((m, i) => {
          const d = byPeriod[m];
          const x = cL + i * gap + halfSpace;
          const barH = Math.abs(d.pnl) / maxAbs * (cB - cT) * 0.9;
          const isPos = d.pnl >= 0;
          const y = isPos ? zeroY - barH : zeroY;
          const color = isPos ? 'url(#barGradPos)' : 'url(#barGradNeg)';
          const wr = (d.w / d.n * 100).toFixed(0);
          const label = _periodLabel(tjChartPeriod, m);
          barsHtml += `<rect x="${x}" y="${y}" width="${barW}" height="${Math.max(barH, 1)}" fill="${color}" rx="3" filter="url(#barShadow)">`
            + `<title>${_periodTitle(tjChartPeriod, m)}: $${d.pnl >= 0 ? '+' : ''}${d.pnl.toFixed(2)} · ${d.w}W / ${d.n - d.w}L · ${wr}%</title></rect>`;
          barsHtml += `<text x="${x + barW / 2}" y="${cB + 12}" fill="#645a78" font-size="7" font-family="Orbitron,sans-serif" text-anchor="middle">${label}</text>`;
          const wrX = x + barW / 2;
          const wrY = cT + (100 - wr) / 100 * (cB - cT - 10);
          wrPts.push(wrX + ',' + wrY);
          barsHtml += `<circle cx="${wrX}" cy="${wrY}" r="2.5" fill="#8a3cff" opacity="0.8"><title>${wr}% win rate</title></circle>`;
        });

        barsG.innerHTML = barsHtml;
        wrLine.setAttribute('points', wrPts.join(' '));
      }

      // ── v36 form helpers ──
      function selectTjAsset(btn) {
        document.querySelectorAll('#tj-asset-chips .asset-chip-v36').forEach(c => c.classList.remove('selected'));
        btn.classList.add('selected');
        const hidden = document.getElementById('tj-f-asset');
        if (hidden) hidden.value = btn.getAttribute('data-asset');
        const custom = document.querySelector('#tj-asset-chips .asset-input-v36');
        if (custom) custom.value = '';
      }
      window.selectTjAsset = selectTjAsset;

      function onTjAssetCustom(input) {
        const val = (input.value || '').trim().toUpperCase();
        if (val) {
          document.querySelectorAll('#tj-asset-chips .asset-chip-v36').forEach(c => c.classList.remove('selected'));
          const hidden = document.getElementById('tj-f-asset');
          if (hidden) hidden.value = val;
        }
      }
      window.onTjAssetCustom = onTjAssetCustom;

      function selectTjDir(btn) {
        document.querySelectorAll('#tj-dir-row .dir-btn-v36').forEach(c => c.classList.remove('selected'));
        btn.classList.add('selected');
        const sel = document.getElementById('tj-f-dir');
        if (sel) sel.value = btn.getAttribute('data-dir');
      }
      window.selectTjDir = selectTjDir;

      function selectTjResult(btn) {
        document.querySelectorAll('#tj-result-row .result-btn-v36').forEach(c => c.classList.remove('selected'));
        btn.classList.add('selected');
        const sel = document.getElementById('tj-f-result');
        if (sel) sel.value = btn.getAttribute('data-result');
      }
      window.selectTjResult = selectTjResult;

      function tjExportCSV() {
        if (tjTrades.length === 0) return showToast('No hay trades para exportar');
        const code = window.TNSVT_USER?.code;
        if (!code) return showToast('No hay sesión');
        window.open('/api/journal/export?user_code=' + encodeURIComponent(code) + '&format=csv');
        showToast('Descargando CSV…');
      }
      window.tjExportCSV = tjExportCSV;

      function tjExportHTML() {
        if (tjTrades.length === 0) return showToast('No hay trades para exportar');
        const code = window.TNSVT_USER?.code;
        if (!code) return showToast('No hay sesión');
        window.open('/api/journal/export?user_code=' + encodeURIComponent(code) + '&format=html');
        showToast('Abriendo reporte HTML…');
      }
      window.tjExportHTML = tjExportHTML;
      window.tjSetPeriod = tjSetPeriod;

      function tjExport() {
        if (tjTrades.length === 0) return showToast('No hay trades para exportar');
        const data = { version: 1, exported: new Date().toISOString(), account: document.getElementById('tj-account-size')?.value, trades: tjTrades };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tnsvt_journal_' + new Date().toISOString().slice(0, 10) + '.json';
        a.click();
        URL.revokeObjectURL(url);
        showToast('Journal exportado ✅');
      }

      function tjImport(input) {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
          try {
            const data = JSON.parse(e.target.result);
            if (!data.trades || !Array.isArray(data.trades)) throw new Error('formato');
            if (!confirm(`Reemplazar ${tjTrades.length} trades por ${data.trades.length}?`)) return;
            tjTrades = data.trades;
            if (data.account) document.getElementById('tj-account-size').value = data.account;
            localStorage.setItem('tj_trades', JSON.stringify(tjTrades));
            tjRefresh();
            showToast('Journal importado: ' + data.trades.length + ' trades ✅');
          } catch (err) {
            alert('Archivo inválido.');
          }
          input.value = '';
        };
        reader.readAsText(file);
      }

      function tjPeriod(period, btn) {
        tjPeriodFilter = period;
        document.querySelectorAll('.tj-period-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        tjRefresh();
      }

      function tjRefresh() {
        // Read-only mode when viewing another user's journal
        const isReadOnly = !!window._journalViewingCode;

        // Viewing banner
        const bannerEl = document.getElementById('journalViewingBanner');
        const nameEl = document.getElementById('journalViewingName');
        const scopeEl = document.getElementById('journalViewingScope');
        if (bannerEl) {
          if (window._journalViewingCode) {
            bannerEl.style.display = 'flex';
            if (nameEl) nameEl.textContent = window._journalViewingName || window._journalViewingCode;
            const scopeTxt = window._journalScope === 'public' ? '(vista pública)' : window._journalScope === 'connected' ? '(vista según permisos)' : '';
            if (scopeEl) scopeEl.textContent = scopeTxt + ' · Solo lectura';
          } else {
            bannerEl.style.display = 'none';
          }
        }

        // Hide modification affordances in read-only mode
        const hideIfReadOnly = (sel) => {
          const el = document.querySelector(sel);
          if (el) el.style.display = isReadOnly ? 'none' : '';
        };
        // Tab "Registrar" (segundo tab del journal)
        document.querySelectorAll('.tj-tab').forEach(tab => {
          if (tab.textContent.includes('Registrar')) tab.style.display = isReadOnly ? 'none' : '';
        });
        // Botones de export
        hideIfReadOnly('button[onclick="tjExportCSV()"]');
        hideIfReadOnly('button[onclick="tjExportHTML()"]');
        hideIfReadOnly('button[onclick="tjExport()"]');
        // Botón Importar (label > input file)
        document.querySelectorAll('label.tj-tool-btn').forEach(lbl => {
          if (lbl.textContent.includes('Importar')) lbl.style.display = isReadOnly ? 'none' : '';
        });

        const total = tjTrades.length;
        const wins = tjTrades.filter(t => t.result === 'WIN').length;
        const losses = tjTrades.filter(t => t.result === 'LOSS').length;
        const pnl = tjTrades.reduce((s, t) => s + t.pnl, 0);
        const accountSize = parseFloat(document.getElementById('tj-account-size')?.value) || 10000;
        const currentBalance = accountSize + pnl;

        // Stats cards
        const e1 = document.getElementById('tj-total'); if(e1) e1.textContent = total;
        const e2 = document.getElementById('tj-total-sub'); if(e2) e2.textContent = wins + ' ganadores';
        const e3 = document.getElementById('tj-winrate'); if(e3) e3.textContent = total ? ((wins/total)*100).toFixed(1)+'%' : '0.0%';
        const e4 = document.getElementById('tj-wr-sub'); if(e4) e4.textContent = wins+'W / '+losses+'L';
        const pnlEl = document.getElementById('tj-pnl');
        if(pnlEl){ pnlEl.textContent='$'+(pnl>=0?'+':'')+pnl.toFixed(2); pnlEl.style.color=pnl>=0?'#34c759':'var(--red-impact)'; }
        const e5 = document.getElementById('tj-pnl-sub'); if(e5) e5.textContent = total ? 'Promedio: $'+(pnl/total).toFixed(2)+'/trade' : '—';
        const balEl = document.getElementById('tj-account-current');
        if(balEl){ balEl.textContent='Balance: $'+currentBalance.toLocaleString('en',{minimumFractionDigits:2}); balEl.style.color=currentBalance>=accountSize?'#34c759':'var(--red-impact)'; }

        // Streak
        let streak=0; const dates=[...new Set(tjTrades.map(t=>t.date.slice(0,10)))];
        const today=new Date().toISOString().slice(0,10); let d=today;
        while(dates.includes(d)){streak++;const nd=new Date(d);nd.setDate(nd.getDate()-1);d=nd.toISOString().slice(0,10);}
        const stEl=document.getElementById('tj-streak'); if(stEl) stEl.textContent=streak+' días';

        // Equity chart
        const emptyEl=document.getElementById('eq-empty');
        const lineEl=document.getElementById('eq-line');
        const areaEl=document.getElementById('eq-area');
        const dotsEl=document.getElementById('eq-dots');
        if(lineEl && areaEl && dotsEl){
          if(total===0){
            if(emptyEl) emptyEl.style.display='block';
            lineEl.setAttribute('points',''); areaEl.setAttribute('d',''); dotsEl.innerHTML='';
          } else {
            if(emptyEl) emptyEl.style.display='none';
            let ft=[...tjTrades].reverse();
            let bal=accountSize; const pts=[{x:0,y:bal,date:'Inicio'}];
            ft.forEach((t,i)=>{bal+=t.pnl;const dd=new Date(t.date);pts.push({x:i+1,y:bal,date:dd.toLocaleDateString('es',{day:'numeric',month:'short'}),result:t.result});});
            const yMin=Math.min(...pts.map(p=>p.y)),yMax=Math.max(...pts.map(p=>p.y));
            const yRange=yMax-yMin||1,pad=yRange*0.1,yL=yMin-pad,yH=yMax+pad;
            const cL=50,cR=590,cT=15,cB=190,xM=pts.length-1;
            const mX=v=>cL+(v/Math.max(xM,1))*(cR-cL);
            const mY=v=>cB-(v-yL)/(yH-yL)*(cB-cT);
            lineEl.setAttribute('points',pts.map(p=>mX(p.x)+','+mY(p.y)).join(' '));
            const isUp=pts[pts.length-1].y>=accountSize;
            lineEl.setAttribute('stroke',isUp?'#34c759':'#ff3b30');
            areaEl.setAttribute('fill',isUp?'url(#eqGradUp)':'url(#eqGradDown)');
            const fp=pts[0],lp=pts[pts.length-1];
            let aD='M'+mX(fp.x)+','+mY(fp.y);
            pts.slice(1).forEach(p=>{aD+=' L'+mX(p.x)+','+mY(p.y);});
            aD+=' L'+mX(lp.x)+','+cB+' L'+mX(fp.x)+','+cB+' Z';
            areaEl.setAttribute('d',aD);
            dotsEl.innerHTML=pts.slice(1).map(p=>{
              const cx=mX(p.x),cy=mY(p.y);
              const color=p.result==='WIN'?'#34c759':p.result==='LOSS'?'#ff3b30':'#ff9500';
              return '<circle cx="'+cx+'" cy="'+cy+'" r="3" fill="'+color+'" opacity="0.8"><title>'+p.date+': $'+p.y.toFixed(2)+'</title></circle>';
            }).join('');
            const bl=document.getElementById('eq-baseline');
            if(bl){const by=mY(accountSize);bl.setAttribute('y1',by);bl.setAttribute('y2',by);}
            const yt=document.getElementById('eq-y-top');if(yt)yt.textContent='$'+(yH>=10000?(yH/1000).toFixed(1)+'k':yH.toFixed(0));
            const ym=document.getElementById('eq-y-mid');if(ym)ym.textContent='$'+(accountSize>=10000?(accountSize/1000).toFixed(1)+'k':accountSize.toFixed(0));
            const yb=document.getElementById('eq-y-bot');if(yb)yb.textContent='$'+(yL>=10000?(yL/1000).toFixed(1)+'k':yL.toFixed(0));
            const xs=document.getElementById('eq-x-start');if(xs&&pts.length>1)xs.textContent=pts[1].date||'';
            const xe=document.getElementById('eq-x-end');if(xe)xe.textContent=pts[pts.length-1].date||'';
          }
        }

        // Trade list con filtros
        const list = document.getElementById('tj-trade-list');
        const noTrades = document.getElementById('tj-no-trades');
        const search = (document.getElementById('tj-search')?.value||'').toLowerCase().trim();
        const fResult = document.getElementById('tj-filter-result')?.value || 'all';
        const fDir = document.getElementById('tj-filter-dir')?.value || 'all';
        let filtered = tjTrades.filter(t => {
          if(fResult!=='all' && t.result!==fResult) return false;
          if(fDir!=='all' && t.dir!==fDir) return false;
          if(search && !((t.asset||'').toLowerCase().includes(search)||(t.notes||'').toLowerCase().includes(search))) return false;
          return true;
        });
        if(list){
          if(total>0){
            if(noTrades) noTrades.style.display='none';
            list.innerHTML = filtered.map(t => {
              const cls=t.result.toLowerCase();
              const icon=t.result==='WIN'?'✅':t.result==='LOSS'?'❌':'↔️';
              const iconCls=t.result==='WIN'?'win-icon':t.result==='LOSS'?'loss-icon':'be-icon';
              const pnlColor=t.pnl>=0?'#34c759':'var(--red-impact)';
              const dateStr=new Date(t.date).toLocaleDateString('es',{day:'numeric',month:'short'});
              const photoTag=(t.photos&&t.photos.length)?' 📷'+t.photos.length:'';
              return '<div class="tj-trade-card '+cls+'">'
                +'<div class="tj-trade-icon '+iconCls+'">'+icon+'</div>'
                +'<div class="tj-trade-meta">'
                  +'<div class="tj-trade-top">'
                    +'<span class="tj-trade-pair"><span style="color:'+(t.dir==='BUY'?'#34c759':'var(--red-impact)')+';font-size:0.6rem;">'+t.dir+'</span> '+t.asset+photoTag+'</span>'
                    +'<span class="tj-trade-date">'+dateStr+'</span>'
                  +'</div>'
                  +'<div class="tj-trade-detail">'
                    +(t.entry?'E: '+t.entry:'')+(t.sl?' · SL: '+t.sl:'')+(t.tp?' · TP: '+t.tp:'')+(t.ratio?' · R:'+t.ratio:'')
                    +(t.notes?'<br><span style="color:#645a78;font-style:italic;">'+t.notes+'</span>':'')
                  +'</div>'
                +'</div>'
                +'<div class="tj-trade-pnl" style="color:'+pnlColor+';">'+(t.pnl>=0?'+':'')+t.pnl.toFixed(2)+'</div>'
                +(isReadOnly ? '' : '<div style="display:flex;flex-direction:column;gap:2px;">'
                  +'<button class="tj-del-btn" onclick="event.stopPropagation();tjEditTrade('+t.id+')" title="Editar">✏️</button>'
                  +'<button class="tj-del-btn" onclick="event.stopPropagation();tjDeleteTrade('+t.id+')" title="Eliminar" style="font-size:1.2rem;color:#ff2d55;">🗑</button>'
                +'</div>')
              +'</div>';
            }).join('');
          } else {
            if(noTrades){ noTrades.style.display='block'; noTrades.textContent='Aún no hay trades. Usá "Registrar" para empezar.'; }
            list.innerHTML='';
          }
        }

        tjRenderStats();
        tjRenderCal();
        tjRenderMonthly();
      }

      function tjCalNav(dir) {
        tjCalMonth += dir;
        if (tjCalMonth > 11) { tjCalMonth = 0; tjCalYear++; }
        if (tjCalMonth < 0) { tjCalMonth = 11; tjCalYear--; }
        tjRenderCal();
      }

      function tjRenderCal() {
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const monthSpan = document.getElementById('tj-cal-month');
        if (monthSpan) monthSpan.textContent = months[tjCalMonth] + ' ' + tjCalYear;
        const grid = document.getElementById('tj-cal-grid');
        if (!grid) return;
        const first = new Date(tjCalYear, tjCalMonth, 1);
        const lastDay = new Date(tjCalYear, tjCalMonth + 1, 0).getDate();
        let startDay = first.getDay() - 1;
        if (startDay < 0) startDay = 6;
        const today = new Date();
        const tradeDates = {};
        tjTrades.forEach(t => {
          const d = t.date.slice(0, 10);
          if (!tradeDates[d]) tradeDates[d] = 0;
          tradeDates[d] += t.pnl;
        });
        let html = '';
        for (let i = 0; i < startDay; i++) html += '<div class="tj-cal-cell empty"></div>';
        for (let d = 1; d <= lastDay; d++) {
          const ds = tjCalYear + '-' + String(tjCalMonth + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
          const isToday = d === today.getDate() && tjCalMonth === today.getMonth() && tjCalYear === today.getFullYear();
          let cls = 'tj-cal-cell';
          let clickAttr = '';
          let pnlHtml = '';
          const dayPnl = tradeDates[ds];
          if (dayPnl !== undefined) {
            cls += ' has-trades';
            const pnlStr = (dayPnl >= 0 ? '+' : '') + '$' + dayPnl.toFixed(0);
            if (dayPnl > 0) {
              cls += ' has-win';
              pnlHtml = `<span class="tj-cal-pnl tj-cal-pnl-win">${pnlStr}</span>`;
            } else if (dayPnl < 0) {
              cls += ' has-loss';
              pnlHtml = `<span class="tj-cal-pnl tj-cal-pnl-loss">${pnlStr}</span>`;
            } else {
              cls += ' has-be';
              pnlHtml = `<span class="tj-cal-pnl tj-cal-pnl-be">$0</span>`;
            }
            clickAttr = ` onclick="openTjDay('${ds}')"`;
          }
          let bodyHtml = `<span class="tj-cal-day">${d}</span>${pnlHtml}`;
          if (isToday && dayPnl === undefined) {
            bodyHtml = `<span class="tj-cal-day">${d}</span><span class="tj-cal-today">⛧ HOY</span>`;
          }
          html += `<div class="${cls}"${clickAttr}>${bodyHtml}</div>`;
        }
        grid.innerHTML = html;
      }

      function openTjDay(dateStr) {
        _tjDayDate = dateStr;
        tjDayCancelForm();
        const isReadOnly = !!window._journalViewingCode;
        const modal = document.getElementById('tjDayModal');
        if (!modal) return;
        const dayTrades = tjTrades.filter(t => t.date.slice(0, 10) === dateStr);
        try {
        if (!dayTrades.length) {
          const [y, m, d] = dateStr.split('-');
          const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
          const titleEl = document.getElementById('tjDayTitle');
          if(titleEl) titleEl.textContent = parseInt(d)+' de '+months[parseInt(m)-1]+' '+y;
          const summaryEl = document.getElementById('tjDaySummary');
          if(summaryEl) summaryEl.innerHTML = 'Sin trades este día';
          const tradesEl = document.getElementById('tjDayTrades');
          if(tradesEl) tradesEl.innerHTML = '<div style="text-align:center;padding:20px;color:#645a78;font-size:0.85rem;">📭 No hay trades registrados para esta fecha.</div>';
          return;
        }
        const [y, m, d] = dateStr.split('-');
        const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        const titleEl = document.getElementById('tjDayTitle');
        if(titleEl) titleEl.textContent = parseInt(d)+' de '+months[parseInt(m)-1]+' '+y;
        const dayPnl = dayTrades.reduce((s,t)=>s+t.pnl,0);
        const dayWins = dayTrades.filter(t=>t.pnl>0).length;
        const dayLosses = dayTrades.filter(t=>t.pnl<0).length;
        const summaryEl = document.getElementById('tjDaySummary');
        if(summaryEl) summaryEl.innerHTML = dayTrades.length+' trade'+(dayTrades.length>1?'s':'')+' · '+dayWins+'W / '+dayLosses+'L · PNL: <strong style="color:'+(dayPnl>=0?'#34c759':'var(--red-impact)')+';">$'+(dayPnl>=0?'+':'')+dayPnl.toFixed(2)+'</strong>';
        const tradesEl = document.getElementById('tjDayTrades');
        if(tradesEl) tradesEl.innerHTML = dayTrades.map(t => {
          // Fix defensivo: si isReadOnly no estuviera definido por alguna razón, asumir false
          const _isRO = (typeof isReadOnly !== 'undefined') ? isReadOnly : false;
          const rColor=t.pnl>0?'#34c759':t.pnl<0?'var(--red-impact)':'';
          const rIcon=t.pnl>0?'✅':t.pnl<0?'❌':'↔️';
          const dirColor=t.dir==='BUY'?'#34c759':'var(--red-impact)';
          let photosHtml='';
          if(t.photos && t.photos.length){
            const labels=['📊 Análisis 1','📊 Análisis 2','⚡ Ejecución'];
            photosHtml='<div style="display:grid;grid-template-columns:repeat('+Math.min(t.photos.length,3)+',1fr);gap:6px;margin-top:10px;">'
              +t.photos.map((p,i)=>'<div style="text-align:center;"><img src="'+p+'" style="width:100%;border-radius:6px;border:1px solid rgba(212,175,55,0.15);cursor:pointer;" onclick="tjImgFull(&quot;PHOTO'+t.id+'_'+i+'&quot;)"><div style="font-size:0.45rem;color:#645a78;margin-top:3px;">'+(labels[i]||'Foto')+'</div></div>').join('')
            +'</div>';
          }
          return '<div class="tj-day-trade">'
            +'<div class="tj-day-trade-hdr"><span class="tj-day-pair"><span style="color:'+dirColor+';font-size:0.6rem;">'+t.dir+'</span> '+t.asset+'</span><span class="tj-day-result" style="color:'+rColor+';">'+rIcon+' '+(t.pnl>=0?'+':'')+'$'+t.pnl.toFixed(2)+'</span></div>'
            +'<div class="tj-day-levels">'
              +(t.entry?'<div class="tj-day-lvl"><div class="tj-day-lvl-label">Entry</div><div class="tj-day-lvl-val" style="color:#fff;">'+t.entry+'</div></div>':'')
              +(t.sl?'<div class="tj-day-lvl"><div class="tj-day-lvl-label">Stop</div><div class="tj-day-lvl-val" style="color:var(--red-impact);">'+t.sl+'</div></div>':'')
              +(t.tp?'<div class="tj-day-lvl"><div class="tj-day-lvl-label">TP</div><div class="tj-day-lvl-val" style="color:#34c759;">'+t.tp+'</div></div>':'')
              +(t.ratio?'<div class="tj-day-lvl"><div class="tj-day-lvl-label">R:B</div><div class="tj-day-lvl-val" style="color:var(--gold-bright);">'+t.ratio+'</div></div>':'')
            +'</div>'
            +(t.notes?'<div class="tj-day-notes">📝 '+t.notes.replace(/</g,'&lt;')+'</div>':'')
             +photosHtml
             +(_isRO ? '' : '<div style="display:flex;gap:6px;margin-top:8px;">'
               +'<button class="tj-del-btn" onclick="event.stopPropagation();tjEditTrade('+t.id+')" title="Editar">✏️ Editar</button>'
               +'<button class="tj-del-btn" onclick="event.stopPropagation();tjDeleteTrade('+t.id+')" title="Eliminar" style="font-size:1.2rem;color:#ff2d55;">🗑 Eliminar</button>'
             +'</div>')
           +'</div>';
        }).join('');
        } catch(e) { console.error('[openTjDay]', e); }
        modal.classList.add('vis');
      }

      function closeTjDay() { document.getElementById('tjDayModal')?.classList.remove('vis'); }

      let _tjDayDate = null;

      function tjDayToggleForm() {
        const form = document.getElementById('tjDayAddForm');
        const btn = document.getElementById('tjDayAddBtn');
        if (!form) return;
        const isVis = form.classList.toggle('visible');
        if (btn) btn.textContent = isVis ? '✕ Cancelar' : '+ Registrar Trade en este día';
        if (!isVis) tjDayCancelForm();
      }

      function tjDayCancelForm() {
        const form = document.getElementById('tjDayAddForm');
        if (form) form.classList.remove('visible');
        const btn = document.getElementById('tjDayAddBtn');
        if (btn) btn.textContent = '+ Registrar Trade en este día';
        ['tj-day-entry','tj-day-sl','tj-day-tp','tj-day-pnl','tj-day-ratio','tj-day-notes'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.value = '';
        });
        document.querySelectorAll('#tj-day-asset-chips .day-asset-chip').forEach(c => c.classList.remove('selected'));
        const first = document.querySelector('#tj-day-asset-chips .day-asset-chip');
        if (first) { first.classList.add('selected'); document.getElementById('tj-day-asset').value = first.getAttribute('data-asset'); }
        const dirBtn = document.querySelector('#tj-day-dir');
        document.querySelectorAll('#tjDayAddForm .day-dir-btn').forEach(c => c.classList.remove('selected'));
        const buyBtn = document.querySelector('#tjDayAddForm .day-dir-btn.buy');
        if (buyBtn) { buyBtn.classList.add('selected'); if (dirBtn) dirBtn.value = 'BUY'; }
        const resSel = document.getElementById('tj-day-result');
        if (resSel) resSel.value = 'WIN';
      }

      function tjDaySaveTrade() {
        const dateStr = _tjDayDate;
        if (!dateStr) return showToast('Error: no hay fecha seleccionada');
        const asset = document.getElementById('tj-day-asset')?.value?.trim().toUpperCase() || 'XAUUSD';
        const dir = document.getElementById('tj-day-dir')?.value || 'BUY';
        const entry = document.getElementById('tj-day-entry')?.value?.trim() || '';
        const sl = document.getElementById('tj-day-sl')?.value?.trim() || '';
        const tp = document.getElementById('tj-day-tp')?.value?.trim() || '';
        const pnl = parseFloat(document.getElementById('tj-day-pnl')?.value) || 0;
        const result = document.getElementById('tj-day-result')?.value || 'WIN';
        const ratio = document.getElementById('tj-day-ratio')?.value?.trim() || '';
        const notes = document.getElementById('tj-day-notes')?.value?.trim() || '';

        const trade = {
          id: Date.now(),
          date: new Date(dateStr + 'T12:00:00').toISOString(),
          asset, dir, entry, sl, tp, pnl, result, ratio, notes,
          photos: [],
          user_code: window.TNSVT_USER ? window.TNSVT_USER.code : null
        };

        sb.createTrade(trade).then(res => {
          trade.id = res.id;
          tjTrades.unshift(trade);
          localStorage.setItem('tj_trades', JSON.stringify(tjTrades));
          tjDayCancelForm();
          openTjDay(dateStr);
          showToast('Trade registrado ✅');
        }).catch(e => {
          showToast('Error al guardar: ' + (e.message || 'desconocido'));
        });
      }

      // Wire up save button
      document.addEventListener('DOMContentLoaded', () => {
        const saveBtn = document.getElementById('tj-day-save-btn');
        if (saveBtn) saveBtn.addEventListener('click', tjDaySaveTrade);
      });

      // Wire up day asset chips and dir buttons (delegated)
      document.addEventListener('click', function(e) {
        const chip = e.target.closest('#tjDayAddForm .day-asset-chip');
        if (chip) {
          document.querySelectorAll('#tjDayAddForm .day-asset-chip').forEach(c => c.classList.remove('selected'));
          chip.classList.add('selected');
          document.getElementById('tj-day-asset').value = chip.getAttribute('data-asset');
        }
        const dirBtn = e.target.closest('#tjDayAddForm .day-dir-btn');
        if (dirBtn) {
          document.querySelectorAll('#tjDayAddForm .day-dir-btn').forEach(c => c.classList.remove('selected'));
          dirBtn.classList.add('selected');
          document.getElementById('tj-day-dir').value = dirBtn.getAttribute('data-dir');
        }
      });

      function tjImgFull(ref) {
        const m = ref.match(/PHOTO(\d+)_(\d+)/);
        if(!m) return;
        const trade = tjTrades.find(t=>t.id===parseInt(m[1]));
        if(!trade || !trade.photos) return;
        const src = trade.photos[parseInt(m[2])];
        if(!src) return;
        document.getElementById('tjImgFullSrc').src = src;
        document.getElementById('tjImgFull').classList.add('vis');
      }

      // ==================== FUNCIONES DE FEED (SUPABASE REAL) ====================
      let feedCatFilter = 'all';
      let postCatSelected = 'general';
      let feedRealtimeChannel = null;
      let myLikedPosts = new Set(JSON.parse(localStorage.getItem('tnsvt_liked_posts') || '[]'));

      function filterFeed(cat, btn) {
        feedCatFilter = cat;
        document.querySelectorAll('.feed-cat').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderFeed();
      }

      function selPostCat(cat, btn) {
        postCatSelected = cat;
        document.querySelectorAll('.create-cat-opt').forEach(b => b.classList.remove('sel'));
        btn.classList.add('sel');
        // Auto-mostrar el form de señal cuando se selecciona la categoria SEÑAL.
        const sf = document.getElementById('signalForm');
        if (sf) {
          if (cat === 'señales') {
            sf.classList.add('vis');
            // requestAnimationFrame para que el browser aplique display:block
            // antes de medir getBoundingClientRect.
            requestAnimationFrame(() => {
              const rect = sf.getBoundingClientRect();
              const fullyVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
              if (!fullyVisible) {
                sf.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }
            });
          } else {
            sf.classList.remove('vis');
          }
        }
      }

      // ============================================================
      // ⛧ GLOW-UP v3.6 — Signal form helpers (asset/dir/RR)
      // ============================================================
      function selectSigAsset(btn) {
        document.querySelectorAll('.asset-chip-v36').forEach(c => c.classList.remove('selected'));
        btn.classList.add('selected');
        const hidden = document.getElementById('sig-asset');
        if (hidden) hidden.value = btn.getAttribute('data-asset');
        const custom = document.querySelector('.asset-input-v36');
        if (custom) custom.value = '';
      }
      window.selectSigAsset = selectSigAsset;

      function onSigAssetCustom(input) {
        const val = (input.value || '').trim().toUpperCase();
        if (val) {
          document.querySelectorAll('.asset-chip-v36').forEach(c => c.classList.remove('selected'));
          const hidden = document.getElementById('sig-asset');
          if (hidden) hidden.value = val;
        }
      }
      window.onSigAssetCustom = onSigAssetCustom;

      function selectSigDir(btn) {
        document.querySelectorAll('.dir-btn-v36').forEach(c => c.classList.remove('selected'));
        btn.classList.add('selected');
        const sel = document.getElementById('sig-dir');
        if (sel) sel.value = btn.getAttribute('data-dir');
        calcSigRR();
      }
      window.selectSigDir = selectSigDir;

      function calcSigRR() {
        const dir = document.getElementById('sig-dir')?.value || 'BUY';
        const entry = parseFloat(document.getElementById('sig-entry')?.value);
        const sl = parseFloat(document.getElementById('sig-sl')?.value);
        const tp1 = parseFloat(document.getElementById('sig-tp1')?.value);
        const tp2 = parseFloat(document.getElementById('sig-tp2')?.value);
        const risk = isFinite(entry) && isFinite(sl) ? Math.abs(entry - sl) : null;
        const reward1 = isFinite(entry) && isFinite(tp1) ? Math.abs(tp1 - entry) : null;
        const reward2 = isFinite(entry) && isFinite(tp2) ? Math.abs(tp2 - entry) : null;
        const fmtPts = v => v == null ? '\u2014' : (v < 10 ? v.toFixed(4) : v.toFixed(2)) + ' pts';
        const fmtRR  = (rew) => (risk && rew && risk > 0) ? ('1 : ' + (rew/risk).toFixed(2)) : '\u2014';
        const setEl = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
        setEl('sig-rr-risk', risk == null ? '\u2014' : fmtPts(risk));
        setEl('sig-rr-tp1', fmtRR(reward1));
        setEl('sig-rr-tp2', fmtRR(reward2));
      }
      window.calcSigRR = calcSigRR;

      function toggleSignalForm() {
        const sf = document.getElementById('signalForm');
        if (!sf) return;
        sf.classList.toggle('vis');
        if (sf.classList.contains('vis')) {
          // Usar rAF para que el browser aplique display:block ANTES de medir.
          // Asi getBoundingClientRect da las coordenadas correctas del form visible.
          requestAnimationFrame(() => {
            const rect = sf.getBoundingClientRect();
            const fullyVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
            if (!fullyVisible) {
              sf.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          });
        }
      }
      window.toggleSignalForm = toggleSignalForm;

      function closeSignalForm() {
        const sf = document.getElementById('signalForm');
        if (!sf) return;
        sf.classList.remove('vis');
        // Resetear hidden sig-asset a XAUUSD y chips
        const ha = document.getElementById('sig-asset');
        if (ha) ha.value = 'XAUUSD';
        document.querySelectorAll('.asset-chip-v36').forEach(c => c.classList.remove('selected'));
        document.querySelectorAll('.asset-chip-v36[data-asset="XAUUSD"]').forEach(c => c.classList.add('selected'));
        const cust = document.querySelector('.asset-input-v36');
        if (cust) cust.value = '';
        // Resetear inputs de precios
        ['sig-entry','sig-sl','sig-tp1','sig-tp2'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.value = '';
        });
        // Resetear direccion a BUY
        const dir = document.getElementById('sig-dir');
        if (dir) dir.value = 'BUY';
        document.querySelectorAll('.dir-btn-v36').forEach(c => c.classList.remove('selected'));
        document.querySelectorAll('.dir-btn-v36.buy').forEach(c => c.classList.add('selected'));
        // Resetear RR display
        ['sig-rr-risk','sig-rr-tp1','sig-rr-tp2'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.textContent = '\u2014';
        });
        // Quitar foto adjunta
        if (typeof removeSignalPhoto === 'function') removeSignalPhoto();
      }
      window.closeSignalForm = closeSignalForm;

      // ── Foto adjunta al post ──
      let postPhotoData = null;
      let signalPhotoData = null;
      let commentPhotoData = {};

      function attachPostPhoto(input) {
        if (!input.files[0]) return;
        const reader = new FileReader();
        reader.onload = e => {
          postPhotoData = e.target.result;
          const prev = document.getElementById('postPhotoPreview');
          const img = document.getElementById('postPhotoImg');
          const badge = document.getElementById('postPhotoBadge');
          if (prev && img) { img.src = postPhotoData; prev.style.display = 'block'; }
          if (badge) badge.style.display = 'inline-block';
        };
        reader.readAsDataURL(input.files[0]);
      }

      function removePostPhoto() {
        postPhotoData = null;
        const prev = document.getElementById('postPhotoPreview');
        const badge = document.getElementById('postPhotoBadge');
        if (prev) prev.style.display = 'none';
        if (badge) badge.style.display = 'none';
      }

      function attachSignalPhoto(input) {
        if (!input.files[0]) return;
        const reader = new FileReader();
        reader.onload = e => {
          signalPhotoData = e.target.result;
          const prev = document.getElementById('sigPhotoPreview');
          const img = document.getElementById('sigPhotoImg');
          const badge = document.getElementById('sigPhotoBadge');
          if (prev && img) { img.src = signalPhotoData; prev.style.display = 'block'; }
          if (badge) badge.style.display = 'inline-block';
        };
        reader.readAsDataURL(input.files[0]);
      }

      function removeSignalPhoto() {
        signalPhotoData = null;
        const prev = document.getElementById('sigPhotoPreview');
        const badge = document.getElementById('sigPhotoBadge');
        if (prev) prev.style.display = 'none';
        if (badge) badge.style.display = 'none';
      }

      function attachCommentPhoto(input, postId) {
        if (!input.files[0]) return;
        const reader = new FileReader();
        reader.onload = e => {
          commentPhotoData[postId] = e.target.result;
          const prev = document.getElementById('comment-photo-preview-' + postId);
          if (prev) { prev.src = commentPhotoData[postId]; prev.style.display = 'block'; }
          input.value = '';
        };
        reader.readAsDataURL(input.files[0]);
      }

      function removeCommentPhoto(postId) {
        commentPhotoData[postId] = null;
        const prev = document.getElementById('comment-photo-preview-' + postId);
        if (prev) { prev.src = ''; prev.style.display = 'none'; }
      }

      async function createNewPost() {
        const text = document.getElementById('newPostText')?.value.trim();
        if (!text) return;
        if (!sb) { showToast('❌ Sin conexión'); return; }
        if (!window.TNSVT_USER) { showToast('⚠️ Iniciá sesión primero'); return; }

        const btn = document.querySelector('.post-creator .post-btn') || document.querySelector('.post-btn');
        if (btn) { btn.disabled = true; btn.textContent = 'Publicando...'; }

        const post = {
          author_code: window.TNSVT_USER.code,
          author_name: window.TNSVT_USER.name,
          cat: postCatSelected,
          text: text,
          signal: null,
          photo: postPhotoData || signalPhotoData || null
        };

        const sf = document.getElementById('signalForm');
        if (sf && sf.classList.contains('vis')) {
          const asset = document.getElementById('sig-asset')?.value.trim();
          if (asset) {
            post.signal = JSON.stringify({
              asset: asset.toUpperCase(),
              dir: document.getElementById('sig-dir')?.value,
              entry: document.getElementById('sig-entry')?.value,
              sl: document.getElementById('sig-sl')?.value,
              tp1: document.getElementById('sig-tp1')?.value,
              tp2: document.getElementById('sig-tp2')?.value,
              status: 'Abierta'
            });
            post.cat = 'señales';
            if (signalPhotoData) post.photo = signalPhotoData;
          }
          sf.classList.remove('vis');
          ['sig-asset','sig-entry','sig-sl','sig-tp1','sig-tp2'].forEach(id => {
            const el = document.getElementById(id); if (el) el.value = '';
          });
          removeSignalPhoto();
        }

        try {
          await sb.createPost(post);
          document.getElementById('newPostText').value = '';
          removePostPhoto();
          showToast('✅ Post publicado');
          await renderFeed();
        } catch(e) {
          console.error('Error publicando post:', e);
          showToast('❌ Error publicando: ' + (e.message || 'Sin conexión'));
        } finally {
          if (btn) { btn.disabled = false; btn.textContent = 'Publicar'; }
        }
      }

      async function likeFeedPost(postId) {
        if (!sb) return;
        if (!window.TNSVT_USER) { showToast('⚠️ Iniciá sesión para dar like'); return; }

        const btn = document.querySelector(`[data-like-id="${postId}"]`);
        if (!btn) return;

        const action = myLikedPosts.has(postId) ? 'unlike' : 'like';

        try {
          const result = await sb.likePost(postId, window.TNSVT_USER.code, action);
          const countEl = btn.querySelector('.act-count');
          if (countEl) countEl.textContent = result.likes;

          if (action === 'like') {
            myLikedPosts.add(postId);
            btn.classList.add('liked');
          } else {
            myLikedPosts.delete(postId);
            btn.classList.remove('liked');
          }
          localStorage.setItem('tnsvt_liked_posts', JSON.stringify([...myLikedPosts]));
        } catch(e) {
          console.error('Error:', e);
          showToast('❌ Error al actualizar like');
        }
      }

      async function toggleComments(postId) {
        const box = document.getElementById('comments-'+postId);
        if(box) box.classList.toggle('vis');
      }

      async function submitComment(postId) {
        const input = document.getElementById('comment-input-'+postId);
        const photoPreview = document.getElementById('comment-photo-preview-'+postId);
        if(!input) return;
        const text = input.value.trim();
        const photo = commentPhotoData[postId] || null;
        if(!text && !photo) { showToast('⚠️ Escribí un comentario o adjuntá una foto.'); return; }
        if(!window.TNSVT_USER){ showToast('⚠️ Iniciá sesión primero'); return; }
        try {
          await sb.commentPost(postId, window.TNSVT_USER.name || 'Trader', text, photo);
          input.value = '';
          commentPhotoData[postId] = null;
          if (photoPreview) { photoPreview.src = ''; photoPreview.style.display = 'none'; }
          const listEl = document.getElementById('comment-list-'+postId);
          if(listEl){
            const div = document.createElement('div');
            div.className = 'comment-item';
            const safeText = sanitizePostText(text);
            const photoHtml = photo ? '<div class="comment-photo-wrap"><img class="comment-photo" src="'+photo+'" onclick="window.open(this.src)"></div>' : '';
            div.innerHTML = '<div class="comment-avatar">'+window.TNSVT_USER.name.charAt(0)+'</div><div class="comment-body"><div class="comment-text"><span class="comment-author">'+window.TNSVT_USER.name+': </span>'+safeText+'</div>'+photoHtml+'</div>';
            listEl.appendChild(div);
          }
          const box = document.getElementById('comments-'+postId);
          if(box){
            const btn = box.previousElementSibling?.querySelector?.('.signal-action:last-child .act-count');
            if(btn) btn.textContent = parseInt(btn.textContent||0)+1;
          }
          showToast('💬 Comentario enviado');
        } catch(e) {
          showToast('❌ Error al comentar: ' + (e.message||''));
        }
      }


      function renderCommentsList(comments) {
        if(!comments || !comments.length) return '';
        return comments.map(function(c) {
          var author = (c.author || 'Trader');
          var initial = author.charAt(0).toUpperCase();
          var text = c.text || '';
          var photo = c.photo || '';
          var safeText = sanitizePostText(text);
          var photoHtml = photo ? '<div class="comment-photo-wrap"><img class="comment-photo" src="'+photo+'" onclick="window.open(this.src)"></div>' : '';
          return '<div class="comment-item">'
            + '<div class="comment-avatar">' + initial + '</div>'
            + '<div class="comment-body"><div class="comment-text"><span class="comment-author">' + author + ': </span>' + safeText + '</div>' + photoHtml + '</div>'
            + '</div>';
        }).join('');
      }

      function sanitizePostText(text) {
        if(!text) return '';
        return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
      }

      async function renderFeed() {
        const container = document.getElementById('postsFeed');
        if (!container) return;
        if (!sb) {
          container.innerHTML = '<div style="text-align:center;color:#645a78;padding:40px;">⚠️ Sin conexión</div>';
          return;
        }
        const scrollY = window.scrollY;
        const feedTop = container.offsetTop;
        const isFirstLoad = !container.dataset.loaded;
        if (isFirstLoad) {
          container.innerHTML = '<div style="text-align:center;color:#645a78;padding:30px;font-size:0.8rem;">⏳ Cargando feed...</div>';
        } else {
          container.style.opacity = '0.55';
          container.style.transition = 'opacity 0.2s';
        }
        try {
          const posts = await sb.getFeed(feedCatFilter);
          if (!posts || !posts.length) {
            container.innerHTML = '<div style="text-align:center;color:#645a78;padding:40px;">No hay posts aún. ¡Sé el primero!</div>';
            return;
          }
          container.style.opacity = '';
          container.dataset.loaded = '1';
          container.innerHTML = posts.map(p => {
            const d = new Date(p.created_at);
            const timeAgo = Math.floor((Date.now() - d.getTime()) / 3600000);
            const timeStr = timeAgo < 1 ? 'hace momentos' : (timeAgo < 24 ? 'hace ' + timeAgo + 'h' : 'hace ' + Math.floor(timeAgo / 24) + 'd');
            const catCls = 'signal-cat-' + (p.cat || 'general');
            const catLabel = (p.cat || 'general').charAt(0).toUpperCase() + (p.cat || 'general').slice(1);
            const authorName = p.author_name || p.author || 'Trader';
            const initial = authorName.charAt(0).toUpperCase();
            const isMyPost = window.TNSVT_USER && p.author_code === window.TNSVT_USER.code;
            const iLiked = myLikedPosts.has(p.id);

            let photoHtml = '';
            if (p.photo) {
              photoHtml = `<div style="margin:10px 0;border-radius:8px;overflow:hidden;cursor:pointer;" onclick="this.querySelector('img').requestFullscreen?.()">
                <img src="${p.photo}" style="width:100%;max-height:280px;object-fit:cover;border-radius:8px;border:1px solid rgba(212,175,55,0.15);">
              </div>`;
            }
            let signalHtml = '';
            if (p.signal) {
              const s = typeof p.signal === 'string' ? JSON.parse(p.signal) : p.signal;
              const dirCls = s.dir === 'BUY' ? 'signal-buy' : 'signal-sell';
              const tp2Row = s.tp2 ? `<div class="signal-lvl"><div class="signal-lvl-label">TP2</div><div class="signal-lvl-val lvl-tp">${s.tp2}</div></div>` : '';
              signalHtml = `
                <div class="signal-trade">
                  <div class="signal-trade-hdr">
                    <span class="signal-dir ${dirCls}">${s.dir}</span>
                    <span class="signal-asset">${s.asset}</span>
                    <span class="signal-status">• ${s.status || 'Abierta'}</span>
                    ${isMyPost ? `<button onclick="deletePost('${p.id}')" style="margin-left:auto;background:rgba(255,59,48,0.1);border:1px solid rgba(255,59,48,0.3);border-radius:4px;color:#ff3b30;font-size:0.6rem;padding:2px 7px;cursor:pointer;">Eliminar</button>` : ''}
                  </div>
                  <div class="signal-levels">
                    <div class="signal-lvl"><div class="signal-lvl-label">Entry</div><div class="signal-lvl-val lvl-entry">${s.entry || '—'}</div></div>
                    <div class="signal-lvl"><div class="signal-lvl-label">Stop</div><div class="signal-lvl-val lvl-sl">${s.sl || '—'}</div></div>
                    <div class="signal-lvl"><div class="signal-lvl-label">TP1</div><div class="signal-lvl-val lvl-tp">${s.tp1 || '—'}</div></div>
                    ${tp2Row}
                  </div>
                </div>`;
            }

            const deleteBtn = (!p.signal && isMyPost) ? `<button onclick="deletePost('${p.id}')" style="margin-left:auto;background:rgba(255,59,48,0.1);border:1px solid rgba(255,59,48,0.3);border-radius:4px;color:#ff3b30;font-size:0.6rem;padding:2px 7px;cursor:pointer;">✕</button>` : '';

            return `
              <div class="signal-card-wrap" id="post-${p.id}">
                <div class="signal-hdr">
                  <div class="signal-user">
                    <div class="signal-avatar" style="background:${isMyPost ? 'var(--gold)' : 'var(--violet)'};color:${isMyPost ? '#000' : '#fff'}">${initial}</div>
                    <div>
                      <div class="signal-name">${authorName}${isMyPost ? ' <span style="font-size:0.55rem;color:var(--gold);opacity:0.8;">TÚ</span>' : ''}</div>
                      <div class="signal-time">${timeStr}</div>
                    </div>
                  </div>
                  <span class="signal-cat-badge ${catCls}">${catLabel}</span>
                  ${deleteBtn}
                </div>
                <div class="signal-body">${sanitizePostText(p.text)}</div>
                ${photoHtml}${signalHtml}
                <div class="signal-actions">
                  <div class="signal-action ${iLiked ? 'liked' : ''}" data-like-id="${p.id}" onclick="likeFeedPost('${p.id}')" style="${iLiked ? 'color:var(--gold-bright);' : ''}">
                    ${iLiked ? '♥' : '♡'} <span class="act-count">${p.likes || 0}</span>
                  </div>
                  <div class="signal-action" onclick="toggleComments('${p.id}')" style="cursor:pointer;">💬 <span class="act-count">${(p.comments||[]).length||0}</span></div>
                </div>
                <div class="comment-box" id="comments-${p.id}">
                  <div class="comment-list" id="comment-list-${p.id}">${renderCommentsList(p.comments)}</div>
                  <div class="comment-photo-preview-row">
                    <img id="comment-photo-preview-${p.id}" style="display:none;max-height:80px;border-radius:6px;margin-bottom:4px;cursor:pointer;" onclick="removeCommentPhoto('${p.id}')" title="Click para quitar">
                  </div>
                  <div class="comment-input-row">
                    <button class="comment-photo-btn" onclick="document.getElementById('comment-photo-input-${p.id}').click()" title="Adjuntar foto">📷</button>
                    <input type="file" id="comment-photo-input-${p.id}" accept="image/*" style="display:none" onchange="attachCommentPhoto(this, '${p.id}')">
                    <input type="text" id="comment-input-${p.id}" placeholder="Escribí un comentario..." onkeydown="if(event.key==='Enter')submitComment('${p.id}')">
                    <button class="comment-submit" onclick="submitComment('${p.id}')">Enviar</button>
                  </div>
                </div>
              </div>`;
          }).join('');
        } catch(e) {
          console.error('Error cargando feed:', e);
          container.innerHTML = `<div style="text-align:center;color:#ff3b30;padding:30px;font-size:0.82rem;">❌ Error cargando el feed.<br><button onclick="renderFeed()" style="margin-top:10px;padding:6px 16px;background:rgba(138,60,255,0.2);border:1px solid var(--violet);border-radius:6px;color:#fff;cursor:pointer;">Reintentar</button></div>`;
        } finally {
          if (!isFirstLoad && scrollY > feedTop) {
            requestAnimationFrame(() => window.scrollTo({ top: scrollY, behavior: 'instant' }));
          }
        }
      }

      async function deletePost(postId) {
        if (!sb || !window.TNSVT_USER) return;
        if (!confirm('¿Eliminar este post?')) return;
        try {
          await sb.deletePost(postId, window.TNSVT_USER.code);
          document.getElementById('post-' + postId)?.remove();
          showToast('🗑️ Post eliminado');
        } catch(e) { showToast('❌ Error eliminando'); }
      }

      function initFeedRealtime() {
        // Realtime eliminado — usar refresh manual
      }

      // ==================== ACADEMIA ====================
      // ==================== ACADEMIA (SUPABASE) ====================

      // 🔐 SISTEMA DE AUTENTICACIÓN ADMIN — validado en backend
      // La contraseña del panel Academia se valida en POST /api/admin/verify-academia-pass
      // y está configurada en la variable de entorno ACADEMIA_ADMIN_PASS

      let adminAuthenticated = false;
      let acadCoursesCache = [];

      // ==================== LIVE CHART (Academia) ====================
      // Chart en vivo propio (sin TradingView widget) que se actualiza cada
      // 10 segundos con datos reales de Binance public API. Si Binance
      // no responde, usa el endpoint /api/market/candles que tiene fallback
      // a velas simuladas.
      async function renderAcademia() {
        const grid = document.getElementById('acad-grid');
        if (!grid) return;
        grid.innerHTML = '<div class="acad-loading">Cargando cursos...</div>';
        try {
          const data = await sb.getAcademia();
          acadCoursesCache = data || [];
          if (!acadCoursesCache.length) {
            grid.innerHTML = '<div class="acad-loading">No hay cursos aún. El admin puede agregar desde ⚙️ Admin.</div>';
            return;
          }
          grid.innerHTML = acadCoursesCache.map(c => {
            const isLocked = c.locked === true || c.locked === 'true';
            const lockCls = isLocked ? '' : 'acad-unlocked';
            return `<div class="acad-card ${lockCls}" onclick="handleAcadCard(${c.id}, ${isLocked})">
              <div class="acad-thumb" style="font-size:3rem;display:flex;align-items:center;justify-content:center;position:relative;">
                ${c.emoji || '📚'}
                ${isLocked ? '<div class="acad-lock"><div class="acad-lock-icon">🔒</div></div>' : ''}
              </div>
              <div class="acad-info">
                <div class="acad-title">${c.title}</div>
                <div class="acad-sub">${isLocked ? '<span class="acad-badge">🔒 Solo para miembros</span>' : '<span style="color:#34c759;">✅ Desbloqueado</span>'}</div>
              </div>
            </div>`;
          }).join('');
        } catch(e) {
          grid.innerHTML = '<div class="acad-loading">Error cargando cursos. Verificá conexión.</div>';
          console.error('Academia error:', e);
        }
      }

      // Wrapper functions to avoid quote-escaping issues in onclick attributes
      async function handleAcadCard(id, isLocked) {
        if (isLocked === true || isLocked === 'true') {
          showToast('🔒 Activá tu membresía para acceder');
        } else {
          openAcadCourse(id);
        }
      }

      function playLessonSafe(el) {
        const url = el.getAttribute('data-url') || '';
        const title = el.getAttribute('data-title') || '';
        playLesson(url, title);
      }

      function openAcadCourse(id) {
        const c = acadCoursesCache.find(x => x.id === id);
        if (!c) return;
        const modal = document.getElementById('acad-modal');
        if (!modal) return;
        document.getElementById('acad-modal-title').textContent = c.title;
        document.getElementById('acad-modal-desc').textContent = c.descripcion || '';
        const container = document.getElementById('acad-video-container');
        // Embed YouTube si hay URL
        if (c.video_url) {
          const ytId = extractYouTubeId(c.video_url);
          if (ytId) {
            container.innerHTML = `<iframe src="https://www.youtube.com/embed/${ytId}?rel=0" allowfullscreen></iframe>`;
          } else {
            container.innerHTML = `<div style="padding:20px;text-align:center;color:#645a78;">Video no disponible</div>`;
          }
        } else {
          container.innerHTML = `<div style="padding:30px;text-align:center;color:#645a78;font-size:0.85rem;">📹 Video próximamente</div>`;
        }
        // Lecciones adicionales si existen
        const lessonsList = document.getElementById('acad-lessons-list');
        if (c.lecciones && Array.isArray(c.lecciones) && c.lecciones.length) {
          lessonsList.innerHTML = '<div style="font-family:\'Orbitron\',sans-serif;font-size:0.6rem;color:var(--gold);letter-spacing:2px;margin-bottom:10px;">LECCIONES</div>' +
            c.lecciones.map((l, i) => `
              <div class="acad-lesson-item" onclick="playLessonSafe(this)" data-url="${l.url||''}" data-title="${l.title||''}">
                <span class="acad-lesson-num">${String(i+1).padStart(2,'0')}</span>
                <span class="acad-lesson-title">${l.title || 'Lección ' + (i+1)}</span>
                <span class="acad-lesson-dur">${l.duration || ''}</span>
                <span style="color:var(--gold);">▶</span>
              </div>`).join('');
        } else {
          lessonsList.innerHTML = '';
        }
        modal.classList.add('vis');
      }

      function playLesson(url, title) {
        if (!url) return;
        const ytId = extractYouTubeId(url);
        const container = document.getElementById('acad-video-container');
        if (ytId && container) {
          container.innerHTML = `<iframe src="https://www.youtube.com/embed/${ytId}?rel=0&autoplay=1" allowfullscreen allow="autoplay"></iframe>`;
          document.getElementById('acad-modal-title').textContent = title;
        }
      }

      function extractYouTubeId(url) {
        if (!url) return null;
        const patterns = [
          /youtu\.be\/([^?&]+)/,
          /youtube\.com\/watch\?v=([^&]+)/,
          /youtube\.com\/embed\/([^?&]+)/
        ];
        for (const p of patterns) {
          const m = url.match(p);
          if (m) return m[1];
        }
        return null;
      }

      function closeAcadVideo() {
        document.getElementById('acad-modal')?.classList.remove('vis');
        const container = document.getElementById('acad-video-container');
        if (container) container.innerHTML = '';
      }

      // ==================== ADMIN PANEL ====================
      function openAdminPanel() {
        document.getElementById('adminOverlay').classList.add('vis');
        if (adminAuthenticated) {
          document.getElementById('admin-login-view').style.display = 'none';
          document.getElementById('admin-main-view').style.display = 'block';
          loadAdminCourseList();
          if (typeof adminMusicRefresh === 'function') adminMusicRefresh();
        }
      }

      function closeAdminPanel() {
        document.getElementById('adminOverlay').classList.remove('vis');
      }

      async function checkAdminPass() {
        const pass = document.getElementById('adminPassInput')?.value.trim();
        if (!pass) { showToast('⚠️ Ingresá la contraseña'); return; }
        try {
          await sb.post('/api/admin/verify-academia-pass', { password: pass });
          adminAuthenticated = true;
          document.getElementById('admin-login-view').style.display = 'none';
          document.getElementById('admin-main-view').style.display = 'block';
          document.getElementById('adminPassInput').value = '';
          loadAdminCourseList();
          showToast('✅ Acceso admin concedido');
        } catch (e) {
          document.getElementById('adminPassInput').value = '';
          showToast('❌ ' + (e.message || 'Contraseña incorrecta'));
        }
      }

      async function loadAdminCourseList() {
        const list = document.getElementById('admin-course-list');
        if (!list) return;
        list.innerHTML = '<div style="color:#645a78;font-size:0.82rem;text-align:center;padding:10px;">Cargando...</div>';
        try {
          const data = await sb.getAcademia();
          if (!data || !data.length) {
            list.innerHTML = '<div style="color:#645a78;font-size:0.82rem;text-align:center;padding:20px;">No hay cursos aún. Creá el primero arriba ↑</div>';
            return;
          }
          list.innerHTML = data.map(c => `
            <div class="admin-course-item">
              <span style="font-size:1.4rem;">${c.emoji || '📚'}</span>
              <span class="admin-course-item-title">${c.title}</span>
              <span class="admin-course-item-lock ${c.locked ? 'admin-lock-yes' : 'admin-lock-no'}">${c.locked ? '🔒' : '✅'}</span>
              <button class="admin-btn-edit" onclick="adminEditCourse(${c.id})">Editar</button>
              <button class="admin-btn-danger" onclick="adminDeleteCourse(${c.id})">Eliminar</button>
            </div>`).join('');
        } catch(e) { list.innerHTML = '<div style="color:#ff3b30;font-size:0.82rem;padding:10px;">Error cargando lista</div>'; }
      }

      async function adminSaveCourse() {
        const title = document.getElementById('admin-f-title')?.value.trim();
        if (!title) { showToast('⚠️ El título es obligatorio'); return; }
        const id = document.getElementById('admin-f-id')?.value;
        const payload = {
          id: id || null,
          emoji: document.getElementById('admin-f-emoji')?.value.trim() || '📚',
          title: title,
          descripcion: document.getElementById('admin-f-desc')?.value.trim() || '',
          video_url: document.getElementById('admin-f-video')?.value.trim() || null,
          locked: document.getElementById('admin-f-locked')?.value === 'true',
          orden: parseInt(document.getElementById('admin-f-order')?.value) || 99
        };
        const statusEl = document.getElementById('admin-save-status');
        if (statusEl) statusEl.textContent = 'Guardando...';
        try {
          await sb.saveAcademia(payload);
          if (statusEl) statusEl.textContent = '✅ Guardado';
          setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 3000);
          adminClearForm();
          loadAdminCourseList();
          renderAcademia();
          showToast('✅ Guardado');
        } catch(e) {
          showToast('❌ Error guardando: ' + e.message);
          if (statusEl) statusEl.textContent = '❌ Error';
        }
      }

      async function adminEditCourse(id) {
        const data = acadCoursesCache.find(c => c.id === id);
        if (!data) return;
        document.getElementById('admin-f-id').value = data.id;
        document.getElementById('admin-f-emoji').value = data.emoji || '';
        document.getElementById('admin-f-title').value = data.title || '';
        document.getElementById('admin-f-desc').value = data.descripcion || '';
        document.getElementById('admin-f-video').value = data.video_url || '';
        document.getElementById('admin-f-locked').value = data.locked ? 'true' : 'false';
        document.getElementById('admin-f-order').value = data.orden || '';
        document.getElementById('admin-form-mode-title').textContent = '✏️ Editando: ' + data.title;
        document.getElementById('admin-panel')?.scrollIntoView({ behavior: 'smooth' });
      }

      async function adminDeleteCourse(id) {
        const course = acadCoursesCache.find(c => c.id === id);
        const title = course ? course.title : 'este curso';
        if (!confirm('¿Eliminar "' + title + '"? No se puede deshacer.')) return;
        try {
          await sb.deleteAcademia(id);
          loadAdminCourseList();
          renderAcademia();
          showToast('🗑️ Curso eliminado');
        } catch(e) { showToast('❌ Error eliminando'); }
      }

      function adminClearForm() {
        ['admin-f-id','admin-f-emoji','admin-f-title','admin-f-desc','admin-f-video','admin-f-order'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.value = '';
        });
        const sel = document.getElementById('admin-f-locked');
        if (sel) sel.value = 'true';
        const modeTitle = document.getElementById('admin-form-mode-title');
        if (modeTitle) modeTitle.textContent = '➕ Nuevo Curso';
      }

      // ==================== ADMIN USER MANAGEMENT ====================
      async function adminRefreshList() {
        const tbody = document.getElementById('adminUsersTableBody');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="5" style="padding:20px; text-align:center; color:#645a78;">Cargando...</td></tr>';
        // Los endpoints /api/admin/users y /api/admin/dashboard se implementan en el backend.
        // Si devuelven 401 (endpoint todavia no conectado), mostramos UI placeholder.
        let users = null;
        let stats = null;
        try {
          users = await sb.get('/api/admin/users');
          stats = await sb.get('/api/admin/dashboard');
        } catch (e) {
          // 401/404 = endpoint no disponible todavia. Mostrar mensaje amigable.
          tbody.innerHTML = '<tr><td colspan="5" style="padding:30px; text-align:center; color:#a499b8;">⚠️ Panel admin: los endpoints del backend (/api/admin/users, /api/admin/dashboard) aún no están conectados. Próximamente.</td></tr>';
          const dashboardEl = document.getElementById('adminDashboard');
          if (dashboardEl) {
            dashboardEl.innerHTML = '<div class="mf-info-card" style="grid-column:1/-1;"><div style="font-size:0.78rem; color:#a499b8;">⚠️ Backend admin endpoints pendientes</div></div>';
          }
          return;
        }
        const dashboardEl = document.getElementById('adminDashboard');
        if (dashboardEl && stats) {
            dashboardEl.innerHTML = `
              <div class="mf-info-card"><div style="font-size:1.3rem; margin-bottom:4px; color:var(--gold-bright);">${stats.totalUsers}</div><div style="font-size:0.7rem; color:#645a78; font-family:'Orbitron',sans-serif;">TOTAL</div></div>
              <div class="mf-info-card"><div style="font-size:1.3rem; margin-bottom:4px; color:#34c759;">${stats.activeUsers}</div><div style="font-size:0.7rem; color:#645a78; font-family:'Orbitron',sans-serif;">ACTIVOS</div></div>
              <div class="mf-info-card"><div style="font-size:1.3rem; margin-bottom:4px; color:#ff3b30;">${stats.inactiveUsers}</div><div style="font-size:0.7rem; color:#645a78; font-family:'Orbitron',sans-serif;">INACTIVOS</div></div>
              <div class="mf-info-card"><div style="font-size:1.3rem; margin-bottom:4px; color:var(--violet);">${stats.students}</div><div style="font-size:0.7rem; color:#645a78; font-family:'Orbitron',sans-serif;">ALUMNOS</div></div>
            `;
          }
          tbody.innerHTML = '';
          if (!users || users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="padding:30px; text-align:center; color:#645a78;">No hay usuarios</td></tr>';
            return;
          }
          users.forEach(u => {
            const isAdmin = u.isAdmin ? '<span style="color:var(--gold);">👑 Admin</span>' : '<span style="color:#645a78;">Alumno</span>';
            const activeBadge = u.active
              ? '<span style="color:#34c759;">🟢 Activo</span>'
              : '<span style="color:#ff3b30;">🔴 Inactivo</span>';
            const safeName = (u.name || '').replace(/'/g, "\\'");
            const actions = u.isAdmin
              ? '<span style="color:#645a78; font-size:0.75rem;">—</span>'
              : `<button class="admin-btn-edit" onclick="adminShowEditForm(${u.id},'${u.code}','${safeName}')">✏️</button>
                 <button class="admin-btn-danger" onclick="adminToggleActive(${u.id})" title="${u.active ? 'Bloquear' : 'Activar'}">${u.active ? '🔒' : '🔓'}</button>
                 <button class="admin-btn-danger" onclick="adminDeleteUser(${u.id},'${u.code}','${safeName}')" title="Eliminar usuario">🗑️</button>`;
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid rgba(255,255,255,0.04)';
             tr.innerHTML = `
              <td style="padding:10px 8px; font-family:'Orbitron',sans-serif; font-size:0.7rem; letter-spacing:1px; color:#fff;">${escapeHtml(u.code)}</td>
              <td style="padding:10px 8px; color:#a499b8;">${escapeHtml(u.name)}</td>
              <td style="padding:10px 8px; text-align:center;">${isAdmin}</td>
              <td style="padding:10px 8px; text-align:center;">${activeBadge}</td>
              <td style="padding:10px 8px; text-align:right; white-space:nowrap;">${actions}</td>
            `;
            tbody.appendChild(tr);
          });
      }

      function adminShowCreateForm() {
        document.getElementById('adminEditUserId').value = '';
        document.getElementById('adminUserCode').value = '';
        document.getElementById('adminUserName').value = '';
        document.getElementById('adminFormTitle').textContent = '➕ Nuevo Alumno';
        document.getElementById('adminUserForm').style.display = 'block';
        document.getElementById('adminFormFeedback').textContent = '';
      }

      function adminShowEditForm(id, code, name) {
        document.getElementById('adminEditUserId').value = id;
        document.getElementById('adminUserCode').value = code;
        document.getElementById('adminUserName').value = name;
        document.getElementById('adminFormTitle').textContent = '✏️ Editando: ' + name;
        document.getElementById('adminUserForm').style.display = 'block';
        document.getElementById('adminFormFeedback').textContent = '';
      }

      function adminCancelForm() {
        document.getElementById('adminUserForm').style.display = 'none';
        document.getElementById('adminFormFeedback').textContent = '';
      }

      async function adminSaveUser() {
        const id = document.getElementById('adminEditUserId').value;
        const code = document.getElementById('adminUserCode').value.trim().toUpperCase();
        const name = document.getElementById('adminUserName').value.trim();
        const feedback = document.getElementById('adminFormFeedback');
        if (!code || !name) {
          feedback.textContent = '⚠️ Completá todos los campos';
          feedback.style.color = '#ff3b30';
          return;
        }
        feedback.textContent = '🔄 Guardando...';
        feedback.style.color = '#645a78';
        try {
          if (id) {
            await sb.put(`/api/admin/users/${id}`, { code, name });
            feedback.textContent = '✅ Alumno actualizado';
          } else {
            await sb.post('/api/admin/users', { code, name });
            feedback.textContent = '✅ Alumno creado';
          }
          feedback.style.color = '#34c759';
          adminCancelForm();
          adminRefreshList();
        } catch(e) {
          feedback.textContent = '❌ ' + e.message;
          feedback.style.color = '#ff3b30';
        }
      }

      async function adminToggleActive(id) {
        try {
          await sb.put(`/api/admin/users/${id}/toggle-active`);
          adminRefreshList();
          showToast('🔄 Estado actualizado');
        } catch(e) {
          showToast('❌ Error: ' + e.message);
        }
      }

      async function adminDeleteUser(id, code, name) {
        const safeName = name || code;
        const ok = window.confirm(
          '⚠️ ¿Eliminar DEFINITIVAMENTE al alumno "' + code + ' - ' + safeName + '"?\n\n' +
          'Esta acción:\n' +
          '  • Borra el usuario de la base de datos\n' +
          '  • Borra sus notificaciones, devices (push tokens), likes y mensajes\n' +
          '  • Lo remueve de todos los chats grupales\n' +
          '  • NO se puede deshacer\n\n' +
          '¿Confirmás la eliminación?'
        );
        if (!ok) return;
        // Segunda confirmación con tipeo del código (anti-click-accidental)
        const typed = window.prompt('Para confirmar, escribí el código del usuario: ' + code);
        if (typed !== code) {
          showToast('❌ Código no coincide. Cancelado.');
          return;
        }
        const fb = document.getElementById('adminFormFeedback') || document.getElementById('adminTaskFormFeedback');
        try {
          const resp = await API.del('/api/admin/users/' + id);
          showToast('🗑️ Usuario "' + code + '" eliminado');
          if (fb) { fb.style.color = '#34c759'; fb.innerText = '✅ Eliminado: ' + safeName; }
          adminRefreshList();
        } catch (e) {
          showToast('❌ ' + (e.message || 'Error al eliminar'));
          if (fb) { fb.style.color = '#ff3b30'; fb.innerText = '❌ ' + (e.message || 'Error'); }
        }
      }

      async function adminCreateBatch() {
        const codes = [];
        for (let i = 1; i <= 11; i++) {
          const c = 'ALUMNO' + String(i).padStart(2, '0');
          codes.push(c);
        }
        showToast('🔄 Creando alumnos faltantes...');
        let created = 0;
        for (const code of codes) {
          try {
            const name = 'Alumno';
            await sb.post('/api/admin/users', { code, name });
            created++;
          } catch(e) {}
        }
        showToast(`✅ ${created} alumnos creados`);
        adminRefreshList();
      }

      // ==================== ADMIN TASK MANAGEMENT ====================
      function adminShowSubtab(tab) {
        const usersBtn = document.getElementById('adminSubtabUsers');
        const tasksBtn = document.getElementById('adminSubtabTasks');
        const musicBtn = document.getElementById('adminSubtabMusic');
        const walletBtn = document.getElementById('adminSubtabWallet');
        const torneosBtn = document.getElementById('adminSubtabTorneos');
        const monitorBtn = document.getElementById('adminSubtabMonitor');
        const usersContent = document.getElementById('adminSubtabContentUsers');
        const tasksContent = document.getElementById('adminSubtabContentTasks');
        const musicContent = document.getElementById('adminSubtabContentMusic');
        const walletContent = document.getElementById('adminSubtabContentWallet');
        const torneosContent = document.getElementById('adminSubtabContentTorneos');
        const monitorContent = document.getElementById('adminSubtabContentMonitor');
        const resetBtn = (btn) => { if (!btn) return; btn.style.color = '#645a78'; btn.style.borderBottomColor = 'transparent'; };
        const activateBtn = (btn) => { if (!btn) return; btn.style.color = 'var(--gold-bright)'; btn.style.borderBottomColor = 'var(--gold)'; };
        const allBtns = [usersBtn, tasksBtn, musicBtn, walletBtn, torneosBtn, monitorBtn];
        const allContent = [usersContent, tasksContent, musicContent, walletContent, torneosContent, monitorContent];
        const resetAll = () => allBtns.forEach(resetBtn);
        if (tab === 'tasks') {
          resetAll(); activateBtn(tasksBtn);
          allContent.forEach(c => { if (c) c.style.display = 'none'; });
          if (tasksContent) tasksContent.style.display = 'block';
          adminRefreshTasks();
        } else if (tab === 'music') {
          resetAll(); activateBtn(musicBtn);
          allContent.forEach(c => { if (c) c.style.display = 'none'; });
          if (musicContent) musicContent.style.display = 'block';
          adminMusicRefresh();
        } else if (tab === 'wallet') {
          resetAll(); activateBtn(walletBtn);
          allContent.forEach(c => { if (c) c.style.display = 'none'; });
          if (walletContent) walletContent.style.display = 'block';
          if (typeof adminWalletRefresh === 'function') adminWalletRefresh();
          if (typeof loadPendingWithdraws === 'function') loadPendingWithdraws();
        } else if (tab === 'torneos') {
          resetAll(); activateBtn(torneosBtn);
          allContent.forEach(c => { if (c) c.style.display = 'none'; });
          if (torneosContent) torneosContent.style.display = 'block';
          if (typeof adminTorneosRefresh === 'function') adminTorneosRefresh();
        } else if (tab === 'monitor') {
          resetAll(); activateBtn(monitorBtn);
          allContent.forEach(c => { if (c) c.style.display = 'none'; });
          if (monitorContent) monitorContent.style.display = 'block';
          loadMonitorLogs();
          if (typeof loadSystemStatus === 'function') loadSystemStatus();
        } else {
          resetAll(); activateBtn(usersBtn);
          allContent.forEach(c => { if (c) c.style.display = 'none'; });
          if (usersContent) usersContent.style.display = 'block';
        }
      }

      // ==================== ADMIN PLAYLIST DE MÚSICA ====================
      var adminPlaylistData = { tracks: [], activeIndex: 0, loop: 'all' };
      window.adminPlaylistData = adminPlaylistData; // necesario para los onmouseover inline del HTML

      // ==================== ADMIN MONITORING (logs de errores) ====================
      async function loadMonitorLogs() {
        const list = document.getElementById('monitorLogsList');
        if (!list) return;
        const code = window.TNSVT_USER?.code || 'ADMIN01';
        const levelFilter = document.getElementById('monFilterLevel')?.value || '';
        list.innerHTML = '<p style="color:#645a78;font-size:0.85rem">⏳ Cargando eventos…</p>';
        try {
          const data = await API.getMonitorLogs(code, { level: levelFilter, limit: 100 });
          // Stats en las cards
          if (data.stats) {
            const s = data.stats;
            const updateStat = (id, val, color) => {
              const el = document.querySelector(`#${id} .mon-stat-value`);
              if (el) { el.textContent = val; el.style.color = color || ''; }
            };
            updateStat('mon-stat-error', s.error || 0, '#f87171');
            updateStat('mon-stat-warning', s.warning || 0, '#f0c060');
            updateStat('mon-stat-info', s.info || 0, '#60a5fa');
            updateStat('mon-stat-total', (s.error||0)+(s.warning||0)+(s.info||0));
          }
          // Lista de logs
          if (!data.logs || data.logs.length === 0) {
            list.innerHTML = '<p style="color:#4ade80;font-size:0.85rem;padding:20px;text-align:center">✓ Sin eventos registrados</p>';
            return;
          }
          const colors = { error:'#f87171', warning:'#f0c060', info:'#60a5fa' };
          const icons  = { error:'✗', warning:'⚠', info:'ⓘ' };
          list.innerHTML = data.logs.map(l => `
            <div style="padding:10px 12px;background:rgba(0,0,0,.3);border-left:3px solid ${colors[l.level]||'#645a78'};border-radius:6px;margin-bottom:6px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                <span style="color:${colors[l.level]||'#645a78'};font-weight:700;font-size:0.85rem">${icons[l.level]||'•'} ${escapeHtml(l.level || '?').toUpperCase()}</span>
                <span style="color:#645a78;font-size:0.7rem">${escapeHtml(l.created_at || '')}</span>
              </div>
              <div style="font-size:0.82rem;color:#e2dcf0;margin-bottom:4px;word-break:break-word">${escapeHtml(l.message || '')}</div>
              <div style="font-size:0.7rem;color:#645a78">
                ${l.source ? `<span style="color:#a499b8">source:</span> ${escapeHtml(l.source)}` : ''}
                ${l.user_code ? ` · <span style="color:#a499b8">user:</span> ${escapeHtml(l.user_code)}` : ''}
                ${l.url ? ` · <span style="color:#a499b8">url:</span> ${escapeHtml(l.url)}` : ''}
              </div>
            </div>`).join('');
        } catch (e) {
          list.innerHTML = `<p style="color:#f87171;font-size:0.85rem">❌ Error cargando eventos: ${escapeHtml(e.message || 'desconocido')}</p>`;
        }
      }
      window.loadMonitorLogs = loadMonitorLogs;

      // Boton "Probar error" — genera un error real que el SW capturara y enviara al backend.
      async function testMonitorError() {
        const code = window.TNSVT_USER?.code || 'ADMIN01';
        try {
          // Genera un error real (puede ser capturado por el SW si lo hay, o el handler global)
          throw new Error(`🧪 Test error desde panel admin — ${new Date().toLocaleTimeString()}`);
        } catch (e) {
          // Envia manualmente al backend (asi SIEMPRE queda registrado, sin depender del handler global)
          try {
            await API.logMonitorEvent({
              level: 'error',
              message: e.message,
              stack: e.stack || null,
              source: 'admin-test-button',
              user_code: code,
              url: location.pathname,
            });
            showToast('🧪 Error de prueba enviado al monitoring');
          } catch (err) {
            showToast('❌ No pude enviar el error de prueba: ' + err.message);
          }
        }
      }
      window.testMonitorError = testMonitorError;

      async function loadSystemStatus() {
        const el = document.getElementById('monSystemStatus');
        if (!el) return;
        el.innerHTML = '<p style="color:#645a78;font-size:0.85rem;">⏳ Consultando…</p>';
        let swHtml = '<span style="color:#f87171">● No soportado</span>';
        let swCount = 0, swRegs = '';
        try {
          const sw = await API.getSWStatus();
          if (sw.supported) {
            if (sw.controllers > 0) {
              swHtml = '<span style="color:#4ade80">● Activo</span>';
            } else if (sw.count > 0) {
              swHtml = '<span style="color:#f0c060">● Registrado (recargá para activar)</span>';
            } else {
              swHtml = '<span style="color:#f0c060">● Cargando…</span>';
            }
            swCount = sw.count;
            swRegs = (sw.registrations||[]).map(r =>
              `<div style="display:flex;justify-content:space-between;padding:6px 10px;background:rgba(138,60,255,.08);border-radius:6px;margin-bottom:4px;font-size:0.78rem;">
                <span style="color:#a499b8;">${escapeHtml(r.scope)}</span>
                <span style="color:#4ade80;">${escapeHtml((r.active||'').split('/').pop()||'sw')}</span>
              </div>`
            ).join('');
          }
        } catch(e) { console.warn('[sysStatus] SW:', e); }
        const fbKey = window.FIREBASE_CONFIG?.apiKey && window.FIREBASE_CONFIG.apiKey !== 'YOUR_API_KEY'
          ? '✓ Configurada'
          : '⚠ No configurada';
        // Verificar también vía fetch directo al backend (más confiable)
        try {
          const r = await fetch('/api/firebase/config', { credentials: 'include' });
          const fbData = await r.json();
          if (fbData.configured) {
            window.__FB_CONFIGURED__ = true;
            window.FIREBASE_CONFIG = {
              apiKey: fbData.apiKey,
              authDomain: fbData.authDomain,
              projectId: fbData.projectId,
              storageBucket: fbData.storageBucket,
              messagingSenderId: fbData.messagingSenderId,
              appId: fbData.appId,
              vapidKey: fbData.vapidKey,
            };
          } else {
            window.__FB_CONFIGURED__ = false;
          }
        } catch (e) {
          console.warn('[sysStatus] FB:', e);
          window.__FB_CONFIGURED__ = false;
        }
        const fbReal = window.__FB_CONFIGURED__ === true
          ? '✓ Detectada'
          : '⚠ No detectada';
        el.innerHTML = `
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin-bottom:12px;">
            <div class="monitor-stat-card">
              <div class="mon-stat-label">Service Worker</div>
              <div class="mon-stat-value" style="font-size:1.05rem;">${swHtml}</div>
              <div style="font-size:0.7rem;color:#645a78;margin-top:4px;">${swCount} registro(s)</div>
            </div>
            <div class="monitor-stat-card">
              <div class="mon-stat-label">Firebase Web</div>
              <div class="mon-stat-value" style="font-size:1.05rem;color:${fbReal.includes('✓')?'#4ade80':'#f87171'}">${fbReal}</div>
              ${fbReal.includes('⚠') ? '<div style="font-size:0.7rem;color:#645a78;margin-top:4px;">Configurar FIREBASE_WEB_* en .env</div>' : '<div style="font-size:0.7rem;color:#645a78;margin-top:4px;">backend OK</div>'}
            </div>
            <div class="monitor-stat-card">
              <div class="mon-stat-label">Usuario</div>
              <div class="mon-stat-value" style="font-size:1rem;">${escapeHtml(window.TNSVT_USER?.code || '—')}</div>
              <div style="font-size:0.7rem;color:#645a78;margin-top:4px;">${escapeHtml(window.TNSVT_USER?.name || '—')}</div>
            </div>
          </div>
          ${swRegs ? `<div style="margin-top:8px;"><div style="font-size:0.78rem;color:var(--gold);margin-bottom:4px;">Registros activos:</div>${swRegs}</div>` : ''}
          <p style="font-size:0.7rem;color:#645a78;margin-top:8px;text-align:right;">${new Date().toLocaleString()}</p>
        `;
      }
      window.loadSystemStatus = loadSystemStatus;

      // ==================== AVATAR UPLOAD ====================
      async function uploadAvatar(inputEl) {
        const file = inputEl.files && inputEl.files[0];
        if (!file) return;
        const userCode = window.TNSVT_USER?.code;
        if (!userCode) { showToast('No hay usuario logueado'); return; }
        try {
          showToast('⏳ Subiendo avatar…');
          const data = await API.uploadAvatar(userCode, file);
          showToast('✓ Avatar actualizado');
          if (window.TNSVT_USER) {
            window.TNSVT_USER.avatar_url = data.avatar_url;
            window.TNSVT_USER.avatar_color = data.avatar_color;
            renderHeaderAvatar();
            if (window.refreshAvatarMenuAfterChange) window.refreshAvatarMenuAfterChange(data);
          }
          // Si estamos en admin, refrescar tabla
          if (typeof adminRefreshList === 'function' && document.getElementById('tab-admin')?.style.display !== 'none') {
            adminRefreshList();
          }
        } catch (e) {
          showToast('✗ ' + (e.message || 'Error'));
        } finally {
          inputEl.value = '';
        }
      }
      window.uploadAvatar = uploadAvatar;

      async function deleteMyAvatar() {
        const userCode = window.TNSVT_USER?.code;
        if (!userCode) return;
        if (!confirm('¿Borrar tu avatar?')) return;
        try {
          await API.deleteAvatar(userCode);
          showToast('✓ Avatar borrado');
          if (window.TNSVT_USER) {
            window.TNSVT_USER.avatar_url = null;
            renderHeaderAvatar();
          }
        } catch (e) {
          showToast('✗ ' + (e.message || 'Error'));
        }
      }
      window.deleteMyAvatar = deleteMyAvatar;

      // Render avatar en el header — muestra el círculo solo cuando hay sesión.
      // Si no hay avatar subido, usa las iniciales del nombre + color estable.
      function renderHeaderAvatar() {
        const u = window.TNSVT_USER;
        const wrap = document.getElementById('myAvatarWrap');
        const el = document.getElementById('myAvatar');
        if (!u || !u.code) {
          // Sin sesión: ocultar el círculo, dejar el botón "Desconectar" del HTML original
          if (wrap) wrap.style.display = 'none';
          return;
        }
        if (wrap) wrap.style.display = 'block';

        const av   = u.avatar_url || null;
        const name = u.name || u.code || '?';
        const initials = (name.trim().split(/\s+/).map(p => p[0] || '').join('').slice(0,2).toUpperCase()) || '?';
        const color = u.avatar_color || '#9353ff';

        if (!el) return;
        if (av) {
          el.innerHTML = `<img src="${av}?t=${Date.now()}" alt="${escapeHtml(name)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
          el.style.background = 'transparent';
        } else {
          el.innerHTML = escapeHtml(initials);
          el.style.background = color;
        }

        // Mostrar/ocultar botón "Quitar foto"
        const del = document.getElementById('deleteAvatarBtn');
        if (del) del.style.display = av ? 'flex' : 'none';
      }
      window.renderHeaderAvatar = renderHeaderAvatar;

      // Vincular el click del avatar al menú (sin onclick inline, que puede
      // ejecutarse antes que el bundle JS termine de parsearse).
      function bindAvatarEvents() {
        const av = document.getElementById('myAvatar');
        if (av && !av.dataset.bound) {
          av.dataset.bound = '1';
          av.addEventListener('click', (e) => {
            e.stopPropagation();
            if (typeof window.toggleAvatarMenu === 'function') {
              window.toggleAvatarMenu();
            }
          });
        }
        // Actualizar el botón de notificaciones del menú
        if (typeof updateAvatarNotifBtn === 'function') updateAvatarNotifBtn();
      }
      window.bindAvatarEvents = bindAvatarEvents;

      // Carga el perfil del user actual desde el backend y actualiza el avatar.
      async function loadMyProfile() {
        const code = window.TNSVT_USER?.code;
        if (!code) return;
        try {
          const data = await API.getProfile(code);
          if (!data) return;
          window.TNSVT_USER.avatar_url  = data.avatar_url || null;
          window.TNSVT_USER.avatar_color = data.avatar_color || null;
          window.TNSVT_USER.initials    = data.initials || '?';
          renderHeaderAvatar();
          // Mostrar/ocultar botón "Quitar foto"
          const del = document.getElementById('deleteAvatarBtn');
          if (del) del.style.display = data.avatar_url ? 'flex' : 'none';
        } catch (e) {
          console.warn('[profile] loadMyProfile:', e.message);
        }
      }
      window.loadMyProfile = loadMyProfile;

      // Toggle del menú del avatar
      function toggleAvatarMenu(e) {
        if (e) e.stopPropagation();
        const menu = document.getElementById('avatarMenu');
        if (!menu) return;
        const open = menu.style.display === 'block';
        menu.style.display = open ? 'none' : 'block';
        if (!open) {
          // Cerrar al click fuera
          setTimeout(() => document.addEventListener('click', closeAvatarMenuOutside, { capture: true, once: true }), 10);
        }
      }
      function closeAvatarMenuOutside(e) {
        const wrap = document.getElementById('myAvatarWrap');
        if (wrap && !wrap.contains(e.target)) {
          document.getElementById('avatarMenu').style.display = 'none';
        } else {
          document.addEventListener('click', closeAvatarMenuOutside, { capture: true, once: true });
        }
      }
      window.toggleAvatarMenu = toggleAvatarMenu;
      // Alias solicitado por el topbar (admin block click)
      window.openProfileMenu = function() {
        if (typeof window.toggleAvatarMenu === 'function') {
          window.toggleAvatarMenu();
        }
      };

      // NOTA: zoom nativo del browser (pinch-to-zoom) ya habilitado via viewport meta.
      // El widget con botones fue eliminado porque transform:scale() causaba clipping.

      // Después de subir/borrar avatar, refrescar el menú para mostrar/ocultar "Quitar foto"
      async function refreshAvatarMenuAfterChange(data) {
        const del = document.getElementById('deleteAvatarBtn');
        if (del) del.style.display = data && data.avatar_url ? 'flex' : 'none';
      }
      window.refreshAvatarMenuAfterChange = refreshAvatarMenuAfterChange;

      function escapeHtml(s) {
        return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
      }

      async function adminMusicRefresh() {
        const empty = document.getElementById('adminPlaylistEmpty');
        const list = document.getElementById('adminPlaylistList');
        const counter = document.getElementById('adminPlaylistCount');
        if (!list) return;
        try {
          const data = await API.get('/api/music');
          adminPlaylistData = {
            tracks: (data && data.playlist) ? data.playlist : [],
            activeIndex: (data && typeof data.activeIndex === 'number') ? data.activeIndex : 0,
            loop: (data && data.loop) ? data.loop : 'all',
          };
          window.adminPlaylistData = adminPlaylistData; // mantener el global actualizado
          // Sincronizar el player principal con la playlist del server
          if (typeof musicPlaylist !== 'undefined') {
            musicPlaylist = adminPlaylistData.tracks;
            musicActiveIndex = adminPlaylistData.activeIndex;
            musicLoop = adminPlaylistData.loop;
            musicUpdateHeaderUI();
            musicRenderQueue();
          }
          const tracks = adminPlaylistData.tracks;
          if (counter) counter.textContent = tracks.length;
          if (tracks.length === 0) {
            if (empty) empty.style.display = 'block';
            list.innerHTML = '';
            return;
          }
          if (empty) empty.style.display = 'none';
          list.innerHTML = tracks.map((t, i) => {
            const isActive = i === adminPlaylistData.activeIndex;
            const icon = t.source === 'external' ? '🌐' : '📁';
            const size = t.size ? ((t.size/1024/1024).toFixed(1) + ' MB') : '';
            const meta = [size, t.mime].filter(Boolean).join(' · ');
            return `
              <div data-idx="${i}" draggable="true" style="display:flex; align-items:center; gap:8px; padding:10px 12px; border-radius:8px; transition:all 0.2s; cursor:grab; ${isActive ? 'background:rgba(212,175,55,0.12); border:1px solid rgba(212,175,55,0.4);' : 'background:rgba(0,0,0,0.3); border:1px solid rgba(212,175,55,0.1);'}" onmouseover="if(${i}!==adminPlaylistData.activeIndex)this.style.background='rgba(138,60,255,0.1)'" onmouseout="if(${i}!==adminPlaylistData.activeIndex)this.style.background='rgba(0,0,0,0.3)'">
                <span style="cursor:grab; color:#645a78; font-size:0.9rem; user-select:none;">≡</span>
                <span style="font-size:1rem; flex-shrink:0;">${icon}</span>
                <div style="flex:1; min-width:0;">
                  <div style="font-size:0.85rem; color:${isActive ? 'var(--gold-bright)' : '#e2dcf0'}; font-weight:${isActive ? '600' : '400'}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${(t.name || 'Track').replace(/</g, '&lt;')}</div>
                  <div style="font-size:0.68rem; color:#645a78;">${meta || (t.source === 'external' ? 'Stream externo' : 'Local')}</div>
                </div>
                ${isActive ? '<span style="background:var(--gold-bright); color:#000; font-size:0.55rem; font-weight:700; padding:2px 6px; border-radius:6px; letter-spacing:0.5px;">▶ ACTIVO</span>' : `<button onclick="adminMusicSetActive('${t.id}')" style="background:transparent; border:1px solid rgba(212,175,55,0.3); color:var(--gold); padding:4px 10px; border-radius:6px; cursor:pointer; font-size:0.68rem; font-family:inherit; letter-spacing:0.5px; transition:all 0.2s;" onmouseover="this.style.background='rgba(212,175,55,0.15)'" onmouseout="this.style.background='transparent'">▶ Activar</button>`}
                <button onclick="adminMusicRemove('${t.id}', '${(t.name || 'este track').replace(/'/g, "\\'")}')" title="Eliminar" style="background:rgba(255,59,48,0.1); border:1px solid rgba(255,59,48,0.3); color:#ff7066; padding:4px 8px; border-radius:6px; cursor:pointer; font-size:0.85rem; font-family:inherit; line-height:1; transition:all 0.2s;" onmouseover="this.style.background='rgba(255,59,48,0.25)'" onmouseout="this.style.background='rgba(255,59,48,0.1)'">🗑</button>
              </div>`;
          }).join('');
          adminMusicSetupDragDrop();
        } catch (e) {
          console.error('adminMusicRefresh error:', e);
        }
      }

      function adminMusicSetupDragDrop() {
        const list = document.getElementById('adminPlaylistList');
        if (!list) return;
        let dragSrc = null;
        list.querySelectorAll('[data-idx]').forEach(el => {
          el.addEventListener('dragstart', (e) => {
            dragSrc = parseInt(el.dataset.idx, 10);
            e.dataTransfer.effectAllowed = 'move';
            el.style.opacity = '0.4';
          });
          el.addEventListener('dragend', () => { el.style.opacity = ''; });
          el.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
          el.addEventListener('drop', async (e) => {
            e.preventDefault();
            const dst = parseInt(el.dataset.idx, 10);
            if (dragSrc === null || dragSrc === dst) return;
            const ids = adminPlaylistData.tracks.map(t => t.id);
            const moved = ids.splice(dragSrc, 1)[0];
            ids.splice(dst, 0, moved);
            try {
              await API.post('/api/music/playlist/reorder', { order: ids });
              showToast('↕️ Orden actualizado');
              adminMusicRefresh();
              musicLoad();
            } catch (err) { showToast('❌ ' + (err.message || 'Error')); }
          });
        });
      }

      async function adminMusicSetActive(id) {
        try {
          await API.post('/api/music/playlist/active', { id });
          showToast('▶ Track activado');
          adminMusicRefresh();
          musicLoad();
        } catch (e) { showToast('❌ ' + (e.message || 'Error')); }
      }

      async function adminMusicRemove(id, name) {
        if (!confirm('¿Quitar "' + name + '" de la playlist?')) return;
        try {
          await API.del('/api/music/playlist/' + encodeURIComponent(id));
          showToast('🗑 Track eliminado');
          adminMusicRefresh();
          musicLoad();
        } catch (e) { showToast('❌ ' + (e.message || 'Error')); }
      }

      async function adminMusicClearAll() {
        if (!confirm('¿Vaciar TODA la playlist? Esto borra todos los tracks.')) return;
        try {
          await API.del('/api/music/playlist');
          showToast('🗑 Playlist vaciada');
          adminMusicRefresh();
          musicLoad();
        } catch (e) { showToast('❌ ' + (e.message || 'Error')); }
      }

      async function adminMusicUpload(input) {
        if (!input.files || !input.files[0]) return;
        const file = input.files[0];
        if (file.size > 200 * 1024 * 1024) { showToast('❌ El archivo supera 200 MB'); input.value = ''; return; }
        const progress = document.getElementById('adminMusicProgress');
        const bar = document.getElementById('adminMusicBar');
        const fname = document.getElementById('adminMusicFileName');
        const fb = document.getElementById('adminMusicFeedback');
        fname.textContent = file.name;
        progress.style.display = 'block';
        bar.style.width = '0%';
        fb.textContent = '';
        const fd = new FormData();
        fd.append('file', file);
        try {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', '/api/music/playlist/add-upload', true);
          if (window.TNSVT_USER && window.TNSVT_USER.code) xhr.setRequestHeader('X-User-Code', window.TNSVT_USER.code);
          xhr.upload.onprogress = (ev) => {
            if (ev.lengthComputable) bar.style.width = ((ev.loaded / ev.total) * 100) + '%';
          };
          xhr.onload = () => {
            progress.style.display = 'none';
            input.value = '';
            let resp = null; try { resp = JSON.parse(xhr.responseText); } catch (_) {}
            if (xhr.status >= 200 && xhr.status < 300 && resp && resp.success) {
              fb.style.color = '#34c759';
              fb.textContent = '✅ Track agregado: ' + (resp.track.name || file.name);
              showToast('🎵 Track agregado a la playlist');
              adminMusicRefresh();
              musicLoad();
            } else {
              fb.style.color = '#ff3b30';
              fb.textContent = '❌ ' + (resp && resp.error ? resp.error : 'Error al subir');
            }
          };
          xhr.onerror = () => {
            progress.style.display = 'none';
            input.value = '';
            fb.style.color = '#ff3b30';
            fb.textContent = '❌ Error de red';
          };
          xhr.send(fd);
        } catch (e) {
          progress.style.display = 'none';
          input.value = '';
          fb.style.color = '#ff3b30';
          fb.textContent = '❌ ' + (e.message||'');
        }
      }

      async function adminMusicSetExternal() {
        const urlEl = document.getElementById('adminMusicExternalUrl');
        const labelEl = document.getElementById('adminMusicExternalLabel');
        const fb = document.getElementById('adminMusicFeedback');
        const url = (urlEl?.value || '').trim();
        const label = (labelEl?.value || '').trim();
        if (!url) { fb.style.color = '#ff3b30'; fb.textContent = '❌ Pegá una URL'; return; }
        if (!/^https?:\/\//i.test(url)) { fb.style.color = '#ff3b30'; fb.textContent = '❌ La URL debe empezar con http:// o https://'; return; }
        fb.style.color = '#a499b8';
        fb.textContent = '⏳ Agregando…';
        try {
          const resp = await API.post('/api/music/playlist/add-external', { url, label });
          fb.style.color = '#34c759';
          fb.textContent = '✅ Track agregado: ' + (resp.track.name || url);
          showToast('🌐 Track externo agregado');
          urlEl.value = '';
          labelEl.value = '';
          adminMusicRefresh();
          musicLoad();
        } catch (e) {
          fb.style.color = '#ff3b30';
          fb.textContent = '❌ ' + (e.message || 'Error');
        }
      }

      async function adminRefreshTasks() {
        const tbody = document.getElementById('adminTasksTableBody');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="5" style="padding:20px; text-align:center; color:#645a78;">Cargando...</td></tr>';
        try {
          const tasks = await sb.get('/api/admin/tasks');
          tbody.innerHTML = '';
          if (!tasks || tasks.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="padding:30px; text-align:center; color:#645a78;">No hay tareas creadas</td></tr>';
            return;
          }
          tasks.forEach(t => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid rgba(255,255,255,0.04)';
            const statusBadge = t.active
              ? '<span style="color:#34c759;">🟢 Activa</span>'
              : '<span style="color:#ff3b30;">🔴 Inactiva</span>';
            tr.innerHTML = `
              <td style="padding:10px 8px; font-family:'Orbitron',sans-serif; font-size:0.75rem; color:#645a78;">${t.orden}</td>
              <td style="padding:10px 8px; color:#fff; font-size:0.85rem;">${escapeHtml(t.title)}</td>
              <td style="padding:10px 8px; color:#a499b8; font-size:0.78rem; max-width:300px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(t.description || '—')}</td>
              <td style="padding:10px 8px; text-align:center;">${statusBadge}</td>
              <td style="padding:10px 8px; text-align:right; white-space:nowrap;">
                <button class="admin-btn-edit" onclick="adminShowTaskEditForm(${t.id},'${escapeHtml(t.title).replace(/'/g,"\\'")}','${escapeHtml(t.description || '').replace(/'/g,"\\'")}',${t.orden},${t.active})">✏️</button>
                <button class="admin-btn-edit" onclick="adminToggleTaskActive(${t.id})" title="${t.active ? 'Desactivar' : 'Activar'}">${t.active ? '🔒' : '🔓'}</button>
                <button class="admin-btn-danger" onclick="adminDeleteTask(${t.id})">🗑️</button>
              </td>
            `;
            tbody.appendChild(tr);
          });
        } catch(e) {
          tbody.innerHTML = `<tr><td colspan="5" style="padding:20px; text-align:center; color:#ff3b30;">Error: ${e.message}</td></tr>`;
        }
      }

      function adminShowTaskCreateForm() {
        document.getElementById('adminEditTaskId').value = '';
        document.getElementById('adminTaskTitle').value = '';
        document.getElementById('adminTaskDesc').value = '';
        document.getElementById('adminTaskOrden').value = '99';
        document.getElementById('adminTaskActive').checked = true;
        document.getElementById('adminTaskFormTitle').textContent = '➕ Nueva Tarea';
        document.getElementById('adminTaskForm').style.display = 'block';
        document.getElementById('adminTaskFormFeedback').textContent = '';
      }

      function adminShowTaskEditForm(id, title, desc, orden, active) {
        document.getElementById('adminEditTaskId').value = id;
        document.getElementById('adminTaskTitle').value = title;
        document.getElementById('adminTaskDesc').value = desc;
        document.getElementById('adminTaskOrden').value = orden;
        document.getElementById('adminTaskActive').checked = active;
        document.getElementById('adminTaskFormTitle').textContent = '✏️ Editando: ' + title;
        document.getElementById('adminTaskForm').style.display = 'block';
        document.getElementById('adminTaskFormFeedback').textContent = '';
      }

      function adminCancelTaskForm() {
        document.getElementById('adminTaskForm').style.display = 'none';
        document.getElementById('adminTaskFormFeedback').textContent = '';
      }

      async function adminSaveTask() {
        const id = document.getElementById('adminEditTaskId').value;
        const title = document.getElementById('adminTaskTitle').value.trim();
        const desc = document.getElementById('adminTaskDesc').value.trim();
        const orden = parseInt(document.getElementById('adminTaskOrden').value) || 99;
        const active = document.getElementById('adminTaskActive').checked;
        const feedback = document.getElementById('adminTaskFormFeedback');
        if (!title) {
          feedback.textContent = '⚠️ El título es requerido';
          feedback.style.color = '#ff3b30';
          return;
        }
        feedback.textContent = '🔄 Guardando...';
        feedback.style.color = '#645a78';
        try {
          if (id) {
            await sb.put(`/api/admin/tasks/${id}`, { title, description: desc, orden, active });
            feedback.textContent = '✅ Tarea actualizada';
          } else {
            await sb.post('/api/admin/tasks', { title, description: desc, orden, active });
            feedback.textContent = '✅ Tarea creada';
          }
          feedback.style.color = '#34c759';
          setTimeout(() => {
            adminCancelTaskForm();
            adminRefreshTasks();
          }, 800);
        } catch(e) {
          feedback.textContent = '❌ ' + e.message;
          feedback.style.color = '#ff3b30';
        }
      }

      async function adminDeleteTask(id) {
        if (!confirm('¿Eliminar esta tarea? Los alumnos ya no la verán.')) return;
        try {
          await sb.del(`/api/admin/tasks/${id}`);
          showToast('🗑️ Tarea eliminada');
          adminRefreshTasks();
        } catch(e) {
          showToast('❌ Error: ' + e.message);
        }
      }

      async function adminToggleTaskActive(id) {
        try {
          await sb.put(`/api/admin/tasks/${id}/toggle-active`);
          adminRefreshTasks();
          showToast('🔄 Estado actualizado');
        } catch(e) {
          showToast('❌ Error: ' + e.message);
        }
      }

      // ==================== CHAT ====================
      const CHAT_MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10 MB
      let chatConversations = [];
      window.chatConversations = chatConversations;
      let activeConvId = null;
      let chatPhotoData = null;
      let chatLastMessageId = 0;
      let chatPollTimer = null;

      function formatChatTime(iso) {
        if (!iso) return '';
        const d = new Date(iso);
        if (isNaN(d.getTime())) return '';
        const now = new Date();
        const sameDay = d.toDateString() === now.toDateString();
        const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
        const isYesterday = d.toDateString() === yesterday.toDateString();
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        if (sameDay) return `${hh}:${mm}`;
        if (isYesterday) return `ayer ${hh}:${mm}`;
        return `${d.getDate()}/${d.getMonth()+1} ${hh}:${mm}`;
      }

      function convDisplayName(conv) {
        if (conv.type === 'group') return conv.title || 'Grupo';
        if (conv.type === 'dm') return conv.other_user_name || conv.other_user_code || 'Conversación';
        if (conv.type === 'ai') return '🤖 T.N.S.V.T Coach';
        return 'Conversación';
      }

      function convAvatar(conv) {
        if (conv.type === 'group') return { text: '#', cls: 'group' };
        if (conv.type === 'ai') return { text: 'IA', cls: 'ai' };
        const name = conv.other_user_name || conv.other_user_code || '?';
        // Si el backend nos da avatar_url del otro user, devolvemos la URL para renderizar <img>
        if (conv.other_user_avatar_url) {
          return { image: conv.other_user_avatar_url, text: escapeHtml(name.charAt(0).toUpperCase()), cls: 'dm' };
        }
        return { text: escapeHtml(name.charAt(0).toUpperCase()), cls: 'dm' };
      }

      function renderConversations() {
        const list = document.getElementById('chatConvList');
        if (!list) return;
        if (!chatConversations.length) {
          list.innerHTML = '<div style="padding:20px;text-align:center;color:#a499b8;font-size:0.8rem;">Sin conversaciones</div>';
          return;
        }
        list.innerHTML = chatConversations.map(c => {
          const av = convAvatar(c);
          const active = c.id === activeConvId ? ' active' : '';
          const unread = c.unread_count > 0 ? `<span class="chat-unread-badge">${c.unread_count}</span>` : '';
          let preview = '—';
          if (c.last_message) {
            const sender = c.last_message.sender_name || (c.last_message.is_ai ? 'IA' : '');
            const text = c.last_message.has_photo
              ? (sender ? `${sender}: 📷 Foto` : '📷 Foto')
              : (sender ? `${sender}: ${c.last_message.content || ''}` : (c.last_message.content || ''));
            preview = escapeHtml(text.length > 60 ? text.slice(0, 60) + '…' : text);
          }
          return `
            <div class="chat-conv-item${active}" data-conv-id="${c.id}" onclick="selectConversation(${c.id})">
              <div class="chat-conv-avatar ${av.cls}">${av.image ? `<img src="${escapeHtml(av.image)}" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover" onerror="this.replaceWith(document.createTextNode('${av.text}'))">` : av.text}</div>
              <div class="chat-conv-info">
                <div class="chat-conv-name">${escapeHtml(convDisplayName(c))}</div>
                <div class="chat-conv-preview">${preview}</div>
              </div>
              ${unread}
            </div>`;
        }).join('');
      }

      async function loadConversations() {
        if (!window.TNSVT_USER) return;
        try {
          const data = await sb.getConversations(window.TNSVT_USER.code);
          chatConversations = data || [];
          window.chatConversations = chatConversations;
          renderConversations();
          // Auto-select first conv if none active (only if widget panel is open)
          // Check CF widget state instead of deleted chatIsOpen()
          if (!activeConvId && chatConversations.length > 0 && window.CF?.state?.open) {
            const groupConv = chatConversations.find(c => c.type === 'group') || chatConversations[0];
            selectConversation(groupConv.id);
          }
        } catch(e) {
          console.error('Error cargando conversaciones:', e);
        }
      }

      function renderMessage(msg, position) {
        const me = window.TNSVT_USER;
        const isMe = msg.sender_code === me?.code;
        const isSystem = !msg.sender_code;
        const avatarChar = isSystem ? '⚙' : (isMe ? (me.name || '?').charAt(0).toUpperCase() : (msg.sender_name || '?').charAt(0).toUpperCase());
        const photoHtml = msg.photo ? `<img class="chat-msg-photo" src="${escapeHtml(msg.photo)}" onclick="openChatLightbox('${encodeURIComponent(msg.photo)}')" alt="foto">` : '';
        const textHtml = msg.content ? `<div class="chat-msg-text">${escapeHtml(msg.content)}</div>` : '';
        const metaName = isSystem ? 'Sistema' : (msg.sender_name || '—');
        const metaTime = formatChatTime(msg.created_at);

        if (isSystem) {
          return `<div class="chat-msg system">
            <div class="chat-msg-avatar">${avatarChar}</div>
            <div class="chat-msg-body">
              <div class="chat-msg-meta"><strong>${escapeHtml(metaName)}</strong> · ${metaTime}</div>
              <div class="chat-msg-bubble">${textHtml}${photoHtml}</div>
            </div>
          </div>`;
        }
        return `<div class="chat-msg ${isMe ? 'me' : 'other'}">
          <div class="chat-msg-avatar">${avatarChar}</div>
          <div class="chat-msg-body ${isMe ? 'chat-msg-me' : ''}">
            <div class="chat-msg-meta"><strong>${escapeHtml(metaName)}</strong> · ${metaTime}</div>
            <div class="chat-msg-bubble">${textHtml}${photoHtml}</div>
          </div>
        </div>`;
      }

      async function loadMessages(convId, beforeId = null) {
        if (!window.TNSVT_USER) return;
        try {
          const data = await sb.getMessages(convId, window.TNSVT_USER.code, beforeId);
          return data || [];
        } catch(e) {
          console.error('Error cargando mensajes:', e);
          return [];
        }
      }

      async function selectConversation(convId) {
        if (!window.TNSVT_USER) return;
        activeConvId = convId;
        renderConversations();
        const conv = chatConversations.find(c => c.id === convId);
        if (!conv) return;

        // Header
        const nameEl = document.getElementById('chatHeaderName');
        const subEl = document.getElementById('chatHeaderSub');
        const avEl = document.getElementById('chatHeaderAvatar');
        if (nameEl) nameEl.textContent = convDisplayName(conv);
        if (subEl) {
          if (conv.type === 'group') subEl.textContent = 'Conversación grupal';
          else if (conv.type === 'ai') subEl.textContent = 'Coach IA';
          else subEl.textContent = 'Mensaje directo';
        }
        // Avatar del header: mostrar foto del otro user si existe
        if(avEl){
          const av = convAvatar(conv);
          if(av.image){
            avEl.innerHTML = `<img src="${escapeHtml(av.image)}" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover" onerror="this.replaceWith(document.createTextNode('${escapeHtml(av.text)}'))">`;
            avEl.style.background = 'transparent';
          } else {
            avEl.innerHTML = av.text;
            avEl.style.background = conv.type === 'group' ? 'linear-gradient(135deg, var(--gold), #b8860b)' : 'linear-gradient(135deg, var(--violet), #4a1a8a)';
            avEl.style.color = conv.type === 'group' ? '#000' : '#fff';
          }
        }

        const stream = document.getElementById('chatStream');
        if (stream) {
          stream.innerHTML = '<div class="chat-empty">Cargando…</div>';
        }

        // Mark as read
        try { await sb.markChatRead(convId, window.TNSVT_USER.code); } catch(e) {}

        // Load latest 50
        const messages = await loadMessages(convId, null);
        renderStream(messages);
        chatLastMessageId = messages.length ? messages[messages.length - 1].id : 0;

        // Update local unread
        const c = chatConversations.find(x => x.id === convId);
        if (c) c.unread_count = 0;
        renderConversations();
      }

      function renderStream(messages) {
        const stream = document.getElementById('chatStream');
        if (!stream) return;
        if (!messages || !messages.length) {
          stream.innerHTML = '<div class="chat-empty">Sin mensajes todavía. ¡Sé el primero!</div>';
          return;
        }
        stream.innerHTML = messages.map(m => renderMessage(m)).join('');
        stream.scrollTop = stream.scrollHeight;
      }

      function appendMessage(msg) {
        const stream = document.getElementById('chatStream');
        if (!stream) return;
        // Remove "empty" or "loading" placeholders
        const empty = stream.querySelector('.chat-empty');
        if (empty) empty.remove();
        stream.insertAdjacentHTML('beforeend', renderMessage(msg));
        stream.scrollTop = stream.scrollHeight;
      }

      function attachChatPhoto(input) {
        const file = input.files?.[0];
        if (!file) return;
        if (file.size > CHAT_MAX_PHOTO_BYTES) {
          showToast('❌ Foto demasiado grande (máx 10MB)');
          input.value = '';
          return;
        }
        const reader = new FileReader();
        reader.onload = e => {
          chatPhotoData = e.target.result;
          const prev = document.getElementById('chatPhotoPreview');
          const row = document.getElementById('chatPhotoPreviewRow');
          if (prev) prev.src = chatPhotoData;
          if (row) row.style.display = 'flex';
        };
        reader.readAsDataURL(file);
      }

      function removeChatPhoto() {
        chatPhotoData = null;
        const prev = document.getElementById('chatPhotoPreview');
        const row = document.getElementById('chatPhotoPreviewRow');
        const input = document.getElementById('chatPhotoInput');
        if (prev) prev.src = '';
        if (row) row.style.display = 'none';
        if (input) input.value = '';
      }

      async function sendChatMessage() {
        if (!window.TNSVT_USER) { showToast('⚠️ Iniciá sesión primero'); return; }
        if (!activeConvId) { showToast('⚠️ Seleccioná una conversación'); return; }
        const input = document.getElementById('chatInput');
        const content = (input?.value || '').trim();
        if (!content && !chatPhotoData) return;

        const btn = document.getElementById('chatSendBtn');
        if (btn) { btn.disabled = true; btn.textContent = '…'; }

        try {
          const msg = await sb.sendMessage(activeConvId, window.TNSVT_USER.code, content, chatPhotoData);
          input.value = '';
          removeChatPhoto();
          appendMessage(msg);
          chatLastMessageId = msg.id;
          // Update conversation's last message
          const c = chatConversations.find(x => x.id === activeConvId);
          if (c) {
            c.last_message = {
              id: msg.id, sender_code: msg.sender_code, sender_name: msg.sender_name,
              content: msg.content, has_photo: !!msg.photo, is_ai: msg.is_ai, created_at: msg.created_at
            };
            c.unread_count = 0;
            renderConversations();
          }
        } catch(e) {
          showToast('❌ Error al enviar: ' + (e.message || ''));
        } finally {
          if (btn) { btn.disabled = false; btn.textContent = 'Enviar'; }
        }
      }

      function openChatLightbox(dataUrl) {
        const existing = document.getElementById('chatLightbox');
        if (existing) existing.remove();
        const div = document.createElement('div');
        div.id = 'chatLightbox';
        div.className = 'chat-lightbox';
        div.onclick = () => div.remove();
        const img = document.createElement('img');
        img.src = decodeURIComponent(dataUrl);
        div.appendChild(img);
        document.body.appendChild(div);
      }

      async function pollChat() {
        if (!window.TNSVT_USER) return;
        // Si la conversacion activa ya no existe (fue borrada, stale state), limpiarla.
        if (activeConvId && !chatConversations.some(c => c.id === activeConvId)) {
          console.warn('[chat] activeConvId stale, limpiando:', activeConvId);
          activeConvId = null;
          chatLastMessageId = 0;
          // Legacy: estos elementos fueron removidos cuando migramos al CF widget
          const stream = document.getElementById('chatStream');
          if (stream) stream.innerHTML = '<div class="chat-empty"><div class="chat-empty-icon">💬</div>Elegí una conversación para empezar</div>';
          const nameEl = document.getElementById('chatHeaderName');
          const subEl = document.getElementById('chatHeaderSub');
          if (nameEl) nameEl.textContent = '—';
          if (subEl) subEl.textContent = 'Seleccioná una conversación';
        }
        if (document.getElementById('tab-chat')?.classList.contains('active') && activeConvId) {
          try {
            const messages = await sb.getMessages(activeConvId, window.TNSVT_USER.code, null);
            if (!messages || !messages.length) return;
            const maxId = Math.max(...messages.map(m => m.id));
            if (maxId > chatLastMessageId) {
              const newMsgs = messages.filter(m => m.id > chatLastMessageId);
              for (const m of newMsgs) appendMessage(m);
              chatLastMessageId = maxId;
              // Update sidebar preview
              const last = messages[messages.length - 1];
              const c = chatConversations.find(x => x.id === activeConvId);
              if (c) {
                c.last_message = {
                  id: last.id, sender_code: last.sender_code, sender_name: last.sender_name,
                  content: last.content, has_photo: !!last.photo, is_ai: last.is_ai, created_at: last.created_at
                };
                renderConversations();
              }
            }
          } catch(e) {
            // Si el server devuelve 404 (conversacion borrada), limpiar
            if (e.message && /404|Conversaci.n no encontrada|No encontrada/i.test(e.message)) {
              console.warn('[chat] conversacion ya no existe:', activeConvId);
              chatConversations = chatConversations.filter(c => c.id !== activeConvId);
              window.chatConversations = chatConversations;
              activeConvId = null;
              chatLastMessageId = 0;
              renderConversations();
              const stream = document.getElementById('chatStream');
              if (stream) stream.innerHTML = '<div class="chat-empty"><div class="chat-empty-icon">💬</div>Esta conversación ya no existe</div>';
            }
          }
        }
        // Refresh sidebar every poll
        try {
          const data = await sb.getConversations(window.TNSVT_USER.code);
          if (data) {
            chatConversations = data;
            window.chatConversations = chatConversations;
            renderConversations();
            // Refrescar FAB badge del CF widget (si está disponible)
            try { window.CF?.render?.(); } catch(_) {}
          }
        } catch(e) { console.warn('[chat] loadChats:', e); }
      }

      function initChatPolling() {
        if (chatPollTimer) clearInterval(chatPollTimer);
        chatPollTimer = setInterval(pollChat, 5000);
      }

      // ==================== NUEVO DM ====================
      let newDmUsersCache = [];

      async function openNewDmModal() {
        if (!window.TNSVT_USER) return;
        const overlay = document.getElementById('newDmOverlay');
        if (!overlay) return;
        overlay.style.display = 'flex';
        document.getElementById('newDmSearch').value = '';
        const list = document.getElementById('newDmUserList');
        list.innerHTML = '<div style="padding:20px; text-align:center; color:#645a78;">Cargando usuarios...</div>';
        try {
          newDmUsersCache = await sb.getChatUsers(window.TNSVT_USER.code) || [];
          renderNewDmUserList(newDmUsersCache);
        } catch(e) {
          list.innerHTML = `<div style="padding:20px; text-align:center; color:#ff3b30;">Error: ${e.message}</div>`;
        }
        setTimeout(() => document.getElementById('newDmSearch')?.focus(), 100);
      }

      function closeNewDmModal() {
        const overlay = document.getElementById('newDmOverlay');
        if (overlay) overlay.style.display = 'none';
      }

      function filterNewDmList() {
        const q = (document.getElementById('newDmSearch')?.value || '').toLowerCase().trim();
        const filtered = !q ? newDmUsersCache : newDmUsersCache.filter(u =>
          (u.name || '').toLowerCase().includes(q) || (u.code || '').toLowerCase().includes(q)
        );
        renderNewDmUserList(filtered);
      }

      function renderNewDmUserList(users) {
        const list = document.getElementById('newDmUserList');
        if (!list) return;
        if (!users || users.length === 0) {
          list.innerHTML = '<div style="padding:20px; text-align:center; color:#645a78;">No hay usuarios disponibles</div>';
          return;
        }
        list.innerHTML = users.map(u => {
          const initial = (u.name || u.code || '?').charAt(0).toUpperCase();
          return `
            <div class="chat-conv-item" style="cursor:pointer; padding:10px 12px;" onclick="startDmWith('${escapeAttr(u.code)}')">
              <div class="chat-conv-avatar">${initial}</div>
              <div class="chat-conv-info">
                <div class="chat-conv-name">${escapeHtml(u.name || u.code)}</div>
                <div class="chat-conv-preview">${escapeHtml(u.code)}${u.is_admin ? ' · 👑 Admin' : ''}</div>
              </div>
            </div>`;
        }).join('');
      }

      function escapeAttr(s) { return String(s).replace(/'/g, "\\'").replace(/"/g, '&quot;'); }

      async function startDmWith(otherCode) {
        if (!window.TNSVT_USER) return;
        try {
          const conv = await sb.createDm(window.TNSVT_USER.code, otherCode);
          // Upsert en chatConversations
          const idx = chatConversations.findIndex(c => c.id === conv.id);
          if (idx >= 0) chatConversations[idx] = { ...chatConversations[idx], ...conv };
          else chatConversations.unshift(conv);
          renderConversations();
          selectConversation(conv.id);
          closeNewDmModal();
          showToast('✉️ Conversación abierta');
        } catch(e) {
          showToast('❌ Error: ' + e.message);
        }
      }

      function loadChats() {
        loadConversations();
        initChatPolling();
        // Wire up input area
        const photoBtn = document.getElementById('chatPhotoBtn');
        const photoInput = document.getElementById('chatPhotoInput');
        const photoRemove = document.getElementById('chatPhotoRemove');
        const sendBtn = document.getElementById('chatSendBtn');
        if (photoBtn && photoInput && !photoBtn._wired) {
          photoBtn.addEventListener('click', () => photoInput.click());
          photoBtn._wired = true;
        }
        if (photoInput && !photoInput._wired) {
          photoInput.addEventListener('change', e => attachChatPhoto(e.target));
          photoInput._wired = true;
        }
        if (photoRemove && !photoRemove._wired) {
          photoRemove.addEventListener('click', removeChatPhoto);
          photoRemove._wired = true;
        }
        if (sendBtn && !sendBtn._wired) {
          sendBtn.addEventListener('click', sendChatMessage);
          sendBtn._wired = true;
        }
      }

      // ==================== WIDGET CHAT FLOTANTE v3.6 (CF.notify) ====================
      // El widget nuevo (CF) se autocarga en el template. Acá exponemos
      // la función de polling que dispara toasts para mensajes nuevos
      // de CUALQUIER conversación (no solo la activa).

      // Tracking del último ID de mensaje conocido por conversación
      // Se inicializa con los IDs que ya trae la API al cargar la lista
      function _cfSeedLastIds() {
        if (!window.chatConversations) return;
        window.chatConversations.forEach(c => {
          if (c._cfLastId == null) {
            const last = c.last_message && c.last_message.id;
            c._cfLastId = last || 0;
          }
        });
      }

      async function pollAllConversations() {
        if (!window.TNSVT_USER) return;
        if (!window.sb || !window.sb.getMessages) return;
        const convs = window.chatConversations || [];
        _cfSeedLastIds();
        for (const conv of convs) {
          const convId = conv.id;
          try {
            const messages = await window.sb.getMessages(convId, window.TNSVT_USER.code, null);
            if (!messages || !messages.length) continue;
            const maxId = Math.max(...messages.map(m => m.id || 0));
            if (maxId > (conv._cfLastId || 0)) {
              const newMsgs = messages.filter(m => (m.id || 0) > (conv._cfLastId || 0));
              for (const m of newMsgs) {
                // Solo notificar mensajes de OTROS usuarios
                if (m.sender_code && m.sender_code !== window.TNSVT_USER.code) {
                  // Solo si el panel NO está abierto en esa conversación
                  if (!window.CF?.state?.open || window.CF.state.currentConv != convId) {
                    if (window.CF && typeof window.CF.notify === 'function') {
                      window.CF.notify(
                        m.sender_name || 'Mensaje',
                        m.content || (m.photo ? '📎 Foto' : '...'),
                        convId,
                        null
                      );
                    }
                  }
                }
              }
              conv._cfLastId = maxId;
            }
          } catch(e) {
            // Silenciar errores individuales de cada conversación
            console.warn('[CF-poll]', convId, e.message);
          }
        }
      }

      // Exponer al window para que el widget pueda llamarlo
      window.pollAllConversations = pollAllConversations;

      // Iniciar polling global cada 5s
      setInterval(pollAllConversations, 5000);

      // ==================== INICIALIZACIÓN GENERAL ====================
      async function initAllPanels() {
        loadTasks();
        await loadAccounts();
        await loadJournalFromApi();
        renderFeed();
        renderAcademia();
        loadChats();
        initFeedRealtime();
        initNotifRealtime();
        if (typeof checkPushPermission === 'function') checkPushPermission();
        updateBadge();
        setTimeout(() => { if (document.getElementById('mc-rate-slider')) mcCalcInterest(); }, 100);
        updateInnerLocks();
        musicInit();
        // Check for app updates
        appCheckForUpdates();
        const u = window.TNSVT_USER;
        if (u && u.isAdmin) {
          document.getElementById('adminSidebarBtn').style.display = 'block';
          adminRefreshList();
        }
      }

      // ============================================
      // App version check + update modal
      // ============================================
      // Version actual de la app, hardcodeada en el bundle. El backend
      // devuelve la version "actual" en /api/app/version. Si la del server
      // es mayor, mostramos el modal de update.
      const APP_LOCAL_VERSION_CODE = 8;

      async function appCheckForUpdates() {
        try {
          const resp = await fetch('/api/app/version', { cache: 'no-store' });
          if (!resp.ok) return;
          const data = await resp.json();
          if (!data || typeof data.versionCode !== 'number') return;
          if (data.versionCode <= APP_LOCAL_VERSION_CODE) return; // estamos al dia
          // Verificar si el user ya descarto esta version
          const dismissedKey = 'tnsvt_update_dismissed_v' + data.versionCode;
          if (localStorage.getItem(dismissedKey) === '1' && !data.updateRequired) return;
          // Mostrar el modal
          showUpdateModal(data);
        } catch (e) { console.warn('[appCheckForUpdates] error:', e); }
      }

      function showUpdateModal(info) {
        const existing = document.getElementById('appUpdateModal');
        if (existing) existing.remove();
        const modal = document.createElement('div');
        modal.id = 'appUpdateModal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'appUpdateTitle');
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:9999999; display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter:blur(8px);';
        const isRequired = !!info.updateRequired;
        const releaseNotes = (info.releaseNotes || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const downloadUrl = info.downloadUrl || '';
        modal.innerHTML = `
          <div style="background:rgba(13,8,24,0.98); border:2px solid #d4af37; border-radius:18px; padding:28px 24px; max-width:440px; width:100%; box-shadow:0 8px 40px rgba(0,0,0,0.8); font-family:inherit; color:#fff;">
            <div style="text-align:center; margin-bottom:18px;">
              <div style="font-size:2.4rem; margin-bottom:8px;">${isRequired ? '⚠️' : '🆕'}</div>
              <h2 id="appUpdateTitle" style="font-family:Cinzel,serif; color:#d4af37; font-size:1.4rem; margin:0 0 4px;">Nueva version disponible</h2>
              <div style="font-family:Orbitron,sans-serif; font-size:0.72rem; color:#a499b8; letter-spacing:1.5px; margin-bottom:6px;">v${escapeHtml(info.version || '')}</div>
              ${isRequired ? '<div style="color:#ff7066; font-size:0.82rem;">Esta actualizacion es obligatoria.</div>' : ''}
            </div>
            ${releaseNotes ? `<div style="background:rgba(0,0,0,0.3); border:1px solid rgba(212,175,55,0.15); border-radius:10px; padding:14px; margin-bottom:20px; font-size:0.85rem; line-height:1.5; color:#e2dcf0; max-height:160px; overflow-y:auto; white-space:pre-wrap;">${releaseNotes}</div>` : ''}
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              ${downloadUrl ? `<a href="${escapeHtml(downloadUrl)}" target="_blank" rel="noopener" id="appUpdateDownload" style="flex:1; min-width:140px; padding:12px 16px; background:linear-gradient(135deg,#8a3cff,#d4af37); color:#fff; text-align:center; text-decoration:none; border-radius:10px; font-weight:700; font-family:Orbitron,sans-serif; font-size:0.78rem; letter-spacing:1px; cursor:pointer; border:none;">DESCARGAR APK</a>` : ''}
              ${!isRequired ? `<button id="appUpdateLater" style="flex:1; min-width:140px; padding:12px 16px; background:rgba(255,255,255,0.05); color:#a499b8; border:1px solid rgba(212,175,55,0.2); border-radius:10px; font-weight:600; font-size:0.78rem; font-family:inherit; cursor:pointer;">MAS TARDE</button>` : ''}
            </div>
          </div>
        `;
        document.body.appendChild(modal);
        const laterBtn = document.getElementById('appUpdateLater');
        if (laterBtn) {
          laterBtn.onclick = () => {
            const dismissedKey = 'tnsvt_update_dismissed_v' + info.versionCode;
            try { localStorage.setItem(dismissedKey, '1'); } catch(_) {}
            modal.remove();
          };
        }
        // Si es required, no se cierra con click fuera
        if (!isRequired) {
          modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
        }
      }

      // ── Multi-account journal functions ──
      async function loadAccounts() {
        if (!window.TNSVT_USER?.code) return;
        try {
          const data = await sb.getAccounts(window.TNSVT_USER.code);
          if (data && data.success) {
            _tjAccounts = data.accounts || [];
            _tjAccountsMax = data.max_accounts || 3;
            if (!_tjActiveAccountId && _tjAccounts.length > 0) {
              _tjActiveAccountId = _tjAccounts[0].id;
            }
            try { localStorage.setItem('tnsvt:tj:active_account', String(_tjActiveAccountId || '')); } catch (e) {}
            renderAccountSelector();
          }
        } catch (e) {
          console.warn('[accounts] load:', e);
        }
      }
      function renderAccountSelector() {
        const wrap = document.getElementById('tj-account-selector');
        if (!wrap) return;
        const isReadOnly = !!window._journalViewingCode;
        if (isReadOnly) {
          wrap.innerHTML = '';
          wrap.style.display = 'none';
          return;
        }
        wrap.style.display = 'flex';

        const options = _tjAccounts.map(a => {
          const sel = a.id === _tjActiveAccountId ? ' selected' : '';
          return `<option value="${a.id}"${sel}>${a.color ? '<span style="color:'+a.color+'">●</span> ' : ''}${escapeHtml(a.name)} ($${a.account_size.toLocaleString('en')})</option>`;
        }).join('');

        const max = _tjAccountsMax;
        const count = _tjAccounts.length;
        const canCreate = count < max;

        wrap.innerHTML = `
          <label style="font-size:0.7rem;color:var(--gold);font-family:'Orbitron',sans-serif;letter-spacing:1px;display:flex;align-items:center;gap:8px;">
            💰 CUENTA:
            <select id="tj-active-account" style="background:rgba(0,0,0,0.4);border:1px solid rgba(212,175,55,0.4);color:#fff;padding:4px 8px;border-radius:6px;font-size:0.75rem;font-family:inherit;">
              ${options}
            </select>
            <span style="font-size:0.62rem;color:#a499b8;">${count}/${max}</span>
            <button type="button" onclick="tjShowCreateAccount()" style="background:${canCreate ? 'rgba(52,199,89,0.15)' : 'rgba(120,120,120,0.15)'};border:1px solid ${canCreate ? 'rgba(52,199,89,0.4)' : 'rgba(120,120,120,0.3)'};color:${canCreate ? '#34c759' : '#888'};padding:3px 8px;border-radius:4px;cursor:${canCreate ? 'pointer' : 'not-allowed'};font-size:0.65rem;" ${canCreate ? '' : 'disabled title="Plan actual: '+max+'/'+max+' cuentas"'}>+ Nueva</button>
            <button type="button" onclick="tjShowManageAccount()" style="background:rgba(138,60,255,0.15);border:1px solid rgba(138,60,255,0.4);color:#a499b8;padding:3px 8px;border-radius:4px;cursor:pointer;font-size:0.65rem;" title="Editar / eliminar">⚙️</button>
          </label>
        `;
      }
      function selectAccount(id) {
        _tjActiveAccountId = id;
        try { localStorage.setItem('tnsvt:tj:active_account', String(id)); } catch (e) {}
        renderAccountSelector();
        loadJournalFromApi();
      }
      async function tjShowCreateAccount() {
        if (_tjAccounts.length >= _tjAccountsMax) {
          showToast('Ya tenés ' + _tjAccountsMax + '/' + _tjAccountsMax + ' cuentas. Elimina una primero.');
          return;
        }
        const name = prompt('Nombre de la cuenta (ej. Swing Trading, Futuros, Crypto):');
        if (!name) return;
        if (_tjAccounts.find(a => a.name === name)) {
          showToast('Ya tenés una cuenta con ese nombre');
          return;
        }
        const size = prompt('Balance inicial en USD (ej. 5000, 10000):', '5000');
        if (!size) return;
        const accountSize = parseFloat(size);
        if (isNaN(accountSize) || accountSize <= 0) {
          showToast('Balance inválido');
          return;
        }
        const colors = ['#d4af37', '#8a3cff', '#34c759', '#ff3b30', '#ff8a00'];
        const color = colors[(_tjAccounts.length) % colors.length];
        const icons = ['💰', '📈', '📉', '🎯', '⚡', '💎', '🔥'];
        const icon = icons[(_tjAccounts.length) % icons.length];

        try {
          const data = await sb.createAccount({ name, account_size: accountSize, color, icon }, window.TNSVT_USER.code);
          if (data && data.success) {
            showToast('✅ Cuenta creada: ' + name);
            await loadAccounts();
            selectAccount(data.account.id);
          } else {
            showToast('Error: ' + (data.error || 'no se pudo crear'));
          }
        } catch (e) {
          showToast('❌ Error creando cuenta');
        }
      }
      async function tjShowManageAccount() {
        if (_tjAccounts.length === 0) return;
        const list = _tjAccounts.map((a, i) => `${i+1}. ${a.icon || '💰'} ${a.name} ($${a.account_size.toLocaleString('en')})`).join('\\n');
        const action = prompt(
          'Cuentas:\\n' + list + '\\n\\n' +
          'Escribí:\\n' +
          '  • "editar <numero>" para editar\\n' +
          '  • "eliminar <numero>" para soft-delete\\n' +
          '  • "cancelar" para salir'
        );
        if (!action || action === 'cancelar') return;
        const [op, numStr] = action.split(' ');
        const idx = parseInt(numStr) - 1;
        if (isNaN(idx) || idx < 0 || idx >= _tjAccounts.length) {
          showToast('Número inválido');
          return;
        }
        const acc = _tjAccounts[idx];
        if (op === 'editar') {
          const newName = prompt('Nuevo nombre:', acc.name);
          if (!newName) return;
          const newSize = prompt('Nuevo balance inicial USD:', String(acc.account_size));
          if (!newSize) return;
          const sz = parseFloat(newSize);
          if (isNaN(sz) || sz <= 0) { showToast('Balance inválido'); return; }
          try {
            await sb.updateAccount(acc.id, { name: newName, account_size: sz }, window.TNSVT_USER.code);
            showToast('✅ Cuenta actualizada');
            await loadAccounts();
          } catch (e) { showToast('❌ Error actualizando'); }
        } else if (op === 'eliminar') {
          if (!confirm(`¿Eliminar "${acc.name}"? Los trades se preservan y se pueden recuperar.`)) return;
          try {
            await sb.deleteAccount(acc.id, window.TNSVT_USER.code);
            showToast('🗑️ Cuenta eliminada (trades preservados)');
            if (_tjActiveAccountId === acc.id && _tjAccounts.length > 1) {
              _tjActiveAccountId = _tjAccounts[0].id === acc.id ? _tjAccounts[1].id : _tjAccounts[0].id;
            }
            await loadAccounts();
            loadJournalFromApi();
          } catch (e) { showToast('❌ Error eliminando'); }
        }
      }
      window.tjShowCreateAccount = tjShowCreateAccount;
      window.tjShowManageAccount = tjShowManageAccount;

      async function loadJournalFromApi(targetCode) {
        if (!window.TNSVT_USER) return;
        const code = targetCode || window.TNSVT_USER.code;
        window._journalViewingCode = targetCode || null;
        window._journalViewingName = null;
        try {
          const accountId = (!targetCode && _tjActiveAccountId) ? _tjActiveAccountId : null;
          const data = await sb.getJournal(code, accountId);
          if (data && data.success && data.trades) {
            tjTrades = data.trades;
            window._journalScope = data.scope || 'owner';
            window._journalStats = data.stats || null;
            tjLoaded = true;
          } else {
            tjTrades = [];
            tjLoaded = false;
          }
        } catch(e) { console.warn('[journal] loadJournalFromApi:', e); }
        tjRefresh();
      }

      window.viewUserJournal = function(code, name) {
        window._journalViewingName = name;
        // Cancelar cualquier edición en curso antes de cambiar de journal
        if (typeof tjCancelEdit === 'function') tjCancelEdit();
        switchTab('tab-journal');
        loadJournalFromApi(code);
      };

      window.backToMyJournal = function() {
        window._journalViewingCode = null;
        window._journalViewingName = null;
        window._journalScope = 'owner';
        window._journalStats = null;
        loadJournalFromApi();
      };

      // ========== LEADERBOARD ==========
      let lbData = [];
      let lbSortField = 'total_pnl';
      let lbSortDir = -1;

      async function lbRefresh() {
        const loading = document.getElementById('lb-loading');
        const empty = document.getElementById('lb-empty');
        const grid = document.getElementById('lb-grid');
        const signalsEl = document.getElementById('lb-signals');
        console.log('[LB] lbRefresh called, loading?', !!loading, 'grid?', !!grid);
        let loadingTimer = setTimeout(() => { if (loading) loading.style.display = 'none'; }, 8000);
        if (loading) loading.style.display = 'block';
        if (empty) empty.style.display = 'none';
        if (grid) grid.style.display = 'none';
        try {
          // Fetch directo con credentials para que use la sesión
          const [rankings, signals] = await Promise.all([
            fetch('/api/leaderboard', { credentials: 'include' }).then(r => r.json()).catch((e) => { console.warn('[LB] leaderboard error:', e); return []; }),
            fetch('/api/feed?category=' + encodeURIComponent('señales'), { credentials: 'include' }).then(r => r.json()).catch((e) => { console.warn('[LB] signals error:', e); return []; })
          ]);
          console.log('[LB] rankings:', rankings, 'signals:', signals);
          lbData = rankings || [];
          if (grid) {
            if (lbData.length === 0) {
              if (empty) empty.style.display = 'block';
              grid.style.display = 'none';
            } else {
              grid.style.display = 'block';
              lbRenderGrid();
            }
          }
          if (signalsEl) {
            if (signals && signals.length > 0) {
              signalsEl.innerHTML = signals.slice(0, 10).map(s => {
                const text = (s.text || '').substring(0, 120);
                const signal = s.signal || {};
                const sigInfo = signal.asset ? `<span style="color:var(--gold-bright);font-size:0.78rem;">${signal.asset} ${signal.dir || ''} ${signal.entry || ''}</span>` : '';
                return `<div style="background:rgba(9,5,18,0.7);border:1px solid rgba(212,175,55,0.12);border-radius:8px;padding:10px 14px;">
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div><strong style="color:#fff;font-size:0.82rem;">${escapeHtml(s.author_name || '')}</strong>
                      <span style="color:#645a78;font-size:0.7rem;margin-left:8px;">${s.created_at ? new Date(s.created_at).toLocaleString('es') : ''}</span>
                    </div>
                    <button class="post-btn" style="font-size:0.65rem;padding:4px 10px;" onclick="lbCopySignal('${escapeHtml(signal.asset || '')}','${escapeHtml(signal.dir || 'BUY')}','${escapeHtml(signal.entry || '')}')">📋 Copiar</button>
                  </div>
                  <div style="margin-top:4px;color:#e2dcf0;font-size:0.78rem;">${escapeHtml(text)}</div>
                  ${sigInfo ? `<div style="margin-top:4px;">${sigInfo}</div>` : ''}
                </div>`;
              }).join('');
            } else {
              signalsEl.innerHTML = '<div style="text-align:center;padding:20px;color:#645a78;">No hay señales públicas recientes.</div>';
            }
          }
        } catch(e) { console.warn('[leaderboard] error:', e); }
        clearTimeout(loadingTimer);
        if (loading) loading.style.display = 'none';
      }

      function lbRenderGrid() {
        const grid = document.getElementById('lb-grid');
        if (!grid) return;
        const userCode = window.TNSVT_USER?.code;
        const sorted = [...lbData].sort((a, b) => {
          const va = a[lbSortField] ?? 0;
          const vb = b[lbSortField] ?? 0;
          return (va < vb ? -1 : va > vb ? 1 : 0) * lbSortDir;
        });
        const headers = [
          { key: 'total_pnl', label: 'PNL' },
          { key: 'win_rate', label: 'WR%' },
          { key: 'profit_factor', label: 'PF' },
          { key: 'total_trades', label: 'Trades' },
        ];
        grid.innerHTML = `<div style="background:rgba(13,8,24,0.7);border:1px solid rgba(212,175,55,0.15);border-radius:12px;overflow:hidden;">
          <table style="width:100%;border-collapse:collapse;font-size:0.78rem;">
            <thead><tr style="background:rgba(212,175,55,0.08);">
              <th style="padding:10px 12px;text-align:left;color:var(--gold);font-size:0.6rem;letter-spacing:1px;">#</th>
              <th style="padding:10px 12px;text-align:left;color:var(--gold);font-size:0.6rem;letter-spacing:1px;">Trader</th>
              ${headers.map(h => `<th style="padding:10px 8px;text-align:right;color:var(--gold);font-size:0.6rem;letter-spacing:1px;cursor:pointer;" onclick="lbSort('${h.key}')">${h.label} ${lbSortField === h.key ? (lbSortDir === -1 ? '▼' : '▲') : ''}</th>`).join('')}
            </tr></thead>
            <tbody>${sorted.map((t, i) => {
              const isMe = t.code === userCode;
              const rank = i + 1;
              const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank + '';
              const pnlColor = t.total_pnl >= 0 ? '#34c759' : 'var(--red-impact)';
              return `<tr style="${isMe ? 'background:rgba(138,60,255,0.08);' : ''}border-bottom:1px solid rgba(212,175,55,0.06);">
                <td style="padding:10px 12px;color:#645a78;font-size:0.7rem;">${medal}</td>
                <td style="padding:10px 12px;"><strong style="color:${isMe ? 'var(--gold-bright)' : '#fff'};">${escapeHtml(t.name || t.code)}</strong></td>
                <td style="padding:10px 8px;text-align:right;color:${pnlColor};font-weight:600;">${t.total_pnl >= 0 ? '+' : ''}$${(t.total_pnl).toLocaleString('en', {minimumFractionDigits: 2})}</td>
                <td style="padding:10px 8px;text-align:right;color:#e2dcf0;">${t.win_rate}%</td>
                <td style="padding:10px 8px;text-align:right;color:#e2dcf0;">${t.profit_factor === 999 ? '∞' : t.profit_factor.toFixed(2)}</td>
                <td style="padding:10px 8px;text-align:right;color:#645a78;">${t.total_trades} (${t.wins}W / ${t.losses}L)</td>
              </tr>`;
            }).join('')}</tbody>
          </table>
        </div>`;
      }

      function lbSort(field) {
        if (lbSortField === field) lbSortDir *= -1;
        else { lbSortField = field; lbSortDir = -1; }
        lbRenderGrid();
      }
      window.lbSort = lbSort;

      function lbCopySignal(asset, dir, entry) {
        if (!asset) return showToast('Señal sin activo');
        document.getElementById('tj-f-asset').value = asset;
        document.getElementById('tj-f-dir').value = dir || 'BUY';
        if (entry) document.getElementById('tj-f-entry').value = entry;
        switchTab('tab-journal');
        tjTab('tj-log', document.querySelector('.tj-tab:nth-child(2)'));
        showToast('✅ Señal copiada al journal — revisá los datos y registrá');
      }
      window.lbCopySignal = lbCopySignal;
      window.lbRefresh = lbRefresh;

      // Asegurar que todas las funciones estén disponibles globalmente
      window.verifyGateKey = verifyGateKey;
      window.logout = logout;
      window.handleNodeClick = handleNodeClick;
      window.clickTriggerCircle = clickTriggerCircle;
      window.closeModule = closeModule;
      window.markAsLearned = markAsLearned;
      window.tjImgFull = tjImgFull;
      window.toggleComments = toggleComments;
      window.submitComment = submitComment;
      window.switchCalTab = switchCalTab;
      window.handleAcadCard = handleAcadCard;
      window.playLessonSafe = playLessonSafe;
      window.openModule = openModule;
      window.closeTradingPanel = closeTradingPanel;
      window.switchTab = switchTab;
      window.mcNav2 = mcNav2;
      window.mcShowNode = mcShowNode;
      window.mcCalcInterest = mcCalcInterest;
      window.mcCycle = mcCycle;
      window.mcToggleAcc = mcToggleAcc;
      window.mcScen = mcScen;
      window.mcAnswer = mcAnswer;
      window.mcResetQuiz = mcResetQuiz;
      window.geoQ = geoQ;
      window.loadTasks = loadTasks;
      window.toggleTask = toggleTask;
      window.updateInnerLocks = updateInnerLocks;
      window.tjTab = tjTab;
      window.tjPhotoPreview = tjPhotoPreview;
      window.tjPhotoRemove = tjPhotoRemove;
      window.tjAddTrade = tjAddTrade;
      window.tjDeleteTrade = tjDeleteTrade;
      window.tjEditTrade = tjEditTrade;
      window.tjExport = tjExport;
      window.tjImport = tjImport;
      window.tjPeriod = tjPeriod;
      window.tjRefresh = tjRefresh;
      window.tjCalNav = tjCalNav;
      window.openTjDay = openTjDay;
      window.closeTjDay = closeTjDay;
      window.filterFeed = filterFeed;
      window.selPostCat = selPostCat;
      window.createNewPost = createNewPost;
      window.likeFeedPost = likeFeedPost;
      window.deletePost = deletePost;
      window.attachPostPhoto = attachPostPhoto;
      window.removePostPhoto = removePostPhoto;
      window.attachSignalPhoto = attachSignalPhoto;
      window.removeSignalPhoto = removeSignalPhoto;
      window.attachCommentPhoto = attachCommentPhoto;
      window.removeCommentPhoto = removeCommentPhoto;
      window.renderFeed = renderFeed;
      window.initFeedRealtime = initFeedRealtime;
      window.renderAcademia = renderAcademia;
      window.openAcadCourse = openAcadCourse;
      window.closeAcadVideo = closeAcadVideo;
      window.openAdminPanel = openAdminPanel;
      window.closeAdminPanel = closeAdminPanel;
      window.checkAdminPass = checkAdminPass;
      window.adminSaveCourse = adminSaveCourse;
      window.adminEditCourse = adminEditCourse;
      window.adminDeleteCourse = adminDeleteCourse;
      window.adminClearForm = adminClearForm;
      window.adminRefreshList = adminRefreshList;
      window.adminShowCreateForm = adminShowCreateForm;
      window.adminShowEditForm = adminShowEditForm;
      window.adminCancelForm = adminCancelForm;
      window.adminSaveUser = adminSaveUser;
      window.adminToggleActive = adminToggleActive;
      window.adminDeleteUser = adminDeleteUser;
      window.adminCreateBatch = adminCreateBatch;
      window.adminShowSubtab = adminShowSubtab;
      window.adminRefreshTasks = adminRefreshTasks;
      window.adminShowTaskCreateForm = adminShowTaskCreateForm;
      window.adminShowTaskEditForm = adminShowTaskEditForm;
      window.adminCancelTaskForm = adminCancelTaskForm;
      window.adminSaveTask = adminSaveTask;
      window.adminDeleteTask = adminDeleteTask;
      window.adminToggleTaskActive = adminToggleTaskActive;
      window.toggleAdminPassField = toggleAdminPassField;
      window.playLesson = playLesson;
      window.loadChats = loadChats;
      window.openNewDmModal = openNewDmModal;
      window.closeNewDmModal = closeNewDmModal;
      window.filterNewDmList = filterNewDmList;
      window.startDmWith = startDmWith;
      window.sendChatMessage = sendChatMessage;
      window.selectConversation = selectConversation;
      window.attachChatPhoto = attachChatPhoto;
      window.removeChatPhoto = removeChatPhoto;
      window.openChatLightbox = openChatLightbox;

      // Chat UI extras (silenciar, reply, menu, typing indicator)
      let chatSoundOn = true;
      function toggleChatSound(){
        chatSoundOn = !chatSoundOn;
        try { localStorage.setItem('tnsvt_chat_sound', chatSoundOn ? '1' : '0'); } catch(e){}
        const btn = document.getElementById('chatSoundBtn');
        if(btn){ btn.textContent = chatSoundOn ? '🔔' : '🔕'; btn.title = chatSoundOn ? 'Sonido activo' : 'Sonido silenciado'; }
        showToast(chatSoundOn ? '🔔 Sonido activado' : '🔕 Sonido silenciado', 1500);
      }
      window.toggleChatSound = toggleChatSound;
      // Restaurar preferencia al cargar
      try { const s = localStorage.getItem('tnsvt_chat_sound'); if(s === '0'){ chatSoundOn = false; const b = document.getElementById('chatSoundBtn'); if(b) b.textContent='🔕'; } } catch(e){}

      // Borrar la conversacion activa (boton del dropdown)
      async function deleteConversation(){
        if(!activeConvId){
          showToast('Selecciona una conversación primero', 2000);
          return;
        }
        const conv = chatConversations.find(c => c.id === activeConvId);
        if(!conv) return;
        const name = convDisplayName(conv);
        if(!confirm(`¿Eliminar la conversación con "${name}"?\n\nEsta acción no se puede deshacer.`)){
          return;
        }
        try{
          await sb.deleteConversation(activeConvId, window.TNSVT_USER.code);
          // Quitar del array local
          chatConversations = chatConversations.filter(c => c.id !== activeConvId);
          window.chatConversations = chatConversations;
          activeConvId = null;
          // Limpiar UI
          const stream = document.getElementById('chatStream');
          if(stream) stream.innerHTML = '<div class="chat-empty"><div class="chat-empty-icon">💬</div>Elegí una conversación para empezar</div>';
          const nameEl = document.getElementById('chatHeaderName');
          const subEl = document.getElementById('chatHeaderSub');
          if(nameEl) nameEl.textContent = '—';
          if(subEl) subEl.textContent = 'Seleccioná una conversación';
          const avEl = document.getElementById('chatHeaderAvatar');
          if(avEl){ avEl.innerHTML = '?'; avEl.style.background = 'linear-gradient(135deg,var(--violet),#4a1a8a)'; }
          renderConversations();
          showToast('🗑️ Conversación eliminada');
        }catch(e){
          console.error('[chat] delete error:', e);
          showToast('❌ No pude eliminar: ' + (e.message || 'error'));
        }
      }
      window.deleteConversation = deleteConversation;

      function onChatTyping(){
        // Por ahora solo marcamos un flag local. Si el backend implementa typing broadcasts, se envia aca.
        if(!activeConvId || !window.TNSVT_USER) return;
        // Stub: en el futuro hacer POST /api/chat/typing cada 3s con throttle
      }
      window.onChatTyping = onChatTyping;

      

      
      window.initAllPanels = initAllPanels;
      window.musicToggle = musicToggle;
      window.musicSetVolume = musicSetVolume;
      window.musicMinimize = musicMinimize;
      window.musicExpand = musicExpand;
      window.musicLoad = musicLoad;
      window.musicInit = musicInit;
      window.musicPrev = musicPrev;
      window.musicNext = musicNext;
      window.musicSelectTrack = musicSelectTrack;
      window.musicCycleLoop = musicCycleLoop;
      window.musicToggleQueue = musicToggleQueue;
      window.musicShowBar = musicShowBar;
      window.musicHideBar = musicHideBar;
      window.musicShowFullPlayer = musicShowFullPlayer;
      window.musicHideFullPlayer = musicHideFullPlayer;
      window.musicSeekBar = musicSeekBar;
      window.musicBarDebugInfo = musicBarDebugInfo;
      window.appCheckForUpdates = appCheckForUpdates;
      window.musicSeek = musicSeek;
      window.adminMusicRefresh = adminMusicRefresh;
      window.adminMusicUpload = adminMusicUpload;
      window.adminMusicClearAll = adminMusicClearAll;
      window.adminMusicSetActive = adminMusicSetActive;
      window.adminMusicRemove = adminMusicRemove;
      window.adminMusicSetExternal = adminMusicSetExternal;

      // ==================== PLAYER DE MÚSICA DE FONDO (PLAYLIST + VISUALIZER) ====================
      var bgAudio = null;
      var bgAudioSrc = null;
      var musicPlaylist = [];
      var musicActiveIndex = 0;
      var musicLoop = 'all';
      var musicAudioCtx = null;
      var musicAnalyser = null;
      var musicSourceNode = null;
      var musicVizRAF = null;
      var musicVizActive = false;
      var musicUserIsAdvancing = false;

      function musicGetAudio() {
        if (!bgAudio) bgAudio = document.getElementById('bgMusicAudio');
        return bgAudio;
      }
      function musicSetBtnState(playing) {
        const btn = document.getElementById('musicToggleBtn');
        if (!btn) return;
        btn.innerHTML = playing ? '⏸' : '▶';
        btn.title = playing ? 'Pausar' : 'Reproducir';
        // Sincronizar barra persistente
        const pbtn = document.getElementById('mpbPlayBtn');
        if (pbtn) { pbtn.innerHTML = playing ? '⏸' : '▶'; pbtn.title = playing ? 'Pausar' : 'Reproducir'; }
        const cover = document.getElementById('mpbCover');
        if (cover) cover.classList.toggle('playing', !!playing);
      }
      function musicGetLoopIcon() {
        if (musicLoop === 'all') return '🔁';
        if (musicLoop === 'one') return '🔂';
        return '➡️';
      }
      function musicGetLoopTitle() {
        if (musicLoop === 'all') return 'Loop: Toda la playlist (click para cambiar)';
        if (musicLoop === 'one') return 'Loop: Solo este track (click para cambiar)';
        return 'Loop: Apagado (click para cambiar)';
      }
      function musicUpdateLoopBtn() {
        const b = document.getElementById('musicLoopBtn');
        if (b) { b.innerHTML = musicGetLoopIcon(); b.title = musicGetLoopTitle(); }
      }
      function musicUpdateHeaderUI() {
        const t = document.getElementById('musicTitle');
        const c = document.getElementById('musicTrackCount');
        const qb = document.getElementById('musicQueueBadge');
        const track = musicPlaylist[musicActiveIndex] || null;
        if (t) t.innerHTML = track ? ('🎵 ' + track.name + (track.source === 'external' ? ' 🌐' : '')) : 'Sin música';
        if (c) c.innerHTML = (musicPlaylist.length > 0) ? ((musicActiveIndex + 1) + '/' + musicPlaylist.length) : '0/0';
        if (qb) {
          if (musicPlaylist.length > 1) {
            qb.style.display = 'inline-block';
            qb.textContent = musicPlaylist.length;
          } else {
            qb.style.display = 'none';
          }
        }
        // Sincronizar barra persistente
        const bt = document.getElementById('mpbTitle');
        const bs = document.getElementById('mpbSub');
        if (bt) bt.textContent = track ? track.name : 'Sin música';
        if (bs) bs.textContent = (musicPlaylist.length > 0) ? ((musicActiveIndex + 1) + ' / ' + musicPlaylist.length + ' — T.N.S.V.T') : 'T.N.S.V.T';
        musicUpdateLoopBtn();
      }
      function musicRenderQueue() {
        const list = document.getElementById('musicQueueList');
        const empty = document.getElementById('musicQueueEmpty');
        if (!list) return;
        if (musicPlaylist.length === 0) {
          list.innerHTML = '';
          if (empty) empty.style.display = 'block';
          return;
        }
        if (empty) empty.style.display = 'none';
        list.innerHTML = musicPlaylist.map((t, i) => {
          const isActive = i === musicActiveIndex;
          const icon = t.source === 'external' ? '🌐' : '📁';
          return `
            <div data-qidx="${i}" style="display:flex; align-items:center; gap:8px; padding:8px 10px; border-radius:8px; margin-bottom:4px; cursor:pointer; transition:all 0.2s; ${isActive ? 'background:rgba(212,175,55,0.15); border:1px solid rgba(212,175,55,0.4);' : 'background:rgba(0,0,0,0.3); border:1px solid transparent;'}" onmouseover="if(this.dataset.qidx!='${musicActiveIndex}')this.style.background='rgba(138,60,255,0.1)'" onmouseout="if(this.dataset.qidx!='${musicActiveIndex}')this.style.background='rgba(0,0,0,0.3)'">
              <span style="font-size:0.9rem; flex-shrink:0;">${icon}</span>
              <div style="flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:0.78rem; color:${isActive ? 'var(--gold-bright)' : '#e2dcf0'}; font-weight:${isActive ? '600' : '400'};">${(t.name || 'Track').replace(/</g, '&lt;')}</div>
              ${isActive ? '<span style="color:var(--gold-bright); font-size:0.7rem;">▶</span>' : ''}
            </div>`;
        }).join('');
        list.querySelectorAll('[data-qidx]').forEach(el => {
          el.addEventListener('click', () => {
            const idx = parseInt(el.dataset.qidx, 10);
            if (!isNaN(idx)) musicSelectTrack(idx);
          });
        });
      }
      function musicToggleQueue() {
        const p = document.getElementById('musicQueuePanel');
        if (!p) return;
        if (p.style.display === 'none' || !p.style.display) {
          musicRenderQueue();
          p.style.display = 'block';
        } else {
          p.style.display = 'none';
        }
      }
      
      async function musicLoad(preservePlayback) {
        const a = musicGetAudio();
        if (!a) return;
        try {
          const data = await API.get('/api/music');
          musicPlaylist = (data && data.playlist) ? data.playlist : [];
          musicActiveIndex = (data && typeof data.activeIndex === 'number') ? data.activeIndex : 0;
          musicLoop = (data && data.loop) ? data.loop : 'all';
          const track = musicPlaylist[musicActiveIndex] || null;
          if (track) {
            const newSrc = '/api/music/stream?id=' + encodeURIComponent(track.id) + '&t=' + Date.now();
            if (bgAudioSrc !== newSrc) {
              const wasPlaying = !a.paused && !a.ended;
              a.src = newSrc;
              bgAudioSrc = newSrc;
              a.load();
              a.volume = (parseInt(localStorage.getItem('tnsvt_music_vol')||'35', 10)) / 100;
              const v = document.getElementById('musicVolume');
              if (v) v.value = (a.volume * 100);
              if (preservePlayback && wasPlaying) {
                try { await a.play(); } catch (_) {}
              }
            }
            musicUpdateHeaderUI();
            musicRenderQueue();
          } else {
            a.pause();
            a.removeAttribute('src');
            a.load();
            bgAudioSrc = null;
            musicUpdateHeaderUI();
            musicRenderQueue();
            musicSetBtnState(false);
          }
        } catch (e) {
          musicUpdateHeaderUI();
        }
      }
      async function musicSelectTrack(idx, autoplay) {
        if (idx < 0 || idx >= musicPlaylist.length) return;
        musicActiveIndex = idx;
        musicUserIsAdvancing = true;
        const a = musicGetAudio();
        const track = musicPlaylist[idx];
        a.src = '/api/music/stream?id=' + encodeURIComponent(track.id) + '&t=' + Date.now();
        bgAudioSrc = a.src;
        a.load();
        musicUpdateHeaderUI();
        musicRenderQueue();
        if (autoplay !== false) {
          try { await a.play(); } catch (e) { console.warn('autoplay falló', e); }
        }
        musicUserIsAdvancing = false;
      }
      async function musicNext() {
        if (musicPlaylist.length === 0) return;
        const next = (musicActiveIndex + 1) % musicPlaylist.length;
        await musicSelectTrack(next);
      }
      async function musicPrev() {
        if (musicPlaylist.length === 0) return;
        const prev = (musicActiveIndex - 1 + musicPlaylist.length) % musicPlaylist.length;
        await musicSelectTrack(prev);
      }
      async function musicToggle() {
        const a = musicGetAudio();
        if (!a) return;
        if (!a.src || musicPlaylist.length === 0) {
          await musicLoad();
          if (musicPlaylist.length === 0) { showToast('🎵 El admin aún no subió música'); return; }
        }
        if (a.paused) {
          try {
            await a.play();
            musicSetBtnState(true);
            try { localStorage.setItem('tnsvt_music_autoplay', '1'); } catch (_) {}
          } catch (e) {
            showToast('❌ No se pudo reproducir: ' + (e.message||''));
          }
        } else {
          a.pause();
          musicSetBtnState(false);
        }
      }
      function musicAutoplayOnFirstInteraction() {
        try { if (localStorage.getItem('tnsvt_music_autoplay') !== '1') return; } catch (_) { return; }
        if (musicPlaylist.length === 0) return;
        const a = musicGetAudio();
        if (!a || !a.src) return;
        const tryPlay = () => {
          a.play().then(() => {
            musicSetBtnState(true);
            document.removeEventListener('click', tryPlay);
            document.removeEventListener('keydown', tryPlay);
            document.removeEventListener('touchstart', tryPlay);
          }).catch(() => {});
        };
        document.addEventListener('click', tryPlay, { once: true });
        document.addEventListener('keydown', tryPlay, { once: true });
        document.addEventListener('touchstart', tryPlay, { once: true });
      }
      function musicSetVolume(v) {
        const a = musicGetAudio();
        const vol = parseInt(v, 10) / 100;
        if (a) a.volume = vol;
        try { localStorage.setItem('tnsvt_music_vol', String(v)); } catch (_) {}
      }
      function musicSeek(event) {
        const a = musicGetAudio();
        const wrap = document.getElementById('musicProgressWrap');
        if (!a || !a.duration || !wrap) return;
        const rect = wrap.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
        a.currentTime = ratio * a.duration;
      }
      function musicSeekBar(event) {
        const a = musicGetAudio();
        const wrap = document.getElementById('mpbBar');
        if (!a || !a.duration || !wrap) return;
        const rect = wrap.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
        a.currentTime = ratio * a.duration;
      }
      function musicFormatTime(sec) {
        if (!isFinite(sec) || sec < 0) sec = 0;
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return m + ':' + (s < 10 ? '0' : '') + s;
      }
      function musicUpdateProgress() {
        const a = musicGetAudio();
        const bar = document.getElementById('musicProgressBar');
        if (!a || !bar) return;
        if (a.duration && isFinite(a.duration)) {
          const pct = (a.currentTime / a.duration) * 100;
          bar.style.width = pct + '%';
        } else {
          bar.style.width = '0%';
        }
        // Sincronizar barra persistente
        const pfill = document.getElementById('mpbBarFill');
        const ptCur = document.getElementById('mpbTimeCur');
        const ptDur = document.getElementById('mpbTimeDur');
        if (pfill) {
          if (a.duration && isFinite(a.duration)) {
            pfill.style.width = ((a.currentTime / a.duration) * 100) + '%';
          } else {
            pfill.style.width = '0%';
          }
        }
        if (ptCur) ptCur.textContent = musicFormatTime(a.currentTime || 0);
        if (ptDur) ptDur.textContent = musicFormatTime(a.duration || 0);
      }
      function musicMinimize() {
        document.getElementById('musicPlayer').style.display = 'none';
        document.getElementById('musicPlayerMini').style.display = 'block';
      }
      function musicExpand() {
        document.getElementById('musicPlayer').style.display = 'flex';
        document.getElementById('musicPlayerMini').style.display = 'none';
      }
      // ====== BARRA PERSISTENTE (Spotify-style) ======
      function musicBarDebugInfo() {
        try {
          const bar = document.getElementById('musicPlayerBar');
          if (!bar) { console.warn('[TNSVT music] BAR NOT IN DOM'); return; }
          const cs = getComputedStyle(bar);
          const rect = bar.getBoundingClientRect();
          const vw = window.innerWidth, vh = window.innerHeight;
          const parent = bar.parentElement;
          const grand = parent && parent.parentElement;
          const getInfo = (el) => el ? {
            tag: el.tagName,
            id: el.id || '(none)',
            class: el.className || '(none)',
            display: getComputedStyle(el).display,
            position: getComputedStyle(el).position
          } : null;
          console.log('[TNSVT music] bar state', {
            display: cs.display,
            position: cs.position,
            zIndex: cs.zIndex,
            bottom: cs.bottom,
            top: cs.top,
            left: cs.left,
            right: cs.right,
            height: cs.height,
            width: cs.width,
            rectTop: Math.round(rect.top),
            rectBottom: Math.round(rect.bottom),
            rectHeight: Math.round(rect.height),
            viewport: vw + 'x' + vh,
            inViewport: rect.top < vh && rect.bottom > 0,
            bodyClasses: document.body.className,
            inlineDisplay: bar.style.display || '(none)',
            parent: getInfo(parent),
            grandparent: getInfo(grand)
          });
        } catch (e) { console.warn('[TNSVT music] debug failed', e); }
      }
      // Aplica visibilidad de elementos UI que dependen de isAdmin
      // Llamar después del login Y después del session restore
      function applyAdminFeatures(isAdmin) {
        const adminBtn = document.getElementById('adminSidebarBtn');
        if (adminBtn) adminBtn.style.display = isAdmin ? 'block' : 'none';
        const chartBtn = document.getElementById('chartSidebarBtn');
        if (chartBtn) chartBtn.style.display = isAdmin ? 'block' : 'none';
        // También actualizar window.TNSVT_USER.isAdmin
        if (window.TNSVT_USER) {
          window.TNSVT_USER.isAdmin = !!isAdmin;
        }
        console.log('[admin] applyAdminFeatures(isAdmin=' + isAdmin + ')');
      }
      window.applyAdminFeatures = applyAdminFeatures;

      function musicShowBar() {
        const bar = document.getElementById('musicPlayerBar');
        document.body.classList.add('music-bar-active');
        if (bar) {
          bar.classList.add('visible');
          bar.style.display = 'flex'; /* inline = mas confiable que el class */
        }
        // Loguear estado real despues de un tick (asi el browser ya aplico estilos)
        setTimeout(musicBarDebugInfo, 50);
      }
      function musicHideBar() {
        const bar = document.getElementById('musicPlayerBar');
        document.body.classList.remove('music-bar-active');
        if (bar) {
          bar.classList.remove('visible');
          bar.style.display = 'none';
        }
      }
      function musicShowFullPlayer() {
        // Mostrar card expandido, ocultar la mini-ball y la barra inferior
        // (Spotify-style: solo una vista visible a la vez)
        const p = document.getElementById('musicPlayer');
        const m = document.getElementById('musicPlayerMini');
        const b = document.getElementById('musicPlayerBar');
        if (p) p.style.display = 'flex';
        if (m) m.style.display = 'none';
        if (b) b.style.display = 'none';
        document.body.classList.remove('music-bar-active');
      }
      function musicHideFullPlayer() {
        // Cerrar card expandido y volver a la barra inferior
        const p = document.getElementById('musicPlayer');
        const m = document.getElementById('musicPlayerMini');
        const b = document.getElementById('musicPlayerBar');
        if (p) p.style.display = 'none';
        if (m) m.style.display = 'none';
        // Restaurar la barra
        if (b && window.TNSVT_USER) b.style.display = 'flex';
        if (window.TNSVT_USER) document.body.classList.add('music-bar-active');
        // También cerrar la cola si estaba abierta
        const q = document.getElementById('musicQueuePanel');
        if (q) q.style.display = 'none';
      }
      async function musicCycleLoop() {
        const order = ['all', 'one', 'off'];
        const next = order[(order.indexOf(musicLoop) + 1) % order.length];
        musicLoop = next;
        musicUpdateLoopBtn();
        try {
          await API.post('/api/music/playlist/loop', { loop: next });
        } catch (e) { console.warn('No se pudo guardar el loop', e); }
        try { localStorage.setItem('tnsvt_music_loop', next); } catch (_) {}
        showToast('🔁 Loop: ' + (next === 'all' ? 'Toda la playlist' : next === 'one' ? 'Solo este track' : 'Apagado'));
      }
      // ============== VISUALIZER ==============
      function musicInitAudioContext() {
        if (musicAudioCtx) return;
        try {
          const Ctx = window.AudioContext || window.webkitAudioContext;
          if (!Ctx) return;
          musicAudioCtx = new Ctx();
          musicAnalyser = musicAudioCtx.createAnalyser();
          musicAnalyser.fftSize = 64;
          musicAnalyser.smoothingTimeConstant = 0.75;
          const a = musicGetAudio();
          if (a) {
            try {
              musicSourceNode = musicAudioCtx.createMediaElementSource(a);
              musicSourceNode.connect(musicAnalyser);
              musicAnalyser.connect(musicAudioCtx.destination);
            } catch (e) { console.warn('No se pudo conectar el source al analyser:', e); }
          }
        } catch (e) { console.warn('AudioContext no disponible:', e); }
      }
      function musicDrawViz() {
        if (!musicVizActive) return;
        const cv = document.getElementById('musicVisualizer');
        const cvMini = document.getElementById('musicMiniVisualizer');
        const cvBar = document.getElementById('mpbViz');
        const a = musicGetAudio();
        const playing = a && !a.paused && !a.ended;
        if (cv) musicDrawOnCanvas(cv, playing);
        if (cvMini) musicDrawOnCanvas(cvMini, playing, true);
        if (cvBar) musicDrawOnCanvas(cvBar, playing, true);
        musicVizRAF = requestAnimationFrame(musicDrawViz);
      }
      function musicDrawOnCanvas(canvas, playing, mini) {
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        let bars = mini ? 12 : 28;
        const gap = 1;
        const barW = Math.max(1, (w - gap * (bars - 1)) / bars);
        const dataLen = musicAnalyser ? musicAnalyser.frequencyBinCount : 0;
        let dataArr = null;
        if (musicAnalyser && playing) {
          dataArr = new Uint8Array(dataLen);
          musicAnalyser.getByteFrequencyData(dataArr);
        }
        for (let i = 0; i < bars; i++) {
          let v = 0;
          if (dataArr) {
            const idx = Math.floor((i / bars) * dataLen);
            v = (dataArr[idx] || 0) / 255;
          } else {
            v = playing ? 0.3 : 0.05;
          }
          if (!playing) v = 0.05 + Math.sin((Date.now() / 600 + i * 0.5)) * 0.02;
          const barH = Math.max(2, v * h);
          const x = i * (barW + gap);
          const y = (h - barH) / 2;
          const grd = ctx.createLinearGradient(0, y, 0, y + barH);
          grd.addColorStop(0, '#d4af37');
          grd.addColorStop(1, '#8a3cff');
          ctx.fillStyle = grd;
          ctx.fillRect(x, y, barW, barH);
        }
      }
      function musicStartViz() {
        if (musicVizActive) return;
        musicInitAudioContext();
        if (musicAudioCtx && musicAudioCtx.state === 'suspended') {
          musicAudioCtx.resume().catch(() => {});
        }
        musicVizActive = true;
        musicDrawViz();
      }
      
      function musicInit() {
        const a = musicGetAudio();
        const savedVol = parseInt(localStorage.getItem('tnsvt_music_vol') || '35', 10);
        if (a) a.volume = savedVol / 100;
        const v = document.getElementById('musicVolume');
        if (v) v.value = savedVol;
        try {
          const savedLoop = localStorage.getItem('tnsvt_music_loop');
          if (savedLoop && ['all', 'one', 'off'].includes(savedLoop)) musicLoop = savedLoop;
        } catch (_) {}
        musicUpdateLoopBtn();
        a.addEventListener('play',  () => { musicSetBtnState(true); try { localStorage.setItem('tnsvt_music_autoplay', '1'); } catch (_) {} musicStartViz(); });
        a.addEventListener('pause', () => { musicSetBtnState(false); });
        a.addEventListener('ended', () => { musicSetBtnState(false); musicOnTrackEnded(); });
        a.addEventListener('error', (e) => {
          console.error('Audio error:', a.error);
          if (a.error) {
            const codes = { 1: 'ABORTED', 2: 'NETWORK', 3: 'DECODE', 4: 'SRC_NOT_SUPPORTED' };
            const codeName = codes[a.error.code] || 'UNKNOWN';
            showToast('❌ Audio error (' + codeName + '): ' + (a.error.message || ''));
          }
          musicSetBtnState(false);
        });
        a.addEventListener('timeupdate', musicUpdateProgress);
        a.addEventListener('loadedmetadata', musicUpdateProgress);
        setInterval(musicUpdateProgress, 1000);
        musicUpdateHeaderUI();
        musicLoad().then(() => musicAutoplayOnFirstInteraction());
      }
      function musicOnTrackEnded() {
        if (musicUserIsAdvancing) return;
        if (musicPlaylist.length === 0) return;
        if (musicLoop === 'one') {
          const a = musicGetAudio();
          if (a) { a.currentTime = 0; a.play().catch(() => {}); }
          return;
        }
        if (musicLoop === 'off' && musicActiveIndex === musicPlaylist.length - 1) {
          return; // No avanza si está en el último
        }
        const next = (musicActiveIndex + 1) % musicPlaylist.length;
        musicSelectTrack(next);
      }

      // ==================== SISTEMA DE NOTIFICACIONES ====================
      // Nota: notifList se inicializa al INICIO del archivo para evitar TDZ
      // cuando addNotifs() / updateBadge() se llaman antes que esta sección
      // se ejecute. Ver declaración temprana en la parte superior.
      // Acá solo recargamos datos desde localStorage.
      notifList = JSON.parse(localStorage.getItem('tnsvt_notifs') || '[]');
      var notifChannel = null;
      var pushPermGranted = false;

      // ---- Panel toggle ----
      function toggleNotifPanel() {
        const panel = document.getElementById('notifPanel');
        panel.classList.toggle('open');
        if (panel.classList.contains('open')) {
          renderNotifPanel();
          // Cerrar al click fuera
          setTimeout(() => document.addEventListener('click', closeNotifOutside), 10);
        }
      }
      function closeNotifOutside(e) {
        const wrap = document.getElementById('notifBellWrap');
        if (wrap && !wrap.contains(e.target)) {
          document.getElementById('notifPanel')?.classList.remove('open');
          document.removeEventListener('click', closeNotifOutside);
        }
      }

      // ---- Render panel: trae del BACKEND, no del localStorage ----
      async function renderNotifPanel() {
        const list = document.getElementById('notifList');
        if (!list) return;

        // Spinner mientras carga
        list.innerHTML = '<div class="notif-empty" style="opacity:.6">⏳ Cargando...</div>';

        if (!window.TNSVT_USER || !window.TNSVT_USER.code) {
          list.innerHTML = '<div class="notif-empty">🔔<br>Iniciá sesión para ver notificaciones.</div>';
          return;
        }

        try {
          const res = await fetch(`/api/notifications?user_code=${encodeURIComponent(window.TNSVT_USER.code)}`, {
            credentials: 'include'
          });
          if (!res.ok) throw new Error('HTTP ' + res.status);
          const items = await res.json();

          // Sincronizar cache local con backend (no se borra, se mergea)
          if (Array.isArray(items)) {
            notifList = items.map(n => ({
              id: String(n.id),
              type: n.type || 'dm',
              text: n.text || '',
              ts: n.ts || new Date().toISOString(),
              read: !!n.read,
              _fromBackend: true,
            }));
            saveNotifs();
            updateBadge();
          }

          if (!notifList.length) {
            list.innerHTML = '<div class="notif-empty">🔔<br>Sin notificaciones aún.<br>Las señales y actividad<br>aparecerán aquí.</div>';
            return;
          }
          list.innerHTML = notifList.slice(0, 30).map(n => renderNotifItem(n)).join('');
        } catch (e) {
          console.warn('[notif] failed to load from backend, using cache:', e);
          // Fallback a cache local si el backend no responde
          if (!notifList.length) {
            list.innerHTML = '<div class="notif-empty">🔔<br>Sin notificaciones aún.<br>Las señales y actividad<br>aparecerán aquí.</div>';
            return;
          }
          list.innerHTML = notifList.slice(0, 30).map(n => renderNotifItem(n)).join('');
        }
      }

      // ---- Render de un item: muestra tipo, de quién y preview ----
      function renderNotifItem(n) {
        const iconMap = {
          signal: '📊', like: '♥', comment: '💬', post: '✨',
          dm: '💬', mention: '📢', task: '✅', academia: '🎓',
          access_request: '🔗', access_accepted: '✅', access_rejected: '❌',
          connection_removed: '✂️', permissions_changed: '🔑',
          generic: '🔔'
        };
        const timeStr = timeAgoStr(n.ts);
        const idEscaped = String(n.id).replace(/'/g, "\\'");
        const type = n.type || 'generic';
        const title = n.title || ({ dm: 'Mensaje directo', signal: 'Nueva señal', academia: 'Academia', task: 'Tarea', comment: 'Comentario', mention: 'Mención', like: 'Reacción', post: 'Publicación', access_request: 'Solicitud de Acceso', access_accepted: 'Acceso Aceptado', access_rejected: 'Acceso Rechazado', connection_removed: 'Conexión Eliminada', permissions_changed: 'Permisos Actualizados' }[type] || 'Notificación');
        const sender = n.sender_name ? `<span class="notif-from">de <strong>${escapeHtml(n.sender_name)}</strong></span>` : '';
        const avatar = n.sender_avatar || iconMap[type] || '🔔';
        const preview = n.preview || n.text || '';
        const hasNumericId = /^\d+$/.test(String(n.id));

        return `
          <div class="notif-item ${n.read ? '' : 'unread'} type-${type}" data-type="${type}" data-related-url="${escapeHtml(n.related_url || 'feed')}" onclick="markOneRead('${idEscaped}')">
            <div class="notif-icon ${type}">${avatar}</div>
            <div class="notif-body">
              <div class="notif-title">${escapeHtml(title)} ${sender}</div>
              <div class="notif-text">${escapeHtml(preview)}</div>
              <div class="notif-time">${timeStr}</div>
            </div>
            ${hasNumericId ? `<button class="notif-delete-btn" onclick="event.stopPropagation();deleteNotif('${idEscaped}')" title="Borrar notificacion" aria-label="Borrar">✕</button>` : ''}
          </div>`;
      }

      // ---- Borrar una notificacion ----
      async function deleteNotif(id) {
        if (!window.TNSVT_USER?.code) return;
        if (!/^\d+$/.test(String(id))) return;
        if (!confirm('¿Borrar esta notificación?')) return;
        try {
          await API.deleteNotification(id, window.TNSVT_USER.code);
          // Quitar del array local
          notifList = notifList.filter(x => String(x.id) !== String(id));
          saveNotifs();
          updateBadge();
          renderNotifPanel();
          showToast('🗑️ Notificación borrada', 1800);
        } catch (e) {
          console.warn('[notif] delete:', e);
          showToast('❌ No pude borrar: ' + (e.message || 'error'));
        }
      }
      window.deleteNotif = deleteNotif;

      function timeAgoStr(ts) {
        const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
        if (diff < 1) return 'ahora mismo';
        if (diff < 60) return 'hace ' + diff + ' min';
        if (diff < 1440) return 'hace ' + Math.floor(diff/60) + 'h';
        return 'hace ' + Math.floor(diff/1440) + 'd';
      }

      // ---- Agregar notificación ----
      function addNotif(type, text) {
        const n = { id: Date.now() + '_' + Math.random().toString(36).slice(2), type, text, ts: new Date().toISOString(), read: false };
        notifList.unshift(n);
        if (notifList.length > 50) notifList = notifList.slice(0, 50);
        saveNotifs();
        updateBadge();
        showPushToast(type, text);
        if (pushPermGranted) fireBrowserNotif(type, text);
      }

      function saveNotifs() {
        localStorage.setItem('tnsvt_notifs', JSON.stringify(notifList));
      }

      function updateBadge() {
        const unread = notifList.filter(n => !n.read).length;
        const badge = document.getElementById('notifBadge');
        const bell = document.getElementById('notifBellBtn');
        if (!badge || !bell) return;
        if (unread > 0) {
          badge.textContent = unread > 9 ? '9+' : unread;
          badge.classList.add('show');
          bell.classList.add('has-notifs');
        } else {
          badge.classList.remove('show');
          bell.classList.remove('has-notifs');
        }
        // Social badge for pending access requests
        const socialBadge = document.getElementById('social-notif-badge');
        if (socialBadge) {
          const reqCount = notifList.filter(n => n.type === 'access_request' && !n.read).length;
          if (reqCount > 0) {
            socialBadge.textContent = reqCount > 9 ? '9+' : reqCount;
            socialBadge.style.display = 'inline';
          } else {
            socialBadge.style.display = 'none';
          }
        }
      }

      function markAllRead() {
        notifList.forEach(n => n.read = true);
        saveNotifs(); updateBadge(); renderNotifPanel();
        // Persistir en backend
        if (window.TNSVT_USER?.code) {
          fetch(`/api/notifications/read-all?user_code=${encodeURIComponent(window.TNSVT_USER.code)}`, {
            method: 'PUT',
            credentials: 'include'
          }).catch(e => console.warn('[notif] markAllRead backend:', e));
        }
      }

      function markOneRead(id) {
        const n = notifList.find(x => x.id === id);
        if (n) { n.read = true; saveNotifs(); updateBadge(); }
        // Persistir en backend si el id es numérico (id real de DB)
        if (window.TNSVT_USER?.code && /^\d+$/.test(String(id))) {
          fetch(`/api/notifications/${id}/read?user_code=${encodeURIComponent(window.TNSVT_USER.code)}`, {
            method: 'PUT',
            credentials: 'include'
          }).catch(e => console.warn('[notif] markOneRead backend:', e));
        }
        // Cerrar panel
        document.getElementById('notifPanel')?.classList.remove('open');
        // Ir al tab correcto segun related_url
        const relatedUrl = n?.related_url || 'feed';
        const tabMap = {
          'feed': 'tab-posts',
          'chat': 'tab-chat',
          'signals': 'tab-posts',
          'academia': 'tab-academia',
          'tasks': 'tab-tasks',
          'journal': 'tab-journal',
          'calendar': 'tab-calendar',
          'social': 'tab-social',
        };
        const tabId = tabMap[relatedUrl] || 'tab-posts';
        if (typeof switchTab === 'function') {
          switchTab(tabId);
        } else {
          // Fallback: solo highlight el boton correspondiente
          document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
          const btn = document.querySelector(`[onclick*="${tabId}"]`);
          if (btn) btn.classList.add('active');
        }
        // Si es feed con categoria senales, filtrar
        if (relatedUrl === 'signals' && typeof filterFeed === 'function') {
          const btnSenales = document.querySelector('[onclick*="filterFeed"][onclick*="señales"]');
          if (btnSenales) btnSenales.click();
        }
      }

      // ---- Push toast flotante ----
      let toastQueue = [];
      let toastShowing = false;

      function showPushToast(type, text) {
        toastQueue.push({ type, text });
        if (!toastShowing) processToastQueue();
      }

      function processToastQueue() {
        if (!toastQueue.length) { toastShowing = false; return; }
        toastShowing = true;
        const { type, text } = toastQueue.shift();
        const iconMap = { signal: '📊', like: '♥', comment: '💬', post: '✨' };
        const titleMap = { signal: 'Nueva Señal', like: 'Nuevo Like', comment: 'Nuevo Comentario', post: 'Nuevo Post' };
        const el = document.createElement('div');
        el.className = 'push-toast';
        el.innerHTML = `
          <div class="push-toast-icon">${iconMap[type] || '🔔'}</div>
          <div>
            <div class="push-toast-title">${titleMap[type] || 'Notificación'}</div>
            <div class="push-toast-msg">${text}</div>
          </div>
          <button class="push-toast-close" onclick="this.closest('.push-toast').remove()">✕</button>`;
        el.onclick = (e) => { if (!e.target.classList.contains('push-toast-close')) { switchTab('tab-feed'); el.remove(); } };
        document.body.appendChild(el);
        setTimeout(() => {
          if (el.parentNode) {
            el.classList.add('hiding');
            setTimeout(() => { el.remove(); setTimeout(processToastQueue, 200); }, 300);
          } else { setTimeout(processToastQueue, 200); }
        }, 5000);
      }

      // ---- Notificaciones del navegador (Web Push API) ----
      function checkPushPermission() {
        if (!('Notification' in window)) return;
        if (Notification.permission === 'granted') {
          pushPermGranted = true;
          // Auto-inicializar Firebase si ya tenemos permiso
          if (window.TNSVT_USER && window.TNSVT_USER.code) {
            initFirebasePush().then(ok => {
              if (ok) console.log('[FCM] Auto-inicializado (permiso ya granted)');
            });
          }
          return;
        }
        if (Notification.permission === 'denied') return;
        const dismissed = localStorage.getItem('tnsvt_push_dismissed');
        if (!dismissed) {
          setTimeout(() => document.getElementById('pushPermBar')?.classList.add('show'), 3000);
        }
      }

      function requestPushPermission() {
        if (!('Notification' in window)) { showToast('Tu navegador no soporta notificaciones push'); return; }
        Notification.requestPermission().then(result => {
          if (result === 'granted') {
            document.getElementById('pushPermBar')?.classList.remove('show');
            initFirebasePush().then(ok => {
              if (ok) {
                pushPermGranted = true;
                showToast('✅ Notificaciones activadas');
                try {
                  new Notification('T.N.S.V.T', {
                    body: '🔔 Vas a recibir alertas de señales, comentarios y actividad del Reino.',
                    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⛧</text></svg>'
                  });
                } catch (e) { /* algunos navegadores bloquean la primer notif */ }
                if (typeof updateAvatarNotifBtn === 'function') updateAvatarNotifBtn();
              } else {
                showToast('⚠️ Permiso OK pero Firebase no se inicializó. Revisá la consola.');
              }
            });
          } else {
            showToast('Permisos denegados. Activá desde el navegador manualmente.');
            dismissPushBar();
            if (typeof updateAvatarNotifBtn === 'function') updateAvatarNotifBtn();
          }
        });
      }

      // Inicializa Firebase Web Push: carga el SDK, registra el SW, obtiene el FCM token
      // y lo guarda en el backend. Re-entrante y tolerante a fallos.
      var _fcmTokenRegistered = null;
      async function initFirebasePush() {
        if (_fcmTokenRegistered) return _fcmTokenRegistered;
        _fcmTokenRegistered = (async () => {
          try {
            if (!('serviceWorker' in navigator) || !('Notification' in window)) {
              console.warn('[FCM] SW o Notification no soportados');
              return false;
            }
            // 0) Registrar sw.js PWA principal (offline + cache), si no existe
            try {
              const existing = await navigator.serviceWorker.getRegistration('/sw.js');
              if (!existing) {
                await navigator.serviceWorker.register('/sw.js', { scope: '/' });
                console.log('[PWA] sw.js registrado');
              }
            } catch (e) { console.warn('[PWA] sw.js no se pudo registrar:', e); }
            // 1) Cargar SDK de Firebase (compat v10) si no está
            if (typeof firebase === 'undefined') {
              await loadScript('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
              await loadScript('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');
            }
            // 2) Obtener config pública del backend
            const config = await API.get('/api/firebase/config');
            if (!config || !config.configured) {
              console.warn('[FCM] Backend no configurado:', config && config.error);
              return false;
            }
            // 3) Inicializar Firebase (solo una vez)
            if (!firebase.apps.length) {
              firebase.initializeApp({
                apiKey: config.apiKey,
                authDomain: config.authDomain,
                projectId: config.projectId,
                storageBucket: config.storageBucket,
                messagingSenderId: config.messagingSenderId,
                appId: config.appId,
              });
            }
            const messaging = firebase.messaging();
            // 4) Registrar el service worker
            const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            console.log('[FCM] SW registrado, scope:', swReg.scope);
            // 5) Obtener el FCM token (requiere permiso granted)
            let fcmToken;
            try {
              const tokenOptions = { serviceWorkerRegistration: swReg };
              if (config.vapidKey) tokenOptions.vapidKey = config.vapidKey;
              fcmToken = await messaging.getToken(tokenOptions);
            } catch (e) {
              console.warn('[FCM] getToken() falló. VAPID key inválida o permisos denegados:', e.message);
              return false;
            }
            if (!fcmToken) {
              console.warn('[FCM] getToken() devolvió vacío. ¿Permiso denegado?');
              return false;
            }
            console.log('[FCM] Token obtenido:', fcmToken.substring(0, 20) + '...');
            // 6) Guardar el token en el backend
            if (window.TNSVT_USER && window.TNSVT_USER.code) {
              await API.post('/api/devices/register', {
                user_code: window.TNSVT_USER.code,
                fcm_token: fcmToken,
                platform: 'web',
                device_model: navigator.userAgent.substring(0, 200),
              });
              console.log('[FCM] Token registrado en backend para', window.TNSVT_USER.code);
            } else {
              console.warn('[FCM] No hay usuario logueado, token NO guardado');
              return false;
            }
            // 7) Escuchar mensajes en foreground (cuando el tab está activo)
            messaging.onMessage((payload) => {
              console.log('[FCM] Foreground message:', payload);
              const title = (payload.notification && payload.notification.title) || 'T.N.S.V.T';
              const body = (payload.notification && payload.notification.body) || (payload.data && payload.data.text) || '';
              showToast('🔔 ' + title + (body ? ': ' + body : ''));
              fireBrowserNotif((payload.data && payload.data.type) || 'generic', body);
            });
            // 8) Manejar el caso de token refrescado
            messaging.onTokenRefresh(async () => {
              try {
                const newToken = await messaging.getToken(tokenOptions);
                if (newToken && window.TNSVT_USER && window.TNSVT_USER.code) {
                  await API.post('/api/devices/register', {
                    user_code: window.TNSVT_USER.code,
                    fcm_token: newToken,
                    platform: 'web',
                    device_model: navigator.userAgent.substring(0, 200),
                  });
                }
              } catch (e) { console.warn('[FCM] Token refresh error:', e); }
            });
            return true;
          } catch (e) {
            // En Capacitor/APK no hay SW de firebase, asi que el register falla con AbortError.
            // Silenciar ese caso especifico para no ensuciar la consola.
            const isAbort = e && (e.name === 'AbortError' || /ServiceWorker/.test(String(e.message || '')));
            if (!isAbort) console.error('[FCM] initFirebasePush error:', e);
            return false;
          }
        })();
        return _fcmTokenRegistered;
      }

      function loadScript(src) {
        return new Promise((resolve, reject) => {
          if (document.querySelector('script[src="' + src + '"]')) return resolve();
          const s = document.createElement('script');
          s.src = src; s.async = false;
          s.onload = resolve;
          s.onerror = () => reject(new Error('No se pudo cargar ' + src));
          document.head.appendChild(s);
        });
      }

      function dismissPushBar() {
        document.getElementById('pushPermBar')?.classList.remove('show');
        localStorage.setItem('tnsvt_push_dismissed', '1');
      }

      // Actualizar el botón del menú del avatar según el estado de notificaciones
      function updateAvatarNotifBtn() {
        const btn = document.getElementById('avatarNotifBtn');
        const icon = document.getElementById('avatarNotifIcon');
        const label = document.getElementById('avatarNotifLabel');
        if (!btn || !icon || !label) return;
        const perm = (typeof Notification !== 'undefined') ? Notification.permission : 'default';
        if (perm === 'granted' && pushPermGranted) {
          icon.textContent = '🔔';
          label.textContent = 'Notificaciones activas';
          btn.style.color = '#34c759';
        } else if (perm === 'denied') {
          icon.textContent = '🔕';
          label.textContent = 'Notificaciones bloqueadas';
          btn.style.color = '#f87171';
        } else {
          icon.textContent = '🔔';
          label.textContent = 'Activar notificaciones';
          btn.style.color = '#e2dcf0';
        }
      }
      window.updateAvatarNotifBtn = updateAvatarNotifBtn;

      function toggleNotificationsFromMenu() {
        const perm = (typeof Notification !== 'undefined') ? Notification.permission : 'default';
        if (perm === 'denied') {
          showToast('🔕 Permiso bloqueado desde el navegador. Cambialo en los ajustes del sitio.');
          return;
        }
        if (perm === 'granted' && pushPermGranted) {
          showToast('✓ Notificaciones ya activas. Para desactivarlas usá los ajustes del navegador.');
          return;
        }
        requestPushPermission();
      }
      window.toggleNotificationsFromMenu = toggleNotificationsFromMenu;

      // Calendario económico — los filtros se manejan en setupCalFilters()

      function fireBrowserNotif(type, text) {
        if (!pushPermGranted || Notification.permission !== 'granted') return;
        const titleMap = { signal: '📊 Nueva Señal — T.N.S.V.T', like: '♥ Nuevo Like', comment: '💬 Nuevo Comentario', post: '✨ Nuevo Post' };
        new Notification(titleMap[type] || '🔔 T.N.S.V.T', {
          body: text,
          icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⛧</text></svg>',
          tag: 'tnsvt-' + type,
          renotify: true
        });
      }

      // Notificaciones — polling cada 30s
      function initNotifRealtime() {
        if (!window.TNSVT_USER) return;
        const updateBadge = (count) => {
          const badge = document.getElementById('notifBadge');
          if (!badge) return;
          if (count > 0) {
            badge.textContent = count > 9 ? '9+' : count;
            badge.classList.add('show');
          } else {
            badge.textContent = '';
            badge.classList.remove('show');
          }
        };
        // Inicial: setear en 0
        updateBadge(0);
        // Polling cada 30s (con guard por si TNSVT_USER se vacia con logout)
        let pollTimer = setInterval(async () => {
          if (!window.TNSVT_USER || !window.TNSVT_USER.code) return;
          try {
            const result = await sb.getNotifCount(window.TNSVT_USER.code);
            updateBadge((result && typeof result.count === 'number') ? result.count : 0);
          } catch(e) {
            console.warn('notif poll error:', e);
          }
        }, 30000);
        // Si en algun momento se hace logout, parar el polling
        const stopWatch = setInterval(() => {
          if (!window.TNSVT_USER) {
            clearInterval(pollTimer);
            clearInterval(stopWatch);
          }
        }, 5000);
        // Tambien refrescar al abrir el panel
        const origToggle = window.toggleNotifPanel;
        window.toggleNotifPanel = async function() {
          if (typeof origToggle === 'function') origToggle.apply(this, arguments);
          if (!window.TNSVT_USER || !window.TNSVT_USER.code) return;
          try {
            const result = await sb.getNotifCount(window.TNSVT_USER.code);
            updateBadge((result && typeof result.count === 'number') ? result.count : 0);
          } catch(e) {}
        };
      }

      window.toggleNotifPanel = toggleNotifPanel;
      // Alias solicitado por el nuevo topbar (puede llamar openNotifications() en vez de toggleNotifPanel)
      window.openNotifications = function() {
        if (typeof window.toggleNotifPanel === 'function') {
          window.toggleNotifPanel();
        }
      };
      window.markAllRead = markAllRead;
      window.markOneRead = markOneRead;
      window.addNotif = addNotif;
      window.initNotifRealtime = initNotifRealtime;
      window.requestPushPermission = requestPushPermission;
      window.dismissPushBar = dismissPushBar;
      window.checkPushPermission = checkPushPermission;
      window.initFirebasePush = initFirebasePush;
      window.loadScript = loadScript;
      // ============================================================
      // ⛧ CALENDARIO ECONÓMICO — Timeline místico (glow-up v3.6)
      // ============================================================
      const CAL_LS_FILTERS = 'tnsvt:cal:filters';
      const CAL_LS_REMINDERS = 'tnsvt:cal:reminders';
      const CAL_CURRENCY_PAIRS = {
        USD: ['XAUUSD','EURUSD','GBPUSD','NAS100','BTCUSDT','USDJPY'],
        EUR: ['EURUSD','EURGBP','EURJPY','DAX','EURCHF'],
        GBP: ['GBPUSD','EURGBP','GBPJPY','UK100'],
        JPY: ['USDJPY','EURJPY','GBPJPY','NIKKEI'],
        CAD: ['USDCAD','CADJPY'],
        AUD: ['AUDUSD','AUDJPY','AUDNZD'],
        CHF: ['USDCHF','EURCHF','CHFJPY'],
        CNY: ['USDCNH'],
      };
      // CAL_FLAG ya está declarado al inicio del archivo (evita TDZ)
      function _calLoadFilters() {
        try {
          const raw = localStorage.getItem(CAL_LS_FILTERS);
          if (!raw) return null;
          const parsed = JSON.parse(raw);
          if (parsed && Array.isArray(parsed.countries) && Array.isArray(parsed.impact)) return parsed;
        } catch (e) {}
        return null;
      }
      function _calSaveFilters(countries, impact, tz) {
        try {
          const payload = { countries, impact };
          if (tz) payload.tz = tz;
          localStorage.setItem(CAL_LS_FILTERS, JSON.stringify(payload));
        } catch (e) {}
      }
      function _calGetSelected() {
        const countries = [...document.querySelectorAll('.cal-country-btn.active')].map(b => b.getAttribute('data-country'));
        const impact = [...document.querySelectorAll('.cal-impact-btn.active')].map(b => b.getAttribute('data-impact'));
        return { countries, impact };
      }
      function _calFallbackEvents() {
        const d = new Date();
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth()+1).padStart(2,'0');
        const dd = String(d.getUTCDate()).padStart(2,'0');
        const tomorrow = String(d.getUTCDate()+1).padStart(2,'0');
        const nextWeek = String(d.getUTCDate()+7).padStart(2,'0');
        const fmtD = (day) => y+'-'+m+'-'+String(day).padStart(2,'0');
        return [
          { date: fmtD(d.getUTCDate()), time:'08:30', country_code:'US', currency:'USD', title:'IPC Mensual (CPI MM)', importance:3, actual:'—', forecast:'0.2%', previous:'0.1%' },
          { date: fmtD(d.getUTCDate()), time:'08:30', country_code:'US', currency:'USD', title:'IPC Anual (CPI YY)', importance:3, actual:'—', forecast:'3.1%', previous:'3.2%' },
          { date: fmtD(tomorrow), time:'08:30', country_code:'US', currency:'USD', title:'Solicitudes de Desempleo', importance:2, actual:'—', forecast:'220K', previous:'218K' },
          { date: fmtD(tomorrow), time:'10:00', country_code:'EU', currency:'EUR', title:'PMI Manufacturero', importance:2, actual:'—', forecast:'47.5', previous:'47.0' },
          { date: fmtD(nextWeek), time:'14:00', country_code:'US', currency:'USD', title:'Decisión Tasa de Interés (FOMC)', importance:3, actual:'—', forecast:'5.50%', previous:'5.50%' },
          { date: fmtD(nextWeek), time:'14:30', country_code:'US', currency:'USD', title:'Conferencia de Prensa FOMC', importance:3, actual:'—', forecast:'—', previous:'—' },
        ];
      }
      async function _calFetch() {
        const { countries, impact } = _calGetSelected();
        const tz = _calGetTz();
        _calSaveFilters(countries, impact, tz);
        const url = '/api/calendar/events?countries=' + (countries.join(',') || 'USD,EUR,GBP,JPY') + '&impact=' + (impact.join(',') || '1,2,3') + '&tz=' + encodeURIComponent(tz);
        const tl = document.getElementById('cal-timeline');
        try {
          const res = await fetch(url, { cache: 'no-store' });
          if (!res.ok) throw new Error('HTTP ' + res.status);
          const data = await res.json();
          _calEvents = Array.isArray(data.events) && data.events.length > 0 ? data.events : _calFallbackEvents();
          _calRender();
          _calAutoScheduleCritical();
        } catch (e) {
          _calEvents = _calFallbackEvents();
          _calRender();
          console.warn('[cal] fetch failed, using fallback', e);
        }
      }
      function _calNowAr() {
        const now = new Date();
        const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
        return new Date(utcMs - 3 * 3600 * 1000);
      }
      function _calGetTz() {
        const el = document.getElementById('cal-tz');
        if (el && el.value.trim()) {
          const val = el.value.trim();
          if (_calValidTz(val)) {
            try { localStorage.setItem('tnsvt:cal:tz', val); } catch (e) {}
            return val;
          }
        }
        try {
          const saved = localStorage.getItem('tnsvt:cal:tz');
          if (saved && _calValidTz(saved)) return saved;
        } catch (e) {}
        return 'America/Argentina/Buenos_Aires';
      }
      function _calValidTz(val) {
        if (!val || typeof val !== 'string') return false;
        const v = val.trim();
        if (!v) return false;
        // Acepta UTC±H o UTC±H:M (con fracciones)
        if (/^UTC[+\-]\d{1,2}(:?\d{1,2})?$/i.test(v)) return true;
        // Acepta cualquier IANA name que Intl pueda resolver
        try { new Intl.DateTimeFormat(undefined, { timeZone: v }); return true; }
        catch (e) { return false; }
      }
      function _calEventDate(e) {
        if (e.datetime_utc) {
          return new Date(e.datetime_utc);
        }
        const [y, m, d] = e.date.split('-').map(Number);
        const [hh, mm] = e.time.split(':').map(Number);
        return new Date(Date.UTC(y, m - 1, d, hh + 3, mm));
      }
      function _calFmtCountdown(ms) {
        if (ms <= 0) return 'EN CURSO';
        const s = Math.floor(ms / 1000);
        const d = Math.floor(s / 86400);
        const h = Math.floor((s % 86400) / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        if (d > 0) return d + 'd ' + h + 'h';
        if (h > 0) return h + 'h ' + m + 'm';
        if (m > 0) return m + 'm ' + sec + 's';
        return sec + 's';
      }
      function _calGroupByDay(events) {
        const groups = {};
        events.forEach(e => { if (!groups[e.date]) groups[e.date] = []; groups[e.date].push(e); });
        return groups;
      }
      function _calDayLabel(dateStr) {
        const [y, m, d] = dateStr.split('-').map(Number);
        const dt = new Date(Date.UTC(y, m - 1, d, 12, 0));
        const nowAr = _calNowAr();
        const todayStr = nowAr.toISOString().slice(0, 10);
        const tomorrow = new Date(nowAr); tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
        const tomorrowStr = tomorrow.toISOString().slice(0, 10);
        const dayNames = ['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB'];
        const monthNames = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
        let suffix = dayNames[dt.getUTCDay()];
        if (dateStr === todayStr) suffix = 'HOY';
        else if (dateStr === tomorrowStr) suffix = 'MAÑANA';
        return { day: d, label: monthNames[m - 1] + ' · ' + suffix, isToday: dateStr === todayStr };
      }
      function _calEscape(s) {
        return String(s == null ? '' : s).replace(/[&<>"\']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
      }
      function _calNowMarkerHtml(nowAr) {
        const hm = nowAr.getUTCHours().toString().padStart(2,'0') + ':' + nowAr.getUTCMinutes().toString().padStart(2,'0');
        return '<div class="cal-now-row"><div class="cal-now-time">' + hm + '</div><div class="cal-now-dot-col"><span class="cal-now-dot"></span></div><div class="cal-now-bar"><span class="cal-now-label">⛧ AHORA · ART ⛧</span></div></div>';
      }
      function _calFindNextCritical(nowAr) {
        for (const e of _calEvents) {
          if (!e.is_critical && e.importance !== 3) continue;
          if (_calEventDate(e) > nowAr) return e;
        }
        return null;
      }
      function _calAutoScheduleCritical() {
        const nowAr = _calNowAr();
        const ev = _calFindNextCritical(nowAr);
        if (!ev) { _calUpdateReminderBadge(null); return; }
        const evDate = _calEventDate(ev);
        if (evDate - nowAr > 24 * 3600 * 1000) { _calUpdateReminderBadge(null); return; }
        const key = (ev.date || '') + '|' + (ev.time || '') + '|' + (ev.country_code || '') + '|' + (ev.title || '');
        if (key === _calReminderKey) { _calUpdateReminderBadge(ev); return; }
        _calReminderKey = key;
        if (!window.TNSVT_USER || !window.TNSVT_USER.code) { _calUpdateReminderBadge(ev); return; }
        fetch('/api/economic-reminders/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_code: window.TNSVT_USER.code,
            event_date: ev.date,
            event_time: ev.time,
            timezone: _calGetTz(),
            event_title: ev.title,
            event_title_original: ev.original_title || ev.title,
            event_country_code: ev.country_code,
            event_currency: ev.currency,
            event_importance: ev.importance || 3,
          }),
        }).then(r => r.json()).then(data => {
          if (data && data.success) _calUpdateReminderBadge(ev);
          else console.warn('[cal] reminder schedule response:', data);
        }).catch(err => console.warn('[cal] reminder schedule error:', err));
      }
      function _calUpdateReminderBadge(ev) {
        const badge = document.getElementById('cal-reminder-badge');
        const text = document.getElementById('cal-reminder-badge-text');
        if (!badge || !text) return;
        if (!ev) { badge.style.display = 'none'; return; }
        const nowAr = _calNowAr();
        const diffMs = _calEventDate(ev) - nowAr;
        const mins = Math.round(diffMs / 60000);
        let label = '';
        if (mins <= 0) label = '⏰ EN CURSO / PASÓ';
        else if (mins < 60) label = '🔔 EN ' + mins + 'm';
        else if (mins < 24 * 60) label = '🔔 EN ' + Math.floor(mins/60) + 'h ' + (mins%60) + 'm';
        else label = '🔔 ' + ev.date;
        text.textContent = label;
        badge.style.display = 'flex';
      }
      function calShowActiveReminder() {
        const nowAr = _calNowAr();
        const ev = _calFindNextCritical(nowAr);
        if (!ev) { showToast('Sin eventos críticos próximos.'); return; }
        const evDate = _calEventDate(ev);
        const diffMs = evDate - nowAr;
        const mins = Math.round(diffMs / 60000);
        const when = mins <= 0 ? 'en curso o reciente' : 'en ' + (mins < 60 ? mins + ' min' : Math.floor(mins/60) + 'h ' + (mins%60) + 'm');
        showToast('🔔 ' + ev.title + ' (' + ev.date + ' ' + ev.time + ' ART) — ' + when);
      }
      window.calShowActiveReminder = calShowActiveReminder;
      function _calRender() {
        const tl = document.getElementById('cal-timeline');
        if (!tl) return;
        if (_calEvents.length === 0) {
          tl.innerHTML = '<div class="cal-loading" style="color:#a499b8;">No hay eventos para estos filtros.</div>';
          _calRenderCritical(null);
          return;
        }
        const nowAr = _calNowAr();
        const groups = _calGroupByDay(_calEvents);
        const dayKeys = Object.keys(groups).sort();
        let html = '<div class="cal-thread"></div>';
        let nowInserted = false;
        const todayStr = nowAr.toISOString().slice(0, 10);
        const nowHM = nowAr.getUTCHours().toString().padStart(2,'0') + ':' + nowAr.getUTCMinutes().toString().padStart(2,'0');
        dayKeys.forEach(dateStr => {
          const { day, label, isToday } = _calDayLabel(dateStr);
          html += '<div class="cal-day-head"><div class="cal-day-num' + (isToday ? ' is-today' : '') + '">' + day + '</div><div class="cal-day-sub">' + label + '</div></div>';
          const list = groups[dateStr];
          list.forEach(e => {
            if (isToday && !nowInserted && e.time >= nowHM) { html += _calNowMarkerHtml(nowAr); nowInserted = true; }
            const evDate = _calEventDate(e);
            const isPast = evDate < nowAr;
            const isUpcoming = !isPast;
            const impClass = e.importance === 3 ? 'high' : (e.importance === 2 ? 'med' : 'low');
            const flag = CAL_FLAG[e.country_code] || '';
            const diffMs = evDate - nowAr;
            const countdown = isPast ? '' : _calFmtCountdown(diffMs);
            html += '<div class="cal-row imp-' + impClass + (isPast ? ' is-past' : '') + (e.importance === 3 && isUpcoming ? ' is-critical' : '') + '">' +
              '<div class="cal-row-time">' + _calEscape(e.time) + '</div>' +
              '<div class="cal-row-dot-col"><span class="cal-row-dot"></span></div>' +
              '<div class="cal-row-card">' +
                '<div class="cal-row-flag">' + flag + ' ' + _calEscape(e.currency || '') + '</div>' +
                '<div class="cal-row-body">' +
                  '<div class="cal-row-title">' + _calEscape(e.title) + '</div>' +
                  (e.importance === 3 ? '<div class="cal-row-tag">⚠ ALTO IMPACTO · NO OPERAR</div>' : '') +
                '</div>' +
                '<div class="cal-row-val cal-row-actual">' + _calEscape(e.actual) + '</div>' +
                '<div class="cal-row-val cal-row-forecast">' + _calEscape(e.forecast) + '</div>' +
                '<div class="cal-row-val cal-row-previous">' + _calEscape(e.previous) + '</div>' +
                '<div class="cal-row-cd">' + countdown + '</div>' +
              '</div>' +
            '</div>';
          });
        });
        if (!nowInserted && groups[todayStr]) html += _calNowMarkerHtml(nowAr);
        tl.innerHTML = html;
        _calRenderCritical(_calFindNextCritical(nowAr));
      }
      function _calRenderCritical(e) {
        const box = document.getElementById('cal-next-critical');
        if (!box) return;
        if (!e) { box.innerHTML = '<div class="cal-critical-empty">Sin eventos críticos próximos.</div>'; return; }
        const evDate = _calEventDate(e);
        const diffMs = evDate - _calNowAr();
        const countdown = _calFmtCountdown(diffMs);
        const flag = CAL_FLAG[e.country_code] || '';
        const ccy = e.currency || '';
        const pairs = CAL_CURRENCY_PAIRS[ccy] || [];
        const windowStart = new Date(evDate.getTime() - 15 * 60000);
        const windowEnd = new Date(evDate.getTime() + 15 * 60000);
        const fmtHm = d => d.getUTCHours().toString().padStart(2,'0') + ':' + d.getUTCMinutes().toString().padStart(2,'0');
        const pairsHtml = pairs.map((p, i) => {
          const intensity = Math.max(40, 95 - i * 12);
          const color = i < 2 ? '#ff3b30' : (i < 4 ? '#ff8a00' : '#d4af37');
          return '<div class="cal-pair-row"><span class="cal-pair-name">' + _calEscape(p) + '</span><span class="cal-pair-bar" style="color:' + color + ';">●●●●● ' + intensity + '%</span></div>';
        }).join('');
        box.innerHTML =
          '<div class="cal-critical-head">⚠ PRÓXIMO CRÍTICO</div>' +
          '<div class="cal-critical-title">' + _calEscape(e.title) + '</div>' +
          '<div class="cal-critical-meta">' + flag + ' ' + _calEscape(ccy) + ' · ' + _calEscape(e.date) + ' ' + _calEscape(e.time) + ' ART · EN <span id="cal-critical-cd">' + countdown + '</span></div>' +
          '<div class="cal-critical-vals">' +
            '<div class="cal-critical-v"><div class="cal-critical-v-l">ACTUAL</div><div class="cal-critical-v-n cal-c-muted">' + _calEscape(e.actual) + '</div></div>' +
            '<div class="cal-critical-v"><div class="cal-critical-v-l">PREVISIÓN</div><div class="cal-critical-v-n cal-c-gold">' + _calEscape(e.forecast) + '</div></div>' +
            '<div class="cal-critical-v"><div class="cal-critical-v-l">ANTERIOR</div><div class="cal-critical-v-n">' + _calEscape(e.previous) + '</div></div>' +
          '</div>' +
          '<div class="cal-critical-window">' +
            '<div class="cal-cw-head">⚠ <span>VENTANA DE NO-OPERAR</span></div>' +
            '<div class="cal-cw-body">' + fmtHm(windowStart) + ' → ' + fmtHm(windowEnd) + ' ART<br><span class="cal-cw-sub">Volatilidad esperada: EXTREMA en ' + _calEscape(ccy) + ' y pares cruzados.</span></div>' +
          '</div>' +
          (pairs.length ? '<div class="cal-critical-subhead">PARES MÁS AFECTADOS</div><div class="cal-pairs-list">' + pairsHtml + '</div>' : '') +
          '<button id="cal-remind-btn" class="cal-remind-btn" onclick="calScheduleReminder()">\uD83D\uDD14 RECORDARME 15 ANTES</button>';
      }
      async function calScheduleReminder() {
        const e = _calFindNextCritical(_calNowAr());
        if (!e) return;
        const btn = document.getElementById('cal-remind-btn');
        let perm = (typeof Notification !== 'undefined') ? Notification.permission : 'denied';
        if (perm === 'default') { try { perm = await Notification.requestPermission(); } catch (err) { perm = 'denied'; } }
        if (perm !== 'granted') { if (btn) { btn.textContent = '⚠ Permití notificaciones primero'; btn.style.borderColor = '#ff3b30'; } return; }
        const evDate = _calEventDate(e);
        const reminderAt = new Date(evDate.getTime() - 15 * 60000);
        const delay = reminderAt - new Date();
        if (delay <= 0) { new Notification('⚠ TNSVT — ' + e.title, { body: 'Ventana de no-operar inminente o en curso.', icon: '/icons/icon-192.png' }); if (btn) btn.textContent = '✓ NOTIFICADO AHORA'; return; }
        try {
          const raw = localStorage.getItem(CAL_LS_REMINDERS);
          const arr = raw ? JSON.parse(raw) : [];
          const key = e.date + 'T' + e.time + ':' + e.original_title;
          if (!arr.find(r => r.key === key)) { arr.push({ key, at: reminderAt.toISOString(), title: e.title, ccy: e.currency }); localStorage.setItem(CAL_LS_REMINDERS, JSON.stringify(arr)); }
        } catch (err) {}
        setTimeout(() => { try { new Notification('⚠ TNSVT — ' + e.title + ' en 15 min', { body: 'Ventana de no-operar inminente. Cerrá posiciones de riesgo.', icon: '/icons/icon-192.png', tag: 'tnsvt-cal-' + e.date + e.time }); } catch (err) {} }, delay);
        if (btn) {
          const mins = Math.round(delay / 60000);
          btn.textContent = '✓ RECORDATORIO EN ' + (mins >= 60 ? Math.floor(mins/60) + 'h ' + (mins%60) + 'm' : mins + 'm');
          btn.style.background = 'linear-gradient(180deg,rgba(52,199,89,0.25),rgba(52,199,89,0.08))';
          btn.style.borderColor = 'rgba(52,199,89,0.5)';
          btn.style.color = '#34c759';
        }
      }
      window.calScheduleReminder = calScheduleReminder;
      function _calTickCountdown() {
        const e = _calFindNextCritical(_calNowAr());
        const span = document.getElementById('cal-critical-cd');
        if (!e || !span) return;
        const diffMs = _calEventDate(e) - _calNowAr();
        span.textContent = _calFmtCountdown(diffMs);
      }
      function setupCalFilters() {
        const tl = document.getElementById('cal-timeline');
        if (!tl) return;
        const saved = _calLoadFilters();
        if (saved && saved.countries && saved.countries.length) {
          document.querySelectorAll('.cal-country-btn').forEach(b => b.classList.toggle('active', saved.countries.includes(b.getAttribute('data-country'))));
          document.querySelectorAll('.cal-impact-btn').forEach(b => b.classList.toggle('active', saved.impact.includes(b.getAttribute('data-impact'))));
        }
        const tzSel = document.getElementById('cal-tz');
        if (tzSel) {
          try {
            const savedTz = localStorage.getItem('tnsvt:cal:tz');
            if (savedTz) {
              [...tzSel.options].forEach(o => { o.selected = o.value === savedTz; });
            }
          } catch (e) {}
          tzSel.addEventListener('change', () => _calFetch());
        }
        document.querySelectorAll('.cal-country-btn, .cal-impact-btn').forEach(btn => {
          btn.addEventListener('click', () => { btn.classList.toggle('active'); _calFetch(); });
        });
        _calFetch();
        if (_calRefreshTimer) clearInterval(_calRefreshTimer);
        if (_calCountdownTimer) clearInterval(_calCountdownTimer);
        if (_calNowTimer) clearInterval(_calNowTimer);
        _calRefreshTimer = setInterval(_calFetch, 60000);
        _calCountdownTimer = setInterval(_calTickCountdown, 1000);
        _calNowTimer = setInterval(() => { _calRender(); _calUpdateReminderBadge(_calFindNextCritical(_calNowAr())); }, 5 * 60000);
      }

      window.setupCalFilters = setupCalFilters;

      console.log('✅ T.N.S.V.T - Todas las funciones cargadas correctamente.');
      // ==================== MÓDULO MULTIFRACTAL — TABS Y CHECKLIST ====================
      function mfTab(tabId, btn) {
        document.querySelectorAll('.mf-panel').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.mf-tab-btn').forEach(b => b.classList.remove('active'));
        const panel = document.getElementById(tabId);
        if (panel) panel.classList.add('active');
        if (btn) btn.classList.add('active');
      }

      const mfCheckState = { 1: false, 2: false, 3: false, 4: false };

      function mfToggleCheck(n) {
        mfCheckState[n] = !mfCheckState[n];
        const item = document.getElementById('mfc' + n);
        if (item) item.classList.toggle('checked', mfCheckState[n]);
        mfUpdateResult();
      }

      function mfUpdateResult() {
        const count = Object.values(mfCheckState).filter(Boolean).length;
        const result = document.getElementById('mfResult');
        const icon = document.getElementById('mfResultIcon');
        const text = document.getElementById('mfResultText');
        const sub = document.getElementById('mfResultSub');
        if (!result) return;
        result.classList.remove('valid-setup', 'invalid-setup');
        if (count === 4) {
          result.classList.add('valid-setup');
          icon.textContent = '✅';
          text.textContent = 'SETUP VÁLIDO — PODÉS ENTRAR';
          sub.textContent = '4 / 4 condiciones verificadas';
        } else if (count > 0) {
          result.classList.add('invalid-setup');
          icon.textContent = '⚠️';
          text.textContent = 'Setup incompleto — NO entrar';
          sub.textContent = count + ' / 4 condiciones verificadas';
        } else {
          icon.textContent = '❓';
          text.textContent = 'Marcá las 4 condiciones para validar el setup';
          sub.textContent = '0 / 4 condiciones verificadas';
        }
      }

      function mfResetChecklist() {
        for (let i = 1; i <= 4; i++) {
          mfCheckState[i] = false;
          const item = document.getElementById('mfc' + i);
          if (item) item.classList.remove('checked');
        }
        mfUpdateResult();
      }

      window.mfTab = mfTab;
      window.mfToggleCheck = mfToggleCheck;
      window.mfResetChecklist = mfResetChecklist;
      window.mfUpdateResult = mfUpdateResult;

      // ============================================================
      // DEEP LINK HANDLER — recibe scores desde T.N.S.V.T Market game
      // Formato: com.tnsvt.app://sync-score?xp=300&mode=survival
      //          com.tnsvt.game://sync-score?xp=300&mode=survival
      // ============================================================
      async function handleDeepLink(url) {
        if (!url) return;
        try {
          const u = new URL(url);
          if (u.protocol !== 'com.tnsvt.app:' && u.protocol !== 'com.tnsvt.game:') return;
          const action = u.host || u.pathname.replace(/^\/\//, '');
          if (action === 'sync-score') {
            const xp = parseInt(u.searchParams.get('xp') || '0', 10);
            const mode = u.searchParams.get('mode') || 'classic';
            if (xp > 0) {
              showToast(`🎮 Score recibido: +${xp} XP (${mode})`);
              try { HAPTICS?.win?.(); } catch(_){}
              // Intentar guardar vía API si está logueado
              try {
                const r = await fetch('/api/game/score', {
                  method: 'POST',
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ mode, score: xp, metadata: { xp_gained: xp, source: 'deep-link' } })
                });
                if (r.ok) {
                  const data = await r.json();
                  showToast(`✦ TNSVT: +${data.xp_gained} XP, total ${data.total_xp}`);
                }
              } catch(e) { /* offline, score queda en el game */ }
            }
          } else if (action === 'leaderboard') {
            showToast('🏆 Abriendo leaderboard...');
            setTimeout(() => switchTab('tab-journal'), 500);
          } else if (action === 'open') {
            showToast('👋 Bienvenido desde T.N.S.V.T Market');
          }
        } catch(e) { console.warn('Deep link parse error:', e); }
      }
      window.handleDeepLink = handleDeepLink;

      // Registrar listener de Capacitor para deep links
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
        const App = window.Capacitor.Plugins.App;
        App.addListener('appUrlOpen', (data) => {
          if (data && data.url) handleDeepLink(data.url);
        });
        // Si la app ya estaba abierta con un deep link
        App.getLaunchUrl && App.getLaunchUrl().then(r => {
          if (r && r.url) handleDeepLink(r.url);
        }).catch(() => {});
      }

      // ─── REGISTRAR SERVICE WORKER (PWA + offline + push) ───
      // Si el SW no está registrado, el navegador no cachea ni recibe push.
      // Se registra apenas carga la app, sin esperar al opt-in de notificaciones.
      (function registerSW() {
        if (!('serviceWorker' in navigator)) {
          console.warn('[PWA] serviceWorker no soportado');
          return;
        }
        if (location.protocol !== 'http:' && location.protocol !== 'https:') {
          console.warn('[PWA] protocolo no soportado:', location.protocol);
          return;
        }
        console.log('[PWA] registrando sw.js desde', location.origin);
        navigator.serviceWorker.register('/sw.js', { scope: '/' })
          .then(reg => {
            console.log('[PWA] sw.js registrado OK, scope:', reg.scope, 'state:', reg.active?.state || 'installing');
            // Forzar update del SW si hay uno nuevo esperando
            if (reg.waiting) {
              reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
            // Refrescar el panel admin si existe
            if (typeof loadSystemStatus === 'function') {
              setTimeout(() => loadSystemStatus(), 800);
            }
          })
          .catch(err => {
            console.error('[PWA] sw.js ERROR:', err.message);
            if (typeof loadSystemStatus === 'function') loadSystemStatus();
          });
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('[PWA] controller changed, reload recomendado');
        });
        // Exponer función global para consultar el estado del SW
        window.getSWInfo = async () => {
          try {
            const regs = await navigator.serviceWorker.getRegistrations();
            return {
              supported: true,
              controller: !!navigator.serviceWorker.controller,
              count: regs.length,
              registrations: regs.map(r => ({ scope: r.scope, active: r.active?.scriptURL || '' })),
            };
          } catch (e) {
            return { supported: false, error: e.message };
          }
        };
      })();

/* ===================================================================================
   BIOMETRIC AUTH — Wrapper para huella digital
   ===================================================================================
   Usa el plugin nativo de Capacitor en la app, o WebAuthn en navegadores modernos,
   con fallback a contraseña manual.
   =================================================================================== */
window.BiometricAuth = (() => {
  const STORAGE_KEY = 'tnsvt_biometric_enabled_v1';

  async function isAvailable() {
    try {
      if (window.Capacitor?.Plugins?.BiometricAuthNative) {
        const plugin = window.Capacitor.Plugins.BiometricAuthNative;
        const info = await plugin.isAvailable();
        return info.isAvailable;
      }
    } catch(_) {}
    return false;
  }

  async function authenticate(reason) {
    try {
      if (window.Capacitor?.Plugins?.BiometricAuthNative) {
        const plugin = window.Capacitor.Plugins.BiometricAuthNative;
        await plugin.authenticate({ reason: reason || 'Desbloquear Diario Personal' });
        return true;
      }
    } catch(e) {
      if (e.code === 'userCancel' || e.code === 'systemCancel') return false;
      throw e;
    }
    return false;
  }

  function isEnabled() {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  }

  function setEnabled(v) {
    if (v) localStorage.setItem(STORAGE_KEY, 'true');
    else localStorage.removeItem(STORAGE_KEY);
  }

  return { isAvailable, authenticate, isEnabled, setEnabled };
})();

/* ===================================================================================
   DIARIO PERSONAL — Módulo de cifrado AES-256-GCM del lado del cliente
   ===================================================================================
   La contraseña NUNCA se envía al servidor. Todo el cifrado/descifrado ocurre
   en el navegador usando la Web Crypto API. El servidor solo almacena bytes
   cifrados que son ilegibles incluso para el admin con acceso directo a la DB.
   =================================================================================== */
window.Diary = (() => {
  const STORAGE_PW_KEY = 'tnsvt_diary_pw';
  const VERIFY_PLAINTEXT = 'TNSVT-DIARY-VERIFIED';
  const SALT_PREFIX = 'TNSVT-DIARY-';

  const EDITOR_PROMPTS = [
    { title:'Hoy escribo para mí', quote:'"Lo que callamos hoy, mañana vuelve más fuerte. Escribí sin filtro."' },
    { title:'La voz que no habla', quote:'"Hay verdades que solo aparecen cuando la mano escribe sin pensar."' },
    { title:'Confesín de medianoche', quote:'"El papel es el único testigo que no juzga ni traiciona."' },
    { title:'Espejo de tinta', quote:'"Lo que escribís sobre vos hoy, será el mapa de quién sos mañana."' },
    { title:'El acto de re-encontrarse', quote:'"Volvé sobre estas líneas en un año. Verás a otro vos."' },
    { title:'Sin filtros, sin testigos', quote:'"Aquí no hay performance. Aquí sos vos, crudo."' },
    { title:'La página espera', quote:'"Escribí lo que no podrías decirle a nadie."' },
  ];

  let _key = null;
  let _currentEntryId = null;
  let _isNew = true;
  let _setupDone = false;

  function el(id) { return document.getElementById(id); }

  function _pw() {
    return sessionStorage.getItem(STORAGE_PW_KEY);
  }

  function _setPw(pw) {
    sessionStorage.setItem(STORAGE_PW_KEY, pw);
  }

  function _clearPw() {
    sessionStorage.removeItem(STORAGE_PW_KEY);
    _key = null;
  }

  function _show(id) {
    ['dp-locked','dp-list','dp-editor','dp-reader'].forEach(s => { const e=el(s); if(e) e.style.display = s===id ? '' : 'none'; });
  }

  function _showError(msg) {
    const err = el('dp-error');
    if (!err) return;
    err.textContent = msg;
    err.style.display = 'block';
    setTimeout(() => err.style.display = 'none', 4000);
  }

  async function _deriveKey(password) {
    const enc = new TextEncoder();
    const userCode = (window.TNSVT_USER && window.TNSVT_USER.code) || 'user';
    const salt = enc.encode(SALT_PREFIX + userCode);
    const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 200000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async function _encrypt(plaintext) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const pt = new TextEncoder().encode(plaintext);
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, _key, pt);
    const combined = new Uint8Array(iv.length + ct.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(ct), iv.length);
    return btoa(String.fromCharCode(...combined));
  }

  async function _decrypt(payload) {
    const raw = Uint8Array.from(atob(payload), c => c.charCodeAt(0));
    const iv = raw.slice(0, 12);
    const ct = raw.slice(12);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, _key, ct);
    return new TextDecoder().decode(pt);
  }

  function _api(method, path, body) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const code = (window.TNSVT_USER && window.TNSVT_USER.code);
    if (code) opts.headers['X-Game-Code'] = code;
    return fetch(path.startsWith('http') ? path : API.baseURL + path, opts).then(r => r.json());
  }

  // ── Public API ──

  async function setupPassword(password) {
    if (!password || password.length < 4) { _showError('La contraseña debe tener al menos 4 caracteres'); return; }
    try {
      _key = await _deriveKey(password);
      const encrypted = await _encrypt(VERIFY_PLAINTEXT);
      const res = await _api('POST', '/api/diary/setup', { setup_token: encrypted });
      if (res.success) {
        _setPw(password);
        _setupDone = true;
        _loadList();
      } else {
        _showError(res.error || 'Error al guardar configuración');
      }
    } catch(e) {
      _showError('Error: ' + e.message);
    }
  }

  async function unlock() {
    const pw = el('dp-password-input').value.trim();
    if (!pw) { _showError('Ingresá tu contraseña'); return; }
    try {
      _key = await _deriveKey(pw);
      const res = await _api('GET', '/api/diary/setup');
      if (!res.success || !res.setup_token) {
        _showError('No hay configuración de diario. Creá una contraseña primero.');
        return;
      }
      const decrypted = await _decrypt(res.setup_token);
      if (decrypted === VERIFY_PLAINTEXT) {
        _setPw(pw);
        _loadList();
      } else {
        _showError('Contraseña incorrecta');
        _key = null;
      }
    } catch(e) {
      _showError('Contraseña incorrecta');
      _key = null;
    }
  }

  async function init() {
    const pw = _pw();
    if (pw) {
      try {
        _key = await _deriveKey(pw);
        const res = await _api('GET', '/api/diary/setup');
        if (res.success && res.setup_token) {
          const decrypted = await _decrypt(res.setup_token);
          if (decrypted === VERIFY_PLAINTEXT) {
            _loadList();
            return;
          }
        }
      } catch(e) {}
      _clearPw();
    }

    const res = await _api('GET', '/api/diary/setup');
    const hasSetup = res.success && res.setup_token;

    if (hasSetup) {
      el('dp-setup-btn').style.display = 'none';
      el('dp-unlock-btn').textContent = '🔓 Desbloquear';
      const bioBtn = el('dp-bio-btn');
      if (bioBtn) {
        const avail = await window.BiometricAuth.isAvailable();
        bioBtn.style.display = avail && window.BiometricAuth.isEnabled() ? 'inline-flex' : 'none';
      }
    } else {
      el('dp-setup-btn').style.display = 'inline-block';
      el('dp-unlock-btn').style.display = 'none';
    }
    _show('dp-locked');
  }

  async function bioUnlock() {
    try {
      const ok = await window.BiometricAuth.authenticate('Desbloquear Diario Personal');
      if (!ok) return;
      const pw = _pw();
      if (pw) {
        _key = await _deriveKey(pw);
        const r2 = await _api('GET', '/api/diary/setup');
        if (r2.success && r2.setup_token) {
          const dec = await _decrypt(r2.setup_token);
          if (dec === VERIFY_PLAINTEXT) { _loadList(); return; }
        }
      }
      _showError('Identidad verificada. Ingresá tu contraseña.');
    } catch(_) {}
  }

  function showSetup() {
    const pw = el('dp-password-input').value.trim();
    setupPassword(pw);
  }

  async function _loadList() {
    _show('dp-list');
    el('dp-entries-list').innerHTML = '<div style="text-align:center;color:#645a78;padding:20px;">Cargando...</div>';
    _toggleEmpty();
    const bioBtn = el('dp-bio-toggle');
    if (bioBtn) {
      const avail = await window.BiometricAuth.isAvailable();
      if (avail) {
        bioBtn.style.display = 'inline-flex';
        const enabled = window.BiometricAuth.isEnabled();
        bioBtn.textContent = enabled ? '🖐️ Huella Activada' : '🖐️ Activar Huella';
        bioBtn.style.borderColor = enabled ? 'rgba(52,199,89,0.4)' : 'rgba(147,83,255,0.3)';
        bioBtn.style.background = enabled ? 'rgba(52,199,89,0.1)' : 'rgba(147,83,255,0.08)';
      }
    }
    try {
      const res = await _api('GET', '/api/diary');
      if (!res.success) { el('dp-entries-list').innerHTML = ''; _toggleEmpty(); return; }
      if (!res.entries || res.entries.length === 0) {
        el('dp-entries-list').innerHTML = '';
        _toggleEmpty();
        return;
      }
      let html = '';
      for (const e of res.entries) {
        let title = '(sin título)';
        try {
          const decrypted = await _decrypt(e.encrypted_data);
          const parsed = JSON.parse(decrypted);
          if (parsed.title) title = parsed.title;
        } catch(_) {}
        const date = new Date(e.created_at);
        const dateStr = date.toLocaleDateString('es-AR', { day:'2-digit', month:'short', year:'numeric' }) + ' ' + date.toLocaleTimeString('es-AR', { hour:'2-digit', minute:'2-digit' });
        html += `<div onclick="Diary.openReader(${e.id})">
          <div style="font-size:0.88rem;color:var(--gold-bright);font-family:'Cinzel',serif;font-weight:600;">${_esc(title)}</div>
          <div style="font-size:0.7rem;color:#645a78;">${dateStr}</div>
        </div>`;
      }
      el('dp-entries-list').innerHTML = html;
      _toggleEmpty();
    } catch(e) {
      el('dp-entries-list').innerHTML = '';
      _toggleEmpty();
    }
  }

  function openEditor() {
    _currentEntryId = null;
    _isNew = true;
    el('dp-edit-title').value = '';
    el('dp-edit-body').value = '';
    // Random prompt
    const t = el('dp-editor-title');
    const q = el('dp-editor-prompt');
    if (t && q) {
      const p = EDITOR_PROMPTS[Math.floor(Math.random() * EDITOR_PROMPTS.length)];
      t.textContent = p.title;
      q.textContent = p.quote;
    }
    updateCounter();
    _show('dp-editor');
  }

  function cancelEditor() {
    _currentEntryId = null;
    _show('dp-list');
  }

  async function saveEntry() {
    if (!_key) { _showError('Primero desbloqueá el diario con tu contraseña'); return; }
    const title = el('dp-edit-title').value.trim();
    const body = el('dp-edit-body').value.trim();
    if (!title && !body) { _showError('Escribí algo antes de guardar'); return; }
    try {
      const plaintext = JSON.stringify({ title, body });
      const payload = await _encrypt(plaintext);
      if (_currentEntryId) {
        const res = await _api('PUT', '/api/diary/' + _currentEntryId, { encrypted_data: payload });
        if (!res.success) { _showError('Error al actualizar'); return; }
      } else {
        const res = await _api('POST', '/api/diary', { encrypted_data: payload });
        if (!res.success) { _showError('Error al guardar'); return; }
      }
      _currentEntryId = null;
      _loadList();
    } catch(e) {
      _showError('Error: ' + e.message);
    }
  }

  async function openReader(id) {
    const res = await _api('GET', '/api/diary');
    if (!res.entries) return;
    const entry = res.entries.find(e => e.id === id);
    if (!entry) { _showError('Entrada no encontrada'); return; }
    try {
      const decrypted = await _decrypt(entry.encrypted_data);
      const parsed = JSON.parse(decrypted);
      _currentEntryId = id;
      el('dp-reader-title').textContent = parsed.title || '(sin título)';
      el('dp-reader-body').textContent = parsed.body || '';
      const date = new Date(entry.created_at);
      el('dp-reader-date').textContent = '📅 ' + date.toLocaleDateString('es-AR', { day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' });
      _show('dp-reader');
    } catch(e) {
      _showError('Error al descifrar: ' + e.message);
    }
  }

  function editEntry() {
    if (!_currentEntryId) return;
    const title = el('dp-reader-title').textContent;
    const body = el('dp-reader-body').textContent;
    el('dp-edit-title').value = title === '(sin título)' ? '' : title;
    el('dp-edit-body').value = body;
    const te = el('dp-editor-title');
    const qe = el('dp-editor-prompt');
    if (te) te.textContent = '✏️ Editando';
    if (qe) qe.textContent = '"Corregir no es castigarse. Es re-escribirte mejor."';
    updateCounter();
    _isNew = false;
    _show('dp-editor');
  }

  async function deleteEntry() {
    if (!_currentEntryId) return;
    if (!confirm('¿Borrar esta entrada? No se puede recuperar (está cifrada localmente).')) return;
    try {
      const res = await _api('DELETE', '/api/diary/' + _currentEntryId);
      if (res.success) {
        _currentEntryId = null;
        _loadList();
      } else {
        _showError('Error al borrar');
      }
    } catch(e) {
      _showError('Error: ' + e.message);
    }
  }

  function backToList() {
    _currentEntryId = null;
    _loadList();
  }

  function _esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  async function toggleBio() {
    const btn = el('dp-bio-toggle');
    if (!btn) return;
    const avail = await window.BiometricAuth.isAvailable();
    if (!avail) { _showError('Huella no disponible en este dispositivo'); return; }
    const enabled = !window.BiometricAuth.isEnabled();
    window.BiometricAuth.setEnabled(enabled);
    btn.textContent = enabled ? '🖐️ Huella Activada' : '🖐️ Activar Huella';
    btn.style.borderColor = enabled ? 'rgba(52,199,89,0.4)' : 'rgba(147,83,255,0.3)';
    btn.style.background = enabled ? 'rgba(52,199,89,0.1)' : 'rgba(147,83,255,0.08)';
  }

  function updateCounter() {
    const ta = el('dp-edit-body');
    const counter = el('dp-edit-counter');
    if (!ta || !counter) return;
    const txt = (ta.value || '').trim();
    const words = txt ? txt.split(/\s+/).length : 0;
    counter.textContent = words + (words === 1 ? ' palabra' : ' palabras');
  }

  function usePrompt(btn) {
    const ta = el('dp-edit-body');
    if (!ta) return;
    const txt = btn.textContent.trim();
    const cur = ta.value || '';
    ta.value = (cur ? (cur.endsWith('\n\n') ? cur : cur + '\n\n') : '') + txt + '\n\n';
    ta.focus();
    ta.selectionStart = ta.selectionEnd = ta.value.length;
    updateCounter();
  }

  function _toggleEmpty() {
    const list = el('dp-entries-list');
    const empty = el('dp-entries-empty');
    const pill = el('dp-count-pill');
    if (!list || !empty) return;
    const count = list.children.length;
    empty.style.display = (count === 0) ? '' : 'none';
    list.style.display = (count === 0) ? 'none' : '';
    if (pill) pill.textContent = count;
  }

  return {
    init, unlock, showSetup, openEditor, cancelEditor, saveEntry,
    openReader, editEntry, deleteEntry, backToList, bioUnlock, toggleBio,
    _esc, updateCounter, usePrompt, _toggleEmpty
  };
})();

// ⛧ GLOW-UP v3.6 — Diary MutationObserver for empty state
document.addEventListener('DOMContentLoaded', function(){
  const list = document.getElementById('dp-entries-list');
  if (!list) return;
  const obs = new MutationObserver(() => { if (window.Diary._toggleEmpty) window.Diary._toggleEmpty(); });
  obs.observe(list, { childList: true });
});

/* ===================================================================================
   SOCIAL MODULE — Profile search, access requests, connections, permissions
   =================================================================================== */
(function() {
  const $ = id => document.getElementById(id);
  const esc = s => { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; };

  let _searchTimer = null;
  let _loaded = false;

  window.showSocialSection = function(section) {
    ['socialRequestsSection','socialConnectionsSection','socialSettingsSection'].forEach(id => {
      $(id).style.display = id.includes(section) ? 'block' : 'none';
    });
    if (section === 'requests') loadAccessRequests();
    if (section === 'connections') loadConnections();
    if (section === 'settings') loadJournalSettings();
  };

  window.debounceSocialSearch = function() {
    clearTimeout(_searchTimer);
    _searchTimer = setTimeout(() => searchUsers(), 400);
  };

  async function searchUsers() {
    const q = $('socialUserSearch').value.trim().toUpperCase();
    const res = $('socialSearchResults');
    if (!q) { res.style.display = 'none'; return; }

    let data;
    try {
      data = await API.searchUsers(q);
    } catch(e) {
      res.innerHTML = '<p class="mf-text" style="padding:12px;">🔍 Error al buscar usuarios</p>';
      res.style.display = 'block';
      return;
    }

    const matches = (data.users || []).filter(u => u.code !== window.TNSVT_USER?.code);

    if (matches.length === 0) {
      res.innerHTML = '<p class="mf-text" style="padding:12px;">🔍 No se encontraron usuarios</p>';
      res.style.display = 'block';
      return;
    }

    let html = '<div style="margin-top:8px;">';
    for (const u of matches) {
      try {
        const status = await API.getAccessStatus(u.code, window.TNSVT_USER.code);
        let actionBtn = '';
        const viewBtn = `<button class="post-btn" onclick="viewUserJournal('${esc(u.code)}','${esc(u.name)}')" style="padding:6px 10px;font-size:0.65rem;background:rgba(138,60,255,0.15);border-color:rgba(138,60,255,0.4);">📊 Ver Journal</button>`;
        if (status.status === 'none' || status.status === 'rejected') {
          actionBtn = `<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;"><button class="post-btn" onclick="sendAccessReq('${esc(u.code)}')" style="padding:6px 12px;font-size:0.7rem;">➕ Solicitar Acceso</button>${viewBtn}</div>`;
        } else if (status.status === 'pending') {
          actionBtn = `<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;"><span class="social-request-badge">⏳ Pendiente</span>${viewBtn}</div>`;
        } else if (status.status === 'connected') {
          actionBtn = `<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;"><span class="social-request-badge" style="border-color:#34c759;background:rgba(52,199,89,0.1);color:#34c759;">✅ Conectado</span>${viewBtn}</div>`;
        } else if (status.status === 'owner') {
          actionBtn = `<span class="social-request-badge" style="border-color:var(--gold);background:rgba(212,175,55,0.1);color:var(--gold);">👑 Tuyo</span>`;
        } else if (status.status === 'received_pending') {
          actionBtn = `<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;"><span class="social-request-badge">📨 Solicitud recibida</span>${viewBtn}</div>`;
        }
        html += `<div class="social-user-card">
          <div>
            <div class="name">${esc(u.name)}</div>
            <div class="code">${esc(u.code)}</div>
          </div>
          <div>${actionBtn}</div>
        </div>`;
      } catch(e) {
        console.warn('Social search error:', e);
      }
    }
    html += '</div>';
    res.innerHTML = html;
    res.style.display = 'block';
  }

  window.sendAccessReq = async function(targetCode) {
    try {
      await API.sendAccessRequest(targetCode, window.TNSVT_USER.code);
      showToast('📨 Solicitud enviada');
      searchUsers(); // refresh
    } catch(e) {
      showToast('❌ ' + e.message);
    }
  };

  async function loadAccessRequests() {
    try {
      const data = await API.getAccessRequests(window.TNSVT_USER.code);
      const received = $('socialRequestsReceived');
      const sent = $('socialRequestsSent');

      if (data.received.length === 0) {
        received.innerHTML = '<p class="mf-text">No tenés solicitudes pendientes</p>';
      } else {
        received.innerHTML = data.received.map(r => `
          <div class="social-user-card">
            <div>
              <div class="name">${esc(r.requester_name)}</div>
              <div class="code">${esc(r.requester_code)}</div>
            </div>
            <div style="display:flex;gap:6px;">
              <button class="post-btn" onclick="respondAccessReq(${r.id},'accepted')" style="padding:6px 12px;font-size:0.7rem;background:rgba(52,199,89,0.15);border-color:#34c759;color:#34c759;">✅ Aceptar</button>
              <button class="post-btn" onclick="respondAccessReq(${r.id},'rejected')" style="padding:6px 12px;font-size:0.7rem;background:rgba(255,59,48,0.1);border-color:#ff3b30;color:#ff3b30;">❌ Rechazar</button>
            </div>
          </div>
        `).join('');
      }

      if (data.sent.length === 0) {
        sent.innerHTML = '<p class="mf-text">No enviaste solicitudes pendientes</p>';
      } else {
        sent.innerHTML = data.sent.map(r => `
          <div class="social-user-card">
            <div>
              <div class="name">${esc(r.target_name)}</div>
              <div class="code">${esc(r.target_code)}</div>
            </div>
            <div>
              <span class="social-request-badge">⏳ Pendiente</span>
            </div>
          </div>
        `).join('');
      }
    } catch(e) {
      showToast('❌ Error al cargar solicitudes: ' + e.message);
    }
  }

  window.respondAccessReq = async function(id, status) {
    try {
      await API.respondAccessRequest(id, status, window.TNSVT_USER.code);
      showToast(status === 'accepted' ? '✅ Solicitud aceptada' : '❌ Solicitud rechazada');
      loadAccessRequests();
    } catch(e) {
      showToast('❌ ' + e.message);
    }
  };

  async function loadConnections() {
    try {
      const data = await API.getConnections(window.TNSVT_USER.code);
      const list = $('socialConnectionsList');
      if (!data.connections || data.connections.length === 0) {
        list.innerHTML = '<p class="mf-text">Aún no tenés conexiones. Buscá usuarios para conectar.</p>';
        return;
      }
      list.innerHTML = data.connections.map(c => `
        <div class="social-user-card">
          <div>
            <div class="name">${esc(c.user_name)}</div>
            <div class="code">${esc(c.user_code)}</div>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button class="post-btn" onclick="viewUserJournal('${esc(c.user_code)}','${esc(c.user_name)}')" style="padding:6px 10px;font-size:0.65rem;">📊 Ver Journal</button>
            <button class="post-btn" onclick="viewConnectionPerms('${esc(c.user_code)}','${esc(c.user_name)}')" style="padding:6px 10px;font-size:0.65rem;">🔑 Permisos</button>
            <button class="post-btn" onclick="removeConnection(${c.id})" style="padding:6px 10px;font-size:0.65rem;background:rgba(255,59,48,0.1);border-color:#ff3b30;color:#ff3b30;">✕</button>
          </div>
        </div>
      `).join('');
    } catch(e) {
      showToast('❌ ' + e.message);
    }
  }

  window.removeConnection = async function(id) {
    if (!confirm('¿Eliminar conexión? También se eliminarán los permisos mutuos.')) return;
    try {
      await API.removeConnection(id, window.TNSVT_USER.code);
      showToast('🔗 Conexión eliminada');
      loadConnections();
    } catch(e) {
      showToast('❌ ' + e.message);
    }
  };

  window.viewConnectionPerms = function(targetCode, targetName) {
    const modal = $('socialProfileModal');
    const content = $('socialProfileContent');
    modal.style.display = 'flex';
    $('socialProfileName').textContent = '🔑 Permisos para ' + targetName;

    API.getPermissions(targetCode, window.TNSVT_USER.code).then(data => {
      const p = data.permissions || {};
      const fields = [
        { key: 'can_view_stats', label: 'Ver estadísticas' },
        { key: 'can_view_trades', label: 'Ver trades (entry, SL, TP)' },
        { key: 'can_view_notes', label: 'Ver notas de trades' },
        { key: 'can_view_comments', label: 'Ver comentarios' },
        { key: 'can_download_csv', label: 'Descargar CSV' },
        { key: 'can_view_realtime', label: 'Ver en tiempo real' },
      ];
      content.innerHTML = `
        <p class="mf-text" style="margin-bottom:12px;">Configurá qué puede ver <strong>${esc(targetName)}</strong> de tu journal:</p>
        ${fields.map(f => `
          <div class="permission-toggle">
            <label>${esc(f.label)}</label>
            <input type="checkbox" ${p[f.key] !== false ? 'checked' : ''} onchange="updatePerm('${esc(targetCode)}','${f.key}',this.checked)">
          </div>
        `).join('')}
        <button class="post-btn" onclick="closeSocialProfile()" style="margin-top:12px;width:100%;">Cerrar</button>
      `;
    }).catch(e => {
      content.innerHTML = '<p class="mf-text">Error: ' + esc(e.message) + '</p>';
    });
  };

  window.updatePerm = async function(targetCode, key, value) {
    try {
      await API.updatePermissions(targetCode, { [key]: value }, window.TNSVT_USER.code);
    } catch(e) {
      showToast('❌ ' + e.message);
    }
  };

  window.closeSocialProfile = function() {
    $('socialProfileModal').style.display = 'none';
  };

  async function loadJournalSettings() {
    console.log('[social] loadJournalSettings');
    if (!window.TNSVT_USER) { showToast('❌ No hay usuario logueado'); return; }
    try {
      const data = await API.getJournalSettings(window.TNSVT_USER.code);
      console.log('[social] journal settings:', data);
      $('socialVisibilitySelect').value = data.visibility || 'public';
    } catch(e) {
      console.error('[social] loadJournalSettings error:', e);
      showToast('❌ ' + e.message);
    }
  }

  window.updateJournalVisibility = async function() {
    console.log('[social] updateJournalVisibility called');
    const v = $('socialVisibilitySelect').value;
    console.log('[social] visibility selected:', v);
    if (!window.TNSVT_USER) { showToast('❌ No hay usuario logueado'); return; }
    try {
      const res = await API.updateJournalSettings(v, window.TNSVT_USER.code);
      console.log('[social] visibility response:', res);
      showToast('⚙️ Visibilidad actualizada');
    } catch(e) {
      console.error('[social] visibility error:', e);
      showToast('❌ ' + e.message);
    }
  };

  // Close modal on overlay click
  document.addEventListener('click', function(e) {
    const modal = $('socialProfileModal');
    if (e.target === modal) modal.style.display = 'none';
  });

  // Init on login
  document.addEventListener('tnsvt:login', function() {
    _loaded = true;
  });

  window.loadAccessRequests = loadAccessRequests;
  window.loadConnections = loadConnections;
  window.loadJournalSettings = loadJournalSettings;
})();
