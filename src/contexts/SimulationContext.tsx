import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
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

// Throttle interval for UI updates (ms) — BLE data is still logged at full rate
const UI_UPDATE_INTERVAL_MS = 50; // 20 FPS max for UI
const LOCALSTORAGE_FLUSH_MS = 2000; // Flush to localStorage every 2s

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
  
  // Registro de datos BLE — array mutado in-place, state snapshot throttled
  const bleDataLogRef = useRef<BLEDataRecord[]>([]);
  const [bleDataLog, setBleDataLog] = useState<BLEDataRecord[]>([]);
  const logFlushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Throttle refs for UI updates
  const lastUiUpdateRef = useRef<number>(0);
  const pendingUiDataRef = useRef<{ left: HandData; right: HandData } | null>(null);
  const rafIdRef = useRef<number>(0);

  // localStorage flush refs
  const lastLsFlushRef = useRef<number>(0);
  const pendingLsDataRef = useRef<{ left: HandData; right: HandData } | null>(null);

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

  // Log BLE data record — ALL packets logged, no deduplication
  const addBleDataRecord = useCallback((left: HandData, right: HandData, deviceRawTimestamp?: string | number, arrivalMs?: number, arrivalPerfMs?: number) => {
    const nowMs = arrivalMs ?? Date.now();
    const nowPerf = arrivalPerfMs ?? parseFloat(performance.now().toFixed(3));
    const nowIso = new Date(nowMs).toISOString();
    const record: BLEDataRecord = {
      timestamp: nowIso,
      receivedAt: nowIso,
      receivedAtMs: nowMs,
      receivedAtPerfMs: nowPerf,
      deviceRawTimestamp,
      leftHand: roundHandData(left),
      rightHand: roundHandData(right),
    };
    // Mutate in place — no spread, O(1) push
    bleDataLogRef.current.push(record);

    // Throttle state snapshot for log consumers (every 500ms max)
    if (!logFlushTimerRef.current) {
      logFlushTimerRef.current = setTimeout(() => {
        setBleDataLog([...bleDataLogRef.current]);
        logFlushTimerRef.current = null;
      }, 500);
    }
  }, []);

  const clearBleDataLog = useCallback(() => {
    bleDataLogRef.current = [];
    setBleDataLog([]);
    if (logFlushTimerRef.current) {
      clearTimeout(logFlushTimerRef.current);
      logFlushTimerRef.current = null;
    }
  }, []);

  const getBleDataLog = useCallback((): BLEDataRecord[] => {
    return bleDataLogRef.current;
  }, []);

  // Throttled UI update — called via rAF
  const flushUiUpdate = useCallback(() => {
    const pending = pendingUiDataRef.current;
    if (pending) {
      setLeftHand(pending.left);
      setRightHand(pending.right);
      pendingUiDataRef.current = null;
    }
  }, []);

  // Throttled localStorage write
  const flushLocalStorage = useCallback(() => {
    const pending = pendingLsDataRef.current;
    if (pending) {
      localStorage.setItem('leftHandData', JSON.stringify(pending.left));
      localStorage.setItem('rightHandData', JSON.stringify(pending.right));
      pendingLsDataRef.current = null;
    }
  }, []);

  // BLE Connection Effect
  useEffect(() => {
    bleService.onData((data) => {
      const parsedLeft = parseHandData(data?.leftHand);
      const parsedRight = parseHandData(data?.rightHand);
      
      if (!parsedLeft || !parsedRight) return;

      setIsReceivingRealData(true);

      // 1. Always log the record at full rate (no dedup, no throttle)
      addBleDataRecord(parsedLeft, parsedRight, data?.deviceRawTimestamp, data._arrivalMs, data._arrivalPerfMs);

      // 2. Throttle UI state updates
      const now = performance.now();
      pendingUiDataRef.current = { left: parsedLeft, right: parsedRight };
      if (now - lastUiUpdateRef.current >= UI_UPDATE_INTERVAL_MS) {
        lastUiUpdateRef.current = now;
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = requestAnimationFrame(flushUiUpdate);
      }

      // 3. Throttle localStorage writes
      pendingLsDataRef.current = { left: parsedLeft, right: parsedRight };
      if (now - lastLsFlushRef.current >= LOCALSTORAGE_FLUSH_MS) {
        lastLsFlushRef.current = now;
        flushLocalStorage();
      }
    });

    bleService.onStatus((status, message) => {
      setBleStatus(status);
      setBleMessage(message || '');
    });

    bleService.onEmergency((emergency) => {
      setIsEmergency(emergency);
    });

    // Check de datos reales cada 10 segundos
    const checkInterval = setInterval(() => {
      const receiving = bleService.isReceivingData();
      setIsReceivingRealData(receiving);
    }, 10000);

    return () => {
      clearInterval(checkInterval);
      cancelAnimationFrame(rafIdRef.current);
      if (logFlushTimerRef.current) clearTimeout(logFlushTimerRef.current);
      bleService.disconnect();
      // Final flush of pending localStorage
      flushLocalStorage();
    };
  }, [addBleDataRecord, flushUiUpdate, flushLocalStorage]);

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
