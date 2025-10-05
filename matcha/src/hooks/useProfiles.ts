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
      // Pour l'instant, on va utiliser l'endpoint nearby pour récupérer les profils
      // Plus tard, vous pourrez créer un endpoint dédié pour récupérer tous les profils
      const result = await api.getNearbyUsers(5000, 100); // Large radius pour avoir tous les utilisateurs
      
      if (result.error) {
        // Si erreur (ex: pas de localisation), on retourne un tableau vide sans erreur
        console.log('Could not fetch nearby users:', result.error);
        setProfiles([]);
        setLoading(false);
        return;
      }

      if (result.data && result.data.nearby_users) {
        // Transformer les données pour correspondre à BackendUserProfile
        const transformedProfiles: BackendUserProfile[] = await Promise.all(
          result.data.nearby_users.map(async (user) => {
            // Récupérer les stats de chaque utilisateur pour avoir le fame_rating
            const statsResult = await api.getProfileStats(user.user_id.toString());
            
            return {
              id: user.user_id,
              username: '', // Pas disponible dans nearby_users
              first_name: '', // Pas disponible dans nearby_users
              last_name: '', // Pas disponible dans nearby_users
              email: '',
              bio: user.bio || '',
              avatar_url: user.avatar_url,
              fame_rating: statsResult.data?.fame_rating || 0,
              tags: [],
              latitude: user.latitude,
              longitude: user.longitude,
            };
          })
        );

        setProfiles(transformedProfiles);
      }
    } catch (err) {
      console.error('Error fetching profiles:', err);
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
