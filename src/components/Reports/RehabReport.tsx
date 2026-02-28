import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  ClipboardList, PieChart, Activity, Timer, Trophy,
  XCircle, Gauge, FileText,
} from 'lucide-react';
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
  <div className="flex justify-between py-1.5">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-semibold">{value}</span>
  </div>
);

const adherenceBadgeVariant = (level: string) => {
  if (level === 'adecuada') return 'default';
  if (level === 'moderada') return 'secondary';
  return 'destructive';
};

export const RehabReport: React.FC<RehabReportProps> = ({ data }) => {
  const { summary, therapyDistribution, volumeByHand, avgIndicators, bestPerformance, cancelledAnalysis, performanceIndex, conclusion } = data;

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
        <CardContent className="space-y-3">
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

      {/* §2 Distribución de Terapias */}
      <Card>
        <SectionHeader icon={<PieChart className="w-5 h-5 text-primary" />} number="2." title="Distribución de Terapias" />
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo de terapia</TableHead>
                <TableHead className="text-right">Nº de repeticiones</TableHead>
                <TableHead className="text-right">% del total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Apertura</TableCell>
                <TableCell className="text-right">{therapyDistribution.openingCount}</TableCell>
                <TableCell className="text-right">{therapyDistribution.openingPercent}%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Cierre</TableCell>
                <TableCell className="text-right">{therapyDistribution.closingCount}</TableCell>
                <TableCell className="text-right">{therapyDistribution.closingPercent}%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <p className="text-sm text-muted-foreground mt-3 italic">{therapyDistribution.analysis}</p>
        </CardContent>
      </Card>

      {/* §3 Volumen Total del Período */}
      <Card>
        <SectionHeader icon={<Activity className="w-5 h-5 text-primary" />} number="3." title="Volumen Total del Período" />
        <CardContent>
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
                <TableCell className="text-right">{volumeByHand.rightHand.totalSessions}</TableCell>
                <TableCell className="text-right">{volumeByHand.leftHand.totalSessions}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Tiempo total acumulado (min)</TableCell>
                <TableCell className="text-right">{volumeByHand.rightHand.totalTimeMin}</TableCell>
                <TableCell className="text-right">{volumeByHand.leftHand.totalTimeMin}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* §4 Indicadores Temporales Promedio */}
      <Card>
        <SectionHeader icon={<Timer className="w-5 h-5 text-primary" />} number="4." title="Indicadores Temporales Promedio" />
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

      {/* §5 Mejor Desempeño del Período */}
      <Card>
        <SectionHeader icon={<Trophy className="w-5 h-5 text-primary" />} number="5." title="Mejor Desempeño del Período" />
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

      {/* §6 Análisis de Sesiones Canceladas */}
      <Card>
        <SectionHeader icon={<XCircle className="w-5 h-5 text-primary" />} number="6." title="Análisis de Sesiones Canceladas" />
        <CardContent className="space-y-2">
          <MetricRow label="Número total canceladas" value={cancelledAnalysis.total} />
          <MetricRow label="% sobre total" value={`${cancelledAnalysis.percent}%`} />
          <MetricRow label="Distribución temporal" value={cancelledAnalysis.distribution} />
        </CardContent>
      </Card>

      {/* §7 Índice Global de Rendimiento */}
      <Card>
        <SectionHeader icon={<Gauge className="w-5 h-5 text-primary" />} number="7." title="Índice Global de Rendimiento" />
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

      {/* §8 Conclusión Automática */}
      <Card>
        <SectionHeader icon={<FileText className="w-5 h-5 text-primary" />} number="8." title="Conclusión Automática" />
        <CardContent>
          <p className="text-sm leading-relaxed">{conclusion}</p>
        </CardContent>
      </Card>
    </div>
  );
};
