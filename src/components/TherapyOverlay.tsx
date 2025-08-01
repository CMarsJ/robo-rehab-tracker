
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pause, Play, X, Gamepad2 } from 'lucide-react';
import OrangeSqueezeGame from '@/components/OrangeSqueezeGame';
import NeuroLinkGame from '@/components/NeuroLinkGame';
import { useGameConfig } from '@/contexts/GameConfigContext';

interface TherapyOverlayProps {
  timeLeft: number;
  isPaused: boolean;
  onPause: () => void;
  onCancel: () => void;
  formatTime: (seconds: number) => string;
  duration: number;
  mode: 'therapy' | 'fun';
}

type GameMode = 'selection' | 'orange-squeeze' | 'neurolink' | 'regular';

const TherapyOverlay: React.FC<TherapyOverlayProps> = ({
  timeLeft,
  isPaused,
  onPause,
  onCancel,
  formatTime,
  duration,
  mode
}) => {
  // En modo terapia siempre regular, en modo diversión empezar con selección
  const [gameMode, setGameMode] = useState<GameMode>(mode === 'therapy' ? 'regular' : 'selection');
  const [gameCompleted, setGameCompleted] = useState(false);
  const { calculateOrangeGoalForTime } = useGameConfig();

  const targetGlasses = calculateOrangeGoalForTime(duration);

  const handleGameComplete = () => {
    setGameCompleted(true);
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
          onClick={() => setGameMode('neurolink')}
          className="w-full h-16 text-lg bg-purple-500 hover:bg-purple-600"
        >
          🎯 NeuroLink
          <div className="text-sm mt-1">Dispara automáticamente a los objetivos</div>
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
      case 'neurolink':
        return <NeuroLinkGame onComplete={handleGameComplete} />;
      case 'regular':
        return (
          <div className="h-full flex flex-col">
            {/* Contenedor central - iframe de YouTube en modo terapia, mano en modo diversión */}
            <div className="flex-1 flex justify-center mb-6">
              <div className="w-full bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center border-2 border-blue-300 overflow-hidden" style={{ height: '80%' }}>
                {mode === 'therapy' ? (
                  <iframe
                    src="https://www.youtube.com/embed/bZaKJr5XA2g?autoplay=1&loop=1&playlist=bZaKJr5XA2g&controls=1&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1"
                    className="w-full h-full border-0"
                    allow="autoplay; encrypted-media; fullscreen"
                    allowFullScreen
                    title="Terapia de Rehabilitación"
                  />
                ) : (
                  <div className="text-6xl">👋</div>
                )}
              </div>
            </div>
            
            {/* Tiempo central */}
            <div className="text-center mb-6">
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
      <div className="bg-background rounded-lg p-8 relative overflow-y-auto" style={{ width: '90vw', height: '90vh' }}>
        {/* Solo mostrar selección de juegos en modo diversión */}
        {(gameMode === 'selection' && mode === 'fun') ? (
          <div className="flex items-center justify-center h-full">
            {renderGameSelection()}
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {/* Contenido del juego o modo regular */}
            <div className="flex-1">
              {renderGameContent()}
            </div>

            {/* Notificación de juego completado */}
            {gameCompleted && (
              <div className="mb-6 p-4 bg-green-100 border border-green-300 rounded-lg text-center">
                <p className="text-green-800 font-semibold">🎉 ¡Juego completado! Continúa hasta que termine el tiempo</p>
              </div>
            )}

            {/* Controles inferiores */}
            <div className="flex items-center justify-center gap-8 mt-auto">
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
          </div>
        )}
      </div>
    </div>
  );
};

export default TherapyOverlay;
