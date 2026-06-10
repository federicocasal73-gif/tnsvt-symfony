<?php

namespace App\Command;

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
            [
                'code' => 'DEMO',
                'name' => 'Demo',
                'roles' => ['ROLE_USER'],
            ],
            [
                'code' => 'ADMIN01',
                'name' => 'Admin',
                'roles' => ['ROLE_USER', 'ROLE_ADMIN'],
            ],
        ];

        $userRepository = $this->entityManager->getRepository(User::class);

        foreach ($usersData as $data) {
            $existing = $userRepository->findOneBy(['code' => $data['code']]);
            if ($existing !== null) {
                $output->writeln(sprintf('User "%s" already exists, skipping.', $data['code']));
                continue;
            }

            $user = new User();
            $user->setCode($data['code']);
            $user->setName($data['name']);
            $user->setRoles($data['roles']);

            $this->entityManager->persist($user);
            $output->writeln(sprintf('Created user "%s".', $data['code']));
        }

        $this->entityManager->flush();

        $output->writeln('Seeding complete.');

        return Command::SUCCESS;
    }
}
