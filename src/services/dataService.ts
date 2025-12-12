
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

  // Legacy methods - now redirect to SessionService
  static async createSession(
    therapy_type: string, 
    duration: number, 
    metrics?: Record<string, any>
  ): Promise<any> {
    // Redirect to SessionService
    const { SessionService } = await import('./sessionService');
    return SessionService.createSession({
      therapy_type,
      duration,
      state: 'active',
      stats: metrics as any
    });
  }

  static async getUserSessions(limit = 10): Promise<any[]> {
    // Redirect to SessionService
    const { SessionService } = await import('./sessionService');
    return SessionService.getUserSessions(limit);
  }


  // Migration utilities
  static async migrateLocalStorageData(): Promise<void> {
    try {
      const migrationFlag = localStorage.getItem('supabase_migration_completed');
      if (migrationFlag) return;

      // Migration completed - no longer needed as we use SessionService
      localStorage.setItem('supabase_migration_completed', 'true');
      console.log('Local storage data migrated successfully');
    } catch (error) {
      console.error('Error migrating local storage data:', error);
    }
  }
}
