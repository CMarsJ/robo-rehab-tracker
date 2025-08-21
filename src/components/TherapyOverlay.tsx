import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pause, Play, X, Gamepad2 } from 'lucide-react';
import OrangeSqueezeGame from '@/components/OrangeSqueezeGame';
import NeuroLinkGame from '@/components/NeuroLinkGame';
import FlappyBirdGame from '@/components/FlappyBirdGame';
import { useGameConfig } from '@/contexts/GameConfigContext';
import { useSimulation } from '@/contexts/SimulationContext';
import { useTranslation } from '@/contexts/AppContext';
import { SessionService } from '@/services/sessionService';

interface TherapyOverlayProps {
  timeLeft: number;
  isPaused: boolean;
  onPause: () => void;
  onCancel: () => void;
  formatTime: (seconds: number) => string;
  duration: number;
  onStartTimer: () => void;
  isActive: boolean;
}

type GameMode = 'selection' | 'timer' | 'orange-squeeze' | 'neurolink' | 'flappy-bird';

const TherapyOverlay: React.FC<TherapyOverlayProps> = ({
  timeLeft,
  isPaused,
  onPause,
  onCancel,
  formatTime,
  duration,
  onStartTimer,
  isActive
}) => {
  const [gameMode, setGameMode] = useState<GameMode>('selection');
  const [gameCompleted, setGameCompleted] = useState(false);

  const { calculateOrangeGoalForTime, enemySpeed, shotSpeed, baseEnemyCount, flappyPipeGap } = useGameConfig();
  const { leftHand, rightHand, isTherapyActive } = useSimulation();
  const t = useTranslation();

  const targetGlasses = calculateOrangeGoalForTime(duration);

  // Estados para tiempos de apertura/cierre
  const [closingTimes, setClosingTimes] = useState<number[]>([]);
  const [fastestClosing, setFastestClosing] = useState<number | null>(null);
  const [averageClosing, setAverageClosing] = useState<number | null>(null);

  const [openingTimes, setOpeningTimes] = useState<number[]>([]);
  const [fastestOpening, setFastestOpening] = useState<number | null>(null);
  const [averageOpening, setAverageOpening] = useState<number | null>(null);

  const [attempts, setAttempts] = useState<{ closingTime: number; openingTime: number; totalTime: number }[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [orangesUsed, setOrangesUsed] = useState(0);
  const [juiceUsed, setJuiceUsed] = useState(0);

  const openTimestamp = useRef<number | null>(null);
  const closedTimestamp = useRef<number | null>(null);
  const lastState = useRef<'open' | 'closed' | null>(null);

  const handleGameComplete = () => setGameCompleted(true);

  // Función para actualizar datos de juegos desde componentes hijos
  const updateGameStats = (gameType: string, stats: any) => {
    if (gameType === 'orange-squeeze') {
      setOrangesUsed(stats.orangesUsed || 0);
      setJuiceUsed(stats.juiceUsed || 0);
    }
  };

  // --- Lógica de inicio de terapia ---
  const handleStartTherapy = async () => {
    onStartTimer();
    setGameMode('timer');
    setGameCompleted(false);
    
    // Crear sesión en Supabase
    const session = await SessionService.createSession({
      tipo_actividad: 'terapia_guiada',
      duracion_minutos: duration,
      estado: 'active'
    });
    
    if (session) {
      setCurrentSessionId(session.id);
    }
  };

  const handleCancelTherapy = async () => {
    await saveTherapyData('cancelled');
    onCancel();
    resetTherapyData();
  };

  const resetTherapyData = () => {
    setGameMode('selection');
    setGameCompleted(false);
    setClosingTimes([]);
    setOpeningTimes([]);
    setAttempts([]);
    setFastestClosing(null);
    setAverageClosing(null);
    setFastestOpening(null);
    setAverageOpening(null);
    setCurrentSessionId(null);
    setOrangesUsed(0);
    setJuiceUsed(0);
    openTimestamp.current = null;
    closedTimestamp.current = null;
    lastState.current = null;
  };

  // --- Función para guardar datos de terapia en Supabase ---
  const saveTherapyData = async (state: 'completed' | 'cancelled') => {
    if (!currentSessionId) return;

    // Recopilar todos los datos según la estructura de la tabla
    const therapyData = {
      state: state,
      duration: duration,
      score: attempts.length, // Número de intentos como score
      orange_used: orangesUsed,
      juice_used: juiceUsed,
      stats: {
        // Stats: datos de apertura y cierre con promedios
        closing_stats: {
          attempts: closingTimes.length,
          fastest: fastestClosing,
          average: averageClosing,
          times: closingTimes
        },
        opening_stats: {
          attempts: openingTimes.length,
          fastest: fastestOpening,
          average: averageOpening,
          times: openingTimes
        },
        combined_stats: {
          total_attempts: attempts.length,
          best_closing: fastestClosing,
          best_opening: fastestOpening,
          avg_closing: averageClosing,
          avg_opening: averageOpening
        }
      },
      details: attempts, // Historial completo de aperturas y cierres
      extra_data: {
        // Configuración de juegos
        game_config: {
          orange_juice_goal: targetGlasses,
          enemy_speed: enemySpeed,
          shot_speed: shotSpeed,
          base_enemy_count: baseEnemyCount,
          flappy_pipe_gap: flappyPipeGap
        },
        therapy_settings: {
          duration_minutes: duration,
          therapy_type: gameMode === 'timer' ? 'terapia_guiada' : gameMode,
          start_time: new Date().toISOString()
        }
      }
    };

    await SessionService.updateSessionWithTherapyData(currentSessionId, therapyData);
  };

  const startGame = async (mode: Exclude<GameMode, 'selection' | 'timer'>) => {
    setGameCompleted(false);
    setGameMode(mode);
    
    // Crear sesión para juegos
    const session = await SessionService.createSession({
      tipo_actividad: mode,
      duracion_minutos: duration,
      estado: 'active'
    });
    
    if (session) {
      setCurrentSessionId(session.id);
    }
    
    if (!isActive) onStartTimer();
  };

  // --- Completar terapia cuando se acaba el tiempo ---
  useEffect(() => {
    if (timeLeft === 0 && isActive && currentSessionId) {
      saveTherapyData('completed');
    }
  }, [timeLeft, isActive, currentSessionId]);

  // --- Registro de tiempos de mano ---
  useEffect(() => {
    if (!isTherapyActive) return;

    const isOpen = rightHand.angles.finger2 < 20;
    const isClosed = rightHand.angles.finger2 > 70;
    const now = performance.now();
    const currentState: 'open' | 'closed' | 'neutral' = isOpen ? 'open' : isClosed ? 'closed' : 'neutral';

    if (currentState === 'neutral') return;

    if (lastState.current === null) {
      if (currentState === 'open') openTimestamp.current = now;
      if (currentState === 'closed') closedTimestamp.current = now;
      lastState.current = currentState;
      return;
    }

    if (lastState.current !== currentState) {
      if (lastState.current === 'open' && currentState === 'closed' && openTimestamp.current !== null) {
        const closing = now - openTimestamp.current;
        setClosingTimes(prev => {
          const updated = [...prev, closing];
          setFastestClosing(Math.min(...updated));
          setAverageClosing(updated.reduce((a, b) => a + b, 0) / updated.length);
          return updated;
        });
        setAttempts(prev => [...prev, { closingTime: closing, openingTime: 0, totalTime: closing }]);
        closedTimestamp.current = now;
        openTimestamp.current = null;
      }

      if (lastState.current === 'closed' && currentState === 'open' && closedTimestamp.current !== null) {
        const opening = now - closedTimestamp.current;
        setOpeningTimes(prev => {
          const updated = [...prev, opening];
          setFastestOpening(Math.min(...updated));
          setAverageOpening(updated.reduce((a, b) => a + b, 0) / updated.length);
          return updated;
        });
        setAttempts(prev => {
          if (prev.length === 0) return prev;
          const last = prev[prev.length - 1];
          return [...prev.slice(0, -1), { ...last, openingTime: opening, totalTime: last.closingTime + opening }];
        });
        openTimestamp.current = now;
        closedTimestamp.current = null;
      }

      lastState.current = currentState;
    }
  }, [rightHand, isTherapyActive]);

  const formatMs = (ms: number | null) => (ms === null ? '-' : (ms / 1000).toFixed(2) + 's');

  // --- Renderizado ---
  const renderTimerControls = () => (
    <div className="flex flex-col items-center mt-4">
      <div className="text-3xl font-bold text-primary mb-1">
        {isActive ? formatTime(timeLeft) : `${duration}:00`}
      </div>
      <div className="text-sm text-muted-foreground mb-4">
        {isPaused ? 'Pausado' : isActive ? 'Tiempo restante' : 'Listo para iniciar'}
      </div>

      <div className="flex gap-4">
        <Button onClick={onPause} className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 text-lg" size="lg" disabled={!isActive}>
          {isPaused ? <><Play className="w-6 h-6 mr-2" /> Reanudar</> : <><Pause className="w-6 h-6 mr-2" /> Pausar</>}
        </Button>
        <Button onClick={handleCancelTherapy} variant="destructive" className="px-6 py-3 text-lg" size="lg">
          <X className="w-6 h-6 mr-2" /> Cancelar
        </Button>
      </div>

      {(closingTimes.length > 0 || openingTimes.length > 0) && (
        <div className="mt-4 text-sm text-center bg-muted/20 p-3 rounded-lg space-y-2">
          <div>
            <p className="font-semibold">✊ Cierre (abierta → cerrada)</p>
            <p>Intentos: {closingTimes.length}</p>
            <p>⚡ Mejor: {formatMs(fastestClosing)}</p>
            <p>📊 Promedio: {formatMs(averageClosing)}</p>
          </div>
          <div className="pt-2 border-t">
            <p className="font-semibold">🖐️ Apertura (cerrada → abierta)</p>
            <p>Intentos: {openingTimes.length}</p>
            <p>⚡ Mejor: {formatMs(fastestOpening)}</p>
            <p>📊 Promedio: {formatMs(averageOpening)}</p>
          </div>
        </div>
      )}

      {attempts.length > 0 && (
        <div className="mt-4 w-full max-w-xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historial de intentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted/40">
                      <th className="px-2 py-1 text-left">#</th>
                      <th className="px-2 py-1 text-left">Cierre (s)</th>
                      <th className="px-2 py-1 text-left">Apertura (s)</th>
                      <th className="px-2 py-1 text-left">Total (s)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.map((a, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-2 py-1">{i + 1}</td>
                        <td className="px-2 py-1">{(a.closingTime / 1000).toFixed(2)}</td>
                        <td className="px-2 py-1">{a.openingTime ? (a.openingTime / 1000).toFixed(2) : '-'}</td>
                        <td className="px-2 py-1">{(a.totalTime / 1000).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  const renderGameSelection = () => (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center flex items-center justify-center gap-2">
          <Gamepad2 className="w-6 h-6" /> Selecciona una opción
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3">
        <Button onClick={handleStartTherapy} className="w-full h-14 text-base bg-primary hover:bg-primary/90" disabled={isPaused || isActive}>
          🧠 Terapia Guiada
        </Button>

        <Button onClick={() => startGame('orange-squeeze')} className="w-full h-14 text-base bg-orange-500 hover:bg-orange-600">
          🍊 Exprimiendo Naranjas
          <div className="text-xs mt-1">Meta: {targetGlasses} vasos</div>
        </Button>

        <Button onClick={() => startGame('neurolink')} className="w-full h-14 text-base bg-purple-500 hover:bg-purple-600">
          🎯 NeuroLink
        </Button>

        <Button onClick={() => startGame('flappy-bird')} variant="outline" className="w-full h-14 text-base">
          🐦 Flappy Bird
        </Button>
      </CardContent>
    </Card>
  );

  const renderGameContent = () => {
    switch (gameMode) {
      case 'orange-squeeze': return (
        <OrangeSqueezeGame 
          targetGlasses={targetGlasses} 
          onComplete={handleGameComplete}
          onStatsUpdate={(stats) => updateGameStats('orange-squeeze', stats)}
        />
      );
      case 'neurolink': return <NeuroLinkGame onComplete={handleGameComplete} />;
      case 'flappy-bird': return <FlappyBirdGame onComplete={handleGameComplete} />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg p-6 relative overflow-y-auto w-[95vw] h-[90vh]">
        {gameMode === 'selection' ? (
          <div className="flex items-center justify-center h-full">{renderGameSelection()}</div>
        ) : gameMode === 'timer' ? (
          <div className="flex flex-col items-center">
            {/* Título de la sesión */}
            <h2 className="text-center font-bold text-2xl mb-6">Sesión de Terapia</h2>
            
            {/* Layout en paralelo: Mano No Parética (1), Video (3), Mano Parética (1) */}
            <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
              {/* Mano No Parética */}
              <div className="lg:col-span-1 p-4 border rounded-lg shadow">
                <Card className={`border-2 transition-all duration-300 ${
                  leftHand.active && isTherapyActive
                    ? 'border-medical-green/60 bg-medical-green/5 hover:border-medical-green/80' 
                    : 'border-medical-green/20 hover:border-medical-green/40'
                }`}>
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-lg font-semibold text-medical-green">
                      {t.nonPareticHand}
                    </CardTitle>
                    <Badge variant="secondary" className="w-fit mx-auto bg-medical-green/10 text-medical-green">
                      {t.withSensors}
                    </Badge>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center">
                    <div className={`hand-non-paretic w-24 h-32 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 ${
                      leftHand.active && isTherapyActive
                        ? 'animate-pulse bg-medical-green/10' 
                        : 'bg-muted/50'
                    }`}>
                      <div className="text-3xl">✋</div>
                    </div>
                    
                    <div className="mt-3 space-y-2 w-full">
                      <h5 className="text-xs font-medium text-center">Ángulos</h5>
                      <div className="grid grid-cols-1 gap-1 text-xs">
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Pulgar IP:</span>
                            <span>{leftHand.angles.thumb1}°</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Pulgar MCP:</span>
                            <span>{leftHand.angles.thumb2}°</span>
                          </div>
                          <div className="flex justify-between">
                            <span>DIP:</span>
                            <span>{leftHand.angles.finger1}°</span>
                          </div>
                          <div className="flex justify-between">
                            <span>PIP:</span>
                            <span>{leftHand.angles.finger2}°</span>
                          </div>
                          <div className="flex justify-between">
                            <span>MCP:</span>
                            <span>{leftHand.angles.finger3}°</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex flex-col items-center gap-2">
                      <Badge variant="outline" className={`text-xs ${
                        leftHand.active && isTherapyActive
                          ? 'text-medical-green border-medical-green bg-medical-green/10' 
                          : leftHand.active
                            ? 'text-blue-600 border-blue-600 bg-blue-50'
                            : 'text-muted-foreground border-muted-foreground'
                      }`}>
                        {leftHand.active ? t.active : t.inactive}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Video - ocupa 3 columnas */}
              <div className="lg:col-span-3 p-4 border rounded-lg shadow">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <iframe
                    src="https://www.youtube.com/embed/QgBgP2c-3so?autoplay=1&loop=1&playlist=QgBgP2c-3so"
                    className="w-full h-[300px] lg:h-[500px] rounded-lg border-0"
                    allow="autoplay; encrypted-media; fullscreen"
                    allowFullScreen
                    title="Terapia de Rehabilitación"
                  />
                </div>
              </div>

              {/* Mano Parética */}
              <div className="lg:col-span-1 p-4 border rounded-lg shadow">
                <Card className={`border-2 transition-all duration-300 ${
                  rightHand.active && isTherapyActive
                    ? 'border-medical-orange/60 bg-medical-orange/5 hover:border-medical-orange/80' 
                    : 'border-medical-orange/20 hover:border-medical-orange/40'
                }`}>
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-lg font-semibold text-medical-orange">
                      {t.pareticHand}
                    </CardTitle>
                    <Badge variant="secondary" className="w-fit mx-auto bg-medical-orange/10 text-medical-orange">
                      {t.withExoskeleton}
                    </Badge>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center">
                    <div className={`hand-paretic w-24 h-32 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 ${
                      rightHand.active && isTherapyActive
                        ? 'animate-pulse bg-medical-orange/10' 
                        : 'bg-muted/50'
                    }`}>
                      <div className="text-3xl">✋</div>
                    </div>
                    
                    <div className="mt-3 space-y-2 w-full">
                      <h5 className="text-xs font-medium text-center">Ángulos</h5>
                      <div className="grid grid-cols-1 gap-1 text-xs">
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Pulgar IP:</span>
                            <span>{rightHand.angles.thumb1}°</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Pulgar MCP:</span>
                            <span>{rightHand.angles.thumb2}°</span>
                          </div>
                          <div className="flex justify-between">
                            <span>DIP:</span>
                            <span>{rightHand.angles.finger1}°</span>
                          </div>
                          <div className="flex justify-between">
                            <span>PIP:</span>
                            <span>{rightHand.angles.finger2}°</span>
                          </div>
                          <div className="flex justify-between">
                            <span>MCP:</span>
                            <span>{rightHand.angles.finger3}°</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex flex-col items-center gap-2">
                      <Badge variant="outline" className={`text-xs ${
                        rightHand.active && isTherapyActive
                          ? 'text-medical-orange border-medical-orange bg-medical-orange/10' 
                          : rightHand.active
                            ? 'text-blue-600 border-blue-600 bg-blue-50'
                            : 'text-muted-foreground border-muted-foreground'
                      }`}>
                        {rightHand.active ? t.active : t.inactive}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            <div className="flex flex-col items-center">
              {/* Temporizador + botones */}
              {renderTimerControls()}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {/* Juego arriba */}
            <div className="flex-1 w-full max-w-4xl mb-6">{renderGameContent()}</div>
            {/* Temporizador + botones debajo del juego */}
            {renderTimerControls()}
            {gameCompleted && (
              <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg text-center">
                <p className="text-green-800 font-semibold">
                  🎉 ¡Juego completado! Continúa hasta que termine el tiempo
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TherapyOverlay;
