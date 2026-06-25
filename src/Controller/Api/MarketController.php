<?php

namespace App\Controller\Api;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Market data: velas (candles) en vivo para el chart.
 *
 * Soportados: binance, bybit, kraken.
 * Binance como source primario (public API gratis).
 * Si falla, genera velas simuladas.
 *
 * - GET /api/market/candles?symbol=BTCUSDT&exchange=binance&interval=15m&limit=100
 * - GET /api/market/symbols?exchange=binance
 */
#[Route('/api/market')]
class MarketController extends AbstractController
{
    private const EXCHANGES = ['binance', 'bybit', 'kraken'];

    // Mapping de activos del game al symbol de Binance
    private const BINANCE_ASSETS = [
        'BTC' => 'BTCUSDT',
        'ETH' => 'ETHUSDT',
        'SOL' => 'SOLUSDT',
        'BNB' => 'BNBUSDT',
        'XRP' => 'XRPUSDT',
        'GOLD' => 'PAXGUSDT',
    ];

    // Activos via Yahoo Finance
    private const YAHOO_ASSETS = [
        'EURUSD' => 'EURUSD=X',
        'SP500'  => '^GSPC',
        'NASDAQ' => '^IXIC',
        'WTI'    => 'CL=F',
    ];

    // Precios base de respaldo
    private const FALLBACK_PRICES = [
        'BTC' => 65000, 'ETH' => 3500, 'SOL' => 140,
        'BNB' => 600, 'XRP' => 0.50, 'GOLD' => 2330,
        'EURUSD' => 1.04, 'SP500' => 5430, 'NASDAQ' => 19500, 'WTI' => 82,
    ];

    // Symbols por exchange: [symbol => [binance_symbol, base_price, vol]]
    private const SYMBOLS = [
        'binance' => [
            'BTCUSDT' => ['binance' => 'BTCUSDT', 'name' => 'BTC/USDT', 'base' => 60000, 'vol' => 'high'],
            'ETHUSDT' => ['binance' => 'ETHUSDT', 'name' => 'ETH/USDT', 'base' => 3000, 'vol' => 'high'],
            'EURUSDT' => ['binance' => 'EURUSDT', 'name' => 'EUR/USD', 'base' => 1.08, 'vol' => 'low'],
            'GBPUSDT' => ['binance' => 'GBPUSDT', 'name' => 'GBP/USD', 'base' => 1.27, 'vol' => 'low'],
            'USDJPY'  => ['binance' => 'USDJPY', 'name' => 'USD/JPY', 'base' => 155.0, 'vol' => 'low'],
            'XAUUSD'  => ['binance' => 'PAXGUSDT', 'name' => 'XAU/USD (Oro)', 'base' => 2350, 'vol' => 'med'],
            'SOLUSDT' => ['binance' => 'SOLUSDT', 'name' => 'SOL/USDT', 'base' => 140, 'vol' => 'high'],
            'ADAUSDT' => ['binance' => 'ADAUSDT', 'name' => 'ADA/USDT', 'base' => 0.35, 'vol' => 'high'],
        ],
        'bybit' => [
            'BTCUSDT' => ['binance' => 'BTCUSDT', 'name' => 'BTC/USDT', 'base' => 60000, 'vol' => 'high'],
            'ETHUSDT' => ['binance' => 'ETHUSDT', 'name' => 'ETH/USDT', 'base' => 3000, 'vol' => 'high'],
            'SOLUSDT' => ['binance' => 'SOLUSDT', 'name' => 'SOL/USDT', 'base' => 140, 'vol' => 'high'],
            'XRPUSDT' => ['binance' => 'XRPUSDT', 'name' => 'XRP/USDT', 'base' => 0.50, 'vol' => 'high'],
            'DOGEUSDT'=> ['binance' => 'DOGEUSDT', 'name' => 'DOGE/USDT', 'base' => 0.12, 'vol' => 'high'],
            'AVAXUSDT'=> ['binance' => 'AVAXUSDT', 'name' => 'AVAX/USDT', 'base' => 25, 'vol' => 'high'],
            'LINKUSDT'=> ['binance' => 'LINKUSDT', 'name' => 'LINK/USDT', 'base' => 14, 'vol' => 'med'],
            'DOTUSDT' => ['binance' => 'DOTUSDT', 'name' => 'DOT/USDT', 'base' => 7, 'vol' => 'med'],
        ],
        'kraken' => [
            'XBTUSD'  => ['binance' => 'BTCUSDT', 'name' => 'BTC/USD', 'base' => 60000, 'vol' => 'high'],
            'ETHUSD'  => ['binance' => 'ETHUSDT', 'name' => 'ETH/USD', 'base' => 3000, 'vol' => 'high'],
            'SOLUSD'  => ['binance' => 'SOLUSDT', 'name' => 'SOL/USD', 'base' => 140, 'vol' => 'high'],
            'XRPUSD'  => ['binance' => 'XRPUSDT', 'name' => 'XRP/USD', 'base' => 0.50, 'vol' => 'high'],
            'ADAUSD'  => ['binance' => 'ADAUSDT', 'name' => 'ADA/USD', 'base' => 0.35, 'vol' => 'high'],
            'DOTUSD'  => ['binance' => 'DOTUSDT', 'name' => 'DOT/USD', 'base' => 7, 'vol' => 'med'],
            'LINKUSD' => ['binance' => 'LINKUSDT', 'name' => 'LINK/USD', 'base' => 14, 'vol' => 'med'],
            'MATICUSD'=> ['binance' => 'MATICUSDT', 'name' => 'MATIC/USD', 'base' => 0.55, 'vol' => 'med'],
        ],
    ];

