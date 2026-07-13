<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260714000001 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Week 2 Día 1: Add economy fields to users (coins, reputation, dailyLogin)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE users ADD COLUMN coins INTEGER DEFAULT 0');
        $this->addSql('ALTER TABLE users ADD COLUMN reputation DOUBLE PRECISION DEFAULT 0');
        $this->addSql('ALTER TABLE users ADD COLUMN daily_login JSON DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE users DROP COLUMN daily_login');
        $this->addSql('ALTER TABLE users DROP COLUMN reputation');
        $this->addSql('ALTER TABLE users DROP COLUMN coins');
    }
}
