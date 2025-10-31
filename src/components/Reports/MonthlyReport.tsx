import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Clock, Target, Trophy, TrendingUp } from 'lucide-react';
import { MonthlyReportData } from '@/services/reportService';

interface MonthlyReportProps {
  data: MonthlyReportData;
}

export const MonthlyReport: React.FC<MonthlyReportProps> = ({ data }) => {
  // Convertir sessionsByType a array para gráficos
  const therapyTypeData = Object.entries(data.sessionsByType).map(([type, stats]) => ({
    name: type,
    sesiones: stats.count,
    promedio: Math.round(stats.averageTime),
    total: Math.round(stats.totalTime),
  }));

  return (
    <div className="space-y-6">
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tiempo Total</p>
                <p className="text-2xl font-bold">{Math.round(data.totalTherapyTime)} min</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sesiones</p>
                <p className="text-2xl font-bold">{data.totalSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mejor Score</p>
                <p className="text-2xl font-bold">{data.achievements.bestScore}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Naranjas Total</p>
                <p className="text-2xl font-bold">{data.achievements.totalOranges}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de progreso semanal */}
      <Card>
        <CardHeader>
          <CardTitle>Progreso Mensual (por semana)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.weeklyProgress}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="sessions" fill="hsl(var(--primary))" name="Sesiones" />
              <Bar dataKey="time" fill="hsl(var(--secondary))" name="Tiempo (min)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tiempo por tipo de terapia */}
      <Card>
        <CardHeader>
          <CardTitle>Tiempo por Tipo de Terapia</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={therapyTypeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="hsl(var(--primary))" name="Total (min)" />
              <Bar dataKey="promedio" fill="hsl(var(--accent))" name="Promedio (min)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Resumen por tipo */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen por Tipo de Terapia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {therapyTypeData.map((type) => (
              <div key={type.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{type.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {type.sesiones} sesiones • {type.total} min total
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{type.promedio}</p>
                  <p className="text-xs text-muted-foreground">min promedio</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
