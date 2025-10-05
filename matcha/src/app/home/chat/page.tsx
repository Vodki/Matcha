/* eslint-disable @next/next/no-img-element */
"use client";

import { useGlobalAppContext } from "@/contexts/GlobalAppContext";
import { useMemo } from "react";
import Link from "next/link";

export default function ChatListPage() {
  const { state } = useGlobalAppContext();

  const connectedUsers = useMemo(() => {
    const connectedIds: string[] = [];
    state.likes.forEach((like1) => {
      state.likes.forEach((like2) => {
        if (
          like1.likerId === like2.likedId &&
          like1.likedId === like2.likerId
        ) {
          if (
            like1.likerId === state.currentUser.id &&
            !connectedIds.includes(like1.likedId)
          ) {
            connectedIds.push(like1.likedId);
          }
        }
      });
    });
    return state.users.filter((u) => connectedIds.includes(u.id));
  }, [state.likes, state.users, state.currentUser.id]);

  return (
    <div className="container mx-auto p-4 max-w-3xl mt-20">
      <h1 className="text-3xl font-bold mb-6">Chat</h1>
      <div className="flex flex-col gap-4">
        {connectedUsers.length > 0 ? (
          connectedUsers.map((user) => (
            <Link href={`/home/chat/${user.id}`} key={user.id}>
              <div className="card bg-base-100 shadow-md hover:shadow-xl transition-shadow p-4 flex flex-row items-center gap-4">
                <div className="avatar">
                  <div className="w-16 rounded-full">
                    <img
                      src={user.images?.[0] || "/default-avatar.png"}
                      alt={user.firstName}
                    />
                  </div>
                </div>
                <div>
                  <h2 className="card-title">
                    {user.firstName} {user.lastName}
                  </h2>
                  <p className="text-base-content/70">Click to open chat</p>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <p>
            You don&apos;t have any connections yet. Like profiles to start
            chatting!
          </p>
        )}
      </div>
    </div>
  );
}
