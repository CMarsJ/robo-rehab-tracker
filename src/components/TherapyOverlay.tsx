import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pause, Play, X, Gamepad2, AlertTriangle } from 'lucide-react';
import OrangeSqueezeGame from '@/components/OrangeSqueezeGame';
import NeuroLinkGame from '@/components/NeuroLinkGame';
import FlappyBirdGame from '@/components/FlappyBirdGame';
import { useGameConfig } from '@/contexts/GameConfigContext';
import { useSimulation, BLEDataRecord } from '@/contexts/SimulationContext';
import { useTranslation } from '@/contexts/AppContext';
import { bleService } from '@/services/bleService';
import { SessionService } from '@/services/sessionService';

// Función helper para limitar decimales a 4 dígitos
const roundTo4Decimals = (value: number | null): number | null => {
  if (value === null) return null;
  return Math.round(value * 10000) / 10000;
};

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

  const { calculateOrangeGoalForTime, enemySpeed, shotSpeed, baseEnemyCount, flappyPipeGap, restRepetitions, restLevels, restDuration } = useGameConfig();
  const { leftHand, rightHand, isTherapyActive, getBleDataLog, clearBleDataLog, isEmergency } = useSimulation();
  const t = useTranslation();

  const targetGlasses = calculateOrangeGoalForTime(duration);
  const isRepetitionMode = gameMode === 'timer' || gameMode === 'orange-squeeze';
  const isRoundMode = gameMode === 'neurolink' || gameMode === 'flappy-bird';

  // Estados para tiempos de apertura/cierre - MANO DERECHA (parética)
  const [closingTimes, setClosingTimes] = useState<number[]>([]);
  const [fastestClosing, setFastestClosing] = useState<number | null>(null);
  const [averageClosing, setAverageClosing] = useState<number | null>(null);

  const [openingTimes, setOpeningTimes] = useState<number[]>([]);
  const [fastestOpening, setFastestOpening] = useState<number | null>(null);
  const [averageOpening, setAverageOpening] = useState<number | null>(null);

  const [attempts, setAttempts] = useState<{ closingTime: number; openingTime: number; totalTime: number }[]>([]);

  // Estados para tiempos de apertura/cierre - MANO IZQUIERDA (no parética)
  const [leftClosingTimes, setLeftClosingTimes] = useState<number[]>([]);
  const [leftFastestClosing, setLeftFastestClosing] = useState<number | null>(null);
  const [leftAverageClosing, setLeftAverageClosing] = useState<number | null>(null);

  const [leftOpeningTimes, setLeftOpeningTimes] = useState<number[]>([]);
  const [leftFastestOpening, setLeftFastestOpening] = useState<number | null>(null);
  const [leftAverageOpening, setLeftAverageOpening] = useState<number | null>(null);

  const [leftAttempts, setLeftAttempts] = useState<{ closingTime: number; openingTime: number; totalTime: number }[]>([]);

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [orangesUsed, setOrangesUsed] = useState(0);
  const [juiceUsed, setJuiceUsed] = useState(0);
  const [gameScore, setGameScore] = useState(0);

  // Rest countdown state
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [completedRepsForRest, setCompletedRepsForRest] = useState(0);
  const [completedLevelsForRest, setCompletedLevelsForRest] = useState(0);
  const [currentRound, setCurrentRound] = useState(0);
  const lastRestTriggeredAtReps = useRef(0);
  const lastRestTriggeredAtLevels = useRef(0);

  // Refs for right hand tracking
  const openTimestamp = useRef<number | null>(null);
  const closedTimestamp = useRef<number | null>(null);
  const lastState = useRef<'open' | 'closed' | null>(null);

  // Refs for left hand tracking
  const leftOpenTimestamp = useRef<number | null>(null);
  const leftClosedTimestamp = useRef<number | null>(null);
  const leftLastState = useRef<'open' | 'closed' | null>(null);

  // Función para actualizar datos de juegos desde componentes hijos
  const updateGameStats = (gameType: string, stats: any) => {
    if (gameType === 'orange-squeeze') {
      setOrangesUsed(stats.orangesUsed || 0);
      setJuiceUsed(stats.juiceUsed || 0);
    }
  };

  // --- Lógica de inicio de terapia ---
  const handleStartTherapy = async () => {
    console.log('🎯 handleStartTherapy called, isActive:', isActive);
    setGameMode('timer');
    setGameCompleted(false);
    
    // Iniciar el temporizador - este crea la sesión en Supabase
    if (!isActive) {
      console.log('⏱️ Starting timer...');
      await onStartTimer();
      
      // Esperar un momento para que localStorage se actualice
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Obtener el ID de sesión creado por el timer
      const sessionId = localStorage.getItem('currentSessionId');
      if (sessionId) {
        setCurrentSessionId(sessionId);
        console.log('✅ Sesión obtenida del timer:', sessionId);
      }
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
    // Left hand reset
    setLeftClosingTimes([]);
    setLeftOpeningTimes([]);
    setLeftAttempts([]);
    setLeftFastestClosing(null);
    setLeftAverageClosing(null);
    setLeftFastestOpening(null);
    setLeftAverageOpening(null);
    leftOpenTimestamp.current = null;
    leftClosedTimestamp.current = null;
    leftLastState.current = null;
    // Rest reset
    setIsResting(false);
    setRestTimeLeft(0);
    setCompletedRepsForRest(0);
    setCompletedLevelsForRest(0);
    setCurrentRound(0);
    lastRestTriggeredAtReps.current = 0;
    lastRestTriggeredAtLevels.current = 0;
    // General reset
    setCurrentSessionId(null);
    setOrangesUsed(0);
    setJuiceUsed(0);
    openTimestamp.current = null;
    closedTimestamp.current = null;
    lastState.current = null;
    try { localStorage.removeItem('currentSessionId'); } catch {}
  };
  const saveTherapyData = async (state: 'completed' | 'cancelled') => {
    if (!currentSessionId) {
      console.warn('⚠️ No hay sessionId para guardar datos');
      return;
    }

    console.log(`📤 Enviando datos de terapia a Supabase (estado: ${state})...`);

    // Obtener el registro de datos BLE con timestamps
    const bleLog = getBleDataLog();
    console.log(`📝 Total registros BLE: ${bleLog.length}`);

    // Función para redondear arrays de tiempos
    const roundTimes = (times: number[]): number[] => 
      times.map(t => roundTo4Decimals(t) || 0);

    // Recopilar todos los datos según la estructura de la tabla
    const therapyData = {
      state: state,
      duration: duration,
      score: (gameMode === 'flappy-bird' || gameMode === 'neurolink') ? gameScore : attempts.length,
      orange_used: orangesUsed,
      juice_used: juiceUsed,
      stats: {
        hand_metrics: {
          right_hand: {
            closing: {
              attempts: closingTimes.length,
              fastest_time_ms: roundTo4Decimals(fastestClosing),
              average_time_ms: roundTo4Decimals(averageClosing),
              all_times: roundTimes(closingTimes)
            },
            opening: {
              attempts: openingTimes.length,
              fastest_time_ms: roundTo4Decimals(fastestOpening),
              average_time_ms: roundTo4Decimals(averageOpening),
              all_times: roundTimes(openingTimes)
            }
          },
          left_hand: {
            closing: {
              attempts: leftClosingTimes.length,
              fastest_time_ms: roundTo4Decimals(leftFastestClosing),
              average_time_ms: roundTo4Decimals(leftAverageClosing),
              all_times: roundTimes(leftClosingTimes)
            },
            opening: {
              attempts: leftOpeningTimes.length,
              fastest_time_ms: roundTo4Decimals(leftFastestOpening),
              average_time_ms: roundTo4Decimals(leftAverageOpening),
              all_times: roundTimes(leftOpeningTimes)
            }
          }
        },
        rest_metrics: {
          total_rests_triggered: Math.floor(completedRepsForRest / restRepetitions),
          rest_duration_config: restDuration,
          rest_repetitions_config: restRepetitions,
          rest_levels_config: restLevels,
        },
        game_metrics: {
          total_oranges: orangesUsed,
          total_glasses: juiceUsed,
          completion_rate: gameMode === 'orange-squeeze' && targetGlasses > 0 
            ? roundTo4Decimals((juiceUsed / targetGlasses) * 100) 
            : 0,
          score: gameScore,
          game_type: gameMode
        },
        current_hand_state: {
          left_hand: {
            active: leftHand.active,
            effort: roundTo4Decimals(leftHand.effort),
            angles: leftHand.angles
          },
          right_hand: {
            active: rightHand.active,
            effort: roundTo4Decimals(rightHand.effort),
            angles: rightHand.angles
          }
        }
      },
      details: {
        right_hand_attempts: attempts.map((attempt, index) => ({
          attempt_number: index + 1,
          closing_time_ms: roundTo4Decimals(attempt.closingTime),
          opening_time_ms: roundTo4Decimals(attempt.openingTime),
          total_time_ms: roundTo4Decimals(attempt.totalTime)
        })),
        left_hand_attempts: leftAttempts.map((attempt, index) => ({
          attempt_number: index + 1,
          closing_time_ms: roundTo4Decimals(attempt.closingTime),
          opening_time_ms: roundTo4Decimals(attempt.openingTime),
          total_time_ms: roundTo4Decimals(attempt.totalTime)
        })),
        raw_data: {
          right_closing_times: roundTimes(closingTimes),
          right_opening_times: roundTimes(openingTimes),
          right_total_attempts: attempts.length,
          left_closing_times: roundTimes(leftClosingTimes),
          left_opening_times: roundTimes(leftOpeningTimes),
          left_total_attempts: leftAttempts.length
        },
        therapy_info: {
          mode: gameMode,
          duration_minutes: duration,
          therapy_type: gameMode === 'timer' ? 'terapia_guiada' : gameMode,
          is_therapy_active: isTherapyActive
        }
      },
      // extra_date: Vector JSON con registro de fecha/hora de datos BLE
      extra_date: bleLog.length > 0 ? bleLog : [{
        timestamp: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
        receivedAtMs: Date.now(),
        receivedAtPerfMs: parseFloat(performance.now().toFixed(3)),
        deviceRawTimestamp: null,
        leftHand: leftHand,
        rightHand: rightHand,
        note: 'No hubo cambios de datos BLE durante la sesión'
      }]
    };

    const success = await SessionService.updateSessionWithTherapyData(currentSessionId, therapyData);
    
    if (success) {
      console.log(`✅ Datos de terapia ${state === 'completed' ? 'completada' : 'cancelada'} enviados correctamente a Supabase`);
      // Limpiar el log de BLE después de guardar
      clearBleDataLog();
    } else {
      console.error('❌ Error al guardar datos de terapia');
    }
  };

  const startGame = async (mode: Exclude<GameMode, 'selection' | 'timer'>) => {
    setGameCompleted(false);
    setGameMode(mode);
    
    // Crear sesión para juegos
    const session = await SessionService.createSession({
      therapy_type: mode,
      duration: duration,
      state: 'active'
    });
    if (session) {
      setCurrentSessionId(session.id);
      try { localStorage.setItem('currentSessionId', session.id); } catch {}
    }
    
    if (!isActive) onStartTimer();
  };
  // --- Completar terapia cuando se acaba el tiempo ---
  useEffect(() => {
    if (timeLeft === 0 && currentSessionId) {
      saveTherapyData('completed');
      console.log('✅ Sesión de terapia completada y datos enviados a Supabase');
    }
  }, [timeLeft, isActive, currentSessionId]);

  // --- Reset tracking refs on pause to prevent stale time deltas ---
  useEffect(() => {
    if (isPaused || isEmergency) {
      // Nullify timestamps so resume starts fresh measurement
      openTimestamp.current = null;
      closedTimestamp.current = null;
      lastState.current = null;
      leftOpenTimestamp.current = null;
      leftClosedTimestamp.current = null;
      leftLastState.current = null;
    }
  }, [isPaused, isEmergency]);

  // --- Registro de tiempos de mano DERECHA (parética) ---
  useEffect(() => {
    if (!isTherapyActive || isResting || isPaused || isEmergency) return;

    // Use MCP angle (finger1) directly — 0° = open, 90° = closed
    const mcpAngle = rightHand.angles.finger1;
    const isOpen = mcpAngle < 15;
    const isClosed = mcpAngle > 60;
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
        setAttempts(prev => {
          const updated = [...prev, { closingTime: closing, openingTime: 0, totalTime: closing }];
          return updated;
        });
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

        if (isRepetitionMode) {
          setCompletedRepsForRest(prevReps => prevReps + 1);
        }

        openTimestamp.current = now;
        closedTimestamp.current = null;
      }

      lastState.current = currentState;
    }
  }, [rightHand, isTherapyActive, isResting, isPaused, isEmergency, isRepetitionMode]);

  // --- Registro de tiempos de mano IZQUIERDA (no parética) ---
  useEffect(() => {
    if (!isTherapyActive || isResting || isPaused || isEmergency) return;

    // Use MCP angle (finger1) directly — 0° = open, 90° = closed
    const mcpAngle = leftHand.angles.finger1;
    const isOpen = mcpAngle < 15;
    const isClosed = mcpAngle > 60;
    const now = performance.now();
    const currentState: 'open' | 'closed' | 'neutral' = isOpen ? 'open' : isClosed ? 'closed' : 'neutral';

    if (currentState === 'neutral') return;

    if (leftLastState.current === null) {
      if (currentState === 'open') leftOpenTimestamp.current = now;
      if (currentState === 'closed') leftClosedTimestamp.current = now;
      leftLastState.current = currentState;
      return;
    }

    if (leftLastState.current !== currentState) {
      if (leftLastState.current === 'open' && currentState === 'closed' && leftOpenTimestamp.current !== null) {
        const closing = now - leftOpenTimestamp.current;
        setLeftClosingTimes(prev => {
          const updated = [...prev, closing];
          setLeftFastestClosing(Math.min(...updated));
          setLeftAverageClosing(updated.reduce((a, b) => a + b, 0) / updated.length);
          return updated;
        });
        setLeftAttempts(prev => [...prev, { closingTime: closing, openingTime: 0, totalTime: closing }]);
        leftClosedTimestamp.current = now;
        leftOpenTimestamp.current = null;
      }

      if (leftLastState.current === 'closed' && currentState === 'open' && leftClosedTimestamp.current !== null) {
        const opening = now - leftClosedTimestamp.current;
        setLeftOpeningTimes(prev => {
          const updated = [...prev, opening];
          setLeftFastestOpening(Math.min(...updated));
          setLeftAverageOpening(updated.reduce((a, b) => a + b, 0) / updated.length);
          return updated;
        });
        setLeftAttempts(prev => {
          if (prev.length === 0) return prev;
          const last = prev[prev.length - 1];
          return [...prev.slice(0, -1), { ...last, openingTime: opening, totalTime: last.closingTime + opening }];
        });
        leftOpenTimestamp.current = now;
        leftClosedTimestamp.current = null;
      }

      leftLastState.current = currentState;
    }
  }, [leftHand, isTherapyActive, isResting, isPaused, isEmergency]);

  // --- Rest trigger: repeticiones ---
  useEffect(() => {
    if (!isRepetitionMode) return;

    if (
      completedRepsForRest > 0 &&
      completedRepsForRest % restRepetitions === 0 &&
      completedRepsForRest !== lastRestTriggeredAtReps.current &&
      !isResting &&
      isActive &&
      !isPaused
    ) {
      if (triggerRest('reps')) {
        lastRestTriggeredAtReps.current = completedRepsForRest;
      }
    }
  }, [completedRepsForRest, restRepetitions, isResting, isActive, isPaused, isRepetitionMode]);

  // --- Rest trigger: niveles de juego ---
  useEffect(() => {
    if (!isRoundMode) return;

    if (
      completedLevelsForRest > 0 &&
      completedLevelsForRest % restLevels === 0 &&
      completedLevelsForRest !== lastRestTriggeredAtLevels.current &&
      !isResting &&
      isActive &&
      !isPaused
    ) {
      if (triggerRest('levels')) {
        lastRestTriggeredAtLevels.current = completedLevelsForRest;
      }
    }
  }, [completedLevelsForRest, restLevels, isResting, isActive, isPaused, isRoundMode]);

  const triggerRest = (source: 'reps' | 'levels'): boolean => {
    console.log(`🛏️ Rest triggered by ${source}. Descanso #${currentRound + 1}`);
    setIsResting(true);
    setRestTimeLeft(restDuration);
    onPause(); // Pause the main therapy timer
    return true;
  };

  // --- Rest countdown timer ---
  useEffect(() => {
    if (!isResting || restTimeLeft <= 0) return;

    const interval = setInterval(() => {
      setRestTimeLeft(prev => {
        if (prev <= 1) {
          setIsResting(false);
          // Increment round counter
          setCurrentRound(prevRound => {
            console.log(`🔄 Round ${prevRound + 1} completed. Moving to round ${prevRound + 2}/${restLevels}`);
            return prevRound + 1;
          });
          // Resume therapy
          setTimeout(() => onPause(), 0); // Unpause
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isResting, restTimeLeft, restLevels]);

  // Track game progress and completion
  const handleGameRoundProgress = () => {
    setCompletedLevelsForRest(prev => prev + 1);
  };

  const handleGameComplete = (gameData?: any) => {
    setGameCompleted(true);

    if (gameData && gameMode === 'orange-squeeze') {
      setOrangesUsed(gameData.orange_used || 0);
      setJuiceUsed(gameData.juice_used || 0);
    }

    if (gameData && (gameMode === 'flappy-bird' || gameMode === 'neurolink')) {
      setGameScore(gameData.score || 0);
    }
  };

  const formatMs = (ms: number | null) => (ms === null ? '-' : (ms / 1000).toFixed(2) + 's');

  // --- Renderizado ---
  const renderRestOverlay = () => (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center">
      <Card className="w-80 text-center">
        <CardHeader>
          <CardTitle className="text-xl">⏸️ Tiempo de Descanso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-5xl font-bold text-primary">
            {Math.floor(restTimeLeft / 60)}:{(restTimeLeft % 60).toString().padStart(2, '0')}
          </div>
          <p className="text-muted-foreground">
            Relájate. La sesión se reanudará automáticamente.
          </p>
          <div className="text-xs text-muted-foreground">
            {isRepetitionMode
              ? `Repeticiones completadas: ${completedRepsForRest}`
              : `Rondas completadas: ${completedLevelsForRest}`} | Descanso #{currentRound + 1}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAttemptsTable = (
    title: string,
    attemptsData: { closingTime: number; openingTime: number; totalTime: number }[],
    closingData: number[],
    openingData: number[],
    fastClose: number | null,
    avgClose: number | null,
    fastOpen: number | null,
    avgOpen: number | null,
    colorClass: string
  ) => (
    <>
      {(closingData.length > 0 || openingData.length > 0) && (
        <div className="mt-4 text-sm text-center bg-muted/20 p-3 rounded-lg space-y-2">
          <p className={`font-semibold text-base ${colorClass}`}>{title}</p>
          <div>
            <p className="font-semibold">✊ Cierre (abierta → cerrada)</p>
            <p>Intentos: {closingData.length}</p>
            <p>⚡ Mejor: {formatMs(fastClose)}</p>
            <p>📊 Promedio: {formatMs(avgClose)}</p>
          </div>
          <div className="pt-2 border-t">
            <p className="font-semibold">🖐️ Apertura (cerrada → abierta)</p>
            <p>Intentos: {openingData.length}</p>
            <p>⚡ Mejor: {formatMs(fastOpen)}</p>
            <p>📊 Promedio: {formatMs(avgOpen)}</p>
          </div>
        </div>
      )}

      {attemptsData.length > 0 && (
        <div className="mt-4 w-full max-w-xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{title} - Historial</CardTitle>
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
                    {attemptsData.map((a, i) => (
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
    </>
  );

  const renderTimerControls = () => (
    <div className="flex flex-col items-center mt-4">
      <div className="text-3xl font-bold text-primary mb-1">
        {isActive ? formatTime(timeLeft) : formatTime(duration * 60)}
      </div>
      <div className="text-sm text-muted-foreground mb-4">
        {isEmergency ? '🚨 EMERGENCIA' : isResting ? '⏸️ Descansando...' : isPaused ? 'Pausado' : isActive ? 'Tiempo restante' : 'Listo para iniciar'}
      </div>

      <div className="flex gap-4">
        <Button onClick={onPause} className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 text-lg" size="lg" disabled={!isActive || isResting || isEmergency}>
          {isPaused ? <><Play className="w-6 h-6 mr-2" /> Reanudar</> : <><Pause className="w-6 h-6 mr-2" /> Pausar</>}
        </Button>
        <Button
          onClick={async () => {
            await bleService.sendEmergency();
          }}
          variant={isEmergency ? 'outline' : 'destructive'}
          className={`px-6 py-3 text-lg ${isEmergency ? 'border-destructive text-destructive animate-pulse' : ''}`}
          size="lg"
          disabled={!isActive || isResting}
        >
          <AlertTriangle className="w-6 h-6 mr-2" />
          {isEmergency ? 'Reanudar' : 'Emergencia'}
        </Button>
        <Button onClick={handleCancelTherapy} variant="destructive" className="px-6 py-3 text-lg" size="lg" disabled={isResting}>
          <X className="w-6 h-6 mr-2" /> Cancelar
        </Button>
      </div>

      {/* Right hand (paretic) stats and table */}
      {renderAttemptsTable(
        '🦾 Mano Parética (Derecha)',
        attempts, closingTimes, openingTimes,
        fastestClosing, averageClosing, fastestOpening, averageOpening,
        'text-medical-orange'
      )}

      {/* Left hand (non-paretic) stats and table */}
      {renderAttemptsTable(
        '✋ Mano No Parética (Izquierda)',
        leftAttempts, leftClosingTimes, leftOpeningTimes,
        leftFastestClosing, leftAverageClosing, leftFastestOpening, leftAverageOpening,
        'text-medical-green'
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
        <Button onClick={handleStartTherapy} className="w-full h-14 text-base bg-primary hover:bg-primary/90">
          🧠 Terapia Guiada
        </Button>

        <Button onClick={() => startGame('orange-squeeze')} className="w-full h-14 text-base bg-orange-500 hover:bg-orange-600">
          🍊 Exprimiendo Naranjas
          <div className="text-xs mt-1">Meta: {targetGlasses} vasos</div>
        </Button>

        <Button onClick={() => startGame('neurolink')} className="w-full h-14 text-base bg-purple-500 hover:bg-purple-600">
          🎯 NeuroDefense
        </Button>

        <Button onClick={() => startGame('flappy-bird')} variant="outline" className="w-full h-14 text-base">
          🐦 RehabBird
        </Button>
      </CardContent>
    </Card>
  );

  const renderGameContent = () => {
    switch (gameMode) {
      case 'orange-squeeze': return (
        <OrangeSqueezeGame 
          targetGlasses={targetGlasses} 
          onComplete={(data) => handleGameComplete(data)}
          onStatsUpdate={(stats) => updateGameStats('orange-squeeze', stats)}
        />
      );
      case 'neurolink': return <NeuroLinkGame onComplete={handleGameComplete} onRoundComplete={handleGameRoundProgress} isResting={isResting} />;
      case 'flappy-bird': return <FlappyBirdGame onComplete={handleGameComplete} onRoundComplete={handleGameRoundProgress} onScoreChange={(s) => setGameScore(s)} isResting={isResting} />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      {isResting && renderRestOverlay()}
      <div className={`bg-background rounded-lg p-6 relative overflow-y-auto w-[95vw] h-[90vh] ${isResting ? 'pointer-events-none opacity-50' : ''}`}>
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
