/* eslint-disable @next/next/no-img-element */
"use client";

import { useParams, useRouter } from "next/navigation";
import { useGlobalAppContext } from "@/contexts/GlobalAppContext";
import { useEffect, useMemo, useState } from "react";
import api, { getImageUrl } from "../../../../services/api";
import { ageFromBirthdate } from "../../../../utils/date";
import { useFameRating } from "../../../../hooks/useFameRating";
import { useUserProfile } from "../../../../hooks/useUserProfile";
import { useCurrentUser } from "../../../../hooks/useCurrentUser";
import { Profile } from "../../../../types/profile";

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

function formatPreferences(pref: string | undefined): string {
  if (!pref) return "Not specified";
  const lower = pref.toLowerCase().trim();
  const cleaned = lower.replace(/^likes\s+/, "");
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
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

function scoreCandidate(
  viewer: Profile,
  candidate: Profile,
  opts?: { distanceCutoffKm?: number },
) {
  const cutoff = opts?.distanceCutoffKm ?? 200;
  const fame = (candidate.fameRating ?? 0) / 100;

  let distanceKm = Infinity;
  if (viewer.location && candidate.location) {
    distanceKm = haversineKm(
      viewer.location.lat,
      viewer.location.lng,
      candidate.location.lat,
      candidate.location.lng,
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
    ]).size,
  );
  const tagsScore = common / denom;

  const base = 0.5 * distanceScore + 0.3 * tagsScore + 0.2 * fame;
  return { score: Math.min(1, base), distanceKm, commonTags: common };
}

