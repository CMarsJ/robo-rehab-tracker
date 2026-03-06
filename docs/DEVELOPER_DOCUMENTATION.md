
# Therapy Rehab System - Developer Documentation

## Overview
Sistema integral de rehabilitación robótica bilateral post-ACV construido con React, TypeScript, Tailwind CSS y Supabase. Proporciona monitoreo en tiempo real de manos mediante sensores IMU vía BLE, gestión de sesiones de terapia, rehabilitación gamificada e informes clínicos automatizados.

## Architecture

### Technology Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, RLS, PostgREST)
- **State Management**: React Context API (AppContext, SimulationContext, GameConfigContext, AuthContext, ConfigContext)
- **Routing**: React Router v6
- **UI Components**: shadcn/ui (Radix-based)
- **Charts**: Recharts
- **Icons**: Lucide React
- **BLE Communication**: Web Bluetooth API

### System Architecture

```
ESP32_IMU_BLE (Hardware)
    │
    ├── DATA Characteristic (Notify) ──→ BLEService
    ├── CONTROL Characteristic (Write) ←── BLEService
    └── EMERGENCY Characteristic (R+N) ↔── BLEService
                                              │
                                              ▼
                                    SimulationContext
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    ▼                         ▼                         ▼
            HandMonitoring            TherapyOverlay              Games
            (Real-time vis.)     (Timer + Rest system)    (Orange/Flappy/Neuro)
                    │                         │                         │
                    └─────────────────────────┼─────────────────────────┘
                                              ▼
                                    Supabase (sessions table)
                                              │
                              ┌───────────────┼───────────────┐
                              ▼               ▼               ▼
                          Rankings        Reports          History
```

### Database Schema

```sql
-- Core Tables (actual schema)
auth.users (Supabase managed)
├── profiles (user_id)         -- Display name, age, therapist, avatar
├── sessions (user_id)         -- All therapy sessions with stats JSON
├── game_settings (user_id)    -- Per-user game configuration
├── rankings_orabge_squeeze    -- Top 10 Orange Squeeze leaderboard
├── rankings_flappy_bird       -- Top 5 Flappy Bird leaderboard
└── rankings_neurolink         -- Top 5 NeuroLink leaderboard
```

### Key Tables

#### sessions
```sql
CREATE TABLE public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  therapy_type text NOT NULL,          -- 'terapia_guiada', 'orange-squeeze', 'flappy-bird', 'neurolink'
  duration integer NOT NULL,           -- milliseconds
  state text DEFAULT 'completed',      -- 'completed', 'cancelled'
  score integer,                       -- game score (nullable)
  start_time timestamp DEFAULT now(),
  stats jsonb,                         -- hand_metrics, game_metrics
  details jsonb,
  extra_date jsonb,
  orange_used integer,
  juice_used integer
);
```

#### profiles
```sql
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  display_name text,
  patient_age integer,
  therapist_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### game_settings
```sql
CREATE TABLE public.game_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  enemy_speed integer DEFAULT 3,
  numero_base_enemigos integer DEFAULT 6,
  intervalo_disparo_ms integer DEFAULT 1000,
  player_shot_speed integer DEFAULT 3,
  espacio_pilares_flappy integer DEFAULT 120,
  modo_oscuro boolean DEFAULT false,
  configuracion_inicio jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### Row Level Security (RLS) Policies

All tables implement user-scoped RLS:
- Users can only SELECT/INSERT/UPDATE their own data (`auth.uid() = user_id`)
- Rankings tables allow public reads for leaderboards
- No DELETE policies on `sessions`, `profiles`, or `game_settings`

### Database Functions

| Function | Purpose |
|---|---|
| `rebuild_rankings_force_positions()` | Recalculates top 10 Orange Squeeze rankings |
| `rebuild_rankings_flappy_bird()` | Recalculates top 5 Flappy Bird rankings |
| `rebuild_rankings_neurolink()` | Recalculates top 5 NeuroLink rankings |
| `handle_new_user()` | Auto-creates profile on user signup (SECURITY DEFINER) |
| `update_updated_at_column()` | Trigger function for updated_at timestamps |

---

## BLE Communication Layer

### Service: `src/services/bleService.ts`

Singleton class `BLEService` managing all BLE interactions:

```typescript
import { bleService } from '@/services/bleService';

// Connect to device
await bleService.connect();

// Subscribe to data
bleService.onData((data: BLEMessage) => { /* process */ });
bleService.onStatus((status: BLEStatus, msg?) => { /* UI update */ });
bleService.onEmergency((isEmergency: boolean) => { /* handle */ });

// Send commands
await bleService.startTherapy();  // sends "start"
await bleService.stopTherapy();   // sends "stop"
await bleService.sendEmergency(); // sends "emergency"

// Disconnect
bleService.disconnect();
```

### BLE UUIDs

| Characteristic | UUID | Mode |
|---|---|---|
| Service | `12345678-1234-1234-1234-123456789abc` | — |
| DATA | `12345678-1234-1234-1234-123456789ab1` | Notify |
| CONTROL | `12345678-1234-1234-1234-123456789ab2` | Write |
| EMERGENCY | `12345678-1234-1234-1234-123456789ab3` | Read + Notify |

