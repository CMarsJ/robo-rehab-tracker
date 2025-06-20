
import React, { createContext, useContext, useState, useEffect } from 'react';

interface GameConfigContextType {
  orangeJuiceGoal: number;
  setOrangeJuiceGoal: (goal: number) => void;
  calculateOrangeGoalForTime: (minutes: number) => number;
}

const GameConfigContext = createContext<GameConfigContextType | undefined>(undefined);

export const GameConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orangeJuiceGoal, setOrangeJuiceGoalState] = useState(4); // vasos por defecto para 15 min

  useEffect(() => {
    const saved = localStorage.getItem('orangeJuiceGoal');
    if (saved) {
      setOrangeJuiceGoalState(parseInt(saved));
    }
  }, []);

  const setOrangeJuiceGoal = (goal: number) => {
    setOrangeJuiceGoalState(goal);
    localStorage.setItem('orangeJuiceGoal', goal.toString());
  };

  const calculateOrangeGoalForTime = (minutes: number) => {
    // Usar directamente el objetivo configurado para cualquier tiempo
    return orangeJuiceGoal;
  };

  return (
    <GameConfigContext.Provider value={{
      orangeJuiceGoal,
      setOrangeJuiceGoal,
      calculateOrangeGoalForTime
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
