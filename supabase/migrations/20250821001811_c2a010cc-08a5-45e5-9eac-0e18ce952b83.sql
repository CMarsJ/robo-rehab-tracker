-- Extend sessions table with new structure for timer and game data
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS therapy_type text,
ADD COLUMN IF NOT EXISTS game_type text,
ADD COLUMN IF NOT EXISTS mode text CHECK (mode IN ('timer', 'game')),
ADD COLUMN IF NOT EXISTS fastest_opening double precision,
ADD COLUMN IF NOT EXISTS fastest_closing double precision,
ADD COLUMN IF NOT EXISTS average_opening double precision,
ADD COLUMN IF NOT EXISTS average_closing double precision,
ADD COLUMN IF NOT EXISTS opening_times double precision[],
ADD COLUMN IF NOT EXISTS closing_times double precision[],
ADD COLUMN IF NOT EXISTS attempts_count integer,
ADD COLUMN IF NOT EXISTS best_open_time double precision,
ADD COLUMN IF NOT EXISTS best_close_time double precision,
ADD COLUMN IF NOT EXISTS avg_close_time double precision,
ADD COLUMN IF NOT EXISTS avg_open_time double precision,
ADD COLUMN IF NOT EXISTS started_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS ended_at timestamptz,
ADD COLUMN IF NOT EXISTS duration_ms integer;

-- Update existing metrics column to be more specific for games
-- The existing metrics column will serve as the game metrics jsonb

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_game_type ON public.sessions (game_type);
CREATE INDEX IF NOT EXISTS idx_sessions_mode ON public.sessions (mode);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON public.sessions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_metrics_gin ON public.sessions USING GIN (metrics);

-- Create view for game scores calculation
CREATE OR REPLACE VIEW public.v_game_scores AS
SELECT 
  s.*,
  CASE 
    -- Orange Squeeze Game: rank by naranjas_exprimidas DESC, then vasos DESC
    WHEN s.game_type = 'orange_squeeze' THEN 
      COALESCE((s.metrics->>'total_oranges')::numeric, 0) * 1000 + 
      COALESCE((s.metrics->>'total_glasses')::numeric, 0)
    -- NeuroLink Game: rank by score DESC
    WHEN s.game_type = 'neurolink' THEN 
      COALESCE((s.metrics->>'score')::numeric, 0)
    -- Flappy Bird: rank by score DESC  
    WHEN s.game_type = 'flappy_bird' THEN 
      COALESCE((s.metrics->>'score')::numeric, 0)
    -- Timer sessions: rank by best performance (fastest times)
    WHEN s.mode = 'timer' AND s.best_close_time IS NOT NULL THEN
      -- Convert time to negative for DESC ordering (faster = higher score)
      -COALESCE(s.best_close_time, 999999)
    ELSE 0
  END AS rank_score
FROM public.sessions s
WHERE s.mode = 'game' OR (s.mode = 'timer' AND s.best_close_time IS NOT NULL);

-- Create top 5 rankings view
CREATE OR REPLACE VIEW public.v_top5_rankings AS
SELECT * FROM (
  SELECT 
    *,
    ROW_NUMBER() OVER (
      PARTITION BY COALESCE(game_type, 'timer') 
      ORDER BY rank_score DESC, created_at ASC
    ) as rn
  FROM public.v_game_scores
) s WHERE rn <= 5;

-- Update RLS policies for sessions (the existing ones should work but let's ensure they're comprehensive)
-- Drop existing policies if they exist to recreate them
DROP POLICY IF EXISTS "Users can create their own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.sessions;

-- Create comprehensive RLS policies
CREATE POLICY "Users can create their own sessions" 
ON public.sessions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own sessions" 
ON public.sessions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" 
ON public.sessions FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" 
ON public.sessions FOR DELETE 
USING (auth.uid() = user_id);