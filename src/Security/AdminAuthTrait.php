<?php

namespace App\Security;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

/**
 * Helper para endpoints admin.
 * El admin se autentica con el header X-Admin-Password.
 * El mismo password se usa en /admin/login del front.
 *
 * La password se lee de la variable de entorno ADMIN_PASSWORD.
 * Si no está definida, se usa un valor default seguro (solo desarrollo).
 * En produccion, definir ADMIN_PASSWORD en .env.local (gitignored).
 */
trait AdminAuthTrait
{
    /**
     * Obtiene la password admin desde variable de entorno.
     * Nunca hardcodear en código fuente.
     */
    private function getAdminPassword(): string
    {
        return $_ENV['ADMIN_PASSWORD'] ?? $_SERVER['ADMIN_PASSWORD'] ?? 'change-me-in-env-local';
    }

    /**
     * Verifica el header X-Admin-Password.
     * Lanza 401 si no coincide.
     */
    protected function requireAdmin(Request $request): void
    {
        $provided = $request->headers->get('X-Admin-Password', '');
        if (!hash_equals($this->getAdminPassword(), $provided)) {
            throw new AccessDeniedHttpException('Acceso denegado');
        }
    }
}
