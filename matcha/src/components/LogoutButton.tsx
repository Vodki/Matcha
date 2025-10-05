"use client";

import { useRouter } from "next/navigation";
import api from "../services/api";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const result = await api.logout();
    
    if (result.error) {
      console.error("Logout error:", result.error);
      alert("Error logging out: " + result.error);
      return;
    }

    // Redirection vers la page de connexion
    router.push("/sign-in");
  };

  return (
    <button 
      onClick={handleLogout}
      className="btn btn-ghost btn-sm"
    >
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
          d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
        />
      </svg>
      Logout
    </button>
  );
}
