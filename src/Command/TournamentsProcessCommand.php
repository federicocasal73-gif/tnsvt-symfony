<?php

namespace App\Command;

use App\Entity\Tournament;
use App\Entity\TournamentEntry;
use App\Entity\WalletTransaction;
use App\Repository\TournamentEntryRepository;
use App\Repository\TournamentRepository;
use App\Service\TournamentMailer;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * Cron command: auto-cierra torneos que llegaron a su end_date
 * y distribuye el prize pool entre los winners.
 *
 * Uso:
 *   php bin/console tournaments:process            # 1 ejecucion
 *   php bin/console tournaments:process --dry-run   # solo muestra, no modifica
 *   php bin/console tournaments:process --watch     # loop infinito (cron interno)
 *   php bin/console tournaments:process --watch --interval=30  # loop cada 30s
 *
 * Ideal correrlo via cron cada 1 minuto:
 *   * * * * * cd /path && php bin/console tournaments:process >> /var/log/tournaments.log 2>&1
 *
 * O como proceso background en el server (mas simple, sin cron):
 *   nohup php bin/console tournaments:process --watch >> /var/log/tournaments.log 2>&1 &
 */
#[AsCommand(
    name: 'tournaments:process',
    description: 'Auto-cierra torneos vencidos y distribuye prize pools',
)]
class TournamentsProcessCommand extends Command
{
    public function __construct(
        private EntityManagerInterface $em,
        private TournamentRepository $tournamentRepository,
        private TournamentEntryRepository $entryRepository,
        private TournamentMailer $tournamentMailer,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('dry-run', null, InputOption::VALUE_NONE, 'Solo muestra lo que haria, no modifica nada');
        $this->addOption('watch', null, InputOption::VALUE_NONE, 'Corre en loop infinito cada N segundos (default 60)');
        $this->addOption('interval', null, InputOption::VALUE_REQUIRED, 'Segundos entre ejecuciones en modo --watch', 60);
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $dryRun = (bool) $input->getOption('dry-run');
        $watch = (bool) $input->getOption('watch');
        $interval = (int) $input->getOption('interval');

        if ($watch) {
            $io->writeln(sprintf('🔁 Watch mode ON - corriendo cada %d segundos. Ctrl+C para parar.', $interval));
            while (true) {
                $this->processOnce($io, $dryRun);
                $io->writeln(sprintf('⏱  Esperando %d segundos...', $interval));
                sleep($interval);
            }
        }

        return $this->processOnce($io, $dryRun);
    }

    private function processOnce(SymfonyStyle $io, bool $dryRun): int
    {
        if ($dryRun) {
            $io->warning('DRY RUN - no se modificara nada en la DB');
        }

        $now = new \DateTimeImmutable();
        $expired = $this->tournamentRepository->findExpiredActive();

        if (empty($expired)) {
            $io->info(sprintf('No hay torneos vencidos (%s).', $now->format('c')));
            return Command::SUCCESS;
        }

        $io->section(sprintf('Procesando %d torneo(s) vencido(s):', count($expired)));

        $totalDistributed = 0;
        foreach ($expired as $t) {
            $io->writeln(sprintf('  - [%d] %s (entry_fee: $%s, participants: %d, min: %d)',
                $t->getId(), $t->getName(), $t->getEntryFee(), $t->getEntries()->count(), $t->getMinPlayers()));

            if ($t->getEntries()->count() < $t->getMinPlayers()) {
                $io->writeln(sprintf('    <comment>Solo %d participants (min %d) - cancelando y refunding</comment>',
                    $t->getEntries()->count(), $t->getMinPlayers()));

                if (!$dryRun) {
                    $this->cancelTournament($t);
                }
                continue;
            }

            if (!$dryRun) {
                $distributed = $this->closeAndDistribute($t, $io);
                $totalDistributed += $distributed;
            } else {
                $io->writeln('    <info>[dry-run] cerraria y distribuiria prize pool</info>');
            }
        }

        if (!$dryRun) {
            $io->success(sprintf('Listo. Total distribuido: $%.2f USD', $totalDistributed));
        }
        return Command::SUCCESS;
    }

