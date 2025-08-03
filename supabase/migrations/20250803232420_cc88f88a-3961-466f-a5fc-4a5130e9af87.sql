-- Agregar parámetro para espacio entre pilares en Flappy Bird
ALTER TABLE public.game_settings 
ADD COLUMN espacio_pilares_flappy INTEGER NOT NULL DEFAULT 120;