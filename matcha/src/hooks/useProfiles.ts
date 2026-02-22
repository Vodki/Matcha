import { useState, useEffect, useRef } from "react";
import api from "../services/api";
import { BackendUserProfile } from "../types/profile";
import { websocketService } from "../services/websocket";

export function useProfiles(filters?: {
  minAge?: number;
  maxAge?: number;
  minFame?: number;
  maxDistance?: number;
  tags?: string[];
}) {
  const [profiles, setProfiles] = useState<BackendUserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filtersKey = JSON.stringify(filters);

  const requestIdRef = useRef(0);

  useEffect(() => {
    const fetchProfiles = async () => {
      const currentRequestId = ++requestIdRef.current;

      setLoading(true);
      setError(null);

      const currentFilters = filtersKey ? JSON.parse(filtersKey) : undefined;

      try {
        const result = await api.getSuggestions(currentFilters);

        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        if (result.error) {
          console.error("API Error:", result.error);
          setError(result.error);
          setProfiles([]);
          setLoading(false);
          return;
        }

        if (result.data && result.data.users) {
          setProfiles(result.data.users);
        }
      } catch (err) {
        if (currentRequestId !== requestIdRef.current) {
          return;
        }
        console.error("Error fetching profiles:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch profiles",
        );
        setProfiles([]);
      }

      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [filtersKey]);

  useEffect(() => {
    const handleUserOnline = (data: unknown) => {
      const { user_id } = data as { user_id: number };
      setProfiles((prev) =>
        prev.map((profile) =>
          profile.id === user_id
            ? {
                ...profile,
                is_online: true,
                last_seen: new Date().toISOString(),
              }
            : profile,
        ),
      );
    };

    const handleUserOffline = (data: unknown) => {
      const { user_id } = data as { user_id: number };
      setProfiles((prev) =>
        prev.map((profile) =>
          profile.id === user_id
            ? {
                ...profile,
                is_online: false,
                last_seen: new Date().toISOString(),
              }
            : profile,
        ),
      );
    };

    const unsubOnline = websocketService.on("user_online", handleUserOnline);
    const unsubOffline = websocketService.on("user_offline", handleUserOffline);

    return () => {
      unsubOnline();
      unsubOffline();
    };
  }, []);

  return {
    profiles,
    loading,
    error,
    refreshProfiles: () => {
      requestIdRef.current++;
      const currentFilters = filtersKey ? JSON.parse(filtersKey) : undefined;
      api.getSuggestions(currentFilters).then((result) => {
        if (result.data && result.data.users) {
          setProfiles(result.data.users);
        }
      });
    },
  };
}
