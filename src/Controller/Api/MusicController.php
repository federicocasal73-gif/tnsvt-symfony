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

    private const MAX_BYTES = 200 * 1024 * 1024;

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
        if (!is_array($data) || empty($data['source'])) {
            return null;
        }
        if ($data['source'] === 'external') {
            return $data;
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

    #[Route('/external', name: 'api_admin_music_set_external', methods: ['POST'])]
    public function setExternal(Request $request): JsonResponse
    {
        if ($denied = $this->requireAdmin($this->userRepository, $this->tokenStorage)) {
            return $denied;
        }
        $data = json_decode($request->getContent(), true) ?? [];
        $url = trim((string) ($data['url'] ?? ''));
        $label = trim((string) ($data['label'] ?? ''));
        if (!$url) {
            return $this->json(['error' => 'La URL es requerida'], Response::HTTP_BAD_REQUEST);
        }
        if (!preg_match('#^https?://#i', $url)) {
            return $this->json(['error' => 'La URL debe empezar con http:// o https://'], Response::HTTP_BAD_REQUEST);
        }

        $isGoogleDrive = (bool) preg_match('#^https?://(drive|drive\.usercontent)\.google\.com/#i', $url);
        $downloadUrl = $url;
        if ($isGoogleDrive) {
            $fileId = $this->extractGoogleDriveId($url);
            if ($fileId) {
                $downloadUrl = 'https://drive.usercontent.google.com/download?id=' . $fileId . '&export=download&confirm=t';
            }
        }

        $dir = $this->audioDir();
        foreach (glob($dir . '/bg-music.*') as $old) { @unlink($old); }
        $meta = [
            'source' => 'external',
            'url' => $url,
            'downloadUrl' => $downloadUrl,
            'originalName' => $label ?: 'Stream externo',
            'uploadedAt' => (new \DateTimeImmutable())->format('Y-m-d H:i:s'),
            'uploadedBy' => $this->tokenStorage->getToken()?->getUserIdentifier() ?? 'admin',
        ];
        file_put_contents($dir . '/current.json', json_encode($meta, JSON_PRETTY_PRINT));

        return $this->json([
            'success' => true,
            'hasMusic' => true,
            'source' => 'external',
            'url' => $url,
            'originalName' => $meta['originalName'],
        ]);
    }

    private function extractGoogleDriveId(string $url): ?string
    {
        if (preg_match('#/file/d/([a-zA-Z0-9_-]+)#', $url, $m)) return $m[1];
        if (preg_match('#[?&]id=([a-zA-Z0-9_-]+)#', $url, $m)) return $m[1];
        return null;
    }

    #[Route('/stream', name: 'api_music_stream', methods: ['GET'])]
    public function streamFile(Request $request): Response
    {
        $current = $this->currentFile();
        if (!$current) {
            return new JsonResponse(['error' => 'No hay música configurada'], Response::HTTP_NOT_FOUND);
        }

        if (($current['source'] ?? '') === 'external') {
            return $this->proxyExternal($current, $request);
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

    private function proxyExternal(array $current, Request $request): Response
    {
        $src = $current['downloadUrl'] ?? $current['url'] ?? null;
        if (!$src) {
            return new JsonResponse(['error' => 'URL externa inválida'], Response::HTTP_BAD_REQUEST);
        }
        $dir = $this->audioDir();
        $cachedPath = $dir . '/external-cache.bin';
        $metaCache = $dir . '/external-cache.meta.json';

        $needDownload = true;
        if (is_file($cachedPath) && is_file($metaCache)) {
            $cm = json_decode((string) file_get_contents($metaCache), true);
            if (is_array($cm) && ($cm['url'] ?? null) === $src && ($cm['downloaded'] ?? false)) {
                $needDownload = false;
            }
        }

        if ($needDownload) {
            $bytes = $this->downloadToFile($src, $cachedPath);
            if ($bytes === false || $bytes === 0) {
                return new JsonResponse(['error' => 'No se pudo descargar el audio desde la URL externa (¿es público?). Probá subir el archivo desde el panel.'], Response::HTTP_BAD_GATEWAY);
            }
            $mime = $this->detectAudioMime($cachedPath);
            file_put_contents($metaCache, json_encode([
                'url' => $src,
                'size' => $bytes,
                'mime' => $mime,
                'downloaded' => true,
                'downloadedAt' => (new \DateTimeImmutable())->format('Y-m-d H:i:s'),
            ], JSON_PRETTY_PRINT));
        }

        $size = filesize($cachedPath);
        $mime = 'audio/mpeg';
        if (is_file($metaCache)) {
            $cm = json_decode((string) file_get_contents($metaCache), true);
            if (!empty($cm['mime'])) $mime = $cm['mime'];
        }

        $rangeHeader = $request->headers->get('Range');
        $start = 0;
        $end = $size - 1;
        $statusCode = 200;
        $headers = [
            'Content-Type' => $mime,
            'Accept-Ranges' => 'bytes',
            'Cache-Control' => 'no-cache, must-revalidate',
        ];
        if ($rangeHeader && preg_match('/bytes=(\d*)-(\d*)/', $rangeHeader, $m)) {
            $start = $m[1] !== '' ? (int) $m[1] : 0;
            $end = $m[2] !== '' ? (int) $m[2] : ($size - 1);
            if ($start > $end || $start >= $size) {
                return new Response('', 416, ['Content-Range' => 'bytes */' . $size]);
            }
            $statusCode = 206;
            $headers['Content-Range'] = 'bytes ' . $start . '-' . $end . '/' . $size;
        }
        $length = $end - $start + 1;
        $headers['Content-Length'] = (string) $length;

        $fh = fopen($cachedPath, 'rb');
        if ($fh === false) {
            return new JsonResponse(['error' => 'No se pudo abrir el archivo cacheado'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
        fseek($fh, $start);
        $body = stream_get_contents($fh, $length);
        fclose($fh);

        return new Response($body !== false ? $body : '', $statusCode, $headers);
    }

    private function downloadToFile(string $url, string $destPath): int|false
    {
        if (function_exists('curl_init')) {
            return $this->downloadToFileCurl($url, $destPath);
        }
        $ctx = stream_context_create(['http' => [
            'timeout' => 600,
            'follow_location' => 1,
            'max_redirects' => 5,
            'ignore_errors' => true,
            'header' => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) TNSVT-Music/1.0\r\n",
        ]]);
        $data = @file_get_contents($url, false, $ctx);
        if ($data === false || $data === '') {
            return false;
        }
        if (file_put_contents($destPath, $data) === false) {
            return false;
        }
        return strlen($data);
    }

    private function downloadToFileCurl(string $url, string $destPath): int|false
    {
        $fp = @fopen($destPath, 'wb');
        if (!$fp) return false;
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_FILE => $fp,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 5,
            CURLOPT_CONNECTTIMEOUT => 30,
            CURLOPT_TIMEOUT => 600,
            CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) TNSVT-Music/1.0',
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => 0,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_2_0,
        ]);
        $ok = curl_exec($ch);
        $err = curl_error($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        fclose($fp);
        if (!$ok || $code >= 400) {
            @unlink($destPath);
            return false;
        }
        $size = filesize($destPath);
        return $size === false ? false : $size;
    }

    private function detectAudioMime(string $path): string
    {
        $fh = fopen($path, 'rb');
        if (!$fh) return 'audio/mpeg';
        $head = fread($fh, 16);
        fclose($fh);
        $h = substr($head, 0, 4);
        if ($h === "RIFF" && substr($head, 8, 4) === 'WAVE') return 'audio/wav';
        if (substr($head, 0, 3) === 'ID3' || (ord($head[0] ?? "\0") === 0xFF && (ord($head[1] ?? "\0") & 0xE0) === 0xE0)) return 'audio/mpeg';
        if (substr($head, 0, 4) === "OggS") return 'audio/ogg';
        if (substr($head, 4, 4) === 'ftyp') return 'audio/mp4';
        return 'audio/mpeg';
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
            return $this->json(['error' => 'Máximo 200 MB. Para archivos más grandes usá la opción "URL externa".'], Response::HTTP_BAD_REQUEST);
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
