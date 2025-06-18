
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { useTranslation } from '@/contexts/AppContext';

interface ProgressTrackerProps {
  onDayCompleted?: boolean;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ onDayCompleted }) => {
  const t = useTranslation();
  const [weekProgress, setWeekProgress] = useState<boolean[]>([false, false, false, false, false, false, false]);
  const [monthlyCompletedDays, setMonthlyCompletedDays] = useState(0); // Iniciar en 0
  
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString(t.locale || 'es-ES', { month: 'long' });
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
  const today = new Date();

  // Marcar día como completado cuando se termine una sesión
  useEffect(() => {
    if (onDayCompleted) {
      const todayIndex = weekDays.findIndex(day => 
        day.toDateString() === today.toDateString()
      );
      if (todayIndex !== -1) {
        setWeekProgress(prev => {
          const newProgress = [...prev];
          if (!newProgress[todayIndex]) {
            newProgress[todayIndex] = true;
            // Solo incrementar si no estaba completado antes
            setMonthlyCompletedDays(prevMonthly => prevMonthly + 1);
          }
          return newProgress;
        });
      }
    }
  }, [onDayCompleted]);

  const completedDays = weekProgress.filter(Boolean).length;
  const dayNames = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  
  // Calcular progreso mensual basado en días realmente completados
  const daysInMonth = new Date(currentYear, currentDate.getMonth() + 1, 0).getDate();
  const monthProgress = monthlyCompletedDays > 0 ? Math.round((monthlyCompletedDays / daysInMonth) * 100) : 0;

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
              const isToday = day.toDateString() === today.toDateString();
              const isCompleted = weekProgress[index];
              const isFuture = day > today;
              
              return (
                <div
                  key={index}
                  className={`
                    relative h-12 rounded-lg border-2 flex flex-col items-center justify-center text-xs
                    ${isFuture 
                      ? 'bg-muted/30 border-muted-foreground/10 text-muted-foreground/50' 
                      : isCompleted 
                        ? 'bg-medical-green/20 border-medical-green text-medical-green' 
                        : isToday 
                          ? 'bg-primary/20 border-primary text-primary' 
                          : 'bg-muted border-muted-foreground/20 text-muted-foreground'
                    }
                  `}
                >
                  <span className="font-medium">{dayNames[index]}</span>
                  <span className="text-[10px]">{day.getDate()}</span>
                  {isCompleted && !isFuture && (
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
              <span>{monthlyCompletedDays}/{daysInMonth} días</span>
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
