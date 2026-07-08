<?php

namespace App\Service;

use App\Entity\Trade;
use App\Entity\TradingAccount;
use App\Entity\User;
use App\Repository\TradeRepository;
use App\Repository\TradingAccountRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;

class CopierBridgeService
{
    private const STATUS_FILE = '%kernel.project_dir%/var/copier_status.json';
    private const CONFIG_FILE = '%kernel.project_dir%/var/copier_config.json';
    private const MT5_STATUS_FILE = '%kernel.project_dir%/var/mt5_status.json';

    private string $statusPath;
    private string $configPath;
    private string $mt5StatusPath;
    private string $copierDbPath;
    private string $riskStatePath;

    public function __construct(
        private EntityManagerInterface $em,
        private TradeRepository $tradeRepository,
        private UserRepository $userRepository,
        private TradingAccountRepository $accountRepository,
        string $projectDir,
    ) {
        $this->statusPath = $projectDir . '/var/copier_status.json';
        $this->configPath = $projectDir . '/var/copier_config.json';
        $this->mt5StatusPath = $projectDir . '/var/mt5_status.json';
        $this->copierDbPath = 'E:/Nueva carpeta/Terminal_Financiera_Pro/signal_copier/trades.db';
        $this->riskStatePath = 'E:/Nueva carpeta/Terminal_Financiera_Pro/signal_copier/risk_state.json';
    }

    public function receiveTrade(array $data, User $user): Trade
    {
        $trade = new Trade();
        $trade->setUser($user);
        $trade->setAsset(strtoupper($data['symbol'] ?? ''));
        $trade->setDirection($data['action'] ?? 'BUY');
        $trade->setEntry($data['price'] !== null ? (string) $data['price'] : null);
        $trade->setSl(isset($data['sl']) && $data['sl'] !== null ? (string) $data['sl'] : null);
        $trade->setTp(isset($data['tp']) && $data['tp'] !== null ? (string) $data['tp'] : null);
        $trade->setResult($data['result'] ?? 'OPEN');
        $trade->setPnl((float) ($data['pnl'] ?? 0));
        $trade->setRatio($data['ratio'] ?? null);
        $trade->setNotes($data['notes'] ?? ("Auto-copied from: " . ($data['channel'] ?? 'unknown')));

        if (isset($data['date'])) {
            $trade->setDate(new \DateTimeImmutable($data['date']));
        }

        if (isset($data['account_id'])) {
            $accId = (int) $data['account_id'];
            if ($accId > 0) {
                $acc = $this->accountRepository->find($accId);
                if ($acc && $acc->getUser() === $user && !$acc->isDeleted()) {
                    $trade->setAccount($acc);
                }
            }
        } else {
            $first = $this->accountRepository->findActiveByUser($user);
            if (!empty($first)) {
                $trade->setAccount($first[0]);
            }
        }

        $this->em->persist($trade);
        $this->em->flush();

        return $trade;
    }

    public function updateTrade(int $tradeId, array $data, User $user): ?Trade
    {
        $trade = $this->tradeRepository->find($tradeId);
        if (!$trade || $trade->getUser() !== $user) {
            return null;
        }

        if (isset($data['result'])) {
            $trade->setResult($data['result']);
        }
        if (isset($data['pnl'])) {
            $trade->setPnl((float) $data['pnl']);
        }
        if (isset($data['sl'])) {
            $trade->setSl((string) $data['sl']);
        }
        if (isset($data['tp'])) {
            $trade->setTp((string) $data['tp']);
        }
        if (isset($data['notes'])) {
            $trade->setNotes($data['notes']);
        }

        $this->em->flush();

        return $trade;
    }

