<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260622025909 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add link column to notifications';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE notifications ADD COLUMN link VARCHAR(500) DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('CREATE TEMPORARY TABLE __temp__notifications AS SELECT id, type, content, is_read, created_at, user_id FROM notifications');
        $this->addSql('DROP TABLE notifications');
        $this->addSql('CREATE TABLE notifications (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, type VARCHAR(50) NOT NULL, content CLOB NOT NULL, is_read BOOLEAN DEFAULT 0 NOT NULL, created_at DATETIME NOT NULL, user_id INTEGER NOT NULL, CONSTRAINT FK_6000B0D3A76ED395 FOREIGN KEY (user_id) REFERENCES users (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO notifications (id, type, content, is_read, created_at, user_id) SELECT id, type, content, is_read, created_at, user_id FROM __temp__notifications');
        $this->addSql('DROP TABLE __temp__notifications');
        $this->addSql('CREATE INDEX IDX_6000B0D3A76ED395 ON notifications (user_id)');
    }
}
