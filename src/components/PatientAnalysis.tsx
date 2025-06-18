
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTranslation } from '@/contexts/AppContext';

const PatientAnalysis = () => {
  const t = useTranslation();

  const weeklyData = [
    { hand: t.nonPareticHand, current: 127, previous: 115, change: 10.4 },
    { hand: t.pareticHand, current: 164, previous: 150, change: 9.3 },
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
                    formatter={(value) => [`${value} min/${t.week}`, t.averageWeeklyTime]}
                  />
                  <Bar 
                    dataKey="current" 
                    fill="#2563eb" 
                    radius={[4, 4, 0, 0]}
                    name="Semana actual"
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
                <div className="text-2xl font-bold text-primary">{item.current}</div>
                <div className="text-xs text-muted-foreground">
                  {t.minutes}/{t.week}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Anterior: {item.previous} min
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
