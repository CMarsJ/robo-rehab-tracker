-- Agregar campos faltantes a la tabla profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS therapist_name TEXT,
ADD COLUMN IF NOT EXISTS patient_age INTEGER;

-- Agregar comentarios para documentar
COMMENT ON COLUMN public.profiles.therapist_name IS 'Nombre del terapeuta asignado al paciente';
COMMENT ON COLUMN public.profiles.patient_age IS 'Edad del paciente en años';
