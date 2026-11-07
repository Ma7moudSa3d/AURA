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
  const rawProduct = props.product || props.p;
  const { addItem } = useCart();

  if (!rawProduct) return null;

  // جلب العنوان الحقيقي من أعمدة title_en / title_ar
  const title = rawProduct.title_en || rawProduct.title_ar || rawProduct.name || "AURA Fragrance";
  const basePrice = Number(rawProduct.discount_price || rawProduct.price) || 0;

  // جلب رابط الصورة من product_images أو image_url
  let rawImage = rawProduct.image_url || rawProduct.image;
  if (!rawImage && rawProduct.product_images && Array.isArray(rawProduct.product_images) && rawProduct.product_images.length > 0) {
    const firstImg = rawProduct.product_images[0];
    rawImage = typeof firstImg === "string" ? firstImg : (firstImg.image_url || firstImg.url || firstImg.path);
  }

  const getImageUrl = (imgData: any) => {
    if (!imgData) return "https://placehold.co/600x800/0a0a0a/C5A059?text=AURA+Fragrance";
    let path = Array.isArray(imgData) ? imgData[0] : imgData;
    if (typeof path === "object" && path !== null) path = path.image_url || path.url || path.path || "";
    if (typeof path !== "string" || !path.trim()) return "https://placehold.co/600x800/0a0a0a/C5A059?text=AURA+Fragrance";

    path = path.trim();
    if (path.startsWith("http://") || path.startsWith("https://")) return path;

    const cleanPath = path.startsWith("/") ? path.substring(1) : path;
    if (cleanPath.startsWith("products/")) {
      return `https://qjwisnczaffrouaadgzq.supabase.co/storage/v1/object/public/${cleanPath}`;
    }
    return `https://qjwisnczaffrouaadgzq.supabase.co/storage/v1/object/public/products/${cleanPath}`;
  };

  const imageUrl = getImageUrl(rawImage);
  const defaultVolumes = ["5ML", "30ML", "50ML", "100ML"];

  return (
    <div className="group relative flex flex-col bg-[#0A0A0A] border border-zinc-800 rounded-lg overflow-hidden transition-all duration-300 hover:border-[#C5A059]/50 h-full">
      {/* صورة العطر */}
      <Link href={`/product/${rawProduct.id}`} className="relative h-80 w-full overflow-hidden bg-zinc-900 block">
        <Image
          src={imageUrl}
          alt={title}
          fill
          unoptimized
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e: any) => {
            e.target.srcset = "";
            e.target.src = "https://placehold.co/600x800/0a0a0a/C5A059?text=AURA+Fragrance";
          }}
        />
        {rawProduct.is_featured && (
          <div className="absolute top-3 left-3 bg-[#C5A059] text-black text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-widest shadow-lg">
            Featured
          </div>
        )}
      </Link>

      {/* تفاصيل العطر */}
      <div className="p-4 flex flex-col flex-grow">
        {/* أحجام العطر مرتبة تصاعدياً */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {defaultVolumes.map((vol) => (
            <span key={vol} className="text-[9px] font-medium px-2 py-0.5 bg-zinc-800 text-zinc-400 border border-zinc-700 rounded-full">
              {vol}
            </span>
          ))}
        </div>

        <Link href={`/product/${rawProduct.id}`}>
          <h3 className="text-white font-medium text-sm mb-1 group-hover:text-[#C5A059] transition-colors line-clamp-2 min-h-[2.5rem] uppercase tracking-wider">
            {title}
          </h3>
        </Link>
        
        <p className="text-[#D4AF37] font-bold text-sm mt-auto">
          <span className="text-zinc-500 text-[10px] font-normal mr-1 uppercase tracking-tighter">From</span>
          {basePrice} EGP
        </p>

        <button
          onClick={() => {
            addItem({
              id: `${rawProduct.id}-50ml`,
              product_id: rawProduct.id,
              name: title,
              price: basePrice,
              volume: rawProduct.volume || "50ML",
              image_url: imageUrl,
              quantity: 1
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
