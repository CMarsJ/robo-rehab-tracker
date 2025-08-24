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
  extra_date: any; // ✅ corregido
}

export class SessionService {
  ...

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
        stats: sessionData.stats || {},
        details: sessionData.details || {},
        extra_date: sessionData.extra_date || null // ✅ corregido
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

  static async updateSessionWithTherapyData(sessionId: string, therapyData: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          state: therapyData.state,
          score: therapyData.score,
          orange_used: therapyData.orange_used,
          juice_used: therapyData.juice_used,
          stats: therapyData.stats,
          details: therapyData.details,
          extra_date: therapyData.extra_date // ✅ corregido
        })
        .eq('id', sessionId);

      if (error) {
        console.error('Error al actualizar datos de terapia:', error);
        return false;
      }

      console.log('Datos de terapia actualizados correctamente ✅');
      return true;
    } catch (error) {
      console.error('Error en updateSessionWithTherapyData:', error);
      return false;
    }
  }
}
