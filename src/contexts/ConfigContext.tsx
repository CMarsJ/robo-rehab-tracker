
import React, { createContext, useContext, useState, useEffect } from 'react';

interface ConfigContextType {
  patientName: string;
  therapistName: string;
  setPatientName: (name: string) => void;
  setTherapistName: (name: string) => void;
  isAuthenticated: boolean;
  authenticate: (password: string) => boolean;
  logout: () => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [patientName, setPatientNameState] = useState('Paciente');
  const [therapistName, setTherapistNameState] = useState('Dr. García');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Cargar datos del localStorage al inicializar
  useEffect(() => {
    try {
      const savedPatientName = localStorage.getItem('patientName');
      const savedTherapistName = localStorage.getItem('therapistName');
      
      if (savedPatientName) setPatientNameState(savedPatientName);
      if (savedTherapistName) setTherapistNameState(savedTherapistName);
    } catch (error) {
      console.log('Error loading data from localStorage:', error);
    }
  }, []);

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
    setPatientName,
    setTherapistName,
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
