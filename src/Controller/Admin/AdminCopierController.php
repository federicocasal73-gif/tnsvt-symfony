<?php

namespace App\Controller\Admin;

use App\Controller\Api\Admin\RequireAdminTrait;
use App\Repository\UserRepository;
use App\Service\CopierBridgeService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;

#[Route('/api/admin/copier')]
class AdminCopierController extends AbstractController
{
    use RequireAdminTrait;

    public function __construct(
        private CopierBridgeService $copierService,
        private UserRepository $userRepository,
        private TokenStorageInterface $tokenStorage,
    ) {}

    #[Route('/status', name: 'admin_copier_status', methods: ['GET'])]
    public function status(Request $request): JsonResponse
    {
        if ($denied = $this->requireAdmin($this->userRepository, $this->tokenStorage)) return $denied;

        $status = $this->copierService->getCopierStatus();

        $isOnline = false;
        if ($status['last_heartbeat'] ?? null) {
            $last = new \DateTimeImmutable($status['last_heartbeat']);
            $diff = (new \DateTimeImmutable())->getTimestamp() - $last->getTimestamp();
            $isOnline = $diff < 120;
        }

        return $this->json([
            'success' => true,
            'online' => $isOnline,
            'status' => $status,
        ]);
    }

    #[Route('/trades', name: 'admin_copier_trades', methods: ['GET'])]
    public function trades(Request $request): JsonResponse
    {
        if ($denied = $this->requireAdmin($this->userRepository, $this->tokenStorage)) return $denied;

        $limit = (int) $request->query->get('limit', 50);
        $trades = $this->copierService->getRecentTrades($limit);

        return $this->json(['success' => true, 'trades' => $trades]);
    }

    #[Route('/config', name: 'admin_copier_config_get', methods: ['GET'])]
    public function getConfig(Request $request): JsonResponse
    {
        if ($denied = $this->requireAdmin($this->userRepository, $this->tokenStorage)) return $denied;

        $config = $this->copierService->getCopierConfig();

        return $this->json(['success' => true, 'config' => $config]);
    }

    #[Route('/config', name: 'admin_copier_config_put', methods: ['PUT'])]
    public function setConfig(Request $request): JsonResponse
    {
        if ($denied = $this->requireAdmin($this->userRepository, $this->tokenStorage)) return $denied;

        $data = json_decode($request->getContent(), true);
        if (!$data) {
            return $this->json(['error' => 'Data requerida'], 400);
        }

        $current = $this->copierService->getCopierConfig();
        $merged = array_merge($current, $data);
        $this->copierService->setCopierConfig($merged);

        return $this->json(['success' => true, 'config' => $merged]);
    }

    #[Route('/dashboard', name: 'admin_copier_dashboard', methods: ['GET'])]
    public function dashboard(Request $request): JsonResponse
    {
        if ($denied = $this->requireAdmin($this->userRepository, $this->tokenStorage)) return $denied;

        $status = $this->copierService->getCopierStatus();
        $config = $this->copierService->getCopierConfig();
        $trades = $this->copierService->getRecentTrades(10);

        $isOnline = false;
        if ($status['last_heartbeat'] ?? null) {
            $last = new \DateTimeImmutable($status['last_heartbeat']);
            $diff = (new \DateTimeImmutable())->getTimestamp() - $last->getTimestamp();
            $isOnline = $diff < 120;
        }

        return $this->json([
            'success' => true,
            'online' => $isOnline,
            'status' => $status,
            'config' => $config,
            'recent_trades' => $trades,
        ]);
    }
}
