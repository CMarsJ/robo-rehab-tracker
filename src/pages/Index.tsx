
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/contexts/AppContext';
import { useSimulation } from '@/contexts/SimulationContext';
import { useAuth } from '@/contexts/AuthContext';
import HandMonitoring from '@/components/HandMonitoring';
import TherapyTimer from '@/components/TherapyTimer';
import ProgressTracker from '@/components/ProgressTracker';
import GameRankings from '@/components/GameRankings';

const Index = () => {
  const t = useTranslation();
  const { isTherapyActive } = useSimulation();
  const { user, loading } = useAuth();
  const [dayCompleted, setDayCompleted] = useState(false);

  // Redirect if not authenticated
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-2xl font-semibold mb-2">Cargando...</div>
          <div className="text-muted-foreground">Verificando autenticación</div>
        </div>
      </div>
    );
  }

  const handleSessionComplete = () => {
    setDayCompleted(true);
    // Reset después de un breve delay para permitir que se procese la actualización
    setTimeout(() => setDayCompleted(false), 1000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-between items-center mb-4">
          <div></div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t.monitoringSystem}</h1>
            <p className="text-muted-foreground">{t.rehabilitation}</p>
          </div>
        </div>
      </div>

      {/* Título de monitoreo en tiempo real */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-primary mb-6">{t.realTimeMonitoring}</h2>
      </div>

      {/* Monitoreo de manos */}
      <HandMonitoring isTherapyActive={isTherapyActive} />

      {/* Sección media: Temporizador y Progreso */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TherapyTimer onSessionComplete={handleSessionComplete} />
        <ProgressTracker onDayCompleted={dayCompleted} />
      </div>

      {/* Rankings unificados (siempre visibles) */}
      <GameRankings />
    </div>
  );
};

export default Index;

