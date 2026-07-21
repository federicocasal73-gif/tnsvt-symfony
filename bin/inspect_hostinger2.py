"""Inspect Hostinger state via paramiko SSH."""
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('185.173.111.201', port=65002, username='u310596868',
               key_filename=r'C:\Users\HP 240 inch G9\.ssh\id_hostinger_ed25519',
               timeout=15)

CMDS = [
    'cat domains/tnsvt.com/public_html/bin/console',
    'cd domains/tnsvt.com/public_html && git log -1 --stat 515968b',
    'cd domains/tnsvt.com/public_html && grep -E "ADMIN_PASSWORD|ACADEMIA_ADMIN_PASS" .env.local 2>&1 | sed "s/=.*/=HIDDEN/"',
    'cd domains/tnsvt.com/public_html && php bin/console list app 2>&1 | head -25',
    'cd domains/tnsvt.com/public_html && cat .htaccess 2>&1 | head -25',
]

for cmd in CMDS:
    print('==', cmd[:80])
    try:
        stdin, stdout, stderr = client.exec_command(cmd)
        out = stdout.read().decode()[:1000]
        err = stderr.read().decode()[:300]
        if out.strip():
            print('  OUT:', out.strip()[:900])
        if err.strip():
            print('  ERR:', err.strip()[:300])
    except Exception as e:
        print('  EX:', str(e)[:200])

client.close()
