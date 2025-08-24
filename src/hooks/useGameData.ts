
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SessionService } from '@/services/sessionService';
// Using sessions only - rankings disabled for now

export const useGameData = (gameType?: string) => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [rankings, setRankings] = useState<any[]>([]);
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
        // Load sessions
        const allSessions = await SessionService.getUserSessions(20);
        const filteredSessions = gameType ? 
          allSessions.filter(s => s.therapy_type === gameType) : 
          allSessions;
        setSessions(filteredSessions);
        
        // Load rankings if gameType specified
        if (gameType) {
          const rankingData = await SessionService.getTop5ByGame(gameType);
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
    gameData: any
  ) => {
    if (!gameType) return null;
    
    // Update session with game data instead of creating separate record
    const success = await SessionService.updateSessionWithTherapyData(sessionId, {
      state: 'completed',
      score: gameData.score || 0,
      orange_used: gameData.orange_used || 0,
      juice_used: gameData.juice_used || 0,
      stats: gameData.stats || {},
      details: gameData.details || {},
      extra_data: gameData.extra_data || null
    });
    
    if (success) {
      // Refresh data
      const updatedSessions = await SessionService.getUserSessions(20);
      setSessions(updatedSessions.filter(s => s.therapy_type === gameType));
    }
    
    return success;
  };

  return {
    gameRecords: sessions, // For compatibility
    rankings,
    loading,
    createGameRecord,
    refreshData: () => {
      if (user) {
        SessionService.getUserSessions(20).then(allSessions => {
          const filtered = gameType ? 
            allSessions.filter(s => s.therapy_type === gameType) : 
            allSessions;
          setSessions(filtered);
        });
        if (gameType) {
          SessionService.getTop5ByGame(gameType).then(setRankings);
        }
      }
    }
  };
};
