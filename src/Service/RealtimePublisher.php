<?php

namespace App\Service;

use Psr\Log\LoggerInterface;
use Symfony\Component\Mercure\Hub;
use Symfony\Component\Mercure\Jwt\LcobucciFactory;
use Symfony\Component\Mercure\Jwt\FactoryTokenProvider;
use Symfony\Component\Mercure\Update;
use Symfony\Contracts\HttpClient\HttpClientInterface;

class RealtimePublisher
{
    private Hub $hub;

    public function __construct(
        private readonly string $mercureUrl,
        private readonly string $jwtSecret,
        private readonly ?HttpClientInterface $httpClient = null,
        private readonly ?LoggerInterface $logger = null,
    ) {
        $jwtFactory = new LcobucciFactory($this->jwtSecret);
        $jwtProvider = new FactoryTokenProvider($jwtFactory, publish: ['*']);
        $this->hub = new Hub($this->mercureUrl, $jwtProvider, $jwtFactory, httpClient: $this->httpClient);
    }

    public function publish(string $topic, array $data, bool $private = false, ?string $type = null): bool
    {
        try {
            $update = new Update(
                topics: $topic,
                data: json_encode($data),
                private: $private,
                type: $type,
            );
            $this->hub->publish($update);
            return true;
        } catch (\Throwable $e) {
            $this->logger?->warning('[Mercure] publish failed: ' . $e->getMessage());
            return false;
        }
    }

    public function getHub(): Hub
    {
        return $this->hub;
    }
}
