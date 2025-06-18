
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Eye, Download, Calendar } from 'lucide-react';
import { useTranslation } from '@/contexts/AppContext';

const History = () => {
  const t = useTranslation();

  const historyData = [
    {
      id: 1,
      type: 'Reporte Mensual',
      period: 'Mayo 2024',
      date: '2024-05-31',
      size: '5.1 MB',
      sessions: 28,
      avgEffort: 72
    },
    {
      id: 2,
      type: 'Reporte Semanal',
      period: 'Semana 24',
      date: '2024-06-10',
      size: '2.1 MB',
      sessions: 6,
      avgEffort: 68
    },
    {
      id: 3,
      type: 'Reporte Semanal',
      period: 'Semana 23',
      date: '2024-06-03',
      size: '2.0 MB',
      sessions: 7,
      avgEffort: 65
    },
    {
      id: 4,
      type: 'Reporte Mensual',
      period: 'Abril 2024',
      date: '2024-04-30',
      size: '4.8 MB',
      sessions: 25,
      avgEffort: 63
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">{t.history}</h1>
        <p className="text-muted-foreground">
          Revisa los reportes generados anteriormente y el progreso histórico
        </p>
      </div>

      <div className="grid gap-4">
        {historyData.map((item) => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{item.type}</h3>
                    <p className="text-muted-foreground">{item.period}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {item.date}
                      </span>
                      <span>{item.size}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right space-y-2">
                  <div className="text-sm text-muted-foreground">
                    <div>{item.sessions} sesiones</div>
                    <div>Esfuerzo promedio: {item.avgEffort}%</div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      Ver
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Descargar
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Barra de progreso del esfuerzo */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Esfuerzo Promedio</span>
                  <span>{item.avgEffort}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-medical-green to-medical-blue h-2 rounded-full"
                    style={{ width: `${item.avgEffort}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default History;
