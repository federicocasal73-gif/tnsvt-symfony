<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260706221000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add user_blocks table for real social blocking';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE user_blocks (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, created_at DATETIME NOT NULL, blocker_id INTEGER NOT NULL, blocked_id INTEGER NOT NULL, CONSTRAINT FK_USER_BLOCKS_BLOCKER FOREIGN KEY (blocker_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_USER_BLOCKS_BLOCKED FOREIGN KEY (blocked_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE INDEX idx_block_blocker ON user_blocks (blocker_id)');
        $this->addSql('CREATE UNIQUE INDEX uq_block ON user_blocks (blocker_id, blocked_id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE user_blocks');
    }
}
