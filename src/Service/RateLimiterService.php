<?php

namespace App\Service;

use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;

class RateLimiterService
{
    private const TABLE_NAME = 'rate_limits';

    public function __construct(
        private EntityManagerInterface $em,
        private int $defaultMaxAttempts = 60,
        private int $defaultWindowSeconds = 60,
    ) {}

    public function check(string $key, ?int $maxAttempts = null, ?int $windowSeconds = null): int
    {
        $max = $maxAttempts ?? $this->defaultMaxAttempts;
        $window = $windowSeconds ?? $this->defaultWindowSeconds;

        $conn = $this->em->getConnection();
        $this->ensureTable($conn);

        $conn->executeStatement(
            'DELETE FROM ' . self::TABLE_NAME . ' WHERE key_name = :key AND expires_at < :now',
            ['key' => $key, 'now' => time()]
        );

        $windowStart = time() - $window;
        $count = (int) $conn->fetchOne(
            'SELECT COUNT(*) FROM ' . self::TABLE_NAME . ' WHERE key_name = :key AND created_at >= :window_start',
            ['key' => $key, 'window_start' => $windowStart]
        );

        return $max - $count;
    }

    public function hit(string $key, ?int $windowSeconds = null): void
    {
        $window = $windowSeconds ?? $this->defaultWindowSeconds;
        $conn = $this->em->getConnection();
        $this->ensureTable($conn);

        $conn->executeStatement(
            'INSERT INTO ' . self::TABLE_NAME . ' (key_name, created_at, expires_at) VALUES (:key, :now, :expires)',
            [
                'key' => $key,
                'now' => time(),
                'expires' => time() + $window + 60,
            ]
        );
    }

    public function checkAndHit(string $key, ?int $maxAttempts = null, ?int $windowSeconds = null): int
    {
        $remaining = $this->check($key, $maxAttempts, $windowSeconds);
        $this->hit($key, $windowSeconds);
        return $remaining;
    }

    public function reset(string $key): void
    {
        $conn = $this->em->getConnection();
        $this->ensureTable($conn);
        $conn->executeStatement(
            'DELETE FROM ' . self::TABLE_NAME . ' WHERE key_name = :key',
            ['key' => $key]
        );
    }

    private function ensureTable(Connection $conn): void
    {
        static $exists = false;
        if ($exists) return;

        $driver = $conn->getDatabasePlatform()->getName();
        $isPostgres = $driver === 'postgresql';
        $isSqlite = $driver === 'sqlite';

        if ($isPostgres) {
            $conn->executeStatement('CREATE TABLE IF NOT EXISTS ' . self::TABLE_NAME . ' (
                id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                key_name VARCHAR(128) NOT NULL,
                created_at INTEGER NOT NULL,
                expires_at INTEGER NOT NULL
            )');
        } else {
            $conn->executeStatement('CREATE TABLE IF NOT EXISTS ' . self::TABLE_NAME . ' (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key_name VARCHAR(128) NOT NULL,
                created_at INTEGER NOT NULL,
                expires_at INTEGER NOT NULL
            )');
        }

        $conn->executeStatement('CREATE INDEX IF NOT EXISTS idx_rl_key ON ' . self::TABLE_NAME . ' (key_name)');
        $conn->executeStatement('CREATE INDEX IF NOT EXISTS idx_rl_expires ON ' . self::TABLE_NAME . ' (expires_at)');

        $exists = true;
    }
}
