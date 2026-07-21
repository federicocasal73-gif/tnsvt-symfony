"""
Visual audit TNSVT (v4.24 offline-first).
Captures 8 zones x 4 viewports with Playwright Python.
Outputs PNG screenshots + JSON report.
"""

import json
import os
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

OUT_DIR = Path(os.environ.get("TEMP", r"C:\Users\HP 240 inch G9\AppData\Local\Temp")) / "tnsvt_audit"
OUT_DIR.mkdir(parents=True, exist_ok=True)

VIEWPORTS = [
    {"name": "fold_closed", "width": 412, "height": 915, "is_mobile": True},
    {"name": "fold_open",   "width": 720, "height": 840, "is_mobile": True},
    {"name": "fold_dual",   "width": 880, "height": 900, "is_mobile": True},
    {"name": "desktop",     "width": 1366, "height": 800, "is_mobile": False},
]

ZONES = [
    {"name": "login",           "ready": "logged_out"},
    {"name": "hub",             "ready": "logged_in"},
    {"name": "journal_dash",    "ready": "logged_in", "tab": "tab-journal", "inner": "tj-dash"},
    {"name": "journal_log",     "ready": "logged_in", "tab": "tab-journal", "inner": "tj-log"},
    {"name": "journal_import",  "ready": "logged_in", "tab": "tab-journal", "inner": "tj-dash", "open_import": True},
    {"name": "security",        "ready": "logged_in", "tab": "tab-security"},
    {"name": "trading",         "ready": "logged_in", "tab": "tab-trading"},
    {"name": "chat_widget",     "ready": "logged_in", "open_chat": True},
]

