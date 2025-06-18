
import React from 'react';
import { useTranslation } from '@/contexts/AppContext';
import HandMonitoring from '@/components/HandMonitoring';
import TherapyTimer from '@/components/TherapyTimer';
import ProgressTracker from '@/components/ProgressTracker';
import EffortChart from '@/components/EffortChart';
import PatientAnalysis from '@/components/PatientAnalysis';

const Index = () => {
  const t = useTranslation();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">{t.monitoringSystem}</h1>
        <p className="text-muted-foreground">{t.rehabilitation}</p>
      </div>

      {/* Título de monitoreo en tiempo real */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-primary mb-6">{t.realTimeMonitoring}</h2>
      </div>

      {/* Monitoreo de manos */}
      <HandMonitoring />

      {/* Sección media: Temporizador y Progreso */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TherapyTimer />
        <ProgressTracker />
      </div>

      {/* Gráfico de esfuerzo muscular */}
      <EffortChart />

      {/* Análisis del paciente */}
      <PatientAnalysis />
    </div>
  );
};

export default Index;
