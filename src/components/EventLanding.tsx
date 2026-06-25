"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import type { EventContent, LocalizedText, EventSection, PortfolioItem, ProcessStep } from "@/lib/supabase";
import type { Locale } from "@/i18n/routing";

// ── Helpers ──

function t(field: LocalizedText | undefined, locale: Locale): string {
  if (!field) return "";
  return field[locale] || field.en || "";
}

function hasContent(field: LocalizedText | undefined): boolean {
  if (!field) return false;
  return !!(field.en || field.uk || field.nl);
}

// ── Sub-blocks ──

function HeroBlock({ content, locale }: { content: EventContent; locale: Locale }) {
  const title = t(content.hero_title, locale);
  const subtitle = t(content.hero_subtitle, locale);
  if (!content.hero_image && !title) return null;

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {content.hero_image && (
        <Image
          src={content.hero_image}
          alt={title}
          fill
          priority
          className="object-cover"
        />
      )}
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/45" />
      {/* Content */}
      <div className="relative z-10 px-6 text-center text-white">
        {title && (
          <h1 className="font-display text-5xl font-medium leading-tight tracking-wide sm:text-6xl lg:text-7xl xl:text-8xl">
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="mx-auto mt-6 max-w-2xl text-lg tracking-wide text-white/75 sm:text-xl">
            {subtitle}
          </p>
        )}
      </div>
      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2">
        <svg
          className="h-8 w-8 text-white/60 animate-gentle-bounce"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  );
}

function IntroBlock({ content, locale }: { content: EventContent; locale: Locale }) {
  const kicker = t(content.intro_kicker, locale);
  const title = t(content.intro_title, locale);
  const text = t(content.intro_text, locale);
  const button = t(content.intro_button, locale);
  if (!title && !text) return null;

  return (
    <section className="mx-auto max-w-3xl px-6 py-24 text-center sm:py-32">
      {kicker && (
        <span className="mb-5 block text-xs font-semibold uppercase tracking-[0.3em] text-brand">
          {kicker}
        </span>
      )}
      {title && (
        <h2 className="font-display text-4xl font-medium leading-snug text-ink sm:text-5xl lg:text-[3.5rem]">
          {title}
        </h2>
      )}
      {text && (
        <p className="mx-auto mt-8 max-w-2xl text-balance leading-relaxed text-ink/60">
          {text}
        </p>
      )}
      {button && (
        <a
          href="#inquiry-form"
          className="mt-12 inline-flex items-center border border-ink/25 px-10 py-4 text-xs font-medium uppercase tracking-[0.25em] text-ink transition-all duration-300 hover:border-brand hover:bg-brand hover:text-cream"
        >
          {button}
        </a>
      )}
    </section>
  );
}

function MediaBlock({ content, locale }: { content: EventContent; locale: Locale }) {
  if (!content.media_image) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <div className="relative aspect-[16/9] overflow-hidden">
        <Image
          src={content.media_image}
          alt={t(content.intro_title, locale) || ""}
          fill
          className="object-cover"
        />
      </div>
    </section>
  );
}

