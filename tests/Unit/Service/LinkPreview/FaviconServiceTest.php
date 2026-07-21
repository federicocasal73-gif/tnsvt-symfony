<?php

declare(strict_types=1);

namespace App\Tests\Unit\Service\LinkPreview;

use App\Service\LinkPreview\FaviconService;
use PHPUnit\Framework\TestCase;

final class FaviconServiceTest extends TestCase
{
    public function testReturnsGoogleS2UrlForValidDomain(): void
    {
        $faviconsDir = sys_get_temp_dir() . '/tnsvt_test_favicons_' . uniqid();
        $service = new FaviconService($faviconsDir);

        $url = $service->googleS2Url('tradingview.com');
        $this->assertStringContainsString('google.com/s2/favicons', $url);
        $this->assertStringContainsString('tradingview.com', $url);

        // Cleanup
        @rmdir($faviconsDir);
    }

    public function testReturnsEmptyForInvalidDomain(): void
    {
        $service = new FaviconService(sys_get_temp_dir());

        $this->assertSame('', $service->googleS2Url(''));
        $this->assertSame('', $service->googleS2Url('not a domain'));
    }

    public function testExtractsIconLinkFromHtml(): void
    {
        $service = new FaviconService(sys_get_temp_dir());

        $html = '<html><head><link rel="icon" href="/favicon.ico" type="image/x-icon"></head></html>';
        $this->assertSame('https://example.com/favicon.ico', $service->extractFromHtml($html, 'https://example.com/page'));

        $html2 = '<html><head><link rel="apple-touch-icon" sizes="180x180" href="/apple.png"></head></html>';
        $this->assertSame('https://example.com/apple.png', $service->extractFromHtml($html2, 'https://example.com/'));

        $htmlEmpty = '<html><head></head></html>';
        $this->assertNull($service->extractFromHtml($htmlEmpty, 'https://example.com/'));
    }
}