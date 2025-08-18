
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const HandVisualization = () => {
  const [leftHandActive, setLeftHandActive] = useState(false);
  const [rightHandActive, setRightHandActive] = useState(false);

  // Simulate real-time monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      setLeftHandActive(Math.random() > 0.5);
      setRightHandActive(Math.random() > 0.7);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
        Monitoreo en Tiempo Real
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Mano No Parética */}
        <Card className="p-6 text-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="relative mb-4">
            <div className={`w-32 h-40 mx-auto rounded-2xl bg-gradient-to-b from-orange-200 to-orange-300 dark:from-orange-300 dark:to-orange-400 flex items-center justify-center text-6xl transition-all duration-300 ${leftHandActive ? 'scale-105 shadow-lg' : ''}`}>
              ✋
            </div>
            <div className="absolute top-2 right-8">
              <div className={`w-3 h-3 rounded-full ${leftHandActive ? 'bg-green-500' : 'bg-gray-400'} animate-pulse`}></div>
            </div>
            <div className="absolute top-4 right-6 text-xs text-gray-600 dark:text-gray-400">
              📡
            </div>
          </div>
          
          <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2">
            Mano No Parética
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Con Sensores</p>
          
          <Badge variant={leftHandActive ? "default" : "secondary"} className="text-xs">
            {leftHandActive ? 'Activo' : 'Inactivo'}
          </Badge>
        </Card>

        {/* Mano Parética */}
        <Card className="p-6 text-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="relative mb-4">
            <div className={`w-32 h-40 mx-auto rounded-2xl bg-gradient-to-b from-orange-200 to-orange-300 dark:from-orange-300 dark:to-orange-400 flex items-center justify-center text-6xl transition-all duration-300 ${rightHandActive ? 'scale-105 shadow-lg' : ''}`}>
              ✋
            </div>
            <div className="absolute top-2 right-8">
              <div className={`w-4 h-4 rounded-full ${rightHandActive ? 'bg-red-500' : 'bg-gray-400'} flex items-center justify-center`}>
                <span className="text-white text-xs">⚡</span>
              </div>
            </div>
          </div>
          
          <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2">
            Mano Parética
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Con Exoesqueleto</p>
          
          <Badge variant={rightHandActive ? "destructive" : "secondary"} className="text-xs">
            {rightHandActive ? 'Activo' : 'Inactivo'}
          </Badge>
        </Card>
      </div>
    </div>
  );
};
