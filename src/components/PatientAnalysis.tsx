
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTranslation } from '@/contexts/AppContext';

const PatientAnalysis = () => {
  const t = useTranslation();

  const weeklyData = [
    { 
      hand: t.nonPareticHand, 
      current: 127, 
      previous: 115, 
      change: 10.4 
    },
    { 
      hand: t.pareticHand, 
      current: 164, 
      previous: 150, 
      change: 9.3 
    },
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{t.patientAnalysis}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium mb-4">{t.averageWeeklyTime}</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hand" />
                  <YAxis label={{ value: 'Minutos', angle: -90, position: 'insideLeft' }} />
                  <Tooltip 
                    formatter={(value, name) => [
                      `${value} min/${t.week}`, 
                      name === 'current' ? t.currentWeek : t.previousWeek
                    ]}
                  />
                  <Bar 
                    dataKey="previous" 
                    fill="#94a3b8" 
                    radius={[4, 4, 0, 0]}
                    name="previous"
                  />
                  <Bar 
                    dataKey="current" 
                    fill="#2563eb" 
                    radius={[4, 4, 0, 0]}
                    name="current"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {weeklyData.map((item, index) => (
              <div key={index} className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-sm font-medium">{item.hand}</h5>
                  <div className={`flex items-center gap-1 text-xs ${
                    item.change > 0 ? 'text-medical-green' : 'text-medical-red'
                  }`}>
                    {item.change > 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {item.change > 0 ? '+' : ''}{item.change}%
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">{t.currentWeek}:</span>
                    <span className="text-lg font-bold text-primary">{item.current} {t.minutes}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">{t.previousWeek}:</span>
                    <span className="text-sm text-muted-foreground">{item.previous} {t.minutes}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PatientAnalysis;
