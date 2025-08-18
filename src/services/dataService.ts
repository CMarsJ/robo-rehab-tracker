
import { supabase } from '@/integrations/supabase/client';
import { TherapyRecord, GameRecord, Ranking, Session, EffortDataPoint } from '@/types/database';

export class DataService {
  // Session management
  static async createSession(
    tipo_actividad: string, 
    duracion_minutos: number, 
    metrics?: Record<string, any>
  ): Promise<Session | null> {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          tipo_actividad,
          duracion_minutos,
          estado: 'active',
          metrics: metrics || {}
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  }

  static async updateSession(sessionId: string, updates: Partial<Session>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sessions')
        .update(updates)
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
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }
  }

  // Therapy records
  static async createTherapyRecord(
    sessionId: string,
    effortData: EffortDataPoint[],
    metrics?: Partial<TherapyRecord>
  ): Promise<TherapyRecord | null> {
    try {
      const { data, error } = await supabase
        .from('therapy_records')
        .insert({
          session_id: sessionId,
          effort_data: effortData,
          ...metrics
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating therapy record:', error);
      return null;
    }
  }

  // Game records
  static async createGameRecord(
    sessionId: string,
    gameType: string,
    gameData: Partial<GameRecord>
  ): Promise<GameRecord | null> {
    try {
      const { data, error } = await supabase
        .from('game_records')
        .insert({
          session_id: sessionId,
          game_type: gameType,
          ...gameData
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating game record:', error);
      return null;
    }
  }

  static async getGameRecords(gameType?: string, limit = 10): Promise<GameRecord[]> {
    try {
      let query = supabase
        .from('game_records')
        .select(`
          *,
          sessions!inner(fecha_inicio, duracion_minutos)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (gameType) {
        query = query.eq('game_type', gameType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
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
      // First try to update existing ranking
      const { data: existing } = await supabase
        .from('rankings')
        .select('*')
        .eq('game_type', gameType)
        .single();

      if (existing && existing.score < score) {
        const { error } = await supabase
          .from('rankings')
          .update({
            score,
            details: details || {},
            calculated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        return !error;
      } else if (!existing) {
        const { error } = await supabase
          .from('rankings')
          .insert({
            game_type: gameType,
            score,
            details: details || {}
          });

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
      return (data || []).map((ranking, index) => ({
        ...ranking,
        position: index + 1
      }));
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
