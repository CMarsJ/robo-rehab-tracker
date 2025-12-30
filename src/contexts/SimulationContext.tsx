import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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

// Registro de cambios MQTT con timestamp
export interface MQTTDataRecord {
  timestamp: string;
  leftHand: HandData;
  rightHand: HandData;
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
  // Nuevo: registro de datos MQTT
  mqttDataLog: MQTTDataRecord[];
  clearMqttDataLog: () => void;
  getMqttDataLog: () => MQTTDataRecord[];
}

// Función helper para limitar decimales a 4 dígitos
const roundTo4Decimals = (value: number): number => {
  return Math.round(value * 10000) / 10000;
};

// Función para redondear ángulos de mano
const roundHandAngles = (angles: HandAngles): HandAngles => ({
  thumb1: roundTo4Decimals(angles.thumb1),
  thumb2: roundTo4Decimals(angles.thumb2),
  thumb3: roundTo4Decimals(angles.thumb3),
  finger1: roundTo4Decimals(angles.finger1),
  finger2: roundTo4Decimals(angles.finger2),
  finger3: roundTo4Decimals(angles.finger3),
});

// Función para redondear datos de mano completos
const roundHandData = (hand: HandData): HandData => ({
  active: hand.active,
  angles: roundHandAngles(hand.angles),
  effort: roundTo4Decimals(hand.effort),
});

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
  
  // Registro de datos MQTT con timestamps
  const mqttDataLogRef = useRef<MQTTDataRecord[]>([]);
  const [mqttDataLog, setMqttDataLog] = useState<MQTTDataRecord[]>([]);
  const lastDataRef = useRef<string>('');

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
    
    return roundHandData({
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
    });
  };

  // Función para registrar datos MQTT con timestamp
  const addMqttDataRecord = (left: HandData, right: HandData) => {
    // Crear hash simple para detectar cambios
    const dataHash = JSON.stringify({ left, right });
    
    // Solo registrar si los datos cambiaron
    if (dataHash !== lastDataRef.current) {
      lastDataRef.current = dataHash;
      
      const record: MQTTDataRecord = {
        timestamp: new Date().toISOString(),
        leftHand: roundHandData(left),
        rightHand: roundHandData(right),
      };
      
      mqttDataLogRef.current = [...mqttDataLogRef.current, record];
      setMqttDataLog([...mqttDataLogRef.current]);
      
      console.log('📝 MQTT data logged:', record.timestamp);
    }
  };

  // Limpiar registro de datos MQTT
  const clearMqttDataLog = () => {
    mqttDataLogRef.current = [];
    setMqttDataLog([]);
    lastDataRef.current = '';
    console.log('🗑️ MQTT data log cleared');
  };

  // Obtener registro de datos MQTT
  const getMqttDataLog = (): MQTTDataRecord[] => {
    return mqttDataLogRef.current;
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
        
        // Registrar datos MQTT con timestamp cuando hay terapia activa
        addMqttDataRecord(parsedLeft, parsedRight);
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
        const randomLeftHand: HandData = roundHandData({
          active: Math.random() > 0.3,
          angles: {
            thumb1: Math.floor(Math.random() * 90),
            thumb2: Math.floor(Math.random() * 90),
            thumb3: Math.floor(Math.random() * 90),
            finger1: Math.floor(Math.random() * 90),
            finger2: Math.floor(Math.random() * 90),
            finger3: Math.floor(Math.random() * 90)
          },
          effort: Math.floor(Math.random() * 100)
        });

        const randomRightHand: HandData = roundHandData({
          active: Math.random() > 0.3,
          angles: {
            thumb1: Math.floor(Math.random() * 90),
            thumb2: Math.floor(Math.random() * 90),
            thumb3: Math.floor(Math.random() * 90),
            finger1: Math.floor(Math.random() * 90),
            finger2: Math.floor(Math.random() * 90),
            finger3: Math.floor(Math.random() * 90)
          },
          effort: Math.floor(Math.random() * 100)
        });

        updateSimulationData(randomLeftHand, randomRightHand);
      }, 30000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoMode, enableSimulator, isReceivingRealData]);

  const updateSimulationData = (newLeftHand: HandData, newRightHand: HandData) => {
    const roundedLeft = roundHandData(newLeftHand);
    const roundedRight = roundHandData(newRightHand);
    
    setLeftHand(roundedLeft);
    setRightHand(roundedRight);
    
    // Guardar en localStorage
    localStorage.setItem('leftHandData', JSON.stringify(roundedLeft));
    localStorage.setItem('rightHandData', JSON.stringify(roundedRight));
    
    console.log('Datos simulados actualizados:', {
      leftHand: roundedLeft,
      rightHand: roundedRight
    });
  };

  const addEffortData = (paretica: number, noParetica: number) => {
    const now = new Date();
    const timeString = `${now.getMinutes()}:${now.getSeconds().toString().padStart(2, '0')}`;
    
    const newData = { 
      time: timeString, 
      paretica: roundTo4Decimals(paretica), 
      noParetica: roundTo4Decimals(noParetica) 
    };
    
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
      setEnableSimulator,
      mqttDataLog,
      clearMqttDataLog,
      getMqttDataLog
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
