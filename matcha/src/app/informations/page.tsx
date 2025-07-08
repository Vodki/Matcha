"use client";

import React, { useState } from "react";
import TagsInput from "../../utils/tagInput";
import PicturesPicker from "../../utils/picturePickers";

export default function InformationsPage() {
  const [interests, setInterests] = useState<string[]>([]);
  const [pictures, setPictures] = useState<File[]>([]);
  const [profilePicIdx, setProfilePicIdx] = useState<number>(0);

  return (
    <div className="w-full min-h-screen">
      <div className="flex flex-col gap-2 items-center w-full md:max-w-md mx-auto px-2">
        <div className="mt-3 text-3xl font-extrabold text-neutral mb-2">
          Informations
        </div>
        <div className="bg-base-100/95 shadow-lg w-screen px-6 py-8 overflow-y-auto overflow-x-hidden md:card md:w-[430px] flex flex-col items-center gap-4 md:gap-6 h-[75vh] md:h-auto md:overflow-hidden">
          <fieldset className="fieldset w-full">
            <legend className="fieldset-legend text-sm font-semibold text-neutral pb-1">
              Gender
            </legend>
            <select
              defaultValue="Woman"
              className="select flex items-center gap-2
                px-3 py-2
                bg-primary-content
                transition-all duration-150
                w-full relative"
            >
              <option>Woman</option>
              <option>Man</option>
            </select>
          </fieldset>
          <fieldset className="fieldset w-full">
            <legend className="fieldset-legend text-sm font-semibold text-neutral pb-1">
              Sexual preferences
            </legend>
            <select
              defaultValue="Men & Women"
              className="select flex items-center gap-2
                px-3 py-2
                bg-primary-content
                transition-all duration-150
                w-full relative"
            >
              <option>Men & Women</option>
              <option>Men</option>
              <option>Women</option>
            </select>
          </fieldset>
          <fieldset className="fieldset w-full">
            <legend className="fieldset-legend text-sm font-semibold text-neutral pb-1">
              Something about yourself :
            </legend>
            <textarea
              className="textarea flex items-center gap-2
                px-3 py-2 bg-primary-content transition-all duration-150
                w-full relative"
              placeholder="Write something about yourself..."
            />
          </fieldset>
          <TagsInput interests={interests} setInterests={setInterests} />
          <PicturesPicker
            pictures={pictures}
            setPictures={setPictures}
            profilePicIdx={profilePicIdx}
            setProfilePicIdx={setProfilePicIdx}
          />
          <button
            type="submit"
            className="btn btn-primary shadow-lg font-bold
           text-lg px-8 py-3 mt-3 transition-all hover:scale-[1.03] active::scale-95 w-full"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
