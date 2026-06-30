<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Landing pages para descargar APKs de T.N.S.V.T
 *
 * - /download/tnsvt-market  → landing page con ambas apps (juego + web)
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
        // Posibles archivos para cada app (en orden de preferencia)
        $candidates = [
            'game' => [
                $this->projectDir . '/public/downloads/tnsvt-market-instinct.apk',
                $this->projectDir . '/public/downloads/tnsvt-app.apk',
                $this->projectDir . '/public/apk/tnsvt-v3.8.apk',
            ],
            'web' => [
                $this->projectDir . '/public/apk/tnsvt-v1.6.2.apk',
                $this->projectDir . '/public/apk/tnsvt-v3.8.apk',
                $this->projectDir . '/public/downloads/tnsvt-app.apk',
            ],
        ];
        $gamePath = null; foreach ($candidates['game'] as $p) { if (file_exists($p)) { $gamePath = $p; break; } }
        $webPath = null; foreach ($candidates['web'] as $p) { if (file_exists($p)) { $webPath = $p; break; } }
        $gameExists = $gamePath !== null;
        $webExists = $webPath !== null;
        $gameSize = $gameExists ? filesize($gamePath) : 0;
        $webSize = $webExists ? filesize($webPath) : 0;
        $gameSizeMb = round($gameSize / 1024 / 1024, 2);
        $webSizeMb = round($webSize / 1024 / 1024, 2);

        $html = <<<HTML
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
<meta name="theme-color" content="#06040f">
<title>T.N.S.V.T — Descargar APKs</title>
<style>
  :root {
    --bg: #06040f; --bg2: #0d0a1a; --panel: #1a1230; --panel2: #211840;
    --border: #2d1f55; --gold: #f0c060; --gold2: #d4a030; --violet: #9353ff;
    --violet2: #7a3de0; --green: #4ade80; --red: #f87171;
    --text: #e8e0ff; --text2: #a090c0; --text3: #6a5a8a;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: linear-gradient(135deg, var(--bg) 0%, var(--bg2) 50%, var(--bg) 100%);
    color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif;
    min-height: 100dvh;
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
  }
  .container { display:flex; flex-direction:column; gap:20px; max-width:440px; width:100%; }
  .card {
    background: linear-gradient(135deg, var(--panel), var(--panel2));
    border: 1px solid var(--border); border-radius: 20px;
    padding: 24px 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    text-align: center; position: relative; overflow: hidden;
  }
  .card::before {
    content: '';
    position: absolute; top: -50px; right: -50px;
    width: 200px; height: 200px;
    background: radial-gradient(circle, rgba(147,83,255,0.3), transparent 70%);
    pointer-events: none;
  }
  .card-icon {
    width: 72px; height: 72px; margin: 0 auto 12px;
    background: linear-gradient(135deg, var(--bg2), var(--panel));
    border-radius: 18px;
    display: flex; align-items: center; justify-content: center;
    font-size: 36px; font-weight: 900; position: relative;
  }
  .card-game .card-icon { border: 2px solid var(--gold); color: var(--gold); }
  .card-web .card-icon { border: 2px solid var(--violet); color: var(--violet3); }
  h2 { font-family: 'Cinzel', serif; font-size: 18px; margin-bottom: 2px; }
  .card-game h2 { color: var(--gold); }
  .card-web h2 { color: var(--violet3); }
  .card-sub { font-size: 11px; color: var(--text3); letter-spacing: 1px; margin-bottom: 12px; text-transform: uppercase; }
  .card-info { font-size: 11px; color: var(--text2); margin-bottom: 14px; line-height: 1.5; }
  .btn {
    display: block; width: 100%; padding: 12px; border: 0; border-radius: 10px;
    font-size: 14px; font-weight: 700; cursor: pointer; text-decoration: none;
    transition: transform .15s; margin-bottom: 6px;
  }
  .btn:hover { transform: translateY(-2px); }
  .btn-gold { background: linear-gradient(135deg, var(--gold), var(--gold2)); color: var(--bg); box-shadow: 0 4px 20px rgba(240,192,96,0.3); }
  .btn-violet { background: linear-gradient(135deg, var(--violet), var(--violet2)); color: #fff; box-shadow: 0 4px 20px rgba(147,83,255,0.3); }
  .btn:active { transform: translateY(0); }
  .size-badge {
    display: inline-block; font-size: 9px; background: rgba(255,255,255,0.08);
    padding: 2px 8px; border-radius: 10px; color: var(--text3); margin-left: 6px;
  }
  .error { color: var(--red); font-size: 12px; margin-bottom: 8px; }
  .footer { text-align: center; font-size: 10px; color: var(--text3); margin-top: 4px; }
</style>
</head>
<body>
  <div class="container">
HTML;

        // Game card
        $html .= '<div class="card card-game">';
        if (!$gameExists) {
            $html .= '<div class="error">⚠ APK del juego no disponible</div>';
        }
        $html .= '<div class="card-icon">T</div>';
        $html .= '<h2>T.N.S.V.T Market Instinct</h2>';
        $html .= '<div class="card-sub">🎮 Trading Game <span class="size-badge">' . $gameSizeMb . ' MB</span></div>';
        $html .= '<div class="card-info">Modos Classic · Survival · Daily · Arena 1v1 · Torneo · Fractal · Portfolio Demo</div>';
        $html .= '<a class="btn btn-gold" href="/api/app/download-game" download>⬇ Instalar Juego</a>';
        $html .= '</div>';

        // Web card
        $html .= '<div class="card card-web">';
        if (!$webExists) {
            $html .= '<div class="error">⚠ APK de la web no disponible</div>';
        }
        $html .= '<div class="card-icon">⛧</div>';
        $html .= '<h2>T.N.S.V.T Web App</h2>';
        $html .= '<div class="card-sub">🌐 Plataforma Completa <span class="size-badge">' . $webSizeMb . ' MB</span></div>';
        $html .= '<div class="card-info">Feed · Academia · Macroeconomía · 2-Step · Journal · Chat · Musica · Admin</div>';
        $html .= '<a class="btn btn-violet" href="/api/app/download-web" download>⬇ Instalar Web TNSVT</a>';
        $html .= '</div>';

        $html .= '<div class="footer">T.N.S.V.T · Reino del Cristo Íntegro</div>';
        $html .= '</div></body></html>';

        return new Response($html, 200, ['Content-Type' => 'text/html; charset=utf-8']);
    }
}
