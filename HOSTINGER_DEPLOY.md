# Deploy a Hostinger — Guía paso a paso

## 1. Comprar y configurar hosting en Hostinger
- Comprá el plan que incluya PHP 8.4+ y MySQL
- Apuntá tu dominio (o usá el subdominio gratuito de Hostinger)

## 2. Crear base de datos MySQL
1. Entrá a hPanel → **Bases de datos MySQL**
2. Click **Crear nueva base de datos**
3. Anotá:
   - Nombre de la DB
   - Usuario
   - Contraseña
   - Host (normalmente `localhost`)

## 3. Subir el proyecto

### Opción A: Subir por Git (recomendado)
1. En hPanel → **Acceso SSH** → Activá SSH
2. Conectate por SSH:
   ```bash
   ssh u123456789@tu-servidor.hostinger.com
   ```
3. Cloná el repo:
   ```bash
   cd domains/tudominio.com/public_html
   git clone https://github.com/federicocasal73-gif/tnsvt-symfony.git .
   ```
4. Instalá dependencias:
   ```bash
   composer install --no-dev --optimize-autoloader
   ```
5. Copiá `.env.prod.example` a `.env.local` y editá los valores

### Opción B: Subir por FTP/File Manager
1. Comprimí el proyecto en un ZIP (sin `var/`, `vendor/`, `node_modules/`)
2. Subilo a `public_html` (o la carpeta de tu dominio)
3. Descomprimilo
4. Subí por SSH y corré `composer install`

## 4. Configurar el archivo .env.local
Editá `.env.local` con:
```env
APP_ENV=prod
APP_DEBUG=0
APP_SECRET=tu-secreto-aleatorio-largo
DATABASE_URL="mysql://USUARIO:PASS@localhost:3306/DBNAME?serverVersion=8.0.32&charset=utf8mb4"
DEFAULT_URI=https://tudominio.com
```

## 5. Configurar document root
En hPanel → **Dominios** → tu dominio → **Administrar**:
- **Document root**: apuntá a `public_html/public` (NO a public_html directo)

## 6. Instalar y migrar
```bash
cd domains/tudominio.com/public_html
composer install --no-dev --optimize-autoloader
php bin/console cache:clear --env=prod
php bin/console doctrine:migrations:migrate --no-interaction --env=prod
php bin/console app:seed-users --env=prod
```

## 7. Permisos de carpetas
```bash
chmod -R 755 .
chmod -R 777 var/
```

## 8. Probar
- Andá a https://tudominio.com
- Ingresá con `ADMIN01` / `admin:TNSVT`
- Verificá que funcione todo

## Solución de problemas

### Error 500
- Activá debug temporalmente: `APP_DEBUG=1` en `.env.local`
- Revisá los logs: `var/log/prod.log`

### Error de base de datos
- Verificá que `DATABASE_URL` esté bien
- Probá la conexión desde hPanel → phpMyAdmin

### Assets no cargan
- Corré: `php bin/console assets:install public --env=prod`

### Permisos
- Las carpetas `var/` y `public/` deben tener permisos de escritura para el usuario de PHP
