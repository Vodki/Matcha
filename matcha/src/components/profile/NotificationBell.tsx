"use client";
import { useGlobalAppContext } from "@/contexts/GlobalAppContext";

export default function NotificationBell() {
  const { state, dispatch } = useGlobalAppContext();

  const unreadNotifications = state.notifications.filter(
    (n) => n.id === state.currentUser.id && !n.read
  );

  const handleOpenNotifications = () => {
    dispatch({ type: "MARK_NOTIFICATIONS_AS_READ" });
  };

  return (
    <div className="dropdown dropdown-end">
      <button
        tabIndex={0}
        role="button"
        className="btn btn-ghost btn-circle"
        onClick={handleOpenNotifications}
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
          {unreadNotifications.length > 0 && (
            <span className="badge badge-xs badge-primary indicator-item">
              {unreadNotifications.length}
            </span>
          )}
        </div>
      </button>
      <div
        tabIndex={0}
        className="mt-3 z-[1] card card-compact dropdown-content w-72 bg-base-100 shadow"
      >
        <div className="card-body">
          <span className="font-bold text-lg">Notifications</span>
          <div className="max-h-64 overflow-y-auto flex flex-col gap-2 mt-2">
            {state.notifications.filter((n) => n.id === state.currentUser.id)
              .length > 0 ? (
              [...state.notifications]
                .filter((n) => n.id === state.currentUser.id)
                .reverse()
                .map((notif) => (
                  <div key={notif.id} className="p-2 bg-base-200 rounded-md">
                    <p className="text-sm">{notif.message}</p>
                    <p className="text-xs text-right opacity-60">
                      {notif.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                ))
            ) : (
              <p className="text-sm opacity-70">Aucune notification.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
