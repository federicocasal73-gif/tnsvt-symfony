# Plan de Lanzamiento en Google Play Store
## TNSVT - Mentoria de Trading

**Versión**: 1.0
**Fecha**: Junio 2026
**Estado**: Aprobado para implementación

---

## Tabla de contenidos

1. [Por qué Play Store](#1-por-qu%C3%A9-play-store)
2. [Requisitos](#2-requisitos)
3. [Compliance y políticas](#3-compliance-y-pol%C3%ADticas)
4. [Setup técnico](#4-setup-t%C3%A9cnico)
5. [Assets requeridos](#5-assets-requeridos)
6. [Proceso de subida](#6-proceso-de-subida)
7. [Timeline](#7-timeline)
8. [Plantilla de descripción](#8-plantilla-de-descripci%C3%B3n)
9. [Estrategia de lanzamiento](#9-estrategia-de-lanzamiento)
10. [ASO y crecimiento orgánico](#10-aso-y-crecimiento-org%C3%A1nico)

---

## 1. Por qué Play Store

- ✅ **Distribución masiva**: acceso a 2.500 millones de usuarios Android
- ✅ **Updates automáticos**: los usuarios reciben la última versión sin hacer nada
- ✅ **Reviews y ratings**: validación social que ayuda a la conversión
- ✅ **Discoverability**: aparece en búsquedas de Google
- ✅ **Profesional**: le da legitimidad al producto
- ✅ **Billing integrado** (opcional): Google Play Billing como alternativa a MercadoPago

---

## 2. Requisitos

### 2.1. Google Play Developer Account
- **Costo**: $25 USD pago único
- **URL**: https://play.google.com/console
- **Verificación**: 1-2 días hábiles
- **Necesita**: tarjeta de crédito/débito, ID válido
- **Renovación**: no requiere (es pago único de por vida)

### 2.2. Android App Bundle (AAB) en lugar de APK
- Formato moderno que Google prefiere
- Genera APKs optimizados por dispositivo
- Reduce tamaño de descarga hasta 30%
- Comando: `gradlew bundleRelease` (en lugar de `assembleRelease`)

### 2.3. Google Play App Signing
- Google firma tu app con su propia key
- Vos mantenés tu upload key
- Beneficio: si perdés tu key, Google puede recuperarla
- Setup: transferir la keystore actual a Google

### 2.4. Assets requeridos

| Asset | Especificación |
|---|---|
| Icono de la app | 512x512 PNG, sin transparencia |
| Feature graphic | 1024x500 PNG/JPG |
| Screenshots (mín. 2, máx. 8) | 320-3840px, varios ratios (16:9, 4:3, etc) |
| Video de YouTube (opcional) | Trailer de la app |
| Descripción corta | 80 caracteres |
| Descripción completa | 4000 caracteres |
| Privacy policy URL | https://tnsvt.app/privacy |

### 2.5. Clasificación de contenido
- Cuestionario de Google Play (gratis, 5 min)
- Para apps de trading/mentoría: requiere disclaimer
- Típicamente: "Everyone" o "Teen" según contenido

### 2.6. Data Safety form
- Declarar qué datos se recopilan
- Si se cifran en tránsito
- Si el usuario puede pedir borrado
- **Obligatorio desde abril 2022**

---

## 3. Compliance y políticas

### ⚠️ Apps financieras/trading tienen restricciones

#### Disclaimer OBLIGATORIO (visible en la app)

> "Esta aplicación es solo para fines educativos. La mentoría y el contenido proporcionado no constituyen consejo financiero. Trading involucra riesgo significativo de pérdida. Resultados pasados no garantizan resultados futuros."

#### Contenido RESTRINGIDO en la Play Store

- ❌ NO prometer "ganancias garantizadas"
- ❌ NO usar testimonios sin disclaimer ("Gané $10,000 en 1 mes")
- ❌ NO decir "se hace rico fácil" o similares
- ❌ NO simular dinero real sin disclaimer
- ❌ NO ofrecer servicios de inversión gestionada sin licencia
- ❌ NO usar imágenes de personas famosas sin permiso
- ❌ NO incluir contenido que promueva esquemas piramidales

#### Contenido PERMITIDO

- ✅ Educación sobre mercados financieros
- ✅ Análisis técnico/fundamental
- ✅ Simulaciones con dinero virtual (con disclaimer)
- ✅ Mentoría con disclaimer apropiado
- ✅ Comunidad de discusión
- ✅ Gamificación y entretenimiento

### Política de privacidad

Necesitás una página web con la política. La URL va en Play Console. Ejemplo de contenido:

```
# Política de Privacidad de TNSVT

Última actualización: Junio 2026

## Datos que recopilamos
- Email (para autenticación)
- Username (para identificarte en la app)
- Actividad dentro de la app (cursos, trades, posts)
- Datos de uso (analytics, Firebase)
- Token de dispositivo (para push notifications)

## Cómo usamos tus datos
- Proveer el servicio de mentoría
- Enviarte notificaciones relevantes
- Mejorar la app (analytics)
- Generar leaderboards anónimos

## Tus derechos
- Ver y editar tus datos
- Descargar tus datos
- Borrar tu cuenta y todos tus datos
- Opt-out de emails marketing

## Seguridad
- Cifrado en tránsito (HTTPS)
- Cifrado en reposo
- No compartimos datos con terceros sin consentimiento

## Contacto
privacy@tnsvt.app
```

### Licencias (opcional)

Si vas a dar "recomendaciones" de inversión, deberías tener un disclaimer de "no somos asesores financieros". Esto te protege legalmente.

---

## 4. Setup técnico

### 4.1. Crear Developer Account

```
1. Ir a https://play.google.com/console
2. Click "Sign in" (usar cuenta Google)
3. Pagar $25 USD con tarjeta
4. Completar perfil de developer:
   - Nombre del developer: TNSVT
   - Email de contacto: dev@tnsvt.app
   - Teléfono de contacto
5. Verificar identidad (puede tomar 24-48hs)
6. Aceptar acuerdo de distribución
```

### 4.2. Crear la app en Play Console

```
1. "Create app"
2. Nombre: "TNSVT - Mentoría de Trading"
3. Idioma default: Español (Argentina)
4. Tipo: App
5. Gratis o paid: Gratis
6. Declaraciones:
   - Cumple con Families Policy: Sí (a menos que tenga contenido maduro)
   - Contiene anuncios: No
   - Compras in-app: Sí (suscripciones Pro, Elite, cursos)
```

### 4.3. Configurar Play App Signing

```
1. Setup → App integrity
2. Click "Set up Play App Signing"
3. Subir tu upload key (la actual: tnsvt-release.keystore)
4. Google la usa para firmar
5. Vos subís APKs firmados con upload key, Google los refirma con su key
6. Guardar: 
   - El certificado de upload (para vos)
   - El certificado de firma de Google (descargable)
```

**Para subir la upload key**:

```bash
# Exportar el certificado público de tu keystore
keytool -export -rfc -keystore tnsvt-release.keystore -alias tnsvt -file upload_certificate.pem
```

Después subís ese `.pem` a Play Console.

### 4.4. Build AAB

En lugar de `./gradlew assembleRelease` (que genera APK), usar:

```powershell
# En el directorio del proyecto TNSVT
cd C:\Users\HP 240 inch G9\tnsvt-symfony\android

# Generar AAB
.\gradlew.bat bundleRelease

# Salida:
# android\app\build\outputs\bundle\release\app-release.aab
```

**Nota**: el `build_apk.bat` actual genera APK. Hay que crear `build_aab.bat` o modificarlo para que use `bundleRelease`.

### 4.5. Subir a Play Console

```
1. Release → Production (o Internal testing primero)
2. "Create new release"
3. Subir el .aab
4. Release name: "1.0.0" (versión visible para vos)
5. Release notes: "Versión inicial de TNSVT - Mentoría de trading"
6. "Review and rollout"
```

---

## 5. Assets requeridos

### 5.1. Icono de la app (512x512)

Ya tenés los iconos generados por `assets/tools/gen_logos.py`. El de **512x512** es el que necesitás.

Verificar que:
- ✅ Tamaño exacto 512x512
- ✅ Formato PNG
- ✅ Sin transparencia (background sólido)
- ✅ Buena resolución

### 5.2. Feature graphic (1024x500)

Es el banner que aparece en la parte superior de la ficha de Play Store.

**Crear uno nuevo**:
- Diseño: hero con el logo TNSVT + tagline + 3-4 keywords clave
- Herramienta: Figma, Canva, o Photoshop
- Formato: PNG o JPG
- Tamaño: 1024x500

**Template sugerido**:
```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  [Logo TNSVT]   Mentoría de Trading de Elite              │
│                 Academia + Comunidad + Simulaciones        │
│                                                            │
│              Aprende, Practica, Gana                       │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 5.3. Screenshots (4-8 imágenes)

Tomar screenshots de la app en distintos dispositivos:

| Screenshot | Pantalla |
|---|---|
| 1 | Pantalla de inicio / Login |
| 2 | Dashboard principal (con XP, streaks) |
| 3 | Academia (cursos) |
| 4 | Journal de trading |
| 5 | Comunidad (chat) |
| 6 | Logros / gamificación |
| 7 | Mini-juego (si hay) |
| 8 | Leaderboard |

**Tamaños recomendados**:
- Phone: 1080x1920 (9:16 portrait)
- Tablet 7": 1200x1920
- Tablet 10": 1920x1200 (landscape)

**Herramientas**:
- En Windows: `Win+Shift+S` (Snip & Sketch)
- En el celu: botones de volumen + power
- Para 7" tablet: emulador Android Studio

### 5.4. Video de YouTube (opcional, recomendado)

Video de 30-60 segundos mostrando:
1. Apertura de la app (logo, splash)
2. Pantalla de login / signup
3. Dashboard principal
4. Un curso
5. El journal
6. Un mini-juego o feature destacada

Subir a YouTube y agregar el link en Play Console.

### 5.5. Privacy policy URL

Necesitás una página web con la política. Opciones:
- **Opción A**: Hostearla en `https://tnsvt.app/privacy` (cuando esté el VPS)
- **Opción B**: Hostearla gratis en `https://tnsvt-app.github.io/privacy` (GitHub Pages)
- **Opción C**: Usar un generador gratuito como PrivacyPolicies.com

---

## 6. Proceso de subida

### Paso 1: Crear la app

```
1. Play Console → "Create app"
2. Llenar formulario
3. Aceptar políticas
```

### Paso 2: Llenar Store Listing

```
1. Main store listing → "Manage"
2. App name: TNSVT - Mentoría de Trading
3. Short description (80 chars)
4. Full description (4000 chars)
5. App icon: subir 512x512
6. Feature graphic: subir 1024x500
7. Screenshots: subir 4-8 imágenes
8. Categoría: Education (o Finance)
9. Tags: trading, forex, bolsa, inversion
10. Email de contacto: support@tnsvt.app
11. Privacy policy URL: https://tnsvt.app/privacy
```

### Paso 3: Llenar Content Rating

```
1. "Start questionnaire"
2. Categoría: ¿Esta app tiene contenido educativo? → Yes
3. ¿Permite usuarios a crear contenido? → Yes (chat, posts)
4. ¿Muestra violencia? → No
5. ¿Contenido sexual? → No
6. ¿Drogas? → No
7. ¿Apuestas o trading? → "Users can learn about financial concepts" (Yes, con disclaimer)
8. Submit
9. Resultado típico: PEGI 3 / ESRB Everyone
```

### Paso 4: Llenar Data Safety

```
1. Data Safety form → "Start"
2. ¿Recopila datos? → Yes
3. Datos que recopilamos:
   - Account info (email, username) - Required, Encrypted in transit, User can request deletion
   - User-generated content (chat, journal, posts) - Required, Encrypted, User can request deletion
   - App activity (login, course progress) - Analytics, Encrypted
   - Device ID - For push notifications, Encrypted
4. ¿Comparte datos con terceros? → No (excepto Firebase para push)
5. Submit
```

### Paso 5: Llenar App Content

```
1. App content → "Manage"
2. Privacy policy: URL ya ingresada
3. Ads: No
4. Government app: No
5. Financial features: Yes (simulaciones, no real money)
6. Health: No
7. Declaraciones: completar todas
```

### Paso 6: Crear Internal Testing release

```
1. Testing → Internal testing
2. "Create new release"
3. Subir el .aab
4. Release notes
5. Review and rollout
```

### Paso 7: Configurar testers internos

```
1. Internal testing → "Testers" tab
2. Create email list: "internal_testers"
3. Agregar hasta 100 emails de testers
4. Cada tester recibe link para instalar la app
```

### Paso 8: Testear

- 5-10 amigos prueban durante 3-5 días
- Reportan bugs
- Iterar fixes

### Paso 9: Submit a Production

```
1. Release → Production
2. "Create new release"
3. Subir nueva versión del .aab (con fixes)
4. Rollout: 10% (liberar a 10% de los usuarios primero)
5. Submit for review
```

### Paso 10: Esperar review de Google

- Típicamente: 24-72 horas
- A veces más si hay problemas
- Te notifican por email cuando esté aprobada

### Paso 11: Publicar

- Click "Rollout to 100%"
- La app queda disponible para todo el mundo

---

## 7. Timeline

### Semana 1: Preparación

| Día | Tarea |
|---|---|
| 1 | Crear Google Play Developer Account, pagar $25 |
| 2 | Configurar Play App Signing, transferir keystore |
| 3 | Crear la app en Play Console |
| 4 | Generar assets (icon, feature graphic, screenshots) |
| 5 | Crear privacy policy y hostearla |
| 6-7 | Build AAB, completar formularios de Play Console |

### Semana 2: Testing

| Día | Tarea |
|---|---|
| 8 | Submit a Internal Testing |
| 9-10 | 5-10 amigos prueban, reportan bugs |
| 11 | Fixes de bugs |
| 12-13 | Re-test |

### Semana 3: Lanzamiento

| Día | Tarea |
|---|---|
| 14 | Submit a Production (rollout 10%) |
| 15-17 | Review de Google (24-72hs) |
| 18 | Aprobado, rollout a 100% |
| 19+ | Monitoreo, ASO, marketing |

**Total: 2-3 semanas desde la decisión hasta publicada**

---

## 8. Plantilla de descripción

### Short description (80 caracteres)

```
Mentoría de elite para traders. Academia, comunidad, simulaciones y mentoría 1:1.
```

### Full description (4000 caracteres)

```
TNSVT es la plataforma definitiva para traders que quieren llevar su trading al siguiente nivel.

🎓 ACADEMIA DE TRADING
- Cursos desde básico hasta avanzado
- Price action, gestión de riesgo, psicología
- Contenido actualizado semanalmente

👥 COMUNIDAD Y MENTORES
- Chat con mentores experimentados
- Análisis de mercado en vivo
- Soporte personalizado

📊 JOURNAL DE TRADING
- Registrá todos tus trades
- Análisis de performance
- Identificá patrones

🎮 GAMIFICACIÓN
- Sistema de XP y niveles
- Logros y badges
- Streaks y challenges diarios
- Leaderboard competitivo
- Mini-juegos educativos

🧪 SIMULACIONES
- Practicá sin riesgo con dinero virtual
- Competencias semanales
- Análisis post-trade

💎 PLANES
- Free: academia básica + gamificación
- Base ($9/mes): chat con mentores + challenges
- Pro ($14/mes): señales + todo lo anterior
- Elite ($29/mes): mentoría 1:1 + todo lo anterior

⚠️ DISCLAIMER
Esta aplicación es solo para fines educativos. La mentoría y el contenido no constituyen consejo financiero. Trading involucra riesgo significativo de pérdida. Resultados pasados no garantizan resultados futuros.

🌐 Sitio web: https://tnsvt.app
📧 Soporte: support@tnsvt.app
📱 Síguenos en redes: @tnsvt
```

---

## 9. Estrategia de lanzamiento

### Pre-lanzamiento (semana 1-2)

- Beta cerrada con 50 amigos
- Recolectar feedback
- Iterar bugs
- Preparar materials de marketing

### Lanzamiento suave (semana 3)

- Submit a Play Store
- Release a "Production" con rollout del 10%
- Monitorear crashes (Sentry)
- Monitorear reviews

### Lanzamiento completo (semana 4+)

- Rollout al 100%
- ASO (App Store Optimization) keywords
- Marketing en redes sociales
- Programa de referidos

### Post-lanzamiento (mes 2+)

- Updates regulares (1-2 por mes)
- Respond reviews
- Marketing continuo
- Análisis de cohortes

---

## 10. ASO y crecimiento orgánico

### 10.1. ASO (App Store Optimization)

#### Keywords principales
- trading
- mentoría trading
- forex
- bolsa
- price action
- inversiones
- trader academy
- aprender trading
- cursos trading
- mentor financiero

#### Keywords long-tail
- aprender a hacer trading
- cursos de trading online
- mentor de trading argentino
- academia de trading
- señales de trading
- journal de trading

#### Optimización de metadata
- Título: incluir keyword principal ("TNSVT - Mentoría de Trading")
- Descripción: keywords naturales en los primeros 160 caracteres
- Reviews positivos: pedirlos activamente
- Update frecuente: Google favorece apps actualizadas

### 10.2. Marketing de boca a boca

- Programa de referidos (1 mes gratis por referido que pague)
- Compartir en redes sociales
- Contenido en YouTube/TikTok
- Partnerships con influencers de trading

### 10.3. Métricas a monitorear

- Descargas por día
- Retención D1, D7, D30
- Conversion Free → Paid
- ARPU (Average Revenue Per User)
- Churn rate
- Reviews y ratings
- Crash rate (con Sentry)

---

## Checklist de lanzamiento

- [ ] Google Play Developer Account creado
- [ ] App creada en Play Console
- [ ] Play App Signing configurado
- [ ] Icon 512x512 subido
- [ ] Feature graphic 1024x500 subido
- [ ] 4-8 screenshots subidos
- [ ] Privacy policy hosteada y URL ingresada
- [ ] Short description completada
- [ ] Full description completada
- [ ] Content Rating completado
- [ ] Data Safety completado
- [ ] App Content completado
- [ ] Internal testing con 5+ testers
- [ ] Bugs fixeados
- [ ] Submit a Production
- [ ] Review aprobado
- [ ] Rollout al 100%
- [ ] Marketing iniciado

---

**FIN DEL DOCUMENTO DE PLAY STORE**

Para ver el plan completo de hosting, ver: `docs/plan-implementacion.md`
Para ver el plan de gamificación, ver: `docs/gamificacion.md`
