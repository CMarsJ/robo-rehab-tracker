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
  extra_data: Record<string, any> | null; // jsonb
  created_at?: string;      // si usas trigger de creación automática
}

export interface TherapyRecord {
  id: string;
  session_id: string;
  user_id: string;
  effort_data: EffortDataPoint[];
  created_at: string;
}

export interface GameRecord {
  id: string;
  session_id: string;
  user_id: string;
  game_type: string;
  score: number;
  created_at: string;
}

export interface Ranking {
  id: string;
  user_id: string;
  game_type: string;
  score: number;
  position: number;
  details: any;
  created_at: string;
}

export interface EffortDataPoint {
  timestamp: number;
  value: number;
  hand: 'left' | 'right';
}

export interface GameScore {
  id: string;
  user_id: string;
  game_type: string;
  score: number;
  created_at: string;
}
