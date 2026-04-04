# Rediseño Página Principal: Circular Slider + Therapy Hub + i18n

## Resumen

Implementar el Therapy Hub con layout de 2 columnas (imagen izquierda, circular slider derecho), eliminar los botones pill de tiempo, agregar un circular slider SVG interactivo (drag), quitar el botón "30 min" lateral, usar solo el chip de meta diaria como acceso rápido, y traducir todos los textos hardcodeados a los 4 idiomas (es/en/pt/ru). Ajustar paleta para coherencia con colores pasteles.

---

## Cambios por archivo

### 1. Mover asset de imagen

- Copiar `lateraltemporizadorr.png` de la raíz a `src/assets/lateraltemporizadorr.png` para importarlo como módulo.

### 2. `src/contexts/AppContext.tsx` — Nuevas claves de traducción

Agregar a los 4 idiomas las claves faltantes para la página principal:

- `greeting` → "¡Hola," / "Hello," / "Olá," / "Привет,"
- `greetingJoy` → "Qué alegría verte hoy." / "Great to see you today." / "Que alegria ver você hoje." / "Рады видеть вас сегодня."
- `dailyGoalText` → "Tu meta de hoy:" / "Your goal today:" / "Sua meta de hoje:" / "Ваша цель на сегодня:"
- `minutesToKeepProgress` → "minutos para mantener tu progreso." / "minutes to keep your progress." / "minutos para manter seu progresso." / "минут для поддержания прогресса."
- `therapyHub` → "Centro de Terapia" / "Therapy Hub" / "Centro de Terapia" / "Центр Терапии"
- `therapyHubHint` → "Coloca el guante y el exoesqueleto antes de empezar." / "Put on the glove and exoskeleton before starting." / "Coloque a luva e o exoesqueleto antes de começar." / "Наденьте перчатку и экзоскелет перед началом."
- `startSessionBtn` → "COMENZAR SESIÓN" / "START SESSION" / "INICIAR SESSÃO" / "НАЧАТЬ СЕССИЮ"
- `suggestedDuration` → "Duración sugerida" / "Suggested duration" / "Duração sugerida" / "Рекомендуемая продолжительность"
- `paused` → "Pausado" / "Paused" / "Pausado" / "Пауза"
- `yourAchievements` → "Tus Avances y Logros" / "Your Achievements" / "Seus Avanços e Conquistas" / "Ваши Достижения"
- `realTimeVisualization` → "Visualización en Tiempo Real del Sistema" / "Real-Time System Visualization" / "Visualização em Tempo Real do Sistema" / "Визуализация системы в реальном времени"
- `recommended` → "(recomendado)" / "(recommended)" / "(recomendado)" / "(рекомендовано)"

### 3. `src/components/TherapyTimer.tsx` — Circular Slider + Layout 2 columnas

**Eliminar**: Los botones pill de tiempos `[5, 10, 15, 20, 30, 45, 60]` (líneas 322-339).

**Layout de 2 columnas** dentro de la Card:

- Grid: `grid-cols-1 md:grid-cols-2` con gap.
- **Columna izquierda**: Imagen `lateraltemporizadorr.png` importada, centrada, `max-w-[220px]`, con bordes redondeados.
- **Columna derecha**: Circular slider + botón meta + CTA.

**Circular Slider SVG interactivo**:

- SVG de ~160x160px con `viewBox="0 0 200 200"`, centro en (100,100), radio 80.
- **Track**: Círculo completo, `stroke: #f3f4f6` (o `hsl(var(--muted))`), `strokeWidth: 12`.
- **Progress arc**: Arco parcial verde esmeralda `#2ecc71` (o `hsl(var(--accent))`), `strokeWidth: 12`, `strokeLinecap: round`.
- **Handle/knob**: Círculo blanco r=10 con borde verde, posicionado al final del arco.
- **Centro**: Tiempo `MM:00` en `text-3xl font-extrabold`, subtexto "Duración sugerida" traducido.
- **Interacción**: `onMouseDown`/`onTouchStart` en el SVG → `onMouseMove`/`onTouchMove` en `window` → calcula ángulo con `Math.atan2(dy, dx)`, convierte a rango 5-60 (pasos de 5). `onMouseUp`/`onTouchEnd` detiene el drag.
- Rango: 5 a 60 min, pasos de 5 min.
- Deshabilitado cuando `isActive`.

**Botón de meta rápida** (al lado o debajo del dial):

- Solo un chip/badge que muestra `{dailyGoal} min (recomendado)`. Al hacer clic, setea `duration` al `dailyGoal`.
- **Sin** botón de "30 min" adicional.

**CTA**: Botón verde grande "COMENZAR SESIÓN" traducido con `t.startSessionBtn`.

**Hint**: Texto traducido con `t.therapyHubHint`.

### 4. `src/pages/Index.tsx` — Bienvenida + estructura traducida

- Reemplazar textos hardcodeados con claves de traducción:
  - `¡Hola, {firstName}! 👋` → `{t.greeting} {firstName}!` (sin emoji, alineado a izquierda).
  - Subtextos con `t.greetingJoy`, `t.dailyGoalText`, `t.minutesToKeepProgress`.
  - Títulos de secciones con `t.therapyHub`, `t.yourAchievements`, `t.realTimeVisualization`.
- Alinear el saludo a la izquierda (`text-left`).
- La Card del Therapy Hub: fondo pastel suave `bg-gradient-to-br from-[#e8f5e9] to-[#f1f8e9]` en light, adaptado en dark.

### 5. `src/index.css` — Ajuste de accent color

Cambiar `--accent` (actualmente `160 84% 39%`) a un verde esmeralda más vibrante tipo `#2ecc71` → `145 63% 49%` para que el circular slider y el botón CTA sean coherentes con la paleta pastel sin perder profesionalismo. Ajustar también la versión dark.

### 6.  Resto del la pagina principal

Dejas todo logros y lo que sigue como se encuentra acualmente, a lo mucho ajustar colores.

---

## Paleta de colores final


| Token            | Light                                 | Dark                                   |
| ---------------- | ------------------------------------- | -------------------------------------- |
| `--primary`      | `199 89% 48%` (turquesa, sin cambio)  | `199 89% 53%`                          |
| `--accent`       | `145 63% 49%` (verde esmeralda)       | `145 63% 55%`                          |
| `--background`   | `210 20% 98%` (off-white, sin cambio) | sin cambio                             |
| Therapy Hub card | `#e8f5e9` → `#f1f8e9` gradient        | `hsl(145 20% 12%)` → `hsl(145 15% 8%)` |
| Slider track     | `hsl(var(--muted))`                   | `hsl(var(--muted))`                    |
| Slider progress  | `hsl(var(--accent))`                  | `hsl(var(--accent))`                   |
