"use client";

import React from "react";

type FameRatingProps = {
  views: number;
  likes: number;
  smoothing?: boolean;
  className?: string;
};

function computeLikeRate(views: number, likes: number, smoothing = true) {
  if (views <= 0 && likes <= 0) return 0;
  const num = likes / views;
  if (num < 0 || isNaN(num)) return 0;
  return Math.min(1, num);
}

function labelForRate(rate: number) {
  if (rate >= 0.35) return { label: "Excellent", color: "success" };
  if (rate >= 0.2) return { label: "Bon", color: "primary" };
  if (rate >= 0.1) return { label: "Correct", color: "warning" };
  return { label: "Faible", color: "neutral" };
}

export default function FameRating({
  views,
  likes,
  smoothing = true,
  className = "",
}: FameRatingProps) {
  const likeRate = computeLikeRate(views, likes, smoothing);
  const { label, color } = labelForRate(likeRate);

  const percentage = Math.round(likeRate * 100);
  const vlr = likes > 0 ? views / likes : Infinity;
  return (
    <section
      className={`rounded-box bg-base-100 shadow-sm ring-1 ring-base-200/50 p-4 sm:p-5 ${className}`}
      aria-label="Indicateur de notoriété du profil"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium">Fame rating</h3>
        </div>
        <span className={`badge badge-${color} badge-sm`}>{label}</span>
      </div>

      <div className="mt-3">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold tabular-nums">
            {percentage}%
          </span>
        </div>
        <progress
          className={`progress progress-${color} w-full`}
          value={percentage}
          max={100}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percentage}
          aria-label="Like Rate"
        />
      </div>
    </section>
  );
}
