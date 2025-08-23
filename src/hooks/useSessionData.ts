import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SessionService, SessionResponse } from '@/services/sessionService';
import { Session, GameScore } from '@/types/database';

export const useSessionData = () => {
  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const { user } = useAuth();

  const loadSessions = async (
    filters: {
      therapy_type?: string;
      game_type?: string;
      mode?: 'timer' | 'game';
      date_from?: string;
      date_to?: string;
      search?: string;
    } = {},
    page = 1,
    pageSize = 20,
    append = false
  ) => {
    if (!user) return;

    setLoading(true);
    try {
      const sessionsResult = await SessionService.getUserSessions(pageSize);
      const sessions = sessionsResult || [];
      
      if (append) {
        setSessions(prev => [...prev, ...sessions]);
      } else {
        setSessions(sessions);
      }
      
      setTotalCount(sessions.length);
      setHasMore(sessions.length >= pageSize);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshSessions = () => {
    if (user) {
      loadSessions();
    }
  };

  return {
    sessions,
    loading,
    totalCount,
    hasMore,
    loadSessions,
    refreshSessions
  };
};

export const useRankings = (gameType?: string) => {
  const [rankings, setRankings] = useState<GameScore[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const loadRankings = async () => {
    if (!gameType || !user) return;

    setLoading(true);
    try {
      const result = await SessionService.getTop5ByGame(gameType);
      // Mapear SessionResponse a GameScore
      const mappedRankings: GameScore[] = result.map(session => ({
        id: session.id,
        user_id: session.user_id,
        game_type: session.therapy_type,
        score: session.score || 0,
        created_at: session.start_time
      }));
      setRankings(mappedRankings);
    } catch (error) {
      console.error('Error loading rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRankings();
  }, [gameType, user]);

  return {
    rankings,
    loading,
    refreshRankings: loadRankings
  };
};