export default function UserProfilePage() {
  const { state, dispatch } = useGlobalAppContext();
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const { currentUser } = useCurrentUser();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const {
    profile: apiProfile,
    loading: profileLoading,
    error: profileError,
  } = useUserProfile(userId);
  const stateProfile = state.users.find((u) => u.id === userId);
  const profile = apiProfile || stateProfile;

  const {
    stats,
    isLiked,
    likedBack,
    loading: statsLoading,
    recordView,
    toggleLike,
  } = useFameRating(userId);

  useEffect(() => {
    if (userId) {
      dispatch({ type: "RECORD_VISIT", payload: { userId } });
      recordView();
    }
  }, [userId, dispatch, recordView]);

  const matchScore = useMemo(() => {
    if (!profile || !currentUser) return 0;
    const { score } = scoreCandidate(currentUser, profile);
    return Math.round(score * 100);
  }, [profile, currentUser]);

  if (profileLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gradient-hero">
        <div className="flex flex-col items-center gap-4">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-base-content/60 animate-pulse">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gradient-hero">
        <div className="glass rounded-3xl p-8 text-center">
          <div className="text-6xl mb-4">😔</div>
          <h2 className="text-2xl font-bold mb-2">Profile Not Found</h2>
          <p className="text-base-content/60">
            This user may have deactivated their account.
          </p>
          <button
            onClick={() => router.push("/home")}
            className="btn btn-primary mt-4"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const iLikeThem = isLiked;
  const theyLikeMe = likedBack;
  const isConnected = iLikeThem && theyLikeMe;
  const profileAge = profile.birthdate
    ? ageFromBirthdate(profile.birthdate)
    : null;

  const handleLike = () => {
    if ((state.currentUser.images?.length ?? 0) === 0) {
      alert("You need a profile picture to like others' profiles.");
      return;
    }
    toggleLike();
    if (iLikeThem) {
      dispatch({ type: "UNLIKE_USER", payload: { userId } });
    } else {
      dispatch({ type: "LIKE_USER", payload: { userId } });
    }
  };

  const handleBlock = async () => {
    if (confirm("Are you sure you want to block this profile?")) {
      const res = await api.blockUser(userId);
      if (res.error) {
        alert("Failed to block user: " + res.error);
        return;
      }
      dispatch({ type: "BLOCK_USER", payload: { userId } });
      router.push("/home");
    }
  };

  const handleReport = async () => {
    if (confirm("Report this account as a fake profile?")) {
      const res = await api.reportUser(userId, "fake_profile");
      if (res.error) {
        alert("Failed to report user: " + res.error);
        return;
      }
      dispatch({ type: "REPORT_USER", payload: { userId } });
      alert("User reported successfully.");
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % (profile.images?.length ?? 1));
  };

  const prevImage = () => {
    setCurrentImageIndex(
      (prev) =>
        (prev - 1 + (profile.images?.length ?? 1)) %
        (profile.images?.length ?? 1),
    );
  };

  const startChat = () => {
    router.push(`/home/chat/${userId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <button
          onClick={() => router.back()}
          className="btn btn-ghost btn-sm mb-6 gap-2 hover:bg-white/20 transition-all"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
          Back
        </button>

        <div className="flex flex-col lg:flex-row gap-8 animate-fade-in">
          <div className="lg:w-2/5 w-full">
            <div className="glass rounded-3xl p-4 shadow-2xl">
              <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-base-200">
                {profile.images && profile.images.length > 0 ? (
                  <>
                    <img
                      src={getImageUrl(profile.images[currentImageIndex])}
                      alt={`${profile.firstName}'s photo`}
                      className="w-full h-full object-cover transition-all duration-500"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {profile.images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-3 top-1/2 -translate-y-1/2 btn btn-circle btn-sm glass border-0 hover:scale-110 transition-transform"
                        >
                          ❮
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-circle btn-sm glass border-0 hover:scale-110 transition-transform"
                        >
                          ❯
                        </button>
                      </>
                    )}

                    {profile.images.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {profile.images.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentImageIndex(idx)}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${
                              idx === currentImageIndex
                                ? "bg-white w-6"
                                : "bg-white/50 hover:bg-white/80"
                            }`}
                          />
                        ))}
                      </div>
                    )}

                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        {profile.firstName}
                        {profile.isOnline && (
                          <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                        )}
                      </h1>
                      <p className="text-white/90 text-lg">
                        {profileAge && `${profileAge} years old`}
                        {profile.location &&
                          ` • ${profile.location.city || "Nearby"}`}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-base-content/50">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1}
                      stroke="currentColor"
                      className="w-16 h-16 mb-2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                      />
                    </svg>
                    <span>No photos yet</span>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-center gap-4">
                {isConnected ? (
                  <>
                    <button
                      onClick={startChat}
                      className="btn btn-primary btn-lg flex-grow rounded-full gap-2 btn-glow"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                        />
                      </svg>
                      Chat with {profile.firstName}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => router.back()}
                      className="btn btn-circle btn-lg btn-ghost glass border-2 border-base-content/20 hover:border-error hover:bg-error/10 transition-all"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>

                    <button
                      onClick={handleLike}
                      className={`btn btn-circle btn-lg transition-all transform hover:scale-110 ${
                        iLikeThem
                          ? "bg-gradient-to-r from-pink-500 to-rose-500 border-0 text-white shadow-lg shadow-pink-500/30"
                          : "glass border-2 border-primary/50 text-primary hover:bg-primary hover:text-white"
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8"
                        fill={iLikeThem ? "currentColor" : "none"}
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.5l1.318-1.182a4.5 4.5 0 116.364 6.364L12 21l-7.682-7.682a4.5 4.5 0 010-6.364z"
                        />
                      </svg>
                    </button>
                  </>
                )}

                <div className="dropdown dropdown-top dropdown-end">
                  <button tabIndex={0} className="btn btn-circle btn-ghost">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-6 h-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z"
                      />
                    </svg>
                  </button>
                  <ul
                    tabIndex={0}
                    className="dropdown-content menu glass rounded-xl z-[1] w-52 p-2 shadow-xl"
                  >
                    {isConnected && (
                      <li>
                        <button onClick={handleLike} className="text-warning">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-4 h-4"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M13.181 8.68a4.503 4.503 0 0 1 1.903 6.405m-9.768-2.782L3.56 14.06a4.5 4.5 0 0 0 6.364 6.365l3.129-3.129m5.614-5.615 1.757-1.757a4.5 4.5 0 0 0-6.364-6.365l-4.5 4.5c-.258.258-.479.541-.661.843m1.846 8.485.688-.688"
                            />
                          </svg>
                          Unmatch
                        </button>
                      </li>
                    )}
                    <li>
                      <button onClick={handleBlock} className="text-error">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636"
                          />
                        </svg>
                        Block
                      </button>
                    </li>
                    <li>
                      <button onClick={handleReport}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5"
                          />
                        </svg>
                        Report as fake
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:w-3/5 w-full space-y-6 animate-slide-up">
            <div className="flex flex-wrap gap-2">
              {isConnected && (
                <span className="badge badge-primary badge-lg gap-2 py-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    className="w-4 h-4"
                  >
                    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
                  </svg>
                  It&apos;s a Match!
                </span>
              )}
              {theyLikeMe && !isConnected && (
                <span className="badge badge-secondary badge-lg gap-2 py-3 animate-pulse-soft">
                  ❤️ Likes you!
                </span>
              )}
              <span
                className={`badge badge-lg gap-2 py-3 ${profile.isOnline ? "badge-success" : "badge-ghost"}`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${profile.isOnline ? "bg-green-400" : "bg-gray-400"}`}
                />
                {profile.isOnline
                  ? "Online now"
                  : profile.lastSeen
                    ? `Last seen ${profile.lastSeen.toLocaleDateString()}`
                    : "Offline"}
              </span>
            </div>

            <div className="glass rounded-2xl p-6 card-hover">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <span className="text-2xl">💫</span> Compatibility
                </h3>
                <span className="text-3xl font-bold text-primary">
                  {matchScore}%
                </span>
              </div>
              <div className="w-full bg-base-200 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 to-primary rounded-full transition-all duration-1000"
                  style={{ width: `${matchScore}%` }}
                />
              </div>
            </div>

            <div className="glass rounded-2xl p-6 card-hover">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <span className="text-2xl">✨</span> About {profile.firstName}
              </h3>
              <p className="text-base-content/80 whitespace-pre-wrap leading-relaxed">
                {profile.bio || "No bio yet..."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="glass rounded-2xl p-5 card-hover text-center">
                <div className="text-3xl mb-2">👤</div>
                <p className="text-sm text-base-content/60 mb-1">Gender</p>
                <p className="font-semibold">
                  {profile.gender || "Not specified"}
                </p>
              </div>
              <div className="glass rounded-2xl p-5 card-hover text-center">
                <div className="text-3xl mb-2">💕</div>
                <p className="text-sm text-base-content/60 mb-1">Looking for</p>
                <p className="font-semibold">
                  {formatPreferences(profile.preferences)}
                </p>
              </div>
            </div>

            <div className="glass rounded-2xl p-6 card-hover">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <span className="text-2xl">🏷️</span> Interests
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.interests && profile.interests.length > 0 ? (
                  profile.interests.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="badge badge-primary badge-lg py-3 px-4 hover:scale-105 transition-transform cursor-default"
                    >
                      #{normalizeTag(tag)}
                    </span>
                  ))
                ) : (
                  <p className="text-base-content/50">
                    No interests added yet.
                  </p>
                )}
              </div>
            </div>

            <div className="glass rounded-2xl p-6 card-hover">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <span className="text-2xl">📊</span> Profile Stats
              </h3>
              {statsLoading ? (
                <div className="flex justify-center py-4">
                  <span className="loading loading-dots loading-md"></span>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-primary/10 rounded-xl">
                    <div className="text-3xl font-bold text-primary">
                      {stats.fame_rating.toFixed(0)}%
                    </div>
                    <p className="text-sm text-base-content/60 mt-1">
                      Fame Rating
                    </p>
                  </div>
                  <div className="text-center p-4 bg-secondary/10 rounded-xl">
                    <div className="text-3xl font-bold text-secondary">
                      {stats.views}
                    </div>
                    <p className="text-sm text-base-content/60 mt-1">
                      Profile Views
                    </p>
                  </div>
                  <div className="text-center p-4 bg-accent/10 rounded-xl">
                    <div className="text-3xl font-bold text-accent">
                      {stats.likes}
                    </div>
                    <p className="text-sm text-base-content/60 mt-1">Likes</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
