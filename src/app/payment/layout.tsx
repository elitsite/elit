import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";
import "../globals.css";

export default async function PaymentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();
  return (
    <NextIntlClientProvider locale={routing.defaultLocale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
