<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Crea tabla journal_entries para el diario offline-first sync.
 * Idempotente: safe si se ejecuta dos veces.
 */
final class Version20260718010000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create journal_entries table for offline-first sync';
    }

    public function up(Schema $schema): void
    {
        $table = $schema->createTable('journal_entries');
        $table->addColumn('id', 'bigint', ['autoincrement' => true]);
        $table->addColumn('user_code', 'string', ['length' => 32]);
        $table->addColumn('asset', 'string', ['length' => 16]);
        $table->addColumn('direction', 'string', ['length' => 8, 'default' => 'BUY']);
        $table->addColumn('date', 'datetime_immutable');
        $table->addColumn('entry', 'string', ['length' => 32, 'notnull' => false]);
        $table->addColumn('sl', 'string', ['length' => 32, 'notnull' => false]);
        $table->addColumn('tp', 'string', ['length' => 32, 'notnull' => false]);
        $table->addColumn('result', 'string', ['length' => 16, 'notnull' => false]);
        $table->addColumn('pnl', 'decimal', ['precision' => 12, 'scale' => 4, 'notnull' => false]);
        $table->addColumn('ratio', 'string', ['length' => 16, 'notnull' => false]);
        $table->addColumn('notes', 'text', ['notnull' => false]);
        $table->addColumn('photos', 'text', ['notnull' => false]);
        $table->addColumn('tags', 'string', ['length' => 255, 'notnull' => false]);
        $table->addColumn('account_id', 'bigint', ['notnull' => false]);
        $table->addColumn('created_at', 'datetime_immutable');
        $table->addColumn('updated_at', 'datetime_immutable');
        $table->setPrimaryKey(['id']);
        $table->addIndex(['user_code'], 'idx_je_user');
        $table->addIndex(['updated_at'], 'idx_je_updated');
    }

    public function down(Schema $schema): void
    {
        $schema->dropTable('journal_entries');
    }
}
