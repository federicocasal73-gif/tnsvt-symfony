<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260712214225 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE admin_audit_log (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, admin_code VARCHAR(32) NOT NULL, "action" VARCHAR(64) NOT NULL, result VARCHAR(16) NOT NULL, ip VARCHAR(64) NOT NULL, user_agent VARCHAR(255) NOT NULL, payload CLOB DEFAULT NULL, notes CLOB DEFAULT NULL, created_at DATETIME NOT NULL)');
        $this->addSql('CREATE INDEX idx_audit_admin ON admin_audit_log (admin_code)');
        $this->addSql('CREATE INDEX idx_audit_action ON admin_audit_log ("action")');
        $this->addSql('CREATE INDEX idx_audit_ip ON admin_audit_log (ip)');
        $this->addSql('CREATE INDEX idx_audit_created ON admin_audit_log (created_at)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__trades AS SELECT id, date, asset, direction, entry, sl, tp, result, pnl, ratio, notes, photos, user_id, account_id, tags FROM trades');
        $this->addSql('DROP TABLE trades');
        $this->addSql('CREATE TABLE trades (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, date DATETIME NOT NULL, asset VARCHAR(20) NOT NULL, direction VARCHAR(10) NOT NULL, entry VARCHAR(50) DEFAULT NULL, sl VARCHAR(50) DEFAULT NULL, tp VARCHAR(50) DEFAULT NULL, result VARCHAR(20) NOT NULL, pnl NUMERIC(12, 2) DEFAULT 0 NOT NULL, ratio VARCHAR(20) DEFAULT NULL, notes CLOB DEFAULT NULL, photos CLOB DEFAULT NULL, user_id INTEGER NOT NULL, account_id INTEGER DEFAULT NULL, tags CLOB DEFAULT NULL, CONSTRAINT FK_BFA11125A76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_BFA111259B6B5FBA FOREIGN KEY (account_id) REFERENCES trading_accounts (id) ON UPDATE NO ACTION ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO trades (id, date, asset, direction, entry, sl, tp, result, pnl, ratio, notes, photos, user_id, account_id, tags) SELECT id, date, asset, direction, entry, sl, tp, result, pnl, ratio, notes, photos, user_id, account_id, tags FROM __temp__trades');
        $this->addSql('DROP TABLE __temp__trades');
        $this->addSql('CREATE INDEX IDX_BFA11125A76ED395 ON trades (user_id)');
        $this->addSql('CREATE INDEX IDX_BFA111259B6B5FBA ON trades (account_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__trading_accounts AS SELECT id, user_id, name, account_size, color, icon, is_active, deleted_at, sort_order, created_at FROM trading_accounts');
        $this->addSql('DROP TABLE trading_accounts');
        $this->addSql('CREATE TABLE trading_accounts (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, user_id INTEGER NOT NULL, name VARCHAR(50) NOT NULL, account_size NUMERIC(12, 2) DEFAULT 10000 NOT NULL, color VARCHAR(20) DEFAULT \'#d4af37\' NOT NULL, icon VARCHAR(20) DEFAULT \'💰\' NOT NULL, is_active BOOLEAN DEFAULT 1 NOT NULL, deleted_at DATETIME DEFAULT NULL, sort_order INTEGER DEFAULT 0 NOT NULL, created_at DATETIME NOT NULL, CONSTRAINT FK_TA_USER FOREIGN KEY (user_id) REFERENCES users (id) ON UPDATE NO ACTION ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO trading_accounts (id, user_id, name, account_size, color, icon, is_active, deleted_at, sort_order, created_at) SELECT id, user_id, name, account_size, color, icon, is_active, deleted_at, sort_order, created_at FROM __temp__trading_accounts');
        $this->addSql('DROP TABLE __temp__trading_accounts');
        $this->addSql('CREATE INDEX idx_ta_user_active ON trading_accounts (user_id, is_active, deleted_at)');
        $this->addSql('CREATE INDEX IDX_10CD3AADA76ED395 ON trading_accounts (user_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP TABLE admin_audit_log');
        $this->addSql('CREATE TEMPORARY TABLE __temp__trades AS SELECT id, date, asset, direction, entry, sl, tp, result, pnl, ratio, notes, photos, tags, user_id, account_id FROM trades');
        $this->addSql('DROP TABLE trades');
        $this->addSql('CREATE TABLE trades (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, date DATETIME NOT NULL, asset VARCHAR(20) NOT NULL, direction VARCHAR(10) NOT NULL, entry VARCHAR(50) DEFAULT NULL, sl VARCHAR(50) DEFAULT NULL, tp VARCHAR(50) DEFAULT NULL, result VARCHAR(20) NOT NULL, pnl NUMERIC(12, 2) DEFAULT \'0\' NOT NULL, ratio VARCHAR(20) DEFAULT NULL, notes CLOB DEFAULT NULL, photos CLOB DEFAULT NULL, tags CLOB DEFAULT NULL, user_id INTEGER NOT NULL, account_id INTEGER DEFAULT NULL, CONSTRAINT FK_BFA11125A76ED395 FOREIGN KEY (user_id) REFERENCES users (id) NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_BFA111259B6B5FBA FOREIGN KEY (account_id) REFERENCES trading_accounts (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO trades (id, date, asset, direction, entry, sl, tp, result, pnl, ratio, notes, photos, tags, user_id, account_id) SELECT id, date, asset, direction, entry, sl, tp, result, pnl, ratio, notes, photos, tags, user_id, account_id FROM __temp__trades');
        $this->addSql('DROP TABLE __temp__trades');
        $this->addSql('CREATE INDEX IDX_BFA11125A76ED395 ON trades (user_id)');
        $this->addSql('CREATE INDEX IDX_BFA111259B6B5FBA ON trades (account_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__trading_accounts AS SELECT id, name, account_size, color, icon, is_active, deleted_at, sort_order, created_at, user_id FROM trading_accounts');
        $this->addSql('DROP TABLE trading_accounts');
        $this->addSql('CREATE TABLE trading_accounts (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, name VARCHAR(50) NOT NULL, account_size NUMERIC(12, 2) DEFAULT \'10000\' NOT NULL, color VARCHAR(20) DEFAULT \'#d4af37\' NOT NULL, icon VARCHAR(20) DEFAULT \'💰\' NOT NULL, is_active BOOLEAN DEFAULT 1 NOT NULL, deleted_at DATETIME DEFAULT NULL, sort_order INTEGER DEFAULT 0 NOT NULL, created_at DATETIME NOT NULL, user_id INTEGER NOT NULL, CONSTRAINT FK_10CD3AADA76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO trading_accounts (id, name, account_size, color, icon, is_active, deleted_at, sort_order, created_at, user_id) SELECT id, name, account_size, color, icon, is_active, deleted_at, sort_order, created_at, user_id FROM __temp__trading_accounts');
        $this->addSql('DROP TABLE __temp__trading_accounts');
        $this->addSql('CREATE INDEX IDX_10CD3AADA76ED395 ON trading_accounts (user_id)');
        $this->addSql('CREATE INDEX idx_ta_user_active ON trading_accounts (user_id, is_active, deleted_at)');
    }
}
