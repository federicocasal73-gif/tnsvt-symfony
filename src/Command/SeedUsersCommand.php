<?php

namespace App\Command;

use App\Entity\Conversation;
use App\Entity\ConversationParticipant;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[AsCommand(name: 'app:seed-users', description: 'Siembra los usuarios iniciales del Reino TNSVT (admin, ejecutores y alumnos)')]
class SeedUsersCommand extends Command
{
    /** @var string Password por defecto del admin si no se especifica otra con --admin-password */
    public const DEFAULT_ADMIN_PASSWORD = 'TNSVT-2026-CristoRey!';

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly UserPasswordHasherInterface $passwordHasher,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('reset-admin', null, InputOption::VALUE_NONE,
                'Fuerza el cambio de contraseña del admin a la nueva (incluso si ya existe)')
            ->addOption('admin-password', null, InputOption::VALUE_REQUIRED,
                'Define una contraseña custom para el admin (ej: --admin-password=MiPass123!)')
            ->addOption('add-students', null, InputOption::VALUE_NONE,
                'Agrega SOLO los alumnos nuevos (ALUMNO12-20, EJECUTOR04-10) sin tocar los existentes');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $adminPassword = (string) ($input->getOption('admin-password') ?: self::DEFAULT_ADMIN_PASSWORD);
        $hashedPassword = $this->passwordHasher->hashPassword(new User(), $adminPassword);

        // Lista de usuarios a crear (idempotente: si ya existe, lo saltea)
        $usersData = [
            ['code' => 'DEMO', 'name' => 'Demo', 'roles' => ['ROLE_USER']],
            ['code' => 'ADMIN01', 'name' => 'Admin', 'roles' => ['ROLE_USER', 'ROLE_ADMIN']],
            // Ejecutores (4 → 10)
            ['code' => 'EXEC01', 'name' => 'Carlos', 'roles' => ['ROLE_USER']],
            ['code' => 'EXEC02', 'name' => 'María', 'roles' => ['ROLE_USER']],
            ['code' => 'EXEC03', 'name' => 'Diego', 'roles' => ['ROLE_USER']],
            ['code' => 'EXEC04', 'name' => 'Sofía', 'roles' => ['ROLE_USER']],
            ['code' => 'EXEC05', 'name' => 'Martín', 'roles' => ['ROLE_USER']],
            ['code' => 'EXEC06', 'name' => 'Lucía', 'roles' => ['ROLE_USER']],
            ['code' => 'EXEC07', 'name' => 'Joaquín', 'roles' => ['ROLE_USER']],
            ['code' => 'EXEC08', 'name' => 'Camila', 'roles' => ['ROLE_USER']],
            ['code' => 'EXEC09', 'name' => 'Tomás', 'roles' => ['ROLE_USER']],
            ['code' => 'EXEC10', 'name' => 'Valentina', 'roles' => ['ROLE_USER']],
            // Alumnos (1 → 20)
            ['code' => 'ALUMNO01', 'name' => 'Lucas', 'roles' => ['ROLE_USER']],
            ['code' => 'ALUMNO02', 'name' => 'Yesid', 'roles' => ['ROLE_USER']],
            ['code' => 'ALUMNO03', 'name' => 'Lucho', 'roles' => ['ROLE_USER']],
            ['code' => 'ALUMNO04', 'name' => 'Wiss', 'roles' => ['ROLE_USER']],
            ['code' => 'ALUMNO05', 'name' => 'Alejandro', 'roles' => ['ROLE_USER']],
            ['code' => 'ALUMNO06', 'name' => 'Guille', 'roles' => ['ROLE_USER']],
            ['code' => 'ALUMNO07', 'name' => 'Damian', 'roles' => ['ROLE_USER']],
            ['code' => 'ALUMNO08', 'name' => 'Aikme', 'roles' => ['ROLE_USER']],
            ['code' => 'ALUMNO09', 'name' => 'Matías', 'roles' => ['ROLE_USER']],
            ['code' => 'ALUMNO10', 'name' => 'Mijael', 'roles' => ['ROLE_USER']],
            ['code' => 'ALUMNO11', 'name' => 'Gustavo', 'roles' => ['ROLE_USER']],
            ['code' => 'ALUMNO12', 'name' => 'Federico', 'roles' => ['ROLE_USER']],
            ['code' => 'ALUMNO13', 'name' => 'Ramiro', 'roles' => ['ROLE_USER']],
            ['code' => 'ALUMNO14', 'name' => 'Joana', 'roles' => ['ROLE_USER']],
            ['code' => 'ALUMNO15', 'name' => 'Bruno', 'roles' => ['ROLE_USER']],
            ['code' => 'ALUMNO16', 'name' => 'Carla', 'roles' => ['ROLE_USER']],
            ['code' => 'ALUMNO17', 'name' => 'Nahuel', 'roles' => ['ROLE_USER']],
            ['code' => 'ALUMNO18', 'name' => 'Esteban', 'roles' => ['ROLE_USER']],
            ['code' => 'ALUMNO19', 'name' => 'Florencia', 'roles' => ['ROLE_USER']],
            ['code' => 'ALUMNO20', 'name' => 'Maximiliano', 'roles' => ['ROLE_USER']],
        ];

