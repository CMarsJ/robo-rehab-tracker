-- Agregar campo para intervalo de disparo en game_settings
ALTER TABLE public.game_settings 
ADD COLUMN intervalo_disparo_ms integer NOT NULL DEFAULT 1000;