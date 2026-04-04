
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface ConfigContextType {
  patientName: string;
  therapistName: string;
  dailyGoal: number;
  setPatientName: (name: string) => void;
  setTherapistName: (name: string) => void;
  setDailyGoal: (minutes: number) => void;
  isAuthenticated: boolean;
  authenticate: (password: string) => boolean;
  logout: () => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [patientName, setPatientNameState] = useState('Paciente');
  const [therapistName, setTherapistNameState] = useState('Dr. García');
  const [dailyGoal, setDailyGoalState] = useState(20);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { user } = useAuth();

  // Cargar datos del localStorage al inicializar
  useEffect(() => {
    try {
      const savedPatientName = localStorage.getItem('patientName');
      const savedTherapistName = localStorage.getItem('therapistName');
      const savedDailyGoal = localStorage.getItem('dailyGoal');
      
      if (savedPatientName) setPatientNameState(savedPatientName);
      if (savedTherapistName) setTherapistNameState(savedTherapistName);
      if (savedDailyGoal) setDailyGoalState(parseInt(savedDailyGoal));
    } catch (error) {
      console.log('Error loading data from localStorage:', error);
    }
  }, []);

  // Sincronizar nombre del usuario autenticado si no hay nombre guardado en localStorage
  useEffect(() => {
    if (user) {
      const savedName = localStorage.getItem('patientName');
      if (!savedName || savedName === 'Paciente') {
        const displayName = user.user_metadata?.display_name 
          || user.user_metadata?.full_name 
          || user.email?.split('@')[0] 
          || 'Paciente';
        setPatientNameState(displayName);
        try { localStorage.setItem('patientName', displayName); } catch {}
      }
    }
  }, [user]);

  const setPatientName = (name: string) => {
    setPatientNameState(name);
    try {
      localStorage.setItem('patientName', name);
    } catch (error) {
      console.log('Error saving to localStorage:', error);
    }
  };

  const setTherapistName = (name: string) => {
    setTherapistNameState(name);
    try {
      localStorage.setItem('therapistName', name);
    } catch (error) {
      console.log('Error saving to localStorage:', error);
    }
  };

  const setDailyGoal = (minutes: number) => {
    setDailyGoalState(minutes);
    try {
      localStorage.setItem('dailyGoal', String(minutes));
    } catch (error) {
      console.log('Error saving to localStorage:', error);
    }
  };

  const authenticate = (password: string) => {
    if (password === '1234') {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  const value = {
    patientName,
    therapistName,
    dailyGoal,
    setPatientName,
    setTherapistName,
    setDailyGoal,
    isAuthenticated,
    authenticate,
    logout
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = (): ConfigContextType => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};
