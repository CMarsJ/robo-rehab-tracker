
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Calendar } from 'lucide-react';
import { useTranslation } from '@/contexts/AppContext';

const Reports = () => {
  const t = useTranslation();

  const handleGenerateReport = (type: 'week' | 'month') => {
    // Aquí iría la lógica para generar el reporte
    console.log(`Generando reporte ${type === 'week' ? 'semanal' : 'mensual'}`);
  };

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
            >
              <FileText className="w-4 h-4 mr-2" />
              Generar Reporte Semanal
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
