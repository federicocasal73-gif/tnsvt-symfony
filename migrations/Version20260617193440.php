<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Fix Stage 1 - corrige nombres de columnas FK para que coincidan
 * con el naming convention de Doctrine (sufijo _id automatico).
 */
final class Version20260617193440 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Fix Stage 1: renombra confirmed_by -> confirmed_by_id y created_by -> created_by_id';
    }

    public function up(Schema $schema): void
    {
        // SQLite no soporta RENAME COLUMN directamente, pero Doctrine usa sqlite_master
        $this->addSql('ALTER TABLE wallet_transactions RENAME COLUMN confirmed_by TO confirmed_by_id');
        $this->addSql('ALTER TABLE tournaments RENAME COLUMN created_by TO created_by_id');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE wallet_transactions RENAME COLUMN confirmed_by_id TO confirmed_by');
        $this->addSql('ALTER TABLE tournaments RENAME COLUMN created_by_id TO created_by');
    }
}
