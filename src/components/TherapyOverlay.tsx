import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pause, Play, X, Gamepad2 } from 'lucide-react';
import OrangeSqueezeGame from '@/components/OrangeSqueezeGame';
import NeuroLinkGame from '@/components/NeuroLinkGame';
import FlappyBirdGame from '@/components/FlappyBirdGame';
import { useGameConfig } from '@/contexts/GameConfigContext';
import HandMonitoring from '@/components/HandMonitoring';

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
  const { calculateOrangeGoalForTime } = useGameConfig();

  const targetGlasses = calculateOrangeGoalForTime(duration);

  const handleGameComplete = () => setGameCompleted(true);

  const handleStartTherapy = () => {
    // Terapia Guiada: inicia el temporizador y muestra el modo timer
    onStartTimer();
    setGameMode('timer');
    setGameCompleted(false);
  };

  const handleCancelTherapy = () => {
    // Cancelar (detener temporizador en el parent) y volver al selector
    onCancel();
    setGameMode('selection');
    setGameCompleted(false);
  };

  // Nuevo helper: al empezar un juego, abrir el juego y arrancar el timer si no está activo
  const startGame = (mode: Exclude<GameMode, 'selection' | 'timer'>) => {
    setGameCompleted(false);
    setGameMode(mode);
    // Si el temporizador no está activo, arrancarlo
    if (!isActive) {
      onStartTimer();
    }
  };

  const renderTimerControls = () => (
    <div className="flex flex-col items-center mt-4">
      <div className="text-3xl font-bold text-primary mb-1">
        {isActive ? formatTime(timeLeft) : `${duration}:00`}
      </div>
      <div className="text-sm text-muted-foreground mb-4">
        {isPaused ? 'Pausado' : isActive ? 'Tiempo restante' : 'Listo para iniciar'}
      </div>
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

        {/* Ahora los botones de juego usan startGame(...) */}
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
   const {
      isTherapyActive
    } = useSimulation();

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg p-6 relative overflow-y-auto w-[95vw] h-[90vh]">
        {gameMode === 'selection' ? (
          <div className="flex items-center justify-center h-full">{renderGameSelection()}</div>
        ) : gameMode === 'timer' ? (
          <div className="flex flex-col items-center">
            {/* Temporizador + botones */}
            {renderTimerControls()}
            {/* Video arriba */}
            <div className="w-full max-w-3xl p-4 border rounded-lg shadow mb-6">
              <h2 className="text-center font-bold text-xl mb-4">Sesión de Terapia</h2>
              <div className="bg-blue-100 p-2 rounded-lg">
                <iframe
                  src="https://www.youtube.com/embed/QgBgP2c-3so?autoplay=1&loop=1&playlist=QgBgP2c-3so"
                  className="w-full h-[500px] rounded-lg border-0"
                  allow="autoplay; encrypted-media; fullscreen"
                  allowFullScreen
                  title="Terapia de Rehabilitación"
                />
              </div>
            {/* Monitoreo de manos */}
            <HandMonitoring isTherapyActive={isTherapyActive} />
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