        $resetAdmin = (bool) $input->getOption('reset-admin');
        $userRepository = $this->entityManager->getRepository(User::class);
        $created = 0;
        $skipped = 0;
        $allUsers = [];

        foreach ($usersData as $data) {
            $existing = $userRepository->findOneBy(['code' => $data['code']]);
            if ($existing !== null) {
                $skipped++;
                $allUsers[$data['code']] = $existing;
                continue;
            }
            $user = new User();
            $user->setCode($data['code']);
            $user->setName($data['name']);
            $user->setRoles($data['roles']);
            $this->entityManager->persist($user);
            $created++;
            $allUsers[$data['code']] = $user;
        }

        // Password del admin: si --reset-admin, sobrescribimos SIEMPRE el del admin existente
        $adminUser = $allUsers['ADMIN01'] ?? $userRepository->findOneBy(['code' => 'ADMIN01']);
        if ($adminUser instanceof User) {
            if ($resetAdmin || !$adminUser->getPassword()) {
                $adminUser->setPassword($hashedPassword);
                $io->writeln(sprintf('🔐 Contraseña del admin <info>ADMIN01</info> actualizada: <comment>%s</comment>', $adminPassword));
            } else {
                $io->writeln('🔐 Admin ADMIN01 ya tenía contraseña, no se tocó (usá --reset-admin para cambiarla).');
            }
        } else {
            $io->warning('No se encontró el usuario ADMIN01. Creálo primero corriendo el seed completo.');
        }

        $this->entityManager->flush();

        $io->success(sprintf('Usuarios: %d creados, %d ya existían (idempotente).', $created, $skipped));
        $io->writeln(sprintf('📊 Total: <info>%d usuarios</info> en el sistema.', count($allUsers)));

        // Conversación grupal "Ejecutores"
        $convRepo = $this->entityManager->getRepository(Conversation::class);
        $group = $convRepo->findOneBy(['type' => Conversation::TYPE_GROUP]);
        if (!$group) {
            $group = new Conversation();
            $group->setType(Conversation::TYPE_GROUP);
            $group->setTitle('Ejecutores');
            $this->entityManager->persist($group);
            $io->writeln('💬 Conversación grupal "Ejecutores" creada.');
        } else {
            $io->writeln('💬 Conversación grupal "Ejecutores" ya existía.');
        }

        // Agregar todos al grupo (idempotente)
        $added = 0;
        foreach ($usersData as $data) {
            $code = $data['code'];
            $user = $allUsers[$code] ?? $userRepository->findOneBy(['code' => $code]);
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
                $added++;
            }
        }
        $this->entityManager->flush();
        $io->writeln(sprintf('👥 Agregados al grupo: <info>%d</info> nuevos participantes.', $added));

        if ($resetAdmin || $input->getOption('admin-password')) {
            $io->note([
                'Credenciales del admin:',
                '   Código: ADMIN01',
                sprintf('   Contraseña: %s', $adminPassword),
                '',
                '⚠️  Cambiala en el primer login o pasame una con --admin-password=TuPass',
            ]);
        }

        return Command::SUCCESS;
    }
}
