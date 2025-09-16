"use client";

/* eslint-disable @next/next/no-img-element */
import React, { useMemo, useState } from "react";
import { exampleProfiles } from "../../components/dataExample/profile.example";
import { Profile, Location } from "../../components/types/profile";

type Gender = "Man" | "Woman";
type OrientationStr = "likes men" | "likes women" | "likes men and women";

const locationById: Record<string, Location> = {
  user1: { city: "Paris", country: "FR", lat: 48.8566, lng: 2.3522 },
  user2: { city: "Lyon", country: "FR", lat: 45.764, lng: 4.8357 },
  user3: { city: "Lyon", country: "FR", lat: 45.764, lng: 4.8357 },
  user4: { city: "Marseille", country: "FR", lat: 43.2965, lng: 5.3698 },
  user5: { city: "Toulouse", country: "FR", lat: 43.6045, lng: 1.4442 },
  user6: { city: "Bordeaux", country: "FR", lat: 44.8378, lng: -0.5792 },
  user7: { city: "Paris", country: "FR", lat: 48.8566, lng: 2.3522 },
};

const currentUser: Profile = {
  id: "me",
  firstName: "Alex",
  lastName: "Dupont",
  images: [],
  gender: "Woman",
  preferences: "likes men and women",
  bio: "Hello Matcha 👋",
  interests: ["#running", "#cats", "#coding"],
  birthdate: new Date(2000, 5, 4),
  fameRating: 50,
  location: { city: "Lyon", country: "FR", lat: 45.75, lng: 4.85 },
};

const today = new Date();
function ageFromBirthdate(d: Date) {
  const a = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  return m < 0 || (m === 0 && today.getDate() < d.getDate()) ? a - 1 : a;
}

function haversineKm(a: Location, b: Location) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
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
  if (p.includes("men") && p.includes("women")) return "likes men and women";
  if (p.includes("men")) return "likes men";
  if (p.includes("women")) return "likes women";
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

const withLocations: Profile[] = exampleProfiles.map((p) => ({
  ...p,
  location: p.location ?? locationById[p.id],
}));

