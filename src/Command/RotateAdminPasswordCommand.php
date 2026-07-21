<?php

declare(strict_types=1);

namespace App\Command;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[AsCommand(
    name: 'app:rotate-admin-password',
    description: 'Rota la contraseña del usuario ADMIN01 al valor de ADMIN_PASSWORD (env). Para correr tras deploy en Hostinger si el hash quedó desfasado.'
)]
class RotateAdminPasswordCommand extends Command
{
    public function __construct(
        private readonly UserRepository $userRepository,
        private readonly UserPasswordHasherInterface $passwordHasher,
        private readonly EntityManagerInterface $entityManager,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('user-code', null, InputOption::VALUE_REQUIRED,
                'Código del usuario a rotar (default: ADMIN01)', 'ADMIN01')
            ->addOption('password', null, InputOption::VALUE_REQUIRED,
                'Contraseña en texto plano (si no, se lee de env ADMIN_PASSWORD)');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $code = strtoupper((string) $input->getOption('user-code'));
        $plain = (string) $input->getOption('password') ?: (string) ($_ENV['ADMIN_PASSWORD'] ?? '');

        if ($plain === '') {
            $io->error('No se especificó --password y ADMIN_PASSWORD no está definida en el entorno.');
            return Command::FAILURE;
        }

        $user = $this->userRepository->findOneBy(['code' => $code]);
        if (!$user instanceof User) {
            $io->error("Usuario $code no existe.");
            return Command::FAILURE;
        }

        $isAdmin = in_array('ROLE_ADMIN', $user->getRoles(), true);
        if (!$isAdmin) {
            $io->warning("Usuario $code no tiene ROLE_ADMIN. La rotación sigue, pero no es un admin.");
        }

        $hashed = $this->passwordHasher->hashPassword($user, $plain);
        $user->setPassword($hashed);
        $this->entityManager->flush();

        $io->success(sprintf('Contraseña de %s rotada (hash bcrypt actualizado).', $code));
        $io->note([
            'Importante:',
            '• El cambio es inmediato en DB.',
            '• No es necesario limpiar sesiones en otros devices (la sesión PHP se mantiene 24h).',
            '• La próxima vez que un cliente intente login, la nueva contraseña funcionará.',
        ]);

        return Command::SUCCESS;
    }
}