### Angular Processing

Raw MCP angles are expanded client-side:
- Thumb IP = `1.25 × MCP_thumb`
- Finger PIP = `0.8 × MCP_finger`
- Finger DIP = `0.66 × PIP`
- Effort normalized: `min(100, max(0, raw × 100))`

---

## Key Components

### Therapy System
- **`TherapyTimer`** — Session timer with BLE sync (start/stop commands)
- **`TherapyOverlay`** — Full therapy UI with dual-hand tracking tables, automatic rest system, and session data persistence
- **`HandMonitoring`** — Real-time hand angle visualization
- **`BLEStatusButton`** — BLE connection status and control
- **`BLEConfig`** — BLE configuration panel

### Dashboard
- **`HandVisualization`** — Visual hand model
- **`EffortAnalysis`** — Effort charts and analytics
- **`AchievementsProgress`** — Achievement tracking
- **`TherapyTimer` (Dashboard)** — Dashboard timer variant

### Games
- **`OrangeSqueezeGame`** — Hand strength training (squeeze oranges)
- **`FlappyBirdGame`** — Motor control (navigate pipes)
- **`NeuroLinkGame`** — Coordination (shoot enemies)

### Reports
- **`RehabReport`** — Clinical 7-section report component
- **`WeeklyReport`** — Weekly period wrapper
- **`MonthlyReport`** — Monthly period wrapper

### Data & Configuration
- **`GameRankings`** — Unified leaderboards for all games
- **`ProgressTracker`** — Session history and daily progress
- **`DataSimulator`** — Development/testing data simulation
- **`ConfigAuth`** — Profile and authentication settings

---

## Context Providers

### AppContext (`src/contexts/AppContext.tsx`)
- Language/translation management
- Global app state

### SimulationContext (`src/contexts/SimulationContext.tsx`)
- Hand data state (angles, effort, active status)
- Therapy active state
- BLE data integration

### GameConfigContext (`src/contexts/GameConfigContext.tsx`)
- Game parameters (enemy speed, shot intervals, pipe spacing)
- Rest configuration (repetitions, levels, duration)
- Supabase persistence of settings

### AuthContext (`src/contexts/AuthContext.tsx`)
- Supabase Auth integration
- User session management

### ConfigContext (`src/contexts/ConfigContext.tsx`)
- Application configuration state

---

## Services

### `src/services/bleService.ts`
BLE device communication (see BLE section above).

### `src/services/dataService.ts`
Centralized database operations for sessions, rankings, and game data.

### `src/services/sessionService.ts`
Session-specific data operations.

### `src/services/reportService.ts`
Clinical report generation with 7-section model:
1. **Resumen** — Period summary with mini-calendar adherence visualization
2. **Tendencias** — Therapy type distribution (pie chart) + volume per hand
3. **Indicadores** — Average opening/closing times with automated interpretation
4. **Mejor Desempeño** — Best recorded times with dates
5. **Cancelaciones** — Cancellation distribution analysis
6. **Rendimiento** — Global performance index per hand
7. **Conclusión** — Dynamically generated clinical summary

---

## Pages

| Route | Page | Description |
|---|---|---|
| `/` | `Index` | Main monitoring page with hand visualization, timer, progress |
| `/auth` | `Auth` | Login/signup |
| `/dashboard` | `Dashboard` | Overview dashboard |
| `/configuracion` | `Configuracion` | Settings (game params, rest config, profile) |
| `/historial` | `Historial` | Session history |
| `/reportes` | `Reportes` | Weekly/monthly clinical reports |
| `*` | `NotFound` | 404 page |

---

## Environment Variables

```env
VITE_SUPABASE_PROJECT_ID="raxkyfrhigkfaimrayzw"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJ..."
VITE_SUPABASE_URL="https://raxkyfrhigkfaimrayzw.supabase.co"
```

---

## Hand Data Flow

```
1. ESP32 IMU sensors → BLE DATA characteristic (JSON)
2. BLEService.handleDataNotification() → decode + parse
3. BLEService.calculateAngles() → derive PIP, DIP, IP angles
4. onDataCallback → SimulationContext state update
5. React re-render → HandMonitoring, TherapyOverlay, Games
6. Session end → stats JSON saved to Supabase sessions table
7. Rankings auto-recalculated via PostgreSQL functions
```

---

## Automatic Rest System

The `TherapyOverlay` component implements automatic rest periods:

- **Trigger conditions**: Configured number of repetitions (open/close cycles) or game levels (rounds)
- **Behavior**: Blocks UI with `pointer-events-none`, shows countdown overlay, pauses therapy timer
- **Configuration**: Stored in `GameConfigContext` with localStorage + Supabase persistence
- **Parameters**: `restRepetitions`, `restLevels`, `restDuration` (seconds)

---

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## Related Documentation

- **[Technical Report](./INFORME_TECNICO_SISTEMA.md)** — Complete technical report describing the system architecture, communication protocols, data processing, and user interactions (suitable for thesis/engineering documentation).
