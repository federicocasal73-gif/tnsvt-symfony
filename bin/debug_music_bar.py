"""Debug: ¿por qué music bar se muestra en login?"""
import os
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": 412, "height": 915}, is_mobile=True, has_touch=True, device_scale_factor=2)
    ctx.add_init_script("try { localStorage.setItem('tnsvt_api_base', 'http://localhost:8000'); } catch(_) {}")
    page = ctx.new_page()

    page.goto("http://localhost:8000/", wait_until="domcontentloaded")
    page.wait_for_timeout(1500)

    diag = page.evaluate("""() => {
        const bar = document.getElementById('musicPlayerBar');
        const cs = bar ? getComputedStyle(bar) : null;
        const inline = bar ? bar.getAttribute('style') : null;
        const bodyClass = document.body.className;
        return {
            window_TNSVT_USER: typeof window.TNSVT_USER === 'object' ? JSON.stringify(window.TNSVT_USER) : String(window.TNSVT_USER),
            tnsv_user_ls: localStorage.getItem('tnsv_user'),
            tnsvt_user_ls: localStorage.getItem('tnsvt_user'),
            tnsv_auth_ss: sessionStorage.getItem('tnsv_auth'),
            music_bar_inline_style: inline,
            music_bar_computed_display: cs ? cs.display : null,
            music_bar_computed_visibility: cs ? cs.visibility : null,
            music_bar_computed_opacity: cs ? cs.opacity : null,
            music_bar_offsetParent: bar ? bar.offsetParent !== null : null,
            music_bar_classList: bar ? Array.from(bar.classList).join(' ') : null,
            body_class: bodyClass,
        };
    }""")
    for k, v in diag.items():
        print(f"{k}: {v}")

    page.screenshot(path="C:\\Users\\HP 240 inch G9\\AppData\\Local\\Temp\\tnsvt_audit\\debug_login_fold_closed.png")
    ctx.close()
    browser.close()
