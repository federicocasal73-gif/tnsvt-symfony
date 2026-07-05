<?php

namespace App\Repository;

use App\Entity\Trade;
use App\Entity\TradingAccount;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class TradeRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Trade::class);
    }

    public function findByUser(User $user): array
    {
        return $this->findBy(['user' => $user], ['date' => 'DESC']);
    }

    public function findByUserAndAccount(User $user, TradingAccount $account): array
    {
        return $this->findBy(['user' => $user, 'account' => $account], ['date' => 'DESC']);
    }

    public function countByUserAndAccount(User $user, TradingAccount $account): int
    {
        return (int) $this->count(['user' => $user, 'account' => $account]);
    }

    public function computeStatsForUser(User $user): array
    {
        $result = $this->createQueryBuilder('t')
            ->select(
                'COUNT(t.id) as total',
                'SUM(CASE WHEN t.pnl >= 0 THEN 1 ELSE 0 END) as wins',
                'ROUND(COALESCE(SUM(t.pnl), 0), 2) as total_pnl'
            )
            ->where('t.user = :user')
            ->setParameter('user', $user)
            ->getQuery()
            ->getSingleResult();

        $total = (int) $result['total'];
        $wins = (int) $result['wins'];
        return [
            'total' => $total,
            'wins' => $wins,
            'losses' => $total - $wins,
            'win_rate' => $total > 0 ? round($wins / $total * 100, 1) : 0,
            'total_pnl' => (float) $result['total_pnl'],
        ];
    }
}

