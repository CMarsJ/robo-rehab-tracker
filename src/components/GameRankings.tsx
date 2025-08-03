
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Ranking {
  date: string;
  glasses: number;
  timePerGlass: number;
  totalTime: number;
}

interface FruitZapRanking {
  date: string;
  totalScore: number;
  pointsPerSecond: number;
  totalRounds: number;
  duration: number;
}

const GameRankings = () => {
  const [orangeRankings, setOrangeRankings] = useState<Ranking[]>([]);
  const [fruitZapRankings, setFruitZapRankings] = useState<FruitZapRanking[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const rankings = JSON.parse(localStorage.getItem('orangeRankings') || '[]');
    setOrangeRankings(rankings.slice(0, 5)); // Top 5
  }, []);

  useEffect(() => {
    const loadFruitZapRankings = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('game_records')
          .select(`
            *,
            sessions!inner(fecha_inicio, duracion_minutos)
          `)
          .eq('user_id', user.id)
          .eq('game_type', 'neurolink')
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (!error && data) {
          const rankings = data.map(record => {
            const duration = record.sessions?.duracion_minutos || 1;
            const totalScore = record.total_oranges || 0;
            const pointsPerSecond = duration > 0 ? totalScore / (duration * 60) : 0;
            
            return {
              date: new Date(record.sessions.fecha_inicio).toLocaleDateString(),
              totalScore: totalScore,
              pointsPerSecond: pointsPerSecond,
              totalRounds: record.total_glasses || 0,
              duration: duration
            };
          });
          
          setFruitZapRankings(rankings);
        }
      } catch (error) {
        console.error('Error loading NeuroLink rankings:', error);
      }
    };
    
    loadFruitZapRankings();
  }, [user]);

  const formatTime = (minutes: number) => {
    const mins = Math.floor(minutes);
    const secs = Math.round((minutes - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      {/* Ranking Naranjas */}
      <Card>
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
                <TableHead className="text-right">Tiempo/Vaso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orangeRankings.length > 0 ? (
                orangeRankings.map((entry, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">#{index + 1}</TableCell>
                    <TableCell>{entry.date}</TableCell>
                    <TableCell className="text-center">{entry.glasses}</TableCell>
                    <TableCell className="text-right">{formatTime(entry.timePerGlass)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No hay registros aún
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Ranking NeuroLink */}
      <Card>
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
              {fruitZapRankings.length > 0 ? (
                fruitZapRankings.map((entry, index) => (
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
    </div>
  );
};

export default GameRankings;
