"use client";
import React from "react";
import StatsInformation from "../../../components/profile/StatsInformation";
import GeneralInformations from "../../../components/profile/GeneralInformations";

export default function Profile() {
  return (
    <div className="flex flex-col gap-2 w-full  mx-auto">
      <div className="mt-20 text-xl font-extrabold ms-2">Profile</div>
      <div className="bg-base-100/95 shadow-lg w-screen px-6 py-8 h-[75vh] lg:h-auto overflow-y-auto lg:card flex flex-col lg:flex-row gap-4 lg:gap-6">
        <div className="flex-1 min-w-0">
          <GeneralInformations />
        </div>
        <div className="flex-1 min-w-0">
          <StatsInformation />
        </div>
      </div>
    </div>
  );
}
