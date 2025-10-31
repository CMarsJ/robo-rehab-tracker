import { supabase } from '@/integrations/supabase/client';
import { SessionResponse } from './sessionService';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, subWeeks, subMonths } from 'date-fns';

export interface WeeklyReportData {
  totalTherapyTime: number; // en minutos
  sessionsByType: Record<string, { count: number; totalTime: number; averageTime: number }>;
  totalSessions: number;
  dailyProgress: { day: string; sessions: number; time: number }[];
  achievements: {
    bestScore: number;
    totalOranges: number;
    improvementRate: number;
  };
}

export interface MonthlyReportData {
  totalTherapyTime: number;
  sessionsByType: Record<string, { count: number; totalTime: number; averageTime: number }>;
  totalSessions: number;
  weeklyProgress: { week: string; sessions: number; time: number }[];
  achievements: {
    bestScore: number;
    totalOranges: number;
    improvementRate: number;
  };
}

export class ReportService {
  static async getWeeklyReport(weeksAgo: number = 1): Promise<WeeklyReportData | null> {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return null;

      // Restar las semanas indicadas desde hoy
      const targetDate = subWeeks(new Date(), weeksAgo);
      const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 }); // Lunes
      const weekEnd = endOfWeek(targetDate, { weekStartsOn: 1 }); // Domingo

      const { data: sessions, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.data.user.id)
        .gte('start_time', weekStart.toISOString())
        .lte('start_time', weekEnd.toISOString())
        .order('start_time', { ascending: true });

      if (error) throw error;
      if (!sessions || sessions.length === 0) {
        return {
          totalTherapyTime: 0,
          sessionsByType: {},
          totalSessions: 0,
          dailyProgress: [],
          achievements: {
            bestScore: 0,
            totalOranges: 0,
            improvementRate: 0,
          },
        };
      }

      // Calcular tiempo total
      const totalTherapyTime = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);

      // Agrupar por tipo de terapia
      const sessionsByType: Record<string, { count: number; totalTime: number; averageTime: number }> = {};
      sessions.forEach((session) => {
        const type = session.therapy_type;
        if (!sessionsByType[type]) {
          sessionsByType[type] = { count: 0, totalTime: 0, averageTime: 0 };
        }
        sessionsByType[type].count++;
        sessionsByType[type].totalTime += session.duration || 0;
      });

      // Calcular promedios
      Object.keys(sessionsByType).forEach((type) => {
        sessionsByType[type].averageTime = 
          sessionsByType[type].totalTime / sessionsByType[type].count;
      });

      // Progreso diario
      const dailyProgress: { day: string; sessions: number; time: number }[] = [];
      for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
        const dayStr = format(d, 'yyyy-MM-dd');
        const daySessions = sessions.filter(s => 
          format(new Date(s.start_time), 'yyyy-MM-dd') === dayStr
        );
        dailyProgress.push({
          day: format(d, 'EEE'),
          sessions: daySessions.length,
          time: daySessions.reduce((sum, s) => sum + (s.duration || 0), 0),
        });
      }

      // Logros
      const scores = sessions.map(s => s.score || 0).filter(s => s > 0);
      const bestScore = scores.length > 0 ? Math.max(...scores) : 0;
      const totalOranges = sessions.reduce((sum, s) => {
        try {
          const stats = s.stats as any;
          const oranges = stats?.game_metrics?.total_oranges || 0;
          return sum + oranges;
        } catch {
          return sum;
        }
      }, 0);

      return {
        totalTherapyTime,
        sessionsByType,
        totalSessions: sessions.length,
        dailyProgress,
        achievements: {
          bestScore,
          totalOranges,
          improvementRate: 0, // Se puede calcular comparando con semana anterior
        },
      };
    } catch (error) {
      console.error('Error getting weekly report:', error);
      return null;
    }
  }

  static async getMonthlyReport(monthsAgo: number = 1): Promise<MonthlyReportData | null> {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return null;

      // Restar los meses indicados desde hoy
      const targetDate = subMonths(new Date(), monthsAgo);
      const monthStart = startOfMonth(targetDate);
      const monthEnd = endOfMonth(targetDate);

      const { data: sessions, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.data.user.id)
        .gte('start_time', monthStart.toISOString())
        .lte('start_time', monthEnd.toISOString())
        .order('start_time', { ascending: true });

      if (error) throw error;
      if (!sessions || sessions.length === 0) {
        return {
          totalTherapyTime: 0,
          sessionsByType: {},
          totalSessions: 0,
          weeklyProgress: [],
          achievements: {
            bestScore: 0,
            totalOranges: 0,
            improvementRate: 0,
          },
        };
      }

      // Calcular tiempo total
      const totalTherapyTime = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);

      // Agrupar por tipo de terapia
      const sessionsByType: Record<string, { count: number; totalTime: number; averageTime: number }> = {};
      sessions.forEach((session) => {
        const type = session.therapy_type;
        if (!sessionsByType[type]) {
          sessionsByType[type] = { count: 0, totalTime: 0, averageTime: 0 };
        }
        sessionsByType[type].count++;
        sessionsByType[type].totalTime += session.duration || 0;
      });

      // Calcular promedios
      Object.keys(sessionsByType).forEach((type) => {
        sessionsByType[type].averageTime = 
          sessionsByType[type].totalTime / sessionsByType[type].count;
      });

      // Progreso semanal (agrupar por semana)
      const weeklyProgress: { week: string; sessions: number; time: number }[] = [];
      const weeksInMonth = new Map<string, { sessions: number; time: number }>();
      
      sessions.forEach((session) => {
        const sessionDate = new Date(session.start_time);
        const weekStart = startOfWeek(sessionDate, { weekStartsOn: 1 });
        const weekKey = format(weekStart, 'dd/MM');
        
        if (!weeksInMonth.has(weekKey)) {
          weeksInMonth.set(weekKey, { sessions: 0, time: 0 });
        }
        
        const weekData = weeksInMonth.get(weekKey)!;
        weekData.sessions++;
        weekData.time += session.duration || 0;
      });

      weeksInMonth.forEach((data, week) => {
        weeklyProgress.push({
          week: `Sem ${week}`,
          sessions: data.sessions,
          time: data.time,
        });
      });

      // Logros
      const scores = sessions.map(s => s.score || 0).filter(s => s > 0);
      const bestScore = scores.length > 0 ? Math.max(...scores) : 0;
      const totalOranges = sessions.reduce((sum, s) => {
        try {
          const stats = s.stats as any;
          const oranges = stats?.game_metrics?.total_oranges || 0;
          return sum + oranges;
        } catch {
          return sum;
        }
      }, 0);

      return {
        totalTherapyTime,
        sessionsByType,
        totalSessions: sessions.length,
        weeklyProgress,
        achievements: {
          bestScore,
          totalOranges,
          improvementRate: 0,
        },
      };
    } catch (error) {
      console.error('Error getting monthly report:', error);
      return null;
    }
  }
}
