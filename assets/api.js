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
        return 'http://100.122.8.48:8000';
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
    return this.get(`/api/notifications/count?user_code=${userCode}`);
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

  async getChatUsers(userCode) {
    return this.get(`/api/chat/users?user_code=${userCode}`);
  }
};

window.API = API;
