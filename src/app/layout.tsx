import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import CartSync from "@/components/CartSync";
import { getSettings, getUser } from "@/lib/data";
import { getCampaign } from "@/lib/campaign";
import { CampaignProvider, CampaignBar } from "@/components/Campaign";

export const metadata: Metadata = {
  title: { default: "AURA — Eau de Parfum", template: "%s | AURA" },
  description: "Luxury Eau de Parfum. Rare ingredients, quiet confidence.",
  robots: { index: true, follow: true },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  const [settings, user] = await Promise.all([getSettings(), getUser()]);
  const campaign = getCampaign(settings);
  const banner = locale === "ar" ? settings.announcement_ar : settings.announcement_en;
  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <head>
        {/* Fonts load in the browser (the CSP already allows Google Fonts), so a Google outage can never break the build. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@300..800&family=Cormorant+Garamond:wght@300;400;500;600&family=Inter:wght@300..700&display=swap"
        />
      </head>
      <body className="min-h-screen font-sans">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <CampaignProvider value={campaign}>
          {campaign ? <CampaignBar /> : banner && <div className="bg-gold py-2 text-center text-xs tracking-widest text-ink">{banner}</div>}
          <Header loggedIn={!!user} whatsapp={settings.whatsapp_number} />
          <main>{children}</main>
          <Footer settings={settings} />
          <CartDrawer loggedIn={!!user} />
          <CartSync loggedIn={!!user} />
          </CampaignProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
