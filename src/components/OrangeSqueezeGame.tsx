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
  const [startTime, setStartTime] = useState<number | null>(null);
  const { rightHand } = useSimulation();

  // Función para reproducir sonido de exprimir naranja
  const playSqueezeSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const playTone = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, startTime);
      oscillator.type = 'sawtooth';
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    // Sonido de "squish" al exprimir
    const now = audioContext.currentTime;
    playTone(150, now, 0.3);
    playTone(120, now + 0.1, 0.2);
  };

  // Función para reproducir sonido de beber
  const playDrinkSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const playBubble = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, startTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    // Sonido de burbujas al beber
    const now = audioContext.currentTime;
    playBubble(800, now, 0.2);
    playBubble(600, now + 0.1, 0.2);
    playBubble(400, now + 0.2, 0.3);
  };

  useEffect(() => {
    if (startTime === null) {
      setStartTime(Date.now());
    }
  }, []);

  useEffect(() => {
    // Calcular porcentaje basado en la suma de A4, A5, A6 (target: 150 grados)
    const fingerSum = rightHand.angles.finger1 + rightHand.angles.finger2 + rightHand.angles.finger3;
    const percentage = Math.min((fingerSum / 150) * 100, 100);
    setSqueezePercentage(percentage);

    const currentTime = Date.now();
    
    // Si el porcentaje baja de 80%, permite exprimir otra naranja
    if (percentage < 30 && !canSqueeze) {
      setCanSqueeze(true);
      console.log('Puede exprimir otra naranja (bajó de 30%)');
    }
    
    // Si llega al 100% y puede exprimir, cuenta como naranja exprimida
    if (percentage >= 100 && rightHand.active && canSqueeze && currentTime - lastSqueezeTime > 1000) {
      console.log('Naranja exprimida!');
      setLastSqueezeTime(currentTime);
      setCanSqueeze(false); // No puede exprimir hasta que baje del 30%
      
      // Reproducir sonido de exprimir
      playSqueezeSound();
      
      // Mostrar mensaje de naranja exprimida
      setShowOrangeMessage(true);
      setTimeout(() => setShowOrangeMessage(false), 2000); // 2 segundos
      
      setOrangesSqueezed(prev => {
        const newCount = prev + 1;
        const newGlasses = Math.floor(newCount / 4);
        
        if (newGlasses > glassesCompleted) {
          console.log('Vaso completado!');
          setGlassesCompleted(newGlasses);
          
          // Reproducir sonido de beber
          playDrinkSound();
          
          if (newGlasses >= targetGlasses && startTime) {
            const endTime = Date.now();
            const totalTimeMinutes = (endTime - startTime) / 1000;
            const timePerGlass = totalTimeMinutes / newGlasses;
            const totalOranges = newCount + newGlasses*4; 
            const timePerOrange = totalTimeMinutes / totalOranges; 
            
            const today = new Date().toLocaleDateString();
            const rankings = JSON.parse(localStorage.getItem('orangeRankings') || '[]');
            rankings.push({ 
              date: today, 
              glasses: newGlasses,
              totalOranges: totalOranges, // todas las naranjas exprimidas
              timePerGlass: timePerGlass,
              timePerOrange: timePerOrange,
            });
            rankings.sort((a: any, b: any) => a.timePerGlass - b.timePerGlass);
            localStorage.setItem('orangeRankings', JSON.stringify(rankings.slice(0, 5)));
            
            onComplete();
          }
        }
        
        return newCount;
      });
    }
  }, [rightHand.angles, rightHand.active, lastSqueezeTime, glassesCompleted, targetGlasses, onComplete, canSqueeze, startTime]);

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
                squeezePercentage >= 30 ? 'bg-yellow-500' : 'bg-blue-500'
              }`}
              style={{ height: `${squeezePercentage}%` }}
            />
            {/* Etiquetas de porcentaje separadas para evitar solapamiento */}
            <div className="absolute -top-4 -left-8 text-xs font-medium">100%</div>
            <div className="absolute top-1/5 -right-8 text-xs font-medium">80%</div>
            <div className="absolute -bottom-4 -left-6 text-xs font-medium">0%</div>
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
              Relaja la mano para poder exprimir otra naranja
            </p>
          ) : (
            <p className="text-sm text-blue-800">
              Exprime la naranja con la mano parética
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrangeSqueezeGame;