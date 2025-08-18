import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pause, Play, X, Gamepad2 } from 'lucide-react';
import OrangeSqueezeGame from '@/components/OrangeSqueezeGame';
import NeuroLinkGame from '@/components/NeuroLinkGame';
import FlappyBirdGame from '@/components/FlappyBirdGame';
import { useGameConfig } from '@/contexts/GameConfigContext';
import HandMonitoring from '@/components/HandMonitoring';
import { useSimulation } from '@/contexts/SimulationContext';
import { useTranslation } from '@/contexts/AppContext';

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
  const { leftHand, rightHand, isTherapyActive } = useSimulation();
  const t = useTranslation();

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

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg p-6 relative overflow-y-auto w-[95vw] h-[90vh]">
        {gameMode === 'selection' ? (
          <div className="flex items-center justify-center h-full">{renderGameSelection()}</div>
        ) : gameMode === 'timer' ? (
          <div className="flex flex-col items-center">
            {/* Título de la sesión */}
            <h2 className="text-center font-bold text-2xl mb-6">Sesión de Terapia</h2>
            
            {/* Layout en paralelo: Mano No Parética (1), Video (3), Mano Parética (1) */}
            <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
              {/* Mano No Parética */}
              <div className="lg:col-span-1 p-4 border rounded-lg shadow">
                <Card className={`border-2 transition-all duration-300 ${
                  leftHand.active && isTherapyActive
                    ? 'border-medical-green/60 bg-medical-green/5 hover:border-medical-green/80' 
                    : 'border-medical-green/20 hover:border-medical-green/40'
                }`}>
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-lg font-semibold text-medical-green">
                      {t.nonPareticHand}
                    </CardTitle>
                    <Badge variant="secondary" className="w-fit mx-auto bg-medical-green/10 text-medical-green">
                      {t.withSensors}
                    </Badge>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center">
                    <div className={`hand-non-paretic w-24 h-32 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 ${
                      leftHand.active && isTherapyActive
                        ? 'animate-pulse bg-medical-green/10' 
                        : 'bg-muted/50'
                    }`}>
                      <div className="text-3xl">✋</div>
                    </div>
                    
                    <div className="mt-3 space-y-2 w-full">
                      <h5 className="text-xs font-medium text-center">Ángulos</h5>
                      <div className="grid grid-cols-1 gap-1 text-xs">
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Pulgar IP:</span>
                            <span>{leftHand.angles.thumb1}°</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Pulgar MCP:</span>
                            <span>{leftHand.angles.thumb2}°</span>
                          </div>
                          <div className="flex justify-between">
                            <span>DIP:</span>
                            <span>{leftHand.angles.finger1}°</span>
                          </div>
                          <div className="flex justify-between">
                            <span>PIP:</span>
                            <span>{leftHand.angles.finger2}°</span>
                          </div>
                          <div className="flex justify-between">
                            <span>MCP:</span>
                            <span>{leftHand.angles.finger3}°</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex flex-col items-center gap-2">
                      <Badge variant="outline" className={`text-xs ${
                        leftHand.active && isTherapyActive
                          ? 'text-medical-green border-medical-green bg-medical-green/10' 
                          : leftHand.active
                            ? 'text-blue-600 border-blue-600 bg-blue-50'
                            : 'text-muted-foreground border-muted-foreground'
                      }`}>
                        {leftHand.active ? t.active : t.inactive}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Video - ocupa 3 columnas */}
              <div className="lg:col-span-3 p-4 border rounded-lg shadow">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <iframe
                    src="https://www.youtube.com/embed/QgBgP2c-3so?autoplay=1&loop=1&playlist=QgBgP2c-3so"
                    className="w-full h-[300px] lg:h-[500px] rounded-lg border-0"
                    allow="autoplay; encrypted-media; fullscreen"
                    allowFullScreen
                    title="Terapia de Rehabilitación"
                  />
                </div>
              </div>

              {/* Mano Parética */}
              <div className="lg:col-span-1 p-4 border rounded-lg shadow">
                <Card className={`border-2 transition-all duration-300 ${
                  rightHand.active && isTherapyActive
                    ? 'border-medical-orange/60 bg-medical-orange/5 hover:border-medical-orange/80' 
                    : 'border-medical-orange/20 hover:border-medical-orange/40'
                }`}>
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-lg font-semibold text-medical-orange">
                      {t.pareticHand}
                    </CardTitle>
                    <Badge variant="secondary" className="w-fit mx-auto bg-medical-orange/10 text-medical-orange">
                      {t.withExoskeleton}
                    </Badge>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center">
                    <div className={`hand-paretic w-24 h-32 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 ${
                      rightHand.active && isTherapyActive
                        ? 'animate-pulse bg-medical-orange/10' 
                        : 'bg-muted/50'
                    }`}>
                      <div className="text-3xl">✋</div>
                    </div>
                    
                    <div className="mt-3 space-y-2 w-full">
                      <h5 className="text-xs font-medium text-center">Ángulos</h5>
                      <div className="grid grid-cols-1 gap-1 text-xs">
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Pulgar IP:</span>
                            <span>{rightHand.angles.thumb1}°</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Pulgar MCP:</span>
                            <span>{rightHand.angles.thumb2}°</span>
                          </div>
                          <div className="flex justify-between">
                            <span>DIP:</span>
                            <span>{rightHand.angles.finger1}°</span>
                          </div>
                          <div className="flex justify-between">
                            <span>PIP:</span>
                            <span>{rightHand.angles.finger2}°</span>
                          </div>
                          <div className="flex justify-between">
                            <span>MCP:</span>
                            <span>{rightHand.angles.finger3}°</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex flex-col items-center gap-2">
                      <Badge variant="outline" className={`text-xs ${
                        rightHand.active && isTherapyActive
                          ? 'text-medical-orange border-medical-orange bg-medical-orange/10' 
                          : rightHand.active
                            ? 'text-blue-600 border-blue-600 bg-blue-50'
                            : 'text-muted-foreground border-muted-foreground'
                      }`}>
                        {rightHand.active ? t.active : t.inactive}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            <div className="flex flex-col items-center">
              {/* Temporizador + botones */}
              {renderTimerControls()}
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