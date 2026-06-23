"use client";

import { useState } from "react";
import Image from "next/image";

type Props = {
  images: string[];
  alt: string;
};

/** Product image gallery: large active image + thumbnail strip. */
export default function ProductGallery({ images, alt }: Props) {
  const gallery = images.filter(Boolean);
  const [active, setActive] = useState(0);

  if (gallery.length === 0) {
    return (
      <div className="flex aspect-[4/5] w-full items-center justify-center bg-white text-ink/20">
        <span className="font-display text-6xl">EB</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-white">
        <Image
          src={gallery[active]}
          alt={alt}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 600px"
          className="object-cover"
        />
      </div>

      {gallery.length > 1 && (
        <div className="flex flex-wrap gap-3">
          {gallery.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`${alt} — ${i + 1}`}
              className={`relative h-20 w-16 overflow-hidden bg-white transition-opacity ${
                i === active
                  ? "ring-1 ring-brand"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
