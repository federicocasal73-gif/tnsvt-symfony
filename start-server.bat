@echo off
title TNSVT Server
cd /d "C:\Users\HP 240 inch G9\tnsvt-symfony"
echo Iniciando servidor PHP en 0.0.0.0:8000 (para Tailscale)...
php -S 0.0.0.0:8000 -t public
pause