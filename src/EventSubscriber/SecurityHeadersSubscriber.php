<?php

namespace App\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * Agrega headers de seguridad HTTP a todas las responses:
 * - Content-Security-Policy: permite FCM, Capacitor y self
 * - X-Content-Type-Options: nosniff
 * - X-Frame-Options: DENY (anti clickjacking)
 * - Referrer-Policy: strict-origin-when-cross-origin
 * - Permissions-Policy: deshabilita features que no usamos
 *
 * Para dev (HTTP localhost) usa CSP permisivo. Para prod (HTTPS)
 * se va ajustando.
 */
class SecurityHeadersSubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::RESPONSE => ['onResponse', -10],
        ];
    }

    public function onResponse(ResponseEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $response = $event->getResponse();
        $request = $event->getRequest();
        $isHttps = $request->isSecure();
        $isDev = ($_SERVER['APP_ENV'] ?? getenv('APP_ENV')) === 'dev';

        // CSP: permite Firebase Cloud Messaging, Capacitor scheme, y self
        // - default-src 'self': solo recursos del mismo origen por default
        // - script-src 'self' 'unsafe-inline' https://www.gstatic.com:
        //   permite scripts inline (Twig) y Firebase SDK
        // - style-src 'self' 'unsafe-inline' https://fonts.googleapis.com:
        //   permite CSS inline y Google Fonts
        // - img-src 'self' data: blob: https: http://192.168.*:
        //   permite imagenes, data URIs, y HTTP local (para tests)
        // - connect-src 'self' https://fcm.googleapis.com https://fcmregistrations.googleapis.com wss: http://192.168.*:
        //   permite FCM push, WebSockets, y HTTP local
        // - font-src 'self' data: https://fonts.gstatic.com:
        //   permite Google Fonts
        // - media-src 'self' https: http://192.168.*: blob::
        //   permite streaming de audio
        // - frame-src 'self' https://*.firebaseapp.com:
        //   permite iframes de Firebase
        // - worker-src 'self' blob::
        //   permite service workers
        // - manifest-src 'self':
        //   permite manifest.json
        $csp = "default-src 'self';"
            . " script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com;"
            . " style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;"
            . " img-src 'self' data: blob: https: http:;"
            . " font-src 'self' data: https://fonts.gstatic.com;"
            . " connect-src 'self' https://fcm.googleapis.com https://fcmregistrations.googleapis.com https://*.firebaseio.com https://*.googleapis.com wss: ws: http: https: data: blob:;"
            . " media-src 'self' https: http: blob: data:;"
            . " frame-ancestors 'self';"
            . " frame-src 'self' https://*.firebaseapp.com https://*.googleapis.com;"
            . " worker-src 'self' blob:;"
            . " manifest-src 'self';"
            . " object-src 'none';"
            . " base-uri 'self';"
            . " form-action 'self';";
        $response->headers->set('Content-Security-Policy', $csp);

        // Anti MIME-sniffing
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // Anti clickjacking:
        // - En dev: NO se envia X-Frame-Options porque rompe el WebView de
        //   Capacitor (rechaza cargar la pagina en su iframe interno).
        //   frame-ancestors 'self' en CSP es el reemplazo moderno.
        // - En prod: X-Frame-Options: DENY para anti-clickjacking estricto.
        if (!$isDev) {
            $response->headers->set('X-Frame-Options', 'DENY');
        }

        // Referrer
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Permissions Policy: deshabilita features que no usamos
        $response->headers->set('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()');

        // HSTS solo en HTTPS (1 ano, include subdomains)
        if ($isHttps) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }
    }
}
