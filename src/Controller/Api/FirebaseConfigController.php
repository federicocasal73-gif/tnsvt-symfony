<?php

namespace App\Controller\Api;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Devuelve la configuracion PUBLICA de Firebase Web (la que puede exponerse al cliente).
 * Los datos sensibles (service-account.json, private keys) NUNCA salen del backend.
 *
 * La web app config se setea como variable de entorno (FIREBASE_WEB_API_KEY, etc)
 * o como JSON completo en FIREBASE_WEB_CONFIG.
 */
#[Route('/api/firebase/config')]
class FirebaseConfigController extends AbstractController
{
    public function __construct(
        #[Autowire(env: 'FIREBASE_WEB_API_KEY')]
        private readonly string $apiKey = '',
        #[Autowire(env: 'FIREBASE_AUTH_DOMAIN')]
        private readonly string $authDomain = '',
        #[Autowire(env: 'FIREBASE_PROJECT_ID')]
        private readonly string $projectId = '',
        #[Autowire(env: 'FIREBASE_STORAGE_BUCKET')]
        private readonly string $storageBucket = '',
        #[Autowire(env: 'FIREBASE_MESSAGING_SENDER_ID')]
        private readonly string $messagingSenderId = '',
        #[Autowire(env: 'FIREBASE_APP_ID')]
        private readonly string $appId = '',
        #[Autowire(env: 'FIREBASE_WEB_PUSH_VAPID_KEY')]
        private readonly string $vapidKey = '',
    ) {}

    #[Route('', name: 'api_firebase_config', methods: ['GET'])]
    public function __invoke(): JsonResponse
    {
        if (empty($this->apiKey) || empty($this->projectId)) {
            return new JsonResponse([
                'configured' => false,
                'error' => 'Firebase Web no esta configurado. Ver FIREBASE_WEB_* en .env.local',
            ], 503, ['Cache-Control' => 'no-store']);
        }
        return new JsonResponse([
            'configured' => true,
            'apiKey' => $this->apiKey,
            'authDomain' => $this->authDomain ?: ($this->projectId . '.firebaseapp.com'),
            'projectId' => $this->projectId,
            'storageBucket' => $this->storageBucket ?: ($this->projectId . '.appspot.com'),
            'messagingSenderId' => $this->messagingSenderId,
            'appId' => $this->appId,
            'vapidKey' => $this->vapidKey,
        ], 200, ['Cache-Control' => 'public, max-age=3600']);
    }
}
