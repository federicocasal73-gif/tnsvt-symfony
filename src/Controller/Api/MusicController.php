<?php

namespace App\Controller\Api;

use App\Controller\Api\Admin\RequireAdminTrait;
use App\Repository\UserRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;

#[Route('/api/music')]
class MusicController extends AbstractController
{
    use RequireAdminTrait;

    private const ALLOWED_MIME = [
        'audio/mpeg' => 'mp3',
        'audio/mp3' => 'mp3',
        'audio/wav' => 'wav',
        'audio/x-wav' => 'wav',
        'audio/ogg' => 'ogg',
        'audio/mp4' => 'm4a',
        'audio/x-m4a' => 'm4a',
        'audio/aac' => 'aac',
    ];

    private const MAX_BYTES = 50 * 1024 * 1024;

    public function __construct(
        private UserRepository $userRepository,
        private TokenStorageInterface $tokenStorage,
    ) {}

    private function audioDir(): string
    {
        return $this->getParameter('kernel.project_dir') . '/public/audio';
    }

    private function currentFile(): ?array
    {
        $dir = $this->audioDir();
        $metaPath = $dir . '/current.json';
        if (!is_file($metaPath)) {
            return null;
        }
        $data = json_decode((string) file_get_contents($metaPath), true);
        if (!is_array($data) || empty($data['filename'])) {
            return null;
        }
        $path = $dir . '/' . $data['filename'];
        if (!is_file($path)) {
            return null;
        }
        $data['size'] = filesize($path);
        $data['url'] = '/audio/' . $data['filename'];
        return $data;
    }

    #[Route('', name: 'api_music_current', methods: ['GET'])]
    public function current(): JsonResponse
    {
        $current = $this->currentFile();
        if (!$current) {
            return $this->json(['hasMusic' => false]);
        }
        return $this->json(['hasMusic' => true] + $current);
    }

    #[Route('/stream', name: 'api_music_stream', methods: ['GET'])]
    public function streamFile(): Response
    {
        $current = $this->currentFile();
        if (!$current) {
            return new JsonResponse(['error' => 'No hay música configurada'], Response::HTTP_NOT_FOUND);
        }
        $path = $this->audioDir() . '/' . $current['filename'];
        $response = new BinaryFileResponse($path);
        $response->headers->set('Content-Type', $current['mime'] ?? 'audio/mpeg');
        $response->headers->set('Accept-Ranges', 'bytes');
        $response->setContentDisposition(
            ResponseHeaderBag::DISPOSITION_INLINE,
            $current['originalName'] ?? $current['filename']
        );
        $response->setPublic();
        $response->setMaxAge(0);
        $response->headers->addCacheControlDirective('no-cache', true);
        $response->headers->addCacheControlDirective('must-revalidate', true);
        return $response;
    }

    #[Route('', name: 'api_admin_music_upload', methods: ['POST'])]
    public function upload(Request $request): JsonResponse
    {
        if ($denied = $this->requireAdmin($this->userRepository, $this->tokenStorage)) {
            return $denied;
        }
        $file = $request->files->get('file');
        if (!$file) {
            return $this->json(['error' => 'Subí un archivo de audio'], Response::HTTP_BAD_REQUEST);
        }
        if (!$file->isValid()) {
            return $this->json(['error' => 'Archivo inválido'], Response::HTTP_BAD_REQUEST);
        }
        if ($file->getSize() > self::MAX_BYTES) {
            return $this->json(['error' => 'Máximo 50 MB'], Response::HTTP_BAD_REQUEST);
        }
        $mime = (string) $file->getMimeType();
        if (!isset(self::ALLOWED_MIME[$mime])) {
            return $this->json([
                'error' => 'Formato no soportado. Usá mp3, wav, ogg, m4a o aac.',
                'mimeRecibido' => $mime,
            ], Response::HTTP_BAD_REQUEST);
        }
        $ext = self::ALLOWED_MIME[$mime];
        $dir = $this->audioDir();
        foreach (glob($dir . '/bg-music.*') as $old) {
            @unlink($old);
        }
        $filename = 'bg-music.' . $ext;
        $file->move($dir, $filename);
        $meta = [
            'filename' => $filename,
            'originalName' => $file->getClientOriginalName() ?: $filename,
            'mime' => $mime,
            'size' => filesize($dir . '/' . $filename),
            'uploadedAt' => (new \DateTimeImmutable())->format('Y-m-d H:i:s'),
            'uploadedBy' => $this->tokenStorage->getToken()?->getUserIdentifier() ?? 'admin',
        ];
        file_put_contents($dir . '/current.json', json_encode($meta, JSON_PRETTY_PRINT));
        return $this->json([
            'success' => true,
            'hasMusic' => true,
            'filename' => $filename,
            'originalName' => $meta['originalName'],
            'size' => $meta['size'],
            'mime' => $mime,
            'url' => '/audio/' . $filename,
        ]);
    }

    #[Route('', name: 'api_admin_music_delete', methods: ['DELETE'])]
    public function delete(): JsonResponse
    {
        if ($denied = $this->requireAdmin($this->userRepository, $this->tokenStorage)) {
            return $denied;
        }
        $dir = $this->audioDir();
        foreach (glob($dir . '/bg-music.*') as $old) {
            @unlink($old);
        }
        $metaPath = $dir . '/current.json';
        if (is_file($metaPath)) @unlink($metaPath);
        return $this->json(['success' => true, 'hasMusic' => false]);
    }
}
