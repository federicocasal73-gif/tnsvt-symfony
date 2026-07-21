"""Diagnose what causes the Types error on Hostinger."""
import os
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("185.173.111.201", port=65002, username="u310596868",
               key_filename=os.path.expanduser(r"~\.ssh\id_hostinger_ed25519"),
               timeout=15)

CMDS = [
    'cd domains/tnsvt.com/public_html && grep -rn "App\\\\Entity\\\\Types" --include="*.php" src 2>&1 | head -10',
    'cd domains/tnsvt.com/public_html && grep -rn "App\\\\Entity\\\\Types" --include="*.php" config 2>&1 | head -10',
    'cd domains/tnsvt.com/public_html && grep -rn "App\\\\Entity\\\\Types" vendor 2>&1 | head -10',
    'cd domains/tnsvt.com/public_html && ls -la src/Entity/Types.php 2>&1',
    'cd domains/tnsvt.com/public_html && find . -name "Types.php" 2>/dev/null | head -5',
    'cd domains/tnsvt.com/public_html && find . -name "*.php" -path "*/Entity/*" 2>/dev/null | wc -l',
    'cd domains/tnsvt.com/public_html && ls src/Entity/ | grep -i types',
    'cd domains/tnsvt.com/public_html && php bin/console cache:clear --no-warmup --env=prod 2>&1 | tail -10',
    'cd domains/tnsvt.com/public_html && composer dump-autoload --no-dev 2>&1 | tail -10',
]

for cmd in CMDS:
    print("\n==", cmd)
    stdin, stdout, stderr = client.exec_command(cmd, timeout=120)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out.strip():
        print("  OUT:", out.strip()[:1000])
    if err.strip() and "WARNING" not in err:
        print("  ERR:", err.strip()[:600])

client.close()
