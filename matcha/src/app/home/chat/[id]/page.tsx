/* eslint-disable @next/next/no-img-element */
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import api, { getImageUrl } from "@/services/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useGlobalAppContext } from "@/contexts/GlobalAppContext";
import { websocketService } from "@/services/websocket";
import { backendUserToProfile } from "@/types/profile";

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: string;
  sender_name?: string;
}

export default function ChatPage() {
  const { state } = useGlobalAppContext();
  const { currentUser: realUser } = useCurrentUser();
  const params = useParams();
  const router = useRouter();
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const chatPartnerId = params.id as string;
  const chatPartnerIdNum = parseInt(chatPartnerId);
  const currentUserId = realUser?.id;

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [partner, setPartner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const unsubscribeRef = useRef<(() => void)[]>([]);

  const fetchMessages = useCallback(async () => {
    try {
      const msgRes = await api.getChatHistory(chatPartnerId);
      if (msgRes.data?.messages) {
        setMessages(msgRes.data.messages);
      }
    } catch (err) {
      console.error("Error fetching messages", err);
    }
  }, [chatPartnerId]);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const cachedPartner = state.users.find((u) => u.id === chatPartnerId);
        if (cachedPartner && isMounted) {
          setPartner(cachedPartner);
        }

        const userRes = await api.getUserById(chatPartnerId);
        if (userRes.data && isMounted) {
          setPartner(backendUserToProfile(userRes.data));
        }

        await fetchMessages();
      } catch (err) {
        console.error("Error loading chat", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    websocketService.connect();

    const unsubConnection = websocketService.on(
      "connection",
      (data: unknown) => {
        const status = (data as { status: string }).status;
        if (isMounted) setWsConnected(status === "connected");
      },
    );

    const unsubChat = websocketService.on("chat_message", (data: unknown) => {
      const msg = data as Message;
      if (
        msg.sender_id === chatPartnerIdNum ||
        msg.receiver_id === chatPartnerIdNum
      ) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    });

    const unsubOnline = websocketService.on("user_online", (data: any) => {
      if (data.user_id === chatPartnerIdNum) {
        setPartner((prev: any) => (prev ? { ...prev, isOnline: true } : prev));
      }
    });

    const unsubOffline = websocketService.on("user_offline", (data: any) => {
      if (data.user_id === chatPartnerIdNum) {
        setPartner((prev: any) =>
          prev ? { ...prev, isOnline: false, lastSeen: new Date() } : prev,
        );
      }
    });

    unsubscribeRef.current = [
      unsubConnection,
      unsubChat,
      unsubOnline,
      unsubOffline,
    ];

    const interval = setInterval(() => {
      if (!websocketService.isConnected()) {
        fetchMessages();
      }
    }, 10000);

    return () => {
      isMounted = false;
      unsubscribeRef.current.forEach((unsub) => unsub());
      clearInterval(interval);
    };
  }, [chatPartnerId, chatPartnerIdNum, state.users, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newMessage.trim() === "") return;

    const content = newMessage.trim();
    setNewMessage("");

    try {
      const response = await api.sendMessage(parseInt(chatPartnerId), content);
      if (response.data?.id) {
        const newMsg: Message = {
          id: response.data.id,
          sender_id: parseInt(currentUserId || "0"),
          receiver_id: chatPartnerIdNum,
          content: content,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      } else {
        await fetchMessages();
      }
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  if (loading && !partner) {
    return <div className="p-10 text-center">Loading chat...</div>;
  }

  if (!partner) {
    return <div className="p-10 text-center">User not found</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] lg:h-[calc(100vh-64px)] bg-base-200 overflow-hidden relative">
      <header className="fixed top-16 left-0 right-0 z-40 flex items-center gap-4 p-3 bg-base-100/80 backdrop-blur-md shadow-sm border-b border-base-300 px-4">
        <button
          onClick={() => router.back()}
          className="btn btn-ghost btn-circle btn-sm"
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
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
        </button>
        <div className="avatar">
          <div className="w-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
            <img
              src={
                getImageUrl(partner.avatar_url || partner.images?.[0]) ||
                "/default-avatar.png"
              }
              alt={`Profile picture of ${partner.first_name || partner.firstName}`}
            />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-sm sm:text-base truncate">
            {partner.first_name || partner.firstName}{" "}
            {partner.last_name || partner.lastName}
          </h2>
          {partner?.isOnline ? (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
              <span className="text-[10px] sm:text-xs opacity-60">Online</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 opacity-50 italic">
              <span className="w-2 h-2 bg-base-300 rounded-full"></span>
              <span className="text-[10px] sm:text-xs">
                {partner?.last_seen || partner?.lastSeen
                  ? `Last seen ${new Date(partner?.last_seen || partner?.lastSeen).toLocaleDateString()}`
                  : "Offline"}
              </span>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pt-20 pb-20 lg:pb-8">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message, index) => {
            const isMyMessage =
              message.sender_id === parseInt(currentUserId || "0");

            const timestamp = new Date(message.created_at);
            const formattedTime = timestamp.toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            });

            const showHeader =
              index === 0 ||
              messages[index - 1].sender_id !== message.sender_id;

            return (
              <div
                key={message.id}
                className={`chat ${isMyMessage ? "chat-end" : "chat-start"} animate-fade-in`}
              >
                {showHeader && (
                  <div className="chat-header text-[10px] opacity-40 mb-1 px-1">
                    {isMyMessage
                      ? "You"
                      : partner.first_name || partner.firstName}
                  </div>
                )}
                <div
                  className={`chat-bubble shadow-sm text-sm sm:text-base py-2.5 px-4 rounded-2xl ${
                    isMyMessage
                      ? "chat-bubble-primary rounded-tr-none bg-gradient-to-br from-primary to-primary/90"
                      : "bg-base-100 border border-base-300 rounded-tl-none text-base-content"
                  }`}
                >
                  {message.content}
                </div>
                <div className="chat-footer opacity-30 text-[9px] mt-1 px-1">
                  {formattedTime}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </main>

      <footer className="fixed bottom-0 lg:bottom-4 left-0 right-0 p-3 pb-20 lg:pb-3 bg-base-100/90 lg:bg-transparent backdrop-blur-md lg:backdrop-blur-none border-t lg:border-t-0 z-40 transition-all">
        <form
          onSubmit={handleSendMessage}
          className="flex items-center gap-2 max-w-4xl mx-auto lg:bg-base-100 lg:p-2 lg:rounded-full lg:shadow-xl lg:border lg:border-base-300"
        >
          <input
            type="text"
            placeholder="Type your message..."
            className="input input-ghost focus:bg-base-200 flex-1 rounded-full px-4 lg:bg-transparent"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button
            type="submit"
            className="btn btn-primary btn-circle btn-sm sm:btn-md shadow-lg btn-glow"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4 sm:w-5 sm:h-5"
            >
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </form>
      </footer>
    </div>
  );
}
