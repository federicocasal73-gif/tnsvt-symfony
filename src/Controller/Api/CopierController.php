<?php

namespace App\Controller\Api;

use App\Entity\User;
use App\Repository\UserRepository;
use App\Security\AdminAuthTrait;
use App\Service\CopierBridgeService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/copier')]
class CopierController extends AbstractController
{
    use AdminAuthTrait;

    public function __construct(
        private CopierBridgeService $copierService,
        private UserRepository $userRepository,
    ) {}

    private function getCurrentUser(Request $request): ?User
    {
        $user = $this->getUser();
        if ($user instanceof User) return $user;

        $code = trim($request->headers->get('X-Game-Code', ''));
        if (!$code) {
            $data = json_decode($request->getContent(), true);
            $code = trim($data['user_code'] ?? $data['code'] ?? '');
        }
        if (!$code) {
            $code = trim($request->query->get('user_code', ''));
        }
        if (empty($code) || strlen($code) < 2) return null;

        return $this->userRepository->findByCode($code);
    }

    #[Route('/trades', name: 'api_copier_trade_create', methods: ['POST'])]
    public function createTrade(Request $request): JsonResponse
    {
        $user = $this->getCurrentUser($request);
        if (!$user) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }

        $data = json_decode($request->getContent(), true);
        if (!$data || empty($data['symbol'])) {
            return $this->json(['error' => 'symbol requerido'], 400);
        }

        $trade = $this->copierService->receiveTrade($data, $user);

        return $this->json([
            'success' => true,
            'id' => $trade->getId(),
        ], 201);
    }

    #[Route('/trades/{id}', name: 'api_copier_trade_update', methods: ['PUT'])]
    public function updateTrade(int $id, Request $request): JsonResponse
    {
        $user = $this->getCurrentUser($request);
        if (!$user) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }

        $data = json_decode($request->getContent(), true);
        $trade = $this->copierService->updateTrade($id, $data, $user);

        if (!$trade) {
            return $this->json(['error' => 'Trade no encontrado o sin permisos'], 404);
        }

        return $this->json([
            'success' => true,
            'id' => $trade->getId(),
            'result' => $trade->getResult(),
            'pnl' => $trade->getPnl(),
        ]);
    }

    #[Route('/status', name: 'api_copier_status_post', methods: ['POST'])]
    public function setStatus(Request $request): JsonResponse
    {
        $this->requireAdmin($request);

        $data = json_decode($request->getContent(), true);
        if (!$data) {
            return $this->json(['error' => 'Data requerida'], 400);
        }

        $this->copierService->setCopierStatus($data);

        return $this->json(['success' => true]);
    }

    #[Route('/status', name: 'api_copier_status_get', methods: ['GET'])]
    public function getStatus(Request $request): JsonResponse
    {
        $this->requireAdmin($request);

        $status = $this->copierService->getCopierStatus();

        return $this->json(['success' => true, 'status' => $status]);
    }

    #[Route('/config', name: 'api_copier_config_get', methods: ['GET'])]
    public function getConfig(Request $request): JsonResponse
    {
        $this->requireAdmin($request);

        $config = $this->copierService->getCopierConfig();

        return $this->json(['success' => true, 'config' => $config]);
    }

    #[Route('/config', name: 'api_copier_config_put', methods: ['PUT'])]
    public function setConfig(Request $request): JsonResponse
    {
        $this->requireAdmin($request);

        $data = json_decode($request->getContent(), true);
        if (!$data) {
            return $this->json(['error' => 'Data requerida'], 400);
        }

        $current = $this->copierService->getCopierConfig();
        $merged = array_merge($current, $data);
        $this->copierService->setCopierConfig($merged);

        return $this->json(['success' => true, 'config' => $merged]);
    }

    #[Route('/trades/recent', name: 'api_copier_trades_recent', methods: ['GET'])]
    public function getRecentTrades(Request $request): JsonResponse
    {
        $this->requireAdmin($request);

        $limit = (int) $request->query->get('limit', 50);
        $trades = $this->copierService->getRecentTrades($limit);

        return $this->json(['success' => true, 'trades' => $trades]);
    }
}
