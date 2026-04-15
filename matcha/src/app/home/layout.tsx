"use client";
import Link from "next/link";
import Image from "next/image";
import { useGlobalAppContext } from "@/contexts/GlobalAppContext";
import NotificationBell from "../../components/profile/NotificationBell";
import LogoutButton from "@/components/LogoutButton";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { state } = useGlobalAppContext();

  const hasUnreadNotifications = state.notifications.some(
    (n) => !n.read && n.id === state.currentUser.id,
  );

  return (
    <ProtectedRoute>
      <section className="w-full min-h-screen pt-16 pb-20 lg:pb-0 bg-gradient-valentine">
        <div className="fixed inset-x-0 top-0 z-50 navbar glass shadow-md border-b border-white/20 px-4">
          <div className="navbar-start">
            <div className="dropdown dropdown-start lg:hidden">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-circle hover:bg-primary/10 transition-colors"
              >
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
                    d="M4 6h16M4 12h16M4 18h7"
                  />
                </svg>
              </div>

              <ul
                tabIndex={0}
                className="dropdown-content menu glass rounded-3xl z-50 w-64 p-3 shadow-2xl border border-white/20 mt-2"
              >
                <li className="menu-title opacity-50 px-4 py-2">Menu</li>
                <li>
                  <Link
                    href="/home"
                    className="flex items-center gap-3 py-4 rounded-2xl active:bg-primary"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/home/profile"
                    className="flex items-center gap-3 py-4 rounded-2xl active:bg-primary"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Profile
                  </Link>
                </li>
                <li>
                  <Link
                    href="/home/chat"
                    className="flex items-center gap-3 py-4 rounded-2xl active:bg-primary"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                      />
                    </svg>
                    Messages
                  </Link>
                </li>
              </ul>
            </div>

            <Link
              href="/home"
              className="flex items-center gap-2 hover:opacity-80 transition-all group ml-2 lg:ml-0"
            >
              <Image
                src="/tea-cup.svg"
                alt="Matcha Logo"
                width={28}
                height={28}
                className="w-7 h-7 group-hover:scale-110 transition-transform"
              />
              <span className="text-2xl font-black bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent group-hover:scale-105 transition-transform">
                Matcha
              </span>
            </Link>
          </div>

          <div className="navbar-center hidden lg:flex">
            <ul className="menu menu-horizontal gap-2 px-1">
              <li>
                <Link
                  href="/home"
                  className="rounded-full px-5 py-2 hover:bg-primary/10 font-bold active:bg-primary/20"
                >
                  Discovery
                </Link>
              </li>
              <li>
                <Link
                  href="/home/profile"
                  className="rounded-full px-5 py-2 hover:bg-primary/10 font-bold active:bg-primary/20"
                >
                  Profile
                </Link>
              </li>
              <li>
                <Link
                  href="/home/chat"
                  className="rounded-full px-5 py-2 hover:bg-primary/10 font-bold active:bg-primary/20 flex gap-2 items-center"
                >
                  Messages
                  {hasUnreadNotifications && (
                    <span className="badge badge-secondary badge-xs"></span>
                  )}
                </Link>
              </li>
            </ul>
          </div>

          <div className="navbar-end gap-3">
            <NotificationBell />
            <div className="divider divider-horizontal mx-0 hidden sm:flex opacity-20"></div>
            <LogoutButton />
          </div>
        </div>

        <div className="btm-nav btm-nav-md lg:hidden glass border-t border-white/20 shadow-2xl z-50">
          <Link
            href="/home"
            className="active:bg-primary/10 transition-colors border-0"
          >
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
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="btm-nav-label text-[10px] font-bold mt-1">
              Discovery
            </span>
          </Link>
          <Link
            href="/home/chat"
            className="active:bg-primary/10 transition-colors border-0 relative"
          >
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
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            {hasUnreadNotifications && (
              <span className="absolute top-2 right-1/2 translate-x-3 w-2 h-2 bg-secondary rounded-full animate-pulse shadow-sm"></span>
            )}
            <span className="btm-nav-label text-[10px] font-bold mt-1">
              Inbox
            </span>
          </Link>
          <Link
            href="/home/profile"
            className="active:bg-primary/10 transition-colors border-0"
          >
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
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="btm-nav-label text-[10px] font-bold mt-1">
              Profile
            </span>
          </Link>
        </div>

        <main className="max-w-7xl mx-auto">{children}</main>
      </section>
    </ProtectedRoute>
  );
}
