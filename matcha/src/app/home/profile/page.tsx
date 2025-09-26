"use client";
import React, { useState, useMemo } from "react";
import StatsInformation from "../../../components/profile/StatsInformation";
import GeneralInformations from "../../../components/profile/GeneralInformations";
import BlockedUsersModal from "../../../components/profile/BlockedUsersModal";
import { useGlobalAppContext } from "../../contexts/GlobalAppContext";

export default function Profile() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { state, dispatch } = useGlobalAppContext();

  const blockedUsersList = useMemo(() => {
    const allUsers = state.users || [];
    const blockedIds = Array.isArray(state.blockedUserIds)
      ? state.blockedUserIds
      : [];

    return allUsers.filter((user: { id: unknown }) =>
      blockedIds.includes(String(user.id))
    );
  }, [state.users, state.blockedUserIds]);

  const handleUnblockUser = (userId: string) => {
    if (confirm("Voulez-vous vraiment débloquer ce profil ?")) {
      dispatch({ type: "UNBLOCK_USER", payload: { userId } });
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2 w-full mx-auto">
        <div className="mt-20 text-xl font-extrabold ms-2">Profile</div>
        <div className="bg-base-100/95 shadow-lg w-full px-6 py-8 h-[75vh] lg:h-auto overflow-y-auto lg:card flex flex-col lg:flex-row gap-4 lg:gap-6">
          <div className="flex-1 min-w-0">
            <GeneralInformations />

            <div className="mt-6">
              <button
                className="btn btn-outline w-full"
                onClick={() => setIsModalOpen(true)}
              >
                Handle Blocked Users
              </button>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <StatsInformation />
          </div>
        </div>
      </div>

      <BlockedUsersModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        blockedUsers={blockedUsersList}
        onUnblock={handleUnblockUser}
      />
    </>
  );
}
