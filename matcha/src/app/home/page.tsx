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

type SortKey = "best" | "age" | "distance" | "fame" | "tags";

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

  const myAge = currentUser?.birthdate
    ? ageFromBirthdate(currentUser.birthdate)
    : 18;
  const minAgeAll = myAge - 2 >= 18 ? myAge - 2 : 18;
  const maxAgeAll = myAge + 2 <= 99 ? myAge + 2 : 99;

  const suggestionsDefaultQuery: Query = useMemo(
    () => ({
      sortBy: "best",
      sortDir: "desc",
      minAge: minAgeAll,
      maxAge: maxAgeAll,
      maxDistanceKm: 999999,
      minFame: 0,
      selectedTags: [],
    }),
    [minAgeAll, maxAgeAll],
  );

  const searchDefaultQuery: Query = {
    sortBy: "age",
    sortDir: "desc",
    minAge: 18,
    maxAge: 99,
    maxDistanceKm: 500,
    minFame: 0,
    selectedTags: [],
  };

  const [activeTab, setActiveTab] = useState<"suggestions" | "search">(
    "suggestions",
  );

  const hasInitializedFilters = React.useRef(false);

  const [suggestionsQuery, setSuggestionsQuery] = useState<Query>(() => ({
    sortBy: "best",
    sortDir: "desc",
    minAge: 18,
    maxAge: 99,
    maxDistanceKm: 999999,
    minFame: 0,
    selectedTags: [],
  }));
  const [searchQuery, setSearchQuery] = useState<Query>(searchDefaultQuery);

  const [suggestionsInput, setSuggestionsInput] = useState<Query>(() => ({
    sortBy: "best",
    sortDir: "desc",
    minAge: 18,
    maxAge: 99,
    maxDistanceKm: 999999,
    minFame: 0,
    selectedTags: [],
  }));
  const [searchInput, setSearchInput] = useState<Query>(searchDefaultQuery);

  React.useEffect(() => {
    if (currentUser?.birthdate) {
      const userAge = ageFromBirthdate(currentUser.birthdate);
      const minAge = userAge - 2 >= 18 ? userAge - 2 : 18;
      const maxAge = userAge + 2 <= 99 ? userAge + 2 : 99;

      setSuggestionsQuery((prev) => ({
        ...prev,
        minAge,
        maxAge,
      }));
      setSuggestionsInput((prev) => ({
        ...prev,
        minAge,
        maxAge,
      }));
    }
  }, [currentUser?.birthdate]);

  const activeQueryInput =
    activeTab === "suggestions" ? suggestionsInput : searchInput;
  const setActiveQueryInput =
    activeTab === "suggestions" ? setSuggestionsInput : setSearchInput;

  const queryToApply =
    activeTab === "suggestions" ? suggestionsQuery : searchQuery;

  const {
    profiles: backendProfiles,
    loading,
    error,
  } = useProfiles({
    minAge: queryToApply.minAge,
    maxAge: queryToApply.maxAge,
    minFame: queryToApply.minFame,
    maxDistance: queryToApply.maxDistanceKm,
    tags: queryToApply.selectedTags,
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

    const queryToApply =
      activeTab === "suggestions" ? suggestionsQuery : searchQuery;

    const sorted = [...enriched].sort((a, b) => {
      const mult = queryToApply.sortDir === "asc" ? 1 : -1;
      switch (queryToApply.sortBy) {
        case "age":
          return mult * (a.age - b.age);
        case "distance":
          return mult * (a.distanceKm - b.distanceKm);
        case "fame":
          return mult * (a.profile.fameRating - b.profile.fameRating);
        case "tags":
          return mult * (a.commonTags - b.commonTags);
        default:
          return mult * (a.score - b.score);
      }
    });

    return sorted;
  }, [activeTab, suggestionsQuery, searchQuery, allProfiles, currentUser]);

  const handleInputChange = (field: keyof Query, value: unknown) => {
    setActiveQueryInput((prev) => ({ ...prev, [field]: value }));
  };

  const handleTagClick = (tag: string) => {
    setActiveQueryInput((currentInput) => {
      const currentTags = currentInput.selectedTags;
      const newTags = currentTags.includes(tag)
        ? currentTags.filter((t) => t !== tag)
        : [...currentTags, tag];
      return { ...currentInput, selectedTags: newTags };
    });
  };

  const handleApplyClick = () => {
    if (activeTab === "suggestions") {
      setSuggestionsQuery(suggestionsInput);
    } else {
      setSearchQuery(searchInput);
    }
  };

  const resetFilters = () => {
    if (activeTab === "suggestions") {
      setSuggestionsInput(suggestionsDefaultQuery);
      setSuggestionsQuery(suggestionsDefaultQuery);
    } else {
      setSearchInput(searchDefaultQuery);
      setSearchQuery(searchDefaultQuery);
    }
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
      <div className="flex justify-center mb-6">
        <div className="inline-flex bg-base-200/50 rounded-full p-1 gap-1">
          <button
            className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
              activeTab === "suggestions"
                ? "bg-primary text-primary-content shadow-md"
                : "text-base-content/70 hover:text-base-content hover:bg-base-100"
            }`}
            onClick={() => setActiveTab("suggestions")}
          >
            ✨ Suggested for you
          </button>
          <button
            className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
              activeTab === "search"
                ? "bg-primary text-primary-content shadow-md"
                : "text-base-content/70 hover:text-base-content hover:bg-base-100"
            }`}
            onClick={() => setActiveTab("search")}
          >
            🔍 Advanced search
          </button>
        </div>
      </div>

      <div className="rounded-box bg-base-100 shadow-sm ring-1 ring-base-200/50 p-4 mb-6">
        <h1 className="text-xl font-bold mb-4">
          {activeTab === "suggestions"
            ? "Filter suggestions"
            : "Set your search criteria"}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
          <div className="flex flex-col">
            <label className="label-text font-bold mb-2">Sort by</label>
            <div className="flex items-center gap-2">
              <select
                className="select select-bordered select-sm w-full max-w-xs"
                value={activeQueryInput.sortBy}
                onChange={(e) =>
                  handleInputChange("sortBy", e.target.value as SortKey)
                }
              >
                {activeTab === "suggestions" && (
                  <option value="best">Best match</option>
                )}
                <option value="age">Age</option>
                <option value="distance">Distance</option>
                <option value="fame">Fame</option>
                <option value="tags">Common tags</option>
              </select>
              <button
                className="btn btn-sm btn-outline"
                onClick={() =>
                  handleInputChange(
                    "sortDir",
                    activeQueryInput.sortDir === "asc" ? "desc" : "asc",
                  )
                }
              >
                {activeQueryInput.sortDir === "asc" ? "↑" : "↓"}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="label-text font-bold mb-2 block">
                Age range
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className="input input-bordered input-sm w-20"
                  value={activeQueryInput.minAge}
                  min={18}
                  max={activeQueryInput.maxAge}
                  onChange={(e) =>
                    handleInputChange("minAge", Number(e.target.value))
                  }
                />
                <span className="opacity-50">–</span>
                <input
                  type="number"
                  className="input input-bordered input-sm w-20"
                  value={activeQueryInput.maxAge}
                  min={activeQueryInput.minAge}
                  max={99}
                  onChange={(e) =>
                    handleInputChange("maxAge", Number(e.target.value))
                  }
                />
              </div>
            </div>
            <div>
              <label className="label-text font-bold mb-2 block">
                Minimum fame
              </label>
              <input
                type="number"
                className="input input-bordered input-sm w-full max-w-xs"
                min={0}
                max={100}
                value={activeQueryInput.minFame}
                onChange={(e) =>
                  handleInputChange("minFame", Number(e.target.value))
                }
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="label-text font-bold mb-2 block">
                Maximum distance (km)
              </label>
              <input
                type="number"
                className="input input-bordered input-sm w-full max-w-xs"
                min={0}
                value={activeQueryInput.maxDistanceKm}
                onChange={(e) =>
                  handleInputChange("maxDistanceKm", Number(e.target.value))
                }
              />
            </div>

            <div>
              <label className="label-text font-bold mb-2 block">
                Interests (tags)
              </label>
              <div className="flex flex-wrap gap-2 p-2 rounded-box border border-base-200 max-h-32 overflow-y-auto">
                {allAvailableTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className={`btn btn-xs ${
                      activeQueryInput.selectedTags.includes(tag)
                        ? "btn-primary"
                        : "btn-ghost"
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-base-200 pt-4">
          <button className="btn btn-primary btn-sm" onClick={handleApplyClick}>
            {activeTab === "suggestions" ? "Apply filters" : "Search"}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={resetFilters}>
            Reset
          </button>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4">
        {activeTab === "suggestions" ? "Suggested profiles" : "Search results"}{" "}
        ({displayedProfiles.length})
      </h2>

      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Match (%)</th>
              <th>Profile</th>
              <th>Age</th>
              <th>Gender</th>
              <th>Orientation</th>
              <th>Bio</th>
              <th>Interests</th>
              <th>Fame</th>
              <th>Distance</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {displayedProfiles.map(({ profile, age, distanceKm, score }) => (
              <tr key={profile.id}>
                <td>{score.toFixed(0)}%</td>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="avatar">
                      <div className="mask mask-squircle h-12 w-12">
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
                      <div className="text-sm opacity-50">
                        @{profile.username || `user${profile.id}`}
                      </div>
                    </div>
                  </div>
                </td>
                <td>{age}</td>
                <td>{profile.gender}</td>
                <td>{parseOrientation(profile.preferences)}</td>
                <td className="max-w-[320px]">
                  <p className="line-clamp-3">{profile.bio}</p>
                </td>
                <td className="max-w-[260px]">
                  <div className="flex flex-wrap gap-1">
                    {profile.interests.map((t: string, i: number) => (
                      <span
                        key={t + i}
                        className="badge badge-primary badge-sm"
                      >
                        #{normalizeTag(t)}
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <span className="tabular-nums">
                      {profile.fameRating.toFixed(1)}%
                    </span>
                    <progress
                      className="progress progress-primary w-24"
                      value={profile.fameRating}
                      max={100}
                    />
                  </div>
                </td>
                <td>
                  {Number.isFinite(distanceKm)
                    ? `${distanceKm.toFixed(0)} km`
                    : "—"}
                </td>
                <td>
                  {profile.isOnline ? (
                    <span className="badge badge-success badge-sm">Online</span>
                  ) : profile.lastSeen ? (
                    <span className="badge badge-ghost badge-sm">
                      {new Date(profile.lastSeen).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="badge badge-ghost badge-sm">Offline</span>
                  )}
                </td>
                <td>
                  <Link href={`/home/profile/${profile.id}`}>
                    <button className="btn btn-primary btn-xs">
                      Know more
                    </button>
                  </Link>
                </td>
              </tr>
            ))}

            {displayedProfiles.length === 0 && (
              <tr>
                <td colSpan={11}>
                  <div className="text-center py-10 opacity-70">
                    No profiles found matching your criteria.
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
