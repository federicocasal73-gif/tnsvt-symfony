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

    private string $statusPath;
    private string $configPath;

    public function __construct(
        private EntityManagerInterface $em,
        private TradeRepository $tradeRepository,
        private UserRepository $userRepository,
        private TradingAccountRepository $accountRepository,
        string $projectDir,
    ) {
        $this->statusPath = $projectDir . '/var/copier_status.json';
        $this->configPath = $projectDir . '/var/copier_config.json';
    }

    public function receiveTrade(array $data, User $user): Trade
    {
        $trade = new Trade();
        $trade->setUser($user);
        $trade->setAsset(strtoupper($data['symbol'] ?? ''));
        $trade->setDirection($data['action'] ?? 'BUY');
        $trade->setEntry($data['price'] !== null ? (string) $data['price'] : null);
        $trade->setSl($data['sl'] !== null ? (string) $data['sl'] : null);
        $trade->setTp($data['tp'] !== null ? (string) $data['tp'] : null);
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
