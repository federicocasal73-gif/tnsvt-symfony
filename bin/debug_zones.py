"""Debug: do the mocks survive page.reload() in capture_zone?"""
from playwright.sync_api import sync_playwright

INIT_SCRIPT = """
try {
    localStorage.setItem('tnsvt_api_base', 'http://localhost:8000');
    sessionStorage.setItem('tnsv_auth', 'true');
    const sess = { codename: 'Demo', token: 'DEMO', isAdmin: false };
    localStorage.setItem('tnsv_user', JSON.stringify(sess));
    localStorage.setItem('tnsvt_user', JSON.stringify(sess));
} catch(_) {}
"""

LOG_SCRIPT = """
window.__api_calls = [];
window.__fetch_orig = window.fetch;
window.fetch = function(url, opts) {
    window.__api_calls.push({ url: String(url), method: (opts && opts.method) || 'GET', t: Date.now() });
    return window.__fetch_orig.apply(this, arguments);
};
"""

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": 412, "height": 915}, is_mobile=True)
    ctx.add_init_script(INIT_SCRIPT)

    page = ctx.new_page()

    captured = []
    def handler(route):
        captured.append(route.request.url)
        if "/api/auth/check" in route.request.url:
            route.fulfill(status=200, content_type="application/json",
                          body='{"authenticated":true,"user":{"code":"DEMO","name":"Demo","isAdmin":false}}')
        elif "/api/sync/snapshot" in route.request.url:
            route.fulfill(status=200, content_type="application/json",
                          body='{"success":true,"server_time":1700000000,"count":0,"items":[]}')
        else:
            route.continue_()
    page.route("**/api/**", handler)

    page.goto("http://localhost:8000/", wait_until="networkidle")
    page.wait_for_timeout(2000)

    # Skip the clear+reload, just navigate via JS
    page.evaluate("() => { switchTab && switchTab('tab-hub-view'); }")
    page.wait_for_timeout(1500)

    print("Route mock intercepted:")
    for u in captured:
        if '/api/' in u:
            print(f"  {u}")
    print()
    diag = page.evaluate("""() => ({
        tnsv_user: localStorage.getItem('tnsv_user'),
        tnsv_auth: sessionStorage.getItem('tnsv_auth'),
        TNSVT_USER: window.TNSVT_USER ? JSON.stringify(window.TNSVT_USER) : 'undefined',
        login_screen_display: getComputedStyle(document.getElementById('login-screen')).display,
        main_content_display: getComputedStyle(document.getElementById('main-content')).display,
        api_calls: window.__api_calls || [],
    })""")
    print("Final diag:")
    for k, v in diag.items():
        if k == 'api_calls':
            for c in v:
                print(f"  [api] {c['method']} {c['url']}")
        else:
            print(f"  {k}: {v}")

    ctx.close()
    browser.close()
