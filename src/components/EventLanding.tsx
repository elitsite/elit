"use client";

import Image from "next/image";
import { useState } from "react";
import type { EventContent, LocalizedText, EventSection, PortfolioItem } from "@/lib/supabase";
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
    <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden">
      {content.hero_image && (
        <Image
          src={content.hero_image}
          alt={title}
          fill
          priority
          className="object-cover"
        />
      )}
      <div className="absolute inset-0 bg-ink/40" />
      <div className="relative z-10 px-6 text-center text-white">
        <h1 className="font-display text-5xl font-medium leading-tight sm:text-6xl lg:text-7xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80 sm:text-xl">
            {subtitle}
          </p>
        )}
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
    <section className="mx-auto max-w-3xl px-6 py-20 text-center sm:py-28">
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
      {text && (
        <p className="mx-auto mt-6 max-w-2xl text-balance text-ink/70">
          {text}
        </p>
      )}
      {button && (
        <a
          href="#inquiry-form"
          className="mt-10 inline-flex items-center border border-ink/30 px-9 py-4 text-xs font-medium uppercase tracking-[0.25em] text-ink transition-colors hover:border-brand hover:bg-brand hover:text-cream"
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
    <section className="mx-auto max-w-5xl px-6 pb-20">
      <div className="relative aspect-video overflow-hidden rounded-sm">
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
    <section className="mx-auto max-w-content space-y-24 px-6 py-20 sm:px-8 lg:px-12">
      {sections.map((section, i) => {
        const title = t(section.title, locale);
        const text = t(section.text, locale);
        const reversed = i % 2 !== 0;

        return (
          <div
            key={i}
            className={`flex flex-col items-center gap-12 lg:flex-row lg:gap-16 ${reversed ? "lg:flex-row-reverse" : ""}`}
          >
            {/* Framed image */}
            <div className="relative w-full max-w-md lg:w-1/2">
              <div className="relative border border-black/10 bg-white p-3 shadow-sm sm:p-4">
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
                <h3 className="font-display text-3xl font-medium text-ink sm:text-4xl">
                  {title}
                </h3>
              )}
              {text && (
                <p className="mt-5 whitespace-pre-line text-ink/70 leading-relaxed">
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
    <section className="relative flex min-h-[50vh] items-center justify-center overflow-hidden">
      {content.quote_image && (
        <Image
          src={content.quote_image}
          alt=""
          fill
          className="object-cover"
        />
      )}
      <div className="absolute inset-0 bg-ink/50" />
      <div className="relative z-10 mx-auto max-w-3xl px-6 py-20 text-center text-white">
        {hasContent(content.quote_kicker) && (
          <span className="mb-4 block text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
            {t(content.quote_kicker, locale)}
          </span>
        )}
        {quoteText && (
          <blockquote className="font-display text-2xl font-medium leading-relaxed sm:text-3xl">
            {quoteText}
          </blockquote>
        )}
        {hasContent(content.quote_author) && (
          <cite className="mt-6 block text-sm uppercase tracking-[0.2em] text-white/60 not-italic">
            {t(content.quote_author, locale)}
          </cite>
        )}
      </div>
    </section>
  );
}

function PortfolioBlock({ content, locale }: { content: EventContent; locale: Locale }) {
  const items = content.portfolio;
  if (!items || items.length === 0) return null;

  return (
    <section className="mx-auto max-w-content px-6 py-20 sm:px-8">
      <div className="mb-12 text-center">
        {hasContent(content.portfolio_kicker) && (
          <span className="mb-4 block text-xs font-semibold uppercase tracking-[0.3em] text-brand">
            {t(content.portfolio_kicker, locale)}
          </span>
        )}
        {hasContent(content.portfolio_title) && (
          <h2 className="font-display text-4xl font-medium text-ink sm:text-5xl">
            {t(content.portfolio_title, locale)}
          </h2>
        )}
      </div>
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item: PortfolioItem, i: number) => (
          <div key={i} className={`${i === 1 ? "lg:-mt-8" : ""}`}>
            {item.image ? (
              <div className="relative aspect-[3/4] overflow-hidden">
                <Image
                  src={item.image}
                  alt={t(item.caption, locale)}
                  fill
                  className="object-cover"
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
    <section className="overflow-hidden py-16">
      <div className="flex gap-4 overflow-x-auto px-6 pb-4 no-scrollbar">
        {images.map((src, i) => (
          <div key={i} className="relative aspect-square w-64 flex-shrink-0 sm:w-72">
            <Image src={src} alt="" fill className="object-cover" />
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
    <section id="inquiry-form" className="mx-auto max-w-2xl px-6 py-20 sm:py-28">
      <div className="rounded-sm bg-white p-8 shadow-sm sm:p-12">
        {formTitle && (
          <h2 className="mb-8 text-center font-display text-3xl font-medium text-ink sm:text-4xl">
            {formTitle}
          </h2>
        )}
        {status === "sent" ? (
          <p className="py-12 text-center text-lg text-brand">{l("sent")}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
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
            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full border border-ink/30 px-9 py-4 text-xs font-medium uppercase tracking-[0.25em] text-ink transition-colors hover:border-brand hover:bg-brand hover:text-cream disabled:opacity-50"
            >
              {status === "sending" ? "..." : l("submit")}
            </button>
          </form>
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
}

export default function EventLanding({ content, locale, slug }: EventLandingProps) {
  return (
    <main className="min-h-screen">
      <HeroBlock content={content} locale={locale} />
      <IntroBlock content={content} locale={locale} />
      <MediaBlock content={content} locale={locale} />
      <FramedSections sections={content.sections} locale={locale} />
      <QuoteBlock content={content} locale={locale} />
      <PortfolioBlock content={content} locale={locale} />
      <GalleryStrip images={content.gallery} />
      <InquiryForm content={content} locale={locale} slug={slug} />
    </main>
  );
}
