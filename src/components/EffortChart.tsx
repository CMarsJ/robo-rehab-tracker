
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTranslation } from '@/contexts/AppContext';

const EffortChart = () => {
  const t = useTranslation();

  const data = [
    { time: '0min', paretica: 45, noParetica: 65 },
    { time: '2min', paretica: 50, noParetica: 70 },
    { time: '4min', paretica: 55, noParetica: 68 },
    { time: '6min', paretica: 48, noParetica: 75 },
    { time: '8min', paretica: 52, noParetica: 72 },
    { time: '10min', paretica: 58, noParetica: 78 },
    { time: '12min', paretica: 60, noParetica: 76 },
    { time: '14min', paretica: 55, noParetica: 80 },
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{t.effortAnalysis}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
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
        </div>
      </CardContent>
    </Card>
  );
};

export default EffortChart;
