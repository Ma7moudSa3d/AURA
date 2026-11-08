"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { CodeChip } from "@/components/Campaign";

/** Optional artwork: drop a file with this path into /public/offers and it shows up automatically. */
function OfferArt({ src }: { src: string }) {
  const [ok, setOk] = useState(true);
  if (!ok) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" onError={() => setOk(false)} className="mb-5 aspect-square w-full object-cover" />;
}

export function OfferCard({
  art, titleEn, titleAr, bodyEn, bodyAr, code, href,
}: { href: string; art: string; titleEn: string; titleAr: string; bodyEn: string; bodyAr: string; code: string }) {
  const isAr = useLocale() === "ar";
  return (
    <div className="flex flex-col border border-gold/40 bg-surface p-5 text-center">
      <OfferArt src={art} />
      <p className="text-[10px] uppercase tracking-[.35em] text-gold">✦ {isAr ? "الجمعة الذهبية" : "Golden Friday"}</p>
      <h3 className="h-display mt-2 text-2xl text-cream">{isAr ? titleAr : titleEn}</h3>
      <p className="mt-2 flex-1 text-sm text-cream/70">{isAr ? bodyAr : bodyEn}</p>
      <div className="mt-4 flex flex-col items-center gap-2">
        <span className="text-[11px] uppercase tracking-widest text-cream/50">{isAr ? "الكود عند الدفع" : "Code at checkout"}</span>
        <CodeChip code={code} />
        <Link href={href} className="btn-gold mt-3 w-full text-center">{isAr ? "اختر زجاجاتك" : "Build your offer"}</Link>
      </div>
    </div>
  );
}

export function PocketPackCard({ price, worth, image }: { price: number; worth: number; image: string }) {
  const isAr = useLocale() === "ar";
  return (
    <Link href="/pocket-pack" className="group flex flex-col border border-gold/40 bg-surface p-5 text-center transition hover:border-gold">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="Pocket Pack" className="mb-5 aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
      <p className="text-[10px] uppercase tracking-[.35em] text-gold">✦ {isAr ? "الجمعة الذهبية" : "Golden Friday"}</p>
      <h3 className="h-display mt-2 text-2xl text-cream">{isAr ? "باكيدج الجيب" : "The Pocket Pack"}</h3>
      <p className="mt-2 flex-1 text-sm text-cream/70">
        {isAr ? "7 زجاجات 5 مل، كل زجاجة رائحة مختلفة من تشكيلتنا." : "Seven 5ML bottles, one of each scent in our collection."}
      </p>
      <p className="mt-4 text-gold">
        <span className="text-2xl font-bold">{price} {isAr ? "ج.م" : "EGP"}</span>
        {worth > price && <span className="ms-2 text-sm text-cream/40 line-through">{worth}</span>}
      </p>
      <span className="btn-gold mt-3 w-full text-center">{isAr ? "اختر الباكيدج" : "Build your pack"}</span>
    </Link>
  );
}
