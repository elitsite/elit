"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { useState, useEffect } from "react";
interface EventsSectionProps {
  images?: string[];
}

export default function EventsSection({ images: propImages = [] }: EventsSectionProps) {
  const t = useTranslations("Categories");
  const tHome = useTranslations("Home");

  // Fallback to the default image if no images are provided
  const images = propImages && propImages.length > 0 
    ? propImages 
    : ["https://images.pexels.com/photos/19024679/pexels-photo-19024679.jpeg"];

  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-scroll images every 5 seconds
  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <section className="mx-auto my-12 max-w-6xl px-4 sm:my-20 sm:px-6 lg:px-8">
      <div className="relative mb-6 flex items-center sm:mb-10">
        <h2 className="flex-1 text-center font-display text-xl font-medium text-ink sm:text-3xl">
          {t("events")}
        </h2>
      </div>
      <div className="grid gap-4">
        <div className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-ink/5 sm:aspect-[16/10] sm:rounded-[2.5rem]">
          {/* Background Images Slider */}
          {images.map((img, idx) => (
            <div
              key={img + idx}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                }`}
            >
              <Image
                src={img}
                alt={`${t("weddings")} image ${idx + 1}`}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          ))}

          {/* Overlay */}
          <div className="absolute inset-0 z-20 bg-black/35 transition-colors group-hover:bg-black/45" />

          {/* Content */}
          <div className="absolute inset-0 z-30 flex flex-col items-start justify-end p-5 sm:p-8 lg:p-14">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/80 sm:text-[11px] sm:tracking-[0.3em]">
              {t("weddings")}
            </span>
            <p className="mt-2 max-w-[280px] font-display text-base italic text-white/90 sm:mt-3 sm:max-w-[320px] sm:text-lg">
              {tHome("events_weddings_desc")}
            </p>
            <Link
              href="/category/weddings"
              className="mt-4 inline-flex border border-white/50 bg-white/10 px-6 py-2.5 text-[9px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur-md transition-all hover:bg-white hover:text-ink sm:mt-6 sm:px-10 sm:py-3.5 sm:text-[10px]"
            >
              {tHome("cta_explore")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
