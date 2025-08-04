import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { supabase } from '@/lib/supabaseClient';

type Enemy = {
  x: number;
  y: number;
  destroyed: boolean;
};

type Bullet = {
  x: number;
  y: number;
};

const ENEMY_WIDTH = 50;
const ENEMY_HEIGHT = 50;
const BULLET_WIDTH = 5;
const BULLET_HEIGHT = 10;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_WIDTH = 60;
const PLAYER_HEIGHT = 20;
const ENEMY_SPEED = 1;
const BULLET_SPEED = 4;
const PLAYER_Y = CANVAS_HEIGHT - 40;

const generateEnemies = (wave: number): Enemy[] => {
  const enemies: Enemy[] = [];
  const rows = Math.min(3 + wave, 6);
  const cols = 6;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = 100 + col * (ENEMY_WIDTH + 20);
      const y = 50 + row * (ENEMY_HEIGHT + 20);
      const overlap = enemies.some(e =>
        Math.abs(e.x - x) < ENEMY_WIDTH && Math.abs(e.y - y) < ENEMY_HEIGHT
      );
      if (!overlap) {
        enemies.push({ x, y, destroyed: false });
      }
    }
  }

  return enemies;
};

const NeuroLinkGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const user = useUser();

  const [playerX, setPlayerX] = useState(CANVAS_WIDTH / 2);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>(generateEnemies(1));
  const [gameActive, setGameActive] = useState(false);
  const [gameStartTime, setGameStartTime] = useState<Date | null>(null);
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [extraWaves, setExtraWaves] = useState(0);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameActive) return;

      if (e.key === 'ArrowLeft') {
        setPlayerX(prev => Math.max(0, prev - 20));
      } else if (e.key === 'ArrowRight') {
        setPlayerX(prev => Math.min(CANVAS_WIDTH - PLAYER_WIDTH, prev + 20));
      } else if (e.key === ' ') {
        setBullets(prev => [...prev, { x: playerX + PLAYER_WIDTH / 2 - 2, y: PLAYER_Y }]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerX, gameActive]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!gameActive) return;

      // Actualizar posición de enemigos
      setEnemies(prev =>
        prev.map(enemy =>
          enemy.destroyed ? enemy : { ...enemy, y: enemy.y + ENEMY_SPEED }
        )
      );

      // Actualizar posición de balas
      setBullets(prev => prev.map(b => ({ ...b, y: b.y - BULLET_SPEED })).filter(b => b.y > 0));

      // Colisiones
      setEnemies(prevEnemies => {
        const updatedEnemies = prevEnemies.map(enemy => {
          if (enemy.destroyed) return enemy;
          let bulletHit = false;

          for (const bullet of bullets) {
            const hit =
              bullet.x < enemy.x + ENEMY_WIDTH &&
              bullet.x + BULLET_WIDTH > enemy.x &&
              bullet.y < enemy.y + ENEMY_HEIGHT &&
              bullet.y + BULLET_HEIGHT > enemy.y;

            if (hit) {
              bulletHit = true;
              break;
            }
          }

          if (bulletHit) {
            setScore(prev => prev + 1);
            return { ...enemy, destroyed: true };
          }

          return enemy;
        });

        // Eliminar balas que impactaron
        setBullets(prevBullets =>
          prevBullets.filter(bullet => {
            return !updatedEnemies.some(enemy =>
              !enemy.destroyed &&
              bullet.x < enemy.x + ENEMY_WIDTH &&
              bullet.x + BULLET_WIDTH > enemy.x &&
              bullet.y < enemy.y + ENEMY_HEIGHT &&
              bullet.y + BULLET_HEIGHT > enemy.y
            );
          })
        );

        return updatedEnemies;
      });
    }, 1000 / 60);

    return () => clearInterval(interval);
  }, [bullets, gameActive]);

  useEffect(() => {
    if (!gameActive) return;

    const allDestroyed = enemies.every(e => e.destroyed);
    if (allDestroyed) {
      const newWave = wave + 1;
      setWave(newWave);
      setExtraWaves(prev => prev + 1);
      setEnemies(generateEnemies(newWave));
    }
  }, [enemies, gameActive]);

  useEffect(() => {
    if (!gameActive) return;

    const enemiesReachedPlayer = enemies.some(enemy => !enemy.destroyed && enemy.y >= PLAYER_Y);
    if (enemiesReachedPlayer) {
      const remainingEnemies = enemies.filter(e => !e.destroyed);
      const penalty = remainingEnemies.length;

      setScore(prev => Math.max(0, prev - penalty));
      saveGameData(true);

      const nextWave = wave + 1;
      setWave(nextWave);
      setEnemies(generateEnemies(nextWave));
    }
  }, [enemies, gameActive]);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Dibujar jugador
    ctx.fillStyle = 'blue';
    ctx.fillRect(playerX, PLAYER_Y, PLAYER_WIDTH, PLAYER_HEIGHT);

    // Dibujar balas
    ctx.fillStyle = 'black';
    bullets.forEach(b => ctx.fillRect(b.x, b.y, BULLET_WIDTH, BULLET_HEIGHT));

    // Dibujar enemigos
    enemies.forEach(enemy => {
      if (!enemy.destroyed) {
        ctx.fillStyle = 'red';
        ctx.fillRect(enemy.x, enemy.y, ENEMY_WIDTH, ENEMY_HEIGHT);
      }
    });

    // Dibujar puntaje
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText(`Puntaje: ${score}`, 10, 30);
    ctx.fillText(`Ronda: ${wave}`, 10, 60);
  }, [playerX, bullets, enemies, score, wave]);

  const startGame = () => {
    setPlayerX(CANVAS_WIDTH / 2);
    setBullets([]);
    setEnemies(generateEnemies(1));
    setScore(0);
    setWave(1);
    setExtraWaves(0);
    setGameActive(true);
    setGameStartTime(new Date());
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-2xl font-bold">Neuro Link</h2>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border border-black"
      />
      {!gameActive && (
        <button onClick={startGame} className="bg-blue-500 text-white px-4 py-2 rounded">
          Iniciar Juego
        </button>
      )}
    </div>
  );
};

export default NeuroLinkGame;