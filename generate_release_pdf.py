#!/usr/bin/env python3
"""Genera el PDF de release notes para T.N.S.V.T v1.6.3"""
from fpdf import FPDF
from datetime import datetime
import os

class TNSVTPDF(FPDF):
    def header(self):
        if self.page_no() == 1:
            return  # No header on cover
        self.set_font('Helvetica', 'I', 9)
        self.set_text_color(120, 120, 120)
        self.cell(0, 10, 'T.N.S.V.T Market Instinct v1.6.3 - Release Notes', align='R')
        self.ln(12)

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 10, f'Pagina {self.page_no()}/{{nb}}  |  28 de Junio de 2026  |  github.com/federicocasal73-gif/tnsvt-symfony', align='C')

    def chapter_title(self, title):
        self.set_font('Helvetica', 'B', 16)
        self.set_text_color(40, 30, 80)
        self.set_x(10)
        self.ln(4)
        self.cell(0, 10, title)
        self.ln(8)
        # Underline
        y = self.get_y()
        self.set_draw_color(212, 175, 55)
        self.set_line_width(0.8)
        self.line(10, y, 200, y)
        self.ln(6)

    def section_title(self, title):
        self.set_font('Helvetica', 'B', 12)
        self.set_text_color(60, 50, 100)
        self.set_x(10)
        self.ln(2)
        self.cell(0, 8, title)
        self.ln(6)

    def body(self, text):
        if not text:
            return
        self.set_font('Helvetica', '', 10.5)
        self.set_text_color(30, 30, 30)
        self.set_x(10)  # Reset X to left margin
        self.multi_cell(190, 6, text)
        self.ln(2)

    def bullet(self, text):
        self.set_font('Helvetica', '', 10.5)
        self.set_text_color(30, 30, 30)
        self.set_x(15)
        self.cell(5, 6, chr(127))
        # available width = 210 - 10 (left margin) - 20 (already used) = 180
        self.multi_cell(180, 6, text)

    def code(self, text):
        self.set_font('Courier', '', 9.5)
        self.set_text_color(40, 40, 40)
        self.set_fill_color(245, 240, 230)
        self.set_x(15)
        self.multi_cell(180, 5.5, text, fill=True)
        self.ln(2)

pdf = TNSVTPDF()
pdf.alias_nb_pages()
pdf.set_auto_page_break(auto=True, margin=20)

# ============== COVER PAGE ==============
pdf.add_page()
pdf.set_font('Helvetica', 'B', 11)
pdf.set_text_color(212, 175, 55)
pdf.cell(0, 10, 'CRISTO INTEGRO  |  T.N.S.V.T MARKET INSTINCT', align='C')
pdf.ln(20)

pdf.set_font('Helvetica', 'B', 48)
pdf.set_text_color(40, 30, 80)
pdf.cell(0, 25, 'v1.6.3', align='C')
pdf.ln(30)

pdf.set_font('Helvetica', 'B', 20)
pdf.set_text_color(60, 50, 100)
pdf.cell(0, 12, 'Journal Sharing Social System', align='C')
pdf.ln(15)

pdf.set_font('Helvetica', 'I', 13)
pdf.set_text_color(120, 100, 50)
pdf.cell(0, 10, 'Trading Neuro-Spiritual Value Theory', align='C')
pdf.ln(20)

# Golden separator
y = pdf.get_y()
pdf.set_draw_color(212, 175, 55)
pdf.set_line_width(1.5)
pdf.line(50, y, 160, y)
pdf.ln(15)

pdf.set_font('Helvetica', '', 12)
pdf.set_text_color(60, 60, 60)
pdf.cell(0, 8, 'Fecha de release: 28 de Junio de 2026', align='C')
pdf.ln(8)
pdf.cell(0, 8, 'Build: APK Debug (Capacitor v8 + Android 14)', align='C')
pdf.ln(8)
pdf.cell(0, 8, 'Estado: STABLE - PRODUCTION READY', align='C')
pdf.ln(20)

pdf.set_font('Helvetica', 'I', 10)
pdf.set_text_color(100, 100, 100)
pdf.multi_cell(0, 5, 'Esta version introduce el sistema completo de journal social: busqueda de usuarios, solicitudes de acceso, conexiones bidireccionales, permisos granulares por trade, configuracion de privacidad por journal, y modo lectura-only obligatorio al visualizar journals ajenos.', align='C')

