<?php

namespace App\Security;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

/**
 * Helper para endpoints admin.
 * El admin se autentica con el header X-Admin-Password.
 * El mismo password se usa en /admin/login del front.
 */
trait AdminAuthTrait
{
    public const ADMIN_PASSWORD = 'TNSVT-2026-CristoRey!';

    /**
     * Verifica el header X-Admin-Password.
     * Lanza 401 si no coincide.
     */
    protected function requireAdmin(Request $request): void
    {
        $provided = $request->headers->get('X-Admin-Password', '');
        if (!hash_equals(self::ADMIN_PASSWORD, $provided)) {
            throw new AccessDeniedHttpException('Admin password required (X-Admin-Password header)');
        }
    }
}
