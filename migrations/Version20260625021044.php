<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260625021044 extends AbstractMigration
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
        $this->addSql('CREATE TEMPORARY TABLE __temp__trades AS SELECT id, date, asset, direction, entry, sl, tp, result, pnl, ratio, notes, photos, user_id FROM trades');
        $this->addSql('DROP TABLE trades');
        $this->addSql('CREATE TABLE trades (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, date DATETIME NOT NULL, asset VARCHAR(20) NOT NULL, direction VARCHAR(10) NOT NULL, entry VARCHAR(50) DEFAULT NULL, sl VARCHAR(50) DEFAULT NULL, tp VARCHAR(50) DEFAULT NULL, result VARCHAR(20) NOT NULL, pnl NUMERIC(12, 2) DEFAULT 0 NOT NULL, ratio VARCHAR(20) DEFAULT NULL, notes CLOB DEFAULT NULL, photos CLOB DEFAULT NULL, user_id INTEGER NOT NULL, CONSTRAINT FK_BFA11125A76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO trades (id, date, asset, direction, entry, sl, tp, result, pnl, ratio, notes, photos, user_id) SELECT id, date, asset, direction, entry, sl, tp, result, pnl, ratio, notes, photos, user_id FROM __temp__trades');
        $this->addSql('DROP TABLE __temp__trades');
        $this->addSql('CREATE INDEX IDX_BFA11125A76ED395 ON trades (user_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP TABLE duel_rounds');
        $this->addSql('DROP TABLE duels');
        $this->addSql('CREATE TEMPORARY TABLE __temp__trades AS SELECT id, date, asset, direction, entry, sl, tp, result, pnl, ratio, notes, photos, user_id FROM trades');
        $this->addSql('DROP TABLE trades');
        $this->addSql('CREATE TABLE trades (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, date DATETIME NOT NULL, asset VARCHAR(20) NOT NULL, direction VARCHAR(10) NOT NULL, entry VARCHAR(50) DEFAULT NULL, sl VARCHAR(50) DEFAULT NULL, tp VARCHAR(50) DEFAULT NULL, result VARCHAR(20) NOT NULL, pnl NUMERIC(12, 2) DEFAULT \'0\' NOT NULL, ratio VARCHAR(20) DEFAULT NULL, notes CLOB DEFAULT NULL, photos CLOB DEFAULT NULL, user_id INTEGER NOT NULL, CONSTRAINT FK_BFA11125A76ED395 FOREIGN KEY (user_id) REFERENCES users (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO trades (id, date, asset, direction, entry, sl, tp, result, pnl, ratio, notes, photos, user_id) SELECT id, date, asset, direction, entry, sl, tp, result, pnl, ratio, notes, photos, user_id FROM __temp__trades');
        $this->addSql('DROP TABLE __temp__trades');
        $this->addSql('CREATE INDEX IDX_BFA11125A76ED395 ON trades (user_id)');
    }
}
