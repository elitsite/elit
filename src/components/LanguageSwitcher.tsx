"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useLocale } from "next-intl";
import { Check, ChevronDown, Globe } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

const LOCALE_LABELS: Record<Locale, { native: string; short: string }> = {
  nl: { native: "Nederlands", short: "NL" },
  en: { native: "English", short: "EN" },
  uk: { native: "Українська", short: "UK" },
};

export default function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function switchTo(next: Locale) {
    setOpen(false);
    if (next === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Change language"
        className="flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:border-brand/40 hover:bg-brand/5 disabled:opacity-50"
      >
        <Globe size={16} className="text-brand" />
        <span>{LOCALE_LABELS[locale].short}</span>
        <ChevronDown
          size={14}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl border border-black/10 bg-white py-1 shadow-xl shadow-black/5"
        >
          {routing.locales.map((l) => (
            <li key={l}>
              <button
                type="button"
                role="option"
                aria-selected={l === locale}
                onClick={() => switchTo(l)}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-brand/5"
              >
                <span className="flex items-center gap-2">
                  <span className="w-6 text-xs font-semibold text-brand">
                    {LOCALE_LABELS[l].short}
                  </span>
                  <span className="text-ink">{LOCALE_LABELS[l].native}</span>
                </span>
                {l === locale && <Check size={15} className="text-brand" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
