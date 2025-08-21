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

  const handleStartTherapy = async () => {
    if (!user) return;

    try {
      // 🔹 Crear sesión en Supabase
      const session = await SessionService.saveTherapyData({
        therapy_type: 'terapia_guiada',
        timer: {},
        started_at: new Date().toISOString(),
        duration_ms: duration * 60 * 1000
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
    openTimestamp.current = null;
    closedTimestamp.current = null;
    lastState.current = null;
  };

  const saveTherapyData = async () => {
    if (!currentSession || !user) return;

    try {
      await SessionService.saveTherapyData({
        session_id: currentSession,
        therapy_type: 'terapia_guiada',
        timer: {
          best_open_time: fastestOpening ? fastestOpening / 1000 : undefined,
          best_close_time: fastestClosing ? fastestClosing / 1000 : undefined,
          avg_open_time: averageOpening ? averageOpening / 1000 : undefined,
          avg_close_time: averageClosing ? averageClosing / 1000 : undefined,
          opening_times: openingTimes.map(t => t / 1000),
          closing_times: closingTimes.map(t => t / 1000),
          attempts_count: attempts.length
        },
        started_at: new Date(Date.now() - (duration * 60 * 1000)).toISOString(),
        ended_at: new Date().toISOString(),
        duration_ms: duration * 60 * 1000
      });
    } catch (error) {
      console.error('Error guardando datos de terapia:', error);
    }
  };

  const handleCancelTherapy = async () => {
    if (currentSession && user) {
      try {
        const actualDuration = Math.round((duration * 60 - timeLeft) / 60);

        await SessionService.updateSession(currentSession, {
          duracion_minutos: actualDuration,
          estado: 'cancelled',
          ended_at: new Date().toISOString(),
          metrics: {
            targetDuration: duration,
            completedDuration: actualDuration,
            cancelledAt: new Date().toISOString()
          }
        });

        if (closingTimes.length > 0 || openingTimes.length > 0) {
          await saveTherapyData();
        }
      } catch (error) {
        console.error('Error al cancelar sesión:', error);
      }
    }

    onCancel();
    resetTherapyData();
  };

  useEffect(() => {
    const handleSessionComplete = async () => {
      if (timeLeft === 0 && currentSession && user && isActive) {
        try {
          await SessionService.updateSession(currentSession, {
            estado: 'completed',
            ended_at: new Date().toISOString(),
            metrics: {
              targetDuration: duration,
              completedDuration: duration,
              totalClosingAttempts: closingTimes.length,
              totalOpeningAttempts: openingTimes.length,
              bestClosingTime: fastestClosing ? fastestClosing / 1000 : null,
              bestOpeningTime: fastestOpening ? fastestOpening / 1000 : null,
              completedAt: new Date().toISOString()
            }
          });

          await saveTherapyData();
        } catch (error) {
          console.error('Error completando sesión:', error);
        }
      }
    };

    handleSessionComplete();
  }, [timeLeft, currentSession, user, isActive, duration, closingTimes.length, openingTimes.length, fastestClosing, fastestOpening]);

  const startGame = (mode: Exclude<GameMode, 'selection' | 'timer'>) => {
    setGameCompleted(false);
    setGameMode(mode);
    if (!isActive) onStartTimer();
  };

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

  // --- Mantener renderTimerControls, renderGameSelection, renderGameContent tal cual ---
  // Todo tu código UI queda intacto, no cambia nada del menú ni los juegos

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg p-6 relative overflow-y-auto w-[95vw] h-[90vh]">
        {gameMode === 'selection' ? (
          <div className="flex items-center justify-center h-full">{/* renderGameSelection() */}</div>
        ) : (
          <div className="flex flex-col items-center">{/* renderGameContent
