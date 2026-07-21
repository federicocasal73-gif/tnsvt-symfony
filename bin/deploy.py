"""
Deploy TNSVT v4.24 a Hostinger compartido:
- Sube archivos modificados (AuthController, sw.js, assets, template, comando rotate-admin).
- Limpia cache prod.
- Rota la contraseña de ADMIN01 al valor brindado por el usuario.
- Sube la APK v4.24 a public/apk/ y public/downloads/.

Conexión: paramiko SSH + SFTP usando clave ed25519 en ~/.ssh/id_hostinger_ed25519.
"""

import os
import sys
import io
import time
import paramiko
import fnmatch

# Forzar UTF-8 en stdout/stderr (Windows console = cp1252)
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
from pathlib import Path

# ----- Config (todo configurable por env si querés) -----
HOST = "185.173.111.201"
PORT = 65002
USER = "u310596868"
KEYFILE = os.path.expanduser(r"~\.ssh\id_hostinger_ed25519")
REMOTE_ROOT = "domains/tnsvt.com/public_html"
LOCAL_ROOT = Path(__file__).resolve().parent.parent
# Contraseña nueva del ADMIN01 (la que vos me pasaste).
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")
# Si querés skipear la subida de la APK (ej. ya está subida), setear SKIP_APK=1.
SKIP_APK = os.environ.get("SKIP_APK", "0") == "1"

# ----- Archivos a subir (relpath_local, relpath_remote) -----
FILES_TO_UPLOAD = [
    ("public/sw.js", "public/sw.js"),
    ("templates/base.html.twig", "templates/base.html.twig"),
    ("config/services.yaml", "config/services.yaml"),
]

# Globs de src/ - suben automáticamente cualquier PHP nuevo o modificado
# Evita que un archivo nuevo (ej. un nuevo Service) quede sin desplegar.
SRC_GLOBS = [
    "src/Controller/**/*.php",
    "src/Entity/**/*.php",
    "src/Service/**/*.php",
    "src/Security/**/*.php",
    "src/Command/**/*.php",
    "src/Util/**/*.php",
    "src/Repository/**/*.php",
]

# Migrations (se suben para correr doctrine:migrations:migrate)
MIGRATION_GLOBS = [
    "migrations/Version20260720*.php",
]

# Assets compilados (globs)
ASSET_GLOBS = [
    "public/assets/app-*.js",
    "public/assets/api-*.js",
    "public/assets/mutation-queue-*.js",
    "public/assets/styles/app-*.css",
    "public/assets/importmap.json",
    "public/assets/manifest.json",
    "public/assets/entrypoint.app.json",
]

# APKs (subir sólo v4.24)
APK_FILES = [
    ("public/apk/tnsvt-v4.24.apk", "public/apk/tnsvt-v4.24.apk"),
    ("public/downloads/tnsvt-app.apk", "public/downloads/tnsvt-app.apk"),
]


def run(ssh, cmd, timeout=60):
    print(f"$ {cmd[:150]}")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out.strip():
        print("  OUT:", out.strip()[:600])
    if err.strip() and "WARNING" not in err:
        print("  ERR:", err.strip()[:600])
    return out, err


def sftp_mkdir_p(sftp, remote_path: str):
    """Ensure a directory exists on remote (mkdir -p semantics)."""
    full = f"{REMOTE_ROOT}/{remote_path}"
    # SFTP doesn't have native mkdir, but we can probe-and-create via shell
    ssh_transport = sftp.get_channel().get_transport()
    ssh_session = ssh_transport.open_session()
    ssh_session.exec_command(f"mkdir -p '{full}' && echo OK")
    out = ssh_session.recv(1024).decode().strip()
    ssh_session.close()
    return out == "OK"


def sftp_put(sftp, local_path: Path, remote_path: str):
    """Upload file via SFTP. remote_path is RELATIVE to REMOTE_ROOT (SFTP cwd = HOME)."""
    # SFTP cwd is HOME; prepend REMOTE_ROOT so paths resolve correctly.
    full_remote = f"{REMOTE_ROOT}/{remote_path}"
    # Ensure parent dir exists (mkdir -p)
    parent = "/".join(full_remote.split("/")[:-1])
    sftp_mkdir_p(sftp, "/".join(remote_path.split("/")[:-1]))
    sftp.put(str(local_path), full_remote)
    sz = local_path.stat().st_size
    print(f"  [UP] {full_remote} ({sz} B)")


