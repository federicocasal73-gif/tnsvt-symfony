<?php

namespace App\Controller\Api;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Devuelve la version actual de la app TNSVT.
 *
 * La app (web y Android) consulta este endpoint al iniciar
 * para detectar si hay una version mas nueva y mostrar
 * el modal de update.
 *
 * La version y la URL del APK se mantienen como variables
 * de entorno para que se puedan cambiar sin redeployar:
 * - APP_VERSION: semver (ej: 1.2.3)
 * - APP_VERSION_CODE: int que se incrementa (ej: 5)
 * - APP_DOWNLOAD_URL: URL publica donde esta hosteado el APK
 * - APP_RELEASE_NOTES: notas de la version (string)
 * - APP_UPDATE_REQUIRED: bool si la version actual es muy vieja
 *
 * Para actualizar la version: cambiar los env vars y reiniciar.
 * El APK nuevo debe tener el mismo APP_VERSION_CODE en su
 * AndroidManifest.xml.
 */
#[Route('/api/app')]
class AppVersionController extends AbstractController
{
    public function __construct(
        #[Autowire(env: 'APP_VERSION')]
        private readonly ?string $version = '1.0.0',
        #[Autowire(env: 'APP_VERSION_CODE')]
        private readonly ?string $versionCode = '1',
        #[Autowire(env: 'APP_DOWNLOAD_URL')]
        private readonly ?string $downloadUrl = '',
        #[Autowire(env: 'APP_RELEASE_NOTES')]
        private readonly ?string $releaseNotes = '',
        #[Autowire(env: 'APP_UPDATE_REQUIRED')]
        private readonly ?string $updateRequired = 'false',
    ) {}

    #[Route('/version', name: 'api_app_version', methods: ['GET'])]
    public function __invoke(): JsonResponse
    {
        return new JsonResponse([
            'version' => $this->version,
            'versionCode' => (int) $this->versionCode,
            'downloadUrl' => $this->downloadUrl,
            'releaseNotes' => $this->releaseNotes,
            'updateRequired' => filter_var($this->updateRequired, FILTER_VALIDATE_BOOLEAN),
            'publishedAt' => date('c'),
        ], 200, ['Cache-Control' => 'no-store']);
    }
}
