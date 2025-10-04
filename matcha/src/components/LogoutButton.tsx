"use client";

import { useRouter } from "next/navigation";
import api from "../services/api";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const result = await api.logout();
    if (!result.error) {
      router.push("/sign-in");
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="btn btn-ghost btn-sm"
    >
      Logout
    </button>
  );
}
