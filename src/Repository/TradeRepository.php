<?php

namespace App\Repository;

use App\Entity\Trade;
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
}
