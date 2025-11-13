import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Profile } from '../types/profile';

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
  const [viewers, setViewers] = useState<any[]>([]);
  const [likers, setLikers] = useState<any[]>([]);
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

  // Récupérer la liste des utilisateurs qui ont vu ce profil
  const fetchViewers = useCallback(async () => {
    const result = await api.getProfileViewers(userId);
    
    if (result.data?.viewers) {
      setViewers(result.data.viewers);
    }
  }, [userId]);

  // Récupérer la liste des utilisateurs qui ont liké ce profil
  const fetchLikers = useCallback(async () => {
    const result = await api.getProfileLikers(userId);
    
    if (result.data?.likers) {
      setLikers(result.data.likers);
    }
  }, [userId]);

  // Enregistrer une vue de profil
  const recordView = useCallback(async () => {
    await api.recordProfileView(userId);
    // Rafraîchir les stats et les viewers après avoir enregistré la vue
    fetchStats();
    fetchViewers();
  }, [userId, fetchStats, fetchViewers]);

  // Toggle like/unlike
  const toggleLike = useCallback(async () => {
    const result = await api.toggleProfileLike(userId);
    
    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.data) {
      setIsLiked(result.data.liked);
      // Rafraîchir les stats et les likers après le toggle
      fetchStats();
      fetchLikers();
    }
  }, [userId, fetchStats, fetchLikers]);

  // Charger les données initiales
  useEffect(() => {
    fetchStats();
    fetchLikeStatus();
    fetchViewers();
    fetchLikers();
  }, [fetchStats, fetchLikeStatus, fetchViewers, fetchLikers]);

  return {
    stats,
    isLiked,
    viewers,
    likers,
    loading,
    error,
    recordView,
    toggleLike,
    refreshStats: fetchStats,
  };
}
