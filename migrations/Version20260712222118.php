<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260712222118 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE tournament_trades (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, symbol VARCHAR(16) NOT NULL, direction VARCHAR(8) NOT NULL, timeframe VARCHAR(4) NOT NULL, entry_price NUMERIC(14, 4) NOT NULL, exit_price NUMERIC(14, 4) DEFAULT NULL, pnl_usd NUMERIC(14, 4) DEFAULT NULL, pnl_pct NUMERIC(10, 6) DEFAULT NULL, size_pct NUMERIC(6, 2) NOT NULL, leverage NUMERIC(6, 2) NOT NULL, status VARCHAR(16) NOT NULL, price_source VARCHAR(16) NOT NULL, created_at DATETIME NOT NULL, resolved_at DATETIME DEFAULT NULL, notes CLOB DEFAULT NULL, entry_id INTEGER NOT NULL, user_id INTEGER NOT NULL, tournament_id INTEGER NOT NULL, CONSTRAINT FK_DB0BEF75BA364942 FOREIGN KEY (entry_id) REFERENCES tournament_entries (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_DB0BEF75A76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_DB0BEF7533D1A3E7 FOREIGN KEY (tournament_id) REFERENCES tournaments (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE INDEX idx_tr_entry ON tournament_trades (entry_id)');
        $this->addSql('CREATE INDEX idx_tr_user ON tournament_trades (user_id)');
        $this->addSql('CREATE INDEX idx_tr_tournament ON tournament_trades (tournament_id)');
        $this->addSql('CREATE INDEX idx_tr_created ON tournament_trades (created_at)');
        $this->addSql('CREATE INDEX idx_tr_status ON tournament_trades (status)');
        $this->addSql('DROP TABLE trades');
        $this->addSql('CREATE TEMPORARY TABLE __temp__trading_accounts AS SELECT id, user_id, name, account_size, color, icon, is_active, deleted_at, sort_order, created_at FROM trading_accounts');
        $this->addSql('DROP TABLE trading_accounts');
        $this->addSql('CREATE TABLE trading_accounts (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, user_id INTEGER NOT NULL, name VARCHAR(50) NOT NULL, account_size NUMERIC(12, 2) DEFAULT 10000 NOT NULL, color VARCHAR(20) DEFAULT \'#d4af37\' NOT NULL, icon VARCHAR(20) DEFAULT \'💰\' NOT NULL, is_active BOOLEAN DEFAULT 1 NOT NULL, deleted_at DATETIME DEFAULT NULL, sort_order INTEGER DEFAULT 0 NOT NULL, created_at DATETIME NOT NULL, CONSTRAINT FK_TA_USER FOREIGN KEY (user_id) REFERENCES users (id) ON UPDATE NO ACTION ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO trading_accounts (id, user_id, name, account_size, color, icon, is_active, deleted_at, sort_order, created_at) SELECT id, user_id, name, account_size, color, icon, is_active, deleted_at, sort_order, created_at FROM __temp__trading_accounts');
        $this->addSql('DROP TABLE __temp__trading_accounts');
        $this->addSql('CREATE INDEX IDX_10CD3AADA76ED395 ON trading_accounts (user_id)');
        $this->addSql('CREATE INDEX idx_ta_user_active ON trading_accounts (user_id, is_active, deleted_at)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE trades (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, date DATETIME NOT NULL, asset VARCHAR(20) NOT NULL COLLATE "BINARY", direction VARCHAR(10) NOT NULL COLLATE "BINARY", entry VARCHAR(50) DEFAULT NULL COLLATE "BINARY", sl VARCHAR(50) DEFAULT NULL COLLATE "BINARY", tp VARCHAR(50) DEFAULT NULL COLLATE "BINARY", result VARCHAR(20) NOT NULL COLLATE "BINARY", pnl NUMERIC(12, 2) DEFAULT \'0\' NOT NULL, ratio VARCHAR(20) DEFAULT NULL COLLATE "BINARY", notes CLOB DEFAULT NULL COLLATE "BINARY", photos CLOB DEFAULT NULL COLLATE "BINARY", user_id INTEGER NOT NULL, account_id INTEGER DEFAULT NULL, tags CLOB DEFAULT NULL COLLATE "BINARY", CONSTRAINT FK_BFA11125A76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_BFA111259B6B5FBA FOREIGN KEY (account_id) REFERENCES trading_accounts (id) ON UPDATE NO ACTION ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE INDEX IDX_BFA111259B6B5FBA ON trades (account_id)');
        $this->addSql('CREATE INDEX IDX_BFA11125A76ED395 ON trades (user_id)');
        $this->addSql('DROP TABLE tournament_trades');
        $this->addSql('CREATE TEMPORARY TABLE __temp__trading_accounts AS SELECT id, name, account_size, color, icon, is_active, deleted_at, sort_order, created_at, user_id FROM trading_accounts');
        $this->addSql('DROP TABLE trading_accounts');
        $this->addSql('CREATE TABLE trading_accounts (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, name VARCHAR(50) NOT NULL, account_size NUMERIC(12, 2) DEFAULT \'10000\' NOT NULL, color VARCHAR(20) DEFAULT \'#d4af37\' NOT NULL, icon VARCHAR(20) DEFAULT \'💰\' NOT NULL, is_active BOOLEAN DEFAULT 1 NOT NULL, deleted_at DATETIME DEFAULT NULL, sort_order INTEGER DEFAULT 0 NOT NULL, created_at DATETIME NOT NULL, user_id INTEGER NOT NULL, CONSTRAINT FK_10CD3AADA76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO trading_accounts (id, name, account_size, color, icon, is_active, deleted_at, sort_order, created_at, user_id) SELECT id, name, account_size, color, icon, is_active, deleted_at, sort_order, created_at, user_id FROM __temp__trading_accounts');
        $this->addSql('DROP TABLE __temp__trading_accounts');
        $this->addSql('CREATE INDEX IDX_10CD3AADA76ED395 ON trading_accounts (user_id)');
        $this->addSql('CREATE INDEX idx_ta_user_active ON trading_accounts (user_id, is_active, deleted_at)');
    }
}
