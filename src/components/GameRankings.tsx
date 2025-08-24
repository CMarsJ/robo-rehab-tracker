import React, { useState, useEffect } from 'react'; 
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { SessionService } from '@/services/sessionService';

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
  const [neurolinkSessions, setNeurolinkSessions] = useState<any[]>([]);
  const [flappyBirdSessions, setFlappyBirdSessions] = useState<any[]>([]);
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
        // Load NeuroLink sessions
        const neurolinkData = await SessionService.getTop5ByGame('neurolink');
        setNeurolinkSessions(neurolinkData);
        
        // Load Flappy Bird sessions
        const flappyData = await SessionService.getTop5ByGame('flappy_bird');
        setFlappyBirdSessions(flappyData);
        
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

  const formatSessionData = (sessions: any[]) => {
    return sessions.map(session => {
      const duration = session.duration || 1;
      const score = session.score || 0;
      const pointsPerSecond = duration > 0 ? score / (duration * 60) : 0;
      
      return {
        date: new Date(session.start_time).toLocaleDateString(),
        totalScore: score,
        pointsPerSecond: pointsPerSecond,
        orangeUsed: session.orange_used || 0,
        juiceUsed: session.juice_used || 0,
        duration: duration
      };
    });
  };

  const neurolinkFormattedData = formatSessionData(neurolinkSessions);
  const flappyBirdFormattedData = formatSessionData(flappyBirdSessions);

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
                <TableHead className="text-center">Naranjas</TableHead>
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
                    <TableCell className="text-center">{entry.orangeUsed}</TableCell>
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