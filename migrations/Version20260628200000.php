<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260628200000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create trading_accounts table + add account_id to trades + backfill default account for each user';
    }

    public function up(Schema $schema): void
    {
        // 1. Crear tabla trading_accounts
        $this->addSql('CREATE TABLE trading_accounts (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, user_id INTEGER NOT NULL, name VARCHAR(50) NOT NULL, account_size NUMERIC(12, 2) DEFAULT 10000 NOT NULL, color VARCHAR(20) DEFAULT \'#d4af37\' NOT NULL, icon VARCHAR(20) DEFAULT \'💰\' NOT NULL, is_active BOOLEAN DEFAULT 1 NOT NULL, deleted_at DATETIME DEFAULT NULL, sort_order INTEGER DEFAULT 0 NOT NULL, created_at DATETIME NOT NULL, CONSTRAINT FK_xxx FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE INDEX IDX_TA_USER ON trading_accounts (user_id)');
        $this->addSql('CREATE INDEX idx_ta_user_active ON trading_accounts (user_id, is_active, deleted_at)');

        // 2. Agregar columna account_id a trades
        $this->addSql('ALTER TABLE trades ADD COLUMN account_id INTEGER DEFAULT NULL');

        // 3. Backfill: para cada user existente, crear "Cuenta Principal" con $10000
        $conn = $this->connection;
        $now = date('Y-m-d H:i:s');
        $users = $conn->fetchAllAssociative('SELECT id FROM users');

        foreach ($users as $u) {
            $userId = $u['id'];
            // Crear cuenta principal para este user
            $conn->executeStatement(
                'INSERT INTO trading_accounts (user_id, name, account_size, color, icon, is_active, sort_order, created_at) VALUES (?, ?, ?, ?, ?, 1, 0, ?)',
                [$userId, 'Cuenta Principal', '10000.00', '#d4af37', '💰', $now]
            );
            // Obtener ID de la cuenta recién creada
            $accountId = $conn->lastInsertId();
            // Asignar todos los trades existentes de este user a esa cuenta
            $conn->executeStatement(
                'UPDATE trades SET account_id = ? WHERE user_id = ?',
                [$accountId, $userId]
            );
        }

        // 4. Crear FK en account_id (lo creamos al final para que el backfill funcione sin violar constraints)
        // SQLite no permite agregar FK a una tabla existente, así que usamos un trigger o validación a nivel app
    }

    public function down(Schema $schema): void
    {
        // SQLite no permite drop FK constraints fácilmente, pero al revertir dejamos la columna account_id nullable
        $this->addSql('ALTER TABLE trades DROP COLUMN account_id');
        $this->addSql('DROP TABLE trading_accounts');
    }
}
