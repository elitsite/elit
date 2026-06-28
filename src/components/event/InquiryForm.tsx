"use client";

import { useState } from "react";
import type { EventContent, LocalizedText } from "@/lib/supabase";
import type { Locale } from "@/i18n/routing";

function t(field: LocalizedText | undefined, locale: Locale): string {
  if (!field) return "";
  return field[locale] || field.en || "";
}

export default function InquiryForm({ content, locale, slug }: { content: EventContent; locale: Locale; slug: string }) {
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
    if (!form.name.trim() || !form.phone.trim()) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/event-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, slug }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  };

  const inputClass =
    "w-full border-b border-ink/15 bg-transparent py-3 text-sm text-ink placeholder:text-ink/30 focus:border-brand focus:outline-none transition-colors";

  return (
    <section id="inquiry-form" className="mx-auto max-w-xl px-6 py-24 sm:py-32">
      <div className="text-center">
        <h2 className="font-display text-3xl font-medium text-ink sm:text-4xl">
          {formTitle || "Get in Touch"}
        </h2>
        <div className="mx-auto mt-4 mb-12 h-px w-12 bg-brand" />
      </div>
      {status === "sent" ? (
        <p className="py-12 text-center text-lg text-brand">{l("sent")}</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={l("name")}
            required
            className={inputClass}
          />
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder={l("phone")}
            required
            className={inputClass}
          />
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder={l("email")}
            className={inputClass}
          />
          <input
            type="text"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            placeholder={l("date")}
            onFocus={(e) => (e.target.type = "date")}
            onBlur={(e) => { if (!e.target.value) e.target.type = "text"; }}
            className={inputClass}
          />
          <textarea
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder={l("message")}
            rows={4}
            className={`${inputClass} resize-none`}
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
    </section>
  );
}
