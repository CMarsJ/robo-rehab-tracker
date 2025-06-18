
import React, { createContext, useContext, useState, useEffect } from 'react';

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
  isTherapyActive: boolean;
  setIsTherapyActive: (active: boolean) => void;
  effortHistory: Array<{ time: string; paretica: number; noParetica: number; }>;
  addEffortData: (paretica: number, noParetica: number) => void;
  clearEffortHistory: () => void;
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

  const [isTherapyActive, setIsTherapyActive] = useState(false);
  const [effortHistory, setEffortHistory] = useState<Array<{ time: string; paretica: number; noParetica: number; }>>([]);

  // Cargar datos del localStorage al inicializar
  useEffect(() => {
    const savedLeftHand = localStorage.getItem('leftHandData');
    const savedRightHand = localStorage.getItem('rightHandData');
    const savedEffortHistory = localStorage.getItem('effortHistory');
    
    if (savedLeftHand) {
      try {
        setLeftHand(JSON.parse(savedLeftHand));
      } catch (e) {
        console.error('Error loading left hand data:', e);
      }
    }
    
    if (savedRightHand) {
      try {
        setRightHand(JSON.parse(savedRightHand));
      } catch (e) {
        console.error('Error loading right hand data:', e);
      }
    }

    if (savedEffortHistory) {
      try {
        setEffortHistory(JSON.parse(savedEffortHistory));
      } catch (e) {
        console.error('Error loading effort history:', e);
      }
    }
  }, []);

  const updateSimulationData = (newLeftHand: HandData, newRightHand: HandData) => {
    setLeftHand(newLeftHand);
    setRightHand(newRightHand);
    
    // Guardar en localStorage
    localStorage.setItem('leftHandData', JSON.stringify(newLeftHand));
    localStorage.setItem('rightHandData', JSON.stringify(newRightHand));
    
    console.log('Datos simulados actualizados:', {
      leftHand: newLeftHand,
      rightHand: newRightHand
    });
  };

  const addEffortData = (paretica: number, noParetica: number) => {
    const now = new Date();
    const timeString = `${now.getMinutes()}:${now.getSeconds().toString().padStart(2, '0')}`;
    
    const newData = { time: timeString, paretica, noParetica };
    
    setEffortHistory(prev => {
      const updated = [...prev, newData];
      // Mantener solo los últimos 10 puntos de datos
      const trimmed = updated.slice(-10);
      localStorage.setItem('effortHistory', JSON.stringify(trimmed));
      return trimmed;
    });
  };

  const clearEffortHistory = () => {
    setEffortHistory([]);
    localStorage.removeItem('effortHistory');
  };

  return (
    <SimulationContext.Provider value={{
      leftHand,
      rightHand,
      updateSimulationData,
      isTherapyActive,
      setIsTherapyActive,
      effortHistory,
      addEffortData,
      clearEffortHistory
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
