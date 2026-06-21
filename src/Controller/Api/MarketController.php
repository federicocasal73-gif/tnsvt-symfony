<?php

namespace App\Controller\Api;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Market data: velas (candles) en vivo para el chart de Academia.
 *
 * Usa Binance public API (gratis, sin auth) para datos reales.
 * Si Binance no responde (offline, rate limit, etc), genera velas
 * simuladas con random walk para que el chart siempre tenga algo que mostrar.
 *
 * - GET /api/market/candles?symbol=BTCUSDT&interval=15m&limit=100
 * - GET /api/market/symbols
 */
#[Route('/api/market')]
class MarketController extends AbstractController
{
    private const SYMBOLS = [
        'BTCUSDT' => ['binance' => 'BTCUSDT', 'name' => 'BTC/USDT', 'base' => 60000, 'vol' => 'high'],
        'ETHUSDT' => ['binance' => 'ETHUSDT', 'name' => 'ETH/USDT', 'base' => 3000, 'vol' => 'high'],
        'EURUSDT' => ['binance' => 'EURUSDT', 'name' => 'EUR/USD', 'base' => 1.08, 'vol' => 'low'],
        'GBPUSD'  => ['binance' => 'GBPUSDT', 'name' => 'GBP/USD', 'base' => 1.27, 'vol' => 'low'],
        'USDJPY'  => ['binance' => 'USDJPY', 'name' => 'USD/JPY', 'base' => 155.0, 'vol' => 'low'],
        'XAUUSD'  => ['binance' => 'PAXGUSDT', 'name' => 'XAU/USD (Oro)', 'base' => 2350, 'vol' => 'med'],
    ];

    private const INTERVALS = [
        '1m' => '1m', '5m' => '5m', '15m' => '15m', '30m' => '30m',
        '1h' => '1h', '4h' => '4h', '1d' => '1d',
    ];

    #[Route('/symbols', name: 'api_market_symbols', methods: ['GET'])]
    public function symbols(): JsonResponse
    {
        $out = [];
        foreach (self::SYMBOLS as $key => $info) {
            $out[] = ['key' => $key, 'name' => $info['name'], 'binance' => $info['binance']];
        }
        return new JsonResponse(['symbols' => $out]);
    }

    #[Route('/candles', name: 'api_market_candles', methods: ['GET'])]
    public function candles(Request $request): JsonResponse
    {
        $symbol = strtoupper($request->query->get('symbol', 'BTCUSDT'));
        $interval = strtolower($request->query->get('interval', '15m'));
        $limit = min(500, max(10, (int) $request->query->get('limit', 100)));

        if (!isset(self::SYMBOLS[$symbol])) {
            return new JsonResponse(['error' => 'symbol no soportado'], 400);
        }
        if (!isset(self::INTERVALS[$interval])) {
            return new JsonResponse(['error' => 'interval no soportado'], 400);
        }

        $binanceSymbol = self::SYMBOLS[$symbol]['binance'];
        $binanceInterval = self::INTERVALS[$interval];
        $cacheKey = "market.candles.{$symbol}.{$interval}.{$limit}";

        // 1) Intentar Binance public API
        try {
            $url = "https://api.binance.com/api/v3/klines?symbol={$binanceSymbol}&interval={$binanceInterval}&limit={$limit}";
            $ctx = stream_context_create(['http' => ['timeout' => 5, 'ignore_errors' => true]]);
            $raw = @file_get_contents($url, false, $ctx);
            if ($raw !== false && $raw !== '') {
                $data = json_decode($raw, true);
                if (is_array($data) && count($data) > 0) {
                    $candles = $this->parseBinance($data, $interval);
                    return new JsonResponse([
                        'source' => 'binance',
                        'symbol' => $symbol,
                        'interval' => $interval,
                        'candles' => $candles,
                        'updated_at' => date('c'),
                    ]);
                }
            }
        } catch (\Throwable $e) {
            // Binance fallo, fallback abajo
        }

        // 2) Fallback: velas simuladas con random walk
        $candles = $this->simulateCandles(self::SYMBOLS[$symbol], $interval, $limit);
        return new JsonResponse([
            'source' => 'simulated',
            'symbol' => $symbol,
            'interval' => $interval,
            'candles' => $candles,
            'updated_at' => date('c'),
        ]);
    }

    /**
     * Parsea la respuesta de Binance /api/v3/klines al formato OHLCV.
     * Cada vela: [openTime, open, high, low, close, volume, closeTime, ...]
     */
    private function parseBinance(array $data, string $interval): array
    {
        $intervalSec = $this->intervalToSec($interval);
        $out = [];
        foreach ($data as $k) {
            $out[] = [
                't' => (int) $k[0] / 1000,    // open time (segundos)
                'o' => (float) $k[1],
                'h' => (float) $k[2],
                'l' => (float) $k[3],
                'c' => (float) $k[4],
                'v' => (float) $k[5],
                'tb' => $this->formatTime((int) $k[0], $intervalSec),
            ];
        }
        return $out;
    }

    /**
     * Genera velas simuladas con random walk browniano geometrico.
     * Reproducible: usa la fecha actual como seed (cambia cada dia).
     */
    private function simulateCandles(array $info, string $interval, int $limit): array
    {
        $intervalSec = $this->intervalToSec($interval);
        $basePrice = $info['base'];
        $vol = $info['vol'] === 'low' ? 0.001 : ($info['vol'] === 'med' ? 0.005 : 0.012);
        // seed por dia para que los datos cambien gradualmente
        mt_srand((int) (time() / 86400));

        $now = time();
        $candles = [];
        $price = $basePrice * (1 + (mt_rand(-100, 100) / 10000)); // pequena variacion inicial
        // Generar desde el pasado hacia el presente
        for ($i = $limit - 1; $i >= 0; $i--) {
            $openTime = $now - ($i * $intervalSec);
            // drift leve + random walk
            $drift = (mt_rand(-100, 100) / 100000); // 0.001% +/- drift
            $volPct = (mt_rand(-1000, 1000) / 100000) * $vol * 10; // shock
            $open = $price;
            $close = $open * (1 + $drift + $volPct);
            $wickUp = abs(mt_rand(-100, 200) / 100000) * $vol * 5;
            $wickDn = abs(mt_rand(-100, 200) / 100000) * $vol * 5;
            $high = max($open, $close) * (1 + $wickUp);
            $low = min($open, $close) * (1 - $wickDn);
            $volumen = mt_rand(100, 10000) * ($vol === 'low' ? 1 : ($vol === 'med' ? 5 : 10));
            $candles[] = [
                't' => $openTime,
                'o' => round($open, 6),
                'h' => round($high, 6),
                'l' => round($low, 6),
                'c' => round($close, 6),
                'v' => $volumen,
                'tb' => $this->formatTime($openTime * 1000, $intervalSec),
            ];
            $price = $close;
        }
        return $candles;
    }

    private function intervalToSec(string $interval): int
    {
        return [
            '1m' => 60, '5m' => 300, '15m' => 900, '30m' => 1800,
            '1h' => 3600, '4h' => 14400, '1d' => 86400,
        ][$interval] ?? 900;
    }

    private function formatTime(int $ms, int $intervalSec): string
    {
        $ts = (int) ($ms / 1000);
        if ($intervalSec >= 86400) {
            return date('d M', $ts);
        } elseif ($intervalSec >= 3600) {
            return date('H:i', $ts);
        } else {
            return date('H:i', $ts);
        }
    }
}