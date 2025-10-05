import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

interface ProfileStats {
  views: number;
  likes: number;
  fame_rating: number;
}

export function useFameRating(userId: string) {
  const [stats, setStats] = useState<ProfileStats>({
    views: 0,
    likes: 0,
    fame_rating: 0,
  });
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Récupérer les statistiques du profil
  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await api.getProfileStats(userId);
    
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (result.data) {
      setStats(result.data);
    }

    setLoading(false);
  }, [userId]);

  // Vérifier si l'utilisateur actuel a liké ce profil
  const fetchLikeStatus = useCallback(async () => {
    const result = await api.checkLikeStatus(userId);
    
    if (result.data) {
      setIsLiked(result.data.liked);
    }
  }, [userId]);

  // Enregistrer une vue de profil
  const recordView = useCallback(async () => {
    await api.recordProfileView(userId);
    // Rafraîchir les stats après avoir enregistré la vue
    fetchStats();
  }, [userId, fetchStats]);

  // Toggle like/unlike
  const toggleLike = useCallback(async () => {
    const result = await api.toggleProfileLike(userId);
    
    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.data) {
      setIsLiked(result.data.liked);
      // Rafraîchir les stats après le toggle
      fetchStats();
    }
  }, [userId, fetchStats]);

  // Charger les données initiales
  useEffect(() => {
    fetchStats();
    fetchLikeStatus();
  }, [fetchStats, fetchLikeStatus]);

  return {
    stats,
    isLiked,
    loading,
    error,
    recordView,
    toggleLike,
    refreshStats: fetchStats,
  };
}
