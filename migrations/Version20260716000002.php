<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260716000002 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create tournament_brackets, bracket_matches, and tournament_bracket_entries tables';
    }

    public function up(Schema $schema): void
    {
        // Tournament Brackets
        $this->addSql('CREATE TABLE tournament_brackets (
            id INT AUTO_INCREMENT NOT NULL,
            created_by_id INT NOT NULL,
            name VARCHAR(100) NOT NULL,
            mode VARCHAR(20) NOT NULL DEFAULT \'classic\',
            max_players INT NOT NULL DEFAULT 8,
            current_round INT NOT NULL DEFAULT 0,
            total_rounds INT NOT NULL DEFAULT 0,
            entry_fee NUMERIC(10, 2) NOT NULL DEFAULT \'0.00\',
            prize_pool NUMERIC(12, 2) NOT NULL DEFAULT \'0.00\',
            status VARCHAR(20) NOT NULL DEFAULT \'registration\',
            start_date DATETIME NOT NULL,
            end_date DATETIME NOT NULL,
            match_duration_minutes INT NOT NULL DEFAULT 480,
            created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('ALTER TABLE tournament_brackets 
            ADD CONSTRAINT FK_tournament_brackets_created_by 
            FOREIGN KEY (created_by_id) REFERENCES user(id)');

        // Bracket Matches
        $this->addSql('CREATE TABLE bracket_matches (
            id INT AUTO_INCREMENT NOT NULL,
            tournament_id INT NOT NULL,
            player1_id INT DEFAULT NULL,
            player2_id INT DEFAULT NULL,
            winner_id INT DEFAULT NULL,
            round INT NOT NULL DEFAULT 0,
            match_index INT NOT NULL DEFAULT 0,
            player1_score INT DEFAULT NULL,
            player2_score INT DEFAULT NULL,
            status VARCHAR(20) NOT NULL DEFAULT \'pending\',
            started_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            deadline DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            finished_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            round_results JSON NOT NULL,
            created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('CREATE INDEX idx_bm_tournament_round ON bracket_matches (tournament_id, round)');

        $this->addSql('ALTER TABLE bracket_matches 
            ADD CONSTRAINT FK_bracket_matches_tournament 
            FOREIGN KEY (tournament_id) REFERENCES tournament_brackets(id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE bracket_matches 
            ADD CONSTRAINT FK_bracket_matches_player1 
            FOREIGN KEY (player1_id) REFERENCES user(id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE bracket_matches 
            ADD CONSTRAINT FK_bracket_matches_player2 
            FOREIGN KEY (player2_id) REFERENCES user(id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE bracket_matches 
            ADD CONSTRAINT FK_bracket_matches_winner 
            FOREIGN KEY (winner_id) REFERENCES user(id) ON DELETE SET NULL');

        // Tournament Bracket Entries
        $this->addSql('CREATE TABLE tournament_bracket_entries (
            id INT AUTO_INCREMENT NOT NULL,
            tournament_id INT NOT NULL,
            user_id INT NOT NULL,
            joined_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            final_rank INT DEFAULT NULL,
            prize_won NUMERIC(12, 2) DEFAULT NULL,
            eliminated TINYINT(1) NOT NULL DEFAULT 0,
            eliminated_round INT DEFAULT NULL,
            UNIQUE INDEX uniq_tbe_tournament_user (tournament_id, user_id),
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('ALTER TABLE tournament_bracket_entries 
            ADD CONSTRAINT FK_tbe_tournament 
            FOREIGN KEY (tournament_id) REFERENCES tournament_brackets(id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE tournament_bracket_entries 
            ADD CONSTRAINT FK_tbe_user 
            FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE tournament_bracket_entries');
        $this->addSql('DROP TABLE bracket_matches');
        $this->addSql('DROP TABLE tournament_brackets');
    }
}