
import React, { useState, useEffect } from 'react'; 
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { DataService } from '@/services/dataService';
import { Ranking, GameRecord } from '@/types/database';

interface LegacyOrangeRanking {
  date: string;
  glasses: number;
  totalOranges: number;
  timePerGlass: number;
  timePerOrange: number;
  totalTime: number;
}

const GameRankings = () => {
  const [orangeRankings, setOrangeRankings] = useState<LegacyOrangeRanking[]>([]);
  const [neurolinkRankings, setNeurolinkRankings] = useState<Ranking[]>([]);
  const [flappyBirdRankings, setFlappyBirdRankings] = useState<Ranking[]>([]);
  const [neurolinkRecords, setNeurolinkRecords] = useState<GameRecord[]>([]);
  const [flappyBirdRecords, setFlappyBirdRecords] = useState<GameRecord[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    // Load legacy orange rankings from localStorage
    const rankings = JSON.parse(localStorage.getItem('orangeRankings') || '[]');
    setOrangeRankings(rankings.slice(0, 5));
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        // Migrate data first
        await DataService.migrateLocalStorageData();
        
        // Load NeuroLink data
        const neurolinkGameRecords = await DataService.getGameRecords('neurolink', 5);
        setNeurolinkRecords(neurolinkGameRecords);
        
        const neurolinkRankingData = await DataService.getRankings('neurolink', 5);
        setNeurolinkRankings(neurolinkRankingData);
        
        // Load Flappy Bird data
        const flappyGameRecords = await DataService.getGameRecords('flappy_bird', 5);
        setFlappyBirdRecords(flappyGameRecords);
        
        const flappyRankingData = await DataService.getRankings('flappy_bird', 5);
        setFlappyBirdRankings(flappyRankingData);
        
      } catch (error) {
        console.error('Error loading rankings:', error);
      }
    };
    
    loadData();
  }, [user]);

  const formatTime = (minutes: number) => {
    const mins = Math.floor(minutes);
    const secs = Math.round((minutes - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatRankingData = (records: GameRecord[]) => {
    return records.map(record => {
      const sessions = (record as any).sessions;
      const duration = sessions?.duracion_minutos || 1;
      const totalScore = record.total_oranges || 0;
      const pointsPerSecond = duration > 0 ? totalScore / (duration * 60) : 0;
      
      return {
        date: new Date(sessions?.fecha_inicio || record.created_at).toLocaleDateString(),
        totalScore: totalScore,
        pointsPerSecond: pointsPerSecond,
        totalRounds: record.total_glasses || 0,
        duration: duration
      };
    });
  };

  const neurolinkFormattedData = formatRankingData(neurolinkRecords);
  const flappyBirdFormattedData = formatRankingData(flappyBirdRecords);

  return (
    <div className="grid grid-cols-1 gap-6 mt-6">
      {/* Ranking Naranjas */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            🍊 Ranking - Exprimiendo Naranjas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Pos.</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-center">Vasos</TableHead>
                <TableHead className="text-center">Naranjas</TableHead>
                <TableHead className="text-center">Tiempo/Vaso</TableHead>
                <TableHead className="text-center">Tiempo/Naranja</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orangeRankings.length > 0 ? (
                orangeRankings.map((entry, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">#{index + 1}</TableCell>
                    <TableCell>{entry.date}</TableCell>
                    <TableCell className="text-center">{entry.glasses}</TableCell>
                    <TableCell className="text-center">{entry.totalOranges}</TableCell>
                    <TableCell className="text-center">{formatTime(entry.timePerGlass)}</TableCell>
                    <TableCell className="text-center">{formatTime(entry.timePerOrange)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No hay registros aún
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Ranking NeuroLink */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            🎯 Ranking - NeuroLink
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Pos.</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-center">Puntaje</TableHead>
                <TableHead className="text-center">Pts/Seg</TableHead>
                <TableHead className="text-center">Rondas</TableHead>
                <TableHead className="text-right">Duración</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {neurolinkFormattedData.length > 0 ? (
                neurolinkFormattedData.map((entry, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">#{index + 1}</TableCell>
                    <TableCell>{entry.date}</TableCell>
                    <TableCell className="text-center font-bold">{entry.totalScore}</TableCell>
                    <TableCell className="text-center">{entry.pointsPerSecond.toFixed(2)}</TableCell>
                    <TableCell className="text-center">{entry.totalRounds}</TableCell>
                    <TableCell className="text-right">{entry.duration}min</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    {user ? 'No hay registros aún' : 'Inicia sesión para ver rankings'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Ranking Flappy Bird */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            🐦 Ranking - Flappy Bird
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Pos.</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-center">Puntaje</TableHead>
                <TableHead className="text-center">Pts/Min</TableHead>
                <TableHead className="text-right">Duración</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flappyBirdFormattedData.length > 0 ? (
                flappyBirdFormattedData.map((entry, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">#{index + 1}</TableCell>
                    <TableCell>{entry.date}</TableCell>
                    <TableCell className="text-center font-bold">{entry.totalScore}</TableCell>
                    <TableCell className="text-center">{(entry.totalScore / entry.duration).toFixed(1)}</TableCell>
                    <TableCell className="text-right">{entry.duration}min</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    {user ? 'No hay registros aún' : 'Inicia sesión para ver rankings'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameRankings;
