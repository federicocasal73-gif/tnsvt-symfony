<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260716000003 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create clans, clan_members, clan_objectives, and clan_messages tables';
    }

    public function up(Schema $schema): void
    {
        // Clans
        $this->addSql('CREATE TABLE clans (
            id INT AUTO_INCREMENT NOT NULL,
            leader_id INT NOT NULL,
            name VARCHAR(50) NOT NULL,
            tag VARCHAR(10) NOT NULL,
            description LONGTEXT DEFAULT NULL,
            avatar VARCHAR(50) DEFAULT NULL,
            max_members INT NOT NULL DEFAULT 10,
            created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('ALTER TABLE clans 
            ADD CONSTRAINT FK_clans_leader 
            FOREIGN KEY (leader_id) REFERENCES user(id)');

        // Clan Members
        $this->addSql('CREATE TABLE clan_members (
            id INT AUTO_INCREMENT NOT NULL,
            clan_id INT NOT NULL,
            user_id INT NOT NULL,
            role VARCHAR(20) NOT NULL DEFAULT \'member\',
            contribution INT NOT NULL DEFAULT 0,
            weekly_contribution INT NOT NULL DEFAULT 0,
            joined_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            last_active_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            UNIQUE INDEX uniq_cm_clan_user (clan_id, user_id),
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('ALTER TABLE clan_members 
            ADD CONSTRAINT FK_cm_clan 
            FOREIGN KEY (clan_id) REFERENCES clans(id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE clan_members 
            ADD CONSTRAINT FK_cm_user 
            FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE');

        // Clan Objectives
        $this->addSql('CREATE TABLE clan_objectives (
            id INT AUTO_INCREMENT NOT NULL,
            clan_id INT NOT NULL,
            title VARCHAR(100) NOT NULL,
            description LONGTEXT DEFAULT NULL,
            type VARCHAR(20) NOT NULL,
            target INT NOT NULL DEFAULT 0,
            current INT NOT NULL DEFAULT 0,
            completed TINYINT(1) NOT NULL DEFAULT 0,
            completed_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            expires_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            rewards JSON NOT NULL,
            created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('ALTER TABLE clan_objectives 
            ADD CONSTRAINT FK_co_clan 
            FOREIGN KEY (clan_id) REFERENCES clans(id) ON DELETE CASCADE');

        // Clan Messages
        $this->addSql('CREATE TABLE clan_messages (
            id INT AUTO_INCREMENT NOT NULL,
            clan_id INT NOT NULL,
            sender_id INT DEFAULT NULL,
            content LONGTEXT NOT NULL,
            type VARCHAR(20) NOT NULL DEFAULT \'text\',
            created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('CREATE INDEX idx_cm_clan_time ON clan_messages (clan_id, created_at)');

        $this->addSql('ALTER TABLE clan_messages 
            ADD CONSTRAINT FK_cm_msg_clan 
            FOREIGN KEY (clan_id) REFERENCES clans(id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE clan_messages 
            ADD CONSTRAINT FK_cm_msg_sender 
            FOREIGN KEY (sender_id) REFERENCES user(id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE clan_messages');
        $this->addSql('DROP TABLE clan_objectives');
        $this->addSql('DROP TABLE clan_members');
        $this->addSql('DROP TABLE clans');
    }
}