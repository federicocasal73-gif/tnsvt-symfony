const API = {
  // Tracker global de requests en curso (usado por el loader de la app)
  loadingCount: 0,
  loadingListeners: new Set(),
  onLoadingChange(cb) { this.loadingListeners.add(cb); return () => this.loadingListeners.delete(cb); },
  _emitLoading() { this.loadingListeners.forEach(cb => { try { cb(this.loadingCount); } catch (_) {} }); },

  // Base URL absoluta del backend.
  // - En navegador (Chrome/Edge): location es http://IP:8000, los fetch
  //   relativos funcionan porque la web misma se sirve desde ahi.
  // - En Capacitor (WebView): el WebView carga desde https://localhost
  //   (assets locales), y los fetch('/api/...') no van a ningun lado. Hay
  //   que apuntarlos a la URL absoluta del server.
  baseURL: (function() {
    try {
      const loc = window.location;
      // Si el origin es el scheme interno de Capacitor (https://localhost),
      // forzamos la URL del server.
      if (loc.hostname === 'localhost' && loc.protocol === 'https:') {
        return 'https://laptop-ebgqig6j.tailf43f87.ts.net';
      }
    } catch (_) {}
    return '';
  })(),

  _resolve(path) {
    if (!path) return path;
    if (/^https?:\/\//i.test(path)) return path; // ya es absoluta
    if (!API.baseURL) return path; // relative (navegador sirviendo desde el server)
    if (!path.startsWith('/')) path = '/' + path;
    return API.baseURL + path;
  },

  async request(method, path, body = null) {
    const url = API._resolve(path);
    console.log('[API] ' + method + ' ' + url, body ? JSON.stringify(body) : '');
    const opts = { method, credentials: 'include', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    API.loadingCount++;
    API._emitLoading();
    try {
      const res = await fetch(url, opts);
      console.log('[API] ' + method + ' ' + url + ' -> ' + res.status);
      const data = await res.json();
      if (!res.ok && data.error) throw new Error(data.error);
      return data;
    } catch (e) {
      console.log('[API] ERROR ' + method + ' ' + url + ': ' + e.message);
      throw e;
    } finally {
      API.loadingCount--;
      API._emitLoading();
    }
  },

  get(path) { return this.request('GET', path); },
  post(path, body) { return this.request('POST', path, body); },
  put(path, body) { return this.request('PUT', path, body); },
  del(path) { return this.request('DELETE', path); },

  // Auth
  async login(code, password = '') {
    const body = { code };
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
  async getJournal(userCode) {
    return this.get(`/api/journal?user_code=${userCode}`);
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

  async deleteTrade(id) {
    return this.del(`/api/journal/${id}`);
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
    return this.get(`/api/chat/conversations/${convId}/messages?${params}`);
  },

  async sendMessage(convId, userCode, content, photo = null) {
    const body = { user_code: userCode, content: content || '' };
    if (photo) body.photo = photo;
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

  // ── Patch helper ──
  patch(path, body) { return this.request('PATCH', path, body); },
};

window.API = API;
