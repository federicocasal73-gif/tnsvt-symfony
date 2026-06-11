<?php

namespace App\Repository;

use App\Entity\Conversation;
use App\Entity\ConversationParticipant;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Conversation>
 */
class ConversationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Conversation::class);
    }

    /**
     * Singleton: the group conversation (type='group').
     */
    public function findGroupConversation(): ?Conversation
    {
        return $this->findOneBy(['type' => Conversation::TYPE_GROUP]);
    }

    /**
     * Conversations where the user is a participant, ordered by most recent message.
     * Returns array of [Conversation, lastMessage, unreadCount].
     *
     * @return array<int, array{conv: Conversation, lastMessage: ?\App\Entity\Message, unreadCount: int}>
     */
    public function findByParticipant(User $user): array
    {
        $em = $this->getEntityManager();

        // Subquery: ids of conversations the user participates in
        $participantConvIds = $em->createQueryBuilder()
            ->select('IDENTITY(p.conversation)')
            ->from(ConversationParticipant::class, 'p')
            ->andWhere('p.user = :u')
            ->setParameter('u', $user)
            ->getQuery()
            ->getSingleColumnResult();

        if (empty($participantConvIds)) {
            return [];
        }

        // Load conversations
        $convs = $this->createQueryBuilder('c')
            ->andWhere('c.id IN (:ids)')
            ->setParameter('ids', $participantConvIds)
            ->orderBy('c.createdAt', 'DESC')
            ->getQuery()
            ->getResult();

        $result = [];
        foreach ($convs as $conv) {
            // Last message
            $lastMessage = $em->createQueryBuilder()
                ->select('m')
                ->from(\App\Entity\Message::class, 'm')
                ->andWhere('m.conversation = :c')
                ->setParameter('c', $conv)
                ->orderBy('m.id', 'DESC')
                ->setMaxResults(1)
                ->getQuery()
                ->getOneOrNullResult();

            // Unread count: messages older than user's lastReadAt (or all if never read)
            $participant = $em->createQueryBuilder()
                ->select('p')
                ->from(ConversationParticipant::class, 'p')
                ->andWhere('p.conversation = :c')
                ->andWhere('p.user = :u')
                ->setParameter('c', $conv)
                ->setParameter('u', $user)
                ->getQuery()
                ->getOneOrNullResult();

            $unread = 0;
            if ($lastMessage) {
                $lastRead = $participant?->getLastReadAt();
                $qb = $em->createQueryBuilder()
                    ->select('COUNT(m.id)')
                    ->from(\App\Entity\Message::class, 'm')
                    ->andWhere('m.conversation = :c')
                    ->andWhere('m.sender != :u OR m.sender IS NULL')
                    ->setParameter('c', $conv)
                    ->setParameter('u', $user);
                if ($lastRead) {
                    $qb->andWhere('m.createdAt > :lr')->setParameter('lr', $lastRead);
                }
                $unread = (int) $qb->getQuery()->getSingleScalarResult();
            }

            $result[] = [
                'conv' => $conv,
                'lastMessage' => $lastMessage,
                'unreadCount' => $unread,
            ];
        }

        return $result;
    }

    /**
     * Find or create a DM between two users. For Fase B — unused in Fase A.
     */
    public function findOrCreateDm(User $a, User $b): Conversation
    {
        if ($a === $b) {
            throw new \InvalidArgumentException('No se puede crear un DM con uno mismo');
        }

        // Find a DM where both are participants
        $existing = $this->createQueryBuilder('c')
            ->andWhere('c.type = :type')
            ->setParameter('type', Conversation::TYPE_DM)
            ->join('c.participants', 'p1', 'WITH', 'p1.user = :a')
            ->join('c.participants', 'p2', 'WITH', 'p2.user = :b')
            ->setParameter('a', $a)
            ->setParameter('b', $b)
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();

        if ($existing) return $existing;

        $conv = new Conversation();
        $conv->setType(Conversation::TYPE_DM);
        $em = $this->getEntityManager();
        $em->persist($conv);

        foreach ([$a, $b] as $user) {
            $p = new ConversationParticipant();
            $p->setConversation($conv);
            $p->setUser($user);
            $em->persist($p);
        }
        $em->flush();

        return $conv;
    }
}
