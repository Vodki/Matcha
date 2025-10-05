/* eslint-disable @next/next/no-img-element */
"use client";

import { useParams, useRouter } from "next/navigation";
import { useGlobalAppContext } from "@/contexts/GlobalAppContext";
import { useEffect, useMemo, useState } from "react";
import { ageFromBirthdate } from "../../../../utils/date";
import { useFameRating } from "../../../../hooks/useFameRating";

export default function UserProfilePage() {
  const { state, dispatch } = useGlobalAppContext();
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const profile = state.users.find((u) => u.id === userId);

  // Hook pour gérer le fame rating, les likes et les vues
  const { stats, isLiked, loading: statsLoading, recordView, toggleLike } = useFameRating(userId);

  useEffect(() => {
    if (userId) {
      dispatch({ type: "RECORD_VISIT", payload: { userId } });
      // Enregistrer la vue du profil
      recordView();
    }
  }, [userId, dispatch, recordView]);

  const matchScore = useMemo(() => {
    if (!profile || !state.currentUser?.interests?.length) return 0;
    const commonInterests = profile.interests.filter((tag: string) =>
      state.currentUser.interests.includes(tag)
    );
    const score =
      (commonInterests.length / state.currentUser.interests.length) * 100;
    return Math.round(score);
  }, [profile, state.currentUser.interests]);

  if (!profile) {
    return <div className="text-center p-10">Profil non trouvé.</div>;
  }

  const iLikeThem = state.likes.some(
    (l) => l.likerId === state.currentUser.id && l.likedId === userId
  );
  const theyLikeMe = state.likes.some(
    (l) => l.likerId === userId && l.likedId === state.currentUser.id
  );
  const isConnected = iLikeThem && theyLikeMe;
  const profileAge = profile.birthdate
    ? ageFromBirthdate(profile.birthdate)
    : null;

  const handleLike = () => {
    if ((state.currentUser.images?.length ?? 0) === 0) {
      alert("You have to have a profile picture to like others' profiles.");
      return;
    }
    // Utiliser le toggle like de l'API
    toggleLike();
    
    // Garder aussi la logique locale pour la compatibilité
    if (iLikeThem) {
      dispatch({ type: "UNLIKE_USER", payload: { userId } });
    } else {
      dispatch({ type: "LIKE_USER", payload: { userId } });
    }
  };

  const handleBlock = () => {
    if (
      confirm(
        "Are you sure you want to block this profile? Blocked profiles will no longer appear in your searches and you will not be able to interact with them."
      )
    ) {
      dispatch({ type: "BLOCK_USER", payload: { userId } });
    }
  };

  const handleReport = () => {
    if (confirm("Report this account as a fake profile?")) {
      dispatch({ type: "REPORT_USER", payload: { userId } });
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % (profile.images?.length ?? 1));
  };

  const prevImage = () => {
    setCurrentImageIndex(
      (prev) =>
        (prev - 1 + (profile.images?.length ?? 1)) %
        (profile.images?.length ?? 1)
    );
  };

  const startChat = () => {
    router.push(`/home/chat/${userId}`);
  };

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/3 w-full">
          <div className="relative w-full aspect-square rounded-lg shadow-xl overflow-hidden bg-base-200">
            {profile.images && profile.images.length > 0 ? (
              <>
                <img
                  src={profile.images[currentImageIndex]}
                  alt={`${profile.firstName}'s picture ${
                    currentImageIndex + 1
                  }`}
                  className="w-full h-full object-cover"
                />
                {profile.images.length > 1 && (
                  <div className="absolute inset-0 flex justify-between items-center">
                    <button
                      onClick={prevImage}
                      className="btn btn-circle btn-ghost text-white bg-black/30"
                    >
                      ❮
                    </button>
                    <button
                      onClick={nextImage}
                      className="btn btn-circle btn-ghost text-white bg-black/30"
                    >
                      ❯
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-base-content/50">No picture</span>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-stretch justify-center gap-4">
            {isConnected ? (
              <>
                <button
                  onClick={startChat}
                  className="btn btn-primary btn-lg flex-grow"
                >
                  Chat with {profile.firstName}
                </button>
                <div className="dropdown dropdown-top dropdown-end">
                  <button
                    tabIndex={0}
                    role="button"
                    className="btn btn-ghost btn-lg"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
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
                    className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
                  >
                    <li>
                      <button onClick={handleLike}>Disconnect</button>
                    </li>
                    <li>
                      <button onClick={handleBlock}>Block this profile</button>
                    </li>
                    <li>
                      <button onClick={handleReport}>Report as fake</button>
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={handleLike}
                  className={`btn btn-circle btn-lg ${
                    iLikeThem ? "btn-primary" : "btn-outline"
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
                <div className="dropdown dropdown-top dropdown-end">
                  <button
                    tabIndex={0}
                    role="button"
                    className="btn btn-circle btn-lg btn-ghost"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
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
                    className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
                  >
                    <li>
                      <button onClick={handleBlock}>Block this profile</button>
                    </li>
                    <li>
                      <button onClick={handleReport}>Report as fake</button>
                    </li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="lg:w-2/3 w-full card bg-base-100 shadow-xl p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="card-title text-4xl mb-1">
                {profile.firstName} {profile.lastName}
              </h2>
              <p className="text-xl text-base-content/70">
                {profileAge} years old
              </p>
            </div>
            {isConnected ? (
              <span className="badge badge-primary badge-lg">Connected</span>
            ) : (
              theyLikeMe && (
                <span className="badge badge-info badge-lg">Liked you!</span>
              )
            )}
          </div>

          <div className="flex items-center gap-2 my-4">
            <span
              className={`badge ${
                profile.isOnline ? "badge-success" : "badge-ghost"
              }`}
            >
              {profile.isOnline
                ? "Online"
                : `Last seen: ${profile.lastSeen?.toLocaleDateString()}`}
            </span>
          </div>

          <div className="divider"></div>

          <div className="mb-4">
            <label className="label">
              <span className="label-text font-bold">Compatibility</span>
              <span className="label-text-alt">{matchScore}%</span>
            </label>
            <progress
              className="progress progress-primary w-full"
              value={matchScore}
              max="100"
            ></progress>
          </div>

          <div className="mb-4">
            <h3 className="font-bold text-lg">About {profile.firstName}</h3>
            <p className="mt-1 text-base-content/80 whitespace-pre-wrap">
              {profile.bio}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <h3 className="font-bold">Gender</h3>
              <p className="text-base-content/80">{profile.gender}</p>
            </div>
            <div>
              <h3 className="font-bold">Preferences</h3>
              <p className="text-base-content/80">{profile.preferences}</p>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg">Interests</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              {profile.interests.map((tag: string, index: number) => (
                <div key={index} className="badge badge-outline">
                  {tag}
                </div>
              ))}
            </div>
          </div>

          <p className="mt-4 text-sm text-base-content/50">
            {statsLoading ? (
              "Loading stats..."
            ) : (
              <div className="stats shadow">
                <div className="stat place-items-center">
                  <div className="stat-title">Popularity</div>
                  <div className="stat-value text-primary">{stats.fame_rating.toFixed(1)}%</div>
                  <div className="stat-desc">Fame Rating</div>
                </div>
                <div className="stat place-items-center">
                  <div className="stat-title">Profile Views</div>
                  <div className="stat-value text-secondary">{stats.views}</div>
                  <div className="stat-desc">Total views</div>
                </div>
                <div className="stat place-items-center">
                  <div className="stat-title">Likes</div>
                  <div className="stat-value">{stats.likes}</div>
                  <div className="stat-desc">
                    {stats.views > 0 
                      ? `${((stats.likes / stats.views) * 100).toFixed(0)}% conversion`
                      : 'No views yet'}
                  </div>
                </div>
              </div>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