    #[Route('/prices', name: 'api_market_prices', methods: ['GET'])]
    public function prices(): JsonResponse
    {
        $cacheKey = 'prices';
        $cached = $this->getCache($cacheKey);
        if ($cached !== null) {
            return $this->json($cached);
        }

        $prices = [];
        $sources = [];

        // 1) Binance batch
        $binancePrices = $this->fetchBinanceTickers();
        foreach (self::BINANCE_ASSETS as $asset => $symbol) {
            $prices[$asset] = $binancePrices[$symbol] ?? self::FALLBACK_PRICES[$asset];
            $sources[$asset] = isset($binancePrices[$symbol]) ? 'binance' : 'fallback';
        }

        // 2) Yahoo Finance batch
        foreach (self::YAHOO_ASSETS as $asset => $yahooSymbol) {
            $yahooPrice = $this->fetchYahooPrice($yahooSymbol);
            $prices[$asset] = $yahooPrice ?? self::FALLBACK_PRICES[$asset];
            $sources[$asset] = $yahooPrice !== null ? 'yahoo' : 'fallback';
        }

        $result = [
            'prices' => $prices,
            'sources' => $sources,
            'updated_at' => date('c'),
        ];

        $this->setCache($cacheKey, $result, 8);
        return $this->json($result);
    }

    #[Route('/exchanges', name: 'api_market_exchanges', methods: ['GET'])]
    public function exchanges(): JsonResponse
    {
        return $this->json(['exchanges' => self::EXCHANGES]);
    }

    private const INTERVALS = [
        '1m' => '1m', '5m' => '5m', '15m' => '15m', '30m' => '30m',
        '1h' => '1h', '4h' => '4h', '1d' => '1d',
    ];

    #[Route('/symbols', name: 'api_market_symbols', methods: ['GET'])]
    public function symbols(Request $request): JsonResponse
    {
        $exchange = strtolower($request->query->get('exchange', 'binance'));
        if (!isset(self::SYMBOLS[$exchange])) {
            $exchange = 'binance';
        }
        $out = [];
        foreach (self::SYMBOLS[$exchange] as $key => $info) {
            $out[] = ['key' => $key, 'name' => $info['name']];
        }
        return new JsonResponse(['exchange' => $exchange, 'symbols' => $out]);
    }

