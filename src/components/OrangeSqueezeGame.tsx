import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useSimulation } from '@/contexts/SimulationContext';

interface OrangeSqueezeGameProps {
  targetGlasses: number;
  onComplete: (data: {
    juice_used: number;
    orange_used: number;
    timePerGlass: number;
    timePerOrange: number;
    orangesPerMinute: number;
    averageFingerClosure: number;
  }) => void;
  onStatsUpdate?: (stats: { orangesUsed: number; juiceUsed: number }) => void;
}

const OrangeSqueezeGame: React.FC<OrangeSqueezeGameProps> = ({ targetGlasses, onComplete, onStatsUpdate }) => {
  const [orangesSqueezed, setOrangesSqueezed] = useState(0);
  const [glassesCompleted, setGlassesCompleted] = useState(0);
  const [lastSqueezeTime, setLastSqueezeTime] = useState(0);
  const [squeezePercentage, setSqueezePercentage] = useState(0);
  const [canSqueeze, setCanSqueeze] = useState(true);
  const [showOrangeMessage, setShowOrangeMessage] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const { rightHand } = useSimulation();

  // Sonidos simplificados (sin DataService)
  const playSqueezeSound = () => { /* ...igual que antes... */ };
  const playDrinkSound = () => { /* ...igual que antes... */ };

  // Inicializar tiempo de inicio
  useEffect(() => {
    if (startTime === null) setStartTime(Date.now());
  }, [startTime]);

  // Notificar stats updates en un efecto separado (evita setState durante render)
  useEffect(() => {
    onStatsUpdate?.({ orangesUsed: orangesSqueezed, juiceUsed: glassesCompleted });
  }, [orangesSqueezed, glassesCompleted, onStatsUpdate]);

  // Lógica de exprimir naranja
  useEffect(() => {
    const fingerSum = rightHand.angles.finger1 + rightHand.angles.finger2 + rightHand.angles.finger3;
    const percentage = Math.min((fingerSum / 150) * 100, 100);
    setSqueezePercentage(percentage);

    const currentTime = Date.now();

    if (percentage < 30 && !canSqueeze) setCanSqueeze(true);

    if (percentage >= 100 && rightHand.active && canSqueeze && currentTime - lastSqueezeTime > 1000) {
      setLastSqueezeTime(currentTime);
      setCanSqueeze(false);

      playSqueezeSound();
      setShowOrangeMessage(true);
      setTimeout(() => setShowOrangeMessage(false), 2000);

      const newCount = orangesSqueezed + 1;
      const newGlasses = Math.floor(newCount / 4);

      setOrangesSqueezed(newCount);

      if (newGlasses > glassesCompleted) {
        setGlassesCompleted(newGlasses);
        playDrinkSound();

        if (newGlasses >= targetGlasses && startTime) {
          const totalTimeMinutes = (currentTime - startTime) / (1000 * 60);
          const timePerGlass = totalTimeMinutes / newGlasses;
          const timePerOrange = totalTimeMinutes / newCount;
          const orangesPerMinute = newCount / totalTimeMinutes;
          const averageFingerClosure = fingerSum / 3;

          onComplete({
            juice_used: newGlasses,
            orange_used: newCount,
            timePerGlass,
            timePerOrange,
            orangesPerMinute,
            averageFingerClosure
          });
        }
      }
    }
  }, [rightHand.angles, rightHand.active, lastSqueezeTime, glassesCompleted, orangesSqueezed, targetGlasses, canSqueeze, startTime, onComplete]);

  const currentOrangesInGlass = orangesSqueezed % 4;
  const progressPercent = (currentOrangesInGlass / 4) * 100;

  return (
    <div className="space-y-6">
      {showOrangeMessage && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-orange-500 text-white px-8 py-4 rounded-lg text-2xl font-bold shadow-lg animate-bounce">
          🍊 ¡Naranja Exprimida! 🍊
        </div>
      )}

      <Card>
        <CardContent className="p-6 text-center">
          <h3 className="text-2xl font-bold mb-4">🍊 Exprimiendo Naranjas 🍊</h3>
          <div className="space-y-4">
            <div>
              <p className="text-lg">Vasos completados: {glassesCompleted} / {targetGlasses}</p>
              <Progress value={(glassesCompleted / targetGlasses) * 100} className="h-4 mt-2" />
            </div>
            <div>
              <p className="text-md">Vaso actual: {currentOrangesInGlass} / 4 naranjas</p>
              <Progress value={progressPercent} className="h-3 mt-2" />
            </div>
            <div className="text-sm text-muted-foreground">
              Total de naranjas exprimidas: {orangesSqueezed}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center items-center space-x-8">
        <div className="w-20">
          <div className="text-center mb-2">
            <span className="text-sm font-medium">Fuerza</span>
          </div>
          <div className="relative h-48 w-8 bg-gray-200 rounded-full mx-auto">
            <div
              className={`absolute bottom-0 w-full rounded-full transition-all duration-300 ${
                squeezePercentage >= 100 ? 'bg-green-500' : squeezePercentage >= 30 ? 'bg-yellow-500' : 'bg-blue-500'
              }`}
              style={{ height: `${squeezePercentage}%` }}
            />
          </div>
          <div className="text-center mt-2">
            <span className="text-lg font-bold">{Math.round(squeezePercentage)}%</span>
          </div>
        </div>
        <div className={`w-32 h-32 rounded-full flex items-center justify-center text-6xl transition-all duration-300 ${
          rightHand.active ? 'animate-pulse scale-110' : 'scale-100'
        } ${!canSqueeze ? 'opacity-50' : 'opacity-100'}`}>
          🍊
        </div>
      </div>

      <Card className={`${!canSqueeze ? 'bg-yellow-50' : 'bg-blue-50'}`}>
        <CardContent className="p-4 text-center">
          {!canSqueeze ? (
            <p className="text-sm text-yellow-800">Relaja la mano para poder exprimir otra naranja</p>
          ) : (
            <p className="text-sm text-blue-800">Exprime la naranja con la mano parética</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrangeSqueezeGame;
