
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/contexts/AppContext';

interface HandMonitoringProps {
  isTherapyActive?: boolean;
}

const HandMonitoring: React.FC<HandMonitoringProps> = ({ isTherapyActive = false }) => {
  const t = useTranslation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Mano No Parética */}
      <Card className={`border-2 transition-all duration-300 ${
        isTherapyActive 
          ? 'border-medical-green/60 bg-medical-green/5 hover:border-medical-green/80' 
          : 'border-medical-green/20 hover:border-medical-green/40'
      }`}>
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-lg font-semibold text-medical-green">
            {t.nonPareticHand}
          </CardTitle>
          <Badge variant="secondary" className="w-fit mx-auto bg-medical-green/10 text-medical-green">
            {t.withSensors}
          </Badge>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div className={`hand-non-paretic w-32 h-40 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 ${
            isTherapyActive 
              ? 'animate-pulse bg-medical-green/10' 
              : 'bg-muted/50'
          }`}>
            <div className="text-4xl">✋</div>
          </div>
        </CardContent>
        <div className="text-center pb-4">
          <Badge variant="outline" className={`${
            isTherapyActive 
              ? 'text-medical-green border-medical-green bg-medical-green/10' 
              : 'text-muted-foreground border-muted-foreground'
          }`}>
            {isTherapyActive ? t.active : t.inactive}
          </Badge>
        </div>
      </Card>

      {/* Mano Parética */}
      <Card className={`border-2 transition-all duration-300 ${
        isTherapyActive 
          ? 'border-medical-orange/60 bg-medical-orange/5 hover:border-medical-orange/80' 
          : 'border-medical-orange/20 hover:border-medical-orange/40'
      }`}>
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-lg font-semibold text-medical-orange">
            {t.pareticHand}
          </CardTitle>
          <Badge variant="secondary" className="w-fit mx-auto bg-medical-orange/10 text-medical-orange">
            {t.withExoskeleton}
          </Badge>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div className={`hand-paretic w-32 h-40 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 ${
            isTherapyActive 
              ? 'animate-pulse bg-medical-orange/10' 
              : 'bg-muted/50'
          }`}>
            <div className="text-4xl">✋</div>
          </div>
        </CardContent>
        <div className="text-center pb-4">
          <Badge variant="outline" className={`${
            isTherapyActive 
              ? 'text-medical-orange border-medical-orange bg-medical-orange/10' 
              : 'text-muted-foreground border-muted-foreground'
          }`}>
            {isTherapyActive ? t.active : t.inactive}
          </Badge>
        </div>
      </Card>
    </div>
  );
};

export default HandMonitoring;
