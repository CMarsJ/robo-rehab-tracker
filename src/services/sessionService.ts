import { supabase } from '@/integrations/supabase/client';
import { Session, GameScore, TherapySessionData, GameSessionData } from '@/types/database';

export class SessionService {
  private static async getUserId(): Promise<string | null> {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
      console.error('No authenticated user found:', error);
      return null;
    }
    return data.user.id;
  }

  // Save therapy session data (timer mode)
  static async saveTherapyData(data: TherapySessionData): Promise<Session | null> {
    try {
      const userId = await this.getUserId();
      if (!userId) return null;

      const sessionData = {
        user_id: userId,
        therapy_type: data.therapy_type,
        mode: 'timer' as const,
        tipo_actividad: data.therapy_type,
        duracion_minutos: data.duration_ms ? Math.round(data.duration_ms / 60000) : 0,
        estado: data.ended_at ? 'completed' : 'active',
        // Timer metrics
        fastest_opening: this.roundToDecimals(data.timer.fastest_opening),
        fastest_closing: this.roundToDecimals(data.timer.fastest_closing),
        average_opening: this.roundToDecimals(data.timer.average_opening),
        average_closing: this.roundToDecimals(data.timer.average_closing),
        opening_times: data.timer.opening_times?.map(t => this.roundToDecimals(t)),
        closing_times: data.timer.closing_times?.map(t => this.roundToDecimals(t)),
        attempts_count: data.timer.attempts_count,
        best_open_time: this.roundToDecimals(data.timer.best_open_time),
        best_close_time: this.roundToDecimals(data.timer.best_close_time),
        avg_close_time: this.roundToDecimals(data.timer.avg_close_time),
        avg_open_time: this.roundToDecimals(data.timer.avg_open_time),
        // Audit fields
        started_at: data.started_at,
        ended_at: data.ended_at,
        duration_ms: data.duration_ms,
        fecha_inicio: data.started_at,
        created_at: new Date().toISOString()
      };

      const { data: result, error } = await supabase
        .from('sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) throw error;
      return result as Session;
    } catch (error) {
      console.error('Error saving therapy data:', error);
      return null;
    }
  }

  // Save game session data (game mode)
  static async saveGameSession(data: GameSessionData): Promise<Session | null> {
    try {
      const userId = await this.getUserId();
      if (!userId) return null;

      const sessionData = {
        user_id: userId,
        game_type: data.game_type,
        mode: 'game' as const,
        tipo_actividad: data.game_type,
        duracion_minutos: data.duration_ms ? Math.round(data.duration_ms / 60000) : 0,
        estado: data.ended_at ? 'completed' : 'active',
        // Timer metrics (optional for games)
        fastest_opening: this.roundToDecimals(data.timer_metrics?.fastest_opening),
        fastest_closing: this.roundToDecimals(data.timer_metrics?.fastest_closing),
        average_opening: this.roundToDecimals(data.timer_metrics?.average_opening),
        average_closing: this.roundToDecimals(data.timer_metrics?.average_closing),
        opening_times: data.timer_metrics?.opening_times?.map(t => this.roundToDecimals(t)),
        closing_times: data.timer_metrics?.closing_times?.map(t => this.roundToDecimals(t)),
        attempts_count: data.timer_metrics?.attempts_count,
        best_open_time: this.roundToDecimals(data.timer_metrics?.best_open_time),
        best_close_time: this.roundToDecimals(data.timer_metrics?.best_close_time),
        avg_close_time: this.roundToDecimals(data.timer_metrics?.avg_close_time),
        avg_open_time: this.roundToDecimals(data.timer_metrics?.avg_open_time),
        // Game metrics
        metrics: data.metrics,
        // Audit fields
        started_at: data.started_at,
        ended_at: data.ended_at,
        duration_ms: data.duration_ms,
        fecha_inicio: data.started_at,
        created_at: new Date().toISOString()
      };

      const { data: result, error } = await supabase
        .from('sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) throw error;
      return result as Session;
    } catch (error) {
      console.error('Error saving game session:', error);
      return null;
    }
  }

  // Get top 5 rankings by game type
  static async getTop5ByGame(gameType: string): Promise<GameScore[]> {
    try {
      const { data, error } = await supabase
        .from('v_top5_rankings')
        .select('*')
        .eq('game_type', gameType)
        .order('rn', { ascending: true });

      if (error) throw error;
      return (data || []) as GameScore[];
    } catch (error) {
      console.error('Error fetching rankings:', error);
      return [];
    }
  }

  // Get user sessions with pagination and filters
  static async getUserSessions({
    pageSize = 20,
    page = 1,
    filters = {}
  }: {
    pageSize?: number;
    page?: number;
    filters?: {
      therapy_type?: string;
      game_type?: string;
      mode?: 'timer' | 'game';
      date_from?: string;
      date_to?: string;
      search?: string;
    };
  } = {}): Promise<{ sessions: Session[]; totalCount: number; hasMore: boolean }> {
    try {
      const userId = await this.getUserId();
      if (!userId) return { sessions: [], totalCount: 0, hasMore: false };

      let query = supabase
        .from('sessions')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.therapy_type) {
        query = query.eq('therapy_type', filters.therapy_type);
      }
      if (filters.game_type) {
        query = query.eq('game_type', filters.game_type);
      }
      if (filters.mode) {
        query = query.eq('mode', filters.mode);
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      const totalCount = count || 0;
      const hasMore = totalCount > page * pageSize;

      return {
        sessions: (data || []) as Session[],
        totalCount,
        hasMore
      };
    } catch (error) {
      console.error('Error fetching user sessions:', error);
      return { sessions: [], totalCount: 0, hasMore: false };
    }
  }

  // Update session (for ending sessions)
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

  // Helper function to round numbers to 3 decimal places
  private static roundToDecimals(value?: number, decimals = 3): number | undefined {
    if (value === undefined || value === null) return undefined;
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  // Helper function to normalize arrays (ensure all values are numbers and rounded)
  private static normalizeArray(arr?: number[]): number[] | undefined {
    if (!Array.isArray(arr)) return undefined;
    return arr.map(val => this.roundToDecimals(val) || 0);
  }
}