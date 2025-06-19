
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useSimulation } from '@/contexts/SimulationContext';

interface OrangeSqueezeGameProps {
  targetGlasses: number;
  onComplete: () => void;
}

const OrangeSqueezeGame: React.FC<OrangeSqueezeGameProps> = ({ targetGlasses, onComplete }) => {
  const [orangesSqueezed, setOrangesSqueezed] = useState(0);
  const [glassesCompleted, setGlassesCompleted] = useState(0);
  const [lastSqueezeTime, setLastSqueezeTime] = useState(0);
  const { rightHand } = useSimulation();

  useEffect(() => {
    // Verificar si se completó una naranja (suma de A4, A5, A6 > 230 grados)
    const fingerSum = rightHand.angles.finger1 + rightHand.angles.finger2 + rightHand.angles.finger3;
    const currentTime = Date.now();
    
    if (fingerSum > 230 && rightHand.active && currentTime - lastSqueezeTime > 1000) {
      setLastSqueezeTime(currentTime);
      setOrangesSqueezed(prev => {
        const newCount = prev + 1;
        const newGlasses = Math.floor(newCount / 4);
        
        if (newGlasses > glassesCompleted) {
          setGlassesCompleted(newGlasses);
          if (newGlasses >= targetGlasses) {
            onComplete();
          }
        }
        
        return newCount;
      });
    }
  }, [rightHand.angles, rightHand.active, lastSqueezeTime, glassesCompleted, targetGlasses, onComplete]);

  const currentOrangesInGlass = orangesSqueezed % 4;
  const progressPercent = (currentOrangesInGlass / 4) * 100;

  return (
    <div className="space-y-6">
      {/* Progreso general */}
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

      {/* Visualización de la naranja */}
      <div className="flex justify-center">
        <div className={`w-32 h-32 rounded-full flex items-center justify-center text-6xl transition-all duration-300 ${
          rightHand.active ? 'animate-pulse scale-110' : 'scale-100'
        }`}>
          🍊
        </div>
      </div>

      {/* Instrucciones */}
      <Card className="bg-blue-50">
        <CardContent className="p-4 text-center">
          <p className="text-sm text-blue-800">
            Suma los dedos A4, A5 y A6 de la mano parética para superar 230° y exprimir una naranja
          </p>
          <p className="text-xs text-blue-600 mt-2">
            Ángulos actuales: A4({rightHand.angles.finger1}°) + A5({rightHand.angles.finger2}°) + A6({rightHand.angles.finger3}°) = {rightHand.angles.finger1 + rightHand.angles.finger2 + rightHand.angles.finger3}°
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrangeSqueezeGame;
