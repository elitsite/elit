"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { EventContent, LocalizedText, PortfolioItem } from "@/lib/supabase";
import type { Locale } from "@/i18n/routing";

// ─────────────────────────────────────────
// Default content shown when DB fields are empty
// Admin can override any field via the admin panel
// ─────────────────────────────────────────
const DEFAULTS: Partial<EventContent> = {
  hero_kicker: { nl: "A touch of magic", en: "A touch of magic" },
  hero_title: { nl: "elegant & luxury weddings", en: "elegant & luxury weddings" },
  hero_subtitle: {
    nl: "Met een magische touch maken we van elke high-end bruiloft een unieke ervaring.",
    en: "With a magical touch we make every high-end wedding a unique experience.",
  },
  hero_button: { nl: "Onze betoverende huwelijken", en: "Our enchanting weddings" },

  intro_kicker: { nl: "What to expect", en: "What to expect" },
  intro_title: { nl: "Complete planning & design", en: "Complete planning & design" },
  intro_text: {
    nl: "Een high-end bruiloft geeft een schatkamer aan herinneringen. Met luxe styling, een gedetailleerde planning en een betrokken team organiseren we jullie bruiloft met een gouden randje. Van begin tot eind.\n\nEen feest der herkenning voor jullie gasten: de styling, de uitnodigingen, de sfeer en het entertainment ademen wie jullie zijn als bruidspaar. Samen creëren we een unieke bruiloft. Dat begint bij het kiezen van de locatie en het uitzetten van de grote lijnen.",
    en: "A high-end wedding creates a treasure trove of memories. With luxury styling, detailed planning and a dedicated team we organise your wedding with a golden edge. From beginning to end.",
  },
  intro_text_col2: {
    nl: "Ruim voor de grote dag begint, is het hele team op de hoogte van de laatste details. Een exclusieve bruiloft vraagt om een goede samenwerking. Daarom vormen wij één team met alle leveranciers, met een vast aanspreekpunt voor het bruidspaar. Van de jongste gast tot de oudste generatie: op jullie bruiloft beleeft iedereen een ervaring om nooit te vergeten.",
    en: "Well before the big day, the entire team is up to date on the latest details. An exclusive wedding requires good collaboration. That's why we form one team with all suppliers, with a single point of contact for the couple.",
  },
  intro_button: { nl: "Bekijk ons portfolio", en: "View our portfolio" },

  full_service_title: { nl: "Full service", en: "Full service" },
  full_service_text: {
    nl: "Het organiseren van een bruiloft gaat verder dan concept, design en planning. Ook op het moment suprême nemen we jullie alles uit handen. We ontvangen de gasten in een perfect gestylede ruimte: aan elk detail is gedacht. En als iedereen het feest met een glimlach verlaat, laten wij de locatie netjes achter.",
    en: "Organising a wedding goes further than concept, design and planning. On the big moment itself we take everything off your hands. We welcome guests in a perfectly styled space: every detail has been considered.",
  },
  full_service_included_label: { nl: "Included", en: "Included" },
  full_service_included: {
    nl: "+ Locatiemanagement\n+ Totaalconcept in 3D-ontwerp\n+ Design, styling & wedding stationery\n+ Catering & entertainment\n+ Technische productie, security & staff\n+ Gastenmanagement\n+ Foto- en videografie",
    en: "+ Location management\n+ Total concept in 3D design\n+ Design, styling & wedding stationery\n+ Catering & entertainment\n+ Technical production, security & staff\n+ Guest management\n+ Photo & videography",
  },

  other_services_kicker: { nl: "Other services", en: "Other services" },
  service1_title: { nl: "Destination Weddings", en: "Destination Weddings" },
  service1_text: {
    nl: "Van Italië tot Curaçao en van Frankrijk tot Zuid-Afrika: high-end bruiloften organiseren we over de hele wereld. We plannen de volledige bruiloft: van leveranciers die het beste bij jullie wensen passen tot het vervoer van de gasten.",
    en: "From Italy to Curaçao and from France to South Africa: we organise high-end weddings all over the world. We plan the complete wedding: from suppliers that best match your wishes to transporting the guests.",
  },
  service1_italic: {
    nl: "Wij zijn benieuwd naar jullie ideale trouwlocatie.",
    en: "We are curious about your ideal wedding location.",
  },
  service1_cta: { nl: "Laat het ons weten", en: "Let us know" },
  service2_title: { nl: "Private Events", en: "Private Events" },
  service2_text: {
    nl: "Het leven is er om te vieren. Daarom organiseren we ook voor andere gelegenheden exclusieve events. Denk aan een gouden bruiloft, het feest van Sara of Abraham, een 21-diner of een genderrevealparty.",
    en: "Life is meant to be celebrated. That's why we also organise exclusive events for other occasions. Think of a golden wedding, Sara or Abraham's party, a 21-dinner or a gender reveal party.",
  },
  service2_italic: {
    nl: "Schakel ons in voor een stijlvolle totaalbeleving.",
    en: "Engage us for a stylish total experience.",
  },
  service2_cta: { nl: "Neem contact op", en: "Contact us" },

  final_choices_title: { nl: "Final choices", en: "Final choices" },
  final_choices_text: {
    nl: "Tijdens het hele proces houden jullie de eindregie. Wij maken de financiële stand van zaken voor jullie inzichtelijk; contracten tekenen jullie zelf. Verder kunnen jullie de recente documenten altijd inzien. Denk aan checklists, budgetbewaking en gastenlijsten. De planning van een huwelijk is maatwerk. Aan de hand van jullie persoonlijke verhaal ontwerpen en plannen we jullie exclusieve bruiloft. Daarom werken we met een startbudget vanaf € 80.000,-.",
    en: "Throughout the entire process you retain final control. We make the financial situation transparent for you; contracts are signed by you. You can always view the latest documents: checklists, budget monitoring and guest lists. Wedding planning is tailor-made. Based on your personal story we design and plan your exclusive wedding.",
  },
  final_choices_link: { nl: "Zo verloopt het proces", en: "How the process works" },

  process_steps: [
    {
      title: { nl: "Consultation", en: "Consultation" },
      text: {
        nl: "Het bruidspaar vormt de basis van een unieke bruiloft. Daarom ontdekken we in dit gesprek jullie persoonlijke wensen en brainstormen we over de styling en het entertainment.",
        en: "The couple forms the basis of a unique wedding. In this conversation we discover your personal wishes and brainstorm about styling and entertainment.",
      },
    },
    {
      title: { nl: "Design & planning", en: "Design & planning" },
      text: {
        nl: "Wij maken een exclusief design, tot in detail in jullie stijl gegoten. Daarbij kiezen we de beste leveranciers en starten we met het plannen van jullie event.",
        en: "We create an exclusive design, cast in detail in your style. We choose the best suppliers and start planning your event.",
      },
    },
    {
      title: { nl: "Let's create magic", en: "Let's create magic" },
      text: {
        nl: "Elke partij ontvangt een persoonlijk draaiboek, alles staat klaar en we verwelkomen de gasten. Geen vraag is te gek, we helpen iedereen. Jullie creëren intussen de mooiste herinneringen.",
        en: "Every party receives a personal script, everything is ready and we welcome the guests. No question is too much, we help everyone. Meanwhile you create the most beautiful memories.",
      },
    },
  ],

  portfolio_sidebar_text: {
    nl: "Onze designs kwamen tot leven bij tientallen intieme bruiloften.",
    en: "Our designs came to life at dozens of intimate weddings.",
  },
  portfolio_kicker: { nl: "Bekijk ons portfolio", en: "View our portfolio" },
  portfolio_title: { nl: "Portfolio", en: "Portfolio" },

  quote_kicker: { nl: "Love letters", en: "Love letters" },
  quote_text: {
    nl: "Our answer to the brides wishes: a fairytale garden wedding in a monumental building in the middle of Amsterdam.",
    en: "Our answer to the brides wishes: a fairytale garden wedding in a monumental building in the middle of Amsterdam.",
  },
  quote_author: { nl: "Bettina & Guillermo", en: "Bettina & Guillermo" },

  bloom_kicker: { nl: "Let's plan together", en: "Let's plan together" },
  bloom_title: { nl: "BLOOM WITH US", en: "BLOOM WITH US" },
  bloom_text: {
    nl: "Een droombruiloft ontstaat wanneer alles samenkomt: jullie verhaal en onze expertise. Daarom werken we het liefst samen met jullie als bruidspaar. Op professionele, persoonlijke en exclusieve wijze organiseren we de high-end wedding die bij jullie past. Samen gaan we voor het hoogst haalbare.",
    en: "A dream wedding comes together when everything aligns: your story and our expertise. That's why we love working together with you as a couple. In a professional, personal and exclusive way we organise the high-end wedding that suits you.",
  },
  bloom_button: { nl: "Ontdek onze werkwijze", en: "Discover our approach" },

  cta_title: { nl: "Let's create magic together", en: "Let's create magic together" },
  cta_text: {
    nl: "Samen maken we van jullie wensen en dromen liefdevolle herinneringen. Neem vrijblijvend contact op en ontdek wat we voor jullie kunnen betekenen.",
    en: "Together we turn your wishes and dreams into loving memories. Contact us without obligation and discover what we can do for you.",
  },
  cta_button: { nl: "Neem contact op", en: "Contact us" },

  form_title: { nl: "Plan een afspraak", en: "Book an appointment" },
};

