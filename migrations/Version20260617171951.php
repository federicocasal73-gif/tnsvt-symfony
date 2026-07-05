<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Crea tabla game_scores para el juego T.N.S.V.T Market Instinct
 * Esta migración SOLO crea la tabla nueva, no toca devices ni trades.
 */
final class Version20260617171951 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Crear tabla game_scores para T.N.S.V.T Market Instinct game';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE game_scores (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, mode VARCHAR(32) NOT NULL, score INTEGER NOT NULL, xp_gained INTEGER DEFAULT 0 NOT NULL, metadata CLOB NOT NULL, created_at DATETIME NOT NULL, user_id INTEGER NOT NULL, CONSTRAINT FK_7A659A96A76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE INDEX IDX_7A659A96A76ED395 ON game_scores (user_id)');
        $this->addSql('CREATE INDEX idx_game_user_mode ON game_scores (user_id, mode)');
        $this->addSql('CREATE INDEX idx_game_score ON game_scores (score)');
        $this->addSql('CREATE INDEX idx_game_created ON game_scores (created_at)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE game_scores');
    }
}
