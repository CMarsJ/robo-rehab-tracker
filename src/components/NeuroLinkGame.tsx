import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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
  const [enemyDirection, setEnemyDirection] = useState(1);
  const [enemyMoveDown, setEnemyMoveDown] = useState(false);
  const [shootInterval, setShootInterval] = useState(1000);
  const [gameOver, setGameOver] = useState(false);
  const [gameLost, setGameLost] = useState(false);
  const [gameStartTime, setGameStartTime] = useState<Date | null>(null);
  const [currentWaveEnemyImage, setCurrentWaveEnemyImage] = useState(enemigo1);

  const bulletIdRef = useRef(0);
  const enemyIdRef = useRef(0);
  const explosionIdRef = useRef(0);

  const enemyImages = [enemigo1, enemigo2, enemigo3, enemigo4];

  const getRandomEnemyImage = () => {
    return enemyImages[Math.floor(Math.random() * enemyImages.length)];
  };

  const createEnemies = useCallback((waveNumber: number) => {
    const newEnemies: Enemy[] = [];
    const enemyCount = Math.floor(baseEnemyCount * Math.pow(1.5, waveNumber - 1));
    const maxEnemies = Math.min(enemyCount, 20);

    setCurrentWaveEnemyImage(getRandomEnemyImage());

    for (let i = 0; i < maxEnemies; i++) {
      let attempts = 0;
      let x = 0;
      let y = 0;
      let isOverlapping = false;

      do {
        x = 80 + Math.random() * (gameWidth - 160);
        y = 60 + Math.random() * 150;

        isOverlapping = newEnemies.some(enemy =>
          Math.abs(enemy.x - x) < 50 && Math.abs(enemy.y - y) < 50
        );

        attempts++;
      } while (isOverlapping && attempts < 20);

      newEnemies.push({
        id: enemyIdRef.current++,
        x: Math.max(40, Math.min(gameWidth - 40, x)),
        y: Math.max(30, y),
        destroyed: false,
        row: Math.floor(i / 8),
        col: i % 8
      });
    }
    return newEnemies;
  }, [baseEnemyCount, gameWidth]);

  const playHitSound = useCallback(() => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  }, []);

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

    // Disparo automático
  useEffect(() => {
    if (!gameStarted || gameOver) return;
    const shoot = () => {
      setBullets(prev => [...prev, {
        id: bulletIdRef.current++,
        x: playerPosition,
        y: gameHeight - 80
      }]);
      setShotsFired(prev => prev + 1);
    };
    const interval = setInterval(shoot, shootInterval);
    return () => clearInterval(interval);
  }, [gameStarted, gameOver, playerPosition, gameHeight, shootInterval]);

  // Movimiento del jugador (controlado por ángulos A4+A5+A6)
  useEffect(() => {
    if (!gameStarted) return;
    const interval = setInterval(() => {
      const pareticHand = leftHand.active ? leftHand : rightHand;
      if (pareticHand.active) {
        const sum = pareticHand.angles.finger1 + pareticHand.angles.finger2 + pareticHand.angles.finger3;
        const clamped = Math.max(0, Math.min(200, sum));
        const normalized = clamped / 200;
        const newX = (gameWidth - 50) - (normalized * (gameWidth - 100));
        setPlayerPosition(Math.max(50, Math.min(gameWidth - 50, newX)));
      }
    }, 100);
    return () => clearInterval(interval);
  }, [gameStarted, leftHand, rightHand, gameWidth]);

  // Movimiento de enemigos
  useEffect(() => {
    if (!gameStarted || enemies.length === 0) return;
    const interval = setInterval(() => {
      setEnemies(prev => {
        const active = prev.filter(e => !e.destroyed);
        const rightmost = Math.max(...active.map(e => e.x));
        const leftmost = Math.min(...active.map(e => e.x));
        let moveDown = enemyMoveDown;

        if ((enemyDirection === 1 && rightmost >= gameWidth - 50) ||
            (enemyDirection === -1 && leftmost <= 50)) {
          setEnemyDirection(d => d * -1);
          setEnemyMoveDown(true);
          moveDown = true;
        }

        return prev.map(enemy => {
          if (enemy.destroyed) return enemy;
          return moveDown
            ? { ...enemy, y: enemy.y + 30 }
            : { ...enemy, x: enemy.x + (enemyDirection * enemySpeed * 2) };
        });
      });

      if (enemyMoveDown) {
        setTimeout(() => setEnemyMoveDown(false), 100);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [gameStarted, enemies.length, enemyDirection, enemyMoveDown, enemySpeed, gameWidth]);

  // Movimiento de balas
  useEffect(() => {
    if (!gameStarted) return;
    const interval = setInterval(() => {
      setBullets(prev =>
        prev.map(b => ({ ...b, y: b.y - shotSpeed * 2 }))
           .filter(b => b.y > 0)
      );
    }, 50);
    return () => clearInterval(interval);
  }, [gameStarted, shotSpeed]);

  // Colisiones
  useEffect(() => {
    if (!gameStarted) return;
    const interval = setInterval(() => {
      setBullets(prevBullets => {
        const remaining: Bullet[] = [];
        prevBullets.forEach(bullet => {
          let hit = false;
          setEnemies(prevEnemies => {
            return prevEnemies.map(enemy => {
              if (!enemy.destroyed &&
                  Math.abs(bullet.x - enemy.x) < 30 &&
                  Math.abs(bullet.y - enemy.y) < 30) {
                hit = true;
                setExplosions(prev => [...prev, { id: explosionIdRef.current++, x: enemy.x, y: enemy.y }]);
                setScore(s => s + 10);
                setEnemiesDestroyed(d => d + 1);
                playHitSound();
                return { ...enemy, destroyed: true };
              }
              return enemy;
            });
          });
          if (!hit) remaining.push(bullet);
        });
        return remaining;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [gameStarted, playHitSound]);

  // Eliminar explosiones
  useEffect(() => {
    explosions.forEach(explosion => {
      setTimeout(() => {
        setExplosions(prev => prev.filter(e => e.id !== explosion.id));
      }, 500);
    });
  }, [explosions]);
  
  const saveGameData = useCallback(async (defeated: boolean = false) => {
    if (!user || !gameStartTime) return;
    const end = new Date();
    const duration = (end.getTime() - gameStartTime.getTime()) / 1000;
    const ppm = duration > 0 ? (score / duration) * 60 : 0;

    try {
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          duracion_minutos: Math.round(duration / 60),
          tipo_actividad: 'neurolink',
          estado: defeated ? 'failed' : 'completed'
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      const { error: gameError } = await supabase
        .from('game_records')
        .insert({
          user_id: user.id,
          session_id: session.id,
          game_type: 'neurolink',
          total_oranges: score,
          total_glasses: wave + extraWaves,
          average_oranges_per_minute: ppm
        });

      if (gameError) throw gameError;
    } catch (error) {
      console.error('Error saving game data:', error);
    }
  }, [user, gameStartTime, score, wave, extraWaves]);

  // Oleadas y derrota
  useEffect(() => {
    if (!gameStarted || gameOver) return;
    const active = enemies.filter(e => !e.destroyed);
    const playerY = gameHeight - 70;
    const reached = active.some(enemy => enemy.y >= playerY - 50);

    if (reached) {
      const penalty = active.length * 5;
      setScore(prev => Math.max(0, prev - penalty));
      setGameLost(true);
      saveGameData(true);
      setTimeout(() => {
        setGameLost(false);
        onComplete();
      }, 3000);
      return;
    }

    if (active.length === 0 && enemies.length > 0) {
      setTimeout(() => {
        if (wave < 3) {
          const next = wave + 1;
          setWave(next);
          setEnemies(createEnemies(next));
        } else {
          const extras = extraWaves + 1;
          setExtraWaves(extras);
          setEnemies(createEnemies(4 + extras));
        }
      }, 1000);
    }
  }, [enemies, wave, extraWaves, gameStarted, gameOver, gameHeight, createEnemies, saveGameData, onComplete]);

  useEffect(() => {
    if (!gameStarted) {
      initGame();
    }
  }, [gameStarted, initGame]);

  useEffect(() => {
    if (!user) return;
    const loadShootInterval = async () => {
      try {
        const { data, error } = await supabase
          .from('game_settings')
          .select('intervalo_disparo_ms')
          .eq('user_id', user.id)
          .single();
        if (data && !error) setShootInterval(data.intervalo_disparo_ms);
      } catch (error) {
        console.error('Error loading shoot interval:', error);
      }
    };
    loadShootInterval();
  }, [user]);

  const activeEnemies = enemies.filter(e => !e.destroyed);
  const progress = enemies.length > 0
    ? ((enemies.length - activeEnemies.length) / enemies.length) * 100
    : 0;

  return (
    <Card>
      <CardContent className="p-4">
        {/* Encabezado */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-lg font-bold">Puntuación: {score}</div>
          <div className="text-lg font-bold">
            {wave <= 3 ? `Oleada: ${wave}/3` : `Extra: ${extraWaves}`}
          </div>
          <div className="text-lg font-bold">Eliminados: {enemiesDestroyed}</div>
        </div>

        {/* Progreso */}
        <div className="mb-4">
          <Progress value={progress} className="h-2" />
          <div className="text-xs text-center mt-1">
            {activeEnemies.length} objetivos restantes
            {extraWaves > 0 && ` | Rondas Extra: ${extraWaves}`}
          </div>
        </div>

        {/* Área de juego */}
        <div
          className="relative bg-gradient-to-b from-purple-900 via-blue-900 to-black rounded-lg overflow-hidden border-2 border-purple-400"
          style={{ width: gameWidth, height: gameHeight, margin: '0 auto' }}
        >
          {/* Estrellas */}
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
          {activeEnemies.map(enemy => (
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
                  filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.3))',
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
              left: playerPosition - 32,
              top: gameHeight - 70,
              width: '64px',
              height: '64px'
            }}
          >
            <img
              src={playerHandImage}
              alt="Jugador"
              className="w-full h-full object-contain select-none"
              style={{
                filter: 'drop-shadow(0 0 10px rgba(59,130,246,0.6))',
                imageRendering: 'pixelated'
              }}
            />
          </div>
        </div>

        {/* Mensaje de derrota */}
        {gameLost && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
            <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-lg max-w-md">
              <div className="text-lg font-bold mb-2">¡Ronda Perdida!</div>
              <div className="text-sm">
                Enemigos restantes: {activeEnemies.length} | Puntuación: {score}
              </div>
            </div>
          </div>
        )}

        {/* Estadísticas */}
        <div className="text-center mt-4 p-3 bg-blue-50 rounded-lg text-xs text-muted-foreground">
          Precisión: {shotsFired > 0 ? Math.round((enemiesDestroyed / shotsFired) * 100) : 0}% |
          Disparos: {shotsFired} | Posición: {Math.round(playerPosition)}
        </div>
      </CardContent>
    </Card>
  );
};

export default NeuroLinkGame;