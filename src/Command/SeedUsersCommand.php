<?php

namespace App\Command;

use App\Entity\Conversation;
use App\Entity\ConversationParticipant;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(name: 'app:seed-users')]
class SeedUsersCommand extends Command
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $usersData = [
            ['code' => 'DEMO', 'name' => 'Demo', 'roles' => ['ROLE_USER']],
            ['code' => 'ADMIN01', 'name' => 'Admin', 'roles' => ['ROLE_USER', 'ROLE_ADMIN']],
            ['code' => 'EXEC01', 'name' => 'Carlos', 'roles' => ['ROLE_USER']],
            ['code' => 'EXEC02', 'name' => 'María', 'roles' => ['ROLE_USER']],
            ['code' => 'EXEC03', 'name' => 'Diego', 'roles' => ['ROLE_USER']],
        ];

        $userRepository = $this->entityManager->getRepository(User::class);
        $allUsers = [];

        foreach ($usersData as $data) {
            $existing = $userRepository->findOneBy(['code' => $data['code']]);
            if ($existing !== null) {
                $output->writeln(sprintf('User "%s" already exists, skipping.', $data['code']));
                $allUsers[$data['code']] = $existing;
                continue;
            }

            $user = new User();
            $user->setCode($data['code']);
            $user->setName($data['name']);
            $user->setRoles($data['roles']);

            $this->entityManager->persist($user);
            $output->writeln(sprintf('Created user "%s".', $data['code']));
            $allUsers[$data['code']] = $user;
        }

        $this->entityManager->flush();

        // Group conversation
        $convRepo = $this->entityManager->getRepository(Conversation::class);
        $group = $convRepo->findOneBy(['type' => Conversation::TYPE_GROUP]);
        if (!$group) {
            $group = new Conversation();
            $group->setType(Conversation::TYPE_GROUP);
            $group->setTitle('Ejecutores');
            $this->entityManager->persist($group);
            $output->writeln('Created group conversation "Ejecutores".');
        } else {
            $output->writeln('Group conversation "Ejecutores" already exists, skipping.');
        }

        // Add all users as participants (idempotent)
        foreach ($usersData as $data) {
            $code = $data['code'];
            if (!isset($allUsers[$code])) {
                $allUsers[$code] = $userRepository->findOneBy(['code' => $code]);
            }
            $user = $allUsers[$code];
            if (!$user) continue;

            $alreadyParticipant = false;
            foreach ($group->getParticipants() as $p) {
                if ($p->getUser()?->getId() === $user->getId()) {
                    $alreadyParticipant = true;
                    break;
                }
            }
            if (!$alreadyParticipant) {
                $participant = new ConversationParticipant();
                $participant->setConversation($group);
                $participant->setUser($user);
                $this->entityManager->persist($participant);
                $output->writeln(sprintf('Added "%s" to group.', $code));
            }
        }

        $this->entityManager->flush();
        $output->writeln('Seeding complete.');

        return Command::SUCCESS;
    }
}
