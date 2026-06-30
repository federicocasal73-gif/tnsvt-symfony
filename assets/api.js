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
  // IMPORTANTE: Usar SIEMPRE HTTPS (Tailscale fuerza HTTPS) para evitar
  // Mixed Content errors desde una página HTTPS.
  baseURL: (function() {
    try {
      const loc = window.location;
      // Si el origin es el scheme interno de Capacitor (https://localhost),
      // forzamos la URL HTTPS del server.
      if (loc.hostname === 'localhost' && loc.protocol === 'https:') {
        return 'https://laptop-ebgqig6j.tailf43f87.ts.net';
      }
      // Si el WebView ya está en HTTPS (caso edge), usamos same-origin
      if (loc.protocol === 'https:' && loc.hostname !== 'localhost') {
        return loc.origin;
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

  async request(method, path, body = null, extraOpts = null) {
    const url = API._resolve(path);
    console.log('[API] ' + method + ' ' + url, body && !(body instanceof FormData) ? JSON.stringify(body) : '');
    const opts = { method, credentials: 'include' };
    if (body instanceof FormData) {
      // FormData: dejar que el browser setee Content-Type: multipart/form-data; boundary=...
      opts.body = body;
    } else if (body && typeof body === 'object') {
      opts.headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
      opts.body = JSON.stringify(body);
    } else {
      opts.headers = { 'Accept': 'application/json' };
      if (body) opts.body = body;
    }
    if (extraOpts && extraOpts.headers) {
      opts.headers = { ...(opts.headers || {}), ...extraOpts.headers };
    }
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
    return this.get(`/api/chat/conversations/${convId}/messages?${params}`);
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
    return this.post('/api/chat/upload', form, { headers: {} });
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

  // ── Patch helper ──
  patch(path, body) { return this.request('PATCH', path, body); },
};

window.API = API;
