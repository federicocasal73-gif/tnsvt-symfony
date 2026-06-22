(() => {
  let chart = null;
  let candleSeries = null;
  let volumeSeries = null;
  let activeTool = 'cursor';
  let pollTimer = null;
  let initCalled = false;
  let overlayCtx = null;
  let overlayCanvas = null;
  let mercureES = null;
  let tickerES = null;
  let mercureConnected = false;
  let cachedCandles = [];
  let isFullscreen = false;

  const drawings = [];
  const drawingHistory = [];
  let currentStart = null;
  let currentEnd = null;
  let currentSymbolKey = '';

  const DRAW_COLORS = {
    trend: '#4ade80', hline: '#f87171', vline: '#60a5fa',
    fib: '#fbbf24', rect: '#a78bfa', text: '#ffffff',
  };

  const EXCHANGE_SYMBOLS = {
    binance: ['BTCUSDT', 'ETHUSDT', 'EURUSDT', 'GBPUSDT', 'USDJPY', 'XAUUSD', 'SOLUSDT', 'ADAUSDT'],
    bybit: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'DOGEUSDT', 'AVAXUSDT', 'LINKUSDT', 'DOTUSDT'],
    kraken: ['XBTUSD', 'ETHUSD', 'SOLUSD', 'XRPUSD', 'ADAUSD', 'DOTUSD', 'LINKUSD', 'MATICUSD'],
  };

  const SYMBOL_NAMES = {
    binance: { BTCUSDT: 'BTC/USDT', ETHUSDT: 'ETH/USDT', EURUSDT: 'EUR/USDT', GBPUSDT: 'GBP/USD', USDJPY: 'USD/JPY', XAUUSD: 'XAU/USD', SOLUSDT: 'SOL/USDT', ADAUSDT: 'ADA/USDT' },
    bybit: { BTCUSDT: 'BTC/USDT', ETHUSDT: 'ETH/USDT', SOLUSDT: 'SOL/USDT', XRPUSDT: 'XRP/USDT', DOGEUSDT: 'DOGE/USDT', AVAXUSDT: 'AVAX/USDT', LINKUSDT: 'LINK/USDT', DOTUSDT: 'DOT/USDT' },
    kraken: { XBTUSD: 'BTC/USD', ETHUSD: 'ETH/USD', SOLUSD: 'SOL/USD', XRPUSD: 'XRP/USD', ADAUSD: 'ADA/USD', DOTUSD: 'DOT/USD', LINKUSD: 'LINK/USD', MATICUSD: 'MATIC/USD' },
  };

  function storageKey() { return 'chart_drawings_' + currentSymbolKey; }

  function getState() {
    const ex = document.getElementById('chart-exchange');
    const sym = document.getElementById('chart-symbol');
    const iv = document.getElementById('chart-interval');
    return {
      exchange: ex ? ex.value : 'binance',
      symbol: sym ? sym.value : 'BTCUSDT',
      interval: iv ? iv.value : '15m',
    };
  }

  function loadSymbols() {
    const sel = document.getElementById('chart-symbol');
    if (!sel) return;
    const { exchange } = getState();
    const syms = EXCHANGE_SYMBOLS[exchange] || EXCHANGE_SYMBOLS.binance;
    const names = SYMBOL_NAMES[exchange] || SYMBOL_NAMES.binance;
    const current = sel.value;
    sel.innerHTML = syms.map(s => `<option value="${s}"${s === current ? ' selected' : ''}>${names[s] || s}</option>`).join('');
  }

  async function fetchCandles(exchange, symbol, interval, limit = 200) {
    const data = await API.getMarketCandles(symbol, interval, limit, exchange);
    if (!data || !data.candles) return null;
    return { candles: data.candles, source: data.source };
  }

  function updateVolumeSeries(candles) {
    if (!volumeSeries) return;
    const volData = candles.map(c => ({
      time: c.t / 1000, value: c.v,
      color: c.c >= c.o ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)',
    }));
    volumeSeries.setData(volData);
  }

  function mapCandles(candles) {
    return candles.map(c => ({ time: c.t / 1000, open: c.o, high: c.h, low: c.l, close: c.c }));
  }

  function mergeCandles(existing, incoming) {
    const map = new Map();
    existing.forEach(c => map.set(c.t, c));
    incoming.forEach(c => map.set(c.t, c));
    return Array.from(map.values()).sort((a, b) => a.t - b.t);
  }

  async function refreshChart() {
    const { exchange, symbol, interval } = getState();
    const loading = document.getElementById('chart-loading');
    if (loading) loading.style.display = 'flex';
    try {
      const result = await fetchCandles(exchange, symbol, interval);
      if (!result || !result.candles || !result.candles.length) {
        if (loading) { loading.textContent = 'Sin datos'; loading.style.display = 'flex'; }
        return;
      }
      if (loading) loading.style.display = 'none';
      cachedCandles = result.candles;
      applyCandles(cachedCandles);
    } catch (e) {
      console.warn('[chart] refresh:', e);
      if (loading) { loading.textContent = 'Error al cargar'; loading.style.display = 'flex'; }
    }
  }

  function applyCandles(candles) {
    if (!candleSeries) return;
    const mapped = mapCandles(candles);
    candleSeries.setData(mapped);
    updateVolumeSeries(candles);
    renderDrawings();
  }

  function resizeOverlay() {
    const container = document.getElementById('chart-container');
    if (!overlayCanvas || !container) return;
    const dpr = window.devicePixelRatio || 1;
    const w = container.clientWidth;
    const h = container.clientHeight;
    overlayCanvas.width = w * dpr;
    overlayCanvas.height = h * dpr;
    overlayCanvas.style.width = w + 'px';
    overlayCanvas.style.height = h + 'px';
    overlayCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function getChartCoords(clientX, clientY) {
    const container = document.getElementById('chart-container');
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    let time = null, price = null;
    try { time = chart?.timeScale().coordinateToTime(x); } catch (e) {}
    try { price = chart?.priceScale('right').coordinateToPrice(y); } catch (e) {}
    return { x, y, time, price };
  }

  function timeToX(time) { try { return chart?.timeScale().timeToCoordinate(time); } catch (e) { return null; } }
  function priceToY(price) { try { return chart?.priceScale('right').priceToCoordinate(price); } catch (e) { return null; } }

  function renderDrawings() {
    const ctx = overlayCtx;
    const canvas = overlayCanvas;
    if (!ctx || !canvas) return;
    resizeOverlay();
    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, w, h);

    [...drawings, ...(currentStart && currentEnd ? [{ type: activeTool, start: currentStart, end: currentEnd, temp: true }] : [])].forEach(d => {
      ctx.save();
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      if (d.temp) ctx.globalAlpha = 0.6;

      if (d.type === 'trend' && d.start && d.end) {
        const x1 = timeToX(d.start.time), y1 = priceToY(d.start.price);
        const x2 = timeToX(d.end.time), y2 = priceToY(d.end.price);
        if (x1 == null || y1 == null || x2 == null || y2 == null) { ctx.restore(); return; }
        ctx.strokeStyle = DRAW_COLORS.trend;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        drawPoint(ctx, x1, y1, DRAW_COLORS.trend); drawPoint(ctx, x2, y2, DRAW_COLORS.trend);
      }

      if (d.type === 'hline') {
        const y = priceToY(d.start.price);
        if (y == null) { ctx.restore(); return; }
        ctx.strokeStyle = DRAW_COLORS.hline;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        drawPoint(ctx, 10, y, DRAW_COLORS.hline);
      }

      if (d.type === 'vline') {
        const x = timeToX(d.start.time);
        if (x == null) { ctx.restore(); return; }
        ctx.strokeStyle = DRAW_COLORS.vline;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        drawPoint(ctx, x, 10, DRAW_COLORS.vline);
      }

      if (d.type === 'fib' && d.start && d.end) {
        const high = Math.max(d.start.price, d.end.price), low = Math.min(d.start.price, d.end.price);
        const y1 = priceToY(high), y2 = priceToY(low);
        if (y1 == null || y2 == null) { ctx.restore(); return; }
        const range = high - low || 1;
        const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
        const fibColors = ['#f87171', '#fb923c', '#fbbf24', '#a3e635', '#4ade80', '#2dd4bf', '#60a5fa'];
        const x1 = timeToX(d.start.time), x2 = timeToX(d.end.time);
        const fibX = (x1 != null && x2 != null) ? [x1, x2] : [0, w];
        levels.forEach((level, i) => {
          const py = priceToY(high - range * level);
          if (py == null) return;
          ctx.strokeStyle = fibColors[i]; ctx.setLineDash([4, 4]);
          ctx.beginPath(); ctx.moveTo(Math.min(...fibX), py); ctx.lineTo(Math.max(...fibX), py); ctx.stroke();
          ctx.setLineDash([]); ctx.fillStyle = fibColors[i]; ctx.font = '10px monospace';
          ctx.fillText((level * 100).toFixed(1) + '%', Math.max(...fibX) - 45, py - 3);
        });
      }

      if (d.type === 'rect' && d.start && d.end) {
        const x1 = timeToX(d.start.time), y1 = priceToY(d.start.price);
        const x2 = timeToX(d.end.time), y2 = priceToY(d.end.price);
        if (x1 == null || y1 == null || x2 == null || y2 == null) { ctx.restore(); return; }
        ctx.strokeStyle = DRAW_COLORS.rect;
        ctx.strokeRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
        ctx.fillStyle = DRAW_COLORS.rect.replace(')', ',0.08)');
        ctx.fillRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
      }

      if (d.type === 'text' && d.start) {
        const x = timeToX(d.start.time), y = priceToY(d.start.price);
        if (x == null || y == null) { ctx.restore(); return; }
        ctx.fillStyle = DRAW_COLORS.text; ctx.font = '13px monospace';
        ctx.fillText(d.text || '', x, y);
      }

      ctx.restore();
    });
  }

  function drawPoint(ctx, x, y, color) {
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#0d0818'; ctx.lineWidth = 1.5; ctx.stroke();
  }

  function onMouseDown(e) {
    if (activeTool === 'cursor') return;
    const pt = getChartCoords(e.clientX, e.clientY);
    if (pt.time == null || pt.price == null) return;

    if (activeTool === 'hline' || activeTool === 'vline' || activeTool === 'text') {
      const d = { type: activeTool, start: { time: pt.time, price: pt.price }, text: '' };
      if (activeTool === 'text') { d.text = prompt('Texto:') || ''; if (!d.text) return; }
      drawings.push(d); drawingHistory.push(d); renderDrawings(); saveDrawings(); return;
    }

    if (activeTool === 'trend' || activeTool === 'fib' || activeTool === 'rect') {
      if (!currentStart) {
        currentStart = { time: pt.time, price: pt.price };
        currentEnd = { time: pt.time, price: pt.price };
        overlayCanvas.style.cursor = 'crosshair'; return;
      }
      currentEnd = { time: pt.time, price: pt.price };
      const d = { type: activeTool, start: currentStart, end: currentEnd };
      drawings.push(d); drawingHistory.push(d);
      currentStart = null; currentEnd = null;
      overlayCanvas.style.cursor = 'crosshair'; renderDrawings(); saveDrawings();
    }
  }

  function onMouseMove(e) {
    if (activeTool === 'cursor') return;
    const pt = getChartCoords(e.clientX, e.clientY);
    if (pt.time == null || pt.price == null) return;
    if (currentStart && (activeTool === 'trend' || activeTool === 'fib' || activeTool === 'rect')) {
      currentEnd = { time: pt.time, price: pt.price }; renderDrawings();
    }
  }

  function saveDrawings() {
    try {
      if (!currentSymbolKey) return;
      const data = { drawings: drawings, history: drawingHistory };
      localStorage.setItem(storageKey(), JSON.stringify(data));
    } catch (e) { /* localStorage may be full */ }
  }

  function loadDrawings() {
    drawings.length = 0;
    drawingHistory.length = 0;
    try {
      if (!currentSymbolKey) return;
      const raw = localStorage.getItem(storageKey());
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.drawings) data.drawings.forEach(d => drawings.push(d));
      if (data.history) data.history.forEach(h => drawingHistory.push(h));
    } catch (e) { /* ignore */ }
    renderDrawings();
  }

  function initOverlay() {
    overlayCanvas = document.getElementById('chart-overlay');
    if (!overlayCanvas) return;
    overlayCtx = overlayCanvas.getContext('2d');
    resizeOverlay();
    overlayCanvas.addEventListener('mousedown', onMouseDown);
    overlayCanvas.addEventListener('mousemove', onMouseMove);
    if (chart) chart.subscribeCrosshairMove(() => { if (activeTool !== 'cursor' && currentStart) renderDrawings(); });
    const ro = new ResizeObserver(() => { resizeOverlay(); renderDrawings(); });
    ro.observe(document.getElementById('chart-container'));
    renderDrawings();
  }

  function subscribeMercure() {
    const { exchange, symbol } = getState();
    currentSymbolKey = exchange + '_' + symbol;
    if (mercureES) { mercureES.close(); mercureES = null; }
    mercureConnected = false;

    fetch(`/api/mercure/subscribe?exchange=${encodeURIComponent(exchange)}&symbol=${encodeURIComponent(symbol)}`)
      .then(r => r.json())
      .then(data => {
        mercureES = new EventSource(data.url);
        mercureES.onopen = () => { mercureConnected = true; };
        mercureES.addEventListener('candles', e => {
          try {
            const msg = JSON.parse(e.data);
            if (!msg.candles || !msg.candles.length) return;
            if (msg.exchange !== exchange || msg.symbol !== symbol) return;
            cachedCandles = mergeCandles(cachedCandles, msg.candles);
            applyCandles(cachedCandles);
            updateWatchlist(msg.exchange, msg.symbol, msg.candles[msg.candles.length - 1]);
          } catch (err) { console.warn('[mercure] parse error:', err); }
        });
        mercureES.onerror = () => { mercureConnected = false; };
      })
      .catch(err => console.warn('[mercure] subscribe failed:', err));
  }

  function subscribeTicker() {
    if (tickerES) { tickerES.close(); tickerES = null; }
    fetch('/api/mercure/ticker')
      .then(r => r.json())
      .then(data => {
        tickerES = new EventSource(data.url);
        tickerES.addEventListener('ticker', e => {
          try {
            const msg = JSON.parse(e.data);
            renderWatchlist(msg);
          } catch (err) { /* ignore */ }
        });
      })
      .catch(() => {});
  }

  function renderWatchlist(prices) {
    const el = document.getElementById('chart-watchlist');
    if (!el) return;
    const { exchange } = getState();
    const syms = EXCHANGE_SYMBOLS[exchange] || EXCHANGE_SYMBOLS.binance;
    const names = SYMBOL_NAMES[exchange] || SYMBOL_NAMES.binance;
    const currentSym = document.getElementById('chart-symbol')?.value || '';

    el.innerHTML = syms.map(s => {
      const p = prices[exchange + ':' + s];
      const name = names[s] || s;
      const price = p ? '$' + p.price.toFixed(p.price < 100 ? (p.price < 1 ? 6 : 4) : 2) : '—';
      const change = p ? p.change.toFixed(2) + '%' : '—';
      const cls = p ? (p.change >= 0 ? 'wl-up' : 'wl-down') : '';
      const active = s === currentSym ? 'wl-active' : '';
      return `<div class="wl-row ${active} ${cls}" data-sym="${s}" style="display:flex;justify-content:space-between;padding:5px 6px;border-radius:5px;cursor:pointer;transition:background .15s;${s === currentSym ? 'background:rgba(212,175,55,.12);border:1px solid rgba(212,175,55,.25);' : ''}">
        <span style="font-weight:600;">${name}</span>
        <span style="font-family:'Orbitron',monospace;">${price}</span>
      </div>`;
    }).join('');

    el.querySelectorAll('.wl-row').forEach(row => {
      row.addEventListener('click', () => {
        const sym = row.dataset.sym;
        const sel = document.getElementById('chart-symbol');
        if (sel) { sel.value = sym; sel.dispatchEvent(new Event('change')); }
      });
    });
  }

  function updateWatchlist(exchange, symbol, candle) {
    const el = document.getElementById('chart-watchlist');
    if (!el) return;
    const row = el.querySelector(`[data-sym="${symbol}"]`);
    if (!row) return;
    const price = candle.c;
    const change = ((candle.c - candle.o) / candle.o) * 100;
    const priceStr = '$' + price.toFixed(price < 100 ? (price < 1 ? 6 : 4) : 2);
    const changeStr = change.toFixed(2) + '%';
    const span = row.querySelector('span:last-child');
    if (span) span.textContent = priceStr;
    row.className = 'wl-row ' + (change >= 0 ? 'wl-up' : 'wl-down');
  }

  function toggleFullscreen() {
    const container = document.getElementById('chart-container');
    if (!container) return;
    if (!isFullscreen) {
      if (container.requestFullscreen) container.requestFullscreen();
      else if (container.webkitRequestFullscreen) container.webkitRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
  }

  document.addEventListener('fullscreenchange', handleFsChange);
  document.addEventListener('webkitfullscreenchange', handleFsChange);
  function handleFsChange() {
    isFullscreen = !!document.fullscreenElement || !!document.webkitFullscreenElement;
    const btn = document.getElementById('chart-fullscreen-btn');
    if (btn) btn.textContent = isFullscreen ? '✕' : '⛶';
    const container = document.getElementById('chart-container');
    if (chart && container) {
      setTimeout(() => {
        const w = container.clientWidth, h = container.clientHeight || 500;
        if (w > 10 && h > 10) chart.resize(w, h);
        resizeOverlay(); renderDrawings();
      }, 200);
    }
  }

  function initChart() {
    const container = document.getElementById('chart-container');
    if (!container || chart) return;
    if (typeof LightweightCharts === 'undefined') {
      const loading = document.getElementById('chart-loading');
      if (loading) loading.textContent = 'Cargando librería del chart…';
      setTimeout(initChart, 500); return;
    }
    if (container.clientWidth < 10 || container.clientHeight < 10) {
      setTimeout(initChart, 200); return;
    }
    chart = LightweightCharts.createChart(container, {
      layout: { background: { color: '#0d0818' }, textColor: '#a499b8' },
      grid: { vertLines: { color: 'rgba(255,255,255,0.04)' }, horzLines: { color: 'rgba(255,255,255,0.04)' } },
      crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
      rightPriceScale: { borderColor: 'rgba(212,175,55,0.15)' },
      timeScale: { borderColor: 'rgba(212,175,55,0.15)', timeVisible: true, secondsVisible: false },
      handleScroll: { horzTouchDrag: true },
    });
    candleSeries = chart.addCandlestickSeries({
      upColor: '#4ade80', downColor: '#f87171',
      borderUpColor: '#4ade80', borderDownColor: '#f87171',
      wickUpColor: '#4ade80', wickDownColor: '#f87171',
    });
    volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' }, priceScaleId: 'volume', scaleMargins: { top: 0.8, bottom: 0 },
    });
    const handleResize = () => {
      if (!chart) return;
      const w = container.clientWidth, h = container.clientHeight || 500;
      if (w > 10 && h > 10) chart.resize(w, h);
      resizeOverlay(); renderDrawings();
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    refreshChart();
    subscribeMercure();
    subscribeTicker();
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(refreshChart, 15000);
    setTimeout(() => { if (!mercureConnected) { clearInterval(pollTimer); pollTimer = setInterval(refreshChart, 5000); } }, 10000);
    const loading = document.getElementById('chart-loading');
    if (loading) loading.style.display = 'none';
    initOverlay();
    loadDrawings();

    document.getElementById('chart-fullscreen-btn')?.addEventListener('click', toggleFullscreen);
  }

  function initDrawingToolbar() {
    const toolbar = document.getElementById('drawing-toolbar');
    if (!toolbar) return;
    toolbar.style.display = 'flex';
    toolbar.querySelectorAll('.draw-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tool = btn.dataset.tool;
        toolbar.querySelectorAll('.draw-btn').forEach(b => b.classList.remove('active'));
        cancelDrawing();

        if (tool === 'undo') {
          const d = drawingHistory.pop();
          if (d) { const idx = drawings.indexOf(d); if (idx !== -1) drawings.splice(idx, 1); renderDrawings(); saveDrawings(); }
          return;
        }
        if (tool === 'clear') {
          drawings.length = 0; drawingHistory.length = 0; renderDrawings();
          try { localStorage.removeItem(storageKey()); } catch (e) {}
          return;
        }
        if (tool === 'cursor') { activeTool = 'cursor'; if (overlayCanvas) overlayCanvas.style.cursor = 'crosshair'; return; }
        btn.classList.add('active');
        activeTool = tool;
        if (overlayCanvas) overlayCanvas.style.cursor = 'crosshair';
      });
    });
  }

  function cancelDrawing() { currentStart = null; currentEnd = null; renderDrawings(); }

  async function init() {
    if (initCalled) return;
    initCalled = true;
    loadSymbols();
    initChart();
    initDrawingToolbar();
    const ex = document.getElementById('chart-exchange');
    const sym = document.getElementById('chart-symbol');
    const iv = document.getElementById('chart-interval');
    [ex, sym, iv].forEach(el => {
      if (!el) return;
      el.addEventListener('change', () => {
        saveDrawings();
        cancelDrawing();
        if (el === ex) { loadSymbols(); renderWatchlist({}); }
        refreshChart();
        subscribeMercure();
        setTimeout(loadDrawings, 100);
      });
    });
  }

  window.initChartTab = init;
  window.refreshChart = refreshChart;
})();
