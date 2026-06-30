import asyncio, json, sys
import websockets

WS = "ws://localhost:9222/devtools/page/91B7D9AEFF9C2F8A46D206173A4E8A14"

async def main():
    async with websockets.connect(WS, max_size=4*1024*1024) as ws:
        js = """
        (() => {
            const out = {};
            out.bodyClass = document.body.className;
            out.htmlClass = document.documentElement.className;
            out.bodyBg = getComputedStyle(document.body).backgroundColor;
            out.viewport = {w: window.innerWidth, h: window.innerHeight, dpr: devicePixelRatio};

            const topbar = document.querySelector('.tnsvt-topbar');
            out.topbar = topbar ? {
                display: getComputedStyle(topbar).display,
                position: getComputedStyle(topbar).position,
                top: getComputedStyle(topbar).top,
                left: getComputedStyle(topbar).left,
                right: getComputedStyle(topbar).right,
                height: getComputedStyle(topbar).height,
                zIndex: getComputedStyle(topbar).zIndex,
            } : null;

            const brand = document.querySelector('.tnsvt-brand');
            out.brand = brand ? {
                text: brand.innerText,
                fontSize: getComputedStyle(brand.querySelector('h1')).fontSize,
            } : null;

            const brandSub = document.querySelector('.tnsvt-brand-sub');
            out.brandSub = brandSub ? {
                text: brandSub.innerText,
                display: getComputedStyle(brandSub).display,
            } : null;

            const sidebar = document.querySelector('.trading-sidebar');
            out.sidebar = sidebar ? {
                display: getComputedStyle(sidebar).display,
                position: getComputedStyle(sidebar).position,
                top: getComputedStyle(sidebar).top,
                left: getComputedStyle(sidebar).left,
                width: getComputedStyle(sidebar).width,
                transform: getComputedStyle(sidebar).transform,
                classes: sidebar.className,
            } : null;

            const sidebarLayout = document.querySelector('.trading-layout');
            out.layout = sidebarLayout ? {
                display: getComputedStyle(sidebarLayout).display,
                gridTemplateColumns: getComputedStyle(sidebarLayout).gridTemplateColumns,
            } : null;

            const tradingMain = document.querySelector('.trading-main');
            out.tradingMain = tradingMain ? {
                display: getComputedStyle(tradingMain).display,
                marginLeft: getComputedStyle(tradingMain).marginLeft,
                paddingLeft: getComputedStyle(tradingMain).paddingLeft,
                paddingRight: getComputedStyle(tradingMain).paddingRight,
            } : null;

            const newBell = document.getElementById('notifBellBtn');
            out.newBell = newBell ? {
                display: getComputedStyle(newBell).display,
                visible: newBell.offsetWidth > 0,
            } : null;

            const wrap = document.getElementById('notifBellWrap');
            out.bellWrap = wrap ? {
                display: getComputedStyle(wrap).display,
                position: getComputedStyle(wrap).position,
                top: getComputedStyle(wrap).top,
                right: getComputedStyle(wrap).right,
                zIndex: getComputedStyle(wrap).zIndex,
            } : null;

            const oldBell = document.getElementById('notifBellBtnOld');
            out.oldBell = oldBell ? {
                display: getComputedStyle(oldBell).display,
                visible: oldBell.offsetWidth > 0,
            } : null;

            const badge = document.getElementById('notifBadge');
            out.badge = badge ? {
                display: getComputedStyle(badge).display,
                text: badge.innerText,
            } : null;

            const adminBlock = document.querySelector('.tnsvt-admin-block');
            out.adminBlock = adminBlock ? {
                display: getComputedStyle(adminBlock).display,
                visible: adminBlock.offsetWidth > 0,
            } : null;

            const logoutBtn = document.getElementById('tnsvtLogoutBtn');
            out.logout = logoutBtn ? {
                display: getComputedStyle(logoutBtn).display,
            } : null;

            const music = document.getElementById('musicPlayerBar');
            out.music = music ? {
                display: getComputedStyle(music).display,
                position: getComputedStyle(music).position,
                bottom: getComputedStyle(music).bottom,
                left: getComputedStyle(music).left,
                right: getComputedStyle(music).right,
                height: getComputedStyle(music).height,
            } : null;

            const fab = document.querySelector('.cf-fab');
            out.cfFab = fab ? {
                display: getComputedStyle(fab).display,
                bottom: getComputedStyle(fab).bottom,
                right: getComputedStyle(fab).right,
            } : null;

            let activeTab = null;
            document.querySelectorAll('.tab-content').forEach(t => {
                if (t.classList.contains('active')) activeTab = t.id;
            });
            out.activeTab = activeTab;

            out.bodyClasses = document.body.className;
            out.layoutFold = document.body.classList.contains('layout-fold-open');
            out.layoutClosed = document.body.classList.contains('layout-fold-closed');
            out.isSpanned = document.body.classList.contains('is-spanned');

            return JSON.stringify(out, null, 2);
        })();
        """
        msg = {"id": 1, "method": "Runtime.evaluate", "params": {"expression": js, "returnByValue": True}}
        await ws.send(json.dumps(msg))
        resp = json.loads(await ws.recv())
        print(json.dumps(resp.get("result", {}).get("result", {}).get("value", resp), indent=2))

asyncio.run(main())
