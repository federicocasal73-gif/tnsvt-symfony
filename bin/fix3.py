"""Finalize: rotate admin password, clear cache, warm up, verify."""
import os
import sys
import paramiko

PASSWORD = os.environ.get("ADMIN_PASSWORD")
if not PASSWORD:
    sys.exit("ADMIN_PASSWORD env not set")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("185.173.111.201", port=65002, username="u310596868",
               key_filename=os.path.expanduser(r"~\.ssh\id_hostinger_ed25519"),
               timeout=15)

def run(cmd, timeout=120):
    print("\n==", cmd[:120])
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out.strip():
        print("  OUT:", out.strip()[:1500])
    if err.strip() and "WARNING" not in err:
        print("  ERR:", err.strip()[:600])
    return out, err

# 1. composer dump-autoload (cubre el nuevo RotateAdminPasswordCommand)
run("cd domains/tnsvt.com/public_html && composer dump-autoload --no-dev 2>&1 | tail -5")

# 2. cache:clear con --no-warmup (los Types viejos ya están fixed, ahora warm sin error)
run("cd domains/tnsvt.com/public_html && rm -rf var/cache/prod 2>&1")

# 3. cache:warmup con classmap o sin warmup
run("cd domains/tnsvt.com/public_html && php bin/console cache:warmup --env=prod 2>&1 | tail -20", timeout=180)

# 4. Verificar que RotateAdminPasswordCommand existe
run("cd domains/tnsvt.com/public_html && php bin/console list app 2>&1 | grep -i rotate")

# 5. Rotar admin password (con --password flag, no en shell history)
# Pasamos por stdin (más seguro que --password en argv)
cmd = (
    "cd domains/tnsvt.com/public_html && "
    f"echo {PASSWORD} | php bin/console app:rotate-admin-password --user-code=ADMIN01 --password-from-stdin --env=prod --no-interaction 2>&1"
)
# (El comando no soporta --password-from-stdin todavía. Uso env var ADMIN_PASSWORD en su lugar)
run("cd domains/tnsvt.com/public_html && ADMIN_PASSWORD='" + PASSWORD + "' php bin/console app:rotate-admin-password --user-code=ADMIN01 --env=prod --no-interaction 2>&1 | tail -20", timeout=60)

# 6. Verificar archivo subido
run("cd domains/tnsvt.com/public_html && grep -E 'CACHE_NAME' public/sw.js | head -1")
run("cd domains/tnsvt.com/public_html && ls -la public/assets/app-*.js public/sw.js templates/base.html.twig src/Controller/Api/AuthController.php src/Command/RotateAdminPasswordCommand.php 2>&1")

# 7. Listar APK
run("cd domains/tnsvt.com/public_html && ls -la public/apk/tnsvt-v4.2*.apk public/downloads/tnsvt-app.apk 2>&1")

client.close()
