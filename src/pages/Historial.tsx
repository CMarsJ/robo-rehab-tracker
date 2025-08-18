
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, FileText, Download, Search } from 'lucide-react';

const Historial = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const historialData = [
    {
      id: 1,
      title: 'Reporte Mensual - Noviembre 2024',
      date: '2024-12-01',
      type: 'Mensual',
      status: 'Completado',
      sessions: 28,
      avgDuration: '22 min',
      improvement: '+15%'
    },
    {
      id: 2,
      title: 'Reporte Semanal - Semana 48',
      date: '2024-11-30',
      type: 'Semanal',
      status: 'Completado',
      sessions: 7,
      avgDuration: '25 min',
      improvement: '+8%'
    },
    {
      id: 3,
      title: 'Reporte Mensual - Octubre 2024',
      date: '2024-11-01',
      type: 'Mensual',
      status: 'Completado',
      sessions: 26,
      avgDuration: '18 min',
      improvement: '+12%'
    },
    {
      id: 4,
      title: 'Reporte Semanal - Semana 44',
      date: '2024-10-30',
      type: 'Semanal',
      status: 'Completado',
      sessions: 6,
      avgDuration: '20 min',
      improvement: '+5%'
    },
    {
      id: 5,
      title: 'Reporte Mensual - Septiembre 2024',
      date: '2024-10-01',
      type: 'Mensual',
      status: 'Completado',
      sessions: 24,
      avgDuration: '16 min',
      improvement: '+18%'
    },
  ];

  const filteredData = historialData.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completado':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'En Progreso':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'Mensual' 
      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Historial
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Revisa todos los reportes y sesiones de terapia anteriores
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar reportes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historial List */}
      <div className="space-y-4">
        {filteredData.map((item) => (
          <Card key={item.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {item.title}
                      </h3>
                      <Badge className={getTypeColor(item.type)}>
                        {item.type}
                      </Badge>
                      <Badge className={getStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(item.date).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                      <span>•</span>
                      <span>{item.sessions} sesiones</span>
                      <span>•</span>
                      <span>Promedio: {item.avgDuration}</span>
                      <span>•</span>
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        Mejora: {item.improvement}
                      </span>
                    </div>
                  </div>
                </div>
                
                <Button variant="ghost" size="sm" className="shrink-0">
                  <Download className="w-4 h-4 mr-2" />
                  Descargar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredData.length === 0 && (
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No se encontraron reportes
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              No hay reportes que coincidan con tu búsqueda.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Historial;
