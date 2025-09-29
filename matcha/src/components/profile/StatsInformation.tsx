"use client";

import React from "react";
import type { Profile } from "../../types/profile";
import {
  exampleProfiles,
  profilesThatLiked,
} from "../dataExample/profile.example";
import FameRating from "./FameRating";
import ProfileCarousel from "./ProfileCarousel";

type StatsInformationProps = {
  onSeeProfile?: (profile: Profile) => void;
};

export default function StatsInformation({
  onSeeProfile,
}: StatsInformationProps) {
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
        <FameRating views={viewsCount} likes={likesCount} />
      </div>
    </section>
  );
}
