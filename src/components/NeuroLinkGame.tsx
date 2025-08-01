import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useGameConfig } from '@/contexts/GameConfigContext';
import { useSimulation } from '@/contexts/SimulationContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import playerHandImage from '@/assets/NeuroLink/player-hand.png';
import enemigo1 from '@/assets/NeuroLink/enemigo1.png';
import enemigo2 from '@/assets/NeuroLink/enemigo2.png';
import enemigo3 from '@/assets/NeuroLink/enemigo3.png';
import enemigo4 from '@/assets/NeuroLink/enemigo4.png';

interface NeuroLinkGameProps {
  onComplete: () => void;
}

interface Position {
  x: number;
  y: number;
}

interface Enemy extends Position {
  id: number;
  destroyed: boolean;
  row: number;
  col: number;
}

interface Bullet extends Position {
  id: number;
}

interface Explosion extends Position {
  id: number;
}

const NeuroLinkGame: React.FC<NeuroLinkGameProps> = ({ onComplete }) => {
  const { enemySpeed, shotSpeed } = useGameConfig();
  const { leftHand, rightHand } = useSimulation();
  const { user } = useAuth();
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [playerPosition, setPlayerPosition] = useState(400);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const [gameWidth] = useState(800);
  const [gameHeight] = useState(600);
  const [wave, setWave] = useState(1);
  const [extraWaves, setExtraWaves] = useState(0);
  const [enemiesDestroyed, setEnemiesDestroyed] = useState(0);
  const [shotsFired, setShotsFired] = useState(0);
  const [enemyDirection, setEnemyDirection] = useState(1); // 1 = derecha, -1 = izquierda
  const [enemyMoveDown, setEnemyMoveDown] = useState(false);
  const [shootInterval, setShootInterval] = useState(1000); // Intervalo de disparo en ms
  const [gameOver, setGameOver] = useState(false);
  const [gameStartTime, setGameStartTime] = useState<Date | null>(null);
  const gameRef = useRef<HTMLDivElement>(null);
  const bulletIdRef = useRef(0);
  const enemyIdRef = useRef(0);
  const explosionIdRef = useRef(0);

  // Imágenes de enemigos por oleada
  const getEnemyImage = (waveNumber: number) => {
    const enemyImages = [enemigo1, enemigo2, enemigo3, enemigo4];
    return enemyImages[(waveNumber - 1) % enemyImages.length];
  };

  // Crear enemigos con posiciones más variables
  const createEnemies = useCallback((waveNumber: number) => {
    const newEnemies: Enemy[] = [];
    const rows = Math.min(3 + Math.floor(waveNumber / 2), 5);
    const cols = Math.min(6 + waveNumber, 8);
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Espaciado más variable y natural
        const baseX = 80 + col * (gameWidth - 160) / (cols - 1);
        const baseY = 60 + row * 60;
        const offsetX = (Math.random() - 0.5) * 40; // Mayor variabilidad horizontal
        const offsetY = (Math.random() - 0.5) * 25; // Mayor variabilidad vertical
        
        newEnemies.push({
          id: enemyIdRef.current++,
          x: Math.max(40, Math.min(gameWidth - 40, baseX + offsetX)),
          y: Math.max(30, baseY + offsetY),
          destroyed: false,
          row,
          col
        });
      }
    }
    return newEnemies;
  }, [gameWidth]);

  // Sonidos terapéuticos suaves
  const playHitSound = useCallback(() => {
    // Crear un sonido suave y agradable usando Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Configuración para sonido suave y terapéutico
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  }, []);

  // Inicializar juego
  const initGame = useCallback(() => {
    setScore(0);
    setPlayerPosition(400);
    setBullets([]);
    setExplosions([]);
    setWave(1);
    setExtraWaves(0);
    setEnemiesDestroyed(0);
    setShotsFired(0);
    setEnemyDirection(1);
    setEnemyMoveDown(false);
    setGameOver(false);
    setEnemies(createEnemies(1));
    setGameStarted(true);
    setGameStartTime(new Date());
  }, [createEnemies]);

  // Cargar configuración de disparo desde Supabase
  useEffect(() => {
    const loadShootInterval = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('game_settings')
          .select('intervalo_disparo_ms')
          .eq('user_id', user.id)
          .single();
          
        if (data && !error) {
          setShootInterval(data.intervalo_disparo_ms);
        }
      } catch (error) {
        console.error('Error loading shoot interval:', error);
      }
    };
    
    loadShootInterval();
  }, [user]);

  // Control del jugador basado en suma de ángulos A4 + A5 + A6 de la mano paretica
  useEffect(() => {
    if (!gameStarted) return;

    const updatePlayerPosition = () => {
      // Determinar cuál mano es la paretica (por ahora usar la mano izquierda)
      const pareticHand = leftHand.active ? leftHand : rightHand;
      
      if (pareticHand.active) {
        // Suma de ángulos A4 + A5 + A6 (finger1 + finger2 + finger3)
        const angleSum = pareticHand.angles.finger1 + pareticHand.angles.finger2 + pareticHand.angles.finger3;
        
        // Mapeo inverso: suma=0 → derecha (gameWidth-50), suma>=200 → izquierda (50)
        // Interpolación lineal entre [0, 200] → [gameWidth-50, 50]
        const clampedSum = Math.max(0, Math.min(200, angleSum));
        const normalizedPosition = clampedSum / 200; // [0, 1]
        const newPosition = (gameWidth - 50) - (normalizedPosition * (gameWidth - 100)); // Invertir
        
        setPlayerPosition(Math.max(50, Math.min(gameWidth - 50, newPosition)));
      }
    };

    const interval = setInterval(updatePlayerPosition, 100);
    return () => clearInterval(interval);
  }, [gameStarted, gameWidth, leftHand, rightHand]);

  // Movimiento mejorado de enemigos (comportamiento clásico)
  useEffect(() => {
    if (!gameStarted || enemies.length === 0) return;

    const moveEnemies = () => {
      setEnemies(prev => {
        let shouldMoveDown = false;
        const activeEnemies = prev.filter(e => !e.destroyed);
        
        // Verificar si algún enemigo tocó un borde
        const rightmostX = Math.max(...activeEnemies.map(e => e.x));
        const leftmostX = Math.min(...activeEnemies.map(e => e.x));
        
        if ((enemyDirection === 1 && rightmostX >= gameWidth - 50) || 
            (enemyDirection === -1 && leftmostX <= 50)) {
          shouldMoveDown = true;
          setEnemyDirection(prev => prev * -1);
          setEnemyMoveDown(true);
        }

        return prev.map(enemy => {
          if (enemy.destroyed) return enemy;
          
          if (enemyMoveDown) {
            // Mover hacia abajo
            return { ...enemy, y: enemy.y + 30 };
          } else {
            // Mover lateralmente
            return { ...enemy, x: enemy.x + (enemyDirection * enemySpeed * 2) };
          }
        });
      });
      
      // Reset del movimiento hacia abajo
      if (enemyMoveDown) {
        setTimeout(() => setEnemyMoveDown(false), 100);
      }
    };

    const interval = setInterval(moveEnemies, 200);
    return () => clearInterval(interval);
  }, [gameStarted, enemies.length, enemySpeed, enemyDirection, enemyMoveDown]);

  // Movimiento de balas
  useEffect(() => {
    if (!gameStarted) return;

    const moveBullets = () => {
      setBullets(prev => prev
        .map(bullet => ({ ...bullet, y: bullet.y - shotSpeed * 2 }))
        .filter(bullet => bullet.y > 0)
      );
    };

    const interval = setInterval(moveBullets, 50);
    return () => clearInterval(interval);
  }, [gameStarted, shotSpeed]);

  // Detección de colisiones
  useEffect(() => {
    if (!gameStarted) return;

    const checkCollisions = () => {
      setBullets(prevBullets => {
        const remainingBullets: Bullet[] = [];
        
        prevBullets.forEach(bullet => {
          let hit = false;
          
          setEnemies(prevEnemies => {
            return prevEnemies.map(enemy => {
              if (!enemy.destroyed && 
                  Math.abs(bullet.x - enemy.x) < 30 && 
                  Math.abs(bullet.y - enemy.y) < 30) {
                hit = true;
                
                // Crear explosión
                setExplosions(prev => [...prev, {
                  id: explosionIdRef.current++,
                  x: enemy.x,
                  y: enemy.y
                }]);
                
                // Incrementar puntuación y reproducir sonido
                setScore(s => s + 10);
                setEnemiesDestroyed(d => d + 1);
                playHitSound();
                
                return { ...enemy, destroyed: true };
              }
              return enemy;
            });
          });
          
          if (!hit) {
            remainingBullets.push(bullet);
          }
        });
        
        return remainingBullets;
      });
    };

    const interval = setInterval(checkCollisions, 50);
    return () => clearInterval(interval);
  }, [gameStarted]);

  // Eliminar explosiones después de un tiempo
  useEffect(() => {
    explosions.forEach(explosion => {
      setTimeout(() => {
        setExplosions(prev => prev.filter(e => e.id !== explosion.id));
      }, 500);
    });
  }, [explosions]);

  // Verificar fin de oleada y lógica de derrota
  useEffect(() => {
    if (!gameStarted || gameOver) return;
    
    const activeEnemies = enemies.filter(e => !e.destroyed);
    const playerY = gameHeight - 70;
    
    // Verificar si algún enemigo alcanzó la altura de la nave
    const enemyReachedPlayer = activeEnemies.some(enemy => enemy.y >= playerY - 50);
    
    if (enemyReachedPlayer) {
      // Lógica de derrota
      const remainingEnemies = activeEnemies.length;
      const penalty = remainingEnemies * 5; // 5 puntos por cada enemigo restante
      setScore(prev => Math.max(0, prev - penalty));
      setGameOver(true);
      
      // Guardar datos en Supabase antes de mostrar derrota
      saveGameData(true);
      
      setTimeout(() => {
        onComplete();
      }, 500);
      return;
    }
    
    // Verificar si se completó la oleada
    if (activeEnemies.length === 0 && enemies.length > 0) {
      setTimeout(() => {
        if (wave < 3) {
          // Oleadas principales
          const nextWave = wave + 1;
          setWave(nextWave);
          setEnemies(createEnemies(nextWave));
        } else {
          // Oleadas extra infinitas - solo contar cuando se completa una ronda
          const newExtraWaves = extraWaves + 1;
          setExtraWaves(newExtraWaves);
          setEnemies(createEnemies(3 + Math.floor(newExtraWaves / 2))); // Incrementar dificultad gradualmente
        }
      }, 1000);
    }
  }, [enemies, gameStarted, wave, extraWaves, createEnemies, gameHeight, gameOver, onComplete]);

  // Disparo automático
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const autoShoot = () => {
      setBullets(prev => [...prev, {
        id: bulletIdRef.current++,
        x: playerPosition,
        y: gameHeight - 80
      }]);
      setShotsFired(prev => prev + 1);
    };

    const shootIntervalRef = setInterval(autoShoot, shootInterval);
    return () => clearInterval(shootIntervalRef);
  }, [gameStarted, playerPosition, gameHeight, shootInterval, gameOver]);

  // Guardar datos del juego en Supabase
  const saveGameData = useCallback(async (defeated: boolean = false) => {
    if (!user || !gameStartTime) return;
    
    const gameEndTime = new Date();
    const gameDurationMinutes = (gameEndTime.getTime() - gameStartTime.getTime()) / (1000 * 60);
    const accuracy = shotsFired > 0 ? (enemiesDestroyed / shotsFired) * 100 : 0;
    const enemiesPerMinute = gameDurationMinutes > 0 ? enemiesDestroyed / gameDurationMinutes : 0;
    const totalRounds = wave > 3 ? 3 : wave;
    const rating = Math.round((accuracy * 0.3) + (enemiesPerMinute * 0.4) + (totalRounds * 0.2) + (extraWaves * 0.1));
    
    try {
      // Crear sesión
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          duracion_minutos: Math.round(gameDurationMinutes),
          tipo_actividad: 'neurolink',
          estado: defeated ? 'failed' : 'completed'
        })
        .select()
        .single();
        
      if (sessionError) throw sessionError;
      
      // Crear registro del juego
      const { error: gameError } = await supabase
        .from('game_records')
        .insert({
          user_id: user.id,
          session_id: session.id,
          game_type: 'neurolink',
          total_oranges: enemiesDestroyed,
          total_glasses: totalRounds + extraWaves,
          average_oranges_per_minute: enemiesPerMinute
        });
        
      if (gameError) throw gameError;
      
    } catch (error) {
      console.error('Error saving game data:', error);
    }
  }, [user, gameStartTime, shotsFired, enemiesDestroyed, wave, extraWaves]);

  // Calcular estadísticas
  const calculateStats = useCallback(() => {
    const accuracy = shotsFired > 0 ? (enemiesDestroyed / shotsFired) * 100 : 0;
    const enemiesPerMinute = enemiesDestroyed; // Se puede ajustar con tiempo real
    const totalRounds = wave > 3 ? 3 : wave;
    const rating = Math.round((accuracy * 0.3) + (enemiesPerMinute * 0.4) + (totalRounds * 0.2) + (extraWaves * 0.1));
    
    return { accuracy, enemiesPerMinute, totalRounds, extraWaves, rating };
  }, [shotsFired, enemiesDestroyed, wave, extraWaves]);

  const activeEnemies = enemies.filter(e => !e.destroyed);
  const progress = enemies.length > 0 ? ((enemies.length - activeEnemies.length) / enemies.length) * 100 : 0;

  // Auto-iniciar el juego (eliminar menú)
  useEffect(() => {
    if (!gameStarted) {
      initGame();
    }
  }, [initGame, gameStarted]);

  return (
    <Card>
      <CardContent className="p-4">
        {/* Header del juego */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-lg font-bold">Puntuación: {score}</div>
          <div className="text-lg font-bold">
            {wave <= 3 ? `Oleada: ${wave}/3` : `Extra: ${extraWaves}`}
          </div>
          <div className="text-lg font-bold">Eliminados: {enemiesDestroyed}</div>
        </div>

        {/* Barra de progreso */}
        <div className="mb-4">
          <Progress value={progress} className="h-2" />
          <div className="text-xs text-center mt-1">
            {activeEnemies.length} objetivos restantes
            {extraWaves > 0 && ` | Rondas Extra: ${extraWaves}`}
          </div>
        </div>

        {/* Área de juego */}
        <div 
          ref={gameRef}
          className="relative bg-gradient-to-b from-purple-900 via-blue-900 to-black rounded-lg overflow-hidden border-2 border-purple-400"
          style={{ width: gameWidth, height: gameHeight, margin: '0 auto' }}
        >
          {/* Estrellas de fondo */}
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`
                }}
              />
            ))}
          </div>

          {/* Enemigos */}
          {enemies.map(enemy => !enemy.destroyed && (
            <div
              key={enemy.id}
              className="absolute transition-all duration-100"
              style={{ 
                left: enemy.x - 20, 
                top: enemy.y - 20,
                width: '40px',
                height: '40px'
              }}
            >
              <img 
                src={getEnemyImage(wave)} 
                alt="Enemigo" 
                className="w-full h-full object-contain"
                style={{ 
                  filter: 'drop-shadow(0 0 5px rgba(255, 255, 255, 0.3))',
                  imageRendering: 'pixelated'
                }}
              />
            </div>
          ))}

          {/* Balas */}
          {bullets.map(bullet => (
            <div
              key={bullet.id}
              className="absolute w-3 h-6 bg-blue-300 rounded-full animate-pulse shadow-md"
              style={{ left: bullet.x - 1.5, top: bullet.y - 3 }}
            />
          ))}

          {/* Explosiones */}
          {explosions.map(explosion => (
            <div
              key={explosion.id}
              className="absolute text-2xl animate-bounce"
              style={{ left: explosion.x - 10, top: explosion.y - 10 }}
            >
              ⭐
            </div>
          ))}

          {/* Jugador */}
          <div
            className="absolute transition-all duration-200 ease-out"
            style={{ 
              left: playerPosition - 32, // Centrar imagen de 64px
              top: gameHeight - 70,
              width: '64px',
              height: '64px'
            }}
          >
            <img 
              src={playerHandImage} 
              alt="Mano del jugador" 
              className="w-full h-full object-contain select-none"
              style={{ 
                filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.6))',
                imageRendering: 'pixelated',
                background: 'transparent'
              }}
            />
          </div>

        </div>

        {/* Mensajes de estado del juego */}
        {gameOver && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg text-center max-w-sm mx-4 shadow-xl">
              <div className="text-2xl font-bold text-red-600 mb-2">¡Ronda Perdida!</div>
              <div className="text-gray-700 mb-4">
                Los enemigos alcanzaron tu posición
              </div>
              <div className="text-sm text-gray-600 mb-4">
                Enemigos restantes: {enemies.filter(e => !e.destroyed).length}<br/>
                Puntuación final: {score}
              </div>
              <Button 
                onClick={onComplete}
                className="bg-primary hover:bg-primary/90"
              >
                Continuar
              </Button>
            </div>
          </div>
        )}
        
        {/* Mensajes de progreso */}
        {(wave > 1 || extraWaves > 0) && !gameOver && (
          <div className="text-center mt-4 p-3 bg-green-100 rounded-lg">
            <div className="text-lg font-bold text-green-800">
              {extraWaves > 0 ? `¡Ronda Extra ${extraWaves} completada!` : `¡Oleada ${wave-1} completada!`} 🎉
            </div>
            <div className="text-sm text-green-600">¡Excelente trabajo, sigue así!</div>
          </div>
        )}

        {/* Estadísticas del juego */}
        <div className="text-center mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-xs text-muted-foreground">
            Precisión: {shotsFired > 0 ? Math.round((enemiesDestroyed / shotsFired) * 100) : 0}% | 
            Disparos: {shotsFired} | 
            Posición: {Math.round(playerPosition)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NeuroLinkGame;