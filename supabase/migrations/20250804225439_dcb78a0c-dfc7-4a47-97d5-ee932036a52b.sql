-- Actualizar la restricción de tipo_actividad para incluir flappy_bird
ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_tipo_actividad_check;
ALTER TABLE public.sessions ADD CONSTRAINT sessions_tipo_actividad_check 
CHECK (tipo_actividad IN ('therapy', 'training', 'flappy_bird'));