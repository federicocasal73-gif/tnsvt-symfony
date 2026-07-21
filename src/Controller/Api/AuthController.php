<?php

namespace App\Controller\Api;

use App\Entity\User;
use App\Repository\UserRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;
use Symfony\Component\Security\Core\Authentication\Token\UsernamePasswordToken;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/auth')]
class AuthController extends AbstractController
{
    /**
     * Helper que devuelve un error JSON con Content-Length explícito.
     * Evita Transfer-Encoding: chunked en respuestas 4xx para que el hcdn
     * de Hostinger no strippee el body (causa del "Failed to load resource 401").
     */
    private function jsonError(string $message, int $status, string $errorCode = ''): Response
    {
        $payload = ['success' => false, 'error' => $message];
        if ($errorCode !== '') {
            $payload['error_code'] = $errorCode;
        }
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $response = new Response($body, $status);
        $response->headers->set('Content-Type', 'application/json; charset=utf-8');
        $response->headers->set('Content-Length', (string) strlen($body));
        $response->headers->set('X-TNSVT-Error', '1');

        return $response;
    }

    #[Route('/login', name: 'api_auth_login', methods: ['POST'])]
    public function login(
        Request $request,
        UserRepository $userRepository,
        UserPasswordHasherInterface $passwordHasher,
        TokenStorageInterface $tokenStorage,
    ): JsonResponse|Response {
        $data = json_decode($request->getContent(), true);
        $code = strtoupper(trim($data['code'] ?? ''));
        $name = trim($data['name'] ?? '');
        $password = $data['password'] ?? null;

        if (empty($code)) {
            return $this->jsonError('Código de acceso requerido', Response::HTTP_BAD_REQUEST, 'code_required');
        }

        $user = $userRepository->findByCode($code);

        if (!$user || !$user->isActive()) {
            return $this->jsonError('Código inválido o desactivado', Response::HTTP_UNAUTHORIZED, 'invalid_code');
        }

        if (in_array('ROLE_ADMIN', $user->getRoles(), true)) {
            if (empty($password)) {
                return $this->jsonError('Contraseña requerida para administradores', Response::HTTP_UNAUTHORIZED, 'admin_password_required');
            }
            if (!$passwordHasher->isPasswordValid($user, $password)) {
                return $this->jsonError('Contraseña incorrecta', Response::HTTP_UNAUTHORIZED, 'admin_password_invalid');
            }
        } elseif (strcasecmp(trim($user->getName()), $name) !== 0) {
            return $this->jsonError('Nombre de usuario incorrecto', Response::HTTP_UNAUTHORIZED, 'name_invalid');
        }

        $user->setLastLogin(new \DateTimeImmutable());
        $userRepository->getEntityManager()->flush();

        $token = new UsernamePasswordToken($user, 'main', $user->getRoles());
        $tokenStorage->setToken($token);
        $request->getSession()->save();

        return $this->json([
            'success' => true,
            'user' => [
                'code' => $user->getCode(),
                'name' => $user->getName(),
                'isAdmin' => in_array('ROLE_ADMIN', $user->getRoles(), true),
            ],
        ]);
    }

    #[Route('/check', name: 'api_auth_check', methods: ['GET'])]
    public function check(#[CurrentUser] ?User $user): JsonResponse
    {
        if (!$user) {
            return $this->json(['authenticated' => false]);
        }

        return $this->json([
            'authenticated' => true,
            'user' => [
                'code' => $user->getCode(),
                'name' => $user->getName(),
                'isAdmin' => in_array('ROLE_ADMIN', $user->getRoles(), true),
            ],
        ]);
    }
}
