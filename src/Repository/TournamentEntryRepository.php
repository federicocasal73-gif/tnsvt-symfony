<?php

namespace App\Repository;

use App\Entity\TournamentEntry;
use App\Entity\Tournament;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<TournamentEntry>
 */
class TournamentEntryRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TournamentEntry::class);
    }

    public function findUserEntry(Tournament $t, User $u): ?TournamentEntry
    {
        return $this->findOneBy(['tournament' => $t, 'user' => $u]);
    }

    /**
     * Leaderboard en vivo: todos los entries activos de un torneo
     * ordenados por pnl_pct DESC (los que mas ganaron arriba)
     */
    public function getLeaderboard(Tournament $t): array
    {
        return $this->createQueryBuilder('e')
            ->where('e.tournament = :t')
            ->andWhere('e.status = :active')
            ->setParameter('t', $t)
            ->setParameter('active', TournamentEntry::STATUS_ACTIVE)
            ->orderBy('e.pnlPct', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function getUserTournaments(User $u, bool $activeOnly = false): array
    {
        $qb = $this->createQueryBuilder('e')
            ->where('e.user = :user')
            ->setParameter('user', $u)
            ->orderBy('e.joinedAt', 'DESC');
        if ($activeOnly) {
            $qb->andWhere('e.status = :status')
               ->setParameter('status', TournamentEntry::STATUS_ACTIVE);
        }
        return $qb->getQuery()->getResult();
    }
}