    public function getCopierStatus(): array
    {
        if (!file_exists($this->statusPath)) {
            return [
                'running' => false,
                'mt5_connected' => false,
                'daily_pnl' => 0,
                'weekly_pnl' => 0,
                'trades_today' => 0,
                'total_trades' => 0,
                'channels' => [],
                'last_heartbeat' => null,
            ];
        }

        $fp = fopen($this->statusPath, 'r');
        $content = '';
        if ($fp && flock($fp, LOCK_SH)) {
            $content = stream_get_contents($fp);
            flock($fp, LOCK_UN);
        }
        if ($fp) fclose($fp);

        return json_decode($content, true) ?? [];
    }

    public function setCopierStatus(array $status): void
    {
        $status['last_heartbeat'] = (new \DateTimeImmutable())->format('c');
        $dir = dirname($this->statusPath);
        if (!is_dir($dir)) {
            mkdir($dir, 0777, true);
        }

        $existing = $this->getCopierStatus();
        $merged = array_merge($existing, $status);

        $fp = fopen($this->statusPath, 'c');
        if ($fp && flock($fp, LOCK_EX)) {
            ftruncate($fp, 0);
            fwrite($fp, json_encode($merged, JSON_PRETTY_PRINT));
            fflush($fp);
            flock($fp, LOCK_UN);
        }
        if ($fp) fclose($fp);
    }

    public function getCopierConfig(): array
    {
        if (!file_exists($this->configPath)) {
            return $this->getDefaultConfig();
        }

        $raw = file_get_contents($this->configPath);
        return json_decode($raw, true) ?? $this->getDefaultConfig();
    }

