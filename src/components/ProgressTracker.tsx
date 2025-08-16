import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, Trophy } from "lucide-react";
import { useTranslation } from "@/contexts/AppContext";

interface ProgressTrackerProps {
  onDayCompleted?: boolean;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ onDayCompleted }) => {
  const t = useTranslation();
  const [weekProgress, setWeekProgress] = useState<boolean[]>([
    false,
    false,
    false,
    false,
    false,
    false,
    false,
  ]);
  const [monthlyCompletedDays, setMonthlyCompletedDays] = useState(0);

  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString(t.locale || "es-ES", {
    month: "long",
  });
  const currentYear = currentDate.getFullYear();

  // 🔹 Cargar datos guardados (localStorage)
  useEffect(() => {
    const currentMonthKey = `${currentYear}-${currentDate.getMonth()}`;
    const savedMonthKey = localStorage.getItem("currentMonthKey");

    // Reset si cambia el mes
    if (savedMonthKey !== currentMonthKey) {
      localStorage.setItem("currentMonthKey", currentMonthKey);
      localStorage.setItem("monthlyCompletedDays", "0");
      setMonthlyCompletedDays(0);
      setWeekProgress([false, false, false, false, false, false, false]);
      localStorage.setItem(
        "weekProgress",
        JSON.stringify([false, false, false, false, false, false, false])
      );
    } else {
      const savedMonthlyDays = localStorage.getItem("monthlyCompletedDays");
      if (savedMonthlyDays) {
        setMonthlyCompletedDays(parseInt(savedMonthlyDays));
      }
      const savedWeekProgress = localStorage.getItem("weekProgress");
      if (savedWeekProgress) {
        setWeekProgress(JSON.parse(savedWeekProgress));
      }
    }
  }, [currentYear, currentDate]);

  // 🔹 Calcular semana actual (lunes a domingo)
  const getWeekDays = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = domingo
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

  // 🔹 Cuando se complete el día
  useEffect(() => {
    if (onDayCompleted) {
      const todayIndex = weekDays.findIndex(
        (day) => day.toDateString() === today.toDateString()
      );
      if (todayIndex !== -1) {
        setWeekProgress((prev) => {
          const newProgress = [...prev];
          if (!newProgress[todayIndex]) {
            newProgress[todayIndex] = true;

            // Guardar progreso semanal
            localStorage.setItem("weekProgress", JSON.stringify(newProgress));

            // Guardar progreso mensual
            const newMonthlyDays = monthlyCompletedDays + 1;
            setMonthlyCompletedDays(newMonthlyDays);
            localStorage.setItem(
              "monthlyCompletedDays",
              newMonthlyDays.toString()
            );
          }
          return newProgress;
        });
      }
    }
  }, [onDayCompleted]);

  // 🔹 Calcular progreso
  const completedDays = weekProgress.filter(Boolean).length;
  const daysInMonth = new Date(
    currentYear,
    currentDate.getMonth() + 1,
    0
  ).getDate();
  const monthProgress =
    monthlyCompletedDays > 0
      ? Math.round((monthlyCompletedDays / daysInMonth) * 100)
      : 0;

  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          {t.achievements || "Logros"} de {currentMonth} {currentYear}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 🔹 Progreso semanal */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t.weeklyProgress || "Progreso semanal"}
            </span>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {completedDays}/7 {t.days || "días"}
            </span>
          </div>

          <div className="flex gap-2 mb-3">
            {weekDays.map((day, index) => {
              const isToday = day.toDateString() === today.toDateString();
              const isCompleted = weekProgress[index];
              const isFuture = day > today;

              return (
                <div key={index} className="flex-1 text-center">
                  <div
                    className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-medium mb-1 transition-all duration-300
                    ${
                      isCompleted
                        ? "bg-green-500 text-white"
                        : isToday
                        ? "bg-blue-500 text-white"
                        : isFuture
                        ? "bg-gray-200 dark:bg-gray-600 text-gray-400"
                        : "bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : isToday ? (
                      <Clock className="w-4 h-4" />
                    ) : (
                      day.toLocaleDateString("es-ES", {
                        weekday: "short",
                      }).charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {day.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          <Progress value={(completedDays / 7) * 100} className="h-2" />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {Math.round((completedDays / 7) * 100)}%{" "}
            {t.completedThisWeek || "completado esta semana"}
          </p>
        </div>

        {/* 🔹 Progreso mensual */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t.monthlyProgress || "Progreso mensual"}
            </span>
            <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
              {monthlyCompletedDays}/{daysInMonth} {t.days || "días"}
            </span>
          </div>

          <Progress value={monthProgress} className="h-2 mb-1" />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {monthProgress}% {t.completedThisMonth || "completado este mes"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressTracker;