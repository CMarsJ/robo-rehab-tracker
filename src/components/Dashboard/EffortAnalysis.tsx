
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

const effortData = [
  { time: '0min', nonParetic: 65, paretic: 45 },
  { time: '2min', nonParetic: 70, paretic: 50 },
  { time: '4min', nonParetic: 68, paretic: 55 },
  { time: '6min', nonParetic: 75, paretic: 48 },
  { time: '8min', nonParetic: 72, paretic: 52 },
  { time: '10min', nonParetic: 78, paretic: 58 },
  { time: '12min', nonParetic: 76, paretic: 60 },
  { time: '14min', nonParetic: 80, paretic: 55 },
];

const weeklyData = [
  { week: 'Semana anterior', nonParetic: 127, paretic: 164 },
  { week: 'Esta semana', nonParetic: 142, paretic: 178 },
];

export const EffortAnalysis = () => {
  return (
    <div className="space-y-6">
      {/* Muscle Effort Chart */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Análisis de Esfuerzo del Paciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={effortData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="time" 
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis 
                label={{ value: 'Intensidad (%)', angle: -90, position: 'insideLeft' }}
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="nonParetic" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Mano No Parética"
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="paretic" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="Mano Parética"
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Weekly Analysis */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Análisis del Paciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Tiempo promedio semanal de terapia
            </h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="week"
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis 
                  label={{ value: 'Minutos', angle: -90, position: 'insideLeft' }}
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="nonParetic" 
                  fill="#3b82f6" 
                  name="Mano No Parética"
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="paretic" 
                  fill="#ef4444" 
                  name="Mano Parética"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">142 min</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Mano No Parética</div>
              <div className="text-xs text-green-600 dark:text-green-400">+15 min vs semana anterior</div>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="text-lg font-bold text-red-600 dark:text-red-400">178 min</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Mano Parética</div>
              <div className="text-xs text-green-600 dark:text-green-400">+14 min vs semana anterior</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
