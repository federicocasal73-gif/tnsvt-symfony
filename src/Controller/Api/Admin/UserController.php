<?php

namespace App\Controller\Api\Admin;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/admin/users')]
class UserController extends AbstractController
{
    #[Route('', name: 'api_admin_users_list', methods: ['GET'])]
    public function list(UserRepository $userRepository): JsonResponse
    {
        $users = $userRepository->findAll();
        $data = array_map(fn(User $u) => [
            'id' => $u->getId(),
            'code' => $u->getCode(),
            'name' => $u->getName(),
            'active' => $u->isActive(),
            'isAdmin' => in_array('ROLE_ADMIN', $u->getRoles(), true),
            'lastLogin' => $u->getLastLogin()?->format('Y-m-d H:i:s'),
        ], $users);

        usort($data, fn($a, $b) => $a['id'] <=> $b['id']);

        return $this->json($data);
    }

    #[Route('/{id}', name: 'api_admin_users_get', methods: ['GET'])]
    public function get(User $user): JsonResponse
    {
        return $this->json([
            'id' => $user->getId(),
            'code' => $user->getCode(),
            'name' => $user->getName(),
            'active' => $user->isActive(),
            'isAdmin' => in_array('ROLE_ADMIN', $user->getRoles(), true),
            'lastLogin' => $user->getLastLogin()?->format('Y-m-d H:i:s'),
        ]);
    }

    #[Route('', name: 'api_admin_users_create', methods: ['POST'])]
    public function create(Request $request, UserRepository $userRepository, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $code = strtoupper(trim($data['code'] ?? ''));
        $name = trim($data['name'] ?? '');

        if (empty($code) || empty($name)) {
            return $this->json(['error' => 'Código y nombre son requeridos'], Response::HTTP_BAD_REQUEST);
        }

        $existing = $userRepository->findOneBy(['code' => $code]);
        if ($existing) {
            return $this->json(['error' => sprintf('El código "%s" ya existe', $code)], Response::HTTP_CONFLICT);
        }

        $user = new User();
        $user->setCode($code);
        $user->setName($name);
        $user->setRoles(['ROLE_USER']);

        $em->persist($user);
        $em->flush();

        return $this->json([
            'id' => $user->getId(),
            'code' => $user->getCode(),
            'name' => $user->getName(),
            'active' => $user->isActive(),
            'isAdmin' => false,
        ], Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'api_admin_users_update', methods: ['PUT'])]
    public function update(Request $request, User $user, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (isset($data['name'])) {
            $user->setName(trim($data['name']));
        }
        if (isset($data['code'])) {
            $user->setCode(strtoupper(trim($data['code'])));
        }
        if (isset($data['active'])) {
            $user->setActive((bool)$data['active']);
        }

        $em->flush();

        return $this->json([
            'id' => $user->getId(),
            'code' => $user->getCode(),
            'name' => $user->getName(),
            'active' => $user->isActive(),
            'isAdmin' => in_array('ROLE_ADMIN', $user->getRoles(), true),
        ]);
    }

    #[Route('/{id}/toggle-active', name: 'api_admin_users_toggle', methods: ['PUT'])]
    public function toggleActive(User $user, EntityManagerInterface $em): JsonResponse
    {
        $user->setActive(!$user->isActive());
        $em->flush();

        return $this->json([
            'id' => $user->getId(),
            'active' => $user->isActive(),
        ]);
    }
}