import Image from "next/image";
import type { EventContent, LocalizedText, EventSection, PortfolioItem, ProcessStep } from "@/lib/supabase";
import type { Locale } from "@/i18n/routing";
import InquiryForm from "@/components/event/InquiryForm";
import AnchorScroller from "@/components/event/AnchorScroller";

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

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {content.hero_image ? (
        <Image
          src={content.hero_image}
          alt={title}
          fill
          priority
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-ink/20 to-ink/40" />
      )}
      <div className="absolute inset-0 bg-black/45" />
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
  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-24">
      <div className="relative aspect-[16/9] overflow-hidden">
        {content.media_image ? (
          <Image
            src={content.media_image}
            alt={t(content.intro_title, locale) || ""}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-taupe/10 flex items-center justify-center text-ink/15 text-xs">
            1920 × 1080 px (16:9)
          </div>
        )}
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
                  <div className="aspect-[3/4] bg-taupe/10 flex items-center justify-center text-ink/15 text-xs">
                    800 × 1067 px
                  </div>
                )}
              </div>
            </div>
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



function ProcessBlock({ steps, locale }: { steps: ProcessStep[]; locale: Locale }) {
  if (!steps || steps.length === 0) return null;
  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI'];

  return (
    <section className="mx-auto max-w-5xl px-6 py-24 sm:py-32">
      <div className="mb-16 text-center">
        <h2 className="font-display text-4xl font-medium text-ink sm:text-5xl">
          Process
        </h2>
        <div className="mx-auto mt-4 h-px w-12 bg-brand" />
      </div>
      <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((step, i) => {
          const title = t(step.title, locale);
          const text = t(step.text, locale);
          return (
            <div key={i} className="text-center">
              <span className="font-display text-3xl font-light text-ink/20 sm:text-4xl">
                {romanNumerals[i] || `${i + 1}`}
              </span>
              <div className="mx-auto my-4 h-px w-8 bg-ink/10" />
              {title && (
                <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-ink">
                  {title}
                </h3>
              )}
              {text && (
                <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-ink/55">
                  {text}
                </p>
              )}
            </div>
          );
        })}
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
  const hasKicker = kicker && hasContent(kicker);
  const hasTitle = title && hasContent(title);
  const hasItems = items && items.length > 0;

  return (
    <section className="mx-auto max-w-content px-6 py-20 sm:px-8 sm:py-28">
      {/* Header — always show */}
      <div className="mb-14 text-center">
        {hasKicker && (
          <span className="mb-4 block text-[11px] font-semibold uppercase tracking-[0.3em] text-brand">
            {t(kicker!, locale)}
          </span>
        )}
        {hasTitle && (
          <h2 className="font-display text-4xl font-medium text-ink sm:text-5xl">
            {t(title!, locale)}
          </h2>
        )}
      </div>

      {/* Items grid — staggered layout */}
      {hasItems ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
          {items.map((item: PortfolioItem, i: number) => {
            const isCenter = i % 3 === 1;
            return (
              <div
                key={i}
                className={`${isCenter ? "lg:-mt-8" : "lg:mt-8"}`}
              >
                {item.image ? (
                  <div className={`relative overflow-hidden ${isCenter ? "aspect-[3/4]" : "aspect-[4/5]"}`}>
                    <Image
                      src={item.image}
                      alt={t(item.caption, locale)}
                      fill
                      className="object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className={`bg-taupe/10 flex items-center justify-center text-ink/15 text-xs ${isCenter ? "aspect-[3/4]" : "aspect-[4/5]"}`}>
                    600 × 800 px
                  </div>
                )}
                {hasContent(item.caption) && (
                  <p className="mt-5 text-center font-display text-lg italic text-ink/80">
                    {t(item.caption, locale)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`${i === 1 ? "lg:-mt-8" : "lg:mt-8"}`}>
              <div className={`bg-taupe/10 flex items-center justify-center text-ink/15 text-xs ${i === 1 ? "aspect-[3/4]" : "aspect-[4/5]"}`}>
                600 × 800 px
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function GalleryStrip({ images }: { images: string[] }) {
  const hasImages = images && images.length > 0;

  return (
    <section className="py-16 sm:py-20">
      <div className="mb-14 text-center">
        <h2 className="font-display text-4xl font-medium text-ink sm:text-5xl">
          Gallery
        </h2>
        <div className="mx-auto mt-4 h-px w-12 bg-brand" />
      </div>
      {hasImages ? (
        <div className="flex gap-3 justify-center overflow-x-auto px-4 pb-4 no-scrollbar sm:gap-4 sm:px-6">
          {images.map((src, i) => (
            <div key={i} className="relative w-56 h-56 flex-shrink-0 overflow-hidden sm:w-72 sm:h-72 lg:w-80 lg:h-80">
              <Image
                src={src}
                alt=""
                fill
                className="object-cover transition-transform duration-500 hover:scale-105"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-3 justify-center overflow-x-auto px-4 pb-4 no-scrollbar sm:gap-4 sm:px-6">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="w-56 h-56 flex-shrink-0 bg-taupe/10 flex items-center justify-center text-ink/15 text-xs sm:w-72 sm:h-72 lg:w-80 lg:h-80">
              800 × 800 px
            </div>
          ))}
        </div>
      )}
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

export default function EventLanding({ content, locale, slug, anchor }: EventLandingProps) {
  return (
    <main className="min-h-screen bg-cream">
      <AnchorScroller anchor={anchor} />
      <HeroBlock content={content} locale={locale} />
      <IntroBlock content={content} locale={locale} />
      <MediaBlock content={content} locale={locale} />
      <FramedSections sections={content.sections} locale={locale} />
      <ProcessBlock steps={content.process_steps} locale={locale} />
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