/** Merge DB content with defaults — DB values always win when present */
function withDefaults(content: EventContent): EventContent {
  const merged = { ...content } as unknown as Record<string, unknown>;
  for (const key of Object.keys(DEFAULTS) as (keyof EventContent)[]) {
    const dbVal = content[key];
    const defVal = DEFAULTS[key];
    if (defVal === undefined) continue;
    // Arrays: use DB if non-empty, else default
    if (Array.isArray(defVal)) {
      if (!Array.isArray(dbVal) || (dbVal as unknown[]).length === 0) {
        merged[key] = defVal;
      }
      continue;
    }
    // Strings: use DB if non-empty
    if (typeof defVal === "string") {
      if (!dbVal || (dbVal as string).length === 0) merged[key] = defVal;
      continue;
    }
    // LocalizedText: fill missing locales
    if (typeof defVal === "object" && defVal !== null) {
      const dbObj = (dbVal as LocalizedText) ?? {};
      const defObj = defVal as LocalizedText;
      merged[key] = {
        en: dbObj.en || defObj.en || "",
        nl: dbObj.nl || defObj.nl || "",
        uk: dbObj.uk || defObj.uk || "",
      };
    }
  }
  return merged as unknown as EventContent;
}

// ── Helpers ──
function t(field: LocalizedText | undefined, locale: Locale): string {
  if (!field) return "";
  return field[locale] || field.en || "";
}
function hasContent(field: LocalizedText | undefined): boolean {
  if (!field) return false;
  return !!(field.en || field.uk || field.nl);
}

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] as number[] } },
};

