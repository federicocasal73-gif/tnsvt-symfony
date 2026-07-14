<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260716000001 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create game_leaderboard_entries table for competitive leaderboards';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE game_leaderboard_entries (
            id INT AUTO_INCREMENT NOT NULL,
            user_id INT NOT NULL,
            leaderboard_type VARCHAR(20) NOT NULL,
            period VARCHAR(20) NOT NULL,
            score INT NOT NULL DEFAULT 0,
            season_id VARCHAR(50) DEFAULT NULL,
            created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            updated_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            INDEX idx_lb_user_type_period (user_id, leaderboard_type, period),
            INDEX idx_lb_score_type_period (score, leaderboard_type, period),
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('ALTER TABLE game_leaderboard_entries 
            ADD CONSTRAINT FK_game_leaderboard_user 
            FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE game_leaderboard_entries');
    }
}