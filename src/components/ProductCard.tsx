"use client";

import React from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { useCart, useCartStore } from "@/lib/cart";
import { resolveVariants, pickVariant, minPrice, DEFAULT_VOLUME } from "@/lib/variants";
import { getCleanImageUrl, DEFAULT_PLACEHOLDER } from "@/lib/image-utils";

export interface ProductCardProps {
  product?: any;
  p?: any;
  locale?: string;
}

const ProductCard: React.FC<ProductCardProps> = (props) => {
  const item = props.product || props.p;
  const { addItem } = useCart();
  const isAr = useLocale() === "ar";
  const [added, setAdded] = React.useState(false);

  if (!item) return null;

  const name = (isAr ? item.title_ar || item.title_en : item.title_en || item.title_ar) || item.name || "AURA Fragrance";
  const basePrice = minPrice(item);
  const defaultVariant = pickVariant(item, DEFAULT_VOLUME);
  const productLink = `/product/${item.slug || item.id}`;

  const imageUrl = getCleanImageUrl(item);
  const defaultVolumes = resolveVariants(item).map((v) => v.volume);

  return (
    <div className="group relative flex flex-col bg-ink border border-white/10 rounded-lg overflow-hidden transition-all duration-300 hover:border-gold/50 h-full">
      {/* صورة العطر */}
      <Link href={productLink} className="relative block aspect-[3/4] w-full shrink-0 overflow-hidden bg-surface md:aspect-auto md:h-80">
        <img
          src={imageUrl}
          alt={name}
          className="h-full w-full object-contain object-center transition-transform duration-500 group-hover:scale-105 md:object-cover"
          onError={(e) => {
            e.currentTarget.onerror = null; // يمنع حلقة التكرار اللانهائية
            e.currentTarget.src = DEFAULT_PLACEHOLDER;
          }}
        />

        {item.is_featured && (
          <div className="absolute top-3 left-3 bg-gold text-ink text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-widest shadow-lg">
            {isAr ? "مميز" : "Featured"}
          </div>
        )}
      </Link>

      {/* تفاصيل العطر بنفس الأبعاد والارتفاع المتساوي */}
      <div className="p-4 flex flex-col flex-grow">
        {/* الأحجام مرتبة تصاعدياً */}
        <div className="flex flex-wrap gap-1.5 mb-3 min-h-[24px]">
          {defaultVolumes.map((vol) => (
            <span
              key={vol}
              className="text-[9px] font-medium px-2 py-0.5 bg-surface2 text-cream/60 border border-white/15 rounded-full"
            >
              {vol}
            </span>
          ))}
        </div>

        {/* اسم العطر */}
        <Link href={productLink}>
          <h3 className="text-cream font-medium text-sm mb-1 group-hover:text-gold transition-colors line-clamp-2 min-h-[2.5rem] uppercase tracking-wider">
            {name}
          </h3>
        </Link>

        {/* السعر */}
        <p className="text-gold font-bold text-sm mt-auto pt-2">
          <span className="text-cream/50 text-[10px] font-normal me-1 uppercase tracking-tighter">
            {isAr ? "من" : "From"}
          </span>
          {basePrice} {isAr ? "ج.م" : "EGP"}
        </p>

        {/* زر الإضافة للسلة */}
        <button
          type="button"
          onClick={() => {
            addItem({
              id: `${item.id}-${defaultVariant.volume}`,
              product_id: item.id,
              variant_id: null,
              name,
              price: defaultVariant.price,
              volume: defaultVariant.volume,
              image_url: imageUrl,
              quantity: 1,
            });
            setAdded(true);
            setTimeout(() => setAdded(false), 1800);
            useCartStore.getState().setOpen(true);
          }}
          className={`mt-4 w-full py-2 border border-gold text-xs font-bold rounded-sm transition-all duration-300 uppercase tracking-widest ${
            added ? "bg-gold text-ink" : "bg-transparent text-gold hover:bg-gold hover:text-ink"
          }`}
        >
          {added ? (isAr ? "✓ تمت الإضافة" : "✓ Added") : isAr ? "أضف للسلة" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
