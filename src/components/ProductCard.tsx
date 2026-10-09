import Link from "next/link";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { effectivePrice, imageUrl, money, title } from "@/lib/format";
import type { Product } from "@/lib/types";

export default async function ProductCard({ p }: { p: Product }) {
  const locale = await getLocale();
  const t = await getTranslations("product");
  const c = await getTranslations("common");
  const price = effectivePrice(p);
  const img = [...(p.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0];
  const sale = price < Number(p.price);
  return (
    <Link href={`/product/${p.slug}`} className="card group block overflow-hidden">
      <div className="relative aspect-[4/5] overflow-hidden bg-surface2">
        {img ? <Image src={imageUrl(img.path)} alt={title(p, locale)} fill sizes="(max-width:768px) 50vw, 25vw" className="object-cover transition duration-700 group-hover:scale-105" />
             : <div className="grid h-full place-items-center h-display text-5xl text-gold/30">A</div>}
        {p.stock_qty === 0 && <span className="absolute start-3 top-3 bg-ink/80 px-3 py-1 text-[10px] uppercase tracking-widest">{t("soldOut")}</span>}
        {sale && p.stock_qty > 0 && <span className="absolute start-3 top-3 bg-gold px-3 py-1 text-[10px] uppercase tracking-widest text-ink">
          −{Math.round((1 - price / Number(p.price)) * 100)}%</span>}
      </div>
      <div className="p-4">
        <h3 className="h-display text-xl transition group-hover:text-gold">{title(p, locale)}</h3>
        <p className="mt-1 text-xs uppercase tracking-widest text-cream/50">{p.concentration} · {p.volume}</p>
        <p className="mt-2 text-sm">
          <span className="text-gold">{money(price, locale)} {c("currency")}</span>
          {sale && <span className="ms-2 text-cream/40 line-through">{money(Number(p.price), locale)}</span>}
        </p>
      </div>
    </Link>
  );
}
