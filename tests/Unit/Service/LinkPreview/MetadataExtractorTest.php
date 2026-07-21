<?php

declare(strict_types=1);

namespace App\Tests\Unit\Service\LinkPreview;

use App\Service\LinkPreview\MetadataExtractor;
use PHPUnit\Framework\TestCase;

final class MetadataExtractorTest extends TestCase
{
    private MetadataExtractor $extractor;

    protected function setUp(): void
    {
        $this->extractor = new MetadataExtractor();
    }

    public function testExtractsOpenGraphMetadata(): void
    {
        $html = <<<'HTML'
            <html>
            <head>
                <meta property="og:title" content="XAUUSD Analysis">
                <meta property="og:description" content="Gold technical analysis">
                <meta property="og:image" content="https://example.com/preview.jpg">
                <meta property="og:url" content="https://example.com/page">
                <meta property="og:site_name" content="Example Site">
                <meta property="og:type" content="article">
            </head>
            <body></body>
            </html>
            HTML;

        $result = $this->extractor->extract($html, 'https://example.com/page');

        $this->assertSame('XAUUSD Analysis', $result['title']);
        $this->assertSame('Gold technical analysis', $result['description']);
        $this->assertSame('https://example.com/preview.jpg', $result['image']);
        $this->assertSame('Example Site', $result['site_name']);
        $this->assertSame('article', $result['type']);
        $this->assertSame('opengraph', $result['source_priority']); // OG has priority
    }

    public function testFallsBackToTwitterCardsWhenOgMissing(): void
    {
        $html = <<<'HTML'
            <html>
            <head>
                <meta name="twitter:title" content="Twitter Title">
                <meta name="twitter:description" content="Twitter desc">
                <meta name="twitter:image" content="https://example.com/tw.jpg">
            </head>
            </html>
            HTML;

        $result = $this->extractor->extract($html, 'https://example.com/');

        $this->assertSame('Twitter Title', $result['title']);
        $this->assertSame('Twitter desc', $result['description']);
        $this->assertSame('https://example.com/tw.jpg', $result['image']);
        $this->assertSame('twitter_cards', $result['source_priority']);
    }

    public function testFallsBackToHtmlTitleAndMetaDescription(): void
    {
        $html = <<<'HTML'
            <html>
            <head>
                <title>HTML Page Title</title>
                <meta name="description" content="Meta description from HTML">
            </head>
            </html>
            HTML;

        $result = $this->extractor->extract($html, 'https://example.com/');

        $this->assertSame('HTML Page Title', $result['title']);
        $this->assertSame('Meta description from HTML', $result['description']);
        $this->assertNull($result['image']);
        $this->assertSame('html', $result['source_priority']);
    }

    public function testExtractsJsonLdSchemaOrg(): void
    {
        $html = <<<'HTML'
            <html>
            <head>
                <script type="application/ld+json">
                    {
                        "@context": "https://schema.org",
                        "@type": "Article",
                        "headline": "JSON-LD Headline",
                        "description": "From schema.org",
                        "image": "https://example.com/jsonld.jpg",
                        "author": {"@type": "Person", "name": "John"}
                    }
                </script>
            </head>
            </html>
            HTML;

        $result = $this->extractor->extract($html, 'https://example.com/');

        // JSON-LD supplements, doesn't override OG. So title remains empty here.
        $this->assertSame('https://example.com/jsonld.jpg', $result['jsonld_image']);
        $this->assertSame('Article', $result['jsonld_type']);
    }

    public function testHandlesEmptyOrMalformedHtml(): void
    {
        $this->assertNull($this->extractor->extract('', 'https://example.com/')['title']);
        $this->assertNull($this->extractor->extract('<html></html>', 'https://example.com/')['title']);
        // Garbage doesn't throw.
        $this->assertNull($this->extractor->extract('not even html', 'https://example.com/')['title']);
    }

    public function testResolvesRelativeImageUrl(): void
    {
        $html = '<html><head><meta property="og:image" content="/img/preview.jpg"></head></html>';
        $result = $this->extractor->extract($html, 'https://example.com/page');
        $this->assertSame('https://example.com/img/preview.jpg', $result['image']);
    }
}