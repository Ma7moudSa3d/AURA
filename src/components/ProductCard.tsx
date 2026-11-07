"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart";

export interface ProductCardProps {
  product?: any;
  p?: any;
  locale?: string;
}

const ProductCard: React.FC<ProductCardProps> = (props) => {
  const item = props.product || props.p;
  const { addItem } = useCart();

  if (!item) return null;

  // 1. اسم العطر من قاعدة البيانات
  const name = item.title_en || item.title_ar || item.name || "AURA Fragrance";

  // 2. السعر
  const price = Number(item.discount_price || item.price || 0);

  // 3. رابط العطر (سواء كان slug أو id)
  const productLink = `/product/${item.slug || item.id}`;

  // 4. معالجة رابط الصورة بشكل مباشر ودقيق من Supabase
  const getImageUrl = (prod: any) => {
    let path = "";

    // التأكد من جدول product_images أولاً
    if (Array.isArray(prod.product_images) && prod.product_images.length > 0) {
      const firstImg = prod.product_images[0];
      path = typeof firstImg === "string" ? firstImg : (firstImg.path || firstImg.image_url || firstImg.url || "");
    }

    // إذا لم توجد صورة في الجدول الفرعي نستخدم الصورة الرئيسية أو الـ ID
    if (!path) {
      path = prod.image_url || prod.image || prod.id || "";
    }

    if (!path) return "https://placehold.co/600x800/0a0a0a/C5A059?text=AURA+Fragrance";

    const pathStr = String(path).trim();

    // إذا كان رابطاً كاملاً يبدأ بـ http
    if (pathStr.startsWith("http://") || pathStr.startsWith("https://")) {
      return pathStr;
    }

    const cleanPath = pathStr.startsWith("/") ? pathStr.slice(1) : pathStr;

    if (cleanPath.startsWith("products/")) {
      return `https://qjwisnczaffrouaadgzq.supabase.co/storage/v1/object/public/${cleanPath}`;
    }

    return `https://qjwisnczaffrouaadgzq.supabase.co/storage/v1/object/public/products/${cleanPath}`;
  };

  const imageUrl = getImageUrl(item);
  const defaultVolumes = ["5ML", "30ML", "50ML", "100ML"];

  return (
    <div className="group relative flex flex-col bg-[#0A0A0A] border border-zinc-800 rounded-lg overflow-hidden transition-all duration-300 hover:border-[#C5A059]/50 h-full">
      {/* صورة العطر */}
      <Link href={productLink} className="relative block h-80 w-full shrink-0 overflow-hidden bg-zinc-900">
        <Image
          src={imageUrl}
          alt={name}
          fill
          unoptimized
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
          onError={(e: any) => {
            e.target.srcset = "";
            e.target.src = "https://placehold.co/600x800/0a0a0a/C5A059?text=AURA+Fragrance";
          }}
        />

        {item.is_featured && (
          <div className="absolute top-3 left-3 bg-[#C5A059] text-black text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-widest shadow-lg">
            Featured
          </div>
        )}
      </Link>

      {/* تفاصيل العطر بأبعاد وتنسيق ثابت */}
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

        {/* الاسم */}
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
          {price} EGP
        </p>

        {/* زر الإضافة */}
        <button
          type="button"
          onClick={() => {
            addItem({
              id: `${item.id}-50ml`,
              product_id: item.id,
              variant_id: null,
              name,
              price,
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
