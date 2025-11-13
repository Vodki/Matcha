"use client";

/* eslint-disable @next/next/no-img-element */
import React, { useMemo, useState } from "react";
import { Profile, backendUserToProfile } from "../../types/profile";
import { useProfiles } from "../../hooks/useProfiles";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import Link from "next/link";

type Gender = "Man" | "Woman";
type OrientationStr = "likes men" | "likes women" | "likes men and women";

const today = new Date();
function ageFromBirthdate(d: Date) {
  const a = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  return m < 0 || (m === 0 && today.getDate() < d.getDate()) ? a - 1 : a;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const la1 = (lat1 * Math.PI) / 180;
  const la2 = (lat2 * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat + Math.cos(la1) * Math.cos(la2) * sinDLng * sinDLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function normalizeTag(t: string) {
  return t.trim().replace(/^#/, "").toLowerCase();
}

function asSetNormalized(tags: string[]) {
  return new Set(tags.map(normalizeTag));
}

function countCommonTags(a: string[], b: string[]) {
  const A = asSetNormalized(a);
  const B = asSetNormalized(b);
  let c = 0;
  A.forEach((t) => {
    if (B.has(t)) c++;
  });
  return c;
}

function parseOrientation(pref?: string): OrientationStr {
  if (!pref) return "likes men and women";
  const p = pref.toLowerCase().trim();
  
  // Vérifier les patterns exacts pour éviter les faux positifs ("women" contient "men")
  if (p === "likes men and women" || p === "both" || p === "likes both") {
    return "likes men and women";
  }
  if (p === "likes men" || p === "men") {
    return "likes men";
  }
  if (p === "likes women" || p === "women") {
    return "likes women";
  }
  
  // Fallback avec suffix check pour être sûr
  if (p.endsWith("men and women")) return "likes men and women";
  if (p.endsWith("women")) return "likes women";
  if (p.endsWith("men")) return "likes men";
  
  return "likes men and women";
}

function targetGendersFor(orientation: OrientationStr): Gender[] {
  if (orientation === "likes men and women") return ["Man", "Woman"];
  if (orientation === "likes men") return ["Man"];
  return ["Woman"];
}

function isInterestingFor(current: Profile, candidate: Profile) {
  const o = parseOrientation(current.preferences as string | undefined);
  const targets = targetGendersFor(o);
  return targets.includes(candidate.gender as Gender);
}

// Vérifie si deux profils sont mutuellement compatibles (orientation mutuelle)
function areMutuallyCompatible(profile1: Profile, profile2: Profile) {
  // Profile1 doit être intéressé par le genre de profile2
  const profile1LikesProfile2Gender = isInterestingFor(profile1, profile2);
  
  // Profile2 doit être intéressé par le genre de profile1
  const profile2LikesProfile1Gender = isInterestingFor(profile2, profile1);
  
  // Les deux doivent être intéressés par le genre de l'autre
  // Par exemple:
  // - Alice (Woman, "likes women") + Barbara (Woman, "likes women") = ✅ OK
  // - Alice (Woman, "likes women") + Bob (Man, "likes women") = ❌ NON (Alice ne cherche pas d'hommes)
  // - Alice (Woman, "likes men and women") + Barbara (Woman, "likes women") = ✅ OK (Alice accepte les femmes ET Barbara accepte les femmes)
  // - Bob (Man, "likes women") + Alice (Woman, "likes men and women") = ✅ OK (Bob accepte les femmes ET Alice accepte les hommes)
  return profile1LikesProfile2Gender && profile2LikesProfile1Gender;
}

function scoreCandidate(
  viewer: Profile,
  candidate: Profile,
  opts?: { distanceCutoffKm?: number }
) {
  const cutoff = opts?.distanceCutoffKm ?? 200;
  const fame = (candidate.fameRating ?? 0) / 100;

  let distanceKm = Infinity;
  if (viewer.location && candidate.location) {
    distanceKm = haversineKm(
      viewer.location.lat,
      viewer.location.lng,
      candidate.location.lat,
      candidate.location.lng
    );
  }
  const distanceScore =
    distanceKm === Infinity ? 0 : Math.max(0, 1 - distanceKm / cutoff);

  const common = countCommonTags(viewer.interests, candidate.interests);
  const denom = Math.max(
    1,
    new Set([
      ...viewer.interests.map(normalizeTag),
      ...candidate.interests.map(normalizeTag),
    ]).size
  );
  const tagsScore = common / denom;

  const base = 0.5 * distanceScore + 0.3 * tagsScore + 0.2 * fame;
  return { score: Math.min(1, base), distanceKm, commonTags: common };
}

type SortKey = "best" | "age" | "distance" | "fame" | "tags";

export default function SuggestedProfilesPage() {
  // Récupérer l'utilisateur connecté
  const { currentUser, loading: loadingCurrentUser, error: currentUserError } = useCurrentUser();
  
  const myAge = currentUser?.birthdate
    ? ageFromBirthdate(currentUser.birthdate)
    : 18;
  const minAgeAll = myAge - 5 >= 18 ? myAge - 5 : 18;
  const maxAgeAll = myAge + 5 <= 99 ? myAge + 5 : 99;

  type Query = {
    sortBy: SortKey;
    sortDir: "asc" | "desc";
    minAge: number;
    maxAge: number;
    maxDistanceKm: number;
    minFame: number;
    selectedTags: string[];
  };

  const suggestionsDefaultQuery: Query = {
    sortBy: "best",
    sortDir: "desc",
    minAge: minAgeAll,
    maxAge: maxAgeAll,
    maxDistanceKm: 999999,
    minFame: 0,
    selectedTags: [],
  };

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
    "suggestions"
  );

  const [suggestionsQuery, setSuggestionsQuery] = useState(
    suggestionsDefaultQuery
  );
  const [searchQuery, setSearchQuery] = useState(searchDefaultQuery);

  const [suggestionsInput, setSuggestionsInput] = useState(
    suggestionsDefaultQuery
  );
  const [searchInput, setSearchInput] = useState(searchDefaultQuery);

  const activeQueryInput =
    activeTab === "suggestions" ? suggestionsInput : searchInput;
  const setActiveQueryInput =
    activeTab === "suggestions" ? setSuggestionsInput : setSearchInput;

  // Récupérer les filtres appliqués
  const queryToApply = activeTab === "suggestions" ? suggestionsQuery : searchQuery;

  // Récupérer les profils depuis l'API avec les filtres appliqués
  const { profiles: backendProfiles, loading, error } = useProfiles({
    minAge: queryToApply.minAge,
    maxAge: queryToApply.maxAge,
    minFame: queryToApply.minFame,
    maxDistance: queryToApply.maxDistanceKm,
  });

  // Convertir les profils backend en profils frontend
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
    
    // DEBUG: Log des profils reçus
    console.log("=== DEBUG displayedProfiles ===");
    console.log("Current user:", {
      id: currentUser.id,
      gender: currentUser.gender,
      preferences: currentUser.preferences
    });
    console.log("Total profiles from API:", allProfiles.length);
    
    // Les profils sont déjà filtrés par le backend, on ne fait que les trier
    const base = allProfiles.filter((p) => p.id !== currentUser.id);
    console.log("After removing current user:", base.length);
    
    const enriched = base.map((p) => {
      const { score, distanceKm, commonTags } = scoreCandidate(currentUser, p);
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

    // Juste trier, pas de filtrage supplémentaire (tout est fait au backend)
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
      <div role="tablist" className="tabs tabs-lifted">
        <a
          role="tab"
          className={`tab ${activeTab === "suggestions" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("suggestions")}
        >
          Suggested for you
        </a>
        <a
          role="tab"
          className={`tab ${activeTab === "search" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("search")}
        >
          Advanced search
        </a>
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
                    activeQueryInput.sortDir === "asc" ? "desc" : "asc"
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
        {activeTab === "suggestions" ? "Suggested profiles" : "Search results"} ({displayedProfiles.length})
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
                <td>{(score * 100).toFixed(0)}%</td>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="avatar">
                      <div className="mask mask-squircle h-12 w-12">
                        <img
                          src={
                            profile.images?.[0] ??
                            "https://img.daisyui.com/images/profile/demo/2@94.webp"
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
                    <span className="tabular-nums">{profile.fameRating.toFixed(1)}%</span>
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
