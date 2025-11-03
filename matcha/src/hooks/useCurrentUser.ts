import { useState, useEffect } from 'react';
import api from '../services/api';
import { Profile, backendUserToProfile } from '../types/profile';

export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      const response = await api.getCurrentUser();

      if (response.error || !response.data) {
        throw new Error(response.error || 'Failed to fetch current user');
      }

      const profile = backendUserToProfile(response.data);
      setCurrentUser(profile);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch current user');
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchCurrentUser();
  };

  return {
    currentUser,
    loading,
    error,
    refetch,
  };
}
