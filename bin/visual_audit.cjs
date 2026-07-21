// Visual audit Playwright para TNSVT (v4.24 offline-first).
// Captura las 8 zonas × 4 viewports y guarda PNGs + reporte JSON.

const { chromium } = require('C:\\Users\\HP 240 inch G9\\AppData\\Local\\Programs\\nodejs\\node_modules\\playwright');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(process.env.TEMP || 'C:\\Users\\HP 240 inch G9\\AppData\\Local\\Temp', 'tnsvt_audit');
fs.mkdirSync(OUT_DIR, { recursive: true });

const VIEWPORTS = [
  { name: 'fold_closed',    width: 412,  height: 915,  isMobile: true  },
  { name: 'fold_open',      width: 720,  height: 840,  isMobile: true  },
  { name: 'fold_dual',      width: 880,  height: 900,  isMobile: true  },
  { name: 'desktop',        width: 1366, height: 800,  isMobile: false },
];

const ZONES = [
  { name: 'login',            ready: 'logged_out' },
  { name: 'hub',              ready: 'logged_in'  },
  { name: 'journal_inner',    ready: 'logged_in', tab: 'tab-journal', inner: 'tj-dash' },
  { name: 'journal_log',      ready: 'logged_in', tab: 'tab-journal', inner: 'tj-log' },
  { name: 'journal_import',   ready: 'logged_in', tab: 'tab-journal', inner: 'tj-dash', openImport: true },
  { name: 'security',         ready: 'logged_in', tab: 'tab-security' },
  { name: 'trading',          ready: 'logged_in', tab: 'tab-trading' },
  { name: 'chat_widget',      ready: 'logged_in', openChat: true },
];

async function captureZone(page, zone, vp) {
  // Reset to known state
  await page.evaluate(() => { try { localStorage.removeItem('tnsv_auth'); localStorage.removeItem('tnsvt_user'); } catch(_) {} });
  if (zone.ready === 'logged_in') {
    await page.evaluate(() => {
      try {
        sessionStorage.setItem('tnsv_auth', 'true');
        localStorage.setItem('tnsvt_user', JSON.stringify({ codename: 'Demo', token: 'DEMO', isAdmin: false }));
        window.TNSVT_USER = { code: 'DEMO', name: 'Demo', isAdmin: false };
      } catch (_) {}
    });
  }
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  if (zone.tab) {
    await page.evaluate((tab) => {
      const btn = document.querySelector(`[onclick*="switchTab('${tab}')"]`);
      if (btn) btn.click();
    }, zone.tab);
    await page.waitForTimeout(300);
  }

  if (zone.inner) {
    await page.evaluate((inner) => {
      const btn = document.querySelector(`[onclick*="tjTab('${inner}'"]`);
      if (btn) btn.click();
    }, zone.inner);
    await page.waitForTimeout(300);
  }

  if (zone.openImport) {
    await page.evaluate(() => {
      const input = document.getElementById('tj-import-input');
      if (input) input.style.display = 'block';
      const modal = document.getElementById('tj-import-modal');
      if (modal) modal.style.display = 'flex';
    });
    await page.waitForTimeout(200);
  }

  if (zone.openChat) {
    await page.evaluate(() => {
      const fab = document.querySelector('.cf-fab');
      if (fab) fab.click();
    });
    await page.waitForTimeout(400);
  }

  // Hide offline banner for cleaner shots (it's expected behavior)
  await page.evaluate(() => {
    const b = document.getElementById('tnsvt-offline-banner');
    if (b) { b.classList.remove('show'); b.setAttribute('hidden', ''); }
    // Hide first-run modal if present
    const m = document.getElementById('tnsvt-apisetup-overlay');
    if (m) m.remove();
  });

  const filename = `${vp.name}_${zone.name}.png`;
  const filepath = path.join(OUT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: false });

  // Collect errors
  const errors = await page.evaluate(() => {
    const els = {
      loginBtn: !!document.querySelector('.login-btn'),
      musicBarVisible: document.getElementById('musicPlayerBar')?.offsetParent !== null,
      offlineBanner: document.getElementById('tnsvt-offline-banner')?.classList.contains('show'),
      gateBoxOverflow: (() => {
        const g = document.querySelector('.gate-box');
        if (!g) return null;
        const r = g.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, vh: window.innerHeight, overflow: r.bottom > window.innerHeight };
      })(),
      importModalVisible: document.getElementById('tj-import-modal')?.offsetParent !== null,
      chatPanelOpen: document.querySelector('.cf-panel.cf-in-chat, #cfPanel.cf-in-chat') !== null,
    };
    return els;
  });

  return { filename, errors };
}

(async () => {
  const browser = await chromium.launch();
  const results = [];

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.isMobile ? 2 : 1,
      userAgent: vp.isMobile ? 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 TNSVT-Audit' : undefined,
      isMobile: vp.isMobile,
      hasTouch: vp.isMobile,
    });

    // Pre-set localStorage to skip first-run modal & login
    await context.addInitScript(() => {
      try {
        localStorage.setItem('tnsvt_api_base', 'http://localhost:8000');
      } catch (_) {}
    });

    const page = await context.newPage();
    // Capture console errors
    const consoleErrors = [];
    page.on('pageerror', (err) => consoleErrors.push('pageerror: ' + err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push('console.error: ' + msg.text());
    });

    await page.goto('http://localhost:8000/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    for (const zone of ZONES) {
      try {
        const r = await captureZone(page, zone, vp);
        results.push({ viewport: vp.name, zone: zone.name, file: r.filename, errors: r.errors, consoleErrors: [...consoleErrors] });
        consoleErrors.length = 0;
      } catch (e) {
        results.push({ viewport: vp.name, zone: zone.name, error: e.message });
      }
    }

    await context.close();
  }

  await browser.close();

  const reportPath = path.join(OUT_DIR, 'audit_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log('REPORT_PATH=' + reportPath);
  console.log('OUT_DIR=' + OUT_DIR);
  console.log('Total screenshots: ' + results.filter(r => r.file).length);
})().catch((e) => { console.error('FATAL:', e); process.exit(1); });
