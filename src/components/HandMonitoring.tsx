
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/contexts/AppContext';

const HandMonitoring = () => {
  const t = useTranslation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Mano No Parética */}
      <Card className="border-2 border-medical-green/20 hover:border-medical-green/40 transition-all duration-300">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-lg font-semibold text-medical-green">
            {t.nonPareticHand}
          </CardTitle>
          <Badge variant="secondary" className="w-fit mx-auto bg-medical-green/10 text-medical-green">
            {t.withSensors}
          </Badge>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div className="hand-non-paretic w-32 h-40 rounded-2xl flex items-center justify-center shadow-lg animate-pulse-medical">
            <div className="text-4xl">✋</div>
          </div>
        </CardContent>
        <div className="text-center pb-4">
          <Badge variant="outline" className="text-medical-green border-medical-green">
            {t.inactive}
          </Badge>
        </div>
      </Card>

      {/* Mano Parética */}
      <Card className="border-2 border-medical-orange/20 hover:border-medical-orange/40 transition-all duration-300">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-lg font-semibold text-medical-orange">
            {t.pareticHand}
          </CardTitle>
          <Badge variant="secondary" className="w-fit mx-auto bg-medical-orange/10 text-medical-orange">
            {t.withExoskeleton}
          </Badge>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div className="hand-paretic w-32 h-40 rounded-2xl flex items-center justify-center shadow-lg animate-pulse-medical">
            <div className="text-4xl">✋</div>
          </div>
        </CardContent>
        <div className="text-center pb-4">
          <Badge variant="outline" className="text-medical-orange border-medical-orange">
            {t.inactive}
          </Badge>
        </div>
      </Card>
    </div>
  );
};

export default HandMonitoring;
