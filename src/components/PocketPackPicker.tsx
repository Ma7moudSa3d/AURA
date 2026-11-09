"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useCart, useCartStore } from "@/lib/cart";
import { POCKET_PACK_PRICE, POCKET_PACK_SIZE, POCKET_PACK_VOLUME } from "@/lib/offers";

type Opt = { id: string; title_en: string; title_ar: string | null; price: number; image: string; inStock: boolean };

export default function PocketPackPicker({ options, image = "/offers/pocket-pack.jpg" }: { options: Opt[]; image?: string }) {
  const isAr = useLocale() === "ar";
  const { addItem } = useCart();
  const available = options.filter((o) => o.inStock);
  // With exactly seven scents on offer the pack is simply "one of each".
  const [picked, setPicked] = useState<string[]>(available.length === POCKET_PACK_SIZE ? available.map((o) => o.id) : []);
  const [done, setDone] = useState(false);

  const chosen = options.filter((o) => picked.includes(o.id));
  const worth = chosen.reduce((s, o) => s + o.price, 0);
  const ready = picked.length === POCKET_PACK_SIZE;
  const name = (o: Opt) => o.title_en;

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= POCKET_PACK_SIZE ? p : [...p, id]));

  const addPack = () => {
    for (const o of chosen) {
      addItem({
        id: `${o.id}-${POCKET_PACK_VOLUME}`,
        product_id: o.id,
        variant_id: null,
        name: name(o),
        price: o.price,
        volume: POCKET_PACK_VOLUME,
        image_url: o.image,
        quantity: 1,
      });
    }
    setDone(true);
    setTimeout(() => setDone(false), 2500);
    useCartStore.getState().setOpen(true);
  };

  if (available.length < POCKET_PACK_SIZE) {
    return <p className="py-20 text-center text-cream/60">{isAr ? "الباكيدج غير متاح حالياً." : "The Pocket Pack is not available right now."}</p>;
  }

  return (
    <div className="grid gap-10 md:grid-cols-2">
      <div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="Pocket Pack" className="w-full border border-gold/30 object-cover" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-[.4em] text-gold">✦ {isAr ? "الجمعة الذهبية" : "Golden Friday"}</p>
        <h1 className="h-display mt-2 text-4xl">{isAr ? "باكيدج الجيب" : "The Pocket Pack"}</h1>
        <p className="mt-3 text-cream/70">
          {isAr
            ? `${POCKET_PACK_SIZE} زجاجات ${POCKET_PACK_VOLUME}، كل زجاجة رائحة مختلفة. بدون تكرار.`
            : `${POCKET_PACK_SIZE} bottles of ${POCKET_PACK_VOLUME.replace("ML", "")}ML, each a different scent. No repeats.`}
        </p>
        <p className="mt-4 text-3xl font-bold text-gold">
          {POCKET_PACK_PRICE} {isAr ? "ج.م" : "EGP"}
          {ready && worth > POCKET_PACK_PRICE && (
            <span className="ms-3 text-base font-normal text-cream/40 line-through">{worth}</span>
          )}
        </p>

        <p className="mt-6 text-xs uppercase tracking-widest text-cream/60">
          {isAr ? `اختر ${POCKET_PACK_SIZE} روائح` : `Choose ${POCKET_PACK_SIZE} scents`} ({picked.length}/{POCKET_PACK_SIZE})
        </p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {available.map((o) => {
            const on = picked.includes(o.id);
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => toggle(o.id)}
                aria-pressed={on}
                className={`flex items-center gap-3 border p-2 text-start transition ${on ? "border-gold bg-gold/10" : "border-white/10 bg-surface hover:border-gold/50"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={o.image} alt="" className="h-14 w-12 shrink-0 object-cover" />
                <span className="flex-1 text-xs uppercase tracking-wider text-cream">{name(o).replace(/^AURA\s*-\s*/i, "")}</span>
                <span className={`text-sm ${on ? "text-gold" : "text-cream/30"}`}>{on ? "✓" : "+"}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={addPack}
          disabled={!ready}
          className="btn-gold mt-6 w-full disabled:cursor-not-allowed disabled:opacity-40"
        >
          {done ? (isAr ? "تمت الإضافة ✓" : "ADDED ✓") : isAr ? `أضف الباكيدج للسلة (${POCKET_PACK_PRICE} ج.م)` : `ADD PACK TO CART (${POCKET_PACK_PRICE} EGP)`}
        </button>
        <p className="mt-3 text-xs text-cream/50">
          {isAr ? "يُحتسب سعر الباكيدج تلقائياً في السلة وصفحة الدفع." : "The pack price is applied automatically in your cart and at checkout."}
        </p>
      </div>
    </div>
  );
}
