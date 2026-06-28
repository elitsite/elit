"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Home,
  RefreshCw,
} from "lucide-react";
import { Link } from "@/i18n/navigation";

type PaymentStatus =
  | "polling"
  | "paid"
  | "failed"
  | "expired"
  | "bank_unavailable"
  | "sync_error"
  | "timeout"
  | "error";

export default function PaymentResultPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const accessToken = searchParams.get("t");
  const t = useTranslations("Payment");

  const [status, setStatus] = useState<PaymentStatus>(
    orderId && accessToken ? "polling" : "error",
  );
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryError, setRetryError] = useState("");
  const pollCountRef = useRef(0);
  const maxPolls = 30;

  const pollStatus = useCallback(async () => {
    if (!orderId || !accessToken) return;

    try {
      const res = await fetch(
        `/api/payment/status?orderId=${orderId}&t=${encodeURIComponent(accessToken)}`,
      );
      if (!res.ok) {
        if (res.status === 404) {
          setStatus("error");
          return;
        }
        return;
      }

      const data = await res.json();

      switch (data.status) {
        case "paid":
          setStatus("paid");
          setPaymentMethod(data.paymentMethod || null);
          return;
        case "failed":
          setStatus("failed");
          return;
        case "expired":
          setStatus("expired");
          return;
        case "bank_unavailable":
          setStatus("bank_unavailable");
          return;
        case "sync_error":
          setStatus("sync_error");
          return;
        case "pending":
          break;
        default:
          break;
      }
    } catch {
      // Network error — keep polling
    }
  }, [orderId, accessToken]);

  useEffect(() => {
    if (!orderId || !accessToken || status !== "polling") return;

    const interval = setInterval(() => {
      pollCountRef.current++;

      if (pollCountRef.current >= maxPolls) {
        setStatus("timeout");
        clearInterval(interval);
        return;
      }

      pollStatus();
    }, 2000);

    pollStatus();

    return () => clearInterval(interval);
  }, [orderId, accessToken, status, pollStatus]);

  const handleRetry = async () => {
    if (isRetrying || !orderId || !accessToken) return;
    setIsRetrying(true);
    setRetryError("");

    try {
      const res = await fetch("/api/payment/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, accessToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        setRetryError(data.error || "Retry failed");
        return;
      }

      if (data.alreadyPaid) {
        setStatus("paid");
        return;
      }

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }

      if (data.fallback) {
        if (data.errorType === "sync_error") {
          setStatus("sync_error");
        } else {
          setStatus("bank_unavailable");
        }
      }
    } catch {
      setRetryError("Network error. Please try again.");
    } finally {
      setIsRetrying(false);
    }
  };

  if (!orderId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
          <XCircle size={56} className="mx-auto mb-4 text-red-400" />
          <h1 className="mb-2 font-display text-xl font-medium text-ink">
            {t("error_title")}
          </h1>
          <p className="mb-6 text-ink/50">{t("no_order")}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-ink px-6 py-3 text-xs font-medium uppercase tracking-[0.2em] text-cream transition-colors hover:bg-brand"
          >
            <Home size={18} />
            {t("go_home")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
        {/* ── POLLING ── */}
        {status === "polling" && (
          <>
            <Loader2 size={56} className="mx-auto mb-4 animate-spin text-brand" />
            <h1 className="mb-2 font-display text-xl font-medium text-ink">
              {t("checking")}
            </h1>
            <p className="text-ink/50">{t("checking_desc")}</p>
          </>
        )}

        {/* ── PAID ── */}
        {status === "paid" && (
          <>
            <CheckCircle size={56} className="mx-auto mb-4 text-green-500" />
            <h1 className="mb-2 font-display text-xl font-medium text-ink">
              {t("success_title")}
            </h1>
            <p className="mb-6 text-ink/50">{t("success_desc")}</p>
            {paymentMethod && (
              <p className="mb-6 text-xs text-ink/40">
                {paymentMethod === "card"
                  ? "💳 Card"
                  : paymentMethod === "googlepay" || paymentMethod === "google_pay"
                    ? "Google Pay"
                    : paymentMethod === "apple" || paymentMethod === "apple_pay"
                      ? "Apple Pay"
                      : paymentMethod}
              </p>
            )}
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-ink px-6 py-3 text-xs font-medium uppercase tracking-[0.2em] text-cream transition-colors hover:bg-brand"
            >
              <Home size={18} />
              {t("go_home")}
            </Link>
          </>
        )}

        {/* ── FAILED ── */}
        {status === "failed" && (
          <>
            <XCircle size={56} className="mx-auto mb-4 text-red-400" />
            <h1 className="mb-2 font-display text-xl font-medium text-ink">
              {t("failed_title")}
            </h1>
            <p className="mb-6 text-ink/50">{t("failed_desc")}</p>
            {retryError && (
              <p className="mb-4 text-sm text-red-500">{retryError}</p>
            )}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="inline-flex items-center justify-center gap-2 bg-ink px-6 py-3 text-xs font-medium uppercase tracking-[0.2em] text-cream transition-colors hover:bg-brand disabled:opacity-50"
              >
                {isRetrying ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <RefreshCw size={18} />
                )}
                {t("retry")}
              </button>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 border border-ink/15 px-6 py-3 text-xs font-medium uppercase tracking-[0.2em] text-ink/60 transition-colors hover:bg-taupe/10"
              >
                <Home size={18} />
                {t("go_home")}
              </Link>
            </div>
          </>
        )}

        {/* ── EXPIRED ── */}
        {status === "expired" && (
          <>
            <Clock size={56} className="mx-auto mb-4 text-amber-400" />
            <h1 className="mb-2 font-display text-xl font-medium text-ink">
              {t("expired_title")}
            </h1>
            <p className="mb-6 text-ink/50">{t("expired_desc")}</p>
            {retryError && (
              <p className="mb-4 text-sm text-red-500">{retryError}</p>
            )}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="inline-flex items-center justify-center gap-2 bg-ink px-6 py-3 text-xs font-medium uppercase tracking-[0.2em] text-cream transition-colors hover:bg-brand disabled:opacity-50"
              >
                {isRetrying ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <RefreshCw size={18} />
                )}
                {t("retry")}
              </button>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 border border-ink/15 px-6 py-3 text-xs font-medium uppercase tracking-[0.2em] text-ink/60 transition-colors hover:bg-taupe/10"
              >
                <Home size={18} />
                {t("go_home")}
              </Link>
            </div>
          </>
        )}

        {/* ── BANK_UNAVAILABLE ── */}
        {status === "bank_unavailable" && (
          <>
            <AlertTriangle size={56} className="mx-auto mb-4 text-amber-500" />
            <h1 className="mb-2 font-display text-xl font-medium text-ink">
              {t("bank_unavailable_title")}
            </h1>
            <p className="mb-6 text-ink/50">{t("bank_unavailable_desc")}</p>
            {retryError && (
              <p className="mb-4 text-sm text-red-500">{retryError}</p>
            )}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="inline-flex items-center justify-center gap-2 bg-ink px-6 py-3 text-xs font-medium uppercase tracking-[0.2em] text-cream transition-colors hover:bg-brand disabled:opacity-50"
              >
                {isRetrying ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <RefreshCw size={18} />
                )}
                {t("retry")}
              </button>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 border border-ink/15 px-6 py-3 text-xs font-medium uppercase tracking-[0.2em] text-ink/60 transition-colors hover:bg-taupe/10"
              >
                <Home size={18} />
                {t("go_home")}
              </Link>
            </div>
          </>
        )}

        {/* ── SYNC_ERROR ── */}
        {status === "sync_error" && (
          <>
            <AlertTriangle size={56} className="mx-auto mb-4 text-red-500" />
            <h1 className="mb-2 font-display text-xl font-medium text-ink">
              {t("sync_error_title")}
            </h1>
            <p className="mb-6 text-ink/50">{t("sync_error_desc")}</p>
            <div className="flex flex-col gap-3">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 bg-ink px-6 py-3 text-xs font-medium uppercase tracking-[0.2em] text-cream transition-colors hover:bg-brand"
              >
                <Home size={18} />
                {t("go_home")}
              </Link>
            </div>
          </>
        )}

        {/* ── TIMEOUT ── */}
        {status === "timeout" && (
          <>
            <Clock size={56} className="mx-auto mb-4 text-ink/40" />
            <h1 className="mb-2 font-display text-xl font-medium text-ink">
              {t("timeout_title")}
            </h1>
            <p className="mb-6 text-ink/50">{t("timeout_desc")}</p>
            <div className="flex flex-col gap-3">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 bg-ink px-6 py-3 text-xs font-medium uppercase tracking-[0.2em] text-cream transition-colors hover:bg-brand"
              >
                <Home size={18} />
                {t("go_home")}
              </Link>
            </div>
          </>
        )}

        {/* ── ERROR ── */}
        {status === "error" && (
          <>
            <XCircle size={56} className="mx-auto mb-4 text-red-400" />
            <h1 className="mb-2 font-display text-xl font-medium text-ink">
              {t("error_title")}
            </h1>
            <p className="mb-6 text-ink/50">{t("error_desc")}</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-ink px-6 py-3 text-xs font-medium uppercase tracking-[0.2em] text-cream transition-colors hover:bg-brand"
            >
              <Home size={18} />
              {t("go_home")}
            </Link>
          </>
        )}

        {/* ── Order ID footer ── */}
        {orderId && (
          <p className="mt-6 select-all text-xs text-ink/30">
            {t("order_id")}: {orderId.slice(0, 8)}
          </p>
        )}
      </div>
    </div>
  );
}
