"""Fix the deployed RotateAdminPasswordCommand by running composer dump-autoload + cache clear."""
import os
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("185.173.111.201", port=65002, username="u310596868",
               key_filename=os.path.expanduser(r"~\.ssh\id_hostinger_ed25519"),
               timeout=15)

CMDS = [
    'cd domains/tnsvt.com/public_html && which composer',
    'cd domains/tnsvt.com/public_html && ls -la vendor/composer/ 2>&1 | head -10',
    'cd domains/tnsvt.com/public_html && grep "Command\\\\\\\\" vendor/composer/autoload_classmap.php 2>&1 | grep -i rotate',
    'cd domains/tnsvt.com/public_html && head -30 src/Command/RotateAdminPasswordCommand.php',
    'cd domains/tnsvt.com/public_html && php bin/console cache:clear --env=prod 2>&1 | tail -5',
    'cd domains/tnsvt.com/public_html && php bin/console list app 2>&1 | tail -15',
]

for cmd in CMDS:
    print("\n==", cmd)
    stdin, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out.strip():
        print("  OUT:", out.strip()[:500])
    if err.strip() and "WARNING" not in err:
        print("  ERR:", err.strip()[:300])

client.close()
