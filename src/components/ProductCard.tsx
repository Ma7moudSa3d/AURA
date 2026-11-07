"use client";

import React from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { getCleanImageUrl, DEFAULT_PLACEHOLDER } from "@/lib/image-utils";

export interface ProductCardProps {
  product?: any;
  p?: any;
  locale?: string;
}

const ProductCard: React.FC<ProductCardProps> = (props) => {
  const item = props.product || props.p;
  const { addItem } = useCart();

  if (!item) return null;

  const name = item.title_en || item.title_ar || item.name || "AURA Fragrance";
  const basePrice = Number(item.discount_price || item.price || 0);
  const productLink = `/product/${item.slug || item.id}`;

  const imageUrl = getCleanImageUrl(item);
  const defaultVolumes = ["5ML", "30ML", "50ML", "100ML"];

  return (
    <div className="group relative flex flex-col bg-[#0A0A0A] border border-zinc-800 rounded-lg overflow-hidden transition-all duration-300 hover:border-[#C5A059]/50 h-full">
      {/* صورة العطر */}
      <Link href={productLink} className="relative block h-80 w-full shrink-0 overflow-hidden bg-zinc-900">
        <img
          src={imageUrl}
          alt={name}
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.onerror = null; // يمنع حلقة التكرار اللانهائية
            e.currentTarget.src = DEFAULT_PLACEHOLDER;
          }}
        />

        {item.is_featured && (
          <div className="absolute top-3 left-3 bg-[#C5A059] text-black text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-widest shadow-lg">
            Featured
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
              className="text-[9px] font-medium px-2 py-0.5 bg-zinc-800 text-zinc-400 border border-zinc-700 rounded-full"
            >
              {vol}
            </span>
          ))}
        </div>

        {/* اسم العطر */}
        <Link href={productLink}>
          <h3 className="text-white font-medium text-sm mb-1 group-hover:text-[#C5A059] transition-colors line-clamp-2 min-h-[2.5rem] uppercase tracking-wider">
            {name}
          </h3>
        </Link>

        {/* السعر */}
        <p className="text-[#D4AF37] font-bold text-sm mt-auto pt-2">
          <span className="text-zinc-500 text-[10px] font-normal mr-1 uppercase tracking-tighter">
            From
          </span>
          {basePrice} EGP
        </p>

        {/* زر الإضافة للسلة */}
        <button
          type="button"
          onClick={() => {
            addItem({
              id: `${item.id}-50ml`,
              product_id: item.id,
              variant_id: null,
              name,
              price: basePrice,
              volume: item.volume || "50ML",
              image_url: imageUrl,
              quantity: 1,
            });
          }}
          className="mt-4 w-full py-2 bg-transparent border border-[#C5A059] text-[#C5A059] text-xs font-bold rounded-sm hover:bg-[#C5A059] hover:text-black transition-all duration-300 uppercase tracking-widest"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
