
import React from 'react';
import { Button } from '@/components/ui/button';
import { Pause, Play, X } from 'lucide-react';

interface TherapyOverlayProps {
  timeLeft: number;
  isPaused: boolean;
  onPause: () => void;
  onCancel: () => void;
  formatTime: (seconds: number) => string;
}

const TherapyOverlay: React.FC<TherapyOverlayProps> = ({
  timeLeft,
  isPaused,
  onPause,
  onCancel,
  formatTime
}) => {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <div className="bg-background rounded-lg p-8 w-full max-w-2xl mx-4 relative">
        {/* Imagen de la mano */}
        <div className="flex justify-center mb-8">
          <div className="w-80 h-60 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center border-2 border-blue-300">
            <div className="text-6xl">👋</div>
          </div>
        </div>

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

          {/* Tiempo central */}
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">
              {formatTime(timeLeft)}
            </div>
            <div className="text-sm text-muted-foreground">
              {isPaused ? 'Terapia pausada' : 'Terapia en progreso'}
            </div>
          </div>

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
    </div>
  );
};

export default TherapyOverlay;
