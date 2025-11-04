import { useState, useEffect } from 'react';
import api from '../services/api';
import { Profile, backendUserToProfile } from '../types/profile';

export function useUserProfile(userId: string) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await api.getUserById(userId);

        if (response.error || !response.data) {
          throw new Error(response.error || 'Failed to fetch user profile');
        }

        const profile = backendUserToProfile(response.data);
        setProfile(profile);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch user profile');
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  return {
    profile,
    loading,
    error,
  };
}
