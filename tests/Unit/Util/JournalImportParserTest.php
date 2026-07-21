<?php

declare(strict_types=1);

namespace App\Tests\Unit\Util;

use App\Util\JournalImportParser;
use PHPUnit\Framework\TestCase;

final class JournalImportParserTest extends TestCase
{
    public function testParsesTnsvtCsvWithFlexibleHeaders(): void
    {
        $csv = "\xEF\xBB\xBF" . "Date,Account,Asset,Direction,Entry,SL,TP,Result,PNL,Ratio,Notes\n"
            . "2026-07-19 15:23,MAIN,XAUUSD,BUY,2415.50,2410.00,2425.00,WIN,150.00,1.96,Limpió estructura\n"
            . "2026-07-20 09:10,MAIN,EURUSD,SELL,1.0850,1.0900,1.0750,LOSS,-50.00,2.00,\"News event\"\n";

        $trades = JournalImportParser::parseCsv($csv);

        $this->assertCount(2, $trades);
        $this->assertSame('XAUUSD', $trades[0]['asset']);
        $this->assertSame('BUY', $trades[0]['dir']);
        $this->assertSame(150.0, $trades[0]['pnl']);
        $this->assertSame('News event', $trades[1]['notes']);
        $this->assertArrayHasKey('date', $trades[0]);
        $this->assertSame('2026-07-19T15:23:00', substr($trades[0]['date'], 0, 19));
    }

    public function testAcceptsSpanishHeaderAliases(): void
    {
        $csv = "Fecha,Cuenta,Activo,Dirección,Entrada,SL,TP,Resultado,PnL,R:R,Notas\n"
            . "2026-07-19 15:23,DEMO,BTCUSDT,BUY,60000,59500,61000,WIN,250.50,2.00,Breakout\n";

        $trades = JournalImportParser::parseCsv($csv);

        $this->assertCount(1, $trades);
        $this->assertSame('BTCUSDT', $trades[0]['asset']);
        $this->assertSame('BUY', $trades[0]['dir']);
        $this->assertSame('WIN', $trades[0]['result']);
        $this->assertSame(250.5, $trades[0]['pnl']);
        $this->assertSame('2.00', $trades[0]['ratio']);
        $this->assertSame('Breakout', $trades[0]['notes']);
    }

    public function testRejectsEmptyCsv(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        JournalImportParser::parseCsv('');
    }

    public function testRejectsCsvWithoutTradeColumns(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        JournalImportParser::parseCsv("foo,bar\n1,2\n");
    }

    public function testNormalizesDirectionAndResult(): void
    {
        $csv = "Date,Asset,Direction,Result\n2026-07-19,XAUUSD,long,win\n";
        $trades = JournalImportParser::parseCsv($csv);
        $this->assertSame('BUY', $trades[0]['dir']);
        $this->assertSame('WIN', $trades[0]['result']);
    }

    public function testParsesTnsvtHtmlReport(): void
    {
        $html = '<!doctype html><html><head><meta charset="UTF-8"><title>Journal DEMO</title></head>'
            . '<body><h1>Trading Journal — DEMO</h1>'
            . '<table><thead><tr><th>Fecha</th><th>Activo</th><th>Dir</th><th>Entry</th><th>SL</th><th>TP</th><th>Resultado</th><th>PNL</th><th>R:B</th><th>Notas</th></tr></thead><tbody>'
            . '<tr><td>19/07/2026 15:23</td><td><strong>XAUUSD</strong></td><td class="buy">BUY</td><td>2415.50</td><td>2410.00</td><td>2425.00</td><td class="win">WIN</td><td class="pnl-pos">+150.00</td><td>1.96</td><td>Limpió estructura</td></tr>'
            . '<tr><td>20/07/2026 09:10</td><td><strong>EURUSD</strong></td><td class="sell">SELL</td><td>1.0850</td><td>1.0900</td><td>1.0750</td><td class="loss">LOSS</td><td class="pnl-neg">-50.00</td><td>2.00</td><td>News</td></tr>'
            . '</tbody></table></body></html>';

        $trades = JournalImportParser::parseHtml($html);

        $this->assertCount(2, $trades);
        $this->assertSame('XAUUSD', $trades[0]['asset']);
        $this->assertSame('BUY', $trades[0]['dir']);
        $this->assertSame('WIN', $trades[0]['result']);
        $this->assertSame(150.0, $trades[0]['pnl']);
        $this->assertSame('2026-07-19T15:23:00', substr($trades[0]['date'], 0, 19));
        $this->assertSame('EURUSD', $trades[1]['asset']);
        $this->assertSame('SELL', $trades[1]['dir']);
        $this->assertSame(-50.0, $trades[1]['pnl']);
    }

    public function testRejectsHtmlWithoutTradeTable(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        JournalImportParser::parseHtml('<html><body><p>Hola</p></body></html>');
    }

    public function testMergesTradesDedupedByKey(): void
    {
        $existing = [
            [
                'date' => '2026-07-19T15:23:00',
                'asset' => 'XAUUSD',
                'dir' => 'BUY',
                'entry' => '2415.50',
                'pnl' => 150.0,
            ],
        ];

        $incoming = [
            ['date' => '2026-07-19T15:23:00', 'asset' => 'XAUUSD', 'dir' => 'BUY', 'entry' => '2415.50', 'pnl' => 150.0, 'notes' => 'dup'],
            ['date' => '2026-07-20T09:10:00', 'asset' => 'EURUSD', 'dir' => 'SELL', 'entry' => '1.0850', 'pnl' => -50.0],
        ];

        $result = JournalImportParser::mergeDedup($existing, $incoming);

        $this->assertCount(2, $result['trades']);
        $this->assertSame(1, $result['added']);
        $this->assertSame(1, $result['skipped']);
        $this->assertSame('dup', $result['trades'][0]['notes']);
    }

    public function testMergeAcceptsEmptyIncoming(): void
    {
        $result = JournalImportParser::mergeDedup([['date' => 'x', 'asset' => 'A', 'dir' => 'BUY', 'entry' => '1']], []);
        $this->assertSame(0, $result['added']);
        $this->assertSame(0, $result['skipped']);
        $this->assertCount(1, $result['trades']);
    }
}
