
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DataService } from '@/services/dataService';
import { GameRecord, Ranking } from '@/types/database';

export const useGameData = (gameType?: string) => {
  const [gameRecords, setGameRecords] = useState<GameRecord[]>([]);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      
      try {
        // Run migration first
        await DataService.migrateLocalStorageData();
        
        // Load game records
        const records = await DataService.getGameRecords(gameType);
        setGameRecords(records);
        
        // Load rankings if gameType specified
        if (gameType) {
          const rankingData = await DataService.getRankings(gameType);
          setRankings(rankingData);
        }
      } catch (error) {
        console.error('Error loading game data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, gameType]);

  const createGameRecord = async (
    sessionId: string,
    gameData: Partial<GameRecord>
  ) => {
    if (!gameType) return null;
    
    const record = await DataService.createGameRecord(sessionId, gameType, gameData);
    if (record) {
      setGameRecords(prev => [record, ...prev]);
      
      // Update ranking if score improved
      if (gameData.total_oranges) {
        await DataService.updateRanking(gameType, gameData.total_oranges, gameData);
        const updatedRankings = await DataService.getRankings(gameType);
        setRankings(updatedRankings);
      }
    }
    return record;
  };

  return {
    gameRecords,
    rankings,
    loading,
    createGameRecord,
    refreshData: () => {
      if (user) {
        DataService.getGameRecords(gameType).then(setGameRecords);
        if (gameType) {
          DataService.getRankings(gameType).then(setRankings);
        }
      }
    }
  };
};
