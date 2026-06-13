<?php

namespace App\EventSubscriber;

use App\Repository\UserRepository;
use Psr\Log\LoggerInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;
use Symfony\Component\Security\Core\Authentication\Token\UsernamePasswordToken;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;

/**
 * Permite que los endpoints /api/admin/* acepten autenticacion via
 * header X-User-Code (o query param user_code) ademas del cookie
 * de sesion. Util para la app mobile donde el manejo de cookies
 * puede ser menos confiable.
 */
class AdminAuthFromHeaderSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private TokenStorageInterface $tokenStorage,
        private UserRepository $userRepository,
        private LoggerInterface $logger,
    ) {}

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::REQUEST => ['onRequest', 10],
        ];
    }

    public function onRequest(RequestEvent $event): void
    {
        $this->logger->info('[AdminAuthFromHeader] subscriber invoked, path=' . $event->getRequest()->getPathInfo());
        if (!$event->isMainRequest()) {
            return;
        }
        $request = $event->getRequest();
        $path = $request->getPathInfo();

        if (!str_starts_with($path, '/api/admin')) {
            return;
        }

        $existingUser = $this->tokenStorage->getToken()?->getUser();
        $this->logger->info('[AdminAuthFromHeader] on /api/admin, existing user=' . ($existingUser ? 'yes' : 'no'));
        if ($existingUser !== null) {
            return;
        }

        $code = $request->headers->get('X-User-Code')
            ?? $request->query->get('user_code');

        if (!$code) {
            $this->logger->info('[AdminAuthFromHeader] no X-User-Code header or user_code query');
            return;
        }

        $code = strtoupper(trim((string) $code));
        $user = $this->userRepository->findByCode($code);
        if (!$user || !$user->isActive()) {
            $this->logger->warning('[AdminAuthFromHeader] user not found or inactive: ' . $code);
            throw new AccessDeniedException('Usuario no encontrado o inactivo');
        }

        $token = new UsernamePasswordToken($user, 'main', $user->getRoles());
        $this->tokenStorage->setToken($token);
        $this->logger->info('[AdminAuthFromHeader] token set for: ' . $code);
        $this->logger->info('[AdminAuthFromHeader] token roles: ' . implode(',', $token->getRoleNames()));
        $this->logger->info('[AdminAuthFromHeader] token user class: ' . get_class($token->getUser()));
        $this->logger->info('[AdminAuthFromHeader] token user identifier: ' . $token->getUserIdentifier());
    }
}
