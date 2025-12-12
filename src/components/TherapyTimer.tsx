import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play } from 'lucide-react';
import { useApp, useTranslation } from '@/contexts/AppContext';
import { useSimulation } from '@/contexts/SimulationContext';
import { useConfig } from '@/contexts/ConfigContext';
import { useAuth } from '@/contexts/AuthContext';
import { SessionService } from '@/services/sessionService';
import { EffortDataPoint } from '@/types/database';
import TherapyOverlay from '@/components/TherapyOverlay';
import { mqttService } from '@/services/mqttService';

interface TherapyTimerProps {
  onSessionComplete?: () => void;
}

const TherapyTimer: React.FC<TherapyTimerProps> = ({ onSessionComplete }) => {
  const [duration, setDuration] = useState([15]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [sampleCounter, setSampleCounter] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [pauseStartTime, setPauseStartTime] = useState<number | null>(null);
  const [totalPausedTime, setTotalPausedTime] = useState(0);
  const [sessionEffortData, setSessionEffortData] = useState<EffortDataPoint[]>([]);
  
  const { addNotification } = useApp();
  const { setIsTherapyActive, leftHand, rightHand, addEffortData, clearEffortHistory } = useSimulation();
  const { patientName } = useConfig();
  const { user } = useAuth();
  const t = useTranslation();

  const playVictorySound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const playNote = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, startTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    const now = audioContext.currentTime;
    playNote(261.63, now, 0.3);
    playNote(329.63, now + 0.3, 0.3);
    playNote(392.00, now + 0.6, 0.3);
    playNote(523.25, now + 0.9, 0.5);
  };

  // Efecto separado para el temporizador - solo depende de estados del timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && !isPaused && startTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const elapsedTime = now - startTime - totalPausedTime;
        const elapsedSeconds = Math.floor(elapsedTime / 1000);
        const newTimeLeft = Math.max(0, duration[0] * 60 - elapsedSeconds);
        
        setTimeLeft(newTimeLeft);

        if (newTimeLeft <= 0) {
          setIsActive(false);
          setIsPaused(false);
          setIsTherapyActive(false);
          setTimeout(() => setShowOverlay(false), 500);
          setSampleCounter(0);
          setStartTime(null);
          setPauseStartTime(null);
          setTotalPausedTime(0);
          
          mqttService.stopTherapy();
          
          playVictorySound();
          
          if (currentSessionId && user) {
            finishSession();
          }
          
          addNotification({
            title: `¡Felicidades ${patientName}!`,
            message: t.sessionCompleted,
            type: 'success'
          });
          
          if (onSessionComplete) {
            onSessionComplete();
          }
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isPaused, startTime, totalPausedTime, duration, currentSessionId, user]);

  // Efecto separado para muestreo de esfuerzo - depende de datos de manos
  useEffect(() => {
    let sampleInterval: NodeJS.Timeout | null = null;

    if (isActive && !isPaused) {
      sampleInterval = setInterval(() => {
        setSampleCounter(prev => {
          const newCounter = prev + 1;
          if (newCounter >= 60 && (leftHand.active || rightHand.active)) {
            const effortPoint: EffortDataPoint = {
              timestamp: Date.now(),
              value: rightHand.effort,
              hand: 'right'
            };
            
            setSessionEffortData(prevData => [...prevData, effortPoint]);
            addEffortData(rightHand.effort, leftHand.effort);
            return 0;
          }
          return newCounter;
        });
      }, 100);
    }

    return () => {
      if (sampleInterval) clearInterval(sampleInterval);
    };
  }, [isActive, isPaused, leftHand, rightHand, addEffortData]);

  const startSession = async () => {
    if (!user) return null;

    try {
      // Reutilizar sesión existente si ya fue creada por el overlay
      const existingId = localStorage.getItem('currentSessionId');
      if (existingId) {
        return existingId;
      }

      const sessionId = await SessionService.createSession({
        therapy_type: 'terapia_guiada',
        duration: duration[0],
        state: 'active'
      });
      const id = sessionId?.id || null;
      if (id) localStorage.setItem('currentSessionId', id);
      return id;
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  };

  const finishSession = async () => {
    if (!currentSessionId && typeof window !== 'undefined') {
      const stored = localStorage.getItem('currentSessionId');
      if (stored) setCurrentSessionId(stored);
    }
    if (!currentSessionId || !user) return;

    try {
      await SessionService.updateSessionState(currentSessionId, 'completed');
      localStorage.removeItem('currentSessionId');
      setSessionEffortData([]);
    } catch (error) {
      console.error('Error finishing session:', error);
    }
  };

  const handleStart = async () => {
    setShowOverlay(true);
    if (!isActive) {
      await startTimerNow();
    }
  };

  const startTimerNow = async () => {
    console.log('⏱️ startTimerNow called, isActive:', isActive, 'user:', !!user);
    if (!isActive && user) {
      const sessionId = await startSession();
      setCurrentSessionId(sessionId);
      
      // Enviar comando start al ESP32
      mqttService.startTherapy();
      
      const initialTimeLeft = duration[0] * 60;
      console.log('⏱️ Setting timeLeft to:', initialTimeLeft);
      setTimeLeft(initialTimeLeft);
      setStartTime(Date.now());
      setPauseStartTime(null);
      setTotalPausedTime(0);
      setIsActive(true);
      setIsPaused(false);
      setIsTherapyActive(true);
      clearEffortHistory();
      setSampleCounter(0);
      setSessionEffortData([]);
      console.log('⏱️ Timer started successfully');
    } else {
      console.log('⚠️ Timer not started - isActive:', isActive, 'user:', !!user);
    }
  };
  const handlePause = () => {
    if (isPaused) {
      if (pauseStartTime) {
        setTotalPausedTime(prev => prev + (Date.now() - pauseStartTime));
        setPauseStartTime(null);
      }
    } else {
      setPauseStartTime(Date.now());
    }
    setIsPaused(!isPaused);
  };

  const handleCancel = async () => {
    // Enviar comando stop al ESP32
    mqttService.stopTherapy();
    
    if (currentSessionId && user) {
      try {
        await SessionService.updateSessionState(currentSessionId, 'cancelled');
      } catch (error) {
        console.error('Error cancelling session:', error);
      }
    }
    
    try { localStorage.removeItem('currentSessionId'); } catch {}
    setIsActive(false);
    setIsPaused(false);
    setTimeLeft(0);
    setIsTherapyActive(false);
    setShowOverlay(false);
    setCurrentSessionId(null);
    setStartTime(null);
    setPauseStartTime(null);
    setTotalPausedTime(0);
    clearEffortHistory();
    setSampleCounter(0);
    setSessionEffortData([]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = timeLeft > 0 ? ((duration[0] * 60 - timeLeft) / (duration[0] * 60)) * 100 : 0;

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{t.therapyTimer}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-medium">{t.duration}</label>
            <Slider
              value={duration}
              onValueChange={setDuration}
              max={60}
              min={5}
              step={5}
              className="w-full"
              disabled={isActive}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>5min</span>
              <span>{duration[0]}min</span>
              <span>60min</span>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  className="text-muted-foreground/20"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                  className="text-primary transition-all duration-1000 ease-linear"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-2xl font-bold">
                  {isActive ? formatTime(timeLeft) : `${duration[0]}:00`}
                </div>
                <div className="text-xs text-muted-foreground">
                  {isActive ? (isPaused ? 'Pausado' : 'Activo') : t.ready}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              onClick={handleStart}
              className="bg-primary hover:bg-primary/90 text-white px-8 py-3 text-lg"
              disabled={isActive}
            >
              <Play className="w-5 h-5 mr-2" />
              {t.start}
            </Button>
          </div>
        </CardContent>
      </Card>

      {showOverlay && (
        <TherapyOverlay
          timeLeft={timeLeft}
          isPaused={isPaused}
          onPause={handlePause}
          onCancel={handleCancel}
          formatTime={formatTime}
          duration={duration[0]}
          onStartTimer={startTimerNow}
          isActive={isActive}
        />
      )}
    </>
  );
};

export default TherapyTimer;
