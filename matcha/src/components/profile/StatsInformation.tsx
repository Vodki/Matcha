"use client";

import React, { useEffect, useState } from "react";
import type { Profile } from "../../types/profile";
import FameRating from "./FameRating";
import ProfileCarousel from "./ProfileCarousel";
import { useFameRating } from "../../hooks/useFameRating";
import { useCurrentUser } from "../../hooks/useCurrentUser";

type StatsInformationProps = {
  userId?: string;
  onSeeProfile?: (profile: Profile) => void;
};

export default function StatsInformation({
  userId: userIdProp,
  onSeeProfile,
}: StatsInformationProps) {
  const { currentUser } = useCurrentUser();
  const userId = userIdProp || currentUser?.id || "";
  const { stats, viewers, likers, loading } = useFameRating(userId);

  return (
    <section className="min-w-0">
      <h2 className="text-xl font-semibold">✨ Stats ✨</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 items-stretch">
        <ProfileCarousel
          title="Who saw your profile 👀"
          profiles={viewers}
          onSeeProfile={onSeeProfile}
        />
        <ProfileCarousel
          title="Who liked your profile"
          profiles={likers}
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
