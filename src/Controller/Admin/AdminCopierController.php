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

    #[Route('/stats', name: 'admin_copier_stats', methods: ['GET'])]
    public function stats(Request $request): JsonResponse
    {
        if ($denied = $this->requireAdmin($this->userRepository, $this->tokenStorage)) return $denied;

        $stats = $this->copierService->getCopierStats();

        return $this->json(['success' => true, 'stats' => $stats]);
    }

    #[Route('/trades-history', name: 'admin_copier_trades_history', methods: ['GET'])]
    public function tradesHistory(Request $request): JsonResponse
    {
        if ($denied = $this->requireAdmin($this->userRepository, $this->tokenStorage)) return $denied;

        $limit = (int) $request->query->get('limit', 50);
        $offset = (int) $request->query->get('offset', 0);
        $trades = $this->copierService->getCopierTradesFromSQLite($limit, $offset);

        return $this->json(['success' => true, 'trades' => $trades]);
    }

    #[Route('/risk-status', name: 'admin_copier_risk_status', methods: ['GET'])]
    public function riskStatus(Request $request): JsonResponse
    {
        if ($denied = $this->requireAdmin($this->userRepository, $this->tokenStorage)) return $denied;

        $state = $this->copierService->getRiskState();
        $config = $this->copierService->getCopierConfig();

        $balance = $config['risk_max_open_positions'] ?? 5;
        $dailyLimitPct = $config['risk_daily_loss_limit'] ?? 2.0;
        $weeklyLimitPct = $config['risk_weekly_loss_limit'] ?? 5.0;

        $status = [
            'daily_pnl' => $state['daily_pnl'] ?? 0,
            'weekly_pnl' => $state['weekly_pnl'] ?? 0,
            'trades_today' => $state['trades_today'] ?? 0,
            'total_trades' => $state['total_trades'] ?? 0,
            'winning_trades' => $state['winning_trades'] ?? 0,
            'win_rate' => ($state['total_trades'] ?? 0) > 0
                ? round(($state['winning_trades'] / $state['total_trades']) * 100, 1)
                : 0,
            'daily_limit_pct' => $dailyLimitPct,
            'weekly_limit_pct' => $weeklyLimitPct,
            'max_positions' => $balance,
            'balance' => 0,
            'daily_loss_remaining' => 0,
        ];

        return $this->json(['success' => true, 'risk' => $status]);
    }

    #[Route('/risk-reset-daily', name: 'admin_copier_risk_reset_daily', methods: ['POST'])]
    public function riskResetDaily(Request $request): JsonResponse
    {
        if ($denied = $this->requireAdmin($this->userRepository, $this->tokenStorage)) return $denied;

        $success = $this->copierService->resetRiskDaily();

        return $this->json(['success' => $success]);
    }

    #[Route('/risk-reset-all', name: 'admin_copier_risk_reset_all', methods: ['POST'])]
    public function riskResetAll(Request $request): JsonResponse
    {
        if ($denied = $this->requireAdmin($this->userRepository, $this->tokenStorage)) return $denied;

        $success = $this->copierService->resetRiskAll();

        return $this->json(['success' => $success]);
    }

    #[Route('/mt5-status', name: 'admin_copier_mt5_status', methods: ['GET'])]
    public function mt5Status(Request $request): JsonResponse
    {
        if ($denied = $this->requireAdmin($this->userRepository, $this->tokenStorage)) return $denied;

        $status = $this->copierService->getMt5Status();

        return $this->json(['success' => true, 'mt5' => $status]);
    }

    #[Route('/save-config', name: 'admin_copier_save_config', methods: ['POST'])]
    public function saveConfig(Request $request): JsonResponse
    {
        if ($denied = $this->requireAdmin($this->userRepository, $this->tokenStorage)) return $denied;

        $data = json_decode($request->getContent(), true);
        if (!$data || !is_array($data)) {
            return $this->json(['error' => 'Data requerida'], 400);
        }

        $current = $this->copierService->getCopierConfig();
        $merged = array_merge($current, $data);
        $success = $this->copierService->saveCopierConfigWithReload($merged);

        return $this->json(['success' => $success, 'config' => $merged]);
    }
}
