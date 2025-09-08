import React from "react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="w-screen h-screen">
      <div
        className="
          bg-base-300 
          pt-10 ps-6 pb-8
          w-full
          md:relative md:w-80 md:ms-14 md:mt-14 md:inline-block md:rounded-box md:shadow-lg
        "
      >
        <p className="text-2xl font-bold">
          Meet your{" "}
          <span className="text-4xl text-neutral font-extrabold">Matcha</span>:
        </p>
        <p className="text-2xl leading-normal font-bold">Brewing Connections</p>
        <p className="text-2xl leading-normal font-bold">One Cup at a Time</p>
      </div>
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 flex flex-col">
        <button className="btn btn-primary text-base font-bold">
          <Link href={"/sign-in"}>Sign In</Link>
        </button>
        <button className="link link-primary text-sm self-center mt-1">
          <Link href={"/registration"}>Sign Up</Link>
        </button>
      </div>
    </div>
  );
}