function BtnOutline({ children, href = "#inquiry-form", white = false }: {
  children: React.ReactNode; href?: string; white?: boolean;
}) {
  if (white) {
    return (
      <a href={href} className="inline-block border border-white/70 px-10 py-4 text-[11px] font-medium uppercase tracking-[0.2em] text-white transition-all duration-300 hover:bg-white hover:text-ink">
        {children}
      </a>
    );
  }
  return (
    <a href={href} className="inline-block border border-ink/30 px-8 py-3.5 text-[11px] font-medium uppercase tracking-[0.2em] text-ink transition-all duration-300 hover:border-brand hover:bg-brand hover:text-cream">
      {children}
    </a>
  );
}

// ─────────────────────────────────────────
// § 1  HERO
// ─────────────────────────────────────────
function HeroSection({ content, locale }: { content: EventContent; locale: Locale }) {
  const kicker = t(content.hero_kicker, locale);
  const title = t(content.hero_title, locale);
  const subtitle = t(content.hero_subtitle, locale);
  const button = t(content.hero_button, locale);

  return (
    <section className="relative flex h-[90vh] items-center justify-center overflow-hidden">
      {content.hero_image ? (
        <Image src={content.hero_image} alt={title || "Wedding"} fill priority className="object-cover" />
      ) : (
        <div className="absolute inset-0 bg-taupe/20" />
      )}
      <div className="absolute inset-0 bg-black/25" />
      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center text-white">
        {kicker && (
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-6 text-[11px] font-medium uppercase tracking-[0.4em] text-white/80">
            {kicker}
          </motion.p>
        )}
        {title && (
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.0, delay: 0.4 }}
            className="mb-8 font-display text-5xl font-normal leading-none sm:text-7xl lg:text-8xl">
            {title}
          </motion.h1>
        )}
        {subtitle && (
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.65 }}
            className="mx-auto mb-12 max-w-2xl text-lg font-light italic text-white/90">
            {subtitle}
          </motion.p>
        )}
        {button && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.85 }}>
            <BtnOutline white>{button}</BtnOutline>
          </motion.div>
        )}
      </div>
      <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2">
        <ChevronDown size={28} className="animate-gentle-bounce text-white/50" />
      </div>
    </section>
  );
}

