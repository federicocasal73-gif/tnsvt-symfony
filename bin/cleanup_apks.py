"""Cleanup: remove old APK versions from Hostinger to free space."""
import os
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("185.173.111.201", port=65002, username="u310596868",
               key_filename=os.path.expanduser(r"~\.ssh\id_hostinger_ed25519"),
               timeout=15)

def run(cmd):
    print("\n==", cmd)
    stdin, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out.strip(): print("  OUT:", out.strip()[:1000])
    if err.strip() and "WARNING" not in err: print("  ERR:", err.strip()[:500])

# Listar APKs antes
run("cd domains/tnsvt.com/public_html && ls -la public/apk/ | head -20")

# Borrar v4.20 y v4.21 (v4.22 y v4.24 mantenemos como historial)
run("cd domains/tnsvt.com/public_html && rm -f public/apk/tnsvt-v4.20.apk public/apk/tnsvt-v4.21.apk 2>&1")

# Listar después
run("cd domains/tnsvt.com/public_html && ls -la public/apk/ | head -20")

# Estado final
run("cd domains/tnsvt.com/public_html && du -sh public/apk/ public/downloads/ public/assets/ 2>&1 | head -10")

client.close()
