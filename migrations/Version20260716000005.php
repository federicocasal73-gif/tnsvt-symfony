<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260716000005 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create daily_challenges, daily_challenge_entries, and honor_board tables';
    }

    public function up(Schema $schema): void
    {
        // Daily Challenges
        $this->addSql('CREATE TABLE daily_challenges (
            id INT AUTO_INCREMENT NOT NULL,
            title VARCHAR(100) NOT NULL,
            description LONGTEXT DEFAULT NULL,
            type VARCHAR(20) NOT NULL DEFAULT \'score\',
            date VARCHAR(10) NOT NULL,
            mode VARCHAR(20) NOT NULL DEFAULT \'classic\',
            config JSON NOT NULL,
            rewards JSON NOT NULL,
            max_participants INT NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('CREATE UNIQUE INDEX uniq_dc_date ON daily_challenges (date)');

        // Daily Challenge Entries
        $this->addSql('CREATE TABLE daily_challenge_entries (
            id INT AUTO_INCREMENT NOT NULL,
            challenge_id INT NOT NULL,
            user_id INT NOT NULL,
            score INT NOT NULL DEFAULT 0,
            time_spent INT DEFAULT NULL,
            accuracy INT DEFAULT NULL,
            `rank` INT DEFAULT NULL,
            metadata JSON NOT NULL,
            created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('CREATE UNIQUE INDEX uniq_dce_challenge_user ON daily_challenge_entries (challenge_id, user_id)');
        $this->addSql('CREATE INDEX idx_dce_score ON daily_challenge_entries (challenge_id, score)');

        $this->addSql('ALTER TABLE daily_challenge_entries 
            ADD CONSTRAINT FK_dce_challenge 
            FOREIGN KEY (challenge_id) REFERENCES daily_challenges(id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE daily_challenge_entries 
            ADD CONSTRAINT FK_dce_user 
            FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE');

        // Honor Board
        $this->addSql('CREATE TABLE honor_board (
            id INT AUTO_INCREMENT NOT NULL,
            user_id INT NOT NULL,
            category VARCHAR(30) NOT NULL,
            value INT NOT NULL DEFAULT 0,
            period VARCHAR(20) NOT NULL DEFAULT \'all_time\',
            season VARCHAR(50) NOT NULL,
            rank VARCHAR(10) DEFAULT NULL,
            metadata JSON NOT NULL,
            updated_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('CREATE INDEX idx_hb_category ON honor_board (category, period, value)');
        $this->addSql('CREATE INDEX idx_hb_user ON honor_board (user_id)');

        $this->addSql('ALTER TABLE honor_board 
            ADD CONSTRAINT FK_hb_user 
            FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE honor_board');
        $this->addSql('DROP TABLE daily_challenge_entries');
        $this->addSql('DROP TABLE daily_challenges');
    }
}