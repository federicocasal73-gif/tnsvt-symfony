<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260622002308 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE monitor_event (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, level VARCHAR(16) NOT NULL, message CLOB NOT NULL, stack CLOB DEFAULT NULL, source VARCHAR(64) NOT NULL, user_code VARCHAR(32) NOT NULL, url VARCHAR(255) DEFAULT NULL, created_at DATETIME NOT NULL)');
        $this->addSql('DROP TABLE error_logs');
        $this->addSql('CREATE TEMPORARY TABLE __temp__feed_posts AS SELECT id, content, category, likes, comments, signal, photo, created_at, author_id FROM feed_posts');
        $this->addSql('DROP TABLE feed_posts');
        $this->addSql('CREATE TABLE feed_posts (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, content CLOB NOT NULL, category VARCHAR(50) NOT NULL, likes INTEGER DEFAULT 0 NOT NULL, comments CLOB DEFAULT NULL, signal CLOB DEFAULT NULL, photo CLOB DEFAULT NULL, created_at DATETIME NOT NULL, author_id INTEGER NOT NULL, CONSTRAINT FK_7DD2E946F675F31B FOREIGN KEY (author_id) REFERENCES users (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO feed_posts (id, content, category, likes, comments, signal, photo, created_at, author_id) SELECT id, content, category, likes, comments, signal, photo, created_at, author_id FROM __temp__feed_posts');
        $this->addSql('DROP TABLE __temp__feed_posts');
        $this->addSql('CREATE INDEX IDX_7DD2E946F675F31B ON feed_posts (author_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__notifications AS SELECT id, type, content, is_read, created_at, user_id FROM notifications');
        $this->addSql('DROP TABLE notifications');
        $this->addSql('CREATE TABLE notifications (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, type VARCHAR(50) NOT NULL, content CLOB NOT NULL, is_read BOOLEAN DEFAULT 0 NOT NULL, created_at DATETIME NOT NULL, user_id INTEGER NOT NULL, CONSTRAINT FK_6000B0D3A76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO notifications (id, type, content, is_read, created_at, user_id) SELECT id, type, content, is_read, created_at, user_id FROM __temp__notifications');
        $this->addSql('DROP TABLE __temp__notifications');
        $this->addSql('CREATE INDEX IDX_6000B0D3A76ED395 ON notifications (user_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__tournaments AS SELECT id, name, description, entry_fee, prize_pool, prize_distribution, start_date, end_date, status, max_players, min_players, created_by_id, created_at, finished_at FROM tournaments');
        $this->addSql('DROP TABLE tournaments');
        $this->addSql('CREATE TABLE tournaments (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, name VARCHAR(100) NOT NULL, description CLOB DEFAULT NULL, entry_fee NUMERIC(10, 2) NOT NULL, prize_pool NUMERIC(12, 2) NOT NULL, prize_distribution VARCHAR(20) NOT NULL, start_date DATETIME NOT NULL, end_date DATETIME NOT NULL, status VARCHAR(20) NOT NULL, max_players INTEGER NOT NULL, min_players INTEGER NOT NULL, created_by_id INTEGER NOT NULL, created_at DATETIME NOT NULL, finished_at DATETIME DEFAULT NULL, CONSTRAINT FK_trn_creator FOREIGN KEY (created_by_id) REFERENCES users (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO tournaments (id, name, description, entry_fee, prize_pool, prize_distribution, start_date, end_date, status, max_players, min_players, created_by_id, created_at, finished_at) SELECT id, name, description, entry_fee, prize_pool, prize_distribution, start_date, end_date, status, max_players, min_players, created_by_id, created_at, finished_at FROM __temp__tournaments');
        $this->addSql('DROP TABLE __temp__tournaments');
        $this->addSql('CREATE INDEX idx_trn_active ON tournaments (status, end_date)');
        $this->addSql('CREATE INDEX idx_trn_end_date ON tournaments (end_date)');
        $this->addSql('CREATE INDEX idx_trn_status ON tournaments (status)');
        $this->addSql('CREATE INDEX IDX_E4BCFAC3B03A8386 ON tournaments (created_by_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__trades AS SELECT id, date, asset, direction, entry, sl, tp, result, pnl, ratio, notes, photos, user_id FROM trades');
        $this->addSql('DROP TABLE trades');
        $this->addSql('CREATE TABLE trades (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, date DATETIME NOT NULL, asset VARCHAR(20) NOT NULL, direction VARCHAR(10) NOT NULL, entry VARCHAR(50) DEFAULT NULL, sl VARCHAR(50) DEFAULT NULL, tp VARCHAR(50) DEFAULT NULL, result VARCHAR(20) NOT NULL, pnl NUMERIC(12, 2) DEFAULT 0 NOT NULL, ratio VARCHAR(20) DEFAULT NULL, notes CLOB DEFAULT NULL, photos CLOB DEFAULT NULL, user_id INTEGER NOT NULL, CONSTRAINT FK_BFA11125A76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO trades (id, date, asset, direction, entry, sl, tp, result, pnl, ratio, notes, photos, user_id) SELECT id, date, asset, direction, entry, sl, tp, result, pnl, ratio, notes, photos, user_id FROM __temp__trades');
        $this->addSql('DROP TABLE __temp__trades');
        $this->addSql('CREATE INDEX IDX_BFA11125A76ED395 ON trades (user_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__users AS SELECT id, code, name, active, last_login, roles, password, wallet_balance, email FROM users');
        $this->addSql('DROP TABLE users');
        $this->addSql('CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, code VARCHAR(50) NOT NULL, name VARCHAR(100) NOT NULL, active BOOLEAN DEFAULT 1 NOT NULL, last_login DATETIME DEFAULT NULL, roles CLOB NOT NULL, password VARCHAR(255) DEFAULT NULL, wallet_balance NUMERIC(12, 2) DEFAULT \'0.00\' NOT NULL, email VARCHAR(180) DEFAULT NULL)');
        $this->addSql('INSERT INTO users (id, code, name, active, last_login, roles, password, wallet_balance, email) SELECT id, code, name, active, last_login, roles, password, wallet_balance, email FROM __temp__users');
        $this->addSql('DROP TABLE __temp__users');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_1483A5E977153098 ON users (code)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE error_logs (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, level VARCHAR(20) NOT NULL COLLATE "BINARY", source VARCHAR(100) NOT NULL COLLATE "BINARY", message VARCHAR(200) NOT NULL COLLATE "BINARY", stack CLOB DEFAULT NULL COLLATE "BINARY", url VARCHAR(200) DEFAULT NULL COLLATE "BINARY", user_code VARCHAR(50) DEFAULT NULL COLLATE "BINARY", user_agent VARCHAR(100) DEFAULT NULL COLLATE "BINARY", context CLOB DEFAULT NULL COLLATE "BINARY", created_at DATETIME NOT NULL)');
        $this->addSql('DROP TABLE monitor_event');
        $this->addSql('ALTER TABLE feed_posts ADD COLUMN close_price NUMERIC(18, 8) DEFAULT NULL');
        $this->addSql('ALTER TABLE feed_posts ADD COLUMN result VARCHAR(20) DEFAULT NULL');
        $this->addSql('ALTER TABLE feed_posts ADD COLUMN closed_at DATETIME DEFAULT NULL');
        $this->addSql('CREATE TEMPORARY TABLE __temp__notifications AS SELECT id, type, content, is_read, created_at, user_id FROM notifications');
        $this->addSql('DROP TABLE notifications');
        $this->addSql('CREATE TABLE notifications (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, type VARCHAR(50) NOT NULL, content CLOB NOT NULL, is_read BOOLEAN DEFAULT 0 NOT NULL, created_at DATETIME NOT NULL, user_id INTEGER NOT NULL, CONSTRAINT FK_6000B0D3A76ED395 FOREIGN KEY (user_id) REFERENCES users (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO notifications (id, type, content, is_read, created_at, user_id) SELECT id, type, content, is_read, created_at, user_id FROM __temp__notifications');
        $this->addSql('DROP TABLE __temp__notifications');
        $this->addSql('CREATE INDEX IDX_6000B0D3A76ED395 ON notifications (user_id)');
        $this->addSql('CREATE INDEX idx_notif_user_unread ON notifications (user_id, is_read)');
        $this->addSql('CREATE INDEX idx_notif_user_created ON notifications (user_id, created_at)');
        $this->addSql('ALTER TABLE tournaments ADD COLUMN format VARCHAR(20) DEFAULT NULL');
        $this->addSql('ALTER TABLE tournaments ADD COLUMN tier VARCHAR(20) DEFAULT NULL');
        $this->addSql('CREATE TEMPORARY TABLE __temp__trades AS SELECT id, date, asset, direction, entry, sl, tp, result, pnl, ratio, notes, photos, user_id FROM trades');
        $this->addSql('DROP TABLE trades');
        $this->addSql('CREATE TABLE trades (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, date DATETIME NOT NULL, asset VARCHAR(20) NOT NULL, direction VARCHAR(10) NOT NULL, entry VARCHAR(50) DEFAULT NULL, sl VARCHAR(50) DEFAULT NULL, tp VARCHAR(50) DEFAULT NULL, result VARCHAR(20) NOT NULL, pnl NUMERIC(12, 2) DEFAULT \'0\' NOT NULL, ratio VARCHAR(20) DEFAULT NULL, notes CLOB DEFAULT NULL, photos CLOB DEFAULT NULL, user_id INTEGER NOT NULL, CONSTRAINT FK_BFA11125A76ED395 FOREIGN KEY (user_id) REFERENCES users (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO trades (id, date, asset, direction, entry, sl, tp, result, pnl, ratio, notes, photos, user_id) SELECT id, date, asset, direction, entry, sl, tp, result, pnl, ratio, notes, photos, user_id FROM __temp__trades');
        $this->addSql('DROP TABLE __temp__trades');
        $this->addSql('CREATE INDEX IDX_BFA11125A76ED395 ON trades (user_id)');
        $this->addSql('ALTER TABLE users ADD COLUMN avatar_path VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE users ADD COLUMN avatar_color VARCHAR(7) DEFAULT NULL');
    }
}
