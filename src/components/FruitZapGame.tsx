import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useGameConfig } from '@/contexts/GameConfigContext';
import playerHandImage from '@/assets/player-hand.png';

interface FruitZapGameProps {
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

const FruitZapGame: React.FC<FruitZapGameProps> = ({ onComplete }) => {
  const { enemySpeed, shotSpeed } = useGameConfig();
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
  const gameRef = useRef<HTMLDivElement>(null);
  const bulletIdRef = useRef(0);
  const enemyIdRef = useRef(0);
  const explosionIdRef = useRef(0);

  // Emojis para enemigos por oleada
  const getEnemyEmoji = (waveNumber: number) => {
    const emojis = ['🍎', '🍊', '🍌', '🍇', '🍓', '🥝', '🍑', '🍒'];
    return emojis[(waveNumber - 1) % emojis.length];
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
    setEnemies(createEnemies(1));
    setGameStarted(true);
  }, [createEnemies]);

  // Control del jugador basado en suma de ángulos de la mano (simulado por ahora)
  useEffect(() => {
    if (!gameStarted) return;

    // TODO: Integrar con datos reales de handAngles cuando esté disponible
    // Por ahora simular movimiento automático
    const movePlayer = () => {
      setPlayerPosition(prev => {
        const center = gameWidth / 2;
        const amplitude = 250;
        const time = Date.now() / 1000;
        return center + Math.sin(time * 0.5) * amplitude;
      });
    };

    const interval = setInterval(movePlayer, 100);
    return () => clearInterval(interval);
  }, [gameStarted, gameWidth]);

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

  // Verificar fin de oleada
  useEffect(() => {
    if (!gameStarted) return;
    
    const activeEnemies = enemies.filter(e => !e.destroyed);
    if (activeEnemies.length === 0 && enemies.length > 0) {
      setTimeout(() => {
        if (wave < 3) {
          // Oleadas principales
          const nextWave = wave + 1;
          setWave(nextWave);
          setEnemies(createEnemies(nextWave));
        } else {
          // Oleadas extra infinitas
          setExtraWaves(prev => prev + 1);
          setEnemies(createEnemies(3 + Math.floor(extraWaves / 2))); // Incrementar dificultad gradualmente
        }
      }, 1000);
    }
  }, [enemies, gameStarted, wave, extraWaves, createEnemies]);

  // Disparo automático
  useEffect(() => {
    if (!gameStarted) return;

    const autoShoot = () => {
      setBullets(prev => [...prev, {
        id: bulletIdRef.current++,
        x: playerPosition,
        y: gameHeight - 80
      }]);
      setShotsFired(prev => prev + 1);
    };

    const shootInterval = setInterval(autoShoot, 1200 - (shotSpeed * 200));
    return () => clearInterval(shootInterval);
  }, [gameStarted, playerPosition, gameHeight, shotSpeed]);

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
            {activeEnemies.length} frutas restantes
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
              className="absolute text-3xl transition-all duration-100"
              style={{ 
                left: enemy.x - 15, 
                top: enemy.y - 15,
                transform: 'scale(1.2)'
              }}
            >
              {getEnemyEmoji(wave)}
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
            className="absolute transition-all duration-500"
            style={{ 
              left: playerPosition - 30, 
              top: gameHeight - 80
            }}
          >
            <img 
              src={playerHandImage} 
              alt="Mano del jugador" 
              className="w-16 h-16 object-contain"
            />
          </div>

        </div>

        {/* Mensajes motivacionales */}
        {(wave > 1 || extraWaves > 0) && (
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

export default FruitZapGame;