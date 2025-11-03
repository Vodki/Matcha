import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { BackendUserProfile } from '../types/profile';

export function useProfiles() {
  const [profiles, setProfiles] = useState<BackendUserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await api.getAllUsers();
      
      if (result.error) {
        setError(result.error);
        setProfiles([]);
        setLoading(false);
        return;
      }

      if (result.data && result.data.users) {
        setProfiles(result.data.users);
      }
    } catch (err) {
      console.error('Error fetching profiles:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch profiles');
      setProfiles([]);
    }

    setLoading(false);
  }, []);

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
