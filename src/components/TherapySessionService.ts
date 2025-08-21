// TherapySessionService.ts
import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase (agrega tus variables de entorno)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface SessionData {
  therapy_type: string;
  started_at: string;
  duration_ms?: number;
}

interface UpdateSessionData {
  estado?: 'completed' | 'cancelled';
  ended_at?: string;
  completedDuration?: number; // minutos
}

interface TherapyMetrics {
  closingTimes: number[];
  openingTimes: number[];
  fastestClosing: number | null;
  fastestOpening: number | null;
  averageClosing: number | null;
  averageOpening: number | null;
  attempts: { closingTime: number; openingTime: number; totalTime: number }[];
}

export const TherapySessionService = {
  /**
   * Crear una nueva sesión de terapia
   */
  createSession: async (data: SessionData) => {
    try {
      const { data: session, error } = await supabase
        .from('sessions')
        .insert([{ ...data, estado: 'active' }])
        .select('*')
        .single();

      if (error) {
        console.error('Error creando sesión en Supabase:', error);
        return null;
      }
      return session;
    } catch (err) {
      console.error('Error inesperado creando sesión:', err);
      return null;
    }
  },

  /**
   * Actualizar una sesión existente
   */
  updateSession: async (sessionId: string, data: UpdateSessionData) => {
    try {
      const { data: updatedSession, error } = await supabase
        .from('sessions')
        .update(data)
        .eq('id', sessionId)
        .select('*')
        .single();

      if (error) {
        console.error('Error actualizando sesión en Supabase:', error);
        return null;
      }
      return updatedSession;
    } catch (err) {
      console.error('Error inesperado actualizando sesión:', err);
      return null;
    }
  },

  /**
   * Guardar métricas de la sesión de terapia
   */
  saveTherapyMetrics: async (sessionId: string, metrics: TherapyMetrics) => {
    try {
      const { data: result, error } = await supabase
        .from('therapy_metrics')
        .insert([
          {
            session_id: sessionId,
            closing_times: metrics.closingTimes,
            opening_times: metrics.openingTimes,
            fastest_closing: metrics.fastestClosing,
            fastest_opening: metrics.fastestOpening,
            average_closing: metrics.averageClosing,
            average_opening: metrics.averageOpening,
            attempts: metrics.attempts
          }
        ]);

      if (error) {
        console.error('Error guardando métricas en Supabase:', error);
        return null;
      }
      return result;
    } catch (err) {
      console.error('Error inesperado guardando métricas:', err);
      return null;
    }
  }
};
