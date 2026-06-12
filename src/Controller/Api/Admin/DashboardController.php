<?php

namespace App\Controller\Api\Admin;

use App\Repository\UserRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/admin/dashboard')]
class DashboardController extends AbstractController
{
    #[Route('', name: 'api_admin_dashboard', methods: ['GET'])]
    public function index(UserRepository $userRepository): JsonResponse
    {
        $users = $userRepository->findAll();
        $total = count($users);
        $active = count(array_filter($users, fn($u) => $u->isActive()));
        $students = count(array_filter($users, fn($u) => !in_array('ROLE_ADMIN', $u->getRoles(), true)));
        $admins = count(array_filter($users, fn($u) => in_array('ROLE_ADMIN', $u->getRoles(), true)));

        $recentLogins = array_filter($users, fn($u) => $u->getLastLogin() !== null);
        usort($recentLogins, fn($a, $b) => $b->getLastLogin() <=> $a->getLastLogin());
        $recentLogins = array_slice($recentLogins, 0, 5);
        $recent = array_map(fn($u) => [
            'code' => $u->getCode(),
            'name' => $u->getName(),
            'lastLogin' => $u->getLastLogin()->format('Y-m-d H:i:s'),
        ], $recentLogins);

        return $this->json([
            'totalUsers' => $total,
            'activeUsers' => $active,
            'inactiveUsers' => $total - $active,
            'students' => $students,
            'admins' => $admins,
            'recentLogins' => $recent,
        ]);
    }
}