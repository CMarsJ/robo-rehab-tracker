
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pause, Play, X, Gamepad2 } from 'lucide-react';
import OrangeSqueezeGame from '@/components/OrangeSqueezeGame';
import NeuroLinkGame from '@/components/NeuroLinkGame';
import FlappyBirdGame from '@/components/FlappyBirdGame';
import { useGameConfig } from '@/contexts/GameConfigContext';

interface TherapyOverlayProps {
  timeLeft: number;
  isPaused: boolean;
  onPause: () => void;
  onCancel: () => void;
  formatTime: (seconds: number) => string;
  duration: number;
}

type GameMode = 'selection' | 'orange-squeeze' | 'neurolink' | 'flappy-bird';

const TherapyOverlay: React.FC<TherapyOverlayProps> = ({
  timeLeft,
  isPaused,
  onPause,
  onCancel,
  formatTime,
  duration
}) => {
  const [gameMode, setGameMode] = useState<GameMode>('selection');
  const [gameCompleted, setGameCompleted] = useState(false);
  const { calculateOrangeGoalForTime } = useGameConfig();

  const targetGlasses = calculateOrangeGoalForTime(duration);

  const handleGameComplete = () => {
    setGameCompleted(true);
  };

  const renderGameSelection = () => (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center flex items-center justify-center gap-2">
          <Gamepad2 className="w-6 h-6" />
          Selecciona un Juego
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3">
        <Button
          onClick={() => setGameMode('orange-squeeze')}
          className="w-full h-14 text-base bg-orange-500 hover:bg-orange-600"
        >
          🍊 Exprimiendo Naranjas
          <div className="text-xs mt-1">Meta: {targetGlasses} vasos</div>
        </Button>

        <Button
          onClick={() => setGameMode('neurolink')}
          className="w-full h-14 text-base bg-purple-500 hover:bg-purple-600"
        >
          🎯 NeuroLink
        </Button>

        <Button
          onClick={() => setGameMode('flappy-bird')}
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
        return renderGameSelection();
    }
  };

  // Interfaz unificada: Video de terapia + Juegos en una misma vista
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg p-6 relative overflow-y-auto w-[95vw] h-[90vh]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          {/* Columna izquierda: Video de terapia */}
          <div className="flex flex-col">
            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="text-center">Sesión de Terapia</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center border-2 border-blue-300 overflow-hidden" style={{ minHeight: 260 }}>
                  <iframe
                    src="https://www.youtube.com/embed/QgBgP2c-3so?autoplay=1&loop=1&playlist=QgBgP2c-3so&controls=1&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1"
                    className="w-full h-[300px] lg:h-full border-0"
                    allow="autoplay; encrypted-media; fullscreen"
                    allowFullScreen
                    title="Terapia de Rehabilitación"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Timer y estado */}
            <div className="mt-4 text-center">
              <div className="text-3xl font-bold text-primary mb-1">
                {formatTime(timeLeft)}
              </div>
              <div className="text-sm text-muted-foreground">
                {isPaused ? 'Pausado' : 'Tiempo restante'}
              </div>
            </div>
          </div>

          {/* Columna derecha: Juegos */}
          <div className="flex flex-col h-full">
            <div className="flex-1 min-h-0">
              {renderGameContent()}
            </div>

            {/* Notificación de juego completado */}
            {gameCompleted && (
              <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg text-center">
                <p className="text-green-800 font-semibold">🎉 ¡Juego completado! Continúa hasta que termine el tiempo</p>
              </div>
            )}
          </div>
        </div>

        {/* Controles inferiores */}
        <div className="mt-6 flex items-center justify-center gap-8">
          <Button
            onClick={onPause}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 text-lg"
            size="lg"
          >
            {isPaused ? (
              <>
                <Play className="w-6 h-6 mr-2" />
                Reanudar
              </>
            ) : (
              <>
                <Pause className="w-6 h-6 mr-2" />
                Pausar
              </>
            )}
          </Button>

          <Button
            onClick={onCancel}
            variant="destructive"
            className="px-6 py-3 text-lg"
            size="lg"
          >
            <X className="w-6 h-6 mr-2" />
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TherapyOverlay;

