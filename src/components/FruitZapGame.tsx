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
  const [playerAngle, setPlayerAngle] = useState(0); // 0=centro, -1=izquierda, 1=derecha
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
  const gameRef = useRef<HTMLDivElement>(null);
  const bulletIdRef = useRef(0);
  const enemyIdRef = useRef(0);
  const explosionIdRef = useRef(0);

  // Emojis para enemigos por oleada
  const getEnemyEmoji = (waveNumber: number) => {
    const emojis = ['🍎', '🍊', '🍌', '🍇', '🍓', '🥝', '🍑', '🍒'];
    return emojis[(waveNumber - 1) % emojis.length];
  };

  // Crear enemigos con posiciones aleatorias
  const createEnemies = useCallback((waveNumber: number) => {
    const newEnemies: Enemy[] = [];
    const rows = Math.min(3 + Math.floor(waveNumber / 2), 5);
    const cols = Math.min(6 + waveNumber, 10);
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Posición base con offset aleatorio
        const baseX = 100 + col * 60;
        const baseY = 50 + row * 50;
        const offsetX = (Math.random() - 0.5) * 30; // ±15px horizontal
        const offsetY = (Math.random() - 0.5) * 20; // ±10px vertical
        
        newEnemies.push({
          id: enemyIdRef.current++,
          x: Math.max(30, Math.min(gameWidth - 30, baseX + offsetX)),
          y: Math.max(20, baseY + offsetY),
          destroyed: false
        });
      }
    }
    return newEnemies;
  }, [gameWidth]);

  // Inicializar juego
  const initGame = useCallback(() => {
    setScore(0);
    setPlayerAngle(0);
    setPlayerPosition(400);
    setBullets([]);
    setExplosions([]);
    setWave(1);
    setExtraWaves(0);
    setEnemiesDestroyed(0);
    setShotsFired(0);
    setEnemies(createEnemies(1));
    setGameStarted(true);
  }, [createEnemies]);

  // Movimiento automático del jugador en 3 ángulos
  useEffect(() => {
    if (!gameStarted) return;

    const movePlayer = () => {
      setPlayerAngle(prev => {
        // Ciclo: centro -> izquierda -> centro -> derecha -> centro
        if (prev === 0) return Math.random() < 0.5 ? -1 : 1;
        return 0;
      });
    };

    // Cambiar ángulo cada 2 segundos
    const interval = setInterval(movePlayer, 2000);
    return () => clearInterval(interval);
  }, [gameStarted]);

  // Actualizar posición basada en el ángulo
  useEffect(() => {
    const centerX = gameWidth / 2;
    const offset = 150; // distancia desde el centro
    
    switch (playerAngle) {
      case -1: // izquierda
        setPlayerPosition(centerX - offset);
        break;
      case 1: // derecha
        setPlayerPosition(centerX + offset);
        break;
      default: // centro
        setPlayerPosition(centerX);
    }
  }, [playerAngle, gameWidth]);

  // Movimiento de enemigos
  useEffect(() => {
    if (!gameStarted || enemies.length === 0) return;

    const moveEnemies = () => {
      setEnemies(prev => prev.map(enemy => ({
        ...enemy,
        y: enemy.y + enemySpeed * 0.5
      })));
    };

    const interval = setInterval(moveEnemies, 100);
    return () => clearInterval(interval);
  }, [gameStarted, enemies.length, enemySpeed]);

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
                
                // Incrementar puntuación
                setScore(s => s + 10);
                setEnemiesDestroyed(d => d + 1);
                
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
              top: gameHeight - 80,
              transform: `rotate(${playerAngle * 15}deg)`
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
            Posición: {playerAngle === -1 ? 'Izquierda' : playerAngle === 1 ? 'Derecha' : 'Centro'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FruitZapGame;