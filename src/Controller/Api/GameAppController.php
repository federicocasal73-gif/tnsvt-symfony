<?php

namespace App\Controller\Api;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Endpoints para la app T.N.S.V.T Market Instinct (com.tnsvt.game)
 *
 * - GET  /api/app/game-version       — version info del juego
 * - GET  /api/app/download-game      — descarga el APK (redirect o file)
 * - GET  /download/tnsvt-market      — landing page con boton instalar
 */
#[Route('/api/app')]
class GameAppController extends AbstractController
{
    private const GAME_VERSION = '1.0.3';
    private const GAME_VERSION_CODE = 4;
    private const GAME_APK_FILENAME = 'tnsvt-market-instinct.apk';

    public function __construct(
        #[Autowire('%kernel.project_dir%')]
        private readonly string $projectDir,
    ) {}

    #[Route('/game-version', name: 'api_app_game_version', methods: ['GET'])]
    public function version(): JsonResponse
    {
        $apkPath = $this->projectDir . '/public/downloads/' . self::GAME_APK_FILENAME;
        $size = file_exists($apkPath) ? filesize($apkPath) : 0;
        $sha256 = file_exists($apkPath) ? hash_file('sha256', $apkPath) : '';

        return new JsonResponse([
            'appId' => 'com.tnsvt.game',
            'name' => 'T.N.S.V.T Market Instinct',
            'version' => self::GAME_VERSION,
            'versionCode' => self::GAME_VERSION_CODE,
            'size' => $size,
            'sizeMb' => round($size / 1024 / 1024, 2),
            'sha256' => $sha256,
            'minSdk' => 22,
            'targetSdk' => 34,
            'downloadUrl' => '/api/app/download-game',
            'landingUrl' => '/download/tnsvt-market',
            'publishedAt' => date('c'),
        ], 200, ['Cache-Control' => 'no-store']);
    }

    #[Route('/download-game', name: 'api_app_download_game', methods: ['GET'])]
    public function download(): Response
    {
        $apkPath = $this->projectDir . '/public/downloads/' . self::GAME_APK_FILENAME;

        if (!file_exists($apkPath)) {
            return new JsonResponse([
                'error' => 'APK no disponible. Pedile al admin que suba el archivo a public/downloads/.',
            ], 404);
        }

        $response = new BinaryFileResponse($apkPath);
        $response->headers->set('Content-Type', 'application/vnd.android.package-archive');
        $response->setContentDisposition(
            ResponseHeaderBag::DISPOSITION_ATTACHMENT,
            'tnsvt-market-instinct-v' . self::GAME_VERSION . '.apk'
        );
        $response->headers->set('Content-Length', (string) filesize($apkPath));
        $response->headers->set('X-App-Version', self::GAME_VERSION);
        $response->headers->set('Cache-Control', 'public, max-age=300');
        return $response;
    }
}
