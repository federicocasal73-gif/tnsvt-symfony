<?php

namespace App\Command;

use Doctrine\DBAL\Connection;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand('tnsvt:clear-chat-notif', 'Clear ONLY chat (conversations + messages) and notifications — keeps everything else')]
class ClearChatNotifCommand extends Command
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

        $io->warning('This will DELETE all chat conversations, messages, and notifications.');
        $io->warning('Everything else (trades, posts, social connections, diary, users, etc.) will be PRESERVED.');

        if (!$input->getOption('force') && !$io->confirm('Are you sure?', false)) {
            $io->info('Cancelled.');
            return Command::SUCCESS;
        }

        $tables = [
            'messages'                  => 'chat messages',
            'conversation_participants' => 'conversation participants',
            'conversations'             => 'conversations',
            'notifications'             => 'notifications',
        ];

        $this->conn->executeStatement('PRAGMA foreign_keys = OFF');

        $totalDeleted = 0;
        foreach ($tables as $table => $label) {
            $count = (int) $this->conn->fetchOne("SELECT COUNT(*) FROM \"{$table}\"");
            $this->conn->executeStatement("DELETE FROM \"{$table}\"");
            $io->text("Cleared {$label}: {$count} rows");
            $totalDeleted += $count;
        }

        // Reset auto-increment counters for the cleared tables
        $this->conn->executeStatement("DELETE FROM sqlite_sequence WHERE name IN ('messages','conversation_participants','conversations','notifications')");

        $this->conn->executeStatement('PRAGMA foreign_keys = ON');

        $io->success("Chat + notifications cleared! Total {$totalDeleted} rows deleted.");

        // Clear chat upload files (attachments)
        $chatUploadDir = __DIR__ . '/../../public/uploads/chat';
        if (is_dir($chatUploadDir)) {
            $files = glob($chatUploadDir . '/*');
            $count = 0;
            foreach ($files as $f) {
                if (is_file($f)) {
                    unlink($f);
                    $count++;
                }
            }
            $io->text("Deleted {$count} chat upload files.");
        }

        $io->note('Users should clear their browser localStorage/sessionStorage or log out and log back in to refresh client state.');

        return Command::SUCCESS;
    }
}
