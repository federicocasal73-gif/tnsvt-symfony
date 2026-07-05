# Plan: Journal Sharing Security + Seed Data Differentiation

## Goal
1. **Distinguish seed trades between DEMO and ADMIN01** so both users have visibly different journals.
2. **Make viewing another user's journal strictly read-only** (no add/edit/delete).
3. **Generalize**: any user viewing any other user's journal (connected or public) gets a read-only view, no exceptions.

---

## Issue 1: Same trades for DEMO and ADMIN01

### File: `src/Command/SeedTradesCommand.php`

Currently, `getTradeData($userCode)` returns the same `$common` array (12 identical trades) for both users, only varying dates. Fix:

- DEMO: trades predominantly **crypto** (BTCUSDT, ETHUSDT, XAUUSD) with **higher PnL** and **buys on dips**.
- ADMIN01: trades predominantly **forex** (EURUSD, GBPUSD, USDJPY, NAS100) with **mixed directions** and **lower PnL**.
- Add a `$suffix = '[' . $userCode . ']'` in notes so even identical structures are visibly tagged.

### Concrete approach
```php
private function getTradeData(string $userCode): array
{
    $now = new \DateTimeImmutable();
    $d = fn(int $daysAgo) => $now->modify("-{$daysAgo} days")->format('Y-m-d') . ' 10:00:00';
    $d2 = fn(int $daysAgo) => $now->modify("-{$daysAgo} days")->format('Y-m-d') . ' 14:30:00';
    $d3 = fn(int $daysAgo) => $now->modify("-{$daysAgo} days")->format('Y-m-d') . ' 09:15:00';

    $trades = $userCode === 'DEMO' ? $this->demoTrades() : $this->adminTrades();
    $dates = $userCode === 'DEMO'
        ? [2, 4, 7, 9, 11, 14, 16, 19, 21, 24, 27, 29]
        : [1, 3, 6, 8, 10, 13, 15, 18, 20, 23, 25, 28];
    $timeFns = [$d, $d2, $d3, $d, $d2, $d3, $d, $d2, $d3, $d, $d2, $d3];

    $result = [];
    foreach ($trades as $i => $t) {
        $fn = $timeFns[$i];
        $result[] = [
            'date'      => $fn($dates[$i]),
            'asset'     => $t['asset'],
            'direction' => $t['dir'],
            'entry'     => $t['entry'],
            'sl'        => $t['sl'],
            'tp'        => $t['tp'],
            'result'    => $t['result'],
            'pnl'       => $t['pnl'],
            'ratio'     => $t['ratio'],
            'notes'     => $t['notes'],
        ];
    }
    return $result;
}

private function demoTrades(): array
{
    // DEMO: crypto-focused, higher PnL, buy-the-dip strategy
    return [
        ['asset' => 'BTCUSDT', 'dir' => 'BUY',  'entry' => '67200', 'sl' => '65500', 'tp' => '71000', 'result' => 'WIN',  'pnl' => 1850.00, 'ratio' => '1:2.1', 'notes' => '[DEMO] Soporte semanal. BTC rebotó con volumen.'],
        ['asset' => 'ETHUSDT', 'dir' => 'BUY',  'entry' => '3380',  'sl' => '3280',  'tp' => '3650',  'result' => 'WIN',  'pnl' => 1240.00, 'ratio' => '1:2.0', 'notes' => '[DEMO] Acumulación 4H. Ruptura de rango.'],
        ['asset' => 'XAUUSD',  'dir' => 'SELL', 'entry' => '2360',  'sl' => '2385',  'tp' => '2315',  'result' => 'WIN',  'pnl' => 980.00,  'ratio' => '1:2.0', 'notes' => '[DEMO] Doble techo. Cobertura corta USD.'],
        ['asset' => 'BTCUSDT', 'dir' => 'SELL', 'entry' => '69800', 'sl' => '70800', 'tp' => '67500', 'result' => 'WIN',  'pnl' => 1520.00, 'ratio' => '1:2.3', 'notes' => '[DEMO] Rechazo EMA-50 diaria.'],
        ['asset' => 'ETHUSDT', 'dir' => 'BUY',  'entry' => '3520',  'sl' => '3450',  'tp' => '3680',  'result' => 'LOSS', 'pnl' => -340.00, 'ratio' => '1:1.5', 'notes' => '[DEMO] Stoploss ajustado.'],
        ['asset' => 'XAUUSD',  'dir' => 'BUY',  'entry' => '2310',  'sl' => '2290',  'tp' => '2350',  'result' => 'WIN',  'pnl' => 720.00,  'ratio' => '1:2.0', 'notes' => '[DEMO] Compra en soporte 2300.'],
        ['asset' => 'BTCUSDT', 'dir' => 'BUY',  'entry' => '68100', 'sl' => '67000', 'tp' => '70500', 'result' => 'WIN',  'pnl' => 980.00,  'ratio' => '1:2.0', 'notes' => '[DEMO] Continuación alcista.'],
        ['asset' => 'ETHUSDT', 'dir' => 'SELL', 'entry' => '3620',  'sl' => '3700',  'tp' => '3450',  'result' => 'WIN',  'pnl' => 850.00,  'ratio' => '1:2.0', 'notes' => '[DEMO] Reversión desde resistencia.'],
        ['asset' => 'BTCUSDT', 'dir' => 'BUY',  'entry' => '66500', 'sl' => '65500', 'tp' => '69000', 'result' => 'LOSS', 'pnl' => -520.00, 'ratio' => '1:2.0', 'notes' => '[DEMO] SL tocado por wick.'],
        ['asset' => 'XAUUSD',  'dir' => 'BUY',  'entry' => '2285',  'sl' => '2270',  'tp' => '2320',  'result' => 'WIN',  'pnl' => 630.00,  'ratio' => '1:2.0', 'notes' => '[DEMO] Patrón martillo en 4H.'],
        ['asset' => 'ETHUSDT', 'dir' => 'BUY',  'entry' => '3450',  'sl' => '3380',  'tp' => '3600',  'result' => 'WIN',  'pnl' => 580.00,  'ratio' => '1:1.9', 'notes' => '[DEMO] Rebote en EMA-20.'],
        ['asset' => 'BTCUSDT', 'dir' => 'SELL', 'entry' => '70200', 'sl' => '71000', 'tp' => '68500', 'result' => 'WIN',  'pnl' => 1120.00, 'ratio' => '1:2.2', 'notes' => '[DEMO] Falso breakout rechazado.'],
    ];
}

private function adminTrades(): array
{
    // ADMIN01: forex-focused, lower PnL, swing trades
    return [
        ['asset' => 'EURUSD',  'dir' => 'SELL', 'entry' => '1.0870','sl' => '1.0910','tp' => '1.0780','result' => 'WIN',  'pnl' => 450.00,  'ratio' => '1:2.3', 'notes' => '[ADMIN01] Datos PMI Alemania débiles.'],
        ['asset' => 'GBPUSD',  'dir' => 'BUY',  'entry' => '1.2680','sl' => '1.2640','tp' => '1.2770','result' => 'LOSS', 'pnl' => -240.00, 'ratio' => '1:1.8', 'notes' => '[ADMIN01] BoE decepcionó.'],
        ['asset' => 'USDJPY',  'dir' => 'BUY',  'entry' => '157.20','sl' => '156.50','tp' => '158.80','result' => 'WIN',  'pnl' => 640.00,  'ratio' => '1:2.0', 'notes' => '[ADMIN01] Carry trade alcista.'],
        ['asset' => 'EURUSD',  'dir' => 'BUY',  'entry' => '1.0800','sl' => '1.0770','tp' => '1.0870','result' => 'WIN',  'pnl' => 350.00,  'ratio' => '1:2.0', 'notes' => '[ADMIN01] Soporte técnico.'],
        ['asset' => 'GBPUSD',  'dir' => 'SELL', 'entry' => '1.2750','sl' => '1.2790','tp' => '1.2660','result' => 'WIN',  'pnl' => 450.00,  'ratio' => '1:2.3', 'notes' => '[ADMIN01] Doble techo H4.'],
        ['asset' => 'NAS100',  'dir' => 'BUY',  'entry' => '19450', 'sl' => '19300', 'tp' => '19800', 'result' => 'WIN',  'pnl' => 700.00,  'ratio' => '1:2.0', 'notes' => '[ADMIN01] Earnings tech positivos.'],
        ['asset' => 'USDJPY',  'dir' => 'SELL', 'entry' => '158.40','sl' => '159.00','tp' => '157.00','result' => 'LOSS', 'pnl' => -300.00, 'ratio' => '1:1.7', 'notes' => '[ADMIN01] Intervención BoJ.'],
        ['asset' => 'NAS100',  'dir' => 'SELL', 'entry' => '19700', 'sl' => '19850', 'tp' => '19400', 'result' => 'LOSS', 'pnl' => -600.00, 'ratio' => '1:1.7', 'notes' => '[ADMIN01] Rebote inesperado.'],
        ['asset' => 'EURUSD',  'dir' => 'SELL', 'entry' => '1.0890','sl' => '1.0920','tp' => '1.0820','result' => 'WIN',  'pnl' => 350.00,  'ratio' => '1:2.0', 'notes' => '[ADMIN01] Cierre mensual bajista.'],
        ['asset' => 'GBPUSD',  'dir' => 'BUY',  'entry' => '1.2620','sl' => '1.2580','tp' => '1.2710','result' => 'WIN',  'pnl' => 450.00,  'ratio' => '1:2.0', 'notes' => '[ADMIN01] Dato inflación UK.'],
        ['asset' => 'NAS100',  'dir' => 'BUY',  'entry' => '19200', 'sl' => '19050', 'tp' => '19500', 'result' => 'WIN',  'pnl' => 600.00,  'ratio' => '1:2.0', 'notes' => '[ADMIN01] Soporte 19000.'],
        ['asset' => 'USDJPY',  'dir' => 'BUY',  'entry' => '156.80','sl' => '156.20','tp' => '158.00','result' => 'WIN',  'pnl' => 480.00,  'ratio' => '1:2.0', 'notes' => '[ADMIN01] Diferencial tasas sigue amplio.'],
    ];
}
```

