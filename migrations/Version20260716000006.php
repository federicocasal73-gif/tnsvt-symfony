<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260716000006 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create special_events, event_missions, and event_mission_progress tables';
    }

    public function up(Schema $schema): void
    {
        // Special Events
        $this->addSql('CREATE TABLE special_events (
            id INT AUTO_INCREMENT NOT NULL,
            name VARCHAR(100) NOT NULL,
            theme VARCHAR(50) NOT NULL,
            description LONGTEXT DEFAULT NULL,
            banner VARCHAR(200) DEFAULT NULL,
            emoji VARCHAR(10) NOT NULL DEFAULT \'🎉\',
            start_date DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            end_date DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            status VARCHAR(20) NOT NULL DEFAULT \'upcoming\',
            config JSON NOT NULL,
            shop_items JSON NOT NULL,
            created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('CREATE INDEX idx_se_status ON special_events (status)');
        $this->addSql('CREATE INDEX idx_se_dates ON special_events (start_date, end_date)');

        // Event Missions
        $this->addSql('CREATE TABLE event_missions (
            id INT AUTO_INCREMENT NOT NULL,
            event_id INT NOT NULL,
            title VARCHAR(100) NOT NULL,
            description LONGTEXT DEFAULT NULL,
            type VARCHAR(30) NOT NULL DEFAULT \'trade_count\',
            requirements JSON NOT NULL,
            rewards JSON NOT NULL,
            difficulty VARCHAR(20) NOT NULL DEFAULT \'medium\',
            objectives JSON NOT NULL,
            created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('CREATE INDEX idx_em_event ON event_missions (event_id)');
        $this->addSql('CREATE INDEX idx_em_type ON event_missions (event_id, type)');

        $this->addSql('ALTER TABLE event_missions 
            ADD CONSTRAINT FK_em_event 
            FOREIGN KEY (event_id) REFERENCES special_events(id) ON DELETE CASCADE');

        // Event Mission Progress
        $this->addSql('CREATE TABLE event_mission_progress (
            id INT AUTO_INCREMENT NOT NULL,
            mission_id INT NOT NULL,
            user_id INT NOT NULL,
            progress JSON NOT NULL,
            completed TINYINT(1) NOT NULL DEFAULT 0,
            claimed TINYINT(1) NOT NULL DEFAULT 0,
            completed_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('CREATE UNIQUE INDEX uniq_emp_mission_user ON event_mission_progress (mission_id, user_id)');
        $this->addSql('CREATE INDEX idx_emp_user ON event_mission_progress (user_id)');
        $this->addSql('CREATE INDEX idx_emp_completed ON event_mission_progress (completed)');

        $this->addSql('ALTER TABLE event_mission_progress 
            ADD CONSTRAINT FK_emp_mission 
            FOREIGN KEY (mission_id) REFERENCES event_missions(id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE event_mission_progress 
            ADD CONSTRAINT FK_emp_user 
            FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE event_mission_progress');
        $this->addSql('DROP TABLE event_missions');
        $this->addSql('DROP TABLE special_events');
    }
}