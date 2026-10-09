"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useCart, cartSubtotal } from "@/lib/cart-store";
import { money } from "@/lib/format";

export default function CartPage() {
  const t = useTranslations("cart");
  const c = useTranslations("common");
  const locale = useLocale();
  const { lines, setQty, remove } = useCart();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="container-x py-20" />;
  return (
    <div className="container-x max-w-3xl py-12">
      <h1 className="h-display mb-8 text-5xl">{t("title")}</h1>
      {lines.length === 0 ? (
        <div><p className="text-cream/60">{t("empty")}</p><Link href="/shop" className="btn-ghost mt-6">{t("continue")}</Link></div>
      ) : (
        <>
          <div className="divide-y divide-white/5 border border-white/5 bg-surface">
            {lines.map((l) => (
              <div key={l.product_id} className="flex gap-4 p-4">
                <div className="relative h-28 w-24 shrink-0 bg-surface2">{l.image && <Image src={l.image} alt="" fill sizes="96px" className="object-cover" />}</div>
                <div className="flex-1">
                  <Link href={`/product/${l.slug}`} className="h-display text-xl hover:text-gold">{l.title}</Link>
                  <p className="text-gold">{money(l.price, locale)} {c("currency")}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <button className="h-8 w-8 border border-white/15 hover:border-gold" onClick={() => setQty(l.product_id, l.qty - 1)}>−</button>
                    <span>{l.qty}</span>
                    <button className="h-8 w-8 border border-white/15 hover:border-gold" onClick={() => setQty(l.product_id, l.qty + 1)}>+</button>
                    <button className="ms-auto text-xs text-cream/50 hover:text-gold" onClick={() => remove(l.product_id)}>{t("remove")}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between text-lg"><span>{t("subtotal")}</span><span className="text-gold">{money(cartSubtotal(lines), locale)} {c("currency")}</span></div>
          <p className="mt-1 text-xs text-cream/50">{t("note")}</p>
          <Link href="/checkout" className="btn-gold mt-6 w-full">{t("checkout")}</Link>
        </>
      )}
    </div>
  );
}
