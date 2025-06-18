
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/contexts/AppContext';
import { useSimulation } from '@/contexts/SimulationContext';

interface HandMonitoringProps {
  isTherapyActive?: boolean;
}

interface HandAngles {
  thumb1: number;
  thumb2: number;
  thumb3: number;
  finger1: number;
  finger2: number;
  finger3: number;
}

const HandMonitoring: React.FC<HandMonitoringProps> = ({ isTherapyActive = false }) => {
  const t = useTranslation();
  const { leftHand, rightHand } = useSimulation();

  const AngleDisplay = ({ angles, title }: { angles: HandAngles; title: string }) => (
    <div className="mt-4 space-y-2">
      <h5 className="text-xs font-medium text-center">{title}</h5>
      <div className="grid grid-cols-2 gap-1 text-xs">
        <div className="space-y-1">
          <div className="text-center font-medium">Pulgar</div>
          <div className="flex justify-between">
            <span>A1:</span>
            <span>{angles.thumb1}°</span>
          </div>
          <div className="flex justify-between">
            <span>A2:</span>
            <span>{angles.thumb2}°</span>
          </div>
          <div className="flex justify-between">
            <span>A3:</span>
            <span>{angles.thumb3}°</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-center font-medium">Dedos</div>
          <div className="flex justify-between">
            <span>A4:</span>
            <span>{angles.finger1}°</span>
          </div>
          <div className="flex justify-between">
            <span>A5:</span>
            <span>{angles.finger2}°</span>
          </div>
          <div className="flex justify-between">
            <span>A6:</span>
            <span>{angles.finger3}°</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Mano No Parética */}
      <Card className={`border-2 transition-all duration-300 ${
        leftHand.active && isTherapyActive
          ? 'border-medical-green/60 bg-medical-green/5 hover:border-medical-green/80' 
          : 'border-medical-green/20 hover:border-medical-green/40'
      }`}>
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-lg font-semibold text-medical-green">
            {t.nonPareticHand}
          </CardTitle>
          <Badge variant="secondary" className="w-fit mx-auto bg-medical-green/10 text-medical-green">
            {t.withSensors}
          </Badge>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <div className={`hand-non-paretic w-32 h-40 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 ${
            leftHand.active && isTherapyActive
              ? 'animate-pulse bg-medical-green/10' 
              : 'bg-muted/50'
          }`}>
            <div className="text-4xl">✋</div>
          </div>
          
          <AngleDisplay angles={leftHand.angles} title="Ángulos de Articulación" />
          
          <div className="mt-3 flex flex-col items-center gap-2">
            <Badge variant="outline" className={`${
              leftHand.active && isTherapyActive
                ? 'text-medical-green border-medical-green bg-medical-green/10' 
                : leftHand.active
                  ? 'text-blue-600 border-blue-600 bg-blue-50'
                  : 'text-muted-foreground border-muted-foreground'
            }`}>
              {leftHand.active ? t.active : t.inactive}
            </Badge>
            <div className="text-xs text-muted-foreground">
              Esfuerzo: {leftHand.effort}%
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mano Parética */}
      <Card className={`border-2 transition-all duration-300 ${
        rightHand.active && isTherapyActive
          ? 'border-medical-orange/60 bg-medical-orange/5 hover:border-medical-orange/80' 
          : 'border-medical-orange/20 hover:border-medical-orange/40'
      }`}>
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-lg font-semibold text-medical-orange">
            {t.pareticHand}
          </CardTitle>
          <Badge variant="secondary" className="w-fit mx-auto bg-medical-orange/10 text-medical-orange">
            {t.withExoskeleton}
          </Badge>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <div className={`hand-paretic w-32 h-40 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 ${
            rightHand.active && isTherapyActive
              ? 'animate-pulse bg-medical-orange/10' 
              : 'bg-muted/50'
          }`}>
            <div className="text-4xl">✋</div>
          </div>
          
          <AngleDisplay angles={rightHand.angles} title="Ángulos de Articulación" />
          
          <div className="mt-3 flex flex-col items-center gap-2">
            <Badge variant="outline" className={`${
              rightHand.active && isTherapyActive
                ? 'text-medical-orange border-medical-orange bg-medical-orange/10' 
                : rightHand.active
                  ? 'text-blue-600 border-blue-600 bg-blue-50'
                  : 'text-muted-foreground border-muted-foreground'
            }`}>
              {rightHand.active ? t.active : t.inactive}
            </Badge>
            <div className="text-xs text-muted-foreground">
              Esfuerzo: {rightHand.effort}%
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HandMonitoring;
