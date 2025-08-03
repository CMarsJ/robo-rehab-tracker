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
  const { enemySpeed, shotSpeed, baseEnemyCount } = useGameConfig();
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
  const [gameLost, setGameLost] = useState(false);
  const [gameStartTime, setGameStartTime] = useState<Date | null>(null);
  const gameRef = useRef<HTMLDivElement>(null);
  const bulletIdRef = useRef(0);
  const enemyIdRef = useRef(0);
  const explosionIdRef = useRef(0);

  // Imagen de enemigo fija por oleada
  const [currentWaveEnemyImage, setCurrentWaveEnemyImage] = useState(enemigo1);
  
  const getRandomEnemyImage = () => {
    const enemyImages = [enemigo1, enemigo2, enemigo3, enemigo4];
    return enemyImages[Math.floor(Math.random() * enemyImages.length)];
  };

  // Crear enemigos con posiciones aleatorias
  const createEnemies = useCallback((waveNumber: number) => {
    const newEnemies: Enemy[] = [];
    // Calcular número de enemigos: baseEnemyCount * (1.5^(waveNumber-1))
    const enemyCount = Math.floor(baseEnemyCount * Math.pow(1.5, waveNumber - 1));
    const maxEnemies = Math.min(enemyCount, 20); // Limitar a 20 enemigos máximo
    
    // Seleccionar imagen aleatoria para toda la oleada
    setCurrentWaveEnemyImage(getRandomEnemyImage());
    
    for (let i = 0; i < maxEnemies; i++) {
      // Posiciones completamente aleatorias en horizontal
      const x = 80 + Math.random() * (gameWidth - 160);
      const y = 60 + Math.random() * 150; // Distribución vertical aleatoria
      
      newEnemies.push({
        id: enemyIdRef.current++,
        x: Math.max(40, Math.min(gameWidth - 40, x)),
        y: Math.max(30, y),
        destroyed: false,
        row: Math.floor(i / 8), // Para compatibilidad
        col: i % 8
      });
    }
    return newEnemies;
  }, [gameWidth, baseEnemyCount]);

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
    setGameLost(false);
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
      setGameLost(true);
      
      // Guardar datos en Supabase antes de mostrar derrota
      saveGameData(true);
      
      // Auto-ocultar mensaje después de 3 segundos
      setTimeout(() => {
        setGameLost(false);
        onComplete();
      }, 3000);
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
          // Oleadas extra infinitas - solo contar al finalizar ronda completa
          const newExtraWaves = extraWaves + 1;
          setExtraWaves(newExtraWaves);
          setEnemies(createEnemies(4 + newExtraWaves)); // Incrementar dificultad
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
    const gameDurationSeconds = (gameEndTime.getTime() - gameStartTime.getTime()) / 1000;
    const pointsPerSecond = gameDurationSeconds > 0 ? score / gameDurationSeconds : 0;
    
    try {
      // Crear sesión
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          duracion_minutos: Math.round(gameDurationSeconds / 60),
          tipo_actividad: 'neurolink',
          estado: defeated ? 'failed' : 'completed'
        })
        .select()
        .single();
        
      if (sessionError) throw sessionError;
      
      // Crear registro del juego con puntaje total y puntos por segundo
      const { error: gameError } = await supabase
        .from('game_records')
        .insert({
          user_id: user.id,
          session_id: session.id,
          game_type: 'neurolink',
          total_oranges: score, // Usar score como puntaje total
          total_glasses: wave + extraWaves, // Total de rondas jugadas
          average_oranges_per_minute: pointsPerSecond * 60 // Convertir a puntos por minuto para compatibilidad
        });
        
      if (gameError) throw gameError;
      
    } catch (error) {
      console.error('Error saving game data:', error);
    }
  }, [user, gameStartTime, score, wave, extraWaves]);

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
                src={currentWaveEnemyImage} 
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

        {/* Mensaje de ronda perdida - estilo inferior */}
        {gameLost && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
            <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-lg max-w-md">
              <div className="text-lg font-bold mb-2">¡Ronda Perdida!</div>
              <div className="text-sm">
                Los enemigos alcanzaron tu posición<br/>
                Enemigos restantes: {enemies.filter(e => !e.destroyed).length} | Puntuación: {score}
              </div>
            </div>
          </div>
        )}
        
        {/* Mensajes de progreso */}
        {(wave > 1 || extraWaves > 0) && !gameOver && !gameLost && (
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