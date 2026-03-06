# Informe Técnico: Sistema de Software para Monitoreo y Rehabilitación Robótica Bilateral Post-ACV

*Generado a partir del análisis del código fuente y la configuración de base de datos del sistema.*

---

## 1. Arquitectura del Sistema Software

El sistema se compone de los siguientes módulos principales:

| Componente | Tecnología | Función |
|---|---|---|
| **Dispositivo de adquisición** | ESP32 con sensores IMU | Captura datos angulares (MCP) y esfuerzo de ambas manos |
| **Módulo de comunicación** | Bluetooth Low Energy (BLE) vía Web Bluetooth API | Transmisión inalámbrica dispositivo → navegador |
| **Interfaz gráfica (Frontend)** | React 18 + TypeScript + Vite + Tailwind CSS | Visualización en tiempo real, control de sesiones y gamificación |
| **Backend / Base de datos** | Supabase (PostgreSQL + PostgREST) | Persistencia de sesiones, perfiles, rankings y configuración |

### Flujo general de datos

```
ESP32_IMU_BLE → [BLE Notify] → Navegador (Web Bluetooth API)
    → BLEService (procesamiento client-side)
    → Contextos React (SimulationContext, AppContext)
    → Componentes de visualización
    → Supabase (persistencia vía HTTPS/REST)
```

No existe un servidor backend intermedio; la comunicación entre el frontend y la base de datos se realiza directamente mediante el cliente `@supabase/supabase-js` a través de la API REST de PostgREST. La autenticación se gestiona con Supabase Auth, con persistencia de sesión en `localStorage`.

---

## 2. Comunicación y Transmisión de Datos

### 2.1 Tipo de comunicación

- **Protocolo:** Bluetooth Low Energy (BLE) mediante la Web Bluetooth API del navegador.
- **Dispositivo:** Identificado como `ESP32_IMU_BLE`.

### 2.2 UUIDs del servicio BLE

| Característica | UUID | Modo |
|---|---|---|
| Servicio principal | `12345678-1234-1234-1234-123456789abc` | — |
| DATA (sensores) | `12345678-1234-1234-1234-123456789ab1` | Notify |
| CONTROL (comandos) | `12345678-1234-1234-1234-123456789ab2` | Write |
| EMERGENCY (emergencia) | `12345678-1234-1234-1234-123456789ab3` | Read + Notify |

### 2.3 Estructura del paquete de datos (DATA characteristic)

El dispositivo transmite un JSON codificado en UTF-8 con la siguiente estructura:

```json
{
  "leftHand": {
    "active": true,
    "mcp_finger": 45.0,
    "mcp_thumb": 30.0,
    "effort": 0.65
  },
  "rightHand": {
    "active": true,
    "mcp_finger": 50.0,
    "mcp_thumb": 35.0,
    "effort": 0.72
  }
}
```

### 2.4 Variables transmitidas

| Variable | Tipo | Rango | Descripción |
|---|---|---|---|
| `active` | boolean | true/false | Indica si la mano está activa en la sesión |
| `mcp_finger` | number | 0–90° | Ángulo MCP de los dedos (índice a meñique) |
| `mcp_thumb` | number | 0–90° | Ángulo MCP del pulgar |
| `effort` | number | 0.0–1.0 | Nivel de esfuerzo normalizado |

### 2.5 Comandos enviados al dispositivo (CONTROL characteristic)

| Comando | Acción |
|---|---|
| `"start"` | Inicia la adquisición de datos en el ESP32 |
| `"stop"` | Detiene la adquisición |
| `"emergency"` | Activación de parada de emergencia |

### 2.6 Frecuencia de actualización

La frecuencia de envío depende de la configuración del firmware del ESP32. El sistema implementa un *timeout* de **60 segundos** (`dataTimeoutMs = 60000`) para detectar pérdida de datos. *La frecuencia exacta de muestreo del firmware no está disponible en los datos analizados.*

### 2.7 Mecanismo de conexión

1. El usuario inicia la conexión desde la interfaz.
2. El navegador presenta un diálogo de selección de dispositivo BLE filtrado por nombre (`ESP32_IMU_BLE`).
3. Se establece conexión GATT y se suscriben las tres características.
4. Se registra un listener de desconexión automática (`gattserverdisconnected`).

---

## 3. Recepción y Procesamiento de Datos

### 3.1 Recepción

