<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Landing page para descargar la app T.N.S.V.T Market Instinct (com.tnsvt.game)
 *
 * El usuario abre http://192.168.1.2:8000/download/tnsvt-market desde el cell
 * y toca el boton "Instalar" para bajar el APK directamente desde el server.
 */
class DownloadController extends AbstractController
{
    public function __construct(
        #[Autowire('%kernel.project_dir%')]
        private readonly string $projectDir,
    ) {}

    #[Route('/download/tnsvt-market', name: 'download_tnsvt_market', methods: ['GET'])]
    public function tnsvtMarket(): Response
    {
        $apkPath = $this->projectDir . '/public/downloads/tnsvt-market-instinct.apk';
        $exists = file_exists($apkPath);
        $size = $exists ? filesize($apkPath) : 0;
        $sizeMb = round($size / 1024 / 1024, 2);
        $sha256 = $exists ? hash_file('sha256', $apkPath) : '';
        $version = $exists ? '1.0.0' : 'N/A';
        $downloadUrl = '/api/app/download-game';
        $versionInfoUrl = '/api/app/game-version';

        $html = <<<HTML
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
<meta name="theme-color" content="#06040f">
<title>T.N.S.V.T Market — Descargar APK</title>
<style>
  :root {
    --bg: #06040f;
    --bg2: #0d0a1a;
    --panel: #1a1230;
    --panel2: #211840;
    --border: #2d1f55;
    --gold: #f0c060;
    --gold2: #d4a030;
    --gold3: #fff0c0;
    --violet: #9353ff;
    --violet2: #7a3de0;
    --violet3: #c8a0ff;
    --green: #4ade80;
    --red: #f87171;
    --text: #e8e0ff;
    --text2: #a090c0;
    --text3: #6a5a8a;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: linear-gradient(135deg, var(--bg) 0%, var(--bg2) 50%, var(--bg) 100%);
    color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif;
    min-height: 100vh;
    min-height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    padding-top: env(safe-area-inset-top, 0px);
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
  .card {
    background: linear-gradient(135deg, var(--panel), var(--panel2));
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 28px 24px;
    max-width: 420px;
    width: 100%;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .card::before {
    content: '';
    position: absolute;
    top: -50px;
    right: -50px;
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, rgba(147,83,255,0.3), transparent 70%);
    pointer-events: none;
  }
  .icon {
    width: 96px;
    height: 96px;
    margin: 0 auto 16px;
    background: linear-gradient(135deg, var(--bg2), var(--panel));
    border: 2px solid var(--gold);
    border-radius: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Cinzel', serif;
    font-size: 56px;
    font-weight: 900;
    color: var(--gold);
    text-shadow: 0 0 12px rgba(240,192,96,0.5);
    box-shadow: 0 0 30px rgba(240,192,96,0.2);
    position: relative;
  }
  h1 {
    font-family: 'Cinzel', serif;
    font-size: 22px;
    color: var(--violet3);
    margin-bottom: 4px;
    letter-spacing: 1px;
  }
  .sub {
    font-size: 12px;
    color: var(--text3);
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 18px;
  }
  .info {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 14px;
    margin-bottom: 18px;
    text-align: left;
  }
  .info-row {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    font-size: 13px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .info-row:last-child { border-bottom: 0; }
  .info-lbl { color: var(--text3); }
  .info-val { color: var(--gold); font-family: 'JetBrains Mono', monospace; font-size: 11px; }
  .btn {
    display: block;
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, var(--gold), var(--gold2));
    color: var(--bg);
    border: 0;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    text-decoration: none;
    margin-bottom: 10px;
    box-shadow: 0 4px 20px rgba(240,192,96,0.3);
    transition: transform .15s;
  }
  .btn:hover { transform: translateY(-2px); }
  .btn:active { transform: translateY(0); }
  .btn.secondary {
    background: rgba(147,83,255,0.15);
    color: var(--violet3);
    box-shadow: none;
    border: 1px solid var(--violet);
  }
  .help {
    font-size: 11px;
    color: var(--text3);
    line-height: 1.6;
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px solid var(--border);
    text-align: left;
  }
  .help strong { color: var(--violet3); }
  .status {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--green);
    box-shadow: 0 0 8px var(--green);
    margin-right: 6px;
  }
  .footer {
    margin-top: 14px;
    font-size: 10px;
    color: var(--text3);
  }
  .error {
    color: var(--red);
    font-size: 13px;
    margin-bottom: 14px;
  }
</style>
</head>
<body>
  <div class="card">
HTML;

        if (!$exists) {
            $html .= '<div class="error">⚠ APK no disponible. Pedile al admin que lo suba a <code>public/downloads/</code></div>';
        }

        $html .= <<<HTML
    <div class="icon">T</div>
    <h1>T.N.S.V.T Market</h1>
    <div class="sub">INSTINCT · Trading Game</div>
    <div class="info">
      <div class="info-row"><span class="info-lbl">Package</span><span class="info-val">com.tnsvt.game</span></div>
      <div class="info-row"><span class="info-lbl">Versión</span><span class="info-val">v{$version}</span></div>
      <div class="info-row"><span class="info-lbl">Tamaño</span><span class="info-val">{$sizeMb} MB</span></div>
      <div class="info-row"><span class="info-lbl">Min Android</span><span class="info-val">5.1 (API 22)</span></div>
      <div class="info-row"><span class="info-lbl">Firmado</span><span class="info-val" style="color:var(--green)"><span class="status"></span>v1+v2</span></div>
    </div>
    <a class="btn" href="{$downloadUrl}" download>⬇ Instalar T.N.S.V.T Market</a>
    <a class="btn secondary" href="{$versionInfoUrl}">📡 Ver JSON de versión</a>
    <div class="help">
      <strong>📲 Cómo instalar:</strong><br>
      1. Tocá <strong>Instalar T.N.S.V.T Market</strong><br>
      2. Si te pide permiso, aceptá <strong>"Permitir de esta fuente"</strong><br>
      3. Abrí el APK descargado desde <strong>Descargas</strong><br>
      4. Tocá <strong>Instalar</strong> · ¡Listo!<br><br>
      <strong>🎮 Modos de juego:</strong> Classic, Survival, Daily, Arena 1v1, Torneo 10 rondas, Fractal Hist&oacute;rico, Portfolio Demo.<br><br>
      <strong>⚡ Sync con TNSVT:</strong> Dentro de la app, andá a Perfil → Sync TNSVT, cargá tu código y la URL del server. Tu XP sube a tu cuenta TNSVT.
    </div>
    <div class="footer">T.N.S.V.T · Cristo Íntegro · v1.0.0</div>
  </div>
</body>
</html>
HTML;

        return new Response($html, 200, ['Content-Type' => 'text/html; charset=utf-8']);
    }
}
