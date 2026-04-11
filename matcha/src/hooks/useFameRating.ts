import { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import { Profile, backendUserToProfile } from "../types/profile";

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
  const [likedBack, setLikedBack] = useState(false);
  const [viewers, setViewers] = useState<any[]>([]);
  const [likers, setLikers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const fetchLikeStatus = useCallback(async () => {
    const result = await api.checkLikeStatus(userId);

    if (result.data) {
      setIsLiked(result.data.liked);
      setLikedBack(result.data.liked_back);
    }
  }, [userId]);

  const fetchViewers = useCallback(async () => {
    const result = await api.getProfileViewers(userId);

    if (result.data?.viewers) {
      const transformedViewers = result.data.viewers.map((viewer: any) =>
        backendUserToProfile(viewer),
      );
      setViewers(transformedViewers);
    }
  }, [userId]);

  const fetchLikers = useCallback(async () => {
    const result = await api.getProfileLikers(userId);

    if (result.data?.likers) {
      const transformedLikers = result.data.likers.map((liker: any) =>
        backendUserToProfile(liker),
      );
      setLikers(transformedLikers);
    }
  }, [userId]);

  const recordView = useCallback(async () => {
    await api.recordProfileView(userId);
    fetchStats();
    fetchViewers();
  }, [userId, fetchStats, fetchViewers]);

  const toggleLike = useCallback(async () => {
    const result = await api.toggleProfileLike(userId);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.data) {
      setIsLiked(result.data.liked);
      fetchStats();
      fetchLikers();
    }
  }, [userId, fetchStats, fetchLikers]);

  useEffect(() => {
    fetchStats();
    fetchLikeStatus();
    fetchViewers();
    fetchLikers();
  }, [fetchStats, fetchLikeStatus, fetchViewers, fetchLikers]);

  return {
    stats,
    isLiked,
    likedBack,
    viewers,
    likers,
    loading,
    error,
    recordView,
    toggleLike,
    refreshStats: fetchStats,
  };
}
