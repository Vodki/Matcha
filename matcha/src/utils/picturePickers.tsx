"use client";

import React, { useRef } from "react";
import Image from "next/image";

interface PicturesPickerProps {
  pictures: File[];
  setPictures: React.Dispatch<React.SetStateAction<File[]>>;
  profilePicIdx: number;
  setProfilePicIdx: React.Dispatch<React.SetStateAction<number>>;
  maxPictures?: number;
}

const PicturesPicker: React.FC<PicturesPickerProps> = ({
  pictures,
  setPictures,
  profilePicIdx,
  setProfilePicIdx,
  maxPictures = 5,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (pictures.length < maxPictures) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter((file) =>
        file.type.startsWith("image/")
      );
      setPictures((prev) => {
        const updated = [...prev, ...newFiles].slice(0, maxPictures);
        if (prev.length === 0 && updated.length > 0) setProfilePicIdx(0);
        return updated;
      });
      e.target.value = "";
    }
  };

  const handleRemove = (idx: number) => {
    setPictures((prev) => {
      const newPics = prev.filter((_, i) => i !== idx);
      if (idx === profilePicIdx) setProfilePicIdx(0);
      else if (idx < profilePicIdx)
        setProfilePicIdx((cur) => Math.max(0, cur - 1));
      return newPics;
    });
  };

  const handleSetProfile = (idx: number) => {
    setProfilePicIdx(idx);
  };

  return (
    <div className="flex flex-col items-start w-full">
      <h2 className="text-sm font-semibold mb-2 text-neutral">Photos *</h2>
      <div className="flex gap-2 mb-1 flex-wrap">
        {pictures.map((file, idx) => (
          <div
            key={idx}
            className={`relative w-24 h-24 group rounded-md border ${
              idx === profilePicIdx
                ? "border-2 border-primary shadow-lg"
                : "border-info-content"
            } cursor-pointer`}
          >
            {idx !== profilePicIdx ? (
              <div
                className="tooltip tooltip-top w-full h-full"
                data-tip="Click to set as your profile picture"
              >
                <Image
                  src={URL.createObjectURL(file)}
                  alt={`pic-${idx}`}
                  className="w-full h-full object-cover rounded-md"
                  onClick={() => handleSetProfile(idx)}
                  tabIndex={0}
                  width={20}
                  height={20}
                />
              </div>
            ) : (
              <Image
                src={URL.createObjectURL(file)}
                alt={`pic-${idx}`}
                className="w-full h-full object-cover rounded-md"
                tabIndex={0}
                width={20}
                height={20}
              />
            )}

            <button
              type="button"
              className="absolute top-1 right-1 z-10 bg-info-content bg-opacity-60 rounded-full text-primary-content w-5 h-5 flex items-center justify-center opacity-80 hover:opacity-100"
              onClick={() => handleRemove(idx)}
              tabIndex={-1}
              aria-label="Remove photo"
            >
              ×
            </button>

            {idx === profilePicIdx && (
              <div className="absolute bottom-0 left-0 right-0 bg-primary text-primary-content text-xs font-semibold py-1 rounded-b-xs text-center animate-pulse">
                Profile picture
              </div>
            )}
          </div>
        ))}

        {pictures.length < maxPictures && (
          <div
            className="w-24 h-24 flex items-center justify-center rounded-md bg-base-200 cursor-pointer hover:bg-base-300 border border-dashed border-info-content text-3xl text-info-content"
            onClick={handleClick}
          >
            <span>+</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}
      </div>

      <div className="text-xs text-neutral select-none">
        {pictures.length}/{maxPictures} pictures selected
      </div>
    </div>
  );
};

export default PicturesPicker;
