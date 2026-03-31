
-- Create achievements table for persistent weekly/monthly tracking
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  sessions_completed INTEGER NOT NULL DEFAULT 0,
  sessions_target INTEGER NOT NULL DEFAULT 7,
  total_duration_minutes NUMERIC NOT NULL DEFAULT 0,
  streak_days INTEGER NOT NULL DEFAULT 0,
  best_closing_time_ms NUMERIC,
  best_opening_time_ms NUMERIC,
  total_repetitions INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, period_type, period_start)
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own achievements"
  ON public.achievements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
  ON public.achievements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievements"
  ON public.achievements FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Auto-update timestamp trigger
CREATE TRIGGER update_achievements_updated_at
  BEFORE UPDATE ON public.achievements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for fast lookups
CREATE INDEX idx_achievements_user_period ON public.achievements(user_id, period_type, period_start);