# Footer cover
pdf.set_y(-50)
pdf.set_font('Helvetica', 'I', 9)
pdf.set_text_color(140, 140, 140)
pdf.cell(0, 6, 'github.com/federicocasal73-gif/tnsvt-symfony', align='C')
pdf.ln(6)
pdf.cell(0, 6, 'github.com/federicocasal73-gif/tnsvt-market-instinct', align='C')

# ============== PAGE 1: OVERVIEW ==============
pdf.add_page()
pdf.chapter_title('Que hay en esta version?')

pdf.body('La v1.6.3 cierra el ciclo completo del Trading Journal Social. Los usuarios ahora pueden buscar otros operadores, solicitar acceso a sus journals, recibir solicitudes, gestionar permisos granulares (que trades ver, que notas leer, descargar CSV) y controlar la visibilidad de su propio journal.')

pdf.section_title('Cambios principales')
pdf.bullet('Busqueda de usuarios por codigo (LIKE) con autocompletado de 400ms')
pdf.bullet('Sistema de solicitudes de acceso con estados: pending / accepted / rejected')
pdf.bullet('Conexiones bidireccionales con eliminacion en cascada (permisos + solicitudes)')
pdf.bullet('Permisos granulares: 6 flags (stats, trades, notes, comments, CSV, realtime)')
pdf.bullet('Configuracion de privacidad: public / connections / private')
pdf.bullet('Modo lectura-only estricto al visualizar journal ajeno')
pdf.bullet('Trades seed distintos para DEMO (crypto) y ADMIN01 (forex)')

pdf.section_title('Impacto para el usuario')
pdf.body('Antes: El Trading Journal era completamente personal y aislado. Los datos vivian en localStorage del navegador.')

pdf.body('Ahora: Cada usuario tiene un journal real persistido en el backend (PostgreSQL), con identidad, privacidad, y un sistema social completo estilo "trading social network" donde podes seguir a otros operadores, ver sus estadisticas agregadas, y (con permiso) sus trades completos.')

# ============== PAGE 2: BUGS FIXED ==============
pdf.add_page()
pdf.chapter_title('Bugs criticos corregidos')

pdf.section_title('1. Journal no cargaba trades del backend')
pdf.body('El frontend llamaba a la API pero esperaba un array. El backend devolvia un objeto {success, scope, trades, stats}. El chequeo if (data && data.length) fallaba siempre.')
pdf.code('ANTES:')
pdf.code('  if (data && data.length) { tjTrades = data; }')
pdf.code('  // Resultado: nunca se cargaban trades del servidor.')
pdf.code('')
pdf.code('AHORA:')
pdf.code('  if (data && data.success && data.trades) {')
pdf.code('    tjTrades = data.trades;')
pdf.code('    window._journalScope = data.scope;')
pdf.code('    window._journalStats = data.stats;')
pdf.code('  }')

pdf.section_title('2. Busqueda hardcodeada a DEMO y ADMIN01')
pdf.body('En el Social tab, el codigo tenia const validUsers = [\'DEMO\', \'ADMIN01\'] hardcodeado. Imposible buscar otros usuarios.')
pdf.code('ANTES:')
pdf.code('  const validUsers = [\'DEMO\', \'ADMIN01\'];')
pdf.code('  // Solo esos 2 usuarios aparecian.')
pdf.code('')
pdf.code('AHORA:')
pdf.code('  const data = await API.searchUsers(q);')
pdf.code('  // Backend hace LIKE %q% sobre la columna code.')

pdf.section_title('3. Service Worker no cacheaba assets en debug')
pdf.body('El SW intentaba precachear /api.js y /styles/app.css que no existen en public/ (se sirven directo desde assets/). El install fallaba.')
pdf.code('ANTES: PRECACHE_URLS = [\'/\', \'/api.js\', \'/styles/app.css\', ...]')
pdf.code('AHORA: PRECACHE_URLS = [\'/\', \'/manifest.json\', \'/icons/*\']')

pdf.section_title('4. tjSetPeriod undefined')
pdf.body('La funcion tjSetPeriod estaba definida dentro de un closure y no estaba expuesta a window. Los botones Diario/Semanal/Mensual del journal tab lanzaban ReferenceError.')

