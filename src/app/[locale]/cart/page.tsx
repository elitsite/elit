"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Minus, Plus, Trash2, ShoppingBag, Check } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useCart, finalPrice } from "@/lib/cart";
import { formatEUR } from "@/lib/format";

type DeliveryType = "delivery" | "pickup";
type TimeType = "urgent" | "specific";

type FormState = {
  name: string;
  phone: string;
  deliveryType: DeliveryType;
  address: string;
  timeType: TimeType;
  specificTime: string;
  comment: string;
  consent: boolean;
};

const initialForm: FormState = {
  name: "",
  phone: "",
  deliveryType: "delivery",
  address: "",
  timeType: "urgent",
  specificTime: "",
  comment: "",
  consent: false,
};

export default function CartPage() {
  const t = useTranslations("Cart");
  const { items, subtotal, totalQuantity, setQuantity, removeItem, clear } =
    useCart();

  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.consent) {
      setError(t("err_consent"));
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
        name: form.name,
        phone: form.phone,
        deliveryType: form.deliveryType,
        address: form.deliveryType === "delivery" ? form.address : undefined,
        timeType: form.timeType,
        specificTime:
          form.timeType === "specific" ? form.specificTime : undefined,
        comment: form.comment || undefined,
        consent: true as const,
      };

      const res = await fetch("/api/cart-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || t("err_generic"));
        return;
      }

      setOrderId(data.orderId || "");
      clear();
      setForm(initialForm);
    } catch {
      setError(t("err_generic"));
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success screen ──
  if (orderId !== null) {
    return (
      <main className="mx-auto max-w-content px-4 py-24 text-center sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-md flex-col items-center">
          <span className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-brand">
            <Check size={32} strokeWidth={1.5} />
          </span>
          <h1 className="font-display text-3xl font-medium text-ink">
            {t("success_title")}
          </h1>
          <p className="mt-4 text-ink/60">{t("success_text")}</p>
          <Link
            href="/"
            className="mt-10 inline-flex items-center border border-ink px-8 py-4 text-xs font-medium uppercase tracking-[0.2em] text-ink transition-colors hover:border-brand hover:bg-brand hover:text-cream"
          >
            {t("back_home")}
          </Link>
        </div>
      </main>
    );
  }

  // ── Empty cart ──
  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-content px-4 py-24 text-center sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-md flex-col items-center">
          <span className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-ink/5 text-ink/40">
            <ShoppingBag size={30} strokeWidth={1.5} />
          </span>
          <h1 className="font-display text-3xl font-medium text-ink">
            {t("empty_title")}
          </h1>
          <p className="mt-4 text-ink/60">{t("empty_text")}</p>
          <Link
            href="/category/bouquets"
            className="mt-10 inline-flex items-center border border-ink px-8 py-4 text-xs font-medium uppercase tracking-[0.2em] text-ink transition-colors hover:border-brand hover:bg-brand hover:text-cream"
          >
            {t("continue_shopping")}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-content px-4 pb-24 pt-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-medium text-ink sm:text-4xl">
        {t("title")}
      </h1>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_400px] lg:gap-16">
        {/* ── Items ── */}
        <section className="space-y-6">
          {items.map((item) => {
            const unit = finalPrice(item.price, item.discount);
            return (
              <div
                key={item.id}
                className="flex gap-4 border-b border-black/5 pb-6"
              >
                <div className="relative h-24 w-20 shrink-0 overflow-hidden bg-white">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center font-display text-2xl text-ink/20">
                      EB
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-medium text-ink">{item.name}</h3>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      aria-label={t("remove")}
                      className="text-ink/40 transition-colors hover:text-red-500"
                    >
                      <Trash2 size={18} strokeWidth={1.5} />
                    </button>
                  </div>

                  <span className="mt-1 text-sm text-ink/50">
                    {formatEUR(unit)}
                  </span>

                  <div className="mt-auto flex items-center justify-between pt-3">
                    <div className="flex items-center border border-ink/15">
                      <button
                        type="button"
                        onClick={() =>
                          setQuantity(item.id, item.quantity - 1)
                        }
                        disabled={item.quantity <= 1}
                        aria-label={t("decrease")}
                        className="flex h-9 w-9 items-center justify-center text-ink transition-colors hover:text-brand disabled:opacity-30"
                      >
                        <Minus size={15} />
                      </button>
                      <span className="w-9 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setQuantity(item.id, item.quantity + 1)
                        }
                        disabled={item.quantity >= 10}
                        aria-label={t("increase")}
                        className="flex h-9 w-9 items-center justify-center text-ink transition-colors hover:text-brand disabled:opacity-30"
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                    <span className="font-medium text-ink">
                      {formatEUR(unit * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* ── Checkout form + summary ── */}
        <section className="lg:sticky lg:top-28 lg:self-start">
          <form
            onSubmit={handleSubmit}
            className="space-y-5 bg-white p-6 sm:p-8"
          >
            <h2 className="font-display text-2xl font-medium text-ink">
              {t("checkout")}
            </h2>

            <Field label={t("name")} required>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className="input"
              />
            </Field>

            <Field label={t("phone")} required>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="+31 6 1234 5678"
                className="input"
              />
            </Field>

            <Field label={t("delivery_method")}>
              <div className="grid grid-cols-2 gap-2">
                <Toggle
                  active={form.deliveryType === "delivery"}
                  onClick={() => update("deliveryType", "delivery")}
                  label={t("delivery")}
                />
                <Toggle
                  active={form.deliveryType === "pickup"}
                  onClick={() => update("deliveryType", "pickup")}
                  label={t("pickup")}
                />
              </div>
            </Field>

            {form.deliveryType === "delivery" && (
              <Field label={t("address")} required>
                <input
                  type="text"
                  required
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                  className="input"
                />
              </Field>
            )}

            <Field label={t("time")}>
              <div className="grid grid-cols-2 gap-2">
                <Toggle
                  active={form.timeType === "urgent"}
                  onClick={() => update("timeType", "urgent")}
                  label={t("urgent")}
                />
                <Toggle
                  active={form.timeType === "specific"}
                  onClick={() => update("timeType", "specific")}
                  label={t("specific")}
                />
              </div>
            </Field>

            {form.timeType === "specific" && (
              <Field label={t("specific_time")} required>
                <input
                  type="text"
                  required
                  value={form.specificTime}
                  onChange={(e) => update("specificTime", e.target.value)}
                  placeholder={t("specific_time_ph")}
                  className="input"
                />
              </Field>
            )}

            <Field label={t("comment")}>
              <textarea
                rows={3}
                value={form.comment}
                onChange={(e) => update("comment", e.target.value)}
                className="input resize-none"
              />
            </Field>

            {/* Summary */}
            <div className="space-y-2 border-t border-black/5 pt-5 text-sm">
              <div className="flex justify-between text-ink/60">
                <span>
                  {t("subtotal")} ({totalQuantity})
                </span>
                <span className="font-medium text-ink">
                  {formatEUR(subtotal)}
                </span>
              </div>
              <p className="text-xs text-ink/40">{t("delivery_note")}</p>
            </div>

            <label className="flex cursor-pointer items-start gap-3 text-xs text-ink/60">
              <input
                type="checkbox"
                checked={form.consent}
                onChange={(e) => update("consent", e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
              />
              <span>{t("consent")}</span>
            </label>

            {error && (
              <p className="rounded bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 border border-ink bg-ink px-8 py-4 text-xs font-medium uppercase tracking-[0.2em] text-cream transition-colors hover:border-brand hover:bg-brand disabled:opacity-50"
            >
              {submitting ? t("submitting") : t("place_order")}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.15em] text-ink/60">
        {label}
        {required && <span className="text-brand"> *</span>}
      </span>
      {children}
    </label>
  );
}

function Toggle({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border px-4 py-3 text-xs font-medium uppercase tracking-[0.15em] transition-colors ${
        active
          ? "border-ink bg-ink text-cream"
          : "border-ink/15 text-ink/60 hover:border-ink/40"
      }`}
    >
      {label}
    </button>
  );
}
