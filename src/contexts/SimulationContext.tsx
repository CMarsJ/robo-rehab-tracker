import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { bleService } from '@/services/bleService';

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

// Registro de cambios BLE con timestamp
export interface BLEDataRecord {
  timestamp: string;               // ISO string del momento de llegada (compatibilidad)
  receivedAt: string;              // ISO string del momento de llegada
  receivedAtMs: number;            // Epoch en milisegundos (Date.now())
  receivedAtPerfMs: number;        // performance.now() con precisión de microsegundos
  deviceRawTimestamp?: string | number; // Valor original del timestamp del ESP
  leftHand: HandData;
  rightHand: HandData;
}

// Mantener export del alias para compatibilidad
export type MQTTDataRecord = BLEDataRecord;

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
  bleStatus: 'connected' | 'disconnected' | 'error';
  bleMessage: string;
  isReceivingRealData: boolean;
  enableSimulator: boolean;
  setEnableSimulator: (enabled: boolean) => void;
  isEmergency: boolean;
  // Registro de datos BLE
  bleDataLog: BLEDataRecord[];
  clearBleDataLog: () => void;
  getBleDataLog: () => BLEDataRecord[];
  // Aliases para compatibilidad
  mqttStatus: 'connected' | 'disconnected' | 'error';
  mqttMessage: string;
  mqttDataLog: BLEDataRecord[];
  clearMqttDataLog: () => void;
  getMqttDataLog: () => BLEDataRecord[];
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
    angles: { thumb1: 45, thumb2: 30, thumb3: 25, finger1: 60, finger2: 55, finger3: 50 },
    effort: 75
  });

  const [rightHand, setRightHand] = useState<HandData>({
    active: false,
    angles: { thumb1: 35, thumb2: 25, thumb3: 20, finger1: 40, finger2: 35, finger3: 30 },
    effort: 45
  });

  const [isTherapyActive, setIsTherapyActive] = useState(false);
  const [effortHistory, setEffortHistory] = useState<Array<{ time: string; paretica: number; noParetica: number; }>>([]);
  const [autoMode, setAutoMode] = useState(false);
  const [bleStatus, setBleStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const [bleMessage, setBleMessage] = useState('No conectado');
  const [isReceivingRealData, setIsReceivingRealData] = useState(false);
  const [enableSimulator, setEnableSimulator] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  
  // Registro de datos BLE con timestamps
  const bleDataLogRef = useRef<BLEDataRecord[]>([]);
  const [bleDataLog, setBleDataLog] = useState<BLEDataRecord[]>([]);
  const lastDataRef = useRef<string>('');

  // Cargar datos del localStorage al inicializar
  useEffect(() => {
    const savedLeftHand = localStorage.getItem('leftHandData');
    const savedRightHand = localStorage.getItem('rightHandData');
    const savedEffortHistory = localStorage.getItem('effortHistory');
    
    if (savedLeftHand) {
      try { setLeftHand(JSON.parse(savedLeftHand)); } catch (e) { console.error('Error loading left hand data:', e); }
    }
    if (savedRightHand) {
      try { setRightHand(JSON.parse(savedRightHand)); } catch (e) { console.error('Error loading right hand data:', e); }
    }
    if (savedEffortHistory) {
      try { setEffortHistory(JSON.parse(savedEffortHistory)); } catch (e) { console.error('Error loading effort history:', e); }
    }
  }, []);

  // Helper to validate and transform BLE hand data
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

  // Función para registrar datos BLE con timestamp
  const addBleDataRecord = (left: HandData, right: HandData, deviceRawTimestamp?: string | number) => {
    const dataHash = JSON.stringify({ left, right });
    if (dataHash !== lastDataRef.current) {
      lastDataRef.current = dataHash;
      const nowMs = Date.now();
      const nowPerf = performance.now();
      const nowIso = new Date(nowMs).toISOString();
      const record: BLEDataRecord = {
        timestamp: nowIso,
        receivedAt: nowIso,
        receivedAtMs: nowMs,
        receivedAtPerfMs: parseFloat(nowPerf.toFixed(3)),
        deviceRawTimestamp: deviceRawTimestamp,
        leftHand: roundHandData(left),
        rightHand: roundHandData(right),
      };
      bleDataLogRef.current = [...bleDataLogRef.current, record];
      setBleDataLog([...bleDataLogRef.current]);
      console.log('📝 BLE data logged | device:', deviceRawTimestamp, '| received:', nowMs);
    }
  };

  const clearBleDataLog = () => {
    bleDataLogRef.current = [];
    setBleDataLog([]);
    lastDataRef.current = '';
    console.log('🗑️ BLE data log cleared');
  };

  const getBleDataLog = (): BLEDataRecord[] => {
    return bleDataLogRef.current;
  };

  // BLE Connection Effect
  useEffect(() => {
    bleService.onData((data) => {
      console.log('📊 Real data received from BLE:', data);
      const parsedLeft = parseHandData(data?.leftHand);
      const parsedRight = parseHandData(data?.rightHand);
      
      if (parsedLeft && parsedRight) {
        setIsReceivingRealData(true);
        updateSimulationData(parsedLeft, parsedRight);
        addBleDataRecord(parsedLeft, parsedRight, data?.deviceRawTimestamp);
      } else {
        console.warn('⚠️ Invalid BLE data format, ignoring:', data);
      }
    });

    bleService.onStatus((status, message) => {
      console.log(`📡 BLE Status: ${status} - ${message}`);
      setBleStatus(status);
      setBleMessage(message || '');
    });

    bleService.onEmergency((emergency) => {
      console.log('🚨 Emergency callback received:', emergency);
      setIsEmergency(emergency);
      if (emergency) {
        console.warn('🚨 EMERGENCY STATE ACTIVE');
      } else {
        console.log('✅ Emergency state cleared');
      }
    });

    // Check de datos reales cada 10 segundos
    const checkInterval = setInterval(() => {
      const receiving = bleService.isReceivingData();
      setIsReceivingRealData(receiving);
      if (!receiving && bleService.isConnected()) {
        console.log('⚠️ Connected but not receiving data');
      }
    }, 10000);

    return () => {
      clearInterval(checkInterval);
      bleService.disconnect();
    };
  }, []);

  // Auto mode effect - solo si no hay datos reales y el simulador está habilitado
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
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
    return () => { if (interval) clearInterval(interval); };
  }, [autoMode, enableSimulator, isReceivingRealData]);

  const updateSimulationData = (newLeftHand: HandData, newRightHand: HandData) => {
    const roundedLeft = roundHandData(newLeftHand);
    const roundedRight = roundHandData(newRightHand);
    setLeftHand(roundedLeft);
    setRightHand(roundedRight);
    localStorage.setItem('leftHandData', JSON.stringify(roundedLeft));
    localStorage.setItem('rightHandData', JSON.stringify(roundedRight));
  };

  const addEffortData = (paretica: number, noParetica: number) => {
    const now = new Date();
    const timeString = `${now.getMinutes()}:${now.getSeconds().toString().padStart(2, '0')}`;
    const newData = { time: timeString, paretica: roundTo4Decimals(paretica), noParetica: roundTo4Decimals(noParetica) };
    setEffortHistory(prev => {
      const updated = [...prev, newData];
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
      bleStatus,
      bleMessage,
      isReceivingRealData,
      enableSimulator,
      setEnableSimulator,
      isEmergency,
      bleDataLog,
      clearBleDataLog,
      getBleDataLog,
      // Aliases para compatibilidad con código existente
      mqttStatus: bleStatus,
      mqttMessage: bleMessage,
      mqttDataLog: bleDataLog,
      clearMqttDataLog: clearBleDataLog,
      getMqttDataLog: getBleDataLog,
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
