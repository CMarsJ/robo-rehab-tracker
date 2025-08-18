
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Reportes = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('mes');
  const { toast } = useToast();

  const handleGenerateReport = () => {
    toast({
      title: "Reporte generado",
      description: `Reporte ${selectedPeriod === 'mes' ? 'mensual' : 'semanal'} generado exitosamente`,
    });
  };

  const reportTypes = [
    {
      title: 'Reporte de Progreso Mensual',
      description: 'Análisis completo del rendimiento del último mes',
      icon: Calendar,
      period: 'mes'
    },
    {
      title: 'Reporte de Progreso Semanal',
      description: 'Análisis detallado del rendimiento de la última semana',
      icon: Calendar,
      period: 'semana'
    },
  ];

  const recentReports = [
    { name: 'Reporte Noviembre 2024', date: '2024-12-01', size: '2.1 MB' },
    { name: 'Reporte Semana 48', date: '2024-11-30', size: '1.8 MB' },
    { name: 'Reporte Octubre 2024', date: '2024-11-01', size: '2.3 MB' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Reportes
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Genera y gestiona reportes de rendimiento del paciente
        </p>
      </div>

      {/* Generate New Report */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Generar Nuevo Reporte
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Período del reporte
            </label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona el período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semana">Última semana</SelectItem>
                <SelectItem value="mes">Último mes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportTypes.map((report) => (
              <Card key={report.period} className={`border-2 transition-colors cursor-pointer ${
                selectedPeriod === report.period 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <report.icon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-1" />
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                        {report.title}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {report.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button onClick={handleGenerateReport} className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Generar y Descargar Reporte
          </Button>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Reportes Recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentReports.map((report, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                      {report.name}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {report.date} • {report.size}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reportes;