Since `app:seed-trades` is idempotent (skips if trades exist), to apply changes we need to either:
- Delete existing trades for both users, then re-run seed, OR
- Run a one-off SQL `DELETE FROM trades WHERE user_id IN (DEMO, ADMIN01); php bin/console app:seed-trades`

---

## Issue 2: Read-only mode when viewing another user's journal

### File: `assets/app.js`

When `window._journalViewingCode` is set, the journal tab UI must hide all modification affordances.

### Specific changes

**A. Add helper `isViewingOtherJournal()`:**
```js
function isViewingOtherJournal() {
  return !!window._journalViewingCode;
}
```

**B. `tjRefresh()` — apply read-only mode at the start:**
```js
function tjRefresh() {
  const isReadOnly = isViewingOtherJournal();

  // Ocultar botones de modificacion
  const addBtn = document.querySelector('.tj-add-btn'); // registrar nuevo
  if (addBtn) addBtn.style.display = isReadOnly ? 'none' : '';
  const importBtn = document.getElementById('tj-import-btn');
  if (importBtn) importBtn.style.display = isReadOnly ? 'none' : '';
  const exportCsvBtn = document.getElementById('tj-export-csv');
  if (exportCsvBtn) exportCsvBtn.style.display = isReadOnly ? 'none' : '';
  const exportHtmlBtn = document.getElementById('tj-export-html');
  if (exportHtmlBtn) exportHtmlBtn.style.display = isReadOnly ? 'none' : '';
  const exportJsonBtn = document.getElementById('tj-export-json');
  if (exportJsonBtn) exportJsonBtn.style.display = isReadOnly ? 'none' : '';

  // ... resto del codigo existente
}
```

