import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, subWeeks, subMonths, eachDayOfInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

// Hand metrics extracted from a single session
interface SessionHandMetrics {
  opening: { all_times: number[]; attempts: number; average_time_ms: number | null; fastest_time_ms: number | null };
  closing: { all_times: number[]; attempts: number; average_time_ms: number | null; fastest_time_ms: number | null };
}

// ── Daily adherence entry ──
export interface DailyAdherenceEntry {
  date: Date;
  dayLabel: string;   // "L", "M", etc.
  dateLabel: number;   // day of month
  completed: boolean;
}

// ── Therapy trend entry for pie chart ──
export interface TherapyTrendEntry {
  name: string;
  count: number;
  percent: number;
  color: string;
}

// ── New unified report data model ──

export interface RehabReportData {
  periodLabel: string;
  periodType: 'weekly' | 'monthly';
  periodStart: string;
  periodEnd: string;

  // §1 Resumen del Período
  summary: {
    totalScheduled: number;
    totalCompleted: number;
    totalCancelled: number;
    adherencePercent: number;
    adherenceLevel: 'adecuada' | 'moderada' | 'baja';
  };

  // §1 daily adherence mini calendar
  dailyAdherence: DailyAdherenceEntry[];

  // §2 Tendencias en los Tipos de Terapia (replaces old §2 + §3)
  therapyTrends: {
    entries: TherapyTrendEntry[];
    analysis: string;
    volumeByHand: {
      rightHand: { totalSessions: number; totalTimeMin: number };
      leftHand: { totalSessions: number; totalTimeMin: number };
    };
  };

  // §3 Indicadores Temporales Promedio (was §4)
  avgIndicators: {
    rightHand: { avgOpeningSec: number; avgClosingSec: number };
    leftHand: { avgOpeningSec: number; avgClosingSec: number };
    analysis: string;
  };

  // §4 Mejor Desempeño (was §5)
  bestPerformance: {
    rightHand: { bestOpeningSec: number | null; bestOpeningDate: string | null; bestClosingSec: number | null; bestClosingDate: string | null };
    leftHand: { bestOpeningSec: number | null; bestOpeningDate: string | null; bestClosingSec: number | null; bestClosingDate: string | null };
  };

  // §5 Sesiones Canceladas (was §6)
  cancelledAnalysis: {
    total: number;
    percent: number;
    distribution: string;
  };

  // §6 Índice Global de Rendimiento (was §7)
  performanceIndex: {
    rightHand: number;
    leftHand: number;
  };

  // §7 Conclusión automática (was §8)
  conclusion: string;
}

// ── Keep legacy interfaces for backward compat ──
export interface WeeklyReportData extends RehabReportData {}
export interface MonthlyReportData extends RehabReportData {}

// ── Helpers ──

const THERAPY_LABELS: Record<string, string> = {
  'terapia_guiada': 'Terapia Guiada',
  'orange-squeeze': 'Orange Squeeze',
  'flappy_bird': 'RehabBird',
  'neurolink': 'NeuroDefense',
  'therapy': 'Terapia',
};

const THERAPY_COLORS: Record<string, string> = {
  'terapia_guiada': 'hsl(210, 70%, 50%)',
  'orange-squeeze': 'hsl(30, 90%, 55%)',
  'flappy_bird': 'hsl(140, 60%, 45%)',
  'neurolink': 'hsl(270, 60%, 55%)',
  'therapy': 'hsl(0, 60%, 55%)',
};

function extractHandMetrics(stats: any): { right: SessionHandMetrics | null; left: SessionHandMetrics | null } {
  if (!stats?.hand_metrics) return { right: null, left: null };

  const hm = stats.hand_metrics;

  if (hm.right_hand || hm.left_hand) {
    return {
      right: hm.right_hand ?? null,
      left: hm.left_hand ?? null,
    };
  }

  if (hm.opening || hm.closing) {
    return {
      right: { opening: hm.opening ?? { all_times: [], attempts: 0, average_time_ms: null, fastest_time_ms: null }, closing: hm.closing ?? { all_times: [], attempts: 0, average_time_ms: null, fastest_time_ms: null } },
      left: null,
    };
  }

  return { right: null, left: null };
}

