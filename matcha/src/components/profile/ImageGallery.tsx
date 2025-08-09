/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";

type ImageGalleryProps = {
  images: string[];
  name: string;
  className?: string;
  aspectClassName?: string;
};

export default function ImageGallery({
  images,
  name,
  className = "",
  aspectClassName = "aspect-[4/5]",
}: ImageGalleryProps) {
  const [idx, setIdx] = React.useState<number>(0);
  const hasThumbs = images.length > 1;
  const currentSrc = images[idx] ?? "/placeholder.png";

  return (
    <div className={className}>
      <div
        className={`${aspectClassName} w-full overflow-hidden rounded-t-box bg-base-200`}
      >
        <img
          src={currentSrc}
          alt={`Photo ${idx + 1} de ${name}`}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      {hasThumbs && (
        <div className="flex items-center gap-2 overflow-x-auto p-3">
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setIdx(i)}
              aria-label={`Voir la photo ${i + 1}`}
              className={`relative aspect-square h-14 shrink-0 overflow-hidden rounded-box ring-offset-2 transition ${
                i === idx ? "ring-2 ring-primary" : "ring-1 ring-base-200"
              }`}
            >
              <img
                src={src}
                alt={`Miniature ${i + 1} de ${name}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
