import React, { createContext, useContext, useState, useEffect } from 'react';
import { mqttService } from '@/services/mqttService';

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
  autoMode: boolean;
  setAutoMode: (active: boolean) => void;
  mqttStatus: 'connected' | 'disconnected' | 'error';
  mqttMessage: string;
  isReceivingRealData: boolean;
  enableSimulator: boolean;
  setEnableSimulator: (enabled: boolean) => void;
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
  const [autoMode, setAutoMode] = useState(false);
  const [mqttStatus, setMqttStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const [mqttMessage, setMqttMessage] = useState('No conectado');
  const [isReceivingRealData, setIsReceivingRealData] = useState(false);
  const [enableSimulator, setEnableSimulator] = useState(false);

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

  // Helper to validate and transform MQTT hand data
  const parseHandData = (hand: any): HandData | null => {
    if (!hand || typeof hand !== 'object') return null;
    
    return {
      active: Boolean(hand.active),
      angles: {
        thumb1: Number(hand.angles?.thumb1) || 0,
        thumb2: Number(hand.angles?.thumb2) || 0,
        thumb3: Number(hand.angles?.thumb3) || 0,
        finger1: Number(hand.angles?.finger1) || 0,
        finger2: Number(hand.angles?.finger2) || 0,
        finger3: Number(hand.angles?.finger3) || 0,
      },
      effort: Number(hand.effort) || 0,
    };
  };

  // MQTT Connection Effect
  useEffect(() => {
    // Configurar callbacks de MQTT
    mqttService.onData((data) => {
      console.log('📊 Real data received from MQTT:', data);
      
      const parsedLeft = parseHandData(data?.leftHand);
      const parsedRight = parseHandData(data?.rightHand);
      
      if (parsedLeft && parsedRight) {
        setIsReceivingRealData(true);
        updateSimulationData(parsedLeft, parsedRight);
      } else {
        console.warn('⚠️ Invalid MQTT data format, ignoring:', data);
      }
    });

    mqttService.onStatus((status, message) => {
      console.log(`📡 MQTT Status: ${status} - ${message}`);
      setMqttStatus(status);
      setMqttMessage(message || '');
    });

    // Intentar conectar con credenciales guardadas
    const savedUsername = localStorage.getItem('mqtt_username');
    const savedPassword = localStorage.getItem('mqtt_password');
    const savedTopic = localStorage.getItem('mqtt_topic') || 'rehab/hand-data';

    if (savedUsername && savedPassword) {
      console.log('🔄 Connecting with saved credentials...');
      mqttService.connect(savedUsername, savedPassword, savedTopic);
    }

    // Check de datos reales cada 10 segundos
    const checkInterval = setInterval(() => {
      const receiving = mqttService.isReceivingData();
      setIsReceivingRealData(receiving);
      
      if (!receiving && mqttService.isConnected()) {
        console.log('⚠️ Connected but not receiving data');
      }
    }, 10000);

    return () => {
      clearInterval(checkInterval);
      mqttService.disconnect();
    };
  }, []);

  // Auto mode effect - solo si no hay datos reales y el simulador está habilitado
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (autoMode && enableSimulator && !isReceivingRealData) {
      interval = setInterval(() => {
        const randomLeftHand: HandData = {
          active: Math.random() > 0.3, // 70% chance of being active
          angles: {
            thumb1: Math.floor(Math.random() * 90),
            thumb2: Math.floor(Math.random() * 90),
            thumb3: Math.floor(Math.random() * 90),
            finger1: Math.floor(Math.random() * 90),
            finger2: Math.floor(Math.random() * 90),
            finger3: Math.floor(Math.random() * 90)
          },
          effort: Math.floor(Math.random() * 100)
        };

        const randomRightHand: HandData = {
          active: Math.random() > 0.3, // 70% chance of being active
          angles: {
            thumb1: Math.floor(Math.random() * 90),
            thumb2: Math.floor(Math.random() * 90),
            thumb3: Math.floor(Math.random() * 90),
            finger1: Math.floor(Math.random() * 90),
            finger2: Math.floor(Math.random() * 90),
            finger3: Math.floor(Math.random() * 90)
          },
          effort: Math.floor(Math.random() * 100)
        };

        updateSimulationData(randomLeftHand, randomRightHand);
      }, 30000); // 30 segundos
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoMode, enableSimulator, isReceivingRealData]);

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
      clearEffortHistory,
      autoMode,
      setAutoMode,
      mqttStatus,
      mqttMessage,
      isReceivingRealData,
      enableSimulator,
      setEnableSimulator
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
