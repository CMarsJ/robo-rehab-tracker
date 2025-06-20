
import React, { createContext, useContext, useState, useEffect } from 'react';

interface GameConfigContextType {
  orangeJuiceGoal: number;
  setOrangeJuiceGoal: (goal: number) => void;
  calculateOrangeGoalForTime: (minutes: number) => number;
}

const GameConfigContext = createContext<GameConfigContextType | undefined>(undefined);

export const GameConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orangeJuiceGoal, setOrangeJuiceGoalState] = useState(1); // mínimo 1 vaso

  useEffect(() => {
    const saved = localStorage.getItem('orangeJuiceGoal');
    if (saved) {
      const goal = parseInt(saved);
      setOrangeJuiceGoalState(Math.max(1, goal)); // Asegurar mínimo 1
    }
  }, []);

  const setOrangeJuiceGoal = (goal: number) => {
    const validGoal = Math.max(1, goal); // Asegurar mínimo 1
    setOrangeJuiceGoalState(validGoal);
    localStorage.setItem('orangeJuiceGoal', validGoal.toString());
  };

  const calculateOrangeGoalForTime = (minutes: number) => {
    // Siempre retornar mínimo 1 vaso, sin importar los minutos
    return Math.max(1, orangeJuiceGoal);
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
