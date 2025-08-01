
import React, { createContext, useContext, useState, useEffect } from 'react';

interface GameConfigContextType {
  orangeJuiceGoal: number;
  setOrangeJuiceGoal: (goal: number) => void;
  calculateOrangeGoalForTime: (minutes: number) => number;
  enemySpeed: number;
  shotSpeed: number;
  setEnemySpeed: (speed: number) => void;
  setShotSpeed: (speed: number) => void;
  baseEnemyCount: number;
  setBaseEnemyCount: (count: number) => void;
  darkMode: boolean;
  setDarkMode: (mode: boolean) => void;
}

const GameConfigContext = createContext<GameConfigContextType | undefined>(undefined);

export const GameConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orangeJuiceGoal, setOrangeJuiceGoalState] = useState(1); // mínimo 1 vaso
  const [enemySpeed, setEnemySpeedState] = useState(3);
  const [shotSpeed, setShotSpeedState] = useState(3);
  const [baseEnemyCount, setBaseEnemyCountState] = useState(6);
  const [darkMode, setDarkModeState] = useState(false);

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

    const savedBaseEnemyCount = localStorage.getItem('baseEnemyCount');
    if (savedBaseEnemyCount) {
      const count = parseInt(savedBaseEnemyCount);
      setBaseEnemyCountState(Math.max(3, Math.min(12, count)));
    }

    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      setDarkModeState(savedDarkMode === 'true');
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

  const setBaseEnemyCount = (count: number) => {
    const validCount = Math.max(3, Math.min(12, count));
    setBaseEnemyCountState(validCount);
    localStorage.setItem('baseEnemyCount', validCount.toString());
  };

  const setDarkMode = (mode: boolean) => {
    setDarkModeState(mode);
    localStorage.setItem('darkMode', mode.toString());
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
      setShotSpeed,
      baseEnemyCount,
      setBaseEnemyCount,
      darkMode,
      setDarkMode
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
