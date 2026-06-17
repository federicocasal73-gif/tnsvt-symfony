<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Stage 1 - Wallet & Torneos con dinero real
 *
 * Crea la base del sistema de wallet virtual + torneos con dinero real:
 * 1. Agrega wallet_balance a users (USD virtual por user)
 * 2. Crea wallet_transactions (historial de movimientos)
 * 3. Crea tournaments (competiciones semanales)
 * 4. Crea tournament_entries (participación de users en torneos)
 */
final class Version20260617192614 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Stage 1: wallet + torneos - 4 tablas + columna wallet_balance en users';
    }

    public function up(Schema $schema): void
    {
        // 1. Agregar wallet_balance a users
        $this->addSql('ALTER TABLE users ADD COLUMN wallet_balance NUMERIC(12, 2) DEFAULT 0.00 NOT NULL');

        // 2. Wallet transactions
        $this->addSql('CREATE TABLE wallet_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            type VARCHAR(20) NOT NULL,
            amount NUMERIC(12, 2) NOT NULL,
            currency VARCHAR(8) DEFAULT \'USD\' NOT NULL,
            ref_tournament_id INTEGER DEFAULT NULL,
            ref_payment_id VARCHAR(100) DEFAULT NULL,
            ref_payment_method VARCHAR(20) DEFAULT NULL,
            status VARCHAR(20) DEFAULT \'confirmed\' NOT NULL,
            notes CLOB DEFAULT NULL,
            created_at DATETIME NOT NULL,
            confirmed_at DATETIME DEFAULT NULL,
            confirmed_by INTEGER DEFAULT NULL,
            CONSTRAINT FK_wtx_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE,
            CONSTRAINT FK_wtx_tournament FOREIGN KEY (ref_tournament_id) REFERENCES tournaments (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE,
            CONSTRAINT FK_wtx_admin FOREIGN KEY (confirmed_by) REFERENCES users (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE
        )');
        $this->addSql('CREATE INDEX idx_wtx_user ON wallet_transactions (user_id)');
        $this->addSql('CREATE INDEX idx_wtx_tournament ON wallet_transactions (ref_tournament_id)');
        $this->addSql('CREATE INDEX idx_wtx_status ON wallet_transactions (status)');
        $this->addSql('CREATE INDEX idx_wtx_created ON wallet_transactions (created_at)');

        // 3. Tournaments
        $this->addSql('CREATE TABLE tournaments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(100) NOT NULL,
            description CLOB DEFAULT NULL,
            entry_fee NUMERIC(10, 2) NOT NULL,
            prize_pool NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
            prize_distribution VARCHAR(20) DEFAULT \'60,30,10\' NOT NULL,
            start_date DATETIME NOT NULL,
            end_date DATETIME NOT NULL,
            status VARCHAR(20) DEFAULT \'pending\' NOT NULL,
            max_players INTEGER DEFAULT 100 NOT NULL,
            min_players INTEGER DEFAULT 2 NOT NULL,
            created_by INTEGER NOT NULL,
            created_at DATETIME NOT NULL,
            finished_at DATETIME DEFAULT NULL,
            CONSTRAINT FK_trn_creator FOREIGN KEY (created_by) REFERENCES users (id) NOT DEFERRABLE INITIALLY IMMEDIATE
        )');
        $this->addSql('CREATE INDEX idx_trn_status ON tournaments (status)');
        $this->addSql('CREATE INDEX idx_trn_end_date ON tournaments (end_date)');
        $this->addSql('CREATE INDEX idx_trn_active ON tournaments (status, end_date)');

        // 4. Tournament entries
        $this->addSql('CREATE TABLE tournament_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tournament_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            starting_equity NUMERIC(14, 4) NOT NULL,
            final_equity NUMERIC(14, 4) DEFAULT NULL,
            pnl_usd NUMERIC(14, 4) DEFAULT NULL,
            pnl_pct NUMERIC(10, 6) DEFAULT NULL,
            final_rank INTEGER DEFAULT NULL,
            payout_amount NUMERIC(12, 2) DEFAULT NULL,
            status VARCHAR(20) DEFAULT \'active\' NOT NULL,
            joined_at DATETIME NOT NULL,
            finalized_at DATETIME DEFAULT NULL,
            CONSTRAINT FK_te_tournament FOREIGN KEY (tournament_id) REFERENCES tournaments (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE,
            CONSTRAINT FK_te_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE
        )');
        $this->addSql('CREATE UNIQUE INDEX uniq_te_tournament_user ON tournament_entries (tournament_id, user_id)');
        $this->addSql('CREATE INDEX idx_te_tournament ON tournament_entries (tournament_id)');
        $this->addSql('CREATE INDEX idx_te_user ON tournament_entries (user_id)');
        $this->addSql('CREATE INDEX idx_te_status ON tournament_entries (status)');
        $this->addSql('CREATE INDEX idx_te_pnl ON tournament_entries (tournament_id, pnl_pct DESC)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE IF EXISTS tournament_entries');
        $this->addSql('DROP TABLE IF EXISTS tournaments');
        $this->addSql('DROP INDEX IF EXISTS idx_wtx_user');
        $this->addSql('DROP INDEX IF EXISTS idx_wtx_tournament');
        $this->addSql('DROP INDEX IF EXISTS idx_wtx_status');
        $this->addSql('DROP INDEX IF EXISTS idx_wtx_created');
        $this->addSql('DROP TABLE IF EXISTS wallet_transactions');
        // SQLite no soporta DROP COLUMN facilmente - recreamos la tabla users
        $this->addSql('CREATE TEMPORARY TABLE __temp__users AS SELECT id, code, name, active, last_login, roles, password FROM users');
        $this->addSql('DROP TABLE users');
        $this->addSql('CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, code VARCHAR(50) NOT NULL, name VARCHAR(100) NOT NULL, active BOOLEAN DEFAULT 1 NOT NULL, last_login DATETIME DEFAULT NULL, roles CLOB NOT NULL, password VARCHAR(255) DEFAULT NULL)');
        $this->addSql('INSERT INTO users (id, code, name, active, last_login, roles, password) SELECT id, code, name, active, last_login, roles, password FROM __temp__users');
        $this->addSql('DROP TABLE __temp__users');
        $this->addSql('CREATE UNIQUE INDEX uniq_code ON users (code)');
    }
}
