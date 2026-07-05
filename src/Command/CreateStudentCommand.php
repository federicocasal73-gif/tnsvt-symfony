<?php

namespace App\Command;

use App\Entity\Conversation;
use App\Entity\ConversationParticipant;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(name: 'app:create-student')]
class CreateStudentCommand extends Command
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addArgument('code', InputArgument::REQUIRED, 'Código del alumno (ej: ALUMNO12)')
            ->addArgument('name', InputArgument::REQUIRED, 'Nombre del alumno');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $code = strtoupper(trim($input->getArgument('code')));
        $name = trim($input->getArgument('name'));

        $userRepository = $this->entityManager->getRepository(User::class);
        $existing = $userRepository->findOneBy(['code' => $code]);

        if ($existing !== null) {
            $output->writeln(sprintf('El usuario "%s" ya existe.', $code));
            return Command::FAILURE;
        }

        $user = new User();
        $user->setCode($code);
        $user->setName($name);
        $user->setRoles(['ROLE_USER']);

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        $output->writeln(sprintf('Alumno "%s" (%s) creado correctamente.', $code, $name));

        return Command::SUCCESS;
    }
}