"use client";

import React from "react";
import type { Profile } from "../types/profile";
import ImageGallery from "./ImageGallery";

type ProfileCardProps = {
  profile: Profile;
  onSeeProfile?: (profile: Profile) => void;
};

export default function ProfileCard({
  profile,
  onSeeProfile,
}: ProfileCardProps) {
  const name = `${profile.firstName} ${profile.lastName}`;

  return (
    <div className="card card-compact bg-base-100 shadow-md">
      <ImageGallery images={profile.images} name={name} />
      <div className="card-body min-h-75">
        <h2 className="card-title">{name}</h2>
        <p className="text-sm opacity-80">
          {profile.gender}, {profile.preferences}
        </p>
        <p className="mt-2">{profile.bio}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {profile.interests.map((tag) => (
            <span key={tag} className="badge badge-outline">
              {tag}
            </span>
          ))}
        </div>
        <div className="card-actions justify-end mt-4">
          <button
            className="btn btn-primary"
            onClick={() => onSeeProfile?.(profile)}
          >
            See profile
          </button>
        </div>
      </div>
    </div>
  );
}
