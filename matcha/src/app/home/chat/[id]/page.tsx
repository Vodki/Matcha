/* eslint-disable @next/next/no-img-element */
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useMemo, useEffect, useRef } from "react";
import { useGlobalAppContext } from "@/contexts/GlobalAppContext";

export default function ChatPage() {
  const { state, dispatch } = useGlobalAppContext();
  const params = useParams();
  const router = useRouter();

  const chatPartnerId = params.id as string;
  const currentUserId = state.currentUser.id;

  const [newMessage, setNewMessage] = useState("");

  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const chatPartner = useMemo(() => {
    return state.users.find((u) => u.id === chatPartnerId);
  }, [state.users, chatPartnerId]);

  const conversationMessages = useMemo(() => {
    return state.messages
      .filter(
        (msg) =>
          (msg.fromUserId === currentUserId &&
            msg.toUserId === chatPartnerId) ||
          (msg.fromUserId === chatPartnerId && msg.toUserId === currentUserId)
      )
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }, [state.messages, currentUserId, chatPartnerId]);

  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newMessage.trim() === "") return;

    dispatch({
      type: "SEND_MESSAGE",
      payload: { toUserId: chatPartnerId, content: newMessage.trim() },
    });

    setNewMessage("");

    setTimeout(() => {
      if (!chatPartner) return;
      dispatch({
        type: "RECEIVE_BOT_MESSAGE",
        payload: {
          id: `bot-msg-${Date.now()}`,
          fromUserId: chatPartnerId,
          toUserId: currentUserId,
          content: `(auto-reply) Thanks for your message!`,
          timestamp: new Date(),
          read: false,
        },
      });
    }, 2000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages]);

  if (!chatPartner) {
    return <div className="p-4 text-center">Chat partner not found.</div>;
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
              src={chatPartner.images?.[0]}
              alt={`Profile picture of ${chatPartner.firstName}`}
            />
          </div>
        </div>
        <div>
          <h2 className="font-bold text-lg">{chatPartner.firstName}</h2>
          <span
            className={`text-sm ${
              chatPartner.isOnline ? "text-success" : "text-base-content/60"
            }`}
          >
            {chatPartner.isOnline ? "Online" : "Offline"}
          </span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pt-32 pb-24">
        {conversationMessages.map((message) => {
          const isMyMessage = message.fromUserId === currentUserId;
          const sender = isMyMessage ? state.currentUser : chatPartner;

          const formattedTimestamp = new Intl.DateTimeFormat("fr-FR", {
            dateStyle: "short",
            timeStyle: "short",
          }).format(message.timestamp);

          return (
            <div
              key={message.id}
              className={`chat ${isMyMessage ? "chat-end" : "chat-start"}`}
            >
              <div className="chat-image avatar">
                <div className="w-10 rounded-full">
                  <img
                    src={sender.images?.[0]}
                    alt={`${sender.firstName}'s avatar`}
                  />
                </div>
              </div>
              <div className="chat-header text-xs opacity-70 mb-1">
                {sender.firstName}
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
              />
            </svg>
          </button>
        </form>
      </footer>
    </div>
  );
}
