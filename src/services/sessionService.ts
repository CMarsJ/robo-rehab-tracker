import { supabase } from '@/integrations/supabase/client';

export interface SessionData {
  therapy_type: string;
  duration: number;
  state: 'completed' | 'cancelled' | 'active';
  score?: number;
  orange_used?: number;
  juice_used?: number;
  stats?: {
    openingData: number[];
    closingData: number[];
    averageOpening: number;
    averageClosing: number;
    bestAverageOpening: number;
    bestAverageClosing: number;
  };
  details?: {
    openingHistory: number[];
    closingHistory: number[];
    timestamps: string[];
  };
  extra_date?: any; // Configuración de juegos o null para terapia guiada
}

export interface SessionResponse {
  id: string;
  user_id: string;
  therapy_type: string;
  start_time: string;
  duration: number;
  state: string;
  score: number;
  orange_used: number;
  juice_used: number;
  stats: any;
  details: any;
  extra_date: any;
}

export class SessionService {
  private static async getUserId(): Promise<string | null> {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
      console.error('No authenticated user found:', error);
      return null;
    }
    return data.user.id;
  }

  static async createSession(sessionData: SessionData): Promise<SessionResponse | null> {
    try {
      const userId = await this.getUserId();
      if (!userId) {
        console.error('Usuario no autenticado');
        return null;
      }

      const { data, error } = await supabase.from('sessions').insert({
        user_id: userId,
        therapy_type: sessionData.therapy_type,
        start_time: new Date().toISOString(),
        duration: sessionData.duration,
        state: sessionData.state,
        score: sessionData.score || 0,
        orange_used: sessionData.orange_used || 0,
        juice_used: sessionData.juice_used || 0,
        stats: sessionData.stats ? sessionData.stats : null,
        details: sessionData.details ? sessionData.details : null,
        extra_date: sessionData.extra_date || null
      }).select().single();

      if (error) {
        console.error('Error al guardar la sesión:', error);
        return null;
      }

      console.log('Sesión guardada correctamente ✅');
      return data as SessionResponse;
    } catch (error) {
      console.error('Error en createSession:', error);
      return null;
    }
  }

  static async getUserSessions(limit = 6): Promise<SessionResponse[]> {
    try {
      const userId = await this.getUserId();
      if (!userId) return [];

      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error al cargar sesiones:', error);
        return [];
      }

      return (data || []) as SessionResponse[];
    } catch (error) {
      console.error('Error en getUserSessions:', error);
      return [];
    }
  }

  // Nuevo método que reemplaza updateSessionState y updateSessionWithTherapyData
  static async completeSession(sessionId: string, therapyData: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          state: 'completed',
          score: therapyData.score || 0,
          orange_used: therapyData.orange_used || 0,
          juice_used: therapyData.juice_used || 0,
          stats: therapyData.stats || null,
          details: therapyData.details || null,
          extra_date: therapyData.extra_date || null
        })
        .eq('id', sessionId);

      if (error) {
        console.error('Error al completar la sesión:', error);
        return false;
      }

      console.log('Sesión completada y actualizada correctamente ✅');
      return true;
    } catch (error) {
      console.error('Error en completeSession:', error);
      return false;
    }
  }

  static async getTop5ByGame(gameType: string): Promise<SessionResponse[]> {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('therapy_type', gameType)
        .order('score', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error al obtener rankings:', error);
        return [];
      }

      return (data || []) as SessionResponse[];
    } catch (error) {
      console.error('Error en getTop5ByGame:', error);
      return [];
    }
  }

  static async getOrangeSqueezeRankings(): Promise<any[]> {
    try {
      // ⚠️ ojo, aquí tenías un typo en el nombre de la tabla "rankings_orabge_squeeze"
      const { data, error } = await (supabase as any)
        .from('rankings_orange_squeeze')
        .select('*')
        .order('position', { ascending: true })
        .limit(5);

      if (error) {
        console.error('Error al obtener rankings de naranjas:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error en getOrangeSqueezeRankings:', error);
      return [];
    }
  }
}
