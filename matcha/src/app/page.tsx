import React from "react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="w-screen min-h-screen bg-gradient-hero relative overflow-hidden">
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        <div className="glass rounded-3xl p-8 md:p-12 max-w-lg text-center animate-slide-up shadow-2xl">
          <div className="mb-6">
            <span className="text-6xl md:text-7xl font-black bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-pulse-soft">
              Matcha
            </span>
            <p className="text-lg text-base-content/70 mt-2 font-medium">
              Brewing Connections, One Cup at a Time
            </p>
          </div>

          <p className="text-base-content/80 text-lg mb-8 leading-relaxed">
            Find your perfect match. Connect with people who share your
            passions, interests, and dreams.
          </p>
          <div className="flex flex-col gap-4">
            <Link href="/sign-in" className="w-full">
              <button className="btn btn-primary btn-lg w-full shadow-lg font-bold text-lg btn-glow transition-all hover:scale-[1.02] hover:shadow-xl">
                Sign In
              </button>
            </Link>
            <Link href="/registration" className="w-full">
              <button className="btn btn-outline btn-lg w-full font-semibold transition-all hover:scale-[1.02]">
                Create Account
              </button>
            </Link>
          </div>

          <p className="text-xs text-base-content/50 mt-6">
            Join thousands of people finding meaningful connections
          </p>
        </div>
        <div className="absolute bottom-6 text-center text-base-content/40 text-sm animate-fade-in animate-delay-500">
          Made for authentic connections
        </div>
      </div>
    </div>
  );
}
