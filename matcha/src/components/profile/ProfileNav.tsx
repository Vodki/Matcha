"use client";

import React from "react";

type ProfileNavProps = {
  onPrev: () => void;
  onNext: () => void;
  className?: string;
};

export default function ProfileNav({
  onPrev,
  onNext,
  className = "",
}: ProfileNavProps) {
  return (
    <div className={`absolute inset-0 z-20 pointer-events-none ${className}`}>
      <div className="flex h-full items-center justify-between px-2">
        <button
          type="button"
          aria-label="Profil précédent"
          onClick={onPrev}
          className="pointer-events-auto btn btn-circle btn-ghost h-10 w-10 rounded-full bg-base-100/70 text-xl leading-none backdrop-blur hover:bg-base-100"
        >
          ❮
        </button>
        <button
          type="button"
          aria-label="Profil suivant"
          onClick={onNext}
          className="pointer-events-auto btn btn-circle btn-ghost h-10 w-10 rounded-full bg-base-100/70 text-xl leading-none backdrop-blur hover:bg-base-100"
        >
          ❯
        </button>
      </div>
    </div>
  );
}