function scoreCandidate(
  viewer: Profile,
  candidate: Profile,
  opts?: { distanceCutoffKm?: number }
) {
  const cutoff = opts?.distanceCutoffKm ?? 200;
  const fame = (candidate.fameRating ?? 0) / 100;

  let distanceKm = Infinity;
  if (viewer.location && candidate.location) {
    distanceKm = haversineKm(viewer.location, candidate.location);
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

  const sameCity =
    viewer.location?.city && candidate.location?.city
      ? viewer.location.city === candidate.location.city
      : false;
  const areaBoost = sameCity ? 0.15 : 0;

  const base = 0.5 * distanceScore + 0.3 * tagsScore + 0.2 * fame + areaBoost;
  return { score: Math.min(1, base), distanceKm, commonTags: common };
}

type SortKey = "best" | "age" | "distance" | "fame" | "tags";

type Query = {
  sortBy: SortKey;
  sortDir: "asc" | "desc";
  minAge: number;
  maxAge: number;
  maxDistanceKm: number;
  minFame: number;
  minCommonTags: number;
};

export default function SuggestedProfilesPage() {
  const myAge = currentUser.birthdate
    ? ageFromBirthdate(currentUser.birthdate)
    : 18;
  const minAgeAll = myAge - 5 >= 18 ? myAge - 5 : 18;
  const maxAgeAll = myAge + 5 <= 99 ? myAge + 5 : 99;

  const defaultQuery: Query = {
    sortBy: "best",
    sortDir: "desc",
    minAge: minAgeAll,
    maxAge: maxAgeAll,
    maxDistanceKm: 200,
    minFame: 0,
    minCommonTags: 0,
  };

  const [sortByInput, setSortByInput] = useState<SortKey>(defaultQuery.sortBy);
  const [sortDirInput, setSortDirInput] = useState<"asc" | "desc">(
    defaultQuery.sortDir
  );

  const [minAgeInput, setMinAgeInput] = useState<number>(defaultQuery.minAge);
  const [maxAgeInput, setMaxAgeInput] = useState<number>(defaultQuery.maxAge);

  const [maxDistanceKmInput, setMaxDistanceKmInput] = useState<number>(
    defaultQuery.maxDistanceKm
  );
  const [minFameInput, setMinFameInput] = useState<number>(
    defaultQuery.minFame
  );
  const [minCommonTagsInput, setMinCommonTagsInput] = useState<number>(
    defaultQuery.minCommonTags
  );

  const [query, setQuery] = useState<Query>(defaultQuery);

  const hasPendingChanges =
    sortByInput !== query.sortBy ||
    sortDirInput !== query.sortDir ||
    minAgeInput !== query.minAge ||
    maxAgeInput !== query.maxAge ||
    maxDistanceKmInput !== query.maxDistanceKm ||
    minFameInput !== query.minFame ||
    minCommonTagsInput !== query.minCommonTags;

  const applySearch = () => {
    setQuery({
      sortBy: sortByInput,
      sortDir: sortDirInput,
      minAge: minAgeInput,
      maxAge: maxAgeInput,
      maxDistanceKm: maxDistanceKmInput,
      minFame: minFameInput,
      minCommonTags: minCommonTagsInput,
    });
  };

  const resetFilters = () => {
    setSortByInput(defaultQuery.sortBy);
    setSortDirInput(defaultQuery.sortDir);
    setMinAgeInput(defaultQuery.minAge);
    setMaxAgeInput(defaultQuery.maxAge);
    setMaxDistanceKmInput(defaultQuery.maxDistanceKm);
    setMinFameInput(defaultQuery.minFame);
    setMinCommonTagsInput(defaultQuery.minCommonTags);
    setQuery(defaultQuery);
  };

  const suggestions = useMemo(() => {
    const base = withLocations.filter(
      (p) => p.id !== currentUser.id && isInterestingFor(currentUser, p)
    );

    const enriched = base.map((p) => {
      const { score, distanceKm, commonTags } = scoreCandidate(currentUser, p, {
        distanceCutoffKm: 200,
      });
      return {
        profile: p,
        score,
        age: ageFromBirthdate(p.birthdate),
        distanceKm,
        commonTags,
      };
    });

    const filtered = enriched.filter((e) => {
      const ageOk = e.age >= query.minAge && e.age <= query.maxAge;
      const fameOk = (e.profile.fameRating ?? 0) >= query.minFame;
      const tagsOk = e.commonTags >= query.minCommonTags;

      const distanceOk =
        currentUser.location && e.profile.location
          ? e.distanceKm <= query.maxDistanceKm
          : true;

      return ageOk && fameOk && tagsOk && distanceOk;
    });

    const sorted = [...filtered].sort((a, b) => {
      const mult = query.sortDir === "asc" ? 1 : -1;
      switch (query.sortBy) {
        case "age":
          return mult * (a.age - b.age);
        case "distance":
          return (
            mult * ((a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
          );
        case "fame":
          return (
            mult * ((a.profile.fameRating ?? 0) - (b.profile.fameRating ?? 0))
          );
        case "tags":
          return mult * (a.commonTags - b.commonTags);
        case "best":
        default:
          return mult * (a.score - b.score);
      }
    });

    return sorted;
  }, [query]);

  return (
    <div className="w-full min-h-screen p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-4">Suggested profiles</h1>

      <div className="rounded-box bg-base-100 shadow-sm ring-1 ring-base-200/50 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="label">
              <span className="label-text font-bold">Sort by</span>
            </label>
            <div className="flex gap-2">
              <select
                className="select select-bordered select-sm w-full max-w-xs"
                value={sortByInput}
                onChange={(e) => setSortByInput(e.target.value as SortKey)}
              >
                <option value="best">Best match</option>
                <option value="age">Age</option>
                <option value="distance">Location (distance)</option>
                <option value="fame">Fame rating</option>
                <option value="tags">Common tags</option>
              </select>
              <button
                className="btn btn-sm"
                onClick={() =>
                  setSortDirInput((d) => (d === "asc" ? "desc" : "asc"))
                }
                aria-label="Toggle sort direction"
              >
                {sortDirInput === "asc" ? "Asc" : "Desc"}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="label">
              <span className="label-text font-bold">Age range</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                className="input input-bordered input-sm w-20"
                value={minAgeInput}
                min={18}
                max={maxAgeInput}
                onChange={(e) => setMinAgeInput(Number(e.target.value))}
              />
              <span>–</span>
              <input
                type="number"
                className="input input-bordered input-sm w-20"
                value={maxAgeInput}
                min={minAgeInput}
                max={99}
                onChange={(e) => setMaxAgeInput(Number(e.target.value))}
              />
            </div>

            <label className="label">
              <span className="label-text font-bold">Min. fame rating</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                className="input input-bordered input-sm w-20"
                min={0}
                value={minFameInput}
                onChange={(e) => setMinFameInput(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="label">
              <span className="label-text font-bold">Max distance (km)</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                className="input input-bordered input-sm w-24"
                min={0}
                value={maxDistanceKmInput}
                onChange={(e) => setMaxDistanceKmInput(Number(e.target.value))}
              />
            </div>

            <label className="label">
              <span className="label-text font-bold">Min. common tags</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                className="input input-bordered input-sm w-20"
                min={0}
                value={minCommonTagsInput}
                onChange={(e) => setMinCommonTagsInput(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            className="btn btn-primary btn-sm"
            onClick={applySearch}
            disabled={!hasPendingChanges}
          >
            Rechercher
          </button>
          <button className="btn btn-sm" onClick={resetFilters}>
            Reset filters
          </button>
          {hasPendingChanges && (
            <span className="text-xs opacity-70">
              Modifications non appliquées
            </span>
          )}
        </div>
      </div>

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
              <th></th>
            </tr>
          </thead>
          <tbody>
            {suggestions.map(
              ({
                profile,
                age,
                distanceKm,
                score,
              }: {
                profile: Profile;
                age: number;
                distanceKm: number;
                score: number;
              }) => (
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
                          {profile.location?.city ?? "—"}
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
                        {profile.fameRating}%
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
                    <button className="btn btn-primary text-xs">
                      Know more
                    </button>
                  </td>
                </tr>
              )
            )}

            {suggestions.length === 0 && (
              <tr>
                <td colSpan={10}>
                  <div className="text-center py-10 opacity-70">
                    No profile matches your filters.
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
