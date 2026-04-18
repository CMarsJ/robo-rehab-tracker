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
        stats: sessionData.stats as any || {},
        details: sessionData.details || {},
        extra_date: sessionData.extra_date || null
      }).select().single();

      if (error) {
        console.error('Error al guardar la sesión:', error);
        return null;
      }

      console.log('Sesión guardada correctamente ✅');
      return {
        ...data,
        extra_date: data.extra_date
      } as SessionResponse;
    } catch (error) {
      console.error('Error en createSession:', error);
      return null;
    }
  }

  static async getUserSessions(
    limit = 10, 
    offset = 0, 
    therapyTypes?: string[],
    filters?: {
      dateFrom?: Date;
      dateTo?: Date;
      /** Filtra por duración exacta en minutos (5,10,...,60) */
      duration?: number;
    }
  ): Promise<SessionResponse[]> {
    try {
      const userId = await this.getUserId();
      if (!userId) return [];

      let query = supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: false })
        .range(offset, offset + limit - 1);

      if (therapyTypes && therapyTypes.length > 0) {
        query = query.in('therapy_type', therapyTypes);
      }

      if (filters?.dateFrom) {
        query = query.gte('start_time', filters.dateFrom.toISOString());
      }

      if (filters?.dateTo) {
        // Add 1 day to include the entire end date
        const endDate = new Date(filters.dateTo);
        endDate.setDate(endDate.getDate() + 1);
        query = query.lt('start_time', endDate.toISOString());
      }

      if (filters?.duration !== undefined) {
        query = query.eq('duration', filters.duration);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error al cargar sesiones:', error);
        return [];
      }

      return (data || []).map(session => ({
        ...session,
        extra_date: session.extra_date
      })) as SessionResponse[];
    } catch (error) {
      console.error('Error en getUserSessions:', error);
      return [];
    }
  }

  static async updateSessionState(sessionId: string, state: 'completed' | 'cancelled'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ state })
        .eq('id', sessionId);

      return !error;
    } catch (error) {
      console.error('Error al actualizar estado de sesión:', error);
      return false;
    }
  }

  /**
   * Max BLE records per chunk / per extra_date column.
   */
  private static readonly CHUNK_SIZE = 5000;

  /**
   * Split an array into chunks of `size`.
   */
  private static splitIntoChunks<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }

  static async updateSessionWithTherapyData(sessionId: string, therapyData: any): Promise<boolean> {
    try {
      const extraDate: any[] = therapyData.extra_date || [];
      const totalRecords = Array.isArray(extraDate) ? extraDate.length : 0;

      // Split into chunks of CHUNK_SIZE
      const chunks = Array.isArray(extraDate) && extraDate.length > 0
        ? this.splitIntoChunks(extraDate, this.CHUNK_SIZE)
        : [[]];

      console.log('📤 Actualizando sesión con datos:', {
        sessionId,
        state: therapyData.state,
        score: therapyData.score,
        hasStats: !!therapyData.stats,
        hasDetails: !!therapyData.details,
        totalBleRecords: totalRecords,
        totalChunks: chunks.length,
      });

      // First chunk goes into sessions.extra_date (backward compatible)
      const updatePayload = {
        state: therapyData.state,
        score: therapyData.score || 0,
        orange_used: therapyData.orange_used || 0,
        juice_used: therapyData.juice_used || 0,
        stats: therapyData.stats || {},
        details: therapyData.details || {},
        extra_date: chunks[0] || []
      };

      // Save main session row
      let { error } = await supabase
        .from('sessions')
        .update(updatePayload)
        .eq('id', sessionId);

      // Retry once on network failure
      if (error && (error.message?.includes('Failed to fetch') || error.code === 'PGRST000')) {
        console.warn('⚠️ Primer intento fallido, reintentando en 2s...');
        await new Promise(r => setTimeout(r, 2000));
        const retry = await supabase
          .from('sessions')
          .update(updatePayload)
          .eq('id', sessionId);
        error = retry.error;
      }

      if (error) {
        console.error('Error al actualizar datos de terapia:', error);
        // Fallback: save without extra_date
        console.warn('⚠️ Guardando sesión sin extra_date como fallback...');
        const { error: fallbackError } = await supabase
          .from('sessions')
          .update({
            state: therapyData.state,
            score: therapyData.score || 0,
            orange_used: therapyData.orange_used || 0,
            juice_used: therapyData.juice_used || 0,
            stats: therapyData.stats || {},
            details: therapyData.details || {},
            extra_date: []
          })
          .eq('id', sessionId);

        if (fallbackError) {
          console.error('❌ Fallback también falló:', fallbackError);
          return false;
        }
        console.log('✅ Sesión guardada sin extra_date (fallback)');
        return true;
      }

      // Save overflow chunks (index 1..N) into session_ble_chunks
      if (chunks.length > 1) {
        const overflowRows = chunks.slice(1).map((chunk, i) => ({
          session_id: sessionId,
          chunk_index: i + 1,
          data: chunk,
        }));

        console.log(`📦 Guardando ${overflowRows.length} chunks adicionales en session_ble_chunks...`);

        const { error: chunkError } = await (supabase as any)
          .from('session_ble_chunks')
          .insert(overflowRows);

        if (chunkError) {
          console.error('❌ Error guardando chunks BLE:', chunkError);
          // Session metadata is saved, only overflow chunks failed
          console.warn('⚠️ Datos principales guardados, pero chunks adicionales fallaron');
        } else {
          console.log(`✅ ${overflowRows.length} chunks BLE guardados correctamente`);
        }
      }

      console.log('✅ Datos de terapia actualizados correctamente');
      return true;
    } catch (error) {
      console.error('Error en updateSessionWithTherapyData:', error);
      return false;
    }
  }

  /**
   * Retrieves the full extra_date array for a session by concatenating
   * the main sessions.extra_date with any overflow chunks.
   */
  static async getFullExtraDate(sessionId: string): Promise<any[]> {
    try {
      // Get main session extra_date
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('extra_date')
        .eq('id', sessionId)
        .single();

      if (sessionError || !session) {
        console.error('Error al obtener extra_date de sesión:', sessionError);
        return [];
      }

      const mainData: any[] = Array.isArray(session.extra_date) ? session.extra_date : [];

      // Get overflow chunks
      const { data: chunks, error: chunkError } = await (supabase as any)
        .from('session_ble_chunks')
        .select('chunk_index, data')
        .eq('session_id', sessionId)
        .order('chunk_index', { ascending: true });

      if (chunkError) {
        console.error('Error al obtener chunks BLE:', chunkError);
        return mainData;
      }

      if (!chunks || chunks.length === 0) {
        return mainData;
      }

      // Concatenate all chunks in order
      let fullData = [...mainData];
      for (const chunk of chunks) {
        if (Array.isArray(chunk.data)) {
          fullData = fullData.concat(chunk.data);
        }
      }

      console.log(`📊 Extra_date completo: ${fullData.length} registros (${1 + chunks.length} chunks)`);
      return fullData;
    } catch (error) {
      console.error('Error en getFullExtraDate:', error);
      return [];
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

      return (data || []).map(session => ({
        ...session,
        extra_date: session.extra_date
      })) as SessionResponse[];
    } catch (error) {
      console.error('Error en getTop5ByGame:', error);
      return [];
    }
  }

  static async getOrangeSqueezeRankings(): Promise<any[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('rankings_orabge_squeeze')
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

  static async getNeuroLinkRankings(): Promise<any[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('rankings_neurolink')
        .select('*')
        .order('position', { ascending: true })
        .limit(5);

      if (error) {
        console.error('Error al obtener rankings de NeuroLink:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error en getNeuroLinkRankings:', error);
      return [];
    }
  }

  static async getFlappyBirdRankings(): Promise<any[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('rankings_flappy_bird')
        .select('*')
        .order('position', { ascending: true })
        .limit(5);

      if (error) {
        console.error('Error al obtener rankings de RehabBird:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error en getFlappyBirdRankings:', error);
      return [];
    }
  }
}