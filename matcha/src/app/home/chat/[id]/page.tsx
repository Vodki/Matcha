/* eslint-disable @next/next/no-img-element */
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import api from "@/services/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useGlobalAppContext } from "@/contexts/GlobalAppContext";
import { websocketService } from "@/services/websocket";

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
        if (cachedPartner) {
          if (isMounted) setPartner(cachedPartner);
        } else {
          const userRes = await api.getUserById(chatPartnerId);
          if (userRes.data && isMounted) {
            setPartner(userRes.data);
          }
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

    unsubscribeRef.current = [unsubConnection, unsubChat];

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
    <div className="flex flex-col h-screen bg-base-200">
      <header className="fixed top-16 left-0 right-0 z-40 flex items-center gap-4 p-3 bg-base-100 shadow-md border-b">
        <button
          onClick={() => router.back()}
          className="btn btn-ghost btn-circle"
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
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
        </button>
        <div className="avatar">
          <div className="w-12 rounded-full">
            <img
              src={
                partner.avatar_url ||
                partner.images?.[0] ||
                "/default-avatar.png"
              }
              alt={`Profile picture of ${partner.first_name || partner.firstName}`}
            />
          </div>
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-lg">
            {partner.first_name || partner.firstName}{" "}
            {partner.last_name || partner.lastName}
          </h2>
          {wsConnected && (
            <span className="text-xs text-green-500">● Connected</span>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pt-32 pb-24">
        {messages.map((message) => {
          const isMyMessage =
            message.sender_id === parseInt(currentUserId || "0");
          const senderName = isMyMessage
            ? "Me"
            : partner.first_name || partner.firstName;

          const timestamp = new Date(message.created_at);
          const formattedTimestamp = new Intl.DateTimeFormat("fr-FR", {
            dateStyle: "short",
            timeStyle: "short",
          }).format(timestamp);

          return (
            <div
              key={message.id}
              className={`chat ${isMyMessage ? "chat-end" : "chat-start"}`}
            >
              <div className="chat-header text-xs opacity-70 mb-1">
                {senderName}
              </div>
              <div
                className={`chat-bubble ${
                  isMyMessage ? "chat-bubble-primary" : ""
                }`}
              >
                {message.content}
              </div>
              <div className="chat-footer opacity-50 text-xs mt-1">
                {formattedTimestamp}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-4 pb-20 bg-base-100/95 backdrop-blur-md border-t z-40">
        <form
          onSubmit={handleSendMessage}
          className="flex items-center gap-2 max-w-4xl mx-auto"
        >
          <input
            type="text"
            placeholder="Type your message..."
            className="input input-bordered flex-1"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">
            Send
          </button>
        </form>
      </footer>
    </div>
  );
}
