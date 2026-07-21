// CommonJS smoke test for assets/mutation-queue.js
// Run with: node assets/mutation-queue.test.cjs

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const src = fs.readFileSync(path.join(__dirname, 'mutation-queue.js'), 'utf8');

// Mock browser globals
const lsMap = new Map();
const sandbox = {
  console,
  localStorage: {
    getItem: (k) => (lsMap.has(k) ? lsMap.get(k) : null),
    setItem: (k, v) => lsMap.set(k, v),
    removeItem: (k) => lsMap.delete(k),
  },
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;

// Strip the trailing `if (typeof window !== 'undefined') window.MutationQueue = api;`
// block (we manually wire below) so vm.runInContext completes without error.
const stripped = src.replace(
  /if \(typeof window !== ['"]undefined['"]\) \{[^}]*\}\s*/m,
  ''
);
const ctx = vm.createContext(sandbox);
vm.runInContext(stripped, ctx);
const MQ = sandbox.window.MutationQueue;

function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg);
    process.exit(1);
  }
}
const assertEq = (actual, expected, msg) => {
  if (actual !== expected) {
    console.error(`FAIL ${msg}: expected ${expected}, got ${actual}`);
    process.exit(1);
  }
};

async function run() {
  // 1. enqueue + FIFO
  MQ.clear();
  assertEq(MQ.size(), 0, 'empty after clear');
  MQ.enqueue('POST', '/api/journal', { asset: 'XAUUSD' });
  MQ.enqueue('PUT', '/api/journal/42', { pnl: 100 });
  assertEq(MQ.size(), 2, 'size after 2 enqueues');
  assertEq(MQ.peekAll()[0].method, 'POST', 'FIFO orden');
  assertEq(MQ.peekAll()[1].method, 'PUT', 'second op PUT');

  // 2. drain con fetch OK → vacía la cola
  MQ.clear();
  MQ.enqueue('POST', '/api/sync/push', { ops: [] });
  MQ.enqueue('POST', '/api/notifications/mark', { id: 1 });
  let calls = 0;
  const fetchOk = async () => {
    calls++;
    return { ok: true, status: 200 };
  };
  const r1 = await MQ.drain(fetchOk);
  assertEq(r1.ok, 2, 'drain retornó ok=2');
  assertEq(MQ.size(), 0, 'cola vacía tras drain OK');
  assertEq(calls, 2, '2 fetch calls');

  // 3. drain con 401 → descarta (no retry eterno)
  MQ.clear();
  MQ.enqueue('POST', '/api/protected', {});
  const fetch401 = async () => ({ ok: false, status: 401 });
  const r2 = await MQ.drain(fetch401);
  assertEq(r2.ok, 1, '401 se considera drained');
  assertEq(MQ.size(), 0, 'no retry de 401');

  // 4. drain con network error → reenqueue + retry (attempts++)
  MQ.clear();
  MQ.enqueue('POST', '/api/sync', { a: 1 });
  let attempts = 0;
  const fetchFail = async () => { attempts++; throw new TypeError('Failed to fetch'); };
  const r3 = await MQ.drain(fetchFail);
  assertEq(r3.failed, 1, 'failed=1');
  assertEq(MQ.size(), 1, 'reencolado');
  assertEq(attempts, 1, '1 intento');

  // 5. 5 fallos de la MISMA op → drop al 5° intento
  MQ.clear();
  MQ.enqueue('POST', '/api/single', {});
  for (let i = 0; i < 5; i++) {
    await MQ.drain(fetchFail);
  }
  assertEq(MQ.size(), 0, 'drop tras 5 attempts');

  // 6. tamaño máximo 200 (evita quota overflow)
  MQ.clear();
  for (let i = 0; i < 250; i++) MQ.enqueue('POST', '/api/x', { i });
  assertEq(MQ.size(), 200, 'cap a 200 ops');

  console.log('MutationQueue tests OK (6 tests pass)');
}

run().catch((e) => { console.error('FAIL', e); process.exit(1); });
