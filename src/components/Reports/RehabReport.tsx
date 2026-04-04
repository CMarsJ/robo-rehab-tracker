import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  ClipboardList, TrendingUp, Timer, Trophy,
  XCircle, Gauge, FileText, CheckCircle, X,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { RehabReportData } from '@/services/reportService';

interface RehabReportProps {
  data: RehabReportData;
}

const SectionHeader: React.FC<{ icon: React.ReactNode; number: string; title: string }> = ({ icon, number, title }) => (
  <CardHeader className="pb-3">
    <CardTitle className="flex items-center gap-2 text-lg">
      {icon}
      <span className="text-muted-foreground">{number}</span>
      {title}
    </CardTitle>
  </CardHeader>
);

const MetricRow: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="flex justify-between items-center py-2 px-1">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-semibold text-foreground text-right ml-4">{value}</span>
  </div>
);

const adherenceBadgeVariant = (level: string) => {
  if (level === 'adecuada') return 'default';
  if (level === 'moderada') return 'secondary';
  return 'destructive';
};

const MiniCalendar: React.FC<{ dailyAdherence: RehabReportData['dailyAdherence'] }> = ({ dailyAdherence }) => {
  // Group by weeks (rows of 7)
  const weeks: typeof dailyAdherence[] = [];
  for (let i = 0; i < dailyAdherence.length; i += 7) {
    weeks.push(dailyAdherence.slice(i, i + 7));
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground">Adherencia diaria</p>
      <div className="space-y-2 w-full">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-2 w-full">
            {week.map((day, di) => (
              <div
                key={di}
                className="flex flex-col items-center p-1.5 rounded-lg border border-border/50"
                title={`${day.dateLabel} - ${day.completed ? 'Completado' : 'No realizado'}`}
              >
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all ${
                    day.completed
                      ? 'bg-accent/20 text-accent'
                      : 'bg-destructive/10 text-destructive'
                  }`}
                >
                  {day.completed ? (
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </div>
                <span className="text-[10px] sm:text-xs text-muted-foreground mt-1">{day.dateLabel}</span>
              </div>
            ))}
            {/* Fill remaining cells if last week is incomplete */}
            {week.length < 7 && Array.from({ length: 7 - week.length }, (_, i) => (
              <div key={`empty-${i}`} className="flex flex-col items-center p-1.5" />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
        <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-accent" /> Realizado</span>
        <span className="flex items-center gap-1"><X className="w-3.5 h-3.5 text-destructive" /> No realizado</span>
      </div>
    </div>
  );
};

const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return percent > 0.05 ? (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  ) : null;
};

export const RehabReport: React.FC<RehabReportProps> = ({ data }) => {
  const { summary, dailyAdherence, therapyTrends, avgIndicators, bestPerformance, cancelledAnalysis, performanceIndex, conclusion } = data;

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="text-center space-y-1 pb-2">
        <h2 className="text-xl font-bold text-foreground">📋 Informe Automatizado</h2>
        <p className="text-sm text-muted-foreground">Rehabilitación de Mano – Paciente Post-ACV</p>
        <p className="text-xs text-muted-foreground italic">Periodo: {data.periodLabel}</p>
      </div>

      {/* §1 Resumen del Período */}
      <Card>
        <SectionHeader icon={<ClipboardList className="w-5 h-5 text-primary" />} number="1." title="Resumen del Período" />
        <CardContent className="space-y-4">
          <MiniCalendar dailyAdherence={dailyAdherence} />
          <Separator />
          <MetricRow label="Periodo evaluado" value={data.periodLabel} />
          <MetricRow label="Total de sesiones programadas" value={summary.totalScheduled} />
          <MetricRow label="Sesiones completadas" value={summary.totalCompleted} />
          <MetricRow label="Sesiones canceladas" value={summary.totalCancelled} />
          <MetricRow label="Porcentaje de adherencia" value={`${summary.adherencePercent}%`} />
          <Separator />
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Interpretación:</span>
            <Badge variant={adherenceBadgeVariant(summary.adherenceLevel)}>
              Adherencia {summary.adherenceLevel}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            ≥ 80% → Adecuada · 60–79% → Moderada · {'<'} 60% → Baja
          </p>
        </CardContent>
      </Card>

      {/* §2 Tendencias en los Tipos de Terapia */}
      <Card>
        <SectionHeader icon={<TrendingUp className="w-5 h-5 text-primary" />} number="2." title="Tendencias en los Tipos de Terapia" />
        <CardContent className="space-y-4">
          {therapyTrends.entries.length > 0 ? (
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-full md:w-1/2 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={therapyTrends.entries}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={CustomPieLabel}
                      outerRadius={100}
                      dataKey="count"
                      nameKey="name"
                    >
                      {therapyTrends.entries.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number, name: string) => [`${value} sesiones`, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full md:w-1/2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Modalidad</TableHead>
                      <TableHead className="text-right">Sesiones</TableHead>
                      <TableHead className="text-right">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {therapyTrends.entries.map((entry, i) => (
                      <TableRow key={i}>
                        <TableCell className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                          {entry.name}
                        </TableCell>
                        <TableCell className="text-right">{entry.count}</TableCell>
                        <TableCell className="text-right">{entry.percent}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Sin datos de terapias en este periodo.</p>
          )}

          <Separator />

          {/* Volume by hand */}
          <h4 className="font-semibold text-sm">Volumen por Mano</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Indicador</TableHead>
                <TableHead className="text-right">Mano Derecha</TableHead>
                <TableHead className="text-right">Mano Izquierda</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Total terapias realizadas</TableCell>
                <TableCell className="text-right">{therapyTrends.volumeByHand.rightHand.totalSessions}</TableCell>
                <TableCell className="text-right">{therapyTrends.volumeByHand.leftHand.totalSessions}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Tiempo total acumulado (min)</TableCell>
                <TableCell className="text-right">{therapyTrends.volumeByHand.rightHand.totalTimeMin}</TableCell>
                <TableCell className="text-right">{therapyTrends.volumeByHand.leftHand.totalTimeMin}</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <p className="text-sm text-muted-foreground italic">{therapyTrends.analysis}</p>
        </CardContent>
      </Card>

      {/* §3 Indicadores Temporales Promedio */}
      <Card>
        <SectionHeader icon={<Timer className="w-5 h-5 text-primary" />} number="3." title="Indicadores Temporales Promedio" />
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Mano Derecha</h4>
              <MetricRow label="Tiempo promedio de apertura" value={`${avgIndicators.rightHand.avgOpeningSec} s`} />
              <MetricRow label="Tiempo promedio de cierre" value={`${avgIndicators.rightHand.avgClosingSec} s`} />
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Mano Izquierda</h4>
              <MetricRow label="Tiempo promedio de apertura" value={`${avgIndicators.leftHand.avgOpeningSec} s`} />
              <MetricRow label="Tiempo promedio de cierre" value={`${avgIndicators.leftHand.avgClosingSec} s`} />
            </div>
          </div>
          <Separator />
          <p className="text-sm text-muted-foreground italic">{avgIndicators.analysis}</p>
        </CardContent>
      </Card>

      {/* §4 Mejor Desempeño del Período */}
      <Card>
        <SectionHeader icon={<Trophy className="w-5 h-5 text-primary" />} number="4." title="Mejor Desempeño del Período" />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Mano Derecha</h4>
              <MetricRow
                label="Mejor apertura"
                value={bestPerformance.rightHand.bestOpeningSec != null ? `${bestPerformance.rightHand.bestOpeningSec} s (${bestPerformance.rightHand.bestOpeningDate})` : 'N/A'}
              />
              <MetricRow
                label="Mejor cierre"
                value={bestPerformance.rightHand.bestClosingSec != null ? `${bestPerformance.rightHand.bestClosingSec} s (${bestPerformance.rightHand.bestClosingDate})` : 'N/A'}
              />
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Mano Izquierda</h4>
              <MetricRow
                label="Mejor apertura"
                value={bestPerformance.leftHand.bestOpeningSec != null ? `${bestPerformance.leftHand.bestOpeningSec} s (${bestPerformance.leftHand.bestOpeningDate})` : 'N/A'}
              />
              <MetricRow
                label="Mejor cierre"
                value={bestPerformance.leftHand.bestClosingSec != null ? `${bestPerformance.leftHand.bestClosingSec} s (${bestPerformance.leftHand.bestClosingDate})` : 'N/A'}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* §5 Análisis de Sesiones Canceladas */}
      <Card>
        <SectionHeader icon={<XCircle className="w-5 h-5 text-primary" />} number="5." title="Análisis de Sesiones Canceladas" />
        <CardContent className="space-y-2">
          <MetricRow label="Número total canceladas" value={cancelledAnalysis.total} />
          <MetricRow label="% sobre total" value={`${cancelledAnalysis.percent}%`} />
          <MetricRow label="Distribución temporal" value={cancelledAnalysis.distribution} />
        </CardContent>
      </Card>

      {/* §6 Índice Global de Rendimiento */}
      <Card>
        <SectionHeader icon={<Gauge className="w-5 h-5 text-primary" />} number="6." title="Índice Global de Rendimiento" />
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">Índice = (promedio apertura + promedio cierre) / 2</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <p className="text-3xl font-bold text-primary">{performanceIndex.rightHand} s</p>
              <p className="text-sm text-muted-foreground">Mano Derecha</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-3xl font-bold text-primary">{performanceIndex.leftHand} s</p>
              <p className="text-sm text-muted-foreground">Mano Izquierda</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* §7 Conclusión Automática */}
      <Card>
        <SectionHeader icon={<FileText className="w-5 h-5 text-primary" />} number="7." title="Conclusión Automática" />
        <CardContent>
          <p className="text-sm leading-relaxed">{conclusion}</p>
        </CardContent>
      </Card>
    </div>
  );
};
