<?php

namespace App\Service;

use Lcobucci\JWT\Configuration;
use Lcobucci\JWT\Signer\Hmac\Sha256;
use Lcobucci\JWT\Signer\Key\InMemory;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\Request;

class MercureSubscriberService
{
    private Configuration $jwtConfig;

    public function __construct(
        private readonly string $mercureUrl,
        private readonly string $mercurePublicUrl,
        private readonly string $jwtSecret,
    ) {
        $this->jwtConfig = Configuration::forSymmetricSigner(
            new Sha256(),
            InMemory::plainText($this->jwtSecret),
        );
    }

    public function getSubscribeUrl(string|array $topics): string
    {
        $topics = (array) $topics;
        $params = [];
        foreach ($topics as $t) {
            $params[] = 'topic=' . rawurlencode($t);
        }
        return $this->mercurePublicUrl . '?' . implode('&', $params);
    }

    public function createSubscribeJwt(array $topics = ['*']): string
    {
        $now = new \DateTimeImmutable();
        $token = $this->jwtConfig->builder()
            ->issuedAt($now)
            ->expiresAt($now->modify('+1 hour'))
            ->withClaim('mercure', ['subscribe' => $topics])
            ->getToken($this->jwtConfig->signer(), $this->jwtConfig->signingKey());

        return $token->toString();
    }

    public function createAuthCookie(Request $request, array $subscribe = ['*']): Cookie
    {
        $jwt = $this->createSubscribeJwt($subscribe);
        return Cookie::create(
            'mercureAuthorization',
            $jwt,
            time() + 3600,
            '/.well-known/mercure',
            null,
            $request->isSecure(),
            true,
            false,
            Cookie::SAMESITE_STRICT,
        );
    }
}
