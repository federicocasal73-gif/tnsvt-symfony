<?php

namespace App\Service;

use App\Entity\Device;
use App\Entity\User;
use App\Repository\DeviceRepository;
use Psr\Log\LoggerInterface;

class PushNotificationService
{
    private ?string $serverKey;

    public function __construct(
        private DeviceRepository $deviceRepo,
        private LoggerInterface $logger,
    ) {
        $this->serverKey = $_ENV['FCM_SERVER_KEY'] ?? '';
    }

    public function isConfigured(): bool
    {
        return $this->serverKey !== '';
    }

    /**
     * Envia una notificacion push a un usuario especifico.
     */
    public function sendToUser(User $user, string $title, string $body, array $data = []): int
    {
        $devices = $this->deviceRepo->findByUser($user);
        if (!$devices) {
            $this->logger->info("[PUSH] No devices for user {$user->getCode()}");
            return 0;
        }
        return $this->sendToDevices($devices, $title, $body, $data);
    }

    /**
     * Envia una notificacion push a todos los usuarios (broadcast).
     */
    public function broadcast(string $title, string $body, array $data = []): int
    {
        $devices = $this->deviceRepo->findAll();
        if (!$devices) return 0;
        return $this->sendToDevices($devices, $title, $body, $data);
    }

    private function sendToDevices(array $devices, string $title, string $body, array $data = []): int
    {
        if (!$this->isConfigured()) {
            $this->logger->warning('[PUSH] FCM not configured, skipping notification');
            return 0;
        }

        $sent = 0;
        foreach ($devices as $device) {
            if ($this->sendToDevice($device, $title, $body, $data)) {
                $sent++;
            }
        }
        return $sent;
    }

    private function sendToDevice(Device $device, string $title, string $body, array $data = []): bool
    {
        $token = $device->getFcmToken();
        if (!$token) return false;

        $payload = [
            'to' => $token,
            'notification' => [
                'title' => $title,
                'body' => $body,
                'sound' => 'default',
                'badge' => '1',
            ],
            'data' => array_merge($data, ['click_action' => 'FLUTTER_NOTIFICATION_CLICK']),
        ];

        try {
            $ctx = stream_context_create([
                'http' => [
                    'method' => 'POST',
                    'header' => implode("\r\n", [
                        'Authorization: key=' . $this->serverKey,
                        'Content-Type: application/json',
                    ]),
                    'content' => json_encode($payload),
                    'timeout' => 10,
                    'ignore_errors' => true,
                ],
            ]);

            $result = @file_get_contents('https://fcm.googleapis.com/fcm/send', false, $ctx);
            if ($result === false) {
                $this->logger->error("[PUSH] FCM send failed for token {$token}");
                return false;
            }
            $resp = json_decode($result, true);
            $success = ($resp['success'] ?? 0) > 0;
            if (!$success) {
                $this->logger->warning("[PUSH] FCM error for {$token}: {$result}");
            }
            return $success;
        } catch (\Throwable $e) {
            $this->logger->error('[PUSH] Exception: ' . $e->getMessage());
            return false;
        }
    }
}