Los datos se reciben como notificaciones BLE en la característica DATA. El servicio `BLEService` (clase singleton en `src/services/bleService.ts`) decodifica el buffer mediante `TextDecoder` y parsea el JSON resultante.

### 3.2 Procesamiento angular (client-side)

A partir de los ángulos MCP recibidos, el sistema calcula ángulos derivados para cada mano utilizando relaciones biomecánicas simplificadas:

| Articulación | Fórmula | Descripción |
|---|---|---|
| **Pulgar MCP** | Dato directo (`mcp_thumb`) | Metacarpofalángica del pulgar |
| **Pulgar IP** | `1.25 × MCP_thumb` | Interfalángica del pulgar |
| **Dedo MCP** | Dato directo (`mcp_finger`) | Metacarpofalángica de dedos |
| **Dedo PIP** | `0.8 × MCP_finger` | Interfalángica proximal |
| **Dedo DIP** | `0.66 × PIP` (= `0.528 × MCP_finger`) | Interfalángica distal |

El esfuerzo se normaliza al rango 0–100 mediante: `effort = min(100, max(0, rawEffort × 100))`.

Todos los valores numéricos se redondean a 4 decimales.

### 3.3 Estructura de datos procesados

```typescript
interface BLEMessage {
  leftHand: {
    active: boolean;
    angles: {
      thumb1: number; // MCP pulgar
      thumb2: number; // IP pulgar
      thumb3: number; // No utilizado (0)
      finger1: number; // MCP dedo
      finger2: number; // PIP dedo
      finger3: number; // DIP dedo
    };
    effort: number; // 0-100
  };
  rightHand: { /* misma estructura */ };
  timestamp: string; // ISO 8601
}
```

### 3.4 Persistencia

Las sesiones completadas se almacenan en la tabla `sessions` de Supabase con la siguiente información:

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | Identificador único de la sesión |
| `user_id` | uuid | Referencia al usuario autenticado |
| `therapy_type` | text | Modalidad: `terapia_guiada`, `orange-squeeze`, `flappy-bird`, `neurolink` |
| `duration` | integer | Duración en milisegundos |
| `score` | integer | Puntuación (para juegos) |
| `state` | text | Estado: `completed`, `cancelled` |
| `stats` | jsonb | JSON con métricas detalladas (`hand_metrics`, `game_metrics`) |
| `start_time` | timestamp | Marca temporal de inicio |
| `orange_used` | integer | Naranjas utilizadas (Orange Squeeze) |
| `juice_used` | integer | Vasos de jugo producidos (Orange Squeeze) |
| `details` | jsonb | Detalles adicionales de la sesión |
| `extra_date` | jsonb | Datos complementarios |

---

## 4. Visualización en Tiempo Real

### 4.1 Componentes de visualización principal

| Componente | Archivo | Función |
|---|---|---|
| **HandMonitoring** | `src/components/HandMonitoring.tsx` | Representación visual de ambas manos con ángulos articulares en tiempo real |
| **TherapyTimer** | `src/components/TherapyTimer.tsx` | Temporizador de sesión con controles de inicio/pausa/detención |
| **ProgressTracker** | `src/components/ProgressTracker.tsx` | Seguimiento de progreso diario |
| **EffortAnalysis** | `src/components/Dashboard/EffortAnalysis.tsx` | Análisis gráfico del nivel de esfuerzo |
| **HandVisualization** | `src/components/Dashboard/HandVisualization.tsx` | Modelo visual de las manos en el panel de control |
| **TherapyOverlay** | `src/components/TherapyOverlay.tsx` | Overlay de terapia con tablas de intentos por mano y sistema de descanso automático |

### 4.2 Actualización de datos

La interfaz se actualiza en tiempo real mediante el patrón de suscripción a notificaciones BLE. Cada notificación recibida dispara un callback que actualiza los estados de React (vía contextos `SimulationContext` y `AppContext`), propagando los cambios a todos los componentes suscritos.

### 4.3 Modalidades de gamificación

El sistema incluye tres juegos terapéuticos controlados por los movimientos de la mano:

| Juego | Archivo | Mecánica | Métrica principal |
|---|---|---|---|
| **Orange Squeeze** | `OrangeSqueezeGame.tsx` | Simulación de exprimir naranjas mediante apertura/cierre | Naranjas exprimidas, tiempo por naranja |
| **Flappy Bird** | `FlappyBirdGame.tsx` | Control de altura del personaje mediante movimiento de dedos | Puntuación, puntos por minuto |
| **NeuroLink** | `NeuroLinkGame.tsx` | Juego de disparos controlado por gestos de la mano | Puntuación, puntos por segundo |

