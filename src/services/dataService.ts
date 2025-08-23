
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
