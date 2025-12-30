import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useGameConfig } from '@/contexts/GameConfigContext';
import { useSimulation } from '@/contexts/SimulationContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface FlappyBirdGameProps {
  onComplete: () => void;
}

interface Pipe {
  id: number;
  x: number;
  topHeight: number;
  bottomHeight: number;
  passed: boolean;
}

const FlappyBirdGame: React.FC<FlappyBirdGameProps> = ({ onComplete }) => {
  const { flappyPipeGap } = useGameConfig();
  const { leftHand, rightHand } = useSimulation();
  const { user } = useAuth();
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [birdY, setBirdY] = useState(250); // Posición Y del ave
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const [gameWidth] = useState(800);
  const [gameHeight] = useState(500);
  const [gameOver, setGameOver] = useState(false);
  const [gameStartTime, setGameStartTime] = useState<Date | null>(null);
  const gameRef = useRef<HTMLDivElement>(null);
  const pipeIdRef = useRef(0);

  // Referencia para rastrear colisiones activas
  const collidingPipesRef = useRef<Set<number>>(new Set());

  // Inicializar juego
  const initGame = useCallback(() => {
    setScore(0);
    setBirdY(250);
    setPipes([]);
    setGameOver(false);
    setGameStarted(true);
    setGameStartTime(new Date());
    collidingPipesRef.current.clear();
    
    // Crear primer tubo
    const firstPipe: Pipe = {
      id: pipeIdRef.current++,
      x: gameWidth,
      topHeight: 100 + Math.random() * 150,
      bottomHeight: 0,
      passed: false
    };
    firstPipe.bottomHeight = gameHeight - firstPipe.topHeight - flappyPipeGap;
    setPipes([firstPipe]);
  }, [gameWidth, gameHeight, flappyPipeGap]);

  // Control del ave basado en suma de ángulos A4 + A5 + A6 de la mano paretica
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const updateBirdPosition = () => {
      // Determinar cuál mano es la paretica (usar la mano izquierda por defecto)
      const pareticHand = leftHand.active ? leftHand : rightHand;
      
      if (pareticHand.active) {
        // Suma de ángulos A4 + A5 + A6 (finger1 + finger2 + finger3)
        const angleSum = pareticHand.angles.finger1 + pareticHand.angles.finger2 + pareticHand.angles.finger3;
        
        // Mapeo: suma=0 → nivel del piso (gameHeight-50), suma>=200 → límite superior (50)
        const clampedSum = Math.max(0, Math.min(200, angleSum));
        const normalizedPosition = clampedSum / 200; // [0, 1]
        const newY = (gameHeight - 50) - (normalizedPosition * (gameHeight - 100)); // Invertir
        
        setBirdY(Math.max(25, Math.min(gameHeight - 25, newY)));
      }
    };

    const interval = setInterval(updateBirdPosition, 50);
    return () => clearInterval(interval);
  }, [gameStarted, gameOver, gameHeight, leftHand, rightHand]);

  // Movimiento de tubos
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const movePipes = () => {
      setPipes(prev => {
        const updatedPipes = prev.map(pipe => ({ ...pipe, x: pipe.x - 3 }));
        
        // Remover tubos que salieron de la pantalla
        const visiblePipes = updatedPipes.filter(pipe => pipe.x > -100);
        
        // Agregar nuevo tubo si es necesario
        const lastPipe = visiblePipes[visiblePipes.length - 1];
        if (!lastPipe || lastPipe.x < gameWidth - 300) {
          const newPipe: Pipe = {
            id: pipeIdRef.current++,
            x: gameWidth,
            topHeight: 80 + Math.random() * 200,
            bottomHeight: 0,
            passed: false
          };
          newPipe.bottomHeight = gameHeight - newPipe.topHeight - flappyPipeGap;
          visiblePipes.push(newPipe);
        }
        
        return visiblePipes;
      });
    };

    const interval = setInterval(movePipes, 50);
    return () => clearInterval(interval);
  }, [gameStarted, gameOver, gameWidth, gameHeight, flappyPipeGap]);

  // Detección de colisiones y puntuación
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const checkCollisions = () => {
      const birdRadius = 20;
      const birdX = 100;

      // Verificar colisión con tubos y puntuación
      setPipes(prev => prev.map(pipe => {
        // Verificar si el ave pasó el tubo
        if (!pipe.passed && pipe.x + 60 < birdX) {
          // Solo dar punto si no hubo colisión con este tubo
          if (!collidingPipesRef.current.has(pipe.id)) {
            setScore(s => s + 1);
          }
          collidingPipesRef.current.delete(pipe.id);
          return { ...pipe, passed: true };
        }

        // Verificar colisión
        const pipeLeft = pipe.x;
        const pipeRight = pipe.x + 60;
        
        if (birdX + birdRadius > pipeLeft && birdX - birdRadius < pipeRight) {
          // Verificar colisión con tubo superior o inferior
          if (birdY - birdRadius < pipe.topHeight || birdY + birdRadius > gameHeight - pipe.bottomHeight) {
            // Si no estaba colisionando con este tubo, restar punto
            if (!collidingPipesRef.current.has(pipe.id)) {
              collidingPipesRef.current.add(pipe.id);
              setScore(s => Math.max(0, s - 1)); // No bajar de 0
            }
          } else {
            // Ya no está colisionando con este tubo
            collidingPipesRef.current.delete(pipe.id);
          }
        } else {
          // Fuera del rango del tubo
          collidingPipesRef.current.delete(pipe.id);
        }

        return pipe;
      }));
    };

    const interval = setInterval(checkCollisions, 50);
    return () => clearInterval(interval);
  }, [gameStarted, gameOver, birdY, gameHeight]);

  // Guardar datos del juego en Supabase
  const saveGameData = useCallback(async () => {
    if (!user || !gameStartTime) return;
    
    const gameEndTime = new Date();
    const gameDurationSeconds = (gameEndTime.getTime() - gameStartTime.getTime()) / 1000;
    const pointsPerSecond = gameDurationSeconds > 0 ? score / gameDurationSeconds : 0;
    
    try {
      // Crear sesión
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          duration: Math.round(gameDurationSeconds / 60),
          therapy_type: 'flappy_bird',
          state: 'completed'
        })
        .select()
        .single();
        
      if (sessionError) throw sessionError;
      
      // Update session with game stats  
      const { error: gameRecordError } = await supabase
        .from('sessions')
        .update({
          stats: {
            score: score,
            gameTime: gameDurationSeconds,
            attempts: 1
          }
        })
        .eq('id', session.id);
        
      if (gameRecordError) throw gameRecordError;
      
    } catch (error) {
      console.error('Error saving game data:', error);
    }
  }, [user, gameStartTime, score]);

  // Auto-iniciar el juego
  useEffect(() => {
    if (!gameStarted) {
      initGame();
    }
  }, [initGame, gameStarted]);

  // Auto-finalizar después de game over
  useEffect(() => {
    if (gameOver) {
      const timer = setTimeout(() => {
        onComplete();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [gameOver, onComplete]);

  return (
    <Card>
      <CardContent className="p-4">
        {/* Header del juego */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-lg font-bold">Puntaje: {score}</div>
          <div className="text-lg font-bold">Flappy Bird Terapéutico</div>
          <div className="text-lg font-bold">Altura: {Math.round(birdY)}</div>
        </div>

        {/* Barra de progreso basada en tiempo */}
        <div className="mb-4">
          <Progress value={Math.min(score * 10, 100)} className="h-2" />
          <div className="text-xs text-center mt-1">
            Tubos pasados: {score}
          </div>
        </div>

        {/* Área de juego */}
        <div 
          ref={gameRef}
          className="relative bg-gradient-to-b from-sky-400 via-sky-300 to-green-300 rounded-lg overflow-hidden border-2 border-blue-400"
          style={{ width: gameWidth, height: gameHeight, margin: '0 auto' }}
        >
          {/* Nubes de fondo */}
          <div className="absolute inset-0">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="absolute w-16 h-8 bg-white/40 rounded-full"
                style={{
                  left: `${(i * 25) % 100}%`,
                  top: `${10 + (i * 15) % 30}%`,
                  animation: `float ${3 + i}s ease-in-out infinite`
                }}
              />
            ))}
          </div>

          {/* Tubos */}
          {pipes.map(pipe => (
            <div key={pipe.id}>
              {/* Tubo superior */}
              <div
                className="absolute bg-green-600 border-2 border-green-800"
                style={{
                  left: pipe.x,
                  top: 0,
                  width: 60,
                  height: pipe.topHeight,
                  borderRadius: '0 0 8px 8px'
                }}
              />
              {/* Tubo inferior */}
              <div
                className="absolute bg-green-600 border-2 border-green-800"
                style={{
                  left: pipe.x,
                  bottom: 0,
                  width: 60,
                  height: pipe.bottomHeight,
                  borderRadius: '8px 8px 0 0'
                }}
              />
            </div>
          ))}

          {/* Ave */}
          <div
            className="absolute transition-all duration-100 ease-out"
            style={{ 
              left: 80,
              top: birdY - 20,
              width: '40px',
              height: '40px'
            }}
          >
            <div className="w-full h-full bg-yellow-400 rounded-full border-2 border-orange-500 flex items-center justify-center text-lg">
              🐦
            </div>
          </div>

          {/* Mensaje de Game Over */}
          {gameOver && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="bg-white p-6 rounded-lg text-center">
                <div className="text-2xl font-bold mb-2">¡Juego Terminado!</div>
                <div className="text-lg mb-2">Puntaje Final: {score}</div>
                <div className="text-sm text-muted-foreground">
                  {score > 0 ? '¡Buen trabajo!' : 'Inténtalo de nuevo'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Instrucciones */}
        <div className="text-center mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-xs text-muted-foreground">
            Controla la altura del ave con los ángulos A4+A5+A6 de tu mano paretica
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FlappyBirdGame;