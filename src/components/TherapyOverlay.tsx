import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatTime } from '@/lib/utils';
import OrangeSqueezeGame from './OrangeSqueezeGame';
import NeuroLinkGame from './NeuroLinkGame';

interface TherapyOverlayProps {
  mode: 'therapy' | 'fun';
  onCancel: () => void;
  onComplete: () => void;
}

const GAME_DURATION = 180; // duración en segundos

const TherapyOverlay: React.FC<TherapyOverlayProps> = ({ mode, onCancel, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [isPaused, setIsPaused] = useState(false);
  const [gameMode, setGameMode] = useState<'menu' | 'orange-squeeze' | 'neurolink' | 'regular'>('menu');

  useEffect(() => {
    if (isPaused || gameMode === 'menu') return;
    if (timeLeft <= 0) {
      onComplete();
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [isPaused, timeLeft, gameMode]);

  const handleCancel = useCallback(() => {
    setIsPaused(true);
    setGameMode('menu');
    setTimeLeft(GAME_DURATION);
    onCancel();
  }, [onCancel]);

  const handleGameComplete = useCallback(() => {
    setGameMode('menu');
    setTimeLeft(GAME_DURATION);
    onComplete();
  }, [onComplete]);

  const renderGameSelection = () => (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
      <Card onClick={() => setGameMode('orange-squeeze')} className="cursor-pointer hover:shadow-xl transition-shadow">
        <CardContent className="p-6 text-center">
          🍊
          <div className="text-lg font-semibold mt-2">Orange Squeeze</div>
        </CardContent>
      </Card>
      <Card onClick={() => setGameMode('neurolink')} className="cursor-pointer hover:shadow-xl transition-shadow">
        <CardContent className="p-6 text-center">
          🧠
          <div className="text-lg font-semibold mt-2">Neuro Link</div>
        </CardContent>
      </Card>
      <Card onClick={() => setGameMode('regular')} className="cursor-pointer hover:shadow-xl transition-shadow">
        <CardContent className="p-6 text-center">
          📺
          <div className="text-lg font-semibold mt-2">Modo Regular</div>
        </CardContent>
      </Card>
    </div>
  );

  const renderGameContent = () => {
    switch (gameMode) {
      case 'orange-squeeze':
        return <OrangeSqueezeGame targetGlasses={10} onComplete={handleGameComplete} />;
      case 'neurolink':
        return <NeuroLinkGame onComplete={handleGameComplete} />;
      case 'regular':
        return (
          <div className="h-full flex flex-col">
            {/* Contenido central diferente según el modo */}
            <div className="flex-1 flex justify-center mb-6">
              <div
                className="w-full bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center border-2 border-blue-300 overflow-hidden"
                style={{ height: '80%' }}
              >
                {mode === 'therapy' ? (
                  <iframe
                    src="https://www.youtube.com/embed/bZaKJr5XA2g?autoplay=1&loop=1&playlist=bZaKJr5XA2g&controls=1&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1"
                    className="w-full h-full border-0"
                    allow="autoplay; encrypted-media; fullscreen"
                    allowFullScreen
                    title="Terapia de Rehabilitación"
                  />
                ) : (
                  <div className="text-6xl">🕹️ ¡Disfruta del modo libre!</div>
                )}
              </div>
            </div>

            {/* Tiempo central */}
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-primary mb-2">
                {formatTime(timeLeft)}
              </div>
              <div className="text-sm text-muted-foreground">
                {isPaused ? 'Pausado' : 'Tiempo restante'}
              </div>
            </div>
          </div>
        );
      default:
        return renderGameSelection();
    }
  };

  return (
    <div className="p-6 space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-primary">
          {gameMode === 'menu' ? 'Selecciona una Actividad' : 'Terapia en Curso'}
        </h2>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => setIsPaused(!isPaused)}>
            {isPaused ? 'Reanudar' : 'Pausar'}
          </Button>
          <Button variant="destructive" onClick={handleCancel}>
            Cancelar
          </Button>
        </div>
      </div>
      <div className="flex-1">{renderGameContent()}</div>
    </div>
  );
};

export default TherapyOverlay;