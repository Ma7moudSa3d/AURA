"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import LangSwitcher from "@/components/LangSwitcher";
import { useCart, cartCount } from "@/lib/cart-store";
import { logout } from "@/app/actions/auth";
import { waLink } from "@/lib/format";

export default function Header({ loggedIn, whatsapp }: { loggedIn: boolean; whatsapp: string }) {
  const t = useTranslations("nav");
  const lines = useCart((s) => s.lines);
  const setOpen = useCart((s) => s.setOpen);
  const [mounted, setMounted] = useState(false);
  const [menu, setMenu] = useState(false);
  useEffect(() => setMounted(true), []);
  const n = mounted ? cartCount(lines) : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-ink/80 backdrop-blur-xl">
      <div className="container-x flex h-16 items-center justify-between">
        <Link href="/" className="h-display gold-text text-3xl tracking-[.4em]">AURA</Link>
        <nav className="hidden items-center gap-8 text-xs uppercase tracking-[.2em] text-cream/80 md:flex">
          <Link className="transition hover:text-gold" href="/shop">{t("shop")}</Link>
          <Link className="transition hover:text-gold" href="/faq">{t("faq")}</Link>
          <Link className="transition hover:text-gold" href="/contact">{t("contact")}</Link>
          <a className="transition hover:text-gold" href={waLink(whatsapp, "Hello AURA")} target="_blank" rel="noopener noreferrer">{t("whatsapp")}</a>
        </nav>
        <div className="flex items-center gap-5">
          <LangSwitcher />
          {loggedIn ? (
            <>
              <Link href="/account" className="hidden text-xs uppercase tracking-widest text-cream/80 hover:text-gold sm:block">{t("account")}</Link>
              <form action={logout}><button className="hidden text-xs uppercase tracking-widest text-cream/50 hover:text-gold sm:block">{t("logout")}</button></form>
            </>
          ) : (
            <Link href="/login" className="text-xs uppercase tracking-widest text-cream/80 hover:text-gold">{t("login")}</Link>
          )}
          <motion.button whileTap={{ scale: 0.92 }} onClick={() => setOpen(true)} aria-label={t("cart")} className="relative text-cream hover:text-gold">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M6 7h12l-1 13H7L6 7Z" /><path d="M9 7a3 3 0 0 1 6 0" /></svg>
            {n > 0 && <span className="absolute -end-2 -top-2 grid h-4 w-4 place-items-center rounded-full bg-gold text-[10px] font-semibold text-ink">{n}</span>}
          </motion.button>
          <button className="md:hidden" onClick={() => setMenu((m) => !m)} aria-label="Menu">☰</button>
        </div>
      </div>
      {menu && (
        <nav className="flex flex-col gap-4 border-t border-white/5 px-5 py-4 text-sm uppercase tracking-widest md:hidden" onClick={() => setMenu(false)}>
          <Link href="/shop">{t("shop")}</Link><Link href="/faq">{t("faq")}</Link><Link href="/contact">{t("contact")}</Link>
          {loggedIn && <Link href="/account">{t("account")}</Link>}
          <a href={waLink(whatsapp, "Hello AURA")} target="_blank" rel="noopener noreferrer" className="text-gold">{t("whatsapp")}</a>
        </nav>
      )}
    </header>
  );
}
