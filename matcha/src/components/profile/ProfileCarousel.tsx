"use client";

import React from "react";
import type { Profile } from "../../types/profile";
import ProfileCard from "./ProfileCard";
import ProfileNav from "./ProfileNav";

type ProfileCarouselProps = {
  title: string;
  profiles: Profile[];
  className?: string;
  onSeeProfile?: (profile: Profile) => void;
  emptyLabel?: string;
};

export default function ProfileCarousel({
  title,
  profiles,
  className = "",
  onSeeProfile,
  emptyLabel = "Aucun profil à afficher.",
}: ProfileCarouselProps) {
  const [active, setActive] = React.useState(0);
  const count = profiles.length;

  const prev = React.useCallback(
    () => setActive((v) => (v - 1 + count) % count),
    [count]
  );
  const next = React.useCallback(
    () => setActive((v) => (v + 1) % count),
    [count]
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  };

  if (count === 0) {
    return (
      <div className={`h-full flex flex-col ${className}`}>
        <div className="mt-5 ms-5 text-sm font-semibold">{title}</div>
        <div className="relative mt-4 flex-1">
          <div className="alert h-full flex items-center justify-center">
            <span>{emptyLabel}</span>
          </div>
        </div>
      </div>
    );
  }

  const profile = profiles[active];

  return (
    <div
      className={`h-full flex flex-col ${className}`}
      tabIndex={0}
      role="region"
      aria-label={title}
      onKeyDown={onKeyDown}
    >
      <div className="mt-5 ms-5 text-sm font-semibold">{title}</div>
      <div className="relative mt-4 flex-1">
        <ProfileNav onPrev={prev} onNext={next} />
        <div className="h-full flex flex-col">
          <ProfileCard
            key={profile.id}
            profile={profile}
            onSeeProfile={onSeeProfile}
          />
          <div className="mt-3 text-center text-sm opacity-70">
            {active + 1} / {count}
          </div>
        </div>
      </div>
    </div>
  );
}
