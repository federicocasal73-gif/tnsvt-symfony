#!/usr/bin/env php
<?php
/**
 * Verifica que Firebase Web esté bien configurado.
 * Uso: php bin/check_firebase_config.php
 */

require __DIR__ . '/../vendor/autoload.php';

(new Symfony\Component\Dotenv\Dotenv())->bootEnv(__DIR__ . '/../.env');

$vars = [
    'FIREBASE_WEB_API_KEY' => 'apiKey',
    'FIREBASE_AUTH_DOMAIN' => 'authDomain',
    'FIREBASE_PROJECT_ID' => 'projectId',
    'FIREBASE_STORAGE_BUCKET' => 'storageBucket',
    'FIREBASE_MESSAGING_SENDER_ID' => 'messagingSenderId',
    'FIREBASE_APP_ID' => 'appId',
    'FIREBASE_WEB_PUSH_VAPID_KEY' => 'vapidKey',
];

$ok = true;
echo "\n=== FIREBASE WEB CONFIG CHECK ===\n\n";

foreach ($vars as $env => $name) {
    $val = $_ENV[$env] ?? getenv($env) ?: '';
    $status = '✓';
    $color = "\033[32m";
    if (empty($val) || str_contains($val, 'REEMPLAZAR') || str_contains($val, 'YOUR_')) {
        $status = '✗';
        $color = "\033[31m";
        $ok = false;
    }
    $display = $val ? substr($val, 0, 40) . (strlen($val) > 40 ? '...' : '') : '(vacío)';
    echo $color . $status . "\033[0m {$env} ({$name}): {$display}\n";
}

echo "\n";
if ($ok) {
    echo "\033[32m✓ TODAS LAS CLAVES CONFIGURADAS\033[0m\n";
    echo "  Próximo paso: php bin/console cache:clear\n\n";
} else {
    echo "\033[31m✗ FALTAN CLAVES\033[0m\n";
    echo "  Editá el archivo .env y reemplazá los placeholders.\n\n";
    exit(1);
}