pdf.section_title('5. Notas del diario no se guardaban')
pdf.body('La funcion _encrypt() explotaba si _key era null. Ahora saveEntry() valida _key antes y muestra error claro.')

# ============== PAGE 3: BACKEND ==============
pdf.add_page()
pdf.chapter_title('Backend: nuevas entidades + endpoints')

pdf.section_title('4 entidades nuevas + 1 migracion')
pdf.code('Entity: AccessRequest')
pdf.code('  - requester, target, status, timestamps')
pdf.code('')
pdf.code('Entity: Connection')
pdf.code('  - user, connectedUser (bidireccional, 2 rows)')
pdf.code('')
pdf.code('Entity: JournalPermission')
pdf.code('  - grantor, grantee + 6 boolean flags')
pdf.code('    canViewStats, canViewTrades, canViewNotes,')
pdf.code('    canViewComments, canDownloadCsv, canViewRealtime')
pdf.code('')
pdf.code('Entity: JournalSetting')
pdf.code('  - user, visibility (public/connections/private)')

pdf.section_title('14 endpoints nuevos en SocialController')
pdf.code('POST   /api/access-request          Crear solicitud')
pdf.code('GET    /api/access-request          Listar recibidas/enviadas')
pdf.code('PATCH  /api/access-request/{id}     Aceptar/rechazar')
pdf.code('DELETE /api/access-request/{id}     Cancelar solicitud propia')
pdf.code('GET    /api/access-status/{code}    Estado de relacion con usuario')
pdf.code('GET    /api/connections             Mis conexiones')
pdf.code('DELETE /api/connections/{id}       Eliminar conexion (cascada)')
pdf.code('POST   /api/connections/{id}/block Bloquear conexion')
pdf.code('GET    /api/permissions/{code}     Permisos otorgados a usuario')
pdf.code('PATCH  /api/permissions/{code}     Actualizar permisos')
pdf.code('GET    /api/journal/settings       Mi configuracion de privacidad')
pdf.code('PATCH  /api/journal/settings       Cambiar privacidad')
pdf.code('GET    /api/profile/{code}         Perfil publico')
pdf.code('GET    /api/users/search?q=...     Buscar usuarios (LIKE)')

pdf.section_title('JournalController modificado')
pdf.body('El metodo list() ahora implementa 3 scopes con permisos diferenciados:')
pdf.code('Scope "owner": currentUser === target')
pdf.code('  -> Todos los campos: entry, sl, tp, pnl, notes, photos')
pdf.code('')
pdf.code('Scope "connected": conectado + tiene JournalPermission')
pdf.code('  -> Filtrado por flags: canViewTrades (entry/sl/tp/ratio)')
pdf.code('                       canViewStats  (sl/tp/ratio)')
pdf.code('                       canViewNotes  (notes)')
pdf.code('')
pdf.code('Scope "public": no conectado, visibility=public')
pdf.code('  -> Solo stats agregadas, sin entry/sl/tp/notes/photos')
pdf.code('  -> Si visibility=private: 403')
pdf.code('  -> Si visibility=connections y no conectado: 403')

# ============== PAGE 4: FRONTEND ==============
pdf.add_page()
pdf.chapter_title('Frontend: Social Tab completa')

pdf.section_title('Sidebar button + badges')
pdf.code('Boton: [link] Social [badge notificaciones]')
pdf.code('Badge aparece cuando hay solicitudes pendientes')
pdf.code('Notificaciones de 5 tipos: access_request, access_accepted,')
pdf.code('access_rejected, connection_removed, permissions_changed')

pdf.section_title('UI por seccion')
pdf.body('Search box: input con debounce 400ms, autocompletado via /api/users/search')

pdf.body('Solicitudes: recibidas (con Aceptar/Rechazar) + enviadas (con badge Pendiente)')

pdf.body('Conexiones: lista de cards con botones Permisos, Eliminar, y Ver Journal')

pdf.body('Privacidad: select dropdown con public / connections / private + descripcion')

