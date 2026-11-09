"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useCart, useCartStore } from "@/lib/cart";
import { bundleDiscount, type BundleType, type OfferLine } from "@/lib/offers";

export type BuilderProduct = {
  id: string;
  title_en: string;
  title_ar: string | null;
  image: string;
  stock: number;
  prices: Record<string, number>; // "50ML" -> price, "100ML" -> price
};

type Group = { key: string; volume: string; count: number; titleEn: string; titleAr: string };

export default function OfferBuilder({
  type, code, titleEn, titleAr, groups, products,
}: { type: BundleType; code: string; titleEn: string; titleAr: string; groups: Group[]; products: BuilderProduct[] }) {
  const isAr = useLocale() === "ar";
  const { addItem } = useCart();
  // qty per group per product
  const [sel, setSel] = useState<Record<string, Record<string, number>>>(() => Object.fromEntries(groups.map((g) => [g.key, {}])));
  const [done, setDone] = useState(false);

  const total = (g: Group) => Object.values(sel[g.key] ?? {}).reduce((a, b) => a + b, 0);
  const usedOf = (pid: string) => groups.reduce((a, g) => a + (sel[g.key]?.[pid] ?? 0), 0);
  const complete = groups.every((g) => total(g) === g.count);
  const name = (p: BuilderProduct) => p.title_en.replace(/^AURA\s*-\s*/i, "");

  const change = (g: Group, pid: string, delta: number) =>
    setSel((s) => {
      const cur = s[g.key]?.[pid] ?? 0;
      const next = cur + delta;
      const prod = products.find((p) => p.id === pid)!;
      if (next < 0 || (delta > 0 && (total(g) >= g.count || usedOf(pid) >= prod.stock))) return s;
      return { ...s, [g.key]: { ...s[g.key], [pid]: next } };
    });

  // price preview with the same function the server uses
  const lines: OfferLine[] = groups.flatMap((g) =>
    Object.entries(sel[g.key] ?? {}).filter(([, q]) => q > 0).map(([pid, q]) => ({
      product_id: pid, volume: g.volume, qty: q, unit: products.find((p) => p.id === pid)?.prices[g.volume] ?? 0,
    }))
  );
  const regular = lines.reduce((a, l) => a + l.unit * l.qty, 0);
  const saving = complete ? bundleDiscount(type, lines) : 0;

  const addAll = () => {
    for (const l of lines) {
      const p = products.find((x) => x.id === l.product_id)!;
      addItem({
        id: `${p.id}-${l.volume}`, product_id: p.id, variant_id: null, name: name(p), price: l.unit,
        volume: l.volume, image_url: p.image, quantity: l.qty,
      });
    }
    try { sessionStorage.setItem("aura_offer_code", code); } catch {}
    setDone(true);
    setTimeout(() => setDone(false), 2500);
    useCartStore.getState().setOpen(true);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-xs uppercase tracking-[.4em] text-gold">✦ {isAr ? "الجمعة الذهبية" : "Golden Friday"}</p>
      <h1 className="h-display mt-2 text-4xl">{isAr ? titleAr : titleEn}</h1>

      {groups.map((g) => (
        <section key={g.key} className="mt-8">
          <p className="text-xs uppercase tracking-widest text-cream/60">
            {isAr ? g.titleAr : g.titleEn} ({total(g)}/{g.count})
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {products.filter((p) => p.prices[g.volume] !== undefined).map((p) => {
              const q = sel[g.key]?.[p.id] ?? 0;
              return (
                <div key={p.id} className={`flex items-center gap-3 border p-2 ${q > 0 ? "border-gold bg-gold/10" : "border-white/10 bg-surface"}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt="" className="h-16 w-12 shrink-0 object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs uppercase tracking-wider text-cream">{name(p)}</p>
                    <p className="text-xs text-gold">{p.prices[g.volume]} {isAr ? "ج.م" : "EGP"}</p>
                  </div>
                  <div className="flex items-center border border-white/15">
                    <button type="button" onClick={() => change(g, p.id, -1)} disabled={q === 0} className="px-2.5 py-1 text-cream/70 hover:text-gold disabled:opacity-30" aria-label="-">-</button>
                    <span className="w-6 text-center font-mono text-xs">{q}</span>
                    <button type="button" onClick={() => change(g, p.id, 1)} className="px-2.5 py-1 text-cream/70 hover:text-gold" aria-label="+">+</button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <div className="mt-8 space-y-1 border border-gold/40 bg-surface p-4 text-sm">
        <div className="flex justify-between text-cream/60"><span>{isAr ? "السعر العادي" : "Regular price"}</span><span>{regular} {isAr ? "ج.م" : "EGP"}</span></div>
        <div className="flex justify-between text-gold"><span>✦ {isAr ? "خصم العرض" : "Offer saving"}</span><span>-{saving} {isAr ? "ج.م" : "EGP"}</span></div>
        <div className="flex justify-between border-t border-white/10 pt-2 text-lg font-bold text-cream"><span>{isAr ? "بعد العرض" : "Your price"}</span><span className="text-gold">{regular - saving} {isAr ? "ج.م" : "EGP"}</span></div>
      </div>

      <button type="button" onClick={addAll} disabled={!complete} className="btn-gold mt-5 w-full disabled:cursor-not-allowed disabled:opacity-40">
        {done ? (isAr ? "تمت الإضافة ✓" : "ADDED ✓") : isAr ? "أضف العرض للسلة" : "ADD OFFER TO CART"}
      </button>
      <p className="mt-3 text-xs text-cream/50">
        {isAr
          ? `الخصم بيتطبق بكود ${code} (بيتطبق تلقائياً في صفحة الدفع). لو شلت أي زجاجة من السلة بيتحاسب كل شيء بالسعر العادي.`
          : `The discount uses code ${code} (applied automatically at checkout). If you remove any bottle from the cart, everything is charged at the regular price.`}
      </p>
    </div>
  );
}
