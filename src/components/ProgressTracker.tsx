import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, Trophy } from "lucide-react";
import { useTranslation } from "@/contexts/AppContext";

interface ProgressTrackerProps {
  onDayCompleted?: boolean; // dispara cuando se termina una sesión hoy
}

// Helpers
const normalize = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const formatYMD = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
const getMonday = (d: Date) => {
  const x = normalize(d);
  const day = x.getDay(); // 0 domingo
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
};

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ onDayCompleted }) => {
  const t = useTranslation();

  // "Hoy" normalizado para toda la sesión del componente
  const today = useMemo(() => normalize(new Date()), []);
  const weekStart = useMemo(() => getMonday(today), [today]);
  const currentWeekKey = useMemo(() => formatYMD(weekStart), [weekStart]);

  const currentYear = today.getFullYear();
  const currentMonthName = today.toLocaleString(t.locale || "es-ES", {
    month: "long",
  });
  const currentMonthKey = useMemo(
    () => `${currentYear}-${String(today.getMonth() + 1).padStart(2, "0")}`,
    [currentYear, today]
  );
  const monthlySetKey = useMemo(
    () => `monthlyCompletedSet:${currentMonthKey}`,
    [currentMonthKey]
  );

  // Estado
  const [weekProgress, setWeekProgress] = useState<boolean[]>(
    Array(7).fill(false)
  );
  const [monthlyCompletedDays, setMonthlyCompletedDays] = useState(0); // compatibilidad legacy
  const [monthlyCompletedSet, setMonthlyCompletedSet] = useState<Set<string>>(
    new Set()
  );

  // Días de la semana (lunes-domingo)
  const weekDays = useMemo(() => {
    const arr: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, [weekStart]);

  // Cargar estado inicial + resets por cambio de mes/semana
  useEffect(() => {
    // --- Reset/carga mensual ---
    const savedMonthKey = localStorage.getItem("currentMonthKey");
    if (savedMonthKey !== currentMonthKey) {
      // Nuevo mes: reset
      localStorage.setItem("currentMonthKey", currentMonthKey);
      localStorage.setItem("monthlyCompletedDays", "0");
      localStorage.setItem(monthlySetKey, JSON.stringify([]));
      setMonthlyCompletedDays(0);
      setMonthlyCompletedSet(new Set());
    } else {
      // Cargar Set mensual (preferente)
      const rawSet = localStorage.getItem(monthlySetKey);
      if (rawSet) {
        try {
          const arr: string[] = JSON.parse(rawSet);
          const set = new Set(arr);
          setMonthlyCompletedSet(set);
          setMonthlyCompletedDays(set.size); // igualamos el contador al set
        } catch {
          // Fallback legacy solo si no hay set válido
          const savedMonthly = localStorage.getItem("monthlyCompletedDays");
          if (savedMonthly) setMonthlyCompletedDays(parseInt(savedMonthly));
        }
      } else {
        // Fallback legacy
        const savedMonthly = localStorage.getItem("monthlyCompletedDays");
        if (savedMonthly) setMonthlyCompletedDays(parseInt(savedMonthly));
      }
    }

    // --- Reset/carga semanal ---
    const savedWeekKey = localStorage.getItem("currentWeekKey");
    if (savedWeekKey !== currentWeekKey) {
      // Nueva semana: limpiar progreso semanal
      localStorage.setItem("currentWeekKey", currentWeekKey);
      localStorage.setItem("weekProgress", JSON.stringify(Array(7).fill(false)));
      setWeekProgress(Array(7).fill(false));
    } else {
      const savedWeek = localStorage.getItem("weekProgress");
      if (savedWeek) {
        try {
          const parsed = JSON.parse(savedWeek);
          if (Array.isArray(parsed) && parsed.length === 7) {
            setWeekProgress(parsed);
          }
        } catch {
          // ignora
        }
      }
    }
  }, [currentMonthKey, monthlySetKey, currentWeekKey]);

  // Marcar día como completado cuando se termine una sesión hoy
  useEffect(() => {
    if (!onDayCompleted) return;

    const todayIndex = weekDays.findIndex(
      (d) => d.toDateString() === today.toDateString()
    );
    if (todayIndex === -1) return;

    setWeekProgress((prev) => {
      if (prev[todayIndex]) return prev; // ya estaba completado
      const next = [...prev];
      next[todayIndex] = true;
      localStorage.setItem("weekProgress", JSON.stringify(next));
      return next;
    });

    // Registrar en set mensual (de-duplicado por fecha)
    const dateKey = formatYMD(today);
    setMonthlyCompletedSet((prev) => {
      const next = new Set(prev);
      const before = next.size;
      next.add(dateKey);
      localStorage.setItem(monthlySetKey, JSON.stringify([...next]));
      if (next.size !== before) {
        setMonthlyCompletedDays(next.size); // mantener sincronizado legacy
        localStorage.setItem("monthlyCompletedDays", String(next.size));
      }
      return next;
    });
  }, [onDayCompleted, today, weekDays, monthlySetKey]);

  // Cálculos
  const displayMonthlyDays =
    monthlyCompletedSet.size > 0 ? monthlyCompletedSet.size : monthlyCompletedDays;

  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const monthProgress = Math.round((displayMonthlyDays / daysInMonth) * 100);

  // Conteo semanal SOLO con días pasados o hoy (no futuros)
  const completedDays = weekDays.reduce((acc, d, idx) => {
    const isFuture = normalize(d) > today;
    return acc + (weekProgress[idx] && !isFuture ? 1 : 0);
  }, 0);

  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          {(t.achievements || "Logros")} de {currentMonthName} {today.getFullYear()}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progreso semanal */}
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
              const isFuture = normalize(day) > today;
              const isCompleted = weekProgress[index] && !isFuture; // nunca marcar futuro

              return (
                <div key={index} className="flex-1 text-center">
                  <div
                    className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-medium mb-1 transition-all duration-300
                    ${
                      isCompleted
                        ? "bg-green-500 text-white"
                        : isToday
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : isToday ? (
                      <Clock className="w-4 h-4" />
                    ) : (
                      day
                        .toLocaleDateString("es-ES", { weekday: "short" })
                        .charAt(0)
                        .toUpperCase()
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

        {/* Progreso mensual */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t.monthlyProgress || "Progreso mensual"}
            </span>
            <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
              {displayMonthlyDays}/{daysInMonth} {t.days || "días"}
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