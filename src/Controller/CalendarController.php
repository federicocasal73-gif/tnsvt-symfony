<?php

namespace App\Controller;

use Symfony\Component\HttpClient\HttpClient;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;

class CalendarController extends AbstractController
{
    private const TV_EVENTS_URL = 'https://chartevents-reuters.tradingview.com/events';

    private const COUNTRY_MAP = [
        'US' => '🇺🇸 USD', 'EU' => '🇪🇺 EUR', 'GB' => '🇬🇧 GBP',
        'JP' => '🇯🇵 JPY', 'CA' => '🇨🇦 CAD', 'AU' => '🇦🇺 AUD',
        'CH' => '🇨🇭 CHF', 'CN' => '🇨🇳 CNY', 'MX' => '🇲🇽 MXN',
        'BR' => '🇧🇷 BRL', 'IN' => '🇮🇳 INR', 'NZ' => '🇳🇿 NZD',
        'DE' => '🇩🇪 EUR', 'FR' => '🇫🇷 EUR', 'IT' => '🇮🇹 EUR',
        'ES' => '🇪🇸 EUR',
    ];

    private const SPANISH_TITLES = [
        'CPI MM' => 'IPC Mensual',
        'CPI YY' => 'IPC Anual',
        'Core CPI MM' => 'IPC Subyacente Mensual',
        'Core CPI YY' => 'IPC Subyacente Anual',
        'PPI MM' => 'IPP Mensual',
        'PPI YY' => 'IPP Anual',
        'Unemployment Rate' => 'Tasa de Desempleo',
        'Non-Farm Payrolls' => 'Nóminas No Agrícolas (NFP)',
        'Nonfarm Payrolls' => 'Nóminas No Agrícolas (NFP)',
        'Non-Farm Employment Change' => 'Cambio Empleo No Agrícola',
        'GDP' => 'PIB',
        'GDP MM' => 'PIB Mensual',
        'GDP QQ' => 'PIB Trimestral',
        'GDP YY' => 'PIB Anual',
        'Interest Rate Decision' => 'Decisión Tasa de Interés',
        'FOMC Statement' => 'Declaración FOMC',
        'FOMC Press Conference' => 'Conferencia de Prensa FOMC',
        'Fed Chair Press Conference' => 'Conferencia Presidente Fed',
        'ECB Interest Rate Decision' => 'Decisión Tasa BCE',
        'ECB Press Conference' => 'Conferencia de Prensa BCE',
        'Retail Sales MM' => 'Ventas Minoristas Mensual',
        'Retail Sales YY' => 'Ventas Minoristas Anual',
        'Industrial Production MM' => 'Producción Industrial Mensual',
        'Manufacturing PMI' => 'PMI Manufacturero',
        'Services PMI' => 'PMI Servicios',
        'Composite PMI' => 'PMI Compuesto',
        'Trade Balance' => 'Balanza Comercial',
        'Current Account' => 'Cuenta Corriente',
        'Consumer Confidence' => 'Confianza del Consumidor',
        'Business Confidence' => 'Confianza Empresarial',
        'Inflation Rate YY' => 'Tasa de Inflación Anual',
        'Inflation Rate MM' => 'Tasa de Inflación Mensual',
        'Core Inflation Rate YY' => 'Inflación Subyacente Anual',
        'Employment Change' => 'Cambio de Empleo',
        'Unemployment Claims' => 'Solicitudes de Desempleo',
        'Building Permits' => 'Permisos de Construcción',
        'Housing Starts' => 'Inicio de Viviendas',
        'Existing Home Sales' => 'Ventas de Viviendas Existentes',
        'New Home Sales' => 'Ventas de Viviendas Nuevas',
        'Consumer Credit' => 'Crédito al Consumidor',
        'Factory Orders MM' => 'Pedidos de Fábrica Mensual',
        'Durable Goods Orders MM' => 'Pedidos Bienes Duraderos',
        'ISM Manufacturing PMI' => 'PMI Manufacturero ISM',
        'ISM Services PMI' => 'PMI Servicios ISM',
        'JOLTS Job Openings' => 'Ofertas de Empleo JOLTS',
        'ADP Non-Farm Employment Change' => 'Cambio Empleo ADP',
        'Average Hourly Earnings MM' => 'Salario Por Hora Promedio',
        'Producer Price Index MM' => 'Índice Precios Productor',
        'BoE Interest Rate Decision' => 'Decisión Tasa BoE',
        'BoJ Interest Rate Decision' => 'Decisión Tasa BoJ',
        'SNB Interest Rate Decision' => 'Decisión Tasa SNB',
        'RBA Interest Rate Decision' => 'Decisión Tasa RBA',
        'BOC Interest Rate Decision' => 'Decisión Tasa BOC',
        'RBNZ Interest Rate Decision' => 'Decisión Tasa RBNZ',
    ];

