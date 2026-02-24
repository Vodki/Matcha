"use client";

import React from "react";
import Link from "next/link";

export default function VerificationPage() {
  return (
    <div className="w-full min-h-screen bg-gradient-hero flex items-center justify-center py-8">
      <div className="flex flex-col gap-6 items-center w-full max-w-md mx-auto px-4 animate-fade-in">
        <div className="glass rounded-3xl shadow-xl w-full p-10 text-center animate-slide-up">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center animate-pulse-soft">
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
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-neutral mb-3">
            Check your inbox!
          </h1>
          <p className="text-neutral/70 text-lg mb-6 leading-relaxed">
            We have sent a verification link to your email address. Click the
            link to verify your account and start using Matcha!
          </p>

          <div className="bg-base-200/50 rounded-2xl p-4 mb-6 text-left">
            <p className="text-sm text-neutral/60 mb-2">
              <span className="font-semibold">Tip:</span> If you do not see the
              email:
            </p>
            <ul className="text-sm text-neutral/60 list-disc list-inside space-y-1">
              <li>Check your spam or junk folder</li>
              <li>Make sure you entered the correct email</li>
              <li>Wait a few minutes and refresh</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/sign-in"
              className="btn btn-primary btn-glow shadow-lg font-bold text-lg py-3 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] w-full"
            >
              Already verified? Sign In
            </Link>
            <Link
              href="/registration"
              className="btn btn-ghost text-neutral/60 font-medium"
            >
              ← Back to Registration
            </Link>
          </div>
        </div>

        <p className="text-xs text-neutral/50 text-center animate-slide-up animate-delay-200">
          Did not receive the email? Contact support for help.
        </p>
      </div>
    </div>
  );
}
