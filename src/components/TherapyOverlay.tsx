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
import { useAuth } from '@/contexts/AuthContext';
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
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const { calculateOrangeGoalForTime } = useGameConfig();
  const { leftHand, rightHand, isTherapyActive } = useSimulation();
  const { user } = useAuth();
  const t = useTranslation();

  const targetGlasses = calculateOrangeGoalForTime(duration);

  // --- Estados para registrar tiempos ---
  const [closingTimes, setClosingTimes] = useState<number[]>([]);
  const [openingTimes, setOpeningTimes] = useState<number[]>([]);
  const [fastestClosing, setFastestClosing] = useState<number | null>(null);
  const [averageClosing, setAverageClosing] = useState<number | null>(null);
  const [fastestOpening, setFastestOpening] = useState<number | null>(null);
  const [averageOpening, setAverageOpening] = useState<number | null>(null);
  const [attempts, setAttempts] = useState<{ closingTime: number; openingTime: number; totalTime: number }[]>([]);

  const openTimestamp = useRef<number | null>(null);
  const closedTimestamp = useRef<number | null>(null);
  const lastState = useRef<'open' | 'closed' | null>(null);

  // --- Funciones Supabase ---
  const createSessionInSupabase = async () => {
    if (!user) return;
    try {
      const session = await SessionService.saveTherapyData({
        therapy_type: 'terapia_guiada',
        start_time: new Date().toISOString(),
        duration: duration * 60, // segundos
        state: 'active',
        score: 0,
        orange_used: 0,
        juice_used: 0,
        stats: {},
        details: {},
        extra_data: {}
      });
      if (session) {
        setCurrentSession(session.id);
        console.log('Sesión creada en Supabase:', session.id);
      }
    } catch (error) {
      console.error('Error creando sesión en Supabase:', error);
    }
  };

  const saveSessionData = async (state: 'completed' | 'cancelled') => {
    if (!currentSession || !user) return;

    const totalDuration = duration * 60 - timeLeft; // segundos
    try {
      await SessionService.updateSession(currentSession, {
        state,
        duration: totalDuration,
        score: closingTimes.length + openingTimes.length,
        stats: {
          totalClosingAttempts: closingTimes.length,
          totalOpeningAttempts: openingTimes.length,
          bestClosingTime: fastestClosing ? fastestClosing / 1000 : null,
          bestOpeningTime: fastestOpening ? fastestOpening / 1000 : null,
          avgClosingTime: averageClosing ? averageClosing / 1000 : null,
          avgOpeningTime: averageOpening ? averageOpening / 1000 : null
        },
        details: {
          attempts: attempts.map(a => ({
            closingTime: a.closingTime / 1000,
            openingTime: a.openingTime / 1000,
            totalTime: a.totalTime / 1000
          }))
        }
      });
      console.log(`Sesión ${state} y datos guardados`);
    } catch (error) {
      console.error('Error guardando datos de sesión en Supabase:', error);
    }
  };

  // --- Inicio terapia guiada ---
  const handleStartTherapy = async () => {
    setGameMode('timer');
    onStartTimer();
    await createSessionInSupabase();
  };

  const handleCancelTherapy = async () => {
    await saveSessionData('cancelled');
    onCancel();
    resetTherapyData();
  };

  const resetTherapyData = () => {
    setGameMode('selection');
    setGameCompleted(false);
    setCurrentSession(null);
    setClosingTimes([]);
    setOpeningTimes([]);
    setAttempts([]);
    setFastestClosing(null);
    setAverageClosing(null);
    setFastestOpening(null);
    setAverageOpening(null);
    openTimestamp.current = null;
    closedTimestamp.current = null;
    lastState.current = null;
  };

  const handleGameComplete = () => setGameCompleted(true);

  // --- Lógica de registro de manos ---
  useEffect(() => {
    if (!isTherapyActive) return;

    const now = performance.now();
    const isOpen = rightHand.angles.finger2 < 20;
    const isClosed = rightHand.angles.finger2 > 70;
    const currentState: 'open' | 'closed' | 'neutral' = isOpen ? 'open' : isClosed ? 'closed' : 'neutral';
    if (currentState === 'neutral') return;

    if (lastState.current === null) {
      if (currentState === 'open') openTimestamp.current = now;
      else if (currentState === 'closed') closedTimestamp.current = now;
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

  // --- Guardar automáticamente cuando se termina el temporizador ---
  useEffect(() => {
    if (timeLeft === 0 && currentSession) {
      saveSessionData('completed');
    }
  }, [timeLeft, currentSession]);

  const startGame = (mode: Exclude<GameMode, 'selection' | 'timer'>) => {
    setGameMode(mode);
    setGameCompleted(false);
    if (!isActive) onStartTimer();
  };

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

      {user && currentSession && (
        <div className="mb-4 text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full">
          ✅ Conectado a Supabase - Sesión: {currentSession.slice(-8)}
        </div>
      )}

      <div className="flex gap-4">
        <Button
          onClick={onPause}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 text-lg"
          size="lg"
          disabled={!isActive}
        >
          {isPaused ? (
            <>
              <Play className="w-6 h-6 mr-2" /> Reanudar
            </>
          ) : (
            <>
              <Pause className="w-6 h-6 mr-2" /> Pausar
            </>
          )}
        </Button>
        <Button
          onClick={handleCancelTherapy}
          variant="destructive"
          className="px-6 py-3 text-lg"
          size="lg"
        >
          <X className="w-6 h-6 mr-2" /> Cancelar
        </Button>
      </div>
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
        <Button
          onClick={handleStartTherapy}
          className="w-full h-14 text-base bg-primary hover:bg-primary/90"
          disabled={isPaused || isActive}
        >
          🧠 Terapia Guiada
        </Button>
        <Button
          onClick={() => startGame('orange-squeeze')}
          className="w-full h-14 text-base bg-orange-500 hover:bg-orange-600"
        >
          🍊 Exprimiendo Naranjas
          <div className="text-xs mt-1">Meta: {targetGlasses} vasos</div>
        </Button>
        <Button
          onClick={() => startGame('neurolink')}
          className="w-full h-14 text-base bg-purple-500 hover:bg-purple-600"
        >
          🎯 NeuroLink
        </Button>
        <Button
          onClick={() => startGame('flappy-bird')}
          variant="outline"
          className="w-full h-14 text-base"
        >
          🐦 Flappy Bird
        </Button>
      </CardContent>
    </Card>
  );

  const renderGameContent = () => {
    switch (gameMode) {
      case 'orange-squeeze':
        return <OrangeSqueezeGame targetGlasses={targetGlasses} onComplete={handleGameComplete} />;
      case 'neurolink':
        return <NeuroLinkGame onComplete={handleGameComplete} />;
      case 'flappy-bird':
        return <FlappyBirdGame onComplete={handleGameComplete} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg p-6 relative overflow-y-auto w-[95vw] h-[90vh]">
        {gameMode === 'selection' ? (
          <div className="flex items-center justify-center h-full">{renderGameSelection()}</div>
        ) : gameMode === 'timer' ? (
          <div className="flex flex-col items-center">
            <h2 className="text-center font-bold text-2xl mb-6">Sesión de Terapia</h2>

            <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
              {/* Mano izquierda */}
              <div className="lg:col-span-1 p-4 border rounded-lg shadow">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-medical-green">{t.nonPareticHand}</CardTitle>
                    <Badge variant="secondary" className="w-fit mx-auto bg-medical-green/10 text-medical-green">{t.withSensors}</Badge>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center">
                    <div className="hand-non-paretic w-24 h-32 rounded-2xl flex items-center justify-center shadow-lg">
                      ✋
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Video */}
              <div className="lg:col-span-3 p-4 border rounded-lg shadow">
                <iframe
                  src="https://www.youtube.com/embed/QgBgP2c-3so?autoplay=1&loop=1&playlist=QgBgP2c-3so"
                  className="w-full h-[500px] rounded-lg border-0"
                  allow="autoplay; encrypted-media; fullscreen"
                  allowFullScreen
                  title="Terapia de Rehabilitación"
                />
              </div>

              {/* Mano derecha */}
              <div className="lg:col-span-1 p-4 border rounded-lg shadow">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-medical-orange">{t.pareticHand}</CardTitle>
                    <Badge variant="secondary" className="w-fit mx-auto bg-medical-orange/10 text-medical-orange">{t.withExoskeleton}</Badge>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center">
                    <div className="hand-paretic w-24 h-32 rounded-2xl flex items-center justify-center shadow-lg">
                      ✋
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {renderTimerControls()}
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="flex-1 w-full max-w-4xl mb-6">{renderGameContent()}</div>
            {renderTimerControls()}
            {gameCompleted && (
              <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg text-center">
                🎉 ¡Juego completado! Continúa hasta que termine el tiempo
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TherapyOverlay;
