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
  const product = props.product || props.p;
  const { addItem } = useCart();

  if (!product) return null;

  const productLink = `/product/${product.id || product.slug}`;
  const name = product.title_en || product.title_ar || product.name || "AURA Fragrance";
  const basePrice = Number(product.discount_price || product.price || 0);

  let rawImage: any = null;
  if (Array.isArray(product.product_images) && product.product_images.length > 0) {
    const firstImg = product.product_images[0];
    rawImage = typeof firstImg === "string" ? firstImg : (firstImg?.path || firstImg?.image_url || firstImg?.url);
  }
  if (!rawImage) {
    rawImage = product.image_url || product.image || product.id;
  }

  const getImageUrl = (img: any) => {
    if (!img) return "https://placehold.co/600x800/0a0a0a/C5A059?text=AURA+Fragrance";
    const path = String(img).trim();
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    if (cleanPath.startsWith("products/")) {
      return `https://qjwisnczaffrouaadgzq.supabase.co/storage/v1/object/public/${cleanPath}`;
    }
    return `https://qjwisnczaffrouaadgzq.supabase.co/storage/v1/object/public/products/${cleanPath}`;
  };

  const imageUrl = getImageUrl(rawImage);
  const volumes = ["5ML", "30ML", "50ML", "100ML"];

  return (
    <div className="group relative flex flex-col bg-[#0A0A0A] border border-zinc-800 rounded-lg overflow-hidden transition-all duration-300 hover:border-[#C5A059]/50 h-full">
      {/* صورة العطر */}
      <Link href={productLink} className="relative block h-80 w-full shrink-0 overflow-hidden bg-zinc-900">
        <Image
          src={imageUrl}
          alt={name}
          fill
          unoptimized
          className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
          onError={(e: any) => {
            const currentSrc = e.target.src;
            if (!currentSrc.includes(".png") && !currentSrc.includes(".jpg") && !currentSrc.includes("placehold.co")) {
              e.target.src = `${imageUrl}.png`;
            } else if (currentSrc.includes(".png")) {
              e.target.src = `${imageUrl}.jpg`;
            } else {
              e.target.srcset = "";
              e.target.src = "https://placehold.co/600x800/0a0a0a/C5A059?text=AURA+Fragrance";
            }
          }}
        />
        {product.is_featured && (
          <div className="absolute top-3 left-3 bg-[#C5A059] text-black text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-widest shadow-lg">
            Featured
          </div>
        )}
      </Link>

      {/* التفاصيل */}
      <div className="p-4 flex flex-col flex-grow">
        {/* الأحجام مرتبة تصاعدياً */}
        <div className="flex flex-wrap gap-1.5 mb-3 min-h-[24px]">
          {volumes.map((vol) => (
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

        {/* زر الإضافة */}
        <button
          type="button"
          onClick={() => {
            addItem({
              id: `${product.id}-50ml`,
              product_id: product.id,
              variant_id: null,
              name,
              price: basePrice,
              volume: product.volume || "50ML",
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
