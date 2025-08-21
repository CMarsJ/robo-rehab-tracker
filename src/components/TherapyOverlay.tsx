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
  const [gameSettingsHistory, setGameSettingsHistory] = useState<any[]>([]);

  const { calculateOrangeGoalForTime } = useGameConfig();
  const { leftHand, rightHand, isTherapyActive } = useSimulation();
  const { user } = useAuth();
  const t = useTranslation();

  const targetGlasses = calculateOrangeGoalForTime(duration);

  const [closingTimes, setClosingTimes] = useState<number[]>([]);
  const [fastestClosing, setFastestClosing] = useState<number | null>(null);
  const [averageClosing, setAverageClosing] = useState<number | null>(null);

  const [openingTimes, setOpeningTimes] = useState<number[]>([]);
  const [fastestOpening, setFastestOpening] = useState<number | null>(null);
  const [averageOpening, setAverageOpening] = useState<number | null>(null);

  const [attempts, setAttempts] = useState<{ closingTime: number; openingTime: number; totalTime: number }[]>([]);

  const openTimestamp = useRef<number | null>(null);
  const closedTimestamp = useRef<number | null>(null);
  const lastState = useRef<'open' | 'closed' | null>(null);

  const handleGameComplete = () => setGameCompleted(true);

  // Crear sesión inicial de terapia
  const handleStartTherapy = async () => {
    if (!user) return;

    try {
      const session = await SessionService.saveTherapyData({
        therapy_type: 'terapia_guiada',
        start_time: new Date().toISOString(),
        duration,
        state: 'in_progress',
        score: 0,
        orange_used: 0,
        juice_used: 0,
        stats: {},
        details: [],
        extra_data: []
      });

      if (session) setCurrentSession(session.id);

    } catch (error) {
      console.error('Error creando sesión de terapia:', error);
    }

    onStartTimer();
    setGameMode('timer');
    setGameCompleted(false);
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
    setGameSettingsHistory([]);
    openTimestamp.current = null;
    closedTimestamp.current = null;
    lastState.current = null;
  };

  // Guardar datos de juego en extra_data
  const saveTherapyData = async () => {
    if (!currentSession || !user) return;

    try {
      await SessionService.updateSession(currentSession, {
        state: 'completed',
        ended_at: new Date().toISOString(),
        stats: {
          fastestOpening,
          fastestClosing,
          averageOpening,
          averageClosing
        },
        details: attempts,
        extra_data: gameSettingsHistory
      });

      console.log('Therapy data saved successfully');

    } catch (error) {
      console.error('Error guardando datos de terapia:', error);
    }
  };

  // Cancelar sesión
  const handleCancelTherapy = async () => {
    if (currentSession && user) {
      try {
        const actualDuration = Math.round((duration * 60 - timeLeft) / 60);

        await SessionService.updateSession(currentSession, {
          state: 'cancelled',
          ended_at: new Date().toISOString(),
          duration: actualDuration,
          stats: {
            fastestOpening,
            fastestClosing,
            averageOpening,
            averageClosing
          },
          details: attempts,
          extra_data: gameSettingsHistory
        });

        console.log('Sesión cancelada y datos guardados');

      } catch (error) {
        console.error('Error al cancelar sesión:', error);
      }
    }

    onCancel();
    resetTherapyData();
  };

  // Manejo de transición de manos y tiempos
  useEffect(() => {
    if (!isTherapyActive) return;
    const isOpen = rightHand.angles.finger2 < 20;
    const isClosed = rightHand.angles.finger2 > 70;
    const now = performance.now();
    const currentState: 'open' | 'closed' | 'neutral' = isOpen ? 'open' : isClosed ? 'closed' : 'neutral';

    if (currentState === 'neutral') return;

    if (lastState.current === null) {
      if (currentState === 'open') openTimestamp.current = now;
      else if (currentState === 'closed') closedTimestamp.current = now;
      lastState.current = currentState;
      return;
    }

    if (lastState.current !== currentState) {
      if (lastState.current === 'open' && currentState === 'closed' && openTimestamp.current) {
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

      if (lastState.current === 'closed' && currentState === 'open' && closedTimestamp.current) {
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

  // Guardar al completar sesión
  useEffect(() => {
    if (timeLeft === 0 && currentSession && isActive) {
      saveTherapyData();
    }
  }, [timeLeft, currentSession, isActive]);

  // Iniciar juego y registrar settings
  const startGame = (mode: Exclude<GameMode, 'selection' | 'timer'>) => {
    setGameCompleted(false);
    setGameMode(mode);

    let currentSettings: any = { game_mode: mode };

    if (mode === 'orange-squeeze') currentSettings.targetGlasses = targetGlasses;
    if (mode === 'neurolink') currentSettings.difficulty = 'hard';
    if (mode === 'flappy-bird') currentSettings.speed = 1.5;

    setGameSettingsHistory(prev => [...prev, currentSettings]);

    if (!isActive) onStartTimer();
  };

  const formatMs = (ms: number | null) => (ms === null ? '-' : (ms / 1000).toFixed(2) + 's');

  // Render
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
          <div className="text-xs mt-1">Inicia la sesión con temporizador</div>
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
      case 'orange-squeeze': return <OrangeSqueezeGame targetGlasses={targetGlasses} onComplete={handleGameComplete} />;
      case 'neurolink': return <NeuroLinkGame onComplete={handleGameComplete} />;
      case 'flappy-bird': return <FlappyBirdGame onComplete={handleGameComplete} />;
      default: return null;
    }
  };

  const renderTimerControls = () => (
    <div className="flex flex-col items-center mt-4">
      <div className="text-3xl font-bold text-primary mb-1">{isActive ? formatTime(timeLeft) : `${duration}:00`}</div>
      <div className="text-sm text-muted-foreground mb-4">{isPaused ? 'Pausado' : isActive ? 'Tiempo restante' : 'Listo para iniciar'}</div>
      {user && currentSession && <div className="mb-4 text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full">✅ Conectado a Supabase - Sesión: {currentSession.slice(-8)}</div>}
      <div className="flex gap-4">
        <Button onClick={onPause} className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 text-lg" size="lg" disabled={!isActive}>
          {isPaused ? <><Play className="w-6 h-6 mr-2" /> Reanudar</> : <><Pause className="w-6 h-6 mr-2" /> Pausar</>}
        </Button>
        <Button onClick={handleCancelTherapy} variant="destructive" className="px-6 py-3 text-lg" size="lg">
          <X className="w-6 h-6 mr-2" /> Cancelar
        </Button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg p-6 relative overflow-y-auto w-[95vw] h-[90vh]">
        {gameMode === 'selection' ? <div className="flex items-center justify-center h-full">{renderGameSelection()}</div>
        : gameMode === 'timer' ? <div className="flex flex-col items-center">{renderTimerControls()}</div>
        : <div className="flex flex-col items-center">{renderGameContent()}{renderTimerControls()}{gameCompleted && <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg text-center"><p className="text-green-800 font-semibold">🎉 ¡Juego completado! Continúa hasta que termine el tiempo</p></div>}</div>}
      </div>
    </div>
  );
};

export default TherapyOverlay;
