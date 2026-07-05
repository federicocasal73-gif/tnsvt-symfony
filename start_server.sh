#!/usr/bin/env bash
# start_server.sh - equivalente Linux de start_server.bat
# Levanta TNSVT en http://localhost:8000 con el router CORS de public/router.php
#
# Requisitos: PHP 8.4+ en PATH, vendor/ instalado, .env.local presente.
# Para frenar: Ctrl+C

set -euo pipefail
cd "$(dirname "$0")"

mkdir -p var/log

# Liberar puerto 8000 si quedo colgado un php -S previo
if pgrep -f 'php -S 0.0.0.0:8000' >/dev/null 2>&1; then
  echo "[pre] Matando php -S previo en :8000..."
  pkill -f 'php -S 0.0.0.0:8000' 2>/dev/null || true
  sleep 1
fi
if command -v fuser >/dev/null 2>&1; then
  fuser -k 8000/tcp 2>/dev/null || true
fi
sleep 1
ss -tlnp 2>/dev/null | grep -q ':8000' && {
  echo "[ERR] Puerto 8000 sigue ocupado. Liberelo manualmente y reintente." >&2
  exit 1
} || true

echo "============================================"
echo "  T.N.S.V.T - INICIANDO SERVIDOR (Linux)"
echo "============================================"

echo "[1/3] Compilando assets del frontend..."
if ! php bin/console asset-map:compile --env=dev; then
  echo "[WARN] asset-map:compile fallo - los assets pueden estar desactualizados."
  echo "       La pagina puede no cargar CSS/JS hasta que lo arregles."
fi

echo "[2/3] Limpiando cache de Symfony..."
php bin/console cache:clear --env=dev >/dev/null 2>&1 || true

echo
echo "============================================"
echo "  Servidor listo en http://localhost:8000"
echo "  PHP: $(php -r 'echo PHP_VERSION;')"
echo "  Para frenar: Ctrl+C"
echo "============================================"
echo

exec php -S 0.0.0.0:8000 -t public public/router.php 2>&1 | tee var/log/dev_server.log
