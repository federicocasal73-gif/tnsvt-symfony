"""
Genera public/index.html como entry point REAL del bundle Capacitor.
Lee public/assets/importmap.json + asset paths y los embebe.
Esto reemplaza al redirect placeholder que causaba loop infinito en la APK.
"""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ASSETS_DIR = ROOT / "public" / "assets"
INDEX_HTML = ROOT / "public" / "index.html"
IMPORTMAP_FILE = ASSETS_DIR / "importmap.json"

# Lee el importmap de AssetMapper (contiene las URLs hashed reales)
with open(IMPORTMAP_FILE, "r", encoding="utf-8") as f:
    importmap_data = json.load(f)

# Detecta qué CSS/JS principales hay en assets/
def find_latest(pattern):
    matches = sorted(ASSETS_DIR.glob(pattern))
    return matches[-1] if matches else None

api_js = find_latest("api-*.js")
app_js_rel = next(
    (v["path"] for k, v in importmap_data.items()
     if isinstance(v, dict) and v.get("path", "").endswith(".js") and "/app-" in v.get("path", "")),
    None,
)
chart_js = find_latest("chart-*.js")
mutation_js = find_latest("mutation-queue-*.js")
styles_main = find_latest("styles/app-*.css")

if not (api_js and chart_js and mutation_js and styles_main):
    sys.exit("Faltan assets compilados. Corré php bin/console asset-map:compile primero.")

# Convierte la ruta absoluta del importmap a una ruta que funcione en Capacitor WebView (file:///android_asset/public/...)
def normalize(path):
    if path.startswith("/"):
        return "." + path  # './assets/app-...js' (Capacitor sirve desde webDir)
    return path

importmap_for_html = {
    k: normalize(v["path"]) if isinstance(v, dict) else v
    for k, v in importmap_data.items()
}

INDEX_HTML.write_text("""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="theme-color" content="#d4af37">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="description" content="T.N.S.V.T - Reino del Cristo Integro. Plataforma de trading, academia, musica y comunidad para ejecutores.">
<link rel="manifest" href="./manifest.json">
<title>T.N.S.V.T - Reino del Cristo Integro</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 128 128%22><text y=%221.2em%22 font-size=%2296%22>X</text></svg>">
<link rel="stylesheet" href="{styles_main}">
<script>
  // SW killer + base path setup (no-op si no estamos en WebView Capacitor, pero safe)
  (function() {{
    try {{
      if ('serviceWorker' in navigator) {{
        navigator.serviceWorker.getRegistrations().then(function(regs) {{
          regs.forEach(function(r) {{ try {{ r.unregister(); }} catch (_) {{}} }});
        }});
      }}
      if ('caches' in window) {{
        caches.keys().then(function(keys) {{
          keys.forEach(function(k) {{ caches.delete(k); }});
        }});
      }}
    }} catch (_) {{}}
  }})();
</script>
<script src="{api_js}"></script>
<script src="{chart_js}"></script>
<script src="{mutation_js}"></script>
<script type="importmap">
{importmap_json}
</script>
<script type="module">
try {{
  const imap = JSON.parse(document.querySelector('script[type="importmap"]').textContent);
  console.log('[TNSVT-ENTRY] app path:', imap.imports.app);
  const r = await fetch(imap.imports.app);
  console.log('[TNSVT-ENTRY] fetch status:', r.status, r.headers.get('content-type'));
}} catch (e) {{
  console.log('[TNSVT-ENTRY] fetch FAIL:', e.message);
}}
import 'app';
</script>
</head>
<body>
  <div id="app-loading" style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;color:#a89bc5;font-family:sans-serif;font-size:0.9rem;background:#0d0818;z-index:1;">Iniciando T.N.S.V.T.</div>
</body>
</html>
""".format(
    api_js=api_js.name,
    chart_js=chart_js.name,
    mutation_js=mutation_js.name,
    styles_main="./" + styles_main.name,
    importmap_json=json.dumps({"imports": importmap_for_html}, indent=4),
), encoding="utf-8")

print(f"[gen_entry] {INDEX_HTML} generado con:")
print(f"  - {api_js.name}")
print(f"  - {chart_js.name}")
print(f"  - {mutation_js.name}")
print(f"  - {styles_main.name}")
print(f"  - {len(importmap_for_html)} importmaps entries")
