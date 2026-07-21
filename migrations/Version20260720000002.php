<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Platforms\AbstractMySQLPlatform;
use Doctrine\DBAL\Platforms\SQLitePlatform;
use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Crea la tabla link_previews para el sistema de Universal Link Preview.
 * - Almacena metadata extraída (OG, Twitter, HTML, JSON-LD) por URL.
 * - Cache key = sha256(normalized_url).
 * - TTL configurable via env LINK_PREVIEW_CACHE_TTL (default 24h).
 * - Idempotente: safe si se ejecuta dos veces.
 *
 * También agrega feed_posts.link_previews (JSON NULL) para embeber previews en posts.
 */
final class Version20260720000002 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Universal Link Preview: link_previews table + feed_posts.link_previews JSON column';
    }

    public function up(Schema $schema): void
    {
        $platform = $this->connection->getDatabasePlatform();

        if ($platform instanceof SQLitePlatform) {
            $this->addSql('CREATE TABLE IF NOT EXISTS link_previews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                url_hash VARCHAR(64) NOT NULL UNIQUE,
                url TEXT NOT NULL,
                title VARCHAR(500) NULL,
                description TEXT NULL,
                image_external TEXT NULL,
                image_local VARCHAR(500) NULL,
                favicon_external TEXT NULL,
                favicon_local VARCHAR(500) NULL,
                site_name VARCHAR(255) NULL,
                domain VARCHAR(255) NOT NULL,
                type VARCHAR(50) NULL,
                mime VARCHAR(120) NULL,
                enriched TEXT NULL,
                raw_metadata TEXT NULL,
                last_update DATETIME NOT NULL,
                expires_at DATETIME NOT NULL,
                error VARCHAR(255) NULL
            )');
            $this->addSql('CREATE INDEX IF NOT EXISTS idx_lp_expires ON link_previews (expires_at)');
            $this->addSql('CREATE INDEX IF NOT EXISTS idx_lp_domain ON link_previews (domain)');
        } elseif ($platform instanceof AbstractMySQLPlatform) {
            $this->addSql('CREATE TABLE IF NOT EXISTS link_previews (
                id INT AUTO_INCREMENT PRIMARY KEY,
                url_hash VARCHAR(64) NOT NULL UNIQUE,
                url TEXT NOT NULL,
                title VARCHAR(500) NULL,
                description TEXT NULL,
                image_external TEXT NULL,
                image_local VARCHAR(500) NULL,
                favicon_external TEXT NULL,
                favicon_local VARCHAR(500) NULL,
                site_name VARCHAR(255) NULL,
                domain VARCHAR(255) NOT NULL,
                type VARCHAR(50) NULL,
                mime VARCHAR(120) NULL,
                enriched JSON NULL,
                raw_metadata JSON NULL,
                last_update DATETIME NOT NULL,
                expires_at DATETIME NOT NULL,
                error VARCHAR(255) NULL,
                INDEX idx_lp_expires (expires_at),
                INDEX idx_lp_domain (domain)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
        } else {
            // PostgreSQL
            $this->addSql('CREATE TABLE IF NOT EXISTS link_previews (
                id SERIAL PRIMARY KEY,
                url_hash VARCHAR(64) NOT NULL UNIQUE,
                url TEXT NOT NULL,
                title VARCHAR(500) NULL,
                description TEXT NULL,
                image_external TEXT NULL,
                image_local VARCHAR(500) NULL,
                favicon_external TEXT NULL,
                favicon_local VARCHAR(500) NULL,
                site_name VARCHAR(255) NULL,
                domain VARCHAR(255) NOT NULL,
                type VARCHAR(50) NULL,
                mime VARCHAR(120) NULL,
                enriched JSON NULL,
                raw_metadata JSON NULL,
                last_update TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
                expires_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
                error VARCHAR(255) NULL
            )');
            $this->addSql('CREATE INDEX IF NOT EXISTS idx_lp_expires ON link_previews (expires_at)');
            $this->addSql('CREATE INDEX IF NOT EXISTS idx_lp_domain ON link_previews (domain)');
        }

        // feed_posts.link_previews column (idempotent via guard query).
        if ($platform instanceof SQLitePlatform) {
            $exists = (int) $this->connection->fetchOne(
                "SELECT COUNT(*) FROM pragma_table_info('feed_posts') WHERE name='link_previews'"
            );
            if ($exists === 0) {
                $this->addSql('ALTER TABLE feed_posts ADD COLUMN link_previews TEXT NULL');
            }
        } elseif ($platform instanceof AbstractMySQLPlatform) {
            $exists = (int) $this->connection->fetchOne(
                "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'feed_posts' AND column_name = 'link_previews'"
            );
            if ($exists === 0) {
                $this->addSql('ALTER TABLE feed_posts ADD COLUMN link_previews JSON NULL');
            }
        } else {
            $exists = (int) $this->connection->fetchOne(
                "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'feed_posts' AND column_name = 'link_previews'"
            );
            if ($exists === 0) {
                $this->addSql('ALTER TABLE feed_posts ADD COLUMN link_previews JSON NULL');
            }
        }
    }

    public function down(Schema $schema): void
    {
        $platform = $this->connection->getDatabasePlatform();

        if ($platform instanceof SQLitePlatform) {
            // SQLite < 3.35 no soporta DROP COLUMN. Skip.
            $this->addSql('DROP TABLE IF EXISTS link_previews');
        } else {
            $this->addSql('ALTER TABLE feed_posts DROP COLUMN IF EXISTS link_previews');
            $this->addSql('DROP TABLE IF EXISTS link_previews');
        }
    }
}