import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { FileText, Calendar, Trophy, Clock, Activity, Brain, Target, Eye, EyeOff, Filter, X, Gamepad2 } from 'lucide-react';
import { useTranslation } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { SessionService, SessionResponse } from '@/services/sessionService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const History = () => {
  const t = useTranslation();
  const { user, loading } = useAuth();
  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<SessionResponse[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({});

  // Filter states
  const [selectedTherapyTypes, setSelectedTherapyTypes] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [durationMin, setDurationMin] = useState<string>('');
  const [durationMax, setDurationMax] = useState<string>('');
  const [showFilters, setShowFilters] = useState(true);

  // Therapy types we want to show in history
  const therapyTypes = ['terapia_guiada', 'orange-squeeze', 'neurolink', 'flappy-bird', 'flappy_bird'];

  // Hook MUST be called before any conditional returns
  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user]);

  // Apply filters when sessions or filters change
  useEffect(() => {
    applyFilters();
  }, [sessions, selectedTherapyTypes, dateFrom, dateTo, durationMin, durationMax]);

  const applyFilters = () => {
    let filtered = [...sessions];

    // Filter by therapy type
    if (selectedTherapyTypes.length > 0) {
      filtered = filtered.filter(session => selectedTherapyTypes.includes(session.therapy_type));
    }

    // Filter by date range
    if (dateFrom) {
      filtered = filtered.filter(session => {
        const sessionDate = new Date(session.start_time);
        return sessionDate >= dateFrom;
      });
    }
    if (dateTo) {
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      filtered = filtered.filter(session => {
        const sessionDate = new Date(session.start_time);
        return sessionDate <= endOfDay;
      });
    }

    // Filter by duration range (in minutes)
    const minDuration = durationMin ? parseInt(durationMin, 10) : null;
    const maxDuration = durationMax ? parseInt(durationMax, 10) : null;
    
    if (minDuration !== null && !isNaN(minDuration)) {
      filtered = filtered.filter(session => session.duration >= minDuration);
    }
    if (maxDuration !== null && !isNaN(maxDuration)) {
      filtered = filtered.filter(session => session.duration <= maxDuration);
    }

    setFilteredSessions(filtered);
  };

  const clearFilters = () => {
    setSelectedTherapyTypes([]);
    setDateFrom(undefined);
    setDateTo(undefined);
    setDurationMin('');
    setDurationMax('');
  };

  const hasActiveFilters = selectedTherapyTypes.length > 0 || dateFrom || dateTo || durationMin || durationMax;

  const toggleTherapyType = (type: string) => {
    setSelectedTherapyTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  // Redirect if not authenticated
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">{t.history}</h1>
          <p className="text-muted-foreground">{t.loadingHistory}</p>
        </div>
      </div>
    );
  }

  const fetchSessions = async (loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoadingData(true);
      }
      setError(null);

      const offset = loadMore ? sessions.length : 0;
      const limit = 10;

      const newSessions = await SessionService.getUserSessions(limit, offset, therapyTypes);
      
      if (loadMore) {
        setSessions(prev => [...prev, ...newSessions]);
      } else {
        setSessions(newSessions);
      }

      // If we received less than the limit, there are no more sessions
      setHasMore(newSessions.length >= limit);
    } catch (err: any) {
      setError(err.message || 'Error al cargar las sesiones');
    } finally {
      setLoadingData(false);
      setLoadingMore(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (ms?: number) => {
    if (!ms || !isFinite(ms)) return '-';
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const toggleExpanded = (sessionId: string) => {
    setExpandedSessions(prev => ({
      ...prev,
      [sessionId]: !prev[sessionId]
    }));
  };

  const getSessionIcon = (therapyType: string) => {
    switch (therapyType) {
      case 'orange-squeeze':
        return <Trophy className="w-6 h-6 text-orange-500" />;
      case 'neurolink':
        return <Target className="w-6 h-6 text-purple-500" />;
      case 'terapia_guiada':
        return <Brain className="w-6 h-6 text-blue-500" />;
      case 'flappy-bird':
        return <Gamepad2 className="w-6 h-6 text-green-500" />;
      default:
        return <Activity className="w-6 h-6 text-gray-500" />;
    }
  };

  const getSessionTitle = (therapyType: string) => {
    switch (therapyType) {
      case 'orange-squeeze':
        return t.orangeGameTitle;
      case 'neurolink':
        return t.neuroLinkTitle;
      case 'terapia_guiada':
        return t.guidedTherapyTitle;
      case 'flappy-bird':
        return 'Flappy Bird';
      default:
        return t.therapySession;
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'active':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStateText = (state: string) => {
    switch (state) {
      case 'completed':
        return t.completedStatus;
      case 'cancelled':
        return t.cancelled;
      case 'active':
        return t.activeSession;
      default:
        return t.unknown;
    }
  };

  const buildAttemptsTable = (stats: any, hand: 'right_hand' | 'left_hand' = 'right_hand') => {
    if (!stats?.hand_metrics) return [];
    const handData = stats.hand_metrics[hand];
    if (!handData) return [];

    const openingTimes = handData.opening?.all_times || [];
    const closingTimes = handData.closing?.all_times || [];
    const maxLength = Math.max(openingTimes.length, closingTimes.length);

    const attempts = [];
    for (let i = 0; i < maxLength; i++) {
      const opening = openingTimes[i] || null;
      const closing = closingTimes[i] || null;
      const total = (opening && closing) ? opening + closing : null;
      attempts.push({ number: i + 1, opening, closing, total });
    }
    return attempts;
  };

  const getHandMetrics = (stats: any, hand: 'right_hand' | 'left_hand') => {
    const h = stats?.hand_metrics?.[hand];
    if (!h) return null;
    return {
      openingAvg: h.opening?.average_time_ms,
      closingAvg: h.closing?.average_time_ms,
      openingBest: h.opening?.fastest_time_ms,
      closingBest: h.closing?.fastest_time_ms,
      openingCount: h.opening?.attempts || 0,
      closingCount: h.closing?.attempts || 0,
    };
  };

  const renderHandAttemptsTable = (
    session: SessionResponse,
    hand: 'right_hand' | 'left_hand',
    colorScheme: { bg: string; thead: string; btn: string; label: string },
    handLabel: string
  ) => {
    const attempts = buildAttemptsTable(session.stats, hand);
    if (attempts.length === 0) return null;

    const expandKey = `${session.id}-${hand}`;
    const isExpanded = expandedSessions[expandKey];
    const visibleAttempts = isExpanded ? attempts : attempts.slice(0, 3);

    return (
      <div className="mt-3">
        <h5 className={`text-sm font-medium mb-2 ${colorScheme.label}`}>{handLabel} — {attempts.length} intentos</h5>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className={colorScheme.thead}>
              <tr>
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">{t.opening}</th>
                <th className="px-3 py-2 text-left">{t.closing}</th>
                <th className="px-3 py-2 text-left">{t.total}</th>
              </tr>
            </thead>
            <tbody>
              {visibleAttempts.map((attempt) => (
                <tr key={attempt.number} className="border-t border-border">
                  <td className="px-3 py-2">{attempt.number}</td>
                  <td className="px-3 py-2">{formatTime(attempt.opening)}</td>
                  <td className="px-3 py-2">{formatTime(attempt.closing)}</td>
                  <td className="px-3 py-2 font-medium">{formatTime(attempt.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {attempts.length > 3 && (
          <div className="mt-2 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandedSessions(prev => ({ ...prev, [expandKey]: !prev[expandKey] }))}
              className={colorScheme.btn}
            >
              {isExpanded ? (
                <><EyeOff className="w-4 h-4 mr-1" /> {t.viewLess}</>
              ) : (
                <><Eye className="w-4 h-4 mr-1" /> {t.viewMore} (+{attempts.length - 3})</>
              )}
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderHandSummaryCards = (metrics: ReturnType<typeof getHandMetrics>, handLabel: string, colorClass: string) => {
    if (!metrics) return null;
    return (
      <div className="space-y-1">
        <h5 className={`text-xs font-semibold uppercase tracking-wide ${colorClass}`}>{handLabel}</h5>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-white/60 dark:bg-gray-800/60 rounded-md p-2 text-center">
            <div className="font-bold text-foreground">{formatTime(metrics.openingBest)}</div>
            <div className="text-muted-foreground">Mejor apertura</div>
          </div>
          <div className="bg-white/60 dark:bg-gray-800/60 rounded-md p-2 text-center">
            <div className="font-bold text-foreground">{formatTime(metrics.closingBest)}</div>
            <div className="text-muted-foreground">Mejor cierre</div>
          </div>
          <div className="bg-white/60 dark:bg-gray-800/60 rounded-md p-2 text-center">
            <div className="font-bold text-foreground">{formatTime(metrics.openingAvg)}</div>
            <div className="text-muted-foreground">Prom. apertura</div>
          </div>
          <div className="bg-white/60 dark:bg-gray-800/60 rounded-md p-2 text-center">
            <div className="font-bold text-foreground">{formatTime(metrics.closingAvg)}</div>
            <div className="text-muted-foreground">Prom. cierre</div>
          </div>
        </div>
      </div>
    );
  };

  const renderSessionSummary = (session: SessionResponse) => {
    const { therapy_type, stats, score, orange_used, juice_used, duration } = session;

    const rightMetrics = getHandMetrics(stats, 'right_hand');
    const leftMetrics = getHandMetrics(stats, 'left_hand');
    const hasRightData = rightMetrics && (rightMetrics.openingCount > 0 || rightMetrics.closingCount > 0);
    const hasLeftData = leftMetrics && (leftMetrics.openingCount > 0 || leftMetrics.closingCount > 0);

    // --- TERAPIA GUIADA ---
    if (therapy_type === 'terapia_guiada') {
      const maxROM = stats?.current_hand_state?.right_hand?.angles?.finger1 
        ?? stats?.current_hand_state?.left_hand?.angles?.finger1 
        ?? null;

      return (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg space-y-4">
          <h4 className="font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-2">
            <Brain className="w-5 h-5" />
            {t.guidedTherapySummary}
          </h4>

          {/* Always-visible summary metrics */}
          <div className={`grid gap-4 ${hasLeftData && hasRightData ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
            {hasRightData && renderHandSummaryCards(rightMetrics, 'Mano Derecha', 'text-blue-600 dark:text-blue-400')}
            {hasLeftData && renderHandSummaryCards(leftMetrics, 'Mano Izquierda', 'text-green-600 dark:text-green-400')}
          </div>

          {/* ROM indicator */}
          {maxROM !== null && (
            <div className="flex items-center gap-2 text-sm">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">ROM máximo (MCP):</span>
              <span className="font-semibold text-foreground">{typeof maxROM === 'number' ? `${maxROM.toFixed(1)}°` : '-'}</span>
            </div>
          )}

          {/* Bilateral symmetry */}
          {hasRightData && hasLeftData && rightMetrics && leftMetrics && (
            <div className="p-3 bg-white/60 dark:bg-gray-800/60 rounded-md text-sm">
              <h5 className="font-medium mb-1 text-foreground">Simetría bilateral</h5>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>Apertura: D {formatTime(rightMetrics.openingAvg)} / I {formatTime(leftMetrics.openingAvg)}</div>
                <div>Cierre: D {formatTime(rightMetrics.closingAvg)} / I {formatTime(leftMetrics.closingAvg)}</div>
              </div>
            </div>
          )}

          {/* Expandable attempts tables */}
          {hasRightData && renderHandAttemptsTable(session, 'right_hand',
            { bg: 'bg-blue-50', thead: 'bg-blue-100 dark:bg-blue-900/30', btn: 'text-blue-600 dark:text-blue-400', label: 'text-blue-700 dark:text-blue-300' },
            'Mano Derecha'
          )}
          {hasLeftData && renderHandAttemptsTable(session, 'left_hand',
            { bg: 'bg-green-50', thead: 'bg-green-100 dark:bg-green-900/30', btn: 'text-green-600 dark:text-green-400', label: 'text-green-700 dark:text-green-300' },
            'Mano Izquierda'
          )}
        </div>
      );
    }

    // --- ORANGE SQUEEZE ---
    if (therapy_type === 'orange-squeeze') {
      // Calculate efficiency: time per orange
      const durationSec = (duration || 0) * 60;
      const timePerOrange = orange_used && orange_used > 0 ? (durationSec / orange_used) : null;

      return (
        <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg space-y-4">
          <h4 className="font-semibold text-orange-800 dark:text-orange-300 flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            {t.orangeGameSummary}
          </h4>
          
          {/* Volume & score metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="text-center bg-white/60 dark:bg-gray-800/60 rounded-md p-3">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{orange_used || 0}</div>
              <div className="text-muted-foreground text-xs">{t.squeezedOranges}</div>
            </div>
            <div className="text-center bg-white/60 dark:bg-gray-800/60 rounded-md p-3">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{juice_used || 0}</div>
              <div className="text-muted-foreground text-xs">{t.completedGlasses}</div>
            </div>
            <div className="text-center bg-white/60 dark:bg-gray-800/60 rounded-md p-3">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{score || 0}</div>
              <div className="text-muted-foreground text-xs">{t.finalScore}</div>
            </div>
            <div className="text-center bg-white/60 dark:bg-gray-800/60 rounded-md p-3">
              <div className="text-2xl font-bold text-foreground">{timePerOrange ? `${timePerOrange.toFixed(1)}s` : '-'}</div>
              <div className="text-muted-foreground text-xs">Tiempo/naranja</div>
            </div>
          </div>

          {/* Always-visible hand summary */}
          <div className={`grid gap-4 ${hasLeftData && hasRightData ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
            {hasRightData && renderHandSummaryCards(rightMetrics, 'Mano Derecha', 'text-orange-600 dark:text-orange-400')}
            {hasLeftData && renderHandSummaryCards(leftMetrics, 'Mano Izquierda', 'text-yellow-600 dark:text-yellow-400')}
          </div>

          {/* Expandable attempts tables */}
          {hasRightData && renderHandAttemptsTable(session, 'right_hand',
            { bg: 'bg-orange-50', thead: 'bg-orange-100 dark:bg-orange-900/30', btn: 'text-orange-600 dark:text-orange-400', label: 'text-orange-700 dark:text-orange-300' },
            'Mano Derecha'
          )}
          {hasLeftData && renderHandAttemptsTable(session, 'left_hand',
            { bg: 'bg-yellow-50', thead: 'bg-yellow-100 dark:bg-yellow-900/30', btn: 'text-yellow-600 dark:text-yellow-400', label: 'text-yellow-700 dark:text-yellow-300' },
            'Mano Izquierda'
          )}
        </div>
      );
    }

    // --- NEUROLINK ---
    if (therapy_type === 'neurolink') {
      const gameDurationSec = stats?.duration || (duration || 0) * 60;
      const totalScore = stats?.enemies_defeated ?? score ?? 0;
      const pointsPerSecond = gameDurationSec > 0 ? (totalScore / gameDurationSec) : 0;

      return (
        <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg space-y-4">
          <h4 className="font-semibold text-purple-800 dark:text-purple-300 flex items-center gap-2">
            <Target className="w-5 h-5" />
            {t.neuroLinkSummary}
          </h4>
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center bg-white/60 dark:bg-gray-800/60 rounded-md p-3">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{totalScore}</div>
              <div className="text-muted-foreground text-xs">Puntuación total</div>
            </div>
            <div className="text-center bg-white/60 dark:bg-gray-800/60 rounded-md p-3">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {pointsPerSecond.toFixed(2)}
              </div>
              <div className="text-muted-foreground text-xs">Puntos/segundo</div>
            </div>
            <div className="text-center bg-white/60 dark:bg-gray-800/60 rounded-md p-3">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {gameDurationSec > 0 ? `${Math.round(gameDurationSec)}s` : '-'}
              </div>
              <div className="text-muted-foreground text-xs">Duración juego</div>
            </div>
          </div>
        </div>
      );
    }

    // --- FLAPPY BIRD ---
    if (therapy_type === 'flappy-bird' || therapy_type === 'flappy_bird') {
      const gameScore = stats?.score ?? score ?? 0;
      const gameTimeSec = stats?.gameTime || (duration || 0) * 60;
      const pointsPerMinute = gameTimeSec > 0 ? (gameScore / gameTimeSec) * 60 : 0;

      return (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg space-y-4">
          <h4 className="font-semibold text-green-800 dark:text-green-300 flex items-center gap-2">
            <Gamepad2 className="w-5 h-5" />
            Flappy Bird — Resumen
          </h4>
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center bg-white/60 dark:bg-gray-800/60 rounded-md p-3">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{gameScore}</div>
              <div className="text-muted-foreground text-xs">Puntuación total</div>
            </div>
            <div className="text-center bg-white/60 dark:bg-gray-800/60 rounded-md p-3">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {pointsPerMinute.toFixed(1)}
              </div>
              <div className="text-muted-foreground text-xs">Puntos/minuto</div>
            </div>
            <div className="text-center bg-white/60 dark:bg-gray-800/60 rounded-md p-3">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {gameTimeSec > 0 ? `${(gameTimeSec / 60).toFixed(1)} min` : '-'}
              </div>
              <div className="text-muted-foreground text-xs">Duración juego</div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  if (loadingData) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">{t.history}</h1>
          <p className="text-muted-foreground">{t.loadingHistory}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">{t.history}</h1>
        <p className="text-muted-foreground">
          {t.historyDescription}
        </p>
      </div>

      {/* Filters Panel */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Filtros</CardTitle>
              {hasActiveFilters && (
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                  Activos
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Ocultar' : 'Mostrar'}
            </Button>
          </div>
        </CardHeader>
        
        {showFilters && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Therapy Type Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Tipo de terapia</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="filter-guided"
                      checked={selectedTherapyTypes.includes('terapia_guiada')}
                      onCheckedChange={() => toggleTherapyType('terapia_guiada')}
                    />
                    <label htmlFor="filter-guided" className="text-sm flex items-center gap-2 cursor-pointer">
                      <Brain className="w-4 h-4 text-blue-500" />
                      {t.guidedTherapyTitle}
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="filter-orange"
                      checked={selectedTherapyTypes.includes('orange-squeeze')}
                      onCheckedChange={() => toggleTherapyType('orange-squeeze')}
                    />
                    <label htmlFor="filter-orange" className="text-sm flex items-center gap-2 cursor-pointer">
                      <Trophy className="w-4 h-4 text-orange-500" />
                      {t.orangeGameTitle}
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="filter-neurolink"
                      checked={selectedTherapyTypes.includes('neurolink')}
                      onCheckedChange={() => toggleTherapyType('neurolink')}
                    />
                    <label htmlFor="filter-neurolink" className="text-sm flex items-center gap-2 cursor-pointer">
                      <Target className="w-4 h-4 text-purple-500" />
                      {t.neuroLinkTitle}
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="filter-flappy"
                      checked={selectedTherapyTypes.includes('flappy-bird')}
                      onCheckedChange={() => toggleTherapyType('flappy-bird')}
                    />
                    <label htmlFor="filter-flappy" className="text-sm flex items-center gap-2 cursor-pointer">
                      <Gamepad2 className="w-4 h-4 text-green-500" />
                      Flappy Bird
                    </label>
                  </div>
                </div>
              </div>

              {/* Date From */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Desde</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateFrom && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "PPP", { locale: es }) : 'Seleccionar fecha'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50 bg-background" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date To */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Hasta</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateTo && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "PPP", { locale: es }) : 'Seleccionar fecha'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50 bg-background" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Duration Range Filter */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Duración mínima (minutos)</Label>
                <Input
                  type="number"
                  placeholder="Min"
                  value={durationMin}
                  onChange={(e) => setDurationMin(e.target.value)}
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Duración máxima (minutos)</Label>
                <Input
                  type="number"
                  placeholder="Max"
                  value={durationMax}
                  onChange={(e) => setDurationMax(e.target.value)}
                  min="0"
                />
              </div>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2">
                  <X className="w-4 h-4" />
                  Limpiar filtros
                </Button>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results count */}
      {hasActiveFilters && (
        <div className="text-sm text-muted-foreground">
          Mostrando {filteredSessions.length} de {sessions.length} sesiones
        </div>
      )}

      {filteredSessions.length === 0 && !loadingData ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            {hasActiveFilters ? (
              <>
                <h3 className="text-lg font-semibold mb-2">No se encontraron resultados</h3>
                <p className="text-muted-foreground">
                  No hay sesiones que coincidan con los filtros seleccionados.
                </p>
                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  className="mt-4"
                >
                  <X className="w-4 h-4 mr-2" />
                  Limpiar filtros
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-2">{t.noSessionsRecorded}</h3>
                <p className="text-muted-foreground">
                  {t.completeFirstSession}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4">
            {filteredSessions.map((session) => (
              <Card key={session.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        {getSessionIcon(session.therapy_type)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {getSessionTitle(session.therapy_type)}
                        </h3>
                        <p className="text-muted-foreground">
                          <Clock className="w-4 h-4 inline mr-1" />
                          {session.duration} minutos
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(session.start_time)}
                          </span>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium",
                            getStateColor(session.state)
                          )}>
                            {getStateText(session.state)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {renderSessionSummary(session)}
                </CardContent>
              </Card>
            ))}
          </div>

          {hasMore && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={() => fetchSessions(true)}
                disabled={loadingMore}
              >
                {loadingMore ? 'Cargando...' : 'Cargar más sesiones'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default History;
