
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Ranking {
  date: string;
  glasses: number;
}

const GameRankings = () => {
  const [orangeRankings, setOrangeRankings] = useState<Ranking[]>([]);

  useEffect(() => {
    const rankings = JSON.parse(localStorage.getItem('orangeRankings') || '[]');
    setOrangeRankings(rankings.slice(0, 5)); // Top 5
  }, []);

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
                <TableHead className="text-right">Vasos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orangeRankings.length > 0 ? (
                orangeRankings.map((entry, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">#{index + 1}</TableCell>
                    <TableCell>{entry.date}</TableCell>
                    <TableCell className="text-right">{entry.glasses}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No hay registros aún
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Ranking Rana */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            🐸 Ranking - Defensa de la Rana
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🐸</div>
            <p className="text-muted-foreground">Próximamente...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameRankings;
