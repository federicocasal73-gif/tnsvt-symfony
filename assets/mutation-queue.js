// TNSVT MutationQueue (Phase 1 offline-resilient APK)
// Cola persistente de mutaciones (POST/PUT/DELETE) cuando no hay red.
// Backed by localStorage; replay on `window.online` event via drainQueue().
//
// API pública (window.MutationQueue):
//   enqueue(method, url, body, opts?)
//   drain(fetchImpl) -> Promise<{ok, failed}>
//   size() -> number
//   peekAll() -> array
//   clear()
//
// Cada op tiene la forma:
//   { id: string, ts: number, method: string, url: string,
//     body: string|null, headers: object, attempts: number }

(function (root) {
  'use strict';

  const STORAGE_KEY = 'tnsvt_pending_ops';

  function uid() {
    return 'op_' + Date.now().toString(36) + '_' +
      Math.random().toString(36).slice(2, 8);
  }

  function readStore() {
    try {
      const raw = (root.localStorage && root.localStorage.getItem(STORAGE_KEY)) || '[]';
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (_) {
      return [];
    }
  }

  function writeStore(arr) {
    if (!root.localStorage) return;
    try {
      root.localStorage.setItem(STORAGE_KEY, JSON.stringify(arr.slice(-200)));
    } catch (_) { /* quota exceeded — silently drop oldest */ }
  }

  function enqueue(method, url, body, opts) {
    const op = {
      id: uid(),
      ts: Date.now(),
      method: String(method || 'POST').toUpperCase(),
      url: String(url || ''),
      body: body == null ? null : (typeof body === 'string' ? body : JSON.stringify(body)),
      headers: (opts && opts.headers) || { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      attempts: 0,
    };
    const arr = readStore();
    arr.push(op);
    writeStore(arr);
    return op;
  }

  function size() {
    return readStore().length;
  }

  function peekAll() {
    return readStore().slice();
  }

  function clear() {
    writeStore([]);
  }

  async function drain(fetchImpl) {
    const fetcher = fetchImpl || (typeof fetch === 'function' ? fetch.bind(root) : null);
    if (!fetcher) return { ok: 0, failed: 0, skipped: true };
    const arr = readStore();
    if (arr.length === 0) return { ok: 0, failed: 0, skipped: false };

    // FIFO orden por timestamp; tope 200/call para no saturar el server
    const batch = arr.slice(-200);
    let ok = 0;
    let failed = 0;
    const remaining = arr.slice(0, arr.length - batch.length);
    for (let i = 0; i < batch.length; i++) {
      const op = batch[i];
      try {
        const res = await fetcher(op.url, {
          method: op.method,
          credentials: 'include',
          headers: op.headers,
          body: op.body,
        });
        if (res && res.ok) { ok++; continue; }
        if (res && (res.status === 400 || res.status === 401 || res.status === 403 || res.status === 422)) {
          // Server rejected the payload — descartar en vez de retry eterno
          ok++;
          continue;
        }
        // 5xx o timeout/otro: reintentar con backoff
        failed++;
        op.attempts = (op.attempts || 0) + 1;
        if (op.attempts < 5) { remaining.push(op); }
      } catch (_) {
        failed++;
        op.attempts = (op.attempts || 0) + 1;
        // Drop tras 5 attempts fallidos (no más reintentos)
        if (op.attempts < 5) { remaining.push(op); }
      }
    }
    writeStore(remaining);
    return { ok, failed, skipped: false };
  }

  const api = { enqueue, drain, size, peekAll, clear };
  if (root) root.MutationQueue = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);

// window.MutationQueue already set by root inside IIFE

