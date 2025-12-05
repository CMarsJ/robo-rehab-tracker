-- Tabla de rankings para NeuroLink (top 5)
CREATE TABLE public.rankings_neurolink (
    position integer NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    game_type text DEFAULT 'neurolink',
    start_time timestamp without time zone,
    score integer NOT NULL DEFAULT 0,
    duration integer NOT NULL DEFAULT 0,
    points_per_second numeric(10,2) NOT NULL DEFAULT 0
);

-- Tabla de rankings para Flappy Bird (top 5)
CREATE TABLE public.rankings_flappy_bird (
    position integer NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    game_type text DEFAULT 'flappy-bird',
    start_time timestamp without time zone,
    score integer NOT NULL DEFAULT 0,
    duration integer NOT NULL DEFAULT 0,
    points_per_minute numeric(10,2) NOT NULL DEFAULT 0
);

-- Habilitar RLS
ALTER TABLE public.rankings_neurolink ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rankings_flappy_bird ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública para rankings
CREATE POLICY "Permitir leer rankings neurolink a todos" 
ON public.rankings_neurolink FOR SELECT USING (true);

CREATE POLICY "Permitir leer rankings flappy bird a todos" 
ON public.rankings_flappy_bird FOR SELECT USING (true);

-- Políticas de modificación (para funciones del sistema)
CREATE POLICY "Permitir modificar rankings neurolink" 
ON public.rankings_neurolink FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Permitir modificar rankings flappy bird" 
ON public.rankings_flappy_bird FOR ALL USING (true) WITH CHECK (true);

-- Función para reconstruir rankings de NeuroLink
CREATE OR REPLACE FUNCTION public.rebuild_rankings_neurolink()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    WITH top5 AS (
        SELECT
            s.user_id,
            s.start_time,
            COALESCE(s.score, 0) AS score,
            COALESCE(s.duration, 0) AS duration,
            CASE 
                WHEN COALESCE(s.duration, 0) > 0 
                THEN ROUND((COALESCE(s.score, 0)::numeric / (s.duration / 1000.0)), 2)
                ELSE 0 
            END AS points_per_second,
            ROW_NUMBER() OVER (
                ORDER BY COALESCE(s.score, 0) DESC, s.duration ASC
            ) AS pos
        FROM sessions s
        WHERE s.therapy_type = 'neurolink' AND s.user_id IS NOT NULL AND s.score IS NOT NULL
        ORDER BY score DESC, duration ASC
        LIMIT 5
    ),
    positions AS (
        SELECT generate_series(1,5) AS pos
    ),
    to_upsert AS (
        SELECT 
            p.pos AS position,
            t.user_id,
            COALESCE(t.score, 0) AS score,
            COALESCE(t.duration, 0) AS duration,
            COALESCE(t.points_per_second, 0) AS points_per_second,
            t.start_time
        FROM positions p
        LEFT JOIN top5 t ON t.pos = p.pos
    )
    INSERT INTO rankings_neurolink (position, user_id, game_type, start_time, score, duration, points_per_second)
    SELECT 
        position,
        user_id,
        CASE WHEN user_id IS NOT NULL THEN 'neurolink' ELSE NULL END AS game_type,
        start_time,
        score,
        duration,
        points_per_second
    FROM to_upsert
    ON CONFLICT (position) DO UPDATE
    SET
        user_id = EXCLUDED.user_id,
        game_type = EXCLUDED.game_type,
        start_time = EXCLUDED.start_time,
        score = EXCLUDED.score,
        duration = EXCLUDED.duration,
        points_per_second = EXCLUDED.points_per_second;
END;
$$;

-- Función para reconstruir rankings de Flappy Bird
CREATE OR REPLACE FUNCTION public.rebuild_rankings_flappy_bird()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    WITH top5 AS (
        SELECT
            s.user_id,
            s.start_time,
            COALESCE(s.score, 0) AS score,
            COALESCE(s.duration, 0) AS duration,
            CASE 
                WHEN COALESCE(s.duration, 0) > 0 
                THEN ROUND((COALESCE(s.score, 0)::numeric / (s.duration / 60000.0)), 2)
                ELSE 0 
            END AS points_per_minute,
            ROW_NUMBER() OVER (
                ORDER BY COALESCE(s.score, 0) DESC, s.duration ASC
            ) AS pos
        FROM sessions s
        WHERE s.therapy_type = 'flappy-bird' AND s.user_id IS NOT NULL AND s.score IS NOT NULL
        ORDER BY score DESC, duration ASC
        LIMIT 5
    ),
    positions AS (
        SELECT generate_series(1,5) AS pos
    ),
    to_upsert AS (
        SELECT 
            p.pos AS position,
            t.user_id,
            COALESCE(t.score, 0) AS score,
            COALESCE(t.duration, 0) AS duration,
            COALESCE(t.points_per_minute, 0) AS points_per_minute,
            t.start_time
        FROM positions p
        LEFT JOIN top5 t ON t.pos = p.pos
    )
    INSERT INTO rankings_flappy_bird (position, user_id, game_type, start_time, score, duration, points_per_minute)
    SELECT 
        position,
        user_id,
        CASE WHEN user_id IS NOT NULL THEN 'flappy-bird' ELSE NULL END AS game_type,
        start_time,
        score,
        duration,
        points_per_minute
    FROM to_upsert
    ON CONFLICT (position) DO UPDATE
    SET
        user_id = EXCLUDED.user_id,
        game_type = EXCLUDED.game_type,
        start_time = EXCLUDED.start_time,
        score = EXCLUDED.score,
        duration = EXCLUDED.duration,
        points_per_minute = EXCLUDED.points_per_minute;
END;
$$;

-- Trigger para actualizar rankings de NeuroLink
CREATE OR REPLACE FUNCTION public.trg_update_rankings_neurolink_func()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.therapy_type = 'neurolink' THEN
        PERFORM rebuild_rankings_neurolink();
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_update_rankings_neurolink
AFTER INSERT OR UPDATE ON public.sessions
FOR EACH ROW
EXECUTE FUNCTION public.trg_update_rankings_neurolink_func();

-- Trigger para actualizar rankings de Flappy Bird
CREATE OR REPLACE FUNCTION public.trg_update_rankings_flappy_bird_func()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.therapy_type = 'flappy-bird' THEN
        PERFORM rebuild_rankings_flappy_bird();
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_update_rankings_flappy_bird
AFTER INSERT OR UPDATE ON public.sessions
FOR EACH ROW
EXECUTE FUNCTION public.trg_update_rankings_flappy_bird_func();

-- Inicializar rankings vacíos
SELECT rebuild_rankings_neurolink();
SELECT rebuild_rankings_flappy_bird();