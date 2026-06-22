<?php

namespace App\Controller\Api;

use App\Entity\MonitorEvent;
use App\Repository\MonitorEventRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/monitoring')]
class MonitoringController extends AbstractController
{
    public function __construct(
        private MonitorEventRepository $monitorEventRepository,
        private EntityManagerInterface $em,
    ) {}

    #[Route('/log', name: 'api_monitoring_log', methods: ['GET'])]
    public function getLogs(Request $request): JsonResponse
    {
        $userCode = $request->query->get('user_code');
        $level = $request->query->get('level');
        $limit = min(500, max(1, (int) $request->query->get('limit', 100)));

        $qb = $this->monitorEventRepository->createQueryBuilder('e')
            ->orderBy('e.createdAt', 'DESC')
            ->setMaxResults($limit);

        if ($userCode) {
            $qb->andWhere('e.userCode = :code')->setParameter('code', strtoupper($userCode));
        }
        if ($level) {
            $qb->andWhere('e.level = :level')->setParameter('level', $level);
        }

        $events = $qb->getQuery()->getResult();

        return $this->json([
            'logs' => array_map(fn(MonitorEvent $e) => [
                'id' => $e->getId(),
                'level' => $e->getLevel(),
                'message' => $e->getMessage(),
                'stack' => $e->getStack(),
                'source' => $e->getSource(),
                'user_code' => $e->getUserCode(),
                'url' => $e->getUrl(),
                'created_at' => $e->getCreatedAt()->format('c'),
            ], $events),
        ]);
    }

    #[Route('/stats', name: 'api_monitoring_stats', methods: ['GET'])]
    public function getStats(Request $request): JsonResponse
    {
        $userCode = $request->query->get('user_code');
        $since = new \DateTimeImmutable('-24 hours');

        $qb = $this->monitorEventRepository->createQueryBuilder('e')
            ->select('e.level, COUNT(e.id) as cnt')
            ->where('e.createdAt >= :since')
            ->setParameter('since', $since)
            ->groupBy('e.level');

        if ($userCode) {
            $qb->andWhere('e.userCode = :code')->setParameter('code', strtoupper($userCode));
        }

        $rows = $qb->getQuery()->getArrayResult();

        $stats = ['error' => 0, 'warning' => 0, 'info' => 0, 'total' => 0];
        foreach ($rows as $row) {
            $lvl = strtolower($row['level']);
            if (isset($stats[$lvl])) $stats[$lvl] = (int) $row['cnt'];
            $stats['total'] += (int) $row['cnt'];
        }

        return $this->json($stats);
    }

    #[Route('/event', name: 'api_monitoring_event', methods: ['POST'])]
    public function createEvent(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true) ?? [];

        $level = $data['level'] ?? 'info';
        if (!in_array($level, ['error', 'warning', 'info'], true)) {
            $level = 'info';
        }

        $event = new MonitorEvent();
        $event->setLevel($level);
        $event->setMessage((string) ($data['message'] ?? ''));
        $event->setStack($data['stack'] ?? null);
        $event->setSource((string) ($data['source'] ?? 'frontend'));
        $event->setUserCode(strtoupper((string) ($data['user_code'] ?? 'ANON')));
        $event->setUrl((string) ($data['url'] ?? ''));
        $event->setCreatedAt(new \DateTimeImmutable());

        $this->em->persist($event);
        $this->em->flush();

        return $this->json(['id' => $event->getId(), 'ok' => true], 201);
    }
}