-- Agregar nuevas columnas a game_settings para configuraciones del juego
ALTER TABLE public.game_settings 
ADD COLUMN IF NOT EXISTS numero_base_enemigos integer NOT NULL DEFAULT 6,
ADD COLUMN IF NOT EXISTS modo_oscuro boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS configuracion_inicio jsonb DEFAULT '{}';

-- Actualizar la tabla para incluir configuraciones del juego NeuroLink
COMMENT ON COLUMN public.game_settings.numero_base_enemigos IS 'Número base de enemigos en la primera ronda';
COMMENT ON COLUMN public.game_settings.modo_oscuro IS 'Modo oscuro/claro seleccionado por el usuario';
COMMENT ON COLUMN public.game_settings.configuracion_inicio IS 'Configuraciones de inicio del juego y valores predeterminados';