"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import StatsInformation from "../../../components/profile/StatsInformation";
import GeneralInformations from "../../../components/profile/GeneralInformations";
import BlockedUsersModal from "../../../components/profile/BlockedUsersModal";
import { useCurrentUser } from "../../../hooks/useCurrentUser";
import { getImageUrl } from "../../../services/api";
import api from "../../../services/api";

type BlockedUser = {
  id: string;
  firstName: string;
  lastName: string;
  images?: string[];
};

export default function Profile() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "stats">("info");
  const { currentUser, loading } = useCurrentUser();

  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [photoCount, setPhotoCount] = useState(0);

  const fetchBlockedUsers = useCallback(async () => {
    try {
      const res = await api.getBlockedUsers();
      if (res.data?.blocked_users) {
        setBlockedUsers(
          res.data.blocked_users.map((u) => ({
            id: String(u.id),
            firstName: u.first_name,
            lastName: u.last_name,
            images: u.avatar_url ? [u.avatar_url] : [],
          })),
        );
      }
    } catch (err) {
      console.error("Failed to fetch blocked users", err);
    }
  }, []);

  useEffect(() => {
    fetchBlockedUsers();
  }, [fetchBlockedUsers]);

  useEffect(() => {
    const fetchPhotoCount = async () => {
      if (currentUser?.id) {
        try {
          const res = await api.getUserImages(String(currentUser.id));
          if (res.data?.images) {
            setPhotoCount(res.data.images.length);
          }
        } catch (err) {
          console.error("Failed to fetch photo count", err);
        }
      }
    };
    fetchPhotoCount();
  }, [currentUser?.id]);

  const handleUnblockUser = async (userId: string) => {
    if (confirm("Are you sure you want to unblock this user?")) {
      const res = await api.unblockUser(userId);
      if (res.error) {
        alert("Failed to unblock user: " + res.error);
        return;
      }
      setBlockedUsers((prev) => prev.filter((u) => u.id !== userId));
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-base-200 via-primary/5 to-secondary/10 pb-8">
        <div className="pt-20 pb-8 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="glass rounded-3xl shadow-xl p-6 mb-6 animate-fade-in">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative">
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary to-secondary p-1 shadow-lg">
                    <div className="w-full h-full rounded-full bg-base-100 flex items-center justify-center overflow-hidden">
                      {currentUser?.images?.[0] ? (
                        <img
                          src={getImageUrl(currentUser.images[0])}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl"></span>
                      )}
                    </div>
                  </div>
                  <div className="absolute bottom-1 right-1 w-5 h-5 bg-success rounded-full border-4 border-base-100"></div>
                </div>

                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-3xl font-bold text-neutral">
                    {loading ? (
                      <span className="loading loading-dots loading-sm"></span>
                    ) : (
                      `${currentUser?.firstName || ""} ${currentUser?.lastName || ""}`
                    )}
                  </h1>
                  <p className="text-neutral/60 mt-1">
                    @{currentUser?.username || "..."}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
                    {currentUser?.gender && (
                      <span className="badge badge-primary badge-outline">
                        {currentUser.gender}
                      </span>
                    )}
                    {currentUser?.birthdate && (
                      <span className="badge badge-secondary badge-outline">
                        {new Date().getFullYear() -
                          currentUser.birthdate.getFullYear()}{" "}
                        years
                      </span>
                    )}
                    <span className="badge badge-accent">
                      {currentUser?.fameRating?.toFixed(1) || "0.0"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-6 text-center">
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold text-primary">
                      {currentUser?.interests?.length || 0}
                    </span>
                    <span className="text-xs text-neutral/60">Interests</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold text-secondary">
                      {photoCount}
                    </span>
                    <span className="text-xs text-neutral/60">Photos</span>
                  </div>
                </div>
              </div>

              {currentUser?.bio && (
                <div className="mt-6 p-4 bg-base-200/50 rounded-2xl">
                  <p className="text-neutral/80 italic">
                    &quot;{currentUser.bio}&quot;
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2 mb-6">
              <button
                className={`flex-1 btn rounded-2xl transition-all duration-300 ${
                  activeTab === "info"
                    ? "btn-primary shadow-lg"
                    : "btn-ghost bg-white/50"
                }`}
                onClick={() => setActiveTab("info")}
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Edit Profile
              </button>
              <button
                className={`flex-1 btn rounded-2xl transition-all duration-300 ${
                  activeTab === "stats"
                    ? "btn-primary shadow-lg"
                    : "btn-ghost bg-white/50"
                }`}
                onClick={() => setActiveTab("stats")}
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Stats & Activity
              </button>
            </div>

            <div className="glass rounded-3xl shadow-xl p-6 animate-slide-up">
              {activeTab === "info" ? (
                <>
                  <GeneralInformations />
                  <div className="mt-8 pt-6 border-t border-neutral/10">
                    <button
                      className="btn btn-outline btn-error w-full rounded-2xl gap-2"
                      onClick={() => setIsModalOpen(true)}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                        />
                      </svg>
                      Manage Blocked Users ({blockedUsers.length})
                    </button>
                  </div>
                </>
              ) : (
                <StatsInformation
                  userId={currentUser?.id ? String(currentUser.id) : undefined}
                  onSeeProfile={(profile) => router.push(`/home/profile/${profile.id}`)}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <BlockedUsersModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        blockedUsers={blockedUsers}
        onUnblock={handleUnblockUser}
      />
    </>
  );
}
