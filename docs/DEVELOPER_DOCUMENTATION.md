
# Therapy Rehab System - Developer Documentation

## Overview
This is a comprehensive therapy rehabilitation system built with React, TypeScript, Tailwind CSS, and Supabase. The system provides therapy session management, game-based rehabilitation, progress tracking, and data analytics.

## Architecture

### Technology Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **State Management**: React Context API
- **Routing**: React Router v6
- **UI Components**: shadcn/ui (Radix-based)
- **Charts**: Recharts
- **Icons**: Lucide React

### Database Schema (ERD)

```sql
-- Core Tables
auth.users (Supabase managed)
├── profiles (user_id FK)
├── sessions (user_id FK)
├── therapy_records (user_id FK, session_id FK)
├── game_records (user_id FK, session_id FK)
├── rankings (user_id FK)
└── game_settings (user_id FK)
```

### Key Tables

#### sessions
```sql
CREATE TABLE public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  fecha_inicio timestamp with time zone DEFAULT now() NOT NULL,
  duracion_minutos integer NOT NULL,
  tipo_actividad text NOT NULL,
  estado text DEFAULT 'completed' NOT NULL,
  metrics jsonb DEFAULT '{}',
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
```

#### therapy_records
```sql
CREATE TABLE public.therapy_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  best_open_time numeric,
  best_close_time numeric,
  avg_open_time numeric,
  avg_close_time numeric,
  open_times numeric[],
  close_times numeric[],
  attempts_count integer,
  effort_data jsonb DEFAULT '[]',
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
```

#### game_records
```sql
CREATE TABLE public.game_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  game_type text NOT NULL,
  total_oranges integer DEFAULT 0,
  total_glasses integer DEFAULT 0,
  average_oranges_per_minute numeric DEFAULT 0,
  best_open_time numeric,
  best_close_time numeric,
  avg_open_time numeric,
  avg_close_time numeric,
  open_times numeric[],
  close_times numeric[],
  attempts_count integer,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
```

#### rankings
```sql
CREATE TABLE public.rankings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_type text NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  score numeric NOT NULL,
  details jsonb DEFAULT '{}',
  position integer,
  calculated_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
```

### Performance Indexes
```sql
-- Key indexes for performance
CREATE INDEX idx_game_records_user_game_created ON game_records(user_id, game_type, created_at DESC);
CREATE INDEX idx_sessions_user_created ON sessions(user_id, created_at DESC);
CREATE INDEX idx_therapy_records_user_session ON therapy_records(user_id, session_id, created_at DESC);
CREATE INDEX idx_rankings_game_score ON rankings(game_type, score DESC, calculated_at DESC);
CREATE INDEX idx_rankings_user_game ON rankings(user_id, game_type, score DESC);
```

### Row Level Security (RLS) Policies

All tables implement user-scoped RLS policies:
- Users can only access their own data (user_id = auth.uid())
- Rankings table allows public reads for leaderboards
- All other operations require authentication

Example policy:
```sql
CREATE POLICY "Users can view their own sessions" 
ON sessions FOR SELECT 
USING (auth.uid() = user_id);
```

## Data Access Layer

### DataService (`src/services/dataService.ts`)
Centralized service for all database operations:

```typescript
// Session management
DataService.createSession(tipo_actividad, duracion_minutos, metrics?)
DataService.updateSession(sessionId, updates)
DataService.getUserSessions(limit)

// Therapy records
DataService.createTherapyRecord(sessionId, effortData, metrics?)

// Game records
DataService.createGameRecord(sessionId, gameType, gameData)
DataService.getGameRecords(gameType?, limit)

// Rankings
DataService.updateRanking(gameType, score, details?)
DataService.getRankings(gameType, limit)

// Migration
DataService.migrateLocalStorageData()
```

### Custom Hooks

#### useGameData (`src/hooks/useGameData.ts`)
```typescript
const { gameRecords, rankings, loading, createGameRecord, refreshData } = useGameData('game_type');
```

## Key Components

### Therapy System
- `TherapyTimer`: Session management with Supabase integration
- `HandMonitoring`: Real-time hand data visualization  
- `EffortAnalysis`: Analytics and progress tracking

### Games
- `OrangeSqueezeGame`: Hand strength training
- `NeuroLinkGame`: Coordination and reaction training
- `FlappyBirdGame`: Motor control training

### Data Management
- `GameRankings`: Leaderboards with both legacy and new data
- `ProgressTracker`: Session history and analytics
- `DataSimulator`: Development/testing data simulation

## Environment Variables

```env
VITE_SUPABASE_PROJECT_ID="raxkyfrhigkfaimrayzw"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJ..."
VITE_SUPABASE_URL="https://raxkyfrhigkfaimrayzw.supabase.co"
```

