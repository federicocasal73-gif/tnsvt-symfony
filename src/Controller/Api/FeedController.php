<?php

namespace App\Controller\Api;

use App\Entity\FeedPost;
use App\Entity\LikedPost;
use App\Repository\FeedPostRepository;
use App\Repository\LikedPostRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/feed')]
class FeedController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private FeedPostRepository $feedPostRepository,
        private LikedPostRepository $likedPostRepository,
    ) {}

    #[Route('', name: 'api_feed_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $category = $request->query->get('category', 'all');
        $posts = $this->feedPostRepository->findLatest(category: $category);

        $data = array_map(function (FeedPost $p) {
            $signal = $p->getSignal();
            return [
                'id' => $p->getId(),
                'author_code' => $p->getAuthor()?->getCode(),
                'author_name' => $p->getAuthor()?->getName(),
                'cat' => $p->getCategory(),
                'text' => $p->getContent(),
                'likes' => $p->getLikes(),
                'comments' => $p->getComments() ?? [],
                'signal' => $signal ? (is_string($signal) ? json_decode($signal, true) : $signal) : null,
                'photo' => $p->getPhoto(),
                'created_at' => $p->getCreatedAt()?->format('c'),
            ];
        }, $posts);

        return $this->json($data);
    }

    #[Route('', name: 'api_feed_create', methods: ['POST'])]
    public function create(Request $request, UserRepository $userRepository): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $userCode = $data['author_code'] ?? null;

        if (!$userCode) {
            return $this->json(['error' => 'Usuario requerido'], Response::HTTP_BAD_REQUEST);
        }

        $user = $userRepository->findByCode($userCode);
        if (!$user) {
            return $this->json(['error' => 'Usuario inválido'], Response::HTTP_UNAUTHORIZED);
        }

        $post = new FeedPost();
        $post->setAuthor($user);
        $post->setContent($data['text'] ?? '');
        $post->setCategory($data['cat'] ?? 'general');
        $post->setLikes(0);

        if (!empty($data['signal'])) {
            $post->setSignal($data['signal']);
            $post->setCategory('señales');
        }

        if (!empty($data['photo'])) {
            $post->setPhoto($data['photo']);
        }

        $this->em->persist($post);
        $this->em->flush();

        return $this->json(['success' => true, 'id' => $post->getId()], Response::HTTP_CREATED);
    }

    #[Route('/{id}/like', name: 'api_feed_like', methods: ['POST'])]
    public function like(int $id, Request $request, UserRepository $userRepository): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $userCode = $data['author_code'] ?? null;

        if (!$userCode) {
            return $this->json(['error' => 'Usuario requerido'], Response::HTTP_BAD_REQUEST);
        }

        $user = $userRepository->findByCode($userCode);
        $post = $this->feedPostRepository->find($id);

        if (!$user || !$post) {
            return $this->json(['error' => 'No encontrado'], Response::HTTP_NOT_FOUND);
        }

        $action = $data['action'] ?? 'like';

        if ($action === 'like') {
            $existing = $this->likedPostRepository->findOneBy(['user' => $user, 'post' => $post]);
            if (!$existing) {
                $liked = new LikedPost();
                $liked->setUser($user);
                $liked->setPost($post);
                $this->em->persist($liked);
                $post->setLikes($post->getLikes() + 1);
            }
        } else {
            $existing = $this->likedPostRepository->findOneBy(['user' => $user, 'post' => $post]);
            if ($existing) {
                $this->em->remove($existing);
                $post->setLikes(max(0, $post->getLikes() - 1));
            }
        }

        $this->em->flush();

        return $this->json(['success' => true, 'likes' => $post->getLikes()]);
    }

    #[Route('/{id}/comment', name: 'api_feed_comment', methods: ['POST'])]
    public function comment(int $id, Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $post = $this->feedPostRepository->find($id);

        if (!$post) {
            return $this->json(['error' => 'Post no encontrado'], Response::HTTP_NOT_FOUND);
        }

        $comments = $post->getComments() ?? [];
        $comments[] = [
            'author' => $data['author'] ?? 'Trader',
            'text' => $data['text'] ?? '',
            'date' => (new \DateTimeImmutable())->format('c'),
        ];

        $post->setComments($comments);
        $this->em->flush();

        return $this->json(['success' => true, 'comments' => $comments]);
    }

    #[Route('/{id}', name: 'api_feed_delete', methods: ['DELETE'])]
    public function delete(int $id, Request $request, UserRepository $userRepository): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $userCode = $data['author_code'] ?? $request->query->get('author_code');

        $user = $userRepository->findByCode($userCode);
        $post = $this->feedPostRepository->find($id);

        if (!$user || !$post || $post->getAuthor()?->getId() !== $user->getId()) {
            return $this->json(['error' => 'No autorizado'], Response::HTTP_FORBIDDEN);
        }

        $this->em->remove($post);
        $this->em->flush();

        return $this->json(['success' => true]);
    }
}
