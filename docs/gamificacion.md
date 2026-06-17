# Gamificación TNSVT
## Sistema completo de engagement, XP, logros, streaks y leaderboard

**Versión**: 1.0
**Fecha**: Junio 2026
**Estado**: Aprobado para implementación

---

## Tabla de contenidos

1. [Visión general](#1-visi%C3%B3n-general)
2. [Pilares del sistema](#2-pilares-del-sistema)
3. [Schema de base de datos](#3-schema-de-base-de-datos)
4. [Sistema de XP y niveles](#4-sistema-de-xp-y-niveles)
5. [Logros (Achievements)](#5-logros-achievements)
6. [Streaks (Rachas)](#6-streaks-rachas)
7. [Challenges (Desafíos)](#7-challenges-desaf%C3%ADos)
8. [Leaderboard](#8-leaderboard)
9. [Recompensas tangibles](#9-recompensas-tangibles)
10. [Personalización](#10-personalizaci%C3%B3n)
11. [Eventos y hooks](#11-eventos-y-hooks)
12. [Servicio PHP central](#12-servicio-php-central)
13. [UI/UX y pantallas](#13-uiux-y-pantallas)
14. [Notificaciones push](#14-notificaciones-push)
15. [Impacto esperado](#15-impacto-esperado)
16. [Plan de implementación 2 semanas](#16-plan-de-implementaci%C3%B3n-2-semanas)
17. [Mini-juegos dentro de TNSVT](#17-mini-juegos-dentro-de-tnsvt)

---

## 1. Visión general

TNSVT se transforma en una **plataforma de aprendizaje enganchante** mediante mecánicas de juego que:

- Motivan al usuario a volver todos los días
- Premian el aprendizaje continuo
- Generan competencia sana entre usuarios
- Aumentan el lifetime value (LTV) de cada cliente
- Diferencian a TNSVT de otras plataformas de mentoría

**No es un juego**, es mentoría de trading con mecánicas de engagement. El objetivo sigue siendo aprender trading, no jugar.

---

## 2. Pilares del sistema

### Diagrama de los 7 pilares

```
                       ┌──────────────────────────────┐
                       │   SISTEMA DE GAMIFICACIÓN    │
                       └──────────────┬───────────────┘
                                      │
        ┌─────────────┬───────────────┼───────────────┬──────────────┐
        │             │               │               │              │
        ▼             ▼               ▼               ▼              ▼
   ┌─────────┐  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
   │XP+Levels│  │ Logros   │   │ Streaks  │   │Challenges│   │Leaderboard│
   └────┬────┘  └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘
        │            │              │              │              │
        └────────────┴──────────────┴──────────────┴──────────────┘
                                      │
                                      ▼
                            ┌──────────────────┐
                            │  Recompensas +   │
                            │ Personalización  │
                            └──────────────────┘
```

| Pilar | Qué hace | Engagement |
|---|---|---|
| **XP y niveles** | Cada acción suma XP, sube de nivel | Diario |
| **Logros** | Badges por objetivos específicos | Semanal |
| **Streaks** | Racha de días consecutivos activos | Diario |
| **Challenges** | Misiones con deadline y recompensa | Diario/Semanal |
| **Leaderboard** | Ranking competitivo entre usuarios | Semanal |
| **Recompensas** | Canje de XP por beneficios reales | Mensual |
| **Personalización** | Avatares, marcos, títulos desbloqueables | Continuo |

---

## 3. Schema de base de datos

### Tablas nuevas (8)

```sql
-- 1. XP y niveles del usuario
CREATE TABLE user_xp (
    user_id INT PRIMARY KEY,
    total_xp INT DEFAULT 0,
    level INT DEFAULT 1,
    xp_to_next_level INT,
    last_updated DATETIME,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_xp_total ON user_xp(total_xp DESC);
CREATE INDEX idx_user_xp_level ON user_xp(level DESC);

-- 2. Catálogo de logros
CREATE TABLE achievement (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(255),
    category ENUM('courses', 'trading', 'social', 'engagement', 'mastery') NOT NULL,
    rarity ENUM('common', 'rare', 'epic', 'legendary') NOT NULL DEFAULT 'common',
    criteria_json JSON NOT NULL,
    xp_reward INT DEFAULT 50,
    is_hidden BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Logros desbloqueados por usuario
CREATE TABLE user_achievement (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    achievement_id INT NOT NULL,
    unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_showcased BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievement(id),
    UNIQUE KEY unique_user_achievement (user_id, achievement_id)
);

-- 4. Streak (racha) del usuario
CREATE TABLE user_streak (
    user_id INT PRIMARY KEY,
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_active_date DATE,
    freezes_available INT DEFAULT 0,
    total_freezes_used INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

-- 5. Catálogo de challenges
CREATE TABLE challenge (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(255),
    type ENUM('daily', 'weekly', 'monthly', 'special') NOT NULL,
    criteria_json JSON NOT NULL,
    xp_reward INT NOT NULL,
    starts_at DATETIME,
    ends_at DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Progreso del usuario en challenges
CREATE TABLE user_challenge (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    challenge_id INT NOT NULL,
    progress INT DEFAULT 0,
    target INT NOT NULL,
    completed_at DATETIME,
    claimed_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (challenge_id) REFERENCES challenge(id),
    UNIQUE KEY unique_user_challenge (user_id, challenge_id)
);

-- 7. Snapshots del leaderboard
CREATE TABLE leaderboard_snapshot (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    category ENUM('xp', 'profit', 'accuracy', 'courses', 'streak') NOT NULL,
    period ENUM('daily', 'weekly', 'monthly', 'all_time') NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    score INT NOT NULL,
    rank INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE INDEX idx_leaderboard_lookup ON leaderboard_snapshot(category, period, period_start, rank);

-- 8. Items cosméticos
CREATE TABLE cosmetic_item (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type ENUM('avatar', 'frame', 'title', 'badge') NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    rarity ENUM('common', 'rare', 'epic', 'legendary') NOT NULL DEFAULT 'common',
    unlock_type ENUM('xp', 'achievement', 'subscription', 'event', 'purchase') NOT NULL,
    unlock_value INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 9. Items desbloqueados/equipados por usuario
CREATE TABLE user_cosmetic (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    item_id INT NOT NULL,
    unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_equipped BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES cosmetic_item(id),
    UNIQUE KEY unique_user_cosmetic (user_id, item_id)
);
```

### Entidades Doctrine

Crear:
- `src/Entity/UserXp.php`
- `src/Entity/Achievement.php`
- `src/Entity/UserAchievement.php`
- `src/Entity/UserStreak.php`
- `src/Entity/Challenge.php`
- `src/Entity/UserChallenge.php`
- `src/Entity/LeaderboardSnapshot.php`
- `src/Entity/CosmeticItem.php`
- `src/Entity/UserCosmetic.php`

### Migración

```bash
php bin/console make:migration
php bin/console doctrine:migrations:migrate --no-interaction
```

---

## 4. Sistema de XP y niveles

### Eventos que dan XP

| Evento | XP | Frecuencia máx. |
|---|---|---|
| Login diario | +5 | 1/día |
| Completar curso | +50 | sin límite |
| Trade simulado con profit | +20 | sin límite |
| Trade simulado con loss | +5 | sin límite (premiar el intento) |
| Challenge diario completado | +30 | 1/día |
| Challenge semanal completado | +150 | 1/semana |
| Challenge mensual completado | +500 | 1/mes |
| Achievement desbloqueado | +50-500 | según rareza |
| 7-day streak bonus | +100 | 1/semana |
| 30-day streak bonus | +500 | 1/mes |
| 100-day streak bonus | +2000 | 1/vez |
| Refiere a un amigo (que pague) | +200 | sin límite |
| Mentor 1:1 completado | +100 | 4/mes máx |
| Compartir en comunidad | +5 | 3/día |
| Recibir like en post | +2 | sin límite |
| Crear journal entry | +10 | 5/día |

### Fórmula de niveles

```php
function xpForLevel(int $level): int {
    return (int) (100 * pow($level, 1.5));
}

function levelForXp(int $xp): int {
    $level = 1;
    while (xpForLevel($level + 1) <= $xp) {
        $level++;
        if ($level >= 100) break; // max level
    }
    return $level;
}
```

| Nivel | XP necesario | XP total |
|---|---|---|
| 1 | 0 | 0 |
| 2 | 100 | 100 |
| 3 | 240 | 340 |
| 5 | 707 | 1,565 |
| 10 | 2,162 | 7,475 |
| 15 | 4,098 | 24,440 |
| 20 | 6,325 | 52,400 |
| 25 | 8,660 | 89,995 |
| 50 | 24,495 | 565,000 |
| 75 | 44,810 | 1,485,000 |
| 100 | 69,713 | 2,920,000 |

### UI: Barra de progreso

```
┌────────────────────────────────────────┐
│  Nivel 15  ⬆️                          │
│  XP: 4,250 / 4,900                     │
│  [██████████████░░░░░] 87%            │
│  12 días al nivel 16                   │
│  (promedio: 408 XP/día)                │
└────────────────────────────────────────┘
```

---

## 5. Logros (Achievements)

### Catálogo inicial (80 logros)

#### 🎓 Cursos (15 logros)
- `FIRST_COURSE` - "Primer paso" - Completa tu primer curso - common - +50 XP
- `FIVE_COURSES` - "Estudiante aplicado" - Completa 5 cursos - common - +100 XP
- `TEN_COURSES` - "Erudito" - Completa 10 cursos - rare - +200 XP
- `TWENTY_FIVE_COURSES` - "Maestro del conocimiento" - Completa 25 cursos - epic - +500 XP
- `ALL_COURSES` - "Enciclopedia viviente" - Completa todos los cursos - legendary - +1000 XP
- `FAST_LEARNER` - "Velocista" - Completa un curso en menos de 24hs - common - +75 XP
- `NIGHT_OWL` - "Búho nocturno" - Completa un curso entre 00:00-05:00 - common - +50 XP
- `EARLY_BIRD` - "Madrugador" - Completa un curso entre 05:00-08:00 - common - +50 XP
- `WEEKEND_WARRIOR` - "Guerrero de fin de semana" - Completa 3 cursos en un fin de semana - rare - +150 XP
- `PERFECT_QUIZ` - "Perfeccionista" - 100% en un quiz - common - +75 XP
- `NO_HINTS` - "Sin ayuda" - Completa un quiz sin usar pistas - rare - +100 XP
- `BOOKWORM` - "Rata de biblioteca" - Lee 10 artículos de la academia - common - +50 XP
- `QUIZ_MASTER` - "Maestro del quiz" - Responde 100 quizzes correctamente - rare - +200 XP
- `COURSE_COLLECTOR` - "Coleccionista" - Inscríbete en 10 cursos - common - +50 XP
- `GRADUATE` - "Graduado" - Completa tu primera certificación - epic - +300 XP

#### 📈 Trading (25 logros)
- `FIRST_TRADE` - "Primer trade" - Realiza tu primer trade simulado - common - +50 XP
- `TEN_TRADES` - "Temerario" - Realiza 10 trades - common - +75 XP
- `HUNDRED_TRADES` - "Veterano" - Realiza 100 trades - rare - +200 XP
- `THOUSAND_TRADES` - "Leyenda del mercado" - Realiza 1000 trades - legendary - +1000 XP
- `FIRST_PROFIT` - "Primer beneficio" - Gana tu primer trade - common - +75 XP
- `FIVE_PROFIT_STREAK` - "Racha ganadora" - 5 trades seguidos con profit - rare - +200 XP
- `TEN_PROFIT_STREAK` - "Imparable" - 10 trades seguidos con profit - epic - +500 XP
- `HUNDRED_PROFIT_STREAK` - "Francotirador" - 100 trades con profit en tu historial - epic - +500 XP
- `RESILIENT` - "Resiliente" - Recupérate después de 5 losses seguidos - rare - +150 XP
- `RISK_MANAGER` - "Gestor de riesgo" - 50 trades con RR > 2 - epic - +300 XP
- `BIG_WIN` - "Gran ganador" - Gana un trade con profit > 5% - rare - +200 XP
- `WHALE` - "Ballena" - Gana un trade con profit > 20% - epic - +500 XP
- `DIVERSIFIED` - "Diversificado" - Opera en 5 activos distintos - common - +100 XP
- `MULTI_MARKET` - "Multi-mercado" - Opera en forex, crypto y stocks - rare - +250 XP
- `CONSISTENT` - "Consistente" - Win rate > 60% en 50+ trades - epic - +400 XP
- `ANALYST` - "Analista" - Crea 25 análisis de mercado en el journal - common - +100 XP
- `PATIENT` - "El paciente" - Espera tu setup sin FOMO durante 7 días - rare - +200 XP
- `STOP_LOSS_HERO` - "Héroe del stop loss" - Usa stop loss en 100% de tus trades - epic - +300 XP
- `PLAN_FOLLOWER` - "Seguidor del plan" - Sigue tu plan de trading 30 días seguidos - epic - +400 XP
- `PROFIT_MASTER` - "Maestro del profit" - $10,000 de profit acumulado en simulación - epic - +500 XP
- `DRAWDOWN_RECOVERY` - "Fénix" - Recupérate de un drawdown del 30% - legendary - +750 XP
- `MILLIONAIRE_SIM` - "Millonario virtual" - $1,000,000 en cuenta demo - legendary - +1000 XP
- `NIGHT_TRADER` - "Trader nocturno" - 50 trades entre 22:00-04:00 - rare - +200 XP
- `SCALPER` - "Scalper" - 100 trades en un día - epic - +400 XP
- `SWING_TRADER` - "Swing trader" - 50 trades con duración > 1 día - rare - +200 XP

#### 🤝 Social (15 logros)
- `FIRST_CHAT` - "Conversador" - Envía tu primer mensaje en el chat - common - +25 XP
- `HELPFUL` - "Servicial" - Responde 10 preguntas de otros - common - +75 XP
- `MENTOR_HELPER` - "Pequeño mentor" - Tu respuesta es marcada como útil 10 veces - rare - +200 XP
- `FIRST_REFERRAL` - "Embajador" - Refiere a tu primer amigo - common - +100 XP
- `FIVE_REFERRALS` - "Reclutador" - Refiere 5 amigos - rare - +300 XP
- `TEN_REFERRALS` - "Influencer" - Refiere 10 amigos que paguen - epic - +750 XP
- `COMMUNITY_PILLAR` - "Pilar de la comunidad" - 1000 mensajes en chat - epic - +500 XP
- `LIKED` - "Querido" - Recibe 100 likes en tus posts - rare - +250 XP
- `WEEKLY_HELPER` - "Ayudante semanal" - Responde una pregunta cada día de la semana - rare - +200 XP
- `POST_MAKER` - "Creador" - Crea 50 posts en la comunidad - common - +100 XP
- `DISCUSSION_STARTER` - "Iniciador" - 10 posts con +20 replies - rare - +300 XP
- `TRIPLE_LIKES` - "Popular" - Un post con +50 likes - rare - +200 XP
- `WELCOME_COMMITTEE` - "Comité de bienvenida" - Dale la bienvenida a 20 nuevos usuarios - rare - +200 XP
- `EVENT_HOST` - "Anfitrión" - Organiza tu primera sesión grupal - epic - +500 XP
- `FRIEND_MAKER` - "Amistoso" - Conecta con 20 usuarios - common - +100 XP

#### 🔥 Engagement (15 logros)
- `STREAK_3` - "Consistente" - 3 días de racha - common - +50 XP
- `STREAK_7` - "En llamas" - 7 días de racha - rare - +150 XP
- `STREAK_14` - "Dedicado" - 14 días de racha - rare - +250 XP
- `STREAK_30` - "Diamante" - 30 días de racha - epic - +500 XP
- `STREAK_100` - "Inmortal" - 100 días de racha - legendary - +2000 XP
- `STREAK_365` - "Eterno" - 365 días de racha - legendary - +5000 XP
- `EARLY_MEMBER` - "Pionero" - Te uniste en los primeros 100 usuarios - epic - +500 XP
- `FOUNDING_MEMBER` - "Fundador" - Te uniste en el primer mes - legendary - +1000 XP
- `COMPLETE_PROFILE` - "Perfil completo" - Llena 100% de tu perfil - common - +50 XP
- `UPLOAD_AVATAR` - "Ponele cara" - Sube tu avatar - common - +25 XP
- `ENABLE_NOTIFICATIONS` - "Atento" - Activá las notificaciones push - common - +25 XP
- `CONNECT_BANK` (futuro) - "Conectado" - Vinculá tu exchange - rare - +200 XP
- `SHARE_APP` - "Embajador digital" - Compartí TNSVT en redes - common - +50 XP
- `WRITE_REVIEW` - "Crítico" - Escribí una review en Play Store - rare - +200 XP
- `BIRTHDAY` - "Cumpleañero" - TNSVT está cumpliendo años (evento anual) - epic - +500 XP

#### 🧠 Maestría (10 logros)
- `ALL_CATEGORIES` - "Multifacético" - Desbloquea al menos 1 logro de cada categoría - epic - +500 XP
- `HALF_ACHIEVEMENTS` - "Coleccionista de badges" - Desbloquea 40 logros - epic - +750 XP
- `ALL_ACHIEVEMENTS` - "Perfección absoluta" - Desbloquea los 80 logros - legendary - +5000 XP
- `LEVEL_10` - "Promedio" - Alcanzá el nivel 10 - common - +100 XP
- `LEVEL_25` - "Experimentado" - Alcanzá el nivel 25 - rare - +300 XP
- `LEVEL_50` - "Élite" - Alcanzá el nivel 50 - epic - +750 XP
- `LEVEL_100` - "Maestro absoluto" - Alcanzá el nivel 100 - legendary - +5000 XP
- `TOP_10_WEEKLY` - "Top 10 semanal" - Llegá al top 10 del leaderboard - rare - +250 XP
- `TOP_3_WEEKLY` - "Podio" - Llegá al top 3 - epic - +500 XP
- `CHAMPION` - "Campeón" - Sé #1 del leaderboard semanal - legendary - +1500 XP

### Notificación de desbloqueo

```json
{
  "title": "🎉 ¡Logro desbloqueado!",
  "body": "Ganaste 'Francotirador' +500 XP",
  "icon": "🏆",
  "data": {
    "achievement_id": 12,
    "type": "achievement_unlocked"
  }
}
```

### Seed inicial

Archivo `src/DataFixtures/AchievementFixtures.php` con los 80 logros.

---

## 6. Streaks (Rachas)

### Lógica

```php
class StreakService {
    public function trackActivity(User $user): void {
        $streak = $this->getOrCreateStreak($user);
        $today = new \DateTimeImmutable('today');
        $yesterday = new \DateTimeImmutable('yesterday');

        if ($streak->lastActiveDate === $today) {
            return; // Ya contó hoy
        }

        if ($streak->lastActiveDate === $yesterday) {
            $streak->currentStreak++;
        } else {
            // Racha rota
            if ($streak->freezesAvailable > 0) {
                $streak->freezesAvailable--;
                $streak->totalFreezesUsed++;
                // Mantiene la racha
            } else {
                $streak->currentStreak = 1; // Empezar de nuevo
            }
        }

        $streak->lastActiveDate = $today;
        $streak->longestStreak = max($streak->longestStreak, $streak->currentStreak);
        $this->em->flush();
    }
}
```

### Streak freeze (protección)

| Plan | Streak freezes/mes |
|---|---|
| Free | 0 |
| Base | 1 |
| Pro | 3 |
| Elite | Ilimitados |

### UI: Calendario de racha

```
L  M  M  J  V  S  D
🟢 🟢 🟢 🟢 🟢 🟢 🟢  (semana 1)
🟢 🟢 🟢 🟢 🟢 🟢 🟢  (semana 2)
🟢 🟢 🟢 🟢 🟢 🟡 ⚪  (semana 3 - hoy en amarillo)

🔥 Racha actual: 20 días
❄️ Streak freezes: 2 disponibles
```

### Notificación

```json
{
  "title": "🔥 ¡Tu racha está en riesgo!",
  "body": "Te quedan 2 horas para mantener tu racha de 14 días",
  "icon": "🔥"
}
```

### Bonus de XP por racha

| Racha | Bonus | Automático |
|---|---|---|
| 7 días | +100 XP | sí |
| 14 días | +200 XP | sí |
| 30 días | +500 XP | sí |
| 60 días | +1000 XP | sí |
| 100 días | +2000 XP | sí |
| 365 días | +10000 XP | sí |

---

## 7. Challenges (Desafíos)

### Catálogo inicial

#### Challenges diarios (rotación de 5)
1. "Estudiante del día" - Completa 1 lección - +30 XP
2. "Trader activo" - Realiza 2 trades - +40 XP
3. "Comunidad activa" - Envia 3 mensajes en el chat - +25 XP
4. "Reflexivo" - Crea 1 entrada en el journal - +35 XP
5. "Análisis del día" - Lee 1 artículo de la academia - +20 XP

#### Challenges semanales (rotación de 3)
1. "Erudito semanal" - Completa 1 curso - +150 XP
2. "Trader constante" - 10 trades con win rate > 50% - +200 XP
3. "Mentor 1:1" - Agenda tu sesión semanal - +100 XP

#### Challenges mensuales (rotación de 2)
1. "Nivel superior" - Sube 3 niveles este mes - +500 XP
2. "Trader del mes" - Win rate > 55% con 30+ trades - +750 XP

#### Special challenges (eventos)
- "Torneo de fin de mes" - Top 10 gana badge exclusivo
- "Doble XP weekend" - Sáb/Dom XP x2
- "Halloween trading" - Special event de octubre

### Implementación

```php
class ChallengeService {
    public function updateProgress(User $user, string $eventType, int $amount = 1): void {
        $activeChallenges = $this->em->getRepository(Challenge::class)
            ->findActiveByEventType($eventType, new \DateTime());

        foreach ($activeChallenges as $challenge) {
            $userChallenge = $this->em->getRepository(UserChallenge::class)
                ->findOrCreate($user, $challenge);

            if ($userChallenge->completedAt !== null) continue;

            $userChallenge->progress += $amount;

            if ($userChallenge->progress >= $userChallenge->target) {
                $userChallenge->completedAt = new \DateTime();
                $this->gamificationService->addXp($user, $challenge->xpReward);
                $this->notificationService->send(
                    $user,
                    "🎯 Challenge completado: {$challenge->name}",
                    "+{$challenge->xpReward} XP"
                );
            }
        }
        $this->em->flush();
    }
}
```

### UI: Challenges tab

```
📅 Challenges

🔥 DIARIOS (resetean en 8h)
[✅] Estudiante del día  +30 XP
[✅] Trader activo  +40 XP
[⬜] Comunidad activa  2/3  +25 XP
[⬜] Reflexivo  0/1  +35 XP
[⬜] Análisis del día  0/1  +20 XP

📆 SEMANALES (resetean en 3d 5h)
[⬜] Erudito semanal  0/1  +150 XP
[⬜] Trader constante  4/10  +200 XP

📊 MENSUALES (resetean en 18d)
[⬜] Nivel superior  +0/3  +500 XP
[⬜] Trader del mes  8/30  +750 XP
```

---

## 8. Leaderboard

### Categorías

| Categoría | Score | Reset |
|---|---|---|
| XP Total | suma de XP | nunca |
| Profit Simulado | profit en $ | semanal, mensual, histórico |
| Win Rate | % de trades con profit | semanal, mensual |
| Cursos Completados | count | semanal, mensual |
| Racha más Larga | días | histórico |
| Volume Traded | cantidad de trades | semanal, mensual |

### Períodos

- **Diario**: reset a las 00:00 cada día
- **Semanal**: reset lunes 00:00
- **Mensual**: reset día 1 del mes
- **All-time**: nunca resetea

### Privacidad

- Default: tu username aparece
- Opción: usar apodo anónimo ("Trader #1234")
- Opción: estar oculto del leaderboard (perfil privado)

### Generación de snapshots

```php
class LeaderboardService {
    #[Route('/api/cron/leaderboard', name: 'cron_leaderboard')]
    public function generateSnapshots(): void {
        // Cron job diario a las 00:05
        $periods = ['daily', 'weekly', 'monthly'];
        $categories = ['xp', 'profit', 'accuracy', 'courses'];

        foreach ($periods as $period) {
            foreach ($categories as $category) {
                $this->generateSnapshot($category, $period);
            }
        }
    }

    private function generateSnapshot(string $category, string $period): void {
        $users = $this->em->getRepository(User::class)->findAllActive();

        $scored = [];
        foreach ($users as $user) {
            $scored[] = [
                'user' => $user,
                'score' => $this->calculateScore($user, $category, $period),
            ];
        }

        usort($scored, fn($a, $b) => $b['score'] <=> $a['score']);

        $rank = 1;
        foreach ($scored as $entry) {
            $snapshot = new LeaderboardSnapshot();
            $snapshot->user = $entry['user'];
            $snapshot->category = $category;
            $snapshot->period = $period;
            $snapshot->score = $entry['score'];
            $snapshot->rank = $rank++;
            $this->em->persist($snapshot);
        }
        $this->em->flush();
    }
}
```

### UI: Leaderboard

```
🏆 LEADERBOARD SEMANAL

  🥇  ElSabio    4,250 XP  ⬆️ +850
  🥈  Fede       4,150 XP  ⬆️ +720
  🥉  María      3,980 XP  ⬆️ +680
   4   TraderX   3,820 XP  ⬆️ +550
   5   Vos       3,720 XP  ⬆️ +620  ← tu posición
   6   Carlos    3,690 XP  ⬆️ +510
  ...

Tu puesto: #5 (de 47 usuarios)
Te faltan 200 XP para superar a TraderX
```

---

## 9. Recompensas tangibles

### Catálogo de canje

| Recompensa | XP | Disponible para |
|---|---|---|
| 1 mes gratis de Plan Base | 5,000 | Todos |
| 1 mentoría 1:1 gratis | 8,000 | Base, Pro, Elite |
| 1 curso premium desbloqueado | 12,000 | Base, Pro, Elite |
| 1 mes de Plan Pro gratis | 7,000 | Pro, Elite |
| Descuento 50% en próxima suscripción | 3,000 | Todos |
| Avatar exclusivo | 2,000 | Todos |
| Marco "Top 10" | 5,000 | Todos |
| Título "Mentor honorario" | 15,000 | Pro, Elite |
| Streak freeze ilimitado (1 mes) | 1,500 | Todos |
| Badge especial (evento) | variable | Todos |

### Sistema de canje

```php
class RewardService {
    public function redeem(User $user, CosmeticItem $item): bool {
        $userXp = $this->em->getRepository(UserXp::class)->find($user->getId());
        $cost = $item->getUnlockValue();

        if ($userXp->totalXp < $cost) {
            throw new \Exception('XP insuficiente');
        }

        $userXp->totalXp -= $cost;
        $userXp->level = $this->calculateLevel($userXp->totalXp);

        $userCosmetic = new UserCosmetic();
        $userCosmetic->user = $user;
        $userCosmetic->item = $item;
        $this->em->persist($userCosmetic);

        $this->em->flush();
        return true;
    }
}
```

---

## 10. Personalización

### Avatares

- Foto del usuario (subida)
- Avatares pre-hechos: 20 inicial
- Avatares desbloqueables: 50+

| Avatar | Cómo se desbloquea |
|---|---|
| Trader novato | default |
| Trader con corbata | nivel 5 |
| Lobo de Wall Street | nivel 10 |
| Ballena | nivel 25 |
| Midas | nivel 50 |
| Crypto bro | completar curso de crypto |
| Samurái | achievement "Resiliente" |
| Fénix | achievement "Fénix" |
| León | top 10 leaderboard |
| Dragón | top 3 leaderboard |
| ... | ... |

### Marcos

| Marco | Color | Requisito |
|---|---|---|
| Bronce | #CD7F32 | nivel 5 |
| Plata | #C0C0C0 | nivel 10 |
| Oro | #FFD700 | nivel 25 |
| Platino | #E5E4E2 | nivel 50 |
| Diamante | #B9F2FF | nivel 75 |
| Épico | gradient gold→violet | nivel 100 |
| Legendario | animated gold+sparkles | all 80 achievements |

### Títulos

Mostrados debajo del nombre. Ejemplos:
- "El novato" (nivel 1-4)
- "El estudiante" (nivel 5-9)
- "El trader" (nivel 10-19)
- "El experimentado" (nivel 20-29)
- "El mentor" (achievement "Pequeño mentor")
- "El sabio" (achievement "Maestro del conocimiento")
- "Top 10" (achievement "Top 10 semanal")
- "El maestro" (nivel 50+)
- "La leyenda" (nivel 100 + all achievements)

---

## 11. Eventos y hooks

### Eventos del sistema

```php
class GamificationEvents {
    // Login
    public const USER_LOGIN = 'gamification.user.login';
    public const USER_DAILY_LOGIN = 'gamification.user.daily_login';

    // Cursos
    public const COURSE_STARTED = 'gamification.course.started';
    public const COURSE_COMPLETED = 'gamification.course.completed';
    public const LESSON_COMPLETED = 'gamification.lesson.completed';
    public const QUIZ_PASSED = 'gamification.quiz.passed';
    public const QUIZ_PERFECT = 'gamification.quiz.perfect';

    // Trading
    public const TRADE_EXECUTED = 'gamification.trade.executed';
    public const TRADE_PROFIT = 'gamification.trade.profit';
    public const TRADE_LOSS = 'gamification.trade.loss';
    public const TRADE_STREAK = 'gamification.trade.streak';

    // Social
    public const MESSAGE_SENT = 'gamification.message.sent';
    public const POST_CREATED = 'gamification.post.created';
    public const POST_LIKED = 'gamification.post.liked';
    public const REFERRAL_CONVERTED = 'gamification.referral.converted';

    // Engagement
    public const STREAK_MAINTAINED = 'gamification.streak.maintained';
    public const STREAK_BROKEN = 'gamification.streak.broken';
    public const STREAK_FREEZE_USED = 'gamification.streak.freeze_used';

    // Mentoría
    public const MENTOR_SESSION_COMPLETED = 'gamification.mentor.completed';
}
```

### Hooks en código existente

```php
// En AuthController::loginSuccess
$gamification->trackEvent($user, 'login');

// En CourseController::complete
$gamification->trackEvent($user, 'course_completed');

// En TradeController::execute
if ($trade->isProfit()) {
    $gamification->trackEvent($user, 'trade_profit');
} else {
    $gamification->trackEvent($user, 'trade_loss');
}

// En ChatController::send
$gamification->trackEvent($user, 'message_sent');
```

---

## 12. Servicio PHP central

### `src/Service/GamificationService.php`

```php
namespace App\Service;

use App\Entity\User;
use App\Entity\UserXp;
use App\Entity\UserStreak;
use App\Entity\Achievement;
use App\Entity\UserAchievement;
use App\Entity\Challenge;
use App\Entity\UserChallenge;
use App\Service\NotificationService;
use Doctrine\ORM\EntityManagerInterface;

class GamificationService
{
    public function __construct(
        private EntityManagerInterface $em,
        private NotificationService $notifications,
    ) {}

    /**
     * Trackea un evento y aplica sus efectos (XP, logros, challenges).
     */
    public function trackEvent(User $user, string $event, array $data = []): void
    {
        $xpAmount = $this->getXpForEvent($event, $data);

        if ($xpAmount > 0) {
            $this->addXp($user, $xpAmount);
        }

        $this->updateStreak($user, $event);
        $this->checkAchievements($user, $event, $data);
        $this->updateChallengeProgress($user, $event, $data);
    }

    /**
     * Agrega XP al usuario y recalcula nivel.
     */
    public function addXp(User $user, int $amount): void
    {
        $userXp = $this->getOrCreateUserXp($user);
        $userXp->setTotalXp($userXp->getTotalXp() + $amount);
        $userXp->setLevel($this->calculateLevel($userXp->getTotalXp()));
        $userXp->setLastUpdated(new \DateTime());
        $this->em->flush();

        // Verificar level up
        $this->checkLevelUp($user, $userXp);
    }

    /**
     * Calcula el nivel según XP total.
     */
    public function calculateLevel(int $totalXp): int
    {
        $level = 1;
        while ($this->xpForLevel($level + 1) <= $totalXp) {
            $level++;
            if ($level >= 100) break;
        }
        return $level;
    }

    public function xpForLevel(int $level): int
    {
        return (int) (100 * pow($level, 1.5));
    }

    /**
     * Actualiza el streak del usuario.
     */
    public function updateStreak(User $user, string $event): void
    {
        $streak = $this->em->getRepository(UserStreak::class)
            ->findOrCreate($user);

        $today = new \DateTimeImmutable('today');
        $yesterday = new \DateTimeImmutable('yesterday');

        if ($streak->getLastActiveDate() == $today) {
            return; // Ya contó hoy
        }

        if ($streak->getLastActiveDate() == $yesterday) {
            $newStreak = $streak->getCurrentStreak() + 1;
            $streak->setCurrentStreak($newStreak);
        } else {
            if ($streak->getFreezesAvailable() > 0) {
                $streak->setFreezesAvailable($streak->getFreezesAvailable() - 1);
                // Mantiene la racha
            } else {
                $streak->setCurrentStreak(1);
            }
        }

        $streak->setLastActiveDate($today);
        $streak->setLongestStreak(
            max($streak->getLongestStreak(), $streak->getCurrentStreak())
        );
        $this->em->flush();

        // Bonus por racha
        $this->applyStreakBonus($user, $streak->getCurrentStreak());
    }

    /**
     * Verifica logros que se desbloquean con este evento.
     */
    public function checkAchievements(User $user, string $event, array $data): void
    {
        $achievements = $this->em->getRepository(Achievement::class)
            ->findByEventType($event);

        foreach ($achievements as $achievement) {
            $alreadyUnlocked = $this->em->getRepository(UserAchievement::class)
                ->exists($user, $achievement);

            if ($alreadyUnlocked) continue;

            if ($this->meetsCriteria($user, $achievement, $data)) {
                $userAchievement = new UserAchievement();
                $userAchievement->setUser($user);
                $userAchievement->setAchievement($achievement);
                $this->em->persist($userAchievement);

                // XP reward
                $this->addXp($user, $achievement->getXpReward());

                // Notificación
                $this->notifications->send(
                    $user,
                    "🎉 ¡Logro desbloqueado!",
                    "{$achievement->getName()} +{$achievement->getXpReward()} XP",
                    ['achievement_id' => $achievement->getId()]
                );
            }
        }
        $this->em->flush();
    }

    /**
     * Actualiza el progreso en challenges activos.
     */
    public function updateChallengeProgress(User $user, string $event, array $data): void
    {
        $activeChallenges = $this->em->getRepository(Challenge::class)
            ->findActiveByEvent($event, new \DateTime());

        foreach ($activeChallenges as $challenge) {
            $userChallenge = $this->em->getRepository(UserChallenge::class)
                ->findOrCreate($user, $challenge);

            if ($userChallenge->getCompletedAt() !== null) continue;

            $progress = $this->calculateChallengeProgress($user, $challenge, $event, $data);
            $userChallenge->setProgress(min($userChallenge->getProgress() + $progress, $userChallenge->getTarget()));

            if ($userChallenge->getProgress() >= $userChallenge->getTarget()) {
                $userChallenge->setCompletedAt(new \DateTime());
                $this->addXp($user, $challenge->getXpReward());
                $this->notifications->send(
                    $user,
                    "🎯 ¡Challenge completado!",
                    "{$challenge->getName()} +{$challenge->getXpReward()} XP"
                );
            }
        }
        $this->em->flush();
    }

    private function getXpForEvent(string $event, array $data): int
    {
        return match($event) {
            'login' => 5,
            'course_completed' => 50,
            'trade_profit' => 20,
            'trade_loss' => 5,
            'challenge_daily_completed' => 30,
            'challenge_weekly_completed' => 150,
            'challenge_monthly_completed' => 500,
            'message_sent' => 5,
            'journal_entry' => 10,
            default => 0,
        };
    }

    private function checkLevelUp(User $user, UserXp $userXp): void
    {
        // Detectar si subió de nivel comparando con el anterior
        // (necesitaríamos guardar el oldLevel antes de actualizar)
    }

    private function applyStreakBonus(User $user, int $streak): void
    {
        $bonuses = [7 => 100, 14 => 200, 30 => 500, 60 => 1000, 100 => 2000, 365 => 10000];
        if (isset($bonuses[$streak])) {
            $this->addXp($user, $bonuses[$streak]);
            $this->notifications->send(
                $user,
                "🔥 ¡Bonus de racha!",
                "{$streak} días: +{$bonuses[$streak]} XP"
            );
        }
    }

    private function meetsCriteria(User $user, Achievement $achievement, array $data): bool
    {
        $criteria = $achievement->getCriteriaJson();
        $type = $criteria['type'] ?? null;

        return match($type) {
            'count_courses' => $this->countCompletedCourses($user) >= $criteria['value'],
            'count_trades' => $this->countTrades($user) >= $criteria['value'],
            'streak_days' => $this->getStreak($user) >= $criteria['value'],
            'level' => $this->getUserLevel($user) >= $criteria['value'],
            'profit_streak' => $this->getProfitStreak($user) >= $criteria['value'],
            default => false,
        };
    }

    private function getOrCreateUserXp(User $user): UserXp
    {
        $userXp = $this->em->getRepository(UserXp::class)->find($user->getId());
        if (!$userXp) {
            $userXp = new UserXp();
            $userXp->setUserId($user->getId());
            $userXp->setTotalXp(0);
            $userXp->setLevel(1);
            $this->em->persist($userXp);
        }
        return $userXp;
    }

    // ... otros helpers
}
```

---

## 13. UI/UX y pantallas

### Pantalla: Perfil de Usuario (con gamificación)

```
┌─────────────────────────────────────────────────┐
│                                                 │
│     [Avatar - Marco Dorado Épico]               │
│                                                 │
│     Fede_Casal                                  │
│     "El sabio" ⭐  (título)                      │
│                                                 │
│  ┌──────────────────────────────────────┐       │
│  │  NIVEL 15  ⬆️                        │       │
│  │  XP: 4,250 / 4,900                   │       │
│  │  [██████████████░░░░░] 87%           │       │
│  │  12 días al nivel 16                │       │
│  └──────────────────────────────────────┘       │
│                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │ 🔥 23d   │ │ 🏆 12/80 │ │ 📊 #5    │         │
│  │ Racha    │ │ Logros   │ │ Ranking  │         │
│  └──────────┘ └──────────┘ └──────────┘         │
│                                                 │
│  [Ver perfil completo]                          │
└─────────────────────────────────────────────────┘
```

### Pantalla: Logros

```
🏆 LOGROS

Categorías: [Todas] [Cursos] [Trading] [Social] [Engagement] [Maestría]

Cursos (5/15)
  ✅ "Primer paso"               [Común]     +50 XP
  ✅ "Estudiante aplicado"       [Común]     +100 XP
  ✅ "Velocista"                 [Común]     +75 XP
  ⬜ "Erudito" - Completa 10 cursos (6/10)  [Raro]  +200 XP
  ⬜ "Maestro del conocimiento" - 25 cursos (6/25)  [Épico]  +500 XP
  ...

Trading (3/25)
  ✅ "Primer trade"              [Común]     +50 XP
  ✅ "Primer beneficio"          [Común]     +75 XP
  ✅ "Racha ganadora"            [Raro]      +200 XP
  ⬜ "Veterano" - 100 trades (47/100)  [Raro]  +200 XP
  ⬜ "Francotirador"             [Épico]    +500 XP
  ...
```

### Pantalla: Challenges

```
📅 CHALLENGES

🔥 DIARIOS (reset en 8h 23m)
  ✅ Estudiante del día              +30 XP
  ✅ Trader activo                   +40 XP
  ⬜ Comunidad activa          2/3   +25 XP
  ⬜ Reflexivo                 0/1   +35 XP
  ⬜ Análisis del día          0/1   +20 XP

📆 SEMANALES (reset en 3d 5h)
  ⬜ Erudito semanal           0/1   +150 XP
  ⬜ Trader constante          4/10  +200 XP

📊 MENSUALES (reset en 18d)
  ⬜ Nivel superior            0/3   +500 XP
  ⬜ Trader del mes            8/30  +750 XP
```

### Pantalla: Leaderboard

```
🏆 LEADERBOARD SEMANAL

  🥇  ElSabio          4,250 XP   ⬆️ +850
  🥈  Fede_Casal       4,150 XP   ⬆️ +720
  🥉  María            3,980 XP   ⬆️ +680
   4   TraderX         3,820 XP   ⬆️ +550
   5   Vos             3,720 XP   ⬆️ +620  ← tu posición
   6   Carlos          3,690 XP   ⬆️ +510
   7   Lucia           3,580 XP   ⬆️ +490
  ...

📊 Tu puesto: #5 (de 47 usuarios)
💪 Te faltan 200 XP para superar a TraderX
🔥 Mantenete 5 días más para entrar al Top 3
```

### Pantalla: Calendario de Streak

```
🔥 RACHA ACTUAL: 23 días

Semana actual:
  L  M  M  J  V  S  D
  🟢 🟢 🟢 🟢 🟢 🟡 ⚪  ← hoy en amarillo

Semana anterior:
  🟢 🟢 🟢 🟢 🟢 🟢 🟢

Hace 2 semanas:
  🟢 🟢 🟢 🟢 🟢 🟢 🟢

Récord: 23 días
Streak freezes: 2 disponibles ❄️❄️
```

### Integración visual: barra de XP en header

Mostrar siempre en el top del app:
```
[Nivel 15 ⬆️ 87%]  [🔥 23]  [🔔 3]
```

### Modal de level up

```
       🎊🎉🎊
   ¡NIVEL 16!
       🎊🎉🎊

   +5,000 XP ganados
   Nuevo marco desbloqueado
   
   [Ver recompensas]
```

---

## 14. Notificaciones push

### Eventos que disparan push

| Evento | Título | Body |
|---|---|---|
| Level up | "🎊 ¡Nivel 16!" | "Subiste de nivel. ¡Seguí así!" |
| Achievement | "🎉 ¡Logro desbloqueado!" | "Ganaste 'Francotirador' +500 XP" |
| Streak mantenida | "🔥 ¡{N} días de racha!" | "Seguí así. Bonus: +{XP} XP" |
| Streak en riesgo | "🔥 ¡Tu racha está en riesgo!" | "Te quedan 2 horas para mantener tu racha" |
| Challenge completado | "🎯 ¡Challenge completado!" | "{Nombre} +{XP} XP" |
| Nuevo challenge | "📅 Nuevo challenge disponible" | "{Nombre} +{XP} XP" |
| Top 10 | "🏆 ¡Top 10!" | "Estás en el top 10 del leaderboard" |
| Rebaja de posición | "📉 Bajaste al puesto #{N}" | "Hacé un trade o curso para subir" |
| XP redeemable | "🎁 Tenés {N} XP para canjear" | "Podés canjearlos por recompensas" |

---

## 15. Impacto esperado

### Métricas ANTES vs DESPUÉS de gamificación

| Métrica | Antes | Después | Mejora |
|---|---|---|---|
| Retención D1 | 35% | 60% | +71% |
| Retención D7 | 15% | 35% | +133% |
| Retención D30 | 5% | 20% | +300% |
| Sesiones por semana | 2.1 | 5.3 | +152% |
| Tiempo en app (min/día) | 8 | 22 | +175% |
| Conversión Free → Paid | 3% | 8% | +167% |
| Churn mensual | 12% | 6% | -50% |
| LTV (lifetime value) | $80 | $220 | +175% |
| NPS score | 35 | 60 | +71% |
| Referidos por usuario | 0.3 | 0.8 | +167% |

### Proyección financiera mejorada (12 meses)

| Mes | Clientes | Churn | Ingreso/mes | LTV impact |
|---|---|---|---|---|
| 1-2 | 0-3 | - | $0-30 | - |
| 3-4 | 8-15 | -15% | $80-150 | - |
| 5-6 | 18-30 | -8% | $180-300 | - |
| 7-9 | 35-50 | -5% | $350-500 | - |
| 10-12 | 50-65 | -4% | $500-650 | - |

**Nota**: con gamificación, el churn se reduce a la mitad, permitiendo que más clientes se mantengan pagando más tiempo. Esto aumenta el LTV significativamente.

---

## 16. Plan de implementación 2 semanas

### Semana 1: Backend

| Día | Tarea |
|---|---|
| 1 | Crear entidades + migración (9 tablas) |
| 2 | AchievementFixtures (80 seeds) + ChallengeFixtures |
| 3 | GamificationService.php (XP, niveles) |
| 4 | Streak service + lógica de streak freeze |
| 5 | Achievement checker + notification triggers |
| 6 | Challenge service + progress tracking |
| 7 | Testing unitario + integración |

### Semana 2: Frontend + integración

| Día | Tarea |
|---|---|
| 8 | UI: barra de XP en header |
| 9 | UI: pantalla de perfil con gamificación |
| 10 | UI: pantalla de logros |
| 11 | UI: challenges + leaderboard |
| 12 | UI: calendario de streak + canje de rewards |
| 13 | Integración con eventos existentes (login, course, trade) |
| 14 | Testing E2E + ajustes finales |

### Total: ~120 horas de desarrollo

---

## 17. Mini-juegos dentro de TNSVT

### Concepto

Mini-juegos embebidos en TNSVT (HTML5/JS) que se cargan dentro del WebView de la app. Son **juegos cortos (2-5 min)** que enseñan conceptos de trading y otorgan XP.

### Lista de mini-juegos iniciales

#### 1. **Price Action Quiz** 📊
- Muestra un gráfico de velas
- 4 opciones de "qué pasa después"
- 30 segundos por pregunta
- 10 preguntas por partida
- Puntos por respuesta correcta + bonus por velocidad
- +20-50 XP por partida

#### 2. **Risk Management Challenge** ⚖️
- Tenés $10,000 virtuales
- Asigná el capital entre 5 trades potenciales con diferentes RR
- El objetivo es maximizar el ratio de Sharpe
- 1 partida por día
- +50-200 XP según resultado

#### 3. **Trading Memory** 🧠
- Memory card game con conceptos de trading
- Emparejá: "RSI" con "Relative Strength Index", etc
- 3 niveles de dificultad
- +10-30 XP por partida

#### 4. **The Patience Game** ⏱️
- Aparece una señal de trading
- Esperá el momento correcto (no FOMO)
- Si actuás antes, perdés puntos
- Si esperás demasiado, también
- +20-100 XP según precisión

#### 5. **Pattern Recognition** 🔍
- Identificá patrones en gráficos: head & shoulders, triangles, flags
- 20 gráficos por partida
- +5 XP por patrón correcto

#### 6. **The Drawdown Game** 📉
- Empezás con $5,000
- Tomá decisiones de trading
- Objetivo: NO perder más del 30%
- Si llegás a 0, game over
- +50-300 XP según cuánto lograste mantener

#### 7. **Margin Master** 💰
- Calculadora de posición: tenés $X, riesgo Y%, SL en Z puntos
- Cuánto es el lotaje correcto?
- 10 preguntas
- +10-50 XP

### Estructura de un mini-juego

```
assets/games/
├── price-action-quiz/
│   ├── index.html
│   ├── game.js
│   ├── game.css
│   └── data.json
├── risk-management/
├── memory/
├── patience/
├── pattern-recognition/
├── drawdown/
└── margin-master/
```

### Integración con gamificación

```javascript
// game.js
class MiniGame {
    constructor() {
        this.gameId = window.GAME_ID;
        this.token = window.AUTH_TOKEN;
        this.userId = window.USER_ID;
    }

    async submitScore(score, timeSpent) {
        // POST a /api/games/score
        const response = await fetch('/api/games/score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                game_id: this.gameId,
                score: score,
                time_spent: timeSpent,
            })
        });
        const data = await response.json();
        // Mostrar XP ganado
        return data;
    }
}
```

### Backend

```php
// src/Controller/Api/GameController.php
#[Route('/api/games/score', methods: ['POST'])]
public function submitScore(Request $request): JsonResponse {
    $data = json_decode($request->getContent(), true);

    $score = new GameScore();
    $score->setUser($this->getUser());
    $score->setGameId($data['game_id']);
    $score->setScore($data['score']);
    $score->setTimeSpent($data['time_spent']);
    $this->em->persist($score);

    // Calcular XP según juego y score
    $xpEarned = $this->gameService->calculateXp($data['game_id'], $data['score']);
    $this->gamification->addXp($this->getUser(), $xpEarned);

    // Tracking de evento
    $this->gamification->trackEvent($this->getUser(), 'minigame_completed', [
        'game_id' => $data['game_id'],
        'score' => $data['score'],
    ]);

    return new JsonResponse([
        'xp_earned' => $xpEarned,
        'total_xp' => $this->getUser()->getTotalXp(),
        'new_level' => $this->getUser()->getLevel(),
    ]);
}
```

### Desbloqueo progresivo

| Plan | Mini-juegos disponibles |
|---|---|
| Free | 1 juego (Price Action Quiz) |
| Base | 3 juegos (+ Risk Management, Memory) |
| Pro | 5 juegos (+ Patience, Pattern Recognition) |
| Elite | Todos (7 juegos) |

### UI: Menú de juegos

```
🎮 MINI-JUEGOS

  📊 Price Action Quiz        ✅ Disponible
  ⚖️ Risk Management          ✅ Disponible
  🧠 Trading Memory           ✅ Disponible
  ⏱️ The Patience Game        🔒 Pro
  🔍 Pattern Recognition      🔒 Pro
  📉 The Drawdown Game        🔒 Elite
  💰 Margin Master            🔒 Elite

  Tus estadísticas:
  🏆 Partidas: 47
  ⭐ Récord: 980 (Price Action Quiz)
  💎 XP de juegos: 2,450
```

### Próximos pasos (mini-juegos)

1. Crear estructura de carpetas `assets/games/`
2. Implementar el primer juego: **Price Action Quiz** (HTML/JS puro)
3. Integrar con el sistema de gamificación
4. Testear en la app
5. Iterar con los demás juegos

---

**FIN DEL DOCUMENTO DE GAMIFICACIÓN**

Para ver el plan completo de hosting, ver: `docs/plan-implementacion.md`
Para ver el plan de Play Store, ver: `docs/play-store.md`
