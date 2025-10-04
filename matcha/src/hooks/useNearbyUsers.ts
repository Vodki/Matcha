import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export interface NearbyUser {
  user_id: number;
  avatar_url?: string;
  bio?: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  updated_at: string;
  distance_km: number;
}

export interface NearbyUsersData {
  nearby_users: NearbyUser[];
  count: number;
  radius_km: number;
  your_location: {
    latitude: number;
    longitude: number;
  };
}

export function useNearbyUsers(radius: number = 200, limit: number = 50) {
  const [data, setData] = useState<NearbyUsersData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const fetchNearbyUsers = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const result = await api.getNearbyUsers(radius, limit);

      if (result.error) {
        setError(result.error);
        setData(null);
      } else if (result.data) {
        setData(result.data);
      }
    } catch (err) {
      console.error('Error fetching nearby users:', err);
      setError('Failed to fetch nearby users');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [radius, limit]);

  useEffect(() => {
    fetchNearbyUsers();
  }, [fetchNearbyUsers]);

  return {
    data,
    loading,
    error,
    refetch: fetchNearbyUsers,
  };
}
