import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Calendar, Trophy, Clock, Activity, Brain, Target, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { SessionService, SessionResponse } from '@/services/sessionService';

const History = () => {
  const t = useTranslation();
  const { user, loading } = useAuth();
  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({});

  // Therapy types we want to show in history
  const therapyTypes = ['terapia_guiada', 'orange-squeeze', 'neurolink'];

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

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user]);

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

  const buildAttemptsTable = (stats: any) => {
    if (!stats?.hand_metrics) return [];

    const openingTimes = stats.hand_metrics.opening?.all_times || [];
    const closingTimes = stats.hand_metrics.closing?.all_times || [];
    const maxLength = Math.max(openingTimes.length, closingTimes.length);

    const attempts = [];
    for (let i = 0; i < maxLength; i++) {
      const opening = openingTimes[i] || null;
      const closing = closingTimes[i] || null;
      const total = (opening && closing) ? opening + closing : null;
      
      attempts.push({
        number: i + 1,
        opening: opening,
        closing: closing, 
        total: total
      });
    }

    return attempts;
  };

  const renderSessionSummary = (session: SessionResponse) => {
    const { therapy_type, stats, score, orange_used, juice_used } = session;
    const isExpanded = expandedSessions[session.id];
    const attempts = buildAttemptsTable(stats);
    const visibleAttempts = isExpanded ? attempts : attempts.slice(0, 3);

    if (therapy_type === 'terapia_guiada') {
      const openingAvg = stats?.hand_metrics?.opening?.average_time_ms;
      const closingAvg = stats?.hand_metrics?.closing?.average_time_ms;
      const totalMovements = attempts.length;

      return (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <h4 className="font-semibold mb-3 text-blue-800 dark:text-blue-300 flex items-center gap-2">
            <Brain className="w-5 h-5" />
            {t.guidedTherapySummary}
          </h4>
          
          {/* 3 datos principales arriba */}
          <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
            <div className="text-center bg-white/60 dark:bg-gray-800/60 rounded-md p-3">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatTime(openingAvg)}
              </div>
              <div className="text-blue-700 dark:text-blue-300">{t.averageOpening}</div>
            </div>
            <div className="text-center bg-white/60 dark:bg-gray-800/60 rounded-md p-3">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatTime(closingAvg)}
              </div>
              <div className="text-green-700 dark:text-green-300">{t.averageClosing}</div>
            </div>
            <div className="text-center bg-white/60 dark:bg-gray-800/60 rounded-md p-3">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {totalMovements}
              </div>
              <div className="text-purple-700 dark:text-purple-300">{t.movements}</div>
            </div>
          </div>

          {/* Tabla de intentos */}
          {attempts.length > 0 && (
            <div className="mt-4">
              <div className="overflow-x-auto rounded-lg border dark:border-gray-700">
                <table className="w-full text-sm">
                  <thead className="bg-blue-100 dark:bg-blue-900/30">
                    <tr>
                      <th className="px-3 py-2 text-left">#</th>
                      <th className="px-3 py-2 text-left">{t.opening}</th>
                      <th className="px-3 py-2 text-left">{t.closing}</th>
                      <th className="px-3 py-2 text-left">{t.total}</th>
                    </tr>
                  </thead>
...
              {attempts.length > 3 && (
                <div className="mt-2 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(session.id)}
                    className="text-blue-600 dark:text-blue-400"
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
          )}
        </div>
      );
    }

    if (therapy_type === 'orange-squeeze') {
      return (
        <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
          <h4 className="font-semibold mb-3 text-orange-800 dark:text-orange-300 flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            {t.orangeGameSummary}
          </h4>
          
          <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
            <div className="text-center bg-white/60 dark:bg-gray-800/60 rounded-md p-3">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {orange_used || 0}
              </div>
              <div className="text-orange-700 dark:text-orange-300">{t.squeezedOranges}</div>
            </div>
            <div className="text-center bg-white/60 dark:bg-gray-800/60 rounded-md p-3">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {juice_used || 0}
              </div>
              <div className="text-blue-700 dark:text-blue-300">{t.completedGlasses}</div>
            </div>
            <div className="text-center bg-white/60 dark:bg-gray-800/60 rounded-md p-3">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {score || 0}
              </div>
              <div className="text-green-700 dark:text-green-300">{t.finalScore}</div>
            </div>
          </div>
          
          {/* Tabla de intentos */}
          {attempts.length > 0 && (
            <div className="mt-4">
              <div className="overflow-x-auto rounded-lg border dark:border-gray-700">
                <table className="w-full text-sm">
                  <thead className="bg-orange-100 dark:bg-orange-900/30">
                    <tr>
                      <th className="px-3 py-2 text-left">#</th>
                      <th className="px-3 py-2 text-left">{t.opening}</th>
                      <th className="px-3 py-2 text-left">{t.closing}</th>
                      <th className="px-3 py-2 text-left">{t.total}</th>
                    </tr>
                  </thead>
...
              {attempts.length > 3 && (
                <div className="mt-2 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(session.id)}
                    className="text-orange-600 dark:text-orange-400"
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
          )}
        </div>
      );
    }

    if (therapy_type === 'neurolink') {
      return (
        <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
          <h4 className="font-semibold mb-3 text-purple-800 dark:text-purple-300 flex items-center gap-2">
            <Target className="w-5 h-5" />
            {t.neuroLinkSummary}
          </h4>
          
          <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
            <div className="text-center bg-white/60 dark:bg-gray-800/60 rounded-md p-3">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {score || 0}
              </div>
              <div className="text-purple-700 dark:text-purple-300">{t.finalScore}</div>
            </div>
            {stats?.game_metrics && (
              <>
                <div className="text-center bg-white/60 dark:bg-gray-800/60 rounded-md p-3">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.game_metrics.level || 0}
                  </div>
                  <div className="text-blue-700 dark:text-blue-300">{t.levelReached}</div>
                </div>
                <div className="text-center bg-white/60 dark:bg-gray-800/60 rounded-md p-3">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats.game_metrics.accuracy || 0}%
                  </div>
                  <div className="text-green-700 dark:text-green-300">{t.accuracy}</div>
                </div>
              </>
            )}
          </div>

          {/* Tabla de intentos */}
          {attempts.length > 0 && (
            <div className="mt-4">
              <div className="overflow-x-auto rounded-lg border dark:border-gray-700">
                <table className="w-full text-sm">
                  <thead className="bg-purple-100 dark:bg-purple-900/30">
                    <tr>
                      <th className="px-3 py-2 text-left">#</th>
                      <th className="px-3 py-2 text-left">{t.opening}</th>
                      <th className="px-3 py-2 text-left">{t.closing}</th>
                      <th className="px-3 py-2 text-left">{t.total}</th>
                    </tr>
                  </thead>
...
              {attempts.length > 3 && (
                <div className="mt-2 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(session.id)}
                    className="text-purple-600 dark:text-purple-400"
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
          )}
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

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t.noSessionsRecorded}</h3>
            <p className="text-muted-foreground">
              {t.completeFirstSession}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4">
            {sessions.map((session) => (
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
                          <span className={`px-2 py-1 rounded-full text-xs ${getStateColor(session.state)}`}>
                            {getStateText(session.state)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      {session.score !== undefined && session.score > 0 && (
                        <div className="text-2xl font-bold text-primary">
                          {session.score}
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground">
                        ID: {session.id.slice(0, 8)}...
                      </div>
                    </div>
                  </div>

                  {renderSessionSummary(session)}
                </CardContent>
              </Card>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button 
                onClick={() => fetchSessions(true)}
                disabled={loadingMore}
                variant="outline"
                size="lg"
              >
                {loadingMore ? 'Cargando...' : 'Cargar más sesiones'}
              </Button>
            </div>
          )}

          {!hasMore && sessions.length > 0 && (
            <div className="text-center text-muted-foreground py-4">
              No hay más sesiones para mostrar
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default History;