"use client";

import React, { useEffect, useState } from "react";
import type { Profile } from "../../types/profile";
import {
  exampleProfiles,
  profilesThatLiked,
} from "../dataExample/profile.example";
import FameRating from "./FameRating";
import ProfileCarousel from "./ProfileCarousel";
import api from "../../services/api";

type StatsInformationProps = {
  onSeeProfile?: (profile: Profile) => void;
};

export default function StatsInformation({
  onSeeProfile,
}: StatsInformationProps) {
  const [stats, setStats] = useState({ views: 0, likes: 0, fame_rating: 0 });
  const [loading, setLoading] = useState(true);

  // Récupérer l'utilisateur connecté et ses statistiques
  useEffect(() => {
    const fetchCurrentUserStats = async () => {
      setLoading(true);
      
      // Récupérer l'utilisateur connecté
      const userResult = await api.getCurrentUser();
      
      if (userResult.error || !userResult.data) {
        console.error("Error fetching current user:", userResult.error);
        setLoading(false);
        return;
      }

      const userId = userResult.data.id.toString();

      // Récupérer les statistiques
      const statsResult = await api.getProfileStats(userId);
      
      if (statsResult.data) {
        setStats(statsResult.data);
      }
      
      setLoading(false);
    };

    fetchCurrentUserStats();
  }, []);

  // Utiliser les données mockées pour les carousels (pour l'instant)
  const viewsCount = exampleProfiles.length;
  const likesCount = profilesThatLiked.length;

  return (
    <section className="min-w-0">
      <h2 className="text-xl font-semibold">✨ Stats ✨</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 items-stretch">
        <ProfileCarousel
          title="Who saw your profile 👀"
          profiles={exampleProfiles}
          onSeeProfile={onSeeProfile}
        />
        <ProfileCarousel
          title="Who liked your profile"
          profiles={profilesThatLiked}
          onSeeProfile={onSeeProfile}
        />
      </div>
      <div className="mt-4">
        {loading ? (
          <div className="flex justify-center items-center p-4">
            <span className="loading loading-spinner loading-md"></span>
          </div>
        ) : (
          <FameRating views={stats.views} likes={stats.likes} />
        )}
      </div>
    </section>
  );
}