// ─────────────────────────────────────────
// § 2  WHAT TO EXPECT
// ─────────────────────────────────────────
function WhatToExpectSection({ content, locale }: { content: EventContent; locale: Locale }) {
  const kicker = t(content.intro_kicker, locale);
  const title = t(content.intro_title, locale);
  const text1 = t(content.intro_text, locale);
  const text2 = t(content.intro_text_col2, locale);
  const button = t(content.intro_button, locale);
  if (!title && !text1) return null;

  return (
    <section className="bg-white py-[100px]">
      <div className="mx-auto max-w-[1200px] px-6 sm:px-10">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-20">
          {kicker && <p className="mb-4 text-[11px] uppercase tracking-[0.3em] text-ink/40">{kicker}</p>}
          {title && <h2 className="font-display text-5xl font-normal text-ink lg:text-6xl">{title}</h2>}
        </motion.div>
        <div className="mb-16 grid items-start gap-20 md:grid-cols-2">
          {text1 && (
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <p className="text-xl italic leading-relaxed text-ink/80">{text1}</p>
            </motion.div>
          )}
          {text2 && (
            <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="leading-loose text-ink/55">
              {text2}
            </motion.p>
          )}
        </div>
        {button && <div className="text-center"><BtnOutline href="#portfolio">{button}</BtnOutline></div>}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────
// § 3  FULL SERVICE
// ─────────────────────────────────────────
function FullServiceSection({ content, locale }: { content: EventContent; locale: Locale }) {
  const title = t(content.full_service_title, locale);
  const text = t(content.full_service_text, locale);
  const includedRaw = t(content.full_service_included, locale);
  const includedLabel = t(content.full_service_included_label, locale) || "Included";
  const items = includedRaw ? includedRaw.split("\n").filter((l) => l.trim()) : [];
  if (!title && !content.full_service_image) return null;

  return (
    <section className="flex min-h-[700px] flex-col md:flex-row">
      <div className="relative min-h-[500px] w-full overflow-hidden md:w-1/2">
        {content.full_service_image ? (
          <Image src={content.full_service_image} alt={title || "Full service"} fill className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-taupe/10 text-xs text-ink/15">800 × 1067 px</div>
        )}
      </div>
      <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
        className="flex w-full items-center justify-center bg-cream p-12 md:w-1/2 md:p-24">
        <div className="max-w-lg">
          {title && <h2 className="mb-12 font-display text-5xl font-normal text-ink">{title}</h2>}
          {text && <p className="mb-12 leading-loose text-ink/55">{text}</p>}
          {items.length > 0 && (
            <div>
              <p className="mb-8 text-[11px] font-bold uppercase tracking-[0.3em] text-ink">{includedLabel}</p>
              <ul className="space-y-4 font-light text-ink/55">
                {items.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          )}
        </div>
      </motion.div>
    </section>
  );
}

// ─────────────────────────────────────────
// § 4  OTHER SERVICES
// ─────────────────────────────────────────
function OtherServicesSection({ content, locale }: { content: EventContent; locale: Locale }) {
  const kicker = t(content.other_services_kicker, locale);
  const s1Title = t(content.service1_title, locale);
  const s1Text = t(content.service1_text, locale);
  const s1Italic = t(content.service1_italic, locale);
  const s1Cta = t(content.service1_cta, locale);
  const s2Title = t(content.service2_title, locale);
  const s2Text = t(content.service2_text, locale);
  const s2Italic = t(content.service2_italic, locale);
  const s2Cta = t(content.service2_cta, locale);
  if (!s1Title && !s2Title && !content.other_services_image) return null;

  return (
    <section className="bg-white py-[100px]">
      <div className="mx-auto grid max-w-[1280px] gap-20 px-6 sm:px-10 md:grid-cols-2">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="flex flex-col justify-center">
          {kicker && <p className="mb-12 text-[11px] uppercase tracking-[0.3em] text-ink/40">{kicker}</p>}
          {s1Title && (
            <div className="mb-20">
              <h3 className="mb-6 font-display text-4xl font-normal text-ink">{s1Title}</h3>
              {s1Text && <p className="mb-8 leading-loose text-ink/55">{s1Text}</p>}
              {s1Italic && <p className="mb-8 font-light italic text-ink/70">{s1Italic}</p>}
              {s1Cta && <BtnOutline>{s1Cta}</BtnOutline>}
            </div>
          )}
          {s2Title && (
            <div className="border-t border-black/5 pt-20">
              <h3 className="mb-6 font-display text-4xl font-normal text-ink">{s2Title}</h3>
              {s2Text && <p className="mb-8 leading-loose text-ink/55">{s2Text}</p>}
              {s2Italic && <p className="mb-8 font-light italic text-ink/70">{s2Italic}</p>}
              {s2Cta && <BtnOutline>{s2Cta}</BtnOutline>}
            </div>
          )}
        </motion.div>
        <div className="relative h-[800px] overflow-hidden">
          {content.other_services_image ? (
            <Image src={content.other_services_image} alt="" fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-taupe/10 text-xs text-ink/15">800 × 1200 px</div>
          )}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────
// § 5  FINAL CHOICES
// ─────────────────────────────────────────
function FinalChoicesSection({ content, locale }: { content: EventContent; locale: Locale }) {
  const title = t(content.final_choices_title, locale);
  const text = t(content.final_choices_text, locale);
  const link = t(content.final_choices_link, locale);
  if (!title && !text) return null;

  return (
    <section className="bg-cream py-32">
      <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
        className="mx-auto max-w-4xl px-6 text-center sm:px-10">
        {title && <h2 className="mb-12 font-display text-5xl font-normal text-ink">{title}</h2>}
        {text && <p className="mb-12 leading-[2] text-ink/55">{text}</p>}
        {link && (
          <a href="#process" className="border-b border-ink pb-2 text-[11px] font-bold uppercase tracking-[0.3em] text-ink">
            {link}
          </a>
        )}
      </motion.div>
    </section>
  );
}

// ─────────────────────────────────────────
// § 6  PROCESS
// ─────────────────────────────────────────
const ROMAN = ["I", "II", "III", "IV", "V", "VI"];

function ProcessSection({ content, locale }: { content: EventContent; locale: Locale }) {
  const steps = content.process_steps ?? [];
  if (steps.length === 0) return null;
  const ctaLabels: Record<Locale, string> = { en: "Book an appointment", uk: "Записатися", nl: "Plan een afspraak" };

  return (
    <section id="process" className="bg-white py-[100px]">
      <div className="mx-auto max-w-[1200px] px-6 sm:px-10">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-24 text-center">
          <h2 className="font-display text-6xl font-normal text-ink">Process</h2>
          <div className="mx-auto mt-8 h-px w-24 bg-black/10" />
        </motion.div>
        <div className="mb-24 grid gap-16 text-center md:grid-cols-3">
          {steps.map((step, i) => (
            <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}>
              <span className="mb-8 block font-display text-4xl font-light text-ink/20">{ROMAN[i] ?? `${i + 1}`}</span>
              {step.title && hasContent(step.title) && (
                <h4 className="mb-8 text-[11px] font-bold uppercase tracking-[0.3em] text-ink">{t(step.title, locale)}</h4>
              )}
              {step.text && hasContent(step.text) && (
                <p className="mx-auto max-w-xs px-4 text-sm leading-relaxed text-ink/55">{t(step.text, locale)}</p>
              )}
            </motion.div>
          ))}
        </div>
        <div className="text-center">
          <BtnOutline>{ctaLabels[locale] ?? ctaLabels.nl}</BtnOutline>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────
// § 7  PORTFOLIO
// ─────────────────────────────────────────
function PortfolioSection({ content, locale }: { content: EventContent; locale: Locale }) {
  const portfolio = content.portfolio ?? [];
  const sidebarText = t(content.portfolio_sidebar_text, locale);
  const kicker = t(content.portfolio_kicker, locale);

  return (
    <section id="portfolio" className="bg-cream py-24">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-20 px-6 sm:px-10 lg:flex-row">
        <div className="flex-1 grid gap-8 md:grid-cols-3">
          {portfolio.length > 0
            ? portfolio.map((item: PortfolioItem, i: number) => (
                <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}>
                  {item.image ? (
                    <div className="relative mb-4 aspect-[3/4] w-full overflow-hidden">
                      <Image src={item.image} alt={t(item.caption, locale)} fill
                        className="object-cover transition-transform duration-500 hover:scale-105" />
                    </div>
                  ) : (
                    <div className="mb-4 flex aspect-[3/4] w-full items-center justify-center bg-taupe/10 text-xs text-ink/15">600 × 800 px</div>
                  )}
                  {hasContent(item.caption) && (
                    <p className="text-[13px] text-ink/60">{t(item.caption, locale)}</p>
                  )}
                </motion.div>
              ))
            : [0, 1, 2].map((i) => (
                <div key={i} className="aspect-[3/4] w-full bg-taupe/10" />
              ))}
        </div>
        {sidebarText && (
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="flex flex-col justify-center lg:w-1/4">
            <h2 className="mb-8 font-display text-4xl font-normal leading-snug text-ink">{sidebarText}</h2>
            {kicker && (
              <a href="#portfolio" className="text-[11px] font-bold uppercase tracking-[0.3em] text-ink">{kicker}</a>
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────
// § 8  LOVE LETTERS (QUOTE)
// ─────────────────────────────────────────
function QuoteSection({ content, locale }: { content: EventContent; locale: Locale }) {
  const quoteText = t(content.quote_text, locale);
  if (!quoteText && !content.quote_image) return null;

  return (
    <section className="relative flex h-[600px] items-center justify-center overflow-hidden text-center">
      {content.quote_image ? (
        <Image src={content.quote_image} alt="" fill className="object-cover" />
      ) : (
        <div className="absolute inset-0 bg-taupe/20" />
      )}
      <div className="absolute inset-0 bg-white/40" />
      <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
        className="relative z-10 max-w-3xl px-4">
        {hasContent(content.quote_kicker) && (
          <p className="mb-12 text-[11px] font-bold uppercase tracking-[0.4em] text-ink/60">
            {t(content.quote_kicker, locale)}
          </p>
        )}
        {quoteText && (
          <blockquote className="mb-12 font-display text-3xl font-normal leading-relaxed text-ink sm:text-4xl md:text-5xl">
            &ldquo;{quoteText}&rdquo;
          </blockquote>
        )}
        {hasContent(content.quote_author) && (
          <cite className="text-[11px] font-bold uppercase not-italic tracking-[0.3em] text-ink/40">
            {t(content.quote_author, locale)}
          </cite>
        )}
      </motion.div>
    </section>
  );
}

// ─────────────────────────────────────────
// § 9  BLOOM WITH US
// ─────────────────────────────────────────
function BloomSection({ content, locale }: { content: EventContent; locale: Locale }) {
  const kicker = t(content.bloom_kicker, locale);
  const title = t(content.bloom_title, locale);
  const text = t(content.bloom_text, locale);
  const button = t(content.bloom_button, locale);
  if (!title && !content.bloom_image) return null;

  return (
    <section className="bg-white py-[100px]">
      <div className="mx-auto grid max-w-[1200px] items-center gap-24 px-6 sm:px-10 md:grid-cols-2">
        <div className="relative border border-black/10 p-6">
          {content.bloom_image ? (
            <Image src={content.bloom_image} alt={title || ""} width={600} height={700} className="h-auto w-full object-cover" />
          ) : (
            <div className="flex aspect-[4/5] w-full items-center justify-center bg-taupe/10 text-xs text-ink/15">600 × 700 px</div>
          )}
        </div>
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          {kicker && <p className="mb-6 text-[11px] uppercase tracking-[0.3em] text-ink/40">{kicker}</p>}
          {title && <h2 className="mb-12 font-display text-5xl font-normal text-ink lg:text-6xl">{title}</h2>}
          {text && <p className="mb-12 leading-[2] text-ink/55">{text}</p>}
          {button && <BtnOutline>{button}</BtnOutline>}
        </motion.div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────
// § 10  CTA BANNER
// ─────────────────────────────────────────
function CtaBannerSection({ content, locale }: { content: EventContent; locale: Locale }) {
  const title = t(content.cta_title, locale);
  const text = t(content.cta_text, locale);
  const button = t(content.cta_button, locale);
  if (!title) return null;

  return (
    <section className="bg-cream py-24">
      <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
        className="mx-auto max-w-4xl px-6 text-center sm:px-10">
        <h2 className="mb-12 font-display text-5xl font-normal tracking-tight text-ink">{title}</h2>
        <div className="mx-auto mb-12 h-px w-24 bg-black/10" />
        {text && <p className="mx-auto mb-12 max-w-xl leading-relaxed text-ink/55">{text}</p>}
        {button && <BtnOutline>{button}</BtnOutline>}
      </motion.div>
    </section>
  );
}

// ─────────────────────────────────────────
// § 11  INSTAGRAM / GALLERY STRIP
// ─────────────────────────────────────────
function GalleryStripSection({ images }: { images: string[] }) {
  if (!images || images.length === 0) return null;
  const cols = Math.min(images.length, 5);
  return (
    <section className="bg-white pb-24">
      <div className="grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {images.slice(0, 5).map((src, i) => (
          <div key={i} className="group aspect-square overflow-hidden">
            <Image src={src} alt="" width={400} height={400}
              className="h-full w-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0" />
          </div>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────
// § 12  INQUIRY FORM
// ─────────────────────────────────────────
function InquiryFormSection({ content, locale, slug }: { content: EventContent; locale: Locale; slug: string }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", date: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const formTitle = t(content.form_title, locale);
  const labels: Record<string, Record<Locale, string>> = {
    name: { en: "Your name", uk: "Ваше ім'я", nl: "Uw naam" },
    phone: { en: "Phone", uk: "Телефон", nl: "Telefoon" },
    email: { en: "Email", uk: "Email", nl: "E-mail" },
    date: { en: "Wedding date", uk: "Дата весілля", nl: "Trouwdatum" },
    message: { en: "Tell us about your wedding", uk: "Розкажіть про весілля", nl: "Vertel over uw bruiloft" },
    submit: { en: "Send request", uk: "Надіслати запит", nl: "Verstuur aanvraag" },
    sent: { en: "Thank you! We'll contact you soon.", uk: "Дякуємо! Ми зв'яжемося.", nl: "Bedankt! We nemen contact op." },
    error: { en: "Something went wrong. Please try again.", uk: "Помилка. Спробуйте знову.", nl: "Er ging iets mis. Probeer opnieuw." },
  };
  const l = (key: string) => labels[key]?.[locale] ?? labels[key]?.en ?? key;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/event-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, slug }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch { setStatus("error"); }
  };

  const inputCls = "w-full border-b border-ink/15 bg-transparent py-3 text-sm text-ink placeholder:text-ink/30 focus:border-brand focus:outline-none transition-colors";

  return (
    <section id="inquiry-form" className="mx-auto max-w-xl px-6 py-24 sm:py-32">
      <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
        <div className="text-center">
          <h2 className="font-display text-3xl font-medium text-ink sm:text-4xl">{formTitle || "Contact us"}</h2>
          <div className="mx-auto mb-12 mt-4 h-px w-12 bg-brand" />
        </div>
        {status === "sent" ? (
          <p className="py-12 text-center text-lg text-brand">{l("sent")}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={l("name")} required className={inputCls} />
            <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder={l("phone")} required className={inputCls} />
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder={l("email")} className={inputCls} />
            <input type="text" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} placeholder={l("date")}
              onFocus={(e) => (e.target.type = "date")} onBlur={(e) => { if (!e.target.value) e.target.type = "text"; }} className={inputCls} />
            <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder={l("message")} rows={4} className={`${inputCls} resize-none`} />
            {status === "error" && <p className="text-sm text-red-500">{l("error")}</p>}
            <div className="pt-6">
              <button type="submit" disabled={status === "sending"}
                className="w-full border border-ink/25 px-9 py-4 text-xs font-medium uppercase tracking-[0.25em] text-ink transition-all duration-300 hover:border-brand hover:bg-brand hover:text-cream disabled:opacity-50">
                {status === "sending" ? "..." : l("submit")}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </section>
  );
}

// ─────────────────────────────────────────
// ── Main export ──
// ─────────────────────────────────────────
interface WeddingLandingProps {
  content: EventContent;
  locale: Locale;
  slug: string;
}

export default function WeddingLanding({ content, locale, slug }: WeddingLandingProps) {
  const c = withDefaults(content);
  return (
    <main className="min-h-screen bg-cream">
      <HeroSection content={c} locale={locale} />
      <WhatToExpectSection content={c} locale={locale} />
      <FullServiceSection content={c} locale={locale} />
      <OtherServicesSection content={c} locale={locale} />
      <FinalChoicesSection content={c} locale={locale} />
      <ProcessSection content={c} locale={locale} />
      <PortfolioSection content={c} locale={locale} />
      <QuoteSection content={c} locale={locale} />
      <BloomSection content={c} locale={locale} />
      <CtaBannerSection content={c} locale={locale} />
      <GalleryStripSection images={c.gallery} />
      <InquiryFormSection content={c} locale={locale} slug={slug} />
    </main>
  );
}
