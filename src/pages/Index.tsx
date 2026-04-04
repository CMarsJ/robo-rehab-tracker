import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from '@/contexts/AppContext';
import { useSimulation } from '@/contexts/SimulationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useConfig } from '@/contexts/ConfigContext';
import { ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import HandMonitoring from '@/components/HandMonitoring';
import TherapyTimer from '@/components/TherapyTimer';
import ProgressTracker from '@/components/ProgressTracker';
import GameRankings from '@/components/GameRankings';

const Index = () => {
  const t = useTranslation();
  const { isTherapyActive } = useSimulation();
  const { user, loading } = useAuth();
  const { patientName, dailyGoal } = useConfig();
  const [dayCompleted, setDayCompleted] = useState(false);
  const [handVizOpen, setHandVizOpen] = useState(false);

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
    setTimeout(() => setDayCompleted(false), 1000);
  };

  const firstName = patientName.split(' ')[0];

  return (
    <div className="space-y-6 sm:space-y-8 w-full max-w-7xl mx-auto px-2 sm:px-4">
      {/* 1. Greeting Bar */}
      <div className="text-left pt-3 sm:pt-4">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
          {t.greeting} {firstName}!
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          {t.greetingJoy}
        </p>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          {t.dailyGoalText} <span className="font-semibold text-accent">{dailyGoal} {t.minutes}</span> {t.minutesToKeepProgress}
        </p>
      </div>

      {/* 2. Therapy Hub */}
      <TherapyTimer onSessionComplete={handleSessionComplete} />

      {/* 3. Achievements */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-accent" />
          {t.yourAchievements}
        </h2>
        <ProgressTracker onDayCompleted={dayCompleted} />
      </div>

      {/* 4. Collapsible Hand Visualization */}
      <Collapsible open={handVizOpen} onOpenChange={setHandVizOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            className="w-full rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/50 hover:bg-primary/5 py-4 text-base font-medium transition-all"
          >
            {handVizOpen ? (
              <ChevronUp className="w-5 h-5 mr-2 text-primary" />
            ) : (
              <ChevronDown className="w-5 h-5 mr-2 text-primary" />
            )}
            {t.realTimeVisualization}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4 transition-all">
          <HandMonitoring isTherapyActive={isTherapyActive} />
        </CollapsibleContent>
      </Collapsible>

      {/* 5. Game Rankings */}
      <GameRankings />
    </div>
  );
};

export default Index;
