import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, Trophy, XCircle, RefreshCw } from 'lucide-react';
import { AchievementService, Achievement } from '@/services/achievementService';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export const AchievementsProgress = () => {
  const { user } = useAuth();
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  const [weekly, setWeekly] = useState<Achievement | null>(null);
  const [monthly, setMonthly] = useState<Achievement | null>(null);
  const [dailyMap, setDailyMap] = useState<Map<string, boolean>>(new Map());
  const [loading, setLoading] = useState(true);

  const loadAchievements = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [achievements, weekMap] = await Promise.all([
        AchievementService.recalculateAll(),
        AchievementService.getDailyCompletionMap('weekly'),
      ]);
      setWeekly(achievements.weekly);
      setMonthly(achievements.monthly);
      setDailyMap(weekMap);
    } catch (e) {
      console.error('Error loading achievements:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  // Expose refresh function globally so TherapyTimer can trigger it
  useEffect(() => {
    (window as any).refreshAchievements = loadAchievements;
    return () => { delete (window as any).refreshAchievements; };
  }, [loadAchievements]);

  // Build week days from daily map
  const weekDays = (() => {
    const days: { day: string; dateStr: string; date: number; completed: boolean; isToday: boolean; isPast: boolean }[] = [];
    const dayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    const today = new Date();
    
    // Get Monday of current week
    const d = new Date(today);
    const dayOfWeek = d.getDay();
    const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const current = new Date(d);
      current.setDate(d.getDate() + i);
      const dateStr = current.toISOString().split('T')[0];
      days.push({
        day: dayLabels[i],
        dateStr,
        date: current.getDate(),
        completed: dailyMap.get(dateStr) || false,
        isToday: current.toDateString() === today.toDateString(),
        isPast: current < today && current.toDateString() !== today.toDateString(),
      });
    }
    return days;
  })();

  const weeklyCompleted = weekly?.sessions_completed || 0;
  const weeklyTarget = weekly?.sessions_target || 7;
  const monthlyCompleted = monthly?.sessions_completed || 0;
  const monthlyTarget = monthly?.sessions_target || 30;
  const streak = weekly?.streak_days || 0;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Logros de {currentMonth}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={loadAchievements} disabled={loading} className="h-8 w-8 p-0">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Weekly Progress */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">
              Progreso semanal
            </span>
            <span className="text-sm font-bold text-primary">
              {weeklyCompleted}/{weeklyTarget} días
            </span>
          </div>

          <div className="flex gap-2 mb-3">
            {weekDays.map((day, index) => (
              <div key={index} className="flex-1 text-center">
                <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-medium mb-1 transition-all duration-300 ${
                  day.completed
                    ? 'bg-green-500 text-white'
                    : day.isToday
                      ? 'bg-primary text-primary-foreground'
                      : day.isPast
                        ? 'bg-destructive/20 text-destructive'
                        : 'bg-muted text-muted-foreground'
                }`}>
                  {day.completed ? <CheckCircle className="w-4 h-4" /> :
                   day.isToday ? <Clock className="w-4 h-4" /> :
                   day.isPast ? <XCircle className="w-3.5 h-3.5" /> :
                   day.day}
                </div>
                <div className="text-xs text-muted-foreground">{day.date}</div>
              </div>
            ))}
          </div>

          {streak > 0 && (
            <div className="text-xs text-center mb-2 text-orange-500 font-medium">
              🔥 Racha: {streak} {streak === 1 ? 'día' : 'días'} consecutivos
            </div>
          )}

          <Progress value={(weeklyCompleted / weeklyTarget) * 100} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {Math.round((weeklyCompleted / weeklyTarget) * 100)}% completado esta semana
          </p>
        </div>

        {/* Monthly Progress */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">
              Progreso mensual
            </span>
            <span className="text-sm font-bold text-accent-foreground">
              {monthlyCompleted}/{monthlyTarget} días
            </span>
          </div>

          <Progress
            value={(monthlyCompleted / monthlyTarget) * 100}
            className="h-2 mb-1"
          />
          <p className="text-xs text-muted-foreground">
            {Math.round((monthlyCompleted / monthlyTarget) * 100)}% completado este mes
          </p>
        </div>

        {/* Best times summary */}
        {(weekly?.best_closing_time_ms || weekly?.best_opening_time_ms) && (
          <div className="border-t border-border pt-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">Mejores tiempos esta semana</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {weekly.best_closing_time_ms && (
                <div className="bg-muted/50 rounded p-2 text-center">
                  <span className="block text-muted-foreground">✊ Cierre</span>
                  <span className="font-bold text-foreground">{(weekly.best_closing_time_ms / 1000).toFixed(2)}s</span>
                </div>
              )}
              {weekly.best_opening_time_ms && (
                <div className="bg-muted/50 rounded p-2 text-center">
                  <span className="block text-muted-foreground">🖐️ Apertura</span>
                  <span className="font-bold text-foreground">{(weekly.best_opening_time_ms / 1000).toFixed(2)}s</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
