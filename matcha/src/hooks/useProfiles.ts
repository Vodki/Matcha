import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { BackendUserProfile } from '../types/profile';

export function useProfiles(filters?: {
  minAge?: number;
  maxAge?: number;
  minFame?: number;
  maxDistance?: number;
}) {
  const [profiles, setProfiles] = useState<BackendUserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("=== DEBUG useProfiles - Fetching suggestions with filters:", filters);
      const result = await api.getSuggestions(filters);
      
      console.log("API Response:", result);
      
      if (result.error) {
        console.error("API Error:", result.error);
        setError(result.error);
        setProfiles([]);
        setLoading(false);
        return;
      }

      if (result.data && result.data.users) {
        console.log("Received users count:", result.data.users.length);
        console.log("First 3 users:", result.data.users.slice(0, 3));
        setProfiles(result.data.users);
      }
    } catch (err) {
      console.error('Error fetching profiles:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch profiles');
      setProfiles([]);
    }

    setLoading(false);
  }, [filters?.minAge, filters?.maxAge, filters?.minFame, filters?.maxDistance]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  return {
    profiles,
    loading,
    error,
    refreshProfiles: fetchProfiles,
  };
}

