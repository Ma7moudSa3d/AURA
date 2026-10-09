import Link from "next/link";
import { getTranslations } from "next-intl/server";
import WhatsAppButton from "@/components/WhatsAppButton";
import type { Settings } from "@/lib/types";

export default async function Footer({ settings }: { settings: Settings }) {
  const t = await getTranslations("footer");
  const n = await getTranslations("nav");
  const social = [["Instagram", settings.instagram], ["Facebook", settings.facebook], ["TikTok", settings.tiktok]] as const;
  return (
    <footer className="mt-24 border-t border-white/5 bg-surface">
      <div className="container-x grid gap-10 py-14 md:grid-cols-3">
        <div>
          <p className="h-display gold-text text-3xl tracking-[.4em]">AURA</p>
          <p className="mt-3 text-sm text-cream/60">{t("tag")}</p>
          <div className="mt-5"><WhatsAppButton number={settings.whatsapp_number} message="Hello AURA" label={n("whatsapp")} /></div>
        </div>
        <ul className="space-y-2 text-sm text-cream/70">
          <li><Link className="hover:text-gold" href="/shop">{n("shop")}</Link></li>
          <li><Link className="hover:text-gold" href="/faq">{n("faq")}</Link></li>
          <li><Link className="hover:text-gold" href="/shipping">{t("shipping")}</Link></li>
          <li><Link className="hover:text-gold" href="/privacy">{t("privacy")}</Link></li>
          <li><Link className="hover:text-gold" href="/terms">{t("terms")}</Link></li>
          <li><Link className="hover:text-gold" href="/contact">{n("contact")}</Link></li>
        </ul>
        <ul className="space-y-2 text-sm text-cream/70">
          {social.filter(([, u]) => u).map(([name, u]) => (
            <li key={name}><a className="hover:text-gold" href={u!} target="_blank" rel="noopener noreferrer">{name}</a></li>
          ))}
          {settings.contact_email && <li>{settings.contact_email}</li>}
          {settings.contact_phone && <li dir="ltr">{settings.contact_phone}</li>}
        </ul>
      </div>
      <p className="border-t border-white/5 py-5 text-center text-xs text-cream/40">© {new Date().getFullYear()} AURA. {t("rights")}</p>
    </footer>
  );
}
