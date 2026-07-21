"""Debug API mock - put auth in init_script so it survives reload"""
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
        elif "/api/auth/login" in route.request.url:
            route.fulfill(status=200, content_type="application/json",
                          body='{"success":true,"user":{"code":"DEMO","name":"Demo","isAdmin":false}}')
        elif "/api/sync/snapshot" in route.request.url:
            route.fulfill(status=200, content_type="application/json",
                          body='{"success":true,"server_time":1700000000,"count":0,"items":[]}')
        else:
            route.continue_()
    page.route("**/api/**", handler)

    page.goto("http://localhost:8000/", wait_until="networkidle")
    page.wait_for_timeout(2500)

    # Check immediately after load
    raw = page.evaluate("""() => ({
        tnsv_user_at_load: localStorage.getItem('tnsv_user'),
        tnsv_auth_at_load: sessionStorage.getItem('tnsv_auth'),
    })""")
    print("Immediately after load:", raw)

    print("Captured API URLs:")
    for u in captured:
        if '/api/' in u:
            print(f"  {u}")
    print()
    diag = page.evaluate("""() => ({
        tnsv_user: localStorage.getItem('tnsv_user'),
        tnsv_auth: sessionStorage.getItem('tnsv_auth'),
        TNSVT_USER: window.TNSVT_USER ? JSON.stringify(window.TNSVT_USER) : 'undefined',
        login_display: getComputedStyle(document.getElementById('login-screen')).display,
        main_display: getComputedStyle(document.getElementById('main-content')).display,
    })""")
    print("Final diag:", diag)
    page.screenshot(path=r"C:\Users\HP 240 inch G9\AppData\Local\Temp\tnsvt_audit\debug_mock.png")
    ctx.close()
    browser.close()
