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
    #[Route('/login', name: 'api_auth_login', methods: ['POST'])]
    public function login(
        Request $request,
        UserRepository $userRepository,
        UserPasswordHasherInterface $passwordHasher,
        TokenStorageInterface $tokenStorage,
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);
        $code = strtoupper(trim($data['code'] ?? ''));
        $name = trim($data['name'] ?? '');
        $password = $data['password'] ?? null;

        if (empty($code)) {
            return $this->json(['success' => false, 'error' => 'Código de acceso requerido'], Response::HTTP_BAD_REQUEST);
        }

        $user = $userRepository->findByCode($code);

        if (!$user || !$user->isActive()) {
            return $this->json(['success' => false, 'error' => 'Código inválido o desactivado'], Response::HTTP_UNAUTHORIZED);
        }

        if (in_array('ROLE_ADMIN', $user->getRoles(), true)) {
            if (empty($password)) {
                return $this->json(['success' => false, 'error' => 'Contraseña requerida para administradores'], Response::HTTP_UNAUTHORIZED);
            }
            if (!$passwordHasher->isPasswordValid($user, $password)) {
                return $this->json(['success' => false, 'error' => 'Contraseña incorrecta'], Response::HTTP_UNAUTHORIZED);
            }
        } elseif (strcasecmp(trim($user->getName()), $name) !== 0) {
            return $this->json(['success' => false, 'error' => 'Nombre de usuario incorrecto'], Response::HTTP_UNAUTHORIZED);
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
