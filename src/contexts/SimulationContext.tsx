
import React, { createContext, useContext, useState } from 'react';

interface HandAngles {
  thumb1: number;
  thumb2: number;
  thumb3: number;
  finger1: number;
  finger2: number;
  finger3: number;
}

interface HandData {
  active: boolean;
  angles: HandAngles;
  effort: number;
}

interface SimulationContextType {
  leftHand: HandData;
  rightHand: HandData;
  updateSimulationData: (leftHand: HandData, rightHand: HandData) => void;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [leftHand, setLeftHand] = useState<HandData>({
    active: false,
    angles: {
      thumb1: 45,
      thumb2: 30,
      thumb3: 25,
      finger1: 60,
      finger2: 55,
      finger3: 50
    },
    effort: 75
  });

  const [rightHand, setRightHand] = useState<HandData>({
    active: false,
    angles: {
      thumb1: 35,
      thumb2: 25,
      thumb3: 20,
      finger1: 40,
      finger2: 35,
      finger3: 30
    },
    effort: 45
  });

  const updateSimulationData = (newLeftHand: HandData, newRightHand: HandData) => {
    setLeftHand(newLeftHand);
    setRightHand(newRightHand);
  };

  return (
    <SimulationContext.Provider value={{
      leftHand,
      rightHand,
      updateSimulationData
    }}>
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
};
