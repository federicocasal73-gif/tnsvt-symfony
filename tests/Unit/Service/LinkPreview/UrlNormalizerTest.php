<?php

declare(strict_types=1);

namespace App\Tests\Unit\Service\LinkPreview;

use App\Service\LinkPreview\InvalidUrlException;
use App\Service\LinkPreview\SsrfException;
use App\Service\LinkPreview\UrlNormalizer;
use PHPUnit\Framework\TestCase;

final class UrlNormalizerTest extends TestCase
{
    private UrlNormalizer $normalizer;

    protected function setUp(): void
    {
        $this->normalizer = new UrlNormalizer();
    }

    public function testAcceptsValidHttpsUrl(): void
    {
        $normalized = $this->normalizer->assertSafe('https://tradingview.com/chart/abc');
        $this->assertSame('https://tradingview.com/chart/abc', $normalized);
    }

    public function testAcceptsValidHttpUrl(): void
    {
        $normalized = $this->normalizer->assertSafe('http://example.com/page');
        $this->assertSame('http://example.com/page', $normalized);
    }

    public function testRejectsEmptyUrl(): void
    {
        $this->expectException(InvalidUrlException::class);
        $this->normalizer->assertSafe('');
    }

    public function testRejectsNonHttpScheme(): void
    {
        $this->expectException(InvalidUrlException::class);
        $this->normalizer->assertSafe('file:///etc/passwd');
    }

    public function testRejectsJavascriptScheme(): void
    {
        $this->expectException(InvalidUrlException::class);
        $this->normalizer->assertSafe('javascript:alert(1)');
    }

    public function testRejectsBlockedHostLocalhost(): void
    {
        $this->expectException(SsrfException::class);
        $this->normalizer->assertSafe('http://localhost/admin');
    }

    public function testRejectsBlockedHostMetadata(): void
    {
        $this->expectException(SsrfException::class);
        $this->normalizer->assertSafe('http://169.254.169.254/latest/meta-data/');
    }

    public function testRejectsMalformedUrl(): void
    {
        $this->expectException(InvalidUrlException::class);
        $this->normalizer->assertSafe('not a url at all with spaces');
    }

    public function testNormalizeStripsTrackingParams(): void
    {
        $normalized = $this->normalizer->normalize('https://example.com/page?utm_source=x&id=42&fbclid=abc');
        $this->assertStringNotContainsString('utm_source', $normalized);
        $this->assertStringNotContainsString('fbclid', $normalized);
        $this->assertStringContainsString('id=42', $normalized);
    }

    public function testNormalizeStripsTrailingSlash(): void
    {
        $this->assertSame('https://example.com/page', $this->normalizer->normalize('https://example.com/page/'));
        $this->assertSame('https://example.com/page', $this->normalizer->normalize('https://example.com/page'));
    }

    public function testNormalizeLowercasesHost(): void
    {
        $this->assertSame('https://example.com/Page', $this->normalizer->normalize('https://EXAMPLE.COM/Page'));
    }

    public function testNormalizeStripsFragment(): void
    {
        $this->assertSame('https://example.com/page', $this->normalizer->normalize('https://example.com/page#section'));
    }

    public function testIsPrivateIpRecognizesPrivateRanges(): void
    {
        $this->assertTrue($this->normalizer->isPrivateIp('127.0.0.1'));
        $this->assertTrue($this->normalizer->isPrivateIp('10.0.0.1'));
        $this->assertTrue($this->normalizer->isPrivateIp('172.16.0.1'));
        $this->assertTrue($this->normalizer->isPrivateIp('192.168.1.1'));
        $this->assertTrue($this->normalizer->isPrivateIp('169.254.169.254'));
        $this->assertTrue($this->normalizer->isPrivateIp('100.64.0.1'));
        $this->assertTrue($this->normalizer->isPrivateIp('::1'));
        $this->assertTrue($this->normalizer->isPrivateIp('fc00::1'));
        $this->assertFalse($this->normalizer->isPrivateIp('8.8.8.8'));
        $this->assertFalse($this->normalizer->isPrivateIp('1.1.1.1'));
    }

    public function testExtractsDomain(): void
    {
        // extractDomain retorna el host completo (sin www).
        // Subdominios regionales (es., br., etc.) se preservan y se matchean
        // en SiteEnricher::supports() con str_ends_with().
        $this->assertSame('es.tradingview.com', $this->normalizer->extractDomain('https://es.tradingview.com/chart/abc'));
        $this->assertSame('example.com', $this->normalizer->extractDomain('http://example.com/'));
        $this->assertSame('tradingview.com', $this->normalizer->extractDomain('https://www.tradingview.com/chart'));
    }
}