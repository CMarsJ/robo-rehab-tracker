import { supabase } from '@/integrations/supabase/client';
import { Session} from '@/types/database';

export class SessionService {
  static async createSession(sessionData: Partial<Session>): Promise<Session | null> {
    try {
      const { data: userData, error: authError } = await supabase.auth.getUser();
      if (authError || !userData.user) {
        console.error('No hay usuario autenticado:', authError);
        return null;
      }

      const supabaseData = {
        user_id: userData.user.id,
        therapy_type: sessionData.tipo_actividad || 'therapy',
        duration: sessionData.duracion_minutos || 15,
        state: sessionData.estado || 'active'
      };

      const { data, error } = await supabase
        .from('sessions')
        .insert(supabaseData)
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

  static async updateSessionWithTherapyData(
    sessionId: string, 
    therapyData: {
      state: 'completed' | 'cancelled';
      duration: number;
      score?: number;
      orange_used?: number;
      juice_used?: number;
      stats?: any;
      details?: any;
      extra_data?: any;
    }
  ): Promise<boolean> {
    try {
      const updateData: any = {
        state: therapyData.state,
        duration: therapyData.duration,
      };

      // Solo agregar campos si tienen datos
      if (therapyData.score !== undefined) updateData.score = therapyData.score;
      if (therapyData.orange_used !== undefined) updateData.orange_used = therapyData.orange_used;
      if (therapyData.juice_used !== undefined) updateData.juice_used = therapyData.juice_used;
      if (therapyData.stats) updateData.stats = therapyData.stats;
      if (therapyData.details) updateData.details = therapyData.details;
      if (therapyData.extra_data) updateData.extra_data = therapyData.extra_data;

      const { error } = await supabase
        .from('sessions')
        .update(updateData)
        .eq('id', sessionId);

      if (error) {
        console.error('Error updating session with therapy data:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating session with therapy data:', error);
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

  static async saveTherapyData(sessionId: string, data: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          extra_data: data
        })
        .eq('id', sessionId);

      return !error;
    } catch (error) {
      console.error('Error saving therapy data:', error);
      return false;
    }
  }

  static async getTop5ByGame(gameType: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('rankings')
        .select('*')
        .eq('game_type', gameType)
        .order('score', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching top 5:', error);
      return [];
    }
  }
}