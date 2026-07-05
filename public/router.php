<?php
// router.php - interceptor para CORS en php -S
// php -S 0.0.0.0:8000 -t public public/router.php

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$publicDir = __DIR__;

// Si es archivo estático existente, devolver false para que php -S lo sirva
if ($path !== '/' && file_exists($file = $publicDir . $path) && !is_dir($file)) {
    return false;
}

// Para /api/, agregar headers CORS a TODAS las respuestas
if (str_starts_with($path, '/api/')) {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    // En dev aceptar todo, en prod usar regex específico
    if (getenv('APP_ENV') === 'prod') {
        // Aquí iría la lógica de regex específica
        $allowedOrigin = $origin;
    } else {
        $allowedOrigin = $origin ?: '*';
    }
    if ($allowedOrigin) {
        header('Access-Control-Allow-Origin: ' . $allowedOrigin);
        header('Vary: Origin');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Methods: GET, OPTIONS, POST, PUT, PATCH, DELETE');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Expose-Headers: Link');
        header('Access-Control-Max-Age: 3600');
    }
    // Si es OPTIONS, responder 200 sin pasar a Symfony
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

require $publicDir . '/index.php';
