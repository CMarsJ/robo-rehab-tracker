
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
  // New fields for enhanced session tracking
  therapy_type?: string;
  game_type?: string;
  mode?: 'timer' | 'game';
  // Timer metrics
  fastest_opening?: number;
  fastest_closing?: number;
  average_opening?: number;
  average_closing?: number;
  opening_times?: number[];
  closing_times?: number[];
  attempts_count?: number;
  best_open_time?: number;
  best_close_time?: number;
  avg_close_time?: number;
  avg_open_time?: number;
  // Audit fields
  started_at?: string;
  ended_at?: string;
  duration_ms?: number;
  // Game metrics (JSON)
  metrics?: any;
  notes?: string;
  created_at: string;
}

export interface GameScore {
  id: string;
  user_id: string;
  game_type: string;
  rank_score: number;
  created_at: string;
  metrics?: any;
  rn?: number;
}

export interface TherapySessionData {
  therapy_type: string;
  timer: {
    fastest_opening?: number;
    fastest_closing?: number;
    average_opening?: number;
    average_closing?: number;
    opening_times?: number[];
    closing_times?: number[];
    attempts_count?: number;
    best_open_time?: number;
    best_close_time?: number;
    avg_close_time?: number;
    avg_open_time?: number;
  };
  started_at: string;
  ended_at?: string;
  duration_ms?: number;
}

export interface GameSessionData {
  game_type: string;
  timer_metrics?: {
    fastest_opening?: number;
    fastest_closing?: number;
    average_opening?: number;
    average_closing?: number;
    opening_times?: number[];
    closing_times?: number[];
    attempts_count?: number;
    best_open_time?: number;
    best_close_time?: number;
    avg_close_time?: number;
    avg_open_time?: number;
  };
  metrics: Record<string, any>;
  started_at: string;
  ended_at?: string;
  duration_ms?: number;
}