**C. En el render del trade list (línea ~1400), ocultar botones de delete/edit:**
```js
// Dentro del map() que renderiza cada trade
${isReadOnly ? '' : `<button onclick="tjDelete(${t.id})" class="tj-del-btn">🗑️</button>`}
${isReadOnly ? '' : `<button onclick="tjEdit(${t.id})" class="tj-edit-btn">✏️</button>`}
```

**D. Agregar banner/texto "Solo lectura":**
Reusar el `journalViewingBanner` que ya existe (líneas 2597-2601 de base.html.twig). El banner ya muestra "👁️ Viendo journal de NOMBRE" — solo necesitamos asegurar que también muestre "Solo lectura" cuando `_journalViewingCode` está set:

```js
// En tjRefresh(), dentro del bloque del banner existente
if (scopeEl) scopeEl.textContent = (window._journalScope === 'public' ? '(público)' : '(vista según permisos)') + ' · Solo lectura';
```

**E. `viewUserJournal()` — limpiar cualquier estado de edición:**
```js
window.viewUserJournal = function(code, name) {
  window._journalViewingName = name;
  // Asegurar que no estamos en modo edicion
  if (typeof tjCancelEdit === 'function') tjCancelEdit();
  switchTab('tab-journal');
  loadJournalFromApi(code);
};
```

**F. `backToMyJournal()` — restaurar todos los botones:**
Ya hace `loadJournalFromApi()` sin args, que limpia `_journalViewingCode`. Al volver, `isReadOnly` será false y `tjRefresh()` mostrará los botones de nuevo. No requiere cambios extra.

---

## Files to modify

| File | Change |
|------|--------|
| `src/Command/SeedTradesCommand.php` | Split trades into `demoTrades()` and `adminTrades()`, add `[USER]` tag in notes |
| `assets/app.js` | Add `isViewingOtherJournal()` helper, hide modification buttons in `tjRefresh()` and trade list, update banner text |

## Verification
1. `DELETE FROM trades WHERE user_id IN (SELECT id FROM users WHERE code IN ('DEMO','ADMIN01')); php bin/console app:seed-trades` — both users now have visibly different trades.
2. ADMIN01 views DEMO journal → see only Dashboard, Trade Log, Estadísticas; **no** Registrar, Importar, Exportar, Edit/Delete buttons.
3. Click "Volver a mi journal" → ADMIN01 sees their own trades with all buttons available.
4. Backend already returns 403 on DELETE/PUT/POST for trades not owned — no change needed there.

## Out of scope
- Changing the diary (encrypted notes) — already has its own auth model
- Changing the leaderboard or other public views
- Changing visibility/permission logic