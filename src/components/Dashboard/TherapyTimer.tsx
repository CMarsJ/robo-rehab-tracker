
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Square } from 'lucide-react';

export const TherapyTimer = () => {
  const [duration, setDuration] = useState([15]);
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    setTimeLeft(duration[0] * 60);
  }, [duration]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => {
          if (time <= 1) {
            setIsRunning(false);
            setIsCompleted(true);
            
            // Reproducir sonido de completado
            try {
              const audio = new Audio();
              audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcDEOZ2fODcyYDMYvV6rCYHQ0oZbzt4qJVFAhDoOK2bmMdDk+mzOWzYhs7u9/qnXUaAC90vOflkjgKEmuT0/vWkCkCZKva9L9vNAMuh9T1lzgKE2eq3+uecRcFRZzd8rptSQAmdJRC';
              audio.play().catch(() => console.log('No se pudo reproducir el sonido'));
            } catch (error) {
              console.log('Error al reproducir sonido:', error);
            }

            // Agregar notificación
            if ((window as any).addNotification) {
              (window as any).addNotification('¡Felicidades! Terapia completada exitosamente.');
            }

            // Auto-actualizar logros (simulado)
            if ((window as any).updateAchievements) {
              (window as any).updateAchievements();
            }

            // Auto-reiniciar después de 3 segundos
            setTimeout(() => {
              setIsCompleted(false);
              setTimeLeft(duration[0] * 60);
            }, 3000);

            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, duration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsRunning(!isRunning);
    setIsCompleted(false);
  };

  const handleStop = () => {
    setIsRunning(false);
    setTimeLeft(duration[0] * 60);
    setIsCompleted(false);
  };

  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Temporizador de Terapia
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
            Duración (minutos)
          </label>
          <Slider
            value={duration}
            onValueChange={setDuration}
            max={60}
            min={5}
            step={5}
            className="w-full"
            disabled={isRunning}
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>5min</span>
            <span className="font-medium">{duration[0]}min</span>
            <span>60min</span>
          </div>
        </div>

        <div className="text-center">
          <div className={`w-32 h-32 mx-auto rounded-full border-4 flex items-center justify-center mb-4 transition-colors ${
            isRunning ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 animate-pulse' : 
            isCompleted ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 
            'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
          }`}>
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                isRunning ? 'text-blue-600 dark:text-blue-400' : 
                isCompleted ? 'text-green-600 dark:text-green-400' : 
                'text-gray-600 dark:text-gray-400'
              }`}>
                {formatTime(timeLeft)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {isCompleted ? '¡Completado!' : isRunning ? 'En curso' : 'Listo'}
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Button
              onClick={handleStart}
              className={`px-6 ${isRunning ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-500 hover:bg-blue-600'}`}
              disabled={isCompleted}
            >
              {isRunning ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {isRunning ? 'Pausar' : 'Iniciar'}
            </Button>
            
            <Button 
              onClick={handleStop}
              variant="destructive"
              className="px-6"
              disabled={isCompleted}
            >
              <Square className="w-4 h-4 mr-2" />
              Reiniciar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
