
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pause, Play, X, Gamepad2 } from 'lucide-react';
import OrangeSqueezeGame from '@/components/OrangeSqueezeGame';
import { useGameConfig } from '@/contexts/GameConfigContext';

interface TherapyOverlayProps {
  timeLeft: number;
  isPaused: boolean;
  onPause: () => void;
  onCancel: () => void;
  formatTime: (seconds: number) => string;
  duration: number;
}

type GameMode = 'selection' | 'orange-squeeze' | 'frog-defense' | 'regular';

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
    // Mostrar mensaje de completado del juego pero continuar con el temporizador
  };

  const renderGameSelection = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center flex items-center justify-center gap-2">
          <Gamepad2 className="w-6 h-6" />
          Selecciona un Juego
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={() => setGameMode('orange-squeeze')}
          className="w-full h-16 text-lg bg-orange-500 hover:bg-orange-600"
        >
          🍊 Exprimiendo Naranjas
          <div className="text-sm mt-1">Meta: {targetGlasses} vasos</div>
        </Button>
        
        <Button
          onClick={() => setGameMode('frog-defense')}
          className="w-full h-16 text-lg bg-green-500 hover:bg-green-600"
        >
          🐸 Defensa de la Rana
          <div className="text-sm mt-1">Próximamente</div>
        </Button>
        
        <Button
          onClick={() => setGameMode('regular')}
          variant="outline"
          className="w-full"
        >
          Modo Regular (Solo temporizador)
        </Button>
      </CardContent>
    </Card>
  );

  const renderGameContent = () => {
    switch (gameMode) {
      case 'orange-squeeze':
        return <OrangeSqueezeGame targetGlasses={targetGlasses} onComplete={handleGameComplete} />;
      case 'frog-defense':
        return (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-6xl mb-4">🐸</div>
              <h3 className="text-2xl font-bold">Defensa de la Rana</h3>
              <p className="text-muted-foreground mt-2">Próximamente...</p>
              <div className="mt-6">
                <div className="text-4xl font-bold text-primary mb-2">
                  {formatTime(timeLeft)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {isPaused ? 'Terapia pausada' : 'Terapia en progreso'}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      case 'regular':
        return (
          <div className="text-center space-y-6">
            {/* Imagen de la mano */}
            <div className="flex justify-center">
              <div className="w-80 h-60 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center border-2 border-blue-300">
                <div className="text-6xl">👋</div>
              </div>
            </div>
            
            {/* Tiempo central */}
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">
                {formatTime(timeLeft)}
              </div>
              <div className="text-sm text-muted-foreground">
                {isPaused ? 'Terapia pausada' : 'Terapia en progreso'}
              </div>
            </div>
          </div>
        );
      default:
        return renderGameSelection();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg p-8 w-full max-w-4xl mx-4 relative max-h-[90vh] overflow-y-auto">
        {gameMode === 'selection' ? (
          renderGameSelection()
        ) : (
          <>
            {/* Contenido del juego o modo regular */}
            <div className="mb-8">
              {renderGameContent()}
            </div>

            {/* Notificación de juego completado */}
            {gameCompleted && (
              <div className="mb-6 p-4 bg-green-100 border border-green-300 rounded-lg text-center">
                <p className="text-green-800 font-semibold">🎉 ¡Juego completado! Continúa hasta que termine el tiempo</p>
              </div>
            )}

            {/* Controles inferiores */}
            <div className="flex items-center justify-center gap-8">
              {/* Botón de pausar/reanudar */}
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

              {/* Tiempo central para juegos */}
              {gameMode !== 'regular' && (
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {formatTime(timeLeft)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {isPaused ? 'Pausado' : 'Tiempo restante'}
                  </div>
                </div>
              )}

              {/* Botón de cancelar */}
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
          </>
        )}
      </div>
    </div>
  );
};

export default TherapyOverlay;
