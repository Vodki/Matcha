"use client";

/* eslint-disable @next/next/no-img-element */
import React, { useMemo, useState } from "react";
import { backendUserToProfile } from "../../types/profile";
import { useProfiles } from "../../hooks/useProfiles";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { getImageUrl } from "../../services/api";
import Link from "next/link";

type OrientationStr = "likes men" | "likes women" | "likes men and women";

const today = new Date();
function ageFromBirthdate(d: Date) {
  const a = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  return m < 0 || (m === 0 && today.getDate() < d.getDate()) ? a - 1 : a;
}

function normalizeTag(t: string) {
  return t.trim().replace(/^#/, "").toLowerCase();
}

function parseOrientation(pref?: string): OrientationStr {
  if (!pref) return "likes men and women";
  const p = pref.toLowerCase().trim();

  if (p === "likes men and women" || p === "both" || p === "likes both") {
    return "likes men and women";
  }
  if (p === "likes men" || p === "men") {
    return "likes men";
  }
  if (p === "likes women" || p === "women") {
    return "likes women";
  }

  if (p.endsWith("men and women")) return "likes men and women";
  if (p.endsWith("women")) return "likes women";
  if (p.endsWith("men")) return "likes men";

  return "likes men and women";
}

type SortKey = "best" | "age" | "distance" | "fame";

type Query = {
  sortBy: SortKey;
  sortDir: "asc" | "desc";
  minAge: number;
  maxAge: number;
  maxDistanceKm: number;
  minFame: number;
  selectedTags: string[];
};

export default function SuggestedProfilesPage() {
  const {
    currentUser,
    loading: loadingCurrentUser,
    error: currentUserError,
  } = useCurrentUser();

  const searchDefaultQuery: Query = {
    sortBy: "best",
    sortDir: "desc",
    minAge: 18,
    maxAge: 99,
    maxDistanceKm: 500,
    minFame: 0,
    selectedTags: [],
  };

  const [query, setQuery] = React.useState<Query>(searchDefaultQuery);
  const [queryInput, setQueryInput] = React.useState<Query>(searchDefaultQuery);
  const [isInitialized, setIsInitialized] = React.useState(false);

  React.useEffect(() => {
    const saved = sessionStorage.getItem("matcha_search_query");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setQuery(parsed);
        setQueryInput(parsed);
      } catch (e) {
        console.error("Error loading saved query:", e);
      }
    }
    setIsInitialized(true);
  }, []);

  React.useEffect(() => {
    if (isInitialized) {
      sessionStorage.setItem("matcha_search_query", JSON.stringify(query));
    }
  }, [query, isInitialized]);

  React.useEffect(() => {
    const hasSavedQuery = !!sessionStorage.getItem("matcha_search_query");

    if (currentUser?.birthdate && !hasSavedQuery) {
      const userAge = ageFromBirthdate(currentUser.birthdate);
      const minAge = userAge - 2 >= 18 ? userAge - 2 : 18;
      const maxAge = userAge + 2 <= 99 ? userAge + 2 : 99;

      setQuery((prev) => ({
        ...prev,
        minAge,
        maxAge,
      }));
      setQueryInput((prev) => ({
        ...prev,
        minAge,
        maxAge,
      }));
    }
  }, [currentUser?.birthdate]);

  const {
    profiles: backendProfiles,
    loading,
    error,
  } = useProfiles({
    minAge: query.minAge,
    maxAge: query.maxAge,
    minFame: query.minFame,
    maxDistance: query.maxDistanceKm,
    tags: query.selectedTags,
  });

  const allProfiles = useMemo(() => {
    return backendProfiles.map(backendUserToProfile);
  }, [backendProfiles]);

  const allAvailableTags = useMemo(() => {
    const tagSet = new Set<string>();
    allProfiles.forEach((p) => {
      p.interests.forEach((tag) => tagSet.add(normalizeTag(tag)));
    });
    return Array.from(tagSet).sort();
  }, [allProfiles]);

  const displayedProfiles = useMemo(() => {
    if (!currentUser) return [];

    const base = allProfiles.filter((p) => p.id !== currentUser.id);

    const enriched = base.map((p) => {
      const score = p.matchScore ?? 0;
      const distanceKm = p.distanceKm ?? Infinity;
      const commonTags = p.commonTags ?? 0;

      return {
        profile: p,
        score,
        age: ageFromBirthdate(p.birthdate),
        distanceKm,
        commonTags,
      };
    });

    const sorted = [...enriched].sort((a, b) => {
      const mult = query.sortDir === "asc" ? 1 : -1;
      let diff = 0;

      switch (query.sortBy) {
        case "age":
          diff = a.age - b.age;
          break;
        case "distance":
          diff = a.distanceKm - b.distanceKm;
          break;
        case "fame":
          diff = a.profile.fameRating - b.profile.fameRating;
          break;
        default:
          diff = a.score - b.score;
          break;
      }

      if (diff !== 0) return mult * diff;
      return (a.profile.id ?? 0) - (b.profile.id ?? 0);
    });

    return sorted;
  }, [query, allProfiles, currentUser]);

  const handleInputChange = (field: keyof Query, value: unknown) => {
    setQueryInput((prev) => {
      const numValue = value as number;
      if (field === "minAge") {
        return { ...prev, minAge: Math.min(numValue, prev.maxAge) };
      }
      if (field === "maxAge") {
        return { ...prev, maxAge: Math.max(numValue, prev.minAge) };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleTagClick = (tag: string) => {
    setQueryInput((currentInput) => {
      const currentTags = currentInput.selectedTags;
      const newTags = currentTags.includes(tag)
        ? currentTags.filter((t) => t !== tag)
        : [...currentTags, tag];
      return { ...currentInput, selectedTags: newTags };
    });
  };

  const handleApplyClick = () => {
    setQuery(queryInput);
  };

  const resetFilters = () => {
    setQueryInput(searchDefaultQuery);
    setQuery(searchDefaultQuery);
    sessionStorage.removeItem("matcha_search_query");
  };

  if (loading || loadingCurrentUser) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error || currentUserError) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="alert alert-error">
          <span>Error loading profiles: {error || currentUserError}</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="alert alert-warning">
          <span>Please log in to see suggested profiles</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen p-4 sm:p-6">
      <div className="rounded-box bg-base-100 shadow-sm ring-1 ring-base-200/50 p-4 mb-6">
        <h1 className="text-xl font-bold mb-4">Advanced search</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-4">
          <div className="flex flex-col">
            <label className="label-text font-bold mb-2">Sort by</label>
            <div className="flex items-center gap-2">
              <select
                className="select select-bordered select-sm w-full"
                value={queryInput.sortBy}
                onChange={(e) =>
                  handleInputChange("sortBy", e.target.value as SortKey)
                }
              >
                <option value="best">Best match</option>
                <option value="age">Age</option>
                <option value="distance">Distance</option>
                <option value="fame">Fame</option>
              </select>
              <button
                className="btn btn-sm btn-outline px-4"
                onClick={() =>
                  handleInputChange(
                    "sortDir",
                    queryInput.sortDir === "asc" ? "desc" : "asc",
                  )
                }
              >
                {queryInput.sortDir === "asc" ? "↑" : "↓"}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="label-text font-bold mb-1 block">
              Age range ({queryInput.minAge} - {queryInput.maxAge})
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="18"
                max="99"
                value={queryInput.minAge}
                onChange={(e) =>
                  handleInputChange("minAge", Number(e.target.value))
                }
                className="range range-primary range-xs flex-1"
              />
              <input
                type="range"
                min="18"
                max="99"
                value={queryInput.maxAge}
                onChange={(e) =>
                  handleInputChange("maxAge", Number(e.target.value))
                }
                className="range range-primary range-xs flex-1"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="label-text font-bold mb-1 block">
              Max distance: {queryInput.maxDistanceKm} km
            </label>
            <input
              type="range"
              min="0"
              max="1000"
              step="10"
              value={queryInput.maxDistanceKm}
              onChange={(e) =>
                handleInputChange("maxDistanceKm", Number(e.target.value))
              }
              className="range range-secondary range-xs"
            />
          </div>

          <div className="flex flex-col">
            <label className="label-text font-bold mb-2 block">Interests</label>
            <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-base-200/50 max-h-24 overflow-y-auto border border-base-300">
              {allAvailableTags.length > 0 ? (
                allAvailableTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className={`btn btn-xs rounded-full normal-case ${
                      queryInput.selectedTags.includes(tag)
                        ? "btn-primary"
                        : "btn-ghost bg-base-100 hover:bg-primary/10"
                    }`}
                  >
                    #{tag}
                  </button>
                ))
              ) : (
                <span className="text-xs opacity-50 p-1">
                  No tags available
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-base-200 pt-4">
          <button
            className="btn btn-primary btn-sm px-6 rounded-full"
            onClick={handleApplyClick}
          >
            Apply Filters
          </button>
          <button
            className="btn btn-ghost btn-sm px-6 rounded-full"
            onClick={resetFilters}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
          Suggestions ({displayedProfiles.length})
        </h2>
        <div className="hidden lg:flex gap-1 text-xs opacity-50">
          Showing as table (Desktop)
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-6 mb-8">
        {displayedProfiles.length > 0 ? (
          displayedProfiles.map(({ profile, age, distanceKm, score }) => (
            <Link
              key={profile.id}
              href={`/home/profile/${profile.id}`}
              className="group"
            >
              <div className="card bg-base-100 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform group-hover:-translate-y-1">
                <figure className="relative aspect-[4/3]">
                  <img
                    src={
                      profile.images?.[0]
                        ? getImageUrl(profile.images[0])
                        : "https://img.daisyui.com/images/profile/demo/2@94.webp"
                    }
                    alt={`${profile.firstName} ${profile.lastName}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 badge badge-primary font-bold shadow-lg">
                    {score.toFixed(0)}% Match
                  </div>
                  {profile.isOnline && (
                    <div className="absolute top-3 left-3 badge badge-success gap-1 text-[10px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      ONLINE
                    </div>
                  )}
                </figure>
                <div className="card-body p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="card-title text-xl">
                        {profile.firstName}, {age}
                        {profile.gender === "Man" ? " ♂" : " ♀"}
                      </h2>
                      <p className="text-sm opacity-60">
                        {Number.isFinite(distanceKm)
                          ? `${distanceKm.toFixed(0)} km away`
                          : "Location hidden"}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-primary mb-1">
                        Fame
                      </div>
                      <div
                        className="radial-progress text-primary"
                        style={
                          {
                            "--value": profile.fameRating,
                            "--size": "2.5rem",
                            "--thickness": "3px",
                          } as any
                        }
                      >
                        <span className="text-[10px]">
                          {profile.fameRating.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="line-clamp-2 text-sm mt-2 opacity-80 min-h-[2.5rem]">
                    {profile.bio || "No bio yet..."}
                  </p>

                  <div className="flex flex-wrap gap-1 mt-3">
                    {profile.interests.slice(0, 4).map((t, i) => (
                      <span
                        key={t + i}
                        className="badge badge-outline badge-xs opacity-70"
                      >
                        #{normalizeTag(t)}
                      </span>
                    ))}
                    {profile.interests.length > 4 && (
                      <span className="badge badge-ghost badge-xs">
                        +{profile.interests.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full py-20 text-center opacity-50 bg-base-100 rounded-3xl border-2 border-dashed border-base-300">
            No profiles found matching your criteria.
          </div>
        )}
      </div>

      <div className="hidden lg:block overflow-x-auto rounded-3xl border border-base-200 shadow-sm bg-base-100">
        <table className="table table-zebra">
          <thead>
            <tr className="bg-base-200/50">
              <th className="rounded-tl-3xl">Match</th>
              <th>Profile</th>
              <th>Age</th>
              <th>Bio</th>
              <th>Interests</th>
              <th>Fame</th>
              <th>Distance</th>
              <th>Status</th>
              <th className="rounded-tr-3xl"></th>
            </tr>
          </thead>
          <tbody>
            {displayedProfiles.map(({ profile, age, distanceKm, score }) => (
              <tr
                key={profile.id}
                className="hover:bg-primary/5 transition-colors group"
              >
                <td className="font-bold text-primary">{score.toFixed(0)}%</td>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="avatar">
                      <div className="mask mask-squircle h-12 w-12 group-hover:scale-110 transition-transform">
                        <img
                          src={
                            profile.images?.[0]
                              ? getImageUrl(profile.images[0])
                              : "https://img.daisyui.com/images/profile/demo/2@94.webp"
                          }
                          alt={`${profile.firstName} ${profile.lastName}`}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="font-bold">
                        {profile.firstName} {profile.lastName}
                      </div>
                      <div className="text-xs opacity-50">
                        @{profile.username || `user${profile.id}`}
                      </div>
                    </div>
                  </div>
                </td>
                <td>{age}</td>
                <td className="max-w-xs">
                  <p className="line-clamp-2 text-sm opacity-80">
                    {profile.bio}
                  </p>
                </td>
                <td className="max-w-[200px]">
                  <div className="flex flex-wrap gap-1">
                    {profile.interests.slice(0, 3).map((t, i) => (
                      <span
                        key={t + i}
                        className="badge badge-primary badge-outline badge-xs"
                      >
                        #{normalizeTag(t)}
                      </span>
                    ))}
                    {profile.interests.length > 3 && (
                      <span className="badge badge-ghost badge-xs">...</span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <progress
                      className="progress progress-primary w-16"
                      value={profile.fameRating}
                      max={100}
                    />
                    <span className="text-xs opacity-60">
                      {profile.fameRating.toFixed(0)}%
                    </span>
                  </div>
                </td>
                <td className="whitespace-nowrap">
                  {Number.isFinite(distanceKm)
                    ? `${distanceKm.toFixed(0)} km`
                    : "—"}
                </td>
                <td>
                  {profile.isOnline ? (
                    <span className="badge badge-success badge-sm badge-outline font-bold">
                      Online
                    </span>
                  ) : (
                    <span className="badge badge-ghost badge-sm opacity-50 underline decoration-dotted">
                      Offline
                    </span>
                  )}
                </td>
                <td className="text-right">
                  <Link href={`/home/profile/${profile.id}`}>
                    <button className="btn btn-primary btn-sm rounded-full normal-case opacity-0 group-hover:opacity-100 transition-opacity">
                      View Profile
                    </button>
                  </Link>
                </td>
              </tr>
            ))}

            {displayedProfiles.length === 0 && (
              <tr>
                <td colSpan={11}>
                  <div className="text-center py-20 opacity-40 italic">
                    No results found. Try adjusting your filters.
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