function adherenceLevel(pct: number): 'adecuada' | 'moderada' | 'baja' {
  if (pct >= 80) return 'adecuada';
  if (pct >= 60) return 'moderada';
  return 'baja';
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function buildReport(sessions: any[], periodLabel: string, periodType: 'weekly' | 'monthly', periodStart: Date, periodEnd: Date): RehabReportData {
  const completed = sessions.filter(s => s.state === 'completed');
  const cancelled = sessions.filter(s => s.state === 'cancelled');
  const total = sessions.length;
  const adherencePct = total > 0 ? round2((completed.length / total) * 100) : 0;

  // Daily adherence mini calendar
  const allDays = eachDayOfInterval({ start: periodStart, end: periodEnd });
  const dailyAdherence: DailyAdherenceEntry[] = allDays.map(day => {
    const hasSession = completed.some(s => s.start_time && isSameDay(new Date(s.start_time), day));
    return {
      date: day,
      dayLabel: format(day, 'EEEEE', { locale: es }).toUpperCase(),
      dateLabel: day.getDate(),
      completed: hasSession,
    };
  });

  // Therapy type distribution for pie chart
  const typeCounts: Record<string, number> = {};
  completed.forEach(s => {
    const t = s.therapy_type || 'therapy';
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });
  const totalCompleted = completed.length;
  const trendEntries: TherapyTrendEntry[] = Object.entries(typeCounts).map(([key, count]) => ({
    name: THERAPY_LABELS[key] || key,
    count,
    percent: totalCompleted > 0 ? round2((count / totalCompleted) * 100) : 0,
    color: THERAPY_COLORS[key] || 'hsl(200, 50%, 50%)',
  })).sort((a, b) => b.count - a.count);

  // Trend analysis
  let trendAnalysis = 'Sin datos suficientes para análisis.';
  if (trendEntries.length > 0) {
    const top = trendEntries[0];
    if (top.percent > 60) {
      trendAnalysis = `Predominio de ${top.name} (${top.percent}%) → se recomienda diversificar las modalidades de terapia.`;
    } else {
      trendAnalysis = `Distribución equilibrada entre modalidades de terapia.`;
    }
  }

  // Volume accumulators
  let rightTotalTime = 0;
  let leftTotalTime = 0;
  let rightSessionCount = 0;
  let leftSessionCount = 0;

  const rightOpeningTimes: number[] = [];
  const rightClosingTimes: number[] = [];
  const leftOpeningTimes: number[] = [];
  const leftClosingTimes: number[] = [];

  let bestRightOpening: { val: number; date: string } | null = null;
  let bestRightClosing: { val: number; date: string } | null = null;
  let bestLeftOpening: { val: number; date: string } | null = null;
  let bestLeftClosing: { val: number; date: string } | null = null;

  sessions.forEach(session => {
    const { right, left } = extractHandMetrics(session.stats);
    const dateStr = session.start_time ? format(new Date(session.start_time), 'dd/MM/yyyy') : '';

    if (right) {
      if (right.opening?.attempts > 0 || right.closing?.attempts > 0) {
        rightSessionCount++;
        rightTotalTime += session.duration || 0;
      }

      if (right.opening?.all_times) rightOpeningTimes.push(...right.opening.all_times);
      if (right.closing?.all_times) rightClosingTimes.push(...right.closing.all_times);

      if (right.opening?.fastest_time_ms != null) {
        if (!bestRightOpening || right.opening.fastest_time_ms < bestRightOpening.val) {
          bestRightOpening = { val: right.opening.fastest_time_ms, date: dateStr };
        }
      }
      if (right.closing?.fastest_time_ms != null) {
        if (!bestRightClosing || right.closing.fastest_time_ms < bestRightClosing.val) {
          bestRightClosing = { val: right.closing.fastest_time_ms, date: dateStr };
        }
      }
    }

    if (left) {
      if (left.opening?.attempts > 0 || left.closing?.attempts > 0) {
        leftSessionCount++;
        leftTotalTime += session.duration || 0;
      }

      if (left.opening?.all_times) leftOpeningTimes.push(...left.opening.all_times);
      if (left.closing?.all_times) leftClosingTimes.push(...left.closing.all_times);

      if (left.opening?.fastest_time_ms != null) {
        if (!bestLeftOpening || left.opening.fastest_time_ms < bestLeftOpening.val) {
          bestLeftOpening = { val: left.opening.fastest_time_ms, date: dateStr };
        }
      }
      if (left.closing?.fastest_time_ms != null) {
        if (!bestLeftClosing || left.closing.fastest_time_ms < bestLeftClosing.val) {
          bestLeftClosing = { val: left.closing.fastest_time_ms, date: dateStr };
        }
      }
    }
  });

  // Averages (ms → s)
  const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length / 1000 : 0;
  const rAvgOpen = round2(avg(rightOpeningTimes));
  const rAvgClose = round2(avg(rightClosingTimes));
  const lAvgOpen = round2(avg(leftOpeningTimes));
  const lAvgClose = round2(avg(leftClosingTimes));

  // Interpretation
  const analyses: string[] = [];
  if (rAvgOpen > 0 && rAvgClose > 0) {
    const diffR = Math.abs(rAvgOpen - rAvgClose) / Math.max(rAvgOpen, rAvgClose) * 100;
    if (rAvgOpen > rAvgClose && diffR > 30) analyses.push('Mano derecha: apertura > cierre por más de 30% → posible dificultad en activación extensora.');
    if (rAvgClose > rAvgOpen && diffR > 30) analyses.push('Mano derecha: cierre > apertura por más de 30% → posible lentitud flexora.');
  }
  if (lAvgOpen > 0 && lAvgClose > 0) {
    const diffL = Math.abs(lAvgOpen - lAvgClose) / Math.max(lAvgOpen, lAvgClose) * 100;
    if (lAvgOpen > lAvgClose && diffL > 30) analyses.push('Mano izquierda: apertura > cierre por más de 30% → posible dificultad en activación extensora.');
    if (lAvgClose > lAvgOpen && diffL > 30) analyses.push('Mano izquierda: cierre > apertura por más de 30% → posible lentitud flexora.');
  }
  if (rAvgOpen > 0 && lAvgOpen > 0) {
    const avgR = (rAvgOpen + rAvgClose) / 2;
    const avgL = (lAvgOpen + lAvgClose) / 2;
    const interHandDiff = Math.abs(avgR - avgL) / Math.max(avgR, avgL) * 100;
    if (interHandDiff > 25) analyses.push('Diferencia entre manos > 25% → asimetría funcional relevante.');
  }
  const avgAnalysis = analyses.length > 0 ? analyses.join(' ') : 'Sin diferencias significativas detectadas.';

  // Cancelled distribution
  let cancelDist = 'N/A';
  if (cancelled.length > 0 && sessions.length > 1) {
    const sorted = [...sessions].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    const third = Math.ceil(sorted.length / 3);
    const firstThird = sorted.slice(0, third).filter(s => s.state === 'cancelled').length;
    const midThird = sorted.slice(third, third * 2).filter(s => s.state === 'cancelled').length;
    const lastThird = sorted.slice(third * 2).filter(s => s.state === 'cancelled').length;
    const max = Math.max(firstThird, midThird, lastThird);
    if (max === firstThird) cancelDist = 'Concentradas al inicio del periodo';
    else if (max === midThird) cancelDist = 'Concentradas en la mitad del periodo';
    else cancelDist = 'Concentradas al final del periodo';
  }

  // Performance index
  const perfRight = rAvgOpen > 0 || rAvgClose > 0 ? round2((rAvgOpen + rAvgClose) / 2) : 0;
  const perfLeft = lAvgOpen > 0 || lAvgClose > 0 ? round2((lAvgOpen + lAvgClose) / 2) : 0;

  // Conclusion
  const conclusionParts: string[] = [];
  conclusionParts.push(`Durante el periodo evaluado se registró una adherencia del ${adherencePct}%.`);
  if (trendEntries.length > 0) {
    const top = trendEntries[0];
    conclusionParts.push(`Con predominio de ${top.name} (${top.percent}%).`);
  }
  if (rAvgOpen > 0 && lAvgOpen > 0) {
    const faster = rAvgOpen < lAvgOpen ? 'derecha' : 'izquierda';
    conclusionParts.push(`La mano ${faster === 'derecha' ? 'izquierda' : 'derecha'} presentó mayor tiempo promedio de apertura en comparación con la ${faster} (${Math.max(rAvgOpen, lAvgOpen).toFixed(1)} s vs ${Math.min(rAvgOpen, lAvgOpen).toFixed(1)} s).`);
  }
  if (bestRightClosing) {
    conclusionParts.push(`Se observa mejor desempeño de cierre en mano derecha el día ${bestRightClosing.date} con ${(bestRightClosing.val / 1000).toFixed(2)} s.`);
  }

  return {
    periodLabel,
    periodType,
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    summary: {
      totalScheduled: total,
      totalCompleted: completed.length,
      totalCancelled: cancelled.length,
      adherencePercent: adherencePct,
      adherenceLevel: adherenceLevel(adherencePct),
    },
    dailyAdherence,
    therapyTrends: {
      entries: trendEntries,
      analysis: trendAnalysis,
      volumeByHand: {
        rightHand: { totalSessions: rightSessionCount, totalTimeMin: rightTotalTime },
        leftHand: { totalSessions: leftSessionCount, totalTimeMin: leftTotalTime },
      },
    },
    avgIndicators: {
      rightHand: { avgOpeningSec: rAvgOpen, avgClosingSec: rAvgClose },
      leftHand: { avgOpeningSec: lAvgOpen, avgClosingSec: lAvgClose },
      analysis: avgAnalysis,
    },
    bestPerformance: {
      rightHand: {
        bestOpeningSec: bestRightOpening ? round2(bestRightOpening.val / 1000) : null,
        bestOpeningDate: bestRightOpening?.date ?? null,
        bestClosingSec: bestRightClosing ? round2(bestRightClosing.val / 1000) : null,
        bestClosingDate: bestRightClosing?.date ?? null,
      },
      leftHand: {
        bestOpeningSec: bestLeftOpening ? round2(bestLeftOpening.val / 1000) : null,
        bestOpeningDate: bestLeftOpening?.date ?? null,
        bestClosingSec: bestLeftClosing ? round2(bestLeftClosing.val / 1000) : null,
        bestClosingDate: bestLeftClosing?.date ?? null,
      },
    },
    cancelledAnalysis: {
      total: cancelled.length,
      percent: total > 0 ? round2((cancelled.length / total) * 100) : 0,
      distribution: cancelDist,
    },
    performanceIndex: {
      rightHand: perfRight,
      leftHand: perfLeft,
    },
    conclusion: conclusionParts.join(' '),
  };
}

// ── Public API ──

export class ReportService {
  static async getWeeklyReport(weeksAgo: number = 1): Promise<WeeklyReportData | null> {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return null;

      const targetDate = subWeeks(new Date(), weeksAgo);
      const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(targetDate, { weekStartsOn: 1 });

      const { data: sessions, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.data.user.id)
        .gte('start_time', weekStart.toISOString())
        .lte('start_time', weekEnd.toISOString())
        .order('start_time', { ascending: true });

      if (error) throw error;
      if (!sessions || sessions.length === 0) return null;

      const label = `${format(weekStart, "dd 'de' MMMM", { locale: es })} – ${format(weekEnd, "dd 'de' MMMM yyyy", { locale: es })}`;
      return buildReport(sessions, label, 'weekly', weekStart, weekEnd);
    } catch (error) {
      console.error('Error getting weekly report:', error);
      return null;
    }
  }

  static async getMonthlyReport(monthsAgo: number = 1): Promise<MonthlyReportData | null> {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return null;

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
      if (!sessions || sessions.length === 0) return null;

      const label = format(targetDate, "MMMM yyyy", { locale: es });
      return buildReport(sessions, label, 'monthly', monthStart, monthEnd);
    } catch (error) {
      console.error('Error getting monthly report:', error);
      return null;
    }
  }
}
