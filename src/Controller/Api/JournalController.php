<?php

namespace App\Controller\Api;

use App\Entity\Trade;
use App\Repository\TradeRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/journal')]
class JournalController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private TradeRepository $tradeRepository,
        private UserRepository $userRepository,
    ) {}

    #[Route('', name: 'api_journal_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $userCode = $request->query->get('user_code');
        if (!$userCode) {
            return $this->json(['error' => 'Usuario requerido'], Response::HTTP_BAD_REQUEST);
        }

        $user = $this->userRepository->findByCode($userCode);
        if (!$user) {
            return $this->json(['error' => 'Usuario inválido'], Response::HTTP_UNAUTHORIZED);
        }

        $trades = $this->tradeRepository->findByUser($user);

        $data = array_map(function (Trade $t) {
            return [
                'id' => $t->getId(),
                'date' => $t->getDate()?->format('c'),
                'asset' => $t->getAsset(),
                'dir' => $t->getDirection(),
                'entry' => $t->getEntry(),
                'sl' => $t->getSl(),
                'tp' => $t->getTp(),
                'result' => $t->getResult(),
                'pnl' => (float) $t->getPnl(),
                'ratio' => $t->getRatio(),
                'notes' => $t->getNotes(),
                'photos' => $t->getPhotos() ?? [],
            ];
        }, $trades);

        return $this->json($data);
    }

    #[Route('', name: 'api_journal_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $userCode = $data['user_code'] ?? null;

        if (!$userCode) {
            return $this->json(['error' => 'Usuario requerido'], Response::HTTP_BAD_REQUEST);
        }

        $user = $this->userRepository->findByCode($userCode);
        if (!$user) {
            return $this->json(['error' => 'Usuario inválido'], Response::HTTP_UNAUTHORIZED);
        }

        $trade = new Trade();
        $trade->setUser($user);
        $trade->setAsset(strtoupper($data['asset'] ?? ''));
        $trade->setDirection($data['dir'] ?? 'BUY');
        $trade->setEntry($data['entry'] ?? null);
        $trade->setSl($data['sl'] ?? null);
        $trade->setTp($data['tp'] ?? null);
        $trade->setResult($data['result'] ?? 'WIN');
        $trade->setPnl((float) ($data['pnl'] ?? 0));
        $trade->setRatio($data['ratio'] ?? null);
        $trade->setNotes($data['notes'] ?? null);
        $trade->setPhotos($data['photos'] ?? null);

        if (isset($data['date'])) {
            $trade->setDate(new \DateTimeImmutable($data['date']));
        }

        $this->em->persist($trade);
        $this->em->flush();

        return $this->json(['success' => true, 'id' => $trade->getId()], Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'api_journal_update', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $trade = $this->tradeRepository->find($id);
        if (!$trade) {
            return $this->json(['error' => 'Trade no encontrado'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['asset'])) $trade->setAsset(strtoupper($data['asset']));
        if (isset($data['dir'])) $trade->setDirection($data['dir']);
        if (isset($data['entry'])) $trade->setEntry($data['entry']);
        if (isset($data['sl'])) $trade->setSl($data['sl']);
        if (isset($data['tp'])) $trade->setTp($data['tp']);
        if (isset($data['result'])) $trade->setResult($data['result']);
        if (isset($data['pnl'])) $trade->setPnl((float) $data['pnl']);
        if (isset($data['ratio'])) $trade->setRatio($data['ratio']);
        if (isset($data['notes'])) $trade->setNotes($data['notes']);
        if (isset($data['photos'])) $trade->setPhotos($data['photos']);

        $this->em->flush();

        return $this->json(['success' => true]);
    }

    #[Route('/export', name: 'api_journal_export', methods: ['GET'])]
    public function export(Request $request): Response
    {
        $userCode = $request->query->get('user_code');
        $format = $request->query->get('format', 'csv');

        if (!$userCode) {
            return new Response('Usuario requerido', 400);
        }

        $user = $this->userRepository->findByCode($userCode);
        if (!$user) {
            return new Response('Usuario inválido', 401);
        }

        $trades = $this->tradeRepository->findByUser($user);

        if ($format === 'html') {
            $html = $this->renderView('export/journal.html.twig', [
                'user' => $user,
                'trades' => $trades,
                'generated' => new \DateTimeImmutable(),
            ]);
            return new Response($html, 200, [
                'Content-Type' => 'text/html; charset=utf-8',
                'Content-Disposition' => 'inline; filename="journal-' . $user->getCode() . '.html"',
            ]);
        }

        // Default: CSV
        $handle = fopen('php://memory', 'r+');
        fputcsv($handle, ['Date', 'Asset', 'Direction', 'Entry', 'SL', 'TP', 'Result', 'PNL', 'Ratio', 'Notes']);
        foreach ($trades as $t) {
            fputcsv($handle, [
                $t->getDate()?->format('Y-m-d H:i'),
                $t->getAsset(),
                $t->getDirection(),
                $t->getEntry(),
                $t->getSl(),
                $t->getTp(),
                $t->getResult(),
                $t->getPnl(),
                $t->getRatio(),
                $t->getNotes(),
            ]);
        }
        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);

        return new Response($csv, 200, [
            'Content-Type' => 'text/csv; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="journal-' . $user->getCode() . '.csv"',
        ]);
    }

    #[Route('/{id}', name: 'api_journal_delete', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        $trade = $this->tradeRepository->find($id);
        if (!$trade) {
            return $this->json(['error' => 'No encontrado'], Response::HTTP_NOT_FOUND);
        }

        $this->em->remove($trade);
        $this->em->flush();

        return $this->json(['success' => true]);
    }
}
