<?php

namespace App\Command;

use App\Service\RealtimePublisher;
use Psr\Log\LoggerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

#[AsCommand(name: 'mercure:stream-candles', description: 'Fetches candle data every 3s and publishes to Mercure hub')]
class MercureStreamCommand extends Command
{
    private const PUBLISH_INTERVAL = '15m';
    private const TOPIC_PREFIX = '/chart/';

    private const EXCHANGES = [
        'binance' => ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ADAUSDT', 'XRPUSDT', 'DOGEUSDT'],
        'bybit' => ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'DOGEUSDT', 'AVAXUSDT'],
        'kraken' => ['XBTUSD', 'ETHUSD', 'SOLUSD', 'XRPUSD', 'ADAUSD', 'DOTUSD'],
    ];

    private array $tickerSnapshot = [];

    public function __construct(
        private readonly RealtimePublisher $publisher,
        private readonly HttpClientInterface $httpClient,
        private readonly LoggerInterface $logger,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $output->writeln('<info>[MercureStream] Starting ...</info>');
        $output->writeln('<comment>Hub: ' . $this->publisher->getHub()->getUrl() . '</comment>');

        while (true) {
            $tickerTopics = [];

            foreach (self::EXCHANGES as $exchange => $symbols) {
                foreach ($symbols as $symbol) {
                    try {
                        $candles = $this->fetchLastCandles($exchange, $symbol);
                        if (!$candles) continue;

                        // Publish per-symbol candle update
                        $topic = self::TOPIC_PREFIX . "$exchange/$symbol";
                        $this->publisher->publish($topic, [
                            'exchange' => $exchange,
                            'symbol' => $symbol,
                            'candles' => $candles,
                        ], type: 'candles');

                        $latest = $candles[count($candles) - 1];
                        $tickerTopics["$exchange:$symbol"] = [
                            'price' => $latest['c'],
                            'change' => (($latest['c'] - $latest['o']) / $latest['o']) * 100,
                            'high' => $latest['h'],
                            'low' => $latest['l'],
                            'volume' => $latest['v'],
                            'time' => $latest['t'],
                        ];

                        if ($output->isVerbose()) {
                            $output->writeln("  [$exchange/$symbol] published");
                        }
                    } catch (\Throwable $e) {
                        $this->logger->warning("[MercureStream] $exchange/$symbol: " . $e->getMessage());
                    }
                }
            }

            // Publish aggregated ticker snapshot
            $this->publisher->publish(self::TOPIC_PREFIX . 'ticker', $tickerTopics, type: 'ticker');

            if ($output->isVerbose()) {
                $output->writeln('  --- ticker snapshot published ---');
            }

            sleep(3);
        }
    }

    private function fetchLastCandles(string $exchange, string $symbol): ?array
    {
        $binanceSymbol = $this->mapToBinance($exchange, $symbol);

        $response = $this->httpClient->request('GET', 'https://api.binance.com/api/v3/klines', [
            'query' => ['symbol' => $binanceSymbol, 'interval' => self::PUBLISH_INTERVAL, 'limit' => 3],
            'timeout' => 5,
        ]);

        $raw = $response->toArray();
        if (!$raw) return null;

        return array_map(fn($k) => [
            't' => (int)($k[0] / 1000),
            'o' => (float)$k[1],
            'h' => (float)$k[2],
            'l' => (float)$k[3],
            'c' => (float)$k[4],
            'v' => (float)$k[5],
        ], $raw);
    }

    private function mapToBinance(string $exchange, string $symbol): string
    {
        if ($exchange === 'kraken') {
            return match ($symbol) {
                'XBTUSD' => 'BTCUSDT',
                'ETHUSD' => 'ETHUSDT',
                'SOLUSD' => 'SOLUSDT',
                'XRPUSD' => 'XRPUSDT',
                'ADAUSD' => 'ADAUSDT',
                'DOTUSD' => 'DOTUSDT',
                'LINKUSD' => 'LINKUSDT',
                'MATICUSD' => 'MATICUSDT',
                default => $symbol,
            };
        }
        return $symbol;
    }
}