    #[Route('/candles', name: 'api_market_candles', methods: ['GET'])]
    public function candles(Request $request): JsonResponse
    {
        $exchange = strtolower($request->query->get('exchange', 'binance'));
        if (!isset(self::SYMBOLS[$exchange])) {
            $exchange = 'binance';
        }
        $symbol = strtoupper($request->query->get('symbol', 'BTCUSDT'));
        $interval = strtolower($request->query->get('interval', '15m'));
        $limit = min(500, max(10, (int) $request->query->get('limit', 100)));

        if (!isset(self::SYMBOLS[$exchange][$symbol])) {
            return new JsonResponse(['error' => 'symbol no soportado'], 400);
        }
        if (!isset(self::INTERVALS[$interval])) {
            return new JsonResponse(['error' => 'interval no soportado'], 400);
        }

        $info = self::SYMBOLS[$exchange][$symbol];
        $binanceSymbol = $info['binance'];
        $binanceInterval = self::INTERVALS[$interval];

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
                        'exchange' => $exchange,
                        'symbol' => $symbol,
                        'interval' => $interval,
                        'candles' => $candles,
                        'updated_at' => date('c'),
                    ]);
                }
            }
        } catch (\Throwable $e) {
        }

        // 2) Fallback: velas simuladas
        $candles = $this->simulateCandles($info, $interval, $limit);
        return new JsonResponse([
            'source' => 'simulated',
            'exchange' => $exchange,
            'symbol' => $symbol,
            'interval' => $interval,
            'candles' => $candles,
            'updated_at' => date('c'),
        ]);
    }

    // ── Cache helpers (file-based, funciona en php -S) ─────────
    private function getCache(string $key): mixed
    {
        $path = $this->getCachePath($key);
        if (!file_exists($path)) return null;
        $entry = @json_decode(file_get_contents($path), true);
        if (!$entry || !isset($entry['expires'], $entry['data'])) return null;
        if ($entry['expires'] > time()) return $entry['data'];
        @unlink($path);
        return null;
    }

    private function setCache(string $key, mixed $data, int $ttl): void
    {
        $path = $this->getCachePath($key);
        $dir = dirname($path);
        if (!is_dir($dir)) @mkdir($dir, 0777, true);
        file_put_contents($path, json_encode([
            'data' => $data,
            'expires' => time() + $ttl,
        ]), LOCK_EX);
    }

    private function getCachePath(string $key): string
    {
        return sys_get_temp_dir() . '/tnsvt_cache_' . md5($key) . '.json';
    }

    // ── Binance batch ticker ──────────────────────────────────
    private function fetchBinanceTickers(): array
    {
        $symbols = array_values(self::BINANCE_ASSETS);
        $json = json_encode($symbols);
        $url = 'https://api.binance.com/api/v3/ticker/price?symbols=' . urlencode($json);
        try {
            $ctx = stream_context_create(['http' => ['timeout' => 5, 'ignore_errors' => true]]);
            $raw = @file_get_contents($url, false, $ctx);
            if ($raw === false || $raw === '') return [];
            $data = json_decode($raw, true);
            if (!is_array($data)) return [];
            $result = [];
            foreach ($data as $item) {
                if (isset($item['symbol'], $item['price'])) {
                    $result[$item['symbol']] = (float) $item['price'];
                }
            }
            return $result;
        } catch (\Throwable) {
            return [];
        }
    }

    // ── Yahoo Finance price ───────────────────────────────────
    private function fetchYahooPrice(string $symbol): ?float
    {
        $url = "https://query1.finance.yahoo.com/v8/finance/chart/{$symbol}?interval=1d&range=1d";
        try {
            $ctx = stream_context_create([
                'http' => [
                    'timeout' => 5,
                    'ignore_errors' => true,
                    'header' => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36\r\n",
                ],
            ]);
            $raw = @file_get_contents($url, false, $ctx);
            if ($raw === false || $raw === '') return null;
            $data = json_decode($raw, true);
            if (!is_array($data)) return null;
            $meta = $data['chart']['result'][0]['meta'] ?? null;
            if (!$meta) return null;
            return isset($meta['regularMarketPrice']) ? (float) $meta['regularMarketPrice'] : null;
        } catch (\Throwable) {
            return null;
        }
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