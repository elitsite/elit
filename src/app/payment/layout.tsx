import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";
import "../globals.css";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function PaymentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (process.env.PAYMENT_ENABLED !== "true") {
    redirect("/");
  }
  const messages = await getMessages();
  return (
    <NextIntlClientProvider locale={routing.defaultLocale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
