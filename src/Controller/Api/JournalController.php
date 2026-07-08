<?php

namespace App\Controller\Api;

use App\Entity\JournalSetting;
use App\Entity\Trade;
use App\Entity\TradingAccount;
use App\Entity\User;
use App\Repository\ConnectionRepository;
use App\Repository\JournalPermissionRepository;
use App\Repository\JournalSettingRepository;
use App\Repository\TradeRepository;
use App\Repository\TradingAccountRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/journal')]
class JournalController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private TradeRepository $tradeRepository,
        private UserRepository $userRepository,
        private ConnectionRepository $connectionRepo,
        private JournalPermissionRepository $permissionRepo,
        private JournalSettingRepository $settingRepo,
        private TradingAccountRepository $accountRepo,
    ) {}

    private function getCurrentUser(Request $request): ?User
    {
        $user = $this->getUser();
        if ($user instanceof User) return $user;
        $code = trim($request->headers->get('X-Game-Code', ''));
        if (!$code) {
            $data = json_decode($request->getContent(), true);
            $code = trim($data['user_code'] ?? '');
        }
        if (!$code) {
            $code = trim($request->query->get('user_code', ''));
        }
        if (!$code) return null;
        return $this->userRepository->findByCode($code);
    }

    #[Route('', name: 'api_journal_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $targetCode = $request->query->get('user_code');
        if (!$targetCode) {
            return $this->json(['error' => 'Usuario requerido'], 400);
        }
        $target = $this->userRepository->findByCode($targetCode);
        if (!$target) return $this->json(['error' => 'Usuario inválido'], 401);

        $currentUser = $this->getCurrentUser($request);
        if (!$currentUser) return $this->json(['error' => 'Unauthorized'], 401);

        $isOwner = $currentUser === $target;
        $isAdmin = $currentUser->getIsAdmin();

        if (!$isOwner && !$isAdmin) {
            $setting = $this->settingRepo->findByUser($target);
            $visibility = $setting?->getVisibility() ?? JournalSetting::VISIBILITY_PUBLIC;

            if ($visibility === JournalSetting::VISIBILITY_PRIVATE) {
                return $this->json(['error' => 'Este journal es privado'], 403);
            }

            $connected = $this->connectionRepo->areConnected($currentUser, $target);
            if ($visibility === JournalSetting::VISIBILITY_CONNECTIONS && !$connected) {
                return $this->json(['error' => 'Debes estar conectado para ver este journal'], 403);
            }

            if (!$connected) {
                return $this->json(['error' => 'Debes estar conectado para ver este journal'], 403);
            }

            $perm = $this->permissionRepo->findByGrantorAndGrantee($target, $currentUser);
            if (!$perm) {
                return $this->json(['error' => 'Sin permisos configurados'], 403);
            }

            $trades = $this->tradeRepository->findByUser($target);
            $stats = $this->computeStats($trades);

            $data = array_map(fn(Trade $t) => $this->mapTrade($t, $perm, 'connected'), $trades);

            return $this->json([
                'success' => true,
                'scope' => 'connected',
                'trades' => $data,
                'stats' => $stats,
            ]);
        }

        $trades = $this->loadTradesForOwner($target, $request);
        $stats = $this->computeStats($trades);

        $data = array_map(fn(Trade $t) => $this->mapTrade($t, null, 'owner'), $trades);

        return $this->json([
            'success' => true,
            'scope' => 'owner',
            'trades' => $data,
            'stats' => $stats,
            'account_id' => $request->query->get('account_id') ? (int) $request->query->get('account_id') : null,
        ]);
    }

    #[Route('/stats', name: 'api_journal_stats', methods: ['GET'])]
    public function stats(Request $request): JsonResponse
    {
        $currentUser = $this->getCurrentUser($request);
        if (!$currentUser) return $this->json(['error' => 'Unauthorized'], 401);

        $trades = $this->loadTradesForOwner($currentUser, $request);
        $stats = $this->computeStats($trades);
        $stats['account_id'] = $request->query->get('account_id') ? (int) $request->query->get('account_id') : null;

        return $this->json(['success' => true, 'stats' => $stats]);
    }

    #[Route('', name: 'api_journal_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $currentUser = $this->getCurrentUser($request);
        if (!$currentUser) return $this->json(['error' => 'Unauthorized'], 401);

        $data = json_decode($request->getContent(), true);
        $userCode = $data['user_code'] ?? null;

        if (!$userCode) {
            return $this->json(['error' => 'Usuario requerido'], 400);
        }
        if ($userCode !== $currentUser->getCode()) {
            return $this->json(['error' => 'Solo puedes crear trades propios'], 403);
        }

        $trade = new Trade();
        $trade->setUser($currentUser);
        $trade->setAsset(strtoupper($data['asset'] ?? ''));
        $trade->setDirection($data['dir'] ?? 'BUY');
        $trade->setEntry($data['entry'] ?? null);
        $trade->setSl($data['sl'] ?? null);
        $trade->setTp($data['tp'] ?? null);
        $trade->setResult($data['result'] ?? 'WIN');
        $trade->setPnl((float) ($data['pnl'] ?? 0));
        $trade->setRatio($data['ratio'] ?? null);
        $trade->setNotes($data['notes'] ?? null);
        $trade->setPhotos($data['photos'] ?? null);
        $trade->setTags($data['tags'] ?? null);

        if (isset($data['account_id'])) {
            $accId = (int) $data['account_id'];
            if ($accId > 0) {
                $acc = $this->accountRepo->find($accId);
                if ($acc && $acc->getUser() === $currentUser && !$acc->isDeleted()) {
                    $trade->setAccount($acc);
                }
            }
        } elseif ($currentCount = $this->accountRepo->countActiveByUser($currentUser)) {
            $first = $this->accountRepo->findActiveByUser($currentUser);
            if (!empty($first)) {
                $trade->setAccount($first[0]);
            }
        }

        if (isset($data['date'])) {
            $trade->setDate(new \DateTimeImmutable($data['date']));
        }

        $this->em->persist($trade);
        $this->em->flush();

        return $this->json(['success' => true, 'id' => $trade->getId()], 201);
    }

    #[Route('/{id<\d+>}', name: 'api_journal_update', methods: ['PUT', 'PATCH'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $currentUser = $this->getCurrentUser($request);
        if (!$currentUser) return $this->json(['error' => 'Unauthorized'], 401);

        $trade = $this->tradeRepository->find($id);
        if (!$trade) return $this->json(['error' => 'Trade no encontrado'], 404);
        if ($trade->getUser() !== $currentUser) {
            return $this->json(['error' => 'Solo puedes editar trades propios'], 403);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['asset'])) $trade->setAsset(strtoupper($data['asset']));
        if (isset($data['dir'])) $trade->setDirection($data['dir']);
        if (isset($data['entry'])) $trade->setEntry($data['entry']);
        if (isset($data['sl'])) $trade->setSl($data['sl']);
        if (isset($data['tp'])) $trade->setTp($data['tp']);
        if (isset($data['result'])) $trade->setResult($data['result']);
        if (isset($data['pnl'])) $trade->setPnl((float) $data['pnl']);
        if (isset($data['ratio'])) $trade->setRatio($data['ratio']);
        if (isset($data['notes'])) $trade->setNotes($data['notes']);
        if (isset($data['photos'])) $trade->setPhotos($data['photos']);
        if (isset($data['tags'])) $trade->setTags($data['tags']);

        if (isset($data['account_id'])) {
            $accId = (int) $data['account_id'];
            if ($accId > 0) {
                $acc = $this->accountRepo->find($accId);
                if ($acc && $acc->getUser() === $currentUser && !$acc->isDeleted()) {
                    $trade->setAccount($acc);
                } else {
                    return $this->json(['error' => 'Cuenta inválida'], 400);
                }
            } else {
                $trade->setAccount(null);
            }
        }

        $this->em->flush();
        return $this->json(['success' => true]);
    }

    #[Route('/export', name: 'api_journal_export', methods: ['GET'])]
    public function export(Request $request): Response
    {
        $currentUser = $this->getCurrentUser($request);
        if (!$currentUser) return new Response('Unauthorized', 401);

        $targetCode = $request->query->get('user_code');
        if (!$targetCode) return new Response('Usuario requerido', 400);

        $target = $this->userRepository->findByCode($targetCode);
        if (!$target) return new Response('Usuario inválido', 401);

        $isOwner = $currentUser === $target;

        if (!$isOwner) {
            $connected = $this->connectionRepo->areConnected($currentUser, $target);
            if (!$connected) return new Response('No tienes permiso para exportar', 403);

            $perm = $this->permissionRepo->findByGrantorAndGrantee($target, $currentUser);
            if (!$perm || !$perm->canDownloadCsv()) {
                return new Response('No tienes permiso para descargar CSV', 403);
            }
        }

        $format = $request->query->get('format', 'csv');
        $trades = $this->loadTradesForOwner($target, $request);

        if ($format === 'html') {
            $html = $this->renderView('export/journal.html.twig', [
                'user' => $target,
                'trades' => $trades,
                'generated' => new \DateTimeImmutable(),
            ]);
            return new Response($html, 200, [
                'Content-Type' => 'text/html; charset=utf-8',
                'Content-Disposition' => 'inline; filename="journal-' . $target->getCode() . '.html"',
            ]);
        }

        $handle = fopen('php://memory', 'r+');
        fputcsv($handle, ['Date', 'Account', 'Asset', 'Direction', 'Entry', 'SL', 'TP', 'Result', 'PNL', 'Ratio', 'Notes']);
        foreach ($trades as $t) {
            fputcsv($handle, [
                $t->getDate()?->format('Y-m-d H:i'),
                $t->getAccount()?->getName() ?? '',
                $t->getAsset(),
                $t->getDirection(),
                $t->getEntry(),
                $t->getSl(),
                $t->getTp(),
                $t->getResult(),
                $t->getPnl(),
                $t->getRatio(),
                $t->getNotes(),
            ]);
        }
        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);

        return new Response($csv, 200, [
            'Content-Type' => 'text/csv; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="journal-' . $target->getCode() . '.csv"',
        ]);
    }

    #[Route('/{id<\d+>}', name: 'api_journal_delete', methods: ['DELETE'])]
    public function delete(int $id, Request $request): JsonResponse
    {
        $currentUser = $this->getCurrentUser($request);
        if (!$currentUser) return $this->json(['error' => 'Unauthorized'], 401);

        $trade = $this->tradeRepository->find($id);
        if (!$trade) return $this->json(['error' => 'No encontrado'], 404);
        if ($trade->getUser() !== $currentUser) {
            return $this->json(['error' => 'Solo puedes eliminar trades propios'], 403);
        }

        $this->em->remove($trade);
        $this->em->flush();
        return $this->json(['success' => true]);
    }

    private function loadTradesForOwner(User $owner, Request $request): array
    {
        $accountId = $request->query->get('account_id');
        if ($accountId) {
            $acc = $this->accountRepo->find((int) $accountId);
            if ($acc && $acc->getUser() === $owner) {
                return $this->tradeRepository->findByUserAndAccount($owner, $acc);
            }
        }
        return $this->tradeRepository->findByUser($owner);
    }

    private function mapTrade(Trade $t, $perm, string $scope): array
    {
        $account = null;
        $accountId = null;
        $accountName = null;
        try {
            if (method_exists($t, 'getAccount')) {
                $account = $t->getAccount();
                if ($account) {
                    $accountId = $account->getId();
                    $accountName = $account->getName();
                }
            }
        } catch (\Throwable $e) {
            // TradingAccount referenciada no existe (account_id huérfano).
            // Retornamos null sin romper la request.
            $account = null;
        }
        $entry = [
            'id' => $t->getId(),
            'asset' => $t->getAsset(),
            'dir' => $t->getDirection(),
            'result' => $t->getResult(),
            'pnl' => (float) $t->getPnl(),
            'date' => $t->getDate()?->format('c'),
            'account_id' => $accountId,
            'account_name' => $accountName,
        ];

        if ($scope === 'owner') {
            $entry['date'] = $t->getDate()?->format('c');
            $entry['entry'] = $t->getEntry();
            $entry['sl'] = $t->getSl();
            $entry['tp'] = $t->getTp();
            $entry['ratio'] = $t->getRatio();
            $entry['notes'] = $t->getNotes();
            $entry['photos'] = $t->getPhotos() ?? [];
            $entry['tags'] = $t->getTags() ?? [];
        } elseif ($scope === 'connected' && $perm) {
            if ($perm->canViewTrades()) {
                $entry['entry'] = $t->getEntry();
                if ($perm->canViewStats()) {
                    $entry['sl'] = $t->getSl();
                    $entry['tp'] = $t->getTp();
                    $entry['ratio'] = $t->getRatio();
                }
            }
            if ($perm->canViewNotes()) {
                $entry['notes'] = $t->getNotes();
            }
            if ($perm->canViewTrades()) {
                $entry['tags'] = $t->getTags() ?? [];
            }
        }

        return $entry;
    }

    private function computeStats(array $trades): array
    {
        $total = count($trades);
        $wins = 0;
        $losses = 0;
        $totalPnl = 0.0;
        foreach ($trades as $t) {
            $pnl = (float) $t->getPnl();
            $totalPnl += $pnl;
            if ($pnl >= 0) $wins++;
            else $losses++;
        }
        return [
            'total' => $total,
            'wins' => $wins,
            'losses' => $losses,
            'win_rate' => $total > 0 ? round($wins / $total * 100, 1) : 0,
            'total_pnl' => round($totalPnl, 2),
        ];
    }

    #[Route('/drawdown', name: 'api_journal_drawdown', methods: ['GET'])]
    public function drawdown(Request $request): JsonResponse
    {
        $currentUser = $this->getCurrentUser($request);
        if (!$currentUser) return $this->json(['error' => 'Unauthorized'], 401);

        $trades = $this->loadTradesForOwner($currentUser, $request);
        usort($trades, fn(Trade $a, Trade $b) => $a->getDate() <=> $b->getDate());

        $accountSize = (float) ($request->query->get('account_size', 10000));
        $balance = $accountSize;
        $peak = $accountSize;
        $drawdowns = [];
        $maxDrawdown = 0;
        $maxDrawdownPct = 0;

        foreach ($trades as $t) {
            $balance += (float) $t->getPnl();
            if ($balance > $peak) $peak = $balance;
            $dd = $peak - $balance;
            $ddPct = $peak > 0 ? ($dd / $peak) * 100 : 0;
            if ($dd > $maxDrawdown) { $maxDrawdown = $dd; $maxDrawdownPct = $ddPct; }
            $drawdowns[] = [
                'date' => $t->getDate()?->format('c'),
                'balance' => round($balance, 2),
                'peak' => round($peak, 2),
                'drawdown' => round($dd, 2),
                'drawdown_pct' => round($ddPct, 2),
                'asset' => $t->getAsset(),
                'pnl' => (float) $t->getPnl(),
            ];
        }

        return $this->json([
            'success' => true,
            'drawdowns' => $drawdowns,
            'max_drawdown' => round($maxDrawdown, 2),
            'max_drawdown_pct' => round($maxDrawdownPct, 2),
            'account_size' => $accountSize,
        ]);
    }

    #[Route('/tags', name: 'api_journal_tags', methods: ['GET'])]
    public function tags(Request $request): JsonResponse
    {
        $currentUser = $this->getCurrentUser($request);
        if (!$currentUser) return $this->json(['error' => 'Unauthorized'], 401);

        $trades = $this->loadTradesForOwner($currentUser, $request);
        $tagStats = [];
        foreach ($trades as $t) {
            foreach ($t->getTags() ?? [] as $tag) {
                if (!isset($tagStats[$tag])) $tagStats[$tag] = ['count' => 0, 'wins' => 0, 'pnl' => 0.0];
                $tagStats[$tag]['count']++;
                $pnl = (float) $t->getPnl();
                $tagStats[$tag]['pnl'] += $pnl;
                if ($pnl >= 0) $tagStats[$tag]['wins']++;
            }
        }
        foreach ($tagStats as &$stat) {
            $stat['win_rate'] = $stat['count'] > 0 ? round($stat['wins'] / $stat['count'] * 100, 1) : 0;
            $stat['pnl'] = round($stat['pnl'], 2);
        }
        uasort($tagStats, fn($a, $b) => $b['count'] <=> $a['count']);
        return $this->json(['success' => true, 'tags' => $tagStats]);
    }
}
