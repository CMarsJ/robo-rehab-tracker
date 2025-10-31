
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Calendar, ArrowLeft } from 'lucide-react';
import { useTranslation } from '@/contexts/AppContext';
import { ReportService, WeeklyReportData } from '@/services/reportService';
import { WeeklyReport } from '@/components/Reports/WeeklyReport';
import { useToast } from '@/hooks/use-toast';

const Reports = () => {
  const t = useTranslation();
  const { toast } = useToast();
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);
  const [weeklyData, setWeeklyData] = useState<WeeklyReportData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateReport = async (type: 'week' | 'month') => {
    if (type === 'week') {
      setLoading(true);
      try {
        const data = await ReportService.getWeeklyReport();
        if (data) {
          setWeeklyData(data);
          setShowWeeklyReport(true);
          toast({
            title: "Reporte generado",
            description: "El reporte semanal se ha generado exitosamente",
          });
        } else {
          toast({
            title: "Sin datos",
            description: "No hay datos disponibles para esta semana",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error generating report:', error);
        toast({
          title: "Error",
          description: "No se pudo generar el reporte",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    } else {
      console.log('Reporte mensual - próximamente');
    }
  };

  if (showWeeklyReport && weeklyData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setShowWeeklyReport(false)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reporte Semanal</h1>
            <p className="text-muted-foreground">Resumen de actividad de la semana</p>
          </div>
        </div>
        <WeeklyReport data={weeklyData} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">{t.reports}</h1>
        <p className="text-muted-foreground">
          Genera reportes detallados del rendimiento del paciente
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Reporte Semanal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Genera un reporte completo con todas las gráficas y datos del rendimiento 
              del paciente de la última semana.
            </p>
            <Button 
              onClick={() => handleGenerateReport('week')}
              className="w-full"
              disabled={loading}
            >
              <FileText className="w-4 h-4 mr-2" />
              {loading ? 'Generando...' : 'Generar Reporte Semanal'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Reporte Mensual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Genera un reporte completo con todas las gráficas y datos del rendimiento 
              del paciente del último mes.
            </p>
            <Button 
              onClick={() => handleGenerateReport('month')}
              className="w-full"
            >
              <FileText className="w-4 h-4 mr-2" />
              Generar Reporte Mensual
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reportes Disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'Reporte Semanal - Semana 25', date: '2024-06-17', size: '2.3 MB' },
              { name: 'Reporte Mensual - Mayo 2024', date: '2024-05-31', size: '5.1 MB' },
              { name: 'Reporte Semanal - Semana 24', date: '2024-06-10', size: '2.1 MB' },
            ].map((report, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">{report.name}</p>
                    <p className="text-sm text-muted-foreground">{report.date} • {report.size}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Descargar
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