def capture_zone(page, zone):
    """Navigate to zone via JS, return diagnostic dict."""
    # Reset UI state for every zone
    if zone["ready"] == "logged_out":
        page.evaluate("""() => {
            try {
                localStorage.removeItem('tnsv_auth');
                localStorage.removeItem('tnsv_user');
                localStorage.removeItem('tnsvt_user');
                sessionStorage.removeItem('tnsv_auth');
            } catch(_) {}
            window.TNSVT_USER = null;
            const login = document.getElementById('login-screen');
            const main = document.getElementById('main-content');
            if (login) login.style.display = 'flex';
            if (main) main.style.display = 'none';
        }""")
        page.wait_for_timeout(300)
    else:
        # Force logged_in state directly via JS (skip checkAuthStatus round-trip)
        page.evaluate("""() => {
            try {
                sessionStorage.setItem('tnsv_auth', 'true');
                const sess = { codename: 'Demo', token: 'DEMO', isAdmin: false };
                localStorage.setItem('tnsv_user', JSON.stringify(sess));
                localStorage.setItem('tnsvt_user', JSON.stringify(sess));
                window.TNSVT_USER = { code: 'DEMO', name: 'Demo', isAdmin: false };
                const login = document.getElementById('login-screen');
                const main = document.getElementById('main-content');
                if (login) login.style.display = 'none';
                if (main) main.style.display = 'block';
                // Show main-content + hub-view by default
                const hub = document.getElementById('hub-view');
                if (hub && !hub.style.display) hub.style.display = 'flex';
            } catch(_) {}
        }""")
        page.wait_for_timeout(300)

    if "tab" in zone:
        page.evaluate(
            "(tab) => { if (window.switchTab) { window.switchTab(tab); } else { const btn = document.querySelector(`[onclick*=\"switchTab('${tab}')\"]`); if (btn) btn.click(); } const hub = document.getElementById('hub-view'); if (hub) hub.style.display = 'none'; const mp = document.getElementById('module-panel'); if (mp) mp.style.display = 'block'; const tp = document.getElementById('trading-panel'); if (tp) tp.style.display = 'none'; }",
            zone["tab"],
        )
        page.wait_for_timeout(500)

    if "inner" in zone:
        page.evaluate(
            "(inner) => { if (window.tjTab) { window.tjTab(inner, document.querySelector(`[onclick*=\"tjTab('${inner}'\"]`)); } else { const btn = document.querySelector(`[onclick*=\"tjTab('${inner}'\"]`); if (btn) btn.click(); } }",
            zone["inner"],
        )
        page.wait_for_timeout(400)

    if zone.get("open_import"):
        page.evaluate("""() => {
            const m = document.getElementById('tj-import-modal');
            if (m) m.style.display = 'flex';
        }""")
        page.wait_for_timeout(200)

    if zone.get("open_chat"):
        page.evaluate("""() => {
            const fab = document.querySelector('.cf-fab');
            if (fab) fab.click();
        }""")
        page.wait_for_timeout(400)

    # Hide offline banner + first-run modal + loading bar for cleaner screenshots
    page.evaluate("""() => {
        const b = document.getElementById('tnsvt-offline-banner');
        if (b) { b.classList.remove('show'); b.setAttribute('hidden', ''); }
        const m = document.getElementById('tnsvt-apisetup-overlay');
        if (m) m.remove();
        // Hide all loaders (loading bar, hub-view loaders, etc)
        document.querySelectorAll('[id*="loading"], [id*="Loading"], [id*="loader"], [id*="Loader"]').forEach(el => {
            el.style.display = 'none';
            el.style.visibility = 'hidden';
        });
        // Hide the full-screen "Cargando el Reino" overlay
        const fullLoad = document.getElementById('full-loading-overlay') ||
            document.querySelector('[class*="full-loading"]') ||
            document.querySelector('[id*="full-screen-loading"]');
        if (fullLoad) fullLoad.style.display = 'none';
        // Hide by class too
        document.querySelectorAll('[class*="overlay-loading"], [class*="loading-overlay"]').forEach(el => {
            el.style.display = 'none';
        });
    }""")
    page.wait_for_timeout(300)

    diag = page.evaluate("""() => {
        const loginScreen = document.getElementById('login-screen');
        const mainContent = document.getElementById('main-content');
        const musicBar = document.getElementById('musicPlayerBar');
        const importModal = document.getElementById('tj-import-modal');
        const cfPanel = document.querySelector('.cf-panel');
        return {
            login_screen_display: loginScreen ? getComputedStyle(loginScreen).display : null,
            main_content_display: mainContent ? getComputedStyle(mainContent).display : null,
            music_bar_display: musicBar ? getComputedStyle(musicBar).display : null,
            music_bar_visible_class: musicBar ? musicBar.classList.contains('visible') : null,
            import_modal_visible: importModal ? importModal.offsetParent !== null : null,
            chat_panel_in_chat: cfPanel ? cfPanel.classList.contains('cf-in-chat') : null,
            TNSVT_USER_code: window.TNSVT_USER ? window.TNSVT_USER.code : null,
            bodyScrollHeight: document.body.scrollHeight,
            viewportHeight: window.innerHeight,
            bodyOverflows: document.body.scrollHeight > window.innerHeight + 50,
        };
    }""")

    return diag