    #[Route('/calendar/widget', name: 'app_calendar_widget', methods: ['GET'])]
    public function widget(): Response
    {
        $cacheFile = sys_get_temp_dir() . '/tnsvt_calendar_cache.json';
        $cacheTtl = 900;

        $events = $this->loadFromCache($cacheFile, $cacheTtl);
        if ($events === null) {
            $events = $this->fetchFromTradingView();
            if ($events !== null && count($events) > 0) {
                $this->saveToCache($cacheFile, $events);
            }
        }

        return $this->render('calendar/widget.html.twig', [
            'events' => $events ?? [],
            'has_data' => $events !== null && count($events) > 0,
            'fetched_at' => file_exists($cacheFile) ? filemtime($cacheFile) : time(),
        ]);
    }

    private function loadFromCache(string $cacheFile, int $ttl): ?array
    {
        if (!file_exists($cacheFile)) return null;
        if (time() - filemtime($cacheFile) > $ttl) return null;
        $content = @file_get_contents($cacheFile);
        if ($content === false) return null;
        $data = json_decode($content, true);
        return is_array($data) ? $data : null;
    }

    private function saveToCache(string $cacheFile, array $events): void
    {
        @file_put_contents($cacheFile, json_encode($events, JSON_UNESCAPED_UNICODE));
    }

    private function fetchFromTradingView(): ?array
    {
        try {
            $client = HttpClient::create([
                'timeout' => 10,
                'headers' => [
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                    'Accept' => 'application/json',
                    'Origin' => 'https://www.tradingview.com',
                    'Referer' => 'https://www.tradingview.com/',
                ],
            ]);

            $response = $client->request('GET', self::TV_EVENTS_URL);
            if ($response->getStatusCode() !== 200) return null;

            $data = $response->toArray();
            $rows = $data['result'] ?? null;
            if (!is_array($rows) || count($rows) === 0) return null;

            return $this->normalizeEvents($rows);
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function normalizeEvents(array $rows): array
    {
        $now = new \DateTimeImmutable('now', new \DateTimeZone('America/Argentina/Buenos_Aires'));
        $cutoff = $now->modify('-1 day');
        $max = $now->modify('+14 days');

        $events = [];
        foreach ($rows as $row) {
            if (!is_array($row)) continue;

            $title = trim($row['title'] ?? $row['indicator'] ?? '');
            if (!$title) continue;

            $dateStr = $row['date'] ?? null;
            if (!$dateStr) continue;
            try {
                $dt = new \DateTimeImmutable($dateStr);
            } catch (\Throwable $e) {
                continue;
            }

            $dtAr = $dt->setTimezone(new \DateTimeZone('America/Argentina/Buenos_Aires'));
            if ($dtAr < $cutoff || $dtAr > $max) continue;

            $country = $row['country'] ?? '';
            $currency = $row['currency'] ?? '';
            $importance = (int)($row['importance'] ?? 0);

            $events[] = [
                'date' => $dtAr->format('Y-m-d'),
                'time' => $dtAr->format('H:i'),
                'datetime_label' => $dtAr->format('d M H:i'),
                'country' => self::COUNTRY_MAP[$country] ?? ($country . ' ' . $currency),
                'title' => $this->translateTitle($title),
                'original_title' => $title,
                'importance' => $importance,
                'actual' => $this->formatValue($row['actual'] ?? null, $row['unit'] ?? ''),
                'forecast' => $this->formatValue($row['forecast'] ?? null, $row['unit'] ?? ''),
                'previous' => $this->formatValue($row['previous'] ?? null, $row['unit'] ?? ''),
                'period' => $row['period'] ?? null,
            ];
        }

        usort($events, fn($a, $b) => strcmp($a['date'] . $a['time'], $b['date'] . $b['time']));
        return $events;
    }

    private function translateTitle(string $title): string
    {
        $clean = trim($title);
        if (isset(self::SPANISH_TITLES[$clean])) {
            return self::SPANISH_TITLES[$clean];
        }
        foreach (self::SPANISH_TITLES as $en => $es) {
            if (stripos($clean, $en) !== false) return $es;
        }
        return $clean;
    }

    private function formatValue($value, string $unit): string
    {
        if ($value === null || $value === '' || $value === '-') return '—';
        if (is_numeric($value)) {
            $f = (float)$value;
            $formatted = abs($f - round($f)) < 0.0001 ? number_format($f, 0) : rtrim(rtrim(number_format($f, 2, '.', ''), '0'), '.');
            return $formatted . ($unit ? $unit : '');
        }
        return (string)$value;
    }
}
