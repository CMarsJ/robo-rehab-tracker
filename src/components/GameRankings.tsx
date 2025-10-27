import React, { useState, useEffect } from 'react'; 
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { SessionService } from '@/services/sessionService';
import { useTranslation } from '@/contexts/AppContext';

interface LegacyOrangeRanking {
  date: string;
  glasses: number;
  totalOranges: number;
  timePerGlass: number;
  timePerOrange: number;
  totalTime: number;
}

const GameRankings = () => {
  const t = useTranslation();
  const [orangeRankings, setOrangeRankings] = useState<any[]>([]);
  const [neurolinkSessions, setNeurolinkSessions] = useState<any[]>([]);
  const [flappyBirdSessions, setFlappyBirdSessions] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load Orange Squeeze rankings from Supabase
        const orangeData = await SessionService.getOrangeSqueezeRankings();
        setOrangeRankings(orangeData);
        
        if (!user) return;
        
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

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
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
            🍊 {t.rankingOrangeSqueeze}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">{t.position}</TableHead>
                <TableHead>{t.date}</TableHead>
                <TableHead className="text-center">{t.glasses}</TableHead>
                <TableHead className="text-center">{t.oranges}</TableHead>
                <TableHead className="text-center">{t.timePerGlass}</TableHead>
                <TableHead className="text-center">{t.timePerOrange}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orangeRankings.length > 0 ? (
                orangeRankings.map((entry, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">#{entry.position}</TableCell>
                    <TableCell>{new Date(entry.start_time).toLocaleDateString(t.locale)}</TableCell>
                    <TableCell className="text-center">{entry.juice_used}</TableCell>
                    <TableCell className="text-center">{entry.orange_used}</TableCell>
                    <TableCell className="text-center">{formatTime(entry.time_orange * 4)}</TableCell>
                    <TableCell className="text-center">{formatTime(entry.time_orange)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    {t.noRecords}
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
            🎯 {t.rankingNeuroLink}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">{t.position}</TableHead>
                <TableHead>{t.date}</TableHead>
                <TableHead className="text-center">{t.score}</TableHead>
                <TableHead className="text-center">{t.pointsPerSecond}</TableHead>
                <TableHead className="text-center">{t.oranges}</TableHead>
                <TableHead className="text-right">{t.duration}</TableHead>
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
                    <TableCell className="text-right">{entry.duration}{t.minutes}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    {user ? t.noRecords : t.loginToViewRankings}
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
            🐦 {t.rankingFlappyBird}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">{t.position}</TableHead>
                <TableHead>{t.date}</TableHead>
                <TableHead className="text-center">{t.score}</TableHead>
                <TableHead className="text-center">{t.pointsPerMinute}</TableHead>
                <TableHead className="text-right">{t.duration}</TableHead>
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
                    <TableCell className="text-right">{entry.duration}{t.minutes}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    {user ? t.noRecords : t.loginToViewRankings}
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