"""Debug: why does switchTab throw for journal zones?"""
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
    page.on("pageerror", lambda exc: print(f"PAGE ERROR: {exc}"))

    def handler(route):
        url = route.request.url
        if "/api/auth/check" in url:
            route.fulfill(status=200, content_type="application/json",
                          body='{"authenticated":true,"user":{"code":"DEMO","name":"Demo","isAdmin":false}}')
        else:
            route.fulfill(status=200, content_type="application/json", body='{"success":true,"items":[]}')
    page.route("**/api/**", handler)

    page.goto("http://localhost:8000/", wait_until="networkidle")
    page.wait_for_timeout(1500)

    print("Available tab-content elements:", page.evaluate("""() => {
        return Array.from(document.querySelectorAll('.tab-content')).map(el => ({
            id: el.id,
            classList: el.classList ? Array.from(el.classList).join(',') : 'NO_classList',
            tag: el.tagName,
        }));
    }"""))

    print("\nTrying switchTab('tab-journal'):")
    try:
        result = page.evaluate("() => { switchTab('tab-journal'); return 'OK'; }")
        print(f"  Result: {result}")
    except Exception as e:
        print(f"  Exception: {e}")

    page.wait_for_timeout(500)
    print("\nAfter switchTab:")
    diag = page.evaluate("""() => ({
        journal_active: document.getElementById('tab-journal')?.classList?.contains('active'),
        journal_display: getComputedStyle(document.getElementById('tab-journal')).display,
        main_display: getComputedStyle(document.getElementById('main-content')).display,
    })""")
    print(f"  {diag}")

    ctx.close()
    browser.close()
