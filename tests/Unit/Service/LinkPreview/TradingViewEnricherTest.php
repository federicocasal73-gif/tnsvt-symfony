<?php

declare(strict_types=1);

namespace App\Tests\Unit\Service\LinkPreview;

use App\Service\LinkPreview\SiteEnrichers\TradingViewEnricher;
use PHPUnit\Framework\TestCase;

final class TradingViewEnricherTest extends TestCase
{
    private TradingViewEnricher $enricher;

    protected function setUp(): void
    {
        $this->enricher = new TradingViewEnricher();
    }

    public function testSupportsTradingViewDomain(): void
    {
        self::assertTrue($this->enricher->supports('https://www.tradingview.com/chart/abc', 'tradingview.com'));
        self::assertTrue($this->enricher->supports('https://es.tradingview.com/symbols/', 'es.tradingview.com'));
        self::assertFalse($this->enricher->supports('https://example.com', 'example.com'));
    }

    public function testExtractsTickerFromSymbolParam(): void
    {
        $result = $this->enricher->enrich('https://www.tradingview.com/chart/?symbol=FX:XAUUSD', []);
        self::assertSame('tradingview', $result['kind']);
        self::assertSame('XAUUSD', $result['ticker']);
        self::assertStringContainsString('Gold Spot', $result['title']);
    }

    public function testExtractsTickerFromBinanceSymbol(): void
    {
        $result = $this->enricher->enrich('https://www.tradingview.com/chart/?symbol=BINANCE:BTCUSDT', []);
        self::assertSame('BTCUSDT', $result['ticker']);
        self::assertStringContainsString('Bitcoin', $result['title']);
    }

    public function testFallsBackToRawTickerWhenUnknown(): void
    {
        $result = $this->enricher->enrich('https://www.tradingview.com/chart/?symbol=MYCOIN:ABCDEF', []);
        self::assertSame('ABCDEF', $result['ticker']);
        self::assertStringContainsString('ABCDEF', $result['title']);
    }

    public function testProvidesDefaultDescriptionWhenMetadataEmpty(): void
    {
        $result = $this->enricher->enrich('https://www.tradingview.com/chart/?symbol=FX:XAUUSD', []);
        self::assertStringContainsString('Gold Spot', $result['description']);
    }

    public function testDoesNotOverrideExistingDescription(): void
    {
        $result = $this->enricher->enrich('https://www.tradingview.com/chart/?symbol=FX:XAUUSD', [
            'description' => 'Manual description',
        ]);
        self::assertArrayNotHasKey('description', $result);
    }

    public function testSetsImageToNullWhenNoOgImage(): void
    {
        $result = $this->enricher->enrich('https://www.tradingview.com/chart/?symbol=FX:XAUUSD', []);
        self::assertArrayHasKey('image', $result);
        self::assertNull($result['image']);
    }

    public function testNoTickerWhenNoSymbolParam(): void
    {
        $result = $this->enricher->enrich('https://www.tradingview.com/chart/abc123', []);
        self::assertSame('tradingview', $result['kind']);
        self::assertArrayNotHasKey('ticker', $result);
    }

    public function testSupportsReturnsFalseForNonTradingView(): void
    {
        self::assertFalse($this->enricher->supports('https://youtube.com/watch?v=abc', 'youtube.com'));
        self::assertFalse($this->enricher->supports('', ''));
    }
}
