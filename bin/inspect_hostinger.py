"""Inspect Hostinger state via paramiko SSH."""
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('185.173.111.201', port=65002, username='u310596868',
               key_filename=r'C:\Users\HP 240 inch G9\.ssh\id_hostinger_ed25519',
               timeout=15)

CMDS = [
    "ls -la domains/tnsvt.com/public_html/ | head -20",
    'cat domains/tnsvt.com/public_html/.env.local 2>&1 | grep -E "^(APP|ADMIN|ACADEMIA|SECRET)" | sed "s/=.*/=HIDDEN/"',
    'cd domains/tnsvt.com/public_html && git log --oneline -3 2>&1',
    'cd domains/tnsvt.com/public_html && ls -la bin/console src/Controller/Api/AuthController.php public/sw.js public/assets/app-*.js 2>&1 | tail -10',
    'cd domains/tnsvt.com/public_html && grep -E "CACHE_NAME" public/sw.js | head -3',
    'cd domains/tnsvt.com/public_html && grep -E "ROTATE|app:rotate" bin/console 2>&1 | head -5',
    'cd domains/tnsvt.com/public_html && php -v 2>&1 | head -3',
    'cd domains/tnsvt.com/public_html && cat .env.local 2>&1 | head -5',
]

for cmd in CMDS:
    print('==', cmd[:80])
    try:
        stdin, stdout, stderr = client.exec_command(cmd)
        out = stdout.read().decode()[:600]
        err = stderr.read().decode()[:200]
        if out.strip():
            print('  OUT:', out.strip()[:500])
        if err.strip() and 'No such file' not in err:
            print('  ERR:', err.strip()[:200])
    except Exception as e:
        print('  EX:', str(e)[:200])

client.close()
