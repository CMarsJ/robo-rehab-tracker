# NeuroLink - Sistema de Terapia de Rehabilitación de Manos

Sistema de terapia para rehabilitación de manos que utiliza datos de sensores para monitorear ángulos de dedos y controlar juegos terapéuticos.

## 🎯 Descripción General

NeuroLink es una aplicación web desarrollada en React + TypeScript que permite realizar terapias de rehabilitación de manos mediante juegos interactivos. Los datos de los ángulos de los dedos se obtienen en tiempo real y se utilizan para controlar diferentes minijuegos terapéuticos.

## 🏗️ Arquitectura del Proyecto

### 📁 Estructura de Directorios

```
src/
├── components/          # Componentes reutilizables de UI
│   ├── ui/             # Componentes de interfaz base (shadcn/ui)
│   ├── games/          # Componentes específicos de juegos
│   └── layout/         # Componentes de layout y navegación
├── contexts/           # Contextos de React para manejo de estado global
├── pages/              # Páginas principales de la aplicación
├── hooks/              # Hooks personalizados
├── lib/                # Utilidades y funciones auxiliares
├── assets/             # Recursos estáticos (imágenes, iconos)
│   └── NeuroLink/      # Imágenes específicas del juego NeuroLink
└── integrations/       # Integraciones con servicios externos
    └── supabase/       # Cliente y tipos de Supabase
```

## 🎮 Componentes de Juegos

### NeuroLinkGame.tsx
**Ubicación:** `src/components/NeuroLinkGame.tsx`
- **Función:** Juego tipo invasores espaciales terapéutico
- **Control:** Disparo automático basado en ángulos de dedos A1+A2+A3
- **Características:**
  - Enemigos con imágenes aleatorias por ronda (`enemigo1.png` a `enemigo4.png`)
  - Sistema de puntuación y ranking
  - Guardado automático en Supabase

### FlappyBirdGame.tsx
**Ubicación:** `src/components/FlappyBirdGame.tsx`
- **Función:** Juego tipo Flappy Bird terapéutico
- **Control:** Altura del ave controlada por suma de ángulos A4+A5+A6
- **Características:**
  - Pilares móviles con espacio configurable
  - Sistema de puntuación y ranking propio
  - Guardado automático en Supabase

### OrangeSqueezeGame.tsx
**Ubicación:** `src/components/OrangeSqueezeGame.tsx`
- **Función:** Juego de exprimir naranjas
- **Control:** Basado en esfuerzo de la mano paretica
- **Características:**
  - Simulación de exprimido de naranjas
  - Medición de esfuerzo en tiempo real

## 📊 Datos de los Ángulos de las Manos

### Origen de los Datos
Los datos de los ángulos se obtienen a través del **SimulationContext**:

**Ubicación:** `src/contexts/SimulationContext.tsx`

### Estructura de Datos de Mano
```typescript
interface HandAngles {
  thumb1: number;   // Ángulo A1 del pulgar
  thumb2: number;   // Ángulo A2 del pulgar  
  thumb3: number;   // Ángulo A3 del pulgar
  finger1: number;  // Ángulo A4 de los dedos
  finger2: number;  // Ángulo A5 de los dedos
  finger3: number;  // Ángulo A6 de los dedos
}

interface HandData {
  angles: HandAngles;
  active: boolean;
  esfuerzo: number;
}
```

### Manos Monitoreadas
- **Mano Izquierda (No Paretica):** `leftHand`
- **Mano Derecha (Paretica):** `rightHand`

### Fuente de Datos
Los datos se pueden obtener de dos formas:
1. **Simulador Manual:** `src/components/DataSimulator.tsx`
2. **Datos Reales:** Integración con sensores externos (configuración pendiente)

## 🎛️ Configuración de Juegos

### GameConfigContext.tsx
**Ubicación:** `src/contexts/GameConfigContext.tsx`
- **Función:** Manejo de configuraciones globales de juegos
- **Parámetros configurables:**
  - `enemySpeed`: Velocidad de enemigos
  - `playerShotSpeed`: Velocidad de disparos
  - `shootingInterval`: Intervalo entre disparos
  - `baseEnemyCount`: Número base de enemigos por ronda
  - `flappyPipeGap`: Espacio entre pilares en Flappy Bird
  - `darkMode`: Modo oscuro/claro
  - `gameStartConfig`: Configuración inicial de juegos

### Página de Configuración
**Ubicación:** `src/pages/Configuration.tsx`
- **Función:** Interfaz para ajustar parámetros de juegos
- **Guardado:** Automático en Supabase por `user_id`

## 🗄️ Base de Datos (Supabase)

### Tablas Principales

#### `game_settings`
- **Función:** Configuraciones personalizadas por usuario
- **Campos principales:**
  - `user_id`: ID del usuario
  - `enemy_speed`: Velocidad de enemigos
  - `player_shot_speed`: Velocidad de disparos
  - `espacio_pilares_flappy`: Espacio entre pilares Flappy Bird
  - `modo_oscuro`: Preferencia de modo oscuro

#### `sessions`
- **Función:** Registro de sesiones de terapia
- **Campos principales:**
  - `user_id`: ID del usuario
  - `duracion_minutos`: Duración de la sesión
  - `tipo_actividad`: Tipo de juego/actividad
  - `estado`: Estado de la sesión

