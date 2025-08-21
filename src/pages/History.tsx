import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Eye, Download, Calendar, Trophy, Clock, Activity } from 'lucide-react';
import { useTranslation } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';

interface OrangeRecord {
  game_type?: string;
  total_oranges: number;
  total_glasses: number;
  average_oranges_per_minute: number;
  // Nuevos (asumidos existentes en Supabase)
  best_open_time?: number;
  best_close_time?: number;
  avg_open_time?: number;
  avg_close_time?: number;
  open_times?: number[];   // en segundos
  close_times?: number[];  // en segundos
  attempts_count?: number; // total de pares apertura/cierre
}

interface TherapyRecord {
  // Relación para sesiones tipo "therapy" (asumida)
  best_open_time?: number;
  best_close_time?: number;
  avg_open_time?: number;
  avg_close_time?: number;
  open_times?: number[];   // en segundos
  close_times?: number[];  // en segundos
  attempts_count?: number; // total de pares apertura/cierre
}

interface SessionData {
  id: string;
  tipo_actividad: string;
  fecha_inicio: string;
  duracion_minutos: number;
  estado: string;
  game_records?: OrangeRecord[];
  therapy_records?: TherapyRecord[]; // asumido
}

const History = () => {
  const t = useTranslation();
  const { user, loading } = useAuth();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado para expandir/colapsar tablas por sesión
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});

  // Redirect if not authenticated
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user]);

  const fetchSessions = async () => {
    try {
      setLoadingData(true);
      setError(null);

      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select(`
          id,
          therapy_type,
          start_time,
          duration,
          state
        `)
        .eq('user_id', user!.id)
        .order('start_time', { ascending: false });

      if (sessionsError) {
        throw sessionsError;
      }

      setSessions(sessionsData?.map(session => ({
        id: session.id,
        tipo_actividad: session.therapy_type,
        fecha_inicio: session.start_time,
        duracion_minutos: session.duration,
        estado: session.state
      })) || []);
    } catch (err: any) {
      setError(err.message || 'Error al cargar las sesiones');
    } finally {
      setLoadingData(false);
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

  const sOrDash = (n?: number) => (typeof n === 'number' && isFinite(n) ? `${n.toFixed(2)}s` : '-');

  const getSessionIcon = (tipo: string, gameType?: string) => {
    if (gameType === 'orange_squeeze') return <Trophy className="w-6 h-6 text-orange-600" />;
    if (gameType === 'neurolink') return <Trophy className="w-6 h-6 text-purple-600" />;
    if (gameType === 'flappy_bird') return <Trophy className="w-6 h-6 text-green-600" />;
    return <Activity className="w-6 h-6 text-blue-600" />;
  };

  const getSessionType = (tipo: string, gameType?: string) => {
    if (gameType === 'orange_squeeze') return 'Juego: Naranjas';
    if (gameType === 'neurolink') return 'Juego: NeuroLink';
    if (gameType === 'flappy_bird') return 'Juego: Flappy Bird';
    return 'Terapia';
  };

  // Construir filas de tabla (apertura, cierre, total) para n pares
  const buildRows = (openTimes: number[] = [], closeTimes: number[] = []) => {
    const n = Math.min(openTimes.length, closeTimes.length);
    const rows = [];
    for (let i = 0; i < n; i++) {
      const open = openTimes[i];
      const close = closeTimes[i];
      rows.push({
        open,
        close,
        total: (open ?? 0) + (close ?? 0)
      });
    }
    return rows;
  };

  const toggleExpanded = (id: string) => {
    setExpandedTables(prev => ({ ...prev, [id]: !prev[id] }));
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
        <div className="grid gap-4">
          {sessions.map((session) => {
            const orangeRec = session.game_records?.[0] as OrangeRecord | undefined;
            const gameType = orangeRec?.game_type;

            // Datos para tarjeta superior derecha (reemplazo de emojis)
            const showOrangeTimes = gameType === 'orange_squeeze' && orangeRec;
            const showTherapyTimes = session.tipo_actividad === 'therapy' && session.therapy_records?.[0];

            const therapyRec = (session.therapy_records?.[0] as TherapyRecord | undefined) || undefined;

            // Tabla (naranja)
            const orangeOpen = orangeRec?.open_times ?? [];
            const orangeClose = orangeRec?.close_times ?? [];
            const orangeRows = buildRows(orangeOpen, orangeClose);
            const orangeVisibleRows = expandedTables[session.id] ? orangeRows : orangeRows.slice(0, 1);

            // Tabla (terapia)
            const therapyOpen = therapyRec?.open_times ?? [];
            const therapyClose = therapyRec?.close_times ?? [];
            const therapyRows = buildRows(therapyOpen, therapyClose);
            const therapyBestRow =
              therapyRows.length > 0
                ? therapyRows.reduce((best, r) => (r.total < best.total ? r : best), therapyRows[0])
                : undefined;
            const therapyVisibleRows = expandedTables[`${session.id}-therapy`]
              ? therapyRows
              : therapyBestRow
              ? [therapyBestRow]
              : [];

            // Métricas resumen naranja
            const orangesPerSecond =
              (orangeRec?.average_oranges_per_minute ?? 0) / 60;

            const totalAttemptsFromArrays =
              Math.floor((orangeOpen.length + orangeClose.length) / 2);

            const attemptsCount =
              orangeRec?.attempts_count ?? totalAttemptsFromArrays;

            return (
              <Card key={session.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        {getSessionIcon(session.tipo_actividad, gameType)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {getSessionType(session.tipo_actividad, gameType)}
                        </h3>
                        <p className="text-muted-foreground">
                          <Clock className="w-4 h-4 inline mr-1" />
                          {session.duracion_minutos} minutos
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(session.fecha_inicio)}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              session.estado === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : session.estado === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {session.estado === 'completed'
                              ? 'Completada'
                              : session.estado === 'cancelled'
                              ? 'Cancelada'
                              : 'Activa'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Panel derecho: ahora muestra mejores y promedios */}
                    <div className="text-right space-y-2">
                      {(showOrangeTimes || showTherapyTimes) && (
                        <div className="text-sm text-muted-foreground">
                          <div className="flex items-center gap-2 justify-end">
                            <span>
                              🏁 Mejor apertura:{' '}
                              {sOrDash(
                                showOrangeTimes
                                  ? orangeRec?.best_open_time
                                  : therapyRec?.best_open_time
                              )}
                            </span>
                            <span>
                              | Mejor cierre:{' '}
                              {sOrDash(
                                showOrangeTimes
                                  ? orangeRec?.best_close_time
                                  : therapyRec?.best_close_time
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 justify-end">
                            <span>
                              📊 Prom. apertura:{' '}
                              {sOrDash(
                                showOrangeTimes
                                  ? orangeRec?.avg_open_time
                                  : therapyRec?.avg_open_time
                              )}
                            </span>
                            <span>
                              | Prom. cierre:{' '}
                              {sOrDash(
                                showOrangeTimes
                                  ? orangeRec?.avg_close_time
                                  : therapyRec?.avg_close_time
                              )}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Información de rendimiento según el tipo de sesión */}
                  {orangeRec && gameType === 'orange_squeeze' && (
                    <div className="mt-4 p-4 bg-orange-50 rounded-lg">
                      <h4 className="font-semibold mb-2 text-orange-800">
                        🍊 Resumen del Juego de Naranjas
                      </h4>

                      {/* Grid de KPIs solicitados */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">
                            {orangeRec.total_oranges ?? 0}
                          </div>
                          <div className="text-orange-700">Naranjas totales</div>
                        </div>

                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {orangeRec.total_glasses ?? 0}
                          </div>
                          <div className="text-blue-700">Vasos completados</div>
                        </div>

                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {orangesPerSecond.toFixed(2)}
                          </div>
                          <div className="text-green-700">Naranjas/segundo</div>
                        </div>

                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {session.duracion_minutos}
                          </div>
                          <div className="text-purple-700">Minutos</div>
                        </div>

                        <div className="text-center">
                          <div className="text-2xl font-bold text-pink-600">
                            {attemptsCount}
                          </div>
                          <div className="text-pink-700">
                            Intentos totales (A+C)/2
                          </div>
                        </div>
                      </div>

                      {/* Tabla de resumen (solo primer dato y +) */}
                      <div className="mt-4">
                        <div className="overflow-x-auto rounded-lg border">
                          <table className="w-full text-sm">
                            <thead className="bg-orange-100">
                              <tr>
                                <th className="px-3 py-2 text-left">#</th>
                                <th className="px-3 py-2 text-left">Apertura</th>
                                <th className="px-3 py-2 text-left">Cierre</th>
                                <th className="px-3 py-2 text-left">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {orangeVisibleRows.length === 0 ? (
                                <tr>
                                  <td
                                    colSpan={4}
                                    className="px-3 py-3 text-center text-muted-foreground"
                                  >
                                    No hay intentos registrados
                                  </td>
                                </tr>
                              ) : (
                                orangeVisibleRows.map((r, idx) => (
                                  <tr key={idx} className="border-t">
                                    <td className="px-3 py-2">{idx + 1}</td>
                                    <td className="px-3 py-2">{sOrDash(r.open)}</td>
                                    <td className="px-3 py-2">{sOrDash(r.close)}</td>
                                    <td className="px-3 py-2">{sOrDash(r.total)}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>

                        {orangeRows.length > 1 && (
                          <div className="mt-2 flex justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpanded(session.id)}
                            >
                              {expandedTables[session.id] ? 'Ver menos' : 'Ver más (+)'}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tarjeta modo terapia: mejor y promedios; debajo mejor intento y + */}
                  {session.tipo_actividad === 'therapy' && (
                    <div className="mt-4 p-6 bg-blue-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-4xl mb-3">🧠</div>
                        <h4 className="font-semibold mb-2 text-blue-800">
                          Datos de Terapia
                        </h4>

                        {/* Métricas de tiempos */}
                        {therapyRec ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="bg-white/60 rounded-md p-3">
                              <div className="text-sm text-blue-700 font-semibold mb-1">
                                Mejor tiempos
                              </div>
                              <div className="text-sm">
                                Apertura: {sOrDash(therapyRec.best_open_time)} | Cierre:{' '}
                                {sOrDash(therapyRec.best_close_time)}
                              </div>
                            </div>
                            <div className="bg-white/60 rounded-md p-3">
                              <div className="text-sm text-blue-700 font-semibold mb-1">
                                Promedios
                              </div>
                              <div className="text-sm">
                                Apertura: {sOrDash(therapyRec.avg_open_time)} | Cierre:{' '}
                                {sOrDash(therapyRec.avg_close_time)}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-blue-700 italic">
                            No hay métricas de terapia registradas para esta sesión.
                          </p>
                        )}

                        {/* Mejor casilla + expandible */}
                        <div className="mt-2 text-left">
                          <div className="overflow-x-auto rounded-lg border">
                            <table className="w-full text-sm">
                              <thead className="bg-blue-100">
                                <tr>
                                  <th className="px-3 py-2 text-left">#</th>
                                  <th className="px-3 py-2 text-left">Apertura</th>
                                  <th className="px-3 py-2 text-left">Cierre</th>
                                  <th className="px-3 py-2 text-left">Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {therapyVisibleRows.length === 0 ? (
                                  <tr>
                                    <td
                                      colSpan={4}
                                      className="px-3 py-3 text-center text-muted-foreground"
                                    >
                                      Sin intentos registrados
                                    </td>
                                  </tr>
                                ) : (
                                  therapyVisibleRows.map((r, idx) => (
                                    <tr key={idx} className="border-t">
                                      <td className="px-3 py-2">{idx + 1}</td>
                                      <td className="px-3 py-2">{sOrDash(r.open)}</td>
                                      <td className="px-3 py-2">{sOrDash(r.close)}</td>
                                      <td className="px-3 py-2">{sOrDash(r.total)}</td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>

                          {therapyRows.length > 1 && (
                            <div className="mt-2 flex justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleExpanded(`${session.id}-therapy`)}
                              >
                                {expandedTables[`${session.id}-therapy`]
                                  ? 'Ver menos'
                                  : 'Ver más (+)'}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default History;