/* eslint-disable @next/next/no-img-element */
"use client";

import { Profile } from "../../types/profile";

interface BlockedUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  blockedUsers: Profile[];
  onUnblock: (userId: string) => void;
}

export default function BlockedUsersModal({
  isOpen,
  onClose,
  blockedUsers,
  onUnblock,
}: BlockedUsersModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <dialog open className="modal modal-bottom sm:modal-middle">
      <div className="modal-box">
        <h3 className="font-bold text-lg">Blocked users</h3>

        <div className="py-4 max-h-96 overflow-y-auto">
          {blockedUsers.length > 0 ? (
            <ul className="space-y-3">
              {blockedUsers.map((user) => (
                <li
                  key={user.id}
                  className="flex items-center justify-between p-2 bg-base-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="avatar">
                      <div className="w-12 rounded-full">
                        <img
                          src={user.images?.[0] ?? "/placeholder.jpg"}
                          alt={user.firstName}
                        />
                      </div>
                    </div>
                    <span>
                      {user.firstName} {user.lastName}
                    </span>
                  </div>
                  <button
                    onClick={() => onUnblock(user.id)}
                    className="btn btn-sm btn-outline btn-warning"
                  >
                    Unblock
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-base-content/60">
              You don&apos;t have any blocked users.
            </p>
          )}
        </div>

        <div className="modal-action">
          <button className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </dialog>
  );
}
