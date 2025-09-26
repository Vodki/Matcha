"use client";
import Link from "next/link";
import { useGlobalAppContext } from "../contexts/GlobalAppContext";
import NotificationBell from "../../components/profile/NotificationBell";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { state } = useGlobalAppContext();

  const hasUnreadNotifications = state.notifications.some(
    (n) => !n.read && n.id === state.currentUser.id
  );

  return (
    <section className="w-full min-h-screen pt-16">
      <div className="fixed inset-x-0 top-0 z-50 navbar bg-base-100/95 shadow-sm">
        <div className="navbar-start">
          <div className="dropdown dropdown-start text-sm">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-ghost btn-circle indicator"
            >
              {hasUnreadNotifications && (
                <span className="indicator-item badge badge-secondary badge-xs"></span>
              )}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h7"
                />
              </svg>
            </div>

            <ul
              tabIndex={0}
              className="dropdown-content menu bg-base-100 z-50 w-52 p-2 shadow-sm"
            >
              <li>
                <Link href="/home" className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                    />
                  </svg>
                  <div className="mt-1">Home</div>
                </Link>
              </li>
              <li>
                <Link href="/home/profile" className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                    />
                  </svg>
                  <div className="mt-1">Profile</div>
                </Link>
              </li>
              <div className="divider my-1"></div>
              <li>
                <Link href="/home/chat" className="flex items-center gap-2">
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
                      d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.76 9.76 0 0 1-2.53-.375l-4.5 1.5a.75.75 0 0 1-.926-.926l1.5-4.5A9.76 9.76 0 0 1 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                    />
                  </svg>
                  <div className="mt-1">Chat</div>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="navbar-center">
          <span className="text-2xl font-bold">Matcha</span>
          <NotificationBell />
        </div>

        <div className="navbar-end">
          <Link
            href="/"
            className="btn btn-ghost text-sm flex items-center gap-2"
          >
            <div className="mt-0.5">Log Out</div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"
              />
            </svg>
          </Link>
        </div>
      </div>

      {children}
    </section>
  );
}
