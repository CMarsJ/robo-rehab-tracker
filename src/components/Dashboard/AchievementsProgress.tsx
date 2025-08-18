
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, Trophy } from 'lucide-react';

export const AchievementsProgress = () => {
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  
  const [completedSessions, setCompletedSessions] = useState(0);
  
  // Generate week days (last 7 days)
  const [weekDays, setWeekDays] = useState(() => 
    Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        day: date.toLocaleDateString('es-ES', { weekday: 'short' }).charAt(0).toUpperCase(),
        date: date.getDate(),
        completed: Math.random() > 0.3, // Simulate completion
        isToday: date.toDateString() === currentDate.toDateString()
      };
    })
  );

  // Función para actualizar logros cuando se complete una terapia
  const updateAchievements = () => {
    setWeekDays(prev => prev.map(day => 
      day.isToday ? { ...day, completed: true } : day
    ));
    setCompletedSessions(prev => prev + 1);
  };

  // Exponer función globalmente
  useEffect(() => {
    (window as any).updateAchievements = updateAchievements;
  }, []);

  const weeklyProgress = weekDays.filter(day => day.completed).length;
  const monthlyProgress = 18 + completedSessions; // Simulate monthly progress
  const monthlyTarget = 30;

  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Logros de {currentMonth}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Weekly Progress */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Progreso semanal
            </span>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {weeklyProgress}/7 días
            </span>
          </div>
          
          <div className="flex gap-2 mb-3">
            {weekDays.map((day, index) => (
              <div key={index} className="flex-1 text-center">
                <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-medium mb-1 transition-all duration-300 ${
                  day.completed ? 'bg-green-500 text-white' : 
                  day.isToday ? 'bg-blue-500 text-white' : 
                  'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                }`}>
                  {day.completed ? <CheckCircle className="w-4 h-4" /> : 
                   day.isToday ? <Clock className="w-4 h-4" /> : day.day}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{day.date}</div>
              </div>
            ))}
          </div>
          
          <Progress value={(weeklyProgress / 7) * 100} className="h-2" />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {Math.round((weeklyProgress / 7) * 100)}% completado esta semana
          </p>
        </div>

        {/* Monthly Progress */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Progreso mensual
            </span>
            <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
              {monthlyProgress}/{monthlyTarget} días
            </span>
          </div>
          
          <Progress 
            value={(monthlyProgress / monthlyTarget) * 100} 
            className="h-2 mb-1"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {Math.round((monthlyProgress / monthlyTarget) * 100)}% completado este mes
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
