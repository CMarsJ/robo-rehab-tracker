
import { supabase } from '@/integrations/supabase/client';
import { TherapyRecord, GameRecord, Ranking, Session, EffortDataPoint } from '@/types/database';

export class DataService {
  private static async getUserId(): Promise<string | null> {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
      console.error('No authenticated user found:', error);
      return null;
    }
    return data.user.id;
  }

  // Session management
  static async createSession(
    therapy_type: string, 
    duration: number, 
    metrics?: Record<string, any>
  ): Promise<Session | null> {
    try {
      const userId = await this.getUserId();
      if (!userId) return null;

      const { data, error } = await supabase
        .from('sessions')
        .insert({
          user_id: userId,
          therapy_type,
          duration,
          state: 'active',
          stats: (metrics || {}) as any
        })
        .select()
        .single();

      if (error) throw error;
      return {
        id: data.id,
        user_id: data.user_id,
        fecha_inicio: data.start_time,
        duracion_minutos: data.duration,
        tipo_actividad: data.therapy_type,
        estado: data.state,
        created_at: data.start_time
      } as Session;
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  }

  static async updateSession(sessionId: string, updates: Partial<Session>): Promise<boolean> {
    try {
      const supabaseUpdates: any = {};
      
      if (updates.estado) supabaseUpdates.state = updates.estado;
      if (updates.duracion_minutos) supabaseUpdates.duration = updates.duracion_minutos;
      if (updates.tipo_actividad) supabaseUpdates.therapy_type = updates.tipo_actividad;
      if (updates.metrics) supabaseUpdates.stats = updates.metrics;

      const { error } = await supabase
        .from('sessions')
        .update(supabaseUpdates)
        .eq('id', sessionId);

      return !error;
    } catch (error) {
      console.error('Error updating session:', error);
      return false;
    }
  }

  static async getUserSessions(limit = 10): Promise<Session[]> {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .order('start_time', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return ((data || []) as any[]).map(session => ({
        id: session.id,
        user_id: session.user_id,
        fecha_inicio: session.start_time,
        duracion_minutos: session.duration,
        tipo_actividad: session.therapy_type,
        estado: session.state,
        created_at: session.start_time
      })) as Session[];
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }
  }

  // Therapy records - Store in sessions table with extra_data
  static async createTherapyRecord(
    sessionId: string,
    effortData: EffortDataPoint[],
    metrics?: Partial<TherapyRecord>
  ): Promise<TherapyRecord | null> {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          extra_data: {
            effort_data: effortData,
            ...metrics
          }
        })
        .eq('id', sessionId);

      if (error) throw error;
      return {
        id: sessionId,
        session_id: sessionId,
        user_id: '',
        effort_data: effortData,
        created_at: new Date().toISOString(),
        ...metrics
      } as TherapyRecord;
    } catch (error) {
      console.error('Error creating therapy record:', error);
      return null;
    }
  }

  // Game records - Store in sessions table
  static async createGameRecord(
    sessionId: string,
    gameType: string,
    gameData: Partial<GameRecord>
  ): Promise<GameRecord | null> {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          stats: gameData,
          therapy_type: gameType
        })
        .eq('id', sessionId);

      if (error) throw error;
      return {
        id: sessionId,
        session_id: sessionId,
        user_id: '',
        game_type: gameType,
        created_at: new Date().toISOString(),
        ...gameData
      } as GameRecord;
    } catch (error) {
      console.error('Error creating game record:', error);
      return null;
    }
  }

  static async getGameRecords(gameType?: string, limit = 10): Promise<GameRecord[]> {
    try {
      let query = supabase
        .from('sessions')
        .select('*')
        .order('start_time', { ascending: false })
        .limit(limit);

      if (gameType) {
        query = query.eq('therapy_type', gameType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return ((data || []) as any[]).map(session => ({
        id: session.id,
        session_id: session.id,
        user_id: session.user_id,
        game_type: session.therapy_type,
        created_at: session.start_time,
        ...(session.stats || {})
      })) as GameRecord[];
    } catch (error) {
      console.error('Error fetching game records:', error);
      return [];
    }
  }

  // Rankings
  static async updateRanking(
    gameType: string,
    score: number,
    details?: Record<string, any>
  ): Promise<boolean> {
    try {
      const userId = await this.getUserId();
      if (!userId) return false;

      // Get existing ranking for this user + game
      const { data: existing } = await supabase
        .from('rankings')
        .select('*')
        .eq('game_type', gameType)
        .eq('user_id', userId)
        .maybeSingle();

      if (existing && (existing as any).score < score) {
        const { error } = await supabase
          .from('rankings')
          .update({
            score,
            details: details || {},
            calculated_at: new Date().toISOString()
          } as any)
          .eq('id', (existing as any).id);

        return !error;
      } else if (!existing) {
        const { error } = await supabase
          .from('rankings')
          .insert({
            game_type: gameType,
            user_id: userId,
            score,
            details: details || {}
          } as any);

        return !error;
      }

      return true;
    } catch (error) {
      console.error('Error updating ranking:', error);
      return false;
    }
  }

  static async getRankings(gameType: string, limit = 5): Promise<Ranking[]> {
    try {
      const { data, error } = await supabase
        .from('rankings')
        .select('*')
        .eq('game_type', gameType)
        .order('score', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      // Add positions
      return ((data || []) as any[]).map((ranking, index) => ({
        ...(ranking as any),
        position: index + 1
      })) as Ranking[];
    } catch (error) {
      console.error('Error fetching rankings:', error);
      return [];
    }
  }

  // Migration utilities
  static async migrateLocalStorageData(): Promise<void> {
    try {
      const migrationFlag = localStorage.getItem('supabase_migration_completed');
      if (migrationFlag) return;

      // Migrate orange rankings
      const orangeRankings = JSON.parse(localStorage.getItem('orangeRankings') || '[]');
      for (const ranking of orangeRankings) {
        await this.updateRanking('orange_squeeze', ranking.totalOranges, {
          glasses: ranking.glasses,
          timePerGlass: ranking.timePerGlass,
          timePerOrange: ranking.timePerOrange,
          totalTime: ranking.totalTime,
          date: ranking.date
        });
      }

      localStorage.setItem('supabase_migration_completed', 'true');
      console.log('Local storage data migrated successfully');
    } catch (error) {
      console.error('Error migrating local storage data:', error);
    }
  }
}
