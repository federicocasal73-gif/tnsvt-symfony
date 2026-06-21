<?php

namespace App\Controller\Api\Admin;

use App\Entity\Device;
use App\Entity\Notification;
use App\Entity\User;
use App\Repository\NotificationRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;

#[Route('/api/diagnostics')]
class DiagnosticsController extends AbstractController
{
    use RequireAdminTrait;

    public function __construct(
        private UserRepository $userRepository,
        private TokenStorageInterface $tokenStorage,
        private EntityManagerInterface $em,
    ) {}

    #[Route('', name: 'api_diagnostics', methods: ['GET'])]
    public function index(Request $request): JsonResponse
    {
        if ($denied = $this->requireAdmin($this->userRepository, $this->tokenStorage)) {
            return $denied;
        }

        $projectDir = $this->getParameter('kernel.project_dir');
        $swPath = $projectDir . '/public/sw.js';
        $fcmSwPath = $projectDir . '/public/firebase-messaging-sw.js';

        $swFile = $this->checkSwFile($swPath);
        $fcmFile = $this->checkSwFile($fcmSwPath);

        $notifRepo = $this->em->getRepository(Notification::class);
        $deviceRepo = $this->em->getRepository(Device::class);

        $totalNotifs = $notifRepo->count([]);
        $unreadNotifs = $notifRepo->count(['isRead' => false]);
        $totalDevices = $deviceRepo->count([]);
        $devicesByPlatform = $deviceRepo->createQueryBuilder('d')
            ->select('d.platform, COUNT(d.id) as cnt')
            ->groupBy('d.platform')
            ->getQuery()
            ->getArrayResult();

        $users = $this->userRepository->findAll();
        $totalUsers = count($users);

        $hints = [];

        if ($swFile['exists']) {
            $hints[] = ['level' => 'ok', 'msg' => 'sw.js presente (' . $swFile['size_kb'] . ' KB)'];
        } else {
            $hints[] = ['level' => 'error', 'msg' => 'sw.js NO encontrado — PWA no funciona'];
        }

        if ($fcmFile['exists']) {
            $hints[] = ['level' => 'ok', 'msg' => 'firebase-messaging-sw.js presente'];
        } else {
            $hints[] = ['level' => 'warning', 'msg' => 'firebase-messaging-sw.js no encontrado — push web puede fallar'];
        }

        $webKey = $_ENV['FIREBASE_WEB_API_KEY'] ?? '';
        if ($webKey && $webKey !== 'YOUR_API_KEY') {
            $hints[] = ['level' => 'ok', 'msg' => 'Firebase Web configurado'];
        } else {
            $hints[] = ['level' => 'warning', 'msg' => 'FIREBASE_WEB_API_KEY no configurada — push web inactivo'];
        }

        $saPath = $_ENV['FCM_SERVICE_ACCOUNT'] ?? '';
        $saExists = $saPath && file_exists($projectDir . '/' . $saPath);
        if ($saExists) {
            $hints[] = ['level' => 'ok', 'msg' => 'FCM Service Account presente'];
        } else {
            $hints[] = ['level' => 'warning', 'msg' => 'FCM Service Account no encontrado — push nativo puede fallar'];
        }

        $mpToken = $_ENV['MP_ACCESS_TOKEN'] ?? '';
        if ($mpToken) {
            $hints[] = ['level' => 'ok', 'msg' => 'MercadoPago configurado'];
        } else {
            $hints[] = ['level' => 'info', 'msg' => 'MercadoPago no configurado (opcional)'];
        }

        $bnKey = $_ENV['BINANCE_PAY_API_KEY'] ?? '';
        if ($bnKey) {
            $hints[] = ['level' => 'ok', 'msg' => 'Binance Pay configurado'];
        } else {
            $hints[] = ['level' => 'info', 'msg' => 'Binance Pay no configurado (opcional)'];
        }

        $dbOk = $this->checkDatabase();

        return $this->json([
            'timestamp' => date('c'),
            'php' => PHP_VERSION,
            'symfony' => \Symfony\Component\HttpKernel\Kernel::VERSION,
            'env' => $_ENV['APP_ENV'] ?? 'dev',
            'database' => $dbOk,
            'firebase' => [
                'web_configured' => $webKey && $webKey !== 'YOUR_API_KEY',
                'service_account_exists' => $saExists,
            ],
            'service_workers_files' => [
                'sw.js' => $swFile,
                'firebase-messaging-sw.js' => $fcmFile,
            ],
            'notifications' => [
                'total' => $totalNotifs,
                'unread' => $unreadNotifs,
            ],
            'devices' => [
                'total' => $totalDevices,
                'by_platform' => array_combine(
                    array_column($devicesByPlatform, 'platform'),
                    array_map('intval', array_column($devicesByPlatform, 'cnt'))
                ),
            ],
            'users' => [
                'total' => $totalUsers,
            ],
            'hints' => $hints,
        ]);
    }

    private function checkSwFile(string $path): array
    {
        if (!file_exists($path)) {
            return ['exists' => false, 'size_kb' => 0, 'version' => ''];
        }
        $size = filesize($path);
        $content = file_get_contents($path);
        $version = '';
        if (preg_match('/CACHE_NAME\s*=\s*[\'"]([^\'"]+)[\'"]/', $content, $m)) {
            $version = $m[1];
        }
        return [
            'exists' => true,
            'size_kb' => round($size / 1024, 1),
            'version' => $version,
        ];
    }

    private function checkDatabase(): array
    {
        try {
            $conn = $this->em->getConnection();
            $conn->executeQuery('SELECT 1');
            return ['connected' => true, 'driver' => $conn->getDriver()->getName()];
        } catch (\Throwable $e) {
            return ['connected' => false, 'error' => $e->getMessage()];
        }
    }
}
