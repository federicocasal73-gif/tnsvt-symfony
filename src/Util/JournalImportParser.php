<?php

declare(strict_types=1);

namespace App\Util;

final class JournalImportParser
{
    private const HEADER_ALIASES = [
        'date' => ['date', 'fecha', 'datetime', 'created', 'created_at'],
        'account' => ['account', 'cuenta'],
        'asset' => ['asset', 'activo', 'symbol', 'instrument', 'par', 'ticker'],
        'dir' => ['dir', 'direction', 'direccion', 'dirección', 'side'],
        'entry' => ['entry', 'entrada', 'price', 'open', 'open_price'],
        'sl' => ['sl', 'stop', 'stop_loss', 'stoploss'],
        'tp' => ['tp', 'take_profit', 'takeprofit', 'target'],
        'result' => ['result', 'resultado', 'outcome'],
        'pnl' => ['pnl', 'p&l', 'profit', 'profit_loss', 'net'],
        'ratio' => ['ratio', 'r:r', 'r:r', 'rr', 'risk_reward'],
        'notes' => ['notes', 'notas', 'comment', 'comments', 'observaciones'],
    ];

    public static function parseCsv(string $csv): array
    {
        $csv = self::stripBom($csv);
        if (trim($csv) === '') {
            throw new \InvalidArgumentException('CSV vacío');
        }

        $rows = self::readCsv($csv);
        if ($rows === [] || $rows === [[null]] || $rows === [[]]) {
            throw new \InvalidArgumentException('CSV sin filas');
        }

        $header = array_shift($rows);
        $map = self::mapHeaders($header);
        self::assertRequiredColumns($map);

        $trades = [];
        foreach ($rows as $row) {
            if (!is_array($row)) {
                continue;
            }
            $row = array_pad($row, count($header), '');
            $trade = [];
            foreach ($map as $field => $index) {
                $trade[$field] = trim((string) ($row[$index] ?? ''));
            }
            $trade['dir'] = self::normalizeDir($trade['dir'] ?? '');
            $trade['result'] = self::normalizeResult($trade['result'] ?? '');
            $trade['pnl'] = self::parseFloat($trade['pnl'] ?? '');
            $trade['date'] = self::normalizeDate($trade['date'] ?? '');
            if (($trade['asset'] ?? '') === '' && ($trade['dir'] ?? '') === '') {
                continue;
            }
            $trades[] = $trade;
        }

        if ($trades === []) {
            throw new \InvalidArgumentException('CSV sin filas válidas');
        }

        return $trades;
    }

    public static function parseHtml(string $html): array
    {
        if (!str_contains($html, '<table')) {
            throw new \InvalidArgumentException('HTML sin tabla de trades');
        }

        $prev = libxml_use_internal_errors(true);
        $dom = new \DOMDocument();
        $dom->loadHTML('<?xml encoding="UTF-8">' . $html);
        libxml_clear_errors();
        libxml_use_internal_errors($prev);

        $xpath = new \DOMXPath($dom);
        $table = $xpath->query('//table')->item(0);
        if (!$table instanceof \DOMElement) {
            throw new \InvalidArgumentException('HTML sin tabla de trades');
        }

        $headers = [];
        $headerRow = $xpath->query('.//thead//tr[1]', $table)->item(0)
            ?: ($xpath->query('.//tr', $table)->item(0) ?: null);
        if ($headerRow instanceof \DOMElement) {
            foreach ($xpath->query('.//th', $headerRow) as $th) {
                $headers[] = trim($th->textContent);
            }
            if ($headers === []) {
                foreach ($xpath->query('.//td', $headerRow) as $td) {
                    $headers[] = trim($td->textContent);
                }
            }
        }

        if ($headers === []) {
            foreach ($xpath->query('.//tr[1]//td', $table) as $td) {
                $headers[] = trim($td->textContent);
            }
        }

        $map = self::mapHeaders($headers);
        self::assertRequiredColumns($map);

        $rows = $xpath->query('.//tbody//tr', $table);
        if ($rows->length === 0) {
            $rows = $xpath->query('.//tr[not(parent::thead)]', $table);
        }

        $trades = [];
        foreach ($rows as $row) {
            if (!$row instanceof \DOMElement) {
                continue;
            }
            $cells = $xpath->query('.//td', $row);
            if ($cells->length === 0) {
                continue;
            }
            $trade = [];
            foreach ($map as $field => $index) {
                $cell = $cells->item($index);
                $trade[$field] = $cell instanceof \DOMNode ? trim($cell->textContent) : '';
            }
            $trade['dir'] = self::normalizeDir($trade['dir'] ?? '');
            $trade['result'] = self::normalizeResult($trade['result'] ?? '');
            $trade['pnl'] = self::parseFloat($trade['pnl'] ?? '');
            $trade['date'] = self::normalizeDate($trade['date'] ?? '');
            $trades[] = $trade;
        }

        if ($trades === []) {
            throw new \InvalidArgumentException('HTML sin filas de trades');
        }

        return $trades;
    }

