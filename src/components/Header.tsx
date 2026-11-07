"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useCart, CartStoreState } from "@/lib/cart-store";

function IconGlobe(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m-17.432 0A8.959 8.959 0 013 12c0-.778.099-1.533.284-2.253" />
    </svg>
  );
}

function IconShoppingBag(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  );
}

function IconUser(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function IconMenu(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  );
}

function IconX(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export default function Header({ loggedIn, whatsapp }: { loggedIn?: boolean; whatsapp?: string }) {
  const t = useTranslations("nav");
  const locale = useLocale();

  const lines = useCart((s: CartStoreState) => s.lines || s.items || []);
  const setOpen = useCart((s: CartStoreState) => s.setOpen);

  const [mounted, setMounted] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalQty = lines.reduce((acc: number, item: any) => acc + (item.quantity ?? item.qty ?? 0), 0);

  const handleLanguageToggle = () => {
    const nextLocale = locale === "ar" ? "en" : "ar";
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000`;
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/80 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="h-display text-3xl tracking-tighter text-white transition-colors group-hover:text-amber-500">
            AURA
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/shop" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors">
            {t("shop")}
          </Link>
          <Link href="/about" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors">
            {t("about")}
          </Link>
          <Link href="/contact" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors">
            {t("contact")}
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Language Toggle */}
          <button
            onClick={handleLanguageToggle}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-neutral-300 hover:bg-white/10 transition-colors"
          >
            <IconGlobe className="w-3.5 h-3.5 text-amber-400" />
            <span>{locale === "ar" ? "EN" : "العربية"}</span>
          </button>

          {/* Cart Toggle Button */}
          <button
            onClick={() => setOpen(true)}
            className="relative p-2 text-neutral-400 hover:text-white transition-colors"
            aria-label="Shopping Cart"
          >
            <IconShoppingBag className="h-6 w-6" />
            {mounted && totalQty > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-black ring-2 ring-black">
                {totalQty}
              </span>
            )}
          </button>

          {/* Profile / Auth Link */}
          <div className="hidden sm:block border-l border-white/10 h-6 mx-1" />

          {loggedIn ? (
            <Link href="/profile" className="hidden sm:flex items-center gap-2 p-2 text-neutral-400 hover:text-white transition-colors">
              <IconUser className="h-6 w-6" />
            </Link>
          ) : (
            <Link href="/login" className="hidden sm:block text-xs font-bold tracking-widest uppercase text-amber-500 hover:text-amber-400 transition-colors">
              {t("login")}
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMenu(!menu)}
            className="p-2 text-neutral-400 hover:text-white md:hidden transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {menu ? <IconX className="h-6 w-6" /> : <IconMenu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {menu && (
        <div className="fixed inset-0 top-20 z-40 bg-black/95 md:hidden animate-in fade-in slide-in-from-top-5">
          <nav className="flex flex-col items-center justify-center gap-8 h-full pb-20">
            <Link href="/shop" onClick={() => setMenu(false)} className="text-2xl font-medium">{t("shop")}</Link>
            <Link href="/about" onClick={() => setMenu(false)} className="text-2xl font-medium">{t("about")}</Link>
            <Link href="/contact" onClick={() => setMenu(false)} className="text-2xl font-medium">{t("contact")}</Link>
            <div className="w-12 h-px bg-white/10 my-2" />
            {loggedIn ? (
              <Link href="/profile" onClick={() => setMenu(false)} className="text-xl text-amber-500">{t("profile")}</Link>
            ) : (
              <Link href="/login" onClick={() => setMenu(false)} className="text-xl text-amber-500 uppercase tracking-widest">{t("login")}</Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
