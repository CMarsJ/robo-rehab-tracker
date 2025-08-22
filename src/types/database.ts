export interface Session {
  id: string;               // uuid
  user_id: string;          // uuid (FK con users)
  therapy_type: string;     // tipo de terapia
  start_time: string;       // timestamp
  duration: number;         // en segundos o minutos según definas
  state: string;            // estado de la sesión (ej: active, completed)
  score: number | null;     // puntaje del juego
  orange_used: number | null; // recurso usado en juego
  juice_used: number | null;  // recurso usado en juego
  stats: Record<string, any> | null;   // jsonb
  details: Record<string, any> | null; // jsonb
  extra_date: Record<string, any> | null; // jsonb (aunque no lo actualices por ahora)
  created_at?: string;      // si usas trigger de creación automática
}