    public static function mergeDedup(array $existing, array $incoming): array
    {
        $byKey = [];
        foreach ($existing as $t) {
            $key = self::tradeKey($t);
            if ($key !== null) {
                $byKey[$key] = $t;
            }
        }

        $added = 0;
        $skipped = 0;
        foreach ($incoming as $t) {
            $key = self::tradeKey($t);
            if ($key === null) {
                continue;
            }
            if (isset($byKey[$key])) {
                $byKey[$key] = array_merge($byKey[$key], array_filter($t, static fn ($v) => $v !== '' && $v !== null));
                $skipped++;
                continue;
            }
            $byKey[$key] = $t;
            $added++;
        }

        return [
            'trades' => array_values($byKey),
            'added' => $added,
            'skipped' => $skipped,
        ];
    }

    private static function tradeKey(array $t): ?string
    {
        $date = self::normalizeDate((string) ($t['date'] ?? ''));
        $asset = strtoupper(trim((string) ($t['asset'] ?? '')));
        $dir = self::normalizeDir((string) ($t['dir'] ?? ''));
        $entry = self::parseFloat((string) ($t['entry'] ?? ''));
        if ($date === '' || $asset === '' || $dir === '') {
            return null;
        }

        return $date . '|' . $asset . '|' . $dir . '|' . $entry;
    }

    private static function stripBom(string $s): string
    {
        if (str_starts_with($s, "\xEF\xBB\xBF")) {
            return substr($s, 3);
        }

        return $s;
    }

    private static function readCsv(string $csv): array
    {
        $handle = fopen('php://temp', 'r+');
        fwrite($handle, $csv);
        rewind($handle);
        $rows = [];
        while (($row = fgetcsv($handle, escape: '')) !== false) {
            $rows[] = $row;
        }
        fclose($handle);

        return $rows;
    }

    private static function mapHeaders(array $header): array
    {
        $map = [];
        foreach ($header as $i => $name) {
            $normalized = strtolower(trim((string) $name));
            $normalized = str_replace([' ', '-', '/'], '_', $normalized);
            foreach (self::HEADER_ALIASES as $field => $aliases) {
                if (in_array($normalized, $aliases, true)) {
                    if (!isset($map[$field])) {
                        $map[$field] = $i;
                    }
                }
            }
        }

        return $map;
    }

    private static function assertRequiredColumns(array $map): void
    {
        foreach (['asset', 'dir'] as $required) {
            if (!isset($map[$required])) {
                throw new \InvalidArgumentException(sprintf('Falta columna requerida: %s', $required));
            }
        }
    }

    private static function normalizeDir(string $value): string
    {
        $v = strtoupper(trim($value));
        return match ($v) {
            'LONG', 'BUY', 'B', 'COMPRA', 'BULL' => 'BUY',
            'SHORT', 'SELL', 'S', 'VENTA', 'BEAR' => 'SELL',
            default => $v,
        };
    }

    private static function normalizeResult(string $value): string
    {
        $v = strtoupper(trim($value));
        return match ($v) {
            'WIN', 'W', 'TP', 'GANADA', 'TP_HIT' => 'WIN',
            'LOSS', 'L', 'SL', 'PERDIDA', 'SL_HIT' => 'LOSS',
            'BE', 'BREAKEVEN', 'BREAK_EVEN' => 'BE',
            default => $v,
        };
    }

    private static function parseFloat(string $value): float
    {
        $clean = preg_replace('/[^0-9\-\.,]/', '', $value) ?? '0';
        $clean = str_replace(',', '.', $clean);

        return (float) $clean;
    }

    private static function normalizeDate(string $value): string
    {
        $value = trim($value);
        if ($value === '') {
            return '';
        }

        $formats = [
            'Y-m-d\TH:i:s',
            'Y-m-d H:i:s',
            'Y-m-d H:i',
            'd/m/Y H:i',
            'd-m-Y H:i',
            'Y-m-d',
            'd/m/Y',
        ];
        foreach ($formats as $fmt) {
            $dt = \DateTime::createFromFormat($fmt, $value);
            if ($dt instanceof \DateTime) {
                return $dt->format('Y-m-d\TH:i:s');
            }
        }

        $ts = strtotime($value);
        if ($ts !== false) {
            return date('Y-m-d\TH:i:s', $ts);
        }

        return $value;
    }
}
