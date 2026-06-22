<?php

namespace App\Controller\Api;

use App\Service\MercureSubscriberService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/mercure')]
class MercureController extends AbstractController
{
    public function __construct(private MercureSubscriberService $subscriber) {}

    #[Route('/subscribe', name: 'api_mercure_subscribe', methods: ['GET'])]
    public function subscribe(Request $request): JsonResponse
    {
        $exchange = $request->query->get('exchange', 'binance');
        $symbol = $request->query->get('symbol', 'BTCUSDT');

        $topic = "/chart/$exchange/$symbol";
        $url = $this->subscriber->getSubscribeUrl($topic);

        $cookie = $this->subscriber->createAuthCookie($request, subscribe: [$topic]);

        $response = $this->json([
            'url' => $url,
            'topic' => $topic,
            'exchange' => $exchange,
            'symbol' => $symbol,
        ]);
        $response->headers->setCookie($cookie);

        return $response;
    }

    #[Route('/ticker', name: 'api_mercure_ticker', methods: ['GET'])]
    public function ticker(Request $request): JsonResponse
    {
        $topic = '/chart/ticker';
        $url = $this->subscriber->getSubscribeUrl($topic);
        $cookie = $this->subscriber->createAuthCookie($request, subscribe: [$topic]);

        $response = $this->json([
            'url' => $url,
            'topic' => $topic,
        ]);
        $response->headers->setCookie($cookie);

        return $response;
    }
}
