"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { CodeChip } from "@/components/Campaign";

/** Uploaded artwork if there is one; otherwise a typographic tile in the brand colours (no empty gap, no 404). */
function OfferArt({ src, big, small }: { src?: string | null; big: string; small: string }) {
  const [ok, setOk] = useState(true);
  if (src && ok) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" onError={() => setOk(false)} className="mb-5 aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />;
  }
  return (
    <div className="mb-5 flex aspect-square w-full flex-col items-center justify-center border border-gold/30 transition-colors duration-500 group-hover:border-gold bg-[radial-gradient(circle_at_50%_40%,rgba(214,178,94,.18),transparent_70%)] text-center">
      <span className="h-display bg-gold bg-clip-text text-5xl text-transparent">{big}</span>
      <span className="mt-3 text-xs uppercase tracking-[.35em] text-cream/70">{small}</span>
    </div>
  );
}

export function OfferCard({
  art, tileBig, tileSmall, titleEn, titleAr, bodyEn, bodyAr, code, href,
}: { href: string; art?: string | null; tileBig: string; tileSmall: string; titleEn: string; titleAr: string; bodyEn: string; bodyAr: string; code: string }) {
  const isAr = useLocale() === "ar";
  return (
    <div className="group relative flex cursor-pointer flex-col border border-gold/40 bg-surface p-5 text-center transition hover:border-gold">
      <Link href={href} aria-label={isAr ? titleAr : titleEn} className="absolute inset-0 z-0" />
      <OfferArt src={art} big={tileBig} small={tileSmall} />
      <p className="text-[10px] uppercase tracking-[.35em] text-gold">✦ {isAr ? "الجمعة الذهبية" : "Golden Friday"}</p>
      <h3 className="h-display mt-2 text-2xl text-cream">{isAr ? titleAr : titleEn}</h3>
      <p className="mt-2 flex-1 text-sm text-cream/70">{isAr ? bodyAr : bodyEn}</p>
      <div className="relative z-10 mt-4 flex flex-col items-center gap-2">
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
        {isAr ? "7 زجاجات 5ML، كل زجاجة رائحة مختلفة من تشكيلتنا." : "Seven 5ML bottles, one of each scent in our collection."}
      </p>
      <p className="mt-4 text-gold">
        <span className="text-2xl font-bold">{price} {isAr ? "ج.م" : "EGP"}</span>
        {worth > price && <span className="ms-2 text-sm text-cream/40 line-through">{worth}</span>}
      </p>
      <span className="btn-gold mt-3 w-full text-center">{isAr ? "اختر الباكيدج" : "Build your pack"}</span>
    </Link>
  );
}