    private function closeAndDistribute(Tournament $t, SymfonyStyle $io): float
    {
        $entries = $this->entryRepository->getLeaderboard($t);
        $dist = $t->getDistributionPcts();
        $prizePool = (float) $t->getPrizePool() + count($entries) * (float) $t->getEntryFee();

        $i = 0;
        foreach ($entries as $entry) {
            $rank = $i + 1;
            $entry->setFinalRank($rank);

            $pct = $dist[$i] ?? 0;
            $payout = ($prizePool * $pct) / 100;
            $entry->setPayoutAmount(number_format($payout, 2, '.', ''));
            $entry->setStatus(TournamentEntry::STATUS_FINISHED);
            $entry->setFinalizedAt(new \DateTimeImmutable());

            if ($payout > 0 && $entry->getUser()) {
                $entry->getUser()->addToWallet($payout);
                $tx = new WalletTransaction();
                $tx->setUser($entry->getUser());
                $tx->setType(WalletTransaction::TYPE_PAYOUT);
                $tx->setAmount(number_format($payout, 2, '.', ''));
                $tx->setCurrency('USD');
                $tx->setStatus(WalletTransaction::STATUS_CONFIRMED);
                $tx->setRefTournament($t);
                $tx->setNotes(sprintf("Payout rank #%d - auto-close - Tournament: %s", $rank, $t->getName()));
                $tx->setConfirmedAt(new \DateTimeImmutable());
                $this->em->persist($tx);
            }
            $i++;
        }

        $maxRank = count($dist);
        foreach ($entries as $idx => $entry) {
            if ($idx >= $maxRank && $entry->getFinalRank() === null) {
                $entry->setFinalRank($idx + 1);
                $entry->setStatus(TournamentEntry::STATUS_FINISHED);
                $entry->setFinalizedAt(new \DateTimeImmutable());
            }
        }

        $t->setStatus(Tournament::STATUS_FINISHED);
        $t->setFinishedAt(new \DateTimeImmutable());
        $t->setPrizePool(number_format($prizePool, 2, '.', ''));
        $this->em->flush();

        // Notificar a los participantes (best-effort)
        try {
            $emailsSent = $this->tournamentMailer->notifyTournamentClosed($t);
            $io->writeln(sprintf('    <info>📧 %d emails enviados</info>', $emailsSent));
        } catch (\Throwable $e) {
            $io->warning('Error enviando emails: ' . $e->getMessage());
        }

        $io->writeln(sprintf('    <info>✓ Cerrado. Prize pool: $%.2f, %d winners</info>',
            $prizePool, min($maxRank, count($entries))));

        return $prizePool;
    }

    private function cancelTournament(Tournament $t): void
    {
        $entryFee = (float) $t->getEntryFee();
        foreach ($t->getEntries() as $entry) {
            if ($entry->isActive() && $entry->getUser()) {
                $entry->getUser()->addToWallet($entryFee);
                $tx = new WalletTransaction();
                $tx->setUser($entry->getUser());
                $tx->setType(WalletTransaction::TYPE_REFUND);
                $tx->setAmount(number_format($entryFee, 2, '.', ''));
                $tx->setCurrency('USD');
                $tx->setStatus(WalletTransaction::STATUS_CONFIRMED);
                $tx->setRefTournament($t);
                $tx->setNotes(sprintf("Refund - auto-cancel - Tournament: %s", $t->getName()));
                $tx->setConfirmedAt(new \DateTimeImmutable());
                $this->em->persist($tx);
                $entry->setStatus(TournamentEntry::STATUS_DISQUALIFIED);
            }
        }
        $t->setStatus(Tournament::STATUS_CANCELLED);
        $t->setFinishedAt(new \DateTimeImmutable());
        $this->em->flush();
    }
}
