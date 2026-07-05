<?php

namespace App\Command;

use Doctrine\DBAL\Connection;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand('tnsvt:reset-web-data', 'Truncate all web-platform user content (keeps users, tasks, game data, wallet)')]
class ResetWebDataCommand extends Command
{
    private Connection $conn;

    public function __construct(Connection $conn)
    {
        parent::__construct();
        $this->conn = $conn;
    }

    protected function configure(): void
    {
        $this->addOption('force', 'f', InputOption::VALUE_NONE, 'Skip confirmation');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $io->warning('This will DELETE all web-platform user content: trades, posts, chats, notifications, diary, social connections, etc.');
        $io->warning('Users, tasks, academia content, game data, wallet transactions, and market candles will be PRESERVED.');

        if (!$input->getOption('force') && !$io->confirm('Are you sure?', false)) {
            $io->info('Cancelled.');
            return Command::SUCCESS;
        }

        $tables = [
            'trades',
            'feed_posts',
            'liked_posts',
            'conversations',
            'conversation_participants',
            'messages',
            'notifications',
            'diary_entries',
            'access_requests',
            'connections',
            'journal_permissions',
            'journal_settings',
            'module_progress',
            'devices',
        ];

        $this->conn->executeStatement('PRAGMA foreign_keys = OFF');

        foreach ($tables as $table) {
            $io->text("Clearing {$table}...");
            $this->conn->executeStatement("DELETE FROM \"{$table}\"");
        }

        $this->conn->executeStatement('PRAGMA foreign_keys = ON');

        // Reset auto-increment counters
        $this->conn->executeStatement("DELETE FROM sqlite_sequence WHERE name IN ('trades','feed_posts','liked_posts','conversations','messages','notifications','diary_entries','access_requests','connections','journal_permissions','journal_settings','devices')");

        // Clear avatar files
        $avatarDir = __DIR__ . '/../../public/uploads/avatars';
        if (is_dir($avatarDir)) {
            $files = glob($avatarDir . '/*');
            $count = 0;
            foreach ($files as $f) {
                if (is_file($f)) {
                    unlink($f);
                    $count++;
                }
            }
            $io->text("Deleted {$count} avatar files.");
        }

        $io->success('Web platform data reset complete!');
        $io->note('Users should clear their browser localStorage/sessionStorage or log out and log back in.');

        return Command::SUCCESS;
    }
}