### 4.4 Sistema de rankings

Se mantienen tablas de clasificación independientes que se recalculan automáticamente mediante funciones PostgreSQL:

| Tabla | Función de recálculo | Capacidad |
|---|---|---|
| `rankings_orabge_squeeze` | `rebuild_rankings_force_positions()` | Top 10 |
| `rankings_flappy_bird` | `rebuild_rankings_flappy_bird()` | Top 5 |
| `rankings_neurolink` | `rebuild_rankings_neurolink()` | Top 5 |

### 4.5 Sistema de reportes clínicos

Los reportes siguen un modelo clínico de 7 secciones:

1. **Resumen del Período** — Mini-calendario de adherencia diaria con indicadores ✓/✗
2. **Tendencias en los Tipos de Terapia** — Diagrama de tortas con porcentajes por modalidad + tabla de volumen por mano
3. **Indicadores Temporales Promedio** — Tiempos promedio de apertura/cierre por mano con interpretación automática
4. **Mejor Desempeño del Período** — Mejores tiempos registrados con fecha
5. **Análisis de Sesiones Canceladas** — Distribución temporal de cancelaciones
6. **Índice Global de Rendimiento** — Índice comparativo entre manos
7. **Conclusión Automática** — Texto generado dinámicamente con reglas condicionales

---

## 5. Interacción Usuario–Sistema

### 5.1 Acciones disponibles para el usuario

| Acción | Descripción |
|---|---|
| **Autenticación** | Registro e inicio de sesión mediante Supabase Auth |
| **Conexión BLE** | Solicitar conexión con el dispositivo ESP32 desde la interfaz |
| **Iniciar/pausar/detener sesión** | Control del temporizador de terapia, sincronizado con el dispositivo |
| **Parada de emergencia** | Activación de estado de emergencia que detiene inmediatamente la adquisición |
| **Seleccionar modalidad terapéutica** | Elegir entre terapia guiada o uno de los tres juegos |
| **Configurar parámetros de juego** | Ajustar velocidad de enemigos, intervalo de disparo, espacio entre pilares, etc. |
| **Configurar parámetros de descanso** | Definir repeticiones, niveles y duración de descanso automático |
| **Visualizar sesión en tiempo real** | Monitorear ángulos, esfuerzo y progreso durante la terapia |
| **Consultar historial** | Revisar sesiones anteriores con filtros temporales |
| **Generar reportes** | Informes clínicos semanales o mensuales con 7 secciones |
| **Consultar rankings** | Ver tabla de clasificación de los juegos terapéuticos |
| **Personalizar perfil** | Editar nombre, edad del paciente, nombre del terapeuta y avatar |

### 5.2 Flujo de una sesión típica

1. El usuario inicia sesión en la plataforma.
2. Conecta el dispositivo BLE desde la interfaz.
3. Selecciona la modalidad terapéutica.
4. Inicia la sesión; el sistema envía `"start"` al ESP32.
5. Los datos se visualizan en tiempo real durante la sesión.
6. Al finalizar (manual o por tiempo), se envía `"stop"` y los datos se persisten en Supabase.
7. Los rankings se recalculan automáticamente si aplica.

### 5.3 Sistema de descanso automático

El sistema implementa pausas automáticas durante la terapia basadas en tres parámetros configurables:

| Parámetro | Descripción |
|---|---|
| **Repeticiones** | Número de ciclos apertura/cierre antes del descanso |
| **Niveles** | Número de rondas de juego antes del descanso |
| **Duración** | Tiempo de descanso en segundos |

Durante el descanso, la interfaz se bloquea (`pointer-events-none`) y se muestra una cuenta regresiva visual. El temporizador de terapia se pausa automáticamente.

---

## 6. Elementos No Disponibles en los Datos Analizados

Los siguientes aspectos no se encuentran documentados en la información disponible:

- Frecuencia exacta de muestreo del firmware del ESP32.
- Modelo y especificaciones del sensor IMU utilizado.
- Algoritmo de fusión sensorial implementado en el firmware.
- Latencia de la comunicación BLE entre dispositivo y navegador.
- Mecanismo de calibración del dispositivo.
- Protocolo de cifrado de la comunicación BLE.
- Características del hardware mecánico del guante/exoesqueleto.

---

*Toda la información presentada corresponde exclusivamente a los componentes verificables en el repositorio del proyecto.*
