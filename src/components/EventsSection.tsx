"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Image from "next/image";

/**
 * "Weddings & Parties" section for the homepage.
 * Renders two side-by-side cards with background images and CTAs.
 */
export default function EventsSection() {
  const t = useTranslations("Categories");
  const tHome = useTranslations("Home");

  const cards = [
    {
      slug: "weddings",
      titleKey: "weddings",
      descKey: "events_weddings_desc",
      image: "https://images.pexels.com/photos/19024679/pexels-photo-19024679.jpeg",
      href: "/category/weddings",
    },
    {
      slug: "parties",
      titleKey: "parties",
      descKey: "events_parties_desc",
      image: "https://images.pexels.com/photos/18853305/pexels-photo-18853305.jpeg",
      href: "/category/parties",
    },
  ];

  return (
    <section className="mx-auto my-12 max-w-6xl px-4 sm:my-20 sm:px-6 lg:px-8">
      <div className="relative mb-6 flex items-center sm:mb-10">
        <h2 className="flex-1 text-center font-display text-xl font-medium text-ink sm:text-3xl">
          {t("events")}
        </h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
        {cards.map((card) => (
          <div
            key={card.slug}
            className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-ink/5 sm:aspect-[16/10] sm:rounded-[2.5rem]"
          >
            {/* Background Image */}
            <Image
              src={card.image}
              alt={`${t(card.titleKey)} - ${card.slug === 'weddings' ? 'Soulseeker on Pexels' : 'Jonathan Borba on Pexels'}`}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/35 transition-colors group-hover:bg-black/45" />
            
            {/* Content */}
            <div className="absolute inset-0 flex flex-col items-start justify-end p-5 sm:p-8 lg:p-14">
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/80 sm:text-[11px] sm:tracking-[0.3em]">
                {t(card.titleKey)}
              </span>
              <p className="mt-2 max-w-[280px] font-display text-base italic text-white/90 sm:mt-3 sm:max-w-[320px] sm:text-lg">
                {tHome(card.descKey)}
              </p>
              <Link
                href={card.href}
                className="mt-4 inline-flex border border-white/50 bg-white/10 px-6 py-2.5 text-[9px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur-md transition-all hover:bg-white hover:text-ink sm:mt-6 sm:px-10 sm:py-3.5 sm:text-[10px]"
              >
                {tHome("cta_explore")}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