pdf.section_title('Botones clave en conexiones')
pdf.bullet('[PERMISOS] - Modal con 6 checkboxes para configurar que puede ver')
pdf.bullet('[VER JOURNAL] - Navega al journal tab en modo lectura-only')
pdf.bullet('[X] - Elimina conexion + permisos en cascada')

pdf.section_title('Banner de modo lectura')
pdf.body('Cuando un usuario visualiza el journal de otro, aparece un banner:')
pdf.code('[ojo] Viendo journal de ADMIN01 (vista segun permisos) - Solo lectura')
pdf.code('                                                          [Volver a mi journal]')

pdf.section_title('Modo lectura-only (frontend)')
pdf.body('Cuando _journalViewingCode esta seteado, se ocultan todos los controles de modificacion:')
pdf.bullet('Tab "Registrar" (nuevo trade)')
pdf.bullet('Botones: CSV / HTML / JSON / Importar')
pdf.bullet('Botones Editar / Eliminar por trade (lista + day modal)')
pdf.bullet('Boton "+ Registrar Trade en este dia" (calendario)')

pdf.body('Backend refuerza: 403 si se intenta modificar trade ajeno via API.')

# ============== PAGE 5: SEED ==============
pdf.add_page()
pdf.chapter_title('Seed de datos para testing')

pdf.section_title('Comando: app:seed-trades')
pdf.body('Crea 12 trades realistas por usuario (DEMO + ADMIN01). Idempotente (no duplica).')

pdf.section_title('DEMO: estrategia crypto')
pdf.code('Activos principales: BTCUSDT, ETHUSDT, XAUUSD')
pdf.code('PnL promedio: ~$900/trade (alto)')
pdf.code('Estrategia: buy-the-dip, swing corto')
pdf.code('Win rate: 75% (9 wins / 3 losses)')
pdf.code('Total PnL: +$9,610')
pdf.code('Notas con tag [DEMO] para identificacion')

pdf.section_title('ADMIN01: estrategia forex')
pdf.code('Activos principales: EURUSD, GBPUSD, USDJPY, NAS100')
pdf.code('PnL promedio: ~$280/trade (moderado)')
pdf.code('Estrategia: swing medio, carry trade')
pdf.code('Win rate: 75% (9 wins / 3 losses)')
pdf.code('Total PnL: +$3,330')
pdf.code('Notas con tag [ADMIN01] para identificacion')

pdf.section_title('Como resetear el seed')
pdf.code('# Borrar trades existentes')
pdf.code('php bin/console dbal:run-sql \\')
pdf.code('  "DELETE FROM trades WHERE user_id IN (')
pdf.code('    SELECT id FROM users WHERE code IN (\'DEMO\',\'ADMIN01\'))"')
pdf.code('')
pdf.code('# Re-correr el seed')
pdf.code('php bin/console app:seed-trades')

# ============== PAGE 6: DEPLOY ==============
pdf.add_page()
pdf.chapter_title('Build y deployment')

pdf.section_title('Versiones del APK')
pdf.body('Este proyecto mantiene 2 APKs separados:')
pdf.code('APK Web (este):')
pdf.code('  package: com.tnsvt.app')
pdf.code('  tecnologia: Capacitor v8 + Android 14')
pdf.code('  ruta: android/')
pdf.code('  version actual: 1.6.3 (versionCode 9)')
pdf.code('')
pdf.code('APK Game (separado):')
pdf.code('  package: com.tnsvt.market.instinct')
pdf.code('  tecnologia: Capacitor v6')
pdf.code('  ruta: game-app/android/')
pdf.code('  version actual: 1.2.0')

pdf.section_title('Como buildear e instalar')
pdf.code('# 1. Setear JAVA_HOME a JDK 21')
pdf.code('$env:JAVA_HOME = "C:\\dev\\jdk\\jdk-21\\jdk-21.0.7+6"')
pdf.code('$env:Path = "$env:JAVA_HOME\\bin;$env:Path"')
pdf.code('')
pdf.code('# 2. Compilar APK')
pdf.code('cd android')
pdf.code('.\\gradlew.bat assembleDebug')
pdf.code('')
pdf.code('# 3. El APK queda en:')
pdf.code('android/app/build/outputs/apk/debug/app-debug.apk')
pdf.code('')
pdf.code('# 4. Copiar a public/')
pdf.code('Copy-Item android/app/build/outputs/apk/debug/app-debug.apk \\')
pdf.code('  -Destination public/apk/tnsvt-v1.6.3.apk')
pdf.code('Copy-Item android/app/build/outputs/apk/debug/app-debug.apk \\')
pdf.code('  -Destination public/downloads/tnsvt-app.apk')
pdf.code('')
pdf.code('# 5. Instalar en device')
pdf.code('adb install -r public/apk/tnsvt-v1.6.3.apk')

