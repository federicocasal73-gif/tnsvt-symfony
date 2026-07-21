"""Debug: ¿por qué no se mockea el login?"""
import os
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": 412, "height": 915}, is_mobile=True, has_touch=True, device_scale_factor=2)
    ctx.add_init_script("""
        try {
            localStorage.setItem('tnsvt_api_base', 'http://localhost:8000');
            sessionStorage.setItem('tnsv_auth', 'true');
            const sess = { codename: 'Demo', token: 'DEMO', isAdmin: false };
            localStorage.setItem('tnsv_user', JSON.stringify(sess));
            localStorage.setItem('tnsvt_user', JSON.stringify(sess));
        } catch(_) {}
    """)
    page = ctx.new_page()
    page.goto("http://localhost:8000/", wait_until="networkidle")
    page.wait_for_timeout(2500)

    diag = page.evaluate("""() => {
        const login = document.getElementById('login-screen');
        const main = document.getElementById('main-content');
        return {
            tnsv_user: localStorage.getItem('tnsv_user'),
            tnsvt_user: localStorage.getItem('tnsvt_user'),
            tnsv_auth_ss: sessionStorage.getItem('tnsv_auth'),
            TNSVT_USER: window.TNSVT_USER ? JSON.stringify(window.TNSVT_USER) : 'undefined',
            login_display: login ? getComputedStyle(login).display : null,
            main_display: main ? getComputedStyle(main).display : null,
            hub_view_display: document.getElementById('hub-view') ? getComputedStyle(document.getElementById('hub-view')).display : null,
        };
    }""")
    for k, v in diag.items():
        print(f"{k}: {v}")
    page.screenshot(path=r"C:\Users\HP 240 inch G9\AppData\Local\Temp\tnsvt_audit\debug_login_mock.png")
    ctx.close()
    browser.close()
