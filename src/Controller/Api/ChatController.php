<?php

namespace App\Controller\Api;

use App\Entity\Conversation;
use App\Entity\ConversationParticipant;
use App\Entity\Message;
use App\Entity\User;
use App\Repository\ConversationRepository;
use App\Repository\MessageRepository;
use App\Repository\UserRepository;
use App\Service\PushService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/chat')]
class ChatController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private ConversationRepository $conversationRepository,
        private MessageRepository $messageRepository,
        private UserRepository $userRepository,
        private PushService $pushService,
    ) {}

    private function resolveUser(Request $request): ?User
    {
        $code = $request->query->get('user_code') ?? ($request->request->get('user_code'));
        if (!$code) {
            // Try JSON body
            $data = json_decode($request->getContent(), true);
            $code = $data['user_code'] ?? null;
        }
        if (!$code) return null;
        $user = $this->userRepository->findByCode(strtoupper(trim($code)));
        return ($user && $user->isActive()) ? $user : null;
    }

    private function serializeConversation(Conversation $conv, ?Message $lastMessage, int $unreadCount, ?User $me): array
    {
        $otherUser = null;
        if ($conv->getType() === Conversation::TYPE_DM) {
            foreach ($conv->getParticipants() as $p) {
                if ($p->getUser()?->getId() !== $me?->getId()) {
                    $otherUser = $p->getUser();
                    break;
                }
            }
        }

        return [
            'id' => $conv->getId(),
            'type' => $conv->getType(),
            'title' => $conv->getTitle(),
            'ai_user_code' => $conv->getAiUserCode(),
            'other_user_code' => $otherUser?->getCode(),
            'other_user_name' => $otherUser?->getName(),
            'created_at' => $conv->getCreatedAt()?->format('c'),
            'unread_count' => $unreadCount,
            'last_message' => $lastMessage ? [
                'id' => $lastMessage->getId(),
                'sender_code' => $lastMessage->getSender()?->getCode(),
                'sender_name' => $lastMessage->getSender()?->getName(),
                'content' => $lastMessage->getContent(),
                'has_photo' => (bool) $lastMessage->getPhoto(),
                'is_ai' => $lastMessage->isAi(),
                'created_at' => $lastMessage->getCreatedAt()?->format('c'),
            ] : null,
        ];
    }

    private function serializeMessage(Message $m): array
    {
        return [
            'id' => $m->getId(),
            'conversation_id' => $m->getConversation()?->getId(),
            'sender_code' => $m->getSender()?->getCode(),
            'sender_name' => $m->getSender()?->getName(),
            'content' => $m->getContent(),
            'photo' => $m->getPhoto(),
            'is_ai' => $m->isAi(),
            'metadata' => $m->getMetadata(),
            'created_at' => $m->getCreatedAt()?->format('c'),
        ];
    }

    private function isParticipant(Conversation $conv, User $user): bool
    {
        foreach ($conv->getParticipants() as $p) {
            if ($p->getUser()?->getId() === $user->getId()) return true;
        }
        return false;
    }

    private function getParticipant(Conversation $conv, User $user): ?ConversationParticipant
    {
        foreach ($conv->getParticipants() as $p) {
            if ($p->getUser()?->getId() === $user->getId()) return $p;
        }
        return null;
    }

    #[Route('/conversations', name: 'api_chat_conversations', methods: ['GET'])]
    public function listConversations(Request $request): JsonResponse
    {
        $me = $this->resolveUser($request);
        if (!$me) return $this->json(['error' => 'user_code requerido'], 400);

        $rows = $this->conversationRepository->findByParticipant($me);
        $data = array_map(
            fn($r) => $this->serializeConversation($r['conv'], $r['lastMessage'], $r['unreadCount'], $me),
            $rows
        );

        return $this->json($data);
    }

    #[Route('/conversations', name: 'api_chat_dm_create', methods: ['POST'])]
    public function createDm(Request $request): JsonResponse
    {
        $me = $this->resolveUser($request);
        if (!$me) return $this->json(['error' => 'user_code requerido'], 400);

        $data = json_decode($request->getContent(), true);
        $otherCode = $data['other_code'] ?? null;
        if (!$otherCode) return $this->json(['error' => 'other_code requerido'], 400);

        $other = $this->userRepository->findByCode(strtoupper(trim($otherCode)));
        if (!$other) return $this->json(['error' => 'Usuario no encontrado'], 404);

        try {
            $conv = $this->conversationRepository->findOrCreateDm($me, $other);
        } catch (\InvalidArgumentException $e) {
            return $this->json(['error' => $e->getMessage()], 400);
        }

        return $this->json($this->serializeConversation($conv, null, 0, $me), 201);
    }

    #[Route('/conversations/{id}/messages', name: 'api_chat_messages', methods: ['GET'])]
    public function listMessages(int $id, Request $request): JsonResponse
    {
        $me = $this->resolveUser($request);
        if (!$me) return $this->json(['error' => 'user_code requerido'], 400);

        $conv = $this->conversationRepository->find($id);
        if (!$conv) return $this->json(['error' => 'Conversación no encontrada'], 404);
        if (!$this->isParticipant($conv, $me)) return $this->json(['error' => 'No autorizado'], 403);

        $limit = max(1, min(100, (int) $request->query->get('limit', 50)));
        $beforeId = $request->query->get('before_id');
        $beforeId = $beforeId !== null ? (int) $beforeId : null;

        $messages = $this->messageRepository->findByConversation($conv, $limit, $beforeId);
        return $this->json(array_map(fn(Message $m) => $this->serializeMessage($m), $messages));
    }

    #[Route('/conversations/{id}/messages', name: 'api_chat_send', methods: ['POST'])]
    public function sendMessage(int $id, Request $request): JsonResponse
    {
        $me = $this->resolveUser($request);
        if (!$me) return $this->json(['error' => 'user_code requerido'], 400);

        $conv = $this->conversationRepository->find($id);
        if (!$conv) return $this->json(['error' => 'Conversación no encontrada'], 404);
        if (!$this->isParticipant($conv, $me)) return $this->json(['error' => 'No autorizado'], 403);

        $data = json_decode($request->getContent(), true);
        $content = trim($data['content'] ?? '');
        $photo = $data['photo'] ?? null;
        if ($content === '' && empty($photo)) {
            return $this->json(['error' => 'Mensaje vacío'], 400);
        }
        if (is_string($photo) && strlen($photo) > 14_000_000) {
            return $this->json(['error' => 'Foto demasiado grande (máx 10MB)'], 413);
        }

        $msg = new Message();
        $msg->setConversation($conv);
        $msg->setSender($me);
        $msg->setContent($content !== '' ? $content : null);
        if (!empty($photo)) $msg->setPhoto($photo);

        $this->em->persist($msg);
        $this->em->flush();

        // DMs: notify the other participant(s) (not the group)
        if ($conv->getType() === Conversation::TYPE_DM) {
            foreach ($conv->getParticipants() as $p) {
                $other = $p->getUser();
                if ($other && $other->getId() !== $me->getId()) {
                    $preview = $content !== '' ? mb_substr($content, 0, 80) : '?? Foto';
                    $this->pushService->notify(
                        $other,
                        'dm',
                        sprintf('%s: %s', $me->getName(), $preview),
                        ['conversation_id' => (string) $conv->getId(), 'sender_code' => (string) $me->getCode()]
                    );
                }
            }
        }

        return $this->json($this->serializeMessage($msg), 201);
    }

    #[Route('/conversations/{id}/read', name: 'api_chat_read', methods: ['POST'])]
    public function markRead(int $id, Request $request): JsonResponse
    {
        $me = $this->resolveUser($request);
        if (!$me) return $this->json(['error' => 'user_code requerido'], 400);

        $conv = $this->conversationRepository->find($id);
        if (!$conv) return $this->json(['error' => 'Conversación no encontrada'], 404);
        if (!$this->isParticipant($conv, $me)) return $this->json(['error' => 'No autorizado'], 403);

        $participant = $this->getParticipant($conv, $me);
        if ($participant) {
            $participant->setLastReadAt(new \DateTimeImmutable());
            $this->em->flush();
        }

        return $this->json(['success' => true]);
    }

    #[Route('/users', name: 'api_chat_users', methods: ['GET'])]
    public function listUsers(Request $request): JsonResponse
    {
        $me = $this->resolveUser($request);
        if (!$me) return $this->json(['error' => 'user_code requerido'], 400);

        $users = $this->userRepository->findBy(['active' => true], ['name' => 'ASC']);
        $data = array_map(function (User $u) use ($me) {
            return [
                'code' => $u->getCode(),
                'name' => $u->getName(),
                'is_me' => $u->getId() === $me->getId(),
            ];
        }, $users);

        return $this->json($data);
    }
}
