<?php

namespace App\Repository;

use App\Entity\JournalEntry;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<JournalEntry>
 */
class JournalEntryRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, JournalEntry::class);
    }

    /**
     * @return JournalEntry[]
     */
    public function findSinceForUser(string $userCode, int $sinceTs): array
    {
        $sinceDt = (new \DateTimeImmutable())->setTimestamp($sinceTs);
        return $this->createQueryBuilder('j')
            ->where('j.userCode = :uc')
            ->andWhere('j.updatedAt > :since')
            ->setParameter('uc', $userCode)
            ->setParameter('since', $sinceDt)
            ->orderBy('j.updatedAt', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findAllForUser(string $userCode): array
    {
        return $this->findBy(['userCode' => $userCode], ['updatedAt' => 'DESC']);
    }
}
