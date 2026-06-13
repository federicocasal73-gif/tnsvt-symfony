<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260613051000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create devices table for FCM push notification tokens';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE devices (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, user_id INTEGER NOT NULL, fcm_token VARCHAR(512) NOT NULL, platform VARCHAR(32) DEFAULT \'android\' NOT NULL, device_model VARCHAR(128) DEFAULT NULL, registered_at DATETIME DEFAULT NULL, last_seen_at DATETIME DEFAULT NULL)');
        $this->addSql('CREATE UNIQUE INDEX uniq_fcm_token ON devices (fcm_token)');
        $this->addSql('CREATE INDEX idx_devices_user ON devices (user_id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE devices');
    }
}
