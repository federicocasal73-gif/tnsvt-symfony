var API = window.API = {
  // Tracker global de requests en curso (usado por el loader de la app)
  loadingCount: 0,
  loadingListeners: new Set(),
  onLoadingChange(cb) { this.loadingListeners.add(cb); return () => this.loadingListeners.delete(cb); },
  _emitLoading() { this.loadingListeners.forEach(cb => { try { cb(this.loadingCount); } catch (_) {} }); },

  // ─── Config runtime (Phase 3 offline-first APK) ──────────────
  // La APK ya no apunta a un server.url hardcodeado: la URL del backend
  // se setea por el usuario la primera vez (o manualmente en Settings).
  // Persistimos en localStorage (clave: tnsvt_api_base) para que sobreviva
  // al reinicio de la app.
  STORAGE_KEY_API: 'tnsvt_api_base',
  DEFAULT_API_BASE: 'https://tnsvt.com',

  _loadApiBase() {
    try {
      const v = window.localStorage && window.localStorage.getItem(this.STORAGE_KEY_API);
      if (v) return v.replace(/\/+$/, '');
    } catch (_) { /* storage disabled */ }
    return this.DEFAULT_API_BASE;
  },
  setApiBase(url, persist = true) {
    const clean = String(url || '').trim().replace(/\/+$/, '');
    if (!clean) return false;
    if (persist) {
      try { window.localStorage.setItem(this.STORAGE_KEY_API, clean); } catch (_) {}
    }
    API._configuredBase = clean;
    window.dispatchEvent(new CustomEvent('tnsvt:api-base-changed', { detail: { url: clean } }));
    return true;
  },
  isApiBaseConfigured() {
    try { return !!window.localStorage.getItem(this.STORAGE_KEY_API); } catch (_) { return false; }
  },
  clearApiBase() {
    try { window.localStorage.removeItem(this.STORAGE_KEY_API); } catch (_) {}
    API._configuredBase = this.DEFAULT_API_BASE;
    window.dispatchEvent(new CustomEvent('tnsvt:api-base-changed', { detail: { url: this.DEFAULT_API_BASE } }));
  },

  _friendlyStatus(status, url) {
    if (status === 401) {
      if (url.includes('/api/auth/login')) return 'Código/contraseña inválidos. Verificá mayúsculas.';
      if (url.includes('/api/auth/check')) return null;
      return 'No autorizado. Iniciá sesión.';
    }
    if (status === 403) return 'No tenés permiso para esta acción.';
    if (status === 404) return 'Recurso no encontrado.';
    if (status === 419) return 'Sesión expirada. Volvé a iniciar sesión.';
    if (status === 429) return 'Demasiadas peticiones. Esperá un momento.';
    if (status >= 500) return 'Server caído. Reintentá en un minuto.';
    return null;
  },

  // Base URL absoluta del backend.
  // Orden de resolución para Phase 3 offline-first:
  //   1. localStorage `tnsvt_api_base` (configurado por el usuario).
  //   2. localStorage override del usuario (API.defaultApiBase).
  //   3. Misma origin si el navegador sirve la web directo
  //      (desarrollo local con `php -S`).
  //   4. DEFAULT_API_BASE ('https://tnsvt.com') como fallback.
  // Removido el fallback a Tailscale legado (servidor apagado).
  baseURL: (function() {
    try {
      const stored = window.localStorage && window.localStorage.getItem('tnsvt_api_base');
      if (stored) return stored.replace(/\/+$/, '');
      const loc = window.location;
      if (loc.protocol === 'http:' || loc.protocol === 'https:') {
        // Si la web está sirviendo desde un server (no bundled APK),
        // los fetch relativos funcionan — devolver origin.
        if (loc.hostname !== 'localhost') return loc.origin;
      }
    } catch (_) {}
    return API.DEFAULT_API_BASE;
  })(),

  _resolve(path) {
    if (!path) return path;
    if (/^https?:\/\//i.test(path)) return path; // ya es absoluta
    let base = API.baseURL;
    try {
      const stored = window.localStorage && window.localStorage.getItem('tnsvt_api_base');
      if (stored) base = stored.replace(/\/+$/, '');
    } catch (_) {}
    if (!base) return path; // relative (navegador sirviendo desde el server)
    if (!path.startsWith('/')) path = '/' + path;
    return base + path;
  },

  async request(method, path, body = null, extraOpts = null) {
    const url = API._resolve(path);
    console.log('[API] ' + method + ' ' + url, body && !(body instanceof FormData) ? JSON.stringify(body) : '');
    const opts = { method, credentials: 'include' };
    if (body instanceof FormData) {
      opts.body = body;
    } else if (body && typeof body === 'object') {
      opts.headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
      opts.body = JSON.stringify(body);
    } else {
      opts.headers = { 'Accept': 'application/json' };
      if (body) opts.body = body;
    }
    if (extraOpts && extraOpts.headers && Object.keys(extraOpts.headers).length > 0) {
      opts.headers = { ...(opts.headers || {}), ...extraOpts.headers };
    }
    if (extraOpts && extraOpts.queueOnFail) {
      opts.queueOnFail = true;
    }
    const controller = new AbortController();
    const timeoutMs = (extraOpts && extraOpts.timeoutMs) || 30000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    opts.signal = controller.signal;
    API.loadingCount++;
    API._emitLoading();
    try {
      const res = await fetch(url, opts);
      clearTimeout(timeoutId);
      console.log('[API] ' + method + ' ' + url + ' -> ' + res.status);
      const ct = res.headers.get('content-type') || '';
      const raw = await res.text();
      let data = null;
      if (ct.includes('application/json') && raw) {
        try { data = JSON.parse(raw); } catch (parseErr) { data = null; }
      }
      if (res.ok) {
        return data !== null ? data : {};
      }
      const hint = (data && (data.error || data.error_code)) || API._friendlyStatus(res.status, url) || raw.slice(0, 140) || 'Sin detalle del server';
      throw new Error(typeof hint === 'string' ? hint : JSON.stringify(hint));
    } catch (e) {
      clearTimeout(timeoutId);
      if (e.name === 'AbortError') {
        throw new Error('Timeout: la petición tardó más de ' + Math.round(timeoutMs/1000) + 's');
      }
      // Network error real (sin red): queuear para replay (Phase 1 offline-resilient)
      if (opts.queueOnFail && API._isNetworkError(e) && /^(POST|PUT|DELETE|PATCH)$/.test(method)) {
        try {
          if (window.MutationQueue && window.MutationQueue.enqueue) {
            const op = window.MutationQueue.enqueue(method, url, opts.body, { headers: opts.headers });
            API._pendingOpAdded && API._pendingOpAdded(op);
            const err = new Error('Sin conexión — guardado en cola (id ' + op.id + ')');
            err.queued = true;
            err.opId = op.id;
            throw err;
          }
        } catch (qErr) { /* si la cola misma falla, propagar original */ }
      }
      console.log('[API] ERROR ' + method + ' ' + url + ': ' + e.message);
      throw e;
    } finally {
      API.loadingCount--;
      API._emitLoading();
    }
  },

  _isNetworkError(e) {
    if (!e) return false;
    const msg = String(e.message || '');
    return /Failed to fetch|NetworkError|TypeError: Load failed|Network request failed/i.test(msg)
      || e instanceof TypeError;
  },

  async drainPending() {
    if (!window.MutationQueue) return { ok: 0, failed: 0, skipped: true };
    try {
      const res = await window.MutationQueue.drain();
      if (res.failed > 0 && window.API && window.API._pendingOpDrained) window.API._pendingOpDrained(res);
      return res;
    } catch (e) {
      console.warn('[API] drainPending:', e);
      return { ok: 0, failed: 0, skipped: true };
    }
  },

  get(path) { return this.request('GET', path); },
  post(path, body, extraOpts) { return this.request('POST', path, body, extraOpts); },
  put(path, body, extraOpts) { return this.request('PUT', path, body, extraOpts); },
  del(path, body = null) { return this.request('DELETE', path, body); },

  // Auth
  async login(code, name = '', password = '') {
    const body = { code, name };
    if (password) body.password = password;
    return this.post('/api/auth/login', body);
  },

  async checkAuth() {
    return this.get('/api/auth/check');
  },

  // Feed
  async getFeed(category) {
    const params = category && category !== 'all' ? `?category=${category}` : '';
    return this.get(`/api/feed${params}`);
  },

  async createPost(data) {
    return this.post('/api/feed', data);
  },

  async likePost(postId, userCode, action) {
    return this.post(`/api/feed/${postId}/like`, { author_code: userCode, action });
  },

  async commentPost(postId, author, text, photo = null) {
    const body = { author, text };
    if (photo) body.photo = photo;
    return this.post(`/api/feed/${postId}/comment`, body);
  },

  async deletePost(postId, userCode) {
    return this.del(`/api/feed/${postId}?author_code=${userCode}`);
  },

  // Journal
  async getJournal(userCode, accountId) {
    let url = `/api/journal?user_code=${encodeURIComponent(userCode)}`;
    if (accountId) url += `&account_id=${accountId}`;
    return this.get(url);
  },
  async getLeaderboard() {
    return this.get('/api/leaderboard');
  },

  async createTrade(data) {
    return this.post('/api/journal', data);
  },

  async updateTrade(id, data) {
    return this.put(`/api/journal/${id}`, data);
  },

  async deleteTrade(id, userCode) {
    return this.del(`/api/journal/${id}`, { user_code: userCode });
  },

  // Academia
  async getAcademia() {
    return this.get('/api/academia');
  },

  async saveAcademia(data) {
    if (data.id) {
      const id = data.id;
      delete data.id;
      return this.put(`/api/academia/${id}`, data);
    }
    return this.post('/api/academia', data);
  },

  async deleteAcademia(id) {
    return this.del(`/api/academia/${id}`);
  },

  // Notifications
  async getNotifications(userCode) {
    return this.get(`/api/notifications?user_code=${userCode}`);
  },

  async markNotifRead(id) {
    return this.put(`/api/notifications/${id}/read`);
  },

  async markAllNotifRead(userCode) {
    return this.put(`/api/notifications/read-all?user_code=${userCode}`);
  },

async getNotifCount(userCode) {
    return this.get(`/api/notifications/count?user_code=${encodeURIComponent(userCode)}`);
  },
  async deleteNotification(id, userCode) {
    return this.del(`/api/notifications/${id}?user_code=${encodeURIComponent(userCode)}`);
  },

  // Chat
  async getConversations(userCode) {
    return this.get(`/api/chat/conversations?user_code=${userCode}`);
  },

  async createDm(userCode, otherCode) {
    return this.post('/api/chat/conversations', { user_code: userCode, other_code: otherCode });
  },

  async getMessages(convId, userCode, beforeId = null) {
    const params = new URLSearchParams({ user_code: userCode, limit: '50' });
    if (beforeId) params.set('before_id', String(beforeId));
    try {
      return await this.get(`/api/chat/conversations/${convId}/messages?${params}`);
    } catch (e) {
      // ⛧ FIX: si la conversación fue borrada (404), retornar array vacío en vez de throw
      if (/404|not found|no encontrad/i.test(String(e.message))) {
        return [];
      }
      throw e;
    }
  },

  async sendMessage(convId, userCode, content, photo = null, attachment = null) {
    const body = { user_code: userCode, content: content || '' };
    if (photo) body.photo = photo;
    if (attachment) body.attachment = attachment;
    return this.post(`/api/chat/conversations/${convId}/messages`, body);
  },

  async markChatRead(convId, userCode) {
    return this.post(`/api/chat/conversations/${convId}/read`, { user_code: userCode });
  },

  async deleteConversation(convId, userCode) {
    return this.del(`/api/chat/conversations/${convId}?user_code=${encodeURIComponent(userCode)}`);
  },

  async leaveConversation(convId, userCode) {
    return this.post(`/api/chat/conversations/${convId}/leave`, { user_code: userCode });
  },

  async getChatUsers(userCode) {
    return this.get(`/api/chat/users?user_code=${userCode}`);
  },

  async ping(userCode) {
    return this.post('/api/chat/ping', { user_code: userCode });
  },

  async sendTyping(convId, userCode) {
    return this.post('/api/chat/typing', { user_code: userCode, conversation_id: convId });
  },

  async editMessage(convId, msgId, userCode, content) {
    return this.put(`/api/chat/conversations/${convId}/messages/${msgId}`, { user_code: userCode, content: content });
  },

  async deleteMessage(convId, msgId, userCode) {
    return this.del(`/api/chat/conversations/${convId}/messages/${msgId}?user_code=${encodeURIComponent(userCode)}`);
  },

  async uploadChatFile(file, userCode) {
    const form = new FormData();
    form.append('file', file);
    form.append('user_code', userCode);
    // FIX APK: NO pasar { headers: {} } — eso anulaba el auto-Content-Type multipart
    // del browser y el server colgaba esperando el boundary. timeoutMs alto para uploads.
    return this.post('/api/chat/upload', form, { timeoutMs: 60000 });
  },

  async getNotificationSound(userCode) {
    return this.get(`/api/user/sound?user_code=${encodeURIComponent(userCode)}`);
  },

  async setNotificationSound(userCode, sound) {
    return this.put('/api/user/sound', { user_code: userCode, sound: sound });
  },

  // Admin group management
  async createGroup(userCode, name, members = []) {
    return this.post('/api/chat/groups', { user_code: userCode, name: name, members: members });
  },

  async addToGroup(userCode, groupId, targetCode) {
    return this.post(`/api/chat/groups/${groupId}/add`, { user_code: userCode, target_code: targetCode });
  },

  async removeFromGroup(userCode, groupId, targetCode) {
    return this.post(`/api/chat/groups/${groupId}/remove`, { user_code: userCode, target_code: targetCode });
  },

  async renameGroup(userCode, groupId, name) {
    return this.post(`/api/chat/groups/${groupId}/rename`, { user_code: userCode, name: name });
  },

  async deleteGroup(userCode, groupId) {
    return this.del(`/api/chat/groups/${groupId}?user_code=${encodeURIComponent(userCode)}`);
  },

  async listGroupMembers(userCode, groupId) {
    return this.get(`/api/chat/groups/${groupId}/members?user_code=${encodeURIComponent(userCode)}`);
  },

  // Profile (foto de perfil)
  async getProfile(code) {
    return this.get(`/api/profile/${encodeURIComponent(code)}`);
  },
  async uploadAvatar(userCode, file) {
    const url = API._resolve(`/api/profile/avatar?user_code=${encodeURIComponent(userCode)}`);
    const fd = new FormData();
    fd.append('avatar', file);
    API.loadingCount++; API._emitLoading();
    try {
      const res = await fetch(url, { method: 'POST', credentials: 'include', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status);
      return data;
    } finally { API.loadingCount--; API._emitLoading(); }
  },
  async deleteAvatar(userCode) {
    return this.del(`/api/profile/avatar?user_code=${encodeURIComponent(userCode)}`);
  },

  // Diagnostics (admin)
  async getSWStatus() {
    if (!('serviceWorker' in navigator)) return { supported: false };
    const regs = await navigator.serviceWorker.getRegistrations();
    return {
      supported: true,
      count: regs.length,
      controllers: navigator.serviceWorker.controller ? 1 : 0,
      registrations: regs.map(r => ({
        scope: r.scope,
        active: r.active ? r.active.scriptURL : null,
        waiting: r.waiting ? r.waiting.scriptURL : null,
        installing: r.installing ? r.installing.scriptURL : null,
      })),
    };
  },

  // Monitoring (admin)
  async logMonitorEvent(eventData) {
    // POST /api/monitoring/event - crear un nuevo evento (error/warning/info)
    return this.post('/api/monitoring/event', eventData);
  },
  async getMonitorLogs(userCode, opts = {}) {
    // GET /api/monitoring/log?user_code=...&level=error&limit=50
    const params = new URLSearchParams();
    if (userCode) params.set('user_code', userCode);
    if (opts.level) params.set('level', opts.level);
    if (opts.limit) params.set('limit', opts.limit);
    return this.get(`/api/monitoring/log?${params.toString()}`);
  },
  async getMonitorStats(userCode) {
    return this.get(`/api/monitoring/stats?user_code=${encodeURIComponent(userCode)}`);
  },

  // Market data (Academia - live chart)
  async getMarketCandles(symbol, interval, limit = 100, exchange = 'binance') {
    const params = new URLSearchParams();
    params.set('symbol', symbol);
    params.set('interval', interval);
    params.set('limit', limit);
    params.set('exchange', exchange);
    return this.get(`/api/market/candles?${params.toString()}`);
  },
  async getMarketSymbols() {
    return this.get('/api/market/symbols');
  },

  // ── Social / Access Requests ──

  async getAllUsers(userCode) {
    return this.get(`/api/users/all?user_code=${encodeURIComponent(userCode)}`);
  },

  async searchUsers(q) {
    return this.get(`/api/users/search?q=${encodeURIComponent(q)}`);
  },

  async getPublicProfile(code) {
    return this.get(`/api/profile/${encodeURIComponent(code)}`);
  },

  async sendAccessRequest(targetCode, userCode) {
    return this.post('/api/access-request', { target_code: targetCode, user_code: userCode });
  },

  async getAccessRequests(userCode) {
    return this.get(`/api/access-request?user_code=${encodeURIComponent(userCode)}`);
  },

  async respondAccessRequest(id, status, userCode) {
    return this.patch(`/api/access-request/${id}`, { status, user_code: userCode });
  },

  async cancelAccessRequest(id) {
    return this.del(`/api/access-request/${id}`);
  },

  async getAccessStatus(targetCode, userCode) {
    return this.get(`/api/access-status/${encodeURIComponent(targetCode)}?user_code=${encodeURIComponent(userCode)}`);
  },

  // ── Connections ──

  async getConnections(userCode) {
    return this.get(`/api/connections?user_code=${encodeURIComponent(userCode)}`);
  },

  async removeConnection(id, userCode) {
    return this.del(`/api/connections/${id}?user_code=${encodeURIComponent(userCode)}`);
  },

  async blockConnection(id, userCode) {
    return this.post(`/api/connections/${id}/block`, { user_code: userCode });
  },

  // ── Permissions ──

  async getPermissions(targetCode, userCode) {
    return this.get(`/api/permissions/${encodeURIComponent(targetCode)}?user_code=${encodeURIComponent(userCode)}`);
  },

  async updatePermissions(targetCode, perms, userCode) {
    return this.patch(`/api/permissions/${encodeURIComponent(targetCode)}`, { ...perms, user_code: userCode });
  },

  // ── Journal Settings ──

  async getJournalSettings(userCode) {
    return this.get(`/api/journal/settings?user_code=${encodeURIComponent(userCode)}`);
  },

  async updateJournalSettings(visibility, userCode) {
    return this.patch('/api/journal/settings', { visibility, user_code: userCode });
  },

  // ── Trading Accounts (multi-account journal) ──
  async getAccounts(userCode) {
    return this.get(`/api/accounts?user_code=${encodeURIComponent(userCode)}`);
  },
  async createAccount(data, userCode) {
    return this.post('/api/accounts', { ...data, user_code: userCode });
  },
  async updateAccount(id, data, userCode) {
    return this.request('PUT', `/api/accounts/${id}?user_code=${encodeURIComponent(userCode)}`, { ...data, user_code: userCode });
  },
  async deleteAccount(id, userCode) {
    return this.del(`/api/accounts/${id}?user_code=${encodeURIComponent(userCode)}`);
  },
  async getJournalStats(userCode, accountId) {
    const params = new URLSearchParams({ user_code: userCode });
    if (accountId) params.set('account_id', accountId);
    return this.get(`/api/journal/stats?${params}`);
  },
  async getDrawdown(userCode, accountId, accountSize) {
    const params = new URLSearchParams({ user_code: userCode });
    if (accountId) params.set('account_id', accountId);
    if (accountSize) params.set('account_size', accountSize);
    return this.get(`/api/journal/drawdown?${params}`);
  },
  async getJournalTags(userCode, accountId) {
    const params = new URLSearchParams({ user_code: userCode });
    if (accountId) params.set('account_id', accountId);
    return this.get(`/api/journal/tags?${params}`);
  },

  // ── Patch helper ──
  patch(path, body) { return this.request('PATCH', path, body); },

  // ── Sync API (offline-first journal sync) ──
  async getSyncSnapshot(userCode, since) {
    let url = `/api/sync/snapshot?user_code=${encodeURIComponent(userCode)}`;
    if (since) url += `&since=${since}`;
    return this.get(url);
  },
  async syncPush(ops, userCode) {
    return this.request('POST', `/api/sync/push?user_code=${encodeURIComponent(userCode)}`, { ops });
  },
};

window.API = API;
