import { supabase } from '@/integrations/supabase/client';

export interface Achievement {
  id: string;
  user_id: string;
  period_type: 'weekly' | 'monthly';
  period_start: string;
  period_end: string;
  sessions_completed: number;
  sessions_target: number;
  total_duration_minutes: number;
  streak_days: number;
  best_closing_time_ms: number | null;
  best_opening_time_ms: number | null;
  total_repetitions: number;
}

// Helper: get Monday of the current week
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Helper: get 1st of current month
function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export class AchievementService {
  private static async getUserId(): Promise<string | null> {
    const { data } = await supabase.auth.getUser();
    return data?.user?.id || null;
  }

  /** Fetch or create the current week/month achievement record */
  static async getOrCreate(periodType: 'weekly' | 'monthly'): Promise<Achievement | null> {
    const userId = await this.getUserId();
    if (!userId) return null;

    const now = new Date();
    const start = periodType === 'weekly' ? getWeekStart(now) : getMonthStart(now);
    const end = periodType === 'weekly' ? addDays(start, 6) : endOfMonth(now);
    const startStr = formatDate(start);

    // Try to fetch existing
    const { data, error } = await (supabase as any)
      .from('achievements')
      .select('*')
      .eq('user_id', userId)
      .eq('period_type', periodType)
      .eq('period_start', startStr)
      .maybeSingle();

    if (error) {
      console.error('Error fetching achievement:', error);
      return null;
    }

    if (data) return data as Achievement;

    // Create new
    const target = periodType === 'weekly' ? 7 : (endOfMonth(now).getDate());
    const { data: created, error: insertError } = await (supabase as any)
      .from('achievements')
      .insert({
        user_id: userId,
        period_type: periodType,
        period_start: startStr,
        period_end: formatDate(end),
        sessions_target: target,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating achievement:', insertError);
      return null;
    }

    return created as Achievement;
  }

  /** Fetch both weekly and monthly achievements */
  static async getCurrentAchievements(): Promise<{ weekly: Achievement | null; monthly: Achievement | null }> {
    const [weekly, monthly] = await Promise.all([
      this.getOrCreate('weekly'),
      this.getOrCreate('monthly'),
    ]);
    return { weekly, monthly };
  }

  /** Recalculate achievements from sessions data for the current period */
  static async recalculateFromSessions(periodType: 'weekly' | 'monthly'): Promise<Achievement | null> {
    const userId = await this.getUserId();
    if (!userId) return null;

    const now = new Date();
    const start = periodType === 'weekly' ? getWeekStart(now) : getMonthStart(now);
    const end = periodType === 'weekly' ? addDays(start, 6) : endOfMonth(now);

    // Fetch completed sessions in this period
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('state', 'completed')
      .gte('start_time', start.toISOString())
      .lte('start_time', addDays(end, 1).toISOString());

    if (error) {
      console.error('Error fetching sessions for achievements:', error);
      return null;
    }

    // Calculate metrics
    const sessionsCompleted = sessions?.length || 0;
    let totalDuration = 0;
    let bestClosing: number | null = null;
    let bestOpening: number | null = null;
    let totalReps = 0;

    // Track unique days with sessions for streak
    const daysWithSessions = new Set<string>();

    for (const session of (sessions || [])) {
      totalDuration += (session.duration || 0);

      const startTime = session.start_time ? new Date(session.start_time) : null;
      if (startTime) {
        daysWithSessions.add(formatDate(startTime));
      }

      const stats = session.stats as any;
      if (stats?.hand_metrics) {
        // Right hand
        const rightClosing = stats.hand_metrics.right_hand?.closing?.fastest_time_ms;
        const rightOpening = stats.hand_metrics.right_hand?.opening?.fastest_time_ms;
        const rightReps = stats.hand_metrics.right_hand?.closing?.attempts || 0;

        if (rightClosing && (bestClosing === null || rightClosing < bestClosing)) {
          bestClosing = rightClosing;
        }
        if (rightOpening && (bestOpening === null || rightOpening < bestOpening)) {
          bestOpening = rightOpening;
        }
        totalReps += rightReps;
      }
    }

    // Calculate streak (consecutive days from period start)
    let streak = 0;
    const checkDate = new Date(start);
    while (checkDate <= now && checkDate <= end) {
      if (daysWithSessions.has(formatDate(checkDate))) {
        streak++;
      } else {
        break;
      }
      checkDate.setDate(checkDate.getDate() + 1);
    }

    // Upsert achievement
    const achievement = await this.getOrCreate(periodType);
    if (!achievement) return null;

    const { data: updated, error: updateError } = await (supabase as any)
      .from('achievements')
      .update({
        sessions_completed: sessionsCompleted,
        total_duration_minutes: Math.round(totalDuration),
        streak_days: streak,
        best_closing_time_ms: bestClosing,
        best_opening_time_ms: bestOpening,
        total_repetitions: totalReps,
      })
      .eq('id', achievement.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating achievement:', updateError);
      return null;
    }

    return updated as Achievement;
  }

  /** Recalculate both weekly and monthly */
  static async recalculateAll(): Promise<{ weekly: Achievement | null; monthly: Achievement | null }> {
    const [weekly, monthly] = await Promise.all([
      this.recalculateFromSessions('weekly'),
      this.recalculateFromSessions('monthly'),
    ]);
    return { weekly, monthly };
  }

  /** Get daily completion map for the current period (for calendar view) */
  static async getDailyCompletionMap(periodType: 'weekly' | 'monthly'): Promise<Map<string, boolean>> {
    const userId = await this.getUserId();
    const map = new Map<string, boolean>();
    if (!userId) return map;

    const now = new Date();
    const start = periodType === 'weekly' ? getWeekStart(now) : getMonthStart(now);
    const end = periodType === 'weekly' ? addDays(start, 6) : endOfMonth(now);

    const { data: sessions } = await supabase
      .from('sessions')
      .select('start_time')
      .eq('user_id', userId)
      .eq('state', 'completed')
      .gte('start_time', start.toISOString())
      .lte('start_time', addDays(end, 1).toISOString());

    const daysWithSessions = new Set<string>();
    for (const s of (sessions || [])) {
      if (s.start_time) daysWithSessions.add(formatDate(new Date(s.start_time)));
    }

    const cursor = new Date(start);
    while (cursor <= end) {
      const key = formatDate(cursor);
      map.set(key, daysWithSessions.has(key));
      cursor.setDate(cursor.getDate() + 1);
    }

    return map;
  }
}