#### `game_records`
- **Función:** Registros de puntuaciones de juegos
- **Campos principales:**
  - `user_id`: ID del usuario
  - `session_id`: ID de la sesión
  - `game_type`: Tipo de juego (`neurolink`, `flappy_bird`, etc.)
  - `total_oranges`: Puntuación total
  - `average_oranges_per_minute`: Puntos por minuto

## 🎨 Recursos Visuales

### Imágenes de Enemigos
**Ubicación:** `src/assets/NeuroLink/`
- `enemigo1.png` - Imagen de enemigo tipo 1
- `enemigo2.png` - Imagen de enemigo tipo 2
- `enemigo3.png` - Imagen de enemigo tipo 3
- `enemigo4.png` - Imagen de enemigo tipo 4
- `player-hand.png` - Imagen de la mano del jugador

**Uso:** Se selecciona aleatoriamente una imagen por ronda en NeuroLink

## 🔄 Flujo de Datos

### 1. Captura de Datos
```
Sensores/Simulador → SimulationContext → Componentes de Juego
```

### 2. Procesamiento en Juegos
```
NeuroLink: A1+A2+A3 → Control de disparo
FlappyBird: A4+A5+A6 → Control de altura
OrangeSqueeze: Esfuerzo → Control de exprimido
```

### 3. Guardado de Resultados
```
Puntuación → Supabase (sessions + game_records)
```

## 🧩 Componentes de UI

### Componentes Base (shadcn/ui)
**Ubicación:** `src/components/ui/`
- Componentes reutilizables de interfaz
- Botones, cartas, diálogos, formularios, etc.

### Componentes Específicos

#### TherapyOverlay.tsx
**Ubicación:** `src/components/TherapyOverlay.tsx`
- **Función:** Overlay que contiene los juegos durante la terapia
- **Características:** Selector de modo de juego, temporizador, controles

#### GameRankings.tsx
**Ubicación:** `src/components/GameRankings.tsx`
- **Función:** Visualización de rankings y estadísticas
- **Datos mostrados:** Puntuación total, puntos por segundo

#### HandMonitoring.tsx
**Ubicación:** `src/components/HandMonitoring.tsx`
- **Función:** Monitoreo en tiempo real de ángulos de manos
- **Visualización:** Estado de manos, ángulos actuales, esfuerzo

## 🔧 Configuración y Contextos

### AuthContext.tsx
**Ubicación:** `src/contexts/AuthContext.tsx`
- **Función:** Manejo de autenticación de usuarios
- **Características:** Login, logout, gestión de sesiones

### ConfigContext.tsx
**Ubicación:** `src/contexts/ConfigContext.tsx`
- **Función:** Configuraciones generales de la aplicación
- **Características:** Idioma, tema, preferencias generales

## 🚀 Instalación y Configuración

### Requisitos
- Node.js 18+
- npm o yarn
- Cuenta de Supabase

### Instalación
```bash
# Clonar el repositorio
git clone <URL_DEL_REPOSITORIO>

# Instalar dependencias
npm install

# Configurar variables de entorno (Supabase)
# Ver src/integrations/supabase/client.ts

# Ejecutar en desarrollo
npm run dev
```

### Configuración de Supabase
1. Crear proyecto en Supabase
2. Ejecutar migraciones SQL desde `supabase/migrations/`
3. Configurar autenticación
4. Actualizar credenciales en `client.ts`

## 📱 Páginas Principales

### Index.tsx
**Ubicación:** `src/pages/Index.tsx`
- **Función:** Página principal con dashboard de terapia

### Reports.tsx
**Ubicación:** `src/pages/Reports.tsx`
- **Función:** Reportes y análisis de progreso

### History.tsx
**Ubicación:** `src/pages/History.tsx`
- **Función:** Historial de sesiones y actividades

### Configuration.tsx
**Ubicación:** `src/pages/Configuration.tsx`
- **Función:** Configuración de parámetros de juegos y usuario

### Auth.tsx
**Ubicación:** `src/pages/Auth.tsx`
- **Función:** Autenticación (login/registro)

## 🎯 Funcionalidades Clave

### Sistema de Ranking
- **NeuroLink:** Puntuación total y puntos por segundo
- **Flappy Bird:** Puntuación total y puntos por segundo
- **Guardado automático** en Supabase al finalizar partidas

### Personalización
- **Configuraciones por usuario** guardadas en base de datos
- **Modo oscuro/claro** persistente
- **Parámetros de juego ajustables** desde configuración

### Monitoreo en Tiempo Real
- **Visualización de ángulos** de ambas manos
- **Estado de actividad** de cada mano
- **Medición de esfuerzo** en tiempo real

## 🔄 Estados y Persistencia

### LocalStorage
- Datos de simulación temporal
- Historial de esfuerzo
- Preferencias de UI temporales

### Supabase
- Configuraciones de usuario
- Sesiones de terapia
- Puntuaciones y rankings
- Datos de autenticación

## 🎮 Controles de Juego

### NeuroLink (Invasores)
- **Disparo:** Suma A1+A2+A3 > umbral configurado
- **Enemigos:** Imágenes aleatorias por ronda
- **Puntuación:** Por enemigos destruidos

### Flappy Bird
- **Altura:** Suma A4+A5+A6 (0-200 grados)
- **Obstáculos:** Pilares con espacio configurable
- **Puntuación:** Por pilares superados

### Orange Squeeze
- **Exprimido:** Basado en esfuerzo de mano paretica
- **Objetivo:** Llenar vasos con jugo de naranja

Este README proporciona una guía completa de la estructura y funcionamiento del sistema NeuroLink para terapia de rehabilitación de manos.