    public function setCopierConfig(array $config): void
    {
        $dir = dirname($this->configPath);
        if (!is_dir($dir)) {
            mkdir($dir, 0777, true);
        }
        file_put_contents($this->configPath, json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        $triggerPath = dirname($this->configPath) . '/../config/reload.trigger';
        file_put_contents($triggerPath, (string) time());
    }

    public function getRecentTrades(int $limit = 50): array
    {
        try {
            $conn = $this->em->getConnection();
            $stmt = $conn->prepare('SELECT * FROM trades WHERE notes LIKE ? ORDER BY id DESC LIMIT ?');
            $stmt->executeQuery(['%Auto-copied%', $limit]);
            return $stmt->fetchAllAssociative();
        } catch (\Exception $e) {
            return [];
        }
    }

    public function getCopierTradesFromSQLite(int $limit = 50, int $offset = 0): array
    {
        if (!file_exists($this->copierDbPath)) {
            return [];
        }
        try {
            $pdo = new \PDO('sqlite:' . $this->copierDbPath);
            $pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
            $stmt = $pdo->prepare('SELECT id, date, symbol, action, price, sl, tp, result, ticket, channel, pnl FROM trades ORDER BY id DESC LIMIT :limit OFFSET :offset');
            $stmt->bindValue(':limit', $limit, \PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, \PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\Exception $e) {
            return [];
        }
    }

    public function getCopierStats(): array
    {
        $defaults = [
            'total' => 0,
            'executed' => 0,
            'blocked' => 0,
            'wins' => 0,
            'losses' => 0,
            'win_rate' => 0,
            'total_pnl' => 0,
        ];

        if (!file_exists($this->copierDbPath)) {
            return $defaults;
        }

        try {
            $pdo = new \PDO('sqlite:' . $this->copierDbPath);
            $pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);

            $total = (int) $pdo->query('SELECT COUNT(*) FROM trades')->fetchColumn();

            $blocked = (int) $pdo->query("SELECT COUNT(*) FROM trades WHERE result LIKE '%BLOQUEADO%' OR result LIKE '%SEÑAL DETECTADA%'")->fetchColumn();

            $wins = (int) $pdo->query("SELECT COUNT(*) FROM trades WHERE result = 'OK' OR result LIKE '%exito%' OR result LIKE '%DONE%'")->fetchColumn();

            $totalPnl = (float) $pdo->query("SELECT COALESCE(SUM(pnl), 0) FROM trades WHERE result NOT LIKE '%BLOQUEADO%' AND result NOT LIKE '%SEÑAL DETECTADA%'")->fetchColumn();

            $executed = $total - $blocked;
            $losses = max(0, $executed - $wins);
            $winRate = $executed > 0 ? round(($wins / $executed) * 100, 1) : 0;

            return [
                'total' => $total,
                'executed' => $executed,
                'blocked' => $blocked,
                'wins' => $wins,
                'losses' => $losses,
                'win_rate' => $winRate,
                'total_pnl' => round($totalPnl, 2),
            ];
        } catch (\Exception $e) {
            return $defaults;
        }
    }

    public function getRiskState(): array
    {
        $defaults = [
            'daily_pnl' => 0,
            'weekly_pnl' => 0,
            'trades_today' => 0,
            'total_trades' => 0,
            'winning_trades' => 0,
            'last_reset_date' => date('Y-m-d'),
            'last_week_reset' => '',
        ];

        if (!file_exists($this->riskStatePath)) {
            return $defaults;
        }

        $raw = file_get_contents($this->riskStatePath);
        $state = json_decode($raw, true);
        return is_array($state) ? array_merge($defaults, $state) : $defaults;
    }

    public function resetRiskDaily(): bool
    {
        if (!file_exists($this->riskStatePath)) {
            return false;
        }

        try {
            $raw = file_get_contents($this->riskStatePath);
            $state = json_decode($raw, true);
            if (!is_array($state)) {
                return false;
            }

            $state['daily_pnl'] = 0;
            $state['trades_today'] = 0;
            $state['last_reset_date'] = date('Y-m-d');

            return file_put_contents($this->riskStatePath, json_encode($state, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) !== false;
        } catch (\Exception $e) {
            return false;
        }
    }

    public function resetRiskAll(): bool
    {
        if (!file_exists($this->riskStatePath)) {
            return false;
        }

        try {
            $empty = [
                'daily_pnl' => 0,
                'weekly_pnl' => 0,
                'trades_today' => 0,
                'last_reset_date' => date('Y-m-d'),
                'last_week_reset' => '',
                'total_trades' => 0,
                'winning_trades' => 0,
            ];

            return file_put_contents($this->riskStatePath, json_encode($empty, JSON_PRETTY_PRINT)) !== false;
        } catch (\Exception $e) {
            return false;
        }
    }

    public function getMt5Status(): array
    {
        $defaults = [
            'connected' => false,
            'login' => 0,
            'server' => '',
            'balance' => 0,
            'equity' => 0,
            'margin' => 0,
            'free_margin' => 0,
            'profit' => 0,
            'leverage' => 0,
            'currency' => 'USD',
            'open_positions' => 0,
            'positions' => [],
        ];

        if (!file_exists($this->mt5StatusPath)) {
            return $defaults;
        }

        $raw = file_get_contents($this->mt5StatusPath);
        $status = json_decode($raw, true);
        return is_array($status) ? array_merge($defaults, $status) : $defaults;
    }

    public function saveCopierConfigWithReload(array $config): bool
    {
        try {
            $dir = dirname($this->configPath);
            if (!is_dir($dir)) {
                mkdir($dir, 0777, true);
            }
            file_put_contents($this->configPath, json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

            $triggerPath = dirname($this->configPath) . '/../config/reload.trigger';
            $triggerDir = dirname($triggerPath);
            if (!is_dir($triggerDir)) {
                mkdir($triggerDir, 0777, true);
            }
            file_put_contents($triggerPath, (string) time());

            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    private function getDefaultConfig(): array
    {
        return [
            'channels' => [],
            'lot_size' => 0.01,
            'deviation' => 20,
            'risk_daily_loss_limit' => 2.0,
            'risk_daily_profit_target' => 5.0,
            'risk_weekly_loss_limit' => 5.0,
            'risk_max_open_positions' => 5,
            'risk_trailing_stop' => true,
            'risk_trailing_step' => 10,
            'risk_trailing_start' => 50,
            'news_filter_enabled' => true,
            'news_filter_minutes_before' => 15,
            'news_filter_minutes_after' => 15,
        ];
    }
}
