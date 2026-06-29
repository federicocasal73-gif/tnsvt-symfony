<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260629102705 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE duel_rounds (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, round_number INTEGER NOT NULL, player1_move VARCHAR(10) DEFAULT NULL, player2_move VARCHAR(10) DEFAULT NULL, open_price NUMERIC(14, 4) NOT NULL, close_price NUMERIC(14, 4) NOT NULL, high_price NUMERIC(14, 4) NOT NULL, low_price NUMERIC(14, 4) NOT NULL, player1_pnl NUMERIC(14, 4) NOT NULL, player2_pnl NUMERIC(14, 4) NOT NULL, created_at DATETIME NOT NULL, duel_id INTEGER NOT NULL, CONSTRAINT FK_547A863C58875E FOREIGN KEY (duel_id) REFERENCES duels (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE INDEX idx_dr_duel ON duel_rounds (duel_id)');
        $this->addSql('CREATE TABLE duels (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, code VARCHAR(20) NOT NULL, entry_fee NUMERIC(12, 2) NOT NULL, prize_pool NUMERIC(12, 2) NOT NULL, total_rounds INTEGER NOT NULL, current_round INTEGER NOT NULL, player1_pnl NUMERIC(14, 4) NOT NULL, player2_pnl NUMERIC(14, 4) NOT NULL, starting_price NUMERIC(14, 4) DEFAULT NULL, status VARCHAR(20) NOT NULL, created_at DATETIME NOT NULL, started_at DATETIME DEFAULT NULL, finished_at DATETIME DEFAULT NULL, player1_id INTEGER NOT NULL, player2_id INTEGER DEFAULT NULL, winner_id INTEGER DEFAULT NULL, CONSTRAINT FK_B8297BD8C0990423 FOREIGN KEY (player1_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_B8297BD8D22CABCD FOREIGN KEY (player2_id) REFERENCES users (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_B8297BD85DFCD4B8 FOREIGN KEY (winner_id) REFERENCES users (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_B8297BD877153098 ON duels (code)');
        $this->addSql('CREATE INDEX IDX_B8297BD8C0990423 ON duels (player1_id)');
        $this->addSql('CREATE INDEX IDX_B8297BD8D22CABCD ON duels (player2_id)');
        $this->addSql('CREATE INDEX IDX_B8297BD85DFCD4B8 ON duels (winner_id)');
        $this->addSql('CREATE INDEX idx_duel_code ON duels (code)');
        $this->addSql('CREATE INDEX idx_duel_status ON duels (status)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__access_requests AS SELECT id, status, created_at, updated_at, requester_id, target_id FROM access_requests');
        $this->addSql('DROP TABLE access_requests');
        $this->addSql('CREATE TABLE access_requests (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, status VARCHAR(20) DEFAULT \'pending\' NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, requester_id INTEGER NOT NULL, target_id INTEGER NOT NULL, FOREIGN KEY (requester_id) REFERENCES users (id) ON UPDATE NO ACTION ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE, FOREIGN KEY (target_id) REFERENCES users (id) ON UPDATE NO ACTION ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO access_requests (id, status, created_at, updated_at, requester_id, target_id) SELECT id, status, created_at, updated_at, requester_id, target_id FROM __temp__access_requests');
        $this->addSql('DROP TABLE __temp__access_requests');
        $this->addSql('CREATE UNIQUE INDEX uq_access_request ON access_requests (requester_id, target_id)');
        $this->addSql('CREATE INDEX idx_access_target_status ON access_requests (target_id, status)');
        $this->addSql('CREATE INDEX IDX_16901760ED442CF4 ON access_requests (requester_id)');
        $this->addSql('CREATE INDEX IDX_16901760158E0B66 ON access_requests (target_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__connections AS SELECT id, created_at, user_id, connected_user_id FROM connections');
        $this->addSql('DROP TABLE connections');
        $this->addSql('CREATE TABLE connections (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, created_at DATETIME NOT NULL, user_id INTEGER NOT NULL, connected_user_id INTEGER NOT NULL, FOREIGN KEY (user_id) REFERENCES users (id) ON UPDATE NO ACTION ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE, FOREIGN KEY (connected_user_id) REFERENCES users (id) ON UPDATE NO ACTION ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO connections (id, created_at, user_id, connected_user_id) SELECT id, created_at, user_id, connected_user_id FROM __temp__connections');
        $this->addSql('DROP TABLE __temp__connections');
        $this->addSql('CREATE UNIQUE INDEX uq_connection ON connections (user_id, connected_user_id)');
        $this->addSql('CREATE INDEX idx_connection_user ON connections (user_id)');
        $this->addSql('CREATE INDEX IDX_BFF6FC15349E946C ON connections (connected_user_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__diary_entries AS SELECT id, encrypted_data, iv, created_at, updated_at, user_id FROM diary_entries');
        $this->addSql('DROP TABLE diary_entries');
        $this->addSql('CREATE TABLE diary_entries (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, encrypted_data CLOB NOT NULL, iv VARCHAR(48) NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, user_id INTEGER NOT NULL, FOREIGN KEY (user_id) REFERENCES users (id) ON UPDATE NO ACTION ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO diary_entries (id, encrypted_data, iv, created_at, updated_at, user_id) SELECT id, encrypted_data, iv, created_at, updated_at, user_id FROM __temp__diary_entries');
        $this->addSql('DROP TABLE __temp__diary_entries');
        $this->addSql('CREATE INDEX IDX_77B144D1A76ED395 ON diary_entries (user_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__economic_reminders AS SELECT id, status, event_date, event_time, timezone, event_title, event_title_original, event_country_code, event_currency, event_importance, remind_at, fired_at, created_at, user_id FROM economic_reminders');
        $this->addSql('DROP TABLE economic_reminders');
        $this->addSql('CREATE TABLE economic_reminders (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, status VARCHAR(20) NOT NULL, event_date VARCHAR(10) NOT NULL, event_time VARCHAR(5) NOT NULL, timezone VARCHAR(10) NOT NULL, event_title VARCHAR(200) NOT NULL, event_title_original VARCHAR(100) NOT NULL, event_country_code VARCHAR(10) NOT NULL, event_currency VARCHAR(10) NOT NULL, event_importance INTEGER DEFAULT 3 NOT NULL, remind_at DATETIME NOT NULL, fired_at DATETIME DEFAULT NULL, created_at DATETIME NOT NULL, user_id INTEGER NOT NULL, CONSTRAINT FK_9C4F1A7DA76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON UPDATE NO ACTION ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO economic_reminders (id, status, event_date, event_time, timezone, event_title, event_title_original, event_country_code, event_currency, event_importance, remind_at, fired_at, created_at, user_id) SELECT id, status, event_date, event_time, timezone, event_title, event_title_original, event_country_code, event_currency, event_importance, remind_at, fired_at, created_at, user_id FROM __temp__economic_reminders');
        $this->addSql('DROP TABLE __temp__economic_reminders');
        $this->addSql('CREATE INDEX idx_er_remind_at ON economic_reminders (remind_at)');
        $this->addSql('CREATE INDEX idx_er_status ON economic_reminders (status)');
        $this->addSql('CREATE INDEX IDX_706C8ABBA76ED395 ON economic_reminders (user_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__journal_settings AS SELECT id, visibility, user_id FROM journal_settings');
        $this->addSql('DROP TABLE journal_settings');
        $this->addSql('CREATE TABLE journal_settings (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, visibility VARCHAR(20) DEFAULT \'public\' NOT NULL, user_id INTEGER NOT NULL, FOREIGN KEY (user_id) REFERENCES users (id) ON UPDATE NO ACTION ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO journal_settings (id, visibility, user_id) SELECT id, visibility, user_id FROM __temp__journal_settings');
        $this->addSql('DROP TABLE __temp__journal_settings');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_35F50D7CA76ED395 ON journal_settings (user_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__trades AS SELECT id, date, asset, direction, entry, sl, tp, result, pnl, ratio, notes, photos, user_id, account_id FROM trades');
        $this->addSql('DROP TABLE trades');
        $this->addSql('CREATE TABLE trades (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, date DATETIME NOT NULL, asset VARCHAR(20) NOT NULL, direction VARCHAR(10) NOT NULL, entry VARCHAR(50) DEFAULT NULL, sl VARCHAR(50) DEFAULT NULL, tp VARCHAR(50) DEFAULT NULL, result VARCHAR(20) NOT NULL, pnl NUMERIC(12, 2) DEFAULT 0 NOT NULL, ratio VARCHAR(20) DEFAULT NULL, notes CLOB DEFAULT NULL, photos CLOB DEFAULT NULL, user_id INTEGER NOT NULL, account_id INTEGER DEFAULT NULL, CONSTRAINT FK_BFA11125A76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_BFA111259B6B5FBA FOREIGN KEY (account_id) REFERENCES trading_accounts (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO trades (id, date, asset, direction, entry, sl, tp, result, pnl, ratio, notes, photos, user_id, account_id) SELECT id, date, asset, direction, entry, sl, tp, result, pnl, ratio, notes, photos, user_id, account_id FROM __temp__trades');
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
        $this->addSql('ALTER TABLE users ADD COLUMN last_activity_at DATETIME DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP TABLE duel_rounds');
        $this->addSql('DROP TABLE duels');
        $this->addSql('CREATE TEMPORARY TABLE __temp__access_requests AS SELECT id, status, created_at, updated_at, requester_id, target_id FROM access_requests');
        $this->addSql('DROP TABLE access_requests');
        $this->addSql('CREATE TABLE access_requests (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, status VARCHAR(20) DEFAULT \'"pending"\' NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, requester_id INTEGER NOT NULL, target_id INTEGER NOT NULL, CONSTRAINT FK_16901760ED442CF4 FOREIGN KEY (requester_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_16901760158E0B66 FOREIGN KEY (target_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO access_requests (id, status, created_at, updated_at, requester_id, target_id) SELECT id, status, created_at, updated_at, requester_id, target_id FROM __temp__access_requests');
        $this->addSql('DROP TABLE __temp__access_requests');
        $this->addSql('CREATE INDEX IDX_16901760ED442CF4 ON access_requests (requester_id)');
        $this->addSql('CREATE INDEX IDX_16901760158E0B66 ON access_requests (target_id)');
        $this->addSql('CREATE INDEX idx_access_target_status ON access_requests (target_id, status)');
        $this->addSql('CREATE UNIQUE INDEX uq_access_request ON access_requests (requester_id, target_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__connections AS SELECT id, created_at, user_id, connected_user_id FROM connections');
        $this->addSql('DROP TABLE connections');
        $this->addSql('CREATE TABLE connections (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, created_at DATETIME NOT NULL, user_id INTEGER NOT NULL, connected_user_id INTEGER NOT NULL, CONSTRAINT FK_BFF6FC15A76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_BFF6FC15349E946C FOREIGN KEY (connected_user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO connections (id, created_at, user_id, connected_user_id) SELECT id, created_at, user_id, connected_user_id FROM __temp__connections');
        $this->addSql('DROP TABLE __temp__connections');
        $this->addSql('CREATE INDEX idx_connection_user ON connections (user_id)');
        $this->addSql('CREATE UNIQUE INDEX uq_connection ON connections (user_id, connected_user_id)');
        $this->addSql('CREATE INDEX idx_connection_connected ON connections (connected_user_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__diary_entries AS SELECT id, encrypted_data, iv, created_at, updated_at, user_id FROM diary_entries');
        $this->addSql('DROP TABLE diary_entries');
        $this->addSql('CREATE TABLE diary_entries (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, encrypted_data CLOB NOT NULL, iv VARCHAR(48) NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, user_id INTEGER NOT NULL, CONSTRAINT FK_77B144D1A76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO diary_entries (id, encrypted_data, iv, created_at, updated_at, user_id) SELECT id, encrypted_data, iv, created_at, updated_at, user_id FROM __temp__diary_entries');
        $this->addSql('DROP TABLE __temp__diary_entries');
        $this->addSql('CREATE INDEX idx_diary_user ON diary_entries (user_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__economic_reminders AS SELECT id, status, event_date, event_time, timezone, event_title, event_title_original, event_country_code, event_currency, event_importance, remind_at, fired_at, created_at, user_id FROM economic_reminders');
        $this->addSql('DROP TABLE economic_reminders');
        $this->addSql('CREATE TABLE economic_reminders (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, status VARCHAR(20) DEFAULT \'pending\' NOT NULL, event_date VARCHAR(10) NOT NULL, event_time VARCHAR(5) NOT NULL, timezone VARCHAR(10) DEFAULT \'America/Argentina/Buenos_Aires\' NOT NULL, event_title VARCHAR(200) NOT NULL, event_title_original VARCHAR(100) DEFAULT NULL, event_country_code VARCHAR(10) DEFAULT NULL, event_currency VARCHAR(10) DEFAULT NULL, event_importance INTEGER DEFAULT 3 NOT NULL, remind_at DATETIME NOT NULL, fired_at DATETIME DEFAULT NULL, created_at DATETIME NOT NULL, user_id INTEGER NOT NULL, CONSTRAINT FK_706C8ABBA76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO economic_reminders (id, status, event_date, event_time, timezone, event_title, event_title_original, event_country_code, event_currency, event_importance, remind_at, fired_at, created_at, user_id) SELECT id, status, event_date, event_time, timezone, event_title, event_title_original, event_country_code, event_currency, event_importance, remind_at, fired_at, created_at, user_id FROM __temp__economic_reminders');
        $this->addSql('DROP TABLE __temp__economic_reminders');
        $this->addSql('CREATE INDEX idx_er_status ON economic_reminders (status)');
        $this->addSql('CREATE INDEX idx_er_remind_at ON economic_reminders (remind_at)');
        $this->addSql('CREATE INDEX IDX_9C4F1A7DA76ED395 ON economic_reminders (user_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__journal_settings AS SELECT id, visibility, user_id FROM journal_settings');
        $this->addSql('DROP TABLE journal_settings');
        $this->addSql('CREATE TABLE journal_settings (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, visibility VARCHAR(20) DEFAULT \'"public"\' NOT NULL, user_id INTEGER NOT NULL, CONSTRAINT FK_35F50D7CA76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO journal_settings (id, visibility, user_id) SELECT id, visibility, user_id FROM __temp__journal_settings');
        $this->addSql('DROP TABLE __temp__journal_settings');
        $this->addSql('CREATE INDEX IDX_35F50D7CA76ED395 ON journal_settings (user_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__trades AS SELECT id, date, asset, direction, entry, sl, tp, result, pnl, ratio, notes, photos, user_id, account_id FROM trades');
        $this->addSql('DROP TABLE trades');
        $this->addSql('CREATE TABLE trades (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, date DATETIME NOT NULL, asset VARCHAR(20) NOT NULL, direction VARCHAR(10) NOT NULL, entry VARCHAR(50) DEFAULT NULL, sl VARCHAR(50) DEFAULT NULL, tp VARCHAR(50) DEFAULT NULL, result VARCHAR(20) NOT NULL, pnl NUMERIC(12, 2) DEFAULT \'0\' NOT NULL, ratio VARCHAR(20) DEFAULT NULL, notes CLOB DEFAULT NULL, photos CLOB DEFAULT NULL, user_id INTEGER NOT NULL, account_id INTEGER DEFAULT NULL, CONSTRAINT FK_BFA11125A76ED395 FOREIGN KEY (user_id) REFERENCES users (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO trades (id, date, asset, direction, entry, sl, tp, result, pnl, ratio, notes, photos, user_id, account_id) SELECT id, date, asset, direction, entry, sl, tp, result, pnl, ratio, notes, photos, user_id, account_id FROM __temp__trades');
        $this->addSql('DROP TABLE __temp__trades');
        $this->addSql('CREATE INDEX IDX_BFA11125A76ED395 ON trades (user_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__trading_accounts AS SELECT id, name, account_size, color, icon, is_active, deleted_at, sort_order, created_at, user_id FROM trading_accounts');
        $this->addSql('DROP TABLE trading_accounts');
        $this->addSql('CREATE TABLE trading_accounts (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, name VARCHAR(50) NOT NULL, account_size NUMERIC(12, 2) DEFAULT \'10000\' NOT NULL, color VARCHAR(20) DEFAULT \'#d4af37\' NOT NULL, icon VARCHAR(20) DEFAULT \'??\' NOT NULL, is_active BOOLEAN DEFAULT 1 NOT NULL, deleted_at DATETIME DEFAULT NULL, sort_order INTEGER DEFAULT 0 NOT NULL, created_at DATETIME NOT NULL, user_id INTEGER NOT NULL, CONSTRAINT FK_10CD3AADA76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO trading_accounts (id, name, account_size, color, icon, is_active, deleted_at, sort_order, created_at, user_id) SELECT id, name, account_size, color, icon, is_active, deleted_at, sort_order, created_at, user_id FROM __temp__trading_accounts');
        $this->addSql('DROP TABLE __temp__trading_accounts');
        $this->addSql('CREATE INDEX idx_ta_user_active ON trading_accounts (user_id, is_active, deleted_at)');
        $this->addSql('CREATE INDEX IDX_TA_USER ON trading_accounts (user_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__users AS SELECT id, code, email, name, active, last_login, roles, password, wallet_balance, max_accounts, diary_setup_token, diary_setup_iv FROM users');
        $this->addSql('DROP TABLE users');
        $this->addSql('CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, code VARCHAR(50) NOT NULL, email VARCHAR(180) DEFAULT NULL, name VARCHAR(100) NOT NULL, active BOOLEAN DEFAULT 1 NOT NULL, last_login DATETIME DEFAULT NULL, roles CLOB NOT NULL, password VARCHAR(255) DEFAULT NULL, wallet_balance NUMERIC(12, 2) DEFAULT \'0.00\' NOT NULL, max_accounts INTEGER DEFAULT 3 NOT NULL, diary_setup_token CLOB DEFAULT NULL, diary_setup_iv VARCHAR(48) DEFAULT NULL)');
        $this->addSql('INSERT INTO users (id, code, email, name, active, last_login, roles, password, wallet_balance, max_accounts, diary_setup_token, diary_setup_iv) SELECT id, code, email, name, active, last_login, roles, password, wallet_balance, max_accounts, diary_setup_token, diary_setup_iv FROM __temp__users');
        $this->addSql('DROP TABLE __temp__users');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_1483A5E977153098 ON users (code)');
    }
}