function FramedSections({ sections, locale }: { sections: EventSection[]; locale: Locale }) {
  if (!sections || sections.length === 0) return null;

  return (
    <section className="mx-auto max-w-content space-y-28 px-6 py-24 sm:px-8 lg:px-12">
      {sections.map((section, i) => {
        const title = t(section.title, locale);
        const text = t(section.text, locale);
        const reversed = i % 2 !== 0;

        return (
          <div
            key={i}
            className={`flex flex-col items-center gap-12 lg:flex-row lg:gap-20 ${reversed ? "lg:flex-row-reverse" : ""}`}
          >
            {/* Framed image */}
            <div className="relative w-full max-w-md lg:w-1/2">
              <div className="relative border border-taupe/20 bg-white p-3 shadow-sm sm:p-4">
                {section.image ? (
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <Image
                      src={section.image}
                      alt={title}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-[3/4] bg-taupe/10" />
                )}
              </div>
            </div>
            {/* Text */}
            <div className="w-full lg:w-1/2">
              {title && (
                <h3 className="font-display text-3xl font-medium leading-snug text-ink sm:text-4xl">
                  {title}
                </h3>
              )}
              {text && (
                <p className="mt-6 whitespace-pre-line leading-relaxed text-ink/60">
                  {text}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}

function QuoteBlock({ content, locale }: { content: EventContent; locale: Locale }) {
  const quoteText = t(content.quote_text, locale);
  if (!quoteText && !content.quote_image) return null;

  return (
    <section className="relative flex min-h-[60vh] items-center justify-center overflow-hidden">
      {content.quote_image && (
        <Image
          src={content.quote_image}
          alt=""
          fill
          className="object-cover"
        />
      )}
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 mx-auto max-w-3xl px-6 py-24 text-center text-white">
        {hasContent(content.quote_kicker) && (
          <span className="mb-5 block text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
            {t(content.quote_kicker, locale)}
          </span>
        )}
        {quoteText && (
          <blockquote className="font-display text-2xl font-medium italic leading-relaxed sm:text-3xl lg:text-4xl">
            &ldquo;{quoteText}&rdquo;
          </blockquote>
        )}
        {hasContent(content.quote_author) && (
          <cite className="mt-8 block text-sm uppercase tracking-[0.25em] text-white/50 not-italic">
            {t(content.quote_author, locale)}
          </cite>
        )}
      </div>
    </section>
  );
}

function GridBlock({
  items,
  locale,
  kicker,
  title,
}: {
  items: PortfolioItem[];
  locale: Locale;
  kicker?: LocalizedText;
  title?: LocalizedText;
}) {
  if (!items || items.length === 0) return null;

  return (
    <section className="mx-auto max-w-content px-6 py-24 sm:px-8">
      <div className="mb-14 text-center">
        {kicker && hasContent(kicker) && (
          <span className="mb-4 block text-xs font-semibold uppercase tracking-[0.3em] text-brand">
            {t(kicker, locale)}
          </span>
        )}
        {title && hasContent(title) && (
          <h2 className="font-display text-4xl font-medium text-ink sm:text-5xl">
            {t(title, locale)}
          </h2>
        )}
      </div>
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item: PortfolioItem, i: number) => (
          <div key={i} className={`${i % 3 === 1 ? "lg:-mt-10" : ""}`}>
            {item.image ? (
              <div className="relative aspect-[3/4] overflow-hidden">
                <Image
                  src={item.image}
                  alt={t(item.caption, locale)}
                  fill
                  className="object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
            ) : (
              <div className="aspect-[3/4] bg-taupe/10" />
            )}
            {hasContent(item.caption) && (
              <p className="mt-4 text-center font-display text-lg text-ink">
                {t(item.caption, locale)}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function GalleryStrip({ images }: { images: string[] }) {
  if (!images || images.length === 0) return null;

  return (
    <section className="overflow-hidden py-20">
      <div className="flex gap-4 overflow-x-auto px-6 pb-4 no-scrollbar">
        {images.map((src, i) => (
          <div key={i} className="relative aspect-square w-72 flex-shrink-0 overflow-hidden sm:w-80">
            <Image
              src={src}
              alt=""
              fill
              className="object-cover transition-transform duration-500 hover:scale-105"
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function InquiryForm({ content, locale, slug }: { content: EventContent; locale: Locale; slug: string }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    date: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const formTitle = t(content.form_title, locale);
  const labels: Record<string, Record<Locale, string>> = {
    name: { en: "Your name", uk: "Ваше ім'я", nl: "Uw naam" },
    phone: { en: "Phone", uk: "Телефон", nl: "Telefoon" },
    email: { en: "Email", uk: "Email", nl: "E-mail" },
    date: { en: "Event date", uk: "Дата події", nl: "Datum evenement" },
    message: { en: "Tell us about your event", uk: "Розкажіть про подію", nl: "Vertel over uw evenement" },
    submit: { en: "Send request", uk: "Надіслати запит", nl: "Verstuur aanvraag" },
    sent: { en: "Thank you! We'll contact you soon.", uk: "Дякуємо! Ми зв'яжемося з вами.", nl: "Bedankt! We nemen contact op." },
    error: { en: "Something went wrong. Please try again.", uk: "Щось пішло не так. Спробуйте ще.", nl: "Er ging iets mis. Probeer opnieuw." },
  };
  const l = (key: string) => labels[key]?.[locale] || labels[key]?.en || key;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/event-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, slug, locale }),
      });
      if (res.ok) {
        setStatus("sent");
        setForm({ name: "", phone: "", email: "", date: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <section id="inquiry-form" className="mx-auto max-w-2xl px-6 py-24 sm:py-32">
      <div className="bg-white p-8 shadow-sm sm:p-12">
        {formTitle && (
          <h2 className="mb-10 text-center font-display text-3xl font-medium text-ink sm:text-4xl">
            {formTitle}
          </h2>
        )}
        {status === "sent" ? (
          <p className="py-12 text-center text-lg text-brand">{l("sent")}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-1">
            <input
              type="text"
              placeholder={l("name")}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="input"
            />
            <input
              type="tel"
              placeholder={l("phone")}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
              className="input"
            />
            <input
              type="email"
              placeholder={l("email")}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input"
            />
            <input
              type="date"
              placeholder={l("date")}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="input"
            />
            <textarea
              placeholder={l("message")}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={4}
              className="input resize-none"
            />
            {status === "error" && (
              <p className="text-sm text-red-500">{l("error")}</p>
            )}
            <div className="pt-6">
              <button
                type="submit"
                disabled={status === "sending"}
                className="w-full border border-ink/25 px-9 py-4 text-xs font-medium uppercase tracking-[0.25em] text-ink transition-all duration-300 hover:border-brand hover:bg-brand hover:text-cream disabled:opacity-50"
              >
                {status === "sending" ? "..." : l("submit")}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

function ProcessBlock({ content, locale }: { content: EventContent; locale: Locale }) {
  const steps = content.process_steps;
  if (!steps || steps.length === 0) return null;

  const kicker = t(content.process_kicker, locale);
  const title = t(content.process_title, locale);
  const cta = t(content.process_cta, locale);

  return (
    <section className="bg-cream py-24 sm:py-32">
      <div className="mx-auto max-w-content px-6 sm:px-8">
        {/* Header */}
        <div className="mb-16 text-center sm:mb-20">
          {kicker && (
            <span className="mb-4 block text-xs font-semibold uppercase tracking-[0.3em] text-brand">
              {kicker}
            </span>
          )}
          {title && (
            <h2 className="font-display text-4xl font-medium text-ink sm:text-5xl">
              {title}
            </h2>
          )}
          {/* Decorative line */}
          <div className="mx-auto mt-6 h-px w-12 bg-brand/40" />
        </div>

        {/* Steps grid */}
        <div className="grid grid-cols-1 gap-12 sm:gap-8 md:grid-cols-3">
          {steps.slice(0, 3).map((step, i) => {
            const stepTitle = t(step.title, locale);
            const stepText = t(step.text, locale);
            return (
              <div key={i} className="text-center">
                <span className="mb-5 block font-display text-3xl font-light text-ink/20 sm:text-4xl">
                  {ROMAN[i] || (i + 1)}
                </span>
                {stepTitle && (
                  <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-ink">
                    {stepTitle}
                  </h3>
                )}
                {stepText && (
                  <p className="mx-auto max-w-xs text-sm leading-relaxed text-ink/55">
                    {stepText}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA button */}
        {cta && (
          <div className="mt-14 text-center sm:mt-16">
            <a
              href="#inquiry-form"
              className="inline-flex items-center border border-ink/25 px-10 py-4 text-xs font-medium uppercase tracking-[0.25em] text-ink transition-all duration-300 hover:border-brand hover:bg-brand hover:text-cream"
            >
              {cta}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

// ── Main Component ──

interface EventLandingProps {
  content: EventContent;
  locale: Locale;
  slug: string;
  anchor?: string;
}

const ANCHOR_MAP: Record<string, string> = {
  'wedding-portfolio': 'portfolio',
  'wedding-packages': 'packages',
  'wedding-decor': 'decor',
  'party-portfolio': 'portfolio',
  'party-packages': 'packages',
  'party-decor': 'decor',
};

export default function EventLanding({ content, locale, slug, anchor }: EventLandingProps) {
  // Scroll to anchor section on mount
  useEffect(() => {
    if (anchor && ANCHOR_MAP[anchor]) {
      const el = document.getElementById(ANCHOR_MAP[anchor]);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    }
  }, [anchor]);

  return (
    <main className="min-h-screen bg-cream">
      <HeroBlock content={content} locale={locale} />
      <IntroBlock content={content} locale={locale} />
      <MediaBlock content={content} locale={locale} />
      <FramedSections sections={content.sections} locale={locale} />
      <QuoteBlock content={content} locale={locale} />
      <ProcessBlock content={content} locale={locale} />
      <div id="portfolio">
        <GridBlock
          items={content.portfolio}
          locale={locale}
          kicker={content.portfolio_kicker}
          title={content.portfolio_title}
        />
      </div>
      <div id="packages">
        <GridBlock
          items={content.packages}
          locale={locale}
          kicker={content.packages_kicker}
          title={content.packages_title}
        />
      </div>
      <div id="decor">
        <GridBlock
          items={content.decor}
          locale={locale}
          kicker={content.decor_kicker}
          title={content.decor_title}
        />
      </div>
      <GalleryStrip images={content.gallery} />
      <InquiryForm content={content} locale={locale} slug={slug} />
    </main>
  );
}
