<?php

namespace App\Controller\Api;

use App\Repository\UserRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/auth')]
class AuthController extends AbstractController
{
    #[Route('/login', name: 'api_auth_login', methods: ['POST'])]
    public function login(Request $request, UserRepository $userRepository): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $code = strtoupper(trim($data['code'] ?? ''));

        if (empty($code)) {
            return $this->json(['success' => false, 'error' => 'Código de acceso requerido'], Response::HTTP_BAD_REQUEST);
        }

        $user = $userRepository->findByCode($code);

        if (!$user || !$user->isActive()) {
            return $this->json(['success' => false, 'error' => 'Código inválido o desactivado'], Response::HTTP_UNAUTHORIZED);
        }

        $user->setLastLogin(new \DateTimeImmutable());
        $userRepository->getEntityManager()->flush();

        return $this->json([
            'success' => true,
            'user' => [
                'code' => $user->getCode(),
                'name' => $user->getName(),
            ],
        ]);
    }

    #[Route('/check', name: 'api_auth_check', methods: ['GET'])]
    public function check(#[CurrentUser] ?\App\Entity\User $user): JsonResponse
    {
        if (!$user) {
            return $this->json(['authenticated' => false]);
        }

        return $this->json([
            'authenticated' => true,
            'user' => [
                'code' => $user->getCode(),
                'name' => $user->getName(),
            ],
        ]);
    }
}
