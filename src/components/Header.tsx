"use client";

import { useState, useEffect } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { useCart, CartStoreState } from "@/lib/cart-store"; // استيراد النوع هنا
import { ShoppingBag, Menu, X, User, LogOut, Globe } from "lucide-react";

export default function Header({ loggedIn, whatsapp }: { loggedIn: boolean; whatsapp: string }) {
  const t = useTranslations("nav");
  const locale = useLocale();
  
  // تحديث الـ Selectors بإضافة النوع للبارامتر s
  const lines = useCart((s: CartStoreState) => s.lines || s.items || []);
  const setOpen = useCart((s: CartStoreState) => s.setOpen);
  
  const [mounted, setMounted] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalQty = lines.reduce((acc: number, item: any) => acc + (item.quantity ?? item.qty ?? 0), 0);

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
          <Link
            href="/"
            locale={locale === "ar" ? "en" : "ar"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-neutral-300 hover:bg-white/10 transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{locale === "ar" ? "EN" : "العربية"}</span>
          </Link>

          {/* Cart */}
          <button
            onClick={() => setOpen(true)}
            className="relative p-2 text-neutral-400 hover:text-white transition-colors"
          >
            <ShoppingBag className="h-6 w-6 stroke-[1.5]" />
            {mounted && totalQty > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-black ring-2 ring-black">
                {totalQty}
              </span>
            )}
          </button>

          {/* Profile/Auth */}
          <div className="hidden sm:block border-l border-white/10 h-6 mx-1" />
          
          {loggedIn ? (
            <Link href="/profile" className="hidden sm:flex items-center gap-2 p-2 text-neutral-400 hover:text-white transition-colors">
              <User className="h-6 w-6 stroke-[1.5]" />
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
          >
            {menu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
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
