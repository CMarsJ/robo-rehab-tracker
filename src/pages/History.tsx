import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Calendar, Trophy, Clock, Activity, Brain, Target } from 'lucide-react';
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

  // Therapy types we want to show in history
  const therapyTypes = ['terapia_guiada', 'orange-squeeze', 'neurolink'];

  // Redirect if not authenticated
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
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

  const formatTime = (seconds?: number) => {
    if (!seconds || !isFinite(seconds)) return '-';
    return `${seconds.toFixed(2)}s`;
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
        return 'Juego de Naranjas';
      case 'neurolink':
        return 'NeuroLink';
      case 'terapia_guiada':
        return 'Terapia Guiada';
      default:
        return 'Sesión de Terapia';
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
        return 'Completada';
      case 'cancelled':
        return 'Cancelada';
      case 'active':
        return 'Activa';
      default:
        return 'Desconocido';
    }
  };

  const renderSessionSummary = (session: SessionResponse) => {
    const { therapy_type, stats, score, orange_used, juice_used } = session;

    if (therapy_type === 'orange-squeeze') {
      return (
        <div className="mt-4 p-4 bg-orange-50 rounded-lg">
          <h4 className="font-semibold mb-3 text-orange-800 flex items-center gap-2">
            🍊 Resumen del Juego de Naranjas
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {orange_used || 0}
              </div>
              <div className="text-orange-700">Naranjas exprimidas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {juice_used || 0}
              </div>
              <div className="text-blue-700">Vasos completados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {score || 0}
              </div>
              <div className="text-green-700">Puntuación</div>
            </div>
          </div>
          
          {stats && (
            <div className="mt-3 text-sm text-orange-700">
              {stats.hand_metrics && (
                <div className="grid grid-cols-2 gap-2">
                  <div>Mejor tiempo apertura: {formatTime(stats.hand_metrics.opening?.best_time)}</div>
                  <div>Mejor tiempo cierre: {formatTime(stats.hand_metrics.closing?.best_time)}</div>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    if (therapy_type === 'neurolink') {
      return (
        <div className="mt-4 p-4 bg-purple-50 rounded-lg">
          <h4 className="font-semibold mb-3 text-purple-800 flex items-center gap-2">
            🎯 Resumen de NeuroLink
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {score || 0}
              </div>
              <div className="text-purple-700">Puntuación final</div>
            </div>
            {stats?.game_metrics && (
              <>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.game_metrics.level || 0}
                  </div>
                  <div className="text-blue-700">Nivel alcanzado</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.game_metrics.accuracy || 0}%
                  </div>
                  <div className="text-green-700">Precisión</div>
                </div>
              </>
            )}
          </div>
        </div>
      );
    }

    if (therapy_type === 'terapia_guiada') {
      return (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold mb-3 text-blue-800 flex items-center gap-2">
            🧠 Resumen de Terapia Guiada
          </h4>
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {stats.fastestOpening && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatTime(stats.fastestOpening)}
                  </div>
                  <div className="text-blue-700">Mejor apertura</div>
                </div>
              )}
              {stats.fastestClosing && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatTime(stats.fastestClosing)}
                  </div>
                  <div className="text-green-700">Mejor cierre</div>
                </div>
              )}
              {stats.averageOpening && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatTime(stats.averageOpening)}
                  </div>
                  <div className="text-purple-700">Promedio apertura</div>
                </div>
              )}
              {stats.averageClosing && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {formatTime(stats.averageClosing)}
                  </div>
                  <div className="text-orange-700">Promedio cierre</div>
                </div>
              )}
              {stats.attempts_count && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-pink-600">
                    {stats.attempts_count}
                  </div>
                  <div className="text-pink-700">Intentos totales</div>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  if (loading || loadingData) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">{t.history}</h1>
          <p className="text-muted-foreground">Cargando historial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">{t.history}</h1>
        <p className="text-muted-foreground">
          Historial cronológico de tus sesiones de rehabilitación
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
            <h3 className="text-lg font-semibold mb-2">No hay sesiones registradas</h3>
            <p className="text-muted-foreground">
              Completa tu primera sesión de terapia o entrenamiento para ver tu historial aquí.
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