<?php

namespace App\Command;

use App\Entity\EconomicReminder;
use App\Entity\Notification;
use App\Repository\EconomicReminderRepository;
use App\Repository\UserRepository;
use App\Service\PushNotificationService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * Cron command: dispara push notifications para reminders de eventos criticos
 * (NFP, CPI, PCE, PMI, FOMC) 15 minutos antes.
 *
 * Uso:
 *   php bin/console cal:check-reminders
 *   php bin/console cal:check-reminders --watch
 *   php bin/console cal:check-reminders --watch --interval=60
 *
 * Ideal correrlo via cron cada 1 minuto:
 *   * * * * * cd /path && php bin/console cal:check-reminders >> /var/log/cal-reminders.log 2>&1
 */
#[AsCommand(
    name: 'cal:check-reminders',
    description: 'Dispara notificaciones push para recordatorios de eventos criticos (15 min antes)',
)]
class CheckEconomicRemindersCommand extends Command
{
    public function __construct(
        private EntityManagerInterface $em,
        private EconomicReminderRepository $reminderRepository,
        private UserRepository $userRepository,
        private PushNotificationService $pushService,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('dry-run', null, InputOption::VALUE_NONE, 'Solo muestra lo que haria, no modifica nada');
        $this->addOption('watch', null, InputOption::VALUE_NONE, 'Loop infinito cada N segundos');
        $this->addOption('interval', null, InputOption::VALUE_REQUIRED, 'Segundos entre ejecuciones en --watch', 60);
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $dryRun = (bool) $input->getOption('dry-run');
        $watch = (bool) $input->getOption('watch');
        $interval = (int) $input->getOption('interval');

        do {
            $count = $this->processOnce($io, $dryRun);
            $output->writeln(sprintf('<info>[%s]</info> Reminders disparados: %d', date('Y-m-d H:i:s'), $count));
            if ($watch) {
                sleep(max(1, $interval));
            }
        } while ($watch);

        return Command::SUCCESS;
    }

    private function processOnce(SymfonyStyle $io, bool $dryRun): int
    {
        $now = new \DateTimeImmutable();
        $due = $this->reminderRepository->findDueForFiring($now);

        if (count($due) === 0) return 0;

        $fired = 0;
        foreach ($due as $reminder) {
            $user = $reminder->getUser();
            if (!$user || !$user->isActive()) {
                if (!$dryRun) $reminder->cancel();
                continue;
            }

            $title = '⚠️ TNSVT — ' . $reminder->getEventTitle() . ' en 15 min';
            $body = sprintf(
                'Cerrá posiciones de riesgo. Ventana de no-operar: %s %s %s.',
                $reminder->getEventTime(),
                $reminder->getTimezone(),
                $reminder->getEventCurrency() ?? ''
            );

            if (!$dryRun) {
                $notification = new Notification();
                $notification->setUser($user);
                $notification->setType('economic_alert');
                $notification->setContent($body);
                $notification->setLink('tab-calendar');
                $this->em->persist($notification);

                $this->pushService->sendToUser($user, $title, $body, [
                    'event_title' => $reminder->getEventTitle() ?? '',
                    'event_date' => $reminder->getEventDate() ?? '',
                    'event_time' => $reminder->getEventTime() ?? '',
                    'type' => 'economic_alert',
                ]);

                $reminder->markFired();
                $fired++;
                $io->writeln(sprintf('  ✓ Fired reminder #%d for %s: %s', $reminder->getId(), $user->getCode(), $reminder->getEventTitle()));
            }
        }

        if (!$dryRun && $fired > 0) {
            $this->em->flush();
        }

        return $fired;
    }
}
