
export interface TherapyRecord {
  id: string;
  session_id?: string;
  user_id: string;
  best_open_time?: number;
  best_close_time?: number;
  avg_open_time?: number;
  avg_close_time?: number;
  open_times?: number[];
  close_times?: number[];
  attempts_count?: number;
  // Relax to align with Supabase jsonb
  effort_data?: any;
  created_at: string;
}

export interface EffortDataPoint {
  time: string;
  paretica: number;
  noParetica: number;
}

export interface GameRecord {
  id: string;
  session_id: string;
  user_id: string;
  game_type: string;
  total_oranges?: number;
  total_glasses?: number;
  average_oranges_per_minute?: number;
  best_open_time?: number;
  best_close_time?: number;
  avg_open_time?: number;
  avg_close_time?: number;
  open_times?: number[];
  close_times?: number[];
  attempts_count?: number;
  created_at: string;
}

export interface Ranking {
  id: string;
  game_type: string;
  user_id: string;
  score: number;
  details?: Record<string, any>;
  position?: number;
  calculated_at: string;
  created_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  fecha_inicio: string;
  duracion_minutos: number;
  tipo_actividad: string;
  estado: string;
  // Relax to any to match Supabase Json typing
  metrics?: any;
  notes?: string;
  created_at: string;
}
