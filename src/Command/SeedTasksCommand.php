<?php

namespace App\Command;

use App\Entity\Task;
use App\Repository\TaskRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(name: 'app:seed-tasks')]
class SeedTasksCommand extends Command
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly TaskRepository $taskRepository,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $tasksData = [
            [
                'title' => 'Sintonización Inicial del Ser',
                'description' => 'Leer los módulos de identidad TNSVT (psi, tec, fun, fib, step).',
                'orden' => 1,
            ],
            [
                'title' => 'Mapeo de Liquidez Externa',
                'description' => 'Identificar 5 gráficos marcando Puntos A y zonas de barrido institucional.',
                'orden' => 2,
            ],
            [
                'title' => 'Análisis del PMI y Diferenciales',
                'description' => 'Mapear divergencia de políticas monetarias entre FED y BCE.',
                'orden' => 3,
            ],
            [
                'title' => 'Reporte Diario de Operación',
                'description' => 'Cargar al menos 1 operación en el Trading Journal con foto y notas.',
                'orden' => 4,
            ],
            [
                'title' => 'Estudio de Metodología 2 Steps',
                'description' => 'Desbloquear y completar los módulos BOS, LG, Entrada, TF y Checklist.',
                'orden' => 5,
            ],
        ];

        $created = 0;
        foreach ($tasksData as $data) {
            $existing = $this->taskRepository->findOneBy(['title' => $data['title']]);
            if ($existing !== null) {
                $output->writeln(sprintf('Task "%s" already exists, skipping.', $data['title']));
                continue;
            }

            $task = new Task();
            $task->setTitle($data['title']);
            $task->setDescription($data['description']);
            $task->setOrden($data['orden']);
            $task->setActive(true);
            $task->setCreatedAt(new \DateTimeImmutable());

            $this->entityManager->persist($task);
            $output->writeln(sprintf('Created task "%s".', $data['title']));
            $created++;
        }

        $this->entityManager->flush();
        $output->writeln(sprintf('Seeding complete. %d task(s) created.', $created));

        return Command::SUCCESS;
    }
}
