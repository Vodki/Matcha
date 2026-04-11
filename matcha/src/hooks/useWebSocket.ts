import { useEffect, useState, useCallback, useRef } from "react";
import { websocketService } from "../services/websocket";

interface Notification {
  id: number;
  notifType: string;
  sourceId: number;
  message: string;
  isRead: boolean;
}

interface ChatMessage {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: string;
  sender_name?: string;
}

interface OnlineStatusUpdate {
  user_id: number;
  isOnline: boolean;
}

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [onlineStatusMap, setOnlineStatusMap] = useState<Map<number, boolean>>(
    new Map(),
  );
  const unsubscribeRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    websocketService.connect();

    const unsubConnection = websocketService.on(
      "connection",
      (data: unknown) => {
        const status = (data as { status: string }).status;
        setIsConnected(status === "connected");
      },
    );

    const unsubNotification = websocketService.on(
      "notification",
      (data: unknown) => {
        const notif = data as Notification;
        setNotifications((prev) => [notif, ...prev]);
      },
    );

    const unsubChat = websocketService.on("chat_message", (data: unknown) => {
      const msg = data as ChatMessage;
      setChatMessages((prev) => [...prev, msg]);
    });

    const unsubOnline = websocketService.on("user_online", (data: unknown) => {
      const { user_id } = data as { user_id: number };
      setOnlineStatusMap((prev) => {
        const newMap = new Map(prev);
        newMap.set(user_id, true);
        return newMap;
      });
    });

    const unsubOffline = websocketService.on(
      "user_offline",
      (data: unknown) => {
        const { user_id } = data as { user_id: number };
        setOnlineStatusMap((prev) => {
          const newMap = new Map(prev);
          newMap.set(user_id, false);
          return newMap;
        });
      },
    );

    unsubscribeRef.current = [
      unsubConnection,
      unsubNotification,
      unsubChat,
      unsubOnline,
      unsubOffline,
    ];

    return () => {
      unsubscribeRef.current.forEach((unsub) => unsub());
    };
  }, []);

  const markNotificationRead = useCallback((id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
  }, []);

  const clearChatMessages = useCallback(() => {
    setChatMessages([]);
  }, []);

  const getUnreadCount = useCallback(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  return {
    isConnected,
    notifications,
    chatMessages,
    onlineStatusMap,
    markNotificationRead,
    clearChatMessages,
    getUnreadCount,
  };
}

export function useChatWebSocket(otherUserId: number) {
  const { chatMessages, isConnected } = useWebSocket();

  const messagesForConversation = chatMessages.filter(
    (msg) => msg.sender_id === otherUserId || msg.receiver_id === otherUserId,
  );

  return {
    isConnected,
    newMessages: messagesForConversation,
  };
}
