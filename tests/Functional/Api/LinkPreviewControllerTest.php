<?php

declare(strict_types=1);

namespace App\Tests\Functional\Api;

use App\Controller\Api\LinkPreviewController;
use App\Entity\LinkPreview;
use App\Service\LinkPreview\InvalidUrlException;
use App\Service\LinkPreview\LinkPreviewService;
use App\Service\LinkPreview\SsrfException;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

final class LinkPreviewControllerTest extends TestCase
{
    public function testReturns400WhenUrlMissing(): void
    {
        $controller = $this->controllerWithService();
        $response = $controller->preview($this->jsonRequest('{}'));
        self::assertSame(Response::HTTP_BAD_REQUEST, $response->getStatusCode());
        $data = json_decode($response->getContent(), true);
        self::assertFalse($data['success']);
        self::assertSame('url_required', $data['error']);
    }

    public function testReturns400ForInvalidUrl(): void
    {
        $service = $this->createMock(LinkPreviewService::class);
        $service->method('preview')->willThrowException(new InvalidUrlException('Invalid URL'));
        $controller = $this->controllerWithService($service);
        $response = $controller->preview($this->jsonRequest('{"url":"not-a-url"}'));
        self::assertSame(Response::HTTP_BAD_REQUEST, $response->getStatusCode());
        $data = json_decode($response->getContent(), true);
        self::assertFalse($data['success']);
        self::assertSame('invalid_url', $data['error']);
    }

    public function testReturns403ForBlockedUrl(): void
    {
        $service = $this->createMock(LinkPreviewService::class);
        $service->method('preview')->willThrowException(new SsrfException('Blocked'));
        $controller = $this->controllerWithService($service);
        $response = $controller->preview($this->jsonRequest('{"url":"http://169.254.169.254/"}'));
        self::assertSame(Response::HTTP_FORBIDDEN, $response->getStatusCode());
        $data = json_decode($response->getContent(), true);
        self::assertFalse($data['success']);
        self::assertSame('blocked_url', $data['error']);
    }

    public function testReturnsPreviewForValidUrl(): void
    {
        $preview = new LinkPreview();
        $preview->setUrl('https://example.com');
        $preview->setDomain('example.com');
        $preview->setTitle('Example Title');
        $preview->setDescription('Example Description');
        $preview->setSiteName('Example');
        $preview->setType('website');
        $preview->setLastUpdate(new \DateTimeImmutable());
        $preview->setExpiresAt(new \DateTimeImmutable('+86400 seconds'));
        $preview->setUrlHash(hash('sha256', 'https://example.com'));

        $service = $this->createMock(LinkPreviewService::class);
        $service->method('preview')->willReturn($preview);
        $controller = $this->controllerWithService($service);
        $response = $controller->preview($this->jsonRequest('{"url":"https://example.com"}'));
        self::assertSame(Response::HTTP_OK, $response->getStatusCode());
        $data = json_decode($response->getContent(), true);
        self::assertTrue($data['success']);
        self::assertSame('https://example.com', $data['preview']['url']);
        self::assertSame('Example Title', $data['preview']['title']);
    }

    public function testRespectsForceParam(): void
    {
        $service = $this->createMock(LinkPreviewService::class);
        $service->expects(self::once())->method('preview')->with('https://example.com', true);
        $controller = $this->controllerWithService($service);
        $controller->preview($this->jsonRequest('{"url":"https://example.com","force":true}'));
    }

    public function testReturns500OnUnexpectedError(): void
    {
        $service = $this->createMock(LinkPreviewService::class);
        $service->method('preview')->willThrowException(new \RuntimeException('Unexpected'));
        $controller = $this->controllerWithService($service);
        $response = $controller->preview($this->jsonRequest('{"url":"https://example.com"}'));
        self::assertSame(Response::HTTP_INTERNAL_SERVER_ERROR, $response->getStatusCode());
        $data = json_decode($response->getContent(), true);
        self::assertFalse($data['success']);
        self::assertSame('server_error', $data['error']);
    }

    private function controllerWithService(?LinkPreviewService $service = null): LinkPreviewController
    {
        return new LinkPreviewController(
            $service ?? $this->createMock(LinkPreviewService::class),
        );
    }

    private function jsonRequest(string $jsonBody): Request
    {
        $request = new Request([], [], [], [], [], [], $jsonBody);
        $request->setMethod('POST');
        $request->headers->set('Content-Type', 'application/json');
        return $request;
    }
}