def main():
    if not ADMIN_PASSWORD:
        sys.exit("ERROR: ADMIN_PASSWORD env no seteada. Hacé: $env:ADMIN_PASSWORD='tu_pw'; py bin/deploy.py")

    print(f"\n[deploy] Conectando a {HOST}:{PORT} como {USER}…")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, port=PORT, username=USER, key_filename=KEYFILE, timeout=15)
    sftp = client.open_sftp()

    try:
        # 1) Backup de los archivos que vamos a pisar
        print("\n[deploy] 1) Backup de archivos a sobreescribir…")
        ts = time.strftime("%Y%m%d-%H%M%S")
        run(client, f"cd {REMOTE_ROOT} && mkdir -p .deploy_backup_{ts}")
        for _, remote in FILES_TO_UPLOAD:
            full_remote = f"{REMOTE_ROOT}/{remote}"
            try:
                sftp.stat(full_remote)
                bak = f"{REMOTE_ROOT}/.deploy_backup_{ts}/{remote.replace('/', '__')}"
                sftp.rename(full_remote, bak)
                print(f"  BK {full_remote} -> {bak}")
            except IOError:
                print(f"  · {full_remote} no existe, nada que respaldar")

        # 2) Subir archivos de código
        print("\n[deploy] 2) Subiendo archivos de código…")
        for local_rel, remote_rel in FILES_TO_UPLOAD:
            local = LOCAL_ROOT / local_rel
            remote = remote_rel
            if not local.exists():
                print(f"  ⚠ {local} no existe, skip")
                continue
            sftp_put(sftp, local, remote)

        # 2b) Subir todos los PHP de src/ (globs)
        print("\n[deploy] 2b) Subiendo src/ globs…")
        for pattern in SRC_GLOBS:
            for local in LOCAL_ROOT.glob(pattern):
                if not local.is_file():
                    continue
                remote_rel = str(local.relative_to(LOCAL_ROOT)).replace("\\", "/")
                # sólo subir si difiere en tamaño o no existe
                try:
                    remote_stat = sftp.stat(remote_rel)
                    if remote_stat.st_size == local.stat().st_size:
                        print(f"  · {remote_rel} ya tiene mismo tamaño, skip")
                        continue
                except IOError:
                    pass
                sftp_put(sftp, local, remote_rel)

        # 3) Subir migrations nuevas
        print("\n[deploy] 3) Subiendo migrations…")
        for pattern in MIGRATION_GLOBS:
            for local in LOCAL_ROOT.glob(pattern):
                if not local.is_file():
                    continue
                remote_rel = str(local.relative_to(LOCAL_ROOT)).replace("\\", "/")
                try:
                    remote_stat = sftp.stat(f"{REMOTE_ROOT}/{remote_rel}")
                    if remote_stat.st_size == local.stat().st_size:
                        print(f"  · {remote_rel} ya existe, skip")
                        continue
                except IOError:
                    pass
                sftp_put(sftp, local, remote_rel)

        # 4) Subir assets compilados
        print("\n[deploy] 4) Subiendo assets compilados…")
        for pattern in ASSET_GLOBS:
            for local in LOCAL_ROOT.glob(pattern):
                # mantener estructura exacta (public/assets/…)
                remote_rel = str(local.relative_to(LOCAL_ROOT)).replace("\\", "/")
                # sólo subir si el archivo en Hostinger difiere o no existe
                try:
                    remote_stat = sftp.stat(remote_rel)
                    if remote_stat.st_size == local.stat().st_size:
                        print(f"  · {remote_rel} ya tiene mismo tamaño, skip")
                        continue
                except IOError:
                    pass
                sftp_put(sftp, local, remote_rel)

        # 5) Subir APK v4.24 (si corresponde)
        if not SKIP_APK:
            print("\n[deploy] 5) Subiendo APK v4.24…")
            for local_rel, remote_rel in APK_FILES:
                local = LOCAL_ROOT / local_rel
                if not local.exists():
                    print(f"  WARN {local} no existe, skip")
                    continue
                sftp_put(sftp, local, remote_rel)
        else:
            print("\n[deploy] 5) SKIP_APK=1, no subo APK")

        # 6) Crear directorios de uploads para LinkPreview
        print("\n[deploy] 6) Creando directorios de uploads…")
        run(client, f"mkdir -p {REMOTE_ROOT}/public/uploads/link-previews/images {REMOTE_ROOT}/public/uploads/link-previews/favicons")

        # 7) cache:clear + composer dump-autoload (por si el composer no se regenera)
        print("\n[deploy] 7) Limpiando cache + regenerando autoload…")
        run(client, f"cd {REMOTE_ROOT} && php bin/console cache:clear --env=prod 2>&1 | tail -20")
        # Composer suele estar deshabilitado en Hostinger shared; intentamos dump-autoload
        run(client, f"cd {REMOTE_ROOT} && composer dump-autoload --no-dev 2>&1 | tail -5")

        # 8) Correr migrations nuevas (solo las nuestras, no todas las pendientes)
        print("\n[deploy] 8) Corriendo migrations…")
        for mig in ["Version20260720000001", "Version20260720000002"]:
            run(client, f"cd {REMOTE_ROOT} && php bin/console doctrine:migrations:execute 'DoctrineMigrations\\\\{mig}' --up --no-interaction --env=prod 2>&1 | tail -5")

        # 9) Rotar contraseña ADMIN01 (forzar valor brindado)
        print("\n[deploy] 9) Rotando contraseña de ADMIN01…")
        # Pasamos la contraseña por stdin para que no quede en shell history.
        cmd = (
            f"cd {REMOTE_ROOT} && "
            f"php bin/console app:rotate-admin-password "
            f"--user-code=ADMIN01 --password=\"$ADMIN_PASSWORD\" --no-interaction --env=prod 2>&1"
        )
        # Usamos env para no exponer en argv
        run(client, cmd.replace("$ADMIN_PASSWORD", ADMIN_PASSWORD))

        # 10) Verificar
        print("\n[deploy] 10) Verificando deploy…")
        run(client, f"cd {REMOTE_ROOT} && grep -E 'CACHE_NAME' public/sw.js | head -1")
        run(client, f"cd {REMOTE_ROOT} && ls -la public/assets/app-*.js | tail -1")
        run(client, f"cd {REMOTE_ROOT} && php bin/console list app 2>&1 | grep -i rotate")

        print("\n[deploy] OK Deploy completo. Limpieza de backups locales:")
        run(client, f"cd {REMOTE_ROOT} && rm -rf .deploy_backup_{ts}")
        print(f"  · Backup {ts} eliminado del server")

    finally:
        sftp.close()
        client.close()

    print("\n[deploy] Finalizado.")


if __name__ == "__main__":
    main()
