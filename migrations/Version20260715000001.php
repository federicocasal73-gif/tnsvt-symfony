<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260715000001 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Week 2 Día 2: Shop catalog tables (shop_items, shop_purchases)';
    }

    public function up(Schema $schema): void
    {
        // Catalog: static definitions of items
        $this->addSql('CREATE TABLE shop_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_id TEXT NOT NULL UNIQUE,
            category TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            coin_cost INTEGER NOT NULL DEFAULT 0,
            xp_cost INTEGER DEFAULT 0,
            rarity TEXT NOT NULL DEFAULT "common",
            image_url TEXT,
            metadata TEXT,
            sort_order INTEGER DEFAULT 0,
            active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )');

        // Purchases: log every buy
        $this->addSql('CREATE TABLE shop_purchases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            item_id TEXT NOT NULL,
            coins_spent INTEGER DEFAULT 0,
            xp_spent INTEGER DEFAULT 0,
            purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE IF EXISTS shop_purchases');
        $this->addSql('DROP TABLE IF EXISTS shop_items');
    }
}
