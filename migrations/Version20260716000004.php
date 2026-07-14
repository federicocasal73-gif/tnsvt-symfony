<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260716000004 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create player_bets table for P2P betting system';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE player_bets (
            id INT AUTO_INCREMENT NOT NULL,
            challenger_id INT NOT NULL,
            opponent_id INT DEFAULT NULL,
            winner_id INT DEFAULT NULL,
            amount INT NOT NULL DEFAULT 0,
            total_pot INT NOT NULL DEFAULT 0,
            mode VARCHAR(20) NOT NULL DEFAULT \'classic\',
            status VARCHAR(20) NOT NULL DEFAULT \'pending\',
            challenger_score INT DEFAULT NULL,
            opponent_score INT DEFAULT NULL,
            created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            expires_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            completed_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            metadata JSON NOT NULL,
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('CREATE INDEX idx_pb_challenger ON player_bets (challenger_id)');
        $this->addSql('CREATE INDEX idx_pb_opponent ON player_bets (opponent_id)');
        $this->addSql('CREATE INDEX idx_pb_status ON player_bets (status)');
        $this->addSql('CREATE INDEX idx_pb_expires ON player_bets (expires_at)');

        $this->addSql('ALTER TABLE player_bets 
            ADD CONSTRAINT FK_pb_challenger 
            FOREIGN KEY (challenger_id) REFERENCES user(id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE player_bets 
            ADD CONSTRAINT FK_pb_opponent 
            FOREIGN KEY (opponent_id) REFERENCES user(id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE player_bets 
            ADD CONSTRAINT FK_pb_winner 
            FOREIGN KEY (winner_id) REFERENCES user(id) ON DELETE SET NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE player_bets');
    }
}