pdf.section_title('Devices de testing')
pdf.code('Z Fold 6: RFCXA0HZXFZ')
pdf.code('Server local: http://192.168.1.2:8000')
pdf.code('Tailscale: https://laptop-ebgqig6j.tailf43f87.ts.net:8000')

pdf.section_title('Versioning')
pdf.body('Regla: versionCode incrementa siempre (+1 por release). versionName sigue semver aproximado:')
pdf.bullet('patch (1.6.2 -> 1.6.3): bugfixes, cambios menores')
pdf.bullet('minor (1.6.x -> 1.7.0): feature nueva, breaking visual')
pdf.bullet('major (1.x -> 2.0): breaking architecture')

# ============== PAGE 7: GIT ==============
pdf.add_page()
pdf.chapter_title('Git workflow')

pdf.section_title('Repositorios')
pdf.code('Backend (este):')
pdf.code('  https://github.com/federicocasal73-gif/tnsvt-symfony.git')
pdf.code('  branch: master')
pdf.code('  ultimo commit: v1.6.3 journal sharing social system')
pdf.code('')
pdf.code('Game app (separado):')
pdf.code('  https://github.com/federicocasal73-gif/tnsvt-market-instinct.git')

pdf.section_title('Archivos modificados en v1.6.3')
pdf.code('M  android/app/build.gradle                  (versionCode/Name)')
pdf.code('M  assets/api.js                             (searchUsers method)')
pdf.code('M  assets/app.js                             (read-only mode + banner)')
pdf.code('M  public/sw.js                              (SW v37, precache fix)')
pdf.code('A  src/Command/SeedTradesCommand.php         (nuevo seed)')
pdf.code('M  src/Controller/Api/SocialController.php   (search + journal endpoints)')
pdf.code('M  src/Repository/UserRepository.php         (findByCodeLike)')
pdf.code('M  templates/base.html.twig                  (banner HTML + cache-buster)')

pdf.section_title('Comandos utiles')
pdf.code('# Crear usuarios iniciales')
pdf.code('php bin/console app:seed-users')
pdf.code('')
pdf.code('# Crear trades seed para DEMO y ADMIN01')
pdf.code('php bin/console app:seed-trades')
pdf.code('')
pdf.code('# Limpiar cache Symfony')
pdf.code('php bin/console cache:clear')
pdf.code('')
pdf.code('# Verificar endpoints desde CLI')
pdf.code('Invoke-RestMethod -Uri "http://192.168.1.2:8000/api/journal" \\')
pdf.code('  -Headers @{"X-Game-Code"="DEMO"}')

# ============== PAGE 8: TESTING ==============
pdf.add_page()
pdf.chapter_title('Testing end-to-end')

pdf.section_title('Checklist de verificacion')
pdf.body('1. Social search funciona')
pdf.code('  GET /api/users/search?q=ADM')
pdf.code('  -> { users: [{ code: "ADMIN01", name: "Admin" }] }')
pdf.body('')
pdf.body('2. Crear solicitud de acceso')
pdf.code('  POST /api/access-request {target_code: "ADMIN01"}')
pdf.code('  -> 201 { id: 1, status: "pending" }')
pdf.body('')
pdf.body('3. Aceptar solicitud')
pdf.code('  PATCH /api/access-request/1 {status: "accepted"}')
pdf.code('  -> Crea conexiones bidireccionales + permisos default')
pdf.body('')
pdf.body('4. Ver journal como conectado')
pdf.code('  GET /api/journal?user_code=ADMIN01')
pdf.code('  -> 200 { scope: "connected", trades: [...] }')
pdf.body('')
pdf.body('5. Cambiar permisos (ADMIN01 desactiva canViewTrades)')
pdf.code('  PATCH /api/permissions/DEMO {can_view_trades: false}')
pdf.code('  -> DEMO ve solo {id, asset, dir, result, pnl, date}')
pdf.body('')
pdf.body('6. Visibilidad privada')
pdf.code('  PATCH /api/journal/settings {visibility: "private"}')
pdf.code('  GET /api/journal?user_code=ADMIN01')
pdf.code('  -> 403 "Este journal es privado"')

