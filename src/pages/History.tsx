
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Eye, Download, Calendar, Trophy, Clock, Activity } from 'lucide-react';
import { useTranslation } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';

interface SessionData {
  id: string;
  tipo_actividad: string;
  fecha_inicio: string;
  duracion_minutos: number;
  estado: string;
  game_records?: {
    game_type?: string;
    total_oranges: number;
    total_glasses: number;
    average_oranges_per_minute: number;
  }[];
}

const History = () => {
  const t = useTranslation();
  const { user, loading } = useAuth();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          tipo_actividad,
          fecha_inicio,
          duracion_minutos,
          estado,
          game_records (
            game_type,
            total_oranges,
            total_glasses,
            average_oranges_per_minute
          )
        `)
        .eq('user_id', user!.id)
        .order('fecha_inicio', { ascending: false });

      if (sessionsError) {
        throw sessionsError;
      }

      setSessions(sessionsData || []);
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
          {sessions.map((session) => (
            <Card key={session.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      {getSessionIcon(session.tipo_actividad, (session.game_records?.[0] as any)?.game_type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{getSessionType(session.tipo_actividad, (session.game_records?.[0] as any)?.game_type)}</h3>
                      <p className="text-muted-foreground">
                        <Clock className="w-4 h-4 inline mr-1" />
                        {session.duracion_minutos} minutos
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(session.fecha_inicio)}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          session.estado === 'completed' ? 'bg-green-100 text-green-800' :
                          session.estado === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {session.estado === 'completed' ? 'Completada' :
                           session.estado === 'cancelled' ? 'Cancelada' : 'Activa'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right space-y-2">
                    {session.game_records && session.game_records[0] && (
                      <div className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span>🍊 {session.game_records[0].total_oranges} naranjas</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>🥤 {session.game_records[0].total_glasses} vasos</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>⚡ {session.game_records[0].average_oranges_per_minute.toFixed(1)} naranjas/min</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Información de rendimiento según el tipo de sesión */}
                {session.game_records && session.game_records[0] && ((session.game_records[0] as any).game_type === 'orange_squeeze') && (
                  <div className="mt-4 p-4 bg-orange-50 rounded-lg">
                    <h4 className="font-semibold mb-2 text-orange-800">🍊 Resumen del Juego de Naranjas</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{session.game_records[0].total_oranges}</div>
                        <div className="text-orange-700">Naranjas totales</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{session.game_records[0].total_glasses}</div>
                        <div className="text-blue-700">Vasos completados</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {session.game_records[0].average_oranges_per_minute.toFixed(1)}
                        </div>
                        <div className="text-green-700">Naranjas/minuto</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{session.duracion_minutos}</div>
                        <div className="text-purple-700">Minutos</div>
                      </div>
                    </div>
                  </div>
                )}

                {session.tipo_actividad === 'therapy' && (!session.game_records || session.game_records.length === 0) && (
                  <div className="mt-4 p-6 bg-blue-50 rounded-lg border-2 border-dashed border-blue-200">
                    <div className="text-center">
                      <div className="text-4xl mb-3">🧠</div>
                      <h4 className="font-semibold mb-2 text-blue-800">Datos de Terapia</h4>
                      <p className="text-sm text-blue-700 italic">
                        En futuras versiones aquí se mostrarán datos específicos sobre el esfuerzo físico y duración de la sesión de terapia
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
