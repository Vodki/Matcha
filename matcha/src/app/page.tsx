import React from "react";

export default function Home() {
  return (
    <div className="flex items-start justify-start min-h-screen min-w-screen p-8">
      <div className="card bg-base-300 w-66 shadow-lg">
        <div className="card-body">
          <p className="text-xl font-bold">
            Meet your <span className="text-3xl text-neutral font-extrabold">Matcha</span>:
          </p>
          <p className="text-xl leading-normal font-bold">
            Brewing Connections
          </p>
          <p className="text-xl leading-normal font-bold">
            One Cup at a Time
          </p>
        </div>
      </div>
    </div>
  );
}
