
-- 1. Fix rankings_neurolink: Remove overly permissive ALL policy, keep public SELECT
DROP POLICY IF EXISTS "Permitir modificar rankings neurolink" ON public.rankings_neurolink;

-- 2. Fix rankings_flappy_bird: Same issue
DROP POLICY IF EXISTS "Permitir modificar rankings flappy bird" ON public.rankings_flappy_bird;

-- 3. Fix rankings_orabge_squeeze: Same issue  
DROP POLICY IF EXISTS "Permitir modificar rankings a todos" ON public.rankings_orabge_squeeze;

-- 4. Make rebuild functions SECURITY DEFINER so triggers can still write to rankings

CREATE OR REPLACE FUNCTION public.rebuild_rankings_neurolink()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    WITH top5 AS (
        SELECT s.user_id, s.start_time,
            COALESCE(s.score, 0) AS score,
            COALESCE(s.duration, 0) AS duration,
            CASE WHEN COALESCE(s.duration, 0) > 0 
                THEN ROUND((COALESCE(s.score, 0)::numeric / (s.duration / 1000.0)), 2)
                ELSE 0 END AS points_per_second,
            ROW_NUMBER() OVER (ORDER BY COALESCE(s.score, 0) DESC, s.duration ASC) AS pos
        FROM sessions s
        WHERE s.therapy_type = 'neurolink' AND s.user_id IS NOT NULL AND s.score IS NOT NULL
        LIMIT 5
    ),
    positions AS (SELECT generate_series(1,5) AS pos),
    to_upsert AS (
        SELECT p.pos AS position, t.user_id, COALESCE(t.score, 0) AS score,
            COALESCE(t.duration, 0) AS duration, COALESCE(t.points_per_second, 0) AS points_per_second, t.start_time
        FROM positions p LEFT JOIN top5 t ON t.pos = p.pos
    )
    INSERT INTO rankings_neurolink (position, user_id, game_type, start_time, score, duration, points_per_second)
    SELECT position, user_id,
        CASE WHEN user_id IS NOT NULL THEN 'neurolink' ELSE NULL END,
        start_time, score, duration, points_per_second
    FROM to_upsert
    ON CONFLICT (position) DO UPDATE SET
        user_id = EXCLUDED.user_id, game_type = EXCLUDED.game_type, start_time = EXCLUDED.start_time,
        score = EXCLUDED.score, duration = EXCLUDED.duration, points_per_second = EXCLUDED.points_per_second;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rebuild_rankings_flappy_bird()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    WITH top5 AS (
        SELECT s.user_id, s.start_time,
            COALESCE(s.score, 0) AS score,
            COALESCE(s.duration, 0) AS duration,
            CASE WHEN COALESCE(s.duration, 0) > 0 
                THEN ROUND((COALESCE(s.score, 0)::numeric / (s.duration / 60000.0)), 2)
                ELSE 0 END AS points_per_minute,
            ROW_NUMBER() OVER (ORDER BY COALESCE(s.score, 0) DESC, s.duration ASC) AS pos
        FROM sessions s
        WHERE s.therapy_type = 'flappy-bird' AND s.user_id IS NOT NULL AND s.score IS NOT NULL
        LIMIT 5
    ),
    positions AS (SELECT generate_series(1,5) AS pos),
    to_upsert AS (
        SELECT p.pos AS position, t.user_id, COALESCE(t.score, 0) AS score,
            COALESCE(t.duration, 0) AS duration, COALESCE(t.points_per_minute, 0) AS points_per_minute, t.start_time
        FROM positions p LEFT JOIN top5 t ON t.pos = p.pos
    )
    INSERT INTO rankings_flappy_bird (position, user_id, game_type, start_time, score, duration, points_per_minute)
    SELECT position, user_id,
        CASE WHEN user_id IS NOT NULL THEN 'flappy-bird' ELSE NULL END,
        start_time, score, duration, points_per_minute
    FROM to_upsert
    ON CONFLICT (position) DO UPDATE SET
        user_id = EXCLUDED.user_id, game_type = EXCLUDED.game_type, start_time = EXCLUDED.start_time,
        score = EXCLUDED.score, duration = EXCLUDED.duration, points_per_minute = EXCLUDED.points_per_minute;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rebuild_rankings_force_positions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    WITH top10 AS (
        SELECT s.user_id, s.start_time,
            COALESCE((s.stats->'game_metrics'->>'total_oranges')::INT, 0) AS orange_used,
            COALESCE((s.stats->'game_metrics'->>'total_glasses')::INT, 0) AS juice_used,
            COALESCE(ROUND((s.stats->'hand_metrics'->'closing'->>'average_time_ms')::NUMERIC)::INT, 0) AS time_orange,
            ROW_NUMBER() OVER (ORDER BY
                COALESCE((s.stats->'game_metrics'->>'total_oranges')::INT, 0) DESC,
                COALESCE(ROUND((s.stats->'hand_metrics'->'closing'->>'average_time_ms')::NUMERIC)::INT, 0) ASC
            ) AS pos
        FROM sessions s
        WHERE s.therapy_type = 'orange-squeeze' AND s.user_id IS NOT NULL
        LIMIT 10
    ),
    positions AS (SELECT generate_series(1,10) AS pos),
    to_upsert AS (
        SELECT p.pos AS position, t.user_id, COALESCE(t.orange_used, 0) AS orange_used,
            COALESCE(t.juice_used, 0) AS juice_used, COALESCE(t.time_orange, 0) AS time_orange, t.start_time
        FROM positions p LEFT JOIN top10 t ON t.pos = p.pos
    )
    INSERT INTO rankings_orabge_squeeze (position, user_id, therapy_type, start_time, orange_used, juice_used, time_orange)
    SELECT position, user_id,
        CASE WHEN user_id IS NOT NULL THEN 'orange-squeeze' ELSE NULL END,
        start_time, orange_used, juice_used, time_orange
    FROM to_upsert
    ON CONFLICT (position) DO UPDATE SET
        user_id = EXCLUDED.user_id, therapy_type = EXCLUDED.therapy_type, start_time = EXCLUDED.start_time,
        orange_used = EXCLUDED.orange_used, juice_used = EXCLUDED.juice_used, time_orange = EXCLUDED.time_orange;
END;
$function$;

-- 5. Add DELETE policy on profiles
CREATE POLICY "Users can delete their own profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 6. Fix game_settings policies: change from public to authenticated role
DROP POLICY IF EXISTS "Users can view their own game settings" ON public.game_settings;
DROP POLICY IF EXISTS "Users can create their own game settings" ON public.game_settings;
DROP POLICY IF EXISTS "Users can update their own game settings" ON public.game_settings;

CREATE POLICY "Users can view their own game settings" ON public.game_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own game settings" ON public.game_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own game settings" ON public.game_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- 7. Fix profiles policies: change from public to authenticated role
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 8. Fix sessions policies: change SELECT/UPDATE from public to authenticated
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.sessions;

CREATE POLICY "Users can view their own sessions" ON public.sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own sessions" ON public.sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
