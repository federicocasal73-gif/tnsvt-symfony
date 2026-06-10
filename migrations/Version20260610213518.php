<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260610213518 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE academia_content (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, title VARCHAR(255) NOT NULL, subtitle VARCHAR(255) DEFAULT NULL, emoji VARCHAR(255) DEFAULT NULL, description CLOB DEFAULT NULL, video_url VARCHAR(500) DEFAULT NULL, orden INTEGER DEFAULT 0 NOT NULL, locked BOOLEAN DEFAULT 1 NOT NULL, lessons CLOB DEFAULT NULL)');
        $this->addSql('CREATE TABLE feed_posts (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, content CLOB NOT NULL, category VARCHAR(50) NOT NULL, likes INTEGER DEFAULT 0 NOT NULL, comments CLOB DEFAULT NULL, signal CLOB DEFAULT NULL, photo CLOB DEFAULT NULL, created_at DATETIME NOT NULL, author_id INTEGER NOT NULL, CONSTRAINT FK_7DD2E946F675F31B FOREIGN KEY (author_id) REFERENCES users (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE INDEX IDX_7DD2E946F675F31B ON feed_posts (author_id)');
        $this->addSql('CREATE TABLE liked_posts (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, user_id INTEGER NOT NULL, post_id INTEGER NOT NULL, CONSTRAINT FK_96D8B43CA76ED395 FOREIGN KEY (user_id) REFERENCES users (id) NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_96D8B43C4B89032C FOREIGN KEY (post_id) REFERENCES feed_posts (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE INDEX IDX_96D8B43CA76ED395 ON liked_posts (user_id)');
        $this->addSql('CREATE INDEX IDX_96D8B43C4B89032C ON liked_posts (post_id)');
        $this->addSql('CREATE TABLE module_progress (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, module_id VARCHAR(50) NOT NULL, completed BOOLEAN DEFAULT 0 NOT NULL, completed_at DATETIME DEFAULT NULL, user_id INTEGER NOT NULL, CONSTRAINT FK_46C121B8A76ED395 FOREIGN KEY (user_id) REFERENCES users (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE INDEX IDX_46C121B8A76ED395 ON module_progress (user_id)');
        $this->addSql('CREATE TABLE notifications (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, type VARCHAR(50) NOT NULL, content CLOB NOT NULL, is_read BOOLEAN DEFAULT 0 NOT NULL, created_at DATETIME NOT NULL, user_id INTEGER NOT NULL, CONSTRAINT FK_6000B0D3A76ED395 FOREIGN KEY (user_id) REFERENCES users (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE INDEX IDX_6000B0D3A76ED395 ON notifications (user_id)');
        $this->addSql('CREATE TABLE trades (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, date DATETIME NOT NULL, asset VARCHAR(20) NOT NULL, direction VARCHAR(10) NOT NULL, entry VARCHAR(50) DEFAULT NULL, sl VARCHAR(50) DEFAULT NULL, tp VARCHAR(50) DEFAULT NULL, result VARCHAR(20) NOT NULL, pnl NUMERIC(12, 2) DEFAULT 0 NOT NULL, ratio VARCHAR(20) DEFAULT NULL, notes CLOB DEFAULT NULL, photos CLOB DEFAULT NULL, user_id INTEGER NOT NULL, CONSTRAINT FK_BFA11125A76ED395 FOREIGN KEY (user_id) REFERENCES users (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE INDEX IDX_BFA11125A76ED395 ON trades (user_id)');
        $this->addSql('CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, code VARCHAR(50) NOT NULL, name VARCHAR(100) NOT NULL, active BOOLEAN DEFAULT 1 NOT NULL, last_login DATETIME DEFAULT NULL, roles CLOB NOT NULL, password VARCHAR(255) DEFAULT NULL)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_1483A5E977153098 ON users (code)');
        $this->addSql('CREATE TABLE messenger_messages (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, body CLOB NOT NULL, headers CLOB NOT NULL, queue_name VARCHAR(190) NOT NULL, created_at DATETIME NOT NULL, available_at DATETIME NOT NULL, delivered_at DATETIME DEFAULT NULL)');
        $this->addSql('CREATE INDEX IDX_75EA56E0FB7336F0E3BD61CE16BA31DBBF396750 ON messenger_messages (queue_name, available_at, delivered_at, id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP TABLE academia_content');
        $this->addSql('DROP TABLE feed_posts');
        $this->addSql('DROP TABLE liked_posts');
        $this->addSql('DROP TABLE module_progress');
        $this->addSql('DROP TABLE notifications');
        $this->addSql('DROP TABLE trades');
        $this->addSql('DROP TABLE users');
        $this->addSql('DROP TABLE messenger_messages');
    }
}
