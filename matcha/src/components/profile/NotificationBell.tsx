"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import api from "@/services/api";
import Link from "next/link";
import { websocketService } from "@/services/websocket";

interface Notification {
  id: number;
  type: string;
  source_id?: number;
  message?: string;
  is_read: boolean;
  read?: boolean;
  created_at: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [wsConnected, setWsConnected] = useState(false);
  const unsubscribeRef = useRef<(() => void)[]>([]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.getNotifications();
      if (res.data?.notifications) {
        setNotifications(res.data.notifications);
        setUnreadCount(
          res.data.notifications.filter(
            (n: Notification) => !n.is_read && !n.read,
          ).length,
        );
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    websocketService.connect();

    const unsubConnection = websocketService.on(
      "connection",
      (data: unknown) => {
        const status = (data as { status: string }).status;
        setWsConnected(status === "connected");
      },
    );
    const unsubNotification = websocketService.on(
      "notification",
      (data: unknown) => {
        const notif = data as {
          id: number;
          notifType: string;
          sourceId: number;
          message: string;
          isRead: boolean;
        };
        const newNotif: Notification = {
          id: notif.id,
          type: notif.notifType,
          source_id: notif.sourceId,
          message: notif.message,
          is_read: notif.isRead,
          created_at: new Date().toISOString(),
        };
        setNotifications((prev) => [newNotif, ...prev]);
        setUnreadCount((prev) => prev + 1);
      },
    );

    unsubscribeRef.current = [unsubConnection, unsubNotification];

    const interval = setInterval(() => {
      if (!websocketService.isConnected()) {
        fetchNotifications();
      }
    }, 30000);

    return () => {
      unsubscribeRef.current.forEach((unsub) => unsub());
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  const handleMarkRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, is_read: true, read: true } : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark read", err);
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.is_read && !n.read);
    for (const n of unread) {
      handleMarkRead(n.id);
    }
  };

  return (
    <div className="dropdown dropdown-end">
      <button
        tabIndex={0}
        role="button"
        className="btn btn-ghost btn-circle"
        onClick={handleMarkAllRead}
      >
        <div className="indicator">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {unreadCount > 0 && (
            <span className="badge badge-xs badge-primary indicator-item">
              {unreadCount}
            </span>
          )}
          {wsConnected && (
            <span
              className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-500 rounded-full"
              title="Real-time connected"
            />
          )}
        </div>
      </button>
      <div
        tabIndex={0}
        className="mt-3 z-[1] card card-compact dropdown-content w-80 bg-base-100 shadow-xl max-h-96 overflow-y-auto"
      >
        <div className="card-body">
          <span className="font-bold text-lg">
            Notifications
            {wsConnected && (
              <span className="text-xs text-green-500 ml-2">● Live</span>
            )}
          </span>
          <div className="flex flex-col gap-2 mt-2">
            {notifications.length > 0 ? (
              notifications.map((notif) => {
                const getNotificationLink = (): string | null => {
                  if (!notif.source_id) return null;

                  switch (notif.type) {
                    case "message":
                      return `/home/chat/${notif.source_id}`;
                    case "like":
                    case "view":
                    case "match":
                    case "unlike":
                      return `/home/profile/${notif.source_id}`;
                    default:
                      return null;
                  }
                };

                const link = getNotificationLink();
                const notifContent = (
                  <>
                    <p>{notif.message}</p>
                    {link && (
                      <p className="text-secondary text-xs mt-1">
                        {notif.type === "message"
                          ? "💬 Reply"
                          : "👤 View profile"}
                      </p>
                    )}
                    <p className="text-xs text-right opacity-60 mt-1">
                      {new Date(notif.created_at).toLocaleString()}
                    </p>
                  </>
                );

                return link ? (
                  <Link
                    key={notif.id}
                    href={link}
                    className={`block p-3 rounded-md text-sm cursor-pointer hover:ring-2 hover:ring-primary transition-all ${notif.is_read || notif.read ? "bg-base-200 opacity-70" : "bg-base-300 font-semibold"}`}
                    onClick={() => handleMarkRead(notif.id)}
                  >
                    {notifContent}
                  </Link>
                ) : (
                  <div
                    key={notif.id}
                    className={`p-3 rounded-md text-sm ${notif.is_read || notif.read ? "bg-base-200 opacity-70" : "bg-base-300 font-semibold"}`}
                    onClick={() => handleMarkRead(notif.id)}
                  >
                    {notifContent}
                  </div>
                );
              })
            ) : (
              <p className="text-sm opacity-70">No notifications.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
