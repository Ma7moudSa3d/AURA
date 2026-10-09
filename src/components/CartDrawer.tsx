"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { useCart, cartSubtotal } from "@/lib/cart-store";
import { money } from "@/lib/format";

export default function CartDrawer({ loggedIn }: { loggedIn: boolean }) {
  const t = useTranslations("cart");
  const c = useTranslations("common");
  const locale = useLocale();
  const { lines, open, setOpen, remove, setQty } = useCart();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  const rtl = locale === "ar";
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-50 bg-black/70" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
          <motion.aside role="dialog" aria-label={t("title")} className="fixed inset-y-0 end-0 z-50 flex w-full max-w-md flex-col border-s border-gold2/30 bg-surface"
            initial={{ x: rtl ? "-100%" : "100%" }} animate={{ x: 0 }} exit={{ x: rtl ? "-100%" : "100%" }} transition={{ type: "spring", damping: 32, stiffness: 300 }}>
            <div className="flex items-center justify-between border-b border-white/5 p-5">
              <h2 className="h-display text-2xl">{t("title")}</h2>
              <button onClick={() => setOpen(false)} aria-label="Close" className="text-xl hover:text-gold">✕</button>
            </div>
            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              {lines.length === 0 && <p className="text-cream/60">{t("empty")}</p>}
              {lines.map((l) => (
                <div key={l.product_id} className="flex gap-4">
                  <div className="relative h-24 w-20 shrink-0 bg-surface2">{l.image && <Image src={l.image} alt="" fill sizes="80px" className="object-cover" />}</div>
                  <div className="flex-1">
                    <Link href={`/product/${l.slug}`} onClick={() => setOpen(false)} className="h-display text-lg hover:text-gold">{l.title}</Link>
                    <p className="text-sm text-gold">{money(l.price, locale)} {c("currency")}</p>
                    <div className="mt-2 flex items-center gap-3 text-sm">
                      <button className="h-7 w-7 border border-white/15 hover:border-gold" onClick={() => setQty(l.product_id, l.qty - 1)}>−</button>
                      <span>{l.qty}</span>
                      <button className="h-7 w-7 border border-white/15 hover:border-gold" onClick={() => setQty(l.product_id, l.qty + 1)}>+</button>
                      <button className="ms-auto text-xs text-cream/50 hover:text-gold" onClick={() => remove(l.product_id)}>{t("remove")}</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {lines.length > 0 && (
              <div className="space-y-3 border-t border-white/5 p-5">
                <div className="flex justify-between"><span>{t("subtotal")}</span><span className="text-gold">{money(cartSubtotal(lines), locale)} {c("currency")}</span></div>
                <p className="text-xs text-cream/50">{t("note")}</p>
                <Link href={loggedIn ? "/checkout" : "/login?next=/checkout"} onClick={() => setOpen(false)} className="btn-gold w-full">{t("checkout")}</Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
