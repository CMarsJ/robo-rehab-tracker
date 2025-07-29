import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useGameConfig } from '@/contexts/GameConfigContext';

interface SpaceInvadersGameProps {
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

const SpaceInvadersGame: React.FC<SpaceInvadersGameProps> = ({ onComplete }) => {
  const { enemySpeed, shotSpeed } = useGameConfig();
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [playerX, setPlayerX] = useState(400);
  const [playerDirection, setPlayerDirection] = useState(1);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const [gameWidth] = useState(800);
  const [gameHeight] = useState(600);
  const [wave, setWave] = useState(1);
  const [enemiesDestroyed, setEnemiesDestroyed] = useState(0);
  const gameRef = useRef<HTMLDivElement>(null);
  const bulletIdRef = useRef(0);
  const enemyIdRef = useRef(0);
  const explosionIdRef = useRef(0);

  // Emojis para enemigos por oleada
  const getEnemyEmoji = (waveNumber: number) => {
    const emojis = ['🍎', '🍊', '🍌', '🍇', '🍓', '🥝', '🍑', '🍒'];
    return emojis[(waveNumber - 1) % emojis.length];
  };

  // Crear enemigos para una oleada
  const createEnemies = useCallback((waveNumber: number) => {
    const newEnemies: Enemy[] = [];
    const rows = Math.min(3 + Math.floor(waveNumber / 2), 5);
    const cols = Math.min(6 + waveNumber, 10);
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        newEnemies.push({
          id: enemyIdRef.current++,
          x: 100 + col * 60,
          y: 50 + row * 50,
          destroyed: false
        });
      }
    }
    return newEnemies;
  }, []);

  // Inicializar juego
  const initGame = useCallback(() => {
    setScore(0);
    setPlayerX(400);
    setPlayerDirection(1);
    setBullets([]);
    setExplosions([]);
    setWave(1);
    setEnemiesDestroyed(0);
    setEnemies(createEnemies(1));
    setGameStarted(true);
  }, [createEnemies]);

  // Movimiento automático del jugador
  useEffect(() => {
    if (!gameStarted) return;

    const movePlayer = () => {
      setPlayerX(prev => {
        const newX = prev + playerDirection * 2;
        if (newX <= 20 || newX >= gameWidth - 20) {
          setPlayerDirection(d => -d);
          return prev;
        }
        return newX;
      });
    };

    const interval = setInterval(movePlayer, 50);
    return () => clearInterval(interval);
  }, [gameStarted, playerDirection, gameWidth]);

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
      // Nueva oleada
      setTimeout(() => {
        const nextWave = wave + 1;
        setWave(nextWave);
        setEnemies(createEnemies(nextWave));
        
        if (nextWave > 3) {
          // Completar juego después de 3 oleadas
          setGameStarted(false);
          onComplete();
        }
      }, 1000);
    }
  }, [enemies, gameStarted, wave, createEnemies, onComplete]);

  // Disparo automático
  useEffect(() => {
    if (!gameStarted) return;

    const autoShoot = () => {
      setBullets(prev => [...prev, {
        id: bulletIdRef.current++,
        x: playerX,
        y: gameHeight - 80
      }]);
    };

    const shootInterval = setInterval(autoShoot, 1000 - (shotSpeed * 150));
    return () => clearInterval(shootInterval);
  }, [gameStarted, playerX, gameHeight, shotSpeed]);

  // Disparo manual
  const handleShoot = () => {
    if (!gameStarted) return;
    
    setBullets(prev => [...prev, {
      id: bulletIdRef.current++,
      x: playerX,
      y: gameHeight - 80
    }]);
  };

  const activeEnemies = enemies.filter(e => !e.destroyed);
  const progress = enemies.length > 0 ? ((enemies.length - activeEnemies.length) / enemies.length) * 100 : 0;

  if (!gameStarted) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-6xl mb-4">🚀</div>
          <h3 className="text-2xl font-bold mb-4">Space Invaders Terapéutico</h3>
          <p className="text-muted-foreground mb-6">
            Tu nave se mueve automáticamente. ¡Presiona el botón para disparar a las frutas!
          </p>
          <div className="mb-6">
            <div className="text-lg font-semibold">Configuración:</div>
            <div className="text-sm text-muted-foreground">
              Velocidad enemigos: {enemySpeed}/5 | Velocidad disparo: {shotSpeed}/5
            </div>
          </div>
          <Button onClick={initGame} size="lg" className="bg-purple-600 hover:bg-purple-700">
            🚀 Comenzar Misión
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        {/* Header del juego */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-lg font-bold">Puntuación: {score}</div>
          <div className="text-lg font-bold">Oleada: {wave}/3</div>
          <div className="text-lg font-bold">Eliminados: {enemiesDestroyed}</div>
        </div>

        {/* Barra de progreso */}
        <div className="mb-4">
          <Progress value={progress} className="h-2" />
          <div className="text-xs text-center mt-1">
            {activeEnemies.length} frutas restantes
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
              className="absolute w-2 h-4 bg-yellow-400 rounded-full animate-pulse"
              style={{ left: bullet.x - 1, top: bullet.y - 2 }}
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
            className="absolute text-4xl transition-all duration-100"
            style={{ 
              left: playerX - 20, 
              top: gameHeight - 60,
              transform: 'scale(1.1)'
            }}
          >
            🚀
          </div>

          {/* Botón de disparo */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <Button
              onClick={handleShoot}
              size="lg"
              className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-2xl"
            >
              🔥
            </Button>
          </div>
        </div>

        {/* Mensajes motivacionales */}
        {wave > 1 && (
          <div className="text-center mt-4 p-3 bg-green-100 rounded-lg">
            <div className="text-lg font-bold text-green-800">
              ¡Oleada {wave-1} completada! 🎉
            </div>
            <div className="text-sm text-green-600">¡Excelente trabajo, sigue así!</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SpaceInvadersGame;