## Data Migration Strategy

### LocalStorage to Supabase Migration
The system includes automatic migration on first run:

1. Check migration flag: `localStorage.getItem('supabase_migration_completed')`
2. Migrate orange rankings to Supabase rankings table
3. Set migration completed flag
4. Preserve legacy data for backward compatibility

### Data Shapes Preserved

**Legacy Orange Rankings:**
```typescript
{
  date: string,
  glasses: number,
  totalOranges: number,
  timePerGlass: number,
  timePerOrange: number,
  totalTime: number
}
```

**New Ranking Format:**
```typescript
{
  game_type: 'orange_squeeze',
  score: totalOranges,
  details: { glasses, timePerGlass, timePerOrange, totalTime, date }
}
```

## Hand Data Configuration

Hand data is configured in `src/contexts/SimulationContext.tsx`:

```typescript
interface HandData {
  active: boolean;
  angles: {
    thumb1: number; thumb2: number; thumb3: number;
    finger1: number; finger2: number; finger3: number;
  };
  effort: number;
}
```

Data flows:
1. **Input**: `DataSimulator` → `SimulationContext`
2. **Processing**: `SimulationContext` → localStorage + state
3. **Visualization**: `HandMonitoring` component
4. **Games**: `OrangeSqueezeGame`, `FlappyBirdGame` consume data
5. **Analytics**: `EffortAnalysis` processes for charts

## Local Development Setup

1. **Clone and install:**
```bash
git clone <repository>
cd therapy-rehab-system
npm install
```

2. **Environment setup:**
```bash
cp .env.example .env
# Configure Supabase credentials
```

3. **Database setup:**
- Run migrations in Supabase SQL editor
- Verify RLS policies are active
- Test with development user

4. **Start development:**
```bash
npm run dev
```

## Testing Strategy

### Unit Tests (Recommended)
```typescript
// Score computation tests
describe('GameRankings', () => {
  test('should calculate time per glass correctly', () => {
    const result = calculateTimePerGlass(totalTime, glasses);
    expect(result).toBe(expected);
  });
});

// History aggregation tests  
describe('DataService', () => {
  test('should aggregate user sessions correctly', () => {
    // Test session aggregation logic
  });
});
```

### Integration Testing
- Test localStorage → Supabase migration
- Verify RLS policies prevent cross-user access
- Test real-time data updates in games

## API Examples

### Create Session
```typescript
const session = await DataService.createSession('therapy', 15, {
  difficulty: 'medium',
  handPreference: 'right'
});
```

### Save Game Score
```typescript
const gameRecord = await DataService.createGameRecord(
  sessionId,
  'orange_squeeze',
  {
    total_oranges: 24,
    total_glasses: 6,
    average_oranges_per_minute: 1.6
  }
);
```

### Query Rankings
```typescript
const rankings = await DataService.getRankings('neurolink', 10);
// Returns top 10 NeuroLink scores with positions
```

## Changelog

### Database Schema Updates
- ✅ Added `therapy_records` table for therapy-specific data
- ✅ Added `rankings` table for proper leaderboard management  
- ✅ Added missing columns to `game_records` (open/close times, attempts)
- ✅ Added performance indexes for common queries
- ✅ Implemented comprehensive RLS policies

### Code Refactoring
- ✅ Created centralized `DataService` for all database operations
- ✅ Added `useGameData` hook for game data management
- ✅ Updated `GameRankings` component to use new data layer
- ✅ Updated `TherapyTimer` to save therapy records properly
- ✅ Preserved legacy localStorage data compatibility
- ✅ Added automatic data migration on first run

### Files Modified
- `src/types/database.ts` - New comprehensive type definitions
- `src/services/dataService.ts` - Centralized data access layer
- `src/hooks/useGameData.ts` - Game data management hook
- `src/components/GameRankings.tsx` - Updated to use new data service
- `src/components/TherapyTimer.tsx` - Integrated with therapy records
- `docs/DEVELOPER_DOCUMENTATION.md` - This comprehensive documentation

### Preserved Functionality
- ✅ All original localStorage keys still functional
- ✅ Legacy orange rankings display maintained
- ✅ Original score calculation formulas preserved
- ✅ UI/UX flows unchanged
- ✅ Hand data processing logic intact
- ✅ Game mechanics and scoring unchanged

## Future Improvements

1. **Performance**: Add React Query for caching and optimistic updates
2. **Testing**: Implement comprehensive unit and integration tests
3. **Monitoring**: Add error tracking and performance monitoring
4. **Offline**: Add service worker for offline functionality
5. **Export**: Add data export functionality for therapists
6. **Analytics**: Enhanced analytics dashboard with more metrics
