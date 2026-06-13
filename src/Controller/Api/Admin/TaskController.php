<?php

namespace App\Controller\Api\Admin;

use App\Entity\Task;
use App\Repository\TaskRepository;
use App\Repository\UserRepository;
use App\Service\PushService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;

#[Route('/api/admin/tasks')]
class TaskController extends AbstractController
{
    use RequireAdminTrait;

    public function __construct(
        private EntityManagerInterface $em,
        private TaskRepository $taskRepository,
        private PushService $pushService,
        private UserRepository $userRepository,
        private TokenStorageInterface $tokenStorage,
    ) {}

    #[Route('', name: 'api_admin_tasks_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        if ($denied = $this->requireAdmin($this->userRepository, $this->tokenStorage)) {
            return $denied;
        }

        $tasks = $this->taskRepository->findAllOrdered();

        $data = array_map(fn(Task $t) => [
            'id' => $t->getId(),
            'title' => $t->getTitle(),
            'description' => $t->getDescription(),
            'orden' => $t->getOrden(),
            'active' => $t->isActive(),
            'createdAt' => $t->getCreatedAt()?->format('Y-m-d H:i:s'),
        ], $tasks);

        return $this->json($data);
    }

    #[Route('', name: 'api_admin_tasks_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        if ($denied = $this->requireAdmin($this->userRepository, $this->tokenStorage)) {
            return $denied;
        }

        $data = json_decode($request->getContent(), true);

        $title = trim($data['title'] ?? '');
        if (empty($title)) {
            return $this->json(['error' => 'El título es requerido'], Response::HTTP_BAD_REQUEST);
        }

        $task = new Task();
        $task->setTitle($title);
        $task->setDescription($data['description'] ?? null);
        $task->setOrden((int) ($data['orden'] ?? 99));
        $task->setActive((bool) ($data['active'] ?? true));
        $task->setCreatedAt(new \DateTimeImmutable());

        $this->em->persist($task);
        $this->em->flush();

        $this->pushService->broadcast(
            'task',
            sprintf('Nueva tarea operativa: %s', $task->getTitle()),
            ['task_id' => (string) $task->getId()]
        );

        return $this->json([
            'id' => $task->getId(),
            'title' => $task->getTitle(),
            'description' => $task->getDescription(),
            'orden' => $task->getOrden(),
            'active' => $task->isActive(),
        ], Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'api_admin_tasks_update', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        if ($denied = $this->requireAdmin($this->userRepository, $this->tokenStorage)) {
            return $denied;
        }

        $task = $this->taskRepository->find($id);
        if (!$task) {
            return $this->json(['error' => 'Tarea no encontrada'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['title'])) $task->setTitle(trim($data['title']));
        if (isset($data['description'])) $task->setDescription($data['description']);
        if (isset($data['orden'])) $task->setOrden((int) $data['orden']);
        if (isset($data['active'])) $task->setActive((bool) $data['active']);

        $this->em->flush();

        $this->pushService->broadcast(
            'task',
            sprintf('Tarea actualizada: %s', $task->getTitle()),
            ['task_id' => (string) $task->getId()]
        );

        return $this->json(['success' => true]);
    }

    #[Route('/{id}', name: 'api_admin_tasks_delete', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        if ($denied = $this->requireAdmin($this->userRepository, $this->tokenStorage)) {
            return $denied;
        }

        $task = $this->taskRepository->find($id);
        if (!$task) {
            return $this->json(['error' => 'Tarea no encontrada'], Response::HTTP_NOT_FOUND);
        }

        $this->em->remove($task);
        $this->em->flush();

        return $this->json(['success' => true]);
    }

    #[Route('/{id}/toggle-active', name: 'api_admin_tasks_toggle', methods: ['PUT'])]
    public function toggleActive(int $id): JsonResponse
    {
        if ($denied = $this->requireAdmin($this->userRepository, $this->tokenStorage)) {
            return $denied;
        }

        $task = $this->taskRepository->find($id);
        if (!$task) {
            return $this->json(['error' => 'Tarea no encontrada'], Response::HTTP_NOT_FOUND);
        }

        $task->setActive(!$task->isActive());
        $this->em->flush();

        if ($task->isActive()) {
            $this->pushService->broadcast(
                'task',
                sprintf('Tarea activada: %s', $task->getTitle()),
                ['task_id' => (string) $task->getId()]
            );
        }

        return $this->json(['id' => $task->getId(), 'active' => $task->isActive()]);
    }
}
