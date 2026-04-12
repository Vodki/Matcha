"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "../../../services/api";

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }

    const verify = async () => {
      const result = await api.verify(token);
      if (result.error) {
        setStatus("error");
        setMessage(result.error);
      } else {
        setStatus("success");
        setMessage("Your email has been verified successfully!");
      }
    };

    verify();
  }, [token]);

  return (
    <div className="w-full min-h-screen bg-gradient-hero flex items-center justify-center py-8">
      <div className="flex flex-col gap-6 items-center w-full max-w-md mx-auto px-4 animate-fade-in">
        <div className="glass rounded-3xl shadow-xl w-full p-10 text-center animate-slide-up">
          {status === "loading" && (
            <>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center animate-pulse-soft">
                <span className="loading loading-spinner loading-lg text-white"></span>
              </div>
              <h1 className="text-3xl font-bold text-neutral mb-3">
                Verifying your email...
              </h1>
              <p className="text-neutral/70 text-lg leading-relaxed">
                Please wait while we verify your account.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-success to-emerald-400 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-neutral mb-3">
                Email Verified!
              </h1>
              <p className="text-neutral/70 text-lg mb-8 leading-relaxed">
                {message}
              </p>
              <Link
                href="/sign-in"
                className="btn btn-primary btn-glow shadow-lg font-bold text-lg py-3 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] w-full"
              >
                Sign In
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-error to-red-400 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-neutral mb-3">
                Verification Failed
              </h1>
              <p className="text-neutral/70 text-lg mb-8 leading-relaxed">
                {message}
              </p>
              <div className="flex flex-col gap-3">
                <Link
                  href="/sign-in"
                  className="btn btn-primary btn-glow shadow-lg font-bold text-lg py-3 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] w-full"
                >
                  Sign In
                </Link>
                <Link
                  href="/registration"
                  className="btn btn-ghost text-neutral/60 font-medium"
                >
                  ← Back to Registration
                </Link>
              </div>
            </>
          )}
        </div>

        <p className="text-xs text-neutral/50 text-center animate-slide-up animate-delay-200">
          Matcha — Brewing Connections, One Cup at a Time
        </p>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-screen bg-gradient-hero flex items-center justify-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
