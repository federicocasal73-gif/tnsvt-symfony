<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Renombra la columna `signal` → `signal_data` en feed_posts.
 * `signal` es palabra reservada de MySQL/MariaDB (SIGNAL statement)
 * y Doctrine no la escapa automáticamente, lo que rompía el INSERT.
 * Idempotente: safe si se ejecuta dos veces.
 */
final class Version20260720000001 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Rename feed_posts.signal to signal_data (MySQL reserved word fix)';
    }

    public function up(Schema $schema): void
    {
        $platform = $this->connection->getDatabasePlatform()->getName();
        if ($platform === 'sqlite') {
            // SQLite lo tolera igual, pero saltamos para no tocar nada innecesario.
            return;
        }

        // MySQL/MariaDB / PostgreSQL: rename columna preservando datos.
        $this->addSql('ALTER TABLE feed_posts CHANGE `signal` `signal_data` JSON NULL');
    }

    public function down(Schema $schema): void
    {
        $platform = $this->connection->getDatabasePlatform()->getName();
        if ($platform === 'sqlite') {
            return;
        }
        $this->addSql('ALTER TABLE feed_posts CHANGE `signal_data` `signal` JSON NULL');
    }
}