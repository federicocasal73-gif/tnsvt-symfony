<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260617235932 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TEMPORARY TABLE __temp__devices AS SELECT id, user_id, fcm_token, platform, device_model, registered_at, last_seen_at FROM devices');
        $this->addSql('DROP TABLE devices');
        $this->addSql('CREATE TABLE devices (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, user_id INTEGER NOT NULL, fcm_token VARCHAR(512) NOT NULL, platform VARCHAR(32) DEFAULT \'android\' NOT NULL, device_model VARCHAR(128) DEFAULT NULL, registered_at DATETIME NOT NULL, last_seen_at DATETIME NOT NULL, CONSTRAINT FK_11074E9AA76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO devices (id, user_id, fcm_token, platform, device_model, registered_at, last_seen_at) SELECT id, user_id, fcm_token, platform, device_model, registered_at, last_seen_at FROM __temp__devices');
        $this->addSql('DROP TABLE __temp__devices');
        $this->addSql('CREATE UNIQUE INDEX uniq_fcm_token ON devices (fcm_token)');
        $this->addSql('CREATE INDEX IDX_11074E9AA76ED395 ON devices (user_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__tournament_entries AS SELECT id, tournament_id, user_id, starting_equity, final_equity, pnl_usd, pnl_pct, final_rank, payout_amount, status, joined_at, finalized_at FROM tournament_entries');
        $this->addSql('DROP TABLE tournament_entries');
        $this->addSql('CREATE TABLE tournament_entries (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, tournament_id INTEGER NOT NULL, user_id INTEGER NOT NULL, starting_equity NUMERIC(14, 4) NOT NULL, final_equity NUMERIC(14, 4) DEFAULT NULL, pnl_usd NUMERIC(14, 4) DEFAULT NULL, pnl_pct NUMERIC(10, 6) DEFAULT NULL, final_rank INTEGER DEFAULT NULL, payout_amount NUMERIC(12, 2) DEFAULT NULL, status VARCHAR(20) NOT NULL, joined_at DATETIME NOT NULL, finalized_at DATETIME DEFAULT NULL, CONSTRAINT FK_te_tournament FOREIGN KEY (tournament_id) REFERENCES tournaments (id) ON UPDATE NO ACTION ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_te_user FOREIGN KEY (user_id) REFERENCES users (id) ON UPDATE NO ACTION ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO tournament_entries (id, tournament_id, user_id, starting_equity, final_equity, pnl_usd, pnl_pct, final_rank, payout_amount, status, joined_at, finalized_at) SELECT id, tournament_id, user_id, starting_equity, final_equity, pnl_usd, pnl_pct, final_rank, payout_amount, status, joined_at, finalized_at FROM __temp__tournament_entries');
        $this->addSql('DROP TABLE __temp__tournament_entries');
        $this->addSql('CREATE INDEX idx_te_pnl ON tournament_entries (tournament_id, pnl_pct)');
        $this->addSql('CREATE INDEX idx_te_status ON tournament_entries (status)');
        $this->addSql('CREATE INDEX idx_te_user ON tournament_entries (user_id)');
        $this->addSql('CREATE INDEX idx_te_tournament ON tournament_entries (tournament_id)');
        $this->addSql('CREATE UNIQUE INDEX uniq_te_tournament_user ON tournament_entries (tournament_id, user_id)');
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
        $this->addSql('ALTER TABLE users ADD COLUMN email VARCHAR(180) DEFAULT NULL');
        $this->addSql('CREATE TEMPORARY TABLE __temp__wallet_transactions AS SELECT id, user_id, type, amount, currency, ref_tournament_id, ref_payment_id, ref_payment_method, status, notes, created_at, confirmed_at, confirmed_by_id FROM wallet_transactions');
        $this->addSql('DROP TABLE wallet_transactions');
        $this->addSql('CREATE TABLE wallet_transactions (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, user_id INTEGER NOT NULL, type VARCHAR(20) NOT NULL, amount NUMERIC(12, 2) NOT NULL, currency VARCHAR(8) NOT NULL, ref_tournament_id INTEGER DEFAULT NULL, ref_payment_id VARCHAR(100) DEFAULT NULL, ref_payment_method VARCHAR(20) DEFAULT NULL, status VARCHAR(20) NOT NULL, notes CLOB DEFAULT NULL, created_at DATETIME NOT NULL, confirmed_at DATETIME DEFAULT NULL, confirmed_by_id INTEGER DEFAULT NULL, CONSTRAINT FK_wtx_user FOREIGN KEY (user_id) REFERENCES users (id) ON UPDATE NO ACTION ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_wtx_tournament FOREIGN KEY (ref_tournament_id) REFERENCES tournaments (id) ON UPDATE NO ACTION ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_wtx_admin FOREIGN KEY (confirmed_by_id) REFERENCES users (id) ON UPDATE NO ACTION ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO wallet_transactions (id, user_id, type, amount, currency, ref_tournament_id, ref_payment_id, ref_payment_method, status, notes, created_at, confirmed_at, confirmed_by_id) SELECT id, user_id, type, amount, currency, ref_tournament_id, ref_payment_id, ref_payment_method, status, notes, created_at, confirmed_at, confirmed_by_id FROM __temp__wallet_transactions');
        $this->addSql('DROP TABLE __temp__wallet_transactions');
        $this->addSql('CREATE INDEX idx_wtx_created ON wallet_transactions (created_at)');
        $this->addSql('CREATE INDEX idx_wtx_status ON wallet_transactions (status)');
        $this->addSql('CREATE INDEX idx_wtx_tournament ON wallet_transactions (ref_tournament_id)');
        $this->addSql('CREATE INDEX idx_wtx_user ON wallet_transactions (user_id)');
        $this->addSql('CREATE INDEX IDX_A50205E26F45385D ON wallet_transactions (confirmed_by_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TEMPORARY TABLE __temp__devices AS SELECT id, fcm_token, platform, device_model, registered_at, last_seen_at, user_id FROM devices');
        $this->addSql('DROP TABLE devices');
        $this->addSql('CREATE TABLE devices (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, fcm_token VARCHAR(512) NOT NULL, platform VARCHAR(32) DEFAULT \'android\' NOT NULL, device_model VARCHAR(128) DEFAULT NULL, registered_at DATETIME DEFAULT NULL, last_seen_at DATETIME DEFAULT NULL, user_id INTEGER NOT NULL)');
        $this->addSql('INSERT INTO devices (id, fcm_token, platform, device_model, registered_at, last_seen_at, user_id) SELECT id, fcm_token, platform, device_model, registered_at, last_seen_at, user_id FROM __temp__devices');
        $this->addSql('DROP TABLE __temp__devices');
        $this->addSql('CREATE UNIQUE INDEX uniq_fcm_token ON devices (fcm_token)');
        $this->addSql('CREATE INDEX idx_devices_user ON devices (user_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__tournament_entries AS SELECT id, starting_equity, final_equity, pnl_usd, pnl_pct, final_rank, payout_amount, status, joined_at, finalized_at, tournament_id, user_id FROM tournament_entries');
        $this->addSql('DROP TABLE tournament_entries');
        $this->addSql('CREATE TABLE tournament_entries (id INTEGER PRIMARY KEY AUTOINCREMENT DEFAULT NULL, starting_equity NUMERIC(14, 4) NOT NULL, final_equity NUMERIC(14, 4) DEFAULT NULL, pnl_usd NUMERIC(14, 4) DEFAULT NULL, pnl_pct NUMERIC(10, 6) DEFAULT NULL, final_rank INTEGER DEFAULT NULL, payout_amount NUMERIC(12, 2) DEFAULT NULL, status VARCHAR(20) DEFAULT \'active\' NOT NULL, joined_at DATETIME NOT NULL, finalized_at DATETIME DEFAULT NULL, tournament_id INTEGER NOT NULL, user_id INTEGER NOT NULL, CONSTRAINT FK_46F748CF33D1A3E7 FOREIGN KEY (tournament_id) REFERENCES tournaments (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_46F748CFA76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO tournament_entries (id, starting_equity, final_equity, pnl_usd, pnl_pct, final_rank, payout_amount, status, joined_at, finalized_at, tournament_id, user_id) SELECT id, starting_equity, final_equity, pnl_usd, pnl_pct, final_rank, payout_amount, status, joined_at, finalized_at, tournament_id, user_id FROM __temp__tournament_entries');
        $this->addSql('DROP TABLE __temp__tournament_entries');
        $this->addSql('CREATE INDEX idx_te_tournament ON tournament_entries (tournament_id)');
        $this->addSql('CREATE INDEX idx_te_user ON tournament_entries (user_id)');
        $this->addSql('CREATE INDEX idx_te_status ON tournament_entries (status)');
        $this->addSql('CREATE INDEX idx_te_pnl ON tournament_entries (tournament_id, pnl_pct)');
        $this->addSql('CREATE UNIQUE INDEX uniq_te_tournament_user ON tournament_entries (tournament_id, user_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__tournaments AS SELECT id, name, description, entry_fee, prize_pool, prize_distribution, start_date, end_date, status, max_players, min_players, created_at, finished_at, created_by_id FROM tournaments');
        $this->addSql('DROP TABLE tournaments');
        $this->addSql('CREATE TABLE tournaments (id INTEGER PRIMARY KEY AUTOINCREMENT DEFAULT NULL, name VARCHAR(100) NOT NULL, description CLOB DEFAULT NULL, entry_fee NUMERIC(10, 2) NOT NULL, prize_pool NUMERIC(12, 2) DEFAULT \'0.00\' NOT NULL, prize_distribution VARCHAR(20) DEFAULT \'60,30,10\' NOT NULL, start_date DATETIME NOT NULL, end_date DATETIME NOT NULL, status VARCHAR(20) DEFAULT \'pending\' NOT NULL, max_players INTEGER DEFAULT 100 NOT NULL, min_players INTEGER DEFAULT 2 NOT NULL, created_at DATETIME NOT NULL, finished_at DATETIME DEFAULT NULL, created_by_id INTEGER NOT NULL, CONSTRAINT FK_E4BCFAC3B03A8386 FOREIGN KEY (created_by_id) REFERENCES users (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO tournaments (id, name, description, entry_fee, prize_pool, prize_distribution, start_date, end_date, status, max_players, min_players, created_at, finished_at, created_by_id) SELECT id, name, description, entry_fee, prize_pool, prize_distribution, start_date, end_date, status, max_players, min_players, created_at, finished_at, created_by_id FROM __temp__tournaments');
        $this->addSql('DROP TABLE __temp__tournaments');
        $this->addSql('CREATE INDEX IDX_E4BCFAC3B03A8386 ON tournaments (created_by_id)');
        $this->addSql('CREATE INDEX idx_trn_status ON tournaments (status)');
        $this->addSql('CREATE INDEX idx_trn_end_date ON tournaments (end_date)');
        $this->addSql('CREATE INDEX idx_trn_active ON tournaments (status, end_date)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__trades AS SELECT id, date, asset, direction, entry, sl, tp, result, pnl, ratio, notes, photos, user_id FROM trades');
        $this->addSql('DROP TABLE trades');
        $this->addSql('CREATE TABLE trades (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, date DATETIME NOT NULL, asset VARCHAR(20) NOT NULL, direction VARCHAR(10) NOT NULL, entry VARCHAR(50) DEFAULT NULL, sl VARCHAR(50) DEFAULT NULL, tp VARCHAR(50) DEFAULT NULL, result VARCHAR(20) NOT NULL, pnl NUMERIC(12, 2) DEFAULT \'0\' NOT NULL, ratio VARCHAR(20) DEFAULT NULL, notes CLOB DEFAULT NULL, photos CLOB DEFAULT NULL, user_id INTEGER NOT NULL, CONSTRAINT FK_BFA11125A76ED395 FOREIGN KEY (user_id) REFERENCES users (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO trades (id, date, asset, direction, entry, sl, tp, result, pnl, ratio, notes, photos, user_id) SELECT id, date, asset, direction, entry, sl, tp, result, pnl, ratio, notes, photos, user_id FROM __temp__trades');
        $this->addSql('DROP TABLE __temp__trades');
        $this->addSql('CREATE INDEX IDX_BFA11125A76ED395 ON trades (user_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__users AS SELECT id, code, name, active, last_login, roles, password, wallet_balance FROM users');
        $this->addSql('DROP TABLE users');
        $this->addSql('CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, code VARCHAR(50) NOT NULL, name VARCHAR(100) NOT NULL, active BOOLEAN DEFAULT 1 NOT NULL, last_login DATETIME DEFAULT NULL, roles CLOB NOT NULL, password VARCHAR(255) DEFAULT NULL, wallet_balance NUMERIC(12, 2) DEFAULT \'0.00\' NOT NULL)');
        $this->addSql('INSERT INTO users (id, code, name, active, last_login, roles, password, wallet_balance) SELECT id, code, name, active, last_login, roles, password, wallet_balance FROM __temp__users');
        $this->addSql('DROP TABLE __temp__users');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_1483A5E977153098 ON users (code)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__wallet_transactions AS SELECT id, type, amount, currency, ref_payment_id, ref_payment_method, status, notes, created_at, confirmed_at, user_id, ref_tournament_id, confirmed_by_id FROM wallet_transactions');
        $this->addSql('DROP TABLE wallet_transactions');
        $this->addSql('CREATE TABLE wallet_transactions (id INTEGER PRIMARY KEY AUTOINCREMENT DEFAULT NULL, type VARCHAR(20) NOT NULL, amount NUMERIC(12, 2) NOT NULL, currency VARCHAR(8) DEFAULT \'USD\' NOT NULL, ref_payment_id VARCHAR(100) DEFAULT NULL, ref_payment_method VARCHAR(20) DEFAULT NULL, status VARCHAR(20) DEFAULT \'confirmed\' NOT NULL, notes CLOB DEFAULT NULL, created_at DATETIME NOT NULL, confirmed_at DATETIME DEFAULT NULL, user_id INTEGER NOT NULL, ref_tournament_id INTEGER DEFAULT NULL, confirmed_by_id INTEGER DEFAULT NULL, CONSTRAINT FK_A50205E2A76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_A50205E21781F487 FOREIGN KEY (ref_tournament_id) REFERENCES tournaments (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_A50205E26F45385D FOREIGN KEY (confirmed_by_id) REFERENCES users (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO wallet_transactions (id, type, amount, currency, ref_payment_id, ref_payment_method, status, notes, created_at, confirmed_at, user_id, ref_tournament_id, confirmed_by_id) SELECT id, type, amount, currency, ref_payment_id, ref_payment_method, status, notes, created_at, confirmed_at, user_id, ref_tournament_id, confirmed_by_id FROM __temp__wallet_transactions');
        $this->addSql('DROP TABLE __temp__wallet_transactions');
        $this->addSql('CREATE INDEX IDX_A50205E26F45385D ON wallet_transactions (confirmed_by_id)');
        $this->addSql('CREATE INDEX idx_wtx_user ON wallet_transactions (user_id)');
        $this->addSql('CREATE INDEX idx_wtx_tournament ON wallet_transactions (ref_tournament_id)');
        $this->addSql('CREATE INDEX idx_wtx_status ON wallet_transactions (status)');
        $this->addSql('CREATE INDEX idx_wtx_created ON wallet_transactions (created_at)');
    }
}
