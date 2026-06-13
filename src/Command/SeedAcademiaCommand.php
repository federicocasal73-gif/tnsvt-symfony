<?php

namespace App\Command;

use App\Entity\AcademiaContent;
use App\Repository\AcademiaContentRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(name: 'app:seed-academia')]
class SeedAcademiaCommand extends Command
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly AcademiaContentRepository $academiaRepository,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $coursesData = [
            [
                'title' => 'Psicología e Identidad Anclada',
                'subtitle' => 'Módulo 1: Dominá tu mente antes del mercado',
                'emoji' => '🧠',
                'description' => 'El dinero nunca fue tu problema real. Es el resultado visible de tu nivel de conexión subyacente. Aprendé a separarte emocionalmente de los resultados de tus operaciones para operar con precisión.',
                'videoUrl' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'orden' => 1,
                'locked' => false,
            ],
            [
                'title' => 'Análisis Técnico Algorítmico',
                'subtitle' => 'Módulo 2: La huella institucional',
                'emoji' => '📊',
                'description' => 'Rompemos el paradigma retail. El algoritmo interbancario no reconoce soportes ni resistencias como zonas de rebote, sino como piscinas de liquidez acumulada diseñadas para ser limpiadas.',
                'videoUrl' => null,
                'orden' => 2,
                'locked' => false,
            ],
            [
                'title' => 'Flujo Macro y Diferenciales',
                'subtitle' => 'Módulo 3: La energía detrás del gráfico',
                'emoji' => '🌐',
                'description' => 'El capital global busca rendimiento y seguridad. Analizá cómo los flujos entre monedas y los diferenciales de tasas generan las macro-tendencias que anulan cualquier patrón retail.',
                'videoUrl' => null,
                'orden' => 3,
                'locked' => false,
            ],
            [
                'title' => 'Niveles OTE Sagrados',
                'subtitle' => 'Módulo 4: La zona de descuento profunda',
                'emoji' => '🌀',
                'description' => 'Mapeá la zona óptima entre el 61.8%, 70.5% y 79% del retroceso. Es allí donde el precio se abarata lo suficiente para que los bancos promedien sus compras.',
                'videoUrl' => null,
                'orden' => 4,
                'locked' => false,
            ],
            [
                'title' => 'Lógica 2 Steps',
                'subtitle' => 'Módulo 5: BOS y LG como huellas unificadas',
                'emoji' => '⚡',
                'description' => 'La simplificación de la complejidad. Dos señales secuenciales limpias: un barrido de stops minoristas seguido de un cambio de dirección violento corporativo.',
                'videoUrl' => null,
                'orden' => 5,
                'locked' => false,
            ],
            [
                'title' => 'Trading Journal Profesional',
                'subtitle' => 'Módulo 6: Tu bitácora de ejecuciones',
                'emoji' => '📓',
                'description' => 'Sin registro no hay evolución. Aprendé a documentar cada operación con Entry, SL, TP, capturas y notas para construir tu edge estadística.',
                'videoUrl' => null,
                'orden' => 6,
                'locked' => false,
            ],
        ];

        $created = 0;
        foreach ($coursesData as $data) {
            $existing = $this->academiaRepository->findOneBy(['title' => $data['title']]);
            if ($existing !== null) {
                $output->writeln(sprintf('Course "%s" already exists, skipping.', $data['title']));
                continue;
            }

            $course = new AcademiaContent();
            $course->setTitle($data['title']);
            $course->setSubtitle($data['subtitle']);
            $course->setEmoji($data['emoji']);
            $course->setDescription($data['description']);
            $course->setVideoUrl($data['videoUrl']);
            $course->setOrden($data['orden']);
            $course->setLocked($data['locked']);
            $course->setLessons(null);

            $this->entityManager->persist($course);
            $output->writeln(sprintf('Created course "%s".', $data['title']));
            $created++;
        }

        $this->entityManager->flush();
        $output->writeln(sprintf('Seeding complete. %d course(s) created.', $created));

        return Command::SUCCESS;
    }
}
