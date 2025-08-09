"use client";

import React, { JSX } from "react";
import type { Profile } from "../types/profile";
import ProfileCard from "./ProfileCard";
import ProfileNav from "./ProfileNav";

type StatsInformationProps = {
  profiles: Profile[];
  className?: string;
  onSeeProfile?: (profile: Profile) => void;
};

export default function StatsInformation({
  profiles,
  className = "w-full md:w-1/2",
  onSeeProfile,
}: StatsInformationProps): JSX.Element {
  const [active, setActive] = React.useState<number>(0);
  const count = profiles.length;

  const prevProfile = React.useCallback(
    () => setActive((v) => (v - 1 + count) % count),
    [count]
  );
  const nextProfile = React.useCallback(
    () => setActive((v) => (v + 1) % count),
    [count]
  );

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevProfile();
      if (e.key === "ArrowRight") nextProfile();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prevProfile, nextProfile]);

  if (count === 0) {
    return (
      <div className={`relative mt-4 ${className}`}>
        <div className="alert">
          <span>Aucun profil à afficher.</span>
        </div>
      </div>
    );
  }

  const profile = profiles[active];

  return (
    <>
      <div className="mt-10 md:mt-0 text-xl font-extrabold">✨ Stats ✨</div>
      <div className="mt-5 ms-5 text-sm font-semibold">
        Who saw your profile 👀
      </div>

      <div className={`relative mt-4 ${className}`}>
        <ProfileNav onPrev={prevProfile} onNext={nextProfile} />
        <ProfileCard
          key={profile.id}
          profile={profile}
          onSeeProfile={onSeeProfile}
        />
        <div className="mt-3 text-center text-sm opacity-70">
          {active + 1} / {count}
        </div>
      </div>
    </>
  );
}
