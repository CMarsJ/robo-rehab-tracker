
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
  const [squeezePercentage, setSqueezePercentage] = useState(0);
  const [canSqueeze, setCanSqueeze] = useState(true);
  const [showOrangeMessage, setShowOrangeMessage] = useState(false);
  const { rightHand } = useSimulation();

  useEffect(() => {
    // Calcular porcentaje basado en la suma de A4, A5, A6 (target: 230 grados)
    const fingerSum = rightHand.angles.finger1 + rightHand.angles.finger2 + rightHand.angles.finger3;
    const percentage = Math.min((fingerSum / 230) * 100, 100);
    setSqueezePercentage(percentage);

    const currentTime = Date.now();
    
    // Si el porcentaje baja de 80%, permite exprimir otra naranja
    if (percentage < 80 && !canSqueeze) {
      setCanSqueeze(true);
    }
    
    // Si llega al 100% y puede exprimir, cuenta como naranja exprimida
    if (percentage >= 100 && rightHand.active && canSqueeze && currentTime - lastSqueezeTime > 1000) {
      setLastSqueezeTime(currentTime);
      setCanSqueeze(false); // No puede exprimir hasta que baje del 80%
      
      // Mostrar mensaje de naranja exprimida
      setShowOrangeMessage(true);
      setTimeout(() => setShowOrangeMessage(false), 10000); // 10 segundos
      
      setOrangesSqueezed(prev => {
        const newCount = prev + 1;
        const newGlasses = Math.floor(newCount / 4);
        
        if (newGlasses > glassesCompleted) {
          setGlassesCompleted(newGlasses);
          if (newGlasses >= targetGlasses) {
            // Guardar el logro en localStorage
            const today = new Date().toLocaleDateString();
            const rankings = JSON.parse(localStorage.getItem('orangeRankings') || '[]');
            rankings.push({ date: today, glasses: newGlasses });
            rankings.sort((a: any, b: any) => b.glasses - a.glasses);
            localStorage.setItem('orangeRankings', JSON.stringify(rankings.slice(0, 5)));
            
            onComplete();
          }
        }
        
        return newCount;
      });
    }
  }, [rightHand.angles, rightHand.active, lastSqueezeTime, glassesCompleted, targetGlasses, onComplete, canSqueeze]);

  const currentOrangesInGlass = orangesSqueezed % 4;
  const progressPercent = (currentOrangesInGlass / 4) * 100;

  return (
    <div className="space-y-6">
      {/* Mensaje de naranja exprimida */}
      {showOrangeMessage && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-orange-500 text-white px-8 py-4 rounded-lg text-2xl font-bold shadow-lg animate-bounce">
          🍊 ¡Naranja Exprimida! 🍊
        </div>
      )}

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

      {/* Visualización de la naranja con medidor */}
      <div className="flex justify-center items-center space-x-8">
        {/* Medidor de fuerza */}
        <div className="w-20">
          <div className="text-center mb-2">
            <span className="text-sm font-medium">Fuerza</span>
          </div>
          <div className="relative h-48 w-8 bg-gray-200 rounded-full mx-auto">
            <div 
              className={`absolute bottom-0 w-full rounded-full transition-all duration-300 ${
                squeezePercentage >= 100 ? 'bg-green-500' : 
                squeezePercentage >= 80 ? 'bg-yellow-500' : 'bg-blue-500'
              }`}
              style={{ height: `${squeezePercentage}%` }}
            />
            <div className="absolute top-0 left-full ml-2 text-xs">100%</div>
            <div className="absolute top-1/5 left-full ml-2 text-xs">80%</div>
            <div className="absolute bottom-0 left-full ml-2 text-xs">0%</div>
          </div>
          <div className="text-center mt-2">
            <span className="text-lg font-bold">{Math.round(squeezePercentage)}%</span>
          </div>
        </div>

        {/* Naranja */}
        <div className={`w-32 h-32 rounded-full flex items-center justify-center text-6xl transition-all duration-300 ${
          rightHand.active ? 'animate-pulse scale-110' : 'scale-100'
        } ${!canSqueeze ? 'opacity-50' : 'opacity-100'}`}>
          🍊
        </div>
      </div>

      {/* Estado actual */}
      <Card className={`${!canSqueeze ? 'bg-yellow-50' : 'bg-blue-50'}`}>
        <CardContent className="p-4 text-center">
          {!canSqueeze ? (
            <p className="text-sm text-yellow-800">
              Relaja la mano (baja de 80%) para poder exprimir otra naranja
            </p>
          ) : (
            <p className="text-sm text-blue-800">
              Exprime la naranja con la mano parética para llegar al 100%
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrangeSqueezeGame;
