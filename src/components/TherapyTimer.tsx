import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play } from 'lucide-react';
import { useApp, useTranslation } from '@/contexts/AppContext';
import { useSimulation } from '@/contexts/SimulationContext';
import TherapyOverlay from '@/components/TherapyOverlay';

interface TherapyTimerProps {
  onSessionComplete?: () => void;
}

const TherapyTimer: React.FC<TherapyTimerProps> = ({ onSessionComplete }) => {
  const [duration, setDuration] = useState([15]); // en minutos
  const [timeLeft, setTimeLeft] = useState(0); // en segundos
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [sampleCounter, setSampleCounter] = useState(0); // Contador para muestreo
  const { addNotification } = useApp();
  const { setIsTherapyActive, leftHand, rightHand, addEffortData, clearEffortHistory } = useSimulation();
  const t = useTranslation();

  // Safely get patient name with fallback
  let patientName = 'Paciente';
  try {
    const { useConfig } = require('@/contexts/ConfigContext');
    const config = useConfig();
    patientName = config.patientName;
  } catch (error) {
    console.log('Config context not available, using default patient name');
  }

  // Función para reproducir sonido de victoria
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

    // Melodía de victoria (Do-Mi-Sol-Do octava alta)
    const now = audioContext.currentTime;
    playNote(261.63, now, 0.3); // Do
    playNote(329.63, now + 0.3, 0.3); // Mi
    playNote(392.00, now + 0.6, 0.3); // Sol
    playNote(523.25, now + 0.9, 0.5); // Do octava alta
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => {
          if (time <= 1) {
            // Sesión completada
            setIsActive(false);
            setIsPaused(false);
            setIsTherapyActive(false);
            setShowOverlay(false);
            setSampleCounter(0);
            
            // Reproducir sonido de victoria
            playVictorySound();
            
            addNotification({
              title: `¡Felicidades ${patientName}!`,
              message: t.sessionCompleted,
              type: 'success'
            });
            
            if (onSessionComplete) {
              onSessionComplete();
            }
            return 0;
          }

          return time - 1;
        });

        // Incrementar contador de muestreo cada 0.1 segundos (100ms)
        setSampleCounter(prev => {
          const newCounter = prev + 1;
          // Agregar datos de esfuerzo cada 60 muestras (6 segundos a 0.1s por muestra)
          if (newCounter >= 60 && (leftHand.active || rightHand.active)) {
            addEffortData(rightHand.effort, leftHand.effort);
            return 0; // Reset counter
          }
          return newCounter;
        });
      }, 100); // 100ms = 0.1 segundos
    } else if (!isActive) {
      setTimeLeft(0);
      setSampleCounter(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isPaused, timeLeft, addNotification, t, onSessionComplete, setIsTherapyActive, patientName, leftHand, rightHand, addEffortData, duration]);

  const handleStart = () => {
    if (!isActive) {
      setTimeLeft(duration[0] * 60);
      setIsActive(true);
      setIsPaused(false);
      setIsTherapyActive(true);
      setShowOverlay(true);
      clearEffortHistory(); // Limpiar historial anterior
      setSampleCounter(0);
    }
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleCancel = () => {
    setIsActive(false);
    setIsPaused(false);
    setTimeLeft(0);
    setIsTherapyActive(false);
    setShowOverlay(false);
    clearEffortHistory();
    setSampleCounter(0);
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
          {/* Selector de duración */}
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

          {/* Timer circular */}
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

          {/* Controles */}
          <div className="flex gap-3 justify-center">
            <Button
              onClick={handleStart}
              className="bg-medical-blue hover:bg-medical-blue-dark text-white px-6"
              disabled={isActive}
            >
              <Play className="w-4 h-4 mr-2" />
              {t.start}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Overlay de terapia */}
      {showOverlay && (
        <TherapyOverlay
          timeLeft={timeLeft}
          isPaused={isPaused}
          onPause={handlePause}
          onCancel={handleCancel}
          formatTime={formatTime}
          duration={duration[0]}
        />
      )}
    </>
  );
};

export default TherapyTimer;