def main():
    results = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        for vp in VIEWPORTS:
            context = browser.new_context(
                viewport={"width": vp["width"], "height": vp["height"]},
                device_scale_factor=2 if vp["is_mobile"] else 1,
                is_mobile=vp["is_mobile"],
                has_touch=vp["is_mobile"],
                user_agent=("Mozilla/5.0 (Linux; Android 13; SM-F946U) AppleWebKit/537.36 TNSVT-Audit"
                            if vp["is_mobile"] else None),
            )
            context.add_init_script("""
                try {
                    localStorage.setItem('tnsvt_api_base', 'http://localhost:8000');
                    sessionStorage.setItem('tnsv_auth', 'true');
                    const sess = { codename: 'Demo', token: 'DEMO', isAdmin: false };
                    localStorage.setItem('tnsv_user', JSON.stringify(sess));
                    localStorage.setItem('tnsvt_user', JSON.stringify(sess));
                } catch(_) {}
            """)

            page = context.new_page()
            console_errors = []
            page.on("pageerror", lambda exc: console_errors.append(f"pageerror: {exc}"))
            page.on("console", lambda msg: console_errors.append(f"{msg.type}: {msg.text}") if msg.type == "error" else None)

            # Mock /api/** para que el loader termine rápido y los tabs carguen contenido stub.
            route_calls = []
            EMPTY_USER = '{"id":null,"code":"DEMO","name":"Demo","isAdmin":false,"avatar_url":null,"avatar_color":null,"initials":"DE"}'
            EMPTY_LIST = '{"success":true,"items":[],"count":0}'
            EMPTY_NOTIFS = '{"success":true,"items":[],"unread":0}'
            EMPTY_CHATS = '{"success":true,"conversations":[],"unread_total":0}'
            EMPTY_TASKS = '{"success":true,"tasks":[]}'
            EMPTY_FEED = '{"success":true,"posts":[]}'
            EMPTY_ACADEMIA = '{"success":true,"courses":[],"categories":[]}'
            EMPTY_MUSIC = '{"success":true,"tracks":[]}'
            EMPTY_CALENDAR = '{"success":true,"events":[]}'
            EMPTY_JOURNAL = '{"success":true,"server_time":1700000000,"count":0,"items":[]}'
            def handle_route(route):
                url = route.request.url
                route_calls.append(url)
                if "/api/auth/check" in url:
                    route.fulfill(status=200, content_type="application/json",
                                  body='{"authenticated":true,"user":' + EMPTY_USER + '}')
                elif "/api/auth/login" in url:
                    route.fulfill(status=200, content_type="application/json",
                                  body='{"success":true,"user":' + EMPTY_USER + '}')
                elif "/api/sync/snapshot" in url:
                    route.fulfill(status=200, content_type="application/json", body=EMPTY_JOURNAL)
                elif "/api/notifications" in url:
                    route.fulfill(status=200, content_type="application/json", body=EMPTY_NOTIFS)
                elif "/api/chat" in url:
                    route.fulfill(status=200, content_type="application/json", body=EMPTY_CHATS)
                elif "/api/tasks" in url:
                    route.fulfill(status=200, content_type="application/json", body=EMPTY_TASKS)
                elif "/api/feed" in url:
                    route.fulfill(status=200, content_type="application/json", body=EMPTY_FEED)
                elif "/api/academia" in url:
                    route.fulfill(status=200, content_type="application/json", body=EMPTY_ACADEMIA)
                elif "/api/music" in url:
                    route.fulfill(status=200, content_type="application/json", body=EMPTY_MUSIC)
                elif "/api/calendar" in url:
                    route.fulfill(status=200, content_type="application/json", body=EMPTY_CALENDAR)
                elif "/api/journal" in url:
                    route.fulfill(status=200, content_type="application/json",
                                  body='{"success":true,"trades":[],"count":0}')
                else:
                    route.fulfill(status=200, content_type="application/json", body='{"success":true}')
            page.route("**/api/**", handle_route)

            page.goto("http://localhost:8000/", wait_until="networkidle")
            page.wait_for_timeout(800)

            print(f"[{vp['name']}] Initial auth state:", page.evaluate("""() => ({
                tnsv_user: !!localStorage.getItem('tnsv_user'),
                tnsv_auth: !!sessionStorage.getItem('tnsv_auth'),
                login_display: getComputedStyle(document.getElementById('login-screen')).display,
            })"""))

            for zone in ZONES:
                filename = f"{vp['name']}_{zone['name']}.png"
                filepath = OUT_DIR / filename
                try:
                    diag = capture_zone(page, zone)
                    page.screenshot(path=str(filepath), full_page=False)
                    results.append({
                        "viewport": vp["name"],
                        "zone": zone["name"],
                        "file": str(filepath),
                        "diag": diag,
                        "console_errors": list(console_errors),
                    })
                    console_errors.clear()
                except Exception as e:
                    results.append({
                        "viewport": vp["name"],
                        "zone": zone["name"],
                        "error": str(e),
                    })

            context.close()

        browser.close()

    report_path = OUT_DIR / "audit_report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"OUT_DIR={OUT_DIR}")
    print(f"REPORT={report_path}")
    print(f"Total screenshots: {sum(1 for r in results if 'file' in r)}")
    print(f"Failed: {sum(1 for r in results if 'error' in r)}")

if __name__ == "__main__":
    main()
