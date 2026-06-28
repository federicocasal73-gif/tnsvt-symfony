<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260628150000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create economic_reminders table for calendar FCM reminders (15 min before critical events)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE economic_reminders (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, status VARCHAR(20) DEFAULT \'pending\' NOT NULL, event_date VARCHAR(10) NOT NULL, event_time VARCHAR(5) NOT NULL, timezone VARCHAR(10) DEFAULT \'America/Argentina/Buenos_Aires\' NOT NULL, event_title VARCHAR(200) NOT NULL, event_title_original VARCHAR(100) DEFAULT NULL, event_country_code VARCHAR(10) DEFAULT NULL, event_currency VARCHAR(10) DEFAULT NULL, event_importance INTEGER DEFAULT 3 NOT NULL, remind_at DATETIME NOT NULL, fired_at DATETIME DEFAULT NULL, created_at DATETIME NOT NULL, user_id INTEGER NOT NULL, CONSTRAINT FK_9C4F1A7DA76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE INDEX IDX_9C4F1A7DA76ED395 ON economic_reminders (user_id)');
        $this->addSql('CREATE INDEX idx_er_status ON economic_reminders (status)');
        $this->addSql('CREATE INDEX idx_er_remind_at ON economic_reminders (remind_at)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE economic_reminders');
    }
}
