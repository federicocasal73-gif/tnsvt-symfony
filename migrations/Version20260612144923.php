<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260612144923 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create tasks table for admin-managed operative tasks';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE tasks (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, title VARCHAR(255) NOT NULL, description CLOB DEFAULT NULL, orden INTEGER DEFAULT 0 NOT NULL, active BOOLEAN DEFAULT 1 NOT NULL, created_at DATETIME DEFAULT NULL)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE tasks');
    }
}
