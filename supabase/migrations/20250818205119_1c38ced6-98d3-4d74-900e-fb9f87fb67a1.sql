
-- Add missing columns to existing tables for therapy metrics
ALTER TABLE public.game_records 
ADD COLUMN IF NOT EXISTS best_open_time numeric,
ADD COLUMN IF NOT EXISTS best_close_time numeric,
ADD COLUMN IF NOT EXISTS avg_open_time numeric,
ADD COLUMN IF NOT EXISTS avg_close_time numeric,
ADD COLUMN IF NOT EXISTS open_times numeric[],
ADD COLUMN IF NOT EXISTS close_times numeric[],
ADD COLUMN IF NOT EXISTS attempts_count integer;

-- Create therapy_records table to separate therapy data from games
CREATE TABLE IF NOT EXISTS public.therapy_records (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  best_open_time numeric,
  best_close_time numeric,
  avg_open_time numeric,
  avg_close_time numeric,
  open_times numeric[],
  close_times numeric[],
  attempts_count integer,
  effort_data jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add RLS policies for therapy_records
ALTER TABLE public.therapy_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own therapy records" 
ON public.therapy_records 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own therapy records" 
ON public.therapy_records 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own therapy records" 
ON public.therapy_records 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create rankings table for proper leaderboard management
CREATE TABLE IF NOT EXISTS public.rankings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_type text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  score numeric NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  position integer,
  calculated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add RLS policies for rankings
ALTER TABLE public.rankings ENABLE ROW LEVEL SECURITY;

-- Allow users to view all rankings (public leaderboard)
CREATE POLICY "Anyone can view rankings" 
ON public.rankings 
FOR SELECT 
TO authenticated;

-- Users can only insert/update their own rankings
CREATE POLICY "Users can create their own rankings" 
ON public.rankings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rankings" 
ON public.rankings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_records_user_game_created 
ON public.game_records(user_id, game_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sessions_user_created 
ON public.sessions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_therapy_records_user_session 
ON public.therapy_records(user_id, session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rankings_game_score 
ON public.rankings(game_type, score DESC, calculated_at DESC);

CREATE INDEX IF NOT EXISTS idx_rankings_user_game 
ON public.rankings(user_id, game_type, score DESC);

-- Update sessions table to include more structured data
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS metrics jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS notes text;
