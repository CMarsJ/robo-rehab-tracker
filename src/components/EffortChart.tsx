
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTranslation } from '@/contexts/AppContext';
import { useSimulation } from '@/contexts/SimulationContext';

const EffortChart = () => {
  const t = useTranslation();
  const { effortHistory, isTherapyActive } = useSimulation();

  // Datos por defecto cuando no hay terapia activa
  const defaultData = [
    { time: '0:00', paretica: 0, noParetica: 0 },
  ];

  const data = effortHistory.length > 0 ? effortHistory : defaultData;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          {t.effortAnalysis}
          {isTherapyActive && (
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          {effortHistory.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <p className="text-lg mb-2">📊</p>
                <p>Los datos de esfuerzo aparecerán cuando inicie una sesión de terapia</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis domain={[0, 100]} label={{ value: 'Intensidad (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  formatter={(value, name) => [
                    `${value}%`, 
                    name === 'paretica' ? t.pareticHand : t.nonPareticHand
                  ]}
                />
                <Legend 
                  formatter={(value) => value === 'paretica' ? t.pareticHand : t.nonPareticHand}
                />
                <Line 
                  type="monotone" 
                  dataKey="noParetica" 
                  stroke="#2563eb" 
                  strokeWidth={3}
                  dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="paretica" 
                  stroke="#ef4444" 
                  strokeWidth={3}
                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EffortChart;
