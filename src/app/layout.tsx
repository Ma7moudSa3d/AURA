import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, Cairo } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import CartSync from "@/components/CartSync";
import { getSettings, getUser } from "@/lib/data";

const display = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400", "500", "600"], variable: "--font-display" });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const arabic = Cairo({ subsets: ["arabic", "latin"], variable: "--font-arabic" });

export const metadata: Metadata = {
  title: { default: "AURA — Eau de Parfum", template: "%s | AURA" },
  description: "Luxury Eau de Parfum. Rare ingredients, quiet confidence.",
  robots: { index: true, follow: true },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  const [settings, user] = await Promise.all([getSettings(), getUser()]);
  const banner = locale === "ar" ? settings.announcement_ar : settings.announcement_en;
  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className={`${display.variable} ${body.variable} ${arabic.variable}`}>
      <body className="min-h-screen font-sans">
        <NextIntlClientProvider messages={messages} locale={locale}>
          {banner && <div className="bg-gold py-2 text-center text-xs tracking-widest text-ink">{banner}</div>}
          <Header loggedIn={!!user} whatsapp={settings.whatsapp_number} />
          <main>{children}</main>
          <Footer settings={settings} />
          <CartDrawer loggedIn={!!user} />
          <CartSync loggedIn={!!user} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
