/* eslint-disable @next/next/no-img-element */
"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import api from "@/services/api";

export default function ChatListPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await api.getConversations();
        if (response.data?.conversations) {
          setConversations(response.data.conversations);
        }
      } catch (error) {
        console.error("Failed to fetch conversations", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  if (loading) return <div className="p-10 text-center">Loading chats...</div>;

  return (
    <div className="container mx-auto p-4 max-w-3xl mt-20">
      <h1 className="text-3xl font-bold mb-6">Chat</h1>
      <div className="flex flex-col gap-4">
        {conversations.length > 0 ? (
          conversations.map((user) => (
            <Link href={`/home/chat/${user.id}`} key={user.id}>
              <div className="card bg-base-100 shadow-md hover:shadow-xl transition-shadow p-4 flex flex-row items-center gap-4">
                <div className="avatar">
                  <div className="w-16 rounded-full">
                    <img
                      src={user.avatar_url || "/default-avatar.png"}
                      alt={user.first_name}
                    />
                  </div>
                </div>
                <div>
                  <h2 className="card-title">
                    {user.first_name} {user.last_name}
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