pdf.section_title('User journey')
pdf.body('DEMO quiere ver el journal de ADMIN01:')
pdf.bullet('1. Login como DEMO')
pdf.bullet('2. Click tab Social')
pdf.bullet('3. Buscar "ADMIN01" en search box')
pdf.bullet('4. Click "Solicitar Acceso"')
pdf.bullet('5. Switch user a ADMIN01, aceptar en tab Solicitudes')
pdf.bullet('6. Volver a DEMO, click "Ver Journal" en conexion')
pdf.bullet('7. Ve journal de ADMIN01 en modo read-only')
pdf.bullet('8. Banner dice "Solo lectura" + boton "Volver a mi journal"')
pdf.bullet('9. Click "Volver" -> ve su propio journal con todos los controles')

# ============== PAGE 9: NOTAS ==============
pdf.add_page()
pdf.chapter_title('Notas finales')

pdf.section_title('Limitaciones conocidas')
pdf.bullet('Busqueda solo por codigo (LIKE), no por nombre')
pdf.bullet('Backend no soporta notificaciones push para cambios de permisos')
pdf.bullet('CSV export sigue usando el codigo del usuario logueado (no configurable por conectado)')
pdf.bullet('Modo dark mode es el unico soportado')

pdf.section_title('Pendientes para v1.7.0')
pdf.bullet('Busqueda por nombre + busqueda por activos operados')
pdf.bullet('Filtros en el journal tab (por activo, resultado, fecha)')
pdf.bullet('Compartir trade especifico via link unico')
pdf.bullet('Notificaciones en tiempo real via Mercure')
pdf.bullet('Comments en trades (canViewComments ya implementado en backend)')

pdf.section_title('Seguridad')
pdf.body('El backend verifica ownership en cada modificacion (create/update/delete en JournalController). El frontend complementa ocultando UI. Ambos lados deben coincidir.')

pdf.body('Privacidad: visibility=private siempre bloquea lectura. visibility=connections solo permite lectura a usuarios conectados con permisos activos.')

pdf.body('Encryption: el Diario Personal usa AES-256-GCM del lado del cliente. La contraseña NUNCA se envia al servidor.')

# ============== BACK COVER ==============
pdf.add_page()
pdf.set_font('Helvetica', 'B', 28)
pdf.set_text_color(40, 30, 80)
pdf.ln(80)
pdf.cell(0, 15, 'T.N.S.V.T Market Instinct', align='C')
pdf.ln(20)

pdf.set_font('Helvetica', '', 14)
pdf.set_text_color(120, 100, 50)
pdf.cell(0, 10, 'Version 1.6.3 - Stable', align='C')
pdf.ln(15)

pdf.set_font('Helvetica', 'I', 11)
pdf.set_text_color(100, 100, 100)
pdf.cell(0, 8, 'Trading Neuro-Spiritual Value Theory', align='C')
pdf.ln(8)
pdf.cell(0, 8, 'Christo Integro - Reino del Cristo Integro', align='C')
pdf.ln(40)

y = pdf.get_y()
pdf.set_draw_color(212, 175, 55)
pdf.set_line_width(2)
pdf.line(50, y, 160, y)
pdf.ln(20)

pdf.set_font('Helvetica', '', 10)
pdf.set_text_color(80, 80, 80)
pdf.cell(0, 6, 'Build por Federico Casal', align='C')
pdf.ln(8)
pdf.cell(0, 6, 'github.com/federicocasal73-gif', align='C')
pdf.ln(8)
pdf.cell(0, 6, '28 de Junio de 2026', align='C')

# Output
output_path = os.path.join(os.path.dirname(__file__), 'docs', 'TNSVT-v1.6.3-release-notes.pdf')
os.makedirs(os.path.dirname(output_path), exist_ok=True)
pdf.output(output_path)
print(f'PDF generated: {output_path}')
print(f'Size: {os.path.getsize(output_path) / 1024:.1f} KB')