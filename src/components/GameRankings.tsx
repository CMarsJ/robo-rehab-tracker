import React, { useState, useEffect } from 'react'; 
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { SessionService } from '@/services/sessionService';
import { useTranslation } from '@/contexts/AppContext';

const GameRankings = () => {
  const t = useTranslation();
  const [orangeRankings, setOrangeRankings] = useState<any[]>([]);
  const [neurolinkRankings, setNeurolinkRankings] = useState<any[]>([]);
  const [flappyBirdRankings, setFlappyBirdRankings] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load all rankings from dedicated Supabase tables
        const orangeData = await SessionService.getOrangeSqueezeRankings();
        setOrangeRankings(orangeData);
        
        const neurolinkData = await SessionService.getNeuroLinkRankings();
        setNeurolinkRankings(neurolinkData);
        
        const flappyData = await SessionService.getFlappyBirdRankings();
        setFlappyBirdRankings(flappyData);
        
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
                <TableHead className="text-right">{t.duration}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {neurolinkRankings.length > 0 && neurolinkRankings.some(s => s.user_id) ? (
                neurolinkRankings.filter(s => s.user_id).map((entry, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">#{entry.position}</TableCell>
                    <TableCell>{entry.start_time ? new Date(entry.start_time).toLocaleDateString(t.locale) : '-'}</TableCell>
                    <TableCell className="text-center font-bold">{entry.score}</TableCell>
                    <TableCell className="text-center">{Number(entry.points_per_second).toFixed(2)}</TableCell>
                    <TableCell className="text-right">{Math.floor(entry.duration / 60000)}{t.minutes}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    {t.noRecords}
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
              {flappyBirdRankings.length > 0 && flappyBirdRankings.some(s => s.user_id) ? (
                flappyBirdRankings.filter(s => s.user_id).map((entry, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">#{entry.position}</TableCell>
                    <TableCell>{entry.start_time ? new Date(entry.start_time).toLocaleDateString(t.locale) : '-'}</TableCell>
                    <TableCell className="text-center font-bold">{entry.score}</TableCell>
                    <TableCell className="text-center">{Number(entry.points_per_minute).toFixed(1)}</TableCell>
                    <TableCell className="text-right">{Math.floor(entry.duration / 60000)}{t.minutes}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    {t.noRecords}
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