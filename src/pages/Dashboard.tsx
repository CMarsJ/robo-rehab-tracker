
import { HandVisualization } from '@/components/Dashboard/HandVisualization';
import { TherapyTimer } from '@/components/Dashboard/TherapyTimer';
import { AchievementsProgress } from '@/components/Dashboard/AchievementsProgress';
import { EffortAnalysis } from '@/components/Dashboard/EffortAnalysis';

const Dashboard = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Sistema de Monitoreo y Control
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Rehabilitación Robótica Bilateral Post-ACV
        </p>
      </div>

      {/* Hand Visualization */}
      <HandVisualization />

      {/* Timer and Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TherapyTimer />
        <AchievementsProgress />
      </div>

      {/* Effort Analysis */}
      <EffortAnalysis />
    </div>
  );
};

export default Dashboard;
