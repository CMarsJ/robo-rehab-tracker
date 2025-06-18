
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { useTranslation } from '@/contexts/AppContext';

const ProgressTracker = () => {
  const t = useTranslation();
  const [weekProgress, setWeekProgress] = useState<boolean[]>([false, false, false, true, true, false, false]);
  const [monthProgress] = useState(60); // Porcentaje del mes
  
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString('es-ES', { month: 'long' });
  const currentYear = currentDate.getFullYear();
  
  // Obtener los días de la semana actual
  const getWeekDays = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      weekDays.push(day);
    }
    return weekDays;
  };

  const weekDays = getWeekDays();
  const completedDays = weekProgress.filter(Boolean).length;

  const dayNames = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          🏆 {t.achievements} {currentMonth} {currentYear}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progreso semanal */}
        <div>
          <h4 className="text-sm font-medium mb-3">{t.weeklyProgress}</h4>
          <div className="grid grid-cols-7 gap-2 mb-3">
            {weekDays.map((day, index) => {
              const isToday = day.toDateString() === new Date().toDateString();
              const isCompleted = weekProgress[index];
              
              return (
                <div
                  key={index}
                  className={`
                    relative h-12 rounded-lg border-2 flex flex-col items-center justify-center text-xs
                    ${isCompleted 
                      ? 'bg-medical-green/20 border-medical-green text-medical-green' 
                      : isToday 
                        ? 'bg-primary/20 border-primary text-primary' 
                        : 'bg-muted border-muted-foreground/20 text-muted-foreground'
                    }
                  `}
                >
                  <span className="font-medium">{dayNames[index]}</span>
                  <span className="text-[10px]">{day.getDate()}</span>
                  {isCompleted && (
                    <div className="absolute -top-1 -right-1 bg-medical-green rounded-full p-1">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="text-center">
            <Badge variant="secondary" className="bg-medical-green/10 text-medical-green">
              {Math.round((completedDays / 7) * 100)}% {t.completed}
            </Badge>
          </div>
        </div>

        {/* Progreso mensual */}
        <div>
          <h4 className="text-sm font-medium mb-3">{t.monthlyProgress}</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>18/30 días</span>
              <span className="text-primary font-medium">{monthProgress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-medical-blue to-primary h-3 rounded-full transition-all duration-500"
                style={{ width: `${monthProgress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {monthProgress}% completado este mes
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressTracker;
