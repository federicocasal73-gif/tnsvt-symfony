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
        const passField = document.getElementById('gatePass');
        const hint = document.getElementById('adminPassHint');
        if (code === 'ADMIN01') {
          passField.style.display = 'block';
          hint.style.display = 'block';
        } else {
          passField.style.display = 'none';
          hint.style.display = 'none';
        }
      }

      async function verifyGateKey() {
        const code = document.getElementById('gateKey').value.trim().toUpperCase();
        const password = document.getElementById('gatePass')?.value || '';
        if (!code) { showToast("⚠️ Ingresá tu código de acceso."); return; }
        if (!sb) { showToast("❌ API no disponible."); return; }
        showToast("🔄 Verificando código...");
        try {
          const data = await sb.login(code, password);
          if (!data.success || !data.user) {
            const err = data.error || 'Código inválido';
            showToast("❌ " + err);
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
          showToast("✨ Acceso concedido, " + (data.user.name || "Trader") + " ✨");
          updateNodeStates();
          loaderInitWatch();
          if (typeof initAllPanels === 'function') initAllPanels();
        } catch (e) {
          showToast("❌ Error de conexión — intentá de nuevo.");
        }
      }

      function logout() {
        sessionStorage.removeItem('tnsv_auth');
        localStorage.removeItem('tnsv_user');
        window.TNSVT_USER = null;
        document.getElementById('main-content').style.display = 'none';
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('gateKey').value = '';
        document.getElementById('gatePass').value = '';
        document.getElementById('gatePass').style.display = 'none';
        document.getElementById('adminPassHint').style.display = 'none';
        document.getElementById('adminSidebarBtn').style.display = 'none';
        document.getElementById('hub-view').style.display = 'flex';
        document.getElementById('module-panel').style.display = 'none';
        document.getElementById('trading-panel').style.display = 'none';
        showToast("🔒 Sesión cerrada.");
        try { fetch('/api/auth/logout', { method: 'POST' }); } catch(e) {}
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

      function switchTab(tabId) {
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');
        const btn = document.querySelector(`.sidebar-btn[onclick*="'${tabId}'"]`);
        if (btn) btn.classList.add('active');
        if (tabId === 'tab-admin') adminRefreshList();
      }
      function switchTradingTab(tabId) { switchTab(tabId); }

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
          const cachedUser = localStorage.getItem('tnsv_user');
          if (cachedUser) {
            activeUserSession = JSON.parse(cachedUser);
            document.getElementById('profileCodename').innerText = activeUserSession.codename || "Alma Electa";
            window.TNSVT_USER = {
              code: activeUserSession.token,
              name: activeUserSession.codename || 'Trader',
              isAdmin: !!activeUserSession.isAdmin
            };
          }
          updateNodeStates();
          loaderInitWatch();
          if (typeof initAllPanels === 'function') initAllPanels();
        }
      }

      function showToast(msg) {
        const t = document.getElementById('toast');
        t.innerText = msg;
        t.style.display = 'block';
        setTimeout(() => t.style.display = 'none', 3000);
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
      const calendarEvents = [
        { time: "04:30 AM (Londres)", currency: "GBP", event: "Flash Manufacturing PMI", impact: "HIGH", focus: "Mitigación estructural de libras esterlinas." },
        { time: "09:30 AM (N. York)", currency: "USD", event: "Discurso del Presidente de la FED", impact: "HIGH", focus: "Proyección de tasas." },
        { time: "11:00 AM (N. York)", currency: "EUR", event: "Convergencia de Datos de Inflación", impact: "MED", focus: "Búsqueda de lateralizaciones." },
        { time: "08:30 PM (Asia)", currency: "AUD", event: "Tasa de Desempleo Oficial", impact: "HIGH", focus: "Caza de Liquidez Externa." }
      ];

      
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
      
      function loadCalendarData() {
        const tbody = document.getElementById('calendarTableBody');
        if (!tbody) return;
        tbody.innerHTML = calendarEvents.map(e => `
          <tr>
            <td style="font-family:'Orbitron'; font-size:0.8rem;">${e.time}</td>
            <td style="font-weight:700; color:var(--gold-bright);">${e.currency}</td>
            <td>${e.event}</td>
            <td><span class="impact-badge ${e.impact === 'HIGH' ? 'impact-high' : 'impact-med'}">${e.impact}</span></td>
            <td style="color:#a499b8; font-size:0.85rem;">${e.focus}</td>
          </tr>
        `).join('');
      }

      // ==================== TRADING JOURNAL (versión completa) ====================
      let tjTrades = JSON.parse(localStorage.getItem('tj_trades') || '[]');
      let tjLoaded = false;
      let tjEditingId = null;
      let tjCalMonth = new Date().getMonth();
      let tjCalYear = new Date().getFullYear();
      let tjPeriodFilter = 'all';
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
            const maxW = 900;
            const scale = Math.min(1, maxW / img.width);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const compressed = canvas.toDataURL('image/jpeg', 0.7);
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
        const wasEditing = tjEditingId;
        try {
          if (tjEditingId) {
            await sb.updateTrade(tjEditingId, trade);
            const idx = tjTrades.findIndex(t => t.id === tjEditingId);
            if (idx > -1) tjTrades[idx] = { ...tjTrades[idx], ...trade };
          } else {
            const result = await sb.createTrade(trade);
            trade.id = result.id || Date.now();
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
        try { await sb.deleteTrade(id); } catch(e) {}
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
                +'<div style="display:flex;flex-direction:column;gap:2px;">'
                  +'<button class="tj-del-btn" onclick="event.stopPropagation();tjEditTrade('+t.id+')" title="Editar">✏️</button>'
                  +'<button class="tj-del-btn" onclick="event.stopPropagation();tjDeleteTrade('+t.id+')" title="Eliminar">🗑</button>'
                +'</div>'
              +'</div>';
            }).join('');
          } else {
            if(noTrades){ noTrades.style.display='block'; noTrades.textContent='Aún no hay trades. Usá "Registrar" para empezar.'; }
            list.innerHTML='';
          }
        }

        tjRenderStats();
        tjRenderCal();
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
          if (!tradeDates[d]) tradeDates[d] = [];
          tradeDates[d].push(t.result);
        });
        let html = '';
        for (let i = 0; i < startDay; i++) html += '<div class="tj-cal-cell empty"></div>';
        for (let d = 1; d <= lastDay; d++) {
          const ds = tjCalYear + '-' + String(tjCalMonth + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
          const isToday = d === today.getDate() && tjCalMonth === today.getMonth() && tjCalYear === today.getFullYear();
          let cls = 'tj-cal-cell';
          if (isToday) cls += ' today';
          let clickAttr = '';
          if (tradeDates[ds]) {
            cls += ' has-trades';
            if (tradeDates[ds].includes('WIN')) cls += ' has-win';
            else if (tradeDates[ds].includes('LOSS')) cls += ' has-loss';
            clickAttr = ` onclick="openTjDay('${ds}')"`;
          }
          html += `<div class="${cls}"${clickAttr}>${d}</div>`;
        }
        grid.innerHTML = html;
      }

      function openTjDay(dateStr) {
        const dayTrades = tjTrades.filter(t => t.date.slice(0, 10) === dateStr);
        if (!dayTrades.length) return;
        const modal = document.getElementById('tjDayModal');
        if (!modal) return;
        const [y, m, d] = dateStr.split('-');
        const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        const titleEl = document.getElementById('tjDayTitle');
        if(titleEl) titleEl.textContent = parseInt(d)+' de '+months[parseInt(m)-1]+' '+y;
        const dayPnl = dayTrades.reduce((s,t)=>s+t.pnl,0);
        const dayWins = dayTrades.filter(t=>t.result==='WIN').length;
        const summaryEl = document.getElementById('tjDaySummary');
        if(summaryEl) summaryEl.innerHTML = dayTrades.length+' trade'+(dayTrades.length>1?'s':'')+' · '+dayWins+'W · PNL: <strong style="color:'+(dayPnl>=0?'#34c759':'var(--red-impact)')+';">$'+(dayPnl>=0?'+':'')+dayPnl.toFixed(2)+'</strong>';
        const tradesEl = document.getElementById('tjDayTrades');
        if(tradesEl) tradesEl.innerHTML = dayTrades.map(t => {
          const rColor=t.result==='WIN'?'#34c759':t.result==='LOSS'?'var(--red-impact)':'var(--orange-impact)';
          const rIcon=t.result==='WIN'?'✅':t.result==='LOSS'?'❌':'↔️';
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
          +'</div>';
        }).join('');
        modal.classList.add('vis');
      }

      function closeTjDay() { document.getElementById('tjDayModal')?.classList.remove('vis'); }
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
      }

      function toggleSignalForm() {
        const sf = document.getElementById('signalForm');
        if (!sf) return;
        sf.classList.toggle('vis');
        if (sf.classList.contains('vis')) {
          sf.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }

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

      function _getDailyCode() {
        const now = new Date();
        return String((now.getDate() + (now.getMonth() + 1) + _S) % 9999).padStart(4, '0');
      }

      let adminAuthenticated = false;
      let acadCoursesCache = [];

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
        try {
          const users = await sb.get('/api/admin/users');
          const stats = await sb.get('/api/admin/dashboard');
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
            const actions = u.isAdmin
              ? '<span style="color:#645a78; font-size:0.75rem;">—</span>'
              : `<button class="admin-btn-edit" onclick="adminShowEditForm(${u.id},'${u.code}','${u.name.replace(/'/g,"\\'")}')">✏️</button>
                 <button class="admin-btn-danger" onclick="adminToggleActive(${u.id})">${u.active ? '🔒' : '🔓'}</button>`;
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
        } catch(e) {
          tbody.innerHTML = `<tr><td colspan="5" style="padding:20px; text-align:center; color:#ff3b30;">Error: ${e.message}</td></tr>`;
        }
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
        const usersContent = document.getElementById('adminSubtabContentUsers');
        const tasksContent = document.getElementById('adminSubtabContentTasks');
        const musicContent = document.getElementById('adminSubtabContentMusic');
        const resetBtn = (btn) => { if (!btn) return; btn.style.color = '#645a78'; btn.style.borderBottomColor = 'transparent'; };
        const activateBtn = (btn) => { if (!btn) return; btn.style.color = 'var(--gold-bright)'; btn.style.borderBottomColor = 'var(--gold)'; };
        if (tab === 'tasks') {
          resetBtn(usersBtn); activateBtn(tasksBtn); resetBtn(musicBtn);
          usersContent.style.display = 'none'; tasksContent.style.display = 'block'; musicContent.style.display = 'none';
          adminRefreshTasks();
        } else if (tab === 'music') {
          resetBtn(usersBtn); resetBtn(tasksBtn); activateBtn(musicBtn);
          usersContent.style.display = 'none'; tasksContent.style.display = 'none'; musicContent.style.display = 'block';
          adminMusicRefresh();
        } else {
          activateBtn(usersBtn); resetBtn(tasksBtn); resetBtn(musicBtn);
          tasksContent.style.display = 'none'; musicContent.style.display = 'none'; usersContent.style.display = 'block';
        }
      }

      // ==================== ADMIN PLAYLIST DE MÚSICA ====================
      let adminPlaylistData = { tracks: [], activeIndex: 0, loop: 'all' };

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
      let activeConvId = null;
      let chatPhotoData = null;
      let chatLastMessageId = 0;
      let chatPollTimer = null;

      function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }

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
              <div class="chat-conv-avatar ${av.cls}">${av.text}</div>
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
          renderConversations();
          // Auto-select first conv if none active
          if (!activeConvId && chatConversations.length > 0) {
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
        if (nameEl) nameEl.textContent = convDisplayName(conv);
        if (subEl) {
          if (conv.type === 'group') subEl.textContent = 'Conversación grupal';
          else if (conv.type === 'ai') subEl.textContent = 'Coach IA';
          else subEl.textContent = 'Mensaje directo';
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
          } catch(e) {}
        }
        // Refresh sidebar every poll
        try {
          const data = await sb.getConversations(window.TNSVT_USER.code);
          if (data) {
            chatConversations = data;
            renderConversations();
          }
        } catch(e) {}
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

      // ==================== INICIALIZACIÓN GENERAL ====================
      async function initAllPanels() {
        loadTasks();
        loadCalendarData();
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
        const u = window.TNSVT_USER;
        if (u && u.isAdmin) {
          document.getElementById('adminSidebarBtn').style.display = 'block';
          adminRefreshList();
        }
      }

      async function loadJournalFromApi() {
        if (!window.TNSVT_USER) return;
        try {
          const data = await sb.getJournal(window.TNSVT_USER.code);
          if (data && data.length) {
            tjTrades = data;
            tjLoaded = true;
          }
        } catch(e) {}
        tjRefresh();
      }

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
      window.loadCalendarData = loadCalendarData;
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
      window.toggleSignalForm = toggleSignalForm;
      window.createNewPost = createNewPost;
      window.likeFeedPost = likeFeedPost;
      window.deletePost = deletePost;
      window.attachPostPhoto = attachPostPhoto;
      window.removePostPhoto = removePostPhoto;
      window.attachSignalPhoto = attachSignalPhoto;
      window.removeSignalPhoto = removeSignalPhoto;
      window.removePostPhoto = removePostPhoto;
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
      window.musicSeek = musicSeek;
      window.adminMusicRefresh = adminMusicRefresh;
      window.adminMusicUpload = adminMusicUpload;
      window.adminMusicDelete = adminMusicDelete;
      window.adminMusicSetExternal = adminMusicSetExternal;

      // ==================== PLAYER DE MÚSICA DE FONDO (PLAYLIST + VISUALIZER) ====================
      let bgAudio = null;
      let bgAudioSrc = null;
      let musicPlaylist = [];
      let musicActiveIndex = 0;
      let musicLoop = 'all';
      let musicAudioCtx = null;
      let musicAnalyser = null;
      let musicSourceNode = null;
      let musicVizRAF = null;
      let musicVizActive = false;
      let musicUserIsAdvancing = false;

      function musicGetAudio() {
        if (!bgAudio) bgAudio = document.getElementById('bgMusicAudio');
        return bgAudio;
      }
      function musicSetBtnState(playing) {
        const btn = document.getElementById('musicToggleBtn');
        if (!btn) return;
        btn.innerHTML = playing ? '⏸' : '▶';
        btn.title = playing ? 'Pausar' : 'Reproducir';
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
      function musicSetAudioSrc(trackId) {
        const a = musicGetAudio();
        if (!a) return;
        const newSrc = trackId ? ('/api/music/stream?id=' + encodeURIComponent(trackId) + '&t=' + Date.now())
                              : ('/api/music/stream?t=' + Date.now());
        a.src = newSrc;
        bgAudioSrc = newSrc;
        a.load();
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
      }
      function musicMinimize() {
        document.getElementById('musicPlayer').style.display = 'none';
        document.getElementById('musicPlayerMini').style.display = 'block';
      }
      function musicExpand() {
        document.getElementById('musicPlayer').style.display = 'flex';
        document.getElementById('musicPlayerMini').style.display = 'none';
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
        const a = musicGetAudio();
        const playing = a && !a.paused && !a.ended;
        if (cv) musicDrawOnCanvas(cv, playing);
        if (cvMini) musicDrawOnCanvas(cvMini, playing, true);
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
      function musicStopViz() {
        musicVizActive = false;
        if (musicVizRAF) cancelAnimationFrame(musicVizRAF);
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
      let notifList = JSON.parse(localStorage.getItem('tnsvt_notifs') || '[]');
      let notifChannel = null;
      let pushPermGranted = false;

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

      // ---- Render panel ----
      function renderNotifPanel() {
        const list = document.getElementById('notifList');
        if (!list) return;
        if (!notifList.length) {
          list.innerHTML = '<div class="notif-empty">🔔<br>Sin notificaciones aún.<br>Las señales y actividad<br>aparecerán aquí.</div>';
          return;
        }
        list.innerHTML = notifList.slice(0, 30).map(n => {
          const iconMap = { signal: '📊', like: '♥', comment: '💬', post: '✨' };
          const timeStr = timeAgoStr(n.ts);
          return `
            <div class="notif-item ${n.read ? '' : 'unread'}" onclick="markOneRead('${n.id}')">
              <div class="notif-icon ${n.type}">${iconMap[n.type] || '🔔'}</div>
              <div class="notif-body">
                <div class="notif-text">${n.text}</div>
                <div class="notif-time">${timeStr}</div>
              </div>
            </div>`;
        }).join('');
      }

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
      }

      function markAllRead() {
        notifList.forEach(n => n.read = true);
        saveNotifs(); updateBadge(); renderNotifPanel();
      }

      function markOneRead(id) {
        const n = notifList.find(x => x.id === id);
        if (n) { n.read = true; saveNotifs(); updateBadge(); renderNotifPanel(); }
        // Ir al feed
        switchTab('tab-feed');
        document.querySelector('.sidebar-btn')?.classList.remove('active');
        document.querySelector('[onclick*="tab-feed"]')?.classList.add('active');
        document.getElementById('notifPanel')?.classList.remove('open');
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
        if (Notification.permission === 'granted') { pushPermGranted = true; return; }
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
            pushPermGranted = true;
            document.getElementById('pushPermBar')?.classList.remove('show');
            showToast('✅ Notificaciones activadas');
            new Notification('T.N.S.V.T', { body: '✅ Recibirás alertas de señales y actividad.', icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⛧</text></svg>' });
          } else {
            showToast('Permisos denegados. Activá desde el navegador manualmente.');
            dismissPushBar();
          }
        });
      }

      function dismissPushBar() {
        document.getElementById('pushPermBar')?.classList.remove('show');
        localStorage.setItem('tnsvt_push_dismissed', '1');
      }

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
        setInterval(async () => {
          try {
            const result = await sb.getNotifCount(window.TNSVT_USER.code);
            if (result.count > 0) {
              const badge = document.getElementById('notifBadge');
              if (badge) { badge.textContent = result.count > 9 ? '9+' : result.count; badge.classList.add('show'); }
            }
          } catch(e) {}
        }, 30000);
      }

      window.toggleNotifPanel = toggleNotifPanel;
      window.markAllRead = markAllRead;
      window.markOneRead = markOneRead;
      window.addNotif = addNotif;
      window.initNotifRealtime = initNotifRealtime;
      window.requestPushPermission = requestPushPermission;
      window.dismissPushBar = dismissPushBar;
      window.checkPushPermission = checkPushPermission;
      function setupCalFilters() {
        const countries = document.querySelectorAll('.cal-country-btn');
        const impacts = document.querySelectorAll('.cal-impact-btn');
        const iframe = document.getElementById('cal-iframe');
        if (!iframe) return;

        function applyFilters() {
          const selCountries = [...countries].filter(b => b.classList.contains('active'))
            .map(b => b.getAttribute('data-country'));
          const selImpacts = [...impacts].filter(b => b.classList.contains('active'))
            .map(b => b.getAttribute('data-impact'));
          const url = '/calendar/widget?countries=' + (selCountries.join(',') || 'USD') + '&impact=' + (selImpacts.join(',') || '1,2,3');
          iframe.src = url;
        }

        [...countries, ...impacts].forEach(btn => {
          btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            if (btn.classList.contains('active')) {
              btn.style.background = 'var(--gold)';
              btn.style.color = '#000';
              btn.style.border = 'none';
            } else {
              btn.style.background = 'transparent';
              btn.style.color = '#a499b8';
              btn.style.border = '1px solid rgba(212,175,55,0.3)';
            }
            applyFilters();
          });
        });
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
