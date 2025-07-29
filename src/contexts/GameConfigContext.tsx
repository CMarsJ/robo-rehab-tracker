
import React, { createContext, useContext, useState, useEffect } from 'react';

interface GameConfigContextType {
  orangeJuiceGoal: number;
  setOrangeJuiceGoal: (goal: number) => void;
  calculateOrangeGoalForTime: (minutes: number) => number;
  enemySpeed: number;
  shotSpeed: number;
  setEnemySpeed: (speed: number) => void;
  setShotSpeed: (speed: number) => void;
}

const GameConfigContext = createContext<GameConfigContextType | undefined>(undefined);

export const GameConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orangeJuiceGoal, setOrangeJuiceGoalState] = useState(1); // mínimo 1 vaso
  const [enemySpeed, setEnemySpeedState] = useState(3);
  const [shotSpeed, setShotSpeedState] = useState(3);

  useEffect(() => {
    const saved = localStorage.getItem('orangeJuiceGoal');
    if (saved) {
      const goal = parseInt(saved);
      setOrangeJuiceGoalState(Math.max(1, goal)); // Asegurar mínimo 1
    }

    const savedEnemySpeed = localStorage.getItem('enemySpeed');
    if (savedEnemySpeed) {
      const speed = parseInt(savedEnemySpeed);
      setEnemySpeedState(Math.max(1, Math.min(5, speed)));
    }

    const savedShotSpeed = localStorage.getItem('shotSpeed');
    if (savedShotSpeed) {
      const speed = parseInt(savedShotSpeed);
      setShotSpeedState(Math.max(1, Math.min(5, speed)));
    }
  }, []);

  const setOrangeJuiceGoal = (goal: number) => {
    const validGoal = Math.max(1, goal); // Asegurar mínimo 1
    setOrangeJuiceGoalState(validGoal);
    localStorage.setItem('orangeJuiceGoal', validGoal.toString());
  };

  const setEnemySpeed = (speed: number) => {
    const validSpeed = Math.max(1, Math.min(5, speed));
    setEnemySpeedState(validSpeed);
    localStorage.setItem('enemySpeed', validSpeed.toString());
  };

  const setShotSpeed = (speed: number) => {
    const validSpeed = Math.max(1, Math.min(5, speed));
    setShotSpeedState(validSpeed);
    localStorage.setItem('shotSpeed', validSpeed.toString());
  };

  const calculateOrangeGoalForTime = (minutes: number) => {
    // Siempre retornar mínimo 1 vaso, sin importar los minutos
    return Math.max(1, orangeJuiceGoal);
  };

  return (
    <GameConfigContext.Provider value={{
      orangeJuiceGoal,
      setOrangeJuiceGoal,
      calculateOrangeGoalForTime,
      enemySpeed,
      shotSpeed,
      setEnemySpeed,
      setShotSpeed
    }}>
      {children}
    </GameConfigContext.Provider>
  );
};

export const useGameConfig = () => {
  const context = useContext(GameConfigContext);
  if (!context) {
    throw new Error('useGameConfig must be used within a GameConfigProvider');
  }
  return context;
};
