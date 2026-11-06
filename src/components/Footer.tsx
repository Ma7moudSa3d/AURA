// src/components/Footer.tsx
import Link from "next/link"
import { getLocale, getTranslations } from "next-intl/server"
import { getSettings } from "@/lib/data"
import WhatsAppButton from "@/components/WhatsAppButton"

export default async function Footer() {
  const locale = await getLocale()
  const t = await getTranslations("footer")
  const n = await getTranslations("nav")
  const settings = await getSettings()

  return (
    <footer className="mt-24 border-t border-white/5 bg-surface py-16 text-cream/80">
      <div className="container-x grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <p className="h-display text-gold text-3xl tracking-[.4em]">AURA</p>
          <p className="mt-3 text-sm text-cream/60">{t("tag")}</p>
          <div className="mt-5">
            <WhatsAppButton
              number={settings?.whatsapp_number ?? ""}
              message="Hello AURA"
              label={n("whatsapp")}
            />
          </div>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-widest text-gold font-bold mb-4">Explore</h4>
          <ul className="space-y-2 text-sm text-cream/70">
            <li><Link className="hover:text-gold transition" href="/shop">{n("shop")}</Link></li>
            <li><Link className="hover:text-gold transition" href="/faq">{n("faq")}</Link></li>
            <li><Link className="hover:text-gold transition" href="/contact">{n("contact")}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-widest text-gold font-bold mb-4">Customer Care</h4>
          <ul className="space-y-2 text-sm text-cream/70">
            <li><Link className="hover:text-gold transition" href="/account">{n("account")}</Link></li>
            <li><Link className="hover:text-gold transition" href="/cart">{n("cart")}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-widest text-gold font-bold mb-4">Connect</h4>
          <p className="text-xs text-cream/60 mb-2">{settings?.contact_email || "aurafragrances111@gmail.com"}</p>
          {settings?.instagram_url && (
            <a href={settings.instagram_url} target="_blank" rel="noreferrer" className="block text-xs text-cream/70 hover:text-gold transition mb-1">
              Instagram
            </a>
          )}
          {settings?.facebook_url && (
            <a href={settings.facebook_url} target="_blank" rel="noreferrer" className="block text-xs text-cream/70 hover:text-gold transition">
              Facebook
            </a>
          )}
        </div>
      </div>

      <div className="container-x mt-12 pt-6 border-t border-white/5 text-center text-xs text-cream/40">
        © {new Date().getFullYear()} AURA Fragrances. All rights reserved.
      </div>
    </footer>
  )
}
