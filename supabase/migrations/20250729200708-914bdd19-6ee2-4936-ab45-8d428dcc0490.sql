-- Crear tabla para configuraciones del juego Space Invaders
CREATE TABLE public.game_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  enemy_speed INTEGER NOT NULL DEFAULT 3 CHECK (enemy_speed >= 1 AND enemy_speed <= 5),
  player_shot_speed INTEGER NOT NULL DEFAULT 3 CHECK (player_shot_speed >= 1 AND player_shot_speed <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Habilitar RLS
ALTER TABLE public.game_settings ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY "Users can view their own game settings" 
ON public.game_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own game settings" 
ON public.game_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own game settings" 
ON public.game_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Crear trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_game_settings_updated_at
BEFORE UPDATE ON public.game_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();